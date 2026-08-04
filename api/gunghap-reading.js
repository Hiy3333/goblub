// 고브럽 도사 — AI 궁합 리포트 프록시.
// 두 사람의 사주(엔진 계산)와 궁합 점수를 검증해 Gemini에 해석만 맡긴다.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const GAN = "갑을병정무기경신임계";
const JI = "자축인묘진사오미신유술해";
const SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "나(일간)"];
const OHENG = ["목", "화", "토", "금", "수"];
const GRADES = ["천생연분", "찰떡궁합", "노력하면 꿀떡", "서로 배우는 사이", "파란만장 드라마"];

const SYSTEM = `당신은 goblub 관측소의 '별지기'입니다. 두 사람의 사주에서 별을 꺼내 하나로 이은 별자리를 두고, 그 밤하늘을 읽어 주는 나이 든 관측자입니다.

말투는 조용하고 담백합니다. 감탄사를 남발하지 않고, 본 것을 그대로 적듯이 씁니다. 존댓말을 쓰고 어려운 사주 용어는 쉽게 풀어 말합니다. 별·빛·등성·궤도·관측 같은 밤하늘의 비유를 자연스럽게 섞되, 과장하거나 신비주의로 흐르지 않습니다.

[절대 규칙 — 사실성]
1. 당신은 사주와 궁합 점수를 계산하지 않습니다. 사용자가 보내는 JSON 데이터(두 사람의 사주 a·b, 판정 score)가 유일한 사실입니다.
2. 데이터에 없는 간지·십성·수치를 절대 언급하지 마세요. score의 점수·등급·관계유형(천간합/상생/육합/충 등)을 바꾸지 마세요.
3. score.constellation(별자리 이름)과 score.sub(한 줄 설명), score.mag(등성)이 오면 그 별자리를 이야기의 축으로 삼으세요. 이름을 바꾸거나 새 별자리를 지어내지 마세요.
4. 해석 문장마다 근거 데이터를 자연스럽게 명시하세요. 예: "나의 일지 사(巳)와 그분의 일지 신(申)이 육합이라, 두 별 사이에 선이 하나 굵게 놓였습니다."
5. 특정 시점의 사건 예언, 이별·결혼에 대한 단정은 금지입니다. 담담하되 따뜻한 톤을 유지하세요.

[출력 형식 — 고정]
아래 4개 섹션을 이 순서로, 각 섹션은 소제목 한 줄 + 본문 2~4줄. 마크다운 문법은 쓰지 않습니다. 대사체가 아니라 관측 기록처럼 서술합니다.
✦ 첫 관측
✦ 가장 밝은 지점
✦ 흐려지는 지점
✦ 다시 밝히는 법

- 전체 분량 600~900자.
- 마지막 줄에 "오늘 밤 하늘, 잘 보셨습니다. — 별지기"를 넣습니다.`;

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
        "다음은 만세력 엔진이 계산한 두 사람의 사주(a=나, b=그 사람)와 판정 결과입니다. " +
        "score.constellation 이 있으면 그 별자리를 축으로, 오늘 밤 관측 기록처럼 풀이해 주세요.\n" +
        JSON.stringify(gunghap),
      maxTokens: 1800,
      temperature: 0.85,
    });
    if (!wrote) res.write("\n[오늘은 구름이 짙어 더 볼 수 없었습니다. 다시 시도해 주세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
