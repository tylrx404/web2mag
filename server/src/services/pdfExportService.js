import fs from 'node:fs';
import puppeteer from 'puppeteer';

/**
 * Detects the Chrome / Edge browser executable on Windows, Linux, or macOS.
 * Falls back to Puppeteer's bundled Chromium if available.
 */
export function getChromeExecutablePath() {
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}

/**
 * Builds a complete standalone HTML5 document containing all magazine stylesheets,
 * Google Fonts, print rules, and A4 page geometry.
 *
 * @param {string} sheetsHtml - Raw HTML of the .magazine-sheet elements
 * @param {string} title - Article or document title
 * @returns {string} Fully styled HTML string
 */
export function wrapMagazineInPrintDocument(sheetsHtml, title = 'Web2Mag Publication') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- High-Quality Typography: Inter (Sans UI), Playfair Display (Editorial Headlines), Source Serif 4 (Body Text), JetBrains Mono (Code) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">

  <style>
    /* ==========================================================================
       Print-Optimized A4 Magazine Stylesheet for Web2Mag PDF Export
       ========================================================================== */

    @page {
      size: A4 portrait;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 210mm;
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #1e293b;
      font-family: 'Source Serif 4', 'Charter', 'Sitka Text', 'Cambria', Georgia, serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }

    /* --------------------------------------------------------------------------
       A4 Page Sheet Geometry
       210mm × 297mm (Standard ISO 216)
       -------------------------------------------------------------------------- */
    .magazine-sheet {
      width: 210mm !important;
      min-height: 297mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      padding: 16mm 18mm 16mm !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
      background-color: #ffffff !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: always !important;
      break-after: page !important;
    }

    .magazine-sheet:last-of-type {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    .magazine-sheet--continuation {
      border-top: 3px solid #4f46e5 !important;
    }

    /* --------------------------------------------------------------------------
       Running Header
       -------------------------------------------------------------------------- */
    .magazine-header {
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .magazine-header__top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 8.5pt;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      padding-bottom: 5px;
    }

    .magazine-header__kicker {
      color: #4f46e5;
      font-weight: 700;
    }

    .magazine-header__center-title {
      color: #334155;
    }

    .magazine-header__date-vol {
      color: #64748b;
    }

    .magazine-header__rule {
      height: 2px;
      background: linear-gradient(90deg, #4f46e5 0%, #312e81 40%, #e2e8f0 100%);
      margin-top: 2px;
    }

    /* --------------------------------------------------------------------------
       Hero / Headline Block (Page 1)
       -------------------------------------------------------------------------- */
    .magazine-hero-block {
      margin-bottom: 16px;
      flex-shrink: 0;
    }

    .magazine-category-pill {
      display: inline-block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
      background-color: #1e1b4b;
      padding: 3px 9px;
      border-radius: 3px;
      margin-bottom: 8px;
    }

    .magazine-headline {
      margin: 0 0 10px;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26pt;
      font-weight: 700;
      line-height: 1.15;
      color: #0f172a;
      letter-spacing: -0.025em;
      word-break: break-word;
    }

    .magazine-byline-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 8.5pt;
      color: #475569;
      padding: 6px 0 10px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .magazine-byline-bar__label {
      color: #64748b;
      margin-right: 4px;
    }

    .magazine-byline-bar__name {
      color: #0f172a;
      font-weight: 700;
    }

    .magazine-byline-bar__divider {
      width: 1px;
      height: 12px;
      background-color: #cbd5e1;
    }

    .magazine-byline-bar__link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }

    /* Standfirst / Lead Summary Box */
    .magazine-standfirst {
      background-color: #f8fafc;
      border-left: 4px solid #4f46e5;
      border-right: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 16px;
      margin-bottom: 14px;
      border-radius: 0 6px 6px 0;
    }

    .magazine-standfirst__text {
      margin: 0;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      font-style: italic;
      font-weight: 500;
    }

    /* Featured Hero Figure */
    .magazine-featured-figure {
      margin: 0 0 16px 0;
      width: 100%;
    }

    .magazine-featured-figure__img {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: block;
    }

    .magazine-featured-figure__caption {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 5px;
      font-style: italic;
      text-align: right;
    }

    /* --------------------------------------------------------------------------
       Article Body & Two-Column Text Flow
       -------------------------------------------------------------------------- */
    .magazine-body {
      flex: 1;
      min-height: 0;
    }

    .magazine-body--two-col {
      column-count: 2;
      column-gap: 24px;
      column-fill: auto;
      column-rule: 1px solid #edf2f7;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      overflow: hidden;
    }

    .magazine-body--single-col {
      max-width: 100%;
      text-align: left;
      overflow: hidden;
    }

    /* Drop Cap on Lead Paragraph */
    .magazine-paragraph--lead::first-letter,
    .magazine-body > .magazine-paragraph:first-of-type::first-letter {
      float: left;
      font-size: 3.4em;
      line-height: 0.8;
      padding-top: 4px;
      padding-right: 8px;
      padding-bottom: 2px;
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      color: #1e1b4b;
    }

    .magazine-paragraph {
      margin: 0 0 10px;
      font-size: 9.75pt;
      line-height: 1.58;
      color: #1e293b;
      word-break: break-word;
    }

    .magazine-paragraph a {
      color: #3730a3;
      text-decoration: underline;
    }

    .magazine-paragraph code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
    }

    /* Section Headings */
    .magazine-subheading {
      color: #0f172a;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 700;
      letter-spacing: -0.015em;
      page-break-after: avoid;
      break-after: avoid;
    }

    .magazine-subheading--h2 {
      font-size: 13pt;
      line-height: 1.25;
      margin: 14px 0 6px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
      color: #1e1b4b;
    }

    .magazine-subheading--h3 {
      font-size: 11pt;
      line-height: 1.3;
      margin: 11px 0 5px;
      color: #312e81;
    }

    .magazine-subheading--h4 {
      font-size: 9.75pt;
      line-height: 1.35;
      margin: 8px 0 4px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Inline Images */
    .magazine-inline-figure {
      margin: 10px 0 12px;
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
    }

    .magazine-inline-figure__img {
      width: 100%;
      height: auto;
      max-height: 200px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      display: block;
    }

    .magazine-inline-figure__caption {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
      line-height: 1.3;
    }

    /* Editorial Blockquotes */
    .magazine-blockquote {
      margin: 12px 0 14px;
      padding: 10px 14px 10px 18px;
      background-color: #faf5ff;
      border-left: 3px solid #7c3aed;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .magazine-blockquote__text {
      font-size: 10pt;
      line-height: 1.5;
      color: #4c1d95;
      font-style: italic;
      margin: 0;
    }

    .magazine-blockquote__cite {
      display: block;
      margin-top: 4px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 7.5pt;
      font-weight: 600;
      color: #6b21a8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Lists */
    .magazine-list {
      margin: 0 0 10px;
      padding-left: 18px;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1e293b;
    }

    .magazine-list__item {
      margin-bottom: 4px;
    }

    /* Divider */
    .magazine-divider {
      border: none;
      border-top: 1px dashed #cbd5e1;
      margin: 12px 0;
    }

    /* --------------------------------------------------------------------------
       Running Footer (Page X of Y)
       -------------------------------------------------------------------------- */
    .magazine-footer {
      margin-top: 14px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 8pt;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }

    .magazine-footer__left {
      color: #475569;
      font-weight: 600;
    }

    .magazine-footer__center {
      color: #94a3b8;
    }

    .magazine-footer__right {
      color: #0f172a;
      font-weight: 700;
    }

    /* --------------------------------------------------------------------------
       Print Safety Overrides
       Remove any interactive editor highlights or contenteditable artifacts
       -------------------------------------------------------------------------- */
    [contenteditable] {
      outline: none !important;
      border-color: transparent !important;
    }

    .magazine-editable-text--active,
    .magazine-editable-figure--active,
    .magazine-editable-box--active {
      outline: none !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`;
}

/**
 * Escapes characters for HTML attributes or text.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Headless HTML renderer for structured article objects.
 * Used when the export endpoint is called with raw article data rather than pre-rendered client HTML.
 *
 * @param {any} article
 * @param {{ columnMode?: string }} options
 * @returns {string} Standalone HTML document
 */
export function renderArticleToHtml(article, { columnMode = 'two-column' } = {}) {
  const title = article.title || 'Untitled Article';
  const categoryLabel = (article.category || 'FEATURE FOCUS').toUpperCase();
  const authorName = article.author || 'Editorial Staff';
  const issueDate = article.formattedDate || 'Recent Issue';
  const sourceDomain = article.sourceUrl
    ? (() => {
        try {
          return new URL(article.sourceUrl).hostname.replace(/^www\./i, '');
        } catch {
          return 'entechonline.com';
        }
      })()
    : 'entechonline.com';

  const sections = article.sections || [];

  // Group sections into pages (approx 6-8 sections per continuation page, 3-4 for Page 1)
  const pagesData = [];
  let remaining = [...sections];

  // Page 1
  const page1Count = Math.min(remaining.length, 3);
  pagesData.push({
    pageNumber: 1,
    isFirstPage: true,
    sections: remaining.slice(0, page1Count),
  });
  remaining = remaining.slice(page1Count);

  // Subsequent pages
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, 6);
    pagesData.push({
      pageNumber: pagesData.length + 1,
      isFirstPage: false,
      sections: chunk,
    });
    remaining = remaining.slice(6);
  }

  const totalPages = pagesData.length;

  const sheetsHtml = pagesData
    .map((page) => {
      const isFirst = page.isFirstPage;
      const pageNum = page.pageNumber;

      const headerHtml = `
      <header class="magazine-header">
        <div class="magazine-header__top-row">
          ${
            isFirst
              ? `<span class="magazine-header__kicker">${escapeHtml(categoryLabel)}</span>
                 <span class="magazine-header__center-title">ENTECH MAGAZINE • ISSN (ONLINE): 2584-2749</span>
                 <span class="magazine-header__date-vol">VOLUME 4 • ISSUE 9 | ${escapeHtml(issueDate)}</span>`
              : `<span class="magazine-header__kicker">${escapeHtml(categoryLabel)} (CONTINUED)</span>
                 <span class="magazine-header__center-title">ENTECH MAGAZINE • ${escapeHtml(title)}</span>
                 <span class="magazine-header__date-vol">Page ${pageNum} of ${totalPages}</span>`
          }
        </div>
        <div class="magazine-header__rule" aria-hidden="true"></div>
      </header>`;

      const heroHtml = isFirst
        ? `
      <div class="magazine-hero-block">
        <div class="magazine-category-pill">${escapeHtml(categoryLabel)}</div>
        <h1 class="magazine-headline">${escapeHtml(title)}</h1>
        <div class="magazine-byline-bar">
          <div class="magazine-byline-bar__author">
            <span class="magazine-byline-bar__label">Written By:</span>
            <strong class="magazine-byline-bar__name">${escapeHtml(authorName)}</strong>
          </div>
          <div class="magazine-byline-bar__divider" aria-hidden="true"></div>
          <div class="magazine-byline-bar__date">${escapeHtml(issueDate)}</div>
          <div class="magazine-byline-bar__divider" aria-hidden="true"></div>
          <div class="magazine-byline-bar__source">
            <span class="magazine-byline-bar__label">Source:</span>
            <span class="magazine-byline-bar__link">${escapeHtml(sourceDomain)}</span>
          </div>
        </div>

        ${
          article.summary
            ? `<div class="magazine-standfirst">
                 <p class="magazine-standfirst__text">${escapeHtml(article.summary)}</p>
               </div>`
            : ''
        }

        ${
          article.thumbnail
            ? `<figure class="magazine-featured-figure">
                 <img src="${article.thumbnail}" alt="${escapeHtml(title)}" class="magazine-featured-figure__img" />
                 <figcaption class="magazine-featured-figure__caption">Cover Dispatch &bull; ${escapeHtml(sourceDomain)}</figcaption>
               </figure>`
            : ''
        }
      </div>`
        : '';

      const bodyClass =
        columnMode === 'single-column'
          ? 'magazine-body magazine-body--single-col'
          : 'magazine-body magazine-body--two-col';

      const sectionsHtml = page.sections
        .map((s, idx) => {
          if (s.type === 'heading') {
            const level = s.level || 2;
            return `<h${level} class="magazine-subheading magazine-subheading--h${level}">${escapeHtml(s.content)}</h${level}>`;
          }
          if (s.type === 'paragraph') {
            const isLead = isFirst && idx === 0;
            return `<p class="magazine-paragraph ${isLead ? 'magazine-paragraph--lead' : ''}">${escapeHtml(s.content)}</p>`;
          }
          if (s.type === 'image') {
            return `<figure class="magazine-inline-figure">
              <img src="${s.src}" alt="${escapeHtml(s.caption || title)}" class="magazine-inline-figure__img" />
              ${s.caption ? `<figcaption class="magazine-inline-figure__caption">${escapeHtml(s.caption)}</figcaption>` : ''}
            </figure>`;
          }
          if (s.type === 'quote') {
            return `<blockquote class="magazine-blockquote">
              <p class="magazine-blockquote__text">&ldquo;${escapeHtml(s.content)}&rdquo;</p>
              ${s.cite ? `<cite class="magazine-blockquote__cite">&mdash; ${escapeHtml(s.cite)}</cite>` : ''}
            </blockquote>`;
          }
          if (s.type === 'list') {
            const items = (s.items || []).map((it) => `<li class="magazine-list__item">${escapeHtml(it)}</li>`).join('');
            return s.ordered ? `<ol class="magazine-list">${items}</ol>` : `<ul class="magazine-list">${items}</ul>`;
          }
          if (s.type === 'divider') {
            return `<hr class="magazine-divider" />`;
          }
          return '';
        })
        .join('\n');

      const footerHtml = `
      <footer class="magazine-footer">
        <div class="magazine-footer__left">ENTECH MAGAZINE &bull; ISSUE 04</div>
        <div class="magazine-footer__center">${escapeHtml(issueDate)}</div>
        <div class="magazine-footer__right">Page ${pageNum} of ${totalPages}</div>
      </footer>`;

      return `
      <article class="magazine-sheet ${!isFirst ? 'magazine-sheet--continuation' : ''}">
        ${headerHtml}
        ${heroHtml}
        <div class="${bodyClass}">
          ${sectionsHtml}
        </div>
        ${footerHtml}
      </article>`;
    })
    .join('\n');

  return wrapMagazineInPrintDocument(sheetsHtml, title);
}

/**
 * Core PDF generation engine using Puppeteer with Headless Chrome.
 * Produces crisp, vector-rendered text and high-fidelity multi-page A4 PDFs.
 *
 * @param {string} htmlContent - Full HTML document string to render
 * @param {{
 *   title?: string,
 *   totalPages?: number
 * }} options
 * @returns {Promise<{ pdfBuffer: Buffer, durationMs: number }>}
 */
export async function generatePdfFromHtml(htmlContent, options = {}) {
  const startTime = Date.now();
  const executablePath = getChromeExecutablePath();

  console.log('[PDF Export] Launching Headless Chrome...', {
    usingExecutable: executablePath || 'bundled-chromium',
  });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=medium',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Emulate print media so all @page and @media print CSS rules apply
    await page.emulateMediaType('print');

    // Set viewport corresponding to standard A4 at 96 DPI
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2, // 2x device scale for high-DPI raster elements
    });

    // Load the HTML content
    await page.setContent(htmlContent, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });

    // 1. Wait for Google Web Fonts to fully load into memory before printing
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (fontErr) {
      console.warn('[PDF Export] Font ready check warning:', fontErr.message);
    }

    // 2. Wait for all inline images (including base64 data URLs) to complete loading
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve); // Don't hang on broken image links
          });
        })
      );
    });

    // 3. Generate native vector PDF with A4 geometry and zero margins (CSS controls padding)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      displayHeaderFooter: false, // Disables unwanted browser header/footer (date, URL, page#)
    });

    const durationMs = Date.now() - startTime;
    console.log(
      `[PDF Export] Completed in ${(durationMs / 1000).toFixed(2)}s | Output size: ${(
        pdfBuffer.length / 1024
      ).toFixed(1)} KB`
    );

    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      durationMs,
    };
  } finally {
    await browser.close();
  }
}
