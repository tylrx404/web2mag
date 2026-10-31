import {
  cleanDecodedText,
  formatPublicationDate,
} from '../utils/urlHelper.js';

/**
 * Calculates approximate word count and reading time.
 * @param {Array<{ content?: string, items?: string[] }>} sections
 * @returns {{ wordCount: number, readingTimeMinutes: number }}
 */
function calculateReadingStats(sections) {
  let totalWords = 0;
  sections.forEach((sec) => {
    if (sec.content) {
      totalWords += sec.content.split(/\s+/).filter(Boolean).length;
    }
    if (sec.items && Array.isArray(sec.items)) {
      sec.items.forEach((item) => {
        totalWords += item.split(/\s+/).filter(Boolean).length;
      });
    }
  });

  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));
  return { wordCount: totalWords, readingTimeMinutes };
}

/**
 * Normalizes an article from either WordPress REST API or HTML scraper into
 * a consistent, high-fidelity article object for the React frontend and MagazinePreview.
 *
 * @param {{
 *   id?: string,
 *   title: string,
 *   author?: string,
 *   date?: string,
 *   category?: string,
 *   summary?: string,
 *   thumbnail?: string,
 *   sourceUrl: string,
 *   sourceType: 'wordpress-rest-api' | 'html-fallback',
 *   cleanHtml: string,
 *   sections: Array<any>
 * }} input
 * @returns {any}
 */
export function normalizeArticle(input) {
  const title = cleanDecodedText(input.title) || 'Untitled Editorial Article';
  const author = cleanDecodedText(input.author) || 'Editorial Staff';
  const category = cleanDecodedText(input.category) || 'Feature';
  const summary = cleanDecodedText(input.summary) || '';
  const thumbnail = input.thumbnail?.trim() || '';
  const dateIso = input.date ? new Date(input.date).toISOString() : new Date().toISOString();
  const formattedDate = formatPublicationDate(dateIso);
  const sections = Array.isArray(input.sections) ? input.sections : [];

  const { wordCount, readingTimeMinutes } = calculateReadingStats(sections);

  return {
    id: input.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    author,
    date: dateIso,
    formattedDate,
    category,
    summary,
    thumbnail,
    sourceUrl: input.sourceUrl,
    status: 'Imported',
    sourceType: input.sourceType,
    cleanHtml: input.cleanHtml || '',
    sections,
    stats: {
      wordCount,
      readingTimeMinutes,
    },
  };
}
