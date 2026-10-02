'use strict';

/**
 * dsaBatch6ContentBacktracking.js
 * ---------------------------------------------------------------------------
 * Authored content for the Backtracking problems of batch 6.
 *
 * `cases` declare the INPUTS plus an `expect` that an INDEPENDENT oracle
 * (scripts/dsaBatch6Oracle.js) re-derives; dsa_batch6_build.js requires the
 * authored value, the oracle and the reference to all agree before any write.
 *
 * Only problems whose answer is UNIQUELY determined by the input appear here.
 * The other batch-6 selections are excluded on purpose and recorded in
 * scripts/dsaBatch6Contracts.js: design problems have no single expected value,
 * and the subset/permutation/combination families return every valid answer,
 * so a single stored expected output would reject correct solutions.
 *
 * Wording is original; nothing is copied from a third-party platform.
 * ---------------------------------------------------------------------------
 */

const lang = (name, params, returnType) => ({
  javascript: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  python: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  java: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
  cpp: { name, params: params.map(([n, t]) => ({ name: n, type: t })), returnType },
});

const CONTENT = {};

CONTENT["N-Queens II"] = {
  signature: lang("totalNQueens", [["n","number"]], "number"),
  description: "Place n queens on an n x n board so that no two of them attack each other, and return how many distinct placements exist. Queens attack along rows, columns and both diagonals, so exactly one queen sits in each row and column. Return the COUNT of valid placements, not the placements themselves.",
  input: "The parameter `n` is on the first line.",
  output: "Return the number of distinct valid ways to place n non-attacking queens.",
  constraints: ["1 <= n <= 9"],
  cases: [
    {"visible":true,"n":4,"expect":2},
    {"visible":true,"n":1,"expect":1},
    {"visible":true,"n":8,"expect":92},
    {"visible":false,"n":2,"expect":0},
    {"visible":false,"n":3,"expect":0},
    {"visible":false,"n":5,"expect":10},
    {"visible":false,"n":6,"expect":4},
    {"visible":false,"n":7,"expect":40},
    {"visible":false,"n":9,"expect":352},
  ],
  reference: "function totalNQueens(n) {\n  // One queen per row; the choice is the COLUMN for that row. Track the\n  // columns and the two diagonals already attacked by earlier queens.\n  const cols = new Set();\n  const diag1 = new Set();  // row + col\n  const diag2 = new Set();  // row - col\n  let count = 0;\n  const place = (row) => {\n    if (row === n) { count++; return; }\n    for (let col = 0; col < n; col++) {\n      if (cols.has(col) || diag1.has(row + col) || diag2.has(row - col)) continue;\n      cols.add(col); diag1.add(row + col); diag2.add(row - col);\n      place(row + 1);\n      cols.delete(col); diag1.delete(row + col); diag2.delete(row - col);\n    }\n  };\n  place(0);\n  return count;\n}",
};

CONTENT["Beautiful Arrangement"] = {
  signature: lang("beautifulArrangement", [["n","number"]], "number"),
  description: "You have n numbers 1..n and n positions. A placement is valid when, for every position i (1-based), the number placed there divides i OR i divides the number. Return the COUNT of valid permutations of 1..n.",
  input: "The parameter `n` is on the first line.",
  output: "Return the number of valid arrangements of 1..n.",
  constraints: ["1 <= n <= 15"],
  cases: [
    {"visible":true,"n":2,"expect":2},
    {"visible":true,"n":1,"expect":1},
    {"visible":true,"n":3,"expect":3},
    {"visible":true,"n":15,"expect":24679},
    {"visible":false,"n":4,"expect":8},
    {"visible":false,"n":5,"expect":10},
    {"visible":false,"n":6,"expect":36},
    {"visible":false,"n":7,"expect":41},
    {"visible":false,"n":8,"expect":132},
    {"visible":false,"n":10,"expect":700},
    {"visible":false,"n":12,"expect":4010},
  ],
  reference: "function beautifulArrangement(n) {\n  // Precompute which numbers may occupy each position, then count complete\n  // assignments by backtracking over positions.\n  const ok = [];\n  for (let i = 1; i <= n; i++) {\n    const set = new Set();\n    for (let v = 1; v <= n; v++) {\n      if (v % i === 0 || i % v === 0) set.add(v);\n    }\n    ok.push(set);\n  }\n  const used = new Array(n + 1).fill(false);\n  let count = 0;\n  const place = (pos) => {\n    if (pos > n) { count++; return; }\n    const allowed = ok[pos - 1];\n    for (const v of allowed) {\n      if (used[v]) continue;\n      used[v] = true;\n      place(pos + 1);\n      used[v] = false;\n    }\n  };\n  place(1);\n  return count;\n}",
};

CONTENT["Sudoku Solver"] = {
  signature: lang("solveSudoku", [["board","string[][]"]], "string[][]"),
  description: "Given a partially filled 9 x 9 Sudoku board where \".\" marks an empty cell and every row, column and 3 x 3 box already holds digits 1-9 without repetition, fill in the empty cells so that the board is complete. Return the solved board. The input is guaranteed to be a valid puzzle with a unique solution, so the answer is determined.",
  input: "The parameter `board` is on the first line, as 9 rows of 9 values.",
  output: "Return the completed 9x9 board as a grid of digit strings.",
  constraints: ["board is exactly 9 x 9","each cell is a digit 1-9 or \".\""],
  cases: [
// One empty cell whose only legal answer is 9. A solver whose candidate
    // digit range stops at 8 cannot fill it, so this is the case that separates
    // them. Kept HIDDEN on purpose: it is what the private suite must catch.
    {"visible":false,"board":[["5","3","4","6","7","8",".","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
// Uniquely-solvable puzzles (verified by a solution counter in
// _b6_gen_sudoku.js). Each has at least one cell whose answer is 9,
// which a solver capped at digits 1..8 cannot place.
    {"visible":false,"board":[[".","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5",".","4","8"],["1","9","8","3","4","2","5",".","7"],["8","5",".","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7",".","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
    {"visible":false,"board":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5",".","4","8"],["1",".","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7",".","1"],["7","1","3","9","2","4","8",".","6"],["9","6","1","5","3",".","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
    {"visible":false,"board":[["5","3","4",".","7","8","9","1","2"],["6","7","2","1",".","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5",".","7","6","1","4","2","3"],["4","2","6","8","5","3",".","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],[".","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
    {"visible":true,"board":[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
    {"visible":true,"board":[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","3","4","5","6","7","8","9","1"],["5","6","7","8","9","1","2","3","4"],["8","9","1","2","3","4","5","6","7"],["3","4","5","6","7","8","9","1","2"],["6","7","8","9","1","2","3","4","5"],["9","1","2","3","4","5","6","7","8"]],"expect":[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","3","4","5","6","7","8","9","1"],["5","6","7","8","9","1","2","3","4"],["8","9","1","2","3","4","5","6","7"],["3","4","5","6","7","8","9","1","2"],["6","7","8","9","1","2","3","4","5"],["9","1","2","3","4","5","6","7","8"]]},
    {"visible":true,"board":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","."]],"expect":[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]},
  ],
  reference: "function solveSudoku(board) {\n  // Backtracking over the empty cells, row by row. Each placement is\n  // checked against its row, its column and its 3x3 box.\n  const grid = board.map((row) => row.slice());\n  const canPlace = (r, c, v) => {\n    for (let i = 0; i < 9; i++) {\n      if (grid[r][i] === v) return false;\n      if (grid[i][c] === v) return false;\n    }\n    const br = 3 * Math.floor(r / 3);\n    const bc = 3 * Math.floor(c / 3);\n    for (let i = br; i < br + 3; i++) {\n      for (let j = bc; j < bc + 3; j++) {\n        if (grid[i][j] === v) return false;\n      }\n    }\n    return true;\n  };\n  const solve = () => {\n    for (let r = 0; r < 9; r++) {\n      for (let c = 0; c < 9; c++) {\n        if (grid[r][c] !== '.') continue;\n        for (let d = 1; d <= 9; d++) {\n          const v = String(d);\n          if (!canPlace(r, c, v)) continue;\n          grid[r][c] = v;\n          if (solve()) return true;\n          grid[r][c] = '.';\n        }\n        return false;\n      }\n    }\n    return true;\n  };\n  solve();\n  return grid;\n}",
};

module.exports = { CONTENT, lang };
