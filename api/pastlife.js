// 전생 대환장 파티 — 사주 시드 기반 전생 연대기(텍스트) + 전생 삽화(이미지 생성) 프록시.
// mode 없음: 전생 2개 텍스트 + 장면 묘사(@@SCENE) 스트리밍 (flash — SVG를 안 그리니 pro 불필요)
// mode "img": 장면 묘사 1개 → 귀여운 카툰 일러스트 1장 (gemini-2.5-flash-image, 장당 ≈$0.039)
import { streamGemini, genImage, geminiConfigured } from "../lib/gemini.js";
import { aiGuard } from "../lib/ratelimit.js";

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

const SYSTEM = `당신은 '전생 판독가 고브럽 도사'입니다. 사주의 기운을 읽어 그 사람의 전생을 발굴하는 도사로, 진지한 척하지만 내용은 대환장 코미디입니다. 존댓말을 씁니다.

[콘텐츠 규칙]
1. 사용자가 보내는 사주 JSON(오행 분포, 일간, 십성)이 유일한 시드입니다. 전생 설정을 이 기운들과 그럴듯하게 연결하세요(예: "금 기운이 강해 대장장이…").
2. 전생은 정확히 2개. 첫 번째는 반드시 '선사시대', 두 번째는 반드시 '조선시대'로 고정합니다. 각 전생: 직업/정체 + 그 시절의 웃긴 일화나 특징을 2~3문장으로. ★죽음·최후·사인(어떻게 죽었는지)은 절대 쓰지 마세요. 살아있는 동안의 이야기만.
3. 2개 중 최대 1개는 '나쁜 전생'(업보 흑역사)으로 만들 수 있고, 그 전생에만 고브럽이 씹어먹고 바꿔준 개선판 본문을 함께 제공합니다(선택 사항).
4. 실존 인물 이름 금지. 비하·차별적 설정 금지, 유쾌한 톤 유지.
5. 마지막에 두 전생의 기운이 현생으로 이어지는 회수 문단(3~4문장)을 씁니다. 사주 근거(오행·일간)를 한 번 이상 인용.

[출력 형식 — 마커를 정확히. 마크다운 금지. 이 순서 엄수]
@@LIFE|선사시대|이모지 1~2개|칭호(15자 이내)
(본문 2~3문장)
(나쁜 전생이면 본문 다음 줄에 "@@FIX" 와 개선판 본문 2~3문장)
@@SCENE
(이 전생의 삽화 장면 묘사 1~2문장)
@@LIFE|조선시대|이모지 1~2개|칭호(15자 이내)
(본문 2~3문장)
@@SCENE
(이 전생의 삽화 장면 묘사 1~2문장)
@@FINALE
(현생 회수 문단)

[@@SCENE 장면 묘사 — 일러스트레이터에게 넘길 그림 지시문]
★@@SCENE 블록은 두 전생 모두에 반드시 있어야 한다. 하나라도 빠뜨리면 출력 전체가 무효 처리된다. @@FIX가 있는 전생도 @@FIX 다음에 @@SCENE을 꼭 쓴다.
각 전생마다 본문의 가장 웃긴 순간 하나를 그림 한 장으로 묘사한다.
- 주인공 1명이 무엇을 하고 있는지(동작·표정), 곁의 소품 2~3개, 배경 한 줄 — 구체적인 명사로.
- 시대 고증을 귀엽게: 선사시대=동굴·모닥불·매머드·털가죽·돌도구, 조선시대=한복·갓·기와/초가·소·붓·두루마리.
- 글자·간판·문자가 필요한 장면은 만들지 마라(그림에 텍스트 금지).
- 예: "털가죽을 입은 동그란 원시인이 모닥불 앞에서 탄 고기를 들고 울상을 짓고 있다. 옆에는 시큰둥한 매머드, 배경은 동굴 입구와 보름달."`;

// 삽화 스타일 — 모든 전생 그림에 공통 적용(귀여운 카툰 스티커 톤)
const IMG_STYLE =
  "아주 귀여운 한국 카툰 스티커 스타일의 정사각형 일러스트를 그려줘. " +
  "둥글둥글한 2등신 SD 캐릭터(크고 동그란 얼굴, 까만 점 눈, 발그레한 볼터치), " +
  "두껍고 부드러운 다크브라운 외곽선, 밝은 파스텔 플랫 컬러, 단순하고 깔끔한 배경, " +
  "스티커처럼 또렷한 구성, 유쾌하고 사랑스러운 분위기. " +
  "사진처럼 사실적으로 그리지 말 것. 잔혹하거나 무서운 묘사 금지. " +
  "이미지 안에 어떤 글자도 넣지 말 것 — 문자, 간판, 말풍선, 의성어(낄낄·쿵 등), 효과음 텍스트 전부 금지. " +
  "웃음이나 소리는 글자 대신 표정과 동작으로만 표현할 것.";

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
  if (!(await aiGuard(req, res, "pastlife"))) return;   // 서버측 레이트리밋(IP당 분당/일당)

  // ── 삽화 모드: 장면 묘사 → 귀여운 카툰 이미지 1장 ──
  if (req.body && req.body.mode === "img") {
    const era = typeof req.body.era === "string" ? req.body.era : "";
    const scene = typeof req.body.scene === "string"
      ? req.body.scene.slice(0, 320).replace(/[<>{}]/g, "") : "";
    if (!/^(선사시대|조선시대)$/.test(era) || scene.length < 8) {
      return res.status(400).json({ error: "bad_scene" });
    }
    try {
      const img = await genImage(IMG_STYLE + "\n\n장면(" + era + "): " + scene);
      return res.status(200).json({ img: "data:" + img.mime + ";base64," + img.data });
    } catch (err) {
      return res.status(502).json({ error: "img_fail" });
    }
  }

  const saju = req.body && req.body.saju;
  if (!validate(saju)) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "다음은 만세력 엔진이 계산한 이 사람의 사주입니다. 전생 2개(선사시대·조선시대)를 발굴하고, 각 전생마다 삽화 장면 묘사를 붙여 주세요.\n" +
        JSON.stringify(saju),
      maxTokens: 2400,
      temperature: 0.95,
      model: "gemini-2.5-flash",
    });
    if (!wrote) res.write("\n@@FINALE\n도사님이 이 전생 기록에는 말을 아끼시네요. 다시 시도해 주세요.");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
