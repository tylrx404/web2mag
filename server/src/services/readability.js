import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

/**
 * Extracts metadata from HTML headers (OpenGraph, Twitter, schema.org JSON-LD, standard meta tags).
 *
 * @param {string} html
 * @param {string} baseUrl
 * @returns {object}
 */
export function extractMetadata(html, baseUrl) {
  const $ = cheerio.load(html);

  // 1. Title
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').first().text() ||
    $('h1').first().text() ||
    null;

  // 2. Author
  let author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('[rel="author"]').first().text() ||
    $('.author-name, .author, .byline').first().text() ||
    null;

  // 3. Excerpt / Description
  const excerpt =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    null;

  // 4. Featured Image
  let featuredImageUrl =
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    null;

  if (featuredImageUrl) {
    try {
      featuredImageUrl = new URL(featuredImageUrl, baseUrl).href;
    } catch {
      featuredImageUrl = null;
    }
  }

  // 5. Publish Date
  const publishDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="publish_date"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    null;

  // 6. Category
  const category =
    $('meta[property="article:section"]').attr('content') ||
    $('meta[name="category"]').attr('content') ||
    $('meta[name="keywords"]').attr('content')?.split(',')[0]?.trim() ||
    null;

  // Clean strings
  return {
    title: title ? title.trim() : null,
    author: author ? author.replace(/^by\s+/i, '').trim() : null,
    excerpt: excerpt ? excerpt.trim() : null,
    featuredImageUrl,
    publishDate: publishDate ? publishDate.trim() : null,
    category: category ? category.trim() : null,
  };
}

/**
 * Extracts readable article content and metadata from a standard HTML webpage
 * using Mozilla Readability and Cheerio metadata parsing.
 *
 * @param {string} html
 * @param {string} url
 * @returns {{
 *   title: string | null,
 *   author: string | null,
 *   excerpt: string | null,
 *   contentHtml: string,
 *   rawText: string,
 *   featuredImageUrl: string | null,
 *   publishDate: string | null,
 *   category: string | null
 * }}
 */
export function extractWithReadability(html, url) {
  // Extract fast metadata via Cheerio
  const meta = extractMetadata(html, url);

  // Extract article body via Mozilla Readability
  let readabilityArticle = null;
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 20,
      keepClasses: false,
    });
    readabilityArticle = reader.parse();
  } catch {
    // If Readability fails, fallback to Cheerio extraction
  }

  let contentHtml = '';
  let rawText = '';
  let finalTitle = meta.title;
  let finalAuthor = meta.author;
  let finalExcerpt = meta.excerpt;

  if (readabilityArticle) {
    contentHtml = readabilityArticle.content || '';
    rawText = readabilityArticle.textContent || '';
    if (!finalTitle && readabilityArticle.title) {
      finalTitle = readabilityArticle.title;
    }
    if (!finalAuthor && readabilityArticle.byline) {
      finalAuthor = readabilityArticle.byline.replace(/^by\s+/i, '').trim();
    }
    if (!finalExcerpt && readabilityArticle.excerpt) {
      finalExcerpt = readabilityArticle.excerpt;
    }
  } else {
    // Fallback: extract main or article tag
    const $ = cheerio.load(html);
    const mainEl = $('article, main, [role="main"], .post-content, .entry-content').first();
    if (mainEl.length > 0) {
      contentHtml = mainEl.html() || '';
      rawText = mainEl.text() || '';
    } else {
      contentHtml = $('body').html() || '';
      rawText = $('body').text() || '';
    }
  }

  return {
    title: finalTitle,
    author: finalAuthor,
    excerpt: finalExcerpt,
    contentHtml,
    rawText: rawText.replace(/\s+/g, ' ').trim(),
    featuredImageUrl: meta.featuredImageUrl,
    publishDate: meta.publishDate,
    category: meta.category,
  };
}
