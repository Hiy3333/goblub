// 고블럽 도사 — AI 궁합 리포트 프록시.
// 두 사람의 사주(엔진 계산)와 궁합 점수를 검증해 Gemini에 해석만 맡긴다.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const GAN = "갑을병정무기경신임계";
const JI = "자축인묘진사오미신유술해";
const SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "나(일간)"];
const OHENG = ["목", "화", "토", "금", "수"];
const GRADES = ["천생연분", "찰떡궁합", "노력하면 꿀떡", "서로 배우는 사이", "파란만장 드라마"];

const SYSTEM = `당신은 '고블럽 도사'입니다. 나쁜 감정을 먹어주는 몬스터 '고블럽'들의 스승이며, 수백 년간 사주명리를 공부한 따뜻하고 유머 있는 도사입니다. 지금은 두 사람의 궁합을 봐주는 자리입니다. 존댓말을 쓰고, 어려운 용어는 쉽게 풀어 말합니다.

[절대 규칙 — 사실성]
1. 당신은 사주와 궁합 점수를 계산하지 않습니다. 사용자가 보내는 JSON 데이터(두 사람의 사주 a·b, 궁합 점수 score)가 유일한 사실입니다.
2. 데이터에 없는 간지·십성·수치를 절대 언급하지 마세요. score의 점수·등급·관계유형(천간합/상생/육합/충 등)을 바꾸지 마세요.
3. 해석 문장마다 근거 데이터를 자연스럽게 명시하세요. 예: "나의 일지 사(巳)와 상대의 일지 신(申)이 육합이라 …".
4. 특정 시점의 사건 예언, 이별·결혼에 대한 단정은 금지입니다. 재미와 덕담의 톤을 유지하세요.

[출력 형식 — 고정]
아래 5개 섹션을 이 순서로, 각 섹션은 이모지 소제목 한 줄 + 본문 문단. 마크다운 문법은 쓰지 않습니다.
💞 첫인상 케미
🔥 불붙는 지점
🌧 부딪히는 지점
🤝 화해 공식
🧙 도사의 연애 처방

- 전체 분량 600~900자.
- 마지막 줄에 "궁합은 재미로, 사랑은 두 사람의 몫으로. — 고블럽 도사"를 넣습니다.`;

function validGanji(s) {
  return typeof s === "string" && s.length === 2 && GAN.includes(s[0]) && JI.includes(s[1]);
}
function validPillar(p) {
  return !!p && validGanji(p.ganji) && SIPSEONG.includes(p.ganSipseong) && SIPSEONG.includes(p.jiSipseong);
}
function validSaju(saju) {
  if (!saju || typeof saju !== "object") return false;
  const P = saju.pillars;
  if (!P || !validPillar(P.year) || !validPillar(P.month) || !validPillar(P.day)) return false;
  if (P.hour != null && !validPillar(P.hour)) return false;
  if (typeof saju.ilgan !== "string" || !GAN.includes(saju.ilgan)) return false;
  if (!saju.oheng || !OHENG.every((k) => typeof saju.oheng[k] === "number")) return false;
  return true;
}
function validate(g) {
  if (!g || typeof g !== "object") return false;
  if (!validSaju(g.a) || !validSaju(g.b)) return false;
  const s = g.score;
  if (!s || !Number.isFinite(s.total) || s.total < 0 || s.total > 100) return false;
  if (!GRADES.includes(s.grade)) return false;
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

  const gunghap = req.body && req.body.gunghap;
  if (!validate(gunghap)) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "다음은 만세력 엔진이 계산한 두 사람의 사주(a=나, b=상대)와 궁합 점수입니다. 규칙에 따라 궁합을 풀이해 주세요.\n" +
        JSON.stringify(gunghap),
      maxTokens: 1800,
      temperature: 0.85,
    });
    if (!wrote) res.write("\n[도사님이 이 궁합에는 말을 아끼시네요. 다시 시도해 주세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
