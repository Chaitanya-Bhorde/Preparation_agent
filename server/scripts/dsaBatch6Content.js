'use strict';

/**
 * dsaBatch6Content.js
 * ---------------------------------------------------------------------------
 * Aggregates the authored content for batch 6, grouped by topic so each module
 * stays reviewable.
 *
 * Only problems whose expected output is UNIQUELY DETERMINED by the input are
 * authored here. The 29 batch-6 selections that cannot be activated are recorded
 * with their reasons in _dsa_batch6_decision.json (written by dsa_batch6_select.js)
 * and are deliberately absent.
 *
 * Expected outputs are never hand-typed as the source of truth: each case
 * declares an `expect`, an INDEPENDENT oracle derives the answer
 * (scripts/dsaBatch6Oracle.js), and dsa_batch6_build.js requires all three -
 * authored, oracle and reference - to agree before anything is written.
 * ---------------------------------------------------------------------------
 */

const hash = require('./dsaBatch6ContentHash').CONTENT;
const sort = require('./dsaBatch6ContentSort').CONTENT;
const greedy = require('./dsaBatch6ContentGreedy').CONTENT;
const backtracking = require('./dsaBatch6ContentBacktracking').CONTENT;

module.exports = { hash, sort, greedy, backtracking };