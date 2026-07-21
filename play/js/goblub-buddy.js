// 고블럽 마스코트 — 화면을 둥둥 떠다니다 가끔 쓱 이동, 클릭하면 말풍선 리액션.
// common.js가 모든 페이지에서 로드. GoblubArt(goblub-art.js) 필요.
// 상태: localStorage "goblub_buddy" = "on"(기본) | "min"(최소화)
(function () {
  if (window.__goblubBuddy) return;
  window.__goblubBuddy = true;
  if (!window.GoblubArt || !document.body) return;

  var KEY = "goblub_buddy";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SIZE = window.innerWidth < 520 ? 54 : 74;
  var base = (function () {
    var b = (document.currentScript && document.currentScript.src) || "";
    if (!b) { var ss = document.getElementsByTagName("script"); for (var i = 0; i < ss.length; i++) if (ss[i].src && /\/play\/js\/goblub-/.test(ss[i].src)) { b = ss[i].src; break; } }
    return b.replace(/[^/]+$/, "");
  })();

  function openTama() {
    if (window.GoblubTama) { GoblubTama.open(); return; }
    var sc = document.createElement("script"); sc.src = base + "goblub-tama.js?v=2";
    sc.onload = function () { if (window.GoblubTama) GoblubTama.open(); };
    document.head.appendChild(sc);
  }

  var LINES = [
    "냠냠, 나쁜 기분 없어?", "오늘도 잘 놀다 가!", "심심하면 날 눌러줘~",
    "안 좋은 일은 나한테 던져!", "우걱우걱… 스트레스 맛있다", "히히, 잡았다 요놈!",
    "운세 한 번 보고 갈래?", "오늘의 타로 뽑았어?", "기분 꿀꺽— 개운하지?", "같이 놀자!"
  ];

  var css = document.createElement("style");
  css.textContent =
    ".gbd-wrap{position:fixed;left:0;top:0;z-index:9000;pointer-events:none;transition:transform " + (reduce ? "0s" : "2.2s") + " cubic-bezier(.42,.05,.32,1);will-change:transform;}" +
    ".gbd-body{position:relative;pointer-events:auto;cursor:pointer;width:" + SIZE + "px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.18));}" +
    ".gbd-body .goblub-svg{width:" + SIZE + "px!important;height:auto!important;display:block!important;}" +
    (reduce ? "" : ".gbd-body.bob{animation:gbd-bob 2.5s ease-in-out infinite;}") +
    "@keyframes gbd-bob{0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-7px) rotate(2deg);}}" +
    ".gbd-body.pop{animation:gbd-pop .5s ease;}" +
    "@keyframes gbd-pop{30%{transform:scale(1.18) rotate(-6deg);}60%{transform:scale(1.1) rotate(6deg);}}" +
    ".gbd-x{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:1px solid #9d6bff;background:#251a56;color:#f3ecff;font-size:12px;line-height:18px;text-align:center;cursor:pointer;opacity:0;transition:opacity .2s;padding:0;}" +
    ".gbd-body:hover .gbd-x{opacity:1;}" +
    ".gbd-bubble{position:absolute;bottom:100%;left:50%;transform:translateX(-50%) translateY(-8px);background:#251a56;border:2px solid var(--purple,#9d6bff);color:#f3ecff;font-family:inherit;font-size:.8rem;white-space:nowrap;padding:6px 11px;border-radius:12px;box-shadow:0 0 12px rgba(157,107,255,.4);opacity:0;pointer-events:none;transition:opacity .2s;}" +
    ".gbd-bubble.show{opacity:1;}" +
    ".gbd-min{position:fixed;right:14px;bottom:14px;z-index:9000;width:46px;height:46px;border-radius:50%;border:1.5px solid #9d6bff;background:#251a56;box-shadow:0 0 12px rgba(157,107,255,.45);cursor:pointer;padding:5px;display:none;}" +
    ".gbd-min .goblub-svg{width:100%!important;height:auto!important;display:block!important;}";
  document.head.appendChild(css);

  var wrap = document.createElement("div"); wrap.className = "gbd-wrap";
  var bodyEl = document.createElement("div"); bodyEl.className = "gbd-body" + (reduce ? "" : " bob");
  bodyEl.innerHTML = GoblubArt.svg(SIZE);
  var svgEl = bodyEl.querySelector(".goblub-svg");
  var bubble = document.createElement("div"); bubble.className = "gbd-bubble";
  var xBtn = document.createElement("button"); xBtn.className = "gbd-x"; xBtn.type = "button";
  xBtn.textContent = "×"; xBtn.setAttribute("aria-label", "고블럽 접기");
  bodyEl.appendChild(bubble); bodyEl.appendChild(xBtn);
  wrap.appendChild(bodyEl);
  document.body.appendChild(wrap);

  var minBtn = document.createElement("button"); minBtn.className = "gbd-min"; minBtn.type = "button";
  minBtn.setAttribute("aria-label", "고블럽 부르기");
  minBtn.innerHTML = GoblubArt.svg(38);
  document.body.appendChild(minBtn);

  // 기본값: 우하단에 가만히. 클릭했을 때만 폴짝 이동했다가 잠시 후 제자리로.
  function colBounds() { return { x0: 0, w: window.innerWidth }; } // 전체 화면 기준(사이트 컬럼 고정 롤백)
  function homePos() {
    var c = colBounds();
    return { x: c.x0 + c.w - SIZE - 22, y: window.innerHeight - SIZE - 22 };
  }
  var pos = homePos(), atHome = true;
  function place() { wrap.style.transform = "translate(" + pos.x + "px," + pos.y + "px)"; }
  place();

  var state = "on";
  try { if (localStorage.getItem(KEY) === "min") state = "min"; } catch (e) {}

  var moveTimer = null, sayTimer = null, homeTimer = null;

  function moveRandom() {
    if (state !== "on" || reduce) return;
    var margin = 14, top = 92, c = colBounds();
    var minX = c.x0 + margin;
    var maxX = Math.max(minX, c.x0 + c.w - SIZE - margin);
    var maxY = Math.max(top, window.innerHeight - SIZE - margin);
    var nx = minX + Math.random() * (maxX - minX);
    var ny = top + Math.random() * (maxY - top);
    if (svgEl) svgEl.style.transform = "scaleX(" + (nx < pos.x ? -1 : 1) + ")";
    pos = { x: nx, y: ny }; atHome = false;
    place();
    // 잠시 놀다가 스스로 제자리(우하단)로 복귀
    clearTimeout(homeTimer);
    homeTimer = setTimeout(goHome, 5000);
  }

  function goHome() {
    if (state !== "on") return;
    pos = homePos(); atHome = true;
    if (svgEl) svgEl.style.transform = "";
    place();
  }

  function say(txt) {
    bubble.textContent = txt;
    bubble.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { bubble.classList.remove("show"); }, 2600);
  }

  bodyEl.addEventListener("click", function (e) {
    if (e.target === xBtn) return;
    bodyEl.classList.remove("bob"); void bodyEl.offsetWidth; bodyEl.classList.add("pop");
    setTimeout(function () { bodyEl.classList.remove("pop"); if (!reduce) bodyEl.classList.add("bob"); }, 520);
    // 제자리에 있으면 폴짝 도망(움직임), 쫓아가 다시 잡으면 키우기 열림
    if (atHome && !reduce) {
      say(LINES[Math.floor(Math.random() * LINES.length)]);
      moveRandom();
    } else {
      say("히히, 잡았다 요놈!");
      clearTimeout(homeTimer);
      openTama();
      goHome();
    }
  });

  function setState(s) {
    state = s;
    try { localStorage.setItem(KEY, s); } catch (e) {}
    if (s === "min") { wrap.style.display = "none"; minBtn.style.display = "block"; clearTimeout(moveTimer); clearTimeout(homeTimer); }
    else { wrap.style.display = ""; minBtn.style.display = "none"; goHome(); }
  }

  xBtn.addEventListener("click", function (e) { e.stopPropagation(); setState("min"); });
  minBtn.addEventListener("click", function () { setState("on"); });

  // 최소화 버튼도 컬럼 우하단에
  function placeMin() {
    var c = colBounds();
    minBtn.style.right = "auto";
    minBtn.style.left = (c.x0 + c.w - 46 - 14) + "px";
  }
  placeMin();

  window.addEventListener("resize", function () {
    if (atHome) { pos = homePos(); }
    else {
      var c = colBounds();
      pos.x = Math.min(pos.x, c.x0 + c.w - SIZE - 8);
      pos.y = Math.min(pos.y, window.innerHeight - SIZE - 8);
    }
    placeMin();
    place();
  });

  setState(state);
})();
