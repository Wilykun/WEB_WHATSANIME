// GET /api/stats — counter kunjungan + online via Upstash Redis REST (gratis).
//
// Frontend (public/script.js → initStats) sudah polling endpoint ini tiap 60 detik:
// kalau balikin { online, total } → footer-stats tampil lagi; kalau
// { unsupported: true } → tetap disembunyikan. Jadi tanpa env/Redis,
// web jalan persis seperti sekarang (tidak ada yang rusak).
//
// Env yang dibutuhkan (di-set di Vercel → Settings → Environment Variables):
//   UPSTASH_REDIS_REST_URL    — mis. https://xxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN  — token REST dari dashboard Upstash
// Buat gratis ~2 menit di https://console.upstash.com → Create Database → Redis.
//
// Pola online: sorted-set "wwa:online" berisi sessionId → skor = timestamp ms.
// Tiap poll: ZADD (heartbeat), ZREMRANGEBYSCORE (buang yang >90 dtk basi),
// ZCARD (hitung yang online). Total kunjungan: INCR "wwa:total" hanya untuk
// sesi baru (dikenali via cookie wwa_sid), jadi refresh/reconnect tidak
// menggelembungkan angka.

const crypto = require('crypto');

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function unsupported(res) {
  return res.json({ unsupported: true, online: null, total: null });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return unsupported(res); // belum dikonfigurasi → sembunyikan

  const cookies = parseCookies(req.headers.cookie);
  let sid = cookies.wwa_sid;
  const isNewSession = !sid;
  if (isNewSession) {
    sid = crypto.randomUUID();
    res.setHeader(
      'Set-Cookie',
      `wwa_sid=${sid}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
    );
  }

  const now = Date.now();
  const staleBefore = now - 90000; // sesi tanpa heartbeat >90 dtk dianggap offline

  const commands = [
    ['ZADD', 'wwa:online', String(now), sid],
    ['ZREMRANGEBYSCORE', 'wwa:online', '0', String(staleBefore)],
  ];
  if (isNewSession) commands.push(['INCR', 'wwa:total']);
  commands.push(['ZCARD', 'wwa:online'], ['GET', 'wwa:total']);

  try {
    const r = await fetch(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    const out = await r.json(); // [{result}, ...] sesuai urutan commands
    const results = out.map((x) => x.result);
    const online = Number(results[results.length - 2]) || 0;
    const total = Number(results[results.length - 1]) || 0;
    return res.json({ online, total, serverTime: new Date().toISOString() });
  } catch (e) {
    // Redis error / env salah → fallback aman: sembunyikan statistik
    return unsupported(res);
  }
};
