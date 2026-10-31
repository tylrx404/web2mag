import { useRef } from 'react';
import './EditorToolbar.css';

/**
 * Top interactive WYSIWYG formatting toolbar for Web2Mag.
 * Houses text formatting (bold, italic, underline, alignment),
 * image controls (upload, resize, alignment, caption),
 * and page management actions.
 *
 * @param {{
 *   isEditMode: boolean,
 *   onToggleEditMode: () => void,
 *   columnMode: 'two-column' | 'single-column',
 *   onToggleColumnMode: (mode: 'two-column' | 'single-column') => void,
 *   zoomLevel: number,
 *   onZoomChange: (delta: number) => void,
 *   onZoomReset: () => void,
 *   onPrint: () => void,
 *   selectedElement: any,
 *   onFormatText: (command: string, value?: string) => void,
 *   onImageWidthChange: (width: string) => void,
 *   onImageAlignmentChange: (align: string) => void,
 *   onUploadImageFile: (file: File) => void,
 *   onDeleteSelectedImage: () => void,
 *   activePageNumber: number,
 *   totalPages: number,
 *   onMovePageUp: (pageNumber: number) => void,
 *   onMovePageDown: (pageNumber: number) => void,
 *   onAddBlankPage: () => void,
 *   onDeletePageClick: (pageNumber: number) => void,
 *   hasUnsavedChanges?: boolean,
 *   onExportPdf?: () => void,
 *   isExporting?: boolean,
 *   exportProgressText?: string
 * }} props
 */
export function EditorToolbar({
  isEditMode,
  onToggleEditMode,
  columnMode,
  onToggleColumnMode,
  zoomLevel,
  onZoomChange,
  onZoomReset,
  onPrint,
  selectedElement,
  onFormatText,
  onImageWidthChange,
  onImageAlignmentChange,
  onUploadImageFile,
  onDeleteSelectedImage,
  activePageNumber = 1,
  totalPages = 1,
  onMovePageUp,
  onMovePageDown,
  onAddBlankPage,
  onDeletePageClick,
  hasUnsavedChanges = false,
  onExportPdf,
  isExporting = false,
  exportProgressText = 'Exporting...',
}) {
  const fileInputRef = useRef(null);

  const isImageSelected =
    selectedElement?.type === 'image' || selectedElement?.type === 'hero-image';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImageFile(file);
      e.target.value = '';
    }
  };

  const handleUploadBtnClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Magazine Editor Controls">
      {/* Hidden file input for uploading custom images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="editor-toolbar__section">
        {/* Mode Switcher */}
        <div className="editor-toolbar__group">
          <button
            type="button"
            className={`editor-btn ${isEditMode ? 'editor-btn--active-mode' : ''}`}
            onClick={onToggleEditMode}
            title={isEditMode ? 'Currently editing inline' : 'Switch to visual editing mode'}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" />
            </svg>
            <span>{isEditMode ? 'WYSIWYG Editing' : 'Preview Mode'}</span>
          </button>
          {hasUnsavedChanges && (
            <span className="editor-toolbar__unsaved-indicator" title="Edits are preserved in session">
              • Edited
            </span>
          )}
        </div>

        <div className="editor-toolbar__divider" aria-hidden="true" />

        {/* Text Formatting Controls */}
        <div className="editor-toolbar__group">
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('bold')}
            title="Bold (Ctrl+B)"
            aria-label="Format Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('italic')}
            title="Italic (Ctrl+I)"
            aria-label="Format Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('underline')}
            title="Underline (Ctrl+U)"
            aria-label="Format Underline"
          >
            <u>U</u>
          </button>

          <div className="editor-toolbar__mini-divider" aria-hidden="true" />

          {/* Text Alignment */}
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('justifyLeft')}
            title="Align Left"
            aria-label="Align Left"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
              <rect x="2" y="7" width="8" height="1.5" rx="0.5" />
              <rect x="2" y="11" width="10" height="1.5" rx="0.5" />
            </svg>
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('justifyCenter')}
            title="Align Center"
            aria-label="Align Center"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
              <rect x="4" y="7" width="8" height="1.5" rx="0.5" />
              <rect x="3" y="11" width="10" height="1.5" rx="0.5" />
            </svg>
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onFormatText('justifyFull')}
            title="Justify (Standard Magazine Columns)"
            aria-label="Justify Columns"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
              <rect x="2" y="7" width="12" height="1.5" rx="0.5" />
              <rect x="2" y="11" width="12" height="1.5" rx="0.5" />
            </svg>
          </button>
        </div>

        <div className="editor-toolbar__divider" aria-hidden="true" />

        {/* Image Management Tools (Active when an image is clicked or selected) */}
        <div className={`editor-toolbar__group ${isImageSelected ? 'editor-toolbar__group--highlight' : ''}`}>
          <button
            type="button"
            className="editor-btn"
            onClick={handleUploadBtnClick}
            title="Upload custom image from computer"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <circle cx="5.5" cy="5.5" r="1.5" />
              <path d="M14 11l-4-4-5 5" />
            </svg>
            <span>{isImageSelected ? 'Replace Image' : 'Upload Image'}</span>
          </button>

          {isImageSelected && (
            <>
              {/* Width Presets */}
              <div className="editor-btn-group">
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.width === '50%' ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageWidthChange('50%')}
                  title="50% Column Width"
                >
                  50%
                </button>
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.width === '75%' ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageWidthChange('75%')}
                  title="75% Column Width"
                >
                  75%
                </button>
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.width === '100%' || !selectedElement?.width ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageWidthChange('100%')}
                  title="100% Full Column Width"
                >
                  100%
                </button>
              </div>

              {/* Image Alignment */}
              <div className="editor-btn-group">
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.align === 'left' ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageAlignmentChange('left')}
                  title="Align Image Left"
                >
                  Left
                </button>
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.align === 'center' || !selectedElement?.align ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageAlignmentChange('center')}
                  title="Align Image Center"
                >
                  Center
                </button>
                <button
                  type="button"
                  className={`editor-btn editor-btn--sm ${selectedElement?.align === 'right' ? 'editor-btn--active' : ''}`}
                  onClick={() => onImageAlignmentChange('right')}
                  title="Align Image Right"
                >
                  Right
                </button>
              </div>

              {/* Remove selected image */}
              <button
                type="button"
                className="editor-btn editor-btn--danger"
                onClick={onDeleteSelectedImage}
                title="Remove this image"
              >
                Delete Image
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Group: Page Actions & View Controls */}
      <div className="editor-toolbar__section">
        {/* Page Position Indicator & Quick Reorder */}
        <div className="editor-toolbar__group">
          <span className="editor-toolbar__page-indicator">
            Page {activePageNumber} of {totalPages}
          </span>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onMovePageUp(activePageNumber)}
            disabled={activePageNumber <= 1}
            title="Move this page up"
          >
            ↑
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onMovePageDown(activePageNumber)}
            disabled={activePageNumber >= totalPages}
            title="Move this page down"
          >
            ↓
          </button>
          <button
            type="button"
            className="editor-btn"
            onClick={onAddBlankPage}
            title="Insert a blank A4 page"
          >
            + Blank Page
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--danger"
            onClick={() => onDeletePageClick(activePageNumber)}
            disabled={totalPages <= 1}
            title="Delete current page"
          >
            Delete Page
          </button>
        </div>

        <div className="editor-toolbar__divider" aria-hidden="true" />

        {/* Layout Column Toggle */}
        <div className="editor-btn-group">
          <button
            type="button"
            className={`editor-btn ${columnMode === 'two-column' ? 'editor-btn--active' : ''}`}
            onClick={() => onToggleColumnMode('two-column')}
            title="2-Column symmetric magazine layout"
          >
            2-Col
          </button>
          <button
            type="button"
            className={`editor-btn ${columnMode === 'single-column' ? 'editor-btn--active' : ''}`}
            onClick={() => onToggleColumnMode('single-column')}
            title="1-Column wide layout"
          >
            1-Col
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="editor-btn-group">
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onZoomChange(-10)}
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--label"
            onClick={onZoomReset}
            title="Reset Zoom"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onZoomChange(10)}
            title="Zoom In"
          >
            +
          </button>
        </div>

        {/* Browser Print Fallback */}
        <button
          type="button"
          className="editor-btn"
          onClick={onPrint}
          title="Print using browser dialog"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4 5 4 2 12 2 12 5" />
            <path d="M4 11H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" />
            <rect x="4" y="9" width="8" height="5" rx="1" />
          </svg>
          <span>Print</span>
        </button>

        {/* Server Puppeteer Export PDF Button */}
        <button
          type="button"
          className={`editor-btn editor-btn--export ${
            isExporting ? 'editor-btn--loading' : ''
          }`}
          onClick={onExportPdf}
          disabled={isExporting}
          title="Export high-resolution multi-page A4 PDF using Headless Chrome"
        >
          {isExporting ? (
            <>
              <span className="editor-btn__spinner" aria-hidden="true" />
              <span>{exportProgressText || 'Generating...'}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
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
  );
}

export default EditorToolbar;
