const path = require('path');
try {
  const codegen = require(path.join(__dirname, '..', 'server', 'utils', 'codeGenerator.js'));
  console.log('codeGenerator loaded OK');
  console.log('exports:', Object.keys(codegen));
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
}