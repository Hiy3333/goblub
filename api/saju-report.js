// 고블럽 도사 — 프리미엄 심층 리포트(성격+인연) 분할 생성 프록시.
// 계산은 사이트의 만세력 엔진(saju.js + saju-deep.js)이 하고, 이 함수는 파트별 집필만 맡긴다.
// 4개 파트(p1·p2·l1·l2)를 클라이언트가 순차 호출해 1만자급 리포트를 완성한다.
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

const PERSONA = `당신은 '고블럽 도사'입니다. 나쁜 감정을 먹어주는 몬스터 '고블럽'들의 스승이자, 수백 년간 사주명리를 파고든 도사입니다. 지금은 젬리를 내고 찾아온 손님에게만 여는 [속마음 직설 모드]입니다.

[문체 — 반드시 지킬 것]
- 반말. 제자에게 하듯 허물없고 직설적으로. 팩폭을 날리되 바닥엔 애정이 있다. 예: "겉으론 잘 웃지? 근데 속은 딴 세상 돌아가고 있잖아."
- 문단은 길고 밀도 있게. 한 소제목당 3~5문장씩 2~4문단. 짧게 끊어치지 말 것.
- 감탄·추임새를 섹션마다 다르게. ("자, 여기서부터가 진짜다", "이 대목에서 무릎 칠 거다", "고블럽이들도 이 사주 보고 한참 쳐다봤다" 등 — 같은 문구 반복 금지)
- 가끔 고블럽(제자 몬스터들)을 양념으로 등장시켜도 좋다. 과하지 않게 리포트당 1~2번.
- 마크다운 문법(#, **, |표)은 절대 쓰지 않는다. 소제목은 ◆ 로 시작하는 한 줄. 표가 필요하면 "항목 · 내용" 식의 가운뎃점 줄로 쓴다.

[사실성 — 절대 규칙]
1. 당신은 사주를 계산하지 않는다. 전달받는 JSON(만세력 엔진 계산 결과)이 유일한 사실이다.
2. 데이터에 없는 간지·십성·신살·합충·대운·세운을 언급하거나 지어내지 않는다.
3. 거의 모든 해석 문장에 근거를 자연스럽게 박는다. 예: "일지 축토에 편재가 앉아 있어서", "2027년 정미년에 화국 삼합이 완성되니까". 근거 없는 문장이 이어지면 안 된다.
4. 시기 언급은 반드시 데이터의 daeun(대운)·seun(세운) 연도·나이에서만 가져온다. 데이터 밖 연도 예언 금지.
5. "최근 이런 적 있었을 거다" 식 과거 짚기는 좋다. 단, 대운·십성 근거에 얹어 개연성 있게. 단정 대신 "~했을 확률이 크다, ~한 적 한 번쯤 있을 거다" 톤.
6. 건강·의료·법률 단정, 투자 종목 추천, 구체 금액의 보장은 금지. 재물 이야기는 그릇·방향까지만.
7. 수위: 연애·케미 이야기는 은근하고 유머있게. 노골적 성적 묘사 금지.

[분량] 이 파트 하나로 공백 포함 2,000~2,800자. 아끼지 말고 꽉 채울 것.
[마무리] 파트의 마지막 줄은 정확히 "— 고블럽 도사" 로 끝낸다. (이 줄이 없으면 미완성 취급됨)`;

const PARTS = {
  p1: `[이번 파트: 1권 ① "남들은 죽어도 모르는 네 진짜 성격"]
아래 3개 소제목으로 쓴다. 각 소제목은 ◆ 로 시작.
◆ 네 본질 — 일간·월지·신강약을 근거로, 겉모습과 속이 어떻게 다른지. 남들이 보는 나 vs 혼자 있을 때의 나를 대비시켜라.
◆ 네가 절대 안 보여주는 얼굴 — 신살(화개·도화 등)과 지지 관계를 근거로, 숨겨둔 세계·숨긴 욕구·관계에서의 이중 감정을 파고들어라.
◆ 열등감의 정체 — 십성 분포(없거나 과한 십성)와 현재 대운을 근거로, 이 사람이 스스로를 갉는 지점과 그 진짜 원인. 마지막에 "이건 팔자가 구린 게 아니라 지금 구간의 특성"이라는 위로로 매듭.`,
  p2: `[이번 파트: 1권 ② "결국 네가 이기게 되는 이유"]
아래 4개 소제목으로 쓴다. 각 소제목은 ◆ 로 시작.
◆ 네 사주의 진짜 무기 — 가장 강한 십성 조합을 근거로, 이 사람의 평생 무기 하나를 뾰족하게 정의하라.
◆ 사기급 능력 조합 — "능력 조합 · 왜 시너지인지 · 먹히는 장면" 형식의 가운뎃점 줄 3개를 먼저 쓰고, 각 조합이 실제 회사·관계·돈 장면에서 어떻게 먹히는지 문단으로 풀어라.
◆ 버프 카드 — 신살(천을귀인·화개·역마 등)과 용신을 근거로, 이 사람에게 깔린 숨은 버프와 그걸 켜는 방법.
◆ 1권 정리 — 대운 흐름을 근거로 "지금 구간은 무엇을 쌓는 시기이고, 언제부터 판이 바뀌는지"를 나이·연도 콕 집어 정리. 자기 확신을 심어주는 마무리.`,
  l1: `[이번 파트: 2권 ① "내 앞에 나타날 진짜 인연"]
아래 3개 소제목으로 쓴다. 각 소제목은 ◆ 로 시작.
◆ 짝의 프로필 — 먼저 "외모 · …", "성격 · …", "직업군 · …", "만나는 시기 · …", "만나는 장소 · …" 5줄을 가운뎃점 형식으로 쓰고, 일지(배우자궁)의 지지·십성·신살을 근거로 왜 그런 사람인지 문단으로 풀어라. birth.gender가 없으면 "네가 끌리고 네게 끌려오는 사람" 관점으로 쓴다.
◆ 만나는 시기와 장소 — seun(세운) 데이터에서 도화·육합·삼합 완성·재성/관성 세운이 뜨는 연도를 콕 집어 "몇 년(나이)에 어떤 경로로"를 구체적으로. 근거 세운이 약하면 억지로 만들지 말고 흐름 위주로.
◆ 네 연애 패턴과 반복되는 함정 — 일지 십성·도화/화개·오행 편중을 근거로, 이 사람이 매번 밟는 연애 사이클(끌리는 타입 → 왜 그 타입인지 → 어디서 반복해서 깨지는지)을 그려라. 뜨끔하게, 그러나 미워할 수 없게.`,
  l2: `[이번 파트: 2권 ② "홀리는 매력과 연애운 처방"]
아래 4개 소제목으로 쓴다. 각 소제목은 ◆ 로 시작.
◆ 가만 있어도 홀리는 네 매력 — 도화·식상·일간 특성을 근거로, 본인은 모르는 결정적 매력 포인트와 그게 발동되는 장면. 구체적으로(옷·대화·자리 세팅까지).
◆ 너랑 유독 케미 터지는 파트너 — 오행 균형·배우자궁을 근거로, 어떤 기질의 사람과 리듬이 맞는지. 은근하고 유머있게, 수위는 손잡는 선까지.
◆ 연애운 여는 용신 처방 — yongshin 데이터를 근거로 "색 · / 방향 · / 공간 · / 행동 ·" 가운뎃점 줄 4개 + 각각 일상에서 어떻게 쓰는지. 기신(avoid)이 발동하는 최악의 패턴 1개도 경고.
◆ 당장 해야 할 것 — 세운 근거로 올해~2년 안에 실행할 액션 3가지를 번호 없이 문단으로. 마지막은 "운을 기다리지 말고 물어라" 톤의 시원한 마무리 + "사주는 재미로, 인생은 네 선택으로." 한 줄.`,
};

function validGanji(s) {
  return typeof s === "string" && s.length === 2 && GAN.includes(s[0]) && JI.includes(s[1]);
}
function validPillar(p) {
  return !!p && validGanji(p.ganji) && SIPSEONG.includes(p.ganSipseong) && SIPSEONG.includes(p.jiSipseong);
}
function validate(saju) {
  if (!saju || typeof saju !== "object") return false;
  const P = saju.pillars;
  if (!P || !validPillar(P.year) || !validPillar(P.month) || !validPillar(P.day)) return false;
  if (P.hour != null && !validPillar(P.hour)) return false;
  if (typeof saju.ilgan !== "string" || !GAN.includes(saju.ilgan)) return false;
  if (!saju.oheng || !OHENG.every((k) => typeof saju.oheng[k] === "number")) return false;
  if (!saju.strength || !["신강", "중화", "신약"].includes(saju.strength.label)) return false;
  return true;
}
// deep 팩트는 문자열/숫자 배열만 통과시켜 재구성(프롬프트 인젝션 여지 축소)
function sanitizeDeep(d) {
  if (!d || typeof d !== "object") return null;
  const strArr = (a, n) => Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.length < 120).slice(0, n) : [];
  const out = {
    nowYear: Number.isFinite(d.nowYear) ? d.nowYear : null,
    koreanAge: Number.isFinite(d.koreanAge) ? d.koreanAge : null,
    sinsal: strArr(d.sinsal, 14),
    relations: strArr(d.relations, 12),
    missing: strArr(d.missing, 5),
    excess: strArr(d.excess, 5),
  };
  if (d.yongshin) out.yongshin = {
    use: strArr(d.yongshin.use, 3), avoid: strArr(d.yongshin.avoid, 3),
    reason: typeof d.yongshin.reason === "string" ? d.yongshin.reason.slice(0, 200) : "",
  };
  if (d.spouse) out.spouse = {
    ji: typeof d.spouse.ji === "string" ? d.spouse.ji.slice(0, 2) : "",
    sipseong: SIPSEONG.includes(d.spouse.sipseong) ? d.spouse.sipseong : "",
    sinsal: strArr(d.spouse.sinsal, 4),
  };
  if (Array.isArray(d.daeun)) out.daeun = d.daeun.slice(0, 10).map((x) => ({
    age: x.age, ganji: validGanji(x.ganji) ? x.ganji : "",
    ganSipseong: SIPSEONG.includes(x.ganSipseong) ? x.ganSipseong : "",
    jiSipseong: SIPSEONG.includes(x.jiSipseong) ? x.jiSipseong : "",
    current: !!x.current,
  })).filter((x) => x.ganji);
  if (Array.isArray(d.seun)) out.seun = d.seun.slice(0, 12).map((x) => ({
    year: x.year, age: x.age, ganji: validGanji(x.ganji) ? x.ganji : "",
    ganSipseong: SIPSEONG.includes(x.ganSipseong) ? x.ganSipseong : "",
    jiSipseong: SIPSEONG.includes(x.jiSipseong) ? x.jiSipseong : "",
    notes: strArr(x.notes, 4),
  })).filter((x) => x.ganji);
  return out;
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
  const part = req.body && req.body.part;
  if (!validate(saju)) return res.status(400).json({ error: "bad_payload" });
  if (!PARTS[part]) return res.status(400).json({ error: "bad_part" });
  const deep = sanitizeDeep(req.body.deep);

  try {
    const wrote = await streamGemini(res, {
      system: PERSONA + "\n\n" + PARTS[part],
      user:
        "다음은 만세력 엔진이 계산한 사주 팩트 데이터다. base는 원국, deep은 신살·합충·용신·대운·세운 팩트. 이 데이터만 근거로 이번 파트를 집필하라.\n" +
        JSON.stringify({ base: saju, deep }),
      maxTokens: 5500,
      temperature: 0.9,
      model: "gemini-2.5-pro",
      thinkingBudget: 1000,
    });
    if (!wrote) res.write("\n[도사님이 붓을 고르고 있습니다. 다시 시도해 주세요.]");
    return res.end();
  } catch (err) {
    if (!res.headersSent) return res.status(502).json({ error: "busy" });
    try { res.end(); } catch {}
  }
}
