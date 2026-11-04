import * as cheerio from 'cheerio';
import { extractBaseUrl } from '../utils/urlHelper.js';

export const BROWSER_REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Web2Mag/1.0',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

/**
 * Checks whether an HTML string represents an anti-bot challenge page or empty JS shell.
 * @param {string} html
 * @param {number} status
 * @returns {boolean}
 */
export function isBotChallengeOrEmptyShell(html, status = 200) {
  if (!html || typeof html !== 'string') return true;

  const trimmed = html.trim();
  if (trimmed.length < 500) return true;

  const lower = html.toLowerCase();

  // PerimeterX / Akamai / Cloudflare challenge signatures
  if (
    lower.includes('<title>client challenge</title>') ||
    lower.includes('just a moment...') ||
    lower.includes('attention required! | cloudflare') ||
    lower.includes('security check') ||
    lower.includes('verify you are human') ||
    lower.includes('_fs-ch-') ||
    lower.includes('challenge-running') ||
    lower.includes('cf-browser-verification') ||
    lower.includes('pardon our interruption')
  ) {
    return true;
  }

  // If status is 403 or 429 and contains challenge keywords
  if ((status === 403 || status === 429) && (lower.includes('cloudflare') || lower.includes('captcha') || lower.includes('perimeterx'))) {
    return true;
  }

  return false;
}

/**
 * Probes the target URL, inspects response headers and HTML, and determines
 * whether the website is WordPress (with REST API support) or a general website.
 *
 * @param {URL} parsedUrl
 * @returns {Promise<{
 *   success: boolean,
 *   reachable: boolean,
 *   status?: number,
 *   finalUrl?: string,
 *   isWordPress: boolean,
 *   restApiRoot: string | null,
 *   directPostEndpoint: string | null,
 *   rawHtml?: string,
 *   requiresBrowser: boolean,
 *   error?: string
 * }>}
 */
export async function detectWebsiteAndFetch(parsedUrl) {
  const baseUrl = extractBaseUrl(parsedUrl);

  let response;
  let rawHtml = '';

  try {
    response = await fetch(parsedUrl.href, {
      method: 'GET',
      headers: BROWSER_REQUEST_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });
  } catch (err) {
    // Check for common connection/DNS failures
    const isNetworkError =
      err.name === 'TimeoutError' ||
      err.code === 'ENOTFOUND' ||
      err.code === 'ECONNREFUSED' ||
      err.message.includes('fetch failed') ||
      err.message.includes('timeout');

    return {
      success: false,
      reachable: false,
      isWordPress: false,
      restApiRoot: null,
      directPostEndpoint: null,
      requiresBrowser: false,
      error: isNetworkError
        ? `Could not reach ${parsedUrl.hostname} (${err.message || 'network timeout'}). Please verify the address and ensure the website is online.`
        : `Network error connecting to ${parsedUrl.hostname}: ${err.message}`,
    };
  }

  const status = response.status;

  // 1. Check for 404 Not Found
  if (status === 404) {
    return {
      success: false,
      reachable: true,
      status: 404,
      isWordPress: false,
      restApiRoot: null,
      directPostEndpoint: null,
      requiresBrowser: false,
      error: `The requested article page was not found at ${parsedUrl.hostname} (HTTP 404). Please verify that the article URL is valid and published.`,
    };
  }

  try {
    rawHtml = await response.text();
  } catch {
    rawHtml = '';
  }

  // Check if response is a bot challenge
  const challengeDetected = isBotChallengeOrEmptyShell(rawHtml, status);

  // If 401 or 403 and NOT a bot challenge, report access restricted
  if ((status === 401 || status === 403) && !challengeDetected) {
    return {
      success: false,
      reachable: true,
      status,
      isWordPress: false,
      restApiRoot: null,
      directPostEndpoint: null,
      requiresBrowser: false,
      error: `Access denied (HTTP ${status}) by ${parsedUrl.hostname}. This article may require a paid subscription or private login.`,
    };
  }

  // 2. Discover WordPress Indicators from HTTP Link headers & HTML
  let isWordPress = false;
  let restApiRoot = null;
  let directPostEndpoint = null;

  // A. Check HTTP Link headers
  const linkHeader = response.headers.get('link');
  if (linkHeader) {
    // Look for rel="https://api.w.org/"
    const apiMatch = linkHeader.match(/<([^>]+)>;\s*rel="https:\/\/api\.w\.org\/"/i);
    if (apiMatch && apiMatch[1]) {
      isWordPress = true;
      restApiRoot = apiMatch[1].replace(/\/+$/, '');
    }

    // Look for direct post link: rel="alternate"; type="application/json"
    const postMatch = linkHeader.match(/<([^>]+)>;\s*rel="alternate";\s*(?:title="JSON";\s*)?type="application\/json"/i);
    if (postMatch && postMatch[1] && postMatch[1].includes('/wp/v2/posts/')) {
      directPostEndpoint = postMatch[1];
      isWordPress = true;
    }
  }

  // B. Check HTML markup if available
  if (rawHtml && rawHtml.length > 200) {
    const $ = cheerio.load(rawHtml);

    // Look for <link rel="https://api.w.org/" href="...">
    const apiTagHref = $('link[rel="https://api.w.org/"]').attr('href');
    if (apiTagHref) {
      isWordPress = true;
      if (!restApiRoot) {
        restApiRoot = apiTagHref.replace(/\/+$/, '');
      }
    }

    // Look for <link rel="alternate" type="application/json" href="...">
    const jsonTagHref = $('link[rel="alternate"][type="application/json"]').attr('href');
    if (jsonTagHref && jsonTagHref.includes('/wp/v2/')) {
      isWordPress = true;
      if (!directPostEndpoint && jsonTagHref.includes('/wp/v2/posts/')) {
        directPostEndpoint = jsonTagHref;
      }
      if (!restApiRoot) {
        const rootMatch = jsonTagHref.match(/^(https?:\/\/[^/]+(?:\/[^/]+)*)\/wp\/v2\//i);
        if (rootMatch && rootMatch[1]) {
          restApiRoot = rootMatch[1];
        }
      }
    }

    // Look for <meta name="generator" content="WordPress...">
    const generatorContent = $('meta[name="generator"]').attr('content') || '';
    if (generatorContent.toLowerCase().includes('wordpress')) {
      isWordPress = true;
    }

    // Look for wp-content/ or wp-includes/ asset markers
    const hasWpAssets =
      $('link[href*="/wp-content/"], script[src*="/wp-content/"], link[href*="/wp-includes/"]').length > 0;
    if (hasWpAssets) {
      isWordPress = true;
    }
  }

  // If WordPress is confirmed but restApiRoot was not found in tags, check standard /wp-json
  if (isWordPress && !restApiRoot) {
    restApiRoot = `${baseUrl}/wp-json`;
  }

  return {
    success: true,
    reachable: true,
    status,
    finalUrl: response.url || parsedUrl.href,
    isWordPress,
    restApiRoot,
    directPostEndpoint,
    rawHtml,
    requiresBrowser: challengeDetected,
  };
}
