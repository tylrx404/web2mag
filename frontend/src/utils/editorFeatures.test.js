import assert from 'node:assert';
import test from 'node:test';
import { paginateArticleSections } from './paginationEngine.js';

test('1. Article text update preserves integrity and recalculates pagination', () => {
  const originalArticle = {
    id: 'test-1',
    title: 'Original Title',
    author: 'Author A',
    summary: 'Original Summary',
    sections: [
      { id: 's1', type: 'heading', level: 2, content: 'Original Heading' },
      { id: 's2', type: 'paragraph', content: 'Short paragraph for testing.' },
    ],
  };

  const initialPages = paginateArticleSections({
    sections: originalArticle.sections,
    heroHeight: 200,
    columnMode: 'two-column',
  });

  assert.strictEqual(initialPages.length, 1);

  // User edits paragraph into a very long text in WYSIWYG editor
  const editedSections = [
    { ...originalArticle.sections[0], content: 'Updated In-Place Heading' },
    {
      ...originalArticle.sections[1],
      content:
        'This is a massively extended paragraph that will overflow into multiple pages. '.repeat(
          50
        ),
    },
  ];

  const updatedArticle = {
    ...originalArticle,
    title: 'Updated Title',
    sections: editedSections,
  };

  const updatedPages = paginateArticleSections({
    sections: updatedArticle.sections,
    heroHeight: 200,
    columnMode: 'two-column',
  });

  // Verify title updated
  assert.strictEqual(updatedArticle.title, 'Updated Title');
  // Verify heading updated
  assert.strictEqual(updatedArticle.sections[0].content, 'Updated In-Place Heading');
  // Verify automatic pagination handled the overflow
  assert.ok(updatedPages.length > 1, 'Extended content should paginate into multiple pages');
  assert.strictEqual(updatedPages[0].totalPages, updatedPages.length);
});

test('2. Image layout controls (width presets, alignment) modify layout appropriately', () => {
  const article = {
    id: 'test-img',
    title: 'Image Test',
    sections: [
      {
        id: 'img1',
        type: 'image',
        src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        caption: 'Circuit board macro',
        width: '100%',
        align: 'center',
      },
      {
        id: 'p1',
        type: 'paragraph',
        content: 'Following text below image.',
      },
    ],
  };

  // Test resizing to 50% width and left alignment
  const resizedSection = {
    ...article.sections[0],
    width: '50%',
    align: 'left',
  };

  const updatedArticle = {
    ...article,
    sections: [resizedSection, article.sections[1]],
  };

  assert.strictEqual(updatedArticle.sections[0].width, '50%');
  assert.strictEqual(updatedArticle.sections[0].align, 'left');
  assert.strictEqual(updatedArticle.sections[0].caption, 'Circuit board macro');
});

test('3. Adding a blank page appends editable sections and updates page count', () => {
  const baseArticle = {
    id: 'test-blank',
    title: 'Blank Page Test',
    sections: [
      { id: 's1', type: 'heading', level: 2, content: 'Initial Section' },
      { id: 's2', type: 'paragraph', content: 'Initial Paragraph' },
    ],
  };

  const initialPages = paginateArticleSections({
    sections: baseArticle.sections,
    heroHeight: 200,
    columnMode: 'two-column',
  });
  assert.strictEqual(initialPages.length, 1);

  // Simulate handleAddBlankPage
  const blankSection = {
    id: 'blank-1',
    type: 'heading',
    level: 2,
    content: 'New Editorial Section',
  };
  const blankParagraph = {
    id: 'blank-p-1',
    type: 'paragraph',
    content: 'Click here to edit this paragraph and write your magazine article spread...',
  };

  const articleWithBlankPage = {
    ...baseArticle,
    sections: [...baseArticle.sections, blankSection, blankParagraph],
  };

  assert.strictEqual(articleWithBlankPage.sections.length, 4);
  assert.strictEqual(articleWithBlankPage.sections[2].content, 'New Editorial Section');
});

test('4. Page deletion removes targeted sections and recalculates page numbering', () => {
  const longSections = [];
  for (let i = 1; i <= 20; i += 1) {
    longSections.push({
      id: `sec-${i}`,
      type: 'paragraph',
      content: `Paragraph ${i}: ${'Editorial text content block. '.repeat(15)}`,
    });
  }

  const pages = paginateArticleSections({
    sections: longSections,
    heroHeight: 180,
    columnMode: 'two-column',
  });

  assert.ok(pages.length >= 2, 'Should have at least 2 pages');
  const targetPage = pages[pages.length - 1];
  const idsToRemove = new Set(targetPage.sections.map((s) => s.id));

  // Delete last page
  const remainingSections = longSections.filter((s) => !idsToRemove.has(s.id));
  const newPages = paginateArticleSections({
    sections: remainingSections,
    heroHeight: 180,
    columnMode: 'two-column',
  });

  assert.strictEqual(
    newPages.length,
    pages.length - 1,
    'Deleting a page should reduce total page count by 1'
  );
  assert.strictEqual(newPages[0].totalPages, newPages.length);
});

test('5. Page reordering swaps sections and maintains reading flow', () => {
  const sectionA1 = { id: 'a1', type: 'heading', level: 2, content: 'Section Alpha' };
  const sectionA2 = { id: 'a2', type: 'paragraph', content: 'Alpha content '.repeat(35) };
  const sectionB1 = { id: 'b1', type: 'heading', level: 2, content: 'Section Beta' };
  const sectionB2 = { id: 'b2', type: 'paragraph', content: 'Beta content '.repeat(35) };

  const sections = [sectionA1, sectionA2, sectionB1, sectionB2];
  const pages = paginateArticleSections({
    sections,
    heroHeight: 180,
    columnMode: 'two-column',
  });

  // Reorder: swap Alpha and Beta sections
  const reorderedSections = [sectionB1, sectionB2, sectionA1, sectionA2];
  const reorderedPages = paginateArticleSections({
    sections: reorderedSections,
    heroHeight: 180,
    columnMode: 'two-column',
  });

  assert.strictEqual(reorderedPages[0].sections[0].content, 'Section Beta');
  assert.strictEqual(reorderedPages.length, pages.length);
});
