import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, resolveRelativeUrls, extractImageUrls, stripHtml } from '../src/services/sanitizer.js';

describe('HTML Sanitization & URL Resolution', () => {
  it('strips malicious <script> tags and onload handlers', () => {
    const dirty = '<p>Safe intro</p><script>alert("hack")</script><img src="test.jpg" onload="evil()" />';
    const clean = sanitizeHtml(dirty, 'https://example.com');
    assert.equal(clean.includes('<script>'), false);
    assert.equal(clean.includes('alert'), false);
    assert.equal(clean.includes('onload'), false);
    assert.equal(clean.includes('<p>Safe intro</p>'), true);
  });

  it('strips <iframe> and <embed> tags', () => {
    const dirty = '<div>Article text<iframe src="https://attacker.com/cookie"></iframe></div>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean.includes('<iframe'), false);
    assert.equal(clean.includes('Article text'), true);
  });

  it('preserves semantic editorial elements', () => {
    const sample = `
      <h1>Editorial Title</h1>
      <p class="a4-lead">Lead paragraph text.</p>
      <h3>Subheading</h3>
      <blockquote>"A notable pullquote."</blockquote>
      <figure>
        <img src="https://example.com/figure.png" alt="Figure 1" />
        <figcaption>Figure 1: Caption</figcaption>
      </figure>
      <ul><li>Item 1</li><li>Item 2</li></ul>
    `;
    const clean = sanitizeHtml(sample);
    assert.equal(clean.includes('<h1>Editorial Title</h1>'), true);
    assert.equal(clean.includes('<h3>Subheading</h3>'), true);
    assert.equal(clean.includes('<blockquote>'), true);
    assert.equal(clean.includes('<figure>'), true);
    assert.equal(clean.includes('<figcaption>'), true);
    assert.equal(clean.includes('<ul>'), true);
  });

  it('enforces target="_blank" and rel="noopener noreferrer" on links', () => {
    const html = '<p>Visit <a href="https://entechonline.com">Entech Online</a> for details.</p>';
    const clean = sanitizeHtml(html);
    assert.equal(clean.includes('target="_blank"'), true);
    assert.equal(clean.includes('rel="noopener noreferrer"'), true);
  });

  it('resolves relative image and link URLs against baseUrl', () => {
    const relativeHtml = '<p><a href="/about-us">About</a></p><img src="/uploads/2026/pcb.png" />';
    const resolved = resolveRelativeUrls(relativeHtml, 'https://entechonline.com/articles/pcb');
    assert.equal(resolved.includes('https://entechonline.com/about-us'), true);
    assert.equal(resolved.includes('https://entechonline.com/uploads/2026/pcb.png'), true);
  });

  it('extracts unique image URLs correctly', () => {
    const html = `
      <img src="/img1.png" />
      <img src="https://example.com/img2.jpg" />
      <img src="/img1.png" />
    `;
    const images = extractImageUrls(html, 'https://example.com/sub/');
    assert.equal(images.length, 2);
    assert.equal(images[0], 'https://example.com/img1.png');
    assert.equal(images[1], 'https://example.com/img2.jpg');
  });

  it('strips HTML to generate clean plain text', () => {
    const html = '<h1>Title</h1><p>First paragraph with <strong>bold</strong> text.</p>';
    const text = stripHtml(html);
    assert.equal(text, 'Title First paragraph with bold text.');
  });
});
