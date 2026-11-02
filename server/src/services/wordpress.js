import { safeFetch } from './security.js';
import * as cheerio from 'cheerio';

/**
 * Decodes HTML entities from a string (e.g. &amp;, &#8217;, &quot;).
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  const $ = cheerio.load(str);
  return $.text();
}

/**
 * Derives a post or page slug from a URL pathname.
 * Handles trailing slashes and year/month path segments.
 *
 * @param {URL} parsedUrl
 * @returns {string}
 */
export function deriveSlug(parsedUrl) {
  const segments = parsedUrl.pathname
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^\d{2,4}$/.test(s)); // Skip numeric year/month directories

  const lastSegment = segments[segments.length - 1] || '';
  return decodeURIComponent(lastSegment).replace(/\.(html?|php|aspx?)$/i, '');
}

/**
 * Attempts to fetch and extract an article from a WordPress site using the WordPress REST API.
 *
 * @param {URL} parsedUrl
 * @param {{ allowLocalhost?: boolean }} [options]
 * @returns {Promise<{
 *   isWordPress: boolean,
 *   title: string,
 *   author: string | null,
 *   contentHtml: string,
 *   excerpt: string | null,
 *   featuredImageUrl: string | null,
 *   publishDate: string | null,
 *   category: string | null,
 *   isPage?: boolean
 * } | null>}
 */
export async function extractFromWordPress(parsedUrl, options = {}) {
  const slug = deriveSlug(parsedUrl);
  if (!slug) return null;

  const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // 1. Try querying /wp-json/wp/v2/posts
  const postsEndpoint = `${origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=true`;

  try {
    const { bodyText } = await safeFetch(postsEndpoint, options);
    const data = JSON.parse(bodyText);

    if (Array.isArray(data) && data.length > 0) {
      return parseWordPressItem(data[0], false);
    }
  } catch {
    // If posts query fails, continue to check pages
  }

  // 2. Try querying /wp-json/wp/v2/pages (e.g. Issue landing pages)
  const pagesEndpoint = `${origin}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_embed=true`;

  try {
    const { bodyText } = await safeFetch(pagesEndpoint, options);
    const data = JSON.parse(bodyText);

    if (Array.isArray(data) && data.length > 0) {
      return parseWordPressItem(data[0], true);
    }
  } catch {
    // REST API unavailable or item not found
  }

  return null;
}

/**
 * Normalizes a WordPress post or page object from the REST API response.
 *
 * @param {object} item
 * @param {boolean} isPage
 * @returns {object}
 */
function parseWordPressItem(item, isPage) {
  // Title
  const rawTitle = item.title?.rendered || '';
  const title = decodeHtmlEntities(rawTitle) || null;

  // Content
  const contentHtml = item.content?.rendered || '';

  // Excerpt
  const rawExcerpt = item.excerpt?.rendered || '';
  const excerpt = decodeHtmlEntities(rawExcerpt).trim() || null;

  // Author
  let author = null;
  const embeddedAuthors = item._embedded?.author;
  if (Array.isArray(embeddedAuthors) && embeddedAuthors.length > 0) {
    author = embeddedAuthors[0].name || null;
  }

  // Featured Media
  let featuredImageUrl = null;
  const embeddedMedia = item._embedded?.['wp:featuredmedia'];
  if (Array.isArray(embeddedMedia) && embeddedMedia.length > 0) {
    featuredImageUrl = embeddedMedia[0].source_url || null;
  }

  // Categories
  let category = null;
  const terms = item._embedded?.['wp:term'];
  if (Array.isArray(terms)) {
    const categories = [];
    for (const termGroup of terms) {
      if (Array.isArray(termGroup)) {
        for (const term of termGroup) {
          if (term.taxonomy === 'category' && term.name) {
            categories.push(decodeHtmlEntities(term.name));
          }
        }
      }
    }
    if (categories.length > 0) {
      category = categories.join(', ');
    }
  }

  // Publish Date
  const publishDate = item.date || null;

  return {
    isWordPress: true,
    isPage,
    title,
    author,
    contentHtml,
    excerpt,
    featuredImageUrl,
    publishDate,
    category,
  };
}
