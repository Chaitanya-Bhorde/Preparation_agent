/** One-off AI connectivity probe. Usage: node scripts/probe-ai.js */
require('dotenv').config();
const axios = require('axios');

const url = process.env.INTERVIEW_LLM_URL || 'https://api.groq.com/openai/v1/chat/completions';
const model = process.env.INTERVIEW_LLM_MODEL || 'openai/gpt-oss-120b';
const key = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;

axios
  .post(
    url,
    {
      model,
      messages: [{ role: 'user', content: 'Reply with JSON {"ok":true}' }],
      temperature: 0.2,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    },
    { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 20000 }
  )
  .then((r) => console.log('RAW_OK', JSON.stringify(r.data.choices[0].message).slice(0, 300)))
  .catch((e) => {
    console.log('RAW_ERR status=', e.response?.status);
    console.log('RAW_ERR body=', JSON.stringify(e.response?.data).slice(0, 500));
  });
