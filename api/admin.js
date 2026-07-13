// goblub 관리자 API — 구글 ID 토큰을 서버에서 검증하고, 관리자 이메일(ADMIN_EMAILS)만 허용.
// actions: stats(요약+최근 이벤트) / users(회원 목록) / grant(젬리 지급) / ban / unban
import { kv, kvPipe, kvConfigured, verifyGoogleToken, isAdmin } from "../lib/kv.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

function kstDay(offset) {
  const d = new Date(Date.now() + 9 * 3600e3 - offset * 86400e3);
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

  const { id_token, action } = req.body || {};
  const g = await verifyGoogleToken(id_token);
  if (!g) return res.status(401).json({ error: "bad_token" });
  if (!isAdmin(g.email)) return res.status(403).json({ error: "not_admin" });

  try {
    if (action === "stats") {
      const days = [0, 1, 2, 3, 4, 5, 6].map(kstDay);
      const results = await kvPipe([
        ["SCARD", "users"],
        ...days.map((d) => ["GET", "cnt:signup:" + d]),
        ...days.map((d) => ["GET", "cnt:unlock:" + d]),
        ["LRANGE", "ev", 0, 49],
      ]);
      const total = +results[0] || 0;
      const signups = results.slice(1, 8).map((x) => +x || 0);
      const unlocks = results.slice(8, 15).map((x) => +x || 0);
      const events = (results[15] || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({
        ok: true, total,
        signupToday: signups[0], signup7: signups.reduce((a, b) => a + b, 0),
        unlockToday: unlocks[0], unlock7: unlocks.reduce((a, b) => a + b, 0),
        events,
      });
    }

    if (action === "users") {
      const subs = (await kv("SMEMBERS", "users")) || [];
      if (!subs.length) return res.status(200).json({ ok: true, users: [] });
      const capped = subs.slice(0, 500);
      const raws = await kvPipe(capped.map((s) => ["GET", "u:" + s]));
      const users = raws
        .map((r2) => { try { return r2 ? JSON.parse(r2) : null; } catch { return null; } })
        .filter(Boolean)
        .sort((a, b) => (b.seen || 0) - (a.seen || 0))
        .map((u) => ({ sub: u.sub, email: u.email, name: u.name, created: u.created, seen: u.seen, gems: u.gems || 0, banned: !!u.banned }));
      return res.status(200).json({ ok: true, users, truncated: subs.length > 500 });
    }

    if (action === "grant" || action === "ban" || action === "unban") {
      const sub = String((req.body && req.body.sub) || "");
      if (!sub || sub.length > 64) return res.status(400).json({ error: "bad_sub" });
      const key = "u:" + sub;
      const raw = await kv("GET", key);
      if (!raw) return res.status(404).json({ error: "no_user" });
      let u; try { u = JSON.parse(raw); } catch { return res.status(500).json({ error: "corrupt" }); }

      if (action === "grant") {
        const n = Math.floor(Number(req.body && req.body.amount));
        if (!Number.isFinite(n) || n <= 0 || n > 100000) return res.status(400).json({ error: "bad_amount" });
        u.gems = (u.gems || 0) + n;
        await kvPipe([
          ["SET", key, JSON.stringify(u)],
          ["LPUSH", "ev", JSON.stringify({ t: "grant", email: u.email, n, at: Date.now() })],
          ["LTRIM", "ev", 0, 499],
        ]);
        return res.status(200).json({ ok: true, gems: u.gems });
      }
      u.banned = action === "ban";
      await kvPipe([
        ["SET", key, JSON.stringify(u)],
        ["LPUSH", "ev", JSON.stringify({ t: action, email: u.email, at: Date.now() })],
        ["LTRIM", "ev", 0, 499],
      ]);
      return res.status(200).json({ ok: true, banned: u.banned });
    }

    return res.status(400).json({ error: "bad_action" });
  } catch (e) {
    return res.status(502).json({ error: "kv_error" });
  }
}
