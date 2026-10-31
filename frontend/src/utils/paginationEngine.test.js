import assert from 'node:assert';
import test from 'node:test';
import {
  A4_HEIGHT_PX,
  COLUMN_WIDTH_PX,
  DEFAULT_FOOTER_HEIGHT,
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_PAGE_PADDING_V,
  estimateSectionHeight,
  paginateArticleSections,
  splitList,
  splitParagraph,
  splitTextIntoSentences,
} from './paginationEngine.js';

test('1. Sentence splitting preserves punctuation and text', () => {
  const text =
    'AI has made writing code faster. But it has not made software engineering easier! Does understanding matter? Yes, absolutely.';
  const sentences = splitTextIntoSentences(text);
  assert.strictEqual(sentences.length, 4);
  assert.strictEqual(sentences.join('').trim(), text);
});

test('2. Short article fits on 1 page', () => {
  const shortSections = [
    { type: 'heading', level: 2, content: 'Short Feature Overview' },
    {
      type: 'paragraph',
      content:
        'This is a concise editorial dispatch that easily fits within the first A4 page without requiring pagination.',
    },
    {
      type: 'paragraph',
      content:
        'The second paragraph concludes the piece and remains well within the capacity bounds of the two symmetric columns.',
    },
  ];

  const pages = paginateArticleSections({
    sections: shortSections,
    heroHeight: 220,
    columnMode: 'two-column',
  });

  assert.strictEqual(pages.length, 1, 'Short article should produce exactly 1 page');
  assert.strictEqual(pages[0].pageNumber, 1);
  assert.strictEqual(pages[0].totalPages, 1);
  assert.strictEqual(pages[0].isFirstPage, true);
  assert.strictEqual(pages[0].sections.length, 3);
});

test('3. Long article distributes content across multiple pages with Page X of Y', () => {
  const longSections = [];
  for (let i = 1; i <= 25; i += 1) {
    if (i % 4 === 1) {
      longSections.push({
        type: 'heading',
        level: 2,
        content: `Section Heading ${Math.ceil(i / 4)}: In-Depth Architecture Discussion`,
      });
    } else {
      longSections.push({
        type: 'paragraph',
        content: `Paragraph ${i}: High-throughput distributed systems require strict isolation, idempotency keys, and graceful retry policies. When two concurrent requests hit a service concurrently, database constraints ensure invariant state is preserved without race conditions.`,
      });
    }
  }

  const pages = paginateArticleSections({
    sections: longSections,
    heroHeight: 350,
    columnMode: 'two-column',
  });

  assert(pages.length >= 2, `Expected at least 2 pages, got ${pages.length}`);
  pages.forEach((p, idx) => {
    assert.strictEqual(p.pageNumber, idx + 1);
    assert.strictEqual(p.totalPages, pages.length);
    assert(p.sections.length > 0, `Page ${p.pageNumber} should have sections`);
  });
});

test('4. Heading is not orphaned at page bottom (Keep-with-next)', () => {
  // Construct a scenario where a heading would end up at the very bottom of Page 1
  const usableHeight =
    A4_HEIGHT_PX - DEFAULT_PAGE_PADDING_V - DEFAULT_HEADER_HEIGHT - DEFAULT_FOOTER_HEIGHT;
  const heroHeight = 300;
  const page1Capacity = 2 * (usableHeight - heroHeight);

  // Fill up page 1 almost to capacity
  const fillerHeight = page1Capacity - 70; // Only 70px left on Page 1
  const sections = [
    {
      type: 'paragraph',
      content: 'Filler content taking up most of page 1 columns.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Important Heading That Must Not Be Orphaned',
    },
    {
      type: 'paragraph',
      content:
        'This following paragraph must remain attached to the heading rather than leaving the heading stranded alone at the bottom of the page.',
    },
  ];

  // Provide measured heights where heading (40px) + following paragraph (100px) exceeds remaining 70px
  const measuredHeights = {
    'sec-0': fillerHeight,
    'sec-1': 45, // heading
    'sec-2': 120, // following paragraph
  };

  const pages = paginateArticleSections({
    sections,
    heroHeight,
    measuredHeights,
    columnMode: 'two-column',
  });

  // Verify that the heading moved to Page 2 with its following paragraph!
  const page1HasHeading = pages[0].sections.some((s) => s.type === 'heading');
  const page2HasHeading = pages[1]?.sections.some((s) => s.type === 'heading');

  assert.strictEqual(
    page1HasHeading,
    false,
    'Heading should NOT be at the bottom of Page 1 with no room for following text'
  );
  assert.strictEqual(
    page2HasHeading,
    true,
    'Heading should be placed at the top of Page 2 with its following paragraph'
  );
});

test('5. Large images do not clip or extend outside page boundaries', () => {
  const sections = [
    {
      type: 'paragraph',
      content: 'Leading paragraph introducing the hardware schematic figure below.',
    },
    {
      type: 'image',
      src: 'https://entechonline.com/wp-content/uploads/2026/08/PCB-design.jpg',
      alt: 'PCB Schematic',
      caption: 'Detailed layer routing schematic',
    },
    {
      type: 'paragraph',
      content: 'Subsequent analysis describing the high-frequency trace routing.',
    },
  ];

  const pages = paginateArticleSections({
    sections,
    heroHeight: 250,
    columnMode: 'two-column',
  });

  pages.forEach((p) => {
    p.sections.forEach((sec) => {
      if (sec.type === 'image') {
        const estH = estimateSectionHeight(sec);
        assert(
          estH <= p.columnHeight,
          `Image height (${estH}) should not exceed column height (${p.columnHeight})`
        );
      }
    });
  });
});

test('6. Long paragraphs split cleanly when overflowing', () => {
  const longParagraph = {
    type: 'paragraph',
    content:
      'First sentence establishing context. Second sentence detailing the race condition. Third sentence explaining optimistic locking. Fourth sentence discussing idempotency keys. Fifth sentence summarizing logging and monitoring best practices.',
  };

  const splitResult = splitParagraph(longParagraph, 80, COLUMN_WIDTH_PX);
  assert.strictEqual(splitResult.canSplit, true);
  assert(splitResult.part1.content.length > 0);
  assert(splitResult.part2.content.length > 0);
  assert.strictEqual(
    `${splitResult.part1.content} ${splitResult.part2.content}`,
    longParagraph.content
  );
});

test('7. Lists split cleanly across page breaks', () => {
  const listSection = {
    type: 'list',
    ordered: false,
    items: [
      'Item 1: Database uniqueness constraints',
      'Item 2: Optimistic concurrency control',
      'Item 3: Distributed idempotency keys',
      'Item 4: Structured logging breadcrumbs',
      'Item 5: Centralized monitoring telemetry',
      'Item 6: Automated regression test suites',
    ],
  };

  const splitResult = splitList(listSection, 90);
  assert.strictEqual(splitResult.canSplit, true);
  assert(splitResult.part1.items.length >= 1);
  assert(splitResult.part2.items.length >= 1);
  assert.strictEqual(
    splitResult.part1.items.length + splitResult.part2.items.length,
    listSection.items.length
  );
});
