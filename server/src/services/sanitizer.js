import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Allowed HTML tags for clean editorial magazine layout
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'blockquote', 'figure', 'figcaption', 'img',
  'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 's', 'cite',
  'a', 'code', 'pre', 'span', 'div', 'hr', 'br',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'sub', 'sup', 'mark'
];

// Allowed attributes
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'width', 'height', 'loading', 'rel', 'target',
  'colspan', 'rowspan'
];

/**
 * Resolves all relative image and link URLs in an HTML fragment against a base URL.
 *
 * @param {string} html
 * @param {string} baseUrl
 * @returns {string} HTML with all relative URLs resolved to absolute
 */
export function resolveRelativeUrls(html, baseUrl) {
  if (!html || typeof html !== 'string') return '';
  if (!baseUrl) return html;

  const $ = cheerio.load(html, null, false);

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      try {
        $(el).attr('src', new URL(src, baseUrl).href);
      } catch {
        // Keep original if parsing fails
      }
    }
  });

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        $(el).attr('href', new URL(href, baseUrl).href);
      } catch {
        // Keep original
      }
    }
  });

  return $.html();
}

/**
 * Extracts a list of unique, valid image URLs from an HTML fragment.
 *
 * @param {string} html
 * @param {string} baseUrl
 * @returns {string[]}
 */
export function extractImageUrls(html, baseUrl) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html, null, false);
  const images = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      try {
        const absolute = new URL(src, baseUrl).href;
        if (!images.includes(absolute)) {
          images.push(absolute);
        }
      } catch {
        // Ignore malformed
      }
    }
  });

  return images;
}

/**
 * Strips all HTML tags and collapses whitespace to generate plain raw text.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes an HTML fragment using DOMPurify, stripping unsafe tags and scripts,
 * and enforcing safe link attributes.
 *
 * @param {string} rawHtml
 * @param {string} [baseUrl]
 * @returns {string} Clean, safe HTML
 */
export function sanitizeHtml(rawHtml, baseUrl = '') {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // 1. Resolve relative URLs first
  const resolvedHtml = baseUrl ? resolveRelativeUrls(rawHtml, baseUrl) : rawHtml;

  // 2. Configure DOMPurify hooks
  DOMPurify.removeAllHooks();

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Force external links to open safely
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    // Clean lazy loading for print compatibility
    if (node.tagName === 'IMG') {
      node.removeAttribute('srcset'); // Prefer clean absolute src
    }
  });

  // 3. Sanitize
  const clean = DOMPurify.sanitize(resolvedHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
  });

  return clean.trim();
}
