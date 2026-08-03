const MockInterview = require('../models/MockInterview');
const axios = require('axios');

const INTERVIEW_PROMPT = (topic, level) => `You are a technical interviewer for a placement preparation platform. 
Interview level: ${level || 'beginner'}
Topics covered: ${topic || 'DSA, SQL, Aptitude, System Design, OOP'}

IMPORTANT: Respond ONLY with valid JSON, no markdown, no preamble.

Generate an interview question and response in this format:
{
  "question": "The interview question to ask the candidate",
  "expectedAnswer": "What a good answer would include",
  "hints": ["hint 1", "hint 2"],
  "category": "technical/hr/behavioral"
}

Rules:
- Ask one question at a time
- Questions should be appropriate for ${level || 'beginner'} level
- Cover ${topic || 'general technical topics'}
- Be conversational, as if speaking to the candidate`;

const EVALUATE_PROMPT = (question, answer, context) => `You are evaluating a candidate's interview answer. 
Question asked: "${question}"
Candidate's answer: "${answer}"

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "score": 0-10,
  "feedback": "Constructive feedback on the answer",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestedImprovement": "How to improve this answer",
  "nextQuestion": "Follow-up question based on this answer",
  "isComplete": false
}

If isComplete is true, the interview is over and provide a summary instead of nextQuestion.`;

const callLLM = async (prompt) => {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  if (!groqApiKey) {
    // Fallback used when no LLM key is configured (dev/test). Return the shape
    // matching the prompt so start/answer flows both work without a key.
    if (prompt.includes("You are evaluating a candidate's interview answer")) {
      return {
        score: 8,
        feedback: 'Good structured answer. You covered the key trade-offs clearly. Adding a concrete project example would strengthen it.',
        strengths: ['Clear reasoning', 'Mentions complexity trade-offs'],
        weaknesses: ['Could be more concise', 'Add a real-world example'],
        suggestedImprovement: 'Give a specific project example and quantify the result.',
        nextQuestion: 'How would you handle collisions in a hash table?',
        isComplete: false,
      };
    }
    return {
      question: "What is the difference between an array and a linked list?",
      expectedAnswer: "Arrays have O(1) access but fixed size, linked lists have O(n) access but dynamic size.",
      hints: ["Think about memory allocation", "Consider insertion/deletion operations"],
      category: "technical",
    };
  }

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }, {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const content = response.data.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse LLM response:', e.message);
      throw new Error('Failed to parse interview response');
    }
  } catch (error) {
    console.error('LLM call failed:', error.message);
    throw error;
  }
};

exports.startInterview = async (req, res) => {
  try {
    const { topic, level } = req.body;
    const prompt = INTERVIEW_PROMPT(topic || 'DSA, SQL, Aptitude, System Design', level || 'beginner');
    const result = await callLLM(prompt);

    const interview = await MockInterview.create({
      user: req.user.id,
      rating: 0,
      score: 0,
      feedback: JSON.stringify({ questions: [], currentQuestion: result.question, topic, level }),
    });

    res.status(200).json({
      success: true,
      data: {
        interviewId: interview._id,
        question: result.question,
        hints: result.hints || [],
        category: result.category || 'technical',
        expectedAnswer: result.expectedAnswer,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId, question, answer, context } = req.body;
    if (!interviewId || !question || !answer) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const interview = await MockInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const prompt = EVALUATE_PROMPT(question, answer, context);
    const result = await callLLM(prompt);

    const feedback = JSON.parse(interview.feedback || '{}');
    feedback.questions = feedback.questions || [];
    feedback.questions.push({ question, answer, score: result.score, feedback: result.feedback });
    feedback.currentQuestion = result.nextQuestion || null;
    interview.feedback = JSON.stringify(feedback);
    interview.score = result.isComplete ? result.score : interview.score;
    await interview.save();

    res.status(200).json({
      success: true,
      data: {
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        suggestedImprovement: result.suggestedImprovement,
        nextQuestion: result.nextQuestion,
        isComplete: result.isComplete || false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInterviewResult = async (req, res) => {
  try {
    const interview = await MockInterview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const feedback = JSON.parse(interview.feedback || '{}');
    const totalScore = feedback.questions?.reduce((sum, q) => sum + (q.score || 0), 0) || 0;
    const avgScore = feedback.questions?.length > 0 ? Math.round(totalScore / feedback.questions.length) : 0;

    res.status(200).json({
      success: true,
      data: {
        interviewId: interview._id,
        score: avgScore,
        totalQuestions: feedback.questions?.length || 0,
        questions: feedback.questions || [],
        createdAt: interview.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};