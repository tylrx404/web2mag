import './CoverPage.css';

/**
 * CoverPage renders the A4 magazine cover page.
 * Modelled on ENTECH September 2026, Volume 4 Issue 9.
 *
 * @param {{
 *   issueConfig: {
 *     magazineTitle: string,
 *     volume: string,
 *     issue: string,
 *     date: string,
 *     issn: string,
 *     website: string,
 *     publisher: string,
 *     coverHeadline: string,
 *     coverSubhead: string,
 *     coverTag?: string,
 *     coverImageUrl?: string
 *   },
 *   pageData: {
 *     coverHeadline: string,
 *     coverSubhead: string,
 *     coverImage: string,
 *     leadArticle?: object,
 *     featuredArticles?: Array<object>
 *   }
 * }} props
 */
export function CoverPage({ issueConfig, pageData }) {
  const headline = pageData?.coverHeadline || issueConfig?.coverHeadline || 'Featured Issue Cover Story';
  const subhead = pageData?.coverSubhead || issueConfig?.coverSubhead || '';
  const heroImage = pageData?.coverImage || issueConfig?.coverImageUrl || '';
  const featured = pageData?.featuredArticles || [];

  return (
    <article className="a4-cover-page" aria-label="Magazine Cover Page">
      {/* 1. TOP HEADER & METADATA BAR */}
      <header className="cover-header">
        <div className="cover-header__top-row">
          <div className="cover-header__edition">
            <span>{issueConfig.date}</span>
            <span className="cover-header__dot">•</span>
            <span>
              {issueConfig.volume} | {issueConfig.issue}
            </span>
          </div>
          <span className="cover-header__web">{issueConfig.website}</span>
        </div>

        {/* 2. PROMINENT MASTHEAD */}
        <div className="cover-masthead">
          <h1 className="cover-masthead__brand">{issueConfig.magazineTitle}</h1>
          <div className="cover-masthead__sub">
            <span>Engineering &amp; Editorial</span>
          </div>
        </div>

        {/* ISSN BAR */}
        <div className="cover-issn-bar">
          <span className="cover-issn-bar__text">
            {issueConfig.issn?.startsWith('ISSN')
              ? issueConfig.issn
              : `ISSN (Online): ${issueConfig.issn || '2584-2749'}`}
          </span>
          <span className="cover-issn-bar__pill">{issueConfig.coverTag || 'MONTHLY EDITION'}</span>
        </div>
      </header>

      {/* 3. HERO COVER STORY & FEATURED IMAGE */}
      <main className="cover-body">
        <div className="cover-hero-card">
          {heroImage ? (
            <img
              src={heroImage}
              alt={`Cover illustration for ${headline}`}
              className="cover-hero-image"
            />
          ) : (
            <div className="cover-hero-image" style={{ background: '#0f172a' }} />
          )}
          <div className="cover-hero-overlay" />
          <div className="cover-hero-content">
            <span className="cover-hero-badge">Cover Feature</span>
            <h2 className="cover-hero-title">{headline}</h2>
            {subhead && <p className="cover-hero-subhead">{subhead}</p>}
          </div>
        </div>

        {/* 4. FEATURED STORIES CALLOUT GRID */}
        {featured.length > 1 && (
          <section className="cover-stories-section" aria-label="Inside This Issue">
            <div className="cover-stories-heading">Inside This Issue</div>
            <div className="cover-stories-grid">
              {featured.slice(1, 5).map((story) => (
                <div key={story.id} className="cover-story-card">
                  <span className="cover-story-card__category">
                    {story.category || 'EDITORIAL'}
                  </span>
                  <h3 className="cover-story-card__title">{story.title}</h3>
                  <span className="cover-story-card__author">
                    By {story.author || 'Editorial Staff'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 5. COVER FOOTER */}
      <footer className="cover-footer">
        <span className="cover-footer__publisher">{issueConfig.publisher}</span>
        <span>
          {issueConfig.magazineTitle} • {issueConfig.date} • Folio 01
        </span>
      </footer>
    </article>
  );
}

export default CoverPage;
