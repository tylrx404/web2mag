import { useCallback, useState } from 'react';
import { EditorialDashboard } from './components/EditorialDashboard.jsx';
import { MagazineEditor } from './components/MagazineEditor.jsx';
import { MagazinePreview } from './components/MagazinePreview.jsx';
import { ImportArticleModal } from './components/ImportArticleModal.jsx';
import { IssueConfigModal } from './components/magazine/IssueConfigModal.jsx';
import { exportMagazineToPdf } from './utils/pdfExportClient.js';
import { ingestArticle } from './services/articleIngestion.js';
import { SEED_ARTICLES, normalizeArticleUrl } from './data/seedArticles.js';
import { DEFAULT_ISSUE_CONFIG } from './data/issueConfig.js';
import './App.css';

/**
 * Web2Mag Main Application Container
 * Supports seamless editorial transitions:
 * - Dashboard: Luxury publishing studio with prominent URL importer and curated stories grid
 * - Visual Editor: Restored React visual magazine editor with A4 spread, page thumbnails sidebar, formatting toolbar
 * - Preview: Full A4 presentation and reading mode
 */
export function App() {
  const [articles, setArticles] = useState(SEED_ARTICLES);
  const [selectedArticleId, setSelectedArticleId] = useState(
    SEED_ARTICLES[0]?.id ?? null
  );
  const [issueConfig, setIssueConfig] = useState(DEFAULT_ISSUE_CONFIG);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'editor' | 'preview'

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // Selected article (single source of truth for the active magazine)
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ||
    articles[0] ||
    null;

  // Select an article and highlight it
  const handleSelectArticle = useCallback((articleId) => {
    setSelectedArticleId(articleId);
  }, []);

  // Update in-place edited article from the visual editor
  const handleUpdateArticle = useCallback((updatedArticle) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );
    setStatusNotice({
      type: 'success',
      message: `Saved changes to "${updatedArticle.title}". Magazine spread updated.`,
    });
  }, []);

  // Remove article from issue library
  const handleRemoveArticle = useCallback(
    (articleId) => {
      const target = articles.find((a) => a.id === articleId);
      const nextArticles = articles.filter((a) => a.id !== articleId);
      setArticles(nextArticles);

      if (selectedArticleId === articleId) {
        setSelectedArticleId(nextArticles[0]?.id ?? null);
      }

      setStatusNotice({
        type: 'info',
        message: target
          ? `Removed "${target.title}" from this issue.`
          : 'Removed article.',
      });
    },
    [articles, selectedArticleId]
  );

  // Restore default sample articles
  const handleRestoreDefaults = useCallback(() => {
    setArticles(SEED_ARTICLES);
    setSelectedArticleId(SEED_ARTICLES[0]?.id ?? null);
    setIssueConfig(DEFAULT_ISSUE_CONFIG);
    setStatusNotice({
      type: 'info',
      message: 'Restored featured cover story ("Do you Understand your Code?" by Vivek Khatri).',
    });
  }, []);

  // Save updated issue configuration
  const handleSaveIssueConfig = useCallback((newConfig) => {
    setIssueConfig(newConfig);
    setStatusNotice({
      type: 'success',
      message: `Updated issue settings: ${newConfig.magazineTitle} (${newConfig.volume}, ${newConfig.issue} • ${newConfig.date}).`,
    });
  }, []);

  // Process imported article and switch immediately to Visual Editor
  const handleImportArticle = useCallback(
    (importedArticle) => {
      const incomingUrl = normalizeArticleUrl(importedArticle.sourceUrl || '');
      const existing = articles.find(
        (item) => normalizeArticleUrl(item.sourceUrl || '') === incomingUrl
      );

      if (existing) {
        setSelectedArticleId(existing.id);
        setActiveView('editor');
        setStatusNotice({
          type: 'info',
          message: `"${existing.title}" is already in your issue. Opened in Visual Editor.`,
        });
        setIsImportModalOpen(false);
        return;
      }

      setArticles((prev) => [importedArticle, ...prev]);
      setSelectedArticleId(importedArticle.id);
      setActiveView('editor');
      setStatusNotice({
        type: 'success',
        message: `Successfully imported "${importedArticle.title}". Opened in Visual Editor.`,
      });
      setIsImportModalOpen(false);
    },
    [articles]
  );

  // Directly import from URL submitted on the Dashboard
  const handleImportFromUrl = useCallback(
    async (rawUrl) => {
      setIsImporting(true);
      setStatusNotice({
        type: 'info',
        message: 'Importing article and generating magazine spread...',
      });

      try {
        // Attempt backend endpoint first
        const response = await fetch('/api/articles/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.article) {
            handleImportArticle(data.article);
            setIsImporting(false);
            return;
          }
        }

        // Try client ingestion if backend returned error or is unready
        const article = await ingestArticle(rawUrl);
        handleImportArticle(article);
      } catch (err) {
        console.error('Import error:', err);
        setStatusNotice({
          type: 'error',
          message: `Import failed: ${err.message || 'Unable to fetch article content.'}`,
        });
      } finally {
        setIsImporting(false);
      }
    },
    [handleImportArticle]
  );

  // Trigger high-resolution vector PDF export
  const handleExportPdf = useCallback(async () => {
    if (isExporting || !selectedArticle) return;
    setIsExporting(true);
    setStatusNotice({
      type: 'info',
      message: 'Rendering vector A4 print PDF via headless Chrome... Please wait.',
    });

    try {
      const result = await exportMagazineToPdf({
        article: selectedArticle,
        columnMode: 'two-column',
        onProgress: (status) => {
          setStatusNotice({ type: 'info', message: status });
        },
      });

      if (result.success) {
        const timeSec = (result.durationMs / 1000).toFixed(2);
        setStatusNotice({
          type: 'success',
          message: `PDF exported successfully in ${timeSec}s as "${result.filename}"!`,
        });
      } else {
        throw new Error(result.error || 'Export failed.');
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      setStatusNotice({
        type: 'error',
        message: `PDF export error: ${err.message || 'Server error'}. Ensure the backend is active on port 5001.`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, selectedArticle]);

  return (
    <div className={`app-shell app-shell--${activeView}`}>
      {/* 1. TOP EDITORIAL NAVIGATION BAR */}
      <header className="app-nav">
        <div className="app-nav__left">
          <div
            className="app-brand"
            onClick={() => setActiveView('dashboard')}
            role="button"
            tabIndex={0}
            title="Go to Web2Mag Dashboard"
          >
            <div className="app-brand__logo" aria-hidden="true">
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
            <div className="app-brand__titles">
              <span className="app-brand__name">Web2Mag</span>
              <span className="app-brand__badge">STUDIO</span>
            </div>
          </div>

          <div className="app-nav__divider" aria-hidden="true" />

          {/* View Switcher Tabs */}
          <nav className="app-view-switcher" aria-label="Application View Switcher">
            <button
              type="button"
              className={`app-view-tab ${activeView === 'dashboard' ? 'app-view-tab--active' : ''}`}
              onClick={() => setActiveView('dashboard')}
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`app-view-tab ${activeView === 'editor' ? 'app-view-tab--active' : ''}`}
              onClick={() => setActiveView('editor')}
              disabled={!selectedArticle}
              title={
                selectedArticle
                  ? `Edit "${selectedArticle.title}"`
                  : 'Select an article first'
              }
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
              <span>Visual Editor</span>
              {selectedArticle && (
                <span className="app-view-tab__pill" title={selectedArticle.title}>
                  {selectedArticle.title.length > 22
                    ? `${selectedArticle.title.slice(0, 20)}…`
                    : selectedArticle.title}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`app-view-tab ${activeView === 'preview' ? 'app-view-tab--active' : ''}`}
              onClick={() => setActiveView('preview')}
              disabled={!selectedArticle}
              title="Full A4 reader and print preview"
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
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>A4 Preview</span>
            </button>
          </nav>
        </div>

        {/* Right Navigation Actions */}
        <div className="app-nav__right">
          {/* Issue Settings pill */}
          <button
            type="button"
            className="app-nav-btn app-nav-btn--config"
            onClick={() => setIsConfigModalOpen(true)}
            title="Configure Issue Title, Volume, Date, and ISSN"
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

          <button
            type="button"
            className={`app-nav-btn app-nav-btn--export ${isExporting ? 'app-nav-btn--loading' : ''}`}
            onClick={handleExportPdf}
            disabled={isExporting || !selectedArticle}
            title="Export full magazine to print-ready vector A4 PDF"
          >
            {isExporting ? (
              <>
                <span className="app-nav-spinner" aria-hidden="true" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Status Notice Notification Bar */}
      {statusNotice && (
        <div
          className={`app-notice-bar app-notice-bar--${statusNotice.type || 'info'}`}
          role="status"
          aria-live="polite"
        >
          <div className="app-notice-bar__content">
            <span className="app-notice-bar__icon" aria-hidden="true">
              {statusNotice.type === 'success' && '✓'}
              {statusNotice.type === 'error' && '✕'}
              {statusNotice.type === 'info' && 'ℹ'}
            </span>
            <span className="app-notice-bar__text">{statusNotice.message}</span>
          </div>
          <button
            type="button"
            className="app-notice-bar__dismiss"
            onClick={() => setStatusNotice(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE VIEW */}
      <main className="app-main-view">
        {/* VIEW 1: "WOW" EDITORIAL DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="app-dashboard-wrapper">
            <EditorialDashboard
              articles={articles}
              selectedArticleId={selectedArticleId}
              onSelectArticle={handleSelectArticle}
              onOpenEditor={(art) => {
                if (art) setSelectedArticleId(art.id);
                setActiveView('editor');
              }}
              onOpenPreview={(art) => {
                if (art) setSelectedArticleId(art.id);
                setActiveView('preview');
              }}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenConfigModal={() => setIsConfigModalOpen(true)}
              onImportUrl={handleImportFromUrl}
              onRemoveArticle={handleRemoveArticle}
              onRestoreDefaults={handleRestoreDefaults}
              onExportPdf={handleExportPdf}
              issueConfig={issueConfig}
              isImporting={isImporting}
              isExporting={isExporting}
              statusNotice={statusNotice}
              onClearNotice={() => setStatusNotice(null)}
            />
          </div>
        )}

        {/* VIEW 2: RESTORED REACT VISUAL EDITOR */}
        {activeView === 'editor' && (
          <div className="app-editor-wrapper">
            <MagazineEditor
              article={selectedArticle}
              articles={articles}
              issueConfig={issueConfig}
              onUpdateArticle={handleUpdateArticle}
              onImportClick={() => setIsImportModalOpen(true)}
              onBackToDashboard={() => setActiveView('dashboard')}
              onOpenPreview={() => setActiveView('preview')}
              onOpenSettings={() => setIsConfigModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3: FULL A4 MAGAZINE PREVIEW */}
        {activeView === 'preview' && (
          <div className="app-preview-wrapper">
            <MagazinePreview
              article={selectedArticle}
              articles={articles}
              issueConfig={issueConfig}
              onImportClick={() => setIsImportModalOpen(true)}
              onOpenEditor={() => setActiveView('editor')}
              onBackToDashboard={() => setActiveView('dashboard')}
            />
          </div>
        )}
      </main>

      {/* 3. MODALS */}
      <ImportArticleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportArticle}
      />

      <IssueConfigModal
        isOpen={isConfigModalOpen}
        issueConfig={issueConfig}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveIssueConfig}
      />
    </div>
  );
}

export default App;
