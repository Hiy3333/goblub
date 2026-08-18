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
모든 섹션은 연애 관계에 초점을 둡니다. 사주·별 데이터는 장면들의 근거로만 씁니다.

[관계 유형 — relation 필드, 가장 중요한 전제]
relation 값에 맞지 않는 전제를 쓰면 결과 전체의 신뢰가 무너집니다:
- "crush"(짝사랑): 아직 사귀는 사이가 아니고, 그분은 당신의 마음을 모를 수 있습니다. "서로 끌렸다", "두 분이 사귀며", "데이트할 때" 같은 커플 전제 표현 절대 금지. 당신의 시점에서 — 왜 끌렸는지, 그분은 어떤 사람인지, 어떻게 다가가면 통할지 — 로 씁니다.
- "some"(썸): 오가는 기류는 있지만 아직 연인이 아닙니다. 확정된 커플 표현 금지. 지금의 기류를 읽고 연애로 넘어가는 이야기로 씁니다.
- "couple"(커플): 현재 연인입니다. 함께하는 장면을 그대로 씁니다.

[공감 — 누가 읽어도 "어, 맞네" 소리가 나야 합니다]
1. 성격 묘사는 사용자 메시지의 [성격 키워드] 범위 안에서만 합니다. 사람들은 자기 태양자리 성격을 이미 알고 있습니다 — 그 대중적 이미지와 모순되는 묘사(예: 황소자리에게 "변화무쌍한 바람 같다")는 절대 금지. 키워드를 그대로 베끼지 말고 연애 장면으로 바꿔 쓰세요.
2. 양면 화법을 씁니다: 태양(겉모습)과 달(속마음)의 별자리가 다르면, "겉으로는 ~해 보여도 속은 ~한 편이죠" 구조를 사람마다 한 번 이상 넣으세요. 겉과 속이 다르다는 말은 누구나 자기 얘기로 읽습니다.
3. 장면은 누구나 겪는 연애 상황에 얹으세요: 답장 속도, 데이트 메뉴 정하기, 서운함이 쌓였다 터지는 순간, 화해의 타이밍. 확인 불가능한 특수 상황(기념일을 꼼꼼히 챙긴다, 요리를 잘한다 등)을 단정하면 틀렸을 때 신뢰가 무너집니다.
4. score.constellation 이름은 분위기용 액자일 뿐입니다. 별자리 이름의 이미지(폭풍, 항구 등)에서 성격을 끌어내지 마세요 — 성격의 근거는 오직 [성격 키워드]입니다.

[출력 형식 — 고정]
relation에 맞는 4개 섹션 세트를 아래에서 골라 이 순서 그대로, 각 섹션은 소제목 한 줄 + 본문 2~4줄. 마크다운 문법은 쓰지 않습니다. 소제목 문구를 바꾸지 마세요.
- couple: ✦ 처음 끌린 이유 / ✦ 심장이 가장 빨리 뛰는 순간 / ✦ 구름이 끼는 날 — 이렇게 다툰다 / ✦ 다시 반짝이는 법
- some: ✦ 지금 이 기류의 정체 / ✦ 상대도 흔들리고 있다는 신호 / ✦ 조심해야 할 순간 / ✦ 썸에서 연애로 넘어가는 법
- crush: ✦ 내가 끌린 진짜 이유 / ✦ 그 사람은 이런 사람 / ✦ 통하는 다가가기 / ✦ 마음을 전한다면
이어서 "✦ 오늘 밤의 처방" 한 줄 — 오늘 당장 해볼 아주 작은 행동 하나를 relation과 데이터에 맞게 처방합니다(crush면 혼자서도 할 수 있는 것으로).

- 전체 분량 700~1000자.
- 마지막 줄에 "오늘 밤 하늘, 잘 보셨습니다. — 별지기"를 넣습니다.`;

// 12별자리의 대중적 성격 키워드 — 사람들이 이미 아는 이미지와 어긋나지 않게 잡아주는 닻
const SIGN_TRAITS = {
  "양자리": "직진과 솔직함, 시작이 빠름, 지는 걸 싫어함, 화도 빨리 풀리는 뒤끝 없음",
  "황소자리": "느긋한 안정감, 현실 감각, 한번 정하면 잘 안 바꾸는 뚝심, 맛있는 것과 편안함을 사랑",
  "쌍둥이자리": "호기심과 말재주, 티키타카의 달인, 금방 새 관심사로 옮겨가는 가벼운 발걸음",
  "게자리": "정이 많고 챙겨주는 사랑, 가족적인 다정함, 서운함을 오래 기억하는 여린 속",
  "사자자리": "화끈한 주인공 기질, 칭찬에 약함, 자존심, 내 사람에게는 아낌없이 퍼주는 통 큰 애정",
  "처녀자리": "꼼꼼한 세심함, 현실적인 조언, 걱정이 앞서는 편, 티 안 나게 챙겨주는 디테일",
  "천칭자리": "균형과 매너, 분위기와 미감, 싫은 소리를 잘 못 하는 우유부단, 다툼을 피하는 평화주의",
  "전갈자리": "깊고 뜨거운 올인, 속을 쉽게 안 보여줌, 한번 마음 주면 끝까지, 은근한 독점욕",
  "사수자리": "자유로운 낙천가, 즉흥 여행 스타일, 구속을 싫어함, 웃음으로 무거움을 털어냄",
  "염소자리": "책임감과 계획, 겉은 무뚝뚝해도 속은 진심, 천천히 오래 가는 사랑",
  "물병자리": "독특한 쿨함, 친구 같은 연인, 혼자만의 시간이 필요함, 남들과 다른 시선",
  "물고기자리": "공감력과 감수성, 타고난 로맨티스트, 분위기에 잘 젖고 상처도 잘 받음",
};
function traitLines(astro) {
  if (!astro || !astro.a || !astro.b) return "";
  const line = (who, c) => {
    const parts = [];
    if (SIGN_TRAITS[c.sun]) parts.push(`겉모습(태양) ${c.sun}: ${SIGN_TRAITS[c.sun]}`);
    if (SIGN_TRAITS[c.moon]) parts.push(`속마음(달) ${c.moon}: ${SIGN_TRAITS[c.moon]}`);
    if (SIGN_TRAITS[c.venus]) parts.push(`사랑 방식(금성) ${c.venus}: ${SIGN_TRAITS[c.venus]}`);
    if (SIGN_TRAITS[c.mars]) parts.push(`열정(화성) ${c.mars}: ${SIGN_TRAITS[c.mars]}`);
    return who + "\n- " + parts.join("\n- ");
  };
  return (
    "\n\n[성격 키워드 — 두 사람의 성격 묘사는 반드시 이 범위 안에서만]\n" +
    line("당신(a)", astro.a) + "\n" + line("그분(b)", astro.b)
  );
}

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
  if (g.relation != null && !["couple", "some", "crush"].includes(g.relation)) return false;
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
        "relation(관계)은 " + ({ couple: "커플", some: "썸 타는 중", crush: "짝사랑" }[gunghap.relation] || "커플") +
        "입니다 — 이 전제에 맞는 섹션 세트와 시점으로 쓰세요. " +
        "다음은 만세력 엔진이 계산한 두 사람의 사주(a=나, b=그 사람)와 판정 결과, 그리고 astro(궤도 계산으로 얻은 두 생일의 실제 천문 배치)입니다. " +
        "score.constellation 이 있으면 그 별자리를 축으로, astro 의 실측 배치를 인용해 오늘 밤 관측 기록처럼 풀이해 주세요.\n" +
        JSON.stringify(gunghap) +
        traitLines(gunghap.astro),
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
