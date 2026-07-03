# goblub 사주 2.0 + 운세·오늘의 사주 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 페이지에 십성·지장간·신강약·진태양시·대운을 추가하고, 개인화 운세 4종(play/fortune.html)과 오늘의 사주(play/today.html)를 신설·배포한다.

**Architecture:** `play/js/saju.js`를 v2로 확장(기존 API 유지 + opts). 운세는 `play/js/fortune.js`가 Saju.compute를 재사용해 오늘/이번달 간지를 구하고 십성→텍스트·점수 매핑. 페이지는 기존 정적 구조 그대로.

**Tech Stack:** Vanilla JS, 기존 saju-terms.json (신규 데이터 불필요).

**검증 방식:** preview_eval 콘솔 대조(십성 전수·대운·진태양시 경계·운세 결정성) + 브라우저 플로우 + 모바일 375px.

**콘텐츠 문구 주의:** 텍스트는 초안 확정본. 실행자는 오탈자 수정 이상의 재작성 금지.

---

### Task 1: saju.js v2 — 엔진 확장

**Files:**
- Modify: `play/js/saju.js` (첫 번째 IIFE를 아래 전체 코드로 교체, 풀이 IIFE는 Step 2에서 확장)

- [ ] **Step 1: 계산 IIFE 전체 교체**

```js
// goblub 사주 계산 모듈 v2.
// window.Saju = { compute, pillarText, sipseong, branchMainGan, GAN, JI, SIPSEONG }
// compute(data, birth, opts): birth={y,m,d,hour,min}, opts={trueSolar:bool, gender:'M'|'F'|null}
(function () {
  var GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  var GAN_HANJA = "甲乙丙丁戊己庚辛壬癸";
  var JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  var JI_HANJA = "子丑寅卯辰巳午未申酉戌亥";
  var OH = ["목", "화", "토", "금", "수"];
  var JI_OHENG = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 지지 본기 오행 인덱스
  var ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  var TERM_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
  var SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  // 지장간: [천간인덱스, 가중치] — 본기 1.0, 중기 0.5, 여기 0.3
  var JIJANGGAN = [
    [[8, 0.3], [9, 1.0]],            // 자: 임·계
    [[9, 0.3], [7, 0.5], [5, 1.0]],  // 축: 계·신·기
    [[4, 0.3], [2, 0.5], [0, 1.0]],  // 인: 무·병·갑
    [[0, 0.3], [1, 1.0]],            // 묘: 갑·을
    [[1, 0.3], [9, 0.5], [4, 1.0]],  // 진: 을·계·무
    [[4, 0.3], [6, 0.5], [2, 1.0]],  // 사: 무·경·병
    [[2, 0.3], [5, 0.5], [3, 1.0]],  // 오: 병·기·정
    [[3, 0.3], [1, 0.5], [5, 1.0]],  // 미: 정·을·기
    [[4, 0.3], [8, 0.5], [6, 1.0]],  // 신: 무·임·경
    [[6, 0.3], [7, 1.0]],            // 유: 경·신
    [[7, 0.3], [3, 0.5], [4, 1.0]],  // 술: 신·정·무
    [[4, 0.3], [0, 0.5], [8, 1.0]]   // 해: 무·갑·임
  ];

  function ganOh(g) { return Math.floor(g / 2); }

  function sipseong(ilgan, gan) {
    var rel = ((ganOh(gan) - ganOh(ilgan)) + 5) % 5;
    var same = (gan % 2) === (ilgan % 2);
    return rel * 2 + (same ? 0 : 1);
  }

  function branchMainGan(ji) {
    var arr = JIJANGGAN[ji];
    return arr[arr.length - 1][0];
  }

  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
      Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function compute(data, birth, opts) {
    opts = opts || {};
    var adj = { y: birth.y, m: birth.m, d: birth.d, hour: birth.hour, min: birth.hour == null ? 0 : (birth.min || 0) };
    if (opts.trueSolar && birth.hour != null) {
      var t0 = new Date(adj.y, adj.m - 1, adj.d, adj.hour, adj.min - 30);
      adj = { y: t0.getFullYear(), m: t0.getMonth() + 1, d: t0.getDate(), hour: t0.getHours(), min: t0.getMinutes() };
    }
    var h = adj.hour == null ? 12 : adj.hour;
    var mi = adj.min;
    var stamp = ts(adj.y, adj.m, adj.d, h, mi);

    var ipchun = termTs(data, adj.y, 1);
    var effYear = stamp < ipchun ? adj.y - 1 : adj.y;
    var yIdx = ((effYear - 4) % 60 + 60) % 60;

    var branch = 0;
    for (var i = 0; i < 12; i++) {
      if (stamp >= termTs(data, adj.y, i)) branch = TERM_BRANCH[i];
      else break;
    }
    var yGan = yIdx % 10;
    var startGan = (((yGan % 5) * 2) + 2) % 10;
    var mGan = (startGan + ((branch - 2 + 12) % 12)) % 10;

    var j = jdn(adj.y, adj.m, adj.d);
    if (adj.hour != null && adj.hour >= 23) j += 1;
    var dIdx = ((j - data.anchorJdn) % 60 + 60) % 60;

    var hourPillar = null;
    if (adj.hour != null) {
      var hBranch = Math.floor(((adj.hour + 1) % 24) / 2);
      hourPillar = [((dIdx % 10) % 5 * 2 + hBranch) % 10, hBranch];
    }

    var pillars = { year: [yGan, yIdx % 12], month: [mGan, branch], day: [dIdx % 10, dIdx % 12], hour: hourPillar };
    var ilgan = pillars.day[0];
    var myOh = ganOh(ilgan);

    // 가중 오행 + 신강약 (일간 자신은 제외, 월지 항목 ×2)
    var ohw = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    var support = 0, totalW = 0;
    function addW(oh, w, isMonthJi) {
      ohw[OH[oh]] += w;
      var sw = isMonthJi ? w * 2 : w;
      totalW += sw;
      if (oh === myOh || (oh + 1) % 5 === myOh) support += sw;
    }
    ["year", "month", "day", "hour"].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      if (k !== "day") addW(ganOh(p[0]), 1.0, false);
      else ohw[OH[myOh]] += 1.0; // 일간은 차트에는 포함, 세력에는 불포함
      JIJANGGAN[p[1]].forEach(function (jg) { addW(ganOh(jg[0]), jg[1], k === "month"); });
    });
    var ratio = totalW ? support / totalW : 0.5;
    var strength = ratio >= 0.55 ? "신강" : (ratio <= 0.45 ? "신약" : "중화");

    // 십성 분포(천간 3 + 지지 본기 4, 일간 제외)
    var ssCount = {};
    function addSS(g) { var s = sipseong(ilgan, g); ssCount[s] = (ssCount[s] || 0) + 1; }
    ["year", "month", "hour"].forEach(function (k) { if (pillars[k]) addSS(pillars[k][0]); });
    ["year", "month", "day", "hour"].forEach(function (k) { if (pillars[k]) addSS(branchMainGan(pillars[k][1])); });
    var topSS = null;
    for (var s in ssCount) if (topSS == null || ssCount[s] > ssCount[topSS]) topSS = s;

    return {
      pillars: pillars, ilgan: ilgan, zodiac: ZODIAC[yIdx % 12],
      oheng: ohw, strength: { ratio: ratio, label: strength },
      topSipseong: topSS == null ? null : +topSS,
      daeun: opts.gender ? daeun(data, adj, opts.gender, pillars) : null,
      adj: adj
    };
  }

  function daeun(data, adj, gender, pillars) {
    var yangYear = pillars.year[0] % 2 === 0;
    var forward = (yangYear && gender === "M") || (!yangYear && gender === "F");
    var birthDate = new Date(adj.y, adj.m - 1, adj.d, adj.hour == null ? 12 : adj.hour, adj.min || 0);
    var target = null, approx = false;
    for (var yy = adj.y - 1; yy <= adj.y + 1; yy++) {
      if (yy < 1900 || yy > 2100) { approx = true; continue; }
      data.terms[String(yy)].forEach(function (t) {
        var c = new Date(yy, +t.slice(0, 2) - 1, +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
        if (forward) { if (c > birthDate && (!target || c < target)) target = c; }
        else { if (c < birthDate && (!target || c > target)) target = c; }
      });
    }
    var num = 5;
    if (target) {
      num = Math.round(Math.abs(target - birthDate) / 86400000 / 3);
      if (num < 1) num = 1;
      if (num > 10) num = 10;
      approx = false;
    } else approx = true;
    var mIdx = 0;
    for (var i = 0; i < 60; i++) if (i % 10 === pillars.month[0] && i % 12 === pillars.month[1]) { mIdx = i; break; }
    var list = [];
    for (var n = 1; n <= 8; n++) {
      var idx = ((mIdx + (forward ? n : -n)) % 60 + 60) % 60;
      list.push({ age: num + (n - 1) * 10, gan: idx % 10, ji: idx % 12 });
    }
    return { forward: forward, num: num, approx: approx, list: list };
  }

  function ts(y, m, d, h, mi) { return ((y * 100 + m) * 100 + d) * 10000 + h * 100 + mi; }
  function termTs(data, year, idx) {
    var t = data.terms[String(year)][idx];
    return ts(year, +t.slice(0, 2), +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
  }

  function pillarText(p) {
    return { hanja: GAN_HANJA[p[0]] + JI_HANJA[p[1]], hangul: GAN[p[0]] + JI[p[1]] };
  }

  window.Saju = {
    compute: compute, pillarText: pillarText, sipseong: sipseong,
    branchMainGan: branchMainGan, GAN: GAN, JI: JI, SIPSEONG: SIPSEONG
  };
})();
```

주의: 기존 `oheng`(정수 카운트)이 가중 소수로 바뀌므로 saju.html 렌더도 Task 2에서 함께 수정한다.

- [ ] **Step 2: 풀이 IIFE(SajuText)에 십성·신강약 텍스트 추가**

기존 `window.SajuText = { ilgan: [...], ohengMost: {...}, ohengNone: {...} }`에 두 키 추가:

```js
    sipseongDesc: [
      "비견이 많아요 — 주체성과 자립심이 강한 사주. 내 사업, 내 브랜드와 인연이 깊어요.",
      "겁재가 많아요 — 승부사 기질! 경쟁에서 강하지만 동업·금전 관리는 신중하게.",
      "식신이 많아요 — 먹복과 표현력을 타고났어요. 만들고 나누는 일에서 빛납니다.",
      "상관이 많아요 — 번뜩이는 재능과 말솜씨. 틀을 깨는 창의성이 무기예요.",
      "편재가 많아요 — 돈 냄새를 맡는 감각! 활동 반경이 넓을수록 재물이 붙어요.",
      "정재가 많아요 — 성실하게 모으는 알부자 스타일. 신용이 곧 재산입니다.",
      "편관이 많아요 — 위기에 강한 승부 근성. 책임이 클수록 크게 성장해요.",
      "정관이 많아요 — 반듯한 명예운. 조직에서 인정받는 모범생 기운입니다.",
      "편인이 많아요 — 독특한 시선과 깊은 탐구심. 전문 분야를 파면 대성해요.",
      "정인이 많아요 — 배움복과 어른복. 공부·자격·문서에서 운이 따라요."
    ],
    strengthDesc: {
      신강: "신강(身強) — 일간의 힘이 튼튼해요. 스스로 끌고 가는 힘이 강하니, 기운을 쏟아낼 무대가 넓을수록 잘 풀립니다.",
      중화: "중화(中和) — 힘의 균형이 좋은 사주예요. 상황에 따라 유연하게 강약을 조절할 수 있는 안정형입니다.",
      신약: "신약(身弱) — 일간이 섬세한 타입. 주변의 도움을 잘 받는 것이 곧 실력이에요. 무리한 확장보다 내실이 유리합니다."
    }
```

- [ ] **Step 3: 콘솔 검증 (preview_eval, /play/saju.html에서)**

```js
// 1) 십성 전수: 일간 갑(0) 기준
[0,1,2,3,4,5,6,7,8,9].map(g => Saju.SIPSEONG[Saju.sipseong(0, g)]).join(",")
// 기대: 비견,겁재,식신,상관,편재,정재,편관,정관,편인,정인
// 2) 진태양시 경계: 1995-03-15 23:10 → 보정 시 22:40(일주 그대로), 미보정 시 23시 규칙(다음날)
// t1 = compute(..., hour:23, min:10, {trueSolar:true}).pillars.day  → 을사([1,5])
// t2 = compute(..., hour:23, min:10, {}).pillars.day               → 병오([2,6])
// 3) 대운: 1995-03-15 14:30 남 → 을해년 음간+남 = 역행(forward:false),
//    직전 절=경칩(1995-03-06 09:16경), 일수≈9.2 → 대운수 3, 첫 대운 = 무인(월주 기묘 -1)
```

Expected: 전부 일치. 불일치 시 STOP.

- [ ] **Step 4: 커밋**

```bash
git add play/js/saju.js
git commit -m "feat: 사주 엔진 v2(십성·지장간·신강약·진태양시·대운)"
```

---

### Task 2: saju.html 개편 + CSS

**Files:**
- Modify: `play/saju.html`
- Modify: `css/style.css` (끝에 추가)

- [ ] **Step 1: CSS 추가**

```css
/* 사주 v2 */
.pillar .ss { display: block; font-size: 0.72rem; color: var(--ink-soft); margin-top: 4px; line-height: 1.3; }
.opt-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; color: var(--ink-soft); }
.opt-row label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
.daeun-list { display: flex; gap: 8px; overflow-x: auto; padding: 6px 0; }
.daeun-item { flex: 0 0 auto; background: var(--cream); border-radius: 12px; padding: 10px 12px; text-align: center; min-width: 64px; }
.daeun-item .age { font-size: 0.78rem; color: var(--ink-soft); display: block; }
.daeun-item .gj { font-size: 1.1rem; }
.daeun-item .ss { font-size: 0.72rem; color: var(--ink-soft); display: block; }
.stars { color: #f5b301; letter-spacing: 2px; }
.tag-list { list-style: none; margin: 6px 0 0; }
.tag-list li { display: inline-block; background: var(--cream); border-radius: 999px; padding: 6px 12px; margin: 0 6px 6px 0; font-size: 0.92rem; }
```

- [ ] **Step 2: saju.html 입력 패널에 옵션 줄 추가**

`btn-go` 버튼 바로 위에:

```html
      <div class="opt-row">
        <label><input type="radio" name="gender" value="" checked />성별 안 함</label>
        <label><input type="radio" name="gender" value="M" />남</label>
        <label><input type="radio" name="gender" value="F" />여</label>
        <label><input type="checkbox" id="in-truesolar" checked />진태양시 보정(-30분)</label>
      </div>
```

- [ ] **Step 3: 결과 패널 확장**

`r-oheng-txt` 문단 뒤에:

```html
      <p id="r-strength" style="line-height:1.7; margin-top:10px"></p>
      <p id="r-sipseong" style="line-height:1.7; margin-top:10px"></p>
      <div id="r-daeun" style="margin-top:16px"></div>
```

- [ ] **Step 4: 페이지 스크립트 수정**

`btn-go` 핸들러에서 compute 호출을:

```js
        var gender = document.querySelector('input[name="gender"]:checked').value || null;
        var trueSolar = $("in-truesolar").checked;
        var r = Saju.compute(data, { y: yy, m: mm, d: dd, hour: hour, min: min },
          { trueSolar: trueSolar, gender: gender });
```

render(r)에 추가/수정:

```js
        // 기둥에 십성 라벨 (기존 roles forEach 안, pillarText 뒤에)
        var roleKey = { "시주": "hour", "일주": "day", "월주": "month", "년주": "year" }[pair[0]];
        var ssGan = roleKey === "day" ? "나(일간)" : Saju.SIPSEONG[Saju.sipseong(r.ilgan, pair[1][0])];
        var ssJi = Saju.SIPSEONG[Saju.sipseong(r.ilgan, Saju.branchMainGan(pair[1][1]))];
        html += '<div class="pillar"><span class="role">' + pair[0] + '</span><span class="hanja">' + t.hanja +
          '</span><span class="hangul">' + t.hangul + '</span><span class="ss">' + ssGan + "<br>" + ssJi + "</span></div>";

        // 오행 막대: 가중 소수 → 소수 1자리 표시
        bars += '... width:' + (n / total * 100) + '% ... <span class="cnt">' + (Math.round(n * 10) / 10) + "</span>...";

        // 신강약·십성 해설
        $("r-strength").textContent = "⚖️ " + SajuText.strengthDesc[r.strength.label];
        $("r-sipseong").textContent = r.topSipseong == null ? "" : "🧭 " + SajuText.sipseongDesc[r.topSipseong];

        // 대운
        var dv = $("r-daeun");
        if (r.daeun) {
          var dh = '<h2 style="font-size:1.05rem; margin-bottom:8px">🚉 대운 흐름 (' + (r.daeun.forward ? "순행" : "역행") +
            (r.daeun.approx ? " · 근사" : "") + ')</h2><div class="daeun-list">';
          r.daeun.list.forEach(function (du) {
            var t2 = Saju.pillarText([du.gan, du.ji]);
            dh += '<div class="daeun-item"><span class="age">' + du.age + '세~</span><span class="gj">' + t2.hanja +
              '</span><span class="ss">' + Saju.SIPSEONG[Saju.sipseong(r.ilgan, du.gan)] + "</span></div>";
          });
          dv.innerHTML = dh + "</div>";
        } else dv.innerHTML = "";
```

- [ ] **Step 5: UI 검증**

1995-03-15 / 14시 30분 / 남 / 진태양시 켬 → 기둥마다 십성 2줄, 신강약 문단, 십성 해설, 대운 8칸(역행) 표시. 성별 "안 함" → 대운 미표시. 오행 숫자가 소수 1자리.

- [ ] **Step 6: 커밋**

```bash
git add play/saju.html css/style.css
git commit -m "feat: 사주 페이지 v2(십성 라벨·신강약·대운 타임라인·진태양시 옵션)"
```

---

### Task 3: 운세 엔진 + 오늘의 운세 페이지

**Files:**
- Create: `play/js/fortune.js`
- Create: `play/fortune.html`

- [ ] **Step 1: `play/js/fortune.js` 작성**

```js
// goblub 운세 엔진. window.Fortune = { get, todayGanji, dayText }
// 십성 인덱스 순서: 비견 겁재 식신 상관 편재 정재 편관 정관 편인 정인
(function () {
  var SCORE = {
    total: [4, 2, 5, 3, 4, 4, 2, 4, 3, 5],
    love:  [3, 2, 4, 4, 5, 5, 3, 4, 2, 3],
    money: [2, 1, 4, 3, 5, 5, 2, 3, 3, 4],
    month: [4, 2, 5, 3, 4, 4, 2, 4, 3, 5]
  };
  var TXT = {
    total: [
      "나와 닮은 기운이 들어오는 날. 내 페이스대로 밀고 가면 순조로워요. 동료·친구와의 협력이 특히 잘 풀립니다.",
      "경쟁의 기운이 감도는 날. 서두르면 내 몫을 나눠주게 될 수 있어요. 지갑과 약속은 평소보다 신중하게.",
      "먹고 즐기고 만드는 모든 일이 잘 되는 날! 아이디어도 술술, 컨디션도 순풍. 미뤄둔 취미를 꺼내기 좋아요.",
      "말재주와 끼가 폭발하는 날. 표현은 빛나지만 윗사람 앞에서는 한 번 삼키고 말하기. 창작 활동엔 최고의 날.",
      "기회의 돈이 움직이는 날. 뜻밖의 수입이나 좋은 정보가 들어올 수 있어요. 다만 큰 지출 결정은 한 박자 쉬고.",
      "성실함이 보상받는 날. 꾸준히 해온 일에서 결실이 보여요. 계획된 소비와 저축 점검에 딱 좋은 날.",
      "압박과 도전이 함께 오는 날. 버겁게 느껴져도 이겨내면 한 단계 성장해요. 무리한 일정은 피하고 체력 관리.",
      "질서와 인정의 기운. 규칙을 지키는 모습이 좋은 평가로 돌아와요. 공적인 자리, 면접, 계약에 유리한 날.",
      "생각이 많아지는 날. 직감은 날카롭지만 걱정도 늘어요. 혼자만의 재충전과 공부에 어울리는 하루.",
      "귀인의 도움이 다가오는 날. 배움과 조언이 나를 살찌워요. 어른·선생님·멘토와의 대화에서 힌트를 얻어요."
    ],
    love: [
      "친구 같은 편안함이 매력이 되는 날. 솔직한 대화가 거리를 좁혀요. 커플은 함께하는 활동이 좋아요.",
      "미묘한 경쟁 구도 주의! 연인 주변 인물에 괜한 신경전은 금물. 오늘은 여유 있는 쪽이 이깁니다.",
      "웃음이 사랑을 부르는 날. 맛집 데이트, 소소한 선물이 효과 만점. 자연스러운 매력이 빛나요.",
      "치명적인 매력이 폭발하지만 말이 앞서기 쉬운 날. 밀당보다 진심, 유머는 양념만큼만.",
      "설렘 가득! 새로운 만남의 기운이 강한 날이에요. 솔로는 모임에 나가보세요. 커플은 이벤트가 잘 통해요.",
      "안정적인 애정운. 진지한 관계로 발전하기 좋은 날이에요. 미래 이야기를 꺼내기에 어울려요.",
      "긴장감 있는 끌림의 날. 강렬하지만 페이스를 잃기 쉬워요. 상대에게 휘둘리지 않는 중심이 필요해요.",
      "믿음직한 모습이 매력 포인트. 소개팅·상견례처럼 격식 있는 자리에 좋은 날.",
      "생각이 많아 마음 표현이 서툴러지는 날. 오해가 생기면 바로 풀기. 편지나 긴 메시지가 도움돼요.",
      "포근한 애정운. 아껴주고 아낌받는 하루. 오래된 인연에게 연락해보는 것도 좋아요."
    ],
    money: [
      "내 것을 지키는 날. 공동 지출·더치페이는 명확하게. 협업 수익은 배분을 미리 정해두세요.",
      "지출 경보! 충동구매와 빌려주는 돈을 특히 조심하세요. 오늘 아낀 돈이 다음 주의 나를 살립니다.",
      "재능이 돈이 되는 흐름. 부업·콘텐츠·요리 등 손으로 만드는 일에서 수익의 씨앗이 보여요.",
      "아이디어로 버는 기운. 다만 계약서 문구는 꼼꼼히. 말로 한 약속은 오늘은 증거를 남기세요.",
      "돈의 흐름이 커지는 날! 투자 정보, 세일 찬스 등 기회가 많지만 욕심은 화를 불러요. 소액으로만.",
      "차곡차곡 쌓이는 재물운. 가계부 정리, 적금, 고정지출 다이어트에 최적의 날.",
      "돈 나갈 일이 생기기 쉬운 날. 벌금·수리비 같은 변수 대비! 큰 결제는 내일로 미루세요.",
      "안정 수입의 기운. 월급·정산이 관련된 일이 순조로워요. 공식 문서는 오늘 처리하면 깔끔.",
      "정보가 곧 돈인 날. 다만 솔깃한 제안은 한 번 더 검증. 공부에 쓰는 돈은 아깝지 않아요.",
      "도움을 받는 재물운. 부모님·선배의 지원이나 좋은 조언이 들어와요. 계약·환급 같은 문서 재물도 체크."
    ],
    month: [
      "내 주관대로 끌고 가기 좋은 달. 협력자는 늘지만 주도권은 놓치지 마세요.",
      "지출과 경쟁이 늘어나는 달. 큰돈 약속은 미루고 실력을 쌓는 데 집중하면 손해가 없어요.",
      "즐기면서 성과가 나는 달! 새 취미·프로젝트를 시작하기에 이만한 때가 없어요.",
      "표현력이 만개하는 달. 발표·창작·SNS에서 주목받아요. 단, 구설수 한 스푼 조심.",
      "기회가 굴러다니는 역동적인 달. 발 빠르게 움직이면 수확이 커요. 과욕만 조심!",
      "성실 모드가 빛나는 달. 꾸준함이 눈에 보이는 결과로 돌아옵니다. 재정 계획 세우기 최적.",
      "시험대에 오르는 달. 부담스러운 과제가 오지만 통과하면 레벨업. 건강 관리가 반입니다.",
      "인정과 승진의 기운이 도는 달. 책임감 있는 모습을 보여줄 기회를 놓치지 마세요.",
      "재정비의 달. 속도를 늦추고 공부·계획에 투자하면 다음 달이 편해져요.",
      "귀인운이 강한 달. 배움과 자격, 문서에서 좋은 소식이 있어요. 어른들의 조언에 귀 기울이기."
    ]
  };
  // 육합/충 (지지 인덱스 쌍)
  var YUKHAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  var CHUNG = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
  var YUKHAP_MSG = "💞 오늘은 나의 일지와 합(合)을 이루는 날 — 인연과 협력이 순조롭게 붙는 기운이에요.";
  var CHUNG_MSG = "⚡ 오늘은 나의 일지와 충(沖)하는 날 — 변동수가 있으니 중요한 결정은 한 템포 쉬어가세요.";

  function clamp(n) { return Math.max(1, Math.min(5, n)); }

  // 오늘(now: Date)의 간지 — Saju.compute 재사용 (정오 기준)
  function todayGanji(data, now) {
    return Saju.compute(data, { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), hour: 12, min: 0 });
  }

  function get(data, birth, now) {
    var me = Saju.compute(data, birth, {});
    var td = todayGanji(data, now);
    var ssDay = Saju.sipseong(me.ilgan, td.pillars.day[0]);
    var ssMonth = Saju.sipseong(me.ilgan, td.pillars.month[0]);
    var myJi = me.pillars.day[1], tdJi = td.pillars.day[1];
    var mod = 0, modMsg = null;
    if (YUKHAP[myJi] === tdJi) { mod = 1; modMsg = YUKHAP_MSG; }
    else if (CHUNG[myJi] === tdJi) { mod = -1; modMsg = CHUNG_MSG; }
    return {
      me: me, today: td, modMsg: modMsg,
      total: { score: clamp(SCORE.total[ssDay] + mod), text: TXT.total[ssDay], ss: ssDay },
      love: { score: clamp(SCORE.love[ssDay] + mod), text: TXT.love[ssDay] },
      money: { score: clamp(SCORE.money[ssDay] + mod), text: TXT.money[ssDay] },
      month: { score: SCORE.month[ssMonth], text: TXT.month[ssMonth], ss: ssMonth }
    };
  }

  // 오늘의 사주 페이지용 텍스트
  var DAY_GAN_TEXT = [
    "쭉쭉 뻗는 큰 나무의 기운. 시작·개척·선언에 좋은 날이에요.",
    "유연한 덩굴의 기운. 조율과 협상, 부드러운 접근이 통하는 날.",
    "쨍한 태양의 기운. 드러내고 알리는 일, 활발한 활동에 딱.",
    "은은한 촛불의 기운. 섬세한 작업과 깊은 대화가 어울리는 날.",
    "듬직한 산의 기운. 중심 잡기, 약속 다지기, 기반 정리에 좋아요.",
    "포근한 밭의 기운. 돌보고 가꾸는 일, 실속 챙기기에 좋은 날.",
    "단단한 무쇠의 기운. 결단·정리·끊어내기에 힘이 실리는 날.",
    "반짝이는 보석의 기운. 다듬고 완성하는 일, 디테일 승부의 날.",
    "너른 강물의 기운. 새로운 흐름에 올라타기, 큰 그림 그리기 좋은 날.",
    "촉촉한 이슬비의 기운. 조용한 몰입과 감성 충전에 어울리는 날."
  ];
  var DAY_JI_TEXT = [
    "🐭 민첩하게 움직일수록 이득이 모이는 날.",
    "🐮 묵묵히 한 걸음. 느려도 확실한 진행이 답.",
    "🐯 과감한 도전에 힘이 붙는 날.",
    "🐰 감각과 센스가 살아나요. 꾸미기 좋은 날.",
    "🐲 스케일 큰 일에 운이 따르는 날.",
    "🐍 직감이 예리해져요. 통찰이 필요한 일에 유리.",
    "🐴 에너지 만렙! 활동량을 늘려보세요.",
    "🐑 온화한 기운. 화해와 나눔에 좋은 날.",
    "🐵 재치와 기술이 빛나는 날. 손 쓰는 일 술술.",
    "🐔 꼼꼼함이 무기. 마무리와 점검의 날.",
    "🐶 의리와 신뢰가 통하는 날. 사람에 투자하세요.",
    "🐷 너그러움이 복을 부르는 날. 베풀면 돌아와요."
  ];
  var OHENG_DO = [
    { good: ["새 일 시작하기", "산책·운동", "계획 세우기"], care: ["고집 부리기", "욱해서 내지르기"] },
    { good: ["발표·홍보", "사람 만나기", "열정 프로젝트"], care: ["과로", "말실수"] },
    { good: ["정리정돈", "계약·약속 다지기", "저축"], care: ["미루기", "지나친 신중함"] },
    { good: ["결단 내리기", "끊어내기", "디테일 손보기"], care: ["지나친 비판", "날 선 말투"] },
    { good: ["공부·리서치", "휴식과 충전", "아이디어 메모"], care: ["우유부단", "밤샘"] }
  ];
  function dayText(td) {
    var g = td.pillars.day[0], ji = td.pillars.day[1];
    return { gan: DAY_GAN_TEXT[g], ji: DAY_JI_TEXT[ji], dos: OHENG_DO[Math.floor(g / 2)] };
  }

  window.Fortune = { get: get, todayGanji: todayGanji, dayText: dayText };
})();
```

- [ ] **Step 2: `play/fortune.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>오늘의 운세 — goblub</title>
  <meta name="description" content="내 사주 기반 오늘의 총운·연애운·재물운·이번 달 운세" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <div id="site-header"></div>
  <main>
    <section class="hero">
      <h1>🌞 오늘의 운세</h1>
      <p id="today-label">내 사주로 보는 진짜 운세 — 매일 달라져요</p>
    </section>

    <section class="panel" id="input-panel">
      <h2>생일을 알려주세요 (한 번만!)</h2>
      <div class="field-row">
        <select id="in-year"></select>
        <select id="in-month"></select>
        <select id="in-day"></select>
        <select id="in-hour"><option value="">태어난 시 몰라요</option></select>
      </div>
      <button class="btn-primary" id="btn-go">운세 보기</button>
      <p class="error-msg" id="err"></p>
      <p class="fine-print" style="text-align:left">생일은 이 브라우저에만 저장돼요. 서버로 전송되지 않아요.</p>
    </section>

    <div id="result-area" style="display:none">
      <section class="panel">
        <h2 id="r-head"></h2>
        <p id="r-iljin" style="color:var(--ink-soft)"></p>
        <p id="r-mod" style="margin-top:8px; line-height:1.6"></p>
      </section>
      <section class="panel"><h2>🍀 오늘의 총운 <span class="stars" id="s-total"></span></h2><p class="result-desc" id="t-total"></p></section>
      <section class="panel"><h2>💘 오늘의 연애운 <span class="stars" id="s-love"></span></h2><p class="result-desc" id="t-love"></p></section>
      <section class="panel"><h2>💰 오늘의 재물운 <span class="stars" id="s-money"></span></h2><p class="result-desc" id="t-money"></p></section>
      <section class="panel"><h2>📆 이번 달의 운세 <span class="stars" id="s-month"></span></h2><p class="result-desc" id="t-month"></p></section>
      <div class="result-actions">
        <button class="btn-ghost" id="btn-reset">생일 바꾸기</button>
        <a class="btn-primary" href="saju.html">내 사주 전체 보기</a>
      </div>
    </div>

    <p class="fine-print">운세는 재미로 봐주세요 🙂</p>
  </main>
  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/saju.js"></script>
  <script src="js/fortune.js"></script>
  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };
      var KEY = "goblub_birth";
      var data = null;

      var y = $("in-year"), m = $("in-month"), d = $("in-day"), h = $("in-hour");
      for (var i = 2100; i >= 1900; i--) y.add(new Option(i + "년", i));
      y.value = 1995;
      for (i = 1; i <= 12; i++) m.add(new Option(i + "월", i));
      for (i = 1; i <= 31; i++) d.add(new Option(i + "일", i));
      for (i = 0; i <= 23; i++) h.add(new Option(i + "시", i));

      function showErr(msg) { var e = $("err"); e.textContent = msg; e.style.display = "block"; }

      function savedBirth() {
        try {
          var b = JSON.parse(localStorage.getItem(KEY));
          if (b && b.y >= 1900 && b.y <= 2100 && b.m >= 1 && b.m <= 12 && b.d >= 1 && b.d <= 31) return b;
        } catch (e) {}
        return null;
      }

      function show(birth) {
        var f = Fortune.get(data, birth, new Date());
        var tt = Saju.pillarText(f.today.pillars.day);
        var now = new Date();
        $("r-head").textContent = now.getMonth() + 1 + "월 " + now.getDate() + "일, " +
          birth.y + "년생 " + f.me.zodiac + "띠님의 운세";
        $("r-iljin").textContent = "오늘의 일진: " + tt.hanja + " (" + tt.hangul + ")";
        $("r-mod").textContent = f.modMsg || "";
        $("r-mod").style.display = f.modMsg ? "block" : "none";
        function stars(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
        $("s-total").textContent = stars(f.total.score); $("t-total").textContent = f.total.text;
        $("s-love").textContent = stars(f.love.score); $("t-love").textContent = f.love.text;
        $("s-money").textContent = stars(f.money.score); $("t-money").textContent = f.money.text;
        $("s-month").textContent = stars(f.month.score); $("t-month").textContent = f.month.text;
        $("input-panel").style.display = "none";
        $("result-area").style.display = "block";
      }

      fetch("data/saju-terms.json")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (dd) {
          data = dd;
          var b = savedBirth();
          if (b) show(b);
        })
        .catch(function () { showErr("데이터를 불러오지 못했어요. 새로고침 해주세요."); });

      $("btn-go").onclick = function () {
        $("err").style.display = "none";
        if (!data) { showErr("데이터를 불러오지 못했어요. 새로고침 해주세요."); return; }
        var yy = +y.value, mm = +m.value, dd2 = +d.value;
        var date = new Date(yy, mm - 1, dd2);
        if (date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd2) {
          showErr("없는 날짜예요. 다시 확인해주세요!"); return;
        }
        var birth = { y: yy, m: mm, d: dd2, hour: h.value === "" ? null : +h.value, min: 0 };
        try { localStorage.setItem(KEY, JSON.stringify(birth)); } catch (e) {}
        show(birth);
      };

      $("btn-reset").onclick = function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        $("result-area").style.display = "none";
        $("input-panel").style.display = "block";
      };
    })();
  </script>
</body>
</html>
```

- [ ] **Step 3: 검증 (preview_eval)**

- 결정성: `Fortune.get(data, birth, new Date(2026,6,3))` 2회 → JSON 동일.
- 육합: 내 일지 자(0)인 생일 vs 오늘 일지 축(1)인 날짜 → modMsg 합 문구, 총운 +1. 충: 자(0) vs 오(6) → −1. (일지가 원하는 값이 되는 날짜는 콘솔에서 탐색해 사용)
- UI: 생일 입력 → 4카드 표시 → 새로고침 → 입력 없이 바로 운세 → "생일 바꾸기" → 폼 복귀.

- [ ] **Step 4: 커밋**

```bash
git add play/js/fortune.js play/fortune.html
git commit -m "feat: 오늘의 운세(총운·연애·재물·이번달, 십성+합충 기반, 생일 저장)"
```

---

### Task 4: 오늘의 사주 페이지

**Files:**
- Create: `play/today.html`

- [ ] **Step 1: `play/today.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>오늘의 사주 — goblub</title>
  <meta name="description" content="오늘은 무슨 날? 오늘의 간지와 기운, 좋은 것과 조심할 것" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <div id="site-header"></div>
  <main>
    <section class="hero">
      <h1>📅 오늘의 사주</h1>
      <p id="date-label"></p>
    </section>

    <section class="panel">
      <h2>오늘의 간지</h2>
      <div class="pillar-grid" id="t-pillars" style="grid-template-columns:repeat(3,1fr)"></div>
      <p id="t-gan" style="line-height:1.7; margin-top:8px"></p>
      <p id="t-ji" style="line-height:1.7; margin-top:8px"></p>
    </section>

    <section class="panel">
      <h2>👍 오늘 하면 좋은 것</h2>
      <ul class="tag-list" id="t-good"></ul>
      <h2 style="margin-top:18px">⚠️ 오늘 조심할 것</h2>
      <ul class="tag-list" id="t-care"></ul>
    </section>

    <div class="result-actions">
      <a class="btn-primary" href="fortune.html">내 운세도 보기</a>
    </div>
    <p class="fine-print" id="t-err">재미로 봐주세요 🙂</p>
  </main>
  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/saju.js"></script>
  <script src="js/fortune.js"></script>
  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };
      var now = new Date();
      $("date-label").textContent = now.getFullYear() + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일, 오늘은 무슨 날?";
      fetch("data/saju-terms.json")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          var td = Fortune.todayGanji(data, now);
          var roles = [["오늘의 해", td.pillars.year], ["이달", td.pillars.month], ["오늘", td.pillars.day]];
          var html = "";
          roles.forEach(function (pair) {
            var t = Saju.pillarText(pair[1]);
            html += '<div class="pillar"><span class="role">' + pair[0] + '</span><span class="hanja">' + t.hanja +
              '</span><span class="hangul">' + t.hangul + "</span></div>";
          });
          $("t-pillars").innerHTML = html;
          var dt = Fortune.dayText(td);
          $("t-gan").textContent = "🌤️ " + dt.gan;
          $("t-ji").textContent = dt.ji;
          $("t-good").innerHTML = dt.dos.good.map(function (g) { return "<li>" + g + "</li>"; }).join("");
          $("t-care").innerHTML = dt.dos.care.map(function (c) { return "<li>" + c + "</li>"; }).join("");
        })
        .catch(function () { $("t-err").textContent = "데이터를 불러오지 못했어요. 새로고침 해주세요."; });
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: 검증**

오늘 일진이 saju 계산(`Saju.compute(data,{오늘,hour:12}).pillars.day`)과 일치. 간지 3기둥·기운 2문장·좋은 것/조심할 것 태그 표시.

- [ ] **Step 3: 커밋**

```bash
git add play/today.html
git commit -m "feat: 오늘의 사주 페이지(오늘의 간지·기운·조언)"
```

---

### Task 5: 메인 카드 + 모바일 검증

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 사주 카드 다음에 카드 2개 추가**

```html
      <a class="card tint-yellow" href="play/fortune.html">
        <span class="icon">🌞</span>
        <h2>오늘의 운세</h2>
        <p>내 사주로 보는 오늘의 총운·연애운·재물운</p>
      </a>

      <a class="card tint-sky" href="play/today.html">
        <span class="icon">📅</span>
        <h2>오늘의 사주</h2>
        <p>오늘은 무슨 날? 오늘의 간지와 기운</p>
      </a>
```

- [ ] **Step 2: 데스크톱 + 모바일(375px) 검증** — 카드 8개 그리드, 신규 2페이지 가로 스크롤 없음, 대운 리스트 모바일에서 가로 스와이프.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: 메인에 오늘의 운세·오늘의 사주 카드 추가"
```

---

### Task 6: 배포 및 실사이트 확인

- [ ] **Step 1: `git push`**
- [ ] **Step 2: 1~2분 후 실사이트 확인** — `/play/fortune.html`, `/play/today.html`, `/play/saju.html` 전부 200, 메인 카드 8개.
