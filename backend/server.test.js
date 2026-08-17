const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./server.js');

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

test('root route should respond successfully', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetchJson(`http://127.0.0.1:${port}/`, {
      headers: { Origin: 'https://violess-web.vercel.app' },
    });

    assert.equal(res.status, 200, `expected 200 but got ${res.status}: ${res.text}`);
    assert.match(res.headers.get('access-control-allow-origin') || '', /violess-web/i);
  } finally {
    server.close();
  }
});

test('double-slash paths should be normalized and not 404', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetchJson(`http://127.0.0.1:${port}//analytics/age-group-affected`, {
      headers: { Origin: 'https://violess-web.vercel.app' },
    });

    assert.notEqual(res.status, 404, `expected non-404 on normalized path, got ${res.status}: ${res.text}`);
  } finally {
    server.close();
  }
});
