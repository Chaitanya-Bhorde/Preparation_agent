'use strict';

/**
 * dsaBatch5Content.js
 * ---------------------------------------------------------------------------
 * Aggregates the authored content for batch 5, grouped by topic so each module
 * stays reviewable. Every problem here was reconstructed from its title plus
 * the tag evidence in scripts/seedCodingProblemsExpanded.js; the six titles
 * whose contract could not be pinned down are listed in
 * scripts/dsaBatch5Contracts.js and deliberately absent here.
 *
 * Expected outputs are never hand-typed as the source of truth: each case
 * declares an `expect`, an INDEPENDENT oracle derives the answer
 * (scripts/dsaBatch5Oracle.js), and dsa_batch5_build.js requires all three -
 * authored, oracle and reference - to agree.
 * ---------------------------------------------------------------------------
 */

const graph = require('./dsaBatch5ContentGraph').CONTENT;
const search = require('./dsaBatch5ContentSearch').CONTENT;
const heap = require('./dsaBatch5ContentHeap').CONTENT;

module.exports = { graph, search, heap };