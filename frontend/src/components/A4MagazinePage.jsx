import './A4MagazinePage.css';

/**
 * A4MagazinePage renders an authentic A4 portrait editorial magazine page (210mm x 297mm).
 * Implemented with visual reference to ENTECH September 2026, Volume 4 Issue 9.
 *
 * Supports multi-page automatic pagination:
 * - Page 1 (chunkIndex === 0): Full headline, category tag, byline bar, and 2-column body
 * - Continuation pages (chunkIndex > 0): Sleek editorial continuation bar, continued 2-column body
 * - Dynamic folio badge matching sequential issue page numbering
 * - Clean editorial placeholder when article body content is pending ingestion
 *
 * @param {{
 *   article?: {
 *     id?: string,
 *     title?: string,
 *     author?: string,
 *     category?: string,
 *     contentHtml?: string,
 *     featuredImageUrl?: string,
 *     sourceUrl?: string,
 *     status?: string
 *   } | null,
 *   pageNumber?: number,
 *   issueInfo?: {
 *     magazineTitle?: string,
 *     volume?: string,
 *     issue?: string,
 *     date?: string,
 *     issn?: string,
 *     website?: string
 *   },
 *   chunkIndex?: number,
 *   totalPagesForArticle?: number,
 *   isFirstPage?: boolean,
 *   isLastPage?: boolean,
 *   contentHtml?: string,
 *   isEmpty?: boolean
 * }} props
 */
export function A4MagazinePage({
  article,
  pageNumber = 9,
  issueInfo = {
    magazineTitle: 'ENTECH MAGAZINE',
    volume: 'VOLUME 4',
    issue: 'ISSUE 9',
    date: 'September 2026',
    issn: 'ISSN (Online): 2584-2749',
    website: 'www.entechonline.com',
  },
  chunkIndex = 0,
  totalPagesForArticle = 1,
  isFirstPage = true,
  contentHtml,
  isEmpty = false,
}) {
  const currentArticle = article || {
    title: 'PCB Manufacturing: From Design to Real Product!',
    author: 'Virendra Singh Shekhawat',
    category: 'CAREER FOCUS',
    contentHtml: '',
    sourceUrl: 'https://entechonline.com',
  };

  const activeHtml =
    contentHtml !== undefined ? contentHtml : currentArticle.contentHtml || '';

  const hasBodyContent = !isEmpty && Boolean(activeHtml && activeHtml.trim());

  return (
    <article
      className="a4-page"
      aria-label={`A4 Magazine Page ${pageNumber}${
        totalPagesForArticle > 1
          ? ` (${currentArticle.title} - Part ${chunkIndex + 1} of ${totalPagesForArticle})`
          : ''
      }`}
    >
      {/* 1. RUNNING HEADER */}
      <header className="a4-header">
        <div className="a4-header__top-bar">
          <div className="a4-header__brand-group">
            <span className="a4-header__brand-name">{issueInfo.magazineTitle}</span>
            <span className="a4-header__issn">
              {issueInfo.issn?.startsWith('ISSN')
                ? issueInfo.issn
                : `ISSN (Online): ${issueInfo.issn || '2584-2749'}`}
            </span>
          </div>
          <div className="a4-header__issue-meta">
            <span>
              {issueInfo.volume} | {issueInfo.issue}
            </span>
            <span className="a4-header__divider-dot">•</span>
            <span>{issueInfo.date}</span>
            <span className="a4-header__divider-dot">•</span>
            <span className="a4-header__web">{issueInfo.website}</span>
          </div>
        </div>

        <div className="a4-header__rule" />

        {/* 2. SECTION TAG & BLUE PAGE-NUMBER BADGE */}
        <div className="a4-header__nav-row">
          <div className="a4-header__folio-group">
            <div className="a4-folio-badge" aria-label={`Page ${pageNumber}`}>
              {pageNumber}
            </div>
            <span className="a4-category-tag">
              {currentArticle.category || 'EDITORIAL'}
            </span>
          </div>
          <span className="a4-header__edition">
            {issueInfo.date} • {issueInfo.volume}
          </span>
        </div>
      </header>

      {/* 3. HEADLINE BLOCK (Page 1) OR CONTINUATION BAR (Pages 2+) */}
      {isFirstPage ? (
        <div className="a4-headline-block">
          <h1 className="a4-headline">{currentArticle.title}</h1>
          <div className="a4-byline-bar">
            <span className="a4-byline__prefix">Written By:</span>
            <span className="a4-byline__author">
              {currentArticle.author || 'Editorial Staff'}
            </span>
            <span className="a4-byline__bullet">•</span>
            <span className="a4-byline__issue">
              {issueInfo.magazineTitle} • {issueInfo.date}
            </span>
          </div>
        </div>
      ) : (
        <div className="a4-continuation-bar">
          <div className="a4-continuation-bar__left">
            <span className="a4-continuation-title">{currentArticle.title}</span>
          </div>
          <div className="a4-continuation-bar__right">
            <span className="a4-continuation-tag">
              Continued • Part {chunkIndex + 1} of {totalPagesForArticle}
            </span>
          </div>
        </div>
      )}

      {/* 4. TWO-COLUMN ARTICLE CONTENT OR CLEAN PLACEHOLDER */}
      <section className="a4-body" aria-label="Article Content">
        {hasBodyContent ? (
          <div
            className="a4-columns"
            dangerouslySetInnerHTML={{ __html: activeHtml }}
          />
        ) : (
          <div className="a4-placeholder" role="status">
            <div className="a4-placeholder__notice-card">
              <span className="a4-placeholder__badge">
                <span className="a4-placeholder__dot" aria-hidden="true" />
                Draft Article • Metadata Imported
              </span>
              <h2 className="a4-placeholder__heading">
                Article Body Content Pending Ingestion
              </h2>
              <p className="a4-placeholder__text">
                This article has been cataloged in your issue library with validated
                metadata. Body content extraction, DOM parsing, and HTML sanitization
                will be executed in Phase 1B/2.
              </p>
              {currentArticle.sourceUrl && (
                <div className="a4-placeholder__source-chip">
                  Source: {currentArticle.sourceUrl}
                </div>
              )}
            </div>

            {/* Skeleton wireframe illustrating the 2-column layout */}
            <div
              className="a4-placeholder__skeleton-grid"
              aria-label="Layout wireframe illustration"
            >
              <div className="a4-skeleton-col">
                <div className="a4-skeleton-line a4-skeleton-line--long" />
                <div className="a4-skeleton-line" />
                <div className="a4-skeleton-line a4-skeleton-line--medium" />
                <div className="a4-skeleton-line" />
                <div className="a4-skeleton-box">Embedded Figure Placeholder</div>
                <div className="a4-skeleton-line a4-skeleton-line--short" />
                <div className="a4-skeleton-line" />
              </div>
              <div className="a4-skeleton-col">
                <div className="a4-skeleton-line a4-skeleton-line--medium" />
                <div className="a4-skeleton-line" />
                <div className="a4-skeleton-line a4-skeleton-line--long" />
                <div className="a4-skeleton-line a4-skeleton-line--short" />
                <div className="a4-skeleton-line" />
                <div className="a4-skeleton-line a4-skeleton-line--medium" />
                <div className="a4-skeleton-line" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. RUNNING FOOTER */}
      <footer className="a4-footer">
        <div className="a4-footer__rule" />
        <div className="a4-footer__inner">
          <span className="a4-footer__copy">© 2023-2026 {issueInfo.website}</span>
          <span className="a4-footer__center">
            {issueInfo.magazineTitle} • {issueInfo.date}
          </span>
          <span className="a4-footer__folio">
            Page {pageNumber}
            {totalPagesForArticle > 1 ? ` (${chunkIndex + 1}/${totalPagesForArticle})` : ''}
          </span>
        </div>
      </footer>
    </article>
  );
}

export default A4MagazinePage;
