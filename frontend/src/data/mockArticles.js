/**
 * Mock data and simulated import utilities for the Web2Mag Article Library module.
 * All operations are local and deterministic — no external network requests are performed.
 */

/**
 * Generates an inline SVG data-URI thumbnail with an editorial cover aesthetic.
 * Using SVG data URIs guarantees thumbnails render reliably in offline and sandboxed environments.
 */
function createEditorialThumbnail(bgStart, bgEnd, accent, categoryLabel) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="320" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="320" height="220" rx="8" fill="url(#bg)" />
    <rect x="24" y="24" width="76" height="22" rx="4" fill="${accent}" fill-opacity="0.22" />
    <text x="34" y="39" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" letter-spacing="0.08em">${categoryLabel}</text>
    <rect x="24" y="64" width="210" height="12" rx="3" fill="#ffffff" fill-opacity="0.9" />
    <rect x="24" y="86" width="168" height="12" rx="3" fill="#ffffff" fill-opacity="0.72" />
    <rect x="24" y="108" width="124" height="10" rx="3" fill="#ffffff" fill-opacity="0.45" />
    <line x1="24" y1="158" x2="296" y2="158" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5" />
    <circle cx="38" cy="182" r="12" fill="${accent}" />
    <rect x="58" y="176" width="96" height="10" rx="3" fill="#ffffff" fill-opacity="0.65" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Documented test URLs for predictable verification of success and error states.
 */
export const TEST_SUCCESS_URL =
  'https://editorial.example.com/2026/swiss-grid-typography-in-modern-print';
export const TEST_NO_IMAGE_URL =
  'https://editorial.example.com/2026/minimalist-column-layouts-no-image';
export const TEST_FAILURE_URL = 'https://example.com/error';

/**
 * Initial mock articles populating the Article Library sidebar.
 * Includes articles with valid thumbnails, an article without a thumbnail,
 * varying lengths of titles, and distinct import statuses.
 */
export const INITIAL_ARTICLES = [
  {
    id: 'art-101',
    title: 'The Revival of Modular Grid Systems in Digital-to-Print Publishing',
    author: 'Elena Rostova',
    thumbnail: createEditorialThumbnail('#1e293b', '#334155', '#6366f1', 'DESIGN'),
    sourceUrl: 'https://journal.example.com/articles/modular-grid-systems-print',
    status: 'Ready',
  },
  {
    id: 'art-102',
    title: 'Sustainable Paper Stocks and High-Contrast Ink Workflows for Independent Quarterlies',
    author: 'Marcus Vance',
    thumbnail: createEditorialThumbnail('#1e1b4b', '#312e81', '#818cf8', 'PRODUCTION'),
    sourceUrl: 'https://presscraft.example.org/production/sustainable-paper-stocks',
    status: 'Imported',
  },
  {
    id: 'art-103',
    title: 'Editorial Pacing: Balancing Long-Form Investigative Essays with Visual Spreads',
    author: 'Clara Chen',
    thumbnail: '', // Intentionally empty to demonstrate the missing-image fallback state
    sourceUrl: 'https://atelier.example.com/editorial-pacing-visual-spreads',
    status: 'Ready',
  },
  {
    id: 'art-104',
    title: 'Automated Web-to-Magazine Pipelines: Structuring Semantic HTML for Multi-Column Layout Engines',
    author: 'Devon K. Sterling',
    thumbnail: createEditorialThumbnail('#0f172a', '#1e3a5f', '#38bdf8', 'WORKFLOW'),
    sourceUrl: 'https://publishingtech.example.io/web-to-magazine-semantic-html',
    status: 'Needs Review',
  },
];

// Alias for convenience
export const mockArticles = INITIAL_ARTICLES;

/**
 * Normalizes a URL string for duplicate comparison.
 * @param {string} rawUrl
 * @returns {string}
 */
export function normalizeArticleUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${pathname}${parsed.search}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Validates an input string as an HTTP/HTTPS URL using the standard JavaScript URL constructor.
 * Does not claim that a syntactically valid URL is a verified WordPress article.
 *
 * @param {string} rawInput
 * @returns {{ isValid: boolean, normalizedUrl: string, parsedUrl: URL | null, error: string }}
 */
export function validateArticleUrl(rawInput) {
  const trimmed = typeof rawInput === 'string' ? rawInput.trim() : '';

  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Please enter an article URL to import.',
    };
  }

  // Reject whitespace inside the URL string
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'URL cannot contain spaces. Please enter a valid web address (e.g., https://example.com/article).',
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Please enter a well-formed URL including the protocol (for example, https://example.com/article).',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Only HTTP and HTTPS URLs are supported. Please start the URL with https:// or http://.',
    };
  }

  const host = parsed.hostname;
  const hasValidDomain =
    host === 'localhost' ||
    (host.includes('.') &&
      !host.startsWith('.') &&
      !host.endsWith('.') &&
      host.split('.').every((part) => part.length > 0));

  if (!host || !hasValidDomain) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Please include a valid domain name in the URL (for example, https://example.com/article).',
    };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.href,
    parsedUrl: parsed,
    error: '',
  };
}

const AUTHOR_POOL = [
  'Hannah Lindqvist',
  'Julian Mercer',
  'Sora Takahashi',
  'Nadia Al-Mansoor',
  'Gabriel Vance',
  'Amara Okafor',
];

const THUMBNAIL_PALETTES = [
  ['#1e293b', '#334155', '#6366f1', 'FEATURE'],
  ['#172554', '#1e3a8a', '#60a5fa', 'CULTURE'],
  ['#312e81', '#3730a3', '#a5b4fc', 'ESSAY'],
  ['#0f172a', '#334155', '#38bdf8', 'REPORT'],
];

/**
 * Converts a URL path or hostname into a readable editorial title.
 * @param {URL} parsedUrl
 * @returns {string}
 */
function deriveTitleFromUrl(parsedUrl) {
  const segments = parsedUrl.pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !/^\d{2,4}$/.test(segment)); // Skip numeric year/month segments

  const lastSegment = segments[segments.length - 1];

  if (lastSegment) {
    const cleaned = decodeURIComponent(lastSegment)
      .replace(/\.(html?|php|aspx?|md)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    if (cleaned.length > 2) {
      return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  const cleanHost = parsedUrl.hostname.replace(/^www\./i, '');
  return `Editorial Feature from ${cleanHost}`;
}

/**
 * Checks whether a valid URL should trigger a predictable simulated failure.
 * Triggered by `https://example.com/error`, `https://example.com/fail`, or URLs
 * containing `/error`, `/fail`, `404`, or `500` in the path or query.
 *
 * @param {URL} parsedUrl
 * @returns {boolean}
 */
export function isSimulatedFailureUrl(parsedUrl) {
  const fullTarget = `${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`.toLowerCase();
  return (
    fullTarget.includes('/error') ||
    fullTarget.includes('/fail') ||
    fullTarget.includes('error.') ||
    fullTarget.includes('fail.') ||
    fullTarget.includes('/404') ||
    fullTarget.includes('/500') ||
    fullTarget.includes('simulate-error')
  );
}

/**
 * Simulates an asynchronous article import from a validated URL.
 * Performs no real network requests.
 *
 * @param {string} rawUrl
 * @param {{ delayMs?: number }} [options]
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   author: string,
 *   thumbnail: string,
 *   sourceUrl: string,
 *   status: string
 * }>}
 */
export function simulateArticleImport(rawUrl, options = {}) {
  const { delayMs = 750 } = options;
  const validation = validateArticleUrl(rawUrl);

  if (!validation.isValid || !validation.parsedUrl) {
    return Promise.reject(new Error(validation.error || 'Invalid article URL.'));
  }

  const { parsedUrl, normalizedUrl } = validation;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isSimulatedFailureUrl(parsedUrl)) {
        reject(
          new Error(
            'Simulated import error: Unable to extract readable article content from this URL. Verify the address or try a different article URL.'
          )
        );
        return;
      }

      // Compute deterministic hash from the URL for author and thumbnail selection
      let hash = 0;
      for (let i = 0; i < normalizedUrl.length; i += 1) {
        hash = (hash * 31 + normalizedUrl.charCodeAt(i)) >>> 0;
      }

      const author = AUTHOR_POOL[hash % AUTHOR_POOL.length];
      const palette = THUMBNAIL_PALETTES[hash % THUMBNAIL_PALETTES.length];
      const omitThumbnail =
        normalizedUrl.toLowerCase().includes('no-image') ||
        normalizedUrl.toLowerCase().includes('nothumb');

      const article = {
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: deriveTitleFromUrl(parsedUrl),
        author,
        thumbnail: omitThumbnail
          ? ''
          : createEditorialThumbnail(palette[0], palette[1], palette[2], palette[3]),
        sourceUrl: normalizedUrl,
        status: 'Imported',
      };

      resolve(article);
    }, delayMs);
  });
}

export default INITIAL_ARTICLES;
