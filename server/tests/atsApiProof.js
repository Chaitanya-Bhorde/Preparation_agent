const http = require('http');
const fs = require('fs');
const path = require('path');

const samplePath = path.join(__dirname, 'sample_resume.pdf');
if (!fs.existsSync(samplePath)) {
  console.log('Missing sample_resume.pdf');
  process.exit(1);
}

const form = require('fs').readFileSync(samplePath);
const boundary = '----WebKitFormBoundary' + Date.now();
const body = [
  '--' + boundary,
  'Content-Disposition: form-data; name="resume"; filename="sample_resume.pdf"',
  'Content-Type: application/pdf',
  '',
  form.toString('binary'),
  '--' + boundary,
  'Content-Disposition: form-data; name="userId"',
  '',
  'test',
  '--' + boundary + '--',
  ''
].join('\r\n');

const options = {
  hostname: 'localhost',
  port: 50001,
  path: '/api/ats/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
    process.exit(0);
  });
});
req.on('error', err => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
req.write(body);
req.end();