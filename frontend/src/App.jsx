import { useState } from 'react';
import { ArticleLibrary } from './components/ArticleLibrary.jsx';
import { ImportArticleModal } from './components/ImportArticleModal.jsx';
import {
  INITIAL_ARTICLES,
  normalizeArticleUrl,
  TEST_FAILURE_URL,
} from './data/mockArticles.js';
import './App.css';

/**
 * Preview thumbnail for the selected article details card.
 * Displays a styled placeholder when the article has no thumbnail or fails to load.
 */
function SelectedArticleThumbnail({ src, title }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const shouldShowImage = Boolean(trimmedSrc) && failedSrc !== trimmedSrc;

  if (!shouldShowImage) {
    return (
      <div
        className="selected-details__thumb-fallback"
        role="img"
        aria-label={`No cover image available for ${title}`}
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
        <span>No thumbnail image provided — using fallback placeholder</span>
      </div>
    );
  }

  return (
    <img
      src={trimmedSrc}
      alt={`Cover preview for ${title}`}
      className="selected-details__thumb-img"
      onError={() => setFailedSrc(trimmedSrc)}
    />
  );
}

export function App() {
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [selectedArticleId, setSelectedArticleId] = useState(
    INITIAL_ARTICLES[0]?.id ?? null
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) || null;

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleSelectArticle = (articleId) => {
    setSelectedArticleId(articleId);
  };

  const handleRemoveArticle = (articleId) => {
    const indexToRemove = articles.findIndex((item) => item.id === articleId);
    if (indexToRemove === -1) return;

    const removedArticle = articles[indexToRemove];
    const nextArticles = articles.filter((item) => item.id !== articleId);

    setArticles(nextArticles);

    if (selectedArticleId === articleId) {
      if (nextArticles.length === 0) {
        setSelectedArticleId(null);
      } else {
        const nextIndex = Math.min(indexToRemove, nextArticles.length - 1);
        setSelectedArticleId(nextArticles[nextIndex].id);
      }
    }

    setStatusNotice({
      type: 'info',
      message: `Removed "${removedArticle.title}" from the library.`,
    });
  };

  const handleImportArticle = (importedArticle) => {
    const incomingUrl = normalizeArticleUrl(importedArticle.sourceUrl);
    const existingDuplicate = articles.find(
      (item) => normalizeArticleUrl(item.sourceUrl) === incomingUrl
    );

    if (existingDuplicate) {
      setSelectedArticleId(existingDuplicate.id);
      setStatusNotice({
        type: 'duplicate',
        message: `"${existingDuplicate.title}" is already in your library. Selected the existing article.`,
      });
      return;
    }

    setArticles((prev) => [importedArticle, ...prev]);
    setSelectedArticleId(importedArticle.id);
    setStatusNotice({
      type: 'success',
      message: `Successfully imported "${importedArticle.title}" into your library.`,
    });
  };

  const handleRestoreDefaults = () => {
    setArticles(INITIAL_ARTICLES);
    setSelectedArticleId(INITIAL_ARTICLES[0]?.id ?? null);
    setStatusNotice({
      type: 'info',
      message: 'Restored default sample articles.',
    });
  };

  return (
    <div className="app-shell">
      {/* Slim Top Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <div className="app-header__logo" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>

          <div className="app-header__meta">
            <span className="app-header__mock-pill">
              <span className="app-header__mock-dot" aria-hidden="true" />
              Mock Import Mode
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Page Heading */}
        <div className="app-page-header">
          <div className="app-page-header__titles">
            <h1 className="app-page-header__heading">Article Management</h1>
            <p className="app-page-header__subtitle">
              Import web articles by URL and curate your issue library before
              magazine layout.
            </p>
          </div>

          <div className="app-page-header__note">
            <span>
              Imports currently use local mock data. Test error handling with{' '}
              <code>{TEST_FAILURE_URL}</code>.
            </span>
          </div>
        </div>

        {/* Status feedback banner */}
        {statusNotice && (
          <div
            className={`app-notice app-notice--${statusNotice.type}`}
            role="status"
            aria-live="polite"
          >
            <span className="app-notice__text">{statusNotice.message}</span>
            <button
              type="button"
              className="app-notice__dismiss"
              onClick={() => setStatusNotice(null)}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Grid: Article Library Sidebar (Primary) + Selected Article Details */}
        <div className="app-workspace">
          <div className="app-workspace__sidebar-col">
            <ArticleLibrary
              articles={articles}
              selectedArticleId={selectedArticleId}
              onSelectArticle={handleSelectArticle}
              onRemoveArticle={handleRemoveArticle}
              onImportClick={handleOpenImportModal}
            />
          </div>

          <section
            className="app-workspace__details-col"
            aria-label="Selected Article Details"
          >
            <div className="selected-details">
              <div className="selected-details__header">
                <h2 className="selected-details__heading">
                  Selected Article Details
                </h2>
                {articles.length !== INITIAL_ARTICLES.length && (
                  <button
                    type="button"
                    className="selected-details__restore-btn"
                    onClick={handleRestoreDefaults}
                  >
                    Restore Sample Library
                  </button>
                )}
              </div>

              {selectedArticle ? (
                <div className="selected-details__body">
                  <div className="selected-details__thumb-frame">
                    <SelectedArticleThumbnail
                      src={selectedArticle.thumbnail}
                      title={selectedArticle.title}
                    />
                  </div>

                  <div className="selected-details__badges">
                    <span className="selected-details__status-badge">
                      Status: {selectedArticle.status || 'Imported'}
                    </span>
                    <span className="selected-details__id-badge">
                      ID: {selectedArticle.id}
                    </span>
                  </div>

                  <h3 className="selected-details__title">
                    {selectedArticle.title}
                  </h3>

                  <dl className="selected-details__meta-list">
                    <div className="selected-details__meta-item">
                      <dt>Author</dt>
                      <dd>{selectedArticle.author || 'Editorial Staff'}</dd>
                    </div>
                    <div className="selected-details__meta-item">
                      <dt>Source URL</dt>
                      <dd>
                        {selectedArticle.sourceUrl ? (
                          <a
                            href={selectedArticle.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="selected-details__source-link"
                          >
                            {selectedArticle.sourceUrl}
                          </a>
                        ) : (
                          <span>Not specified</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="selected-details__actions">
                    <button
                      type="button"
                      className="selected-details__btn selected-details__btn--secondary"
                      onClick={handleOpenImportModal}
                    >
                      Import Another Article
                    </button>
                    <button
                      type="button"
                      className="selected-details__btn selected-details__btn--danger"
                      onClick={() => handleRemoveArticle(selectedArticle.id)}
                    >
                      Remove Selected Article
                    </button>
                  </div>
                </div>
              ) : (
                <div className="selected-details__empty">
                  <p className="selected-details__empty-title">
                    No article currently selected
                  </p>
                  <p className="selected-details__empty-text">
                    Select an item from the Article Library or import a new
                    article URL to inspect its metadata here.
                  </p>
                  <div className="selected-details__empty-actions">
                    <button
                      type="button"
                      className="selected-details__btn selected-details__btn--primary"
                      onClick={handleOpenImportModal}
                    >
                      Import Article
                    </button>
                    {articles.length === 0 && (
                      <button
                        type="button"
                        className="selected-details__btn selected-details__btn--secondary"
                        onClick={handleRestoreDefaults}
                      >
                        Restore Sample Library
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Import Article Modal */}
      <ImportArticleModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onImport={handleImportArticle}
      />
    </div>
  );
}

export default App;
