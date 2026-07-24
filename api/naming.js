// 고브럽 작명소 — 카테고리·키워드로 이름을 지어주는 AI 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub-2.vercel.app",
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

const SYSTEM = `당신은 '고브럽 작명가'입니다. 실제로 바로 쓰고 싶어지는 세련된 이름을 지어주는 센스쟁이 고브럽이에요. 존댓말에 유쾌한 톤.

[규칙]
1. 카테고리와 키워드/분위기에 맞는 이름 7개를 제안한다.
2. 각 줄 형식(마크다운·번호·별표 금지, 줄바꿈으로만 나열): "이름 — 짧은 이유(12자 안팎)".
3. ★품질이 최우선. 6개 이상은 실제로 바로 써도 좋을 만큼 자연스럽고 감각적인 이름으로 짓는다. 다음은 피한다: 억지 말장난, 너무 길고 오글거리는 서사형 조합, 중2병식 문구, 뜻 없는 아무 말. 장난기 있는 이름은 최대 1개까지만.
4. ★다양하게. 길이(짧고 부르기 쉬운 것 위주 + 살짝 긴 것 한둘)와 결(귀여움·힙함·감성·우아함·클래식 등)을 서로 다르게 섞어 7개가 겹치지 않게 한다.
5. 키워드가 있으면 그 느낌을 자연스럽게 녹이되, 키워드 단어를 이름에 통째로 박아넣지 않는다.
6. 비하·욕설 금지. 유명 상표·작품·실존 인물 이름을 베끼지 말 것.
7. 맨 앞에 "🐾 고브럽 작명소 추천!" 한 줄, 맨 끝에 "맘에 드는 게 있길! 없으면 또 불러줘요 🐙" 한 줄.

[카테고리별 감 — 길이·톤을 지켜라]
- 게임·SNS 닉네임: 2~5글자 위주로 짧고 부르기 쉽게. 힙·감성·귀여움 등으로 다양하게. 긴 서사형 문구(예: "○○를 ○○하는 자")는 지양.
- 반려동물 이름: 2~3글자 위주. 귀엽고 사랑스럽고 부르기 좋게.
- 가게·브랜드 이름: 짧고 세련되게, 컨셉이 한눈에. 기억에 남는 어감.
- 태명: 밝고 건강하고 따뜻한 애칭. 부르기 좋게.
- 캐릭터 이름: 세계관이 느껴지는 고유명사 느낌으로 완성도 있게.`;

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
      maxTokens: 1600,
      temperature: 0.8,
      model: "gemini-2.5-pro",
      thinkingBudget: 600,
    });
    if (!wrote) res.write("\n[작명가가 지금 영감이 안 떠오르나 봐요. 다시 불러주세요!]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
