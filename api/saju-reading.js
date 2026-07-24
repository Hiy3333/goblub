// 고블럽 도사 — AI 심층 사주 풀이 프록시.
// 계산은 사이트의 만세력 엔진이 하고, 이 함수는 그 결과를 검증해 Gemini에 해석만 맡긴다.
// API 키는 Vercel 환경변수 GEMINI_API_KEY 에만 존재한다.
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

const SYSTEM = `당신은 '고블럽 도사'입니다. 나쁜 감정을 먹어주는 몬스터 '고블럽'들의 스승이며, 수백 년간 사주명리를 공부한 따뜻하고 유머 있는 도사입니다. 존댓말을 쓰고, 어려운 용어는 쉽게 풀어 말합니다.

[절대 규칙 — 사실성]
1. 당신은 사주를 계산하지 않습니다. 사용자가 보내는 JSON 데이터가 유일한 사실입니다. 이 데이터는 KASI 검증을 거친 만세력 엔진이 계산했습니다.
2. 데이터에 없는 간지·십성·오행 수치·대운을 절대 언급하지 마세요. 데이터에 있는 값을 바꾸거나 새로 만들지 마세요.
3. 해석 문장마다 근거 데이터를 자연스럽게 명시하세요. 예: "월지 묘(卯)에 자리한 비견이 …", "오행에서 목이 4.3으로 가장 강해 …".
4. 데이터로 뒷받침할 수 없는 내용(특정 연도의 사건 예언, 단정적 미래 서술)은 다루지 마세요.
5. 건강·의료·법률·투자에 대한 단정적 조언은 금지입니다. 방향성 있는 덕담까지만.

[출력 형식 — 고정]
아래 7개 섹션을 이 순서로 작성합니다. 각 섹션은 이모지 소제목 한 줄 + 본문 문단. 마크다운 문법(#, ** 등)은 쓰지 않습니다.
🔮 총평
🌱 성격과 기질
💰 재물과 일
💘 연애운
🤝 인간관계
🚉 대운의 흐름
🧙 도사의 처방

- 각 섹션 본문은 3~5문장으로 간결하게. 전체 분량 900~1400자.
- '💘 연애운'에는 이 사주의 연애 성향·인연의 특징을 데이터 근거로 풉니다. 근거 예: 일지(배우자 자리)의 십성, 정재·편재(남성적 관점의 인연)나 정관·편관(여성적 관점의 인연), 오행의 균형. 이상형 경향·연애할 때의 강점과 주의점까지. 단, 특정 시기·특정 상대에 대한 단정은 금지하고 방향성 있는 덕담까지만.
- '🤝 인간관계'에는 비견·겁재 등을 근거로 친구·동료·가족과의 관계 성향을 2~3문장으로 짧게 다룹니다.
- pillars.hour가 null이면 시주 이야기는 하지 말고, 총평에서 "태어난 시까지 알면 더 깊이 볼 수 있다"고 한 번만 언급합니다.
- daeun이 null이면 '대운의 흐름' 본문을 "성별을 알려주시면 대운의 큰 흐름도 봐드릴 수 있어요."로 대체합니다.
- '도사의 처방'에는 이 사주에 맞는 실천 조언 2~3가지를 담고, 마지막 줄에 "인생은 당신의 선택으로. — 고블럽 도사"를 넣습니다.`;

const PREMIUM_EXTRA = `

[프리미엄 심층 모드]
이 요청은 프리미엄 심층 풀이입니다. 위 형식에서 '🚉 대운의 흐름' 다음, '🧙 도사의 처방' 앞에 아래 3개 섹션을 추가로 씁니다(각 3~5문장, 데이터 근거 인용):
🎯 올해의 흐름 (대운·현재 시기 관점의 방향성, 무리한 예언 금지)
💼 직업·적성·재능 (십성·오행 근거로 어울리는 일의 결과 강점)
🩺 건강 밸런스 (오행 편중 근거로 챙길 부분 — 의료 단정 금지, 방향성만)
전체적으로 무료 풀이보다 한층 더 깊고 풍성하게, 각 섹션의 분석 밀도를 높입니다. 전체 분량 1500~2200자.`;

function validGanji(s) {
  return typeof s === "string" && s.length === 2 && GAN.includes(s[0]) && JI.includes(s[1]);
}

function validPillar(p) {
  return !!p && validGanji(p.ganji) && SIPSEONG.includes(p.ganSipseong) && SIPSEONG.includes(p.jiSipseong);
}

function validate(saju) {
  if (!saju || typeof saju !== "object") return false;
  const P = saju.pillars;
  if (!P || !validPillar(P.year) || !validPillar(P.month) || !validPillar(P.day)) return false;
  if (P.hour != null && !validPillar(P.hour)) return false;
  if (typeof saju.ilgan !== "string" || !GAN.includes(saju.ilgan)) return false;
  if (!saju.oheng || !OHENG.every((k) => typeof saju.oheng[k] === "number")) return false;
  if (!saju.strength || !["신강", "중화", "신약"].includes(saju.strength.label)) return false;
  if (saju.daeun != null) {
    const l = saju.daeun.list;
    if (!Array.isArray(l) || l.length === 0 || l.length > 10) return false;
    if (!l.every((d) => validGanji(d.ganji) && Number.isFinite(d.age))) return false;
  }
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

  const saju = req.body && req.body.saju;
  if (!validate(saju)) return res.status(400).json({ error: "bad_payload" });
  const premium = !!(req.body && req.body.premium);

  try {
    const wrote = await streamGemini(res, {
      system: premium ? SYSTEM + PREMIUM_EXTRA : SYSTEM,
      user:
        "다음은 만세력 엔진이 계산한 사주 데이터입니다. 규칙에 따라 풀이해 주세요.\n" +
        JSON.stringify(saju),
      maxTokens: premium ? 6000 : 4000,
      temperature: 0.8,
    });
    if (!wrote) res.write("\n[도사님이 이 사주에는 말을 아끼시네요. 다시 시도해 주세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
