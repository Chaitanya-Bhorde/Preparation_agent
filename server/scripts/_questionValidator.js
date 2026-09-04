/**
 * Question Validator — validates every question before insertion
 * Returns { valid: boolean, errors: string[] }
 */
function normalizeText(t) {
  return String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function validateQuestion(q) {
  const errors = [];
  // 1. Question text validation
  if (!q.questionText || !q.questionText.trim()) {
    errors.push("EMPTY_QUESTION");
  } else if (q.questionText.includes("undefined") || q.questionText.includes("NaN")) {
    errors.push("BROKEN_PLACEHOLDER");
  }
  // 2. Options validation
  if (!q.options || q.options.length !== 4) {
    errors.push("INVALID_OPTION_COUNT:" + (q.options ? q.options.length : 0));
  } else {
    // Check for empty options
    const emptyOpts = q.options.filter(o => !o.text || !o.text.trim());
    if (emptyOpts.length > 0) errors.push("MISSING_OPTION");
    // Check for duplicate options
    const optTexts = q.options.map(o => normalizeText(o.text));
    if (new Set(optTexts).size !== optTexts.length) errors.push("DUP_OPT");
    // Check correct answer count
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (correctCount === 0) errors.push("NO_CORRECT");
    if (correctCount > 1) errors.push("MULTIPLE_CORRECT");
  }
  // 3. Correct answer validation
  if (!q.correctAnswer || !"ABCD".includes(q.correctAnswer)) {
    errors.push("INVALID_CORRECT_ANSWER:" + q.correctAnswer);
  }
  // 4. Explanation validation
  if (!q.explanation || q.explanation.trim().length < 10) {
    errors.push("NO_EXPL");
  }
  // 5. Difficulty validation
  if (!q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty)) {
    errors.push("INVALID_DIFFICULTY:" + q.difficulty);
  }
  // 6. Topic validation
  if (!q.topic || !q.topic.trim()) errors.push("INVALID_TOPIC");
  return { valid: errors.length === 0, errors };
}

module.exports = { validateQuestion, normalizeText };
