/**
 * interviewController â€” HTTP layer for the AI Mock Interview feature.
 * Thin: validate input, delegate to sessionService, map errors to responses.
 * Raw AI/provider errors are never surfaced to clients.
 */

const mongoose = require('mongoose');
const InterviewSession = require('../models/InterviewSession');
const fields = require('../config/interviewFields');
const svc = require('../services/interview/sessionService');
const { AiServiceError } = require('../services/interview/aiClient');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const sanitizeAnswer = (raw) => String(raw ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .slice(0, 8000);

// GET /api/interview/fields â€” selectable interview fields grouped by category
exports.getFields = (req, res) => {
  res.json({
    success: true,
    data: {
      categories: fields.getFields(),
      difficulties: fields.DIFFICULTIES,
      experienceLevels: fields.EXPERIENCE_LEVELS,
      modes: fields.MODES,
      questionCounts: fields.QUESTION_COUNTS,
      defaultQuestionCount: fields.DEFAULT_QUESTION_COUNT,
    },
  });
};

// POST /api/interview/sessions â€” create + start (returns first question)
exports.createSession = async (req, res) => {
  try {
    const { topics, difficulty, experienceLevel, mode, totalQuestions } = req.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one interview topic.' });
    }
    if (!fields.DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ success: false, message: 'Invalid difficulty.' });
    }
    if (!fields.EXPERIENCE_LEVELS.includes(experienceLevel || 'fresher')) {
      return res.status(400).json({ success: false, message: 'Invalid experience level.' });
    }
    if (!fields.MODES.includes(mode)) {
      return res.status(400).json({ success: false, message: 'Invalid interview mode.' });
    }
    const count = Number(totalQuestions) || fields.DEFAULT_QUESTION_COUNT;
    if (!fields.QUESTION_COUNTS.includes(count)) {
      return res.status(400).json({ success: false, message: 'Invalid question count.' });
    }

    const { session, question } = await svc.createSession(req.user, {
      topics: topics.map((t) => String(t).slice(0, 60)),
      difficulty,
      experienceLevel: experienceLevel || 'fresher',
      mode,
      totalQuestions: count,
    });

    // Shape the question to ensure it has 'id' (not '_id') for the frontend
    const shapedQuestion = question ? {
      id: question._id ? question._id.toString() : question.id,
      text: question.text,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      isFollowUp: question.isFollowUp,
      order: question.order,
      expectedConcepts: question.expectedConcepts || [],
      expectedAnswer: question.expectedAnswer || '',
      source: question.source,
    } : null;

        res.status(201).json({
      success: true,
      data: {
        sessionId: session._id ? session._id.toString() : session.id,
        status: session.status,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        answeredMainCount: 0,
        question: question ? { ...shapedQuestion, mainQuestionNumber: 1 } : null,
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      if (err.code === 'ACTIVE_SESSION_EXISTS') {
        // Return full session state so the client can offer resume immediately
        const state = await svc.getSessionState(err.session);
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          data: {
            code: err.code,
            existingSessionId: state.session.id,
            session: state.session,
            nextQuestion: state.nextQuestion,
            answeredCount: state.answeredCount,
          },
        });
      }
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] create session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not start the interview. Please try again.' });
  }
};

// GET /api/interview/sessions/active â€” resume support
exports.getActiveSession = async (req, res) => {
  try {
    const session = await svc.findActiveSession(req.user.id);
    if (!session) {
      return res.json({ success: true, data: { hasActiveSession: false, session: null } });
    }

    // Also fetch the current unanswered question so the client can resume immediately
    const state = await svc.getSessionState(session);
    res.json({
      success: true,
      data: {
        hasActiveSession: true,
        session: state.session,
        nextQuestion: state.nextQuestion,
        answeredCount: state.answeredCount,
      },
    });
  } catch (err) {
    console.error('[interview] active session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not look up your interviews.' });
  }
};

// GET /api/interview/sessions/:id â€” session state (restore/refresh safe)
exports.getSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    svc.assertOwnership(session, req.user);
    const state = await svc.getSessionState(session);
    res.json({ success: true, data: state });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] get session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load the interview session.' });
  }
};

// POST /api/interview/sessions/:id/start â€” (re)start a CREATED session
exports.startSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    const { session: updated, question } = await svc.startSession(session, req.user);
    res.json({
      success: true,
      data: {
        sessionId: updated._id ? updated._id.toString() : updated.id,
        status: updated.status,
        question: question && {
          id: question._id ? question._id.toString() : question.id,
          text: question.text,
          topic: question.topic,
          difficulty: question.difficulty,
          type: question.type,
          isFollowUp: question.isFollowUp,
          order: question.order,
          expectedConcepts: question.expectedConcepts || [],
          expectedAnswer: question.expectedAnswer || '',
          source: question.source,
        },
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] start session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not start the interview. Please retry.' });
  }
};

// POST /api/interview/sessions/:id/answer â€” evaluate + advance
exports.submitAnswer = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    const { questionId, answer, answerType, durationSeconds, transcript } = req.body;
    const result = await svc.submitAnswer(session, req.user, {
      questionId,
      text: sanitizeAnswer(answer),
      answerType: answerType === 'voice' ? 'voice' : 'text',
      durationSeconds,
      rawTranscript: sanitizeAnswer(transcript),
    });

    res.json({
      success: true,
      data: {
        evaluation: {
          overall: result.evaluation.overall,
          verdict: result.evaluation.verdict,
          quality: result.evaluation.quality,
          marks: result.evaluation.marks ?? null,
          maxMarks: result.evaluation.maxMarks ?? 2,
          feedback: result.evaluation.feedback,
          strengths: result.evaluation.strengths,
          missingConcepts: result.evaluation.missingConcepts || [],
          recommendedAction: result.evaluation.recommendedAction,
        },
        nextQuestion: result.nextQuestion || null,
        completed: Boolean(result.completed),
        generationFailed: Boolean(result.generationFailed),
        // The submitted answer is stored; only the NEXT question generation
        // failed — the client can safely retry via POST /next (idempotent).
        retryable: Boolean(result.generationFailed),
        message: result.generationFailed
          ? 'Your answer was saved and evaluated, but the next question could not be generated. Retry to continue.'
          : undefined,
        duplicate: Boolean(result.duplicate),
        report: result.report || null,
        answeredMainCount: Number(result.answeredMainCount ?? 0),
        totalQuestions: Number(result.totalQuestions ?? session.totalQuestions),
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    if (err instanceof AiServiceError) {
      console.error('[interview] answer AI failure:', err.message);
      return res.status(503).json({ success: false, message: 'AI interviewer temporarily unavailable. Please retry.' });
    }
    console.error('[interview] submit answer error:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong while evaluating your answer. Please retry.' });
  }
};

// POST /api/interview/sessions/:id/next — pending or next question (retry-safe)
exports.requestNext = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    const result = await svc.requestNextQuestion(session, req.user);
    res.json({
      success: true,
      data: {
        nextQuestion: result.nextQuestion || null,
        completed: Boolean(result.completed),
        report: result.report || null,
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] next question error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load the next question. Please retry.' });
  }
};

// POST /api/interview/sessions/:id/complete â€” finalize + report
exports.completeSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    svc.assertOwnership(session, req.user);
    const report = await svc.completeSession(session);
    res.json({ success: true, data: { sessionId: session._id, status: session.status, overallScore: report.overallScore } });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] complete session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not finalize the interview. Please retry.' });
  }
};

// POST /api/interview/sessions/:id/abandon
exports.abandonSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    svc.assertOwnership(session, req.user);
    await svc.abandonSession(session);
    res.json({ success: true, data: { sessionId: session._id, status: 'ABANDONED' } });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] abandon session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not abandon the interview.' });
  }
};

// GET /api/interview/history - user's completed interviews
exports.getHistory = async (req, res) => {
  try {
    const InterviewSession = require('../models/InterviewSession');
    const sessions = await InterviewSession.find({
      user: req.user.id,
      status: { $in: ['COMPLETED', 'ABANDONED'] },
    })
      .sort({ completedAt: -1, createdAt: -1 })
      .select('topics difficulty mode totalQuestions status submissionReason proctoringViolations score finalReport startedAt completedAt createdAt')
      .lean();

    const history = sessions.map((s) => ({
      id: s._id,
      topics: s.topics,
      difficulty: s.difficulty,
      mode: s.mode,
      totalQuestions: s.totalQuestions,
      status: s.status,
      submissionReason: s.submissionReason || 'COMPLETED',
      proctoringViolations: s.proctoringViolations || 0,
      score: s.finalReport?.score ?? s.score ?? 0,
      maxScore: s.finalReport?.maxScore ?? s.totalQuestions * 2,
      percentage: s.finalReport?.percentage ?? 0,
      mainQuestionsAnswered: s.finalReport?.stats?.mainQuestionsAnswered ?? 0,
      followUpCount: s.finalReport?.stats?.followUpCount ?? 0,
      strongTopics: s.finalReport?.strengths ?? [],
      weakTopics: s.finalReport?.areasToImprove ?? [],
      topicPerformance: s.finalReport?.topicPerformance ?? [],
      completedAt: s.completedAt,
      createdAt: s.createdAt,
      duration: s.startedAt && s.completedAt
        ? Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 1000)
        : null,
    }));

    res.json({ success: true, data: history });
  } catch (err) {
    console.error('[interview] history error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load interview history.' });
  }
};

// GET /api/interview/history/:id - detailed report for a specific interview
exports.getHistoryDetail = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid interview id.' });
    }
    const InterviewSession = require('../models/InterviewSession');
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview not found.' });

    svc.assertOwnership(session, req.user);

    const InterviewAnswer = require('../models/InterviewAnswer');
    const answers = await InterviewAnswer.find({ session: session._id })
      .populate('question', 'text topic difficulty isFollowUp order expectedConcepts expectedAnswer')
      .sort({ submittedAt: 1 })
      .lean();

    const questionAnalysis = answers.map((a) => ({
      question: a.question?.text,
      topic: a.question?.topic,
      difficulty: a.question?.difficulty,
      isFollowUp: a.question?.isFollowUp || false,
      expectedAnswer: a.question?.expectedAnswer,
      expectedConcepts: a.question?.expectedConcepts,
      answer: a.text,
      answerType: a.answerType,
      score: a.evaluation?.overall ?? null,
      marks: a.evaluation?.marks ?? null,
      maxMarks: a.evaluation?.maxMarks ?? 2,
      verdict: a.evaluation?.verdict ?? null,
      result: a.evaluation?.verdict === 'correct' ? 'correct' : a.evaluation?.verdict === 'partially_correct' ? 'partial' : 'incorrect',
      strengths: a.evaluation?.strengths ?? [],
      missingConcepts: a.evaluation?.missingConcepts ?? [],
      feedback: a.evaluation?.detailedFeedback || a.evaluation?.feedback || '',
    }));

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          topics: session.topics,
          difficulty: session.difficulty,
          experienceLevel: session.experienceLevel,
          mode: session.mode,
          status: session.status,
          submissionReason: session.submissionReason || 'COMPLETED',
          proctoringViolations: session.proctoringViolations || 0,
          totalQuestions: session.totalQuestions,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          duration: session.startedAt && session.completedAt
            ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000)
            : null,
        },
        report: session.finalReport || null,
        questions: questionAnalysis,
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] history detail error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load interview details.' });
  }
};
// GET /api/interview/sessions/:id/report â€” final report
exports.getReport = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    svc.assertOwnership(session, req.user);

    const InterviewAnswer = require('../models/InterviewAnswer');
    const answers = await InterviewAnswer.find({ session: session._id })
      .populate('question', 'text topic difficulty isFollowUp order expectedConcepts expectedAnswer')
      .sort({ submittedAt: 1 })
      .lean();

    const questionAnalysis = answers.map((a) => ({
      question: a.question?.text,
      topic: a.question?.topic,
      difficulty: a.question?.difficulty,
      isFollowUp: a.question?.isFollowUp,
      expectedAnswer: a.question?.expectedAnswer,
      expectedConcepts: a.question?.expectedConcepts,
      answer: a.text,
      answerType: a.answerType,
      score: a.evaluation?.overall ?? null,
      correctness: a.evaluation?.correctness ?? null,
      depth: a.evaluation?.depth ?? null,
      clarity: a.evaluation?.clarity ?? null,
      verdict: a.evaluation?.verdict ?? null,
      strengths: a.evaluation?.strengths ?? [],
      missingConcepts: a.evaluation?.missingConcepts ?? [],
      feedback: a.evaluation?.detailedFeedback || a.evaluation?.feedback || '',
    }));

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          topics: session.topics,
          difficulty: session.difficulty,
          experienceLevel: session.experienceLevel,
          mode: session.mode,
          status: session.status,
          totalQuestions: session.totalQuestions,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        },
        report: session.finalReport || null,
        questions: questionAnalysis,
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      return res.status(err.statusCode).json({ success: false, message: err.message, data: { code: err.code } });
    }
    console.error('[interview] report error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load the interview report.' });
  }
};
