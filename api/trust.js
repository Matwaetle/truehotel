// api/trust.js — 신뢰하는 사용자(즐겨찾기) 조회/등록/해제
async function sb(path, opts = {}) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: 'Supabase 환경변수가 없다' });

  try {
    if (req.method === 'GET') {
      const truster = (req.query.truster || '').trim();
      if (!truster) return res.status(400).json({ error: 'truster가 필요하다' });
      const rows = await sb(`trusts?select=trusted_user_id,users:trusted_user_id(id,nickname,bio)&truster=eq.${encodeURIComponent(truster)}`);
      return res.status(200).json(rows.map(r => r.users));
    }

    if (req.method === 'POST') {
      const { truster, trustedUserId, trust } = req.body || {};
      if (!truster?.trim() || !trustedUserId)
        return res.status(400).json({ error: 'truster, trustedUserId가 필요하다' });

      if (trust === false) {
        await sb(`trusts?truster=eq.${encodeURIComponent(truster.trim())}&trusted_user_id=eq.${trustedUserId}`, { method: 'DELETE' });
        return res.status(200).json({ trusted: false });
      }
      await sb('trusts', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ truster: truster.trim(), trusted_user_id: trustedUserId })
      });
      return res.status(200).json({ trusted: true });
    }

    return res.status(405).json({ error: '허용되지 않은 메서드' });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
