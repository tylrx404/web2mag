import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { getChromeExecutablePath } from './pdfExportService.js';
import { extractArticleFromWebpage } from './htmlParserService.js';
import { BROWSER_REQUEST_HEADERS, isBotChallengeOrEmptyShell } from './siteDetectorService.js';

/**
 * Loads a webpage using Headless Chrome (Puppeteer) to bypass anti-bot challenges,
 * execute JavaScript, and capture the fully rendered client-side DOM.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchRenderedPageHtml(url) {
  const executablePath = getChromeExecutablePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web2mag-loader-'));

  console.log(`[Browser Loader] Launching Headless Chrome to load ${url}...`);

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      userDataDir,
      protocolTimeout: 45000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--remote-debugging-port=0',
      ],
    });

    page = await browser.newPage();
    await page.setUserAgent(BROWSER_REQUEST_HEADERS['User-Agent']);
    await page.setViewport({ width: 1280, height: 900 });

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    // Wait for article body or main content to appear
    await Promise.race([
      page.waitForSelector('article, main, .c-article-body, [itemprop="articleBody"], #content', { timeout: 10000 }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    const renderedHtml = await page.content();
    console.log(`[Browser Loader] Successfully loaded DOM (${(renderedHtml.length / 1024).toFixed(1)} KB)`);
    return renderedHtml;
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3 });
    } catch {}
  }
}

/**
 * Extracts structured article content from arbitrary websites (such as Nature,
 * news publications, Medium, or personal blogs) using semantic HTML parsing.
 * Automatically falls back to Headless Chrome if bot challenges or SPAs are detected.
 *
 * @param {{
 *   parsedUrl: URL,
 *   rawHtml?: string,
 *   requiresBrowser?: boolean
 * }} options
 * @returns {Promise<{
 *   success: boolean,
 *   extracted?: any,
 *   error?: string
 * }>}
 */
export async function extractGeneralArticle({ parsedUrl, rawHtml, requiresBrowser }) {
  let html = rawHtml || '';

  // 1. If direct fetch was blocked by bot challenges (e.g., Nature.com) or needs JS execution
  if (requiresBrowser || isBotChallengeOrEmptyShell(html)) {
    try {
      html = await fetchRenderedPageHtml(parsedUrl.href);
    } catch (browserErr) {
      console.warn(`[General Extractor] Headless browser fetch error for ${parsedUrl.hostname}:`, browserErr.message);
      // If browser fails and we have some rawHtml, attempt extraction with rawHtml
      if (!html) {
        return {
          success: false,
          error: `Could not load page content from ${parsedUrl.hostname}: ${browserErr.message}`,
        };
      }
    }
  }

  // 2. Extract semantic article data using Cheerio
  const extracted = extractArticleFromWebpage(html, parsedUrl.href);

  // 3. Validate extracted content
  if (!extracted.title || extracted.title === 'Page Not Found' || extracted.title === 'Client Challenge') {
    return {
      success: false,
      error: `Could not identify an article title on ${parsedUrl.hostname}. The page might be an index or error page.`,
    };
  }

  if (!extracted.sections || extracted.sections.length === 0) {
    return {
      success: false,
      error: `No readable article body paragraphs or sections were found on ${parsedUrl.hostname}. The content may require a login or be behind an interactive paywall.`,
    };
  }

  return {
    success: true,
    extracted,
  };
}
