const fs = require('fs');
const path = process.argv[2];
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
let depth = 0, inStr = null, esc = false;
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  for (let j = 0; j < L.length; j++) {
    const c = L[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '/' && L[j + 1] === '/') break;
    if (c === '{' || c === '[' || c === '(') { depth++; stack.push({ c, line: i + 1 }); }
    else if (c === '}' || c === ']' || c === ')') {
      depth--;
      const top = stack.pop();
      if (!top || !matches(top.c, c)) {
        console.log(`MISMATCH at line ${i + 1}: closing '${c}' but open was`, top);
        process.exit(0);
      }
    }
  }
  if (inStr) { console.log(`UNCLOSED STRING starting line ${i + 1}`); inStr = null; }
}
console.log('final depth:', depth, 'unclosed:', stack.slice(0, 6));
function matches(open, close) {
  return (open === '{' && close === '}') || (open === '[' && close === ']') || (open === '(' && close === ')');
}
