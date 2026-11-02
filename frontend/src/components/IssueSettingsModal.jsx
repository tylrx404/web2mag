import { useState } from 'react';
import './IssueSettingsModal.css';

const PRESET_ACCENT_COLORS = [
  { label: 'Electric Blue', value: '#2563eb' },
  { label: 'Sapphire Cyan', value: '#0284c7' },
  { label: 'Deep Navy', value: '#0a1128' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Ruby Crimson', value: '#e11d48' },
  { label: 'Royal Violet', value: '#7c3aed' },
  { label: 'Amber Gold', value: '#d97706' },
];

/**
 * Modal to configure Magazine Issue Metadata, Masthead Branding, and Accent Colors.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   issue: any,
 *   onSaveIssue: (updatedIssue: any) => Promise<void> | void
 * }} props
 */
export function IssueSettingsModal({ isOpen, onClose, issue, onSaveIssue }) {
  const [formData, setFormData] = useState({
    title: issue?.title || 'Web2Mag Magazine',
    volume_number: issue?.volume_number || issue?.volumeNumber || '1',
    issue_number: issue?.issue_number || issue?.issueNumber || '1',
    publication_date: issue?.publication_date || issue?.publicationDate || 'Fall 2026',
    header_text: issue?.header_text || issue?.headerText || 'WEB2MAG • ISSN (ONLINE): 2584-2749',
    footer_text: issue?.footer_text || issue?.footerText || '© 2026 Web2Mag • All rights reserved',
    accent_color: issue?.accent_color || issue?.accentColor || '#2563eb',
    logo_path: issue?.logo_path || issue?.logoPath || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({ ...prev, accent_color: color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = {
        ...issue,
        ...formData,
        volumeNumber: formData.volume_number,
        issueNumber: formData.issue_number,
        publicationDate: formData.publication_date,
        headerText: formData.header_text,
        footerText: formData.footer_text,
        accentColor: formData.accent_color,
        logoPath: formData.logo_path,
      };

      await onSaveIssue?.(updated);
      setFeedback({ type: 'success', message: 'Magazine issue settings updated successfully.' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="issue-settings-card">
        <header className="issue-settings-header">
          <div className="issue-settings-header__title-row">
            <div className="issue-settings-header__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div>
              <h2 id="issue-settings-title" className="issue-settings-header__title">
                Magazine Issue & Masthead Settings
              </h2>
              <p className="issue-settings-header__desc">
                Configure publication volume, issue identifiers, running headers, footers, and brand palette.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="issue-settings-close-btn"
            onClick={onClose}
            aria-label="Close issue settings"
          >
            &times;
          </button>
        </header>

        {feedback && (
          <div className={`issue-settings-feedback issue-settings-feedback--${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="issue-settings-form">
          <div className="issue-settings-section">
            <h3 className="issue-settings-section__title">Publication Details</h3>
            <div className="issue-settings-grid issue-settings-grid--2col">
              <div className="issue-field-group">
                <label htmlFor="issue-title" className="issue-field-label">
                  Magazine Title / Brand
                </label>
                <input
                  id="issue-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="issue-input"
                  placeholder="e.g. Web2Mag Magazine"
                  required
                />
              </div>

              <div className="issue-field-group">
                <label htmlFor="publication-date" className="issue-field-label">
                  Publication Date / Season
                </label>
                <input
                  id="publication-date"
                  type="text"
                  name="publication_date"
                  value={formData.publication_date}
                  onChange={handleChange}
                  className="issue-input"
                  placeholder="e.g. Fall 2026 or September 2026"
                />
              </div>

              <div className="issue-field-group">
                <label htmlFor="volume-number" className="issue-field-label">
                  Volume Number
                </label>
                <input
                  id="volume-number"
                  type="text"
                  name="volume_number"
                  value={formData.volume_number}
                  onChange={handleChange}
                  className="issue-input"
                  placeholder="e.g. 1"
                  required
                />
              </div>

              <div className="issue-field-group">
                <label htmlFor="issue-number" className="issue-field-label">
                  Issue Number
                </label>
                <input
                  id="issue-number"
                  type="text"
                  name="issue_number"
                  value={formData.issue_number}
                  onChange={handleChange}
                  className="issue-input"
                  placeholder="e.g. 1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="issue-settings-section">
            <h3 className="issue-settings-section__title">Header & Footer Running Text</h3>
            <div className="issue-field-group">
              <label htmlFor="header-text" className="issue-field-label">
                Top Running Header Text
              </label>
              <input
                id="header-text"
                type="text"
                name="header_text"
                value={formData.header_text}
                onChange={handleChange}
                className="issue-input"
                placeholder="e.g. WEB2MAG • ISSN (ONLINE): 2584-2749"
              />
              <span className="issue-field-hint">
                Displayed centered on page sheets above the gradient accent rule.
              </span>
            </div>

            <div className="issue-field-group">
              <label htmlFor="footer-text" className="issue-field-label">
                Bottom Running Footer Text
              </label>
              <input
                id="footer-text"
                type="text"
                name="footer_text"
                value={formData.footer_text}
                onChange={handleChange}
                className="issue-input"
                placeholder="e.g. © 2026 Web2Mag • All rights reserved"
              />
              <span className="issue-field-hint">
                Displayed in the bottom left masthead corner alongside dynamic Page X of Y numbering.
              </span>
            </div>
          </div>

          <div className="issue-settings-section">
            <h3 className="issue-settings-section__title">Brand Accent Color</h3>
            <p className="issue-field-hint" style={{ marginBottom: '10px' }}>
              Used for decorative border lines, kickers, blockquote rules, and editorial pills in preview and vector PDF.
            </p>
            <div className="issue-color-palette">
              {PRESET_ACCENT_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`issue-color-swatch ${
                    formData.accent_color.toLowerCase() === preset.value.toLowerCase()
                      ? 'issue-color-swatch--active'
                      : ''
                  }`}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => handleColorSelect(preset.value)}
                  title={`${preset.label} (${preset.value})`}
                  aria-label={preset.label}
                />
              ))}
              <div className="issue-color-custom">
                <input
                  type="color"
                  name="accent_color"
                  value={formData.accent_color}
                  onChange={handleChange}
                  className="issue-color-picker"
                  title="Pick custom hex color"
                />
                <input
                  type="text"
                  name="accent_color"
                  value={formData.accent_color}
                  onChange={handleChange}
                  className="issue-input issue-input--color-hex"
                  placeholder="#4f46e5"
                />
              </div>
            </div>
          </div>

          <div className="issue-settings-section">
            <h3 className="issue-settings-section__title">Publication Logo URL (Optional)</h3>
            <div className="issue-field-group">
              <label htmlFor="logo-path" className="issue-field-label">
                Logo Image URL or Local Asset Path
              </label>
              <input
                id="logo-path"
                type="text"
                name="logo_path"
                value={formData.logo_path}
                onChange={handleChange}
                className="issue-input"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <footer className="issue-settings-actions">
            <button
              type="button"
              className="issue-btn issue-btn--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="issue-btn issue-btn--primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Settings...' : 'Save Issue Settings'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default IssueSettingsModal;
