import './TableOfContentsPage.css';

/**
 * TableOfContentsPage renders the dynamic A4 Table of Contents page (Page 2).
 * Displays all articles with their calculated page numbers, authors, and categories.
 *
 * @param {{
 *   issueConfig: {
 *     magazineTitle: string,
 *     volume: string,
 *     issue: string,
 *     date: string,
 *     issn: string,
 *     website: string,
 *     publisher: string
 *   },
 *   entries: Array<{
 *     id: string,
 *     title: string,
 *     author: string,
 *     category: string,
 *     pageNumber: number,
 *     pageId: string,
 *     excerpt?: string
 *   }>,
 *   onNavigateToPage?: (pageId: string) => void
 * }} props
 */
export function TableOfContentsPage({
  issueConfig,
  entries = [],
  onNavigateToPage,
}) {
  return (
    <article className="a4-toc-page" aria-label="Table of Contents">
      {/* 1. RUNNING HEADER */}
      <header className="toc-header">
        <div className="toc-header__top-bar">
          <span className="toc-header__brand">{issueConfig.magazineTitle}</span>
          <span>
            {issueConfig.volume} | {issueConfig.issue} • {issueConfig.date}
          </span>
          <span className="toc-header__web">{issueConfig.website}</span>
        </div>

        <div className="toc-header__rule" />

        <div className="toc-title-row">
          <h1 className="toc-title">Table of Contents</h1>
          <span className="toc-issue-tag">Issue Catalog</span>
        </div>
      </header>

      {/* 2. DYNAMIC ARTICLE ENTRIES */}
      <main className="toc-body">
        <ul className="toc-entries-list" role="list">
          {entries.map((entry) => {
            const pageNumStr = String(entry.pageNumber).padStart(2, '0');
            return (
              <li
                key={entry.id}
                className="toc-entry-card"
                onClick={() => onNavigateToPage?.(entry.pageId)}
                title={`Jump to Page ${entry.pageNumber}`}
              >
                <div className="toc-entry__page-badge" aria-label={`Page ${entry.pageNumber}`}>
                  {pageNumStr}
                </div>

                <div className="toc-entry__content">
                  <div className="toc-entry__meta-row">
                    <span className="toc-entry__category">{entry.category}</span>
                    <span className="toc-entry__author">By {entry.author}</span>
                    {entry.pageCount > 1 && (
                      <span className="toc-entry__pages-tag">
                        {entry.pageCount} Pages
                      </span>
                    )}
                  </div>

                  <h2 className="toc-entry__title">{entry.title}</h2>

                  {entry.excerpt && (
                    <p className="toc-entry__desc">{entry.excerpt}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* 3. COLOPHON & PUBLICATION SPECS */}
        <div className="toc-colophon-card">
          <div className="toc-colophon__editorial">
            <span className="toc-colophon__publisher">{issueConfig.publisher}</span>
            <span>
              {issueConfig.issn?.startsWith('ISSN')
                ? issueConfig.issn
                : `ISSN (Online): ${issueConfig.issn || '2584-2749'}`}
            </span>
          </div>
          <div>
            <span>Format: Standard A4 Portrait (210 × 297 mm)</span>
          </div>
        </div>
      </main>

      {/* 4. RUNNING FOOTER */}
      <footer className="toc-footer">
        <span>© {issueConfig.website}</span>
        <span>
          {issueConfig.magazineTitle} • {issueConfig.date}
        </span>
        <span className="toc-footer__folio">Page 02</span>
      </footer>
    </article>
  );
}

export default TableOfContentsPage;
