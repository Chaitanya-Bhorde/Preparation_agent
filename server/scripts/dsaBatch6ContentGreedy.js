'use strict';

/**
 * dsaBatch6ContentGreedy.js
 * ---------------------------------------------------------------------------
 * Authored content for the Greedy problems of batch 6.
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

CONTENT["Jump Game Greedy"] = {
  signature: lang("canJump", [["nums","number[]"]], "boolean"),
  description: "You start at index 0 of `nums`. From index i you may jump forward to any index j with i < j <= i + nums[i]. Decide whether the last index can be reached. Return true when it can, and false when it cannot.",
  input: "The parameter `nums` is on the first line.",
  output: "Return true when the last index of nums is reachable, otherwise false.",
  constraints: ["1 <= nums.length <= 100000","0 <= nums[i] <= 100000"],
  cases: [
    {"visible":true,"nums":[2,3,1,1,4],"expect":true},
    {"visible":true,"nums":[3,2,1,0,4],"expect":false},
    {"visible":true,"nums":[0],"expect":true},
    {"visible":true,"nums":[0,1],"expect":false},
    {"visible":true,"nums":[2,3,0,0,4],"expect":true},
    {"visible":false,"nums":[0,1],"expect":false},
    {"visible":false,"nums":[0,0],"expect":false},
    {"visible":false,"nums":[1,0],"expect":true},
    {"visible":false,"nums":[2,0,0],"expect":true},
    {"visible":false,"nums":[1,0,1],"expect":false},
    {"visible":false,"nums":[1,1,1,1],"expect":true},
    {"visible":false,"nums":[5,1,1,1],"expect":true},
    {"visible":false,"nums":[4],"expect":true},
    {"visible":false,"nums":[1,0,0,4],"expect":false},
    {"visible":false,"nums":[2,0,0],"expect":true},
    {"visible":false,"nums":[2,3,0,0,4],"expect":true},
  ],
  reference: "function canJump(nums) {\n  // `reach` is the furthest index reachable so far. Scanning left to\n  // right, any position at or before it can serve as a launch point.\n  let reach = 0;\n  for (let i = 0; i < nums.length; i++) {\n    if (i > reach) return false;\n    if (i + nums[i] > reach) reach = i + nums[i];\n    if (reach >= nums.length - 1) return true;\n  }\n  return reach >= nums.length - 1;\n}",
};

CONTENT["Jump Game II Greedy"] = {
  signature: lang("minJumps", [["nums","number[]"]], "number"),
  description: "You start at index 0 of `nums`. From index i you may jump forward to any index j with i < j <= i + nums[i]. Return the SMALLEST number of jumps needed to reach the last index, or -1 when it cannot be reached.",
  input: "The parameter `nums` is on the first line.",
  output: "Return the minimum number of jumps to the last index, or -1 when unreachable.",
  constraints: ["1 <= nums.length <= 100000","0 <= nums[i] <= 100000"],
  cases: [
    {"visible":true,"nums":[2,3,1,1,4],"expect":2},
    {"visible":true,"nums":[2,3,0,1,4],"expect":2},
    {"visible":true,"nums":[3,2,1,0,4],"expect":-1},
    {"visible":true,"nums":[0],"expect":0},
    {"visible":false,"nums":[1],"expect":0},
    {"visible":false,"nums":[0,1],"expect":-1},
    {"visible":false,"nums":[0,0],"expect":-1},
    {"visible":false,"nums":[1,1],"expect":1},
    {"visible":false,"nums":[5],"expect":0},
    {"visible":false,"nums":[2,0,0],"expect":1},
    {"visible":false,"nums":[1,1,1,1],"expect":3},
    {"visible":false,"nums":[2,3,4,1,1,4],"expect":2},
    {"visible":false,"nums":[1,0,1],"expect":-1},
    {"visible":false,"nums":[2,0,0,0,1],"expect":-1},
  ],
  reference: "function minJumps(nums) {\n  let jumps = 0;\n  // `reach` is the furthest index covered by the jumps taken so far;\n  // `end` is the furthest index those same jumps can land on.\n  let reach = 0;\n  let end = 0;\n  for (let i = 0; i < nums.length; i++) {\n    if (i > reach) return -1;\n    const next = i + nums[i];\n    if (next > reach) reach = next;\n    // Everything up to `end` costs exactly `jumps` jumps, so once we pass\n    // it the next jump has been earned.\n    if (i === end && i < nums.length - 1) {\n      jumps++;\n      end = reach;\n    }\n  }\n  return jumps;\n}",
};

CONTENT["Candy Greedy"] = {
  signature: lang("candy", [["ratings","number[]"]], "number"),
  description: "Every child has a rating. Each child must receive at least one candy, and the child with the higher of any two neighbouring ratings must receive strictly more candies than the lower one. Return the FEWEST candies that satisfy both rules.",
  input: "The parameter `ratings` is on the first line.",
  output: "Return the minimum total number of candies needed.",
  constraints: ["1 <= ratings.length <= 200000","0 <= ratings[i] <= 2000"],
  cases: [
    {"visible":true,"ratings":[1,0,2],"expect":5},
    {"visible":true,"ratings":[1,2,2],"expect":4},
    {"visible":true,"ratings":[5],"expect":1},
    {"visible":false,"ratings":[1,2,3],"expect":6},
    {"visible":false,"ratings":[3,2,1],"expect":6},
    {"visible":false,"ratings":[1,3,2],"expect":4},
    {"visible":false,"ratings":[1,3,2,2,1],"expect":7},
    {"visible":false,"ratings":[2,2],"expect":2},
    {"visible":false,"ratings":[2,2,2],"expect":3},
    {"visible":false,"ratings":[1,2,2,3],"expect":6},
    {"visible":false,"ratings":[1,1,1,2,3],"expect":8},
    {"visible":false,"ratings":[0],"expect":1},
    {"visible":false,"ratings":[1,0],"expect":3},
    {"visible":false,"ratings":[3,2,1,2,3],"expect":11},
  ],
  reference: "function candy(ratings) {\n  const n = ratings.length;\n  const out = new Array(n).fill(1);\n  // Left-to-right: satisfy the constraint against the left neighbour.\n  for (let i = 1; i < n; i++) {\n    if (ratings[i] > ratings[i - 1]) out[i] = out[i - 1] + 1;\n  }\n  // Right-to-left: satisfy the constraint against the right neighbour,\n  // without ever lowering a count the first pass already needed.\n  for (let i = n - 2; i >= 0; i--) {\n    if (ratings[i] > ratings[i + 1] && out[i] <= out[i + 1]) {\n      out[i] = out[i + 1] + 1;\n    }\n  }\n  let total = 0;\n  for (const c of out) total += c;\n  return total;\n}",
};

CONTENT["Best Time to Buy Sell Stock II"] = {
  signature: lang("maxProfit", [["prices","number[]"]], "number"),
  description: "Prices of an asset are given for consecutive days. You may buy and then sell on any number of later days, holding at most one unit at a time, and you may not trade on the same day. Return the maximum total profit achievable, which is 0 when no profitable trade exists.",
  input: "The parameter `prices` is on the first line.",
  output: "Return the maximum profit obtainable from an unlimited number of trades.",
  constraints: ["1 <= prices.length <= 50000","0 <= prices[i] <= 10^4"],
  cases: [
    {"visible":true,"prices":[7,1,5,3,6,4],"expect":7},
    {"visible":true,"prices":[7,6,4,3,1],"expect":0},
    {"visible":true,"prices":[1,2,3,4,5],"expect":4},
    {"visible":true,"prices":[5],"expect":0},
    {"visible":false,"prices":[],"expect":0},
    {"visible":false,"prices":[5,4,3],"expect":0},
    {"visible":false,"prices":[3,3,3],"expect":0},
    {"visible":false,"prices":[2,2],"expect":0},
    {"visible":false,"prices":[1,2],"expect":1},
    {"visible":false,"prices":[2,1],"expect":0},
    {"visible":false,"prices":[1,4,2,6],"expect":7},
    {"visible":false,"prices":[1,2,1,2],"expect":2},
    {"visible":false,"prices":[3,3,5,1,2],"expect":3},
    {"visible":false,"prices":[1,1,4,1,1],"expect":3},
  ],
  reference: "function maxProfit(prices) {\n  // With unlimited trades the optimum is exactly the sum of every rise:\n  // each upward step can be captured independently.\n  let profit = 0;\n  for (let i = 1; i < prices.length; i++) {\n    const gain = prices[i] - prices[i - 1];\n    if (gain > 0) profit += gain;\n  }\n  return profit;\n}",
};

module.exports = { CONTENT, lang };
