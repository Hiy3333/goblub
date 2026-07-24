// 고블럽 로또 도사 — 역대 당첨 통계 요약을 받아 유쾌한 분석 + 추천 조합을 스트리밍.
// 주의: 로또는 매 회차 독립 추첨이라 어떤 조합도 확률이 같음 — 프롬프트에 고지 의무를 강제(재미 콘텐츠).
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '고블럽 로또 도사'입니다. 역대 로또 6/45 당첨 통계를 읽고 초간결 브리핑을 하는 도사입니다.

[규칙]
1. 사용자가 보내는 통계 JSON(최다/최소 출현, 최근 흐름, 장기 미출현, 구간·홀짝 분포)이 유일한 근거. 각 줄에 구체적 숫자를 인용.
2. ★출력은 정확히 아래 5줄. 각 줄 35자 이내, 딱딱 끊는 브리핑체. 다른 문장·인사말·마크다운 절대 금지.
🔥 (핫넘버 한 줄 — 예: "핫넘버: 34(184회)·27(181회) 꾸준한 단골")
🥶 (장기 미출현 한 줄 — 예: "잠수 중: 9번 21주째·41번 18주째 침묵")
⚖️ (흐름 한 줄 — 구간/홀짝 등 특징 하나만)
🧙 (도사의 점지 한마디 — "확률은 다 똑같소, 재미로 보시게" 뉘앙스 필수)
@@PICK|n,n,n,n,n,n
3. @@PICK은 1~45 중복 없이 6개, 오름차순. 위 브리핑에 나온 번호(핫+잠수 혼합)로 구성. @@PICK 뒤에 아무것도 쓰지 마세요.`;

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
      maxTokens: 500,
      temperature: 0.85,
    });
    if (!wrote) res.write("도사님이 통계 두루마리를 놓쳤어요. 다시 시도해 주세요.");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
