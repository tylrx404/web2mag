import './PageThumbnailsSidebar.css';

/**
 * Left sidebar displaying live A4 page thumbnails and page management actions
 * (selection, reordering, adding blank pages, deleting pages).
 *
 * @param {{
 *   pages: Array<{
 *     pageNumber: number,
 *     totalPages: number,
 *     isFirstPage: boolean,
 *     sections: any[]
 *   }>,
 *   activePageNumber: number,
 *   onSelectPage: (pageNumber: number) => void,
 *   onMovePageUp: (pageNumber: number) => void,
 *   onMovePageDown: (pageNumber: number) => void,
 *   onDeletePageClick: (pageNumber: number) => void,
 *   onAddBlankPage: () => void,
 *   articleTitle: string
 * }} props
 */
export function PageThumbnailsSidebar({
  pages = [],
  activePageNumber = 1,
  onSelectPage,
  onMovePageUp,
  onMovePageDown,
  onDeletePageClick,
  onAddBlankPage,
  articleTitle = 'Article',
}) {
  const totalPages = pages.length;

  return (
    <aside className="page-thumbnails-sidebar" aria-label="Magazine Page Thumbnails">
      <div className="page-thumbnails-sidebar__header">
        <div className="page-thumbnails-sidebar__titles">
          <h3 className="page-thumbnails-sidebar__title">Page Manager</h3>
          <span className="page-thumbnails-sidebar__count">
            {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <button
          type="button"
          className="page-thumbnails-sidebar__add-btn"
          onClick={onAddBlankPage}
          title="Add a new blank A4 page"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="10" y1="4" x2="10" y2="16" />
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
          <span>Add Page</span>
        </button>
      </div>

      <div className="page-thumbnails-sidebar__list" role="list">
        {pages.map((page, idx) => {
          const isActive = page.pageNumber === activePageNumber;
          const isFirst = idx === 0;
          const isLast = idx === pages.length - 1;

          // Extract preview excerpt for the thumbnail
          const firstHeading = page.sections?.find((s) => s.type === 'heading')?.content;
          const firstParagraph = page.sections?.find((s) => s.type === 'paragraph')?.content;
          const hasImage = page.isFirstPage || page.sections?.some((s) => s.type === 'image');

          return (
            <div
              key={`thumb-${page.pageNumber}`}
              className={`page-thumb-card ${
                isActive ? 'page-thumb-card--active' : ''
              }`}
              onClick={() => onSelectPage(page.pageNumber)}
              role="listitem"
            >
              {/* Thumbnail Miniature Header */}
              <div className="page-thumb-card__header">
                <span className="page-thumb-card__label">
                  Page {page.pageNumber} of {totalPages}
                </span>

                <div
                  className="page-thumb-card__actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="page-thumb-card__action-btn"
                    onClick={() => onMovePageUp(page.pageNumber)}
                    disabled={isFirst}
                    title="Move page up in spread"
                    aria-label={`Move Page ${page.pageNumber} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="page-thumb-card__action-btn"
                    onClick={() => onMovePageDown(page.pageNumber)}
                    disabled={isLast}
                    title="Move page down in spread"
                    aria-label={`Move Page ${page.pageNumber} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="page-thumb-card__action-btn page-thumb-card__action-btn--delete"
                    onClick={() => onDeletePageClick(page.pageNumber)}
                    disabled={totalPages <= 1}
                    title="Delete this page"
                    aria-label={`Delete Page ${page.pageNumber}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Miniature A4 Visual Preview */}
              <div className="page-thumb-card__preview">
                <div className="page-thumb-mini">
                  {/* Miniature Header */}
                  <div className="page-thumb-mini__header" />

                  {/* Page 1 Mini Hero representation */}
                  {page.isFirstPage ? (
                    <div className="page-thumb-mini__hero">
                      <div className="page-thumb-mini__kicker" />
                      <div className="page-thumb-mini__title" />
                      {hasImage && <div className="page-thumb-mini__image" />}
                    </div>
                  ) : (
                    <div className="page-thumb-mini__cont-header">
                      <div className="page-thumb-mini__rule" />
                    </div>
                  )}

                  {/* Miniature 2-Column Text Representation */}
                  <div className="page-thumb-mini__columns">
                    <div className="page-thumb-mini__col">
                      <div className="page-thumb-mini__line page-thumb-mini__line--h" />
                      <div className="page-thumb-mini__line" />
                      <div className="page-thumb-mini__line" />
                      <div className="page-thumb-mini__line page-thumb-mini__line--short" />
                    </div>
                    <div className="page-thumb-mini__col">
                      <div className="page-thumb-mini__line" />
                      <div className="page-thumb-mini__line" />
                      <div className="page-thumb-mini__line" />
                      <div className="page-thumb-mini__line page-thumb-mini__line--short" />
                    </div>
                  </div>

                  {/* Miniature Footer */}
                  <div className="page-thumb-mini__footer">
                    <span className="page-thumb-mini__page-num">{page.pageNumber}</span>
                  </div>
                </div>
              </div>

              {/* Summary Text */}
              <div className="page-thumb-card__info">
                <strong className="page-thumb-card__snippet-title">
                  {page.isFirstPage ? articleTitle : firstHeading || `Continuation Page ${page.pageNumber}`}
                </strong>
                {firstParagraph && (
                  <p className="page-thumb-card__snippet-text">
                    {firstParagraph.slice(0, 75)}...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default PageThumbnailsSidebar;
