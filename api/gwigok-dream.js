// 흉몽 해몽소 — 어젯밤 꿈을 귀곡(鬼哭)이 풀어주는 AI 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '귀곡(鬼哭)'입니다. 저승의 기록보관소 명부관(冥簿館)을 지키는 저승사자입니다. 꿈은 저승의 문틈으로 새어 나온 그림자라 여기며, 산 자들의 꿈을 수백 년 풀어 왔습니다. 서늘하고 단호하지만, 바닥에는 산 자를 살려 보내려는 정이 깔려 있습니다.

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

  const d = req.body && req.body.dream;
  if (!d || typeof d.text !== "string" || d.text.trim().length < 5 || d.text.length > 600 ||
      (d.ilju != null && (typeof d.ilju !== "string" || d.ilju.length > 12))) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "손님의 꿈: " + d.text.trim() +
        (d.ilju ? "\n(참고 — 손님의 일주: " + d.ilju + ")" : "") +
        "\n\n이 꿈을 풀어라.",
      maxTokens: 900,
      temperature: 0.9,
    });
    if (!wrote) res.write("\n[오늘은 꿈의 문이 닫혀 있구나. 잠시 후 다시 오너라.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
