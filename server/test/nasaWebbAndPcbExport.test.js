import assert from 'node:assert';
import test from 'node:test';
import { generatePdfFromHtml, renderArticleToHtml } from '../src/services/pdfExportService.js';
import { detectWebsiteAndFetch } from '../src/services/siteDetectorService.js';
import { extractGeneralArticle } from '../src/services/generalArticleExtractorService.js';
import { fetchWordPressPost } from '../src/services/wordpressService.js';
import { cleanHtmlAndExtractSections } from '../src/services/htmlParserService.js';
import { normalizeArticle } from '../src/services/articleNormalizer.js';

test('1. PCB Manufacturing Article exports to valid A4 PDF swiftly without timeout', async () => {
  const pcbUrl = 'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/';
  const parsedPcbUrl = new URL(pcbUrl);
  const pcbProbe = await detectWebsiteAndFetch(parsedPcbUrl);
  
  assert.ok(pcbProbe.reachable, 'PCB site must be reachable');
  assert.ok(pcbProbe.isWordPress, 'ENTECH is a WordPress site');

  const pcbWp = await fetchWordPressPost({
    parsedUrl: parsedPcbUrl,
    restApiRoot: pcbProbe.restApiRoot,
    directPostEndpoint: pcbProbe.directPostEndpoint,
  });

  assert.ok(pcbWp.success && pcbWp.post, 'PCB WordPress post must be fetched');

  const pcbParsed = cleanHtmlAndExtractSections(pcbWp.post.rawContent, parsedPcbUrl.origin);
  const pcbArticle = normalizeArticle({
    id: pcbWp.post.id,
    title: pcbWp.post.title,
    author: pcbWp.post.author,
    date: pcbWp.post.date,
    category: pcbWp.post.category,
    summary: pcbParsed.summary,
    thumbnail: pcbWp.post.featuredImage || pcbParsed.firstImageUrl,
    sourceUrl: pcbWp.post.sourceUrl,
    sourceType: 'wordpress-rest-api',
    cleanHtml: pcbParsed.cleanHtml,
    sections: pcbParsed.sections,
  });

  const pcbHtml = renderArticleToHtml(pcbArticle);
  const startTime = Date.now();
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(pcbHtml, {
    title: pcbArticle.title,
  });

  assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a buffer');
  assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdfBuffer.length > 50000, 'PDF buffer must be substantive');
  assert.ok(durationMs < 10000, `PCB PDF must export in < 10s (took ${durationMs}ms)`);
  console.log(`[Verified] PCB PDF exported: ${(pdfBuffer.length / 1024).toFixed(1)} KB in ${(durationMs / 1000).toFixed(2)}s`);
});

test('2. NASA James Webb Space Telescope Article exports to valid A4 PDF without 185s timeout', async () => {
  const nasaUrl = 'https://science.nasa.gov/mission/webb/';
  const parsedNasaUrl = new URL(nasaUrl);
  const nasaProbe = await detectWebsiteAndFetch(parsedNasaUrl);

  assert.ok(nasaProbe.reachable, 'NASA website must be reachable');

  const nasaRes = await extractGeneralArticle({
    parsedUrl: parsedNasaUrl,
    rawHtml: nasaProbe.rawHtml,
    requiresBrowser: nasaProbe.requiresBrowser,
  });

  assert.ok(nasaRes.success && nasaRes.extracted, 'NASA article must be extracted');
  const nasaArticle = nasaRes.extracted;
  assert.ok(nasaArticle.sections.length > 20, 'NASA article must have multiple sections');

  const nasaHtml = renderArticleToHtml(nasaArticle);
  const startTime = Date.now();
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(nasaHtml, {
    title: nasaArticle.title,
  });

  assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a buffer');
  assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdfBuffer.length > 100000, 'NASA PDF must contain rich pages');
  // Must be far below the 185-second hang:
  assert.ok(durationMs < 25000, `NASA PDF must export in < 25s (took ${(durationMs / 1000).toFixed(2)}s)`);
  console.log(`[Verified] NASA James Webb PDF exported: ${(pdfBuffer.length / 1024).toFixed(1)} KB in ${(durationMs / 1000).toFixed(2)}s`);
});
