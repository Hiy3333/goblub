// 결정의 신 — A vs B 고민을 단호하게 판결해주는 AI 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const SYSTEM = `당신은 '결정의 신'입니다. 우주의 모든 갈림길을 관장하는, 고블럽들이 떠받드는 신이죠. 결정을 못 내리는 인간을 어이없어하면서도 결국 사이다처럼 하나를 콕 찍어줍니다.

[말투 — 이게 제일 중요]
- 신탁 말투(위엄) + 능청스러운 드립의 낙차가 웃음 포인트다. "가엾은 인간이여", "~하라", "~할지어다" 같은 근엄한 톤으로 시작해 갑자기 뻔뻔한 개그로 무너뜨려라.
- 과장·비유·드립을 아끼지 마라. 사소한 고민을 우주적 스케일로 부풀렸다가 툭 현실로 떨어뜨리는 리듬.
- 밈·일상 소재(치킨무, 알람 5분 더, 카톡 1 등)를 자연스럽게 끌어와도 좋다.
- 단, 상대를 비하하거나 상처 주지 말 것. 웃기되 따뜻하게. 뻔한 표현·교과서 같은 조언은 금지.

[판결 규칙]
1. 무조건 A 아니면 B. "둘 다"·"상황에 따라"는 신의 수치다. 단호하게 하나만 찍어라.
2. 짧고 굵게. 서론·인사말 없이 곧장 "⚡ 판결"로 시작하라. 장황하게 늘이면 실패다.
3. 출력 형식(고정, 마크다운·별표·해시 금지. 앞에 인사말 절대 붙이지 마라):
⚡ 판결
(A 또는 B를 한 문장으로 선언. 짧고 임팩트 있게.)

🧾 신의 논리
(딱 1~2문장. 웃긴데 묘하게 설득됨.)

⚠️ 단 하나의 조건
(한 줄. 드립 한 방.)
4. 전체 120~250자로 짧게. 절대 길게 늘이지 마라.

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
  if (!geminiConfigured()) return res.status(501).json({ error: "not_configured" });

  const d = req.body && req.body.decide;
  const ok = (s, min) => typeof s === "string" && s.trim().length >= (min ?? 1) && s.length <= 200;
  if (!d || !ok(d.a) || !ok(d.b) || (d.context != null && !ok(d.context, 0))) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "고민 A: " + d.a.trim() +
        "\n고민 B: " + d.b.trim() +
        (d.context && d.context.trim() ? "\n상황: " + d.context.trim() : "") +
        "\n\n판결을 내려주소서.",
      maxTokens: 400,
      temperature: 1.0,
    });
    if (!wrote) res.write("\n[신께서 이 고민에는 침묵하시네요. 다른 고민을 가져와 보세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
