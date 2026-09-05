/**
 * AI Mock Interview — integrity tests.
 *
 * These tests cover the pure-logic layers without needing MongoDB or the AI
 * provider: fields config, duplicate detection, JSON extraction, fallback
 * bank, evaluator guards, question validation, difficulty adaptation, and
 * deterministic report aggregation.
 */

const fields = require('../config/interviewFields');
const similarity = require('../services/interview/similarity');
const { extractJsonObject } = require('../services/interview/aiClient');
const fallbackBank = require('../services/interview/fallbackBank');
const { clampScore, evaluateAnswer, MIN_ANSWER_LENGTH } = require('../services/interview/evaluator');
const {
  resolveDifficulty,
  adaptDifficulty,
  validateGeneratedQuestion,
} = require('../services/interview/questionGenerator');
const { generateReport } = require('../services/interview/reportGenerator');

describe('interview fields config', () => {
  test('exposes at least 50 selectable fields across 5 categories', () => {
    expect(fields.FIELDS.length).toBeGreaterThanOrEqual(50);
    expect(fields.CATEGORIES.length).toBe(5);
    const grouped = fields.getFields();
    expect(grouped.reduce((n, c) => n + c.fields.length, 0)).toBe(fields.FIELDS.length);
  });

  test('contains every required field label', () => {
    const labels = fields.getFieldLabels();
    for (const required of [
      'C', 'C++', 'Java', 'Python', 'JavaScript',
      'Core Java', 'Advanced Java', 'Java OOP', 'Java Collections', 'Java Multithreading',
      'Java Exception Handling', 'Java Streams', 'Java Generics',
      'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'HashMap / Hashing',
      'Sliding Window', 'Two Pointers', 'Binary Search', 'Recursion', 'Backtracking',
      'Trees', 'Binary Search Tree', 'Heap / Priority Queue', 'Graphs', 'Greedy',
      'Dynamic Programming', 'Sorting', 'Searching',
      'DBMS', 'SQL', 'Operating Systems', 'Computer Networks', 'OOP',
      'System Design Basics', 'Software Engineering', 'REST APIs',
      'HTML', 'CSS', 'React', 'Node.js', 'Express.js', 'MongoDB',
      'Git / GitHub', 'Docker', 'AWS / Cloud Basics',
    ]) {
      expect(labels).toContain(required);
    }
  });

  test('validateTopics accepts valid topics case-insensitively via aliases', () => {
    const { valid, canonical } = fields.validateTopics(['java', 'DBMS', 'SQL', 'OOP', 'Arrays', 'Strings']);
    expect(valid).toBe(true);
    expect(canonical.map((c) => c.id)).toEqual(['java', 'dbms', 'sql', 'oop', 'arrays', 'strings']);
    expect(fields.resolveField('reactjs').id).toBe('react');
  });

  test('validateTopics rejects invalid topics and dedupes', () => {
    const { valid, invalid, canonical } = fields.validateTopics(['Java', 'java', 'React Hooks']);
    expect(valid).toBe(false);
    expect(invalid).toEqual(['React Hooks']);
    expect(canonical).toHaveLength(1); // 'Java' + 'java' deduped
  });

  test('validateTopics rejects empty input', () => {
    expect(fields.validateTopics([]).valid).toBe(false);
    expect(fields.validateTopics('nonsense').valid).toBe(false);
  });
});

describe('duplicate question detection', () => {
  test('detects semantically equivalent questions', () => {
    expect(similarity.isDuplicateQuestion(
      'What is polymorphism?',
      ['Explain polymorphism in OOP.']
    )).toBe(true);
    expect(similarity.isDuplicateQuestion(
      'What is the difference between ArrayList and LinkedList?',
      ['Explain the difference between an ArrayList and a LinkedList.']
    )).toBe(true);
  });

  test('allows genuinely different questions in the same topic', () => {
    expect(similarity.isDuplicateQuestion(
      'What is polymorphism?',
      ['How does a HashMap handle collisions internally?']
    )).toBe(false);
    expect(similarity.isDuplicateQuestion(
      'What is a race condition?',
      ['What is deadlock and how can it be avoided?']
    )).toBe(false);
  });

  test('handles empty inputs safely', () => {
    expect(similarity.isDuplicateQuestion('', ['anything'])).toBe(false);
    expect(similarity.isDuplicateQuestion('question', [])).toBe(false);
  });
});

describe('AI response JSON extraction', () => {
  test('parses clean JSON', () => {
    expect(extractJsonObject('{"question":"hi"}')).toEqual({ question: 'hi' });
  });

  test('parses fenced markdown JSON', () => {
    const text = '```json\n{"a": 1, "b": {"c": 2}}\n```';
    expect(extractJsonObject(text)).toEqual({ a: 1, b: { c: 2 } });
  });

  test('parses JSON surrounded by prose', () => {
    const text = 'Sure! Here is the question: {"question":"What is a heap?"} Let me know.';
    expect(extractJsonObject(text)).toEqual({ question: 'What is a heap?' });
  });

  test('handles braces inside strings', () => {
    const text = '{"q":"use of { and } in code","n":1}';
    expect(extractJsonObject(text)).toEqual({ q: 'use of { and } in code', n: 1 });
  });

  test('returns null for malformed or empty payloads', () => {
    expect(extractJsonObject('no json here')).toBeNull();
    expect(extractJsonObject('{"broken": ')).toBeNull();
    expect(extractJsonObject('')).toBeNull();
    expect(extractJsonObject(null)).toBeNull();
  });
});

describe('fallback question bank', () => {
  test('covers every configured field id', () => {
    for (const field of fields.FIELDS) {
      const q = fallbackBank.getFallbackQuestion(field.id, 'easy', []);
      expect(q).toBeTruthy();
      expect(q.text.length).toBeGreaterThan(15);
      expect(fields.CORE_DIFFICULTIES).toContain(q.difficulty);
      expect(Array.isArray(q.expectedConcepts)).toBe(true);
    }
  });

  test('returns a question object with expected shape', () => {
    const q = fallbackBank.getFallbackQuestion('hashing', 'medium', []);
    expect(q).toHaveProperty('text');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('expectedAnswer');
  });
});

describe('evaluator guards', () => {
  test('clamps scores into 0-10', () => {
    expect(clampScore(15)).toBe(10);
    expect(clampScore(-3)).toBe(0);
    expect(clampScore('7.56')).toBe(7.6);
    expect(clampScore(NaN)).toBe(0);
  });

  test('short-circuits empty answers without an AI call', async () => {
    const empty = await evaluateAnswer({ question: 'Q?', topic: 'Java', answer: '   ' });
    expect(empty.overall).toBe(0);
    expect(empty.verdict).toBe('incorrect');
    expect(empty.followUpNeeded).toBe(false);
    expect(MIN_ANSWER_LENGTH).toBeGreaterThan(0);
  });

  test('very short answers also short-circuit', async () => {
    const tiny = await evaluateAnswer({ question: 'Q?', topic: 'Java', answer: 'a' });
    expect(tiny.overall).toBe(0);
  });
});

describe('question validation and difficulty adaptation', () => {
  const session = {
    topics: ['Java', 'DBMS'],
    difficulty: 'medium',
    experienceLevel: 'fresher',
  };

  test('rejects questions outside the selected topics (topic control)', () => {
    const err = validateGeneratedQuestion(
      { question: 'Explain React hooks rules.', topic: 'React', difficulty: 'easy', expectedConcepts: [] },
      session, [], []
    );
    expect(typeof err).toBe('string');
    expect(err).toMatch(/outside selected topics/);
  });

  test('rejects re-testing a concept already covered', () => {
    // Text similarity alone won't catch a re-worded concept question — the
    // askedConcepts overlap guard is the primary defense in that case.
    const err = validateGeneratedQuestion(
      { question: 'What is runtime polymorphism in Java?', topic: 'Java', difficulty: 'easy', expectedConcepts: ['polymorphism'] },
      session,
      ['Explain polymorphism in OOP.'],
      ['polymorphism']
    );
    expect(typeof err).toBe('string');
    expect(err).toMatch(/re-tests already-covered concepts/);
  });

  test('accepts a valid on-topic new question and normalizes fields', () => {
    const ok = validateGeneratedQuestion(
      {
        question: 'How does the JVM resolve method calls at runtime?',
        topic: 'java', // id instead of label — must normalize
        difficulty: 'HARD',
        type: 'weird-type',
        expectedConcepts: ['dynamic dispatch', 'vtable'],
        expectedAnswer: '...',
      },
      session, [], []
    );
    expect(typeof ok).toBe('object');
    expect(ok.topic).toBe('Java');
    expect(ok.difficulty).toBe('hard');
    expect(ok.type).toBe('conceptual'); // invalid type falls back
  });

  test('rejects invalid difficulty', () => {
    const err = validateGeneratedQuestion(
      { question: 'Valid question text here?', topic: 'Java', difficulty: 'impossible', expectedConcepts: [] },
      session, [], []
    );
    expect(err).toBe('invalid difficulty');
  });

  test('mixed difficulty cycles by performance', () => {
    const mixedSession = { ...session, difficulty: 'mixed' };
    expect(resolveDifficulty(mixedSession, [])).toBe('easy');
    expect(resolveDifficulty(mixedSession, [9, 9])).toBe('hard');
    expect(resolveDifficulty(mixedSession, [7, 7])).toBe('medium');
    expect(resolveDifficulty(mixedSession, [2, 3])).toBe('easy');
    expect(resolveDifficulty(session, [9, 9])).toBe('medium'); // fixed difficulty stays
  });

  test('adaptDifficulty pushes strong candidates up and weak ones down', () => {
    expect(adaptDifficulty('easy', [9, 9, 9])).toBe('medium');
    expect(adaptDifficulty('medium', [9, 9, 9])).toBe('hard');
    expect(adaptDifficulty('hard', [1, 2, 2])).toBe('medium');
    expect(adaptDifficulty('medium', [1, 2, 2])).toBe('easy');
    expect(adaptDifficulty('medium', [6, 6])).toBe('medium');
    expect(adaptDifficulty('easy', [7])).toBe('easy'); // too few samples
  });
});

describe('report aggregation', () => {
  test('aggregates deterministic topic/skill scores and falls back when AI fails', async () => {
    const session = { topics: ['Java', 'DBMS'], difficulty: 'medium', experienceLevel: 'fresher' };
    const answers = [
      {
        question: { text: 'Q1', topic: 'Java' },
        evaluation: {
          overall: 9, correctness: 9, technicalAccuracy: 9, completeness: 8, clarity: 9, depth: 8, communication: 9,
          missingConcepts: [],
        },
      },
      {
        question: { text: 'Q2', topic: 'DBMS' },
        evaluation: {
          overall: 5, correctness: 5, technicalAccuracy: 5, completeness: 5, clarity: 6, depth: 4, communication: 6,
          missingConcepts: ['indexes'],
        },
      },
    ];

    // AI call will fail (no API key in test env) → deterministic fallback used.
    const report = await generateReport(session, answers);
    expect(report.overallScore).toBe(70); // avg(9,5)=7 → 70/100
    expect(report.topicPerformance).toEqual([
      { topic: 'Java', averageScore: 9, questionsAsked: 1 },
      { topic: 'DBMS', averageScore: 5, questionsAsked: 1 },
    ]);
    expect(report.skills.technicalDepth).toBe(6); // avg(8,4)
    expect(report.generatedBy).toBe('deterministic-fallback');
    expect(report.assessment.length).toBeGreaterThan(20);
    expect(report.recommendedTopics.length).toBeGreaterThan(0);
  });

  test('handles zero answered questions without crashing', async () => {
    const report = await generateReport({ topics: ['Java'], difficulty: 'easy', experienceLevel: 'fresher' }, []);
    expect(report.overallScore).toBe(0);
    expect(report.topicPerformance).toEqual([]);
  });
});
