import { useState } from 'react';
import './EditorialDashboard.css';

/**
 * EditorialDashboard
 * A high-end, premium editorial publishing dashboard for Web2Mag.
 * Features an editorial hero with a prominent URL importer, verified sample pills,
 * real article project cards, issue metadata badge, and empty states.
 */
export function EditorialDashboard({
  articles = [],
  selectedArticleId,
  onSelectArticle,
  onOpenEditor,
  onOpenPreview,
  onOpenImportModal,
  onOpenConfigModal,
  onImportUrl,
  onRemoveArticle,
  onRestoreDefaults,
  onExportPdf,
  issueConfig = {},
  isImporting = false,
  isExporting = false,
  statusNotice = null,
  onClearNotice,
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [localError, setLocalError] = useState('');

  const quickUrls = [
    {
      label: 'Vivek Khatri (ENTECH)',
      url: 'https://entechonline.com/do-you-understand-your-code/',
      desc: '38 sections • Race conditions & system understandability',
    },
    {
      label: 'PCB Manufacturing',
      url: 'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/',
      desc: 'Technical fabrication • DFM & circuit traces',
    },
    {
      label: 'Nature Science',
      url: 'https://www.nature.com/articles/d41586-026-03543-9',
      desc: 'General semantic article • Science leaders',
    },
  ];

  const handleQuickUrlClick = (url) => {
    setInputUrl(url);
    setLocalError('');
  };

  const handleSubmitUrl = async (e) => {
    e?.preventDefault();
    const targetUrl = inputUrl.trim();
    if (!targetUrl) {
      setLocalError('Please enter a valid article URL to import.');
      return;
    }
    setLocalError('');
    if (onImportUrl) {
      await onImportUrl(targetUrl);
    }
  };

  return (
    <div className="editorial-dashboard">
      {/* 1. HERO MASTHEAD & PROMINENT URL IMPORTER */}
      <section className="dashboard-hero" aria-label="Magazine Studio Hero">
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__masthead">
            <span className="dashboard-hero__eyebrow">
              EDITORIAL PUBLISHING STUDIO • A4 PRINT & DIGITAL
            </span>
            <h1 className="dashboard-hero__title">
              Transform Web Articles into Luxury Magazine Spreads
            </h1>
            <p className="dashboard-hero__subtitle">
              Convert any WordPress post or web article into an authentic, multi-page
              A4 publication with typographic hierarchy, balanced columns, and print-ready vector PDF export.
            </p>
          </div>

          {/* Prominent URL Importer Box */}
          <div className="dashboard-hero__importer">
            <form className="importer-bar" onSubmit={handleSubmitUrl}>
              <div className="importer-bar__input-wrapper">
                <svg
                  className="importer-bar__icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  className="importer-bar__input"
                  placeholder="Paste article URL (e.g. https://entechonline.com/do-you-understand-your-code/)"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (localError) setLocalError('');
                  }}
                  disabled={isImporting}
                  aria-label="Article URL input"
                />
                {inputUrl && !isImporting && (
                  <button
                    type="button"
                    className="importer-bar__clear-btn"
                    onClick={() => setInputUrl('')}
                    aria-label="Clear URL input"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={`importer-bar__btn ${isImporting ? 'importer-bar__btn--loading' : ''}`}
                disabled={isImporting || !inputUrl.trim()}
              >
                {isImporting ? (
                  <>
                    <span className="dashboard-spinner" aria-hidden="true" />
                    <span>Importing Article...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                    <span>Import & Edit</span>
                  </>
                )}
              </button>
            </form>

            {/* Local Error feedback */}
            {localError && (
              <div className="importer-error" role="alert">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{localError}</span>
              </div>
            )}

            {/* Verified Sample Pills */}
            <div className="importer-quick">
              <span className="importer-quick__label">Quick import real stories:</span>
              <div className="importer-quick__pills">
                {quickUrls.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`importer-quick__pill ${inputUrl === item.url ? 'importer-quick__pill--active' : ''}`}
                    onClick={() => handleQuickUrlClick(item.url)}
                    title={item.desc}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STORIES & PROJECTS SECTION */}
      <section className="dashboard-stories" aria-label="Magazine Stories and Projects">
        <div className="dashboard-stories__header">
          <div className="dashboard-stories__title-group">
            <h2 className="dashboard-stories__heading">Curated Stories in Issue</h2>
            <span className="dashboard-stories__count">
              {articles.length} {articles.length === 1 ? 'Story' : 'Stories'}
            </span>
          </div>
        </div>

        {/* Real Article Cards Grid */}
        {articles.length > 0 ? (
          <div className="stories-grid">
            {articles.map((art, index) => {
              const isSelected = art.id === selectedArticleId;
              const wordCount = art.stats?.wordCount || (art.sections?.length ? art.sections.length * 40 : 800);
              const readTime = art.stats?.readingTimeMinutes || art.readingTime || Math.max(1, Math.round(wordCount / 200));
              const estimatedPages = Math.max(4, Math.min(6, Math.ceil((art.sections?.length || 10) / 8) + 2));

              return (
                <article
                  key={art.id}
                  className={`story-card ${isSelected ? 'story-card--selected' : ''}`}
                  onClick={() => onSelectArticle?.(art.id)}
                >
                  <div className="story-card__thumb-frame">
                    {art.thumbnail ? (
                      <img
                        src={art.thumbnail}
                        alt={`Cover for ${art.title}`}
                        className="story-card__img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="story-card__no-thumb">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Editorial Layout</span>
                      </div>
                    )}

                    <div className="story-card__badges">
                      <span className="story-card__badge story-card__badge--status">
                        {art.status || 'Ready'}
                      </span>
                      <span className="story-card__badge story-card__badge--spread">
                        ~{estimatedPages} Pages A4
                      </span>
                    </div>
                  </div>

                  <div className="story-card__body">
                    <div className="story-card__meta-top">
                      <span className="story-card__category">
                        {art.category || 'COVER STORY'}
                      </span>
                      <span className="story-card__read-time">
                        {readTime} min read • {wordCount} words
                      </span>
                    </div>

                    <h3 className="story-card__title">
                      {art.title}
                    </h3>

                    <p className="story-card__byline">
                      By <strong>{art.author || 'Editorial Staff'}</strong>
                      {art.formattedDate ? ` • ${art.formattedDate}` : ''}
                    </p>

                    {art.summary && (
                      <p className="story-card__summary">
                        {art.summary}
                      </p>
                    )}

                    {art.sourceUrl && (
                      <a
                        href={art.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="story-card__source-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        <span>{art.sourceUrl}</span>
                      </a>
                    )}

                    <div className="story-card__actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="dashboard-btn dashboard-btn--primary story-card__edit-btn"
                        onClick={() => onOpenEditor?.(art)}
                        title="Open interactive React visual magazine editor"
                      >
                        <svg
                          width="14"
                          height="14"
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
                        <span>Open Visual Editor</span>
                      </button>

                      <button
                        type="button"
                        className="dashboard-btn dashboard-btn--secondary"
                        onClick={() => onOpenPreview?.(art)}
                        title="View reader preview"
                      >
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        className="dashboard-btn dashboard-btn--danger"
                        onClick={() => onRemoveArticle?.(art.id)}
                        title="Remove article from issue"
                        aria-label="Remove article"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* 4. TASTEFUL EMPTY STATE */
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon" aria-hidden="true">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="dashboard-empty__title">Your Magazine Issue is Empty</h3>
            <p className="dashboard-empty__text">
              Paste an article link in the bar above to automatically generate an editorial spread,
              or restore the featured ENTECH cover story.
            </p>
            <div className="dashboard-empty__actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn--primary"
                onClick={onRestoreDefaults}
              >
                Restore Featured Cover Story
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn--secondary"
                onClick={onOpenImportModal}
              >
                Import from Custom URL
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
export default EditorialDashboard;
