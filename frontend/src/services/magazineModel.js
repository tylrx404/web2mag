/**
 * Magazine Page Data Model Service.
 * Manages the sequential document structure for the multi-page magazine:
 * - Cover page (Page 1)
 * - Table of Contents (Page 2)
 * - Dynamic Multi-Page Article Chunks (Pages 3 .. N+2)
 * - Contributor / Author profiles (Page N+3)
 *
 * Integrated with the automatic pagination engine to flow articles across
 * consecutive A4 2-column spreads without clipping, silent truncation, or orphan headings.
 */

import { paginateArticleContent } from './paginationEngine.js';

/**
 * Builds the ordered sequence of magazine pages from current articles and issue configuration.
 *
 * @param {Array<object>} articles - List of active articles in the issue
 * @param {object} issueConfig - Dynamic issue metadata (title, volume, issue, date, ISSN, etc.)
 * @returns {Array<{
 *   id: string,
 *   type: 'cover' | 'toc' | 'article' | 'author',
 *   pageNumber: number,
 *   title: string,
 *   articleId?: string,
 *   article?: object,
 *   chunkIndex?: number,
 *   totalPagesForArticle?: number,
 *   contentHtml?: string,
 *   isFirstPage?: boolean,
 *   isLastPage?: boolean,
 *   isEmpty?: boolean,
 *   authorData?: object
 * }>}
 */
export function buildMagazinePages(articles = [], issueConfig = {}) {
  const pages = [];
  let currentPageNumber = 1;

  // 1. COVER PAGE (Page 1)
  const leadArticle = articles[0] || null;
  const coverHeadline =
    issueConfig.coverHeadline ||
    leadArticle?.title ||
    'Innovations in Engineering and Editorial Publishing';
  const coverSubhead =
    issueConfig.coverSubhead ||
    leadArticle?.excerpt ||
    'Featured insights, hardware engineering, and digital-to-print architectures.';
  const coverImage =
    issueConfig.coverImageUrl ||
    leadArticle?.featuredImageUrl ||
    leadArticle?.thumbnail ||
    '';

  pages.push({
    id: 'page-cover',
    type: 'cover',
    pageNumber: currentPageNumber,
    title: 'Cover Page',
    coverHeadline,
    coverSubhead,
    coverImage,
    leadArticle,
    featuredArticles: articles.slice(0, 5),
  });
  currentPageNumber += 1;

  // 2. PAGINATION PASS FOR ARTICLES
  // Calculate chunks for every article to determine exact folio mapping
  const paginatedArticles = articles.map((article) => {
    const chunks = paginateArticleContent(article);
    return {
      article,
      chunks,
    };
  });

  // 3. TABLE OF CONTENTS (Page 2)
  // Calculate start folio for each article sequentially past the TOC
  let articleFolioPointer = currentPageNumber + 1; // Page 3 is the first article page
  const articleTOCEntries = paginatedArticles.map(({ article, chunks }) => {
    const startPageNumber = articleFolioPointer;
    articleFolioPointer += chunks.length;

    return {
      id: article.id,
      title: article.title,
      author: article.author || 'Editorial Staff',
      category: article.category || 'FEATURE',
      pageNumber: startPageNumber,
      pageId: `page-art-${article.id}-p0`,
      excerpt: article.excerpt || '',
      pageCount: chunks.length,
    };
  });

  pages.push({
    id: 'page-toc',
    type: 'toc',
    pageNumber: currentPageNumber,
    title: 'Table of Contents',
    entries: articleTOCEntries,
  });
  currentPageNumber += 1;

  // 4. ARTICLE PAGES (Consecutive A4 pages for each chunk)
  paginatedArticles.forEach(({ article, chunks }) => {
    const totalChunks = chunks.length;

    chunks.forEach((chunk, chunkIdx) => {
      const pageId = `page-art-${article.id}-p${chunkIdx}`;
      const pageTitle =
        totalChunks > 1
          ? `${article.title} (Part ${chunkIdx + 1} of ${totalChunks})`
          : article.title;

      pages.push({
        id: pageId,
        type: 'article',
        pageNumber: currentPageNumber,
        title: pageTitle,
        articleId: article.id,
        article,
        chunkIndex: chunkIdx,
        totalPagesForArticle: totalChunks,
        contentHtml: chunk.contentHtml,
        isFirstPage: chunk.isFirstPage,
        isLastPage: chunk.isLastPage,
        isEmpty: chunk.isEmpty,
      });
      currentPageNumber += 1;
    });
  });

  // 5. AUTHOR PROFILE PAGE (Page after all article chunks)
  const authorsMap = new Map();
  articles.forEach((art) => {
    const name = art.author?.trim() || 'Editorial Staff';
    if (!authorsMap.has(name)) {
      authorsMap.set(name, {
        name,
        role: art.authorRole || 'Contributing Author',
        bio:
          art.authorBio ||
          `${name} is a contributing writer and domain specialist featured in this edition of ${
            issueConfig.magazineTitle || 'the publication'
          }.`,
        avatarUrl: art.authorAvatar || '',
        articles: [art.title],
      });
    } else {
      authorsMap.get(name).articles.push(art.title);
    }
  });

  pages.push({
    id: 'page-author',
    type: 'author',
    pageNumber: currentPageNumber,
    title: 'About the Authors',
    authors: Array.from(authorsMap.values()),
  });

  return pages;
}

export default buildMagazinePages;
