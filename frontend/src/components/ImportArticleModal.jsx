import { useEffect, useId, useRef, useState } from 'react';
import {
  TEST_FAILURE_URL,
  TEST_PCB_URL,
  TEST_SUCCESS_URL,
  TEST_WP_NEWS_URL,
  validateArticleUrl,
} from '../data/mockArticles.js';
import './ImportArticleModal.css';

/**
 * Reusable Import Article Modal component.
 * Validates HTTP/HTTPS article URLs using the native URL constructor and simulates
 * an asynchronous article import with loading, success, and error states.
 *
 * @param {{
 *   isOpen?: boolean,
 *   onClose: () => void,
 *   onImport: (article: {
 *     id: string,
 *     title: string,
 *     author: string,
 *     thumbnail: string,
 *     sourceUrl: string,
 *     status: string
 *   }) => void
 * }} props
 */
export function ImportArticleModal({ isOpen = true, onClose, onImport }) {
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const isMountedRef = useRef(false);

  const uniqueId = useId();
  const titleId = `import-modal-title-${uniqueId}`;
  const descId = `import-modal-desc-${uniqueId}`;
  const inputId = `import-modal-input-${uniqueId}`;
  const errorId = `import-modal-error-${uniqueId}`;
  const helperId = `import-modal-helper-${uniqueId}`;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetModalState = () => {
    setUrl('');
    setErrorMessage('');
    setIsImporting(false);
  };

  const handleClose = () => {
    if (isImporting) return;
    resetModalState();
    onClose?.();
  };

  // Focus management, Escape key listener, and scroll lock when modal is open
  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the URL input shortly after mount
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!isImporting) {
          event.preventDefault();
          resetModalState();
          onClose?.();
        }
        return;
      }

      // Trap Tab focus inside the modal dialog
      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, isImporting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (event) => {
    setUrl(event.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handlePresetSelect = (presetUrl) => {
    if (isImporting) return;
    setUrl(presetUrl);
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isImporting) return;

    const validation = validateArticleUrl(url);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      inputRef.current?.focus();
      return;
    }

    setErrorMessage('');
    setIsImporting(true);

    try {
      const response = await fetch('/api/articles/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: validation.normalizedUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            `Article ingestion failed (HTTP ${response.status}). Make sure the Web2Mag backend server is running on port 5001.`
        );
      }

      if (!isMountedRef.current) return;

      resetModalState();
      onImport?.(data.article);
      onClose?.();
    } catch (err) {
      if (!isMountedRef.current) return;
      setIsImporting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to import article from the provided URL. Please check the address and server status.'
      );
      inputRef.current?.focus();
    }
  };

  const hasError = Boolean(errorMessage);
  const describedByIds = hasError ? `${helperId} ${errorId}` : helperId;

  return (
    <div
      className="import-modal__backdrop"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="import-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="import-modal__header">
          <div className="import-modal__header-text">
            <h2 id={titleId} className="import-modal__title">
              Import Article
            </h2>
            <p id={descId} className="import-modal__description">
              Enter a public HTTP or HTTPS article URL to extract its title,
              author, and thumbnail into your magazine library.
            </p>
          </div>

          <button
            type="button"
            className="import-modal__close-btn"
            onClick={handleClose}
            disabled={isImporting}
            aria-label="Close Import Article modal"
            title="Close"
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
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form
          className="import-modal__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="import-modal__field">
            <label htmlFor={inputId} className="import-modal__label">
              Article URL
            </label>

            <div className="import-modal__input-wrapper">
              <input
                ref={inputRef}
                id={inputId}
                name="articleUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck="false"
                className={`import-modal__input ${
                  hasError ? 'import-modal__input--error' : ''
                }`}
                placeholder="https://example.com/article"
                value={url}
                onChange={handleInputChange}
                disabled={isImporting}
                aria-invalid={hasError}
                aria-describedby={describedByIds}
                required
              />
            </div>

            <p id={helperId} className="import-modal__helper">
              Supports WordPress REST API and semantic web articles. Try the ENTECH
              magazine articles or test failure handling with <code>{TEST_FAILURE_URL}</code>.
            </p>

            {/* Quick-fill test presets for rapid verification */}
            <div className="import-modal__presets" aria-label="Sample test URLs">
              <span className="import-modal__presets-label">Quick fill:</span>
              <button
                type="button"
                className="import-modal__preset-chip"
                onClick={() => handlePresetSelect(TEST_SUCCESS_URL)}
                disabled={isImporting}
                title="ENTECH Magazine: Do you Understand your Code?"
              >
                ENTECH: Code
              </button>
              <button
                type="button"
                className="import-modal__preset-chip"
                onClick={() => handlePresetSelect(TEST_PCB_URL)}
                disabled={isImporting}
                title="ENTECH Magazine: PCB Manufacturing"
              >
                ENTECH: PCB
              </button>
              <button
                type="button"
                className="import-modal__preset-chip"
                onClick={() => handlePresetSelect(TEST_WP_NEWS_URL)}
                disabled={isImporting}
                title="Official WordPress.org News"
              >
                WP News
              </button>
              <button
                type="button"
                className="import-modal__preset-chip import-modal__preset-chip--error"
                onClick={() => handlePresetSelect(TEST_FAILURE_URL)}
                disabled={isImporting}
                title="Trigger simulated error response"
              >
                Test Error URL
              </button>
            </div>

            {/* Inline Validation or Import Error Banner */}
            {hasError && (
              <div
                id={errorId}
                className="import-modal__error-box"
                role="alert"
                aria-live="assertive"
              >
                <svg
                  className="import-modal__error-icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="8" />
                  <line x1="10" y1="6.5" x2="10" y2="10.5" />
                  <circle cx="10" cy="13.5" r="0.5" fill="currentColor" />
                </svg>
                <span className="import-modal__error-text">{errorMessage}</span>
              </div>
            )}

            {/* Loading status indicator */}
            {isImporting && (
              <div
                className="import-modal__loading-banner"
                role="status"
                aria-live="polite"
              >
                <span
                  className="import-modal__spinner"
                  aria-hidden="true"
                />
                <span>Importing article...</span>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="import-modal__footer">
            <button
              type="button"
              className="import-modal__btn import-modal__btn--cancel"
              onClick={handleClose}
              disabled={isImporting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="import-modal__btn import-modal__btn--submit"
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <span
                    className="import-modal__spinner import-modal__spinner--light"
                    aria-hidden="true"
                  />
                  <span>Importing article...</span>
                </>
              ) : (
                <span>Import</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImportArticleModal;
