import assert from 'node:assert';
import test, { before, after } from 'node:test';
import app from '../src/index.js';

let server;
let API_BASE = 'http://localhost:5001/api/articles/import';

before(async () => {
  try {
    const res = await fetch('http://localhost:5001/api/health');
    if (res.ok) {
      console.log('[Test Setup] Connected to existing server on port 5001');
      return;
    }
  } catch {
    // Start self-contained test server
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  API_BASE = `http://localhost:${port}/api/articles/import`;
  console.log(`[Test Setup] Started self-contained test server on port ${port}`);
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});


test('Test 1: Valid WordPress article URL uses WordPress REST API', async () => {
  const url = 'https://entechonline.com/do-you-understand-your-code/';
  console.log(`\n--- Test 1: Testing valid WordPress article: ${url} ---`);

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.ingestionMethod, 'WordPress REST API');
  assert.strictEqual(data.article.sourceType, 'wordpress-rest-api');
  assert.ok(data.article.title.toLowerCase().includes('understand your code'), 'Title must match');
  assert.ok(data.article.sections.length > 5, 'Must extract article sections');
  assert.ok(data.article.thumbnail, 'Must extract featured image');

  console.log(`Success! Ingested: "${data.article.title}" by ${data.article.author}`);
  console.log(`Method: ${data.ingestionMethod} | Sections: ${data.article.sections.length}`);
});

test('Test 2: Nature article URL uses General Extractor without claiming WordPress error', async () => {
  const url = 'https://www.nature.com/articles/d41586-026-03543-9';
  console.log(`\n--- Test 2: Testing Nature.com article: ${url} ---`);

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.article.sourceType, 'semantic-html');
  assert.ok(data.article.title.toLowerCase().includes('captain picard') || data.article.title.toLowerCase().includes('stewart'), 'Title must match');
  assert.ok(data.article.author && data.article.author !== '', 'Must extract author');
  assert.ok(data.article.sections.length > 5, 'Must extract sections');
  assert.ok(data.article.thumbnail, 'Must extract thumbnail');

  console.log(`Success! Ingested Nature: "${data.article.title}" by ${data.article.author}`);
  console.log(`Method: ${data.ingestionMethod} | Sections: ${data.article.sections.length}`);
});

test('Test 3: Normal tech/engineering blog article URL uses General Article Extractor', async () => {
  const url = 'https://overreacted.io/before-you-memo/';
  console.log(`\n--- Test 3: Testing standard blog article: ${url} ---`);

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.article.sourceType, 'semantic-html');
  assert.strictEqual(data.ingestionMethod, 'General Article Semantic Extractor');
  assert.ok(data.article.title.toLowerCase().includes('before you memo'), 'Title must match');
  assert.ok(data.article.sections.length > 3, 'Must extract sections');

  console.log(`Success! Ingested blog: "${data.article.title}" by ${data.article.author}`);
  console.log(`Method: ${data.ingestionMethod} | Sections: ${data.article.sections.length}`);
});

test('Test 4: Generic /posts collection URL returns meaningful error without false WordPress slug assumption', async () => {
  const url = 'https://wordpress.org/posts';
  console.log(`\n--- Test 4: Testing generic /posts URL: ${url} ---`);

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  assert.ok(res.status === 404 || res.status === 422, `Expected 404 or 422, got ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  console.log(`Received error message: "${data.error}"`);

  // Verify that the error does NOT say "No published WordPress post found matching slug 'posts'"
  assert.ok(
    !data.error.includes('No published WordPress post found matching slug "posts"'),
    'Should not claim slug "posts" post not found'
  );
  assert.ok(
    data.error.toLowerCase().includes('not found') || data.error.includes('collection') || data.error.includes('archive'),
    'Must provide accurate explanation of archive or 404 status'
  );
});

test('Test 5: Malformed or non-existent URLs return clean 400 or 422 errors', async () => {
  console.log('\n--- Test 5: Testing invalid URLs ---');

  // Case A: Malformed URL without protocol
  const resMalformed = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'not-a-valid-url' }),
  });
  assert.strictEqual(resMalformed.status, 400);
  const dataA = await resMalformed.json();
  assert.strictEqual(dataA.success, false);
  assert.ok(dataA.error.includes('Malformed URL') || dataA.error.includes('domain'));
  console.log('Case A (Malformed):', dataA.error);

  // Case B: Non-existent domain
  const resNonExistent = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://non-existent-domain-web2mag-test-987654.org/article' }),
  });
  assert.strictEqual(resNonExistent.status, 422);
  const dataB = await resNonExistent.json();
  assert.strictEqual(dataB.success, false);
  assert.ok(dataB.error.includes('Could not reach') || dataB.error.includes('network'));
  console.log('Case B (Non-existent domain):', dataB.error);
});
