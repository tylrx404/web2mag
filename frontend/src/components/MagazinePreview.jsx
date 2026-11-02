import { useEffect, useRef, useState } from 'react';
import { useArticlePagination } from '../hooks/useArticlePagination.js';
import { exportMagazineToPdf } from '../utils/pdfExportClient.js';
import { MagazineCover } from './MagazineCover.jsx';
import { MagazineToc } from './MagazineToc.jsx';
import { MagazinePage } from './MagazinePage.jsx';
import './MagazinePreview.css';

/**
 * High-End Magazine Preview Page for Web2Mag.
 *
 * Dedicated preview-only experience to view the complete magazine publication
 * exactly as it will appear in the downloaded PDF.
 *
 * Features:
 * - Clean, professional layout with a neutral backdrop and centered realistic A4 sheets.
 * - Simple sidebar for thumbnail-based page navigation (no editing controls).
 * - Simple preview toolbar with page indicator, zoom controls, fit-to-page, and one Download PDF button.
 * - Complete publication view: Front Cover (p. 1), Table of Contents (p. 2), and Interior Spreads (p. 3..N).
 * - Synchronized scroll and thumbnail active state.
 */
export function MagazinePreview({
  article,
  issueConfig = {},
  articles = [],
  onImportClick,
}) {
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportNotice, setExportNotice] = useState(null);

  const viewportRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const sheetRefs = useRef({});

  // Pagination hook for interior article pages
  const { pages: interiorPages } = useArticlePagination({
    article,
    columnMode: 'two-column',
  });

  const totalPublicationPages = interiorPages.length + 2;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoomLevel(100);

  // Fit to Page handler: scales A4 sheet (~1123px high) to fit cleanly in viewport
  const handleFitToPage = () => {
    if (!viewportRef.current) return;
    const viewportHeight = viewportRef.current.clientHeight;
    // Standard A4 height is ~1123px at 96 DPI; leave 72px margin for breathing room
    const optimalZoom = Math.min(
      Math.max(Math.floor(((viewportHeight - 72) / 1123) * 100), 40),
      120
    );
    setZoomLevel(optimalZoom);
  };

  // Navigate to specific page on thumbnail click
  const handleSelectPage = (pageNum) => {
    setActivePageNumber(pageNum);
    const targetEl = sheetRefs.current[pageNum];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll listener: detects which page is closest to top/center of viewport
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let timeoutId = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        const viewportRect = viewport.getBoundingClientRect();
        const triggerLine = viewportRect.top + 160; // top third zone

        let closestPage = 1;
        let minDistance = Infinity;

        for (let p = 1; p <= totalPublicationPages; p++) {
          const el = sheetRefs.current[p];
          if (el) {
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - triggerLine);
            if (distance < minDistance) {
              minDistance = distance;
              closestPage = p;
            }
          }
        }
        setActivePageNumber(closestPage);
      }, 50);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [totalPublicationPages]);

  // Download PDF handler using existing Puppeteer export client
  const handleDownloadPdf = async () => {
    if (isExporting || !article) return;
    setIsExporting(true);
    setExportProgressText('Preparing publication sheets...');
    setExportNotice(null);

    const result = await exportMagazineToPdf({
      containerEl: canvasContainerRef.current,
      article,
      columnMode: 'two-column',
      onProgress: (status) => setExportProgressText(status),
    });

    setIsExporting(false);

    if (result.success) {
      const seconds = (result.durationMs / 1000).toFixed(2);
      setExportNotice({
        type: 'success',
        message: `High-resolution A4 PDF ready in ${seconds}s as "${result.filename}"`,
      });
      setTimeout(() => setExportNotice(null), 6000);
    } else {
      setExportNotice({
        type: 'error',
        message: `PDF export failed: ${result.error}`,
      });
    }
  };

  // Empty state if no article is loaded
  if (!article) {
    return (
      <div className="preview-empty-state">
        <div className="preview-empty-card">
          <div className="preview-empty-icon" aria-hidden="true">
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
            </svg>
          </div>
          <h2 className="preview-empty-title">No Publication Selected</h2>
          <p className="preview-empty-desc">
            Select an article from your library or import a new article URL to
            render the complete A4 publication preview.
          </p>
          {onImportClick && (
            <button
              type="button"
              className="preview-empty-btn"
              onClick={onImportClick}
            >
              Import Article
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="magazine-preview-root">
      {/* ----------------------------------------------------------------------
         1. SIMPLE PREVIEW TOOLBAR
         Contains ONLY: Current page indicator, Zoom controls, Fit-to-page, Download PDF
         ---------------------------------------------------------------------- */}
      <header
        className="preview-toolbar"
        role="toolbar"
        aria-label="Magazine Preview Controls"
      >
        <div className="preview-toolbar__left">
          <div className="preview-page-indicator">
            <span className="preview-page-indicator__dot" aria-hidden="true" />
            <span className="preview-page-indicator__text">
              Page <strong>{activePageNumber}</strong> of {totalPublicationPages}
            </span>
          </div>
        </div>

        <div className="preview-toolbar__center">
          {/* Zoom In, Out & Percentage Reset */}
          <div className="preview-zoom-group">
            <button
              type="button"
              className="preview-zoom-btn"
              onClick={handleZoomOut}
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="preview-zoom-btn preview-zoom-btn--label"
              onClick={handleZoomReset}
              title="Reset zoom to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              className="preview-zoom-btn"
              onClick={handleZoomIn}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {/* Fit to Page Option */}
          <button
            type="button"
            className="preview-toolbar-btn"
            onClick={handleFitToPage}
            title="Fit A4 page within viewport"
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
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Fit to Page</span>
          </button>
        </div>

        <div className="preview-toolbar__right">
          {/* One Prominent Download PDF Action */}
          <button
            type="button"
            className={`preview-download-btn ${
              isExporting ? 'preview-download-btn--loading' : ''
            }`}
            onClick={handleDownloadPdf}
            disabled={isExporting}
            title="Download publication as print-ready vector A4 PDF"
          >
            {isExporting ? (
              <>
                <span className="preview-download-spinner" aria-hidden="true" />
                <span>{exportProgressText || 'Exporting...'}</span>
              </>
            ) : (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Floating Status Notification */}
      {exportNotice && (
        <div
          className={`preview-notice-toast preview-notice-toast--${exportNotice.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{exportNotice.message}</span>
          <button
            type="button"
            className="preview-notice-toast__close"
            onClick={() => setExportNotice(null)}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------------
         2. PREVIEW BODY: SIMPLE NAVIGATION SIDEBAR + SCROLLABLE A4 CANVAS
         ---------------------------------------------------------------------- */}
      <div className="preview-body">
        {/* Simple Navigation Sidebar (Minimal, Thumbnails & Page Numbers only) */}
        <aside className="preview-sidebar" aria-label="Page Navigation">
          <div className="preview-sidebar__header">
            <span className="preview-sidebar__title">
              Pages ({totalPublicationPages})
            </span>
          </div>

          <div className="preview-sidebar__list" role="list">
            {/* Page 1: Cover Thumbnail */}
            <div
              role="listitem"
              className={`preview-thumb-item ${
                activePageNumber === 1 ? 'preview-thumb-item--active' : ''
              }`}
              onClick={() => handleSelectPage(1)}
              title="Navigate to Page 1: Cover"
            >
              <div className="preview-thumb-card preview-thumb-card--cover">
                <div className="preview-thumb-mini preview-thumb-mini--cover">
                  <div className="preview-thumb-mini__cover-kicker" />
                  <div className="preview-thumb-mini__cover-title" />
                  <div className="preview-thumb-mini__cover-deck" />
                </div>
              </div>
              <div className="preview-thumb-meta">
                <span className="preview-thumb-meta__num">Page 1</span>
                <span className="preview-thumb-meta__tag">Cover</span>
              </div>
            </div>

            {/* Page 2: Table of Contents Thumbnail */}
            <div
              role="listitem"
              className={`preview-thumb-item ${
                activePageNumber === 2 ? 'preview-thumb-item--active' : ''
              }`}
              onClick={() => handleSelectPage(2)}
              title="Navigate to Page 2: Table of Contents"
            >
              <div className="preview-thumb-card preview-thumb-card--toc">
                <div className="preview-thumb-mini preview-thumb-mini--toc">
                  <div className="preview-thumb-mini__toc-title">CONTENTS</div>
                  <div className="preview-thumb-mini__toc-line" />
                  <div className="preview-thumb-mini__toc-line" />
                  <div className="preview-thumb-mini__toc-line" />
                </div>
              </div>
              <div className="preview-thumb-meta">
                <span className="preview-thumb-meta__num">Page 2</span>
                <span className="preview-thumb-meta__tag">Contents</span>
              </div>
            </div>

            {/* Pages 3..N: Interior Pages Thumbnails */}
            {interiorPages.map((page, idx) => {
              const pubPageNum = idx + 3;
              const isFirstInterior = idx === 0;
              return (
                <div
                  key={pubPageNum}
                  role="listitem"
                  className={`preview-thumb-item ${
                    activePageNumber === pubPageNum
                      ? 'preview-thumb-item--active'
                      : ''
                  }`}
                  onClick={() => handleSelectPage(pubPageNum)}
                  title={`Navigate to Page ${pubPageNum}`}
                >
                  <div className="preview-thumb-card">
                    <div className="preview-thumb-mini">
                      <div className="preview-thumb-mini__header" />
                      {isFirstInterior && (
                        <div className="preview-thumb-mini__hero">
                          <div className="preview-thumb-mini__hero-title" />
                        </div>
                      )}
                      <div className="preview-thumb-mini__cols">
                        <div className="preview-thumb-mini__col">
                          <div className="preview-thumb-mini__text-line" />
                          <div className="preview-thumb-mini__text-line" />
                          <div className="preview-thumb-mini__text-line" />
                        </div>
                        <div className="preview-thumb-mini__col">
                          <div className="preview-thumb-mini__text-line" />
                          <div className="preview-thumb-mini__text-line" />
                          <div className="preview-thumb-mini__text-line" />
                        </div>
                      </div>
                      <div className="preview-thumb-mini__footer">
                        <span>{pubPageNum}</span>
                      </div>
                    </div>
                  </div>
                  <div className="preview-thumb-meta">
                    <span className="preview-thumb-meta__num">
                      Page {pubPageNum}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Vertically Scrollable Preview Canvas (Neutral backdrop, centered A4 sheets) */}
        <main
          className="preview-viewport"
          ref={viewportRef}
          aria-label="Magazine Publication Viewport"
        >
          <div className="preview-canvas-container" ref={canvasContainerRef}>
            <div
              className="preview-scale-wrapper"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* Page 1: Front Cover */}
              <div
                id="preview-page-1"
                ref={(el) => (sheetRefs.current[1] = el)}
                className={`preview-sheet-frame ${
                  activePageNumber === 1 ? 'preview-sheet-frame--focused' : ''
                }`}
              >
                <MagazineCover
                  issue={issueConfig}
                  article={article}
                  otherArticles={articles}
                  isEditable={false}
                />
              </div>

              {/* Page 2: Table of Contents */}
              <div
                id="preview-page-2"
                ref={(el) => (sheetRefs.current[2] = el)}
                className={`preview-sheet-frame ${
                  activePageNumber === 2 ? 'preview-sheet-frame--focused' : ''
                }`}
              >
                <MagazineToc
                  issue={issueConfig}
                  article={article}
                  articles={articles}
                  pages={interiorPages}
                  totalPages={totalPublicationPages}
                  onSelectPage={handleSelectPage}
                />
              </div>

              {/* Pages 3..N: Interior Spreads */}
              {interiorPages.map((page, idx) => {
                const pubPageNum = idx + 3;
                return (
                  <div
                    key={pubPageNum}
                    id={`preview-page-${pubPageNum}`}
                    ref={(el) => (sheetRefs.current[pubPageNum] = el)}
                    className={`preview-sheet-frame ${
                      activePageNumber === pubPageNum
                        ? 'preview-sheet-frame--focused'
                        : ''
                    }`}
                  >
                    <MagazinePage
                      article={article}
                      pageNumber={pubPageNum}
                      totalPages={totalPublicationPages}
                      isFirstPage={idx === 0}
                      hideHeroThumbnail={true}
                      columnMode="two-column"
                      columnHeight={page.columnHeight}
                      sections={page.sections}
                      isEditable={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MagazinePreview;
