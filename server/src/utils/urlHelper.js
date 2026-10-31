import he from 'he';

/**
 * Validates and parses an input URL string.
 * @param {string} rawUrl
 * @returns {{ isValid: boolean, error?: string, parsedUrl?: URL, normalizedUrl?: string }}
 */
export function validateAndParseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isValid: false,
      error: 'Please provide a valid article URL to import.',
    };
  }

  const trimmed = rawUrl.trim();

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: 'URL cannot contain spaces. Please enter a valid web address.',
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL. Please include the full protocol (e.g. https://example.com/article).',
    };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      isValid: false,
      error: 'Only HTTP and HTTPS URLs are supported.',
    };
  }

  const host = parsedUrl.hostname;
  const hasValidDomain =
    host === 'localhost' ||
    (host.includes('.') &&
      !host.startsWith('.') &&
      !host.endsWith('.') &&
      host.split('.').every((part) => part.length > 0));

  if (!host || !hasValidDomain) {
    return {
      isValid: false,
      error: 'URL must include a valid domain name.',
    };
  }

  return {
    isValid: true,
    parsedUrl,
    normalizedUrl: parsedUrl.href,
  };
}

/**
 * Extracts a probable post slug from a URL pathname.
 * Handles paths like /2026/09/17/article-slug/, /category/article-slug.html, etc.
 * @param {URL} parsedUrl
 * @returns {string}
 */
export function extractSlugFromUrl(parsedUrl) {
  const segments = parsedUrl.pathname
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    // Filter out numeric date path segments (e.g., 2026, 09, 17)
    .filter((s) => !/^\d{2,4}$/.test(s));

  if (segments.length === 0) {
    return '';
  }

  const lastSegment = segments[segments.length - 1];
  // Remove file extension if present (e.g., article-slug.html -> article-slug)
  const cleaned = decodeURIComponent(lastSegment).replace(/\.(html?|php|aspx?)$/i, '');

  return cleaned.trim();
}

/**
 * Extracts the base URL (protocol + host) from a parsed URL.
 * @param {URL} parsedUrl
 * @returns {string}
 */
export function extractBaseUrl(parsedUrl) {
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

/**
 * Decodes HTML entities and normalizes whitespace in text strings.
 * @param {string} str
 * @returns {string}
 */
export function cleanDecodedText(str) {
  if (!str || typeof str !== 'string') return '';
  const decoded = he.decode(str);
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Formats an ISO or string date into an editorial publication date string.
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatPublicationDate(dateInput) {
  if (!dateInput) return 'Recent Edition';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Recent Edition';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Recent Edition';
  }
}
