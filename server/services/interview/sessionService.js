/**
 * sessionService — orchestrates the interview lifecycle.
 *
 * States: CREATED → IN_PROGRESS → COMPLETED | ABANDONED (PAUSED reserved)
 *
 * All interview state is persisted (session, questions, answers) so the
 * client can refresh, close the tab, or resume later without losing data.
 * The client never generates questions; the AI is only reachable through
 * this service on the server.
 */

const mongoose = require('mongoose');
const InterviewSession = require('../../models/InterviewSession');
const InterviewQuestion = require('../../models/InterviewQuestion');
const InterviewAnswer = require('../../models/InterviewAnswer');
const fields = require('../../config/interviewFields');
const { generateQuestion } = require('./questionGenerator');
const { evaluateAnswer, heuristicEvaluation, deriveMarks } = require('./evaluator');
const { generateReport } = require('./reportGenerator');
const { AiServiceError } = require('./aiClient');

const MAX_FOLLOWUPS_PER_QUESTION = 1;

class SessionError extends Error {
  constructor(message, { statusCode = 400, code, ...rest } = {}) {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
    this.code = code;
    // Allow attaching arbitrary extra data (e.g. existingSessionId, topics)
    Object.assign(this, rest);
  }
}

/** Ownership check — users may only touch their own sessions (admins too). */
function assertOwnership(session, user) {
  const ownerId = String(session.user?._id || session.user);
  if (ownerId !== String(user.id) && user.role !== 'admin') {
    throw new SessionError('Not authorized to access this interview session', { statusCode: 403, code: 'FORBIDDEN' });
  }
}

async function findActiveSession(userId) {
  return InterviewSession.findOne({
    user: userId,
    status: { $in: ['CREATED', 'IN_PROGRESS', 'PAUSED'] },
  }).sort({ lastActivityAt: -1 });
}

/**
 * Create + start a session: validates config, marks IN_PROGRESS and generates
 * the first question. Rejects creation when an active session exists so the
 * client can offer "resume instead".
 */
async function createSession(user, payload) {
  const { topics, difficulty, experienceLevel, mode, totalQuestions } = payload;

  const topicCheck = fields.validateTopics(topics);
  if (!topicCheck.valid) {
    throw new SessionError(
      topicCheck.invalid.length
        ? `Unknown interview topics: ${topicCheck.invalid.join(', ')}`
        : 'Select at least one interview topic',
      { code: 'INVALID_TOPICS' }
    );
  }

  const existing = await findActiveSession(user.id);
  if (existing) {
    throw new SessionError('You already have an active interview session', {
      statusCode: 409,
      code: 'ACTIVE_SESSION_EXISTS',
      session: existing,
    });
  }

  const session = await InterviewSession.create({
    user: user.id,
    topics: topicCheck.canonical.map((t) => t.label),
    difficulty,
    experienceLevel,
    mode,
    totalQuestions,
    status: 'CREATED',
  });
  console.log(`[interview] session created user=${user.id} session=${session._id} topics=${session.topics.length} mode=${mode}`);

  return startSession(session, user);
}

/** Generate the first question and flip the session to IN_PROGRESS. */
async function startSession(session, user) {
  assertOwnership(session, user);

  if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
    throw new SessionError('This interview is already finished', { code: 'ALREADY_FINISHED' });
  }

  let firstQuestion = await InterviewQuestion.findOne({ session: session._id, isFollowUp: false }).sort({ order: 1 });
  if (!firstQuestion) {
    const generated = await generateQuestion({ session });
    firstQuestion = await InterviewQuestion.create({
      session: session._id,
      order: 1,
      topic: generated.topic,
      difficulty: generated.difficulty,
      text: generated.question,
      type: generated.type,
      expectedConcepts: generated.expectedConcepts,
      expectedAnswer: generated.expectedAnswer,
      isFollowUp: false,
      source: generated.source,
    });
  }

  if (session.status === 'CREATED') {
    session.status = 'IN_PROGRESS';
    session.startedAt = session.startedAt || new Date();
  }
  session.lastActivityAt = new Date();
  await session.save();
  console.log(`[interview] session started session=${session._id}`);

  return { session, question: firstQuestion };
}

/** Full client-ready state (used on load/refresh/resume). */
async function getSessionState(session) {
  const questions = await InterviewQuestion.find({ session: session._id }).sort({ order: 1 }).lean();
  const answers = await InterviewAnswer.find({ session: session._id })
    .populate('question', 'text topic isFollowUp order difficulty')
    .sort({ submittedAt: 1 })
    .lean();

  const answeredIds = new Set(answers.map((a) => String(a.question?._id)));
  const nextQuestion = questions.find((q) => !answeredIds.has(String(q._id))) || null;

  const history = answers.map((a) => ({
    questionId: a.question?._id,
    question: a.question?.text,
    topic: a.question?.topic,
    isFollowUp: a.question?.isFollowUp,
    answerType: a.answerType,
    answer: a.text,
    score: a.evaluation?.overall ?? null,
    verdict: a.evaluation?.verdict ?? null,
    feedback: a.evaluation?.feedback ?? null,
    submittedAt: a.submittedAt,
  }));

  return {
    session: {
      id: session._id ? session._id.toString() : session.id,
      topics: session.topics,
      difficulty: session.difficulty,
      experienceLevel: session.experienceLevel,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      status: session.status,
      transientFailure: session.transientFailure
        ? {
            type: session.transientFailure.type,
            message: session.transientFailure.message,
            at: session.transientFailure.at,
          }
        : null,
      currentQuestionIndex: session.currentQuestionIndex,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    },
    nextQuestion: nextQuestion && {
      id: nextQuestion._id ? nextQuestion._id.toString() : (nextQuestion.id ? nextQuestion.id.toString() : null),
      text: nextQuestion.text,
      topic: nextQuestion.topic,
      difficulty: nextQuestion.difficulty,
      type: nextQuestion.type,
      isFollowUp: nextQuestion.isFollowUp,
      mainQuestionNumber: nextQuestion.isFollowUp
        ? null
        : answers.filter((a) => !a.question?.isFollowUp).length + 1,
      order: nextQuestion.order,
      expectedConcepts: nextQuestion.expectedConcepts || [],
      expectedAnswer: nextQuestion.expectedAnswer || '',
      source: nextQuestion.source,
    },
    history,
    answeredCount: answers.filter((a) => !a.question?.isFollowUp).length,
    answeredMainCount: answers.filter((a) => !a.question?.isFollowUp).length,
    completed: session.status === 'COMPLETED',
  };
}

/** Build the summarized recent context for the next generation call. */
async function buildGenerationContext(session) {
  const answers = await InterviewAnswer.find({ session: session._id })
    .populate('question', 'text topic expectedConcepts isFollowUp')
    .sort({ submittedAt: 1 })
    .lean();

  const questionSummaries = answers
    .filter((a) => a.question)
    .map((a) => ({
      text: a.question.text,
      topic: a.question.topic,
      expectedConcepts: a.question.expectedConcepts || [],
    }));

  const recentQA = answers.slice(-2).map((a) => ({
    question: a.question?.text || '',
    answer: a.text,
    score: a.evaluation?.overall ?? 0,
  }));

  const recentScores = answers.slice(-3).map((a) => a.evaluation?.overall ?? 0);

  // Topic coverage plan (§ topic management): how many questions each selected
  // topic has received so far, so the AI can balance topics adaptively.
  const topicCounts = {};
  for (const t of session.topics) topicCounts[t] = 0;
  for (const q of questionSummaries) {
    if (topicCounts[q.topic] != null) topicCounts[q.topic] += 1;
  }

  // Strong/weak areas from recent evaluations (drives adaptive difficulty).
  const strongAreas = [];
  const weakAreas = [];
  const missingSoFar = [];
  for (const a of answers.slice(-4)) {
    const q = a.question?.text || '';
    const score = a.evaluation?.overall ?? 0;
    if (score >= 7.5) strongAreas.push(q);
    if (score <= 4.5) weakAreas.push(q);
    for (const m of a.evaluation?.missingConcepts || []) missingSoFar.push(m);
  }

  return {
    questionSummaries,
    recentQA,
    recentScores,
    topicCounts,
    remainingMain: Math.max(0, session.totalQuestions - countMainAnsweredSync(answers)),
    strongAreas: [...new Set(strongAreas)].slice(0, 4),
    weakAreas: [...new Set(weakAreas)].slice(0, 4),
    missingSoFar: [...new Set(missingSoFar)].slice(0, 8),
  };
}

// Sync helper over already-fetched answers (main questions answered).
function countMainAnsweredSync(answers) {
  return (answers || []).filter((a) => a.question && !a.question.isFollowUp).length;
}

async function countMainAnswered(session) {
  const answers = await InterviewAnswer.find({ session: session._id })
    .populate('question', 'isFollowUp')
    .lean();
  return answers.filter((a) => a.question && !a.question.isFollowUp).length;
}

/** Persist a recoverable failure trace (never flips the session status). */
async function recordTransientFailure(session, type, message) {
  try {
    session.transientFailure = { type, message: String(message || '').slice(0, 300), at: new Date() };
    await session.save();
  } catch (err) {
    console.error(`[interview] failed to record transient failure session=${session._id}: ${err.message}`);
  }
}

/** Clear the failure trace once the pipeline recovers. */
async function clearTransientFailure(session) {
  if (!session.transientFailure) return;
  try {
    session.set('transientFailure', undefined);
    await session.save();
  } catch (err) {
    console.error(`[interview] failed to clear transient failure session=${session._id}: ${err.message}`);
  }
}

function shapeQuestion(q, { answeredMainCount = 0 } = {}) {
  return {
    id: q._id ? q._id.toString() : (q.id ? q.id.toString() : null),
    text: q.text,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    isFollowUp: q.isFollowUp,
    // § progress numbering: MAIN questions carry their 1-based number within
    // the selected count; follow-ups are labelled but never numbered/counted.
    mainQuestionNumber: q.isFollowUp ? null : answeredMainCount + 1,
    order: q.order,
    expectedConcepts: q.expectedConcepts || [],
    expectedAnswer: q.expectedAnswer || '',
    source: q.source,
  };
}

/**
 * Submit an answer for the current question.
 * Idempotent: re-submitting an already-answered question returns the stored
 * evaluation without another AI call (cost control). A simultaneous duplicate
 * submit that races past the findOne check is caught via the unique index
 * (E11000) and handled idempotently instead of surfacing a 500.
 */
async function submitAnswer(session, user, { questionId, text, answerType, durationSeconds, rawTranscript }) {
  assertOwnership(session, user);

  if (session.status !== 'IN_PROGRESS') {
    throw new SessionError('This interview is not in progress', { code: 'NOT_IN_PROGRESS' });
  }

  if (!mongoose.Types.ObjectId.isValid(String(questionId || ''))) {
    throw new SessionError('Invalid question id', { code: 'INVALID_QUESTION_ID' });
  }

  const question = await InterviewQuestion.findOne({ _id: questionId, session: session._id });
  if (!question) {
    throw new SessionError('Question does not belong to this session', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
  }

  // § completion invariant — a MAIN question can never be answered once the
  // selected count has been reached. Follow-ups are exempt (they may arrive
  // while earlier mains are still being probed, but never extend the count).
  const mainAnsweredNow = await countMainAnswered(session);
  if (!question.isFollowUp && mainAnsweredNow >= session.totalQuestions) {
    throw new SessionError('All selected main questions have already been answered', {
      statusCode: 409,
      code: 'MAIN_LIMIT_REACHED',
    });
  }

  const answerText = String(text || '').trim().slice(0, 8000);
  if (answerText.length < 2) {
    throw new SessionError('Answer cannot be empty', { code: 'EMPTY_ANSWER' });
  }
  const type = answerType === 'voice' ? 'voice' : 'text';

  const storeAnswer = async () => {
    // § scoring spec — persist deterministic 0|1|2 marks + question type so
    // the report can filter main vs follow-up without re-deriving anything.
    evaluation.marks = deriveMarks(evaluation);
    evaluation.maxMarks = 2;
    return InterviewAnswer.create({
      session: session._id,
      question: question._id,
      questionType: question.isFollowUp ? 'followup' : 'main',
      answerType: type,
      text: answerText,
      rawTranscript: String(rawTranscript || '').trim().slice(0, 8000) || undefined,
      evaluation,
      durationSeconds: Math.max(0, Math.min(3600, Number(durationSeconds) || 0)),
    });
  };

  // Idempotency: unique index {session, question} — reuse stored evaluation.
  let answer = await InterviewAnswer.findOne({ session: session._id, question: question._id });
  if (answer) {
    const next = await advanceOrComplete(session, answer.evaluation);
    return { evaluation: answer.evaluation, duplicate: true, ...next };
  }

  console.log(`[interview] answer evaluation started session=${session._id} question=${question._id}`);
  let evaluation;
  try {
    evaluation = await evaluateAnswer({
      question: question.text,
      topic: question.topic,
      answer: answerText,
      experienceLevel: session.experienceLevel,
      isFollowUp: question.isFollowUp,
    });
  } catch (err) {
    // AI outage must never block the interview — degrade to heuristic scoring.
    if (err instanceof AiServiceError) {
      console.error(`[interview] AI evaluation failed, using heuristic session=${session._id}: ${err.message}`);
      evaluation = heuristicEvaluation({
        answer: answerText,
        expectedConcepts: question.expectedConcepts,
        expectedAnswer: question.expectedAnswer,
      });
      await recordTransientFailure(session, 'ANALYSIS_FAILED', `AI evaluation unavailable (${err.message}); heuristic scoring used.`);
    } else {
      throw err;
    }
  }
  console.log(`[interview] answer evaluation completed session=${session._id} score=${evaluation.overall} evaluator=${evaluation.evaluator || 'ai'}`);

  try {
    answer = await storeAnswer();
  } catch (err) {
    // Lost race with a duplicate submit of the same question → idempotent.
    if (err && err.code === 11000) {
      answer = await InterviewAnswer.findOne({ session: session._id, question: question._id });
      const next = await advanceOrComplete(session, answer.evaluation);
      return { evaluation: answer.evaluation, duplicate: true, ...next };
    }
    throw err;
  }

  if (!question.isFollowUp) {
    session.currentQuestionIndex = (session.currentQuestionIndex || 0) + 1;
  }
  session.lastActivityAt = new Date();

  const next = await advanceOrComplete(session, evaluation, question);
  return { evaluation, ...next };
}

/**
 * Decide the next step after an answer: completion, follow-up question, or
 * next main question (§ lifecycle spec).
 *
 * ORDER MATTERS:
 *  1) Completion check FIRST — once answeredMain === selectedQuestionCount the
 *     interview MUST finish immediately. No follow-up is generated after the
 *     final main answer (follow-ups only happen BETWEEN main questions).
 *  2) Follow-up (only straight after a non-final main answer, budget-capped).
 *  3) Next main question — hard-capped by the selected count in
 *     ensureNextQuestion, so the AI can never push past the limit.
 */
async function advanceOrComplete(session, evaluation, justAnsweredQuestion = null) {
  const answeredMainCount = await countMainAnswered(session);

  // 1) Interview finished? (all main questions answered — strict invariant)
  if (answeredMainCount >= session.totalQuestions) {
    const report = await completeSession(session);
    return {
      completed: true,
      report: { score: report.score, maxScore: report.maxScore, overallScore: report.overallScore },
      answeredMainCount,
      totalQuestions: session.totalQuestions,
      nextQuestion: null,
    };
  }

  // 2) Follow-up decision — only straight after a main question, budget-capped.
  //    Incorrect answers get a corrective probe ("clarify"), partial answers a
  //    deepening probe ("follow_up") — decided from the analysis action.
  const action = evaluation?.recommendedAction
    || (evaluation?.followUpNeeded ? 'follow_up' : 'next_topic');
  const wantsFollowUp = action === 'follow_up' || action === 'clarify' || Boolean(evaluation?.followUpNeeded);

  if (wantsFollowUp && justAnsweredQuestion && !justAnsweredQuestion.isFollowUp) {
    const followUpCount = await InterviewQuestion.countDocuments({
      session: session._id,
      isFollowUp: true,
      parentQuestion: justAnsweredQuestion._id,
    });
    if (followUpCount < MAX_FOLLOWUPS_PER_QUESTION) {
      try {
        const ctx = await buildGenerationContext(session);
        const prevAnswerDoc = await InterviewAnswer.findOne({
          session: session._id,
          question: justAnsweredQuestion._id,
        }).lean();
        const generated = await generateQuestion({
          session,
          isFollowUp: true,
          prevQuestion: { text: justAnsweredQuestion.text },
          prevAnswer: prevAnswerDoc?.text || '',
          prevEvaluation: evaluation,
          ...ctx,
        });
        const nextOrder = ((await InterviewQuestion.countDocuments({ session: session._id })) || 0) + 1;
        const followUp = await InterviewQuestion.create({
          session: session._id,
          order: nextOrder,
          topic: generated.topic,
          difficulty: generated.difficulty,
          text: generated.question,
          type: generated.type,
          expectedConcepts: generated.expectedConcepts,
          expectedAnswer: generated.expectedAnswer,
          isFollowUp: true,
          parentQuestion: justAnsweredQuestion._id,
          source: generated.source,
        });
        session.status = 'IN_PROGRESS';
        session.lastActivityAt = new Date();
        await session.save();
        await clearTransientFailure(session);
        return {
          nextQuestion: shapeQuestion(followUp, { answeredMainCount }),
          completed: false,
          answeredMainCount,
          totalQuestions: session.totalQuestions,
        };
      } catch (err) {
        console.error(`[interview] follow-up generation failed session=${session._id}: ${err.message}`);
        await recordTransientFailure(session, 'GENERATION_FAILED', `Follow-up generation failed: ${err.message}`);
        // fall through to main-question flow — the interview must continue
      }
    }
  }

  // 3) Next main question — generation failure must NOT fail the submit
  //    (the answer was already accepted). Return a recoverable state instead;
  //    the client retries via POST /:id/next. ensureNextQuestion enforces the
  //    main-question ceiling, so the AI can never add a question beyond N.
  try {
    const nextQuestion = await ensureNextQuestion(session);
    session.status = 'IN_PROGRESS';
    session.lastActivityAt = new Date();
    await session.save();
    await clearTransientFailure(session);
    return {
      nextQuestion: shapeQuestion(nextQuestion, { answeredMainCount }),
      completed: false,
      answeredMainCount,
      totalQuestions: session.totalQuestions,
    };
  } catch (err) {
    if (err instanceof SessionError && err.code === 'MAIN_LIMIT_REACHED') {
      // Defensive: every main is asked/answered but the session never
      // finalized (e.g. an old session). Finalize now.
      const report = await completeSession(session);
      return {
        completed: true,
        report: { score: report.score, maxScore: report.maxScore, overallScore: report.overallScore },
        answeredMainCount,
        totalQuestions: session.totalQuestions,
        nextQuestion: null,
      };
    }
    console.error(`[interview] next-question generation failed session=${session._id}: ${err.message}`);
    await recordTransientFailure(session, 'GENERATION_FAILED', `Next-question generation failed: ${err.message}`);
    return { nextQuestion: null, completed: false, generationFailed: true, answeredMainCount, totalQuestions: session.totalQuestions };
  }
}

/**
 * Idempotently guarantee a pending (unanswered) question exists for the
 * session. If one is already created (e.g. the client never received it, or a
 * previous generation response was lost), return it instead of generating a
 * duplicate. Otherwise generate + persist the next main question.
 */
async function ensureNextQuestion(session) {
  const questions = await InterviewQuestion.find({ session: session._id }).sort({ order: 1 }).lean();
  const answers = await InterviewAnswer.find({ session: session._id }, 'question').lean();
  const answeredIds = new Set(answers.map((a) => String(a.question)));
  const pending = questions.find((q) => !answeredIds.has(String(q._id)));
  if (pending) {
    console.log(`[interview] reusing pending question session=${session._id} question=${pending._id}`);
    return pending;
  }

  // § HARD CEILING — never generate more MAIN questions than the user
  // selected. This is the backend enforcement (not a frontend counter) that
  // makes "6th main question" impossible for any selected count (1, 2, 5, 10…).
  const mainAsked = questions.filter((q) => !q.isFollowUp).length;
  if (mainAsked >= session.totalQuestions) {
    console.warn(`[interview] main-question limit reached session=${session._id} asked=${mainAsked} selected=${session.totalQuestions}`);
    throw new SessionError('All selected main questions have already been asked', {
      statusCode: 409,
      code: 'MAIN_LIMIT_REACHED',
    });
  }

  const ctx = await buildGenerationContext(session);
  const generated = await generateQuestion({ session, ...ctx });
  const nextOrder = (questions.length || 0) + 1;
  return InterviewQuestion.create({
    session: session._id,
    order: nextOrder,
    topic: generated.topic,
    difficulty: generated.difficulty,
    text: generated.question,
    type: generated.type,
    expectedConcepts: generated.expectedConcepts,
    expectedAnswer: generated.expectedAnswer,
    isFollowUp: false,
    source: generated.source,
  });
}

/**
 * POST /:id/next — fetch the current pending question or generate the next
 * one. Used after a submit whose next-question generation failed, and by the
 * resume flow when a session has no pending question yet.
 *
 * ACCEPTED for both CREATED and IN_PROGRESS sessions: a CREATED session here
 * means the first-question generation failed during create (the session doc
 * was persisted before the AI call). The retry must generate the first
 * question and flip the session to IN_PROGRESS — otherwise the client would
 * be stuck in a permanent retry loop.
 */
async function requestNextQuestion(session, user) {
  assertOwnership(session, user);
  if (session.status !== 'IN_PROGRESS' && session.status !== 'CREATED') {
    throw new SessionError('This interview is not in progress', { code: 'NOT_IN_PROGRESS' });
  }

  // All main questions answered? Finalize (recovers lost completion responses).
  const mainAnswered = await countMainAnswered(session);
  if (mainAnswered >= session.totalQuestions) {
    const report = await completeSession(session);
    return {
      completed: true,
      report: { score: report.score, maxScore: report.maxScore, overallScore: report.overallScore },
      answeredMainCount: mainAnswered,
      totalQuestions: session.totalQuestions,
      nextQuestion: null,
    };
  }

  try {
    const nextQuestion = await ensureNextQuestion(session);
    if (session.status === 'CREATED') {
      session.status = 'IN_PROGRESS';
      session.startedAt = session.startedAt || new Date();
    }
    session.lastActivityAt = new Date();
    await session.save();
    await clearTransientFailure(session);
    return {
      completed: false,
      nextQuestion: shapeQuestion(nextQuestion, { answeredMainCount: mainAnswered }),
      answeredMainCount: mainAnswered,
      totalQuestions: session.totalQuestions,
    };
  } catch (err) {
    console.error(`[interview] requestNextQuestion failed session=${session._id}: ${err.message}`);
    await recordTransientFailure(session, 'GENERATION_FAILED', `Next-question generation failed: ${err.message}`);
    throw new SessionError(
      'AI interviewer temporarily unavailable. Please retry in a moment.',
      { statusCode: 503, code: 'GENERATION_FAILED' }
    );
  }
}

/** Finalize a session: generate + persist the report. Idempotent. */
async function completeSession(session) {
  if (session.status === 'COMPLETED' && session.finalReport) {
    return session.finalReport;
  }

  const answers = await InterviewAnswer.find({ session: session._id })
    .populate('question', 'text topic isFollowUp order')
    .sort({ submittedAt: 1 });

  console.log(`[interview] report generation started session=${session._id}`);
  const report = await generateReport(session, answers);
  console.log(`[interview] report generation completed session=${session._id} score=${report.overallScore}`);

  session.finalReport = report;
  session.score = report.overallScore;
  session.status = 'COMPLETED';
  session.completedAt = new Date();
  session.lastActivityAt = new Date();
  await session.save();

  return report;
}

/** Explicit abandon — keeps partial data for the report page. */
async function abandonSession(session) {
  session.status = 'ABANDONED';
  session.lastActivityAt = new Date();
  await session.save();
  console.log(`[interview] session abandoned session=${session._id}`);
}

module.exports = {
  SessionError,
  assertOwnership,
  findActiveSession,
  createSession,
  startSession,
  getSessionState,
  submitAnswer,
  advanceOrComplete,
  ensureNextQuestion,
  requestNextQuestion,
  completeSession,
  abandonSession,
};
