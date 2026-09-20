'use strict';

/**
 * Comprehensive Analytics Service
 * Handles analytics for all 4 domains: DSA, SQL, Aptitude, Mock Interviews.
 * All values computed from real user data.
 */

const Submission = require('../models/Submission');
const SQLSubmission = require('../models/SQLSubmission');
const AptitudeSubmission = require('../models/AptitudeSubmission');
const InterviewSession = require('../models/InterviewSession');
const { HEATMAP_INTENSITY } = require('./ml/featureEngineering');

function dateStr(d) {
  const x = new Date(d);
  return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0') + '-' + String(x.getUTCDate()).padStart(2, '0');
}

function safeDiv(a, b) {
  return b > 0 ? a / b : 0;
}

function computeIntensity(count) {
  if (count === 0) return HEATMAP_INTENSITY.empty;
  if (count === 1) return HEATMAP_INTENSITY.low;
  if (count <= 3) return HEATMAP_INTENSITY.medium.min;
  if (count <= 5) return HEATMAP_INTENSITY.high.min;
  return HEATMAP_INTENSITY.veryHigh.min;
}

function computeStreaks(sortedDescDates) {
  if (!sortedDescDates.length) return { currentStreak: 0, maxStreak: 0 };
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = dateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateStr(yesterday);
  let cursor = null;
  if (sortedDescDates[0] === todayStr) cursor = new Date(today);
  else if (sortedDescDates[0] === yesterdayStr) cursor = yesterday;
  if (cursor) {
    for (const ds of sortedDescDates) {
      if (dateStr(cursor) === ds) { currentStreak += 1; cursor.setDate(cursor.getDate() - 1); } else break;
    }
  }
  let maxStreak = 0, temp = 0, prev = null;
  for (const ds of sortedDescDates) {
    if (prev) { const a = new Date(prev), b = new Date(ds); temp = Math.round((a - b) / 86400000) === 1 ? temp + 1 : 1; } else temp = 1;
    maxStreak = Math.max(maxStreak, temp);
    prev = ds;
  }
  return { currentStreak, maxStreak };
}

function buildHeatmap(events, days) {
  days = days || 365;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);
  const heatmap = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    heatmap[dateStr(d)] = { count: 0, intensity: 0 };
  }
  const activeDates = [];
  events.forEach((ev) => {
    const ds = typeof ev.date === 'string' ? ev.date : dateStr(ev.date);
    if (heatmap[ds]) {
      heatmap[ds].count += (ev.intensity || 1);
      heatmap[ds].intensity = computeIntensity(heatmap[ds].count);
      if (ev.accepted) activeDates.push(ds);
    }
  });
  const uniqueActive = [...new Set(activeDates)].sort().reverse();
  const streaks = computeStreaks(uniqueActive);
  return { heatmap, currentStreak: streaks.currentStreak, maxStreak: streaks.maxStreak };
}

async function computeMonthly(userIdOrEvents, domainOrEventType) {
  // Support both (userId, domain) and (events, eventType) signatures.
  let events;
  let eventType;
  if (typeof userIdOrEvents === 'string' || typeof userIdOrEvents === 'object' && userIdOrEvents !== null && typeof userIdOrEvents === 'object' && !Array.isArray(userIdOrEvents) && 'createdAt' in userIdOrEvents) {
    events = userIdOrEvents;
    eventType = domainOrEventType;
  } else {
    const userId = userIdOrEvents;
    const domain = domainOrEventType;
    const Submission = require('../models/Submission');
    const SQLSubmission = require('../models/SQLSubmission');
    const AptitudeSubmission = require('../models/AptitudeSubmission');
    const InterviewSession = require('../models/InterviewSession');
    let docs = [];
    if (domain === 'dsa' || domain === 'sql' || domain === 'aptitude') {
      const CatModel = domain === 'sql' ? SQLSubmission : (domain === 'aptitude' ? AptitudeSubmission : Submission);
      const match = domain === 'sql' ? { user: userId } : { user: userId, category: domain };
      docs = await CatModel.find(match).select('createdAt status topics problem difficulty totalQuestions correct').lean();
    } else if (domain === 'mock-interview') {
      docs = await InterviewSession.find({ user: userId, status: 'completed' }).select('createdAt').lean();
    }
    if (domain === 'sql') {
      events = docs.map(d => ({ date: d.createdAt, problemId: d.problem?.toString(), accepted: d.status === 'accepted', intensity: 1 }));
      eventType = 'sql';
    } else if (domain === 'dsa') {
      events = docs.map(d => ({ date: d.createdAt, problemId: d.problem?.toString(), accepted: d.status === 'accepted', intensity: 1 }));
      eventType = 'dsa';
    } else if (domain === 'aptitude') {
      events = docs.map(d => ({ date: d.createdAt, questionId: d._id.toString(), correct: d.correct > 0, intensity: 1 }));
      eventType = 'aptitude';
    } else if (domain === 'mock-interview') {
      events = docs.map(d => ({ date: d.createdAt, accepted: true, intensity: 1 }));
      eventType = 'interview';
    } else {
      events = [];
      eventType = domain;
    }
  }
  return computeMonthlyFromEvents(events, eventType);
}
function computeMonthlyFromEvents(events, eventType) {
  const monthMap = {};
  const activeDays = new Set();
  events.forEach((ev) => {
    const d = new Date(ev.date);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthMap[key]) monthMap[key] = {
      month: String(d.getMonth() + 1),
      year: d.getFullYear(),
      solved: 0,
      attempted: new Set(),
      submissions: 0,
      accepted: 0,
      activeDates: new Set()
    };
    const m = monthMap[key];
    m.activeDates.add(dateStr(d));
    activeDays.add(dateStr(d));
    if (eventType === 'sql' || eventType === 'dsa') {
      m.submissions += 1;
      if (ev.accepted) { m.accepted += 1; m.solved += 1; }
      m.attempted.add(ev.problemId);
    } else if (eventType === 'aptitude') {
      m.attempted.add(ev.questionId);
      if (ev.correct) m.accepted += 1;
    } else if (eventType === 'interview') {
      m.solved += 1;
    }
  });
  const months = Object.keys(monthMap).map((key) => {
    const m = monthMap[key];
    return {
      month: m.month,
      year: m.year,
      solved: m.solved,
      attempted: m.attempted.size,
      submissions: m.submissions,
      accepted: m.accepted,
      acceptanceRate: m.submissions > 0 ? Math.round((m.accepted / m.submissions) * 100) : 0,
      activeDays: m.activeDates.size
    };
  }).sort((a, b) => b.year - a.year || b.month - a.month);
  return { months, activeDays: activeDays.size };
}
  const activeDays = new Set();
  events.forEach((ev) => {
    const d = new Date(ev.date);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthMap[key]) monthMap[key] = { month: String(d.getMonth() + 1), year: d.getFullYear(), solved: 0, attempted: new Set(), submissions: 0, accepted: 0, activeDates: new Set() };
    const m = monthMap[key];
    m.activeDates.add(dateStr(d));
    activeDays.add(dateStr(d));
    if (eventType === 'sql' || eventType === 'dsa') {
      m.submissions += 1;
      if (ev.accepted) { m.accepted += 1; m.solved += 1; }
      m.attempted.add(ev.problemId);
    } else if (eventType === 'aptitude') {
      m.attempted.add(ev.questionId);
      if (ev.correct) m.accepted += 1;
    } else if (eventType === 'interview') {
      m.solved += 1;
    }
  });
  const months = Object.keys(monthMap).map((key) => {
    const m = monthMap[key];
    return { month: m.month, year: m.year, solved: m.solved, attempted: m.attempted.size, submissions: m.submissions, accepted: m.accepted, acceptanceRate: m.submissions > 0 ? Math.round((m.accepted / m.submissions) * 100) : 0, activeDays: m.activeDates.size };
  }).sort((a, b) => b.year - a.year || b.month - a.month);
  return { months, activeDays: activeDays.size };
}

module.exports = { dateStr, safeDiv, HEATMAP_INTENSITY, buildHeatmap, computeIntensity, computeStreaks, computeMonthly, computeMonthlyFromEvents };
