// 이용 이벤트 기록 — 프리미엄 리포트 발급 등(향후 결제 이벤트 포함).
// 로그인 상태면 id_token으로 이메일을 붙이고, 아니면 익명 카운트만 남긴다.
import { kv, kvPipe, kvConfigured, verifyGoogleToken } from "../lib/kv.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];
const ITEMS = ["premium_report", "premium_report2"];

function today() {
  const d = new Date(Date.now() + 9 * 3600e3);
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

  const item = req.body && req.body.item;
  if (!ITEMS.includes(item)) return res.status(400).json({ error: "bad_item" });
  let email = "";
  if (req.body && req.body.id_token) {
    const g = await verifyGoogleToken(req.body.id_token);
    if (g) email = g.email;
  }
  try {
    await kvPipe([
      ["INCR", "cnt:unlock:" + today()],
      ["LPUSH", "ev", JSON.stringify({ t: "unlock", item, email: email || "(비로그인)", at: Date.now() })],
      ["LTRIM", "ev", 0, 499],
    ]);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "kv_error" });
  }
}
