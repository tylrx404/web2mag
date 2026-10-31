/**
 * Web2Mag — Automatic Pagination and Text Overflow Engine
 * Handles A4 sheet dimensions (210mm × 297mm), two-column balancing,
 * orphan heading prevention (keep-with-next), and dynamic "Page X of Y" numbering.
 */

// ISO 216 A4 Dimensions at 96 DPI: 210mm × 297mm
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

// Default layout constraints (in pixels at 96 DPI)
export const DEFAULT_PAGE_PADDING_V = 120; // 16mm top + 16mm bottom (~60px + ~60px)
export const DEFAULT_HEADER_HEIGHT = 40;  // Header + divider rule + margin
export const DEFAULT_FOOTER_HEIGHT = 46;  // Footer + divider rule + margin
export const COLUMN_WIDTH_PX = 317;       // (794 - 68 - 68 - 24) / 2 = 317px

/**
 * Splits a text string into sentences while preserving trailing punctuation and whitespace.
 * @param {string} text
 * @returns {string[]}
 */
export function splitTextIntoSentences(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return matches && matches.length > 0 ? matches : [text];
}

/**
 * Estimates the vertical rendered height of a section block when DOM measurements are not yet available.
 * @param {any} section
 * @param {number} colWidth
 * @returns {number}
 */
export function estimateSectionHeight(section, colWidth = COLUMN_WIDTH_PX) {
  if (!section) return 0;

  switch (section.type) {
    case 'heading': {
      const text = section.content || '';
      const charsPerLine = Math.max(18, Math.floor(colWidth / 12));
      const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
      const lineHeight = section.level === 2 ? 26 : 22;
      const margins = section.level === 2 ? 28 : 22;
      return lines * lineHeight + margins;
    }

    case 'paragraph': {
      const text = section.content || '';
      const charsPerLine = Math.max(28, Math.floor(colWidth / 7.2));
      const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
      // 21px line-height + 12px margin-bottom
      return lines * 21 + 12;
    }

    case 'image': {
      // Standard inline figure height with caption and margins
      return 220;
    }

    case 'quote': {
      const text = section.content || '';
      const charsPerLine = Math.max(24, Math.floor(colWidth / 8.5));
      const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
      return lines * 22 + 34;
    }

    case 'list': {
      const items = section.items || [];
      return items.length * 22 + 18;
    }

    default:
      return 30;
  }
}

/**
 * Splits a long paragraph across a page/column boundary.
 *
 * @param {any} paragraphSection
 * @param {number} availableHeight
 * @param {number} colWidth
 * @returns {{
 *   canSplit: boolean,
 *   part1?: any,
 *   part2?: any
 * }}
 */
export function splitParagraph(paragraphSection, availableHeight, colWidth = COLUMN_WIDTH_PX) {
  const text = paragraphSection.content || '';
  const sentences = splitTextIntoSentences(text);

  // Require at least 2 sentences and at least ~45px available space (approx 2 lines of text)
  if (sentences.length < 2 || availableHeight < 45) {
    return { canSplit: false };
  }

  const charsPerLine = Math.max(28, Math.floor(colWidth / 7.2));
  let accumulatedHeight = 12; // margin-bottom
  let splitIndex = 0;

  for (let i = 0; i < sentences.length; i += 1) {
    const sLines = Math.max(1, Math.ceil(sentences[i].length / charsPerLine));
    const sHeight = sLines * 21;
    if (accumulatedHeight + sHeight <= availableHeight) {
      accumulatedHeight += sHeight;
      splitIndex = i + 1;
    } else {
      break;
    }
  }

  // Must leave at least 1 sentence on part 1 and at least 1 sentence on part 2
  if (splitIndex < 1 || splitIndex >= sentences.length) {
    return { canSplit: false };
  }

  const part1Text = sentences.slice(0, splitIndex).join('').trim();
  const part2Text = sentences.slice(splitIndex).join('').trim();

  return {
    canSplit: true,
    part1: {
      ...paragraphSection,
      content: part1Text,
      html: null,
      isSplitPart: true,
      splitPartNumber: 1,
    },
    part2: {
      ...paragraphSection,
      content: part2Text,
      html: null,
      isSplitPart: true,
      splitPartNumber: 2,
    },
  };
}

/**
 * Splits a list section across a page boundary.
 *
 * @param {any} listSection
 * @param {number} availableHeight
 * @returns {{
 *   canSplit: boolean,
 *   part1?: any,
 *   part2?: any
 * }}
 */
export function splitList(listSection, availableHeight) {
  const items = listSection.items || [];
  if (items.length < 3 || availableHeight < 55) {
    return { canSplit: false };
  }

  const itemHeight = 22;
  const maxItemsFit = Math.floor((availableHeight - 16) / itemHeight);

  if (maxItemsFit < 1 || maxItemsFit >= items.length) {
    return { canSplit: false };
  }

  return {
    canSplit: true,
    part1: {
      ...listSection,
      items: items.slice(0, maxItemsFit),
      isSplitPart: true,
      splitPartNumber: 1,
    },
    part2: {
      ...listSection,
      items: items.slice(maxItemsFit),
      isSplitPart: true,
      splitPartNumber: 2,
    },
  };
}

/**
 * Paginates an array of article sections into discrete A4 magazine pages.
 *
 * @param {{
 *   sections: any[],
 *   heroHeight?: number,
 *   measuredHeights?: Record<string | number, number>,
 *   columnMode?: 'two-column' | 'single-column',
 *   pageHeight?: number,
 *   pagePaddingV?: number,
 *   headerHeight?: number,
 *   footerHeight?: number
 * }} options
 * @returns {Array<{
 *   pageNumber: number,
 *   totalPages: number,
 *   isFirstPage: boolean,
 *   columnHeight: number,
 *   sections: any[]
 * }>}
 */
export function paginateArticleSections(options) {
  const {
    sections = [],
    heroHeight = 0,
    measuredHeights = {},
    columnMode = 'two-column',
    pageHeight = A4_HEIGHT_PX,
    pagePaddingV = DEFAULT_PAGE_PADDING_V,
    headerHeight = DEFAULT_HEADER_HEIGHT,
    footerHeight = DEFAULT_FOOTER_HEIGHT,
  } = options;

  if (!sections || sections.length === 0) {
    return [];
  }

  const usablePageHeight = pageHeight - pagePaddingV - headerHeight - footerHeight;

  // Determine vertical height per column
  const page1ColHeight = Math.max(160, usablePageHeight - heroHeight);
  const contColHeight = usablePageHeight;

  const numColumns = columnMode === 'two-column' ? 2 : 1;

  // Total capacity per page (distributed across columns)
  const page1Capacity = numColumns * page1ColHeight;
  const contCapacity = numColumns * contColHeight;

  const rawPages = [];
  let currentPageSections = [];
  let currentUsedHeight = 0;
  let isFirstPage = true;
  let currentCapacity = page1Capacity;

  // Helper to get element height (either measured or estimated)
  const getSectionHeight = (sec, idx) => {
    const key = sec.id || `sec-${idx}`;
    if (measuredHeights[key] && measuredHeights[key] > 0) {
      return measuredHeights[key];
    }
    return estimateSectionHeight(sec, COLUMN_WIDTH_PX);
  };

  const finalizeCurrentPage = () => {
    rawPages.push({
      pageNumber: rawPages.length + 1,
      isFirstPage,
      columnHeight: isFirstPage ? page1ColHeight : contColHeight,
      sections: [...currentPageSections],
    });

    currentPageSections = [];
    currentUsedHeight = 0;
    isFirstPage = false;
    currentCapacity = contCapacity;
  };

  for (let i = 0; i < sections.length; i += 1) {
    let section = sections[i];
    let height = getSectionHeight(section, i);

    // 1. Orphan Heading Prevention (Keep with Next)
    if (section.type === 'heading' && i < sections.length - 1) {
      const nextSection = sections[i + 1];
      const nextHeight = getSectionHeight(nextSection, i + 1);
      // Require room for heading + at least 50px of following content
      const requiredRoom = height + Math.min(nextHeight, 60);

      if (currentUsedHeight + requiredRoom > currentCapacity && currentPageSections.length > 0) {
        finalizeCurrentPage();
        // Recalculate height on new page if needed
        height = getSectionHeight(section, i);
      }
    }

    // 2. Large Images & Non-splittable Figures
    if (section.type === 'image') {
      // Ensure image height does not exceed a single column height
      const maxImgHeight = isFirstPage ? page1ColHeight - 40 : contColHeight - 40;
      if (height > maxImgHeight) {
        height = maxImgHeight;
      }

      if (currentUsedHeight + height > currentCapacity && currentPageSections.length > 0) {
        finalizeCurrentPage();
        height = getSectionHeight(section, i);
      }

      currentPageSections.push(section);
      currentUsedHeight += height;
      continue;
    }

    // 3. Normal fit check
    if (currentUsedHeight + height <= currentCapacity) {
      currentPageSections.push(section);
      currentUsedHeight += height;
      continue;
    }

    // 4. Content Overflows Current Page Capacity
    const remainingSpace = currentCapacity - currentUsedHeight;

    // Try splitting a paragraph across the page break
    if (section.type === 'paragraph') {
      const splitResult = splitParagraph(section, remainingSpace, COLUMN_WIDTH_PX);
      if (splitResult.canSplit && splitResult.part1 && splitResult.part2) {
        currentPageSections.push(splitResult.part1);
        finalizeCurrentPage();

        // Push part 2 as the first item on the next page
        const part2Height = getSectionHeight(splitResult.part2, i);
        currentPageSections.push(splitResult.part2);
        currentUsedHeight += part2Height;
        continue;
      }
    }

    // Try splitting a list across the page break
    if (section.type === 'list') {
      const splitResult = splitList(section, remainingSpace);
      if (splitResult.canSplit && splitResult.part1 && splitResult.part2) {
        currentPageSections.push(splitResult.part1);
        finalizeCurrentPage();

        const part2Height = getSectionHeight(splitResult.part2, i);
        currentPageSections.push(splitResult.part2);
        currentUsedHeight += part2Height;
        continue;
      }
    }

    // If section cannot be split (or not enough remaining space), move it to next page
    if (currentPageSections.length > 0) {
      finalizeCurrentPage();
    }

    currentPageSections.push(section);
    currentUsedHeight += height;
  }

  if (currentPageSections.length > 0) {
    finalizeCurrentPage();
  }

  // Assign totalPages to all generated pages for dynamic "Page X of Y"
  const totalPages = rawPages.length;
  return rawPages.map((page) => ({
    ...page,
    totalPages,
  }));
}
