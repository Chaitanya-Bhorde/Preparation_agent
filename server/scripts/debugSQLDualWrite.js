const http = require('http');
const BASE = 'http://localhost:5000';

function req(path, options = {}, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const payload = body ? JSON.stringify(body) : null;
    options = {
      ...options,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(options.headers || {}),
      },
    };
    const r = http.request(url, options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, data: parsed, raw });
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

(async () => {
  // Login
  const login = await req('/api/auth/login', {}, { email: 'test@example.com', password: 'test1234' });
  console.log('LOGIN STATUS', login.status);
  console.log('LOGIN DATA', JSON.stringify(login.data, null, 2));
  if (!login.data?.success) return;

  const token = login.data.token;

  // Get a SQL problem
  const problems = await req('/api/sql/problems?limit=1', { headers: { Authorization: `Bearer ${token}` } });
  console.log('PROBLEMS STATUS', problems.status);
  if (!problems.data?.success) {
    console.log('NO PROBLEMS');
    return;
  }
  const problem = problems.data.data[0];
  console.log('USING PROBLEM', problem._id, problem.title);

  // Submit SQL
  const submit = await req(
    '/api/sql/submit',
    { headers: { Authorization: `Bearer ${token}` } },
    { problemId: String(problem._id), query: 'SELECT * FROM users;' }
  );
  console.log('SUBMIT STATUS', submit.status);
  console.log('SUBMIT DATA', JSON.stringify(submit.data, null, 2));
  if (submit.status !== 201 && submit.status !== 200) {
    console.log('SUBMIT RAW', submit.raw);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});