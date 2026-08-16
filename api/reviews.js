// api/reviews.js — 리뷰 조회(검색/사용자별/홈피드) + 작성
const SB = () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY
});

async function sb(path, opts = {}) {
  const { url, key } = SB();
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': key, 'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json', ...(opts.headers || {})
    }
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data;
}

const SELECT = 'id,platform,product,title,content,stars,reliability,created_at,users(id,nickname,bio)';

// 봇 의심 문구 기반 간이 채점 (OpenRouter 키 없을 때 폴백)
function heuristicScore(text) {
  const redFlags = ['완벽', '최고', '강력 추천', '인생', '무조건', '환상적', '꿈만 같'];
  const hits = redFlags.filter(w => text.includes(w)).length;
  const specifics = /[0-9]|층|분|시간|아쉬|단점|소음|가격|직원|조식|침구/.test(text) ? 25 : 0;
  return Math.max(5, Math.min(97, 80 - hits * 18 + specifics));
}

async function scoreReliability(product, content) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return heuristicScore(content);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: '리뷰가 실제 경험에 기반한 진짜 리뷰일 확률을 0-100으로 평가한다. 구체적 디테일(숫자, 시간, 단점, 상황 묘사)이 있으면 높게, 과장·일반론·광고성 문구가 반복되면 낮게 준다.',
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: { score: { type: 'integer' } },
              required: ['score'],
              additionalProperties: false
            }
          }
        },
        messages: [
          { role: 'user', content: `대상: ${product}\n리뷰: ${content.slice(0, 2000)}` }
        ]
      })
    });
    const data = await r.json();
    if (data.stop_reason === 'refusal') return heuristicScore(content);
    const text = (data.content || []).find(b => b.type === 'text')?.text;
    const s = parseInt(JSON.parse(text).score, 10);
    return Number.isFinite(s) ? Math.max(0, Math.min(100, s)) : heuristicScore(content);
  } catch {
    return heuristicScore(content);
  }
}

export default async function handler(req, res) {
  if (!SB().url || !SB().key) return res.status(500).json({ error: 'Supabase 환경변수가 없다' });

  try {
    if (req.method === 'GET') {
      const { product, userId, home, truster } = req.query;

      if (userId) { // 사용자 리뷰 내역 (스토리 3)
        const rows = await sb(`reviews?select=${SELECT}&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=50`);
        return res.status(200).json(rows);
      }
      if (product) { // 검색
        const q = encodeURIComponent(`%${product}%`);
        const rows = await sb(`reviews?select=${SELECT}&product=ilike.${q}&order=created_at.desc&limit=50`);
        return res.status(200).json(rows);
      }
      if (home) { // 홈 피드: 신뢰 사용자 우선
        let filter = '';
        if (truster) {
          const trusts = await sb(`trusts?select=trusted_user_id&truster=eq.${encodeURIComponent(truster)}`);
          const ids = trusts.map(t => t.trusted_user_id);
          if (ids.length) filter = `&user_id=in.(${ids.join(',')})`;
        }
        const rows = await sb(`reviews?select=${SELECT}${filter}&order=created_at.desc&limit=20`);
        return res.status(200).json(rows);
      }
      const rows = await sb(`reviews?select=${SELECT}&order=created_at.desc&limit=20`);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') { // 리뷰 작성
      const { nickname, platform, product, title, content, stars } = req.body || {};
      if (!nickname?.trim() || !product?.trim() || !title?.trim() || !content?.trim())
        return res.status(400).json({ error: 'nickname, product, title, content는 필수다' });
      const s = parseInt(stars, 10);
      if (!(s >= 1 && s <= 5)) return res.status(400).json({ error: 'stars는 1~5' });

      // 작성자 get-or-create
      let user = (await sb(`users?select=id&nickname=eq.${encodeURIComponent(nickname.trim())}`))[0];
      if (!user) {
        user = (await sb('users', {
          method: 'POST', headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify({ nickname: nickname.trim() })
        }))[0];
      }

      const reliability = await scoreReliability(product, content);
      const row = (await sb('reviews', {
        method: 'POST', headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: user.id, platform: (platform || '').slice(0, 50),
          product: product.trim().slice(0, 200), title: title.trim().slice(0, 200),
          content: content.trim().slice(0, 4000), stars: s, reliability
        })
      }))[0];
      return res.status(200).json({ ...row, users: { id: user.id, nickname: nickname.trim() } });
    }

    return res.status(405).json({ error: '허용되지 않은 메서드' });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
