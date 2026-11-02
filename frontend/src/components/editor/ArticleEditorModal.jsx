import { useState, useId } from 'react';
import { normalizeContentBlocks, countWords, stripHtml } from '../../services/paginationEngine.js';
import './ArticleEditorModal.css';

/**
 * Converts a structured list of editor blocks back into clean, sanitized HTML.
 * @param {Array<object>} blocks
 * @returns {string}
 */
function blocksToHtml(blocks = []) {
  return blocks
    .map((b) => {
      if (b.type === 'heading') {
        const level = b.headingLevel || 'h3';
        return `<${level}>${escapeHtml(b.text || '')}</${level}>`;
      }
      if (b.type === 'paragraph') {
        const cls = b.isLead ? ' class="a4-lead"' : '';
        return `<p${cls}>${escapeHtml(b.text || '')}</p>`;
      }
      if (b.type === 'figure') {
        const widthStyle = b.imageWidth ? `width: ${b.imageWidth};` : 'width: 100%;';
        const alignStyle = b.imageAlign ? `text-align: ${b.imageAlign};` : '';
        const figStyle = alignStyle ? ` style="${alignStyle}"` : '';
        const imgStyle = widthStyle ? ` style="${widthStyle}"` : '';
        const captionHtml = b.caption ? `\n  <figcaption>${escapeHtml(b.caption)}</figcaption>` : '';
        return `<figure class="a4-figure"${figStyle}>\n  <img src="${b.imageSrc || ''}" alt="${escapeHtml(b.imageAlt || '')}" class="a4-figure__img"${imgStyle} />${captionHtml}\n</figure>`;
      }
      if (b.type === 'list') {
        const listTag = b.listType === 'ol' ? 'ol' : 'ul';
        const items = Array.isArray(b.items) ? b.items : [];
        const itemsHtml = items.map((it) => `  <li>${escapeHtml(it)}</li>`).join('\n');
        return `<${listTag}>\n${itemsHtml}\n</${listTag}>`;
      }
      if (b.type === 'blockquote') {
        return `<blockquote>${escapeHtml(b.text || '')}</blockquote>`;
      }
      return b.html || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extracts editor-friendly block properties from normalized content blocks.
 */
function initializeEditorBlocks(html = '') {
  const rawBlocks = normalizeContentBlocks(html);
  return rawBlocks.map((b, idx) => {
    let headingLevel = 'h3';
    if (b.isHeading) {
      headingLevel = b.tag.toLowerCase();
    }

    let isLead = false;
    if (b.className && b.className.includes('a4-lead')) {
      isLead = true;
    }

    let imageSrc = '';
    let imageAlt = '';
    let caption = '';
    let imageWidth = '100%';
    let imageAlign = 'center';

    if (b.isFigure) {
      const srcMatch = b.html.match(/<img[^>]+src=["']([^"']+)["']/i);
      imageSrc = srcMatch ? srcMatch[1] : '';
      const altMatch = b.html.match(/<img[^>]+alt=["']([^"']+)["']/i);
      imageAlt = altMatch ? altMatch[1] : '';
      const capMatch = b.html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      caption = capMatch ? stripHtml(capMatch[1]) : '';
      const wMatch = b.html.match(/width:\s*([0-9%]+)/i);
      if (wMatch) imageWidth = wMatch[1];
      const aMatch = b.html.match(/text-align:\s*([a-z]+)/i);
      if (aMatch) imageAlign = aMatch[1];
    }

    let listType = 'ul';
    let items = [];
    if (b.type === 'list') {
      listType = b.tag === 'ol' ? 'ol' : 'ul';
      const liMatches = b.html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (liMatches) {
        items = liMatches.map((li) => stripHtml(li));
      }
    }

    return {
      id: `edit-blk-${idx}-${Date.now()}`,
      type: b.type,
      tag: b.tag,
      text: b.text || '',
      headingLevel,
      isLead,
      imageSrc,
      imageAlt,
      caption,
      imageWidth,
      imageAlign,
      listType,
      items,
      html: b.html,
    };
  });
}

/**
 * Inner dialog component for editing article metadata and content blocks.
 */
function ArticleEditorDialog({ article, onClose, onSave }) {
  const [title, setTitle] = useState(article.title || '');
  const [author, setAuthor] = useState(article.author || '');
  const [category, setCategory] = useState(article.category || 'FEATURE');
  const [authorRole, setAuthorRole] = useState(article.authorRole || 'Contributing Author');
  const [authorBio, setAuthorBio] = useState(article.authorBio || '');
  const [editorMode, setEditorMode] = useState('blocks'); // 'blocks' | 'raw'
  const [blocks, setBlocks] = useState(() => initializeEditorBlocks(article.contentHtml || ''));
  const [rawHtml, setRawHtml] = useState(article.contentHtml || '');

  const titleInputId = useId();
  const authorInputId = useId();
  const categorySelectId = useId();
  const roleInputId = useId();
  const bioInputId = useId();
  const rawHtmlTextareaId = useId();

  // Mode switching sync
  const handleSwitchToRaw = () => {
    const compiled = blocksToHtml(blocks);
    setRawHtml(compiled);
    setEditorMode('raw');
  };

  const handleSwitchToBlocks = () => {
    const parsed = initializeEditorBlocks(rawHtml);
    setBlocks(parsed);
    setEditorMode('blocks');
  };

  // Block modification helpers
  const handleUpdateBlock = (index, updates) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleMoveBlock = (index, direction) => {
    setBlocks((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleDeleteBlock = (index) => {
    setBlocks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlock = (type) => {
    const newId = `edit-blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let newBlock = {
      id: newId,
      type,
      tag: 'p',
      text: '',
      isLead: false,
    };

    if (type === 'heading') {
      newBlock = {
        id: newId,
        type: 'heading',
        tag: 'h3',
        headingLevel: 'h3',
        text: 'New Section Heading',
      };
    } else if (type === 'paragraph') {
      newBlock = {
        id: newId,
        type: 'paragraph',
        tag: 'p',
        text: 'Enter paragraph text here...',
        isLead: false,
      };
    } else if (type === 'figure') {
      newBlock = {
        id: newId,
        type: 'figure',
        tag: 'figure',
        text: '',
        imageSrc: article.featuredImageUrl || article.thumbnail || '',
        imageAlt: 'Editorial illustration',
        caption: 'Figure: Enter descriptive technical caption here.',
        imageWidth: '100%',
        imageAlign: 'center',
      };
    } else if (type === 'list') {
      newBlock = {
        id: newId,
        type: 'list',
        tag: 'ul',
        listType: 'ul',
        items: ['First item', 'Second item', 'Third item'],
        text: '',
      };
    } else if (type === 'blockquote') {
      newBlock = {
        id: newId,
        type: 'blockquote',
        tag: 'blockquote',
        text: '“Enter an impactful editorial quote or callout here.”',
      };
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  // Image file upload handler with validation for type and file size limit
  const handleImageFileUpload = (index, file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      alert('Invalid file format. Please select an image file (PNG, JPG, WEBP, SVG, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large (exceeds 5MB). Please upload a smaller image for optimal layout and PDF export.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        handleUpdateBlock(index, { imageSrc: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Save handler
  const handleSave = (e) => {
    e.preventDefault();
    const finalHtml = editorMode === 'raw' ? rawHtml : blocksToHtml(blocks);

    const updatedArticle = {
      ...article,
      title: title.trim() || 'Untitled Article',
      author: author.trim() || 'Editorial Staff',
      category: category.trim() || 'FEATURE',
      authorRole: authorRole.trim() || 'Contributing Author',
      authorBio: authorBio.trim(),
      contentHtml: finalHtml,
      status: 'Edited',
    };

    onSave(updatedArticle);
  };

  const totalWords = countWords(
    editorMode === 'raw' ? stripHtml(rawHtml) : blocks.map((b) => b.text || '').join(' ')
  );

  return (
    <div className="editor-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="editor-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <header className="editor-header">
          <div className="editor-header__brand">
            <span className="editor-header__icon" aria-hidden="true">✍️</span>
            <div>
              <h2 className="editor-header__title">Editorial Article Editor</h2>
              <span className="editor-header__sub">
                Modify content blocks, images, headings and issue metadata
              </span>
            </div>
          </div>

          <div className="editor-header__controls">
            <div className="editor-mode-toggle" role="tablist">
              <button
                type="button"
                className={`editor-mode-btn ${editorMode === 'blocks' ? 'active' : ''}`}
                onClick={handleSwitchToBlocks}
              >
                Visual Block Editor
              </button>
              <button
                type="button"
                className={`editor-mode-btn ${editorMode === 'raw' ? 'active' : ''}`}
                onClick={handleSwitchToRaw}
              >
                Raw HTML View
              </button>
            </div>

            <button
              type="button"
              className="editor-close-btn"
              onClick={onClose}
              aria-label="Close editor"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSave} className="editor-body">
          {/* Metadata Section */}
          <section className="editor-meta-card">
            <h3 className="editor-section-title">Article Information &amp; Bylines</h3>
            <div className="editor-meta-grid">
              <div className="editor-field editor-field--full">
                <label className="editor-label" htmlFor={titleInputId}>
                  Article Headline
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  className="editor-input editor-input--headline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title..."
                  required
                />
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor={authorInputId}>
                  Author Name
                </label>
                <input
                  id={authorInputId}
                  type="text"
                  className="editor-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name..."
                  required
                />
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor={categorySelectId}>
                  Category / Section
                </label>
                <select
                  id={categorySelectId}
                  className="editor-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="CAREER FOCUS">CAREER FOCUS</option>
                  <option value="DESIGN">DESIGN</option>
                  <option value="EDITORIAL">EDITORIAL</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="WORKFLOW">WORKFLOW</option>
                  <option value="TECHNOLOGY">TECHNOLOGY</option>
                  <option value="INNOVATION">INNOVATION</option>
                  <option value="FEATURE">FEATURE</option>
                </select>
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor={roleInputId}>
                  Author Role
                </label>
                <input
                  id={roleInputId}
                  type="text"
                  className="editor-input"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="e.g. Senior Hardware Engineer"
                />
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor={bioInputId}>
                  Author Bio
                </label>
                <input
                  id={bioInputId}
                  type="text"
                  className="editor-input"
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  placeholder="Brief author biography for contributor page..."
                />
              </div>
            </div>
          </section>

          {/* Block Editor Mode */}
          {editorMode === 'blocks' ? (
            <section className="editor-blocks-section">
              <div className="editor-blocks-header">
                <div>
                  <h3 className="editor-section-title">Article Content Blocks</h3>
                  <p className="editor-section-desc">
                    Reorder, edit, replace images, and structure your two-column layout.
                  </p>
                </div>

                <div className="editor-add-bar">
                  <span className="editor-add-bar__label">Add Block:</span>
                  <button
                    type="button"
                    className="editor-add-btn"
                    onClick={() => handleAddBlock('paragraph')}
                  >
                    + Paragraph
                  </button>
                  <button
                    type="button"
                    className="editor-add-btn"
                    onClick={() => handleAddBlock('heading')}
                  >
                    + Heading
                  </button>
                  <button
                    type="button"
                    className="editor-add-btn"
                    onClick={() => handleAddBlock('figure')}
                  >
                    + Image / Figure
                  </button>
                  <button
                    type="button"
                    className="editor-add-btn"
                    onClick={() => handleAddBlock('list')}
                  >
                    + List
                  </button>
                  <button
                    type="button"
                    className="editor-add-btn"
                    onClick={() => handleAddBlock('blockquote')}
                  >
                    + Quote
                  </button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="editor-empty-blocks">
                  <p>No content blocks yet. Click an &ldquo;Add Block&rdquo; button above to start writing.</p>
                </div>
              ) : (
                <div className="editor-block-list">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className={`editor-block-card editor-block-card--${block.type}`}>
                      <div className="editor-block-card__header">
                        <div className="editor-block-card__meta">
                          <span className="editor-block-card__num">{idx + 1}</span>
                          <span className="editor-block-card__type">
                            {block.type.toUpperCase()}
                          </span>
                        </div>

                        <div className="editor-block-card__actions">
                          <button
                            type="button"
                            className="editor-block-action-btn"
                            disabled={idx === 0}
                            onClick={() => handleMoveBlock(idx, 'up')}
                            title="Move Block Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="editor-block-action-btn"
                            disabled={idx === blocks.length - 1}
                            onClick={() => handleMoveBlock(idx, 'down')}
                            title="Move Block Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            className="editor-block-action-btn editor-block-action-btn--delete"
                            onClick={() => handleDeleteBlock(idx)}
                            title="Delete Block"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Block Type: Paragraph */}
                      {block.type === 'paragraph' && (
                        <div className="editor-block-field">
                          <div className="editor-block-subrow">
                            <label className="editor-checkbox-label">
                              <input
                                type="checkbox"
                                checked={Boolean(block.isLead)}
                                onChange={(e) =>
                                  handleUpdateBlock(idx, { isLead: e.target.checked })
                                }
                              />
                              <span>Lead Paragraph Styling (Larger editorial intro text)</span>
                            </label>
                          </div>
                          <textarea
                            className="editor-textarea"
                            rows={4}
                            value={block.text}
                            onChange={(e) =>
                              handleUpdateBlock(idx, { text: e.target.value })
                            }
                            placeholder="Type paragraph text..."
                          />
                        </div>
                      )}

                      {/* Block Type: Heading */}
                      {block.type === 'heading' && (
                        <div className="editor-block-field editor-heading-field">
                          <div className="editor-heading-row">
                            <select
                              className="editor-select editor-select--compact"
                              value={block.headingLevel || 'h3'}
                              onChange={(e) =>
                                handleUpdateBlock(idx, { headingLevel: e.target.value })
                              }
                            >
                              <option value="h2">H2 — Major Section</option>
                              <option value="h3">H3 — Subheading</option>
                              <option value="h4">H4 — Small Header</option>
                            </select>
                            <input
                              type="text"
                              className="editor-input editor-input--heading"
                              value={block.text}
                              onChange={(e) =>
                                handleUpdateBlock(idx, { text: e.target.value })
                              }
                              placeholder="Heading text..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Block Type: Figure / Image */}
                      {block.type === 'figure' && (
                        <div className="editor-block-field editor-figure-field">
                          <div className="editor-figure-grid">
                            <div className="editor-figure-preview">
                              {block.imageSrc ? (
                                <img
                                  src={block.imageSrc}
                                  alt={block.imageAlt || 'Preview'}
                                  className="editor-figure-thumb"
                                />
                              ) : (
                                <div className="editor-figure-no-img">No Image Selected</div>
                              )}
                            </div>

                            <div className="editor-figure-controls">
                              <div className="editor-figure-input-group">
                                <label className="editor-mini-label">Image Source URL:</label>
                                <input
                                  type="text"
                                  className="editor-input editor-input--sm"
                                  value={block.imageSrc || ''}
                                  onChange={(e) =>
                                    handleUpdateBlock(idx, { imageSrc: e.target.value })
                                  }
                                  placeholder="https://... or data:image/..."
                                />
                              </div>

                              <div className="editor-figure-upload-row">
                                <label className="editor-upload-label">
                                  <span>📁 Upload From Device</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="editor-file-hidden"
                                    onChange={(e) =>
                                      handleImageFileUpload(idx, e.target.files?.[0])
                                    }
                                  />
                                </label>

                                <div className="editor-figure-options">
                                  <select
                                    className="editor-select editor-select--compact"
                                    value={block.imageWidth || '100%'}
                                    onChange={(e) =>
                                      handleUpdateBlock(idx, { imageWidth: e.target.value })
                                    }
                                  >
                                    <option value="100%">Width: 100%</option>
                                    <option value="85%">Width: 85%</option>
                                    <option value="70%">Width: 70%</option>
                                    <option value="50%">Width: 50%</option>
                                  </select>

                                  <select
                                    className="editor-select editor-select--compact"
                                    value={block.imageAlign || 'center'}
                                    onChange={(e) =>
                                      handleUpdateBlock(idx, { imageAlign: e.target.value })
                                    }
                                  >
                                    <option value="center">Align: Center</option>
                                    <option value="left">Align: Left</option>
                                    <option value="right">Align: Right</option>
                                  </select>
                                </div>
                              </div>

                              <div className="editor-figure-input-group">
                                <label className="editor-mini-label">Caption Text:</label>
                                <input
                                  type="text"
                                  className="editor-input editor-input--sm"
                                  value={block.caption || ''}
                                  onChange={(e) =>
                                    handleUpdateBlock(idx, { caption: e.target.value })
                                  }
                                  placeholder="Figure caption..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Block Type: List */}
                      {block.type === 'list' && (
                        <div className="editor-block-field editor-list-field">
                          <div className="editor-list-type-row">
                            <label className="editor-mini-label">List Type:</label>
                            <select
                              className="editor-select editor-select--compact"
                              value={block.listType || 'ul'}
                              onChange={(e) =>
                                handleUpdateBlock(idx, { listType: e.target.value })
                              }
                            >
                              <option value="ul">Unordered (Bullet Points)</option>
                              <option value="ol">Ordered (Numbered 1, 2, 3)</option>
                            </select>
                          </div>

                          <div className="editor-list-items">
                            {(block.items || []).map((item, itemIdx) => (
                              <div key={`${block.id}-it-${itemIdx}`} className="editor-list-item-row">
                                <span className="editor-list-bullet">
                                  {block.listType === 'ol' ? `${itemIdx + 1}.` : '•'}
                                </span>
                                <input
                                  type="text"
                                  className="editor-input editor-input--sm"
                                  value={item}
                                  onChange={(e) => {
                                    const nextItems = [...(block.items || [])];
                                    nextItems[itemIdx] = e.target.value;
                                    handleUpdateBlock(idx, { items: nextItems });
                                  }}
                                />
                                <button
                                  type="button"
                                  className="editor-item-del-btn"
                                  onClick={() => {
                                    const nextItems = (block.items || []).filter(
                                      (_, i) => i !== itemIdx
                                    );
                                    handleUpdateBlock(idx, { items: nextItems });
                                  }}
                                  title="Delete Item"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="editor-add-subitem-btn"
                            onClick={() => {
                              const nextItems = [...(block.items || []), 'New list item'];
                              handleUpdateBlock(idx, { items: nextItems });
                            }}
                          >
                            + Add List Item
                          </button>
                        </div>
                      )}

                      {/* Block Type: Blockquote */}
                      {block.type === 'blockquote' && (
                        <div className="editor-block-field">
                          <textarea
                            className="editor-textarea editor-textarea--quote"
                            rows={3}
                            value={block.text}
                            onChange={(e) =>
                              handleUpdateBlock(idx, { text: e.target.value })
                            }
                            placeholder="Enter quotation..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            /* Raw HTML View */
            <section className="editor-raw-section">
              <label className="editor-label" htmlFor={rawHtmlTextareaId}>
                Clean Editorial HTML Content
              </label>
              <textarea
                id={rawHtmlTextareaId}
                className="editor-raw-textarea"
                rows={16}
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="Enter or paste sanitized HTML content..."
              />
            </section>
          )}

          {/* Bottom Actions Bar */}
          <footer className="editor-footer">
            <div className="editor-footer__stats">
              <span>{blocks.length} Content Blocks</span>
              <span>•</span>
              <span>~{totalWords} Words</span>
              <span>•</span>
              <span className="editor-footer__live-badge">Live Auto-Pagination Synchronized</span>
            </div>

            <div className="editor-footer__actions">
              <button
                type="button"
                className="editor-btn editor-btn--cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="editor-btn editor-btn--save"
              >
                Save &amp; Update Magazine
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

/**
 * ArticleEditorModal wrapper that mounts a fresh dialog instance when opened.
 */
export function ArticleEditorModal({ isOpen, article, onClose, onSave }) {
  if (!isOpen || !article) return null;
  return <ArticleEditorDialog article={article} onClose={onClose} onSave={onSave} />;
}

export default ArticleEditorModal;
