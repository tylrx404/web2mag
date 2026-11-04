import './MagazineToc.css';

/**
 * Polished Editorial Table of Contents (Page 2) Component for Web2Mag.
 * Standard A4 dimensions (210mm × 297mm).
 *
 * Dynamically maps actual article titles, authors, categories, and correct page numbers.
 * When there is only one article, displays the lead feature card and a detailed section breakdown
 * mapping real article sections to their exact continuation page numbers (Pages 3..N).
 *
 * @param {{
 *   article: any,
 *   articles?: any[],
 *   pages?: any[],
 *   totalPages?: number,
 *   issue?: any,
 *   onSelectPage?: (pageNumber: number) => void
 * }} props
 */
export function MagazineToc({
  article,
  articles = [],
  pages = [],
  totalPages = 6,
  issue = {},
  onSelectPage,
}) {
  const volumeNumber = issue.volume_number || issue.volumeNumber || '1';
  const issueNumber = issue.issue_number || issue.issueNumber || '1';
  const issueDate = issue.publication_date || issue.publicationDate || 'Fall 2026';
  const accentColor = issue.accent_color || issue.accentColor || '#2563eb';
  const headerText =
    issue.header_text || issue.headerText || 'MAGAZINE OF SCIENCE, ENGINEERING & TECHNOLOGY';
  const footerText =
    issue.footer_text || issue.footerText || `© ${new Date().getFullYear()} Web2Mag • All rights reserved`;

  const coverArticle = article || articles[0] || {};
  const coverTitle = coverArticle.title || 'Featured Article';
  const coverAuthor = coverArticle.author || 'Editorial Staff';
  const coverCategory = (coverArticle.category || 'COVER STORY').toUpperCase();
  const coverSummary =
    coverArticle.summary ||
    'An in-depth editorial analysis exploring technical concepts, code craft, and engineering practices.';

  let sourceDomain = '';
  try {
    if (coverArticle.sourceUrl) {
      sourceDomain = new URL(coverArticle.sourceUrl).hostname.replace(/^www\./i, '');
    }
  } catch {
    sourceDomain = 'entechonline.com';
  }

  // Build the Table of Contents entries from real content
  // Multi-article mode if multiple articles exist in the issue
  const hasMultipleArticles = articles && articles.length > 1;

  let tocEntries = [];

  if (hasMultipleArticles) {
    // Multi-article issue: map each article to its starting page
    let currentStartPage = 3;
    tocEntries = articles.map((art, idx) => {
      const artPage = currentStartPage;
      // Estimate 2-3 pages per article if not directly paginated
      currentStartPage += Math.max(2, Math.ceil((art.sections?.length || 10) / 10));
      return {
        pageNumber: artPage,
        title: art.title,
        kicker: (art.category || `FEATURE ${idx + 1}`).toUpperCase(),
        author: art.author || 'Staff Writer',
        snippet: art.summary || '',
        articleId: art.id,
      };
    });
  } else {
    // Single-article mode: build section index from actual paginated pages!
    // Page 1 of article = Publication Page 3
    // Page 2 of article = Publication Page 4
    // Page 3 of article = Publication Page 5, etc.
    if (pages && pages.length > 0) {
      pages.forEach((p, idx) => {
        const publicationPageNum = idx + 3;
        // Find the most prominent heading on this page, or generate an editorial topic
        const headingSection = p.sections?.find((s) => s.type === 'heading');
        const firstParagraph = p.sections?.find((s) => s.type === 'paragraph');

        let title = '';
        let kicker = `SECTION ${idx + 1}`;

        if (idx === 0) {
          title = 'Introduction & Editorial Foundations';
          kicker = 'OPENING';
        } else if (headingSection && headingSection.content) {
          title = headingSection.content;
          kicker = `PART ${idx + 1}`;
        } else if (firstParagraph && firstParagraph.content) {
          title = firstParagraph.content.slice(0, 60).replace(/\s+\S*$/, '') + '...';
        } else {
          title = `Technical Analysis Continued`;
        }

        const snippet = firstParagraph?.content ? firstParagraph.content.slice(0, 110) + '...' : '';

        // Omit Page 3 from the section list since Page 3 is already prominent in the Hero Card
        if (publicationPageNum > 3) {
          tocEntries.push({
            pageNumber: publicationPageNum,
            title,
            kicker,
            snippet,
          });
        }
      });
    }

    // Fallback if pages not yet measured: extract from raw article headings
    if (tocEntries.length === 0 && coverArticle.sections) {
      const headings = coverArticle.sections
        .filter((s) => s.type === 'heading' && s.content && s.content.trim() !== coverTitle.trim())
        .slice(0, 4);

      headings.forEach((h, idx) => {
        tocEntries.push({
          pageNumber: idx + 4,
          title: h.content,
          kicker: `PART ${idx + 1}`,
          snippet: '',
        });
      });
    }
  }

  return (
    <article
      className="magazine-sheet magazine-sheet--a4 magazine-toc"
      style={{
        '--brand-accent': accentColor,
        '--accent-primary': accentColor,
      }}
      aria-label="Table of Contents — Page 2"
    >
      {/* Running Header */}
      <header className="magazine-header">
        <div className="magazine-header__top-row">
          <span className="magazine-header__kicker" style={{ color: accentColor }}>
            TABLE OF CONTENTS
          </span>
          <span className="magazine-header__center-title">
            IN THIS ISSUE • EDITORIAL INDEX
          </span>
          <span className="magazine-header__date-vol">
            VOLUME {volumeNumber} • ISSUE {issueNumber} | {issueDate}
          </span>
        </div>
        <div
          className="magazine-header__rule"
          style={{
            background: `linear-gradient(90deg, ${accentColor} 0%, #0a1128 40%, #e2e8f0 100%)`,
          }}
          aria-hidden="true"
        />
      </header>

      {/* Title Header Block */}
      <div className="magazine-toc__header-block">
        <div className="magazine-toc__kicker-row">
          <span className="magazine-toc__kicker-pill" style={{ backgroundColor: accentColor }}>
            PUBLICATION INDEX
          </span>
          <span className="magazine-toc__issue-tag">
            VOL. {volumeNumber} • NO. {issueNumber}
          </span>
        </div>
        <h1 className="magazine-toc__main-title">CONTENTS</h1>
        <p className="magazine-toc__deck">
          A curated editorial edition featuring in-depth technical analysis and engineering insights.
        </p>
      </div>

      {/* Main TOC Layout Grid */}
      <div className="magazine-toc__body-grid">
        {/* Left Column: Featured Cover Story & Section Index */}
        <div className="magazine-toc__main-col">
          {/* Featured Cover Story Entry (Page 03) */}
          <div
            className="magazine-toc__hero-card"
            style={{ borderLeftColor: accentColor }}
            onClick={() => onSelectPage?.(3)}
            title="Click to view Cover Story on Page 3"
          >
            <div className="magazine-toc__hero-top">
              <div className="magazine-toc__page-badge" style={{ color: accentColor }}>
                <span className="magazine-toc__page-prefix">PAGE</span>
                <strong className="magazine-toc__page-num">03</strong>
              </div>
              <span className="magazine-toc__hero-kicker">{coverCategory}</span>
            </div>

            <h2 className="magazine-toc__hero-title">{coverTitle}</h2>
            <p className="magazine-toc__hero-deck">{coverSummary}</p>

            <div className="magazine-toc__hero-byline">
              <span>By <strong className="magazine-toc__hero-author">{coverAuthor}</strong></span>
              {sourceDomain && <span>&bull; Source: {sourceDomain}</span>}
              <span>&bull; Published {issueDate}</span>
            </div>
          </div>

          {/* Detailed Section Breakdown / Articles List */}
          <div className="magazine-toc__section-block">
            <h3 className="magazine-toc__section-heading">
              <span>{hasMultipleArticles ? 'ADDITIONAL STORIES IN THIS ISSUE' : 'DETAILED TOPIC & SECTION BREAKDOWN'}</span>
              <span style={{ color: accentColor }}>PAGES 04–0{totalPages}</span>
            </h3>

            <ul className="magazine-toc__entries-list">
              {tocEntries.map((entry, idx) => (
                <li
                  key={idx}
                  className="magazine-toc__entry"
                  onClick={() => onSelectPage?.(entry.pageNumber)}
                  title={`Jump to Page ${entry.pageNumber}`}
                >
                  <span className="magazine-toc__entry-page" style={{ color: accentColor }}>
                    {entry.pageNumber < 10 ? `0${entry.pageNumber}` : entry.pageNumber}
                  </span>
                  <div className="magazine-toc__entry-content">
                    <div className="magazine-toc__entry-title-row">
                      <strong className="magazine-toc__entry-title">{entry.title}</strong>
                      <span className="magazine-toc__entry-kicker" style={{ color: accentColor }}>
                        {entry.kicker}
                      </span>
                    </div>
                    {entry.snippet && (
                      <p className="magazine-toc__entry-snippet">{entry.snippet}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Editorial Colophon & Issue Notes */}
        <div className="magazine-toc__side-col">
          <div className="magazine-toc__colophon">
            <h4 className="magazine-toc__colophon-title">EDITORIAL COLOPHON</h4>
            <p className="magazine-toc__colophon-text">
              Web2Mag is an editorial publishing platform converting real web journalism, research, and technical writing into standard ISO 216 A4 vector magazines.
            </p>

            <ul className="magazine-toc__meta-list">
              <li className="magazine-toc__meta-item">
                <span className="magazine-toc__meta-label">VOLUME &amp; ISSUE</span>
                <span className="magazine-toc__meta-val">Volume {volumeNumber}, Issue {issueNumber}</span>
              </li>
              <li className="magazine-toc__meta-item">
                <span className="magazine-toc__meta-label">PUBLICATION DATE</span>
                <span className="magazine-toc__meta-val">{issueDate}</span>
              </li>
              <li className="magazine-toc__meta-item">
                <span className="magazine-toc__meta-label">FORMAT SPECIFICATION</span>
                <span className="magazine-toc__meta-val">A4 Portrait (210mm &times; 297mm)</span>
              </li>
              <li className="magazine-toc__meta-item">
                <span className="magazine-toc__meta-label">ISSN REGISTRATION</span>
                <span className="magazine-toc__meta-val">ISSN 2584-2749 (Online)</span>
              </li>
              <li className="magazine-toc__meta-item">
                <span className="magazine-toc__meta-label">TYPOGRAPHIC SYSTEM</span>
                <span className="magazine-toc__meta-val">Playfair Display, Charter, Inter</span>
              </li>
            </ul>
          </div>

          <div className="magazine-toc__quote-card" style={{ borderLeftColor: accentColor }}>
            <p className="magazine-toc__quote-text">
              &ldquo;Understanding our code and tools is the foundation of enduring engineering craft.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Running Footer */}
      <footer className="magazine-footer">
        <div className="magazine-footer__left">
          <span>{footerText}</span>
        </div>
        <div className="magazine-footer__center">
          <span>VOLUME {volumeNumber} | ISSUE {issueNumber}</span>
        </div>
        <div className="magazine-footer__page-num">
          <span className="magazine-footer__page-label">Page</span>
          <strong>2 of {totalPages}</strong>
        </div>
      </footer>
    </article>
  );
}

export default MagazineToc;
