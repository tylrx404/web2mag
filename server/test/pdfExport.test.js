import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderIssueToPdf, buildIssuePrintHtml } from '../src/services/pdfRenderer.js';
import { buildMagazinePages } from '../../frontend/src/services/magazineModel.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

describe('PDF Export Engine & Vector Document Generation', () => {
  const issueConfig = {
    magazineTitle: 'ENTECH MAGAZINE',
    volume: 'VOLUME 4',
    issue: 'ISSUE 9',
    date: 'September 2026',
    issn: '2584-2749',
    website: 'www.entechonline.com',
    publisher: 'STEM Research Press',
    coverHeadline: 'Printed Circuit Boards: From Silicon to System',
    coverSubhead: 'Comprehensive hardware engineering and manufacturability insights.',
  };

  const sampleArticles = [
    {
      id: 'art-test-1',
      title: 'High-Density PCB Routing and Impedance Matching',
      author: 'Dr. Sarah Connor',
      category: 'CAREER FOCUS',
      contentHtml: `
        <p class="a4-lead">Modern microelectronics demand rigorous printed circuit design practices to guarantee signal fidelity and thermal dissipation across industrial operating environments.</p>
        <h3>Substrate Selection &amp; Dielectric Control</h3>
        <p>Choosing between standard FR4 and high-frequency PTFE laminates dictates the achievable trace clearance and controlled impedance tolerances.</p>
        <figure class="a4-figure">
          <img src="https://entechonline.com/test-fig.png" alt="Board Layout" class="a4-figure__img" />
          <figcaption>Figure 1: High-density multi-layer routing stackup.</figcaption>
        </figure>
      `,
    },
    {
      id: 'art-test-2',
      title: 'Modular Layout Grids in Digital Periodicals',
      author: 'Marcus Vance',
      category: 'DESIGN',
      contentHtml: `
        <p class="a4-lead">Applying mathematical grid systems brings balance and pacing to technical editorial publications.</p>
        <p>Two-column layouts provide the optimal character line length for sustained reading comfort.</p>
      `,
    },
  ];

  it('rejects invalid or empty page array with descriptive error', async () => {
    await assert.rejects(
      () => renderIssueToPdf([], issueConfig),
      /Cannot export PDF: No magazine pages provided/
    );
    await assert.rejects(
      () => renderIssueToPdf(null, issueConfig),
      /Cannot export PDF: No magazine pages provided/
    );
  });

  it('builds complete standalone HTML with embedded styles and sheets', () => {
    const pages = buildMagazinePages(sampleArticles, issueConfig);
    const html = buildIssuePrintHtml(pages, issueConfig);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('@page {'));
    assert.ok(html.includes('print-sheet'));
    assert.ok(html.includes('ENTECH MAGAZINE'));
    assert.ok(html.includes('High-Density PCB Routing'));
    assert.ok(html.includes('Table of Contents'));
    assert.ok(html.includes('About the Authors'));
  });

  it('renders a valid vector A4 PDF with selectable text and exact page count', async () => {
    const pages = buildMagazinePages(sampleArticles, issueConfig);
    assert.ok(pages.length >= 4, `Expected at least 4 pages, got ${pages.length}`);

    const pdfBuffer = await renderIssueToPdf(pages, issueConfig);

    // 1. Verify buffer is valid PDF binary header
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 5000, `PDF buffer too small: ${pdfBuffer.length} bytes`);
    const headerStr = pdfBuffer.subarray(0, 5).toString('ascii');
    assert.equal(headerStr, '%PDF-');

    // 2. Parse PDF to verify page count and selectable text
    const parser = new PDFParse({ data: pdfBuffer });
    await parser.load();
    const info = await parser.getInfo();
    assert.equal(
      info.total,
      pages.length,
      `Expected ${pages.length} pages in PDF, parsed ${info.total}`
    );

    // 3. Confirm text is selectable vector content, not raster images!
    const textObj = await parser.getText();
    const extractedText = textObj.text || '';
    assert.ok(extractedText.length > 200, 'PDF text must be selectable and non-empty');
    assert.ok(/ENTECH MAGAZINE/i.test(extractedText), 'Should contain magazine masthead');
    assert.ok(extractedText.includes('Dr. Sarah Connor'), 'Should contain author name');
    assert.ok(extractedText.includes('High-Density PCB Routing'), 'Should contain article headline');
    assert.ok(/TABLE OF CONTENTS/i.test(extractedText), 'Should contain TOC title');
    assert.ok(/ABOUT THE AUTHORS/i.test(extractedText), 'Should contain Author section');

    await parser.destroy();
  });
});
