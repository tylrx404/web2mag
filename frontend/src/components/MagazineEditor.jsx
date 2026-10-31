import { useRef, useState } from 'react';
import { COLUMN_WIDTH_PX, useArticlePagination } from '../hooks/useArticlePagination.js';
import { exportMagazineToPdf } from '../utils/pdfExportClient.js';
import { DeletePageModal } from './DeletePageModal.jsx';
import { EditorToolbar } from './EditorToolbar.jsx';
import { MagazinePage } from './MagazinePage.jsx';
import { PageThumbnailsSidebar } from './PageThumbnailsSidebar.jsx';
import './MagazineEditor.css';

/**
 * Flagship interactive WYSIWYG visual magazine editor for Web2Mag.
 * Coordinates page thumbnails, formatting toolbar, in-place contentEditable text editing,
 * image uploading, resizing, alignment, page reordering, adding blank pages, and deletion.
 *
 * @param {{
 *   article: any,
 *   onUpdateArticle: (updatedArticle: any) => void,
 *   onImportClick?: () => void,
 *   renderLibrarySidebar?: React.ReactNode
 * }} props
 */
export function MagazineEditor({
  article,
  onUpdateArticle,
  onImportClick,
  renderLibrarySidebar,
}) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('pages'); // 'pages' | 'library'
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

  const { pages, totalPages, measureContainerRef, onMeasureImageLoad } =
    useArticlePagination({
      article,
      columnMode,
    });

  // Safely clamp active page number without side-effect setState loops
  const currentPage =
    totalPages > 0 ? Math.min(Math.max(activePageNumber, 1), totalPages) : 1;

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
            Select an article from your library or import a new WordPress URL to start editing with the interactive WYSIWYG editor.
          </p>
          {onImportClick && (
            <button
              type="button"
              className="magazine-empty-state__btn"
              onClick={onImportClick}
            >
              Import Article
            </button>
          )}
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

    if (selectedElement.type === 'hero-image') {
      handleUpdateHeroImage({ width });
      setSelectedElement((prev) => ({ ...prev, width }));
    } else if (selectedElement.type === 'image' && selectedElement.sectionIndex >= 0) {
      handleUpdateSection(selectedElement.sectionIndex, { width });
      setSelectedElement((prev) => ({ ...prev, width }));
    }
  };

  const handleImageAlignmentChange = (align) => {
    if (!selectedElement) return;

    if (selectedElement.type === 'hero-image') {
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
      if (selectedElement?.type === 'hero-image' || !selectedElement) {
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

    if (selectedElement.type === 'hero-image') {
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
    if (pageNum <= 1 || pages.length <= 1) return;
    const fromIndex = pageNum - 1;
    const toIndex = pageNum - 2;

    const fromPage = pages[fromIndex];
    const toPage = pages[toIndex];

    if (!fromPage || !toPage) return;

    // Swap the sections of the two pages in the master sections list
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
      setActivePageNumber(toIndex + 1);
      setHasUnsavedChanges(true);
    }
  };

  const handleMovePageDown = (pageNum) => {
    if (pageNum >= pages.length || pages.length <= 1) return;
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
    setActivePageNumber(pages.length + 1);
    setHasUnsavedChanges(true);
  };

  const handleDeletePageClick = (pageNum) => {
    setPageToDelete(pageNum);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletePage = () => {
    if (pageToDelete === null || pages.length <= 1) {
      setIsDeleteModalOpen(false);
      return;
    }

    const pageIdx = pageToDelete - 1;
    const targetPage = pages[pageIdx];

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
      // Auto-dismiss success notice after 7 seconds
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
      {/* Top WYSIWYG Formatting & Page Management Toolbar */}
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
        totalPages={totalPages}
        onMovePageUp={handleMovePageUp}
        onMovePageDown={handleMovePageDown}
        onAddBlankPage={handleAddBlankPage}
        onDeletePageClick={handleDeletePageClick}
        hasUnsavedChanges={hasUnsavedChanges}
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
        {/* Left Sidebar with Tab Switching (Pages vs Library) */}
        <aside className="magazine-editor__sidebar">
          <div className="magazine-editor__sidebar-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'pages'}
              className={`magazine-editor__sidebar-tab ${
                sidebarTab === 'pages'
                  ? 'magazine-editor__sidebar-tab--active'
                  : ''
              }`}
              onClick={() => setSidebarTab('pages')}
            >
              <span>Pages ({totalPages})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'library'}
              className={`magazine-editor__sidebar-tab ${
                sidebarTab === 'library'
                  ? 'magazine-editor__sidebar-tab--active'
                  : ''
              }`}
              onClick={() => setSidebarTab('library')}
            >
              <span>Article Library</span>
            </button>
          </div>

          <div className="magazine-editor__sidebar-content">
            {sidebarTab === 'pages' ? (
              <PageThumbnailsSidebar
                pages={pages}
                activePageNumber={currentPage}
                onSelectPage={handleSelectPage}
                onMovePageUp={handleMovePageUp}
                onMovePageDown={handleMovePageDown}
                onDeletePageClick={handleDeletePageClick}
                onAddBlankPage={handleAddBlankPage}
                articleTitle={article.title}
              />
            ) : (
              renderLibrarySidebar
            )}
          </div>
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
            {pages.map((page) => (
              <div
                key={`editor-sheet-${page.pageNumber}`}
                id={`editor-sheet-${page.pageNumber}`}
                className={`magazine-editor__sheet-wrapper ${
                  currentPage === page.pageNumber
                    ? 'magazine-editor__sheet-wrapper--active'
                    : ''
                }`}
                onClick={() => setActivePageNumber(page.pageNumber)}
              >
                <MagazinePage
                  article={article}
                  pageNumber={page.pageNumber}
                  totalPages={totalPages}
                  isFirstPage={page.isFirstPage}
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
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Measurement Sandbox (Offscreen) */}
      <div
        ref={measureContainerRef}
        className="magazine-measurement-sandbox"
        aria-hidden="true"
      >
        <div
          data-measure="hero-block"
          className="magazine-hero-block"
          style={{ width: '658px' }}
        >
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

        <div
          className="magazine-measurement-column"
          style={{ width: `${COLUMN_WIDTH_PX}px` }}
        >
          {article.sections?.map((sec, idx) => (
            <div
              key={`m-sec-${idx}`}
              data-measure-section={sec.id || `sec-${idx}`}
            >
              <RenderMeasurementItem
                section={sec}
                onImageLoad={onMeasureImageLoad}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Page Deletion */}
      <DeletePageModal
        isOpen={isDeleteModalOpen}
        pageNumber={pageToDelete || 1}
        totalPages={totalPages}
        onConfirm={handleConfirmDeletePage}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
      />
    </div>
  );
}

/**
 * Offscreen element rendering for height measurement.
 */
function RenderMeasurementItem({ section, onImageLoad }) {
  if (!section) return null;

  switch (section.type) {
    case 'heading': {
      const HeadingTag = `h${section.level || 2}`;
      return (
        <HeadingTag
          className={`magazine-heading magazine-heading--h${section.level || 2}`}
        >
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

export default MagazineEditor;
