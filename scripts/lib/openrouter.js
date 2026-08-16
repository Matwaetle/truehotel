import 'dotenv/config';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function requireOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error('OPENROUTER_API_KEY is missing. Add it to the local .env file; do not commit that file.');
  }
  return key;
}

export function parseJsonContent(content) {
  const cleaned = String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

export async function requestJson({ model, messages, maxTokens = 4000, reasoningEffort = 'low' }) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireOpenRouterKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://truehotel1234.vercel.app',
      'X-Title': 'TRUE REVIEW data pipeline'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      reasoning: { effort: reasoningEffort, exclude: true }
    }),
    signal: AbortSignal.timeout(180000)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.error?.message || JSON.stringify(payload) || response.statusText;
    throw new Error(`OpenRouter ${response.status}: ${detail}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned no message content.');
  }

  return parseJsonContent(content);
}

export async function withRetry(operation, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
