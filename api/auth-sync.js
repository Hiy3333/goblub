// 구글 로그인 회원 동기화 — 로그인 성공 시 클라이언트가 호출.
// 회원 등록/갱신, 강퇴(밴) 여부, 관리자가 지급한 대기 젬리 수령을 처리한다.
import { kv, kvPipe, kvConfigured, verifyGoogleToken } from "../lib/kv.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

function today() {
  const d = new Date(Date.now() + 9 * 3600e3); // KST
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!kvConfigured()) return res.status(501).json({ error: "not_configured" });

  const idToken = req.body && req.body.id_token;
  const g = await verifyGoogleToken(idToken);
  if (!g) return res.status(401).json({ error: "bad_token" });

  try {
    const key = "u:" + g.sub;
    const raw = await kv("GET", key);
    let u = null;
    try { u = raw ? JSON.parse(raw) : null; } catch { u = null; }
    const now = Date.now();
    let pendingGems = 0;
    if (!u) {
      u = { sub: g.sub, email: g.email, name: g.name, pic: g.picture, created: now, seen: now, gems: 0, banned: false };
      await kvPipe([
        ["SET", key, JSON.stringify(u)],
        ["SADD", "users", g.sub],
        ["INCR", "cnt:signup:" + today()],
        ["LPUSH", "ev", JSON.stringify({ t: "signup", email: g.email, at: now })],
        ["LTRIM", "ev", 0, 499],
      ]);
    } else {
      if (u.banned) return res.status(200).json({ ok: true, banned: true });
      u.email = g.email; u.name = g.name; u.pic = g.picture; u.seen = now;
      pendingGems = u.gems > 0 ? u.gems : 0;
      if (pendingGems > 0) u.gems = 0;
      await kv("SET", key, JSON.stringify(u));
    }
    return res.status(200).json({ ok: true, banned: false, pendingGems });
  } catch (e) {
    return res.status(502).json({ error: "kv_error" });
  }
}
