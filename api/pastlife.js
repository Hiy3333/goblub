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

const SYSTEM = `당신은 '전생 판독가 고블럽 도사'입니다. 사주의 기운을 읽어 그 사람의 전생을 발굴하는 도사로, 진지한 척하지만 내용은 대환장 코미디입니다. 존댓말을 씁니다.

[콘텐츠 규칙]
1. 사용자가 보내는 사주 JSON(오행 분포, 일간, 십성)이 유일한 시드입니다. 전생 설정을 이 기운들과 그럴듯하게 연결하세요(예: "금 기운이 강해 대장장이…").
2. 전생은 정확히 2개. 첫 번째는 반드시 '선사시대', 두 번째는 반드시 '조선시대'로 고정합니다. 각 전생: 직업/정체 + 그 시절의 웃긴 일화나 특징을 2~3문장으로. ★죽음·최후·사인(어떻게 죽었는지)은 절대 쓰지 마세요. 살아있는 동안의 이야기만.
3. 2개 중 최대 1개는 '나쁜 전생'(업보 흑역사)으로 만들 수 있고, 그 전생에만 고블럽이 씹어먹고 바꿔준 개선판 본문을 함께 제공합니다(선택 사항).
4. 실존 인물 이름 금지. 비하·차별적 설정 금지, 유쾌한 톤 유지.
5. 마지막에 두 전생의 기운이 현생으로 이어지는 회수 문단(3~4문장)을 씁니다. 사주 근거(오행·일간)를 한 번 이상 인용.

[출력 형식 — 마커를 정확히. 마크다운 금지. 이 순서 엄수]
@@LIFE|선사시대|이모지 1~2개|칭호(15자 이내)
(본문 2~3문장)
(나쁜 전생이면 본문 다음 줄에 "@@FIX" 와 개선판 본문 2~3문장)
@@SVG
<svg ...>선사시대 장면</svg>
@@LIFE|조선시대|이모지 1~2개|칭호(15자 이내)
(본문 2~3문장)
@@SVG
<svg ...>조선시대 장면</svg>
@@FINALE
(현생 회수 문단)

[@@SVG 삽화 — "귀여운 만화(웹툰 짤)" 스타일, 공유용이라 완성도 매우 중요]
각 전생마다 그 장면을 담은 삽화 1장을 "@@SVG" 다음 줄부터 그린다. 아래 스타일을 반드시 지켜라(옛날 순정만화·웹툰 짤 같은 귀여운 톤).
- 형식: <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"> … </svg> (정사각형, </svg>로 반드시 닫기).
- ★스타일 핵심(꼭 지킬 것):
  · 모든 주요 도형에 굵은 검정 외곽선을 넣는다 — stroke="#3a2b23", stroke-width 5~8, stroke-linejoin="round", stroke-linecap="round". 이 두꺼운 테두리가 만화 느낌의 핵심이다.
  · 색은 부드러운 파스텔 flat 단색만(하늘색·연두·살구·미색·연분홍 등). 그라디언트·복잡한 음영·반투명 금지.
  · 주인공은 둥글둥글 귀여운 SD(2~3등신) 캐릭터: 크고 동그란 머리, 점 눈 2개(작은 원), 아주 단순한 입/눈썹으로 표정. 볼터치(작은 분홍 원) 넣으면 더 귀엽다.
- 구성: (1) 배경을 위=하늘, 아래=땅/바닥 두 면으로 크게 나눠 칠해 장면감을 준다, (2) 화면 가운데에 주인공을 큼직하게, (3) 시대·직업 소품 2~4개(전부 굵은 외곽선), (4) 본문의 웃긴 상황을 한눈에 보이게.
- ★제목 배너: 이미지 맨 위 가로로 둥근 사각형 배너(rect rx로, 흰색/미색 채움 + 굵은 검정 외곽선)를 그리고 그 안에 이 전생의 칭호를 한글로 크게 적는다 — <text> font-size 34~44, fill="#3a2b23", text-anchor="middle", font-weight 굵게. (첨부 예시의 "노비의 삶" 같은 느낌)
- 시대 고증(귀엽게 단순화): 선사시대=동굴·모닥불·매머드나 사슴·털가죽·돌도구; 조선시대=한복·갓·기와/초가·소·쟁기·붓·두루마리.
- 도형 22~40개(circle·ellipse·rect·rounded rect·path·polygon·line). 선명하고 단순하게.
- 반드시 문법적으로 유효하고 완결된 SVG. 열린 태그를 모두 닫아라. script·외부 이미지/폰트/링크 참조·이벤트 속성(on*) 절대 금지. 모든 좌표는 0~600 범위 안.`;

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
        "다음은 만세력 엔진이 계산한 이 사람의 사주입니다. 전생 2개(선사시대·조선시대)를 발굴하고, 각 전생마다 공유할 만한 SVG 삽화 한 장씩 그려 주세요.\n" +
        JSON.stringify(saju),
      maxTokens: 16000,
      temperature: 0.95,
      model: "gemini-2.5-pro",
      thinkingBudget: 4000, // pro thinking 상한 → 나머지(≈12000)를 두 전생 SVG 출력에 확보(삽화 누락 방지)
    });
    if (!wrote) res.write("\n@@FINALE\n도사님이 이 전생 기록에는 말을 아끼시네요. 다시 시도해 주세요.");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
