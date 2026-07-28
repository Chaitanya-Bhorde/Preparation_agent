const { extractResumeText } = require('../utils/atsAnalyzer');
const fs = require('fs');
const path = require('path');

const DEFAULT_PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');

const fileArg = process.argv.find(a => a.startsWith('--file='));
const filePath = fileArg ? fileArg.split('=')[1] : null;

(async () => {
  try {
    let pdf, filename;
    if (filePath) {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        console.error('File not found:', resolved);
        process.exit(1);
      }
      pdf = fs.readFileSync(resolved);
      filename = path.basename(resolved);
    } else {
      pdf = DEFAULT_PDF;
      filename = 'sample.pdf';
    }
    const text = await extractResumeText(pdf, 'application/pdf', filename);
    console.log('Extracted length:', text.length);
    console.log('First 300:', JSON.stringify(text.slice(0, 300)));
  } catch (error) {
    console.log('Extraction error:', error.message);
  }
  process.exit(0);
})();