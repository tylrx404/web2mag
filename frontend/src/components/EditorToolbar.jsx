import { useRef } from 'react';
import './EditorToolbar.css';

/**
 * Top interactive WYSIWYG formatting toolbar for Web2Mag.
 * Houses text formatting, image controls, page management, and navigation actions.
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
  onBackToDashboard,
  onOpenPreview,
  onOpenSettings,
}) {
  const fileInputRef = useRef(null);

  const isImageSelected =
    selectedElement?.type === 'image' ||
    selectedElement?.type === 'hero-image' ||
    selectedElement?.type === 'cover-image';

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="editor-toolbar__section">
        {/* Exit to Dashboard */}
        {onBackToDashboard && (
          <button
            type="button"
            className="editor-btn editor-btn--back"
            onClick={onBackToDashboard}
            title="Return to Publications Dashboard"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
            >
              <polyline points="10 13 5 8 10 3" />
            </svg>
            <span>Dashboard</span>
          </button>
        )}

        <div className="editor-toolbar__divider" aria-hidden="true" />

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
              width="14"
              height="14"
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
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
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
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
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
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
              <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
              <rect x="2" y="7" width="12" height="1.5" rx="0.5" />
              <rect x="2" y="11" width="12" height="1.5" rx="0.5" />
            </svg>
          </button>
        </div>

        <div className="editor-toolbar__divider" aria-hidden="true" />

        {/* Image Management Tools */}
        <div className={`editor-toolbar__group ${isImageSelected ? 'editor-toolbar__group--highlight' : ''}`}>
          <button
            type="button"
            className="editor-btn"
            onClick={handleUploadBtnClick}
            title="Upload custom image from computer"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
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
        {/* Page Position Indicator & Quick Navigation */}
        <div className="editor-toolbar__group">
          <span className="editor-toolbar__page-indicator">
            {activePageNumber === 1
              ? 'Cover (1)'
              : activePageNumber === 2
              ? 'Contents (2)'
              : `Page ${activePageNumber} of ${totalPages}`}
          </span>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onMovePageUp(activePageNumber)}
            disabled={activePageNumber <= 3}
            title="Move interior page up"
          >
            ↑
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--icon"
            onClick={() => onMovePageDown(activePageNumber)}
            disabled={activePageNumber >= totalPages || activePageNumber <= 2}
            title="Move interior page down"
          >
            ↓
          </button>
          <button
            type="button"
            className="editor-btn"
            onClick={onAddBlankPage}
            title="Insert a blank A4 spread"
          >
            + Blank Spread
          </button>
          <button
            type="button"
            className="editor-btn editor-btn--danger"
            onClick={() => onDeletePageClick(activePageNumber)}
            disabled={totalPages <= 3 || activePageNumber <= 2}
            title="Delete current interior page"
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
            title="2-Column balanced editorial layout"
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
      </div>
    </div>
  );
}

export default EditorToolbar;
