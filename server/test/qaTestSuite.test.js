import assert from 'node:assert';
import fs from 'node:fs';
import test from 'node:test';
import {
  generatePdfFromHtml,
  renderArticleToHtml,
  wrapMagazineInPrintDocument,
} from '../src/services/pdfExportService.js';

// Helper to inspect PDF structure
function inspectPdfBuffer(pdfBuffer) {
  const pdfString = pdfBuffer.toString('latin1');
  const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
  const mediaBoxMatch = pdfString.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);

  const widthPt = mediaBoxMatch ? parseFloat(mediaBoxMatch[1]) : 0;
  const heightPt = mediaBoxMatch ? parseFloat(mediaBoxMatch[2]) : 0;
  const widthMm = ((widthPt / 72) * 25.4).toFixed(1);
  const heightMm = ((heightPt / 72) * 25.4).toFixed(1);

  const hasVectorFonts = pdfString.includes('/Font') || pdfString.includes('/FontDescriptor');
  const hasTextOperators = pdfString.includes('BT') || pdfString.includes('/Text');
  const imageMatches = pdfString.match(/\/Subtype\s*\/Image/g);

  return {
    sizeBytes: pdfBuffer.length,
    pageCount: pageMatches ? pageMatches.length : 0,
    widthPt,
    heightPt,
    widthMm: parseFloat(widthMm),
    heightMm: parseFloat(heightMm),
    isA4: Math.abs(parseFloat(widthMm) - 210) < 1.5 && Math.abs(parseFloat(heightMm) - 297) < 1.5,
    hasVectorFonts,
    hasTextOperators,
    imageCount: imageMatches ? imageMatches.length : 0,
    pdfString,
  };
}

test('QA Test 1: Single-Page Article Export', async () => {
  const singlePageArticle = {
    id: 'single-page-1',
    title: 'Short Editorial Dispatch',
    author: 'Editorial Desk',
    category: 'STEM BRIEF',
    formattedDate: 'October 2026',
    summary: 'A concise summary fitting easily within the primary page canvas.',
    sections: [
      { id: '1', type: 'paragraph', content: 'This concise editorial fits entirely on one A4 sheet.' },
      { id: '2', type: 'paragraph', content: 'The second paragraph concludes the discussion cleanly.' },
    ],
  };

  const html = renderArticleToHtml(singlePageArticle, { columnMode: 'two-column' });
  const start = Date.now();
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(html, { title: singlePageArticle.title });
  const totalMs = Date.now() - start;

  const info = inspectPdfBuffer(pdfBuffer);
  console.log(`[QA 1] Single-Page PDF: ${info.pageCount} page(s), ${durationMs}ms export, ${info.widthMm}x${info.heightMm}mm`);

  assert.strictEqual(info.pageCount, 1, 'Single-page article must yield exactly 1 page');
  assert.ok(info.isA4, 'Dimensions must match standard A4 (210mm x 297mm)');
  assert.ok(info.hasVectorFonts, 'Must contain vector font structures');
  assert.ok(durationMs < 8000, 'Export must complete in a few seconds');
});

test('QA Test 2: Typical Multi-Page Article (3–5 Pages) Performance & Layout', async () => {
  const sections = [];
  for (let i = 1; i <= 14; i += 1) {
    if (i % 3 === 1) {
      sections.push({
        id: `h-${i}`,
        type: 'heading',
        level: 2,
        content: `Section ${Math.ceil(i / 3)}: Architectural Foundations of High-Performance Systems`,
      });
    }
    sections.push({
      id: `p-${i}`,
      type: 'paragraph',
      content: `Paragraph ${i}: Engineering resilient systems requires balancing throughput, memory allocation, and concurrency semantics. When writing low-level network parsers or distributed consensus protocols, predictable cache behavior often outweighs raw CPU micro-benchmarks. Thorough invariant testing ensures robust failure recovery.`,
    });
  }
  sections.push({
    id: 'q1',
    type: 'quote',
    content: 'Simplicity is prerequisite for reliability.',
    cite: 'Edsger W. Dijkstra',
  });

  const multiPageArticle = {
    id: 'multi-page-typical',
    title: 'Architectural Foundations of High-Performance Systems',
    author: 'Principal Systems Architect',
    category: 'SYSTEMS ENGINEERING',
    formattedDate: 'Fall 2026',
    summary: 'An analytical guide to cache locality, zero-copy I/O, and deterministic execution.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
    sections,
  };

  const html = renderArticleToHtml(multiPageArticle, { columnMode: 'two-column' });
  const start = Date.now();
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(html, { title: multiPageArticle.title });
  const totalMs = Date.now() - start;

  const info = inspectPdfBuffer(pdfBuffer);
  console.log(`[QA 2] Multi-Page Typical PDF: ${info.pageCount} page(s), ${durationMs}ms export, size: ${(info.sizeBytes / 1024).toFixed(1)} KB`);

  assert.ok(info.pageCount >= 3 && info.pageCount <= 5, `Expected 3–5 pages, got ${info.pageCount}`);
  assert.ok(info.isA4, 'Dimensions must match standard A4 (210mm x 297mm)');
  assert.ok(info.hasVectorFonts, 'Text must be vector rendered, not rasterized');
  assert.ok(durationMs < 8000, `Performance benchmark: Expected a few seconds, took ${(durationMs / 1000).toFixed(2)}s`);

  // Save for artifact verification
  fs.writeFileSync('qa-typical-article.pdf', pdfBuffer);
});

test('QA Test 3: Article with Multiple Images & Base64 Data URLs', async () => {
  // 1x1 transparent PNG data URL for deterministic offline test
  const sampleBase64Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const multiImageArticle = {
    id: 'multi-img-1',
    title: 'Visual Computing and Micro-Architectures',
    author: 'Hardware Editor',
    category: 'HARDWARE & CHIPS',
    formattedDate: 'October 2026',
    summary: 'Analyzing silicon interconnects and GPU pipeline stages.',
    thumbnail: sampleBase64Png,
    sections: [
      { id: 'h1', type: 'heading', level: 2, content: '1. Die Packaging and Interconnects' },
      { id: 'p1', type: 'paragraph', content: 'Modern chiplets rely on silicon interposers to connect compute tiles with high-bandwidth memory.' },
      { id: 'img1', type: 'image', src: sampleBase64Png, caption: 'Figure 1: Silicon interposer wiring diagram' },
      { id: 'h2', type: 'heading', level: 2, content: '2. Tensor Processing Cores' },
      { id: 'p2', type: 'paragraph', content: 'Dedicated matrix multiplication units enable parallel FP8 compute workloads.' },
      { id: 'img2', type: 'image', src: sampleBase64Png, caption: 'Figure 2: Micro-architecture pipeline floorplan' },
    ],
  };

  const html = renderArticleToHtml(multiImageArticle, { columnMode: 'two-column' });
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(html, { title: multiImageArticle.title });
  const info = inspectPdfBuffer(pdfBuffer);

  console.log(`[QA 3] Multiple Images PDF: ${info.pageCount} page(s), ${info.imageCount} images, ${durationMs}ms`);
  assert.ok(info.imageCount >= 2, 'Must embed raster image objects for figures');
  assert.ok(info.isA4, 'Must maintain A4 dimensions');
});

test('QA Test 4: Custom Editor Changes, Reordering & In-Place Edits', async () => {
  // Simulates an editor that swapped Page 2 before Page 1 and modified headings
  const customSheetsHtml = `
    <article class="magazine-sheet">
      <header class="magazine-header">
        <div class="magazine-header__top-row">
          <span class="magazine-header__kicker">CUSTOM REORDERED SPREAD</span>
          <span class="magazine-header__center-title">ENTECH MAGAZINE</span>
          <span class="magazine-header__date-vol">Page 1 of 2</span>
        </div>
        <div class="magazine-header__rule"></div>
      </header>
      <div class="magazine-hero-block">
        <div class="magazine-category-pill">EDITORIAL ESSAY</div>
        <h1 class="magazine-headline">Edited In-Place Custom Title</h1>
        <div class="magazine-byline-bar">
          <strong class="magazine-byline-bar__name">Editor-in-Chief (Modified)</strong>
        </div>
      </div>
      <div class="magazine-body magazine-body--two-col">
        <p class="magazine-paragraph magazine-paragraph--lead">This article spread reflects live changes made by the user in the Phase 3 WYSIWYG editor.</p>
        <h2 class="magazine-subheading magazine-subheading--h2">Modified Section Heading</h2>
        <p class="magazine-paragraph">Notice how the PDF generation captures the updated title and reordered section flow without layout shifting.</p>
      </div>
      <footer class="magazine-footer">
        <div>ENTECH MAGAZINE • ISSUE 04</div>
        <div>Page 1 of 2</div>
      </footer>
    </article>

    <article class="magazine-sheet magazine-sheet--continuation">
      <header class="magazine-header">
        <div class="magazine-header__top-row">
          <span class="magazine-header__kicker">CONTINUATION</span>
          <span class="magazine-header__center-title">ENTECH MAGAZINE</span>
          <span class="magazine-header__date-vol">Page 2 of 2</span>
        </div>
        <div class="magazine-header__rule"></div>
      </header>
      <div class="magazine-body magazine-body--two-col">
        <h2 class="magazine-subheading magazine-subheading--h2">Added Blank Page Section</h2>
        <p class="magazine-paragraph">This text was added via the Add Blank Page button in the visual editor.</p>
      </div>
      <footer class="magazine-footer">
        <div>ENTECH MAGAZINE • ISSUE 04</div>
        <div>Page 2 of 2</div>
      </footer>
    </article>
  `;

  const doc = wrapMagazineInPrintDocument(customSheetsHtml, 'Edited In-Place Custom Title');
  const { pdfBuffer, durationMs } = await generatePdfFromHtml(doc);
  const info = inspectPdfBuffer(pdfBuffer);

  console.log(`[QA 4] Custom Editor Spread PDF: ${info.pageCount} page(s), ${durationMs}ms`);
  assert.strictEqual(info.pageCount, 2, 'Must yield exactly 2 pages');
  assert.ok(info.isA4, 'Must maintain standard A4 geometry');
  assert.ok(info.hasVectorFonts, 'Text must remain vector rendered');
});
