import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  A4_HEIGHT_PX,
  COLUMN_WIDTH_PX,
  DEFAULT_FOOTER_HEIGHT,
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_PAGE_PADDING_V,
  paginateArticleSections,
} from '../utils/paginationEngine.js';

/**
 * Custom React hook for layout-aware A4 magazine pagination.
 * Performs a fast initial estimation pass followed by an exact DOM measurement pass.
 *
 * @param {{
 *   article: any,
 *   columnMode: 'two-column' | 'single-column'
 * }} params
 * @returns {{
 *   pages: Array<{
 *     pageNumber: number,
 *     totalPages: number,
 *     isFirstPage: boolean,
 *     columnHeight: number,
 *     sections: any[]
 *   }>,
 *   totalPages: number,
 *   measureContainerRef: React.RefObject<HTMLDivElement | null>,
 *   onMeasureImageLoad: () => void
 * }}
 */
export function useArticlePagination({ article, columnMode = 'two-column' }) {
  const measureContainerRef = useRef(null);
  const [measuredHeights, setMeasuredHeights] = useState({});
  const [measuredHeroHeight, setMeasuredHeroHeight] = useState(0);

  // Fallback hero estimate based on title length and whether thumbnail is present
  const estimatedHeroHeight = useMemo(() => {
    if (!article) return 0;
    let h = 180; // category pill + headline + byline + margins
    if (article.title && article.title.length > 50) h += 40;
    if (article.summary) h += 85;
    if (article.thumbnail) h += 210;
    return h;
  }, [article]);

  // Initial fast pagination pass (so UI is never blank while measuring)
  const initialPages = useMemo(() => {
    if (!article || !article.sections || article.sections.length === 0) {
      return [];
    }

    return paginateArticleSections({
      sections: article.sections,
      heroHeight: measuredHeroHeight || estimatedHeroHeight,
      measuredHeights,
      columnMode,
      pageHeight: A4_HEIGHT_PX,
      pagePaddingV: DEFAULT_PAGE_PADDING_V,
      headerHeight: DEFAULT_HEADER_HEIGHT,
      footerHeight: DEFAULT_FOOTER_HEIGHT,
    });
  }, [article, columnMode, estimatedHeroHeight, measuredHeroHeight, measuredHeights]);

  // Measure actual DOM elements in the hidden measurement container
  const measureDom = useCallback(() => {
    if (!measureContainerRef.current) return;

    const container = measureContainerRef.current;

    // 1. Measure Hero Block
    const heroEl = container.querySelector('[data-measure="hero-block"]');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      const heroH = Math.round(rect.height);
      if (heroH > 0 && heroH !== measuredHeroHeight) {
        setMeasuredHeroHeight(heroH);
      }
    }

    // 2. Measure Each Section Block
    const sectionEls = container.querySelectorAll('[data-measure-section]');
    const newHeights = {};
    let hasChanges = false;

    sectionEls.forEach((el) => {
      const key = el.getAttribute('data-measure-section');
      const rect = el.getBoundingClientRect();
      const h = Math.round(rect.height);
      if (h > 0) {
        newHeights[key] = h;
        if (measuredHeights[key] !== h) {
          hasChanges = true;
        }
      }
    });

    if (hasChanges && Object.keys(newHeights).length > 0) {
      setMeasuredHeights(newHeights);
    }
  }, [measuredHeroHeight, measuredHeights]);

  useLayoutEffect(() => {
    measureDom();
  }, [article?.id, article?.sections, columnMode, measureDom]);

  const onMeasureImageLoad = () => {
    // Re-measure when images in the measurement sandbox finish loading
    measureDom();
  };

  const pages = initialPages;
  const totalPages = pages.length;

  return {
    pages,
    totalPages,
    measureContainerRef,
    onMeasureImageLoad,
  };
}

export { COLUMN_WIDTH_PX };
