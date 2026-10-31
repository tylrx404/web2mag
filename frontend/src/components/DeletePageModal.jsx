import { useEffect, useRef } from 'react';
import './DeletePageModal.css';

/**
 * Confirmation dialog modal for deleting a magazine page.
 *
 * @param {{
 *   isOpen: boolean,
 *   pageNumber: number,
 *   totalPages: number,
 *   onConfirm: () => void,
 *   onCancel: () => void
 * }} props
 */
export function DeletePageModal({
  isOpen,
  pageNumber,
  totalPages,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="delete-modal__backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="delete-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-page-title"
        aria-describedby="delete-page-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal__header">
          <div className="delete-modal__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 17 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <div className="delete-modal__titles">
            <h3 id="delete-page-title" className="delete-modal__title">
              Delete Page {pageNumber} of {totalPages}?
            </h3>
            <p id="delete-page-desc" className="delete-modal__desc">
              Are you sure you want to delete this page? The content and layout on
              this page will be removed from your magazine spread, and following
              pages will automatically re-paginate.
            </p>
          </div>
        </div>

        <div className="delete-modal__footer">
          <button
            type="button"
            className="delete-modal__btn delete-modal__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-modal__btn delete-modal__btn--confirm"
            onClick={onConfirm}
          >
            Delete Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletePageModal;
