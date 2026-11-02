import { useState } from 'react';
import './MagazineCover.css';

/**
 * High-end editorial Front Cover component for Web2Mag.
 * Standard A4 dimensions (210mm × 297mm).
 *
 * Dynamically driven by the selected Issue metadata and the Featured Article.
 * - When an extracted article image is available: renders a large, striking photographic cover with editorial overlays.
 * - When NO image is available: renders a clean, sophisticated typographic cover — never inventing fake imagery.
 *
 * @param {{
 *   issue: any,
 *   article: any,
 *   otherArticles?: any[],
 *   isEditable?: boolean,
 *   onUpdateHeadline?: (newHeadline: string) => void,
 *   onUpdateKicker?: (newKicker: string) => void,
 * }} props
 */
export function MagazineCover({
  issue = {},
  article,
  otherArticles = [],
  isEditable = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateHeadline,
  onUpdateKicker,
  onUpdateDeck,
  onUpdateAuthor,
  onUploadCoverImage,
  onRemoveCoverImage,
  onReplaceCoverPhoto,
  onRemoveCoverPhoto,
}) {
  const [imageLoadError, setImageLoadError] = useState(false);

  const volumeNumber = issue.volume_number || issue.volumeNumber || '1';
  const issueNumber = issue.issue_number || issue.issueNumber || '1';
  const issueDate = issue.publication_date || issue.publicationDate || 'Fall 2026';
  const accentColor = issue.accent_color || issue.accentColor || '#2563eb';
  const footerCredit =
    issue.footer_text ||
    issue.footerText ||
    `© ${new Date().getFullYear()} Editorial Edition • All rights reserved`;

  // Article data (single source of truth)
  const headline = article?.title || 'Featured Publication Article';
  const kicker = (article?.category || 'COVER STORY').toUpperCase();
  const author = article?.author ? `BY ${article.author.toUpperCase()}` : '';
  const summary = article?.summary || '';
  const coverImage = (!imageLoadError && article?.thumbnail && article.thumbnail.trim()) ? article.thumbnail.trim() : null;

  let sourceDomain = '';
  try {
    if (article?.sourceUrl) {
      sourceDomain = new URL(article.sourceUrl).hostname.replace(/^www\./i, '');
    }
  } catch {
    // Keep empty
  }

  // Teasers from other articles in the issue or major subheadings from current article
  const teasers = [];
  if (otherArticles && otherArticles.length > 0) {
    otherArticles.forEach((art) => {
      if (art.id !== article?.id && art.title && teasers.length < 3) {
        teasers.push({
          kicker: (art.category || 'FEATURE').toUpperCase(),
          title: art.title,
        });
      }
    });
  }

  // If no other articles in the issue, extract key story highlights from real article headings
  if (teasers.length === 0 && article?.sections) {
    const majorHeadings = article.sections
      .filter((s) => s.type === 'heading' && s.content && s.content.trim().toLowerCase() !== headline.trim().toLowerCase())
      .slice(0, 3);
    majorHeadings.forEach((h, idx) => {
      teasers.push({
        kicker: `FEATURE ${idx + 1}`,
        title: h.content,
      });
    });
  }

  return (
    <article
      className={`magazine-sheet magazine-cover ${coverImage ? 'magazine-cover--photo' : 'magazine-cover--typographic'}`}
      style={{
        '--accent-primary': accentColor,
        '--brand-accent': accentColor,
      }}
      aria-label={`Front Cover — ${headline} (Vol. ${volumeNumber} No. ${issueNumber})`}
    >
      {/* Background Image Layer (when photo is available) */}
      {coverImage ? (
        <div
          className={`magazine-cover__backdrop ${
            isEditable && selectedElementId === 'cover-image'
              ? 'magazine-cover__backdrop--selected'
              : ''
          }`}
          aria-hidden="true"
          onClick={() =>
            isEditable &&
            onSelectElement?.({
              id: 'cover-image',
              type: 'cover-image',
              src: coverImage,
            })
          }
        >
          <img
            src={coverImage}
            alt=""
            className="magazine-cover__backdrop-img"
            onError={() => setImageLoadError(true)}
          />
          <div className="magazine-cover__backdrop-gradient" />
        </div>
      ) : (
        <div className="magazine-cover__typographic-backdrop" aria-hidden="true">
          <div className="magazine-cover__geo-border" style={{ borderColor: accentColor }} />
          <div className="magazine-cover__geo-inner-border" />
        </div>
      )}

      {/* Editorial Cover Quick Photo Actions */}
      {isEditable && (
        <div className="magazine-cover__photo-actions" onClick={(e) => e.stopPropagation()}>
          {onReplaceCoverPhoto ? (
            <button
              type="button"
              className="magazine-cover-photo-btn"
              onClick={onReplaceCoverPhoto}
              title="Upload custom photo for magazine cover"
            >
              <span>📷 {coverImage ? 'Replace Cover Photo' : 'Add Cover Photo'}</span>
            </button>
          ) : (
            <label className="magazine-cover-photo-btn" title="Upload custom photo for magazine cover">
              <span>📷 {coverImage ? 'Replace Cover Photo' : 'Add Cover Photo'}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadCoverImage?.(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {coverImage && (
            <button
              type="button"
              className="magazine-cover-photo-btn magazine-cover-photo-btn--remove"
              onClick={onRemoveCoverPhoto || onRemoveCoverImage}
              title="Remove photo to use clean typographic layout"
            >
              ✕ Typographic
            </button>
          )}
        </div>
      )}

      {/* Cover Foreground Grid */}
      <div className="magazine-cover__content">
        {/* Top Dateline / Refined Issue Bar (No large magazine title) */}
        <header className="magazine-cover__header">
          <div className="magazine-cover__dateline-bar">
            <div className="magazine-cover__issue-pill-group">
              <span className="magazine-cover__edition-tag" style={{ color: accentColor }}>
                SPECIAL REPORT
              </span>
              <span className="magazine-cover__vol-issue">
                VOL. {volumeNumber} &bull; NO. {issueNumber}
              </span>
            </div>
            <div className="magazine-cover__date-tag">
              <span>{issueDate}</span>
            </div>
          </div>
          <div
            className="magazine-cover__header-rule"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, #38bdf8 45%, transparent 100%)`,
            }}
          />
        </header>

        {/* Middle Teaser Callouts Column (Side Column) */}
        {teasers.length > 0 && (
          <aside className="magazine-cover__teasers">
            <span className="magazine-cover__teasers-label" style={{ color: accentColor }}>
              INSIDE THIS ISSUE
            </span>
            <ul className="magazine-cover__teasers-list">
              {teasers.map((t, i) => (
                <li key={i} className="magazine-cover__teaser-item">
                  <span className="magazine-cover__teaser-kicker">{t.kicker}</span>
                  <span className="magazine-cover__teaser-title">{t.title}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Bottom Feature Box: The Real Article Headline & Deck */}
        <div className="magazine-cover__hero-block">
          <div
            className={`magazine-cover__kicker-pill ${isEditable ? 'magazine-editable-text' : ''} ${
              selectedElementId === 'cover-kicker' ? 'magazine-editable-text--active' : ''
            }`}
            style={{ backgroundColor: accentColor }}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onFocus={() => onSelectElement?.({ id: 'cover-kicker', type: 'kicker' })}
            onBlur={(e) => onUpdateKicker?.(e.currentTarget.innerText.trim())}
          >
            {kicker}
          </div>

          <h1
            className={`magazine-cover__headline ${isEditable ? 'magazine-editable-text' : ''} ${
              selectedElementId === 'cover-title' ? 'magazine-editable-text--active' : ''
            }`}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onFocus={() => onSelectElement?.({ id: 'cover-title', type: 'title' })}
            onBlur={(e) => onUpdateHeadline?.(e.currentTarget.innerText.trim())}
          >
            {headline}
          </h1>

          <p
            className={`magazine-cover__deck ${isEditable ? 'magazine-editable-text' : ''} ${
              selectedElementId === 'cover-deck' ? 'magazine-editable-text--active' : ''
            }`}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onFocus={() => onSelectElement?.({ id: 'cover-deck', type: 'summary' })}
            onBlur={(e) => onUpdateDeck?.(e.currentTarget.innerText.trim())}
          >
            {summary || (isEditable ? 'Click here to add an editorial standfirst deck for the cover story...' : '')}
          </p>

          <div className="magazine-cover__byline-row">
            <span
              className={`magazine-cover__byline ${isEditable ? 'magazine-editable-text' : ''} ${
                selectedElementId === 'cover-author' ? 'magazine-editable-text--active' : ''
              }`}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onFocus={() => onSelectElement?.({ id: 'cover-author', type: 'author' })}
              onBlur={(e) => {
                const text = e.currentTarget.innerText.trim().replace(/^BY\s+/i, '');
                onUpdateAuthor?.(text);
              }}
            >
              {author || (isEditable ? 'BY EDITORIAL AUTHOR' : '')}
            </span>
            {sourceDomain && (
              <span className="magazine-cover__source-tag">
                VIA {sourceDomain.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Barcode, Pricing, and Rights */}
        <footer className="magazine-cover__footer">
          <div className="magazine-cover__barcode-box">
            <div className="magazine-cover__barcode-lines" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
              <span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
            </div>
            <span className="magazine-cover__barcode-num">ISSN 2584-2749</span>
          </div>

          <div className="magazine-cover__pricing">
            <span>SPECIAL ISSUE</span>
            <strong>PRINT &amp; DIGITAL</strong>
          </div>

          <div className="magazine-cover__rights">
            <span>{footerCredit}</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default MagazineCover;
