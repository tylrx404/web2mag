import assert from 'node:assert';
import test from 'node:test';
import {
  cleanHtmlAndExtractSections,
  extractArticleFromWebpage,
  extractBestImageSrc,
} from '../src/services/htmlParserService.js';
import * as cheerio from 'cheerio';

test('Article Extraction Completeness & Validation Tests', async (t) => {
  await t.test('1. Short paragraphs, dialogue lines, and captions are NOT dropped', () => {
    const rawHtml = `
      <article>
        <h1>A Short Tale</h1>
        <p>Yes.</p>
        <p>"Wait!" cried the editor.</p>
        <p>A simple paragraph with normal length describing the scene in detail.</p>
        <figure>
          <img src="https://example.com/test.jpg" alt="Test image" />
          <figcaption>Fig 1.</figcaption>
        </figure>
      </article>
    `;

    const result = cleanHtmlAndExtractSections(rawHtml, 'https://example.com');
    assert.strictEqual(result.sections.length, 5);

    // Verify short paragraph 1
    const p1 = result.sections.find((s) => s.type === 'paragraph' && s.content === 'Yes.');
    assert.ok(p1, 'Short paragraph "Yes." must be preserved');

    // Verify dialogue line
    const p2 = result.sections.find((s) => s.type === 'paragraph' && s.content.includes('"Wait!"'));
    assert.ok(p2, 'Dialogue line must be preserved');

    // Verify figure with short caption
    const fig = result.sections.find((s) => s.type === 'image');
    assert.ok(fig, 'Figure must be extracted');
    assert.strictEqual(fig.caption, 'Fig 1.', 'Short caption "Fig 1." must be preserved');
  });

  await t.test('2. Lazy-loaded image attributes and srcset resolution', () => {
    const rawHtml = `
      <div>
        <img class="lazy" data-src="https://example.com/hi-res.jpg" src="data:image/svg+xml;base64,PHN2Zy8+" alt="Lazy Hero" />
        <img data-srcset="https://example.com/small.jpg 400w, https://example.com/large.jpg 1200w" src="https://example.com/placeholder.jpg" alt="Srcset Hero" />
      </div>
    `;

    const $ = cheerio.load(rawHtml);
    const $imgs = $('img');

    const firstBest = extractBestImageSrc($imgs.eq(0));
    assert.strictEqual(firstBest, 'https://example.com/hi-res.jpg', 'Should pick data-src over SVG placeholder');

    const secondBest = extractBestImageSrc($imgs.eq(1));
    assert.strictEqual(secondBest, 'https://example.com/large.jpg', 'Should pick largest image from data-srcset');
  });

  await t.test('3. Extraction validation mechanism compares source vs extracted blocks', () => {
    const rawHtml = `
      <div class="content">
        <h2>Heading 1</h2>
        <p>Paragraph 1 about design systems.</p>
        <p>Paragraph 2 about responsive typography.</p>
        <p>Paragraph 3 about print page breaks.</p>
        <figure>
          <img src="https://example.com/diagram.png" alt="Architecture" />
          <figcaption>Figure Caption</figcaption>
        </figure>
        <blockquote>Quotes are essential for editorial spreads.</blockquote>
        <ul>
          <li>Point A</li>
          <li>Point B</li>
        </ul>
      </div>
    `;

    const result = cleanHtmlAndExtractSections(rawHtml, 'https://example.com');
    assert.ok(result.validation, 'Validation object should be returned');
    assert.strictEqual(result.validation.isComplete, true);
    assert.strictEqual(result.validation.sourceBlocks.paragraphs, 3);
    assert.strictEqual(result.validation.extractedBlocks.paragraphs, 3);
    assert.strictEqual(result.validation.extractedBlocks.headings, 1);
    assert.strictEqual(result.validation.extractedBlocks.images, 1);
    assert.strictEqual(result.validation.extractedBlocks.quotes, 1);
    assert.strictEqual(result.validation.extractedBlocks.lists, 1);
    assert.strictEqual(result.validation.potentialMissingParagraphs, 0);
  });

  await t.test('4. Full webpage extraction with metadata and validation', () => {
    const fullPageHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exploring Mars Rovers - Space Explorer</title>
        <meta property="og:title" content="Exploring Mars Rovers" />
        <meta name="author" content="Dr. Sarah Connor" />
        <meta property="og:description" content="A comprehensive analysis of robotic exploration on the Martian surface." />
      </head>
      <body>
        <main class="article-body">
          <h1>Exploring Mars Rovers</h1>
          <p>Robotic rovers on Mars navigate extreme terrains and radiation environments.</p>
          <p>From Sojourner to Perseverance, autonomous systems have advanced substantially.</p>
          <h2>Power Systems</h2>
          <p>Radioisotope thermoelectric generators (RTGs) provide decades of uninterrupted electricity.</p>
        </main>
      </body>
      </html>
    `;

    const article = extractArticleFromWebpage(fullPageHtml, 'https://space-explorer.org/mars-rovers');
    assert.strictEqual(article.title, 'Exploring Mars Rovers');
    assert.strictEqual(article.author, 'Dr. Sarah Connor');
    assert.ok(article.summary.includes('comprehensive analysis'));
    assert.ok(article.sections.length >= 3);
    assert.ok(article.validation);
    assert.strictEqual(article.validation.isComplete, true);
  });
});
