/**
 * aiClient — the ONLY place that talks to the LLM provider.
 *
 * Design rules:
 *  - API keys come from server-side env vars (never from the frontend).
 *  - Every call requests strict JSON and returns a parsed JS object.
 *  - Timeouts + bounded retries so a hung provider can't stall an interview.
 *  - Malformed responses raise a typed AiServiceError the caller can handle.
 *  - Never logs keys or user answer content.
 */

const axios = require('axios');

const PROVIDER_URL =
  process.env.INTERVIEW_LLM_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.INTERVIEW_LLM_MODEL || 'llama-3.3-70b-versatile';
const TIMEOUT_MS = Number(process.env.INTERVIEW_LLM_TIMEOUT_MS || 30000);
const MAX_RETRIES = Number(process.env.INTERVIEW_LLM_MAX_RETRIES || 1);
const MAX_COMPLETION_TOKENS = Number(process.env.INTERVIEW_LLM_MAX_TOKENS || 1100);

class AiServiceError extends Error {
  constructor(message, { statusCode, providerError } = {}) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode || 502;
    this.providerError = providerError; // never surfaced to end users
  }
}

/** Extract the first balanced JSON object from arbitrary model text. */
function extractJsonObject(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function getApiKey() {
  return process.env.GROQ_API_KEY || process.env.LLM_API_KEY || null;
}

async function callJson(messages, { temperature = 0.4, maxTokens = MAX_COMPLETION_TOKENS } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AiServiceError('AI provider is not configured (missing API key).', {
      statusCode: 503,
    });
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        PROVIDER_URL,
        {
          model: MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: TIMEOUT_MS,
        }
      );

      const content = response?.data?.choices?.[0]?.message?.content;
      const parsed = extractJsonObject(content);
      if (!parsed) {
        throw new AiServiceError('Malformed AI response (invalid JSON).', { statusCode: 502 });
      }
      return parsed;
    } catch (err) {
      if (err instanceof AiServiceError && err.message.startsWith('Malformed')) {
        lastError = err;
      } else if (err.response) {
        lastError = new AiServiceError('AI provider returned an error.', {
          statusCode: 502,
          providerError: `${err.response.status}`,
        });
        // 4xx (bad key / bad request) will not improve on retry — stop early.
        if (err.response.status >= 400 && err.response.status < 500) break;
      } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        lastError = new AiServiceError('AI provider timed out.', { statusCode: 504 });
      } else {
        lastError = new AiServiceError('AI provider is unreachable.', { statusCode: 502 });
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError || new AiServiceError('AI request failed.', { statusCode: 502 });
}

module.exports = {
  AiServiceError,
  callJson,
  extractJsonObject,
  isConfigured: () => Boolean(getApiKey()),
};
