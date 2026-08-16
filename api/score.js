// api/score.js — 프론트는 이 엔드포인트만 호출. 키는 서버에만 존재.
export default async function handler(req, res) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [{ role: 'user', content: req.body.prompt }]
    })
  });
  res.status(200).json(await r.json());
}
