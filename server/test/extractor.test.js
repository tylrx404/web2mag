import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractWithReadability, extractMetadata } from '../src/services/readability.js';
import { calculateReadingTime } from '../src/utils/readingTime.js';

describe('Article Extractor & Readability Services', () => {
  it('calculates reading time with minimum 1 minute', () => {
    assert.equal(calculateReadingTime(''), 1);
    assert.equal(calculateReadingTime('short text'), 1);

    const twoHundredWords = Array(200).fill('word').join(' ');
    assert.equal(calculateReadingTime(twoHundredWords), 1);

    const fiveHundredWords = Array(500).fill('word').join(' ');
    assert.equal(calculateReadingTime(fiveHundredWords), 3);
  });

  it('extracts metadata from OpenGraph and standard tags', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page Title</title>
          <meta property="og:title" content="OpenGraph Editorial Title" />
          <meta property="og:description" content="A description of the article." />
          <meta property="og:image" content="/images/hero.jpg" />
          <meta name="author" content="Dr. Jane Doe" />
          <meta property="article:section" content="Engineering" />
          <meta property="article:published_time" content="2026-09-15T12:00:00Z" />
        </head>
        <body>
          <h1>Heading</h1>
        </body>
      </html>
    `;

    const meta = extractMetadata(html, 'https://example.com/posts/item');
    assert.equal(meta.title, 'OpenGraph Editorial Title');
    assert.equal(meta.author, 'Dr. Jane Doe');
    assert.equal(meta.excerpt, 'A description of the article.');
    assert.equal(meta.featuredImageUrl, 'https://example.com/images/hero.jpg');
    assert.equal(meta.category, 'Engineering');
    assert.equal(meta.publishDate, '2026-09-15T12:00:00Z');
  });

  it('handles pages with missing metadata without fabricating data', () => {
    const minimalHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Minimal Article</title></head>
        <body>
          <article>
            <p>This is a short article without author, image, date, or category tags.</p>
          </article>
        </body>
      </html>
    `;

    const meta = extractMetadata(minimalHtml, 'https://example.com/minimal');
    assert.equal(meta.title, 'Minimal Article');
    assert.equal(meta.author, null);
    assert.equal(meta.featuredImageUrl, null);
    assert.equal(meta.publishDate, null);
    assert.equal(meta.category, null);
    assert.equal(meta.excerpt, null);

    const extracted = extractWithReadability(minimalHtml, 'https://example.com/minimal');
    assert.equal(extracted.author, null);
    assert.equal(extracted.featuredImageUrl, null);
    assert.equal(extracted.publishDate, null);
    assert.equal(extracted.category, null);
    assert.ok(extracted.contentHtml.includes('This is a short article'));
  });

  it('extracts readable content from full HTML articles', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Modular Grid Revival in 2026</title>
          <meta name="author" content="Elena Rostova" />
        </head>
        <body>
          <header><nav><a href="/">Home</a></nav></header>
          <main>
            <article>
              <h1>Modular Grid Revival in 2026</h1>
              <p>Swiss grid typography creates structured visual harmony across digital and print layouts.</p>
              <h3>Baseline Geometry</h3>
              <p>Aligning multi-column text to strict baselines avoids vertical jitter.</p>
              <figure>
                <img src="/grid.png" alt="Grid diagram" />
                <figcaption>Figure 1: Baseline grid</figcaption>
              </figure>
            </article>
          </main>
          <footer><p>Copyright 2026</p></footer>
        </body>
      </html>
    `;

    const extracted = extractWithReadability(html, 'https://journal.example.com/modular-grid');
    assert.equal(extracted.author, 'Elena Rostova');
    assert.ok(extracted.contentHtml.includes('Swiss grid typography'));
    assert.ok(extracted.contentHtml.includes('Baseline Geometry'));
    // Header navigation and footer should not be in main article content
    assert.equal(extracted.contentHtml.includes('Home'), false);
    assert.equal(extracted.contentHtml.includes('Copyright 2026'), false);
  });
});
