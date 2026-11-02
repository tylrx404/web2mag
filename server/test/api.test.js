import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/index.js';

describe('API Endpoints: /api/health and /api/articles/import', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'web2mag-article-ingester');
  });

  it('POST /api/articles/import rejects missing url with 400', async () => {
    const res = await fetch(`${baseUrl}/api/articles/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /provide a valid article URL/i);
  });

  it('POST /api/articles/import rejects unsupported protocol with 400', async () => {
    const res = await fetch(`${baseUrl}/api/articles/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'ftp://files.example.com/doc' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Unsupported protocol/i);
  });

  it('POST /api/articles/import rejects internal/localhost destinations with 400', async () => {
    const res = await fetch(`${baseUrl}/api/articles/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:9000/internal' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /forbidden|localhost/i);
  });
});
