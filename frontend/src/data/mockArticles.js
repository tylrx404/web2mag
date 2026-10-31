/**
 * Initial editorial dataset and URL utilities for the Web2Mag application.
 * Contains high-fidelity real articles pre-formatted for static A4 magazine layout.
 */

export const TEST_SUCCESS_URL =
  'https://entechonline.com/do-you-understand-your-code/';
export const TEST_PCB_URL =
  'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/';
export const TEST_WP_NEWS_URL =
  'https://wordpress.org/news/2026/10/wordpress-7-1-4/';
export const TEST_FAILURE_URL = 'https://example.com/error';

/**
 * Initial curated articles for the Article Library and Magazine Preview.
 * The primary featured article is the ENTECH Magazine September 2026 cover story.
 */
export const INITIAL_ARTICLES = [
  {
    id: 'art-entech-101',
    title: 'Do you Understand your Code?',
    author: 'Vivek Khatri',
    date: '2026-09-17T12:04:40.000Z',
    formattedDate: 'September 17, 2026',
    category: 'Programming & AI',
    summary:
      'AI has made writing code faster, but it hasn’t made software engineering easier. This article discusses race conditions, retries, testing, observability, and why understanding your system matters more than ever.',
    thumbnail:
      'https://entechonline.com/wp-content/uploads/2026/08/AI-generated-code-and-Code-Understandability.jpg',
    sourceUrl: 'https://entechonline.com/do-you-understand-your-code/',
    status: 'Ready',
    sourceType: 'wordpress-rest-api',
    stats: {
      wordCount: 1550,
      readingTimeMinutes: 8,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'Introduction: Race conditions in software',
      },
      {
        type: 'paragraph',
        content:
          'A race condition can hit you anytime, you think it won’t because your software system isn’t that big, or doesn’t process a lot of requests, but it will happen, and when it happens, you will feel a bit silly about not handling it.',
      },
      {
        type: 'paragraph',
        content:
          'Race conditions don’t happen during local software testing. They don’t happen when you manually click buttons. But, they happen on a Friday evening when two requests arrive within the same millisecond. Suddenly you have duplicate invoices, duplicate payments or reviews. It makes life difficult, because now you have a production system which is in an inconsistent state.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Preventing Race Conditions with Database Constraints',
      },
      {
        type: 'paragraph',
        content:
          'When you build software systems that create things/records, it is better to add a check that only one record is getting created, the best way to achieve that is to add a unique constraint on your db table. If your business rule says only one record should ever exist, let the database enforce it.',
      },
      {
        type: 'paragraph',
        content:
          'A unique constraint is often simpler and more reliable than hoping your application code wins every race, effectively eliminating race conditions in software.',
      },
      {
        type: 'quote',
        content:
          'Figure out what must never be violated first, then let your database and your code enforce them. Once you know what must always be true, designing the rest becomes much easier.',
        citation: 'Vivek Khatri, ENTECH Magazine',
      },
      {
        type: 'heading',
        level: 2,
        content: 'When Constraints Aren’t Enough: Concurrency Control',
      },
      {
        type: 'paragraph',
        content:
          'Of course, not every problem can be solved with a constraint. Sometimes you need multiple operations to behave as one, and that’s where concurrency control comes into the picture.',
      },
      {
        type: 'paragraph',
        content:
          'In many high-throughput architectures, optimistic concurrency control checks a version token before applying changes. If another process updated the record in the meantime, the transaction cleanly aborts and retries with fresh state.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Enforce database-level uniqueness invariants at the schema boundary.',
          'Adopt optimistic locking with version counters for contested rows.',
          'Structure distributed jobs so failed workers can retry safely without side-effects.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        content: 'The Importance of Logging and Observability',
      },
      {
        type: 'paragraph',
        content:
          'Always log things, people underestimate logging. Obviously you shouldn’t over-log, but log things. Your code might handle errors gracefully, but you need to know what went wrong and why so the next day when you wake up, you can patch things up. Every important decision your code makes should leave behind a breadcrumb. Logs tell you why something failed. Monitoring tells you when something is on fire.',
      },
      {
        type: 'paragraph',
        content:
          'AI can write your functions in seconds, but AI won’t be on call when your payment reconciliation pipeline wedges at midnight. Software engineering was never about typing syntax—it has always been about understanding failure modes.',
      },
    ],
  },
  {
    id: 'art-entech-102',
    title: 'PCB Manufacturing: From Design to Real Product!',
    author: 'Virendra Singh Shekhawat',
    date: '2026-09-17T17:34:54.000Z',
    formattedDate: 'September 17, 2026',
    category: 'Electronics & Engineering',
    summary:
      'Designing a printed circuit board is an exciting milestone, but turning a digital layout into a functional hardware product requires strict adherence to fabrication tolerances, copper layers, and assembly workflows.',
    thumbnail:
      'https://entechonline.com/wp-content/uploads/2026/08/PCB-design-and-manufacturing.jpg',
    sourceUrl:
      'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/',
    status: 'Ready',
    sourceType: 'wordpress-rest-api',
    stats: {
      wordCount: 1100,
      readingTimeMinutes: 6,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'From Schematic Capture to Physical Substrate',
      },
      {
        type: 'paragraph',
        content:
          'Every electronic hardware product starts with a schematic diagram. Once electrical connections are routed and verified through design rule checks (DRC), Gerber files are generated to instruct computer-aided manufacturing machines at the fabrication plant.',
      },
      {
        type: 'paragraph',
        content:
          'FR-4 epoxy-laminated woven fiberglass remains the industry gold standard substrate, delivering electrical insulation, flame resistance, and mechanical rigidity across high-frequency consumer devices.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Etching, Plating, and Solder Mask Application',
      },
      {
        type: 'paragraph',
        content:
          'Photolithography transfers circuit traces onto copper-clad laminate sheets. Unexposed copper is chemically etched away, leaving only signal pathways and power planes. Vias are electroplated with copper to bridge signals across multi-layer stacks.',
      },
      {
        type: 'quote',
        content:
          'Precision in solder mask registration prevents solder bridges between micro-pitch IC pins during high-speed reflow oven soldering.',
        citation: 'Virendra Singh Shekhawat',
      },
      {
        type: 'paragraph',
        content:
          'Automated optical inspection (AOI) inspects line widths, missing pads, and trace clearances against IPC Class 2 and Class 3 reliability standards before assembly commences.',
      },
    ],
  },
  {
    id: 'art-103',
    title: 'Editorial Pacing: Balancing Long-Form Essays with Visual Spreads',
    author: 'Clara Chen',
    date: '2026-08-20T10:00:00.000Z',
    formattedDate: 'August 20, 2026',
    category: 'Design & Publication',
    summary:
      'Modern magazine readers navigate between immersive investigative journalism and swift visual scanning. Maintaining narrative rhythm across multi-column spreads requires deliberate typography and whitespace.',
    thumbnail: '', // Intentionally empty to test fallback placeholder
    sourceUrl: 'https://atelier.example.com/editorial-pacing-visual-spreads',
    status: 'Ready',
    sourceType: 'html-fallback',
    stats: {
      wordCount: 780,
      readingTimeMinutes: 4,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'The Architecture of Editorial Pacing',
      },
      {
        type: 'paragraph',
        content:
          'When designing a multi-page publication, the rhythm of reading changes dramatically between text-heavy analysis and visual breathing room. A magazine layout is not simply a blog post rendered onto paper; it is a choreographed reading journey.',
      },
      {
        type: 'paragraph',
        content:
          'By introducing pull quotes, asymmetric sidebars, and carefully proportioned two-column grids, the layout guides the human eye down the column while preserving typographic contrast.',
      },
    ],
  },
  {
    id: 'art-104',
    title:
      'Automated Web-to-Magazine Pipelines: Structuring Semantic HTML for Multi-Column Layout Engines',
    author: 'Devon K. Sterling',
    date: '2026-07-14T14:30:00.000Z',
    formattedDate: 'July 14, 2026',
    category: 'Workflow & Tech',
    summary:
      'Converting unstructured CMS articles into print-ready A4 magazines requires rigorous DOM sanitization, CSS multi-column balance, and page-break rules.',
    thumbnail: '',
    sourceUrl: 'https://publishingtech.example.io/web-to-magazine-semantic-html',
    status: 'Needs Review',
    sourceType: 'html-fallback',
    stats: {
      wordCount: 920,
      readingTimeMinutes: 5,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'Bridging the Web-to-Print Divide',
      },
      {
        type: 'paragraph',
        content:
          'Web publishing prioritizes infinite vertical scrolling, responsive viewport widths, and dynamic embeds. Print editorial software, by contrast, operates on fixed paper boundaries: A4 sheets, baseline grids, and symmetrical columns.',
      },
      {
        type: 'paragraph',
        content:
          'By leveraging standard HTML5 semantic elements and CSS column-count with break-inside avoidance, automated publication pipelines achieve typographic elegance without manual desktop publishing software.',
      },
    ],
  },
];

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

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'URL cannot contain spaces. Please enter a valid web address.',
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
      error:
        'Please enter a well-formed URL including the protocol (e.g. https://entechonline.com/article).',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Only HTTP and HTTPS URLs are supported.',
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
      error: 'Please include a valid domain name in the URL.',
    };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.href,
    parsedUrl: parsed,
    error: '',
  };
}

export default INITIAL_ARTICLES;
