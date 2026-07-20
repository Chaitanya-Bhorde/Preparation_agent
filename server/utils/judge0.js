const axios = require('axios');
const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  typescript: 74,
};
const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const judge0Client = axios.create({
  baseURL: JUDGE0_URL,
  headers: {
    'X-RapidAPI-Key': JUDGE0_API_KEY,
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json',
  },
});
exports.createSubmission = async (sourceCode, languageId, stdin = '') => {
  try {
    const response = await judge0Client.post('/submissions', {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
      wait: false,
    });
    return response.data;
  } catch (error) {
    console.error('Judge0 create submission error:', error.message);
    throw new Error('Failed to create submission');
  }
};
exports.getSubmissionResult = async (token) => {
  try {
    const response = await judge0Client.get(`/submissions/${token}`, {
      params: {
        base64_encoded: false,
        fields: 'stdout,stderr,status_id,status,time,memory,stdin,expected_output,stdout,compile_output,message',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Judge0 get submission error:', error.message);
    throw new Error('Failed to get submission result');
  }
};
exports.executeCode = async (sourceCode, language, testCases) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const results = [];
  for (const testCase of testCases) {
    try {
      const submission = await this.createSubmission(sourceCode, languageId, testCase.input);
      const token = submission.token;
      let result = null;
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await this.getSubmissionResult(token);
        if (result.status_id >= 3) break; 
      }
      if (!result) {
        results.push({
          passed: false,
          error: 'Execution timeout',
        });
        continue;
      }
      const passed =
        result.status_id === 3 && 
        result.stdout?.trim() === testCase.expectedOutput.trim();
      results.push({
        passed,
        output: result.stdout?.trim() || '',
        expectedOutput: testCase.expectedOutput,
        error: result.stderr || result.compile_output || null,
        status: result.status?.description || 'Unknown',
        executionTime: result.time || 0,
        memoryUsed: result.memory || 0,
      });
    } catch (error) {
      results.push({
        passed: false,
        error: error.message,
      });
    }
  }
  return results;
};
exports.LANGUAGE_IDS = LANGUAGE_IDS;