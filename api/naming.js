// 고블럽 작명소 — 카테고리·키워드로 이름을 지어주는 AI 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const CATS = {
  nickname: "게임·SNS 닉네임",
  pet: "반려동물 이름",
  shop: "가게·브랜드 이름",
  baby: "태명(뱃속 아기 애칭)",
  character: "소설·게임 캐릭터 이름",
};

const SYSTEM = `당신은 '고블럽 작명가'입니다. 재치있고 센스있게 이름을 지어주는 고블럽이에요. 존댓말에 유쾌한 톤.

[규칙]
1. 사용자가 준 카테고리와 키워드/분위기에 맞는 이름 6~8개를 제안한다.
2. 각 줄 형식(마크다운·번호·별표 금지, 줄바꿈으로만 나열): "이름 — 한 줄 이유(재치있게, 15자 안팎)".
3. 대부분은 실제로 써도 좋을 만큼 그럴듯하게, 한두 개는 톡톡 튀는 드립성으로 섞는다.
4. 비하·욕설 금지. 유명 상표·브랜드명을 그대로 베끼지 말 것.
5. 맨 앞에 "🐾 고블럽 작명소 추천!" 한 줄, 맨 끝에 "맘에 드는 게 있길! 없으면 또 불러줘요 🐙" 한 줄.
6. 전체 250~450자로 간결하게.

카테고리 감:
- 게임·SNS 닉네임: 개성 있고 부르기 쉽게, 살짝 힙하게
- 반려동물 이름: 귀엽고 사랑스럽게
- 가게·브랜드 이름: 기억에 남고 컨셉 있게
- 태명: 밝고 건강하고 따뜻한 느낌
- 캐릭터 이름: 세계관이 느껴지게`;

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

  const n = req.body && req.body.naming;
  const kw = n && n.keywords;
  if (!n || !CATS[n.category] || (kw != null && (typeof kw !== "string" || kw.length > 100))) {
    return res.status(400).json({ error: "bad_payload" });
  }

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user: "카테고리: " + CATS[n.category] + "\n키워드/분위기: " + ((kw && kw.trim()) || "자유롭게 센스있게") + "\n\n이름을 지어주세요.",
      maxTokens: 700,
      temperature: 0.95,
    });
    if (!wrote) res.write("\n[작명가가 지금 영감이 안 떠오르나 봐요. 다시 불러주세요!]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
