/**
 * auth.resume.security.test.js
 * ---------------------------------------------------------------------------
 * Regression suite for the security and upload fixes found in the final audit.
 *
 * 1. PASSWORD RESET - the raw token must never appear in a response, and a
 *    known vs unknown address must be indistinguishable (no enumeration).
 * 2. RESUME UPLOAD  - the fileUrl the API returns must actually be served.
 * 3. UPLOAD VALIDATION - a disallowed MIME or an oversized file is a
 *    controlled 4xx, never a 500.
 *
 * Runs entirely against MongoMemoryServer - the application database is never
 * touched. The static mount mirrors server.js exactly.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const path = require('path');

// Jest does not load server/.env, and the auth cookie is built from
// COOKIE_EXPIRE. Without it `new Date(NaN)` produces a cookie the browser
// rejects, so the session never gets established. These mirror server/.env and
// are test-only values - no real secret is involved.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.COOKIE_EXPIRE = process.env.COOKIE_EXPIRE || '7';

// `utils/atsAnalyzer.js` requires pdfjs-dist at module load, and pdfjs-dist v4
// ships ESM only. Under Jest's CommonJS runtime that `require` throws before a
// single assertion runs, so ANY suite importing routes/ats fails to start.
//
// This stub only satisfies the import. It is never exercised by this suite:
// every upload here is `.txt` / an unsupported type, and the `.txt` branch of
// extractResumeText is a plain `buffer.toString('utf-8')` that does not touch
// pdfjs at all. The assertions below therefore still run the REAL controller,
// router, multer filter and fileUrl logic - only the PDF *decoder* is absent.
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => {
    throw new Error('pdfjs-dist is stubbed in tests; PDF decoding is not exercised here');
  }),
}));

const User = require('../models/User');
const authRouter = require('../routes/auth');
const atsRouter = require('../routes/ats');
const errorHandler = require('../middleware/errorHandler');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const STATIC_MOUNT = '/uploads';

let mongoServer;
let server;
let baseUrl;
let cookie;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(require('cookie-parser')());
  app.use(STATIC_MOUNT, express.static(UPLOADS_DIR, {
    index: false,
    dotfiles: 'deny',
    fallthrough: false,
    maxAge: '1h',
  }));
  app.use('/api/auth', authRouter);
  app.use('/api/ats', atsRouter);
  // Mounted so the malformed-id assertions exercise the REAL routes.
  app.use('/api/leaderboard', require('../routes/leaderboard'));
  app.use('/api/aptitude', require('../routes/aptitude'));
  app.use(errorHandler);
  return app;
};

const req = async (p, opts = {}) => {
  const res = await fetch(baseUrl + p, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, raw: text, headers: res.headers };
};

const json = (method, p, payload) =>
  req(p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(payload),
  });

const RESUME_TEXT = [
  'John Doe',
  'Email: john.doe@example.com | Phone: +91 98765 43210',
  'Location: Pune, India',
  '',
  'EXPERIENCE',
  'Software Engineer, Acme Technologies (2022 - Present)',
  '- Built REST APIs using Node.js and Express serving 1M requests per day.',
  '- Improved database query performance by 40 percent using MongoDB indexes.',
  '- Worked with Docker, Kubernetes and CI/CD pipelines.',
  '',
  'SKILLS',
  'JavaScript, React, Node.js, Express, MongoDB, MySQL, Python, Docker, Git',
  '',
  'EDUCATION',
  'B.Tech Computer Science, University of Pune, 2021, CGPA 8.4',
].join('\n');

const uploadForm = (field, filename, type, content) => {
  const fd = new FormData();
  fd.append(field, new Blob([content], { type }), filename);
  return req('/api/ats/analyze', { method: 'POST', headers: { cookie }, body: fd });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = buildApp().listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  const reg = await json('POST', '/api/auth/register', {
    name: 'Probe User',
    email: 'probe@example.com',
    password: 'secret123',
  });
  cookie = reg.headers.getSetCookie()[0].split(';')[0];
});

/* ===================================================== 1. PASSWORD RESET */

describe('POST /api/auth/forgotpassword', () => {
  it('never returns the raw reset token in the response', async () => {
    const res = await json('POST', '/api/auth/forgotpassword', { email: 'probe@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeUndefined();
    expect(res.body.resetUrl).toBeUndefined();
    expect(res.body.token).toBeUndefined();
    // The token is 32 random bytes hex-encoded. Assert no value of that shape
    // appears anywhere in the body, not merely under a known key.
    expect(res.raw).not.toMatch(/[0-9a-f]{64}/i);
  });

  it('stores a token with an expiry on the user document', async () => {
    await json('POST', '/api/auth/forgotpassword', { email: 'probe@example.com' });
    const user = await User.findOne({ email: 'probe@example.com' });
    expect(user.resetPasswordToken).toEqual(expect.any(String));
    expect(user.resetPasswordToken).toHaveLength(64);
    // Mongoose casts resetPasswordExpire to a Date, so compare epoch millis.
    expect(new Date(user.resetPasswordExpire).getTime()).toBeGreaterThan(Date.now());
  });

  it('does not leak whether an address has an account', async () => {
    const known = await json('POST', '/api/auth/forgotpassword', { email: 'probe@example.com' });
    const unknown = await json('POST', '/api/auth/forgotpassword', { email: 'nobody@nowhere.test' });
    expect(known.status).toBe(unknown.status);
    expect(known.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(unknown.body.message).not.toMatch(/no account|not found|does not exist/i);
  });

  it('issues no token for an unknown address', async () => {
    await json('POST', '/api/auth/forgotpassword', { email: 'nobody@nowhere.test' });
    expect(await User.findOne({ email: 'nobody@nowhere.test' })).toBeNull();
  });
});

describe('PUT /api/auth/resetpassword/:token', () => {
  /** Read the stored token straight from the DB - it is never in a response. */
  const issueAndReadToken = async (email = 'probe@example.com') => {
    await json('POST', '/api/auth/forgotpassword', { email });
    return (await User.findOne({ email })).resetPasswordToken;
  };

  it('resets with a valid token and clears it afterwards', async () => {
    const token = await issueAndReadToken();
    const res = await json('PUT', `/api/auth/resetpassword/${token}`, { password: 'brandnew99' });
    expect(res.status).toBe(200);

    // `password` is declared `select: false`, so it must be explicitly opted in
    // before matchPassword() can compare against the stored bcrypt hash.
    const user = await User.findOne({ email: 'probe@example.com' }).select('+password');
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpire).toBeUndefined();
    expect(await user.matchPassword('brandnew99')).toBe(true);
    expect(await user.matchPassword('secret123')).toBe(false);
  });

  it('rejects an invalid token', async () => {
    const res = await json('PUT', '/api/auth/resetpassword/deadbeefdeadbeef', { password: 'x1234567' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an expired token and leaves the password untouched', async () => {
    const token = await issueAndReadToken();
    await User.updateOne(
      { email: 'probe@example.com' },
      { $set: { resetPasswordExpire: Date.now() - 1000 } }
    );
    expect((await json('PUT', `/api/auth/resetpassword/${token}`, { password: 'x1234567' })).status).toBe(400);
    const user = await User.findOne({ email: 'probe@example.com' }).select('+password');
    expect(await user.matchPassword('secret123')).toBe(true);
  });

  it('cannot be replayed once used', async () => {
    const token = await issueAndReadToken();
    expect((await json('PUT', `/api/auth/resetpassword/${token}`, { password: 'first123' })).status).toBe(200);
    expect((await json('PUT', `/api/auth/resetpassword/${token}`, { password: 'second123' })).status).toBe(400);
  });
});

/* ================================================= 2. RESUME -> fileUrl */

describe('POST /api/ats/analyze - the returned fileUrl is reachable', () => {
  let fileUrl;

  beforeEach(async () => {
    const res = await uploadForm('resume', 'resume.txt', 'text/plain', RESUME_TEXT);
    expect(res.status).toBe(200);
    expect(res.body.data.total_score).toEqual(expect.any(Number));
    fileUrl = res.body.data.fileUrl;
  });

  it('returns a fileUrl under /uploads and it is served', async () => {
    expect(fileUrl).toEqual(expect.stringContaining(STATIC_MOUNT));
    const got = await req(fileUrl);
    // This was a 404 before server.js mounted the uploads directory.
    expect(got.status).toBe(200);
    expect(got.raw).toContain('John Doe');
  });

  it('serves the exact bytes that were uploaded', async () => {
    const got = await req(fileUrl);
    expect(got.raw.replace(/\r\n/g, '\n').trim()).toBe(RESUME_TEXT.trim());
  });

  it('persists the same reachable url on the user profile', async () => {
    const user = await User.findOne({ email: 'probe@example.com' });
    expect(user.profile.resumeUrl).toBe(fileUrl);
    expect((await req(user.profile.resumeUrl)).status).toBe(200);
  });

  it('does not allow traversal out of the uploads directory', async () => {
    for (const attempt of ['/uploads/../.env', '/uploads/..%2f.env', '/uploads/....//.env']) {
      expect((await req(attempt)).status).not.toBe(200);
    }
  });

  it('does not expose a directory listing', async () => {
    expect((await req('/uploads/')).status).not.toBe(200);
  });
});


/* ================================================ 3. UPLOAD VALIDATION */

describe('POST /api/ats/analyze - upload validation', () => {
  it('rejects a disallowed MIME type with 400, not 500', async () => {
    const res = await uploadForm('resume', 'bad.exe', 'application/x-msdownload', 'MZ\x90\x00');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unsupported file format/i);
  });

  it('rejects an oversized file with 413, not 500', async () => {
    const res = await uploadForm('resume', 'big.txt', 'text/plain', 'A'.repeat(6 * 1024 * 1024));
    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });

  it('never leaks a filesystem path in an upload error', async () => {
    const res = await uploadForm('resume', 'bad.exe', 'application/x-msdownload', 'MZ\x90\x00');
    expect(res.raw).not.toMatch(/[A-Za-z]:\\\\/);
    expect(res.raw).not.toMatch(/node_modules/);
  });

  it('still accepts the formats the project supports', async () => {
    // A PDF mime carrying text bytes passes the filter and then fails text
    // extraction (400), but it must never become a 500.
    const asPdf = await uploadForm('resume', 'r.pdf', 'application/pdf', RESUME_TEXT);
    expect([200, 400]).toContain(asPdf.status);
    expect(asPdf.status).not.toBe(500);

    const asTxt = await uploadForm('resume', 'r.txt', 'text/plain', RESUME_TEXT);
    expect(asTxt.status).toBe(200);
    expect(asTxt.body.data.total_score).toEqual(expect.any(Number));
  });

  it('returns 400 when no file is attached', async () => {
    const res = await req('/api/ats/analyze', {
      method: 'POST',
      headers: { cookie },
      body: new FormData(),
    });
    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const fd = new FormData();
    fd.append('resume', new Blob([RESUME_TEXT], { type: 'text/plain' }), 'r.txt');
    expect((await req('/api/ats/analyze', { method: 'POST', body: fd })).status).toBe(401);
  });
});

/* ============================== 4. MALFORMED PATH IDS ARE CLIENT ERRORS */

describe('malformed path ids answer 400, not 500', () => {
  it('GET /api/leaderboard/rank/:userId', async () => {
    const res = await req('/api/leaderboard/rank/abc');
    expect(res.status).toBe(400);
    expect(res.raw).not.toMatch(/Cast to ObjectId/);
  });

  it('GET /api/aptitude/questions/:topicId', async () => {
    const res = await req('/api/aptitude/questions/x');
    expect(res.status).toBe(400);
    expect(res.raw).not.toMatch(/Cast to ObjectId/);
  });
});
