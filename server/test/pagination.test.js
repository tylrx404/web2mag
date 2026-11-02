import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  paginateArticleContent,
  normalizeContentBlocks,
  countWords,
  splitParagraphBlock,
  stripHtml,
} from '../../frontend/src/services/paginationEngine.js';
import { buildMagazinePages } from '../../frontend/src/services/magazineModel.js';

describe('Automatic Article Pagination Engine', () => {
  // 1. Content Normalization & Word Counting
  describe('Content Normalization & Extraction', () => {
    it('accurately counts words and strips HTML', () => {
      const html = '<p>Electronic systems require <strong>compact</strong> layouts.</p>';
      assert.equal(countWords(stripHtml(html)), 5);
      assert.equal(stripHtml(html), 'Electronic systems require compact layouts.');
    });

    it('normalizes mixed semantic elements into layout blocks', () => {
      const html = `
        <p class="a4-lead">Lead intro paragraph with valuable context.</p>
        <h3>Section Title</h3>
        <p>Follow-up descriptive paragraph with technical details.</p>
        <figure class="a4-figure">
          <img src="https://example.com/circuit.png" alt="Circuit" />
          <figcaption>Figure 1: Schematic trace diagram.</figcaption>
        </figure>
        <ol>
          <li>Design rule checks</li>
          <li>Fabrication steps</li>
        </ol>
      `;
      const blocks = normalizeContentBlocks(html);
      assert.equal(blocks.length, 5);
      assert.equal(blocks[0].type, 'paragraph');
      assert.equal(blocks[0].className, 'a4-lead');
      assert.equal(blocks[1].type, 'heading');
      assert.equal(blocks[1].isHeading, true);
      assert.equal(blocks[1].keepWithNext, true);
      assert.equal(blocks[2].type, 'paragraph');
      assert.equal(blocks[3].type, 'figure');
      assert.equal(blocks[3].isFigure, true);
      assert.equal(blocks[4].type, 'list');
    });

    it('returns empty array when contentHtml is empty or whitespace', () => {
      assert.deepEqual(normalizeContentBlocks(''), []);
      assert.deepEqual(normalizeContentBlocks('   \n  '), []);
      assert.deepEqual(normalizeContentBlocks(null), []);
    });
  });

  // 2. Short Article Fitting on One Page
  describe('Short Article (Single Page Fit)', () => {
    it('keeps a short article on a single page with chunkIndex 0 and totalPages 1', () => {
      const shortArticle = {
        id: 'art-short',
        title: 'Compact Editorial',
        contentHtml: `
          <p class="a4-lead">A short introductory paragraph.</p>
          <h3>Brief Overview</h3>
          <p>A second concise paragraph that easily fits within the single-page A4 budget.</p>
        `,
      };

      const pages = paginateArticleContent(shortArticle);
      assert.equal(pages.length, 1);
      assert.equal(pages[0].chunkIndex, 0);
      assert.equal(pages[0].isFirstPage, true);
      assert.equal(pages[0].isLastPage, true);
      assert.equal(pages[0].totalPages, 1);
      assert.equal(pages[0].isEmpty, false);
      assert.ok(pages[0].contentHtml.includes('Brief Overview'));
    });
  });

  // 3. Long Article Spanning Several Pages
  describe('Long Article (Multi-Page Distribution)', () => {
    it('automatically flows long article across consecutive pages without truncation', () => {
      // Create an article with 14 sections of ~150 words each (~2100 words total)
      const sections = [];
      for (let i = 1; i <= 14; i += 1) {
        sections.push(`<h3>Technical Milestone ${i}</h3>`);
        sections.push(
          `<p>Paragraph ${i} describes in extensive detail the multi-layer printed circuit routing methodologies, thermal dissipation channels, and high-speed signal integrity guidelines required for modern industrial microcontrollers operating in extreme environments. Each trace must be carefully impedance-matched to prevent harmonic reflections and electromagnetic interference.</p>`
        );
      }

      const longArticle = {
        id: 'art-long',
        title: 'Comprehensive Guide to High-Density Interconnects',
        contentHtml: sections.join('\n'),
      };

      const pages = paginateArticleContent(longArticle);

      // Verify it spanned at least 2 pages
      assert.ok(
        pages.length >= 2,
        `Expected at least 2 pages, got ${pages.length}`
      );

      // Verify page metadata sequencing
      pages.forEach((page, idx) => {
        assert.equal(page.chunkIndex, idx);
        assert.equal(page.totalPages, pages.length);
        assert.equal(page.isFirstPage, idx === 0);
        assert.equal(page.isLastPage, idx === pages.length - 1);
        assert.ok(page.contentHtml.length > 0);
      });

      // Verify ALL sections are preserved across the pages (zero loss!)
      const allText = pages.map((p) => p.contentHtml).join('\n');
      for (let i = 1; i <= 14; i += 1) {
        assert.ok(
          allText.includes(`Technical Milestone ${i}`),
          `Missing section heading ${i}`
        );
      }
    });
  });

  // 4. Atomic Figure and Caption Retention
  describe('Figure and Caption Integrity', () => {
    it('retains images and their captions together in the same figure block', () => {
      const figureHtml = `
        <figure class="a4-figure">
          <img src="https://entechonline.com/diagram.png" alt="Architecture" class="a4-figure__img" />
          <figcaption>Figure 3: Detailed automated inspection process flow.</figcaption>
        </figure>
      `;

      const article = {
        id: 'art-fig',
        title: 'Inspection Methods',
        contentHtml: `<p>Intro text.</p>${figureHtml}<p>Outro text.</p>`,
      };

      const pages = paginateArticleContent(article);
      assert.ok(pages.length >= 1);

      // Find the page containing the figure
      const figPage = pages.find((p) => p.contentHtml.includes('a4-figure'));
      assert.ok(figPage, 'Figure must be present in one of the pages');
      assert.ok(figPage.contentHtml.includes('<img'));
      assert.ok(figPage.contentHtml.includes('<figcaption>'));
      assert.ok(figPage.contentHtml.includes('Figure 3: Detailed automated inspection'));
    });

    it('preserves multiple distinct figures across paginated output', () => {
      const fig1 = `
        <figure class="a4-figure">
          <img src="https://entechonline.com/fig1.png" alt="Fig 1" class="a4-figure__img" />
          <figcaption>Figure 1: Thermal distribution map.</figcaption>
        </figure>
      `;
      const fig2 = `
        <figure class="a4-figure">
          <img src="https://entechonline.com/fig2.png" alt="Fig 2" class="a4-figure__img" />
          <figcaption>Figure 2: Component placement matrix.</figcaption>
        </figure>
      `;

      const article = {
        id: 'art-multi-fig',
        title: 'Hardware Schematics',
        contentHtml: `<p>Section A</p>${fig1}<p>Section B</p>${fig2}<p>Conclusion</p>`,
      };

      const pages = paginateArticleContent(article);
      const combinedHtml = pages.map((p) => p.contentHtml).join('\n');

      assert.ok(combinedHtml.includes('fig1.png'));
      assert.ok(combinedHtml.includes('Figure 1: Thermal distribution map.'));
      assert.ok(combinedHtml.includes('fig2.png'));
      assert.ok(combinedHtml.includes('Figure 2: Component placement matrix.'));
    });
  });

  // 5. Heading Protection (keepWithNext)
  describe('Heading Protection (keepWithNext / Anti-Orphan)', () => {
    it('never leaves a heading as an orphan at the bottom of a page chunk', () => {
      // Fill Column 1 and Column 2 comfortably, leaving ~70px in Column 2.
      // 23 paragraphs = ~1420px total (Col 1: ~745px, Col 2: ~675px).
      // Next block is a heading (40px) followed by a paragraph (75px) = 115px.
      // 115px > 80px: heading + paragraph cannot both fit in Column 2!
      // The engine MUST NOT put the heading on Page 1 as an orphan.
      // Instead, it must push the heading to Page 2!
      const paragraphs = [];
      for (let i = 0; i < 23; i += 1) {
        paragraphs.push(
          `<p>Standard background paragraph ${i} with substantial text to fill the column space comfortably. We ensure the layout budget is consumed in a predictable manner across both columns.</p>`
        );
      }

      const content = `
        ${paragraphs.join('\n')}
        <h3>Crucial Future Developments</h3>
        <p>This paragraph must immediately follow the heading on the same page.</p>
      `;

      const pages = paginateArticleContent({
        id: 'art-orphan-check',
        contentHtml: content,
      });

      assert.ok(pages.length >= 2, 'Should break into 2 pages');

      // Check the last block of Page 1: it must NOT be the heading
      const page1Blocks = pages[0].blocks;
      const lastBlockPage1 = page1Blocks[page1Blocks.length - 1];
      assert.notEqual(
        lastBlockPage1.type,
        'heading',
        'Page 1 must not end with an orphan heading!'
      );

      // Verify the heading is on Page 2 and followed by its text
      const page2Blocks = pages[1].blocks;
      const headingBlockIndex = page2Blocks.findIndex(
        (b) => b.text && b.text.includes('Crucial Future Developments')
      );
      assert.ok(
        headingBlockIndex !== -1,
        'Heading must be at Page 2'
      );
      assert.ok(
        headingBlockIndex < page2Blocks.length - 1,
        'Heading must have following content on the same page!'
      );
    });
  });

  // 6. Rich Editorial Content (Headings, Lists, Blockquotes, Tables)
  describe('Rich Editorial Elements (Lists, Blockquotes, Tables)', () => {
    it('preserves lists, blockquotes, and tables without data corruption', () => {
      const richHtml = `
        <p class="a4-lead">Lead introductory paragraph about industrial standards.</p>
        <blockquote>
          Engineering discipline is not merely about functionality; it is about reproducible excellence.
        </blockquote>
        <h3>Key Verification Steps</h3>
        <ul>
          <li>Design rule checks (DRC)</li>
          <li>Electrical rule checks (ERC)</li>
          <li>Thermal stress simulation</li>
        </ul>
        <table>
          <thead><tr><th>Parameter</th><th>Target</th></tr></thead>
          <tbody>
            <tr><td>Trace Width</td><td>0.15mm</td></tr>
            <tr><td>Clearance</td><td>0.20mm</td></tr>
          </tbody>
        </table>
        <p>Final concluding thoughts on fabrication success.</p>
      `;

      const article = {
        id: 'art-rich',
        title: 'Editorial Standards',
        contentHtml: richHtml,
      };

      const pages = paginateArticleContent(article);
      assert.ok(pages.length >= 1);

      const allHtml = pages.map((p) => p.contentHtml).join('\n');
      assert.ok(allHtml.includes('<blockquote>'));
      assert.ok(allHtml.includes('reproducible excellence'));
      assert.ok(allHtml.includes('<ul>'));
      assert.ok(allHtml.includes('Thermal stress simulation'));
      assert.ok(allHtml.includes('<table>'));
      assert.ok(allHtml.includes('0.15mm'));
    });
  });

  // 7. Oversized Paragraph Splitting
  describe('Oversized Paragraph Handling', () => {
    it('splits massive paragraphs at sentence boundaries without dropping any words', () => {
      const sentence1 = 'The exploration of deep-sea hydrothermal vents has transformed modern biology.';
      const sentence2 = 'Chemosynthetic bacteria thrive in superheated mineral solutions where sunlight cannot penetrate.';
      const sentence3 = 'These extreme organisms produce complex organic molecules using hydrogen sulfide and methane.';
      const sentence4 = 'Such adaptations provide compelling analogs for potential extraterrestrial ecosystems on icy ocean worlds like Europa and Enceladus.';

      const paragraph = `<p>${sentence1} ${sentence2} ${sentence3} ${sentence4}</p>`;
      const block = normalizeContentBlocks(paragraph)[0];

      // Request a split with space for only ~2 sentences
      const { part1, part2 } = splitParagraphBlock(block, 80);

      assert.ok(part1, 'Part 1 must be created');
      assert.ok(part2, 'Part 2 must be created');
      assert.ok(part1.text.includes(sentence1));
      assert.ok(part2.text.includes(sentence4));

      // Total words must match original word count exactly
      assert.equal(
        part1.wordCount + part2.wordCount,
        block.wordCount,
        'Word count must be perfectly preserved across split'
      );
    });
  });

  // 8. Empty Content & Fallback States
  describe('Empty Content & Fallback States', () => {
    it('returns a single chunk with isEmpty: true when contentHtml is blank', () => {
      const emptyArticle = {
        id: 'art-empty',
        title: 'Unpublished Draft',
        contentHtml: '',
      };

      const pages = paginateArticleContent(emptyArticle);
      assert.equal(pages.length, 1);
      assert.equal(pages[0].chunkIndex, 0);
      assert.equal(pages[0].isEmpty, true);
      assert.equal(pages[0].contentHtml, '');
      assert.equal(pages[0].totalPages, 1);
    });

    it('handles article with only whitespace in contentHtml', () => {
      const whitespaceArticle = {
        id: 'art-whitespace',
        title: 'Whitespace Draft',
        contentHtml: '   \n\t   ',
      };

      const pages = paginateArticleContent(whitespaceArticle);
      assert.equal(pages.length, 1);
      assert.equal(pages[0].isEmpty, true);
    });
  });

  // 9. Full Issue Integration & TOC Page Mapping
  describe('Magazine Issue Structure & Dynamic TOC Folio Mapping', () => {
    it('maps TOC starting page numbers accurately when articles span multiple pages', () => {
      // Article 1: Long article spanning 2+ pages
      const art1Sections = [];
      for (let i = 1; i <= 12; i += 1) {
        art1Sections.push(
          `<h3>Art 1 Section ${i}: Technical Specifications</h3>` +
          `<p>Comprehensive description ${i} of system engineering protocols, hardware testing routines, signal integrity analysis, and high-frequency impedance-matched trace routing across multilayer FR4 substrates under strict thermal cycling constraints.</p>` +
          `<p>Secondary validation step for Section ${i} verifying that copper clearances and annular rings adhere to strict IPC Class 3 fabrication tolerances.</p>`
        );
      }
      const article1 = {
        id: 'art-1',
        title: 'Multi-Page Engineering Feature',
        author: 'Lead Engineer',
        category: 'FEATURE',
        contentHtml: art1Sections.join('\n'),
      };

      // Article 2: Short article (1 page)
      const article2 = {
        id: 'art-2',
        title: 'Short Op-Ed',
        author: 'Columnist',
        category: 'OPINION',
        contentHtml: '<p>A concise column fitting neatly on one page.</p>',
      };

      // Article 3: Empty draft article (1 placeholder page)
      const article3 = {
        id: 'art-3',
        title: 'Draft Item',
        author: 'Reporter',
        category: 'NEWS',
        contentHtml: '',
      };

      const issueConfig = {
        magazineTitle: 'Test Science Review',
        volume: 'VOL 1',
        issue: 'ISSUE 1',
        date: 'October 2026',
        issn: '1234-5678',
      };

      const issuePages = buildMagazinePages([article1, article2, article3], issueConfig);

      // Verify sequence of pages:
      // Page 1: Cover
      assert.equal(issuePages[0].type, 'cover');
      assert.equal(issuePages[0].pageNumber, 1);

      // Page 2: Table of Contents
      assert.equal(issuePages[1].type, 'toc');
      assert.equal(issuePages[1].pageNumber, 2);

      // TOC entries check:
      const tocEntries = issuePages[1].entries;
      assert.equal(tocEntries.length, 3);

      // Article 1 starts at Page 3
      assert.equal(tocEntries[0].id, 'art-1');
      assert.equal(tocEntries[0].pageNumber, 3);
      assert.equal(tocEntries[0].pageId, 'page-art-art-1-p0');

      // Check how many pages Article 1 produced
      const art1Pages = issuePages.filter((p) => p.articleId === 'art-1');
      assert.ok(art1Pages.length >= 2, `Expected Article 1 to span >= 2 pages, got ${art1Pages.length}`);

      // Article 2 starts immediately after Article 1's last page!
      const expectedArt2Start = 3 + art1Pages.length;
      assert.equal(tocEntries[1].id, 'art-2');
      assert.equal(tocEntries[1].pageNumber, expectedArt2Start);
      assert.equal(tocEntries[1].pageId, 'page-art-art-2-p0');

      // Article 3 starts immediately after Article 2 (1 page)
      const expectedArt3Start = expectedArt2Start + 1;
      assert.equal(tocEntries[2].id, 'art-3');
      assert.equal(tocEntries[2].pageNumber, expectedArt3Start);

      // Verify sequential page numbers across all pages without gaps
      issuePages.forEach((p, idx) => {
        assert.equal(p.pageNumber, idx + 1, `Page at index ${idx} must have pageNumber ${idx + 1}`);
      });

      // Verify Author Profile page is at the end
      const lastPage = issuePages[issuePages.length - 1];
      assert.equal(lastPage.type, 'author');
      assert.equal(lastPage.pageNumber, issuePages.length);
    });
  });
});
