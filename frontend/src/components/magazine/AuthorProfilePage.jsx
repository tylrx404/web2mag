import './AuthorProfilePage.css';

/**
 * Extracts initials from an author's name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'ED';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

/**
 * AuthorProfilePage renders the A4 Contributor and Author Profile Page.
 * Modelled on ENTECH September 2026 Page 6.
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
 *   authors: Array<{
 *     name: string,
 *     role: string,
 *     bio: string,
 *     avatarUrl?: string,
 *     articles: string[]
 *   }>,
 *   pageNumber?: number
 * }} props
 */
export function AuthorProfilePage({
  issueConfig,
  authors = [],
  pageNumber = 6,
}) {
  return (
    <article className="a4-author-page" aria-label="About the Authors">
      {/* 1. RUNNING HEADER */}
      <header className="author-header">
        <div className="author-header__top-bar">
          <span className="author-header__brand">{issueConfig.magazineTitle}</span>
          <span>
            {issueConfig.volume} | {issueConfig.issue} • {issueConfig.date}
          </span>
          <span className="author-header__web">{issueConfig.website}</span>
        </div>

        <div className="author-header__rule" />

        <div className="author-title-row">
          <h1 className="author-title">About the Authors</h1>
          <span className="author-section-tag">Contributor Spotlight</span>
        </div>
      </header>

      {/* 2. AUTHORS CARDS */}
      <main className="author-body">
        <div className="author-cards-list">
          {authors.map((author, idx) => (
            <div key={`${author.name}-${idx}`} className="author-profile-card">
              <div className="author-avatar-frame" aria-hidden="true">
                {author.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="author-avatar-img"
                  />
                ) : (
                  <span>{getInitials(author.name)}</span>
                )}
              </div>

              <div className="author-info">
                <div className="author-name-row">
                  <h2 className="author-name">{author.name}</h2>
                  <span className="author-role">{author.role}</span>
                </div>

                <p className="author-bio">{author.bio}</p>

                {author.articles && author.articles.length > 0 && (
                  <div className="author-articles-list">
                    <span className="author-articles-label">Articles:</span>
                    {author.articles.map((artTitle, i) => (
                      <span key={i} className="author-article-pill">
                        {artTitle}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3. COLOPHON & END NOTE */}
        <div className="author-colophon">
          <div className="author-colophon__text">
            <span className="author-colophon__title">
              {issueConfig.magazineTitle} Editorial Board
            </span>
            <span>
              All articles published in this edition undergo peer and editorial review.
            </span>
          </div>
          <div>
            <span>Published by {issueConfig.publisher}</span>
          </div>
        </div>
      </main>

      {/* 4. RUNNING FOOTER */}
      <footer className="author-footer">
        <span>© {issueConfig.website}</span>
        <span>
          {issueConfig.magazineTitle} • {issueConfig.date}
        </span>
        <span className="author-footer__folio">Page {pageNumber}</span>
      </footer>
    </article>
  );
}

export default AuthorProfilePage;
