'use strict';
/**
 * Report brace/paren depth per line so an unbalanced block can be located.
 * Naive scanner: strips line comments, block comments, and string/template
 * literals before counting. Good enough to find a missing "};" terminator.
 * Usage: node scripts/brace_depth.js <file>
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/brace_depth.js <file>');
  process.exit(2);
}

const src = fs.readFileSync(file, 'utf8');
const lines = src.split(/\r?\n/);

let inBlockComment = false;
let depth = 0;
const rows = [];

lines.forEach((rawLine, idx) => {
  const lineNo = idx + 1;
  let code = '';
  for (let i = 0; i < rawLine.length; i += 1) {
    const ch = rawLine[i];
    const next = rawLine[i + 1];
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i += 1; }
      continue;
    }
    if (ch === '/' && next === '*') { inBlockComment = true; i += 1; continue; }
    if (ch === '/' && next === '/') break;
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < rawLine.length) {
        if (rawLine[i] === '\\') { i += 2; continue; }
        if (rawLine[i] === quote) break;
        i += 1;
      }
      continue;
    }
    code += ch;
  }

  const openCurly = (code.match(/\{/g) || []).length;
  const closeCurly = (code.match(/\}/g) || []).length;
  const openParen = (code.match(/\(/g) || []).length;
  const closeParen = (code.match(/\)/g) || []).length;
  const depthAtStart = depth;
  depth += openCurly - closeCurly;

  if (/^\s*exports\./.test(code) || /^\s*function\s+\w+/.test(code)) {
    rows.push(`line ${lineNo} depthAtStart=${depthAtStart} depthAfter=${depth} :: ${code.trim().slice(0, 70)}`);
  }
  if (openParen !== closeParen) {
    rows.push(`line ${lineNo} PAREN_IMBALANCE open=${openParen} close=${closeParen} :: ${code.trim().slice(0, 70)}`);
  }
});

console.log(`FINAL_CURLY_DEPTH=${depth}`);
console.log(`TOTAL_LINES=${lines.length}`);
console.log('--- declarations ---');
console.log(rows.join('\n'));
