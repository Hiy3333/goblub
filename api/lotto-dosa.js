// 고블럽 로또 도사 — 역대 당첨 통계 요약을 받아 유쾌한 분석 + 추천 조합을 스트리밍.
// 주의: 로또는 매 회차 독립 추첨이라 어떤 조합도 확률이 같음 — 프롬프트에 고지 의무를 강제(재미 콘텐츠).
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '고블럽 로또 도사'입니다. 역대 로또 6/45 당첨 통계를 펼쳐놓고 기운을 읽는 척하는 유쾌한 도사 캐릭터로, 존댓말을 씁니다.

[규칙]
1. 사용자가 보내는 통계 JSON(최다/최소 출현, 최근 흐름, 장기 미출현, 구간·홀짝 분포)이 유일한 근거입니다. 분석 문장마다 구체적인 숫자를 한 번 이상 인용하세요.
2. 분석은 4~6문장. 도사 말투로 재미있게, 하지만 통계는 정확하게 읽으세요(예: "34번은 184회나 나온 최고 인기 공…").
3. ★반드시 한 번은 "모든 조합의 당첨 확률은 수학적으로 똑같다"는 취지의 문장을 자연스럽게 넣으세요(재미로 보라는 당부). 당첨 보장·예측 단정 표현 금지.
4. 마지막 줄에 추천 조합을 정확히 이 형식으로 출력: @@PICK|n,n,n,n,n,n
   - 1~45 사이, 중복 없이 6개, 오름차순. 통계 근거(핫넘버+장기미출현 혼합 등)를 본문에서 설명한 조합이어야 합니다.
5. 마크다운 금지. @@PICK 뒤에는 아무것도 쓰지 마세요.`;

function isNumArr(a, len, min, max) {
  return Array.isArray(a) && (len == null || a.length <= len) &&
    a.every((v) => typeof v === "number" && v >= min && v <= max);
}

function validate(s) {
  if (!s || typeof s !== "object") return false;
  if (typeof s.latest !== "number" || s.latest < 100 || s.latest > 10000) return false;
  if (!Array.isArray(s.hot) || s.hot.length > 12) return false;
  if (!s.hot.every((x) => x && typeof x.n === "number" && x.n >= 1 && x.n <= 45 && typeof x.c === "number")) return false;
  if (!Array.isArray(s.cold) || s.cold.length > 12) return false;
  if (!s.cold.every((x) => x && typeof x.n === "number" && x.n >= 1 && x.n <= 45 && typeof x.c === "number")) return false;
  if (!Array.isArray(s.overdue) || s.overdue.length > 12) return false;
  if (!s.overdue.every((x) => x && typeof x.n === "number" && x.n >= 1 && x.n <= 45 && typeof x.gap === "number")) return false;
  if (!Array.isArray(s.recent) || s.recent.length > 12 || !s.recent.every((r) => isNumArr(r, 6, 1, 45))) return false;
  if (!isNumArr(s.zoneAvg, 5, 0, 6)) return false;
  if (typeof s.oddPct !== "number" || s.oddPct < 0 || s.oddPct > 100) return false;
  return true;
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
  if (!geminiConfigured()) return res.status(501).json({ error: "not_configured" });

  const stats = req.body && req.body.stats;
  if (!validate(stats)) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "역대 로또 6/45 당첨 통계 요약입니다(1회~최신 " + stats.latest + "회 전수 집계). " +
        "이 기운을 읽어 분석과 추천 조합을 주세요.\n" + JSON.stringify(stats),
      maxTokens: 1200,
      temperature: 0.9,
    });
    if (!wrote) res.write("도사님이 통계 두루마리를 놓쳤어요. 다시 시도해 주세요.");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
