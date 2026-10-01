/**
 * dsa_batch1_deep.js
 * READ-ONLY. Establishes whether the recovery artifacts hold real CONTENT
 * (statements / fixtures / expected outputs / solutions) for this batch, or
 * only bare catalog metadata such as {_id,title,slug,isActive}.
 *
 * This decides whether reconstruction is grounded in the repository or would be
 * invention, so it must report exactly what each artifact carries.
 */
'use strict';
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '_dsa_batch1_evidence.json'), 'utf8'));
const titles = evidence.batch.map((b) => b.title);

const ARTIFACTS = [
  '_b3_seedDSA100.js.backup',
  '_current_codingproblems_snapshot.json',
  '_incident_live_catalog.json',
  '_live_catalog.json',
  '_recovery_inventory.json',
  '_full_audit_report.json',
  'review_dsa_tree.json',
];

function keysMentioning(doc, needle, depth = 0) {
  const hits = [];
  if (depth > 6 || doc == null) return hits;
  if (Array.isArray(doc)) {
    for (const v of doc) hits.push(...keysMentioning(v, needle, depth + 1));
    return hits;
  }
  if (typeof doc !== 'object') return hits;
  for (const [k, v] of Object.entries(doc)) {
    if (typeof v === 'string' && v.toLowerCase().includes(needle.toLowerCase())) {
      hits.push({ key: k, sample: String(v).slice(0, 120) });
    } else {
      hits.push(...keysMentioning(v, needle, depth + 1));
    }
  }
  return hits;
}

for (const file of ARTIFACTS) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) { console.log(`\n### ${file}: MISSING`); continue; }
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (_) { console.log(`\n### ${file}: not JSON`); continue; }

  console.log(`\n### ${file}`);
  let anyContent = false;
  for (const t of titles) {
    const hits = keysMentioning(parsed, t);
    if (!hits.length) continue;
    // A hit is "content" only when it carries a statement/fixture/solution, not
    // merely an identifier.
    const meaningful = hits.filter((h) => h.sample.trim().length > 20);
    if (meaningful.length) {
      anyContent = true;
      console.log(`  "${t}" -> ${meaningful.length} substantive field(s)`);
      meaningful.slice(0, 3).forEach((h) => console.log(`      ${h.key}: ${h.sample}`));
    } else {
      const fields = [...new Set(hits.map((h) => h.key))].join(',');
      console.log(`  "${t}" -> identifier only (${fields})`);
    }
  }
  if (!anyContent) console.log('  => NO statement/fixture/solution content for this batch');
}