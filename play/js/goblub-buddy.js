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
    var sc = document.createElement("script"); sc.src = base + "goblub-tama.js";
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

  var pos = { x: window.innerWidth - SIZE - 22, y: window.innerHeight - SIZE - 22 };
  function place() { wrap.style.transform = "translate(" + pos.x + "px," + pos.y + "px)"; }
  place();

  var state = "on";
  try { if (localStorage.getItem(KEY) === "min") state = "min"; } catch (e) {}

  var moveTimer = null, sayTimer = null;

  function moveRandom() {
    if (state !== "on") return;
    var margin = 14, top = 92;
    var maxX = Math.max(margin, window.innerWidth - SIZE - margin);
    var maxY = Math.max(top, window.innerHeight - SIZE - margin);
    var nx = margin + Math.random() * (maxX - margin);
    var ny = top + Math.random() * (maxY - top);
    if (svgEl) svgEl.style.transform = "scaleX(" + (nx < pos.x ? -1 : 1) + ")";
    pos = { x: nx, y: ny };
    place();
  }

  function schedule() {
    clearTimeout(moveTimer);
    if (reduce || state !== "on") return;
    moveTimer = setTimeout(function () { moveRandom(); schedule(); }, 6000 + Math.random() * 6000);
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
    openTama();
  });

  function setState(s) {
    state = s;
    try { localStorage.setItem(KEY, s); } catch (e) {}
    if (s === "min") { wrap.style.display = "none"; minBtn.style.display = "block"; clearTimeout(moveTimer); }
    else { wrap.style.display = ""; minBtn.style.display = "none"; schedule(); }
  }

  xBtn.addEventListener("click", function (e) { e.stopPropagation(); setState("min"); });
  minBtn.addEventListener("click", function () { setState("on"); });

  window.addEventListener("resize", function () {
    pos.x = Math.min(pos.x, window.innerWidth - SIZE - 8);
    pos.y = Math.min(pos.y, window.innerHeight - SIZE - 8);
    place();
  });

  setState(state);
})();
