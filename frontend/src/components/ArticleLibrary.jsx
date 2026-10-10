import { useState } from 'react';
import './ArticleLibrary.css';

/**
 * Maps an article status string to a semantic modifier class.
 * @param {string} status
 * @returns {string}
 */
function getStatusModifier(status) {
  const normalized = (status || '').toLowerCase().trim();
  if (normalized === 'ready') return 'article-card__status--ready';
  if (normalized === 'imported') return 'article-card__status--imported';
  if (normalized === 'needs review' || normalized === 'review') {
    return 'article-card__status--review';
  }
  return 'article-card__status--default';
}

/**
 * Renders an article thumbnail with an automatic styled fallback placeholder
 * when the image URL is empty or fails to load. Never displays a broken-image icon.
 */
function ArticleThumbnail({ src, title }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const shouldShowImage = Boolean(trimmedSrc) && failedSrc !== trimmedSrc;

  if (!shouldShowImage) {
    return (
      <div
        className="article-card__thumb-placeholder"
         role="img"
        aria-label={`No thumbnail available for ${title}`}
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
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
 * Displays the collection of imported articles, supports selection and removal,
 * handles missing/broken thumbnails, and renders an empty state when no articles exist.
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
 *   onImportClick: () => void
 * }} props
 */
export function ArticleLibrary({
  articles = [],
  selectedArticleId = null,
  onSelectArticle,
  onRemoveArticle,
  onImportClick,
}) {
  const count = articles.length;
  const countText = `${count} ${count === 1 ? 'article' : 'articles'}`;

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
            Select an article to inspect or manage issue content
          </p>
        </div>

        <button
          type="button"
          className="article-library__import-btn"
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
          <span>Import Article</span>
        </button>
      </div>

      {/* Article List or Empty State */}
      <div className="article-library__body">
        {count === 0 ? (
          <div className="article-library__empty">
            <div className="article-library__empty-illustration" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
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
              Import web articles by URL to build your issue library and prepare
              editorial content for magazine layout.
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
            {articles.map((article) => {
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

                    {/* Remove Action */}
                    <div className="article-card__actions">
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
                        <span className="article-card__remove-label">Remove</span>
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
