import { useState } from 'react';
import './ArticleInspector.css';

/**
 * Renders thumbnail with graceful SVG placeholder on error or missing source.
 */
function InspectorThumbnail({ src, title }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const shouldShowImage = Boolean(trimmedSrc) && failedSrc !== trimmedSrc;

  if (!shouldShowImage) {
    return (
      <div
        className="inspector-thumb-fallback"
        role="img"
        aria-label={`No preview image available for ${title}`}
      >
        <svg
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
        <span>No image provided — using fallback placeholder</span>
      </div>
    );
  }

  return (
    <img
      src={trimmedSrc}
      alt={`Cover preview for ${title}`}
      className="inspector-thumb-img"
      onError={() => setFailedSrc(trimmedSrc)}
    />
  );
}

/**
 * Calculates estimated word count from HTML string.
 */
function estimateWordCount(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return 0;
  const stripped = htmlString.replace(/<[^>]*>/g, ' ');
  const words = stripped.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * ArticleInspector renders the Right Sidebar panel of the Web2Mag dashboard.
 * Displays selected article metadata, category, media specs, and A4 layout parameters.
 *
 * @param {{
 *   article?: {
 *     id: string,
 *     title: string,
 *     author?: string,
 *     category?: string,
 *     thumbnail?: string,
 *     featuredImageUrl?: string,
 *     sourceUrl?: string,
 *     status?: string,
 *     contentHtml?: string,
 *     publishDate?: string,
 *     readingTime?: number,
 *     isWordPress?: boolean,
 *     isPage?: boolean
 *   } | null,
 *   onOpenImportModal: () => void,
 *   onRemoveArticle: (id: string) => void,
 *   onRestoreDefaults: () => void,
 *   isModifiedFromDefaults: boolean,
 *   pageNumber?: number,
 *   issueConfig?: {
 *     magazineTitle: string,
 *     volume: string,
 *     issue: string,
 *     date: string,
 *     issn: string,
 *     website: string,
 *     publisher: string
 *   },
 *   currentPage?: {
 *     id: string,
 *     type: string,
 *     pageNumber: number,
 *     title: string
 *   },
 *   totalPages?: number,
 *   onOpenConfigModal?: () => void
 * }} props
 */
export function ArticleInspector({
  article,
  onOpenImportModal,
  onRemoveArticle,
  onRestoreDefaults,
  isModifiedFromDefaults = false,
  pageNumber = 1,
  issueConfig = {
    magazineTitle: 'ENTECH MAGAZINE',
    volume: 'VOLUME 4',
    issue: 'ISSUE 9',
    date: 'September 2026',
    issn: '2584-2749',
    website: 'www.entechonline.com',
  },
  currentPage,
  totalPages = 1,
  onOpenConfigModal,
  onEditArticle,
}) {
  if (!article) {
    return (
      <aside className="article-inspector" aria-label="Article & Layout Inspector">
        <div className="article-inspector__header">
          <h2 className="article-inspector__title">Layout Inspector</h2>
          {onOpenConfigModal && (
            <button
              type="button"
              className="article-inspector__restore-btn"
              onClick={onOpenConfigModal}
              title="Edit Issue Metadata"
            >
              Issue Settings
            </button>
          )}
        </div>
        <div className="article-inspector__body">
          <div className="inspector-empty">
            <svg
              className="inspector-empty__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3 className="inspector-empty__title">No Article Selected</h3>
            <p className="inspector-empty__text">
              Select an item from the Article Library sidebar or switch pages using the Page Navigator above.
            </p>
            <div className="inspector-empty__actions">
              <button
                type="button"
                className="inspector-btn inspector-btn--secondary"
                onClick={onOpenImportModal}
              >
                Import Article
              </button>
              {isModifiedFromDefaults && (
                <button
                  type="button"
                  className="inspector-btn inspector-btn--secondary"
                  onClick={onRestoreDefaults}
                >
                  Restore Sample Library
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const wordCount = estimateWordCount(article.contentHtml);
  const readingTime = article.readingTime
    ? `${article.readingTime} min read`
    : wordCount > 0
    ? `${Math.ceil(wordCount / 200)} min read`
    : '—';
  const hasBodyContent = Boolean(article.contentHtml && article.contentHtml.trim());
  const imageSource = article.featuredImageUrl || article.thumbnail || '';

  return (
    <aside className="article-inspector" aria-label="Article & Layout Inspector">
      {/* Header */}
      <div className="article-inspector__header">
        <div className="article-inspector__heading-group">
          <h2 className="article-inspector__title">Layout Inspector</h2>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onOpenConfigModal && (
            <button
              type="button"
              className="article-inspector__restore-btn"
              onClick={onOpenConfigModal}
              title="Edit Issue Settings"
            >
              Settings
            </button>
          )}
          {isModifiedFromDefaults && (
            <button
              type="button"
              className="article-inspector__restore-btn"
              onClick={onRestoreDefaults}
              title="Restore original sample articles"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="article-inspector__body">
        {/* Section 1: Selected Article Metadata */}
        <section className="inspector-section" aria-label="Article Metadata">
          <h3 className="inspector-section__title">Article Metadata</h3>

          <div className="inspector-article-header">
            <div className="inspector-badges-row">
              <span className="inspector-badge inspector-badge--status">
                {article.status || 'Imported'}
              </span>
              <span className="inspector-badge inspector-badge--category">
                {article.category || 'EDITORIAL'}
              </span>
              <span className="inspector-badge inspector-badge--id">
                {article.id}
              </span>
            </div>

            <h4 className="inspector-article-title">{article.title}</h4>

            <div className="inspector-meta-row">
              <span className="inspector-meta-label">Author</span>
              <span className="inspector-meta-value">
                {article.author || 'Editorial Staff'}
              </span>
            </div>

            {article.publishDate && (
              <div className="inspector-meta-row">
                <span className="inspector-meta-label">Published</span>
                <span className="inspector-meta-value">
                  {new Date(article.publishDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            <div className="inspector-meta-row">
              <span className="inspector-meta-label">Source URL</span>
              {article.sourceUrl ? (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inspector-source-link"
                  title="Open source URL in new tab"
                >
                  <span>{article.sourceUrl}</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ) : (
                <span className="inspector-meta-value">Not provided</span>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Featured Media */}
        <section className="inspector-section" aria-label="Featured Media">
          <h3 className="inspector-section__title">Featured Media</h3>
          <div className="inspector-thumb-frame">
            <InspectorThumbnail src={imageSource} title={article.title} />
          </div>
          <div className="inspector-media-meta">
            <span>
              {imageSource ? 'Cover Media Attached' : 'Fallback Graphic Active'}
            </span>
            <span>A4 Column Span</span>
          </div>
        </section>

        {/* Section 3: Magazine Layout Specifications */}
        <section className="inspector-section" aria-label="Layout Parameters">
          <h3 className="inspector-section__title">Issue &amp; Layout Specs</h3>
          <div className="inspector-specs-table">
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Publication</span>
              <span className="inspector-spec-value">{issueConfig.magazineTitle}</span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Issue Edition</span>
              <span className="inspector-spec-value">
                {issueConfig.date} ({issueConfig.volume})
              </span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Target Format</span>
              <span className="inspector-spec-value">A4 Portrait (210×297mm)</span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Current View</span>
              <span className="inspector-spec-value">
                {currentPage ? `${currentPage.title} (Page ${currentPage.pageNumber}/${totalPages})` : `Page ${pageNumber}`}
              </span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Word Count</span>
              <span className="inspector-spec-value">
                {wordCount > 0 ? `${wordCount} words` : 'Draft / Empty'}
              </span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Reading Time</span>
              <span className="inspector-spec-value">{readingTime}</span>
            </div>
            <div className="inspector-spec-item">
              <span className="inspector-spec-label">Print Status</span>
              {hasBodyContent ? (
                <span className="inspector-spec-pill">Ready For Print</span>
              ) : (
                <span className="inspector-spec-pill inspector-spec-pill--draft">
                  Draft Placeholder
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Actions */}
        <section className="inspector-section" aria-label="Article Actions">
          <div className="inspector-actions">
            {onEditArticle && (
              <button
                type="button"
                className="inspector-btn inspector-btn--primary"
                onClick={() => onEditArticle(article)}
                title="Edit article headline, author, paragraphs, and images"
              >
                ✍️ Edit Article &amp; Blocks
              </button>
            )}
            <button
              type="button"
              className="inspector-btn inspector-btn--secondary"
              onClick={onOpenImportModal}
            >
              Import Another Article
            </button>
            <button
              type="button"
              className="inspector-btn inspector-btn--danger"
              onClick={() => onRemoveArticle(article.id)}
            >
              Remove Selected Article
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}

export default ArticleInspector;
