const fs = require('fs');
const f = 'server/config/swagger.js';
const lines = fs.readFileSync(f, 'utf8').split('\n');
let b = 0, p = 0, s = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (const c of l) {
    if (c === '{') b++;
    if (c === '}') b--;
    if (c === '[') p++;
    if (c === ']') p--;
    if (c === '(') s++;
    if (c === ')') s--;
  }
  if (b < 0 || p < 0 || s < 0) {
    console.log('Line ' + (i + 1) + ': brace=' + b + ' bracket=' + p + ' paren=' + s + ' | ' + l.trim());
    b = Math.max(b, 0);
    p = Math.max(p, 0);
    s = Math.max(s, 0);
  }
}
console.log('Final: brace=' + b + ' bracket=' + p + ' paren=' + s);
