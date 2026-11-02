/**
 * Automatic Article Pagination Engine for Web2Mag
 *
 * Implements deterministic two-column block-level distribution of sanitized HTML article content
 * across consecutive A4 magazine pages.
 *
 * Geometric Specifications (A4 Portrait at 96 DPI: 210mm x 297mm):
 * - Page Dimensions: 794px width x 1123px height
 * - Margins/Padding: 42px top, 36px bottom, 48px left & right
 * - Interior Content Box: 698px width x 1045px height
 * - Running Header: ~76px (top brand bar, rule, folio badge, category tag, margin)
 * - Running Footer: ~37px (rule, copyright, folio, padding)
 * - Available vertical space between header & footer: 1045 - 76 - 37 = 932px
 *
 * Page 1 Content Layout:
 * - Headline Block: ~121px (title, byline bar, margins)
 * - Available Column Height for Page 1 Body: 932 - 121 = 811px
 * - With 7% safety margin for subpixel balancing: PAGE_1_COLUMN_HEIGHT = 755px
 *
 * Continuation Page Layout (Pages 2+):
 * - Continuation Header Bar: ~44px (title, part chip, margins)
 * - Available Column Height for Continuation Body: 932 - 44 = 888px
 * - With 7% safety margin for subpixel balancing: CONTINUATION_COLUMN_HEIGHT = 825px
 *
 * Content Integrity Guarantees:
 * 1. Zero silent truncation: every word, figure, heading, and list item is retained.
 * 2. Keep-with-next: headings are never placed as orphans at the bottom of a page.
 * 3. Atomic figures: images and captions are grouped in <figure> and kept together.
 * 4. Graceful paragraph splitting: oversized paragraphs split cleanly at sentence boundaries.
 * 5. Deterministic, offline-compatible, and isomorphic (works in browser & Node.js).
 */

export const A4_LAYOUT = {
  PAGE_WIDTH: 794,
  PAGE_HEIGHT: 1123,
  PADDING_TOP: 42,
  PADDING_BOTTOM: 36,
  PADDING_HORIZONTAL: 48,
  HEADER_HEIGHT: 76,
  FOOTER_HEIGHT: 37,
  HEADLINE_BLOCK_PAGE1: 121,
  CONTINUATION_HEADER_HEIGHT: 44,
  COLUMN_COUNT: 2,
  COLUMN_WIDTH: 336,
  COLUMN_GAP: 26,

  // Actual measured single-column vertical limits (including subpixel safety margins):
  PAGE_1_COLUMN_HEIGHT: 755,
  CONTINUATION_COLUMN_HEIGHT: 825,

  // Typography constants (11px font, 1.58 line-height)
  WORDS_PER_LINE: 9.5,
  LINE_HEIGHT_PX: 17.4,
  PARAGRAPH_MARGIN_PX: 10,
};

/**
 * Counts whitespace-delimited words in a string.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Strips HTML tags, returning plain text with normalized spaces.
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits plain text into sentences on punctuation boundaries.
 * @param {string} text
 * @returns {Array<string>}
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  const rawSentences = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!rawSentences) return [trimmed];
  return rawSentences.map((s) => s.trim()).filter(Boolean);
}

/**
 * Estimates the pixel height of a content block in a 336px column.
 *
 * @param {string} tag - HTML tag name ('p', 'h3', 'figure', 'ul', etc.)
 * @param {string} text - Plain text content
 * @param {string} [className=''] - CSS class names
 * @param {string} [html=''] - Raw HTML for detailed inspection
 * @returns {number} Estimated height in pixels
 */
export function estimateBlockHeight(tag, text = '', className = '', html = '') {
  const words = countWords(text);
  const tagLower = (tag || '').toLowerCase();

  switch (tagLower) {
    case 'h1':
      return 56;
    case 'h2':
      return 48;
    case 'h3':
      return 40;
    case 'h4':
    case 'h5':
    case 'h6':
      return 36;

    case 'figure': {
      // Standard figure with 2:1 or 16:9 aspect ratio image + caption
      const captionWords = countWords(
        html.replace(/[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*/i, '$1')
      );
      const captionLines = Math.max(1, Math.ceil(captionWords / 11));
      const captionHeight = captionLines * 14 + 12; // 9px font with padding
      // Image height in 336px column (bounded to column max)
      const imageHeight = 168;
      const borderAndMargin = 24;
      return imageHeight + captionHeight + borderAndMargin;
    }

    case 'img':
      return 180; // Standalone image without caption

    case 'ul':
    case 'ol': {
      // Count <li> tags
      const liMatches = html.match(/<li[^>]*>/gi);
      const itemCount = liMatches ? liMatches.length : Math.max(1, Math.ceil(words / 8));
      return itemCount * 24 + 16;
    }

    case 'blockquote': {
      const lines = Math.max(2, Math.ceil(words / 9));
      return lines * 18.5 + 24;
    }

    case 'table': {
      const trMatches = html.match(/<tr[^>]*>/gi);
      const rowCount = trMatches ? trMatches.length : 3;
      return rowCount * 28 + 20;
    }

    case 'p':
    default: {
      const isLead = className && className.includes('a4-lead');
      const wordsPerLine = isLead ? 9.0 : A4_LAYOUT.WORDS_PER_LINE;
      const lineHeight = isLead ? 19.5 : A4_LAYOUT.LINE_HEIGHT_PX;
      const margin = isLead ? 14 : A4_LAYOUT.PARAGRAPH_MARGIN_PX;
      const lines = Math.max(1, Math.ceil(words / wordsPerLine));
      return lines * lineHeight + margin;
    }
  }
}

/**
 * Parses raw HTML into top-level layout block objects.
 * Works seamlessly in both browser (DOMParser) and Node.js environments.
 *
 * @param {string} html
 * @returns {Array<{
 *   id: string,
 *   tag: string,
 *   type: 'heading' | 'paragraph' | 'figure' | 'list' | 'blockquote' | 'table' | 'other',
 *   html: string,
 *   text: string,
 *   wordCount: number,
 *   estimatedHeight: number,
 *   isHeading: boolean,
 *   isFigure: boolean,
 *   keepWithNext: boolean,
 *   className: string
 * }>}
 */
export function normalizeContentBlocks(html) {
  if (!html || typeof html !== 'string' || !html.trim()) {
    return [];
  }

  const trimmedHtml = html.trim();

  // 1. Browser DOMParser path if available
  if (typeof DOMParser !== 'undefined') {
    return parseBlocksWithDOMParser(trimmedHtml);
  }

  // 2. Global DOMParser path (e.g. Node JSDOM mock if provided)
  if (typeof globalThis !== 'undefined' && globalThis.DOMParser) {
    return parseBlocksWithDOMParser(trimmedHtml);
  }

  // 3. Fallback Regex/Tokenizer path for pure Node.js environments
  return parseBlocksWithRegex(trimmedHtml);
}

/**
 * Parses HTML into layout blocks using DOMParser.
 * @param {string} html
 * @returns {Array<object>}
 */
function parseBlocksWithDOMParser(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;
  const blocks = [];
  let blockIndex = 0;

  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === 1) {
      const el = /** @type {HTMLElement} */ (node);
      const tag = el.tagName.toLowerCase();
      const outerHtml = el.outerHTML;
      const text = el.textContent || '';
      const className = el.className || '';

      const isHeading = /^h[1-6]$/.test(tag);
      const isFigure = tag === 'figure' || className.includes('a4-figure');

      let type = 'other';
      if (isHeading) type = 'heading';
      else if (tag === 'p') type = 'paragraph';
      else if (isFigure) type = 'figure';
      else if (tag === 'ul' || tag === 'ol') type = 'list';
      else if (tag === 'blockquote') type = 'blockquote';
      else if (tag === 'table') type = 'table';
      else if (tag === 'img') type = 'figure';

      const estimatedHeight = estimateBlockHeight(tag, text, className, outerHtml);

      blocks.push({
        id: `blk-${blockIndex++}`,
        tag,
        type,
        html: outerHtml,
        text: text.trim(),
        wordCount: countWords(text),
        estimatedHeight,
        isHeading,
        isFigure,
        keepWithNext: isHeading,
        className,
      });
    } else if (node.nodeType === 3) {
      const text = (node.textContent || '').trim();
      if (text) {
        const pWrapped = `<p>${escapeHtml(text)}</p>`;
        blocks.push({
          id: `blk-${blockIndex++}`,
          tag: 'p',
          type: 'paragraph',
          html: pWrapped,
          text,
          wordCount: countWords(text),
          estimatedHeight: estimateBlockHeight('p', text, '', pWrapped),
          isHeading: false,
          isFigure: false,
          keepWithNext: false,
          className: '',
        });
      }
    }
  }

  return blocks;
}

/**
 * Pure regex-based block tokenizer for Node.js fallback.
 * @param {string} html
 * @returns {Array<object>}
 */
function parseBlocksWithRegex(html) {
  const blocks = [];
  let blockIndex = 0;

  const blockRegex =
    /<(p|h[1-6]|figure|ul|ol|blockquote|table|div)([^>]*)>([\s\S]*?)<\/\1>|<(img)([^>]*?)\/?>/gi;

  let match;
  let lastIndex = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const textBetween = html.slice(lastIndex, match.index).trim();
    if (textBetween && !/^<[^>]+>$/.test(textBetween)) {
      const cleanText = stripHtml(textBetween);
      if (cleanText) {
        blocks.push({
          id: `blk-${blockIndex++}`,
          tag: 'p',
          type: 'paragraph',
          html: `<p>${textBetween}</p>`,
          text: cleanText,
          wordCount: countWords(cleanText),
          estimatedHeight: estimateBlockHeight('p', cleanText),
          isHeading: false,
          isFigure: false,
          keepWithNext: false,
          className: '',
        });
      }
    }

    lastIndex = blockRegex.lastIndex;

    const fullTag = match[0];
    const tag = (match[1] || match[4] || '').toLowerCase();
    const attrs = match[2] || match[5] || '';
    const classMatch = attrs.match(/class=["']([^"']+)["']/i);
    const className = classMatch ? classMatch[1] : '';
    const text = stripHtml(fullTag);

    const isHeading = /^h[1-6]$/.test(tag);
    const isFigure = tag === 'figure' || tag === 'img' || className.includes('a4-figure');

    let type = 'other';
    if (isHeading) type = 'heading';
    else if (tag === 'p') type = 'paragraph';
    else if (isFigure) type = 'figure';
    else if (tag === 'ul' || tag === 'ol') type = 'list';
    else if (tag === 'blockquote') type = 'blockquote';
    else if (tag === 'table') type = 'table';

    blocks.push({
      id: `blk-${blockIndex++}`,
      tag,
      type,
      html: fullTag,
      text,
      wordCount: countWords(text),
      estimatedHeight: estimateBlockHeight(tag, text, className, fullTag),
      isHeading,
      isFigure,
      keepWithNext: isHeading,
      className,
    });
  }

  const trailing = html.slice(lastIndex).trim();
  if (trailing) {
    const cleanTrailing = stripHtml(trailing);
    if (cleanTrailing) {
      blocks.push({
        id: `blk-${blockIndex}`,
        tag: 'p',
        type: 'paragraph',
        html: `<p>${trailing}</p>`,
        text: cleanTrailing,
        wordCount: countWords(cleanTrailing),
        estimatedHeight: estimateBlockHeight('p', cleanTrailing),
        isHeading: false,
        isFigure: false,
        keepWithNext: false,
        className: '',
      });
    }
  }

  return blocks;
}

/**
 * Escapes plain text for safe insertion into HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Splits an oversized paragraph block at sentence boundaries.
 * Guarantees zero word loss.
 *
 * @param {object} block - Paragraph block
 * @param {number} availableBudgetPx - Space remaining in the current column
 * @returns {{
 *   part1: object | null,
 *   part2: object
 * }}
 */
export function splitParagraphBlock(block, availableBudgetPx) {
  const sentences = splitIntoSentences(block.text);

  if (sentences.length <= 1 || availableBudgetPx < 60) {
    return { part1: null, part2: block };
  }

  const isLead = block.className && block.className.includes('a4-lead');
  const wordsPerLine = isLead ? 9.0 : A4_LAYOUT.WORDS_PER_LINE;
  const lineHeight = isLead ? 19.5 : A4_LAYOUT.LINE_HEIGHT_PX;

  const currentPart1Sentences = [];
  let currentPart1Words = 0;
  let splitIndex = 0;

  for (let i = 0; i < sentences.length; i += 1) {
    const s = sentences[i];
    const sWords = countWords(s);
    const candidateWords = currentPart1Words + sWords;
    const candidateHeight = Math.ceil(candidateWords / wordsPerLine) * lineHeight + 10;

    if (candidateHeight <= availableBudgetPx && i < sentences.length - 1) {
      currentPart1Sentences.push(s);
      currentPart1Words += sWords;
      splitIndex = i + 1;
    } else {
      break;
    }
  }

  if (splitIndex === 0 || splitIndex >= sentences.length) {
    return { part1: null, part2: block };
  }

  const part1Text = currentPart1Sentences.join(' ');
  const part2Text = sentences.slice(splitIndex).join(' ');

  const part1Class = block.className ? ` class="${block.className}"` : '';
  const part2Class = '';

  const part1Block = {
    ...block,
    id: `${block.id}-p1`,
    html: `<p${part1Class}>${escapeHtml(part1Text)}</p>`,
    text: part1Text,
    wordCount: countWords(part1Text),
    estimatedHeight: estimateBlockHeight('p', part1Text, block.className),
  };

  const part2Block = {
    ...block,
    id: `${block.id}-p2`,
    html: `<p${part2Class}>${escapeHtml(part2Text)}</p>`,
    text: part2Text,
    wordCount: countWords(part2Text),
    estimatedHeight: estimateBlockHeight('p', part2Text),
  };

  return { part1: part1Block, part2: part2Block };
}

/**
 * Automatic Article Pagination Engine
 *
 * Distributes article content blocks into consecutive A4 pages by modeling
 * the actual physical two-column capacity of each page.
 *
 * @param {{
 *   id?: string,
 *   title?: string,
 *   contentHtml?: string,
 *   [key: string]: any
 * }} article
 * @param {object} [options={}]
 * @param {number} [options.page1ColumnHeight] - Max column height for page 1 (default 755px)
 * @param {number} [options.continuationColumnHeight] - Max column height for pages 2+ (default 825px)
 * @returns {Array<{
 *   chunkIndex: number,
 *   contentHtml: string,
 *   blocks: Array<object>,
 *   isFirstPage: boolean,
 *   isLastPage: boolean,
 *   totalPages: number,
 *   isEmpty: boolean,
 *   col1Height: number,
 *   col2Height: number,
 *   totalEstimatedHeight: number
 * }>}
 */
export function paginateArticleContent(article = {}, options = {}) {
  const contentHtml = article.contentHtml || '';

  // Handle empty or missing body content: produce exactly 1 chunk marked empty
  if (!contentHtml || !contentHtml.trim()) {
    return [
      {
        chunkIndex: 0,
        contentHtml: '',
        blocks: [],
        isFirstPage: true,
        isLastPage: true,
        totalPages: 1,
        isEmpty: true,
        col1Height: 0,
        col2Height: 0,
        totalEstimatedHeight: 0,
      },
    ];
  }

  const page1ColMax = options.page1ColumnHeight || A4_LAYOUT.PAGE_1_COLUMN_HEIGHT;
  const contColMax =
    options.continuationColumnHeight || A4_LAYOUT.CONTINUATION_COLUMN_HEIGHT;

  const rawBlocks = normalizeContentBlocks(contentHtml);

  if (rawBlocks.length === 0) {
    return [
      {
        chunkIndex: 0,
        contentHtml: '',
        blocks: [],
        isFirstPage: true,
        isLastPage: true,
        totalPages: 1,
        isEmpty: true,
        col1Height: 0,
        col2Height: 0,
        totalEstimatedHeight: 0,
      },
    ];
  }

  const blockQueue = [...rawBlocks];
  const pages = [];

  let currentChunkIndex = 0;
  let currentChunkBlocks = [];
  let col1Height = 0;
  let col2Height = 0;
  let activeCol = 1;
  let currentColLimit = page1ColMax;

  const startNewPage = () => {
    if (currentChunkBlocks.length > 0) {
      pages.push({
        chunkIndex: currentChunkIndex,
        blocks: currentChunkBlocks,
        contentHtml: currentChunkBlocks.map((b) => b.html).join('\n'),
        col1Height,
        col2Height,
        totalEstimatedHeight: col1Height + col2Height,
        isEmpty: false,
      });
      currentChunkIndex += 1;
      currentChunkBlocks = [];
      col1Height = 0;
      col2Height = 0;
      activeCol = 1;
      currentColLimit = contColMax;
    }
  };

  while (blockQueue.length > 0) {
    const block = blockQueue.shift();

    // RULE 1: Heading Protection (keepWithNext)
    // A heading must never be orphaned at the bottom of Column 2 (end of page).
    if (block.isHeading && blockQueue.length > 0) {
      const nextBlock = blockQueue[0];
      const combined = block.estimatedHeight + nextBlock.estimatedHeight;

      // If we are in Column 2 and combined doesn't fit in Column 2:
      if (activeCol === 2 && col2Height + combined > currentColLimit) {
        if (currentChunkBlocks.length > 0) {
          blockQueue.unshift(block);
          startNewPage();
          continue;
        }
      }
    }

    // Try placing in Column 1
    if (activeCol === 1) {
      if (col1Height + block.estimatedHeight <= currentColLimit) {
        currentChunkBlocks.push(block);
        col1Height += block.estimatedHeight;
        continue;
      }

      // Column 1 is full; transition to Column 2
      activeCol = 2;
      // Re-evaluate this block for Column 2
    }

    // Try placing in Column 2
    if (activeCol === 2) {
      if (col2Height + block.estimatedHeight <= currentColLimit) {
        currentChunkBlocks.push(block);
        col2Height += block.estimatedHeight;
        continue;
      }

      // Column 2 does not fit this block.
      // Can we split it if it's a paragraph?
      const remainingCol2 = currentColLimit - col2Height;
      if (block.type === 'paragraph' && remainingCol2 >= 85) {
        const { part1, part2 } = splitParagraphBlock(block, remainingCol2);
        if (part1) {
          currentChunkBlocks.push(part1);
          col2Height += part1.estimatedHeight;
          blockQueue.unshift(part2);
          startNewPage();
          continue;
        }
      }

      // If page already has blocks, close page and move this block to next page
      if (currentChunkBlocks.length > 0) {
        blockQueue.unshift(block);
        startNewPage();
        continue;
      }

      // If page is empty and block alone exceeds column limit (e.g. huge paragraph):
      if (block.type === 'paragraph') {
        const { part1, part2 } = splitParagraphBlock(block, currentColLimit);
        if (part1) {
          currentChunkBlocks.push(part1);
          col1Height += part1.estimatedHeight;
          blockQueue.unshift(part2);
          continue;
        }
      }

      // Fallback for oversized atomic elements (e.g. large table):
      // Assign to current page so content is NEVER lost
      currentChunkBlocks.push(block);
      col1Height += block.estimatedHeight;
      startNewPage();
    }
  }

  // Flush final page
  if (currentChunkBlocks.length > 0) {
    pages.push({
      chunkIndex: currentChunkIndex,
      blocks: currentChunkBlocks,
      contentHtml: currentChunkBlocks.map((b) => b.html).join('\n'),
      col1Height,
      col2Height,
      totalEstimatedHeight: col1Height + col2Height,
      isEmpty: false,
    });
  }

  const totalPages = Math.max(1, pages.length);

  return pages.map((page, idx) => ({
    ...page,
    chunkIndex: idx,
    isFirstPage: idx === 0,
    isLastPage: idx === totalPages - 1,
    totalPages,
  }));
}

export default paginateArticleContent;
