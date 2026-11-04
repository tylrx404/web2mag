import assert from 'node:assert';
import test from 'node:test';
import { SEED_ARTICLES } from '../../frontend/src/data/seedArticles.js';
import { paginateArticleSections } from '../../frontend/src/utils/paginationEngine.js';
import { renderArticleToHtml, wrapMagazineInPrintDocument } from '../src/services/pdfExportService.js';

test('Magazine Template & Cover No-Duplicate Verification Suite', async (t) => {
  const realArticle = SEED_ARTICLES[0];

  await t.test('1. Real Article has valid metadata and sections', () => {
    assert.strictEqual(realArticle.title, 'Do you Understand your Code?');
    assert.strictEqual(realArticle.author, 'Vivek Khatri');
    assert.ok(realArticle.thumbnail, 'Must have cover thumbnail');
    assert.ok(realArticle.sections.length >= 35, 'Must contain complete article sections (38 sections)');
  });

  await t.test('2. Naturally targets 5–6 pages total without fake filler', () => {
    // When includeCover is true, the article content is paginated across interior pages
    // and Sheet 1 is the Front Cover
    const pages = paginateArticleSections({
      sections: realArticle.sections,
      heroHeight: 220, // Page 1 hero without duplicate hero image figure
      columnMode: 'two-column',
      pageHeight: 1123,
      pagePaddingV: 106,
      headerHeight: 38,
      footerHeight: 30,
    });

    const interiorPagesCount = pages.length;
    const totalMagazineSheets = interiorPagesCount + 1; // 1 Cover + interior pages

    assert.ok(
      totalMagazineSheets >= 5 && totalMagazineSheets <= 6,
      `Total magazine sheets must naturally target 5–6 pages, got: ${totalMagazineSheets} (${interiorPagesCount} interior + 1 cover)`
    );

    // Verify last page has the real References list and FAQ sections
    const lastPage = pages[pages.length - 1];
    const hasReferencesOrFaq = lastPage.sections.some(
      (s) => (s.type === 'heading' && /reference|faq|conclusion/i.test(s.content)) || s.type === 'list'
    );
    assert.ok(hasReferencesOrFaq, 'Final page must contain real references/conclusion from article');
  });

  await t.test('3. Cover displays main article image strictly ONCE with zero duplicates', () => {
    const html = renderArticleToHtml(realArticle, {
      columnMode: 'two-column',
      includeCover: true,
      issue: { title: 'Web2Mag Magazine', volumeNumber: '1', issueNumber: '1' },
    });

    // Count occurrences of article.thumbnail in the entire rendered HTML
    const thumbEscaped = realArticle.thumbnail.trim();
    const regex = new RegExp(thumbEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = html.match(regex);

    assert.strictEqual(
      matches ? matches.length : 0,
      1,
      `Main article image must appear strictly ONCE across the entire publication (found ${matches ? matches.length : 0})`
    );

    // Verify it is in the cover backdrop and NOT in a magazine-featured-figure on Page 1
    assert.ok(html.includes('magazine-cover__backdrop-img'), 'Must be in the cover backdrop');
    assert.ok(!html.includes('<figure class="magazine-featured-figure"'), 'Must NOT have magazine-featured-figure element on Page 1 when cover is included');
  });

  await t.test('4. Interior legitimate images with distinct URLs are preserved', () => {
    const articleWithInteriorImages = {
      ...realArticle,
      sections: [
        { id: 'sec-1', type: 'paragraph', content: 'Opening paragraph.' },
        // A section image that happens to repeat the cover thumbnail (should be omitted)
        { id: 'sec-2', type: 'image', src: realArticle.thumbnail, caption: 'Duplicate thumbnail' },
        { id: 'sec-3', type: 'paragraph', content: 'Middle paragraph.' },
        // A legitimate interior image diagram (must be preserved!)
        { id: 'sec-4', type: 'image', src: 'https://entechonline.com/wp-content/uploads/2026/08/architecture-diagram.jpg', caption: 'Figure 1: Concurrency Architecture Model' },
        { id: 'sec-5', type: 'paragraph', content: 'Concluding remarks.' },
      ],
    };

    const html = renderArticleToHtml(articleWithInteriorImages, {
      columnMode: 'two-column',
      includeCover: true,
    });

    // Verify the legitimate interior image is present
    assert.ok(html.includes('architecture-diagram.jpg'), 'Legitimate interior image must be preserved');
    assert.ok(html.includes('Figure 1: Concurrency Architecture Model'), 'Interior caption must be preserved');

    // Verify the duplicate thumbnail section was stripped
    assert.ok(!html.includes('Duplicate thumbnail'), 'Duplicate cover thumbnail in sections must not be rendered');

    // Total thumbnail count must still be exactly 1 (on the cover)
    const thumbEscaped = realArticle.thumbnail.trim();
    const regex = new RegExp(thumbEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = html.match(regex);
    assert.strictEqual(matches ? matches.length : 0, 1, 'Only 1 cover image across entire output');
  });

  await t.test('5. Editorial color palette, typography and layout rules', () => {
    const doc = wrapMagazineInPrintDocument('<div class="magazine-sheet">Sheet</div>', 'Test Publication', {
      accentColor: '#2563eb',
    });

    // Color palette verification
    assert.ok(doc.includes('#0a1128'), 'Must include deep navy #0a1128');
    assert.ok(doc.includes('#2563eb'), 'Must include electric blue accent #2563eb');
    assert.ok(doc.includes('#f8fafc'), 'Must include subtle neutral #f8fafc');

    // Layout & typography verification
    assert.ok(doc.includes('Playfair Display'), 'Must include Playfair Display headline font');
    assert.ok(doc.includes('column-gap: 22px'), 'Must include 22px column gap');
    assert.ok(doc.includes('break-after: avoid'), 'Must include heading break-after: avoid rule');
    assert.ok(doc.includes('column-rule'), 'Must include column rule border');
  });
});
