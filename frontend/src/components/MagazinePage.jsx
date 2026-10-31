/**
 * Renders an individual A4 magazine page sheet (Page X of Y)
 * Supports WYSIWYG text editing, image selection, resizing, alignment, and drag-drop upload.
 */

export function MagazinePage({
  article,
  pageNumber,
  totalPages,
  isFirstPage,
  columnMode,
  columnHeight,
  sections = [],
  sourceDomain = 'entechonline.com',
  isEditable = true,
  selectedElementId = null,
  onSelectElement,
  onUpdateTitle,
  onUpdateAuthor,
  onUpdateSummary,
  onUpdateSection,
  onUpdateHeroImage,
  onDropImageOnFigure,
}) {
  const categoryLabel = (article.category || 'FEATURE FOCUS').toUpperCase();
  const authorName = article.author || 'Editorial Staff';
  const issueDate = article.formattedDate || 'Recent Issue';

  return (
    <article
      className={`magazine-sheet magazine-sheet--a4 ${
        !isFirstPage ? 'magazine-sheet--continuation' : ''
      }`}
      aria-label={`Magazine Page ${pageNumber} of ${totalPages} — ${article.title}`}
    >
      {/* Running Header */}
      <header className="magazine-header">
        <div className="magazine-header__top-row">
          {isFirstPage ? (
            <>
              <span className="magazine-header__kicker">{categoryLabel}</span>
              <span className="magazine-header__center-title">
                ENTECH MAGAZINE • ISSN (ONLINE): 2584-2749
              </span>
              <span className="magazine-header__date-vol">
                VOLUME 4 • ISSUE 9 | {issueDate}
              </span>
            </>
          ) : (
            <>
              <span className="magazine-header__kicker">
                {categoryLabel} (CONTINUED)
              </span>
              <span className="magazine-header__center-title">
                ENTECH MAGAZINE • {article.title}
              </span>
              <span className="magazine-header__date-vol">
                Page {pageNumber} of {totalPages}
              </span>
            </>
          )}
        </div>
        <div className="magazine-header__rule" aria-hidden="true" />
      </header>

      {/* Page 1 Hero Header Block */}
      {isFirstPage && (
        <div className="magazine-hero-block">
          <div className="magazine-category-pill">{categoryLabel}</div>

          {/* Editable Title */}
          <h1
            contentEditable={isEditable}
            suppressContentEditableWarning
            className={`magazine-headline ${isEditable ? 'magazine-editable-text' : ''} ${
              selectedElementId === 'title' ? 'magazine-editable-text--active' : ''
            }`}
            onFocus={() => onSelectElement?.({ id: 'title', type: 'title' })}
            onBlur={(e) => onUpdateTitle?.(e.currentTarget.innerText.trim())}
          >
            {article.title}
          </h1>

          <div className="magazine-byline-bar">
            <div className="magazine-byline-bar__author">
              <span className="magazine-byline-bar__label">Written By:</span>
              <strong
                contentEditable={isEditable}
                suppressContentEditableWarning
                className={`magazine-byline-bar__name ${
                  isEditable ? 'magazine-editable-text' : ''
                } ${selectedElementId === 'author' ? 'magazine-editable-text--active' : ''}`}
                onFocus={() => onSelectElement?.({ id: 'author', type: 'author' })}
                onBlur={(e) => onUpdateAuthor?.(e.currentTarget.innerText.trim())}
              >
                {authorName}
              </strong>
            </div>
            <div className="magazine-byline-bar__divider" aria-hidden="true" />
            <div className="magazine-byline-bar__date">
              <span>Published: {issueDate}</span>
            </div>
            {article.sourceUrl && (
              <>
                <div className="magazine-byline-bar__divider" aria-hidden="true" />
                <div className="magazine-byline-bar__source">
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="magazine-byline-bar__link"
                  >
                    Original Post
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Editable Standfirst / Lead Summary Callout Box */}
          {article.summary && (
            <div
              className={`magazine-standfirst ${
                isEditable ? 'magazine-editable-box' : ''
              } ${selectedElementId === 'summary' ? 'magazine-editable-box--active' : ''}`}
            >
              <p
                contentEditable={isEditable}
                suppressContentEditableWarning
                className={`magazine-standfirst__text ${isEditable ? 'magazine-editable-text' : ''}`}
                onFocus={() => onSelectElement?.({ id: 'summary', type: 'summary' })}
                onBlur={(e) => onUpdateSummary?.(e.currentTarget.innerText.trim())}
              >
                {article.summary}
              </p>
            </div>
          )}

          {/* Editable Featured Hero Figure */}
          {article.thumbnail && (
            <figure
              className={`magazine-featured-figure ${
                isEditable ? 'magazine-editable-figure' : ''
              } ${selectedElementId === 'hero-image' ? 'magazine-editable-figure--active' : ''}`}
              onClick={() =>
                onSelectElement?.({
                  id: 'hero-image',
                  type: 'hero-image',
                  src: article.thumbnail,
                  width: article.heroWidth || '100%',
                  align: article.heroAlign || 'center',
                })
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) onDropImageOnFigure?.('hero', file);
              }}
            >
              <img
                src={article.thumbnail}
                alt={`Cover illustration for ${article.title}`}
                className="magazine-featured-figure__img"
                style={{
                  width: article.heroWidth || '100%',
                  margin:
                    article.heroAlign === 'left'
                      ? '0 auto 0 0'
                      : article.heroAlign === 'right'
                      ? '0 0 0 auto'
                      : '0 auto',
                }}
              />
              <figcaption
                contentEditable={isEditable}
                suppressContentEditableWarning
                className={`magazine-featured-figure__caption ${
                  isEditable ? 'magazine-editable-text' : ''
                }`}
                onBlur={(e) =>
                  onUpdateHeroImage?.({ caption: e.currentTarget.innerText.trim() })
                }
              >
                {article.heroCaption || `Figure: Editorial feature cover for ${article.title}`}
              </figcaption>
            </figure>
          )}
        </div>
      )}

      {/* Symmetrical Two-Column Body Content */}
      <div
        className={`magazine-body ${
          columnMode === 'two-column'
            ? 'magazine-body--two-col'
            : 'magazine-body--single-col'
        }`}
        style={columnHeight ? { maxHeight: `${columnHeight}px` } : undefined}
      >
        {sections.map((sec, idx) => (
          <RenderSectionItem
            key={`sec-${pageNumber}-${idx}`}
            section={sec}
            sectionIndex={sec.originalIndex ?? idx}
            isFirstParagraph={isFirstPage && idx === 0 && sec.type === 'paragraph'}
            isEditable={isEditable}
            selectedElementId={selectedElementId}
            onSelectElement={onSelectElement}
            onUpdateSection={onUpdateSection}
            onDropImageOnFigure={onDropImageOnFigure}
          />
        ))}
      </div>

      {/* Running Footer with Dynamic "Page X of Y" Numbering */}
      <footer className="magazine-footer">
        <div className="magazine-footer__left">
          <span>
            © 2023–2026 www.{sourceDomain} • All rights reserved
          </span>
        </div>
        <div className="magazine-footer__center">
          <span>VOLUME 4 | ISSUE 9</span>
        </div>
        <div className="magazine-footer__page-num">
          <span className="magazine-footer__page-label">Page</span>
          <strong>
            {pageNumber} of {totalPages}
          </strong>
        </div>
      </footer>
    </article>
  );
}

/**
 * Renders individual section blocks with editable states and formatting listeners.
 */
function RenderSectionItem({
  section,
  sectionIndex,
  isFirstParagraph,
  isEditable,
  selectedElementId,
  onSelectElement,
  onUpdateSection,
  onDropImageOnFigure,
}) {
  if (!section) return null;
  const secKey = section.id || `sec-${sectionIndex}`;

  switch (section.type) {
    case 'heading': {
      const HeadingTag = `h${section.level || 2}`;
      return (
        <HeadingTag
          contentEditable={isEditable}
          suppressContentEditableWarning
          className={`magazine-heading magazine-heading--h${section.level || 2} ${
            isEditable ? 'magazine-editable-text' : ''
          } ${selectedElementId === secKey ? 'magazine-editable-text--active' : ''}`}
          onFocus={() =>
            onSelectElement?.({
              id: secKey,
              type: 'heading',
              sectionIndex,
            })
          }
          onBlur={(e) =>
            onUpdateSection?.(sectionIndex, { content: e.currentTarget.innerText.trim() })
          }
        >
          {section.content}
        </HeadingTag>
      );
    }

    case 'paragraph': {
      return (
        <p
          contentEditable={isEditable}
          suppressContentEditableWarning
          className={`magazine-paragraph ${isFirstParagraph ? 'magazine-paragraph--lead' : ''} ${
            isEditable ? 'magazine-editable-text' : ''
          } ${selectedElementId === secKey ? 'magazine-editable-text--active' : ''}`}
          onFocus={() =>
            onSelectElement?.({
              id: secKey,
              type: 'paragraph',
              sectionIndex,
            })
          }
          onBlur={(e) => {
            const newHtml = e.currentTarget.innerHTML;
            const newText = e.currentTarget.innerText.trim();
            onUpdateSection?.(sectionIndex, { content: newText, html: newHtml });
          }}
          dangerouslySetInnerHTML={
            section.html && !section.isSplitPart ? { __html: section.html } : undefined
          }
        >
          {section.html && !section.isSplitPart ? undefined : section.content}
        </p>
      );
    }

    case 'image': {
      if (!section.src) return null;
      return (
        <figure
          className={`magazine-inline-figure ${
            isEditable ? 'magazine-editable-figure' : ''
          } ${selectedElementId === secKey ? 'magazine-editable-figure--active' : ''}`}
          style={{
            textAlign: section.align || 'center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement?.({
              id: secKey,
              type: 'image',
              sectionIndex,
              src: section.src,
              width: section.width || '100%',
              align: section.align || 'center',
              caption: section.caption || '',
            });
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onDropImageOnFigure?.(sectionIndex, file);
          }}
        >
          <img
            src={section.src}
            alt={section.alt || 'Editorial figure'}
            className="magazine-inline-figure__img"
            loading="lazy"
            style={{
              width: section.width || '100%',
              margin:
                section.align === 'left'
                  ? '0 auto 0 0'
                  : section.align === 'right'
                  ? '0 0 0 auto'
                  : '0 auto',
            }}
          />
          <figcaption
            contentEditable={isEditable}
            suppressContentEditableWarning
            className={`magazine-inline-figure__caption ${
              isEditable ? 'magazine-editable-text' : ''
            }`}
            onBlur={(e) =>
              onUpdateSection?.(sectionIndex, {
                caption: e.currentTarget.innerText.trim(),
              })
            }
          >
            {section.caption || 'Figure: Editorial illustration'}
          </figcaption>
        </figure>
      );
    }

    case 'quote': {
      return (
        <blockquote
          className={`magazine-pull-quote ${
            isEditable ? 'magazine-editable-box' : ''
          } ${selectedElementId === secKey ? 'magazine-editable-box--active' : ''}`}
          onFocus={() =>
            onSelectElement?.({
              id: secKey,
              type: 'quote',
              sectionIndex,
            })
          }
        >
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            className={`magazine-pull-quote__text ${isEditable ? 'magazine-editable-text' : ''}`}
            onBlur={(e) =>
              onUpdateSection?.(sectionIndex, { content: e.currentTarget.innerText.trim() })
            }
          >
            {section.content}
          </p>
          <cite
            contentEditable={isEditable}
            suppressContentEditableWarning
            className={`magazine-pull-quote__cite ${isEditable ? 'magazine-editable-text' : ''}`}
            onBlur={(e) =>
              onUpdateSection?.(sectionIndex, { citation: e.currentTarget.innerText.trim() })
            }
          >
            {section.citation ? `— ${section.citation}` : '— Editorial note'}
          </cite>
        </blockquote>
      );
    }

    case 'list': {
      const ListTag = section.ordered ? 'ol' : 'ul';
      return (
        <ListTag className="magazine-list">
          {section.items?.map((item, i) => (
            <li
              key={i}
              contentEditable={isEditable}
              suppressContentEditableWarning
              className={`magazine-list__item ${isEditable ? 'magazine-editable-text' : ''}`}
              onBlur={(e) => {
                const newItems = [...(section.items || [])];
                newItems[i] = e.currentTarget.innerText.trim();
                onUpdateSection?.(sectionIndex, { items: newItems });
              }}
            >
              {item}
            </li>
          ))}
        </ListTag>
      );
    }

    default:
      return null;
  }
}

export default MagazinePage;
