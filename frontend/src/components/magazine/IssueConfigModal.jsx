import { useState } from 'react';
import { DEFAULT_ISSUE_CONFIG } from '../../data/issueConfig.js';
import './IssueConfigModal.css';

/**
 * Inner modal dialog component mounted when isOpen is true.
 * Ensures state is initialized freshly without cascading effect updates.
 */
function IssueConfigDialog({ issueConfig, onClose, onSave }) {
  const [formData, setFormData] = useState(issueConfig || DEFAULT_ISSUE_CONFIG);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({ ...prev, ...preset }));
  };

  return (
    <div className="issue-modal__backdrop" onClick={onClose} role="presentation">
      <div
        className="issue-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="issue-modal__header">
          <h2 id="issue-modal-title" className="issue-modal__title">
            Issue &amp; Publication Settings
          </h2>
          <button
            type="button"
            className="issue-modal__close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <form className="issue-modal__form" onSubmit={handleSubmit}>
          {/* Quick Preset Selector */}
          <div className="issue-modal__presets">
            <span>Quick Presets:</span>
            <button
              type="button"
              className="issue-preset-chip"
              onClick={() =>
                handleApplyPreset({
                  magazineTitle: 'ENTECH MAGAZINE',
                  volume: 'VOLUME 4',
                  issue: 'ISSUE 9',
                  date: 'September 2026',
                  issn: '2584-2749',
                  website: 'www.entechonline.com',
                })
              }
            >
              ENTECH Sept 2026 (Vol 4 Issue 9)
            </button>
            <button
              type="button"
              className="issue-preset-chip"
              onClick={() =>
                handleApplyPreset({
                  magazineTitle: 'ENTECH MAGAZINE',
                  volume: 'VOLUME 4',
                  issue: 'ISSUE 10',
                  date: 'October 2026',
                  issn: '2584-2749',
                  website: 'www.entechonline.com',
                })
              }
            >
              ENTECH Oct 2026 (Vol 4 Issue 10)
            </button>
          </div>

          <div className="issue-form-grid">
            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="magazineTitle">
                Magazine Title
              </label>
              <input
                id="magazineTitle"
                name="magazineTitle"
                type="text"
                className="issue-form-input"
                value={formData.magazineTitle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="issn">
                ISSN
              </label>
              <input
                id="issn"
                name="issn"
                type="text"
                className="issue-form-input"
                value={formData.issn}
                onChange={handleChange}
                placeholder="2584-2749"
              />
            </div>

            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="volume">
                Volume
              </label>
              <input
                id="volume"
                name="volume"
                type="text"
                className="issue-form-input"
                value={formData.volume}
                onChange={handleChange}
                placeholder="VOLUME 4"
                required
              />
            </div>

            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="issue">
                Issue Number
              </label>
              <input
                id="issue"
                name="issue"
                type="text"
                className="issue-form-input"
                value={formData.issue}
                onChange={handleChange}
                placeholder="ISSUE 9"
                required
              />
            </div>

            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="date">
                Publication Date
              </label>
              <input
                id="date"
                name="date"
                type="text"
                className="issue-form-input"
                value={formData.date}
                onChange={handleChange}
                placeholder="September 2026"
                required
              />
            </div>

            <div className="issue-form-field">
              <label className="issue-form-label" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="text"
                className="issue-form-input"
                value={formData.website}
                onChange={handleChange}
                placeholder="www.entechonline.com"
              />
            </div>

            <div className="issue-form-field issue-form-field--full">
              <label className="issue-form-label" htmlFor="publisher">
                Publisher
              </label>
              <input
                id="publisher"
                name="publisher"
                type="text"
                className="issue-form-input"
                value={formData.publisher}
                onChange={handleChange}
                placeholder="ENTECH Online Publications"
              />
            </div>

            <div className="issue-form-field issue-form-field--full">
              <label className="issue-form-label" htmlFor="coverHeadline">
                Cover Headline
              </label>
              <input
                id="coverHeadline"
                name="coverHeadline"
                type="text"
                className="issue-form-input"
                value={formData.coverHeadline}
                onChange={handleChange}
                placeholder="PCB Manufacturing: From Design to Real Product!"
              />
            </div>

            <div className="issue-form-field issue-form-field--full">
              <label className="issue-form-label" htmlFor="coverSubhead">
                Cover Subtitle
              </label>
              <input
                id="coverSubhead"
                name="coverSubhead"
                type="text"
                className="issue-form-input"
                value={formData.coverSubhead}
                onChange={handleChange}
                placeholder="Transforming Circuit Concepts into Hardware"
              />
            </div>
          </div>

          <div className="issue-modal__footer">
            <button
              type="button"
              className="issue-modal__btn issue-modal__btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="issue-modal__btn issue-modal__btn--save"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * IssueConfigModal allows the editorial team to dynamically configure:
 * - Publication Title & ISSN
 * - Volume & Issue number
 * - Publication Date
 * - Publisher name & website
 * - Cover Headline & Tag
 *
 * Ensures no issue metadata is hardcoded.
 *
 * @param {{
 *   isOpen: boolean,
 *   issueConfig: object,
 *   onClose: () => void,
 *   onSave: (newConfig: object) => void
 * }} props
 */
export function IssueConfigModal({ isOpen, issueConfig, onClose, onSave }) {
  if (!isOpen) return null;

  return (
    <IssueConfigDialog
      issueConfig={issueConfig}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

export default IssueConfigModal;
