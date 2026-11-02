import crypto from 'node:crypto';
import { validateSafeUrl, safeFetch } from './security.js';
import { extractFromWordPress } from './wordpress.js';
import { extractWithReadability } from './readability.js';
import { sanitizeHtml, extractImageUrls, stripHtml } from './sanitizer.js';
import { calculateReadingTime } from '../utils/readingTime.js';

/**
 * Derives a readable fallback title from a URL if none was found in the page.
 * @param {URL} parsedUrl
 * @returns {string}
 */
function deriveFallbackTitle(parsedUrl) {
  const segments = parsedUrl.pathname
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

  const last = segments[segments.length - 1];
  if (last) {
    const clean = decodeURIComponent(last)
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (clean.length > 2) {
      return clean.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return `Article from ${parsedUrl.hostname.replace(/^www\./i, '')}`;
}

/**
 * Main article extraction orchestrator.
 * Validates target URL, attempts WordPress REST API ingestion,
 * falls back to Mozilla Readability HTML parsing, resolves relative media,
 * sanitizes HTML via DOMPurify, and normalizes output into Web2Mag schema.
 *
 * @param {string} rawUrl
 * @param {{ allowLocalhost?: boolean }} [options]
 * @returns {Promise<object>} Normalized Web2Mag Article Object
 */
export async function extractArticle(rawUrl, options = {}) {
  // 1. Security and URL validation
  const validation = await validateSafeUrl(rawUrl, options);
  if (!validation.isValid || !validation.parsedUrl) {
    throw new Error(validation.error || 'Invalid or unsafe article URL.');
  }

  const { parsedUrl } = validation;
  let extracted = null;
  let finalUrl = parsedUrl.href;

  // 2. Try WordPress REST API first
  try {
    const wpResult = await extractFromWordPress(parsedUrl, options);
    if (wpResult && wpResult.contentHtml) {
      extracted = wpResult;
    }
  } catch {
    // If WordPress query errors, continue to generic extraction
  }

  // 3. Fallback to generic webpage HTML extraction
  if (!extracted) {
    const { bodyText, finalUrl: resolvedUrl } = await safeFetch(parsedUrl.href, options);
    finalUrl = resolvedUrl;
    extracted = extractWithReadability(bodyText, finalUrl);
  }

  if (!extracted || (!extracted.contentHtml && !extracted.title)) {
    throw new Error(
      'Unable to extract readable article content or metadata from the provided URL.'
    );
  }

  // 4. Extract all image URLs from content before sanitization
  const contentImages = extractImageUrls(extracted.contentHtml, finalUrl);
  const images = [...contentImages];

  let featuredImageUrl = extracted.featuredImageUrl || null;
  if (!featuredImageUrl && images.length > 0) {
    featuredImageUrl = images[0];
  }

  if (featuredImageUrl && !images.includes(featuredImageUrl)) {
    images.unshift(featuredImageUrl);
  }

  // 5. Sanitize HTML via DOMPurify
  const cleanHtml = sanitizeHtml(extracted.contentHtml, finalUrl);

  // 6. Compute plain raw text and reading time
  const rawText = extracted.rawText || stripHtml(cleanHtml);
  const readingTime = calculateReadingTime(rawText);

  // 7. Assemble normalized Web2Mag article object
  const title = extracted.title || deriveFallbackTitle(parsedUrl);
  const author = extracted.author || null;
  const excerpt = extracted.excerpt || null;
  const category = extracted.category || 'General';
  const publishDate = extracted.publishDate || null;
  const thumbnail = featuredImageUrl || (images[0] ?? null);

  const uniqueSuffix = crypto.randomUUID().slice(0, 6);
  const id = `art-${Date.now()}-${uniqueSuffix}`;

  return {
    id,
    sourceUrl: finalUrl,
    title,
    author,
    excerpt,
    contentHtml: cleanHtml,
    rawText,
    featuredImageUrl,
    thumbnail,
    images,
    publishDate,
    category,
    readingTime,
    status: 'Imported',
    importedAt: new Date().toISOString(),
    isWordPress: Boolean(extracted.isWordPress),
    isPage: Boolean(extracted.isPage),
  };
}

export default extractArticle;
