const express = require('express');
const router = express.Router();
const CodingProblem = require('../models/CodingProblem');
const { protect } = require('../middleware/auth');
const axios = require('axios');

const DSA_PROMPT_TEMPLATE = (topic, difficulty, weakTags) => `You are a coding problem generator for a placement-prep platform. Generate ONE original DSA problem.
Topic: ${topic}
Difficulty: ${difficulty}
User Weak Tags: ${weakTags}

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no preamble:
{
  "title": "string",
  "difficulty": "${difficulty}",
  "topic_tags": ["string"],
  "problem_statement": "string with clear constraints embedded",
  "constraints": ["string"],
  "visible_examples": [
    { "input": "string", "output": "string", "explanation": "plain language reasoning" }
  ],
  "starter_code": {
    "javascript": "function signature only, no logic",
    "python": "function signature only, no logic",
    "java": "function signature only, no logic",
    "cpp": "function signature only, no logic"
  },
  "function_signature": {
    "javascript": { "name": "string", "params": [{ "name": "string", "type": "string" }], "returnType": "string" },
    "python": { "name": "string", "params": [{ "name": "string", "type": "string" }], "returnType": "string" },
    "java": { "name": "string", "params": [{ "name": "string", "type": "string" }], "returnType": "string" },
    "cpp": { "name": "string", "params": [{ "name": "string", "type": "string" }], "returnType": "string" }
  },
  "hidden_test_cases": [
    { "input": "string", "expected_output": "string", "category": "string" }
  ],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "optimal_time_complexity": "string",
  "optimal_space_complexity": "string",
  "common_wrong_approaches": ["string"]
}

CRITICAL RULES:
- hidden_test_cases must have MINIMUM 12 entries
- Cover edge cases: smallest/largest input, single element, duplicates, cycles, disconnected graph, etc.
- Do NOT include actual test case generation instructions in output
- starter_code and function_signature must be Judge0-compatible for all 4 languages
`;

const validateProblemSchema = (problem) => {
  const requiredFields = ['title', 'difficulty', 'topic_tags', 'problem_statement', 'constraints', 'visible_examples', 'starter_code', 'function_signature', 'hidden_test_cases', 'hints', 'optimal_time_complexity', 'optimal_space_complexity', 'common_wrong_approaches'];
  for (const field of requiredFields) {
    if (!problem[field]) return { valid: false, missing: field };
  }
  if (!Array.isArray(problem.hidden_test_cases) || problem.hidden_test_cases.length < 12) {
    return { valid: false, missing: 'hidden_test_cases must be an array with at least 12 entries' };
  }
  const requiredLangs = ['javascript', 'python', 'java', 'cpp'];
  for (const lang of requiredLangs) {
    if (typeof problem.starter_code[lang] !== 'string' || typeof problem.function_signature[lang] !== 'object') {
      return { valid: false, missing: `missing ${lang} in starter_code/function_signature` };
    }
  }
  return { valid: true };
};

const callLLM = async (prompt, retryCount = 1) => {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  if (!groqApiKey) {
    const fs = require('fs');
    const path = require('path');
    const fallbackPath = path.join(__dirname, '../../generated_problem.json');
    if (fs.existsSync(fallbackPath)) {
      console.warn('[DSA] GROQ_API_KEY/LLM_API_KEY not configured; using local fallback problem from generated_problem.json. This fallback is for development/testing only.');
      const fallback = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      return { problem: fallback, usedFallback: true };
    }
    throw new Error('No LLM configured and no fallback problem found');
  }

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const content = response.data.choices[0].message.content;
    let problem;
    try {
      problem = JSON.parse(content);
    } catch (e) {
      if (retryCount > 0) {
        const retryPrompt = `${prompt}\n\nYour previous response was missing required fields or was invalid JSON. Ensure ALL fields in the schema are present and return ONLY valid JSON.`;
        return callLLM(retryPrompt, retryCount - 1);
      }
      throw new Error('Failed to parse LLM response as JSON after retry');
    }

    const validation = validateProblemSchema(problem);
    if (!validation.valid && retryCount > 0) {
      const retryPrompt = `${prompt}\n\nYour previous response was missing required fields: ${validation.missing}. Ensure ALL fields in the schema are present and return ONLY valid JSON.`;
      return callLLM(retryPrompt, retryCount - 1);
    }

    // Additional sanity checks for test case inputs
    if (Array.isArray(problem.hidden_test_cases)) {
      for (const tc of problem.hidden_test_cases) {
        if (typeof tc.input === 'string' && tc.input.includes('...')) {
          throw new Error('Generated problem contains truncated test case input with "..." ellipsis, which is invalid.');
        }
      }
    }

    return { problem, usedFallback: false };
  } catch (error) {
    if (retryCount > 0) {
      const retryPrompt = `${prompt}\n\nYour previous response failed with error: ${error.message}. Ensure ALL fields in the schema are present and return ONLY valid JSON.`;
      return callLLM(retryPrompt, retryCount - 1);
    }
    throw error;
  }
};

router.post('/generate', protect, async (req, res) => {
  try {
    const { topic, difficulty, weak_tags } = req.body;
    if (!topic || !difficulty || !weak_tags) {
      return res.status(400).json({ success: false, message: 'Please provide topic, difficulty, and weak_tags' });
    }

    const prompt = DSA_PROMPT_TEMPLATE(topic, difficulty, weak_tags);
    let { problem, usedFallback } = await callLLM(prompt);

    if (usedFallback) {
      console.log('Used fallback generated problem (no LLM configured)');
    }

    problem.difficulty = problem.difficulty.toLowerCase();

    const codingProblem = new CodingProblem({
      title: problem.title,
      description: problem.problem_statement,
      difficulty: problem.difficulty,
      topic: problem.topic_tags?.[0] || topic,
      tags: problem.topic_tags,
      constraints: problem.constraints,
      examples: problem.visible_examples,
      visibleTestCases: problem.visible_examples.map(ex => ({
        input: ex.input,
        expectedOutput: ex.output,
        explanation: ex.explanation,
      })),
      hiddenTestCases: problem.hidden_test_cases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expected_output,
        category: tc.category || 'general',
      })),
      starterCode: problem.starter_code,
      functionSignature: problem.function_signature,
    });

    await codingProblem.save();

    // Return problem WITHOUT hidden_test_cases
    const responseProblem = codingProblem.toObject();
    delete responseProblem.hiddenTestCases;
    delete responseProblem.__v;
    delete responseProblem._id;
    delete responseProblem.createdAt;
    delete responseProblem.updatedAt;

    res.status(201).json({ success: true, data: responseProblem });
  } catch (error) {
    console.error('Error generating DSA problem:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;