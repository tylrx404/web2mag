import * as cheerio from 'cheerio';
import { cleanDecodedText, extractBaseUrl, extractSlugFromUrl } from '../utils/urlHelper.js';

/**
 * Standard user-agent header to avoid bot blocks from publishing sites.
 */
const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Web2Mag/1.0',
  Accept: 'application/json, text/html, application/xhtml+xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Discovers the WordPress REST API root endpoint for a given URL.
 * Checks the standard /wp-json/ route as well as <link rel="https://api.w.org/" href="...">.
 *
 * @param {URL} parsedUrl
 * @returns {Promise<string>}
 */
async function discoverRestApiRoot(parsedUrl) {
  const baseUrl = extractBaseUrl(parsedUrl);

  // 1. Check if the page itself declares a REST API endpoint via Link header or HTML <link>
  try {
    const pageRes = await fetch(parsedUrl.href, {
      method: 'GET',
      headers: REQUEST_HEADERS,
      signal: AbortSignal.timeout(6000),
    });

    // Check Link HTTP header for rel="https://api.w.org/"
    const linkHeader = pageRes.headers.get('link');
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="https:\/\/api\.w\.org\/"/i);
      if (match && match[1]) {
        return match[1].replace(/\/+$/, '');
      }
    }

    // Inspect <head> for <link rel="https://api.w.org/" href="...">
    const htmlText = await pageRes.text();
    const $ = cheerio.load(htmlText);
    const apiLink = $('link[rel="https://api.w.org/"]').attr('href');
    if (apiLink) {
      return apiLink.replace(/\/+$/, '');
    }
  } catch {
    // If page fetch times out or fails, fall back to default endpoint
  }

  // 2. Default to standard WordPress REST endpoint
  return `${baseUrl}/wp-json`;
}

/**
 * Attempts to fetch a WordPress post via the WordPress REST API using the slug.
 * Accepts either a URL instance or a probe configuration object.
 *
 * @param {URL | { parsedUrl: URL, restApiRoot?: string, directPostEndpoint?: string }} target
 * @returns {Promise<{
 *   isWordPress: boolean,
 *   success?: boolean,
 *   post?: any,
 *   error?: string
 * }>}
 */
export async function fetchWordPressPost(target) {
  let parsedUrl = target;
  let directEndpoint = null;
  let restApiRoot = null;

  if (target && typeof target === 'object' && !(target instanceof URL)) {
    parsedUrl = target.parsedUrl;
    directEndpoint = target.directPostEndpoint;
    restApiRoot = target.restApiRoot;
  }

  const slug = parsedUrl ? extractSlugFromUrl(parsedUrl) : '';

  if (!directEndpoint && !slug) {
    return {
      isWordPress: false,
      success: false,
      error: 'Could not extract article slug from the provided URL.',
    };
  }

  let postsEndpoint = directEndpoint;
  if (!postsEndpoint) {
    const apiRoot = restApiRoot || (await discoverRestApiRoot(parsedUrl));
    postsEndpoint = `${apiRoot}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`;
  }

  try {
    const res = await fetch(postsEndpoint, {
      headers: REQUEST_HEADERS,
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      return {
        isWordPress: false,
        success: false,
        error: `WordPress REST API responded with status ${res.status} (${res.statusText}).`,
      };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        isWordPress: false,
        success: false,
        error: 'WordPress REST endpoint did not return JSON data.',
      };
    }

    const data = await res.json();
    const rawPost = Array.isArray(data) ? data[0] : data;

    if (!rawPost || !rawPost.title) {
      return {
        isWordPress: true,
        success: false,
        post: null,
        error: `No published WordPress post found matching slug "${slug}".`,
      };
    }

    // Extract Author name
    const authorName =
      rawPost._embedded?.author?.[0]?.name ||
      rawPost.author_name ||
      'Editorial Staff';

    // Extract Featured Image
    const featuredMedia = rawPost._embedded?.['wp:featuredmedia']?.[0];
    const featuredImageUrl =
      featuredMedia?.source_url ||
      featuredMedia?.media_details?.sizes?.large?.source_url ||
      featuredMedia?.media_details?.sizes?.full?.source_url ||
      '';

    // Extract Categories / Terms
    const categoriesList =
      rawPost._embedded?.['wp:term']?.[0]
        ?.map((term) => cleanDecodedText(term.name))
        .filter(Boolean) || [];

    const category = categoriesList[0] || 'Feature';

    return {
      isWordPress: true,
      success: true,
      post: {
        id: `wp-${rawPost.id}`,
        title: cleanDecodedText(rawPost.title?.rendered || ''),
        rawContent: rawPost.content?.rendered || '',
        rawExcerpt: rawPost.excerpt?.rendered || '',
        date: rawPost.date || new Date().toISOString(),
        author: cleanDecodedText(authorName),
        featuredImage: featuredImageUrl,
        category,
        sourceUrl: rawPost.link || parsedUrl?.href || '',
      },
    };
  } catch (err) {
    return {
      isWordPress: false,
      success: false,
      error: `Network error reaching WordPress API: ${err.message}`,
    };
  }
}
