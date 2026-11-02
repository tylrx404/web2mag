import {
  simulateArticleImport,
  isSimulatedFailureUrl,
  TEST_FAILURE_URL,
  TEST_SUCCESS_URL,
  TEST_NO_IMAGE_URL,
} from '../data/mockArticles.js';

const USE_MOCK_IMPORT = import.meta.env.VITE_USE_MOCK_IMPORT === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Ingests an article from a URL.
 * Automatically uses mock import if VITE_USE_MOCK_IMPORT=true or if the URL is a documented test URL.
 * Otherwise, sends a POST request to the Web2Mag backend ingestion API.
 *
 * @param {string} url
 * @param {{ forceMock?: boolean }} [options]
 * @returns {Promise<object>} Normalized Web2Mag Article Object
 */
export async function ingestArticle(url, options = {}) {
  let parsedUrl = null;
  try {
    parsedUrl = new URL(url);
  } catch {
    // Malformed URL will be handled downstream
  }

  const isTestUrl =
    url === TEST_SUCCESS_URL ||
    url === TEST_FAILURE_URL ||
    url === TEST_NO_IMAGE_URL ||
    (parsedUrl && isSimulatedFailureUrl(parsedUrl));

  if (options.forceMock || USE_MOCK_IMPORT || isTestUrl) {
    return simulateArticleImport(url);
  }

  // Real Backend Ingestion with multi-endpoint fallback
  const endpoints = API_BASE_URL
    ? [`${API_BASE_URL}/api/articles/import`]
    : ['/api/articles/import', 'http://localhost:5001/api/articles/import'];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Server responded with error status ${response.status} (${response.statusText}).`
        );
      }

      return data;
    } catch (err) {
      lastError = err;
      // If server returned a business error (e.g. 400, 422, 404), throw immediately rather than retrying network
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('network') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }
  }

  throw new Error(
    lastError?.message ||
      'Unable to connect to Web2Mag ingestion server. Ensure the backend is running on http://localhost:5001.'
  );
}

export default ingestArticle;
