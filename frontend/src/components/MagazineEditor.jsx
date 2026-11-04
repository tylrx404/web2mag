import { useRef, useState } from 'react';
import { COLUMN_WIDTH_PX, useArticlePagination } from '../hooks/useArticlePagination.js';
import { exportMagazineToPdf } from '../utils/pdfExportClient.js';
import { DeletePageModal } from './DeletePageModal.jsx';
import { EditorToolbar } from './EditorToolbar.jsx';
import { MagazineCover } from './MagazineCover.jsx';
import { MagazineToc } from './MagazineToc.jsx';
import { MagazinePage } from './MagazinePage.jsx';
import { PageThumbnailsSidebar } from './PageThumbnailsSidebar.jsx';
import './MagazineEditor.css';

/**
 * Flagship interactive WYSIWYG visual magazine editor for Web2Mag.
 * Coordinates page thumbnails, formatting toolbar, in-place contentEditable text editing,
 * image uploading, resizing, alignment, page reordering, adding blank pages, and deletion.
 *
 * Page Architecture:
 * - Sheet 1: Front Cover (MagazineCover) — strictly 1 cover image, no "WEB2MAG MAGAZINE" text
 * - Sheet 2: Table of Contents (MagazineToc) — real article titles, sections, exact folios
 * - Sheet 3..N: Interior Spreads (MagazinePage) — no duplicate cover thumbnail, balanced columns
 * - Naturally targets 5-6 pages for typical real articles!
 */
export function MagazineEditor({
  article,
  onUpdateArticle,
  onImportClick,
  onBackToDashboard,
  onOpenPreview,
  onOpenSettings,
  renderLibrarySidebar,
  issueConfig = {},
  articles = [],
}) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [columnMode, setColumnMode] = useState('two-column');
  const [selectedElement, setSelectedElement] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);

  // PDF Export States
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportNotice, setExportNotice] = useState(null);

  const canvasRef = useRef(null);

  const { pages: interiorPages, totalPages: interiorTotalPages, measureContainerRef, onMeasureImageLoad } =
    useArticlePagination({
      article,
      columnMode,
    });

  // Cover is Page 1, TOC is Page 2, Interior pages are Pages 3..N
  const totalPublicationPages = interiorPages.length + 2;

  // Safely clamp active page number
  const currentPage =
    totalPublicationPages > 0
      ? Math.min(Math.max(activePageNumber, 1), totalPublicationPages)
      : 1;

  // All pages model for the PageThumbnailsSidebar
  const allThumbnailsPages = [
    {
      pageNumber: 1,
      type: 'cover',
      isCover: true,
      title: 'Front Cover',
      sections: [],
    },
    {
      pageNumber: 2,
      type: 'toc',
      isToc: true,
      title: 'Table of Contents',
      sections: [],
    },
    ...interiorPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 3,
      isFirstPage: idx === 0,
      totalPages: totalPublicationPages,
    })),
  ];

  if (!article) {
    return (
      <div className="magazine-editor-empty">
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
          <h3 className="magazine-empty-state__title">No Article Selected for Editing</h3>
          <p className="magazine-empty-state__desc">
            Select an article from your library or import a new article URL to start editing with the interactive visual editor.
          </p>
          <div className="magazine-empty-state__actions">
            {onImportClick && (
              <button
                type="button"
                className="magazine-empty-state__btn"
                onClick={onImportClick}
              >
                Import Article
              </button>
            )}
            {onBackToDashboard && (
              <button
                type="button"
                className="magazine-empty-state__btn magazine-empty-state__btn--secondary"
                onClick={onBackToDashboard}
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // In-Place Text Editing Handlers
  // ---------------------------------------------------------------------------
  const handleUpdateTitle = (newTitle) => {
    if (newTitle && newTitle !== article.title) {
      onUpdateArticle({ ...article, title: newTitle });
      setHasUnsavedChanges(true);
    }
  };

  const handleUpdateAuthor = (newAuthor) => {
    if (newAuthor && newAuthor !== article.author) {
      onUpdateArticle({ ...article, author: newAuthor });
      setHasUnsavedChanges(true);
    }
  };

  const handleUpdateSummary = (newSummary) => {
    if (newSummary !== article.summary) {
      onUpdateArticle({ ...article, summary: newSummary });
      setHasUnsavedChanges(true);
    }
  };

  const handleUpdateSection = (sectionIndex, updatedFields) => {
    if (sectionIndex < 0 || !article.sections) return;
    const nextSections = [...article.sections];
    nextSections[sectionIndex] = {
      ...nextSections[sectionIndex],
      ...updatedFields,
    };
    onUpdateArticle({ ...article, sections: nextSections });
    setHasUnsavedChanges(true);
  };

  const handleUpdateHeroImage = (updatedFields) => {
    onUpdateArticle({
      ...article,
      heroWidth: updatedFields.width ?? article.heroWidth,
      heroAlign: updatedFields.align ?? article.heroAlign,
      heroCaption: updatedFields.caption ?? article.heroCaption,
    });
    setHasUnsavedChanges(true);
  };

  // ---------------------------------------------------------------------------
  // Text Formatting Toolbar Actions
  // ---------------------------------------------------------------------------
  const handleFormatText = (command, value = null) => {
    if (!isEditMode) return;
    document.execCommand(command, false, value);
    setHasUnsavedChanges(true);
  };

  // ---------------------------------------------------------------------------
  // Image Management Handlers
  // ---------------------------------------------------------------------------
  const handleImageWidthChange = (width) => {
    if (!selectedElement) return;

    if (selectedElement.type === 'hero-image' || selectedElement.type === 'cover-image') {
      handleUpdateHeroImage({ width });
      setSelectedElement((prev) => ({ ...prev, width }));
    } else if (selectedElement.type === 'image' && selectedElement.sectionIndex >= 0) {
      handleUpdateSection(selectedElement.sectionIndex, { width });
      setSelectedElement((prev) => ({ ...prev, width }));
    }
  };

  const handleImageAlignmentChange = (align) => {
    if (!selectedElement) return;

    if (selectedElement.type === 'hero-image' || selectedElement.type === 'cover-image') {
      handleUpdateHeroImage({ align });
      setSelectedElement((prev) => ({ ...prev, align }));
    } else if (selectedElement.type === 'image' && selectedElement.sectionIndex >= 0) {
      handleUpdateSection(selectedElement.sectionIndex, { align });
      setSelectedElement((prev) => ({ ...prev, align }));
    }
  };

  const handleUploadImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (
        selectedElement?.type === 'cover-image' ||
        selectedElement?.type === 'hero-image' ||
        !selectedElement
      ) {
        onUpdateArticle({ ...article, thumbnail: dataUrl });
        setHasUnsavedChanges(true);
      } else if (
        selectedElement.type === 'image' &&
        selectedElement.sectionIndex >= 0
      ) {
        handleUpdateSection(selectedElement.sectionIndex, { src: dataUrl });
        setSelectedElement((prev) => ({ ...prev, src: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSelectedImage = () => {
    if (!selectedElement) return;

    if (selectedElement.type === 'hero-image' || selectedElement.type === 'cover-image') {
      onUpdateArticle({ ...article, thumbnail: '' });
      setSelectedElement(null);
      setHasUnsavedChanges(true);
    } else if (
      selectedElement.type === 'image' &&
      selectedElement.sectionIndex >= 0
    ) {
      const nextSections = article.sections.filter(
        (_, idx) => idx !== selectedElement.sectionIndex
      );
      onUpdateArticle({ ...article, sections: nextSections });
      setSelectedElement(null);
      setHasUnsavedChanges(true);
    }
  };

  const handleDropImageOnFigure = (target, file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (target === 'hero') {
        onUpdateArticle({ ...article, thumbnail: dataUrl });
        setHasUnsavedChanges(true);
      } else if (typeof target === 'number') {
        handleUpdateSection(target, { src: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // Page Management Handlers
  // ---------------------------------------------------------------------------
  const handleSelectPage = (pageNum) => {
    setActivePageNumber(pageNum);
    const targetSheet = document.getElementById(`editor-sheet-${pageNum}`);
    if (targetSheet) {
      targetSheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMovePageUp = (pageNum) => {
    // Cannot move Cover (1) or TOC (2)
    if (pageNum <= 3 || interiorPages.length <= 1) return;

    const interiorFromIndex = pageNum - 3;
    const interiorToIndex = pageNum - 4;

    const fromPage = interiorPages[interiorFromIndex];
    const toPage = interiorPages[interiorToIndex];

    if (!fromPage || !toPage) return;

    const fromSections = fromPage.sections || [];
    const toSections = toPage.sections || [];

    const nextSections = [...(article.sections || [])];
    const firstToIdx = nextSections.indexOf(toSections[0]);

    if (firstToIdx !== -1) {
      nextSections.splice(
        firstToIdx,
        toSections.length + fromSections.length,
        ...fromSections,
        ...toSections
      );
      onUpdateArticle({ ...article, sections: nextSections });
      setActivePageNumber(interiorToIndex + 3);
      setHasUnsavedChanges(true);
    }
  };

  const handleMovePageDown = (pageNum) => {
    if (pageNum < 3 || pageNum >= totalPublicationPages || interiorPages.length <= 1) return;
    handleMovePageUp(pageNum + 1);
  };

  const handleAddBlankPage = () => {
    const blankSection = {
      id: `blank-${Date.now()}`,
      type: 'heading',
      level: 2,
      content: 'New Editorial Section',
    };
    const blankParagraph = {
      id: `blank-p-${Date.now()}`,
      type: 'paragraph',
      content:
        'Click here to edit this paragraph and write your magazine article spread...',
    };

    const nextSections = [
      ...(article.sections || []),
      blankSection,
      blankParagraph,
    ];
    onUpdateArticle({ ...article, sections: nextSections });
    setActivePageNumber(totalPublicationPages + 1);
    setHasUnsavedChanges(true);
  };

  const handleDeletePageClick = (pageNum) => {
    if (pageNum <= 2) return; // Cannot delete Cover or TOC
    setPageToDelete(pageNum);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletePage = () => {
    if (pageToDelete === null || pageToDelete <= 2 || interiorPages.length <= 1) {
      setIsDeleteModalOpen(false);
      return;
    }

    const interiorIdx = pageToDelete - 3;
    const targetPage = interiorPages[interiorIdx];

    if (targetPage && targetPage.sections) {
      const idsToRemove = new Set(targetPage.sections.map((s) => s.id));
      const nextSections = (article.sections || []).filter(
        (s) => !idsToRemove.has(s.id)
      );

      onUpdateArticle({ ...article, sections: nextSections });
      setHasUnsavedChanges(true);
    }

    setIsDeleteModalOpen(false);
    setPageToDelete(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (isExporting || !article) return;
    setIsExporting(true);
    setExportNotice(null);
    setExportProgressText('Preparing publication sheets...');

    const result = await exportMagazineToPdf({
      containerEl: canvasRef.current,
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
      setTimeout(() => {
        setExportNotice(null);
      }, 7000);
    } else {
      setExportNotice({
        type: 'error',
        message: `Export failed: ${result.error}`,
      });
    }
  };

  let sourceDomain = 'entechonline.com';
  try {
    if (article.sourceUrl) {
      sourceDomain = new URL(article.sourceUrl).hostname.replace(/^www\./i, '');
    }
  } catch {
    // Keep fallback
  }

  return (
    <div className="magazine-editor">
      {/* Top WYSIWYG Formatting & Navigation Toolbar */}
      <EditorToolbar
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        columnMode={columnMode}
        onToggleColumnMode={setColumnMode}
        zoomLevel={zoomLevel}
        onZoomChange={(delta) =>
          setZoomLevel((prev) => Math.min(Math.max(prev + delta, 60), 140))
        }
        onZoomReset={() => setZoomLevel(100)}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        exportProgressText={exportProgressText}
        selectedElement={selectedElement}
        onFormatText={handleFormatText}
        onImageWidthChange={handleImageWidthChange}
        onImageAlignmentChange={handleImageAlignmentChange}
        onUploadImageFile={handleUploadImageFile}
        onDeleteSelectedImage={handleDeleteSelectedImage}
        activePageNumber={currentPage}
        totalPages={totalPublicationPages}
        onMovePageUp={handleMovePageUp}
        onMovePageDown={handleMovePageDown}
        onAddBlankPage={handleAddBlankPage}
        onDeletePageClick={handleDeletePageClick}
        hasUnsavedChanges={hasUnsavedChanges}
        onBackToDashboard={onBackToDashboard}
        onOpenPreview={onOpenPreview}
        onOpenSettings={onOpenSettings}
      />

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

      {/* Editor Body Grid: Left Sidebar + Center A4 Canvas */}
      <div className="magazine-editor__body">
        {/* Left Sidebar */}
        <aside className="magazine-editor__sidebar">
          <PageThumbnailsSidebar
            pages={allThumbnailsPages}
            activePageNumber={currentPage}
            onSelectPage={handleSelectPage}
            onMovePageUp={handleMovePageUp}
            onMovePageDown={handleMovePageDown}
            onDeletePageClick={handleDeletePageClick}
            onAddBlankPage={handleAddBlankPage}
            articleTitle={article.title}
          />
        </aside>

        {/* Center Interactive A4 Magazine Canvas */}
        <div className="magazine-editor__canvas-area" ref={canvasRef}>
          <div
            className="magazine-editor__canvas-scale"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Sheet 1: Front Cover */}
            <div
              key="editor-sheet-1"
              id="editor-sheet-1"
              className={`magazine-editor__sheet-wrapper ${
                currentPage === 1 ? 'magazine-editor__sheet-wrapper--active' : ''
              }`}
              onClick={() => setActivePageNumber(1)}
            >
              <MagazineCover
                issue={issueConfig}
                article={article}
                otherArticles={articles}
                isEditable={isEditMode}
                selectedElementId={selectedElement?.id}
                onSelectElement={setSelectedElement}
                onUpdateHeadline={handleUpdateTitle}
                onUpdateAuthor={handleUpdateAuthor}
                onUpdateDeck={handleUpdateSummary}
                onUpdateKicker={(kicker) => {
                  onUpdateArticle({ ...article, category: kicker });
                  setHasUnsavedChanges(true);
                }}
                onUploadCoverImage={(file) => handleUploadImageFile(file)}
                onRemoveCoverImage={() => {
                  onUpdateArticle({ ...article, thumbnail: '' });
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            {/* Sheet 2: Table of Contents */}
            <div
              key="editor-sheet-2"
              id="editor-sheet-2"
              className={`magazine-editor__sheet-wrapper ${
                currentPage === 2 ? 'magazine-editor__sheet-wrapper--active' : ''
              }`}
              onClick={() => setActivePageNumber(2)}
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

            {/* Sheets 3..N: Article Interior Spreads */}
            {interiorPages.map((page, idx) => {
              const pubPageNum = idx + 3;
              return (
                <div
                  key={`editor-sheet-${pubPageNum}`}
                  id={`editor-sheet-${pubPageNum}`}
                  className={`magazine-editor__sheet-wrapper ${
                    currentPage === pubPageNum
                      ? 'magazine-editor__sheet-wrapper--active'
                      : ''
                  }`}
                  onClick={() => setActivePageNumber(pubPageNum)}
                >
                  <MagazinePage
                    article={article}
                    pageNumber={pubPageNum}
                    totalPages={totalPublicationPages}
                    isFirstPage={idx === 0}
                    hideHeroThumbnail={true}
                    columnMode={columnMode}
                    columnHeight={page.columnHeight}
                    sections={page.sections}
                    sourceDomain={sourceDomain}
                    isEditable={isEditMode}
                    selectedElementId={selectedElement?.id}
                    onSelectElement={setSelectedElement}
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateAuthor={handleUpdateAuthor}
                    onUpdateSummary={handleUpdateSummary}
                    onUpdateSection={handleUpdateSection}
                    onUpdateHeroImage={handleUpdateHeroImage}
                    onDropImageOnFigure={handleDropImageOnFigure}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete Page Confirmation Modal */}
      <DeletePageModal
        isOpen={isDeleteModalOpen}
        pageNumber={pageToDelete}
        totalPages={totalPublicationPages}
        onConfirm={handleConfirmDeletePage}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
      />
    </div>
  );
}

export default MagazineEditor;
