import assert from 'node:assert';
import test from 'node:test';
import { getDbStatus, initDatabase } from '../src/config/db.js';
import {
  createOrUpdateIssue,
  deleteArticle,
  deleteIssue,
  getAllArticles,
  getAllIssues,
  getArticleById,
  getIssueById,
  getPageLayouts,
  saveCompleteIssueState,
  saveOrUpdateArticle,
  savePageLayouts,
} from '../src/services/dbStorageService.js';

test('Database Persistence & Storage Service Tests', async (t) => {
  await t.test('1. Database initialization and connection pool status', async () => {
    await initDatabase();
    const status = getDbStatus();
    assert.ok(status, 'Status object should exist');
    assert.strictEqual(typeof status.connected, 'boolean');
    assert.strictEqual(typeof status.mode, 'string');
    console.log(`[Test] DB Status: connected=${status.connected}, mode=${status.mode}`);
  });

  await t.test('2. Magazine Issue CRUD operations', async () => {
    const testIssue = {
      id: `test-issue-${Date.now()}`,
      title: 'Science & Technology Quarterly',
      volumeNumber: '5',
      issueNumber: '2',
      publicationDate: 'Autumn 2026',
      headerText: 'SCIENCE QUARTERLY • ISSN 9999-0000',
      footerText: '© 2026 STQ • All rights reserved',
      accentColor: '#059669',
      logoPath: 'https://example.com/stq-logo.png',
    };

    const saved = await createOrUpdateIssue(testIssue);
    assert.ok(saved);
    assert.strictEqual(saved.id, testIssue.id);
    assert.strictEqual(saved.title, testIssue.title);
    assert.strictEqual(String(saved.volume_number), '5');
    assert.strictEqual(saved.accent_color, '#059669');

    const fetched = await getIssueById(testIssue.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.title, testIssue.title);

    const allIssues = await getAllIssues();
    assert.ok(Array.isArray(allIssues));
    const found = allIssues.some((iss) => iss.id === testIssue.id);
    assert.ok(found, 'Created issue should be present in issue list');

    // Clean up
    await deleteIssue(testIssue.id);
  });

  await t.test('3. Article CRUD & Serialization', async () => {
    const testArticle = {
      id: `test-art-${Date.now()}`,
      title: 'Quantum Computing Frontiers',
      author: 'Dr. Elena Rostova',
      sourceUrl: 'https://example.com/quantum',
      formattedDate: 'October 2026',
      category: 'Physics',
      summary: 'Exploring fault-tolerant logical qubits and cryogenic error mitigation.',
      thumbnail: 'https://example.com/quantum.jpg',
      sections: [
        { type: 'heading', level: 2, content: 'Fault-Tolerant Qubits' },
        { type: 'paragraph', content: 'Superconducting transmon circuits demonstrate 99.9% gate fidelity.' },
        { type: 'page-break', id: 'pb-1' },
        { type: 'heading', level: 2, content: 'Cryogenic Control Lines' },
      ],
    };

    const savedArticle = await saveOrUpdateArticle(testArticle);
    assert.ok(savedArticle);
    assert.strictEqual(savedArticle.id, testArticle.id);
    assert.strictEqual(savedArticle.title, testArticle.title);
    assert.ok(Array.isArray(savedArticle.sections));
    assert.strictEqual(savedArticle.sections.length, 4);

    const fetched = await getArticleById(testArticle.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.id, testArticle.id);
    assert.strictEqual(fetched.author, 'Dr. Elena Rostova');
    assert.strictEqual(fetched.sections[2].type, 'page-break');

    const allArticles = await getAllArticles();
    assert.ok(Array.isArray(allArticles));
    assert.ok(allArticles.some((a) => a.id === testArticle.id));

    // Clean up
    await deleteArticle(testArticle.id);
  });

  await t.test('4. Page Layouts CRUD', async () => {
    const issueId = 'issue-layout-test';
    const articleId = 'art-layout-test';
    const layouts = [
      { pageNumber: 1, layoutData: { zoom: 100, columnMode: 'two-column', images: [{ id: 'img-1', width: '100%' }] } },
      { pageNumber: 2, layoutData: { zoom: 100, columnMode: 'two-column', images: [] } },
    ];

    await savePageLayouts(issueId, articleId, layouts);
    const fetchedLayouts = await getPageLayouts(issueId, articleId);
    assert.ok(Array.isArray(fetchedLayouts));
    assert.strictEqual(fetchedLayouts.length, 2);
    assert.strictEqual(fetchedLayouts[0].page_number ?? fetchedLayouts[0].pageNumber, 1);
  });

  await t.test('5. Atomic saveCompleteIssueState', async () => {
    const bundle = {
      issue: {
        id: 'atomic-issue-1',
        title: 'Complete Issue State Test',
        volumeNumber: '3',
        issueNumber: '7',
        accentColor: '#dc2626',
      },
      articles: [
        {
          id: 'atomic-art-1',
          title: 'Article 1 in Bundle',
          author: 'Author One',
          sections: [{ type: 'paragraph', content: 'Testing atomic save bundle.' }],
        },
      ],
      layouts: [
        {
          articleId: 'atomic-art-1',
          pageNumber: 1,
          layoutData: { colMode: 'two-column' },
        },
      ],
    };

    const result = await saveCompleteIssueState(bundle);
    assert.ok(result.success);
    assert.strictEqual(result.articlesCount, 1);

    const verifiedIssue = await getIssueById('atomic-issue-1');
    assert.ok(verifiedIssue);
    assert.strictEqual(verifiedIssue.title, 'Complete Issue State Test');

    const verifiedArticle = await getArticleById('atomic-art-1');
    assert.ok(verifiedArticle);
    assert.strictEqual(verifiedArticle.author, 'Author One');

    // Clean up
    await deleteIssue('atomic-issue-1');
    await deleteArticle('atomic-art-1');
  });
});
