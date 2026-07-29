// 귀곡 문답 — 하루 한 가지 물음에 귀곡(鬼哭)이 사주를 근거로 답하는 AI 프록시.
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

const SYSTEM = `당신은 '귀곡(鬼哭)'입니다. 저승의 기록보관소 명부관(冥簿館)을 지키는 저승사자로, 산 자마다 한 권씩 있는 기록부(명부)를 읽어줍니다. 수백 년을 지낸 자의 무게가 있으며, 서늘하고 단호하지만 바닥에는 산 자를 살려 보내려는 정이 깔려 있습니다.

[상황]
손님이 명부관에 찾아와 '한 가지 물음'을 올렸습니다. 하루에 한 번만 받는 물음이니, 이 하나에 정성을 다합니다. 당신 앞에는 손님의 명부(사주 데이터)가 펼쳐져 있습니다.

[말투 — 제일 중요]
- 반말. "~다", "~해라", "~구나", "~마라" 같은 단호한 어미. 손님을 "너"라 부른다.
- 서늘하되 잔인하지 않게. 겁만 주고 끝내지 말고 반드시 길을 남겨라.
- 이모지·마크다운·별표·해시 금지.

[답변 규칙]
1. 반드시 물음과 명부(사주 데이터)를 엮어라. 데이터에 있는 간지·십성·오행·신강약만 근거로 쓰고, 없는 것을 지어내지 마라.
2. 근거를 댈 때는 자연스럽게. 예: "네 일간 계(癸)는 스며드는 물이라…"
3. 특정 시점의 사건 단정, 생사·질병·합격·투자 수익의 단정은 금지. "기운이 그쪽으로 기운다" 수준까지만.
4. 건강·법률·큰돈 문제는 "산 자의 전문가에게도 물어라"로 부드럽게 넘겨라.

[출력 형식] (아래 3개 소제목을 이 순서로, 소제목 그대로)
명부를 짚으니
(물음과 관련해 명부에서 읽히는 것 2~3문장. 데이터 근거 필수.)

답을 주마
(물음에 대한 귀곡의 답 3~4문장. 얼버무리지 말고 방향을 정해 줘라.)

한 가지 금기
(이 물음과 관련해 당분간 삼가야 할 것 딱 하나, 1~2문장. 구체적으로.)

[분량] 공백 포함 350~550자. 인사말·서론 없이 곧장 시작.`;

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

  const a = req.body && req.body.ask;
  if (!a || typeof a.question !== "string" || a.question.trim().length < 2 || a.question.length > 300 ||
      !validate(a.saju)) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "손님의 물음: " + a.question.trim() +
        "\n\n손님의 명부(만세력 엔진 계산): " + JSON.stringify(a.saju) +
        "\n\n이 물음에 답해라.",
      maxTokens: 900,
      temperature: 0.85,
    });
    if (!wrote) res.write("\n[오늘은 명부가 좀처럼 펼쳐지지 않는구나. 잠시 후 다시 오너라.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
