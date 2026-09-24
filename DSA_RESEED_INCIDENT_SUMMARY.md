# DSA Re-Seed Incident — Root Cause, Blast Radius, Recovery

**Incident ID:** INCIDENT-2026-09-24T15:04:58Z (20:34:58 IST)
**Status:** ✅ CLOSED — root cause fixed, data restored, behaviour re-verified identical to pre-incident
**Severity:** Critical (canonical DSA bank identity destroyed on Atlas production cluster `cluster0/prepagent`)

---

## 1. What happened

`server/scripts/seedCodingProblemsExpanded.js` ended with a **bare module-level call**:

```js
seedCodingProblems();          // ← executed on require(), not just on `node <file>`
```

and `seedCodingProblems()` starts with a destructive wipe:

```js
const seedCodingProblems = async () => {
  await CodingProblem.deleteMany({});      // scripts/seedCodingProblemsExpanded.js:438
  ...
```

So **merely `require()`-ing the file — which a read-only reconnaissance script did — executed a full
`deleteMany()` + `insertMany()` against the live Atlas collection.** No `NODE_ENV` check, no
`--force` flag, no confirmation.

### Hazard class (static audit of all 73 scripts)

`server/_audit_toplevel.js` → `server/_toplevel_audit.json` classifies every script by
"has `require.main === module` guard" × "has column-0 invocation". 15 scripts still have unguarded
top-level invocations; the three that are **required by other modules** were the live hazard and are
now guarded. Any future `require()` of `seedConceptNotes.js`, `seedSQLProblemsExpanded.js`,
`seedAptitudeQuestions.js`, `backfillCompanyTags.js`, … would re-trigger the same class of damage
without a guard (they are currently only ever run as entrypoints).

---

## 2. Blast radius (measured, read-only probes)

| Collection | Impact |
|---|---|
| `codingproblems` | **266 → 265 docs.** Every `_id` replaced (`6a830ac4…`×265 + `6a8849b5…`×1 → `6ab53c1a…`). Every `slug` regenerated with a `-{idx}` suffix → **slug-based routes broken**. `createdAt` reset to seed time. The 266th doc *"Maximum Subarray Sum"* was **deleted outright**. |
| `codesubmissions` | 137 docs / 56 distinct problem refs. Immediately after the incident **all 56 refs were dangling**. |
| `drafts` | 7 drafts referenced destroyed `codingproblems._id`s. |
| `submissions` (legacy) | 50 references to destroyed `codingproblems._id`s. |
| `userachievements` (10), `leaderboards` (6), `users` revision queues (82) | 0 old-id hits. |
| `practicehistories`, `mistakes` | Collections empty / absent — no impact. |

---

## 3. Root-cause fix (source)

Minimal 3-hunk diff, direct execution preserved (`node scripts/<seeder>.js` still seeds):

| File | Change |
|---|---|
| `server/scripts/seedCodingProblemsExpanded.js:561` | `if (require.main === module) { seedCodingProblems(); }` |
| `server/scripts/seedCodingProblems.js:739` | `if (require.main === module) { seedCodingProblems(); }` |
| `server/scripts/applyCuratedFixes.js:83` | `if (require.main === module) { run()… }` |

Verify with `git diff -- server/scripts/seedCodingProblemsExpanded.js server/scripts/seedCodingProblems.js server/scripts/applyCuratedFixes.js`
— only the tail invocation changed in each file.

---

## 4. Data recovery

`server/_restore_dsa_incident.js` (dry-run by default, `--apply` to write) rebuilt the collection from
four on-disk sources, so the whole operation is reproducible:

* `_incident_old_map.json` — the 266 pre-incident `{_id, title, slug, isActive}` pairs (parsed from
  session artifacts before the wipe).
* `_incident_live_catalog.json` — pre-incident per-problem `{problemId, samples, hidden, ref, starter}`.
* `_incident_postseed_snapshot.json` — full doc bodies (the same deterministic generator output, so
  content is regenerable).
* `_sql_dsa_inventory.json` — pre-incident inventory used as the parity oracle.
* `scripts/testAdminCreate.js` — the original creation payload for the 266th doc.

**Gate before writing:** per-doc parity of `sampleTests.length`, `hiddenTests.length`, `hasRef`,
`isActive` against the pre-incident inventory → **0 diffs in all four dimensions**; 0 missing;
0 unmatched; 0 `problemId` mismatches; 266 docs built → verdict `READY`.

**Result** (`_restore_result.json`): 266 docs, eras `6a830ac4`×265 + `6a8849b5`×1, suffixed slugs
**0**, `two-sum` → `CP-0001-EASY`, `createdAt` 2026-08-17.

**Metadata:** `scripts/migrateMetadata.js` (Phase 4.1.3, idempotent) re-derived `inputFormat` /
`outputFormat`, since the incident-era bodies lacked them → **266/266 present**, re-runs are no-ops.

---

## 5. Verification (all read-only, against live Atlas)

| Check | Pre-incident | Post-restore |
|---|---|---|
| `full_audit.js` — DSA | 266 audited / 40 passed / 226 failed / 6 review | **identical** |
| `full_audit.js` — SQL | 49 / 49 / 0 | **identical** |
| DSA failure-title symmetric difference | — | **0** (empty both directions) |
| `verify_execution.js` | 19/19 checks passed | **19/19 passed** |
| `_incident_guard_regression.js` | — | **PASS** — requiring all 3 seeders + 2 content modules leaves the collection fingerprint SHA-256 byte-identical |
| `_metadata_check.js` | — | 266/266 `inputFormat` + `outputFormat`; 0 docs missing `functionSignature.javascript.params` |

Artifacts: `_probe_postrestore.txt`, `_full_audit_report_postRestore.json`,
`_full_audit_report_preSeedIncident.json` (baseline), `_verify_postrestore.txt`,
`_incident_guard_regression.json`, `_metadata_check.txt`, `_incident_xref_probe.json`.

**Dangling rows that remain are NOT incident-caused:** the 23 orphaned `codesubmissions` and 3
`drafts` reference **legacy `problems`** `_id`s (`6a67333d…`, `6a788777…`), never `codingproblems`
ids — they predate the canonical-bank migration (8 users).

---

## 6. Still open (pre-existing backlog, not incident damage)

1. **DSA content authoring gap** — 226/266 docs fail the bank audit: 225 have no authored
   `sampleTests`, 214 carry placeholder / "not yet reviewed" descriptions and the generic
   `solve(input: string)` shell signature. The curated subset (~40 docs) is complete. This is a
   *content authoring* gap; the execution pipeline itself is sound (proven by `verify_execution.js`
   19/19 and `_selftest_placeholders.js`). Same shape as the SQL gap that was closed by migrating
   authored `referenceSolutionSQL` into fixtures.
2. **Legacy dangling history** — 23 `codesubmissions` + 3 `drafts` pointing at the retired `problems`
   collection (8 users). Needs a deliberate data decision (re-map or archive).
3. **Duplicate index declarations** — `models/CodingProblem.js` declares `unique: true` on `title`
   (:48) and `problemId` (:41) **and** re-declares the same keys via `CodingProblemSchema.index()`
   (:138, :140). Mongoose warns on every boot. Live reality: `title_1` is unique, `problemId_1` is
   **not** unique although the schema says it must be — a latent integrity gap.
   Safe remediation requires a deliberate index migration (drop `problemId_1`, recreate unique)
   because `autoIndex` would otherwise hit an `IndexOptionsConflict` on boot. **Not changed
   silently.**

---

## 7. Prevention checklist

* Never `require()` a `scripts/*` seeder for inspection — run read-only probes instead
  (`_incident_probe.js`, `_metadata_check.js`).
* Any new `scripts/*.js` with a column-0 invocation must carry
  `if (require.main === module) { … }` (`_audit_toplevel.js` reports violations).
* Seeders are destructive by design (`deleteMany({})`); they must never be reachable from a request
  path, a test bootstrap, or another module's import graph.
* Keep `_incident_old_map.json`, `_incident_live_catalog.json`, `_incident_postseed_snapshot.json`
  and `_sql_dsa_inventory.json`: they are the restore sources for this incident.

