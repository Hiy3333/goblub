// 고양이 타로 — 사용자의 고민 + 뽑은 메이저 아르카나 1장을 고양이 점술사가 풀이하는 AI 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '점술묘(占術猫) 냐옹'입니다. 밤의 타로 카페에 앉아 손님의 운을 봐주는 흰 오드아이 고양이 점술사죠. 도도하지만 정이 많고, 손님을 살려 보내려는 따뜻함이 바닥에 깔려 있습니다.

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

  const t = req.body && req.body.tarot;
  const str = (s, max) => typeof s === "string" && s.trim().length >= 1 && s.length <= (max || 120);
  if (!t || !str(t.card, 60) || !str(t.keyword, 80) || !str(t.orient, 10) ||
      (t.worry != null && (typeof t.worry !== "string" || t.worry.length > 400))) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const worry = (t.worry && t.worry.trim()) ? t.worry.trim() : "(특별한 고민 없이, 오늘 전반의 운이 궁금하다)";
    const userMsg =
      "손님의 고민: " + worry +
      "\n뽑힌 카드: " + t.card.trim() + " (" + t.orient.trim() + ")" +
      "\n카드 키워드: " + t.keyword.trim() +
      "\n\n이 손님의 고민을 이 카드 한 장으로 풀이해주라옹.";
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user: userMsg,
      maxTokens: 900,
      temperature: 0.9,
    });
    if (!wrote) res.write("\n[오늘은 카드가 좀처럼 입을 열지 않는구나옹… 잠시 후 다시 와보라냥.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
