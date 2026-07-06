# 마음 배달 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. 스펙: `docs/superpowers/specs/2026-07-06-letter-delivery-design.md`. 검증은 Claude Preview(정적 서버 http.server 8777) + preview_eval.

**Goal:** 고백·사과를 링크로 보내고 받은 사람이 답(메뉴·날짜·시간)을 정해 이미지/되답 링크로 돌려주는 단일 페이지 `play/letter.html` 제작·연동·배포.

**Architecture:** 백엔드 없음. 상태는 URL 해시(`#d=`, `#r=`)에 base64url(JSON)로 인코딩. 한 파일이 만들기/플레이/결과 3상태로 분기. 결과 카드는 Canvas PNG. 도망 버튼은 원전 glideFrom 로직 이식.

**Tech Stack:** Vanilla JS, 기존 goblub 정적 구조(common.js, css/style.css, feed.js). 원전 참고: `C:\Users\Hi\Desktop\finish\date.mouse\{고백,사과}\index.html`.

**주의:** 원전의 텔레그램 토큰·CHAT_ID·"Taeho's Room"·"담배 한 대" 등 개인 설정은 절대 이식하지 않는다.

---

### Task 1: letter.html 골격 + 인코딩 + 상태 분기

**Files:** Create: `play/letter.html`

- [ ] **Step 1: 페이지 골격 작성** — 기존 페이지와 동일한 head(Jua, ../css/style.css, viewport), 공용 헤더/푸터, hero + 3개 상태 컨테이너(빈 채로):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>마음 배달 — goblub</title>
  <meta name="description" content="고백·사과를 링크로 보내고, 답장은 이미지로 받는 마음 배달" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
  <style>
    /* Task 3~5에서 채움 */
    .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .type-tile { background: var(--cream); border: 2px solid transparent; border-radius: 16px;
      padding: 20px 10px; text-align: center; cursor: pointer; font-family: inherit; font-size: 1.05rem; color: var(--ink); }
    .type-tile .em { font-size: 2.4rem; display: block; margin-bottom: 6px; }
    .type-tile.sel { border-color: var(--coral); background: #ffe3e3; }
    .txt-input { width: 100%; font-family: inherit; font-size: 1rem; padding: 12px;
      border: 2px solid #e8e2d4; border-radius: 12px; color: var(--ink); margin-bottom: 12px; }
    .link-box { word-break: break-all; background: var(--cream); border-radius: 12px; padding: 12px;
      font-size: 0.85rem; color: var(--ink-soft); margin: 12px 0; display: none; }
    .type-line { font-family: "Malgun Gothic", monospace; color: var(--ink-soft); line-height: 1.9; white-space: pre-wrap; min-height: 6.5em; }
    .ask { font-size: clamp(20px,5vw,26px); color: var(--ink); font-weight: 700; margin: 14px 0; opacity: 0; transition: opacity .4s; }
    .ask.show { opacity: 1; }
    .yn { position: relative; height: 72px; display: flex; align-items: center; justify-content: center; gap: 16px; opacity: 0; transition: opacity .4s; }
    .yn.show { opacity: 1; }
    #no { position: relative; transition: left .22s cubic-bezier(.22,.61,.36,1), top .22s cubic-bezier(.22,.61,.36,1); }
    .choice-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .choice { background: var(--cream); border: 2px solid transparent; border-radius: 14px; padding: 16px 8px;
      cursor: pointer; font-family: inherit; font-size: 0.98rem; color: var(--ink); display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .choice .em { font-size: 1.8rem; }
    .choice:hover { border-color: var(--sky); }
    .cal-head, .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; }
    .cal-head span { text-align: center; font-size: 0.8rem; color: var(--ink-soft); padding: 4px 0; }
    .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .cal-nav button { background: var(--cream); border: none; border-radius: 8px; padding: 6px 12px; font-family: inherit; cursor: pointer; }
    .cal-grid .day { aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center;
      background: var(--cream); border: 2px solid transparent; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; }
    .cal-grid .day.blank { background: transparent; cursor: default; }
    .cal-grid .day.past { color: #ccc; cursor: not-allowed; background: #f3f0e8; }
    .cal-grid .day:not(.blank):not(.past):hover { border-color: var(--mint); }
    .cal-grid .day.sel { background: var(--mint); color: #fff; font-weight: 700; }
    .time-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 8px; }
    .time-grid .slot { background: var(--cream); border: 2px solid transparent; border-radius: 10px; padding: 10px 0; text-align: center; cursor: pointer; font-family: inherit; }
    .time-grid .slot:hover { border-color: var(--mint); }
    .time-grid .slot.sel { background: var(--mint); color: #fff; font-weight: 700; }
    .step-q { font-size: 1.1rem; color: var(--ink); font-weight: 700; margin: 8px 0 14px; }
    .step-q.mt { margin-top: 22px; }
    .heart { position: fixed; top: -40px; font-size: 26px; pointer-events: none; animation: fall linear forwards; z-index: 50; }
    @keyframes fall { to { transform: translateY(110vh) rotate(360deg); opacity: .2; } }
    .out-card { background: var(--cream); border-radius: 14px; padding: 18px; line-height: 2; margin: 12px 0; }
  </style>
</head>
<body>
  <div id="site-header"></div>
  <main>
    <section class="hero">
      <h1>💌 마음 배달</h1>
      <p id="hero-sub">고백·사과를 링크로 보내고, 답장은 이미지로 받아요</p>
    </section>

    <section class="panel" id="make-panel" style="display:none"></section>
    <section class="panel" id="play-panel" style="display:none"></section>
    <section class="panel" id="result-panel" style="display:none"></section>

    <p class="fine-print">재미로 즐겨주세요 🙂</p>
  </main>
  <div id="site-footer"></div>
  <script src="../js/common.js" data-root=".."></script>
  <script src="js/feed.js"></script>
  <script>
    (function () {
      var $ = function (id) { return document.getElementById(id); };

      // ---- base64url(JSON) 인코딩 ----
      function enc(obj) {
        return btoa(encodeURIComponent(JSON.stringify(obj)))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      function dec(s) {
        try {
          var b = s.replace(/-/g, "+").replace(/_/g, "/");
          return JSON.parse(decodeURIComponent(atob(b)));
        } catch (e) { return null; }
      }
      function parseHash() {
        var h = (location.hash || "").replace(/^#/, "");
        var out = { d: null, r: null };
        h.split("&").forEach(function (kv) {
          var i = kv.indexOf("=");
          if (i < 0) return;
          var k = kv.slice(0, i), v = kv.slice(i + 1);
          if (k === "d") out.d = dec(v);
          if (k === "r") out.r = dec(v);
        });
        return out;
      }

      // 타입 상수/문구
      var TYPES = {
        date: { emoji: "💚", label: "데이트 신청", q: "나랑 데이트 갈래?",
          yes: "응! 좋아 💚", no: "싫어", success: "데이트 성사! 🎉", steps: ["menu", "date", "time"] },
        apology: { emoji: "🍎", label: "사과하기", q: "내 사과 받아줄래?",
          yes: "사과 받을게 🍎", no: "안 받아", success: "사과 수락! 🍎", steps: ["date", "time"] }
      };
      var MENUS = [["🍚","한식"],["🥢","중식"],["🍣","일식"],["🍝","양식"],["🍜","분식"],["☕","카페"]];
      var TIMES = ["11:00","12:00","13:00","14:00","17:00","18:00","19:00","20:00"];

      window.LETTER = { enc: enc, dec: dec, parseHash: parseHash, TYPES: TYPES, MENUS: MENUS, TIMES: TIMES, $: $ };

      // 상태 분기 (Task 2에서 각 렌더러 연결)
      var st = parseHash();
      if (st.d && st.r) window.__route = "result";
      else if (st.d) window.__route = "play";
      else window.__route = "make";
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: 로컬 서버 실행 후 로드** — `python -m http.server 8777` (또는 preview_start), `http://localhost:8777/play/letter.html` 접속.
- [ ] **Step 3: 인코딩 왕복 검증** (preview_eval):

```js
(function(){ var o={t:"date",n:"수민",m:"보고싶어"}; var e=LETTER.enc(o); var d=LETTER.dec(e);
  return JSON.stringify({ e:e, roundtrip: JSON.stringify(d)===JSON.stringify(o),
    urlSafe: /^[A-Za-z0-9_-]+$/.test(e), route: window.__route }); })()
```

Expected: `roundtrip:true, urlSafe:true, route:"make"`

- [ ] **Step 4: 커밋** — `feat: 마음 배달 골격 + base64url 인코딩 + 상태 분기`

---

### Task 2: 만들기 모드

**Files:** Modify: `play/letter.html` (스크립트 IIFE 내 상태 분기 아래에 렌더러 추가)

- [ ] **Step 1: 만들기 렌더러 작성** — 상태 분기 코드를 아래로 교체하고 `renderMake` 추가:

```js
      function show(which) {
        $("make-panel").style.display = which === "make" ? "block" : "none";
        $("play-panel").style.display = which === "play" ? "block" : "none";
        $("result-panel").style.display = which === "result" ? "block" : "none";
      }

      function renderMake() {
        var p = $("make-panel");
        p.innerHTML =
          '<h2>누구에게, 어떤 마음을 보낼까요?</h2>' +
          '<div class="type-grid" id="type-grid"></div>' +
          '<input class="txt-input" id="in-name" maxlength="20" placeholder="받는 사람 이름 (필수)" />' +
          '<input class="txt-input" id="in-msg" maxlength="60" placeholder="한 줄 메시지 (선택 — 비워도 돼요)" />' +
          '<button class="btn-primary" id="btn-make">🔗 공유 링크 만들기</button>' +
          '<p class="error-msg" id="mk-err"></p>' +
          '<div class="link-box" id="link-box"></div>' +
          '<div class="result-actions" id="mk-actions" style="display:none">' +
          '<button class="btn-ghost" id="btn-preview">👀 미리보기</button></div>';
        var tg = $("type-grid");
        var chosen = "date";
        Object.keys(TYPES).forEach(function (k) {
          var t = TYPES[k];
          var b = document.createElement("button");
          b.className = "type-tile" + (k === chosen ? " sel" : "");
          b.innerHTML = '<span class="em">' + t.emoji + "</span>" + t.label;
          b.onclick = function () {
            chosen = k;
            tg.querySelectorAll(".type-tile").forEach(function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
          };
          tg.appendChild(b);
        });
        var madeUrl = "";
        $("btn-make").onclick = function () {
          var name = $("in-name").value.trim();
          var msg = $("in-msg").value.trim();
          var err = $("mk-err");
          if (!name) { err.textContent = "받는 사람 이름을 적어주세요!"; err.style.display = "block"; return; }
          err.style.display = "none";
          var d = { t: chosen, n: name.slice(0, 20) };
          if (msg) d.m = msg.slice(0, 60);
          madeUrl = location.origin + location.pathname + "#d=" + enc(d);
          var lb = $("link-box");
          lb.textContent = madeUrl;
          lb.style.display = "block";
          $("mk-actions").style.display = "flex";
          var btn = $("btn-make");
          (navigator.clipboard ? navigator.clipboard.writeText(madeUrl) : Promise.reject())
            .then(function () { btn.textContent = "✅ 링크 복사됨! 상대에게 보내세요"; })
            .catch(function () { btn.textContent = "아래 링크를 복사해 보내세요"; });
        };
        $("btn-preview").onclick = function () { if (madeUrl) window.open(madeUrl, "_blank"); };
        show("make");
      }
```

- [ ] **Step 2: 라우팅에서 renderMake 호출** — Task1 하단 라우팅 블록을 아래로 교체(플레이/결과는 다음 태스크에서 채움. 임시로 make만):

```js
      var st = parseHash();
      var route = (st.d && st.r) ? "result" : (st.d ? "play" : "make");
      if (route === "make") renderMake();
      // play/result는 Task 3~4에서 연결
      window.__st = st; window.__route = route;
```

- [ ] **Step 3: 검증** (preview_eval): 이름 없이 생성 차단 + 이름 넣으면 링크에 `#d=` 포함:

```js
(function(){ var $=LETTER.$;
  $('btn-make').click(); var blocked = $('mk-err').style.display==='block';
  $('in-name').value='수민'; $('in-msg').value='보고싶어'; $('btn-make').click();
  var url=$('link-box').textContent;
  var d=LETTER.dec(url.split('#d=')[1]);
  return JSON.stringify({ blockedWithoutName: blocked, hasD: url.indexOf('#d=')>-1, decoded: d }); })()
```

Expected: `blockedWithoutName:true, hasD:true, decoded:{t:"date",n:"수민",m:"보고싶어"}`

- [ ] **Step 4: 커밋** — `feat: 마음 배달 만들기 모드(유형·이름·메시지→공유 링크)`

---

### Task 3: 플레이 모드 (타이핑 인트로 + 도망 버튼 + 단계)

**Files:** Modify: `play/letter.html`

- [ ] **Step 1: 플레이 렌더러 작성** — IIFE 내에 추가. 타이핑 인트로 → 질문/버튼 → 단계 진행. `choice`에 답 누적:

```js
      var choice = { menu: null, day: null, time: null };
      var playData = null;

      function renderPlay(d) {
        playData = d;
        var t = TYPES[d.t] || TYPES.date;
        var p = $("play-panel");
        p.innerHTML =
          '<div class="type-line" id="tl"></div>' +
          '<div class="ask" id="ask"></div>' +
          '<div class="yn" id="yn"><button class="btn-primary" id="yes"></button>' +
          '<button class="btn-ghost" id="no"></button></div>' +
          '<div id="steps"></div>';
        show("play");
        $("yes").textContent = t.yes;
        $("no").textContent = t.no;

        var lines = [
          "👾 고블럽이 " + t.label + " 편지를 배달하는 중",
          "📦 포장을 뜯는 중...",
          (d.m ? "💬 \"" + d.m + "\"" : "✨ 마음을 담는 중..."),
          "💌 " + d.n + "님에게 도착!"
        ];
        var tl = $("tl"), i = 0;
        (function typeLine() {
          if (i >= lines.length) {
            $("ask").textContent = t.q;
            $("ask").classList.add("show");
            $("yn").classList.add("show");
            setTimeout(placeNo, 60);
            return;
          }
          tl.textContent += (i ? "\n" : "") + lines[i];
          i++;
          setTimeout(typeLine, 520);
        })();

        $("yes").onclick = function () {
          $("ask").style.display = "none";
          $("yn").style.display = "none";
          runSteps(t);
        };
        setupRunaway();
      }
```

- [ ] **Step 2: 도망 버튼 로직(glideFrom) 이식** — 원전 로직을 goblub 버전으로:

```js
      function setupRunaway() {
        var no = $("no"), yes = $("yes"), yn = $("yn");
        var TRIGGER = 140, SAFE = 120, fixed = false;
        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
        function ensureFixed() {
          if (fixed) return;
          var nr = no.getBoundingClientRect();
          no.style.position = "fixed"; no.style.margin = "0"; no.style.zIndex = "60";
          no.style.left = nr.left + "px"; no.style.top = nr.top + "px";
          fixed = true;
        }
        window.__placeNo = function () { /* 초기엔 흐름 배치 유지 */ };
        function glide(px, py) {
          if (no.style.display === "none" || !yn.classList.contains("show")) return;
          var nb = no.getBoundingClientRect();
          var cx = nb.left + nb.width / 2, cy = nb.top + nb.height / 2;
          var dx = cx - px, dy = cy - py, dist = Math.hypot(dx, dy);
          if (dist > TRIGGER) return;
          ensureFixed();
          if (dist < 0.001) { dx = 1; dy = 0; dist = 1; }
          var m = 12, maxL = window.innerWidth - nb.width - m, maxT = window.innerHeight - nb.height - m;
          var ux = dx / dist, uy = dy / dist;
          var left = px + ux * SAFE - nb.width / 2, top = py + uy * SAFE - nb.height / 2;
          var cl = clamp(left, m, maxL), ct = clamp(top, m, maxT);
          if (cl !== left || ct !== top) {
            var tcx = window.innerWidth / 2 - px, tcy = window.innerHeight / 2 - py;
            var tl2 = Math.hypot(tcx, tcy) || 1;
            left = px + (tcx / tl2) * SAFE - nb.width / 2; top = py + (tcy / tl2) * SAFE - nb.height / 2;
            cl = clamp(left, m, maxL); ct = clamp(top, m, maxT);
          }
          no.style.left = cl + "px"; no.style.top = ct + "px";
        }
        document.addEventListener("mousemove", function (e) { glide(e.clientX, e.clientY); });
        no.addEventListener("mouseover", function (e) { glide(e.clientX, e.clientY); });
        no.addEventListener("click", function (e) { e.preventDefault(); glide(e.clientX, e.clientY); });
        no.addEventListener("touchstart", function (e) { e.preventDefault(); var tt = e.touches[0]; glide(tt.clientX, tt.clientY); }, { passive: false });
        no.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { e.preventDefault(); glide(e.clientX, e.clientY); } });
      }
      function placeNo() { /* 흐름 배치라 초기 배치 불필요 */ }
```

- [ ] **Step 3: 단계 진행(메뉴·달력·시간) 작성**:

```js
      function runSteps(t) {
        var steps = t.steps.slice();
        var box = $("steps");
        function nextStep() {
          if (!steps.length) { finishPlay(t); return; }
          var s = steps.shift();
          if (s === "menu") stepMenu(nextStep);
          else if (s === "date") stepDate(nextStep);
          else if (s === "time") stepTime(nextStep);
        }
        function stepMenu(done) {
          box.innerHTML = '<div class="step-q">🍴 뭐 먹으러 갈까?</div><div class="choice-grid" id="mg"></div>';
          MENUS.forEach(function (m) {
            var b = document.createElement("button");
            b.className = "choice"; b.innerHTML = '<span class="em">' + m[0] + "</span>" + m[1];
            b.onclick = function () { choice.menu = m[0] + " " + m[1]; done(); };
            $("mg").appendChild(b);
          });
        }
        function stepDate(done) {
          box.innerHTML =
            '<div class="step-q">📅 언제 만날까?</div>' +
            '<div class="cal-nav"><button id="cal-prev">◀</button><span id="cal-title"></span><button id="cal-next">▶</button></div>' +
            '<div class="cal-head"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>' +
            '<div class="cal-grid" id="cg"></div>';
          var now = new Date();
          var view = { y: now.getFullYear(), m: now.getMonth() };
          var minY = now.getFullYear(), minM = now.getMonth();
          function draw() {
            $("cal-title").textContent = view.y + "년 " + (view.m + 1) + "월";
            $("cal-prev").disabled = (view.y === minY && view.m === minM);
            $("cal-prev").style.opacity = $("cal-prev").disabled ? ".3" : "1";
            var g = $("cg"); g.innerHTML = "";
            var first = new Date(view.y, view.m, 1).getDay();
            var dim = new Date(view.y, view.m + 1, 0).getDate();
            var todayD = (view.y === now.getFullYear() && view.m === now.getMonth()) ? now.getDate() : 0;
            for (var b = 0; b < first; b++) { var e = document.createElement("div"); e.className = "day blank"; g.appendChild(e); }
            for (var dd = 1; dd <= dim; dd++) {
              (function (dd) {
                var el = document.createElement("div"); el.className = "day"; el.textContent = dd;
                if (todayD && dd < todayD) el.classList.add("past");
                else el.onclick = function () {
                  g.querySelectorAll(".day.sel").forEach(function (x) { x.classList.remove("sel"); });
                  el.classList.add("sel");
                  choice.day = view.y + "-" + ("0" + (view.m + 1)).slice(-2) + "-" + ("0" + dd).slice(-2);
                  setTimeout(done, 250);
                };
                g.appendChild(el);
              })(dd);
            }
          }
          $("cal-prev").onclick = function () { if (view.y === minY && view.m === minM) return; view.m--; if (view.m < 0) { view.m = 11; view.y--; } draw(); };
          $("cal-next").onclick = function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } draw(); };
          draw();
        }
        function stepTime(done) {
          box.innerHTML = '<div class="step-q">⏰ 몇 시에 볼까?</div><div class="time-grid" id="tg2"></div>';
          TIMES.forEach(function (tm) {
            var b = document.createElement("div"); b.className = "slot"; b.textContent = tm;
            b.onclick = function () { choice.time = tm; done(); };
            $("tg2").appendChild(b);
          });
        }
        nextStep();
      }
```

- [ ] **Step 4: 라우팅에 play 연결** — Task2 라우팅 블록에 추가:

```js
      if (route === "make") renderMake();
      else if (route === "play") renderPlay(st.d);
```

- [ ] **Step 5: 검증** (preview_eval, 플레이 링크로 이동 후):

date 링크 만들어 이동:
```js
(function(){ location.href = location.pathname + '#d=' + LETTER.enc({t:"date",n:"수민",m:"hi"}); return 'nav'; })()
```
그 다음(타이핑 대기 후):
```js
(function(){ var $=LETTER.$; $('yes').click();
  var hasMenu=!!document.getElementById('mg'); document.querySelectorAll('#mg .choice')[0].click();
  var hasCal=!!document.getElementById('cg'); document.querySelectorAll('#cg .day:not(.blank):not(.past)')[0].click();
  return JSON.stringify({ menuShown:hasMenu, calShown:hasCal }); })()
```
Expected: `menuShown:true, calShown:true`. 도망 버튼: `$('no')` 좌표가 mousemove 근접 시 바뀌는지 별도 확인.

- [ ] **Step 6: 커밋** — `feat: 마음 배달 플레이 모드(타이핑·도망버튼·메뉴·동적달력·시간)`

---

### Task 4: 결과 모드 + 이미지 저장 + 되답 링크

**Files:** Modify: `play/letter.html`

- [ ] **Step 1: finishPlay + 결과 렌더 작성**:

```js
      function finishPlay(t) {
        $("steps").innerHTML = "";
        var r = { day: choice.day, time: choice.time };
        if (choice.menu) r.menu = choice.menu;
        renderResult(playData, r, true);
      }

      function weekday(ymd) {
        var p = ymd.split("-");
        return ["일","월","화","수","목","금","토"][new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
      }

      function renderResult(d, r, doRain) {
        var t = TYPES[d.t] || TYPES.date;
        var wd = r.day ? weekday(r.day) : "";
        var p = $("result-panel");
        p.innerHTML =
          '<div style="text-align:center"><span class="result-emoji">' + t.emoji + '</span>' +
          '<p class="result-name">' + t.success + '</p></div>' +
          '<div class="out-card" id="out"></div>' +
          '<div class="result-actions">' +
          '<button class="btn-primary" id="btn-img">🖼 이미지 저장</button>' +
          '<button class="btn-ghost" id="btn-reply">🔗 되답 링크 복사</button>' +
          '<a class="btn-ghost" href="../index.html">🎡 다른 즐길거리</a></div>';
        $("out").innerHTML =
          '💌 To. <b>' + d.n + '</b><br>' +
          (r.menu ? '🍴 메뉴: ' + r.menu + '<br>' : '') +
          '📅 날짜: ' + r.day + ' (' + wd + ')<br>' +
          '⏰ 시간: ' + r.time +
          (d.m ? '<br>💬 "' + d.m + '"' : '');
        show("result");
        if (doRain) rain(d.t);
        if (window.GoblubFeed) GoblubFeed.grant("letter");

        $("btn-reply").onclick = function () {
          var url = location.origin + location.pathname + "#d=" + enc(d) + "&r=" + enc(r);
          var b = $("btn-reply");
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
            .then(function () { b.textContent = "복사됨! 보낸 사람에게 전하세요"; })
            .catch(function () { prompt("이 링크를 보내세요:", url); });
        };
        $("btn-img").onclick = function () { saveImage(d, r, wd); };
      }

      function rain(type) {
        var em = type === "apology" ? ["🍎","🍏","🤝","💚","✨"] : ["💚","💖","💗","✨","🎉"];
        var n = 0, iv = setInterval(function () {
          var h = document.createElement("div"); h.className = "heart";
          h.textContent = em[Math.floor(Math.random() * em.length)];
          h.style.left = Math.random() * 100 + "vw";
          h.style.fontSize = (18 + Math.random() * 20) + "px";
          h.style.animationDuration = (2.4 + Math.random() * 2) + "s";
          document.body.appendChild(h);
          setTimeout(function () { h.remove(); }, 4600);
          if (++n > 50) clearInterval(iv);
        }, 130);
      }
```

- [ ] **Step 2: Canvas 이미지 저장 작성**:

```js
      function saveImage(d, r, wd) {
        var t = TYPES[d.t] || TYPES.date;
        var c = document.createElement("canvas"); c.width = 720; c.height = 900;
        var g = c.getContext("2d");
        g.fillStyle = "#fff9ec"; g.fillRect(0, 0, 720, 900);
        var cols = ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#b983ff"];
        for (var i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.fillRect(i * 144, 0, 144, 16); }
        g.textAlign = "center"; g.fillStyle = "#38352f";
        g.font = "150px 'Segoe UI Emoji', sans-serif"; g.fillText(t.emoji, 360, 260);
        g.font = "52px 'Jua', 'Malgun Gothic', sans-serif"; g.fillText(t.success, 360, 360);
        g.font = "34px 'Jua', 'Malgun Gothic', sans-serif";
        g.fillText("To. " + d.n, 360, 440);
        g.fillStyle = "#7a766d"; g.font = "30px 'Jua', 'Malgun Gothic', sans-serif";
        var y = 520;
        if (r.menu) { g.fillText("🍴 " + r.menu, 360, y); y += 52; }
        g.fillText("📅 " + r.day + " (" + wd + ")", 360, y); y += 52;
        g.fillText("⏰ " + r.time, 360, y); y += 52;
        if (d.m) { g.fillStyle = "#b06a5a"; g.fillText("“" + d.m + "”", 360, y + 6); }
        g.fillStyle = "#38352f"; g.font = "26px 'Jua', 'Malgun Gothic', sans-serif";
        g.fillText("💌 goblub.vercel.app", 360, 850);
        c.toBlob(function (blob) {
          if (!blob) { window.open(c.toDataURL("image/png")); return; }
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "goblub-letter-" + d.t + ".png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        }, "image/png");
      }
```

- [ ] **Step 3: 라우팅에 result 연결**:

```js
      if (route === "make") renderMake();
      else if (route === "play") renderPlay(st.d);
      else renderResult(st.d, st.r, false);
```

- [ ] **Step 4: 검증** (preview_eval): 되답 링크로 접속 시 결과 직행 + Canvas 생성:

```js
(function(){ location.href = location.pathname + '#d=' + LETTER.enc({t:"date",n:"수민",m:"hi"}) + '&r=' + LETTER.enc({menu:"🍚 한식",day:"2026-07-10",time:"18:00"}); return 'nav'; })()
```
그 다음:
```js
(function(){ var $=LETTER.$;
  var shown = $('result-panel').style.display==='block';
  var out = $('out').textContent.replace(/\s+/g,' ');
  return new Promise(function(res){
    var c=document.createElement('canvas'); c.width=720;c.height=900; var g=c.getContext('2d');
    g.fillStyle='#fff9ec'; g.fillRect(0,0,720,900);
    c.toBlob(function(b){ res(JSON.stringify({ resultShown:shown, out:out.slice(0,50), canvasOK:!!b })); },'image/png');
  }); })()
```
Expected: `resultShown:true`, out에 메뉴·날짜·시간 포함, `canvasOK:true`

- [ ] **Step 5: 커밋** — `feat: 마음 배달 결과 모드(요약·이미지 저장·되답 링크)`

---

### Task 5: feed.js·메인 카드 연동 + 모바일 검증 + 배포

**Files:** Modify: `play/js/feed.js`, `index.html`

- [ ] **Step 1: feed.js SOURCES에 letter 추가** — `tarot` 줄 아래에:

```js
    letter: { label: "💌 마음 배달", url: "letter.html" },
```

- [ ] **Step 2: index.html 메인에 카드 추가** — `apps.html` 카드 바로 앞에:

```html
      <a class="card tint-coral" href="play/letter.html">
        <span class="icon">💌</span>
        <h2>마음 배달</h2>
        <p>고백·사과를 링크로 보내고, 답장은 이미지로 받기</p>
      </a>
```

- [ ] **Step 3: 모바일 375px 검증** — index(카드 7개, 가로 스크롤 없음), letter 만들기/플레이/결과 각 상태 가로 스크롤 없음, 도망 버튼이 뷰포트(375×812) 밖으로 안 나가는지(fixed left/top이 12~maxL 범위):

```js
(function(){ return JSON.stringify({ page:location.pathname,
  ov: document.documentElement.scrollWidth>document.documentElement.clientWidth }); })()
```

- [ ] **Step 4: 커밋 + 푸시** — `feat: 마음 배달 메인 카드 + 고블럽 먹이 연동`, `git push`
- [ ] **Step 5: 실사이트 확인** — 1~2분 후 `https://goblub.vercel.app/play/letter.html` 200, 만들기 화면 표시. 메인 카드 7개.
