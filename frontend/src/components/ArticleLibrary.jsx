import { useState } from 'react';
import './ArticleLibrary.css';

/**
 * Thumbnail component with fallback handling for missing or broken image URLs.
 */
function ArticleThumbnail({ src, title }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const isFailed = failedSrc !== null && failedSrc === trimmedSrc;

  if (!trimmedSrc || isFailed) {
    return (
      <div
        className="article-card__thumb-placeholder"
        aria-label={`Placeholder for ${title}`}
      >
        <svg
          className="article-card__placeholder-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="article-card__placeholder-label">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={trimmedSrc}
      alt={`Thumbnail for ${title}`}
      className="article-card__thumb-img"
      loading="lazy"
      onError={() => setFailedSrc(trimmedSrc)}
    />
  );
}

/**
 * Reusable Article Library Sidebar component.
 * Displays the collection of imported articles, supports selection, reordering,
 * editing, creation of blank stories, and removal.
 *
 * @param {{
 *   articles: Array<{
 *     id: string,
 *     title: string,
 *     author: string,
 *     thumbnail?: string,
 *     sourceUrl?: string,
 *     status?: string
 *   }>,
 *   selectedArticleId: string | null,
 *   onSelectArticle: (id: string) => void,
 *   onRemoveArticle: (id: string) => void,
 *   onImportClick: () => void,
 *   onMoveArticle?: (id: string, direction: 'up' | 'down') => void,
 *   onEditArticle?: (article: object) => void,
 *   onCreateArticle?: () => void
 * }} props
 */
export function ArticleLibrary({
  articles = [],
  selectedArticleId = null,
  onSelectArticle,
  onRemoveArticle,
  onImportClick,
  onMoveArticle,
  onEditArticle,
  onCreateArticle,
}) {
  const count = articles.length;
  const countText = `${count} ${count === 1 ? 'article' : 'articles'}`;

  const getStatusModifier = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'ready':
        return 'article-card__status--ready';
      case 'edited':
        return 'article-card__status--ready';
      case 'imported':
        return 'article-card__status--imported';
      case 'needs review':
        return 'article-card__status--review';
      default:
        return 'article-card__status--default';
    }
  };

  return (
    <aside className="article-library" aria-label="Article Library">
      {/* Sidebar Header */}
      <div className="article-library__header">
        <div className="article-library__title-group">
          <div className="article-library__heading-row">
            <h2 className="article-library__title">Article Library</h2>
            <span
              className="article-library__count-badge"
              aria-label={`${countText} in library`}
            >
              {countText}
            </span>
          </div>
          <p className="article-library__subtitle">
            Select an article to inspect, reorder, edit, or paginate
          </p>
        </div>

        <div className="article-library__header-actions">
          <button
            type="button"
            className="article-library__import-btn"
            onClick={onImportClick}
            title="Import an article from web URL or WordPress"
          >
            <svg
              className="article-library__btn-icon"
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
            <span>Import</span>
          </button>

          {onCreateArticle && (
            <button
              type="button"
              className="article-library__new-btn"
              onClick={onCreateArticle}
              title="Create a new blank article story in this issue"
            >
              <span>+ Story</span>
            </button>
          )}
        </div>
      </div>

      {/* Article List or Empty State */}
      <div className="article-library__body">
        {count === 0 ? (
          <div className="article-library__empty">
            <div className="article-library__empty-icon" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="8" y="6" width="32" height="36" rx="4" />
                <line x1="15" y1="15" x2="33" y2="15" />
                <line x1="15" y1="22" x2="33" y2="22" />
                <line x1="15" y1="29" x2="25" y2="29" />
              </svg>
            </div>
            <h3 className="article-library__empty-title">
              No articles imported yet
            </h3>
            <p className="article-library__empty-desc">
              Import web articles by URL or add a new story to build your issue library.
            </p>
            <button
              type="button"
              className="article-library__empty-cta"
              onClick={onImportClick}
            >
              <svg
                className="article-library__btn-icon"
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
              <span>Import your first article</span>
            </button>
          </div>
        ) : (
          <ul className="article-library__list" role="list">
            {articles.map((article, idx) => {
              const isSelected = article.id === selectedArticleId;
              const statusLabel = article.status || 'Imported';

              return (
                <li key={article.id} className="article-library__item">
                  <div
                    className={`article-card ${
                      isSelected ? 'article-card--selected' : ''
                    }`}
                    onClick={() => onSelectArticle?.(article.id)}
                  >
                    {/* Thumbnail */}
                    <div className="article-card__thumb">
                      <ArticleThumbnail
                        src={article.thumbnail}
                        title={article.title}
                      />
                    </div>

                    {/* Content */}
                    <div className="article-card__content">
                      <div className="article-card__top-row">
                        <span
                          className={`article-card__status ${getStatusModifier(
                            statusLabel
                          )}`}
                        >
                          {statusLabel}
                        </span>

                        {isSelected && (
                          <span className="article-card__selected-pill">
                            Selected
                          </span>
                        )}
                      </div>

                      <h3 className="article-card__title-heading">
                        <button
                          type="button"
                          className="article-card__title-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectArticle?.(article.id);
                          }}
                          aria-pressed={isSelected}
                          title={article.title}
                        >
                          {article.title}
                        </button>
                      </h3>

                      <div className="article-card__meta-row">
                        <span className="article-card__author">
                          By {article.author || 'Editorial Staff'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Reorder, Edit, Remove */}
                    <div className="article-card__actions">
                      {onMoveArticle && (
                        <div className="article-card__order-group">
                          <button
                            type="button"
                            className="article-card__order-btn"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveArticle(article.id, 'up');
                            }}
                            title="Move article earlier in issue"
                            aria-label="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="article-card__order-btn"
                            disabled={idx === articles.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveArticle(article.id, 'down');
                            }}
                            title="Move article later in issue"
                            aria-label="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      )}

                      {onEditArticle && (
                        <button
                          type="button"
                          className="article-card__edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditArticle(article);
                          }}
                          title="Edit article text, images and blocks"
                          aria-label="Edit Article"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="article-card__remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveArticle?.(article.id);
                        }}
                        aria-label={`Remove "${article.title}"`}
                        title="Remove article from library"
                      >
                        <svg
                          className="article-card__remove-icon"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 17 6" />
                          <path d="M15 6v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m2.5 0V4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12.5 4v2" />
                          <line x1="8.5" y1="9.5" x2="8.5" y2="14" />
                          <line x1="11.5" y1="9.5" x2="11.5" y2="14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default ArticleLibrary;
