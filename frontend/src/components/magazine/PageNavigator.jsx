import './PageNavigator.css';

/**
 * PageNavigator renders a horizontal page switcher with page numbers, types,
 * previous/next navigation buttons, and quick jumping across the full magazine document.
 * Supports multi-page article chunks.
 *
 * @param {{
 *   pages: Array<{
 *     id: string,
 *     type: 'cover' | 'toc' | 'article' | 'author',
 *     pageNumber: number,
 *     title: string,
 *     chunkIndex?: number,
 *     totalPagesForArticle?: number
 *   }>,
 *   currentPageId: string,
 *   onSelectPage: (pageId: string) => void
 * }} props
 */
export function PageNavigator({ pages = [], currentPageId, onSelectPage }) {
  const currentIndex = pages.findIndex((p) => p.id === currentPageId);
  const activeIndex = currentIndex !== -1 ? currentIndex : 0;
  const totalPages = pages.length;

  const handlePrev = () => {
    if (activeIndex > 0) {
      onSelectPage(pages[activeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (activeIndex < totalPages - 1) {
      onSelectPage(pages[activeIndex + 1].id);
    }
  };

  const getTypeLabel = (page) => {
    switch (page.type) {
      case 'cover':
        return 'Cover';
      case 'toc':
        return 'TOC';
      case 'author':
        return 'Authors';
      case 'article':
      default:
        if (page.totalPagesForArticle > 1) {
          return `Art ${page.chunkIndex + 1}/${page.totalPagesForArticle}`;
        }
        return 'Article';
    }
  };

  return (
    <nav className="page-navigator" aria-label="Magazine Page Navigation">
      <div className="page-navigator__controls">
        <button
          type="button"
          className="page-nav-arrow-btn"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          title="Previous Page"
          aria-label="Previous Page"
        >
          ‹
        </button>

        <span className="page-navigator__page-count">
          Page <strong>{activeIndex + 1}</strong> of {totalPages}
        </span>

        <button
          type="button"
          className="page-nav-arrow-btn"
          onClick={handleNext}
          disabled={activeIndex >= totalPages - 1}
          title="Next Page"
          aria-label="Next Page"
        >
          ›
        </button>
      </div>

      <div className="page-navigator__strip" role="tablist">
        {pages.map((p) => {
          const isActive = p.id === currentPageId;
          const pageNumStr = String(p.pageNumber).padStart(2, '0');

          return (
            <button
              key={p.id}
              type="button"
              className={`page-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(p.id)}
              role="tab"
              aria-selected={isActive}
              title={`Page ${p.pageNumber}: ${p.title}`}
            >
              <span className="page-chip__num">{pageNumStr}</span>
              <span className="page-chip__type">{getTypeLabel(p)}</span>
              <span className="page-chip__title">{p.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default PageNavigator;
