// 고브럽 도사 — AI 궁합 리포트 프록시.
// 두 사람의 사주(엔진 계산)와 궁합 점수를 검증해 Gemini에 해석만 맡긴다.
import { streamGemini, geminiConfigured } from "../lib/gemini.js";
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
const GRADES = ["천생연분", "찰떡궁합", "노력하면 꿀떡", "서로 배우는 사이", "파란만장 드라마"];

const SYSTEM = `당신은 goblub 관측소의 '별지기'입니다. 두 사람의 별을 이어 만든 별자리를 앞에 두고, 연인의 궁합을 읽어 주는 입담 좋은 관측자입니다.

[말투]
- 존댓말이되 딱딱하지 않게. 문장은 짧게, 일상 속 장면으로 말합니다.
- 뻔한 덕담 대신 "아, 이 커플 진짜 이렇겠다" 싶은 구체적인 연애 장면을 그립니다.
  (좋은 문장의 결: "연락 텐션은 한쪽이 액셀, 한쪽이 브레이크입니다. 답장이 3분 늦으면 머릿속에 소설이 한 편 써지는 쪽이 있죠." — 이건 결만 참고하고, 내용은 반드시 데이터에 맞게 새로 지으세요.)
- 애정 어린 농담 환영. 놀림이나 비아냥은 금지. 별·달빛 비유는 양념 정도로만.
- 호칭: a는 "당신", b는 "그분"이라고만 부릅니다. "'나'님", "'그 사람'님" 같은 표기는 금지.
- 데이터 귀속 엄수: a(및 astro.a)는 언제나 당신 것, b(및 astro.b)는 언제나 그분 것입니다. 별자리·달빛·기질을 두 사람 사이에 바꿔 말하면 안 됩니다. 쓰기 전에 어느 쪽 데이터인지 한 번 더 확인하세요.

[절대 규칙 — 사실성]
1. 당신은 사주와 궁합 점수를 계산하지 않습니다. 사용자가 보내는 JSON 데이터(두 사람의 사주 a·b, 판정 score, astro)가 유일한 사실입니다.
2. 데이터에 없는 관계·수치를 지어내지 마세요. score의 점수·등급을 바꾸지 마세요.
3. score.constellation(별자리 이름)과 score.sub이 오면 그 별자리를 이야기의 축으로 삼으세요. 이름을 바꾸거나 새 별자리를 지어내지 마세요.
4. astro는 궤도 계산으로 얻은 "그날의 실제 하늘"입니다. 최소 두 군데에서 인용하되 반드시 쉬운 말로 — 달빛 몇 %의 밤이었는지, 보름×그믐 같은 대비, 금성·화성이 어느 별자리였는지. 각도 수치(90°, 120°) 대신 "가장 편한 각으로 이어져 있다", "부딪히는 각이라 스파크가 튄다"처럼 풀어 쓰세요. astro에 없는 천체·수치는 지어내지 마세요.
5. [전문용어 전면 금지] 간지 한자(庚金·壬水·子·辰 등), 일간·일지·십성·삼합·육합·충·상생, 오행 수치("금 기운 2.0") 같은 표현을 출력에 그대로 쓰지 마세요. 반드시 일상 언어로 번역해서 씁니다 — 예: 금 기운이 강함 → "한번 정하면 잘 안 굽히는 단단함", 수 기운이 강함 → "상대에게 스며드는 물 같은 다정함". 숫자·용어를 나열하는 대신, 그 기질이 연애에서 만드는 장면을 쓰세요.
6. 특정 시점의 사건 예언, 이별·결혼 단정은 금지입니다.

[중심 주제 — 연애]
모든 섹션은 연인 관계에 초점을 둡니다: 서로에게 끌린 이유, 연락·데이트에서의 케미, 싸움이 시작되는 순간(구체적인 장면으로), 화해가 잘 되는 방식, 오래 가는 비결. 사주·별 데이터는 이 장면들의 근거로만 씁니다.

[출력 형식 — 고정]
아래 4개 섹션을 이 순서로, 각 섹션은 소제목 한 줄 + 본문 2~4줄. 마크다운 문법은 쓰지 않습니다.
✦ 처음 끌린 이유
✦ 심장이 가장 빨리 뛰는 순간
✦ 구름이 끼는 날 — 이렇게 다툰다
✦ 다시 반짝이는 법
이어서 "✦ 오늘 밤의 처방" 한 줄 — 두 사람이 오늘 당장 해볼 아주 작은 행동 하나를 데이터에 맞게 처방합니다.

- 전체 분량 700~1000자.
- 마지막 줄에 "오늘 밤 하늘, 잘 보셨습니다. — 별지기"를 넣습니다.`;

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
function validate(g) {
  if (!g || typeof g !== "object") return false;
  if (!validSaju(g.a) || !validSaju(g.b)) return false;
  const s = g.score;
  if (!s || !Number.isFinite(s.total) || s.total < 0 || s.total > 100) return false;
  if (!GRADES.includes(s.grade)) return false;
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
  if (!(await aiGuard(req, res, "gunghap"))) return;   // 서버측 레이트리밋(IP당 분당/일당)

  const gunghap = req.body && req.body.gunghap;
  if (!validate(gunghap)) return res.status(400).json({ error: "bad_payload" });

  try {
    const wrote = await streamGemini(res, {
      system: SYSTEM,
      user:
        "다음은 만세력 엔진이 계산한 두 사람의 사주(a=나, b=그 사람)와 판정 결과, 그리고 astro(궤도 계산으로 얻은 두 생일의 실제 천문 배치)입니다. " +
        "score.constellation 이 있으면 그 별자리를 축으로, astro 의 실측 배치를 인용해 오늘 밤 관측 기록처럼 풀이해 주세요.\n" +
        JSON.stringify(gunghap),
      maxTokens: 1800,
      temperature: 0.85,
    });
    if (!wrote) res.write("\n[오늘은 구름이 짙어 더 볼 수 없었습니다. 다시 시도해 주세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
