import assert from 'node:assert';
import test from 'node:test';
import {
  generatePdfFromHtml,
  renderArticleToHtml,
  wrapMagazineInPrintDocument,
} from '../src/services/pdfExportService.js';

test('1. wrapMagazineInPrintDocument wraps content in valid A4 print HTML document', () => {
  const dummySheet = '<article class="magazine-sheet"><h1>Sample</h1></article>';
  const doc = wrapMagazineInPrintDocument(dummySheet, 'Test Publication');

  assert.ok(doc.includes('<!DOCTYPE html>'), 'Must include HTML5 doctype');
  assert.ok(doc.includes('Test Publication'), 'Must include page title');
  assert.ok(doc.includes('@page'), 'Must include @page CSS rule');
  assert.ok(doc.includes('size: A4 portrait'), 'Must define A4 portrait size');
  assert.ok(doc.includes('page-break-after: always'), 'Must preserve CSS page breaks');
  assert.ok(doc.includes('fonts.googleapis.com'), 'Must link Google Fonts');
  assert.ok(doc.includes(dummySheet), 'Must include the magazine sheets');
});

test('2. renderArticleToHtml generates multi-page A4 magazine sheets with Page X of Y', () => {
  const article = {
    id: 'test-doc',
    title: 'Future of Cognitive Engineering',
    author: 'Chief Editor',
    formattedDate: 'Fall 2026',
    category: 'STEM & AI',
    summary: 'An exploration of human-AI collaborative software architecture.',
    sections: [
      { id: '1', type: 'paragraph', content: 'Introductory paragraph one.' },
      { id: '2', type: 'paragraph', content: 'Paragraph two.' },
      { id: '3', type: 'paragraph', content: 'Paragraph three.' },
      { id: '4', type: 'paragraph', content: 'Paragraph four.' },
      { id: '5', type: 'paragraph', content: 'Paragraph five.' },
      { id: '6', type: 'paragraph', content: 'Paragraph six.' },
      { id: '7', type: 'paragraph', content: 'Paragraph seven.' },
      { id: '8', type: 'paragraph', content: 'Paragraph eight.' },
      { id: '9', type: 'paragraph', content: 'Paragraph nine.' },
      { id: '10', type: 'paragraph', content: 'Paragraph ten.' },
    ],
  };

  const html = renderArticleToHtml(article, { columnMode: 'two-column' });

  assert.ok(html.includes('class="magazine-sheet'), 'Must contain .magazine-sheet elements');
  assert.ok(html.includes('Page 1 of 3'), 'Must contain Page 1 of Y footer');
  assert.ok(html.includes('Page 2 of 3'), 'Must contain Page 2 of Y footer');
  assert.ok(html.includes('Future of Cognitive Engineering'), 'Must include title');
});

test('3. generatePdfFromHtml creates a valid vector A4 PDF using Puppeteer', async () => {
  const minimalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: sans-serif; margin: 0; padding: 20mm; }
          h1 { color: #1e1b4b; font-size: 24pt; }
          p { color: #334155; font-size: 11pt; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Vector Text Quality Verification</h1>
        <p>This text is rendered as native vector glyphs inside the PDF document stream.</p>
      </body>
    </html>
  `;

  const { pdfBuffer, durationMs } = await generatePdfFromHtml(minimalHtml);

  assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a Node.js Buffer');
  assert.ok(pdfBuffer.length > 5000, 'PDF buffer must be non-empty and well-formed');
  assert.strictEqual(
    pdfBuffer.subarray(0, 5).toString('ascii'),
    '%PDF-',
    'PDF must start with %PDF- signature'
  );
  assert.ok(durationMs < 10000, `PDF generation must be fast (took ${durationMs}ms)`);

  const pdfString = pdfBuffer.toString('latin1');
  assert.ok(
    pdfString.includes('/Font'),
    'PDF must embed font glyph descriptors for vector rendering'
  );

  // Check MediaBox A4 dimensions (595 x 842 pt)
  const mediaBoxMatch = pdfString.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  assert.ok(mediaBoxMatch, 'PDF must contain MediaBox dimensions');
  const widthMm = (parseFloat(mediaBoxMatch[1]) / 72) * 25.4;
  const heightMm = (parseFloat(mediaBoxMatch[2]) / 72) * 25.4;
  assert.ok(Math.abs(widthMm - 210) < 1, `Width should be ~210mm (got ${widthMm}mm)`);
  assert.ok(Math.abs(heightMm - 297) < 1, `Height should be ~297mm (got ${heightMm}mm)`);
});
