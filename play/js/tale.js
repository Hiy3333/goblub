// 이계 인트로 스토리 엔진 — 프리미엄 리포트 진입 연출 (고블럽 → 흡입 → 숲 → 천막 → 귀곡 선생)
// window.GoblubTale = { start({ base, deep, onEnter, onExit }) }
(function () {
  var IMG = "img/tale/";
  var GAN_H = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
  var JI_H = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };

  var css = "\
.tale{position:fixed;inset:0;z-index:9999;background:#000;overflow:hidden;font-family:'Jua','Malgun Gothic',sans-serif;-webkit-user-select:none;user-select:none}\
.tale-bg{position:absolute;inset:0;background-size:cover;background-position:center 30%;opacity:0;transition:opacity 1.4s ease;will-change:opacity,transform}\
.tale-bg.on{opacity:1}\
.tale-bg.walk{animation:tale-walk 7s ease-in-out forwards}\
@keyframes tale-walk{from{transform:scale(1)}to{transform:scale(1.18) translateY(-2%)}}\
.tale-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 90% at 50% 42%,transparent 40%,rgba(0,0,0,.78) 100%)}\
.tale-gob{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);line-height:0;filter:drop-shadow(0 0 26px rgba(157,107,255,.5));transition:transform 2s cubic-bezier(.6,-0.2,.8,.4),opacity 1.8s}\
.tale-gob.swallow{transform:translate(-50%,-50%) scale(26) rotate(50deg);opacity:0}\
.tale-vortex{position:absolute;left:50%;top:38%;width:160vmax;height:160vmax;transform:translate(-50%,-50%) scale(0);border-radius:50%;pointer-events:none;\
background:conic-gradient(from 0deg,#000 0deg,#2a1c66 70deg,#000 140deg,#3a1258 210deg,#000 290deg,#241a52 340deg,#000 360deg);\
opacity:0;transition:transform 2.1s cubic-bezier(.5,0,.8,.4),opacity .5s}\
.tale-vortex.on{transform:translate(-50%,-50%) scale(1) rotate(720deg);opacity:1;transition:transform 2.1s cubic-bezier(.5,0,.8,.4),opacity .5s,rotate 0s}\
.tale.shake{animation:tale-shake .5s ease 3}\
@keyframes tale-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-8px,4px)}50%{transform:translate(7px,-5px)}75%{transform:translate(-5px,-3px)}}\
.tale-skip{position:absolute;top:14px;right:14px;z-index:5;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.28);color:rgba(255,255,255,.75);\
border-radius:999px;padding:7px 15px;font-family:inherit;font-size:.82rem;cursor:pointer;backdrop-filter:blur(4px)}\
.tale-box{position:absolute;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(92vw,560px);z-index:4;\
background:rgba(8,6,18,.82);border:1px solid rgba(140,110,220,.35);border-radius:16px;padding:16px 18px 14px;backdrop-filter:blur(6px);\
box-shadow:0 10px 40px rgba(0,0,0,.6)}\
.tale-name{font-size:.82rem;margin-bottom:6px;letter-spacing:1px;min-height:1em}\
.tale-name.n-gob{color:#b18cff}.tale-name.n-gwi{color:#ff5a5a;text-shadow:0 0 10px rgba(255,60,60,.5)}.tale-name.n-unk{color:#8f9ab8}.tale-name.n-nar{color:#6d7694}\
.tale-text{color:#efeaff;font-size:1.02rem;line-height:1.75;min-height:3.4em;white-space:pre-wrap}\
.tale-text .em{color:#ff6b6b;text-shadow:0 0 12px rgba(255,60,60,.45)}\
.tale-next{text-align:right;color:#8f7fd0;font-size:.85rem;animation:tale-blink 1.1s infinite;height:1.1em}\
@keyframes tale-blink{50%{opacity:.15}}\
.tale-choices{display:flex;flex-direction:column;gap:8px;margin-top:10px}\
.tale-choices button{background:rgba(30,22,64,.9);border:1px solid rgba(150,120,230,.5);border-radius:12px;color:#efeaff;\
padding:12px 14px;font-family:inherit;font-size:.98rem;cursor:pointer;text-align:left;transition:background .15s,border-color .15s}\
.tale-choices button:hover{background:rgba(60,40,120,.9);border-color:#b18cff}\
.tale.fadeout{opacity:0;transition:opacity 1s}\
@media (prefers-reduced-motion:reduce){.tale-bg,.tale-gob,.tale-vortex{transition-duration:.01s!important;animation:none!important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function hj(gj) { return (GAN_H[gj[0]] || "") + (JI_H[gj[1]] || ""); }

  function buildScript(base, deep) {
    var ilju = base.pillars.day.ganji;
    var strengthLine = {
      신약: "겉으론 아무렇지 않은 척… 속은 여린 아이로군.",
      신강: "고집이 산맥 같은 아이로군. 제 힘을 반도 못 쓰면서.",
      중화: "균형 잡힌 팔자… 허나 그래서 더 헤매고 있지."
    }[base.strength.label] || "…흥미로운 팔자야.";
    var missFlavor = { 금: "결정 앞에서 늘 서성였겠지", 수: "마음이 쉽게 말라붙었겠지", 화: "속불이 좀처럼 안 붙었겠지", 목: "시작이 유난히 어려웠겠지", 토: "뿌리내릴 곳을 찾아 헤맸겠지" };
    var miss = (deep && deep.missing && deep.missing[0]) || null;

    return [
      { id: 0, bg: "black", gob: true, name: "고블럽", cls: "n-gob", text: "……너, 진짜 사주가 보고 싶은 거야?" },
      { id: 1, name: "고블럽", cls: "n-gob", text: "내가 아는 분이 있어.\n훨씬… 깊게 보셔. 대신—" },
      { id: 2, name: "고블럽", cls: "n-gob", text: "[아주 무서운 곳]으로 가야 해.\n…각오됐어?", choices: [
        { label: "🌀 보러 간다", goto: 3 },
        { label: "🫣 아직은… 무서워", exit: true }
      ]},
      { id: 3, fx: "swallow", auto: 2400, name: "", cls: "n-nar", text: "" },
      { id: 4, bg: "black", name: "", cls: "n-nar", text: "……\n차가운 흙냄새." },
      { id: 5, bg: "forest", name: "", cls: "n-nar", text: "…눈을 떴다.\n여기가, 어디지?", choices: [
        { label: "👈 왼쪽을 둘러본다", goto: 6 },
        { label: "👉 오른쪽을 둘러본다", goto: 7 }
      ]},
      { id: 6, name: "", cls: "n-nar", text: "뒤틀린 나무들 사이로\n안개가… 기어 다닌다.", goto: 8 },
      { id: 7, name: "", cls: "n-nar", text: "까마귀 한 마리가 소리 없이\n이쪽을 내려다보고 있다.", goto: 8 },
      { id: 8, name: "", cls: "n-nar", text: "…멀리, 불빛 하나가 흔들린다.", choices: [
        { label: "🕯 불빛을 향해 걷는다", goto: 9 }
      ]},
      { id: 9, bg: "path", walk: true, name: "", cls: "n-nar", text: "발걸음을 옮긴다.\n숲이 등 뒤에서 닫히는 기분이다." },
      { id: 10, name: "", cls: "n-nar", text: "…등 뒤에서, 바스락.", choices: [
        { label: "👀 뒤를 돌아본다", goto: 11 },
        { label: "🏃 무시하고 걷는다", goto: 12 }
      ]},
      { id: 11, name: "", cls: "n-nar", text: "어둠 속 — 낯익은 보라색 눈이\n껌뻑였다. …따라와 준 거야?", goto: 13 },
      { id: 12, name: "", cls: "n-nar", text: "숨을 죽이고 발걸음을 서두른다.", goto: 13 },
      { id: 13, bg: "tent", name: "", cls: "n-nar", text: "낡은 천막.\n틈새로 촛불이 새어 나온다." },
      { id: 14, name: "???", cls: "n-unk", text: "……밖은 위험하다.\n들어와라.", choices: [
        { label: "⛺ 들어간다", goto: 16 },
        { label: "😮‍💨 숨을 고른다", goto: 15 }
      ]},
      { id: 15, name: "", cls: "n-nar", text: "크게 숨을 들이쉰다.\n…가자.", goto: 16 },
      { id: 16, bg: "gwigok", name: "귀곡 선생", cls: "n-gwi", text: "…앉거라." },
      { id: 17, name: "귀곡 선생", cls: "n-gwi", text: "[" + hj(ilju) + "(" + ilju + ")] 일주.\n" + strengthLine },
      { id: 18, name: "귀곡 선생", cls: "n-gwi", text: miss ? ("…오행에 [" + miss + "]이 비었어.\n그래서 " + (missFlavor[miss] || "늘 허전했겠지") + ".") : "…팔자의 결이 또렷하군.", },
      { id: 19, name: "귀곡 선생", cls: "n-gwi", text: "내 이름은 [귀곡(鬼哭)].\n고블럽들의 스승이자, 이 숲의 주인이다." },
      { id: 20, name: "귀곡 선생", cls: "n-gwi", text: "네 팔자… 보겠나?", choices: [
        { label: "🙏 보여주세요", enter: true },
        { label: "❓ 당신은… 대체 누구죠?", goto: 21 }
      ]},
      { id: 21, name: "귀곡 선생", cls: "n-gwi", text: "……천 년을 이 숲에서\n남의 팔자만 읽었다. 그거면 됐다.\n\n— 보겠나?", choices: [
        { label: "🙏 …보여주세요", enter: true }
      ]}
    ];
  }

  function start(opts) {
    var script = buildScript(opts.base, opts.deep);
    var byId = {}; script.forEach(function (s) { byId[s.id] = s; });

    var root = document.createElement("div");
    root.className = "tale";
    root.innerHTML =
      '<div class="tale-bg a"></div><div class="tale-bg b"></div>' +
      '<div class="tale-vig"></div>' +
      '<div class="tale-gob">' + (window.GoblubArt ? GoblubArt.svg(150) : '<span style="font-size:110px">👾</span>') + "</div>" +
      '<div class="tale-vortex"></div>' +
      '<button class="tale-skip">건너뛰기 ➤</button>' +
      '<div class="tale-box"><p class="tale-name"></p><p class="tale-text"></p>' +
      '<div class="tale-next">▼</div><div class="tale-choices"></div></div>';
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";

    var bgA = root.querySelector(".tale-bg.a"), bgB = root.querySelector(".tale-bg.b"), useA = true;
    var gob = root.querySelector(".tale-gob"), vortex = root.querySelector(".tale-vortex");
    var nameEl = root.querySelector(".tale-name"), textEl = root.querySelector(".tale-text");
    var nextEl = root.querySelector(".tale-next"), chEl = root.querySelector(".tale-choices");
    var typing = null, fullText = "", canTap = false, ended = false;

    function setBg(key, walk) {
      if (key === "black") { bgA.classList.remove("on"); bgB.classList.remove("on"); return; }
      var el = useA ? bgA : bgB, other = useA ? bgB : bgA;
      el.style.backgroundImage = "url('" + IMG + key + ".webp')";
      el.classList.remove("walk"); void el.offsetWidth;
      if (walk) el.classList.add("walk");
      el.classList.add("on"); other.classList.remove("on");
      useA = !useA;
    }
    function fmt(t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\[([^\]]+)\]/g, '<span class="em">$1</span>');
    }
    function type(t, done) {
      clearInterval(typing);
      fullText = t;
      var i = 0;
      textEl.innerHTML = "";
      typing = setInterval(function () {
        i += 1;
        textEl.innerHTML = fmt(t.slice(0, i));
        if (i >= t.length) { clearInterval(typing); typing = null; if (done) done(); }
      }, 26);
    }
    function finishType() {
      if (typing) { clearInterval(typing); typing = null; textEl.innerHTML = fmt(fullText); return true; }
      return false;
    }

    function end(kind) {
      if (ended) return; ended = true;
      root.classList.add("fadeout");
      setTimeout(function () {
        root.remove();
        document.body.style.overflow = "";
        if (kind === "enter") { if (opts.onEnter) opts.onEnter(); }
        else { if (opts.onExit) opts.onExit(); }
      }, 1000);
    }

    var cur = null;
    function show(id) {
      var s = byId[id];
      if (!s) { end("enter"); return; }
      cur = s;
      canTap = false;
      chEl.innerHTML = ""; nextEl.style.visibility = "hidden";
      if (s.bg) setBg(s.bg, s.walk);
      gob.style.display = s.gob ? "block" : (s.fx === "swallow" ? "block" : "none");
      nameEl.textContent = s.name || "";
      nameEl.className = "tale-name " + (s.cls || "n-nar");

      if (s.fx === "swallow") {
        textEl.innerHTML = "";
        root.classList.add("shake");
        gob.classList.add("swallow");
        vortex.classList.add("on");
        setTimeout(function () {
          root.classList.remove("shake");
          vortex.classList.remove("on");
          gob.style.display = "none";
          show(s.id + 1);
        }, s.auto || 2400);
        return;
      }

      type(s.text, function () {
        if (s.choices) {
          s.choices.forEach(function (c) {
            var b = document.createElement("button");
            b.innerHTML = c.label;
            b.onclick = function (e) {
              e.stopPropagation();
              if (c.enter) { end("enter"); return; }
              if (c.exit) { end("exit"); return; }
              show(c.goto);
            };
            chEl.appendChild(b);
          });
        } else {
          canTap = true;
          nextEl.style.visibility = "visible";
        }
      });
    }

    root.addEventListener("click", function (e) {
      if (e.target.closest(".tale-choices") || e.target.closest(".tale-skip")) return;
      if (finishType()) {
        if (cur && cur.choices) {
          cur.choices.forEach(function (c) {
            var b = document.createElement("button");
            b.innerHTML = c.label;
            b.onclick = function (ev) {
              ev.stopPropagation();
              if (c.enter) { end("enter"); return; }
              if (c.exit) { end("exit"); return; }
              show(c.goto);
            };
            chEl.appendChild(b);
          });
        } else { canTap = true; nextEl.style.visibility = "visible"; }
        return;
      }
      if (!canTap || !cur) return;
      if (cur.goto != null) show(cur.goto);
      else show(cur.id + 1);
    });
    root.querySelector(".tale-skip").onclick = function () { end("skip"); };

    show(0);
  }

  window.GoblubTale = { start: start };
})();
