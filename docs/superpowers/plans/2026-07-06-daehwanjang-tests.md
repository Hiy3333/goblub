# 대환장 테스트 허브 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노말했던 테스트 3종(연애·스트레스·스펙트럼)을 각 성격에 맞는 대환장 컨셉으로 재기획하고, 짤 이미지 공유만 공통화한다.

**Architecture:** 공용 `quiz.js`를 "흐름+채점 엔진"으로 일반화(결과는 `config.renderResult`로 위임)하고, 짤 이미지는 공용 `sharecard.js`로 통일한다. 각 테스트 페이지는 자기 questions + renderResult만 정의한다. 전부 클라이언트 채점, AI/서버 불필요.

**Tech Stack:** 순수 HTML/CSS/JS(빌드 없음), Canvas 2D(toBlob PNG), goblub 팔레트/Jua. 검증은 이 저장소 관례대로 **브라우저 프리뷰(preview_eval DOM 검증)** + `node --check` 문법검사. 별도 테스트 러너 없음.

**참고 스펙:** `docs/superpowers/specs/2026-07-06-daehwanjang-tests-design.md`

---

## 파일 구조

- 수정 `play/js/quiz.js` — 흐름+채점 엔진으로 일반화. `Quiz.init(el,config)` + 순수 유틸 `Quiz.top(totals,order)`.
- 신규 `play/js/sharecard.js` — `ShareCard.render(spec)` → 미리보기+저장버튼 DOM. Canvas PNG.
- 수정 `play/love-test.html` — 연애세포 회의 (questions + renderResult + CSS).
- 수정 `play/stress-test.html` — 스트레스 몬스터 변신 (questions + renderResult + 고블럽 먹기 모션 + CSS).
- 수정 `play/spectrum.html` — 나의 무지개 좌표 (questions + 연속 좌표 renderResult + 프라이버시).
- 수정 `play/tests.html` — 타일 3개 카피/이모지 교체.
- 수정 `play/js/feed.js` — SOURCES love/stress 라벨 갱신(spectrum 제외 유지).

기존 love-test.html/stress-test.html은 현재 `window.__feedSrc` + `Quiz.init(resolve/results)` 방식을 쓴다. 이번에 전부 새 API로 교체한다.

---

## Task 1: quiz.js 엔진 일반화 + 순수 유틸

**Files:**
- Modify: `play/js/quiz.js` (전체 교체)

- [ ] **Step 1: quiz.js 전체를 아래로 교체**

```js
// goblub 공용 퀴즈 엔진 — 흐름+채점. 결과는 config.renderResult 로 위임.
// config = {
//   emoji, title, intro,                        // 시작 화면
//   feedSrc,                                     // (선택) 결과 도달 시 GoblubFeed.grant(feedSrc)
//   questions: [{ q, choices: [{ text, scores:{키:점수} }] }],
//   renderResult: function(totals, el, api)      // 테스트별 커스텀 결과. api={restart, shareLink}
// }
(function () {
  function init(el, config) {
    var idx = 0, totals = {};
    function addScores(s) { for (var k in s) totals[k] = (totals[k] || 0) + s[k]; }

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
          else finish();
        };
      });
    }

    function finish() {
      if (window.GoblubFeed && config.feedSrc) GoblubFeed.grant(config.feedSrc);
      config.renderResult(totals, el, { restart: renderStart, shareLink: shareLink });
    }

    function shareLink(btn) {
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
        .then(function () { btn.textContent = "복사됨!"; })
        .catch(function () { btn.textContent = location.href; });
    }

    renderStart();
  }

  // 이산 결과 최고점 키(동점이면 order 앞선 키 우선). 순수 함수.
  function top(totals, order) {
    var best = order[0], bestV = -Infinity;
    order.forEach(function (k) { var v = totals[k] || 0; if (v > bestV) { bestV = v; best = k; } });
    return best;
  }

  window.Quiz = { init: init, top: top };
})();
```

- [ ] **Step 2: 문법 검사**

Run: `node --check play/js/quiz.js`
Expected: 출력 없음(성공).

- [ ] **Step 3: top() 순수 로직 검증(node)**

Run:
```
node -e "eval(require('fs').readFileSync('play/js/quiz.js','utf8').replace('window.Quiz','globalThis.Quiz')); var t=globalThis.Quiz.top; console.log(t({a:2,b:5,c:5},['a','b','c'])==='b', t({a:1},['a','b'])==='a', t({},['x','y'])==='x')"
```
Expected: `true true true` (동점 b/c 시 order 앞선 b, 빈 totals면 order 첫키).

- [ ] **Step 4: 커밋**

```bash
git add play/js/quiz.js
git commit -m "refactor: quiz.js 흐름+채점 엔진 일반화(renderResult 위임 + Quiz.top)"
```

---

## Task 2: sharecard.js 공용 짤 이미지 모듈

**Files:**
- Create: `play/js/sharecard.js`

- [ ] **Step 1: sharecard.js 작성**

```js
// 공용 결과 짤 카드 — Canvas 640x800 PNG. ShareCard.render(spec) → 미리보기+저장버튼 DOM.
// spec = { palette, emoji, badge, title, lines:[...], footer }
(function () {
  var PALETTE = { coral:"#ff6b6b", yellow:"#ffd93d", mint:"#6bcb77", sky:"#4d96ff", purple:"#b983ff", cream:"#fff9ec" };

  function wrapText(c, text, x, y, maxW, lh) {
    var line = "", yy = y;
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = text[i]; yy += lh; }
      else line = test;
    }
    if (line) c.fillText(line, x, yy);
    return yy;
  }

  function draw(canvas, spec) {
    var c = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    var bg = PALETTE[spec.palette] || PALETTE.purple;
    c.fillStyle = "#fff9ec"; c.fillRect(0, 0, W, H);
    c.fillStyle = bg; c.fillRect(0, 0, W, 190);
    c.textAlign = "center";
    c.fillStyle = "#ffffff"; c.font = "30px Jua, sans-serif";
    c.fillText(spec.badge || "", W / 2, 78);
    c.font = "130px sans-serif"; c.fillText(spec.emoji || "👾", W / 2, 340);
    c.fillStyle = "#38352f"; c.font = "46px Jua, sans-serif";
    c.fillText(spec.title || "", W / 2, 420);
    c.fillStyle = "#7a766d"; c.font = "27px Jua, sans-serif";
    var yy = 480;
    (spec.lines || []).forEach(function (ln) { yy = wrapText(c, ln, W / 2, yy, W - 110, 40) + 46; });
    c.fillStyle = "#b0a99a"; c.font = "22px Jua, sans-serif";
    c.fillText(spec.footer || "goblub · 대환장 테스트", W / 2, H - 40);
  }

  function save(canvas, name) {
    function dl(url) { var a = document.createElement("a"); a.href = url; a.download = (name || "goblub") + ".png"; a.click(); }
    if (canvas.toBlob) {
      canvas.toBlob(function (b) {
        if (!b) { dl(canvas.toDataURL("image/png")); return; }
        var u = URL.createObjectURL(b); dl(u); setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
      }, "image/png");
    } else dl(canvas.toDataURL("image/png"));
  }

  function render(spec) {
    var wrap = document.createElement("div");
    var canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 800;
    canvas.style.cssText = "width:100%; max-width:300px; border-radius:16px; display:block; margin:0 auto;";
    function paint() { draw(canvas, spec); }
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint); // Jua 로드 후 재렌더
    var actions = document.createElement("div"); actions.className = "result-actions";
    var btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "🖼 결과 짤 저장";
    btn.onclick = function () { save(canvas, spec.title || "goblub"); };
    actions.appendChild(btn);
    wrap.appendChild(canvas); wrap.appendChild(actions);
    return wrap;
  }

  window.ShareCard = { render: render };
})();
```

- [ ] **Step 2: 문법 검사**

Run: `node --check play/js/sharecard.js`
Expected: 출력 없음.

- [ ] **Step 3: 커밋**

```bash
git add play/js/sharecard.js
git commit -m "feat: 공용 결과 짤 카드 모듈 sharecard.js (Canvas PNG)"
```

브라우저 동작검증은 Task 3에서 실제 사용과 함께 수행.

---

## Task 3: 연애세포 회의 (love-test.html)

**Files:**
- Modify: `play/love-test.html` (전체 교체)

**연애세포 6종(고정):** 키 → {emoji, name(우세형 표기), desc(팩폭 2~3문장), match(짝꿍세포 키), clash(상극세포 키)}
- `mildang` 밀당세포 🎭 "밀당세포 우세형" — 여유로운 척 계산 중. 짝꿍 tsundere, 상극 jikjin
- `jikjin` 직진세포 🚀 "직진세포 우세형" — 좋으면 바로 돌진, 고백 선빵. 짝꿍 mosol, 상극 mildang
- `jipchak` 집착세포 🔗 "집착세포 우세형" — 사랑하면 올인, 읽씹 못 참음. 짝꿍 heonsin, 상극 jikjin
- `mosol` 모솔세포 🌱 "모솔세포 우세형" — 상상은 100 실행은 0. 짝꿍 jikjin, 상극 jipchak
- `tsundere` 츤데레세포 🐱 "츤데레세포 우세형" — 좋아할수록 퉁명. 짝꿍 mildang, 상극 heonsin
- `heonsin` 헌신세포 💝 "헌신세포 우세형" — 다 퍼주는 사랑. 짝꿍 jipchak, 상극 tsundere

- [ ] **Step 1: love-test.html 전체 교체**

기본 골격(헤더/푸터/패널)과 `#quiz` 컨테이너를 두고, quiz.js·sharecard.js·feed.js를 로드한 뒤 아래 config로 `Quiz.init` 호출. `renderResult`는 세포 비율 막대 + 짝꿍/상극 + ShareCard를 렌더한다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>내 안의 연애세포 회의 — goblub</title>
  <meta name="description" content="내 안의 연애세포들이 회의를 연다 — 우세 세포로 보는 나의 연애 본능" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
  <style>
    .cell-bars { margin: 18px 0 6px; }
    .cell-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.95rem; }
    .cell-row .nm { width: 92px; flex: none; }
    .cell-row .track { flex: 1; background: #efe9db; border-radius: 999px; height: 14px; overflow: hidden; }
    .cell-row .fill { height: 14px; border-radius: 999px; background: linear-gradient(90deg, var(--coral), var(--purple)); }
    .cell-row .pct { width: 42px; flex: none; text-align: right; color: var(--ink-soft); }
    .match-line { margin-top: 10px; color: var(--ink-soft); }
  </style>
</head>
<body>
  <div id="site-header"></div>
  <main>
    <section class="panel"><div id="quiz"></div></section>
    <p class="fine-print" style="margin-top:20px">재미로 봐주세요 🙂</p>
  </main>
  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/feed.js"></script>
  <script src="js/quiz.js"></script>
  <script src="js/sharecard.js"></script>
  <script>
    var CELLS = {
      mildang:  { emoji:"🎭", name:"밀당세포 우세형", desc:"...", match:"tsundere", clash:"jikjin" },
      jikjin:   { emoji:"🚀", name:"직진세포 우세형", desc:"...", match:"mosol",    clash:"mildang" },
      jipchak:  { emoji:"🔗", name:"집착세포 우세형", desc:"...", match:"heonsin",  clash:"jikjin" },
      mosol:    { emoji:"🌱", name:"모솔세포 우세형", desc:"...", match:"jikjin",   clash:"jipchak" },
      tsundere: { emoji:"🐱", name:"츤데레세포 우세형", desc:"...", match:"mildang", clash:"heonsin" },
      heonsin:  { emoji:"💝", name:"헌신세포 우세형", desc:"...", match:"jipchak",  clash:"tsundere" }
    };
    var ORDER = ["mildang","jikjin","jipchak","mosol","tsundere","heonsin"];

    var QUESTIONS = [ /* Step 2에서 10문항 채움 */ ];

    function renderResult(totals, el, api) {
      var key = Quiz.top(totals, ORDER);
      var r = CELLS[key];
      var sum = 0; ORDER.forEach(function (k) { sum += (totals[k] || 0); });
      sum = sum || 1;
      var rows = ORDER.map(function (k) { return { k: k, v: totals[k] || 0 }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 4);
      var barsHtml = '<div class="cell-bars">' + rows.map(function (row) {
        var pct = Math.round(row.v / sum * 100);
        return '<div class="cell-row"><span class="nm">' + CELLS[row.k].emoji + " " +
          CELLS[row.k].name.replace(" 우세형", "") + '</span>' +
          '<span class="track"><span class="fill" style="width:' + pct + '%"></span></span>' +
          '<span class="pct">' + pct + '%</span></div>';
      }).join("") + "</div>";

      el.innerHTML =
        '<span class="result-emoji">' + r.emoji + "</span>" +
        '<p class="result-name">' + r.name + "</p>" +
        '<p class="result-desc">' + r.desc + "</p>" + barsHtml +
        '<p class="match-line">💞 환상의 짝꿍세포: <b>' + CELLS[r.match].name.replace(" 우세형", "") + "</b>" +
        ' · ⚡ 상극세포: <b>' + CELLS[r.clash].name.replace(" 우세형", "") + "</b></p>" +
        '<div id="card-slot"></div>' +
        '<div class="result-actions">' +
        '<button class="btn-primary" id="qz-retry">다시하기</button>' +
        '<button class="btn-ghost" id="qz-share">링크 복사</button></div>';

      el.querySelector("#card-slot").appendChild(ShareCard.render({
        palette: "coral", emoji: r.emoji, badge: "연애세포 회의 결과", title: r.name,
        lines: [r.desc, "짝꿍세포: " + CELLS[r.match].name.replace(" 우세형", "")]
      }));
      el.querySelector("#qz-retry").onclick = api.restart;
      el.querySelector("#qz-share").onclick = function () { api.shareLink(el.querySelector("#qz-share")); };
    }

    Quiz.init(document.getElementById("quiz"), {
      emoji: "💘", title: "내 안의 연애세포 회의",
      intro: "당신의 연애를 좌우하는 6개의 세포. 지금부터 회의를 시작합니다. 어떤 세포가 마이크를 잡을까요?",
      feedSrc: "love", questions: QUESTIONS, renderResult: renderResult
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: QUESTIONS 10문항 + CELLS desc 작성**

작성 규칙(엄수):
- 10문항. 각 문항 `choices` 3~4개, 각 선택지 `scores`는 1~2개 세포에 +2(주) / +1(부).
- 6개 세포 각각이 최소 2문항 이상에서 주점수(+2)로 등장하도록 분산(특정 세포로만 몰리지 않게).
- 톤: 회의체 상황극. 예시 2문항(그대로 사용 가능):

```js
var QUESTIONS = [
  { q: "썸남에게 카톡이 왔다. 회의실이 술렁인다. 내 손가락은?", choices: [
    { text: "일부러 30분 뒤에 답장", scores: { mildang: 2 } },
    { text: "1초 컷 '나도 방금 생각했어!'", scores: { jikjin: 2, heonsin: 1 } },
    { text: "답장 열 번 썼다 지웠다", scores: { mosol: 2 } },
    { text: "'ㅇㅇ' 짧게 치고 심장은 두근", scores: { tsundere: 2 } } ] },
  { q: "상대가 읽고 답이 없다. 30분째. 나는?", choices: [
    { text: "프사·상메 전부 스캔 시작", scores: { jipchak: 2 } },
    { text: "쿨하게 내 할 일 함(속은 탐)", scores: { mildang: 1, tsundere: 2 } },
    { text: "'바쁜가 보다' 하고 진짜 잊음", scores: { mosol: 2 } },
    { text: "먼저 재밌는 짤 하나 더 보냄", scores: { jikjin: 2, heonsin: 1 } } ] }
  // ... 나머지 8문항을 같은 형식/분산 규칙으로 작성
];
```
- `CELLS`의 각 `desc`를 팩폭 2~3문장으로 채움. 예: `mildang.desc = "좋아하면서도 절대 티 안 내죠. 여유로운 미소 뒤에서 답장 타이밍을 계산하는 당신… 근데 상대도 밀당 중이면 둘 다 평생 썸만 탑니다."`

- [ ] **Step 3: 문법 검사**

Run: `node --check play/love-test.html || true` (HTML이라 --check 불가 시 스킵)
대신: `node -e "var h=require('fs').readFileSync('play/love-test.html','utf8'); var m=h.match(/var QUESTIONS = \[[\s\S]*?\];/); console.log('questions found:', !!m)"`
Expected: `questions found: true`

- [ ] **Step 4: 브라우저 동작 검증(preview_eval)**

프리뷰에서 `http://localhost:8777/play/love-test.html` 로드 후 자동 응답 스크립트로 시작→10문항 전부 첫 선택지 클릭→결과 도달 확인:
```js
(function(){
  document.getElementById("qz-start").click();
  var guard=0;
  while(document.querySelector(".choice-btn") && guard++<20){ document.querySelector(".choice-btn").click(); }
  var name=document.querySelector(".result-name");
  return { reachedResult:!!name, hasBars:!!document.querySelector(".cell-row"),
    hasCard:!!document.querySelector("#card-slot canvas"), matchLine:!!document.querySelector(".match-line") };
})()
```
Expected: `{reachedResult:true, hasBars:true, hasCard:true, matchLine:true}` · 콘솔 에러 0.

- [ ] **Step 5: 커밋**

```bash
git add play/love-test.html
git commit -m "feat: 연애세포 회의(love-test) — 세포 6종·비율 막대·짝꿍/상극·짤 카드"
```

---

## Task 4: 스트레스 몬스터 변신 (stress-test.html)

**Files:**
- Modify: `play/stress-test.html` (전체 교체)

**스트레스 몬스터 6종(고정):** 키 → {emoji, name, desc(팩폭), cure(고블럽이 먹은 뒤 진정 처방 1문장)}
- `pokbal` 폭발몬 🌋 — 참지 않고 버럭. cure: "고블럽이 화를 냠— 이제 심호흡 세 번, 물 한 잔."
- `jamsu` 잠수몬 🌊 — 연락 두절·회피. cure: "고블럽이 잠수를 냠— 한 사람에게만 '나 힘들어' 한마디."
- `nunmul` 눈물몬 💧 — 펑펑 울어 배출. cure: "고블럽이 눈물을 냠— 실컷 울었으면 따뜻한 거 먹기."
- `meokbo` 먹보몬 🍔 — 폭식·보상소비. cure: "고블럽이 폭식을 냠— 대신 좋아하는 노래 한 곡."
- `yemin` 예민몬 🌵 — 가시 바짝·짜증. cure: "고블럽이 가시를 냠— 30분만 알림 끄고 혼자."
- `eoreum` 얼음몬 🧊 — 셧다운·무기력. cure: "고블럽이 무기력을 냠— 딱 5분, 제일 작은 일 하나만."

- [ ] **Step 1: stress-test.html 전체 교체**

love-test와 동일 골격. `renderResult`는 몬스터 공개 → "고블럽 소환" 버튼 → 고블럽 아트(goblub-art.js)가 등장해 몬스터 이모지를 씹어먹는 모션 → cure 문구로 전환 → ShareCard. goblub-art.js를 추가 로드한다.

핵심 스타일/모션(스타일 블록에 추가):
```css
.mon-stage { text-align:center; min-height:120px; margin:10px 0; }
.mon-emoji { font-size:4.5rem; display:inline-block; }
.mon-emoji.eaten { animation: mon-shrink .5s ease forwards; }
@keyframes mon-shrink { to { transform: scale(0); opacity:0; } }
.gob-muncher { display:inline-block; }
.gob-muncher.chew { animation: gob-chew .45s ease 3; }
@keyframes gob-chew { 30% { transform: scale(1.15) rotate(-5deg);} 65%{ transform: scale(1.1) rotate(5deg);} }
.cure-line { color: var(--mint-deep, #3f9b52); font-size:1.05rem; margin-top:8px; }
```

renderResult 코드:
```js
var MONS = {
  pokbal:{emoji:"🌋",name:"폭발몬",desc:"...",cure:"고블럽이 화를 냠— 이제 심호흡 세 번, 물 한 잔."},
  jamsu:{emoji:"🌊",name:"잠수몬",desc:"...",cure:"고블럽이 잠수를 냠— 한 사람에게만 '나 힘들어' 한마디."},
  nunmul:{emoji:"💧",name:"눈물몬",desc:"...",cure:"고블럽이 눈물을 냠— 실컷 울었으면 따뜻한 거 먹기."},
  meokbo:{emoji:"🍔",name:"먹보몬",desc:"...",cure:"고블럽이 폭식을 냠— 대신 좋아하는 노래 한 곡."},
  yemin:{emoji:"🌵",name:"예민몬",desc:"...",cure:"고블럽이 가시를 냠— 30분만 알림 끄고 혼자."},
  eoreum:{emoji:"🧊",name:"얼음몬",desc:"...",cure:"고블럽이 무기력을 냠— 딱 5분, 제일 작은 일 하나만."}
};
var MORDER = ["pokbal","jamsu","nunmul","meokbo","yemin","eoreum"];

function renderResult(totals, el, api){
  var key = Quiz.top(totals, MORDER), r = MONS[key];
  el.innerHTML =
    '<span class="result-emoji">'+r.emoji+'</span>'+
    '<p class="result-name">스트레스 받으면… '+r.name+' 변신!</p>'+
    '<p class="result-desc">'+r.desc+'</p>'+
    '<div class="mon-stage"><span class="mon-emoji" id="mon">'+r.emoji+'</span></div>'+
    '<div class="result-actions"><button class="btn-primary" id="summon">🌀 고블럽 소환 — 이 몬스터 먹어치우기</button></div>'+
    '<div id="after" style="display:none">'+
      '<p class="cure-line" id="cure"></p>'+
      '<div id="card-slot"></div>'+
      '<div class="result-actions">'+
      '<button class="btn-primary" id="qz-retry">다시하기</button>'+
      '<button class="btn-ghost" id="qz-share">링크 복사</button></div>'+
    '</div>';

  el.querySelector("#summon").onclick = function(){
    var btn=this; btn.disabled=true;
    var stage=el.querySelector(".mon-stage");
    var gob=document.createElement("span");
    gob.className="gob-muncher chew";
    gob.innerHTML = (window.GoblubArt ? GoblubArt.svg(74) : "👾");
    stage.insertBefore(gob, stage.firstChild);
    setTimeout(function(){ el.querySelector("#mon").classList.add("eaten"); }, 500);
    setTimeout(function(){
      gob.classList.remove("chew");
      el.querySelector("#cure").textContent = "🌟 "+r.cure;
      el.querySelector("#after").style.display="block";
      el.querySelector("#card-slot").appendChild(ShareCard.render({
        palette:"yellow", emoji:r.emoji, badge:"나의 스트레스 몬스터", title:r.name,
        lines:[r.desc, r.cure]
      }));
      el.querySelector("#qz-retry").onclick=api.restart;
      el.querySelector("#qz-share").onclick=function(){ api.shareLink(el.querySelector("#qz-share")); };
    }, 1400);
  };
}
```
로드 스크립트에 `<script src="js/goblub-art.js"></script>` 포함. `Quiz.init(... feedSrc:"stress", ...)`.

- [ ] **Step 2: QUESTIONS 10문항 + MONS desc 작성**

작성 규칙: love-test와 동일(10문항, 선택지 3~4개, +2주/+1부, 6몬스터 고르게 분산). 톤: 스트레스 상황 상황극. 예시 1문항:
```js
{ q:"팀플 조원이 또 잠수를 탔다. 마감은 내일. 지금 나는?", choices:[
  { text:"단톡방에 대문자로 '지금 어디임?!'", scores:{ pokbal:2 } },
  { text:"조용히 나 혼자 다 해버림", scores:{ eoreum:1, jamsu:2 } },
  { text:"화장실에서 몰래 눈물 찔끔", scores:{ nunmul:2 } },
  { text:"배달앱부터 켠다", scores:{ meokbo:2 } } ] }
```
각 `MONS[*].desc`는 팩폭 2~3문장.

- [ ] **Step 3: 브라우저 동작 검증(preview_eval)**

love-test와 동일하게 자동 클릭으로 결과 도달 후, 소환→먹기→cure 검증:
```js
(function(){
  document.getElementById("qz-start").click();
  var g=0; while(document.querySelector(".choice-btn")&&g++<20){document.querySelector(".choice-btn").click();}
  var reached=!!document.querySelector(".result-name");
  document.getElementById("summon").click();
  return { reachedResult:reached, hasSummon:true, gobInserted:!!document.querySelector(".gob-muncher svg") };
})()
```
Expected: `{reachedResult:true, hasSummon:true, gobInserted:true}`. 1.4초 뒤 별도 eval로 `#after` 표시·`#card-slot canvas` 존재 확인.

- [ ] **Step 4: 커밋**

```bash
git add play/stress-test.html
git commit -m "feat: 스트레스 몬스터 변신(stress-test) — 몬스터 6종·고블럽 먹기 모션·처방·짤"
```

---

## Task 5: 나의 무지개 좌표 (spectrum.html)

**Files:**
- Modify: `play/spectrum.html` (전체 교체)

설계: 이산 타입이 아니라 **연속 좌표**. 각 선택지가 `s`(0~n 방향 점수)만 누적하고, 문항 수로 정규화해 0~100 위치를 만든다. 결과는 스펙트럼 바 + 마커 + 대략 구간 기반 다정한 메시지. 저장/피드 없음. 짤은 opt-in.

- [ ] **Step 1: spectrum.html 전체 교체**

`renderResult`가 `totals.s`(누적 방향 점수)와 문항수로 위치 계산:
```js
var QN = 12; // 문항 수(아래 QUESTIONS와 일치)
// 각 문항 선택지 scores: { s: 0|1|2|3|4 } (한쪽 끝 0 ~ 반대 끝 4)
function spectrumPos(totals){
  var max = QN * 4;                 // 이론상 최대
  return Math.round((totals.s || 0) / max * 100); // 0~100
}
var ZONES = [ // 구간별 다정한 메시지(등급/우열 아님)
  { upTo:15, msg:"한쪽 색이 선명한 당신. 그 또렷함도 당신다움이에요." },
  { upTo:40, msg:"기울되 열려 있는 무지개. 지금의 좌표가 편안하면 그걸로 충분해요." },
  { upTo:60, msg:"한가운데를 유영하는 넓은 스펙트럼. 어디든 당신의 자리예요." },
  { upTo:85, msg:"반대편으로 기운 다정한 무지개. 오늘의 마음을 믿어봐요." },
  { upTo:100, msg:"또 다른 색이 선명한 당신. 그 선명함이 참 멋져요." }
];
function zoneMsg(pos){ for (var i=0;i<ZONES.length;i++) if (pos<=ZONES[i].upTo) return ZONES[i].msg; return ZONES[ZONES.length-1].msg; }

function renderResult(totals, el, api){
  var pos = spectrumPos(totals);
  el.innerHTML =
    '<span class="result-emoji">🌈</span>'+
    '<p class="result-name">나의 무지개 좌표</p>'+
    '<div class="spectrum-bar"><span class="spectrum-marker" style="left:'+pos+'%"></span></div>'+
    '<p class="result-desc">'+zoneMsg(pos)+'</p>'+
    '<div id="card-slot"></div>'+
    '<div class="result-actions">'+
    '<button class="btn-ghost" id="opt-card">🖼 오늘의 무지개 카드 만들기</button>'+
    '<button class="btn-primary" id="qz-retry">다시하기</button></div>'+
    '<p class="fine-print" style="margin-top:14px">이 테스트는 자기탐색용이며 진단이 아니에요. 결과는 저장되지 않습니다.</p>';
  el.querySelector("#qz-retry").onclick = api.restart;
  el.querySelector("#opt-card").onclick = function(){
    if (el.querySelector("#card-slot").childNodes.length) return;
    el.querySelector("#card-slot").appendChild(ShareCard.render({
      palette:"purple", emoji:"🌈", badge:"나의 무지개 좌표", title:"오늘의 무지개",
      lines:[zoneMsg(pos)]   // 수치/라벨은 카드에 크게 넣지 않음(아웃팅 방지)
    }));
  };
}
```
스타일(스펙트럼 바 = 무지개 그라디언트):
```css
.spectrum-bar { position:relative; height:20px; border-radius:999px; margin:22px 8px 14px;
  background:linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#b983ff); }
.spectrum-marker { position:absolute; top:50%; width:26px; height:26px; margin-left:-13px;
  transform:translateY(-50%); border-radius:50%; background:#fff; border:3px solid #38352f; box-shadow:0 2px 6px rgba(0,0,0,.2); }
```
- `feedSrc` **미지정**(먹이 제외). localStorage 사용 금지.

- [ ] **Step 2: QUESTIONS 12문항 작성(부드러운 톤)**

규칙: 12문항, 각 선택지 `scores:{ s: 0~4 }`. 각 문항은 한쪽 끝(0)~반대 끝(4)로 자연스럽게 퍼지는 4지선다 권장. 상황극이되 조롱·특정 지향 단정 없이 부드럽게. 예시 1문항:
```js
{ q:"영화 속 로맨스, 나도 모르게 몰입되는 커플은?", choices:[
  { text:"A와 B", scores:{ s:0 } },
  { text:"어느 쪽이든 케미가 좋으면", scores:{ s:2 } },
  { text:"C와 D", scores:{ s:4 } },
  { text:"솔직히 로맨스보다 스토리", scores:{ s:2 } } ] }
```
`QN`을 문항 수(12)와 반드시 일치시킬 것.

- [ ] **Step 3: 브라우저 동작 검증 + 프라이버시 검증(preview_eval)**

```js
(function(){
  var before = Object.keys(localStorage).length;
  document.getElementById("qz-start").click();
  var g=0; while(document.querySelector(".choice-btn")&&g++<25){ document.querySelector(".choice-btn").click(); }
  var marker=document.querySelector(".spectrum-marker");
  var after = Object.keys(localStorage).length;
  return { reached:!!marker, markerLeft: marker&&marker.style.left,
    noNewStorage: after===before, noAutoCard: !document.querySelector("#card-slot canvas") };
})()
```
Expected: `{reached:true, markerLeft:"...%", noNewStorage:true, noAutoCard:true}`.
그 뒤 `document.getElementById("opt-card").click()` → `#card-slot canvas` 생성 확인.

- [ ] **Step 4: 커밋**

```bash
git add play/spectrum.html
git commit -m "feat: 나의 무지개 좌표(spectrum) — 연속 스펙트럼 바·다정한 메시지·프라이버시(저장X·먹이제외·짤 opt-in)"
```

---

## Task 6: 테스트 허브 타일 + feed 라벨

**Files:**
- Modify: `play/tests.html:27-41` (love/stress/spectrum 타일 3개)
- Modify: `play/js/feed.js` (SOURCES love/stress 라벨)

- [ ] **Step 1: tests.html 타일 3개 교체**

`play/tests.html`에서 love-test/stress-test/spectrum 타일을 아래로 교체(MBTI 타일은 유지):
```html
      <a class="card tint-coral" href="love-test.html">
        <span class="icon">💘</span>
        <h2>내 안의 연애세포 회의</h2>
        <p>밀당·직진·집착·모솔… 내 안의 연애세포들이 회의를 연다</p>
      </a>
      <a class="card tint-yellow" href="stress-test.html">
        <span class="icon">🌋</span>
        <h2>스트레스 몬스터 변신</h2>
        <p>스트레스 받으면 튀어나오는 내 몬스터 — 고블럽이 냠 먹어드림</p>
      </a>
      <a class="card tint-purple" href="spectrum.html">
        <span class="icon">🌈</span>
        <h2>나의 무지개 좌표</h2>
        <p>조용히 나를 비추는 거울 — 끌림의 스펙트럼 자기탐색</p>
      </a>
```

- [ ] **Step 2: feed.js SOURCES 라벨 갱신**

`play/js/feed.js`의 SOURCES에서:
```js
    love: { label: "💘 연애세포 회의", url: "love-test.html" },
    stress: { label: "🌋 스트레스 몬스터", url: "stress-test.html" },
```
(spectrum 항목은 SOURCES에 추가하지 않음 — 프라이버시 유지.)

- [ ] **Step 3: 문법 검사 + 브라우저 확인**

Run: `node --check play/js/feed.js`
Expected: 출력 없음.
프리뷰에서 `tests.html` 로드 후:
```js
[].map.call(document.querySelectorAll(".card h2"), function(h){return h.textContent;})
```
Expected: 배열에 "내 안의 연애세포 회의","스트레스 몬스터 변신","나의 무지개 좌표" 포함.

- [ ] **Step 4: 커밋**

```bash
git add play/tests.html play/js/feed.js
git commit -m "feat: 테스트 허브 타일·먹이 라벨 새 컨셉으로 갱신"
```

---

## Task 7: 통합 검증 + 배포

**Files:** 없음(검증·배포)

- [ ] **Step 1: 3종 전체 플로우 + 모바일 375px 검증**

프리뷰에서 love-test/stress-test/spectrum 각각 시작→끝→결과·짤·(스트레스)먹기 모션 통과 확인. `preview_resize` 375px에서 가로 스크롤(overflow) 없음, `preview_console_logs` 에러 0.

- [ ] **Step 2: 먹이 연동 확인**

love-test/stress-test 결과 도달 시 `goblub_pet.pending` 증가(하루 1회) 확인. spectrum은 증가 없음 확인:
```js
(function(){ var p=JSON.parse(localStorage.getItem("goblub_pet")||"{}"); return p; })()
```

- [ ] **Step 3: 배포 + 라이브 확인**

```bash
git push
```
GitHub Pages + Vercel 자동 배포. 라이브(goblub.vercel.app)에서 tests.html 타일 3개 진입·플로우 정상 확인.

- [ ] **Step 4: 메모리 갱신**

`C:\Users\Hi\.claude\projects\C--Users-Hi\memory\goblub-site-project.md`의 콘텐츠 항목에서 love/stress/spectrum 설명을 새 컨셉(연애세포 회의·스트레스 몬스터·무지개 좌표)과 sharecard.js·quiz.js 일반화 사실로 갱신.

---

## Self-Review (작성자 체크)

- **스펙 커버리지:** 엔진 일반화(T1) · sharecard(T2) · 연애세포(T3) · 스트레스 몬스터+고블럽 먹기(T4) · 무지개 좌표+프라이버시(T5) · 허브/피드(T6) · 통합/배포(T7). 스펙의 모든 항목 대응됨.
- **타입/명칭 일관성:** `Quiz.init(el,config)`·`config.renderResult(totals,el,api)`·`api.restart/shareLink`·`Quiz.top(totals,order)`·`ShareCard.render(spec)` 전 태스크 동일. feedSrc는 love/stress만, spectrum 미지정.
- **플레이스홀더:** 코드·데이터 구조·검증은 완전. 단, 각 테스트의 질문 10~12개와 desc 문구는 T3/T4/T5 Step 2에서 "명시된 형식·분산 규칙 + 샘플"에 따라 저작(창작 콘텐츠 특성상 실행 단계 저작). 형식/스코어링/개수/톤은 못박음.
- **프라이버시:** spectrum 저장·피드·자동짤 금지, 검증 스텝(T5 Step 3)에 localStorage 불변·자동카드 없음 assert 포함.
