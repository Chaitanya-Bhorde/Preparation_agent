/**
 * interviewController — HTTP layer for the AI Mock Interview feature.
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

// GET /api/interview/fields — selectable interview fields grouped by category
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

// POST /api/interview/sessions — create + start (returns first question)
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

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        question: question && {
          id: question._id,
          text: question.text,
          topic: question.topic,
          difficulty: question.difficulty,
          isFollowUp: question.isFollowUp,
        },
      },
    });
  } catch (err) {
    if (err instanceof svc.SessionError) {
      const data = err.code === 'ACTIVE_SESSION_EXISTS'
        ? { code: err.code, existingSessionId: err.existingSessionId }
        : { code: err.code };
      return res.status(err.statusCode).json({ success: false, message: err.message, data });
    }
    console.error('[interview] create session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not start the interview. Please try again.' });
  }
};

// GET /api/interview/sessions/active — resume support
exports.getActiveSession = async (req, res) => {
  try {
    const session = await svc.findActiveSession(req.user.id);
    if (!session) return res.json({ success: true, data: { session: null } });
    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          topics: session.topics,
          difficulty: session.difficulty,
          experienceLevel: session.experienceLevel,
          mode: session.mode,
          totalQuestions: session.totalQuestions,
          status: session.status,
          startedAt: session.startedAt,
          lastActivityAt: session.lastActivityAt,
        },
      },
    });
  } catch (err) {
    console.error('[interview] active session error:', err.message);
    res.status(500).json({ success: false, message: 'Could not look up your interviews.' });
  }
};

// GET /api/interview/sessions/:id — session state (restore/refresh safe)
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

// POST /api/interview/sessions/:id/start — (re)start a CREATED session
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
        sessionId: updated._id,
        status: updated.status,
        question: question && {
          id: question._id,
          text: question.text,
          topic: question.topic,
          difficulty: question.difficulty,
          isFollowUp: question.isFollowUp,
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

// POST /api/interview/sessions/:id/answer — evaluate + advance
exports.submitAnswer = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id.' });
    }
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });

    const { questionId, answer, answerType, durationSeconds } = req.body;
    const result = await svc.submitAnswer(session, req.user, {
      questionId,
      text: sanitizeAnswer(answer),
      answerType: answerType === 'voice' ? 'voice' : 'text',
      durationSeconds,
    });

    res.json({
      success: true,
      data: {
        evaluation: {
          overall: result.evaluation.overall,
          verdict: result.evaluation.verdict,
          feedback: result.evaluation.feedback,
          strengths: result.evaluation.strengths,
        },
        nextQuestion: result.nextQuestion || null,
        completed: Boolean(result.completed),
        report: result.report || null,
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

// POST /api/interview/sessions/:id/complete — finalize + report
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

// GET /api/interview/sessions/:id/report — final report
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
