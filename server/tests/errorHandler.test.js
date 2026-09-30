const http = require('http');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

class AppError extends Error {
  constructor(message, { statusCode, code, providerError } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode || 400;
    this.code = code;
    this.providerError = providerError;
  }
}

function makeServer() {
  const app = express();
  // Route that throws a raw internal error: no statusCode, leaky message.
  app.get('/internal', (req, res, next) => {
    next(new Error('connection to mongodb+srv://user:pass@cluster0.mongodb.internal failed, path C:\\secrets\\app.js'));
  });
  // Route that throws a curated app error with an explicit statusCode.
  app.get('/curated', (req, res, next) => {
    next(new AppError('AI provider is unreachable.', { statusCode: 502, providerError: 'ECONNRESET 10.0.0.5:443' }));
  });
  app.get('/bad-request', (req, res, next) => {
    next(new AppError('questionId is required', { statusCode: 400, code: 'VALIDATION' }));
  });
  app.get('/teapot', (req, res, next) => {
    const e = new Error('teapot');
    e.status = 418;
    next(e);
  });
  app.use(errorHandler);
  const server = http.createServer(app);
  return new Promise((resolve) =>
    server.listen(0, () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }))
  );
}

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, { agent: false }, (res) => { // no keep-alive: clean shutdown
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      })
      .on('error', reject);
  });
}

describe('Global error handler (P2 message-leak regression)', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  let server;
  let baseUrl;
  let logs;
  let spy;

  beforeAll(async () => {
    ({ server, baseUrl } = await makeServer());
  });

  afterAll(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  beforeEach(() => {
    logs = [];
    spy = jest.spyOn(console, 'error').mockImplementation((...a) => logs.push(a.join(' ')));
  });

  afterEach(() => spy.mockRestore());

  describe('production', () => {
    beforeEach(() => { process.env.NODE_ENV = 'production'; });

    it('sanitizes an internal error message and returns 500', async () => {
      const res = await get(`${baseUrl}/internal`);
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal Server Error');
    });

    it('leaks no database host, credential, driver or path detail', async () => {
      const res = await get(`${baseUrl}/internal`);
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('mongodb+srv');
      expect(serialized).not.toContain('cluster0');
      expect(serialized).not.toContain('user:pass');
      expect(serialized).not.toContain('C:\\secrets');
      expect(serialized).not.toMatch(/ECONN|ETIMEDOUT|MongoServerError/i);
    });

    it('never returns a stack trace in production', async () => {
      const res = await get(`${baseUrl}/internal`);
      expect(res.body).not.toHaveProperty('stack');
      expect(JSON.stringify(res.body)).not.toContain('at Object.');
    });

    it('still preserves curated application messages (4xx)', async () => {
      const res = await get(`${baseUrl}/bad-request`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('questionId is required');
    });

    it('still preserves curated 5xx app messages (AI provider)', async () => {
      const res = await get(`${baseUrl}/curated`);
      expect(res.status).toBe(502);
      expect(res.body.message).toBe('AI provider is unreachable.');
    });

    it('does not leak providerError even on curated errors', async () => {
      const res = await get(`${baseUrl}/curated`);
      expect(JSON.stringify(res.body)).not.toContain('ECONNRESET');
      expect(JSON.stringify(res.body)).not.toContain('10.0.0.5');
    });

    it('keeps non-standard client status codes correct', async () => {
      const res = await get(`${baseUrl}/teapot`);
      expect(res.status).toBe(418);
      expect(res.body.message).toBe('teapot');
    });

    it('logs the full internal detail server-side', async () => {
      await get(`${baseUrl}/internal`);
      expect(logs.length).toBeGreaterThan(0);
      const log = logs.join('\n');
      expect(log).toContain('mongodb+srv');
      expect(log).toContain('cluster0.mongodb.internal');
      expect(log).toMatch(/\n\s+at\s/);
    });
  });

  describe('development', () => {
    beforeEach(() => { process.env.NODE_ENV = 'development'; });

    it('keeps internal error messages useful', async () => {
      const res = await get(`${baseUrl}/internal`);
      expect(res.status).toBe(500);
      expect(res.body.message).toContain('mongodb+srv');
    });

    it('includes the stack in the body', async () => {
      const res = await get(`${baseUrl}/internal`);
      expect(res.body).toHaveProperty('stack');
      expect(res.body.stack).toMatch(/\n\s+at\s/);
    });

    it('keeps curated messages unchanged', async () => {
      const res = await get(`${baseUrl}/curated`);
      expect(res.body.message).toBe('AI provider is unreachable.');
    });
  });

  describe('test environment', () => {
    beforeEach(() => { process.env.NODE_ENV = 'test'; });

    it('behaves like development (no stack key, message retained)', async () => {
      const res = await get(`${baseUrl}/internal`);
      expect(res.status).toBe(500);
      expect(res.body.message).toContain('mongodb+srv');
      expect(res.body).not.toHaveProperty('stack');
    });
  });
});
