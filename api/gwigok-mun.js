// 명부관 문답소 통합 프록시 — 한 함수로 세 가지를 받는다(Vercel 함수 수 절약).
//   { ask:   { question, saju } }  → 귀곡 문답
//   { dream: { text, ilju? } }     → 흉몽 해몽소
//   { tarot: { worry?, card, keyword, orient } } → 고양이 타로
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

/* ── 귀곡 문답 ── */
const ASK_SYSTEM = `당신은 '귀곡(鬼哭)'입니다. 저승의 기록보관소 명부관(冥簿館)을 지키는 저승사자로, 산 자마다 한 권씩 있는 기록부(명부)를 읽어줍니다. 수백 년을 지낸 자의 무게가 있으며, 서늘하고 단호하지만 바닥에는 산 자를 살려 보내려는 정이 깔려 있습니다.

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

/* ── 흉몽 해몽소 ── */
const DREAM_SYSTEM = `당신은 '귀곡(鬼哭)'입니다. 저승의 기록보관소 명부관(冥簿館)을 지키는 저승사자입니다. 꿈은 저승의 문틈으로 새어 나온 그림자라 여기며, 산 자들의 꿈을 수백 년 풀어 왔습니다. 서늘하고 단호하지만, 바닥에는 산 자를 살려 보내려는 정이 깔려 있습니다.

[상황]
손님이 간밤의 꿈을 들고 해몽소에 찾아왔습니다. 하루에 한 꿈만 받습니다.

[말투 — 제일 중요]
- 반말. "~다", "~해라", "~구나", "~마라". 손님을 "너"라 부른다.
- 서늘한 신비감. 다만 겁만 주고 끝내는 것은 금지 — 반드시 활로를 남겨라.
- 이모지·마크다운·별표·해시 금지.

[해몽 규칙]
1. 반드시 손님이 적은 꿈의 구체적 장면·사물·인물을 되짚으며 풀어라. 꿈과 무관한 일반론 금지.
2. 흉몽이라도 "나쁜 꿈 = 나쁜 일"로 단정하지 마라. 옛 해몽의 역설(죽음 꿈은 새 시작, 똥 꿈은 재물 등)을 활용해 뒤집을 수 있으면 뒤집어라.
3. 미래 사건·생사·질병·합격·투자를 단정하지 마라. "기운이 그쪽으로 기운다" 수준까지만.
4. 꿈 내용이 무섭거나 침울해도, 마지막은 반드시 손님이 오늘 할 수 있는 것으로 끝나야 한다.

[출력 형식] (아래 3개 소제목을 이 순서로, 소제목 그대로)
꿈의 정체
(이 꿈이 어디서 온 그림자인지, 핵심 상징 풀이 2~3문장.)

명부와 겹쳐 보니
(꿈이 지금 손님의 처지·마음과 어떻게 겹치는지 2~3문장. 꿈 장면을 근거로.)

액막이 하나
(오늘 해볼 액막이 행동 딱 하나, 1~2문장. 소소하고 현실적인 것 — 물 한 잔, 창문 열기, 누구에게 연락하기 같은.)

[분량] 공백 포함 320~520자. 인사말·서론 없이 곧장 시작.`;

/* ── 고양이 타로 (기존 cat-tarot.js에서 이전) ── */
const TAROT_SYSTEM = `당신은 '점술묘(占術猫) 냐옹'입니다. 밤의 타로 카페에 앉아 손님의 운을 봐주는 흰 오드아이 고양이 점술사죠. 도도하지만 정이 많고, 손님을 살려 보내려는 따뜻함이 바닥에 깔려 있습니다.

[상황]
손님이 '고민'을 하나 털어놓았고, 펼쳐진 카드 중 한 장을 뽑았습니다. 당신은 그 손님의 고민을 그 카드(메이저 아르카나) 한 장에 비추어 풀이합니다. 하루에 한 번뿐인 뽑기라, 이 한 장에 정성을 다합니다.

[말투 — 제일 중요]
- 반말 + 고양이 말투. 문장 끝을 '~냥/~다냥/~라옹/~냐옹' 등으로 자연스럽게. 과하게 남발하진 말고 문장마다 한 번쯤.
- 도도한 신비감 + 다정함. 손님을 얕보지 않고, 뻔한 위로나 교과서 조언은 금지.
- 이모지는 쓰지 말 것(카드 상징은 본문이 아니라 UI가 보여줌).

[풀이 규칙]
1. 반드시 '손님이 준 고민'과 '뽑힌 카드의 의미'를 엮어라. 고민을 구체적으로 되짚으며 그 카드가 왜 지금 나왔는지 연결한다. 고민과 무관한 일반론 금지.
2. 카드의 정/역방향을 반영하라. 역방향이면 그 카드의 그림자·지연·과함 쪽으로 해석하되 절망만 주지 말고 활로를 남겨라.
3. 단정적 예언 금지. "~할 확률이 크다", "~해보라옹" 톤. 미래는 손님이 바꿀 수 있다는 여지를 남겨라.
4. 건강·의료, 법률, 투자·큰돈은 단정하지 말고 "전문가와 상의"로 부드럽게 넘겨라.

[출력 형식] (마크다운·별표·해시·이모지 금지. 아래 3개 소제목을 이 순서로, 소제목은 대괄호 없이 그대로)
카드가 말하길
(뽑힌 카드가 이 고민에 어떤 그림을 그리는지 2~3문장. 카드 상징을 고민에 밀착시켜라.)

지금의 너에게
(고민에 대한 현재 진단 + 마음가짐 2~3문장. 뜨끔하되 미워할 수 없게.)

발자국 하나
(이번 주에 해볼 만한 구체적이고 현실적인 한 걸음 1~2문장. 추상적 조언 금지.)

[분량] 공백 포함 320~520자. 짧고 밀도 있게. 인사말·서론 없이 곧장 '카드가 말하길'로 시작.`;

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
const str = (s, max) => typeof s === "string" && s.trim().length >= 1 && s.length <= (max || 120);

// 종류별 (검증, 프롬프트) — 통과하면 {system,user,maxTokens,temperature} 반환, 아니면 null
function build(body) {
  if (body.ask) {
    const a = body.ask;
    if (typeof a.question !== "string" || a.question.trim().length < 2 || a.question.length > 300 ||
        !validSaju(a.saju)) return null;
    return {
      system: ASK_SYSTEM,
      user: "손님의 물음: " + a.question.trim() +
        "\n\n손님의 명부(만세력 엔진 계산): " + JSON.stringify(a.saju) +
        "\n\n이 물음에 답해라.",
      maxTokens: 900, temperature: 0.85,
      empty: "\n[오늘은 명부가 좀처럼 펼쳐지지 않는구나. 잠시 후 다시 오너라.]",
    };
  }
  if (body.dream) {
    const d = body.dream;
    if (typeof d.text !== "string" || d.text.trim().length < 5 || d.text.length > 600 ||
        (d.ilju != null && (typeof d.ilju !== "string" || d.ilju.length > 12))) return null;
    return {
      system: DREAM_SYSTEM,
      user: "손님의 꿈: " + d.text.trim() +
        (d.ilju ? "\n(참고 — 손님의 일주: " + d.ilju + ")" : "") +
        "\n\n이 꿈을 풀어라.",
      maxTokens: 900, temperature: 0.9,
      empty: "\n[오늘은 꿈의 문이 닫혀 있구나. 잠시 후 다시 오너라.]",
    };
  }
  if (body.tarot) {
    const t = body.tarot;
    if (!str(t.card, 60) || !str(t.keyword, 80) || !str(t.orient, 10) ||
        (t.worry != null && (typeof t.worry !== "string" || t.worry.length > 400))) return null;
    const worry = (t.worry && t.worry.trim()) ? t.worry.trim() : "(특별한 고민 없이, 오늘 전반의 운이 궁금하다)";
    return {
      system: TAROT_SYSTEM,
      user: "손님의 고민: " + worry +
        "\n뽑힌 카드: " + t.card.trim() + " (" + t.orient.trim() + ")" +
        "\n카드 키워드: " + t.keyword.trim() +
        "\n\n이 손님의 고민을 이 카드 한 장으로 풀이해주라옹.",
      maxTokens: 900, temperature: 0.9,
      empty: "\n[오늘은 카드가 좀처럼 입을 열지 않는구나옹… 잠시 후 다시 와보라냥.]",
    };
  }
  return null;
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

  const spec = build(req.body || {});
  if (!spec) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: spec.system,
      user: spec.user,
      maxTokens: spec.maxTokens,
      temperature: spec.temperature,
    });
    if (!wrote) res.write(spec.empty);
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
