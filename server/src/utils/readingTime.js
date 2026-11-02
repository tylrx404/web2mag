/**
 * Calculates estimated reading time in minutes based on average 200 words per minute.
 *
 * @param {string} text
 * @returns {number}
 */
export function calculateReadingTime(text) {
  if (!text || typeof text !== 'string') return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 1;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default calculateReadingTime;
