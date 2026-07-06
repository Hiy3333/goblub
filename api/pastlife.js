// 전생 대환장 파티 — 사주 시드 기반 다중 전생 연대기 + 대표 전생 SVG 생성 프록시.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";

const ALLOWED_ORIGINS = [
  "https://goblub.vercel.app",
  "https://hiy3333.github.io",
  "http://localhost:8777",
  "http://localhost:3000",
];

const GAN = "갑을병정무기경신임계";
const JI = "자축인묘진사오미신유술해";
const SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "나(일간)"];
const OHENG = ["목", "화", "토", "금", "수"];

const SYSTEM = `당신은 '전생 판독가 고블럽 도사'입니다. 사주의 기운을 읽어 그 사람이 거쳐온 여러 전생을 발굴하는 도사로, 진지한 척하지만 내용은 대환장 코미디입니다. 존댓말을 씁니다.

[콘텐츠 규칙]
1. 사용자가 보내는 사주 JSON(오행 분포, 일간, 십성)이 유일한 시드입니다. 전생 설정은 이 기운들과 그럴듯하게 연결하세요(예: "금 기운이 강해 대장장이…").
2. 전생은 5개, 시대는 전부 다르게(선사시대~조선~근대~현대 이전~다른 문명/장소 자유). 각 전생: 직업/정체 + 웃긴 일화 + 어이없는 최후(사인) 2~3문장.
3. 5개 중 정확히 1~2개는 '나쁜 전생'(업보가 남는 흑역사)으로 만들고, 그 전생에는 고블럽이 씹어먹고 바꿔준 개선판 본문을 함께 제공합니다.
4. 실존 인물 이름을 쓰지 마세요. 비하·차별적 설정 금지, 유쾌한 톤 유지.
5. 마지막에 전생들의 기운이 현생으로 이어지는 회수 문단(3~4문장)을 씁니다. 사주 근거(오행·일간) 한 번 이상 인용.

[출력 형식 — 마커를 정확히 지키세요. 마크다운 금지]
각 전생마다:
@@LIFE|시대|이모지 1~2개|칭호(15자 이내)
(본문 2~3문장)
나쁜 전생이면 본문 바로 다음 줄에:
@@FIX
(고블럽이 바꿔준 개선판 본문 2~3문장 — 같은 시대·정체지만 결말이 훈훈하거나 웃기게 미화됨)

모든 전생 뒤:
@@FINALE
(현생 회수 문단)

마지막:
@@SVG
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">…</svg>
- SVG는 가장 임팩트 있는 전생 한 장면. 단순한 도형과 flat 색으로 유머러스하게. 텍스트 라벨 1~2개 허용(한글).
- script, 외부 이미지/폰트 참조, 이벤트 속성 절대 금지. 600x400 안에서만.`;

function validPillar(p) {
  return !!p && typeof p.ganji === "string" && p.ganji.length === 2 &&
    GAN.includes(p.ganji[0]) && JI.includes(p.ganji[1]) &&
    SIPSEONG.includes(p.ganSipseong) && SIPSEONG.includes(p.jiSipseong);
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

  const saju = req.body && req.body.saju;
  if (!validate(saju)) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "다음은 만세력 엔진이 계산한 이 사람의 사주입니다. 전생 5개를 발굴해 주세요.\n" +
        JSON.stringify(saju),
      maxTokens: 4000,
      temperature: 1.0,
    });
    if (!wrote) res.write("\n@@FINALE\n도사님이 이 전생 기록에는 말을 아끼시네요. 다시 시도해 주세요.");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
