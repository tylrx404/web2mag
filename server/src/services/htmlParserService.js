import * as cheerio from 'cheerio';
import { cleanDecodedText } from '../utils/urlHelper.js';

/**
 * Noise selectors to remove from article HTML.
 */
const UNWANTED_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'button',
  'form',
  'input',
  'nav',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '.sharedaddy',
  '.yoast-reading-time__wrapper',
  '.wp-block-yoast-seo-estimated-reading-time',
  '.jp-relatedposts',
  '.social-share',
  '.social-icons',
  '.share-buttons',
  '.post-share',
  '[class*="share-"]',
  '[class*="social-"]',
  '[class*="newsletter"]',
  '[id*="newsletter"]',
  '[class*="advertisement"]',
  '[class*="ad-container"]',
  '[id*="ad-"]',
  '[class*="cookie"]',
  '[class*="popup"]',
  '.comments',
  '#comments',
  '.post-navigation',
  '.pagination',
  '.breadcrumbs',
  '.breadcrumb',
  '.table-of-contents',
  '.toc',
  '#toc',
  '.ez-toc-container',
  '.rank-math-toc',
  '.wp-block-table-of-contents',
];

/**
 * Resolves a potentially relative image or link URL against a base URL.
 * @param {string} rawUrl
 * @param {string} baseUrl
 * @returns {string}
 */
function resolveUrl(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return '';
  try {
    if (baseUrl) {
      return new URL(trimmed, baseUrl).href;
    }
    return new URL(trimmed).href;
  } catch {
    return trimmed.startsWith('http') ? trimmed : '';
  }
}

/**
 * Cleans an HTML element of unwanted attributes while preserving essential ones.
 * @param {import('cheerio').Cheerio} $el
 * @param {string} baseUrl
 */
function sanitizeElement($el, baseUrl) {
  const tagName = $el.prop('tagName')?.toLowerCase();

  // Strip all inline styles and event handlers
  $el.removeAttr('style');
  $el.removeAttr('onclick');
  $el.removeAttr('onload');
  $el.removeAttr('onerror');
  $el.removeAttr('id');

  if (tagName === 'a') {
    const href = $el.attr('href');
    if (href) {
      $el.attr('href', resolveUrl(href, baseUrl));
      $el.attr('target', '_blank');
      $el.attr('rel', 'noopener noreferrer');
    }
    // Remove class names from links
    $el.removeAttr('class');
  } else if (tagName === 'img') {
    let src = $el.attr('src');
    // Handle lazy loaded images (data-src, data-lazy-src, data-original)
    if (!src || src.startsWith('data:')) {
      src =
        $el.attr('data-src') ||
        $el.attr('data-lazy-src') ||
        $el.attr('data-original') ||
        '';
    }
    $el.attr('src', resolveUrl(src, baseUrl));
    $el.removeAttr('loading');
    $el.removeAttr('srcset');
    $el.removeAttr('sizes');
    $el.removeAttr('width');
    $el.removeAttr('height');
    $el.removeAttr('class');
  } else {
    $el.removeAttr('class');
  }
}

/**
 * Cleans raw article HTML and extracts structured semantic sections.
 *
 * @param {string} rawHtml
 * @param {string} [baseUrl]
 * @returns {{
 *   cleanHtml: string,
 *   sections: Array<{
 *     type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote',
 *     level?: number,
 *     content?: string,
 *     html?: string,
 *     src?: string,
 *     alt?: string,
 *     caption?: string,
 *     ordered?: boolean,
 *     items?: string[]
 *   }>,
 *   summary: string,
 *   firstImageUrl: string
 * }}
 */
export function cleanHtmlAndExtractSections(rawHtml, baseUrl = '') {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return {
      cleanHtml: '',
      sections: [],
      summary: '',
      firstImageUrl: '',
    };
  }

  const $ = cheerio.load(rawHtml, { xml: false });

  // 1. Remove unwanted clutter and scripts
  UNWANTED_SELECTORS.forEach((selector) => {
    $(selector).remove();
  });

  const sections = [];
  let firstImageUrl = '';
  let summary = '';

  // 2. Walk through block-level content elements in document order
  // Target blocks: p, h1, h2, h3, h4, h5, h6, figure, img, ul, ol, blockquote
  const contentRoot = $('body').length ? $('body') : $.root();

  contentRoot.find('p, h1, h2, h3, h4, h5, h6, figure, img, ul, ol, blockquote').each((_, elem) => {
    const $elem = $(elem);

    // Skip elements that are nested inside another container we already process (e.g., p inside blockquote, img inside figure, li inside ul)
    if ($elem.parents('blockquote, figure, ul, ol').length > 0) {
      return;
    }

    const tagName = elem.tagName.toLowerCase();

    // Headings
    if (/^h[1-6]$/.test(tagName)) {
      const level = Math.min(Math.max(parseInt(tagName[1], 10), 2), 4);
      const text = cleanDecodedText($elem.text());
      if (text && text.length > 2) {
        sections.push({
          type: 'heading',
          level,
          content: text,
        });
      }
      return;
    }

    // Paragraphs
    if (tagName === 'p') {
      // Check if paragraph is just an image wrapper
      const $img = $elem.find('img');
      if ($img.length === 1 && $elem.text().trim() === '') {
        const src = resolveUrl($img.attr('src') || $img.attr('data-src'), baseUrl);
        const alt = cleanDecodedText($img.attr('alt') || '');
        if (src) {
          if (!firstImageUrl) firstImageUrl = src;
          sections.push({
            type: 'image',
            src,
            alt,
            caption: '',
          });
        }
        return;
      }

      // Sanitize inline links and formatting
      $elem.find('*').each((__, child) => {
        sanitizeElement($(child), baseUrl);
      });

      const text = cleanDecodedText($elem.text());
      const lower = text.toLowerCase();
      if (
        lower === 'table of contents' ||
        lower.startsWith('table of contents') ||
        lower.startsWith('reading time:')
      ) {
        return;
      }

      if (text && text.length > 15) {
        // Capture first substantial paragraph for default summary if needed
        if (!summary && text.length > 30) {
          summary = text.length > 280 ? `${text.slice(0, 277)}...` : text;
        }

        const inlineHtml = $elem.html()?.trim() || text;
        sections.push({
          type: 'paragraph',
          content: text,
          html: inlineHtml,
        });
      }
      return;
    }

    // Figures / Images with captions
    if (tagName === 'figure') {
      const $img = $elem.find('img').first();
      const $caption = $elem.find('figcaption').first();
      const rawSrc = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
      const src = resolveUrl(rawSrc, baseUrl);
      const alt = cleanDecodedText($img.attr('alt') || '');
      const caption = cleanDecodedText($caption.text() || '');

      if (src) {
        if (!firstImageUrl) firstImageUrl = src;
        sections.push({
          type: 'image',
          src,
          alt: alt || caption || 'Article figure',
          caption,
        });
      }
      return;
    }

    // Standalone img
    if (tagName === 'img') {
      const rawSrc = $elem.attr('src') || $elem.attr('data-src');
      const src = resolveUrl(rawSrc, baseUrl);
      const alt = cleanDecodedText($elem.attr('alt') || '');

      if (src) {
        if (!firstImageUrl) firstImageUrl = src;
        sections.push({
          type: 'image',
          src,
          alt: alt || 'Article image',
          caption: '',
        });
      }
      return;
    }

    // Blockquotes
    if (tagName === 'blockquote') {
      const text = cleanDecodedText($elem.text());
      const cite = cleanDecodedText($elem.find('cite').text());
      if (text) {
        sections.push({
          type: 'quote',
          content: text,
          citation: cite,
        });
      }
      return;
    }

    // Lists (ul, ol)
    if (tagName === 'ul' || tagName === 'ol') {
      const items = [];
      $elem.find('li').each((__, li) => {
        const itemText = cleanDecodedText($(li).text());
        if (itemText) items.push(itemText);
      });

      if (items.length > 0) {
        sections.push({
          type: 'list',
          ordered: tagName === 'ol',
          items,
        });
      }
    }
  });

  // 3. Assemble clean normalized HTML from extracted sections
  const cleanHtmlParts = sections.map((sec) => {
    switch (sec.type) {
      case 'heading':
        return `<h${sec.level}>${heEscape(sec.content)}</h${sec.level}>`;
      case 'paragraph':
        return `<p>${sec.html || heEscape(sec.content)}</p>`;
      case 'image':
        return sec.caption
          ? `<figure><img src="${heEscape(sec.src)}" alt="${heEscape(sec.alt)}" /><figcaption>${heEscape(sec.caption)}</figcaption></figure>`
          : `<figure><img src="${heEscape(sec.src)}" alt="${heEscape(sec.alt)}" /></figure>`;
      case 'quote':
        return `<blockquote><p>${heEscape(sec.content)}</p>${sec.citation ? `<cite>${heEscape(sec.citation)}</cite>` : ''}</blockquote>`;
      case 'list': {
        const tag = sec.ordered ? 'ol' : 'ul';
        const lis = sec.items.map((it) => `<li>${heEscape(it)}</li>`).join('');
        return `<${tag}>${lis}</${tag}>`;
      }
      default:
        return '';
    }
  });

  return {
    cleanHtml: cleanHtmlParts.join('\n'),
    sections,
    summary,
    firstImageUrl,
  };
}

/**
 * Simple HTML attribute escape helper.
 */
function heEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extracts article content and metadata from an arbitrary webpage HTML string.
 * Used as a fallback when WordPress REST API is not exposed.
 *
 * @param {string} html
 * @param {string} pageUrl
 * @returns {{
 *   title: string,
 *   author: string,
 *   date: string,
 *   category: string,
 *   summary: string,
 *   thumbnail: string,
 *   cleanHtml: string,
 *   sections: Array<any>
 * }}
 */
export function extractArticleFromWebpage(html, pageUrl) {
  const $ = cheerio.load(html);
  const parsedUrl = new URL(pageUrl);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // Metadata Extraction
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  const tagTitle = $('title').text();
  const h1Title = $('h1').first().text();
  const title = cleanDecodedText(ogTitle || twitterTitle || h1Title || tagTitle);

  const metaAuthor =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('meta[name="twitter:creator"]').attr('content') ||
    $('[rel="author"]').first().text() ||
    $('.author-name, .byline, .author').first().text();
  const author = cleanDecodedText(metaAuthor) || 'Editorial Staff';

  const metaDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="publish-date"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    $('time').first().text();
  const date = metaDate ? new Date(metaDate).toISOString() : new Date().toISOString();

  const ogImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content');
  const thumbnail = resolveUrl(ogImage, baseUrl);

  const ogSection =
    $('meta[property="article:section"]').attr('content') ||
    $('.category, .post-category, .entry-category').first().text();
  const category = cleanDecodedText(ogSection) || 'Feature';

  const ogDesc =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content');
  const metaSummary = cleanDecodedText(ogDesc);

  // Locate the article body container
  const CANDIDATE_CONTAINERS = [
    'article',
    'main article',
    '[itemprop="articleBody"]',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.article-body',
    '.story-body',
    '.content-area',
    'main',
    '#content',
  ];

  let rawContentHtml = '';
  for (const selector of CANDIDATE_CONTAINERS) {
    const $matched = $(selector);
    if ($matched.length > 0 && $matched.text().trim().length > 100) {
      rawContentHtml = $matched.first().html() || '';
      break;
    }
  }

  // Fallback to body if no container matched
  if (!rawContentHtml) {
    rawContentHtml = $('body').html() || html;
  }

  const parsedContent = cleanHtmlAndExtractSections(rawContentHtml, baseUrl);

  return {
    title,
    author,
    date,
    category,
    summary: metaSummary || parsedContent.summary,
    thumbnail: thumbnail || parsedContent.firstImageUrl,
    cleanHtml: parsedContent.cleanHtml,
    sections: parsedContent.sections,
  };
}
