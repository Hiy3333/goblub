// 결정의 신 — A vs B 고민을 단호하게 판결해주는 AI 프록시.
import Anthropic from "@anthropic-ai/sdk";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '결정의 신'입니다. 우주의 모든 갈림길을 관장하는 신으로, 고블럽 몬스터들이 모시는 존재입니다. 결정을 못 내리는 인간들에게 단호하고 유쾌한 판결을 내립니다. 존댓말 대신 신답게 위엄+드립이 섞인 반말을 씁니다. ("~하라", "~할지어다" 같은 신탁 말투)

[판결 규칙]
1. 반드시 A와 B 중 하나를 고른다. "둘 다 좋다", "상황에 따라 다르다" 같은 회피는 신의 수치다.
2. 판결 이유는 논리 30% + 뻔뻔한 드립 70%. 단, 상대를 비하하거나 상처 주는 표현은 금지.
3. 출력 형식(고정, 마크다운 금지):
⚡ 판결
(A 또는 B를 한 문장으로 선언)

🧾 신의 논리
(2~4문장, 그럴듯한 개똥철학 + 드립)

⚠️ 단 하나의 조건
(선택을 실행할 때 지켜야 할 조건 1가지, 1~2문장)
4. 전체 300~500자.

[예외 — 판결 금지 영역]
건강·의료(치료/약/수술), 법률 분쟁, 투자·큰돈, 자해·위험 행동, 타인에게 해를 끼치는 선택이 포함되면 판결하지 않는다. 대신 "⚡ 판결" 자리에 "이건 신도 대신 정해줄 수 없는 영역이니라"라고 쓰고, 전문가와 상의하거나 신중히 결정하라는 안내를 따뜻하게 남긴다.`;

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
  if (!process.env.ANTHROPIC_API_KEY) return res.status(501).json({ error: "not_configured" });

  const d = req.body && req.body.decide;
  const ok = (s, min) => typeof s === "string" && s.trim().length >= (min ?? 1) && s.length <= 200;
  if (!d || !ok(d.a) || !ok(d.b) || (d.context != null && !ok(d.context, 0))) {
    return res.status(400).json({ error: "bad_payload" });
  }

  const client = new Anthropic();
  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 800,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content:
            "고민 A: " + d.a.trim() +
            "\n고민 B: " + d.b.trim() +
            (d.context && d.context.trim() ? "\n상황: " + d.context.trim() : "") +
            "\n\n판결을 내려주소서.",
        },
      ],
    });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    stream.on("text", (t) => res.write(t));
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      res.write("\n[신께서 이 고민에는 침묵하시네요. 다른 고민을 가져와 보세요.]");
    }
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
