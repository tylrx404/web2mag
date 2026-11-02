import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArticleLibrary } from './components/ArticleLibrary.jsx';
import { ImportArticleModal } from './components/ImportArticleModal.jsx';
import { A4MagazinePage } from './components/A4MagazinePage.jsx';
import { ArticleInspector } from './components/ArticleInspector.jsx';
import { CoverPage } from './components/magazine/CoverPage.jsx';
import { TableOfContentsPage } from './components/magazine/TableOfContentsPage.jsx';
import { AuthorProfilePage } from './components/magazine/AuthorProfilePage.jsx';
import { PageNavigator } from './components/magazine/PageNavigator.jsx';
import { IssueConfigModal } from './components/magazine/IssueConfigModal.jsx';
import { ArticleEditorModal } from './components/editor/ArticleEditorModal.jsx';
import { buildMagazinePages } from './services/magazineModel.js';
import { exportIssueToPdf } from './services/pdfExport.js';
import { DEFAULT_ISSUE_CONFIG } from './data/issueConfig.js';
import { INITIAL_ARTICLES, normalizeArticleUrl } from './data/mockArticles.js';
import './App.css';

const A4_BASE_WIDTH = 794;
const A4_BASE_HEIGHT = 1123;

export function App() {
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [selectedArticleId, setSelectedArticleId] = useState(
    INITIAL_ARTICLES[0]?.id ?? null
  );
  const [issueConfig, setIssueConfig] = useState(DEFAULT_ISSUE_CONFIG);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // A4 Preview Zoom & Responsive Scaling State
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | 'custom'
  const [customZoom, setCustomZoom] = useState(1.0);
  const [viewportWidth, setViewportWidth] = useState(850);
  const viewportRef = useRef(null);

  // Magazine Sequential Page Model
  const pages = useMemo(
    () => buildMagazinePages(articles, issueConfig),
    [articles, issueConfig]
  );

  // Currently active page ID (default to cover page)
  const [currentPageId, setCurrentPageId] = useState('page-cover');

  // Verify currently selected page exists in pages list
  const activePage = pages.find((p) => p.id === currentPageId) || pages[0];

  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) || null;

  // Responsive ResizeObserver to fit A4 preview smoothly inside the center canvas
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setViewportWidth(entry.contentRect.width);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute active scale factor
  const fitScale = Math.min(
    1.0,
    Math.max(0.42, (viewportWidth - 56) / A4_BASE_WIDTH)
  );
  const activeScale = zoomMode === 'fit' ? fitScale : customZoom;

  const handleZoomIn = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleZoomFit = () => {
    setZoomMode('fit');
  };

  const handleZoom100 = () => {
    setZoomMode('custom');
    setCustomZoom(1.0);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleSelectPage = useCallback(
    (pageId) => {
      setCurrentPageId(pageId);
      const targetPage = pages.find((p) => p.id === pageId);
      if (targetPage && targetPage.articleId) {
        setSelectedArticleId(targetPage.articleId);
      }
    },
    [pages]
  );

  const handleSelectArticle = useCallback(
    (articleId) => {
      setSelectedArticleId(articleId);
      // Automatically switch to the article's first page chunk in the magazine
      const targetPage = pages.find(
        (p) =>
          p.articleId === articleId &&
          (p.chunkIndex === 0 || p.chunkIndex === undefined)
      );
      if (targetPage) {
        setCurrentPageId(targetPage.id);
      }
    },
    [pages]
  );

  const handleRemoveArticle = useCallback(
    (articleId) => {
      const indexToRemove = articles.findIndex((item) => item.id === articleId);
      if (indexToRemove === -1) return;

      const removedArticle = articles[indexToRemove];
      const nextArticles = articles.filter((item) => item.id !== articleId);

      setArticles(nextArticles);

      if (selectedArticleId === articleId) {
        if (nextArticles.length === 0) {
          setSelectedArticleId(null);
          setCurrentPageId('page-toc');
        } else {
          const nextIndex = Math.min(indexToRemove, nextArticles.length - 1);
          setSelectedArticleId(nextArticles[nextIndex].id);
          setCurrentPageId(`page-art-${nextArticles[nextIndex].id}-p0`);
        }
      }

      setStatusNotice({
        type: 'info',
        message: `Removed "${removedArticle.title}" from the issue library.`,
      });
    },
    [articles, selectedArticleId]
  );

  const handleImportArticle = (importedArticle) => {
    const incomingUrl = normalizeArticleUrl(importedArticle.sourceUrl);
    const existingDuplicate = articles.find(
      (item) => normalizeArticleUrl(item.sourceUrl) === incomingUrl
    );

    if (existingDuplicate) {
      setSelectedArticleId(existingDuplicate.id);
      setCurrentPageId(`page-art-${existingDuplicate.id}-p0`);
      setStatusNotice({
        type: 'duplicate',
        message: `"${existingDuplicate.title}" is already in your library. Selected existing article page.`,
      });
      return;
    }

    setArticles((prev) => [importedArticle, ...prev]);
    setSelectedArticleId(importedArticle.id);
    setCurrentPageId(`page-art-${importedArticle.id}-p0`);
    setStatusNotice({
      type: 'success',
      message: `Successfully imported "${importedArticle.title}". Added to issue and displayed on A4 spread.`,
    });
  };

  const handleRestoreDefaults = () => {
    setArticles(INITIAL_ARTICLES);
    setSelectedArticleId(INITIAL_ARTICLES[0]?.id ?? null);
    setCurrentPageId('page-cover');
    setIssueConfig(DEFAULT_ISSUE_CONFIG);
    setStatusNotice({
      type: 'info',
      message: 'Restored sample articles and initial issue settings.',
    });
  };

  const handleSaveIssueConfig = (newConfig) => {
    setIssueConfig(newConfig);
    setStatusNotice({
      type: 'success',
      message: `Updated issue settings: ${newConfig.magazineTitle} (${newConfig.volume}, ${newConfig.issue} • ${newConfig.date}).`,
    });
  };

  const handleOpenEditor = useCallback(
    (articleToEdit) => {
      const target = articleToEdit || selectedArticle || articles[0];
      if (target) {
        setEditingArticle(target);
        setIsEditorOpen(true);
      }
    },
    [selectedArticle, articles]
  );

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingArticle(null);
  }, []);

  const handleSaveArticle = useCallback((updatedArticle) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );
    setSelectedArticleId(updatedArticle.id);
    setCurrentPageId(`page-art-${updatedArticle.id}-p0`);
    setIsEditorOpen(false);
    setEditingArticle(null);
    setStatusNotice({
      type: 'success',
      message: `Saved changes to "${updatedArticle.title}". Magazine pagination & TOC updated.`,
    });
  }, []);

  const handleMoveArticle = useCallback((articleId, direction) => {
    setArticles((prev) => {
      const index = prev.findIndex((a) => a.id === articleId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const nextList = [...prev];
      const [moved] = nextList.splice(index, 1);
      nextList.splice(targetIndex, 0, moved);
      return nextList;
    });
    setStatusNotice({
      type: 'info',
      message: 'Article order updated. Pagination and TOC page folios refreshed.',
    });
  }, []);

  const handleCreateArticle = useCallback(() => {
    const newId = `story-${Date.now()}`;
    const newStory = {
      id: newId,
      title: 'Untitled Magazine Story',
      author: 'Contributing Author',
      authorRole: 'Contributing Writer',
      authorBio: 'Editor and technical contributor for this issue.',
      category: 'FEATURE STORY',
      excerpt: 'A newly added editorial article.',
      featuredImageUrl: '',
      images: [],
      contentHtml: `
        <p>Start writing your new article here. Use the Visual Block Editor to insert headings, body paragraphs, blockquotes, and figures with captions.</p>
        <p>The Web2Mag pagination engine balances your story across A4 columns in real time as you edit.</p>
      `.trim(),
      sourceUrl: '',
    };
    setArticles((prev) => [newStory, ...prev]);
    setSelectedArticleId(newStory.id);
    setCurrentPageId(`page-art-${newStory.id}-p0`);
    setEditingArticle(newStory);
    setIsEditorOpen(true);
    setStatusNotice({
      type: 'success',
      message: 'Created new magazine story. Editor opened.',
    });
  }, []);

  const handleExportPdf = async () => {
    if (pages.length === 0 || isExporting) return;
    try {
      setIsExporting(true);
      setStatusNotice({
        type: 'info',
        message: 'Rendering vector A4 print PDF via headless Chrome... Please wait.',
      });
      await exportIssueToPdf(pages, issueConfig);
      setStatusNotice({
        type: 'success',
        message: `PDF exported successfully (${pages.length} pages). Download started!`,
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setStatusNotice({
        type: 'error',
        message: `PDF export failed: ${err.message || 'Server error'}. Ensure the backend is running on port 5001.`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isLibraryModified = articles.length !== INITIAL_ARTICLES.length;

  return (
    <div className="app-shell">
      {/* 1. TOP EDITORIAL TOOLBAR */}
      <header className="editorial-toolbar">
        <div className="editorial-toolbar__left">
          <div className="editorial-brand">
            <div className="editorial-brand__logo" aria-hidden="true">
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
            <div className="editorial-brand__titles">
              <span className="editorial-brand__name">Web2Mag</span>
              <span className="editorial-brand__badge">STUDIO</span>
            </div>
          </div>

          <div className="editorial-toolbar__divider" aria-hidden="true" />

          {/* Dynamic Issue Configuration Pill */}
          <div className="editorial-issue-badge">
            <span className="editorial-issue__title">
              {issueConfig.magazineTitle}
            </span>
            <span className="editorial-issue__meta">
              {issueConfig.date} • {issueConfig.volume}, {issueConfig.issue}
            </span>
            <span className="editorial-issue__issn">
              {issueConfig.issn?.startsWith('ISSN')
                ? issueConfig.issn
                : `ISSN: ${issueConfig.issn || '2584-2749'}`}
            </span>

            <button
              type="button"
              className="editorial-btn editorial-btn--config"
              onClick={() => setIsConfigModalOpen(true)}
              title="Edit Issue Metadata (Title, Volume, Issue, Date, ISSN)"
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Issue Settings</span>
            </button>
          </div>
        </div>

        {/* Center: A4 Preview Zoom Controls */}
        <div className="editorial-toolbar__center">
          <div className="preview-controls" aria-label="A4 Preview Zoom Controls">
            <span className="preview-controls__label">Zoom</span>
            <button
              type="button"
              className="preview-btn"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <span className="preview-controls__value">
              {zoomMode === 'fit' ? 'Fit' : `${Math.round(activeScale * 100)}%`}
            </span>
            <button
              type="button"
              className="preview-btn"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className={`preview-preset-btn ${zoomMode === 'fit' ? 'active' : ''}`}
              onClick={handleZoomFit}
            >
              Fit
            </button>
            <button
              type="button"
              className={`preview-preset-btn ${
                zoomMode === 'custom' && customZoom === 1.0 ? 'active' : ''
              }`}
              onClick={handleZoom100}
            >
              100%
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="editorial-toolbar__right">
          {selectedArticle && (
            <button
              type="button"
              className="editorial-btn editorial-btn--edit"
              onClick={() => handleOpenEditor(selectedArticle)}
              title={`Edit "${selectedArticle.title}"`}
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
              <span>Edit Story</span>
            </button>
          )}

          <button
            type="button"
            className="editorial-btn editorial-btn--import"
            onClick={handleOpenImportModal}
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
            <span>Import Article</span>
          </button>

          <button
            type="button"
            className={`editorial-btn editorial-btn--export ${isExporting ? 'editorial-btn--loading' : ''}`}
            onClick={handleExportPdf}
            disabled={isExporting || pages.length === 0}
            title="Export complete magazine as print-ready vector A4 PDF"
          >
            {isExporting ? (
              <>
                <span className="editorial-spinner" aria-hidden="true" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2v6h6M4 10V2a2 2 0 0 1 2-2h7l5 5v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <polyline points="7 14 10 17 13 14" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Status Notice Banner */}
      {statusNotice && (
        <div
          className={`app-notice-bar app-notice-bar--${statusNotice.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{statusNotice.message}</span>
          <button
            type="button"
            className="app-notice-bar__dismiss"
            onClick={() => setStatusNotice(null)}
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. THREE-PANEL EDITORIAL WORKSPACE */}
      <main className="editorial-workspace">
        {/* Left Sidebar: Preserved ArticleLibrary Component */}
        <section
          className="editorial-workspace__library-pane"
          aria-label="Issue Article Library"
        >
          <ArticleLibrary
            articles={articles}
            selectedArticleId={selectedArticleId}
            onSelectArticle={handleSelectArticle}
            onRemoveArticle={handleRemoveArticle}
            onImportClick={handleOpenImportModal}
            onMoveArticle={handleMoveArticle}
            onEditArticle={handleOpenEditor}
            onCreateArticle={handleCreateArticle}
          />
        </section>

        {/* Center Workspace: Magazine Canvas with Page Navigation */}
        <section
          className="editorial-workspace__canvas-pane"
          aria-label="A4 Magazine Preview Canvas"
        >
          {/* Canvas Sub-Header */}
          <div className="canvas-header">
            <div className="canvas-header__info">
              <span className="canvas-header__title">
                {activePage.title} • Page {activePage.pageNumber} of {pages.length}
              </span>
              <span className="canvas-header__pill">A4 Portrait (210 × 297 mm)</span>
            </div>
            <div className="canvas-header__status">
              <span className="canvas-header__dot" aria-hidden="true" />
              <span>Multi-Page Magazine Model</span>
            </div>
          </div>

          {/* Visual Page Navigator Strip */}
          <PageNavigator
            pages={pages}
            currentPageId={activePage.id}
            onSelectPage={handleSelectPage}
          />

          {/* Canvas Viewport */}
          <div className="canvas-viewport" ref={viewportRef}>
            <div
              className="canvas-scaler"
              style={{
                width: A4_BASE_WIDTH * activeScale,
                height: A4_BASE_HEIGHT * activeScale,
              }}
            >
              <div
                className="canvas-page-wrapper"
                style={{
                  width: A4_BASE_WIDTH,
                  height: A4_BASE_HEIGHT,
                  transform: `scale(${activeScale})`,
                }}
              >
                {/* Dynamically render page based on type in the page model */}
                {activePage.type === 'cover' && (
                  <CoverPage
                    issueConfig={issueConfig}
                    pageData={activePage}
                  />
                )}

                {activePage.type === 'toc' && (
                  <TableOfContentsPage
                    issueConfig={issueConfig}
                    entries={activePage.entries}
                    onNavigateToPage={handleSelectPage}
                  />
                )}

                {activePage.type === 'article' && (
                  <A4MagazinePage
                    article={activePage.article}
                    pageNumber={activePage.pageNumber}
                    issueInfo={issueConfig}
                    chunkIndex={activePage.chunkIndex ?? 0}
                    totalPagesForArticle={activePage.totalPagesForArticle ?? 1}
                    isFirstPage={activePage.isFirstPage ?? true}
                    isLastPage={activePage.isLastPage ?? true}
                    contentHtml={activePage.contentHtml}
                    isEmpty={activePage.isEmpty}
                  />
                )}

                {activePage.type === 'author' && (
                  <AuthorProfilePage
                    issueConfig={issueConfig}
                    authors={activePage.authors}
                    pageNumber={activePage.pageNumber}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Article & Layout Inspector */}
        <section
          className="editorial-workspace__inspector-pane"
          aria-label="Article and Layout Inspector"
        >
          <ArticleInspector
            article={selectedArticle}
            onOpenImportModal={handleOpenImportModal}
            onRemoveArticle={handleRemoveArticle}
            onRestoreDefaults={handleRestoreDefaults}
            isModifiedFromDefaults={isLibraryModified}
            pageNumber={activePage.pageNumber}
            issueConfig={issueConfig}
            currentPage={activePage}
            totalPages={pages.length}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
            onEditArticle={handleOpenEditor}
          />
        </section>
      </main>

      {/* Preserved Import Article Modal */}
      <ImportArticleModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onImport={handleImportArticle}
      />

      {/* Issue Configuration Modal */}
      <IssueConfigModal
        isOpen={isConfigModalOpen}
        issueConfig={issueConfig}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveIssueConfig}
      />

      {/* Article Block & Story Editor Modal */}
      <ArticleEditorModal
        isOpen={isEditorOpen}
        article={editingArticle}
        onClose={handleCloseEditor}
        onSave={handleSaveArticle}
      />
    </div>
  );
}

export default App;
