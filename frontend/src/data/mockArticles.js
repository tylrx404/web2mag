/**
 * Mock data and simulated import utilities for the Web2Mag Article Library module.
 * Extended for Phase 1A & Phase 2 to support multi-page A4 Magazine Editor preview
 * with category, featuredImageUrl, contentHtml, authorBio, and authorRole fields.
 * All operations remain local, deterministic, and offline-compatible.
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
    <rect x="24" y="24" width="86" height="22" rx="4" fill="${accent}" fill-opacity="0.22" />
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
 * Generates an authentic technical circuit diagram SVG data-URI for the PCB sample article.
 */
function createCircuitIllustration() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" fill="none">
    <rect width="600" height="300" rx="6" fill="#0f231c" />
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#16382b" stroke-width="0.75" />
    </pattern>
    <rect width="600" height="300" fill="url(#grid)" />
    <!-- IC Controller -->
    <rect x="225" y="80" width="150" height="140" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <circle cx="245" cy="100" r="4" fill="#38bdf8" />
    <text x="300" y="148" fill="#f8fafc" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">STM32-H743</text>
    <text x="300" y="168" fill="#94a3b8" font-family="monospace" font-size="9" text-anchor="middle">ARM CORTEX-M7 • 480MHz</text>
    <!-- Traces and Signals -->
    <path d="M 50 60 L 150 60 L 225 110" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 50 100 L 130 100 L 225 130" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 50 140 L 120 140 L 225 150" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 375 110 L 450 60 L 550 60" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 375 150 L 460 150 L 550 110" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 300 220 L 300 260 L 440 260" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 270 220 L 270 250 L 160 250" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <!-- Terminals & Pads -->
    <circle cx="50" cy="60" r="5" fill="#f59e0b" />
    <circle cx="50" cy="100" r="5" fill="#f59e0b" />
    <circle cx="50" cy="140" r="5" fill="#f59e0b" />
    <circle cx="550" cy="60" r="5" fill="#10b981" />
    <circle cx="550" cy="110" r="5" fill="#10b981" />
    <circle cx="440" cy="260" r="5" fill="#f59e0b" />
    <circle cx="160" cy="250" r="5" fill="#38bdf8" />
    <rect x="480" y="200" width="36" height="18" rx="3" fill="#ef4444" fill-opacity="0.8" />
    <text x="498" y="213" fill="#ffffff" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">PWR_OK</text>
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
 * Includes the reference ENTECH September 2026 PCB Manufacturing article,
 * modular grid articles, and a zero-content draft article to test layout fallbacks.
 */
export const INITIAL_ARTICLES = [
  {
    id: 'art-101',
    title: 'PCB Manufacturing: From Design to Real Product!',
    author: 'Virendra Singh Shekhawat',
    authorRole: 'Hardware Engineer & Production Head',
    authorBio:
      'Virendra Singh is a Product Development Engineer and Production Head specializing in PCB design, robotics, and AI-enabled hardware systems. With a passion for bridging theoretical engineering and production-floor realities, he leads multi-disciplinary teams in creating scalable hardware products.',
    category: 'CAREER FOCUS',
    thumbnail: createEditorialThumbnail('#064e3b', '#022c22', '#10b981', 'CAREER FOCUS'),
    featuredImageUrl: createCircuitIllustration(),
    sourceUrl: 'https://entechonline.com/pcb-manufacturing-from-design-to-real-product',
    status: 'Ready',
    contentHtml: `
      <p class="a4-lead"><strong>Every electronic device</strong> — from smartphones and medical telemetry to autonomous robotic platforms — relies fundamentally on Printed Circuit Boards (PCBs). While engineering students often prototype on solderless breadboards, commercial deployment requires compact, durable, and manufacturable boards capable of withstanding industrial vibration and thermal cycling.</p>

      <h3>PCB Design & Engineering Workflow</h3>
      <p>Printed Circuit Boards serve as the central physical and electrical foundation of modern hardware. The journey begins with schematic capture, where engineers map logical interconnects between microcontrollers, passive filtering networks, and sensing arrays using EDA suites such as KiCad or Altium Designer.</p>

      <p>Once electrical schematics pass design rule checks, physical routing commences. Netlists translate into copper traces across multi-layer FR4 substrates. High-current power rails require wider copper weight, whereas high-speed differential pairs necessitate impedance-matched geometries to eliminate signal reflection and cross-talk.</p>

      <figure class="a4-figure">
        <img src="${createCircuitIllustration()}" alt="Multilayer PCB layout routing diagram" class="a4-figure__img" />
        <figcaption>Figure 1: High-density multilayer PCB routing featuring controlled impedance traces, thermal relief vias, and compact surface-mount footprints.</figcaption>
      </figure>

      <h3>Design for Manufacturability (DFM)</h3>
      <p>Before releasing final Gerber archives and drill charts to fabrication facilities, engineers execute two vital verification gates:</p>
      <ol>
        <li><strong>Design for Manufacturability (DFM):</strong> Verifies copper clearances, annular rings, and solder mask expansion tolerances to eliminate etching shorts or broken vias.</li>
        <li><strong>Design for Assembly (DFA):</strong> Confirms component spacing and thermal relief pads to guarantee seamless automated pick-and-place operation and reflow soldering.</li>
      </ol>

      <p>Automated Optical Inspection (AOI) and flying-probe continuity checks ensure zero fabrication defects before surface-mount components are populated and conformal coating is applied.</p>
    `,
  },
  {
    id: 'art-102',
    title: 'The Revival of Modular Grid Systems in Digital-to-Print Publishing',
    author: 'Elena Rostova',
    authorRole: 'Senior Editorial Designer',
    authorBio:
      'Elena Rostova is an editorial design researcher focusing on Swiss typographic grid systems, visual pacing, and digital-to-print publication geometry.',
    category: 'DESIGN',
    thumbnail: createEditorialThumbnail('#1e293b', '#334155', '#6366f1', 'DESIGN'),
    featuredImageUrl: createEditorialThumbnail('#1e293b', '#334155', '#6366f1', 'DESIGN'),
    sourceUrl: 'https://journal.example.com/articles/modular-grid-systems-print',
    status: 'Ready',
    contentHtml: `
      <p class="a4-lead"><strong>The Swiss typographic tradition</strong> of rigorous multi-column grids is experiencing an energetic resurgence in modern editorial production. By aligning digital content to strict vertical baselines, publishers achieve visual harmony across both screen and print.</p>

      <h3>Grid Architecture & Vertical Rhythm</h3>
      <p>A modular grid establishes mathematical proportions between headline scale, paragraph leading, and column gutters. When converting responsive web articles into fixed A4 dimensions, maintaining an 8pt or 12pt baseline grid ensures that adjacent columns maintain uniform horizontal alignment.</p>

      <p>Editorial pacing thrives on disciplined contrast. Pairing two-column narrative text with full-bleed typographic callouts enables long-form essays to breathe while guiding the reader through complex scientific and technical subject matter.</p>
    `,
  },
  {
    id: 'art-103',
    title: 'Editorial Pacing: Balancing Long-Form Investigative Essays with Visual Spreads',
    author: 'Clara Chen',
    authorRole: 'Investigative Essayist',
    authorBio:
      'Clara Chen writes long-form essays exploring editorial pacing, visual journalism, and the narrative tension between text and photography in modern magazines.',
    category: 'EDITORIAL',
    thumbnail: '', // Intentionally empty to test missing-image fallback
    featuredImageUrl: '',
    sourceUrl: 'https://atelier.example.com/editorial-pacing-visual-spreads',
    status: 'Ready',
    contentHtml: '', // Intentionally empty to test clean placeholder behavior when body content is missing
  },
  {
    id: 'art-104',
    title: 'Sustainable Paper Stocks and High-Contrast Ink Workflows for Independent Quarterlies',
    author: 'Marcus Vance',
    authorRole: 'Print Production Specialist',
    authorBio:
      'Marcus Vance is a print production specialist exploring FSC-certified paper fibers, soy-based offset inks, and zero-VOC tactile publishing.',
    category: 'PRODUCTION',
    thumbnail: createEditorialThumbnail('#1e1b4b', '#312e81', '#818cf8', 'PRODUCTION'),
    featuredImageUrl: createEditorialThumbnail('#1e1b4b', '#312e81', '#818cf8', 'PRODUCTION'),
    sourceUrl: 'https://presscraft.example.org/production/sustainable-paper-stocks',
    status: 'Imported',
    contentHtml: `
      <p class="a4-lead"><strong>Independent quarterly periodicals</strong> are distinguishing themselves through tactile paper weights and eco-certified inks. As screen saturation increases, physical publications deliver an unmatched tactile reading experience.</p>

      <h3>FSC Certification & Fiber Density</h3>
      <p>Balancing opacity with tactile grain is critical when selecting paper weights. Post-consumer recycled sheets offer organic warmth, while chlorine-free high-bulk grades provide the dimensional stability needed for clean two-column printing without ink bleed-through.</p>
    `,
  },
  {
    id: 'art-105',
    title: 'Automated Web-to-Magazine Pipelines: Structuring Semantic HTML for Multi-Column Layout Engines',
    author: 'Devon K. Sterling',
    authorRole: 'Publishing Systems Architect',
    authorBio:
      'Devon K. Sterling leads publishing automation engineering, specializing in multi-column browser rendering engines and CSS Paged Media pipelines.',
    category: 'WORKFLOW',
    thumbnail: createEditorialThumbnail('#0f172a', '#1e3a5f', '#38bdf8', 'WORKFLOW'),
    featuredImageUrl: createEditorialThumbnail('#0f172a', '#1e3a5f', '#38bdf8', 'WORKFLOW'),
    sourceUrl: 'https://publishingtech.example.io/web-to-magazine-semantic-html',
    status: 'Needs Review',
    contentHtml: `
      <p class="a4-lead"><strong>Transforming web articles into publication-grade magazines</strong> demands clean, semantic HTML. By standardizing section tags, heading hierarchies, and figure captions, automated layout engines can reliably compute A4 column distribution.</p>

      <h3>CSS Paged Media Standards</h3>
      <p>Leveraging modern CSS columns with orphan suppression and page-break rules bridges the chasm between responsive web flows and fixed-geometry print publications.</p>
    `,
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
 * Extended for Phase 1A & Phase 2.
 *
 * @param {string} rawUrl
 * @param {{ delayMs?: number }} [options]
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   author: string,
 *   category: string,
 *   thumbnail: string,
 *   featuredImageUrl: string,
 *   contentHtml: string,
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

      const generatedThumb = omitThumbnail
        ? ''
        : createEditorialThumbnail(palette[0], palette[1], palette[2], palette[3]);

      const article = {
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: deriveTitleFromUrl(parsedUrl),
        author,
        authorRole: 'Contributing Writer',
        authorBio: `${author} is a contributing writer featured in this publication.`,
        category: palette[3] || 'TECHNOLOGY',
        thumbnail: generatedThumb,
        featuredImageUrl: generatedThumb,
        contentHtml: '', // Newly imported mock articles have metadata only
        sourceUrl: normalizedUrl,
        status: 'Imported',
      };

      resolve(article);
    }, delayMs);
  });
}

export default INITIAL_ARTICLES;
