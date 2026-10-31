import { useRef, useState } from 'react';
import { COLUMN_WIDTH_PX, useArticlePagination } from '../hooks/useArticlePagination.js';
import { exportMagazineToPdf } from '../utils/pdfExportClient.js';
import { MagazinePage } from './MagazinePage.jsx';
import './MagazinePreview.css';

/**
 * Reusable MagazinePreview component for Phase 2:
 * Automatic Pagination & Text Overflow Engine.
 *
 * @param {{
 *   article: any,
 *   onImportClick?: () => void
 * }} props
 */
export function MagazinePreview({ article, onImportClick }) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [columnMode, setColumnMode] = useState('two-column'); // 'two-column' | 'single-column'
  const [selectedPageIndex, setSelectedPageIndex] = useState(0); // 0 = All Pages, 1 = Page 1, etc.
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportNotice, setExportNotice] = useState(null);

  const canvasContainerRef = useRef(null);

  const { pages, totalPages, measureContainerRef, onMeasureImageLoad } = useArticlePagination({
    article,
    columnMode,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (isExporting || !article) return;
    setIsExporting(true);
    setExportNotice(null);

    const result = await exportMagazineToPdf({
      containerEl: canvasContainerRef.current,
      article,
      columnMode,
      onProgress: (status) => setExportProgressText(status),
    });

    setIsExporting(false);

    if (result.success) {
      const seconds = (result.durationMs / 1000).toFixed(2);
      setExportNotice({
        type: 'success',
        message: `High-resolution A4 PDF exported in ${seconds}s as "${result.filename}"`,
      });
      setTimeout(() => setExportNotice(null), 7000);
    } else {
      setExportNotice({
        type: 'error',
        message: `Export failed: ${result.error}`,
      });
    }
  };

  const handleZoomChange = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 60), 140));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  if (!article) {
    return (
      <div className="magazine-preview-container magazine-preview-container--empty">
        <div className="magazine-empty-state">
          <div className="magazine-empty-state__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </div>
          <h3 className="magazine-empty-state__title">No Article Selected</h3>
          <p className="magazine-empty-state__desc">
            Select an article from your library or import a new WordPress URL to
            render the automatic A4 two-column paginated layout.
          </p>
          {onImportClick && (
            <button
              type="button"
              className="magazine-empty-state__btn"
              onClick={onImportClick}
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
              <span>Import Article by URL</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const wordCount = article.stats?.wordCount || 850;
  const readingTime = article.stats?.readingTimeMinutes || 4;

  let sourceDomain = 'entechonline.com';
  try {
    if (article.sourceUrl) {
      sourceDomain = new URL(article.sourceUrl).hostname.replace(/^www\./i, '');
    }
  } catch {
    // Keep fallback
  }

  // Filter pages to display: either all pages or a single selected page
  const pagesToDisplay =
    selectedPageIndex === 0
      ? pages
      : pages.filter((p) => p.pageNumber === selectedPageIndex);

  return (
    <div className="magazine-preview-container">
      {/* Top Toolbar */}
      <div className="magazine-toolbar">
        <div className="magazine-toolbar__group">
          <span className="magazine-toolbar__badge">
            A4 Magazine Layout (210 × 297 mm)
          </span>
          <span className="magazine-toolbar__pagination-badge">
            {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} (Auto-Paginated)
          </span>
          <span className="magazine-toolbar__meta">
            {wordCount} words • ~{readingTime} min read
          </span>
        </div>

        <div className="magazine-toolbar__actions">
          {/* Column Mode Toggle */}
          <div className="magazine-toolbar__btn-group">
            <button
              type="button"
              className={`magazine-toolbar__btn ${
                columnMode === 'two-column' ? 'magazine-toolbar__btn--active' : ''
              }`}
              onClick={() => setColumnMode('two-column')}
              title="Two-column balanced layout"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="5" height="12" rx="1" />
                <rect x="9" y="2" width="5" height="12" rx="1" />
              </svg>
              <span>2-Column</span>
            </button>
            <button
              type="button"
              className={`magazine-toolbar__btn ${
                columnMode === 'single-column' ? 'magazine-toolbar__btn--active' : ''
              }`}
              onClick={() => setColumnMode('single-column')}
              title="Single-column wide layout"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="12" height="12" rx="1" />
              </svg>
              <span>1-Column</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="magazine-toolbar__btn-group">
            <button
              type="button"
              className="magazine-toolbar__btn"
              onClick={() => handleZoomChange(-10)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="magazine-toolbar__btn magazine-toolbar__btn--label"
              onClick={handleZoomReset}
              title="Reset zoom to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              className="magazine-toolbar__btn"
              onClick={() => handleZoomChange(10)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {/* Dynamic Multi-Page Sheet Switcher */}
          {totalPages > 1 && (
            <div className="magazine-toolbar__btn-group">
              <button
                type="button"
                className={`magazine-toolbar__btn ${
                  selectedPageIndex === 0 ? 'magazine-toolbar__btn--active' : ''
                }`}
                onClick={() => setSelectedPageIndex(0)}
                title="View all sheets sequentially"
              >
                All Sheets
              </button>
              {pages.map((p) => (
                <button
                  key={`btn-page-${p.pageNumber}`}
                  type="button"
                  className={`magazine-toolbar__btn ${
                    selectedPageIndex === p.pageNumber
                      ? 'magazine-toolbar__btn--active'
                      : ''
                  }`}
                  onClick={() => setSelectedPageIndex(p.pageNumber)}
                >
                  Page {p.pageNumber}
                </button>
              ))}
            </div>
          )}

          {/* Print Fallback */}
          <button
            type="button"
            className="magazine-toolbar__btn"
            onClick={handlePrint}
            title="Print using browser dialog"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="5 7 5 3 15 3 15 7" />
              <path d="M5 13H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1" />
              <rect x="5" y="11" width="10" height="6" rx="1" />
            </svg>
            <span>Print</span>
          </button>

          {/* Export PDF Server Button */}
          <button
            type="button"
            className={`magazine-toolbar__btn magazine-toolbar__btn--primary ${
              isExporting ? 'magazine-toolbar__btn--loading' : ''
            }`}
            onClick={handleExportPdf}
            disabled={isExporting}
            title="Export high-resolution multi-page A4 PDF using Headless Chrome"
          >
            {isExporting ? (
              <>
                <span className="editor-btn__spinner" aria-hidden="true" />
                <span>{exportProgressText || 'Exporting PDF...'}</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden="true"
                >
                  <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-4-4z" />
                  <polyline points="9 2 9 6 13 6" />
                  <path d="M8 8v4m-2-2 2 2 2-2" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Export Feedback Banner */}
      {exportNotice && (
        <div
          className={`editor-export-banner editor-export-banner--${exportNotice.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{exportNotice.message}</span>
          <button
            type="button"
            className="editor-export-banner__dismiss"
            onClick={() => setExportNotice(null)}
            aria-label="Dismiss export notice"
          >
            &times;
          </button>
        </div>
      )}

      {/* Scalable Viewport */}
      <div className="magazine-viewport">
        <div
          className="magazine-canvas"
          ref={canvasContainerRef}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {pagesToDisplay.map((page) => (
            <MagazinePage
              key={`sheet-${article.id || 'current'}-${page.pageNumber}`}
              article={article}
              pageNumber={page.pageNumber}
              totalPages={totalPages}
              isFirstPage={page.isFirstPage}
              columnMode={columnMode}
              columnHeight={page.columnHeight}
              sections={page.sections}
              sourceDomain={sourceDomain}
            />
          ))}
        </div>
      </div>

      {/* Hidden Measurement Sandbox (Offscreen) */}
      <div
        ref={measureContainerRef}
        className="magazine-measurement-sandbox"
        aria-hidden="true"
      >
        {/* Page 1 Hero Block measurement */}
        <div data-measure="hero-block" className="magazine-hero-block" style={{ width: '658px' }}>
          <div className="magazine-category-pill">
            {(article.category || 'FEATURE FOCUS').toUpperCase()}
          </div>
          <h1 className="magazine-headline">{article.title}</h1>
          <div className="magazine-byline-bar">
            <span>Written By: {article.author || 'Editorial Staff'}</span>
          </div>
          {article.summary && (
            <div className="magazine-standfirst">
              <p className="magazine-standfirst__text">{article.summary}</p>
            </div>
          )}
          {article.thumbnail && (
            <figure className="magazine-featured-figure">
              <img
                src={article.thumbnail}
                alt=""
                className="magazine-featured-figure__img"
                onLoad={onMeasureImageLoad}
              />
            </figure>
          )}
        </div>

        {/* Column-width section items measurement */}
        <div
          className="magazine-measurement-column"
          style={{ width: `${COLUMN_WIDTH_PX}px` }}
        >
          {article.sections?.map((sec, idx) => (
            <div
              key={`m-sec-${idx}`}
              data-measure-section={sec.id || `sec-${idx}`}
            >
              <RenderMeasurementItem section={sec} onImageLoad={onMeasureImageLoad} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders an individual section in the measurement sandbox.
 */
function RenderMeasurementItem({ section, onImageLoad }) {
  if (!section) return null;

  switch (section.type) {
    case 'heading': {
      const HeadingTag = `h${section.level || 2}`;
      return (
        <HeadingTag className={`magazine-heading magazine-heading--h${section.level || 2}`}>
          {section.content}
        </HeadingTag>
      );
    }
    case 'paragraph': {
      return <p className="magazine-paragraph">{section.content}</p>;
    }
    case 'image': {
      if (!section.src) return null;
      return (
        <figure className="magazine-inline-figure">
          <img
            src={section.src}
            alt=""
            className="magazine-inline-figure__img"
            onLoad={onImageLoad}
          />
          {section.caption && (
            <figcaption className="magazine-inline-figure__caption">
              {section.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'quote': {
      return (
        <blockquote className="magazine-pull-quote">
          <p className="magazine-pull-quote__text">{section.content}</p>
        </blockquote>
      );
    }
    case 'list': {
      return (
        <ul className="magazine-list">
          {section.items?.map((it, i) => (
            <li key={i} className="magazine-list__item">
              {it}
            </li>
          ))}
        </ul>
      );
    }
    default:
      return null;
  }
}

export default MagazinePreview;
