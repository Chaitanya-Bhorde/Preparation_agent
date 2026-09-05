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
const { evaluateAnswer } = require('./evaluator');
const { generateReport } = require('./reportGenerator');

const MAX_FOLLOWUPS_PER_QUESTION = 1;

class SessionError extends Error {
  constructor(message, { statusCode = 400, code } = {}) {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
    this.code = code;
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
      id: session._id,
      topics: session.topics,
      difficulty: session.difficulty,
      experienceLevel: session.experienceLevel,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    },
    nextQuestion: nextQuestion && {
      id: nextQuestion._id,
      text: nextQuestion.text,
      topic: nextQuestion.topic,
      difficulty: nextQuestion.difficulty,
      type: nextQuestion.type,
      isFollowUp: nextQuestion.isFollowUp,
      order: nextQuestion.order,
    },
    history,
    answeredCount: answers.filter((a) => !a.question?.isFollowUp).length,
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

  return { questionSummaries, recentQA, recentScores };
}

async function countMainAnswered(session) {
  const answers = await InterviewAnswer.find({ session: session._id })
    .populate('question', 'isFollowUp')
    .lean();
  return answers.filter((a) => a.question && !a.question.isFollowUp).length;
}

function shapeQuestion(q) {
  return {
    id: q._id,
    text: q.text,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    isFollowUp: q.isFollowUp,
    order: q.order,
  };
}

/**
 * Submit an answer for the current question.
 * Idempotent: re-submitting an already-answered question returns the stored
 * evaluation without another AI call (cost control).
 */
async function submitAnswer(session, user, { questionId, text, answerType, durationSeconds }) {
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

  const answerText = String(text || '').trim().slice(0, 8000);
  if (answerText.length < 2) {
    throw new SessionError('Answer cannot be empty', { code: 'EMPTY_ANSWER' });
  }
  const type = answerType === 'voice' ? 'voice' : 'text';

  // Idempotency: unique index {session, question} — reuse stored evaluation.
  let answer = await InterviewAnswer.findOne({ session: session._id, question: question._id });
  if (answer) {
    const next = await advanceOrComplete(session, answer.evaluation);
    return { evaluation: answer.evaluation, ...next };
  }

  console.log(`[interview] answer evaluation started session=${session._id} question=${question._id}`);
  const evaluation = await evaluateAnswer({
    question: question.text,
    topic: question.topic,
    answer: answerText,
    experienceLevel: session.experienceLevel,
    isFollowUp: question.isFollowUp,
  });
  console.log(`[interview] answer evaluation completed session=${session._id} score=${evaluation.overall}`);

  answer = await InterviewAnswer.create({
    session: session._id,
    question: question._id,
    answerType: type,
    text: answerText,
    evaluation,
    durationSeconds: Math.max(0, Math.min(3600, Number(durationSeconds) || 0)),
  });

  if (!question.isFollowUp) {
    session.currentQuestionIndex = (session.currentQuestionIndex || 0) + 1;
  }
  session.lastActivityAt = new Date();

  const next = await advanceOrComplete(session, evaluation, question);
  return { evaluation, ...next };
}

/**
 * Decide the next step after an answer: follow-up question, next main
 * question, or completion (report generation included).
 */
async function advanceOrComplete(session, evaluation, justAnsweredQuestion = null) {
  // 1) Follow-up decision — only straight after a main question, budget-capped.
  if (evaluation?.followUpNeeded && justAnsweredQuestion && !justAnsweredQuestion.isFollowUp) {
    const followUpCount = await InterviewQuestion.countDocuments({
      session: session._id,
      isFollowUp: true,
      parentQuestion: justAnsweredQuestion._id,
    });
    const mainAnswered = await countMainAnswered(session);
    if (followUpCount < MAX_FOLLOWUPS_PER_QUESTION && mainAnswered < session.totalQuestions) {
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
        return { nextQuestion: shapeQuestion(followUp), completed: false };
      } catch (err) {
        console.error(`[interview] follow-up generation failed session=${session._id}: ${err.message}`);
        // fall through to main-question flow — the interview must continue
      }
    }
  }

  // 2) Interview finished? (all main questions answered)
  const mainAnswered = await countMainAnswered(session);
  if (mainAnswered >= session.totalQuestions) {
    const report = await completeSession(session);
    return { completed: true, report: { overallScore: report.overallScore } };
  }

  // 3) Next main question.
  const ctx = await buildGenerationContext(session);
  const generated = await generateQuestion({ session, ...ctx });
  const nextOrder = ((await InterviewQuestion.countDocuments({ session: session._id })) || 0) + 1;
  const nextQuestion = await InterviewQuestion.create({
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
  session.status = 'IN_PROGRESS';
  session.lastActivityAt = new Date();
  await session.save();
  return { nextQuestion: shapeQuestion(nextQuestion), completed: false };
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
  completeSession,
  abandonSession,
};
