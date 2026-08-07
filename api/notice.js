// 공개 공지 조회 — 홈이 GET 으로 읽어 팝업을 띄운다.
// admin.js 의 nsave/ntoggle/ndel 이 "notices" 키(JSON 배열)를 관리한다.
// 켜져 있고(on) 종료일(until, KST)이 지나지 않은 공지만 내려준다.
import { kv, kvConfigured } from "../lib/kv.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!kvConfigured()) return res.status(200).json({ notices: [] });

  try {
    let list = [];
    try { list = JSON.parse((await kv("GET", "notices")) || "[]"); } catch {}
    const todayKst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    const active = list
      .filter((n) => n.on && (!n.until || n.until >= todayKst))
      .map((n) => ({ id: n.id, title: n.title, body: n.body, mode: n.mode }));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ notices: active });
  } catch {
    return res.status(200).json({ notices: [] });
  }
}
