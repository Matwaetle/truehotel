export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt must be a string.' });
  }

  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt || normalizedPrompt.length > 4000) {
    return res.status(400).json({ error: 'prompt must contain 1 to 4000 characters.' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Server configuration is incomplete.' });
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://truehotel1234.vercel.app',
        'X-Title': 'TRUE REVIEW'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: normalizedPrompt }]
      }),
      signal: AbortSignal.timeout(30000)
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError';
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'The model request timed out.' : 'The model service is unavailable.'
    });
  }
}
