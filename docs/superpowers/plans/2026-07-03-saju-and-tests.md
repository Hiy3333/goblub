# goblub 사주·심리테스트·MBTI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 만세력 정밀 절입시각 기반 사주 페이지 + 공용 퀴즈 엔진 기반 테스트 3종(연애·스트레스·MBTI)을 goblub에 추가하고 배포한다.

**Architecture:** Python 스크립트가 만세력 SQLite에서 12절 절입시각을 JSON(~35KB)으로 내보내며 일진 수식을 DB 전건과 대조(게이트). 사이트는 순수 JS로 사주팔자를 계산. 퀴즈 3종은 엔진(`play/js/quiz.js`) 하나에 페이지별 설정 객체만 주입.

**Tech Stack:** Python 3(sqlite3, 내보내기 전용), Vanilla JS, 기존 goblub 정적 사이트 구조.

**검증 방식:** 내보내기 게이트(불일치 0건) + 브라우저 검증(Claude Preview / `python -m http.server 8777`) + 알려진 사주 사례 콘솔 대조.

**콘텐츠 문구 주의:** 이 계획의 질문·결과·풀이 텍스트는 초안이다. 실행자는 오탈자 수정 수준을 넘는 변경은 하지 않는다(내용 재작성 금지).

---

### Task 1: 절입시각 JSON 내보내기 (+일진 검증 게이트)

**Files:**
- Create: `scripts/export_saju_data.py`
- Create: `play/data/saju-terms.json` (스크립트 실행 결과물)

- [ ] **Step 1: `scripts/export_saju_data.py` 작성**

```python
"""만세력 SQLite → 사주용 절입시각 JSON 내보내기.

- 월주 경계인 12절(節)만 추출: 소한~대설 (중기 제외)
- 일진 수식 (jdn - ANCHOR_JDN) % 60 을 days 테이블 전건과 대조. 불일치 시 중단.
실행: python scripts/export_saju_data.py  (저장소 루트에서)
"""
import json
import sqlite3
from pathlib import Path

DB = r"C:\Users\Hi\Desktop\test2\manseryeok.sqlite"
OUT = Path(__file__).resolve().parent.parent / "play" / "data" / "saju-terms.json"
ANCHOR_JDN = 2460671  # 2024-12-26 = 갑자일 (day_ganji=0)
JEOL = ["소한", "입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설"]

con = sqlite3.connect(DB)
cur = con.cursor()

rows = cur.execute("SELECT jdn, day_ganji FROM days").fetchall()
bad = [(j, g) for j, g in rows if (j - ANCHOR_JDN) % 60 != g]
if bad:
    raise SystemExit(f"일진 대조 실패: {len(bad)}/{len(rows)}건 불일치 → 중단. 예: {bad[:3]}")
print(f"일진 검증 OK: {len(rows)}건 전부 일치")

terms = {}
for year in range(1900, 2101):
    by_name = dict(
        cur.execute("SELECT term_name, term_kst FROM solar_terms WHERE year=?", (year,))
    )
    arr = []
    for name in JEOL:
        kst = by_name[name]  # 결손이면 KeyError로 중단
        arr.append(kst[5:7] + "-" + kst[8:10] + " " + kst[11:16])  # 'MM-DD HH:MM'
    terms[str(year)] = arr

OUT.parent.mkdir(parents=True, exist_ok=True)
payload = {
    "anchorJdn": ANCHOR_JDN,
    "note": "terms[year] = [소한,입춘,경칩,청명,입하,망종,소서,입추,백로,한로,입동,대설] 'MM-DD HH:MM' KST",
    "terms": terms,
}
OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"저장: {OUT} ({OUT.stat().st_size} bytes)")
```

- [ ] **Step 2: 실행 및 게이트 통과 확인**

Run: `python scripts/export_saju_data.py`
Expected: `일진 검증 OK: 1207건 전부 일치` + `저장: ...saju-terms.json (약 30~40KB)`. 불일치로 중단되면 STOP하고 사용자에게 보고.

- [ ] **Step 3: JSON 샘플 눈검증**

`play/data/saju-terms.json`에서 `"1900"` 배열 첫 값이 `"01-06 03:04"`(소한), 두 번째가 `"02-04 14:51"`(입춘)인지 확인.

- [ ] **Step 4: 커밋**

```bash
git add scripts/export_saju_data.py play/data/saju-terms.json
git commit -m "feat: 만세력 절입시각 JSON 내보내기(일진 전건 검증 게이트)"
```

---

### Task 2: 사주 계산 모듈 + 사주 페이지

**Files:**
- Create: `play/js/saju.js`
- Create: `play/saju.html`
- Modify: `css/style.css` (사주/퀴즈 공용 위젯 스타일 추가)

- [ ] **Step 1: `play/js/saju.js` 작성 — 계산부**

```js
// goblub 사주 계산 모듈. window.Saju = { compute, GAN, JI, ... }
(function () {
  var GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  var GAN_HANJA = "甲乙丙丁戊己庚辛壬癸";
  var JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  var JI_HANJA = "子丑寅卯辰巳午未申酉戌亥";
  var GAN_OHENG = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
  var JI_OHENG = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
  var ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  // terms 배열 인덱스 → 그 절 이후의 월지: 소한→축, 입춘→인, ... 대설→자
  var TERM_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];

  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
      Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // birth: {y,m,d,hour,min} (hour=null이면 시주 생략, 경계판정은 12:00 가정)
  function compute(data, birth) {
    var h = birth.hour == null ? 12 : birth.hour;
    var mi = birth.hour == null ? 0 : birth.min;
    var stamp = ts(birth.y, birth.m, birth.d, h, mi);

    // 년주: 입춘(terms[1]) 기준
    var ipchun = termTs(data, birth.y, 1);
    var effYear = stamp < ipchun ? birth.y - 1 : birth.y;
    var yIdx = ((effYear - 4) % 60 + 60) % 60;

    // 월주: 출생년의 절들 중 마지막으로 지난 절. 소한 이전이면 전년 대설 이후 = 자월.
    var branch = 0; // 자
    for (var i = 0; i < 12; i++) {
      if (stamp >= termTs(data, birth.y, i)) branch = TERM_BRANCH[i];
      else break;
    }
    var yGan = yIdx % 10;
    var startGan = (((yGan % 5) * 2) + 2) % 10; // 오호둔: 인월의 월간
    var mOffset = (branch - 2 + 12) % 12; // 인=0 … 축=11
    var mGan = (startGan + mOffset) % 10;

    // 일주: 23시 이후는 다음날로
    var j = jdn(birth.y, birth.m, birth.d);
    if (birth.hour != null && birth.hour >= 23) j += 1;
    var dIdx = ((j - data.anchorJdn) % 60 + 60) % 60;

    // 시주 (오서둔)
    var hourPillar = null;
    if (birth.hour != null) {
      var hBranch = Math.floor(((birth.hour + 1) % 24) / 2);
      var hGan = ((dIdx % 10) % 5 * 2 + hBranch) % 10;
      hourPillar = [hGan, hBranch];
    }

    var pillars = {
      year: [yGan, yIdx % 12],
      month: [mGan, branch],
      day: [dIdx % 10, dIdx % 12],
      hour: hourPillar
    };
    var oheng = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    ["year", "month", "day", "hour"].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      oheng[GAN_OHENG[p[0]]]++;
      oheng[JI_OHENG[p[1]]]++;
    });
    return {
      pillars: pillars,
      ilgan: pillars.day[0],
      zodiac: ZODIAC[yIdx % 12],
      oheng: oheng
    };
  }

  function ts(y, m, d, h, mi) { return ((y * 100 + m) * 100 + d) * 10000 + h * 100 + mi; }
  function termTs(data, year, idx) {
    var t = data.terms[String(year)][idx]; // 'MM-DD HH:MM'
    return ts(year, +t.slice(0, 2), +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
  }

  function pillarText(p) {
    return {
      hanja: GAN_HANJA[p[0]] + JI_HANJA[p[1]],
      hangul: GAN[p[0]] + JI[p[1]]
    };
  }

  window.Saju = { compute: compute, pillarText: pillarText, GAN: GAN, JI: JI };
})();
```

- [ ] **Step 2: `play/js/saju.js`에 풀이 데이터 추가 (같은 파일 하단, IIFE 앞이나 뒤 아무데나 — 두 번째 IIFE로)**

```js
// 풀이 텍스트
(function () {
  window.SajuText = {
    ilgan: [
      "큰 나무(甲木)처럼 곧고 당당한 리더형이에요. 한번 정한 방향은 흔들림 없이 밀고 나가고, 주변에 그늘을 내어주는 든든함이 있어요. 다만 가끔은 휘어질 줄 아는 유연함도 필요해요.",
      "들풀과 덩굴(乙木)처럼 부드럽지만 끈질긴 생존력의 소유자예요. 어떤 환경에서도 길을 찾아내는 적응력이 최고 무기! 은근한 고집은 아무도 못 말려요.",
      "태양(丙火)처럼 밝고 화끈한 에너지의 소유자예요. 어디서든 존재감이 빛나고 사람들을 끌어당겨요. 다만 열정이 과열되면 금방 지칠 수 있으니 완급 조절이 포인트.",
      "촛불과 달빛(丁火)처럼 섬세하고 따뜻한 감성파예요. 통찰력이 깊어 사람 마음을 잘 읽고, 조용히 주변을 밝혀요. 속마음을 너무 감추지만 않으면 금상첨화.",
      "큰 산(戊土)처럼 묵직하고 믿음직한 사람이에요. 쉽게 흔들리지 않는 안정감으로 주변의 기둥이 되어줘요. 가끔 고집이 산만큼 클 수 있다는 건 비밀.",
      "기름진 밭(己土)처럼 포용력 있고 실속 있는 타입이에요. 남을 키워주고 보듬는 데 재능이 있어요. 정작 자기 챙기는 건 뒷전이 되기 쉬우니 셀프 케어 잊지 마세요.",
      "무쇠와 바위(庚金)처럼 결단력 있고 의리 넘치는 타입! 옳다고 믿으면 정면 돌파하는 강단이 있어요. 날이 너무 서 있으면 주변이 긴장하니 가끔은 칼집에 넣어두기.",
      "보석(辛金)처럼 세련되고 예리한 감각의 소유자예요. 디테일에 강하고 완성도에 대한 기준이 높아요. 스스로에게도 남에게도 조금만 너그러워지면 완벽.",
      "큰 강물(壬水)처럼 스케일 크고 지혜로운 자유인이에요. 새로운 것을 향한 호기심이 넘치고 발상이 유연해요. 흐르다 보면 산만해질 수 있으니 물길 하나는 정해두기.",
      "이슬비와 옹달샘(癸水)처럼 맑고 섬세한 직관파예요. 조용해 보여도 속에는 깊은 생각이 흐르고 있어요. 예민한 만큼 혼자 충전하는 시간이 꼭 필요해요."
    ],
    ohengMost: {
      목: "오행 중 나무(木) 기운이 가장 많아요. 성장욕과 추진력이 넘치는 타입!",
      화: "오행 중 불(火) 기운이 가장 많아요. 열정과 표현력이 넘치는 타입!",
      토: "오행 중 흙(土) 기운이 가장 많아요. 신뢰감과 안정감이 강점인 타입!",
      금: "오행 중 쇠(金) 기운이 가장 많아요. 결단력과 원칙이 뚜렷한 타입!",
      수: "오행 중 물(水) 기운이 가장 많아요. 지혜와 유연함이 흐르는 타입!"
    },
    ohengNone: {
      목: "나무(木) 기운이 비어 있어요. 새로운 시작 앞에서 머뭇거릴 때는 초록 식물 곁에서 기운을 빌려보세요.",
      화: "불(火) 기운이 비어 있어요. 표현이 아쉬울 땐 밝은 색 옷과 햇볕이 도움이 된대요.",
      토: "흙(土) 기운이 비어 있어요. 마음이 붕 뜰 때는 흙 밟기, 산책으로 중심을 잡아보세요.",
      금: "쇠(金) 기운이 비어 있어요. 결정이 어려울 땐 마감 시간을 정해두는 습관이 좋아요.",
      수: "물(水) 기운이 비어 있어요. 생각이 막힐 땐 물가 산책이나 반신욕이 특효약!"
    }
  };
})();
```

- [ ] **Step 3: `css/style.css` 끝에 콘텐츠 위젯 공용 스타일 추가**

```css
/* ===== 콘텐츠 페이지 공용 (사주·퀴즈) ===== */
.panel {
  background: #fff;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow);
  padding: 28px 24px;
  max-width: 620px;
  margin: 0 auto 20px;
}

.panel h2 { margin-bottom: 14px; font-size: 1.25rem; }

.field-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.field-row label { align-self: center; color: var(--ink-soft); }

select, input[type="number"] {
  font-family: inherit;
  font-size: 1rem;
  padding: 8px 10px;
  border: 2px solid #e8e2d4;
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
}

.btn-primary {
  background: var(--coral);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 26px;
  font-family: inherit;
  font-size: 1.05rem;
  cursor: pointer;
}

.btn-primary:hover { filter: brightness(1.05); }

.btn-ghost {
  background: transparent;
  color: var(--ink-soft);
  border: 2px solid #e8e2d4;
  border-radius: 999px;
  padding: 10px 22px;
  font-family: inherit;
  font-size: 0.95rem;
  cursor: pointer;
}

.error-msg { color: #d64545; margin-top: 8px; display: none; }

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  text-align: center;
  margin: 18px 0;
}

.pillar {
  background: var(--cream);
  border-radius: 14px;
  padding: 14px 6px;
}

.pillar .hanja { font-size: 1.7rem; display: block; }
.pillar .hangul { color: var(--ink-soft); font-size: 0.9rem; }
.pillar .role { font-size: 0.78rem; color: var(--ink-soft); display: block; margin-bottom: 6px; }

.oheng-bars { margin: 14px 0; }
.oheng-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.oheng-row .name { width: 3.2em; }
.oheng-row .bar { height: 14px; border-radius: 7px; }
.oheng-row .cnt { color: var(--ink-soft); font-size: 0.9rem; }
.oheng-목 { background: var(--mint); }
.oheng-화 { background: var(--coral); }
.oheng-토 { background: var(--yellow); }
.oheng-금 { background: #c9c9c9; }
.oheng-수 { background: var(--sky); }

.fine-print { text-align: center; color: var(--ink-soft); font-size: 0.85rem; margin-top: 18px; }

/* 퀴즈 */
.progress-track { background: #efe9db; border-radius: 999px; height: 10px; margin-bottom: 20px; }
.progress-fill { background: var(--mint); height: 10px; border-radius: 999px; transition: width 0.2s; }
.quiz-q { font-size: 1.2rem; margin-bottom: 18px; }
.choice-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--cream);
  border: 2px solid transparent;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 1rem;
  color: var(--ink);
  cursor: pointer;
}
.choice-btn:hover { border-color: var(--sky); }
.result-emoji { font-size: 3.2rem; text-align: center; display: block; margin-bottom: 8px; }
.result-name { text-align: center; font-size: 1.5rem; margin-bottom: 10px; }
.result-desc { color: var(--ink-soft); line-height: 1.6; }
.result-actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }

@media (max-width: 480px) {
  .pillar .hanja { font-size: 1.3rem; }
}
```

- [ ] **Step 4: `play/saju.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>사주 보기 — goblub</title>
  <meta name="description" content="만세력 정밀 절입시각으로 계산하는 나의 사주팔자" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <div id="site-header"></div>

  <main>
    <section class="hero">
      <h1>🔮 나의 사주팔자</h1>
      <p>생년월일시로 보는 사주 — 절기 경계까지 분 단위로 정확하게</p>
    </section>

    <section class="panel" id="input-panel">
      <h2>언제 태어났나요?</h2>
      <div class="field-row">
        <select id="in-year"></select>
        <select id="in-month"></select>
        <select id="in-day"></select>
      </div>
      <div class="field-row">
        <select id="in-hour">
          <option value="">태어난 시 몰라요</option>
        </select>
        <label for="in-min">분</label>
        <input type="number" id="in-min" min="0" max="59" value="0" style="width:70px" />
      </div>
      <button class="btn-primary" id="btn-go">사주 보기</button>
      <p class="error-msg" id="err"></p>
    </section>

    <section class="panel" id="result-panel" style="display:none">
      <h2 id="r-title"></h2>
      <div class="pillar-grid" id="r-pillars"></div>
      <div class="oheng-bars" id="r-oheng"></div>
      <p id="r-ilgan" style="line-height:1.7"></p>
      <p id="r-oheng-txt" style="line-height:1.7; margin-top:10px; color:var(--ink-soft)"></p>
      <div class="result-actions">
        <button class="btn-ghost" onclick="document.getElementById('result-panel').style.display='none'; document.getElementById('input-panel').scrollIntoView();">다시 보기</button>
      </div>
    </section>

    <p class="fine-print">사주는 재미로 봐주세요 🙂 절입시각 데이터: 만세력(KASI 검증) 기반</p>
  </main>

  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/saju.js"></script>
  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };
      var data = null;

      fetch("data/saju-terms.json")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { data = d; })
        .catch(function () { showErr("데이터를 불러오지 못했어요. 새로고침 해주세요."); });

      // 셀렉트 채우기
      var y = $("in-year"), m = $("in-month"), d = $("in-day"), h = $("in-hour");
      for (var i = 2100; i >= 1900; i--) y.add(new Option(i + "년", i));
      y.value = 1995;
      for (i = 1; i <= 12; i++) m.add(new Option(i + "월", i));
      for (i = 1; i <= 31; i++) d.add(new Option(i + "일", i));
      for (i = 0; i <= 23; i++) h.add(new Option(i + "시", i));

      function showErr(msg) { var e = $("err"); e.textContent = msg; e.style.display = "block"; }

      $("btn-go").onclick = function () {
        $("err").style.display = "none";
        if (!data) { showErr("데이터를 불러오지 못했어요. 새로고침 해주세요."); return; }
        var yy = +y.value, mm = +m.value, dd = +d.value;
        var date = new Date(yy, mm - 1, dd);
        if (date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
          showErr("없는 날짜예요. 다시 확인해주세요!"); return;
        }
        var hour = h.value === "" ? null : +h.value;
        var min = Math.min(59, Math.max(0, +($("in-min").value || 0)));
        var r = Saju.compute(data, { y: yy, m: mm, d: dd, hour: hour, min: min });
        render(r, hour != null);
        $("result-panel").style.display = "block";
        $("result-panel").scrollIntoView({ behavior: "smooth" });
      };

      function render(r, hasHour) {
        $("r-title").textContent = "🐭 ".replace("쥐", "") && (zodiacEmoji(r.zodiac) + " " + r.zodiac + "띠의 사주");
        var roles = [["시주", r.pillars.hour], ["일주", r.pillars.day], ["월주", r.pillars.month], ["년주", r.pillars.year]];
        var html = "";
        roles.forEach(function (pair) {
          if (!pair[1]) {
            html += '<div class="pillar"><span class="role">' + pair[0] + '</span><span class="hanja">?</span><span class="hangul">몰라요</span></div>';
            return;
          }
          var t = Saju.pillarText(pair[1]);
          html += '<div class="pillar"><span class="role">' + pair[0] + '</span><span class="hanja">' + t.hanja + '</span><span class="hangul">' + t.hangul + "</span></div>";
        });
        $("r-pillars").innerHTML = html;

        var total = hasHour ? 8 : 6;
        var bars = "";
        ["목", "화", "토", "금", "수"].forEach(function (k) {
          var n = r.oheng[k];
          bars += '<div class="oheng-row"><span class="name">' + k + '</span><div class="bar oheng-' + k + '" style="width:' + (n / total * 100) + '%"></div><span class="cnt">' + n + "</span></div>";
        });
        $("r-oheng").innerHTML = bars;

        $("r-ilgan").textContent = "🌱 나의 일간은 「" + Saju.GAN[r.ilgan] + "」 — " + SajuText.ilgan[r.ilgan];

        var most = "목", none = [];
        ["목", "화", "토", "금", "수"].forEach(function (k) {
          if (r.oheng[k] > r.oheng[most]) most = k;
          if (r.oheng[k] === 0) none.push(k);
        });
        var txt = SajuText.ohengMost[most];
        if (none.length) txt += " " + SajuText.ohengNone[none[0]];
        $("r-oheng-txt").textContent = txt;
      }

      function zodiacEmoji(z) {
        return { 쥐: "🐭", 소: "🐮", 호랑이: "🐯", 토끼: "🐰", 용: "🐲", 뱀: "🐍", 말: "🐴", 양: "🐑", 원숭이: "🐵", 닭: "🐔", 개: "🐶", 돼지: "🐷" }[z] || "🔮";
      }
    })();
  </script>
</body>
</html>
```

주의: `render()`의 `r-title` 줄에서 `"🐭 ".replace(...) &&` 부분은 오타 유발 위험 — 실행 시 아래처럼 단순하게 쓴다:

```js
$("r-title").textContent = zodiacEmoji(r.zodiac) + " " + r.zodiac + "띠의 사주";
```

- [ ] **Step 5: 브라우저 검증 — 알려진 사례 3건 대조**

로컬 서버에서 `http://localhost:8777/play/saju.html` 접속 후, 콘솔(preview_eval)에서:

```js
fetch("data/saju-terms.json").then(r=>r.json()).then(d=>{
  var t1 = Saju.compute(d, {y:2024,m:12,d:26,hour:12,min:0});   // 일주 갑자, 월주 병자, 년주 갑진, 시주 경오
  var t2 = Saju.compute(d, {y:2024,m:2,d:4,hour:10,min:0});     // 입춘(16:27) 전 → 년주 계묘, 월주 을축
  var t3 = Saju.compute(d, {y:2024,m:2,d:5,hour:10,min:0});     // 입춘 후 → 년주 갑진, 월주 병인
  console.log(JSON.stringify([t1.pillars, t2.pillars, t3.pillars]));
});
```

Expected(간지 인덱스):
- t1: day=[0,0](갑자), month=[2,0](병자), year=[0,8](갑진), hour=[6,6](경오)
- t2: year=[9,7](계묘), month=[1,1](을축)
- t3: year=[0,8](갑진), month=[2,2](병인)

하나라도 다르면 STOP — 계산 로직 재검토.

- [ ] **Step 6: UI 검증**

입력 폼에서 1995-3-15, 14시 30분 입력 → 결과 패널: 기둥 4개(한자+한글), 오행 막대, 일간 풀이 문단 표시. "시 몰라요" 선택 시 시주 칸이 "?"로 표시. 2월 30일 입력 시 에러 문구.

- [ ] **Step 7: 커밋**

```bash
git add play/js/saju.js play/saju.html css/style.css
git commit -m "feat: 사주 페이지(만세력 절입시각 기반 사주팔자·오행·풀이)"
```

---

### Task 3: 공용 퀴즈 엔진

**Files:**
- Create: `play/js/quiz.js`

- [ ] **Step 1: `play/js/quiz.js` 작성**

```js
// goblub 공용 퀴즈 엔진.
// 사용: Quiz.init(document.getElementById("quiz"), config)
// config = {
//   emoji, title, intro,                       // 시작 화면
//   questions: [{ q, choices: [{ text, scores: {키:점수} }] }],
//   results: { 키: { emoji, name, desc } },
//   resolve: function(totals) -> 결과키,
//   extraResultHTML: (선택) 결과 카드 하단에 붙일 HTML 문자열
// }
(function () {
  function init(el, config) {
    var idx = 0;
    var totals = {};

    function addScores(scores) {
      for (var k in scores) totals[k] = (totals[k] || 0) + scores[k];
    }

    function renderStart() {
      idx = 0; totals = {};
      el.innerHTML =
        '<span class="result-emoji">' + config.emoji + "</span>" +
        '<h2 style="text-align:center">' + config.title + "</h2>" +
        '<p class="result-desc" style="text-align:center; margin:12px 0 20px">' + config.intro + "</p>" +
        '<div class="result-actions"><button class="btn-primary" id="qz-start">시작하기</button></div>';
      el.querySelector("#qz-start").onclick = renderQ;
    }

    function renderQ() {
      var q = config.questions[idx];
      var pct = Math.round(idx / config.questions.length * 100);
      var html =
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="quiz-q">Q' + (idx + 1) + ". " + q.q + "</p>";
      q.choices.forEach(function (c, i) {
        html += '<button class="choice-btn" data-i="' + i + '">' + c.text + "</button>";
      });
      el.innerHTML = html;
      Array.prototype.forEach.call(el.querySelectorAll(".choice-btn"), function (btn) {
        btn.onclick = function () {
          addScores(q.choices[+btn.dataset.i].scores);
          idx++;
          if (idx < config.questions.length) renderQ();
          else renderResult();
        };
      });
    }

    function renderResult() {
      var key = config.resolve(totals);
      var r = config.results[key];
      el.innerHTML =
        '<span class="result-emoji">' + r.emoji + "</span>" +
        '<p class="result-name">' + r.name + "</p>" +
        '<p class="result-desc">' + r.desc + "</p>" +
        (config.extraResultHTML || "") +
        '<div class="result-actions">' +
        '<button class="btn-primary" id="qz-retry">다시하기</button>' +
        '<button class="btn-ghost" id="qz-share">링크 복사</button>' +
        "</div>";
      el.querySelector("#qz-retry").onclick = renderStart;
      el.querySelector("#qz-share").onclick = function () {
        var btn = el.querySelector("#qz-share");
        (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
          .then(function () { btn.textContent = "복사됨!"; })
          .catch(function () { btn.textContent = location.href; });
      };
    }

    renderStart();
  }

  window.Quiz = { init: init };
})();
```

- [ ] **Step 2: 커밋**

```bash
git add play/js/quiz.js
git commit -m "feat: 공용 퀴즈 엔진(진행바·결과 카드·다시하기·링크복사)"
```

---

### Task 4: 연애 스타일 테스트

**Files:**
- Create: `play/love-test.html`

- [ ] **Step 1: `play/love-test.html` 작성**

퀴즈 페이지 HTML 공통 뼈대(이 태스크의 코드가 기준이며, Task 5·6도 같은 뼈대에 설정만 다름):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>연애 스타일 테스트 — goblub</title>
  <meta name="description" content="10문항으로 알아보는 나의 연애 스타일" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <div id="site-header"></div>
  <main>
    <section class="hero">
      <h1>💘 연애 스타일 테스트</h1>
      <p>연애할 때 나는 어떤 사람일까? 10문항이면 끝!</p>
    </section>
    <section class="panel" id="quiz"></section>
    <p class="fine-print">재미로 봐주세요 🙂</p>
  </main>
  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/quiz.js"></script>
  <script>
    Quiz.init(document.getElementById("quiz"), {
      emoji: "💘",
      title: "연애 스타일 테스트",
      intro: "10개 질문에 솔직하게 답하면, 연애할 때의 진짜 내 모습을 알려드려요.",
      questions: [
        { q: "짝사랑이 생겼다! 나의 첫 행동은?", choices: [
          { text: "바로 고백 각 재기. 밀당은 시간 낭비!", scores: { fire: 1 } },
          { text: "그 사람의 SNS를 정독하며 취향 조사", scores: { pure: 1 } },
          { text: "관심 없는 척하면서 자꾸 근처에 등장", scores: { tsun: 1 } },
          { text: "인연이면 어떻게든 되겠지~ 일단 내 할 일", scores: { free: 1 } } ] },
        { q: "연인과의 연락 빈도, 나의 이상향은?", choices: [
          { text: "수시로! 아침 인사부터 잘 자까지 풀코스", scores: { fire: 1 } },
          { text: "정해진 시간에 꼬박꼬박, 성실한 연락", scores: { pure: 1 } },
          { text: "필요할 때만. 대신 만나면 확실하게", scores: { tsun: 1 } },
          { text: "서로 자유롭게. 안 와도 불안하지 않음", scores: { free: 1 } } ] },
        { q: "기념일에 나는?", choices: [
          { text: "깜짝 이벤트 대규모로 준비!", scores: { fire: 1 } },
          { text: "몇 주 전부터 선물·편지 정성껏 준비", scores: { pure: 1 } },
          { text: "\"별거 아냐\"라며 은근 신경 쓴 선물 툭", scores: { tsun: 1 } },
          { text: "기념일보다 평소가 중요하지 않아?", scores: { free: 1 } } ] },
        { q: "연인과 싸웠을 때 나는?", choices: [
          { text: "그 자리에서 다 풀어야 함. 냉전 못 견딤", scores: { fire: 1 } },
          { text: "내가 뭘 잘못했나 곱씹으며 먼저 사과", scores: { pure: 1 } },
          { text: "말은 퉁명해도 슬쩍 화해 신호 보냄", scores: { tsun: 1 } },
          { text: "각자 시간 갖고 식은 뒤에 얘기하자", scores: { free: 1 } } ] },
        { q: "이상형에 가까운 사람은?", choices: [
          { text: "매 순간 설레게 하는 사람", scores: { fire: 1 } },
          { text: "한결같이 나만 바라봐주는 사람", scores: { pure: 1 } },
          { text: "겉은 시크한데 나한테만 다정한 사람", scores: { tsun: 1 } },
          { text: "서로의 세계를 존중해주는 사람", scores: { free: 1 } } ] },
        { q: "데이트 코스를 정할 때 나는?", choices: [
          { text: "핫플 뚫기! 새로운 곳 도장깨기", scores: { fire: 1 } },
          { text: "상대가 좋아할 만한 곳을 미리 조사", scores: { pure: 1 } },
          { text: "\"아무데나\"라고 하고 결국 내가 정함", scores: { tsun: 1 } },
          { text: "발 닿는 대로! 계획 없는 게 계획", scores: { free: 1 } } ] },
        { q: "연인의 휴대폰이 궁금할 때 나는?", choices: [
          { text: "궁금하면 바로 물어봄. 뭐 숨겨?", scores: { fire: 1 } },
          { text: "불안해도 믿는 게 사랑이니까 참기", scores: { pure: 1 } },
          { text: "안 궁금한 척하지만 사실 다 보고 있음", scores: { tsun: 1 } },
          { text: "전혀 안 궁금. 내 폰도 보여줄 수 있음", scores: { free: 1 } } ] },
        { q: "사랑 표현 방식, 나는?", choices: [
          { text: "말로! \"좋아해\"를 하루 열 번도 가능", scores: { fire: 1 } },
          { text: "행동으로. 챙겨주고 기억해주는 것", scores: { pure: 1 } },
          { text: "놀리는 게 애정 표현. 미안, 이게 나야", scores: { tsun: 1 } },
          { text: "함께 있는 시간 자체가 표현", scores: { free: 1 } } ] },
        { q: "권태기가 온 것 같다. 나의 대처는?", choices: [
          { text: "여행이든 이벤트든 새 불씨를 만든다", scores: { fire: 1 } },
          { text: "처음 마음을 떠올리며 더 노력한다", scores: { pure: 1 } },
          { text: "티는 안 내고 혼자 끙끙 고민한다", scores: { tsun: 1 } },
          { text: "자연스러운 흐름. 각자 시간을 늘린다", scores: { free: 1 } } ] },
        { q: "친구들이 말하는 나의 연애는?", choices: [
          { text: "\"쟤 연애하면 세상이 다 아는 애\"", scores: { fire: 1 } },
          { text: "\"진짜 잘해줘. 아까울 정도로\"", scores: { pure: 1 } },
          { text: "\"연애하는 거 맞아? 근데 오래 가\"", scores: { tsun: 1 } },
          { text: "\"연애해도 자기 삶이 확실한 애\"", scores: { free: 1 } } ] }
      ],
      results: {
        fire: { emoji: "🔥", name: "불꽃 열정형", desc: "사랑에 빠지면 온 세상이 그 사람 중심으로 도는 타입! 표현도 화끈, 이벤트도 화끈. 당신과의 연애는 심장이 남아나질 않아요. 다만 불꽃이 큰 만큼 산소(내 시간)도 챙겨야 오래 타요." },
        pure: { emoji: "🌷", name: "순정 헌신형", desc: "한 사람에게 진심을 다하는 로맨티스트. 기억력도 정성도 만렙이라 상대는 세상에서 제일 사랑받는 기분이 들어요. 단, 주기만 하다 지치지 않게 받는 연습도 필요해요." },
        tsun: { emoji: "🦔", name: "츤데레 고슴도치형", desc: "겉은 까칠, 속은 순두부. 좋아할수록 퉁명해지는 신비한 타입이에요. 알아주는 사람에겐 세상 다정한 반전 매력! 가끔은 속마음을 소리 내어 말해주면 상대가 덜 헷갈려요." },
        free: { emoji: "🪁", name: "자유로운 연형", desc: "사랑도 중요하지만 나의 세계도 소중한 쿨한 타입. 집착 없는 건강한 거리감이 당신 연애의 매력이에요. 다만 상대가 서운해할 땐 연줄을 살짝 당겨주는 센스!" }
      },
      resolve: function (t) {
        var best = "fire";
        ["fire", "pure", "tsun", "free"].forEach(function (k) { if ((t[k] || 0) > (t[best] || 0)) best = k; });
        return best;
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: 브라우저 검증**

`http://localhost:8777/play/love-test.html` — 시작하기 → 10문항 진행(진행바 증가) → 결과 카드 표시 → 다시하기 동작 → 링크 복사 클릭 시 "복사됨!" 표시.

- [ ] **Step 3: 커밋**

```bash
git add play/love-test.html
git commit -m "feat: 연애 스타일 테스트(10문항 4유형)"
```

---

### Task 5: 스트레스 유형 테스트

**Files:**
- Create: `play/stress-test.html`

- [ ] **Step 1: `play/stress-test.html` 작성**

HTML 뼈대는 Task 4와 동일(title/description/hero만 교체: `🔥 스트레스 유형 테스트` / "스트레스 받을 때 나는 어떤 모습일까? 10문항으로 확인!"). `<script>`의 Quiz.init 설정:

```js
Quiz.init(document.getElementById("quiz"), {
  emoji: "🔥",
  title: "스트레스 유형 테스트",
  intro: "스트레스 상황에서 내가 보이는 진짜 반응 패턴을 알려드려요.",
  questions: [
    { q: "월요일 아침, 눈 뜨자마자 드는 생각은?", choices: [
      { text: "아 진짜! (이불을 발로 참)", scores: { volcano: 1 } },
      { text: "휴… 가야지 뭐 (조용히 한숨)", scores: { sponge: 1 } },
      { text: "5분만 더… 10분만 더… (현실 도피)", scores: { runner: 1 } },
      { text: "오늘 할 일부터 머릿속으로 정리", scores: { solver: 1 } } ] },
    { q: "일이 몰려서 터질 것 같을 때 나는?", choices: [
      { text: "\"이걸 왜 다 나한테!\" 짜증부터 남", scores: { volcano: 1 } },
      { text: "말없이 다 떠안고 밤새 함", scores: { sponge: 1 } },
      { text: "일단 유튜브 켬. 나중의 내가 하겠지", scores: { runner: 1 } },
      { text: "우선순위 정하고 급한 것부터 처리", scores: { solver: 1 } } ] },
    { q: "친구가 약속을 당일 취소했다!", choices: [
      { text: "서운함을 바로 표현한다", scores: { volcano: 1 } },
      { text: "\"괜찮아~\" 하고 혼자 곱씹는다", scores: { sponge: 1 } },
      { text: "잘됐다, 집에서 쉬자! 금방 잊는다", scores: { runner: 1 } },
      { text: "다음 약속을 바로 다시 잡는다", scores: { solver: 1 } } ] },
    { q: "스트레스가 극에 달했을 때 몸의 신호는?", choices: [
      { text: "심장이 빨리 뛰고 얼굴이 뜨거워짐", scores: { volcano: 1 } },
      { text: "어깨·목이 뭉치고 소화가 안 됨", scores: { sponge: 1 } },
      { text: "무기력. 눕고 싶고 아무것도 하기 싫음", scores: { runner: 1 } },
      { text: "머리가 오히려 차가워지고 말이 빨라짐", scores: { solver: 1 } } ] },
    { q: "나의 스트레스 해소법에 가장 가까운 것은?", choices: [
      { text: "운동이나 노래방에서 폭발적으로 발산", scores: { volcano: 1 } },
      { text: "친한 사람에게 털어놓기 (근데 잘 못함)", scores: { sponge: 1 } },
      { text: "잠, 넷플릭스, 게임 — 일단 꺼두기", scores: { runner: 1 } },
      { text: "원인을 적어보고 해결책 리스트 만들기", scores: { solver: 1 } } ] },
    { q: "단톡방에서 나를 저격하는 듯한 말을 봤다", choices: [
      { text: "바로 물어본다. \"그거 나 얘기야?\"", scores: { volcano: 1 } },
      { text: "밤새 그 메시지를 다시 읽는다", scores: { sponge: 1 } },
      { text: "알림 끄고 못 본 척한다", scores: { runner: 1 } },
      { text: "따로 개인톡으로 차분히 확인한다", scores: { solver: 1 } } ] },
    { q: "중요한 발표 전날 밤, 나는?", choices: [
      { text: "긴장돼서 예민 폭발. 건드리면 위험", scores: { volcano: 1 } },
      { text: "잘해야 한다는 부담을 혼자 삭힘", scores: { sponge: 1 } },
      { text: "준비는 미뤄뒀고… 갑자기 방 청소 시작", scores: { runner: 1 } },
      { text: "리허설 한 번 더 하고 일찍 잔다", scores: { solver: 1 } } ] },
    { q: "화가 났던 일, 얼마나 오래 가나요?", choices: [
      { text: "그 자리에서 폭발하고 금방 풀림", scores: { volcano: 1 } },
      { text: "겉으론 괜찮은데 몇 주씩 남아 있음", scores: { sponge: 1 } },
      { text: "생각 안 하려고 해서 잘 모르겠음", scores: { runner: 1 } },
      { text: "원인이 해결되면 딱 끝남", scores: { solver: 1 } } ] },
    { q: "번아웃이 온 것 같을 때 나는?", choices: [
      { text: "\"다 그만둘래!\" 선언부터 하고 봄", scores: { volcano: 1 } },
      { text: "그래도 해야지… 하며 계속 버팀", scores: { sponge: 1 } },
      { text: "연락 두절, 잠수 모드 돌입", scores: { runner: 1 } },
      { text: "휴가를 내고 회복 계획을 짠다", scores: { solver: 1 } } ] },
    { q: "주변 사람들이 말하는 나는?", choices: [
      { text: "\"화끈해. 뒤끝은 없어\"", scores: { volcano: 1 } },
      { text: "\"착한데… 좀 참는 것 같아\"", scores: { sponge: 1 } },
      { text: "\"연락 안 되면 충전 중인 거야\"", scores: { runner: 1 } },
      { text: "\"어른스러워. 기댈 수 있어\"", scores: { solver: 1 } } ] }
  ],
  results: {
    volcano: { emoji: "🌋", name: "화산 폭발형", desc: "스트레스가 쌓이면 바로바로 분출하는 타입! 뒤끝 없이 시원한 게 장점이지만, 폭발 순간의 파편이 주변에 튈 수 있어요. 터지기 전에 운동·노래방 같은 안전한 분화구를 미리 만들어두면 최고예요." },
    sponge: { emoji: "🧽", name: "스펀지 흡수형", desc: "싫은 소리 못 하고 다 빨아들이는 타입. 배려심 만렙이지만 스펀지도 다 차면 무거워져요. 참는 게 미덕이 아니라는 것, 짜서 비워내는 시간(수다, 일기, 눈물 뭐든!)이 꼭 필요해요." },
    runner: { emoji: "🏃", name: "일단 도망형", desc: "스트레스 원인에서 일단 거리를 두는 타입. 회피처럼 보여도 사실 재충전 본능이에요! 다만 도망간 곳에서 눕기만 하면 원인이 그대로 기다리고 있으니, 충전 후 한 가지만 처리하고 다시 쉬어보세요." },
    solver: { emoji: "🛠️", name: "해결사 직면형", desc: "스트레스를 문제로 정의하고 풀어버리는 타입. 멋있지만, 세상엔 해결 안 되는 일도 있다는 게 함정. 가끔은 해결 말고 그냥 '느끼는' 것도 회복이에요. 오늘은 리스트 접고 푹 쉬어도 돼요." }
  },
  resolve: function (t) {
    var best = "volcano";
    ["volcano", "sponge", "runner", "solver"].forEach(function (k) { if ((t[k] || 0) > (t[best] || 0)) best = k; });
    return best;
  },
  extraResultHTML: '<p class="result-desc" style="margin-top:14px">🩺 힘든 순간이 계속된다면 — 즉시 도움을 연결해주는 앱 <a href="../apps.html" style="text-decoration:underline">Golden time</a>도 준비 중이에요.</p>'
});
```

- [ ] **Step 2: 브라우저 검증**

`http://localhost:8777/play/stress-test.html` — 전체 플로우 + 결과 화면에 Golden time 안내가 뜨고 링크가 `apps.html`로 이동하는지.

- [ ] **Step 3: 커밋**

```bash
git add play/stress-test.html
git commit -m "feat: 스트레스 유형 테스트(10문항 4유형, Golden time 연계)"
```

---

### Task 6: MBTI 20문항 테스트

**Files:**
- Create: `play/mbti.html`

- [ ] **Step 1: `play/mbti.html` 작성**

HTML 뼈대는 Task 4와 동일(hero: `🎭 초스피드 MBTI` / "20문항으로 알아보는 나의 MBTI"). Quiz.init 설정:

```js
Quiz.init(document.getElementById("quiz"), {
  emoji: "🎭",
  title: "초스피드 MBTI (20문항)",
  intro: "정식 검사는 아니지만 꽤 잘 맞는 20문항 재미용 MBTI! 너무 고민하지 말고 끌리는 쪽을 고르세요.",
  questions: [
    // E/I — 5문항
    { q: "금요일 저녁, 에너지가 차오르는 쪽은?", choices: [
      { text: "사람들 만나서 놀기! 약속이 곧 휴식", scores: { E: 1 } },
      { text: "집에서 혼자만의 시간. 이게 진짜 휴식", scores: { I: 1 } } ] },
    { q: "모임에서 나는 주로?", choices: [
      { text: "대화 주제를 던지고 분위기를 끌어감", scores: { E: 1 } },
      { text: "듣다가 마음 맞는 한두 명과 깊은 얘기", scores: { I: 1 } } ] },
    { q: "고민이 생기면?", choices: [
      { text: "말하면서 정리됨. 일단 누구든 붙잡고 얘기", scores: { E: 1 } },
      { text: "혼자 충분히 생각한 뒤에야 꺼냄", scores: { I: 1 } } ] },
    { q: "낯선 사람이 많은 자리에서 나는?", choices: [
      { text: "먼저 말 걸며 금방 친해짐", scores: { E: 1 } },
      { text: "누가 말 걸어주길 기다리는 편", scores: { I: 1 } } ] },
    { q: "전화 vs 문자?", choices: [
      { text: "전화가 빠르지! 바로 걸어버림", scores: { E: 1 } },
      { text: "문자로 정리해서 보내는 게 편함", scores: { I: 1 } } ] },
    // S/N — 5문항
    { q: "새 가전제품을 사면?", choices: [
      { text: "설명서 보고 순서대로 설정", scores: { S: 1 } },
      { text: "일단 눌러보면서 감으로 파악", scores: { N: 1 } } ] },
    { q: "영화를 보고 나서 주로 하는 얘기는?", choices: [
      { text: "장면·배우·연출 등 실제 본 것들", scores: { S: 1 } },
      { text: "숨은 의미, 뒷이야기 상상, \"만약에…\"", scores: { N: 1 } } ] },
    { q: "길을 설명할 때 나는?", choices: [
      { text: "\"편의점에서 좌회전, 300m 직진\"", scores: { S: 1 } },
      { text: "\"그… 분위기 있는 골목 지나서 대충 그쪽\"", scores: { N: 1 } } ] },
    { q: "일할 때 더 자신 있는 것은?", choices: [
      { text: "정해진 절차를 꼼꼼하게 해내기", scores: { S: 1 } },
      { text: "새로운 방식을 떠올리고 판 새로 짜기", scores: { N: 1 } } ] },
    { q: "멍 때릴 때 나의 머릿속은?", choices: [
      { text: "오늘 있었던 일, 해야 할 일", scores: { S: 1 } },
      { text: "우주, 미래, 갑자기 10년 뒤 상상", scores: { N: 1 } } ] },
    // T/F — 5문항
    { q: "친구가 \"나 오늘 회사에서 혼났어\"라고 하면?", choices: [
      { text: "\"왜? 뭐 때문에? 어떻게 된 건데?\"", scores: { T: 1 } },
      { text: "\"헐 속상했겠다… 괜찮아?\"", scores: { F: 1 } } ] },
    { q: "결정을 내릴 때 더 중요한 것은?", choices: [
      { text: "논리적으로 맞는가", scores: { T: 1 } },
      { text: "관련된 사람들의 마음", scores: { F: 1 } } ] },
    { q: "피드백을 줄 때 나는?", choices: [
      { text: "개선점을 정확하게 짚어주는 게 도움", scores: { T: 1 } },
      { text: "좋은 점부터, 상처받지 않게 돌려서", scores: { F: 1 } } ] },
    { q: "드라마 볼 때 나는?", choices: [
      { text: "\"아니 저게 말이 돼? 개연성이…\"", scores: { T: 1 } },
      { text: "주인공 따라 웃고 울고 감정이입", scores: { F: 1 } } ] },
    { q: "갈등 상황에서 나는?", choices: [
      { text: "사실관계부터 정리하자", scores: { T: 1 } },
      { text: "일단 서로 기분부터 풀자", scores: { F: 1 } } ] },
    // J/P — 5문항
    { q: "여행 스타일은?", choices: [
      { text: "시간표급 일정표. 예약은 미리미리", scores: { J: 1 } },
      { text: "숙소만 잡고 나머지는 현지에서 즉흥", scores: { P: 1 } } ] },
    { q: "과제나 일 처리 스타일은?", choices: [
      { text: "미리 조금씩 끝내둬야 마음이 편함", scores: { J: 1 } },
      { text: "마감 직전 초인적인 집중력 발동", scores: { P: 1 } } ] },
    { q: "책상 상태는?", choices: [
      { text: "물건마다 자리가 있다. 각 잡힌 정리", scores: { J: 1 } },
      { text: "어지러워 보여도 나만의 질서가 있음", scores: { P: 1 } } ] },
    { q: "갑자기 약속이 바뀌면?", choices: [
      { text: "당황+살짝 불편. 계획이 흔들리잖아", scores: { J: 1 } },
      { text: "오히려 좋아. 새로운 전개 환영", scores: { P: 1 } } ] },
    { q: "쇼핑할 때 나는?", choices: [
      { text: "살 것 정하고 가서 그것만 사 옴", scores: { J: 1 } },
      { text: "구경하다 보면 계획에 없던 걸 사 옴", scores: { P: 1 } } ] }
  ],
  results: {
    ISTJ: { emoji: "📘", name: "ISTJ — 원칙의 수호자", desc: "말보다 행동, 약속은 반드시 지키는 신뢰의 아이콘. 당신이 있어서 세상이 굴러갑니다." },
    ISFJ: { emoji: "🧸", name: "ISFJ — 따뜻한 수호천사", desc: "조용히 챙겨주는 디테일 장인. 당신의 다정함은 티가 안 나지만 모두가 알고 있어요." },
    INFJ: { emoji: "🔮", name: "INFJ — 통찰의 조언자", desc: "사람 마음을 꿰뚫어 보는 희귀 유형. 겉은 잔잔, 속은 우주급 깊이." },
    INTJ: { emoji: "♟️", name: "INTJ — 전략의 설계자", desc: "머릿속에 늘 큰 그림이 있는 전략가. 계획대로 되는 순간의 짜릿함으로 삽니다." },
    ISTP: { emoji: "🔧", name: "ISTP — 만능 해결사", desc: "말수는 적어도 손은 빠른 실전형. 위기 상황에서 제일 침착한 사람이 바로 당신." },
    ISFP: { emoji: "🎨", name: "ISFP — 조용한 예술가", desc: "감성과 취향이 확실한 유형. 무해해 보이지만 자기 세계는 확고합니다." },
    INFP: { emoji: "🌙", name: "INFP — 낭만적 이상주의자", desc: "겉은 조용, 속은 감정의 대서사시. 세상을 더 따뜻하게 만드는 상상력의 소유자." },
    INTP: { emoji: "🧪", name: "INTP — 호기심 과학자", desc: "\"왜?\"가 인생 기본값. 관심 분야가 걸리면 밤새 파고드는 지적 탐험가." },
    ESTP: { emoji: "🏄", name: "ESTP — 행동파 모험가", desc: "고민할 시간에 일단 해보는 타입. 순발력과 현실 감각이 최강입니다." },
    ESFP: { emoji: "🎉", name: "ESFP — 무대 위의 스타", desc: "있는 곳이 곧 파티장. 흥과 정이 넘쳐 사람들을 즐겁게 만드는 재주꾼." },
    ENFP: { emoji: "🌈", name: "ENFP — 열정의 스파크", desc: "아이디어와 설렘이 마르지 않는 유형. 시작은 100개, 마무리는… 그래도 미워할 수 없죠." },
    ENTP: { emoji: "⚡", name: "ENTP — 토론의 발명가", desc: "\"근데 반대로 생각해보면?\"이 입버릇. 두뇌 회전으로 세상을 뒤집는 아이디어 뱅크." },
    ESTJ: { emoji: "📋", name: "ESTJ — 타고난 관리자", desc: "체계와 효율의 화신. 당신이 팀장이면 프로젝트는 무조건 굴러갑니다." },
    ESFJ: { emoji: "🍀", name: "ESFJ — 모두의 분위기 메이커", desc: "사람 챙기기가 본능인 유형. 당신 덕분에 모임이 모임답게 됩니다." },
    ENFJ: { emoji: "🌻", name: "ENFJ — 카리스마 멘토", desc: "사람의 가능성을 알아보고 끌어올리는 리더. 진심 어린 오지랖은 당신의 초능력." },
    ENTJ: { emoji: "👑", name: "ENTJ — 대담한 통솔자", desc: "목표가 생기면 길을 만드는 타입. 추진력 하나로 세상을 밀고 나갑니다." }
  },
  resolve: function (t) {
    return ((t.E || 0) >= (t.I || 0) ? "E" : "I") +
      ((t.S || 0) >= (t.N || 0) ? "S" : "N") +
      ((t.T || 0) >= (t.F || 0) ? "T" : "F") +
      ((t.J || 0) >= (t.P || 0) ? "J" : "P");
  }
});
```

- [ ] **Step 2: 브라우저 검증**

`http://localhost:8777/play/mbti.html` — 20문항 진행, 결과 4글자 유형 카드 표시. 모두 첫 번째 선택지만 고르면 ESTJ가 나와야 함(E,S,T,J 각 5점).

- [ ] **Step 3: 커밋**

```bash
git add play/mbti.html
git commit -m "feat: MBTI 20문항 테스트(16유형)"
```

---

### Task 7: 메인 페이지 카드 연동 + 모바일 검증

**Files:**
- Modify: `index.html` (card-grid 섹션)

- [ ] **Step 1: `index.html`의 card-grid를 다음으로 교체**

기존 `<section class="card-grid">…</section>` 전체를:

```html
    <section class="card-grid">
      <a class="card tint-purple" href="play/saju.html">
        <span class="icon">🔮</span>
        <h2>사주</h2>
        <p>절기 경계까지 정확하게 보는 나의 사주팔자</p>
      </a>

      <a class="card tint-coral" href="play/love-test.html">
        <span class="icon">💘</span>
        <h2>연애 스타일 테스트</h2>
        <p>연애할 때 나는 어떤 사람? 10문항이면 끝</p>
      </a>

      <a class="card tint-yellow" href="play/stress-test.html">
        <span class="icon">🔥</span>
        <h2>스트레스 유형 테스트</h2>
        <p>터지는 편? 참는 편? 나의 스트레스 반응 패턴</p>
      </a>

      <a class="card tint-mint" href="play/mbti.html">
        <span class="icon">🎭</span>
        <h2>초스피드 MBTI</h2>
        <p>20문항으로 알아보는 재미용 MBTI</p>
      </a>

      <a class="card tint-sky" href="apps.html">
        <span class="icon">📱</span>
        <h2>앱 다운로드</h2>
        <p>직접 만든 모바일 앱들을 소개하고 다운로드 링크를 모아둔 곳</p>
      </a>

      <!-- 새 콘텐츠 카드는 여기에 추가: <a class="card tint-색상" href="play/파일명.html"> -->

      <div class="card empty-slot">
        <span class="icon">✨</span>
        <h2>새 즐길거리</h2>
        <p>재미난 것들이 하나씩 추가될 예정이에요</p>
      </div>
    </section>
```

- [ ] **Step 2: 데스크톱 + 모바일(375px) 검증**

- 메인: 카드 6개(콘텐츠 4 + 앱 + 빈슬롯) 그리드, 각 카드 클릭 → 해당 페이지 이동
- 각 콘텐츠 페이지: 모바일에서 가로 스크롤 없음, 기둥 4칸이 한 줄에 유지(글자 축소)
- 헤더 로고 클릭 → play/ 하위에서도 메인으로 정상 복귀 (`data-root=".."` 확인)

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: 메인에 사주·테스트 3종 카드 연동"
```

---

### Task 8: 배포 및 실사이트 확인

- [ ] **Step 1: 푸시** (이 저장소는 GitHub Pages 배포용으로 푸시 승인됨)

```bash
git push
```

- [ ] **Step 2: 실사이트 확인 (1~2분 후)**

- `https://hiy3333.github.io/goblub/` — 새 카드 4개 표시
- `https://hiy3333.github.io/goblub/play/saju.html` — HTTP 200, 사주 계산 동작(데이터 fetch 포함)
- `https://hiy3333.github.io/goblub/play/love-test.html`, `stress-test.html`, `mbti.html` — HTTP 200

Expected: 전부 200, 사주 입력→결과 정상.
