// 밸런스 게임 전국 통계 — Upstash Redis REST (의존성 없이 fetch 사용).
// Vercel 마켓플레이스 Upstash 연결 시 KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN 이 설정됨.

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const MAX_QID = 30;

function redisEnv() {
  const e = process.env;
  // 1) 표준 이름 우선
  const pairs = [
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ];
  for (const [u, t] of pairs) if (e[u] && e[t]) return { url: e[u], token: e[t] };
  // 2) 커스텀 접두사 대응: *REST_API_URL 과 짝이 되는 *REST_API_TOKEN(읽기전용 제외) 탐색
  const urlKey = Object.keys(e).find((k) => /REST_API_URL$/.test(k) && e[k]);
  if (urlKey) {
    const tokenKey = urlKey.replace(/REST_API_URL$/, "REST_API_TOKEN");
    if (e[tokenKey]) return { url: e[urlKey], token: e[tokenKey] };
  }
  return null;
}

async function redis(cmd) {
  const env = redisEnv();
  const r = await fetch(env.url, {
    method: "POST",
    headers: { Authorization: "Bearer " + env.token, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
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
  if (!redisEnv()) return res.status(501).json({ error: "not_configured" });

  const b = req.body || {};
  const qid = Number(b.id);
  const pick = b.pick; // "a" | "b" | null(조회만 — 재방문 중복 집계 방지)
  if (!Number.isInteger(qid) || qid < 1 || qid > MAX_QID || (pick !== "a" && pick !== "b" && pick !== null)) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const key = "goblub:balance:" + qid;
    if (pick) await redis(["HINCRBY", key, pick, "1"]);
    const flat = (await redis(["HGETALL", key])) || [];
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]) || 0;
    return res.status(200).json(counts);
  } catch (err) {
    return res.status(502).json({ error: "busy" });
  }
}
