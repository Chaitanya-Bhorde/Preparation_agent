/**
 * AI Mock Interview - behavioral tests.
 * Verifies dynamic question generation, contextual follow-ups,
 * adaptive difficulty, state machine, error handling, and security.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mockAiClient = {
  callJson: jest.fn(),
  AiServiceError: class extends Error {
    constructor(message, opts = {}) {
      super(message);
      this.statusCode = opts.statusCode || 502;
      this.providerError = opts.providerError;
    }
  },
};

jest.mock('../services/interview/aiClient', () => mockAiClient);

const sessionService = require('../services/interview/sessionService');
const InterviewSession = require('../models/InterviewSession');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewAnswer = require('../models/InterviewAnswer');

const TEST_USER = { id: new mongoose.Types.ObjectId().toString(), role: 'user' };
const OTHER_USER = { id: new mongoose.Types.ObjectId().toString(), role: 'user' };
let mongoServer;

// ─── AI Response Mocks ────────────────────────────────────────────────────

function createQuestion(opts = {}) {
  return {
    question: opts.text || 'What is binary search?',
    topic: opts.topic || 'Java',
    difficulty: opts.difficulty || 'medium',
    type: opts.type || 'conceptual',
    expectedConcepts: opts.expectedConcepts || ['algorithm', 'binary search'],
    expectedAnswer: opts.expectedAnswer || 'Binary search runs in O(log n)',
  };
}

function createEvaluation(opts = {}) {
  return {
    overall: opts.overall ?? 5,
    correctness: opts.correctness ?? 5,
    technicalAccuracy: opts.technicalAccuracy ?? 5,
    completeness: opts.completeness ?? 5,
    clarity: opts.clarity ?? 5,
    depth: opts.depth ?? 5,
    communication: opts.communication ?? 5,
    confidence: opts.confidence ?? 5,
    relevance: opts.relevance ?? 5,
    quality: opts.quality || 'average',
    verdict: opts.verdict || 'partially_correct',
    strengths: opts.strengths || [],
    missingConcepts: opts.missingConcepts || [],
    detectedMistakes: opts.detectedMistakes || [],
    feedback: opts.feedback || 'Good attempt.',
    detailedFeedback: opts.detailedFeedback || 'Reviewed.',
    recommendedAction: opts.recommendedAction || 'next_topic',
    followUpReason: opts.followUpReason || '',
  };
}

function createFollowUpQuestion() {
  return createQuestion({
    text: 'How does HashMap handle collisions?',
    topic: 'Java',
    difficulty: 'medium',
    expectedConcepts: ['chaining', 'load factor'],
  });
}

// ─── Setup & Helpers ──────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await InterviewSession.deleteMany({});
  await InterviewQuestion.deleteMany({});
  await InterviewAnswer.deleteMany({});
  mockAiClient.callJson.mockReset();
});

// Prime a session: mock the first question generation, then call createSession.
// Returns the { session, question } result from createSession.
async function primeSession(user, opts = {}) {
  const defaults = {
    topics: ['Java'], difficulty: 'easy',
    experienceLevel: 'fresher', mode: 'text', totalQuestions: 5,
  };
  mockAiClient.callJson.mockResolvedValueOnce(
    createQuestion({ text: 'Prime question', topic: 'Java', difficulty: 'easy' })
  );
  const result = await sessionService.createSession(user, { ...defaults, ...opts });
  // result is { session, question }
  return { sessionId: result.session._id.toString(), question: result.question, ...result };
}

// ─── Dynamic Question Generation ──────────────────────────────────────────

describe('Dynamic Question Generation', () => {
  test('generates first question on session start', async () => {
    const primed = await primeSession(TEST_USER);
    const questions = await InterviewQuestion.find({ session: primed.sessionId });
    expect(questions.length).toBe(1);
    expect(mockAiClient.callJson).toHaveBeenCalledTimes(1);
  });

  test('generates next question AFTER analyzing answer', async () => {
    const primed = await primeSession(TEST_USER);
    expect(mockAiClient.callJson).toHaveBeenCalledTimes(1);

    const result = await submitAnswer(
      TEST_USER, primed.sessionId, primed.question._id.toString(), 'Some answer',
      createEvaluation({ overall: 5 }),
      createQuestion({ text: 'Next question', topic: 'Java', difficulty: 'medium', expectedConcepts: ['inheritance', 'polymorphism'] })
    );
    expect(result.nextQuestion).toBeDefined();
    expect(mockAiClient.callJson).toHaveBeenCalledTimes(3); // 1 (start) + 2 (submit)
  });
});

// ─── Contextual Follow-ups ────────────────────────────────────────────────

describe('Contextual Follow-ups', () => {
  test('asks follow-up when answer is incomplete', async () => {
    const primed = await primeSession(TEST_USER, { experienceLevel: 'intermediate', difficulty: 'medium' });
    const result = await submitAnswer(
      TEST_USER, primed.sessionId, primed.question._id.toString(),
      'HashMap stores key-value pairs using hashing',
      createEvaluation({ overall: 4, quality: 'average', recommendedAction: 'follow_up',
        missingConcepts: ['hashCode', 'collision'] }),
      createFollowUpQuestion()
    );
    expect(result.nextQuestion).toBeDefined();
    expect(result.nextQuestion.text.toLowerCase()).toContain('collision');
    expect(result.nextQuestion.isFollowUp).toBe(true);
  });

  test('moves to harder topic when answer is strong', async () => {
    const primed = await primeSession(TEST_USER, { experienceLevel: 'intermediate', difficulty: 'easy' });
    const result = await submitAnswer(
      TEST_USER, primed.sessionId, primed.question._id.toString(),
      'REST is an architectural style using HTTP methods',
      createEvaluation({ overall: 9, quality: 'strong', recommendedAction: 'next_topic' }),
      createQuestion({ text: 'Design a distributed cache?', topic: 'Java', difficulty: 'hard', type: 'scenario', expectedConcepts: ['caching', 'distributed', 'consistency'] })
    );
    expect(result.nextQuestion.difficulty).toBe('hard');
  });
});

// ─── Adaptive Difficulty ─────────────────────────────────────────────────

describe('Adaptive Difficulty', () => {
  test('increases difficulty after strong answer', async () => {
    const primed = await primeSession(TEST_USER, { experienceLevel: 'intermediate', difficulty: 'easy' });
    const result = await submitAnswer(
      TEST_USER, primed.sessionId, primed.question._id.toString(),
      'A variable is a named memory location',
      createEvaluation({ overall: 9, quality: 'strong', recommendedAction: 'next_topic' }),
      createQuestion({ text: 'Hard question', topic: 'Java', difficulty: 'hard', expectedConcepts: ['memory', 'stack', 'heap'] })
    );
    expect(result.nextQuestion.difficulty).toBe('hard');
  });

  test('decreases difficulty after weak answer', async () => {
    const primed = await primeSession(TEST_USER, { difficulty: 'hard' });
    const result = await submitAnswer(
      TEST_USER, primed.sessionId, primed.question._id.toString(),
      'I dont know',
            createEvaluation({ overall: 2, quality: 'weak', recommendedAction: 'clarify' }),
      createQuestion({ text: 'Explain encapsulation?', topic: 'Java', difficulty: 'easy' })
    );
    expect(result.nextQuestion.difficulty).toBe('easy');
  });
});

// ─── Submit Safety ────────────────────────────────────────────────────────

// Submit an answer helper: mocks both evaluation and next-question generation.
async function submitAnswer(user, sessionId, questionId, answer, evalMock, nextMock) {
  mockAiClient.callJson.mockResolvedValueOnce(evalMock);
  mockAiClient.callJson.mockResolvedValueOnce(nextMock);
  return await sessionService.submitAnswer(await InterviewSession.findById(sessionId), user, {
    questionId, text: answer, answerType: 'text', durationSeconds: 30,
  });
}

describe('Submit Safety', () => {
  test('prevents duplicate answer submission (idempotent)', async () => {
    const primed = await primeSession(TEST_USER);
    mockAiClient.callJson.mockResolvedValueOnce(createEvaluation());
    mockAiClient.callJson.mockResolvedValueOnce(
      createQuestion({ text: 'Q2', topic: 'Java', difficulty: 'easy' })
    );
    await sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), TEST_USER, {
      questionId: primed.question._id.toString(), text: 'First answer', answerType: 'text',
    });
        // Second submission should be idempotent — returns stored evaluation, not a throw.
    const second = await sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), TEST_USER, {
      questionId: primed.question._id.toString(), text: 'Duplicate', answerType: 'text',
    });
    expect(second).toBeDefined();
    expect(second.duplicate).toBe(true);
  });

  test('rejects empty answer', async () => {
    const primed = await primeSession(TEST_USER);
    await expect(
      sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), TEST_USER, {
        questionId: primed.question._id.toString(), text: '', answerType: 'text',
      })
    ).rejects.toThrow();
  });

  test('rejects stale question ID', async () => {
    const primed = await primeSession(TEST_USER);
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), TEST_USER, {
        questionId: fakeId, text: 'Answer', answerType: 'text',
      })
    ).rejects.toThrow();
  });
});

// ─── Security ─────────────────────────────────────────────────────────────

describe('Security', () => {
  test('prevents cross-user session access', async () => {
    const primed = await primeSession(TEST_USER);
    await expect(
      sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), OTHER_USER, {
        questionId: primed.question._id.toString(), text: 'Answer', answerType: 'text',
      })
    ).rejects.toThrow();
  });
});

// ─── AI Failure Handling ──────────────────────────────────────────────────

describe('AI Failure Handling', () => {
  test('returns recoverable state on generation failure', async () => {
    // AI fails on first question → fallback should be used
    mockAiClient.callJson.mockRejectedValueOnce(new Error('AI error'));
    const result = await sessionService.createSession(TEST_USER, {
      topics: ['Java'], difficulty: 'easy',
      experienceLevel: 'fresher', mode: 'text', totalQuestions: 5,
    });
    expect(result).toBeDefined();
    expect(result.session).toBeDefined();
  });

  test('handles malformed AI response gracefully', async () => {
    // Malformed response → fallback should be used
    mockAiClient.callJson.mockResolvedValueOnce({ invalid: 'response' });
    const result = await sessionService.createSession(TEST_USER, {
      topics: ['Java'], difficulty: 'easy',
      experienceLevel: 'fresher', mode: 'text', totalQuestions: 5,
    });
    expect(result).toBeDefined();
    expect(result.session).toBeDefined();
  });
});

// ─── Interview Completion ─────────────────────────────────────────────────

// Helper to answer all main questions in a session (simulates completing the interview)
async function answerAllQuestions(user, sessionId, count) {
  const questionTexts = [
    'Explain the concept of inheritance in Java',
    'What is polymorphism and how does it work',
    'Describe the difference between abstract classes and interfaces',
    'How does garbage collection work in Java',
    'Explain the Java Memory Model',
  ];
  let lastResult;
  for (let i = 0; i < count; i++) {
    const questions = await InterviewQuestion.find({ session: sessionId }).sort({ order: 1 });
    const answers = await InterviewAnswer.find({ session: sessionId }, 'question').lean();
    const answeredIds = new Set(answers.map((a) => String(a.question)));
    const current = questions.find((q) => !answeredIds.has(String(q._id)));

    if (!current) break;

    mockAiClient.callJson.mockResolvedValueOnce(createEvaluation({ overall: 6 }));
    mockAiClient.callJson.mockResolvedValueOnce(
      createQuestion({ text: questionTexts[i % questionTexts.length], topic: 'Java', difficulty: 'medium', expectedConcepts: [`concept${i}`] })
    );

    lastResult = await sessionService.submitAnswer(
      await InterviewSession.findById(sessionId), user, {
        questionId: current._id.toString(), text: `Answer ${i + 1}`, answerType: 'text',
      }
    );

    if (i === count - 1) return lastResult;
  }
  return lastResult;
}

describe('Interview Completion', () => {
  test('completes after totalQuestions answered', async () => {
    const primed = await primeSession(TEST_USER, { totalQuestions: 5 });
    const result = await answerAllQuestions(TEST_USER, primed.sessionId, 5);
    expect(result.completed).toBeTruthy();
  });

  test('prevents submission after completion', async () => {
    const primed = await primeSession(TEST_USER, { totalQuestions: 5 });
    await answerAllQuestions(TEST_USER, primed.sessionId, 5);
    await expect(
      sessionService.submitAnswer(await InterviewSession.findById(primed.sessionId), TEST_USER, {
        questionId: primed.question._id.toString(), text: 'Another', answerType: 'text',
      })
    ).rejects.toThrow();
  });
});

