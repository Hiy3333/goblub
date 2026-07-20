// 이계 인트로 스토리 엔진 — 프리미엄 리포트 진입 연출
// (고블럽 → 흡입 → 숲 → 천막 → 얼굴 없는 저승사자 → 정보 입력 → 점사 영상)
// window.GoblubTale = { start({ base, deep, hasBirth, compute, onEnter, onExit }) }
//   compute(birth) → { base, deep }  (생년월일 입력 시 재계산용)
//   onEnter(collected) → { name, focus, focusLabel, birth?, base, deep }
(function () {
  var IMG = "img/tale/";
  var IMGV = "?v=5";                    // 이미지 캐시버스트(흰눈 저승사자)
  var RITUAL_VID = IMG + "ritual.mp4?v=3";
  var GAN_H = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
  var JI_H = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };

  var css = "\
.tale{position:fixed;inset:0;z-index:9999;background:#000;overflow:hidden;font-family:'Jua','Malgun Gothic',sans-serif;-webkit-user-select:none;user-select:none}\
.tale-bgv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;opacity:0;transition:opacity 1.4s ease;z-index:0;pointer-events:none}\
.tale-bgv.on{opacity:1}\
.tale-bg{position:absolute;inset:0;background-size:cover;background-position:center 30%;opacity:0;transition:opacity 1.4s ease;will-change:opacity,transform;z-index:1}\
.tale-bg.on{opacity:1}\
.tale-bg.walk{animation:tale-walk 7s ease-in-out forwards}\
@keyframes tale-walk{from{transform:scale(1)}to{transform:scale(1.18) translateY(-2%)}}\
.tale-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 90% at 50% 42%,transparent 40%,rgba(0,0,0,.78) 100%)}\
.tale-gob{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);line-height:0;filter:drop-shadow(0 0 26px rgba(157,107,255,.5));transition:transform 2s cubic-bezier(.6,-0.2,.8,.4),opacity 1.8s}\
.tale-gob.swallow{transform:translate(-50%,-50%) scale(26) rotate(50deg);opacity:0}\
@keyframes gob-in{to{transform:translateX(-50%) translateY(0)}}\
.tale-gob.peek{filter:drop-shadow(0 0 30px rgba(157,107,255,.95)) drop-shadow(0 0 70px rgba(120,60,220,.55))}\
@keyframes gob-peek{0%{opacity:0;transform:translate(-50%,-50%) scale(.62)}\
35%{opacity:.35}55%{opacity:.2}75%{opacity:1;transform:translate(-50%,-50%) scale(1.03)}\
100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}\
.tale-vortex{position:absolute;left:50%;top:38%;width:160vmax;height:160vmax;transform:translate(-50%,-50%) scale(0);border-radius:50%;pointer-events:none;\
background:conic-gradient(from 0deg,#000 0deg,#2a1c66 70deg,#000 140deg,#3a1258 210deg,#000 290deg,#241a52 340deg,#000 360deg);\
opacity:0;transition:transform 2.1s cubic-bezier(.5,0,.8,.4),opacity .5s}\
.tale-vortex.on{transform:translate(-50%,-50%) scale(1) rotate(720deg);opacity:1;transition:transform 2.1s cubic-bezier(.5,0,.8,.4),opacity .5s,rotate 0s}\
.tale.shake{animation:tale-shake .5s ease 3}\
@keyframes tale-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-8px,4px)}50%{transform:translate(7px,-5px)}75%{transform:translate(-5px,-3px)}}\
.tale-top{position:absolute;top:12px;right:12px;z-index:9;display:flex;gap:8px}\
.tale-top button{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.28);color:rgba(255,255,255,.75);\
border-radius:999px;padding:7px 13px;font-family:inherit;font-size:.82rem;cursor:pointer;backdrop-filter:blur(4px)}\
.tale-box{position:absolute;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(92vw,560px);z-index:4;\
background:rgba(8,6,18,.82);border:1px solid rgba(140,110,220,.35);border-radius:16px;padding:16px 18px 14px;backdrop-filter:blur(6px);\
box-shadow:0 10px 40px rgba(0,0,0,.6)}\
.tale-name{font-size:.82rem;margin-bottom:6px;letter-spacing:1px;min-height:1em}\
.tale-name.n-gob{color:#b18cff}.tale-name.n-gwi{color:#ff5a5a;text-shadow:0 0 10px rgba(255,60,60,.5)}.tale-name.n-unk{color:#8f9ab8}.tale-name.n-nar{color:#6d7694}\
.tale-text{color:#efeaff;font-size:1.02rem;line-height:1.75;min-height:2.6em;white-space:pre-wrap}\
.tale-text .em{color:#ff6b6b;text-shadow:0 0 12px rgba(255,60,60,.45)}\
.tale-next{text-align:right;color:#8f7fd0;font-size:.85rem;animation:tale-blink 1.1s infinite;height:1.1em}\
@keyframes tale-blink{50%{opacity:.15}}\
.tale-choices{display:flex;flex-direction:column;gap:8px;margin-top:10px}\
.tale-choices button{background:rgba(30,22,64,.9);border:1px solid rgba(150,120,230,.5);border-radius:12px;color:#efeaff;\
padding:12px 14px;font-family:inherit;font-size:.98rem;cursor:pointer;text-align:left;transition:background .15s,border-color .15s}\
.tale-choices button:hover{background:rgba(60,40,120,.9);border-color:#b18cff}\
.tale-inp{margin-top:12px;display:flex;flex-direction:column;gap:9px}\
.tale-inp input,.tale-inp select{background:rgba(20,14,44,.95);border:1px solid rgba(150,120,230,.5);border-radius:10px;color:#efeaff;\
padding:11px 13px;font-family:inherit;font-size:1rem;width:100%}\
.tale-inp input:focus,.tale-inp select:focus{outline:none;border-color:#b18cff}\
.tale-inp .row{display:flex;gap:7px}\
.tale-inp .row select{flex:1;padding:11px 6px}\
.tale-inp .ok{background:linear-gradient(180deg,#7a3a52,#5a1f34);border:1px solid rgba(255,120,150,.5);color:#ffe;font-weight:bold;\
border-radius:12px;padding:12px;cursor:pointer;font-family:inherit;font-size:1rem}\
.tale-inp .ok:hover{filter:brightness(1.12)}\
.tale.fadeout{opacity:0;transition:opacity .55s ease}\
.tale-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;transition:opacity .8s;z-index:6;pointer-events:none}\
.tale-vid.on{opacity:1}\
.tale-vid::-webkit-media-controls-start-playback-button,.tale-vid::-webkit-media-controls,.tale-bgv::-webkit-media-controls-start-playback-button,.tale-bgv::-webkit-media-controls{display:none!important;-webkit-appearance:none}\
.tale-vcap{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);z-index:7;color:#e9e2ff;font-family:'Jua','Malgun Gothic',sans-serif;font-size:1rem;letter-spacing:2px;text-shadow:0 0 14px rgba(0,0,0,.9);opacity:0;transition:opacity .6s;text-align:center;pointer-events:none}\
.tale-vcap.on{opacity:1}\
.tale-vcap .dot{animation:tale-blink 1.1s infinite}\
@media (prefers-reduced-motion:reduce){.tale-bg,.tale-gob,.tale-vortex{transition-duration:.01s!important;animation:none!important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function hj(gj) { return gj ? (GAN_H[gj[0]] || "") + (JI_H[gj[1]] || "") : ""; }

  // ===== 공포 BGM (Web Audio 절차적 앰비언스) =====
  function makeBGM() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx, master, timers = [], stopped = false;
    function start() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
      try { ctx = new AC(); } catch (e) { return; }
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 4);
      // 저음 드론 2겹 + 5도
      [41.2, 61.7].forEach(function (f, i) {
        var o = ctx.createOscillator(); o.type = i ? "sine" : "sawtooth"; o.frequency.value = f;
        var g = ctx.createGain(); g.gain.value = i ? 0.14 : 0.05;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220; lp.Q.value = 6;
        // 필터 LFO — 숨쉬는 듯한 흔들림
        var lfo = ctx.createOscillator(); lfo.frequency.value = 0.06 + i * 0.03;
        var lg = ctx.createGain(); lg.gain.value = 90;
        lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
        o.connect(lp); lp.connect(g); g.connect(master); o.start();
      });
      // 바람 노이즈
      var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      var noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 480; bp.Q.value = 0.7;
      var ng = ctx.createGain(); ng.gain.value = 0.04;
      noise.connect(bp); bp.connect(ng); ng.connect(master); noise.start();
      // 심장박동 — 2연타
      function beat() {
        if (stopped || !ctx) return;
        [0, 0.28].forEach(function (off) {
          var t = ctx.currentTime + off;
          var o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
          var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(off ? 0.14 : 0.2, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
        });
        timers.push(setTimeout(beat, 2200 + Math.random() * 900));
      }
      timers.push(setTimeout(beat, 1400));
      // 이따금 불협 스팅
      function sting() {
        if (stopped || !ctx) return;
        var t = ctx.currentTime;
        var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 500 + Math.random() * 1300;
        var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 + Math.random());
        var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) { pan.pan.value = Math.random() * 2 - 1; o.connect(g); g.connect(pan); pan.connect(master); }
        else { o.connect(g); g.connect(master); }
        o.start(t); o.stop(t + 3);
        timers.push(setTimeout(sting, 9000 + Math.random() * 14000));
      }
      timers.push(setTimeout(sting, 6000 + Math.random() * 6000));
    }
    function stop() {
      stopped = true;
      timers.forEach(clearTimeout);
      if (ctx) {
        try { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); } catch (e) {}
        setTimeout(function () { try { ctx.close(); } catch (e) {} }, 1000);
      }
    }
    function mute(on) { if (!ctx) return; try { master.gain.linearRampToValueAtTime(on ? 0 : 0.16, ctx.currentTime + 0.3); } catch (e) {} }
    return { start: start, stop: stop, mute: mute };
  }

  function start(opts) {
    var collected = { name: "", focus: "", focusLabel: "", birth: null };
    var base = opts.base || null, deep = opts.deep || null;

    function coldRead() {
      if (!base) return { ilju: null, strengthLine: "…네 팔자, 아직 흐릿하구나.", missLine: "" };
      var ilju = base.pillars.day.ganji;
      var strengthLine = {
        신약: "겉으론 아무렇지 않은 척… 속은 여린 아이로군.",
        신강: "고집이 산맥 같은 아이로군. 제 힘을 반도 못 쓰면서.",
        중화: "균형 잡힌 팔자… 허나 그래서 더 헤매고 있지."
      }[base.strength.label] || "…흥미로운 팔자야.";
      var missFlavor = { 금: "결정 앞에서 늘 서성였겠지", 수: "마음이 쉽게 말라붙었겠지", 화: "속불이 좀처럼 안 붙었겠지", 목: "시작이 유난히 어려웠겠지", 토: "뿌리내릴 곳을 찾아 헤맸겠지" };
      var miss = (deep && deep.missing && deep.missing[0]) || null;
      return {
        ilju: ilju, strengthLine: strengthLine,
        missLine: miss ? ("…오행에 [" + miss + "]이 비었어.\n그래서 " + (missFlavor[miss] || "늘 허전했겠지") + ".") : "…팔자의 결이 또렷하군."
      };
    }

    var FOCI = [
      { label: "💕 사랑과 인연", v: "연애와 인연 — 내 짝, 연애 패턴, 다가올 사람" },
      { label: "💰 돈과 재물", v: "재물 — 돈그릇, 대박 시점, 돈이 새는 구멍" },
      { label: "🔮 다가올 운명", v: "앞날의 큰 흐름 — 대운, 인생이 바뀌는 시점" },
      { label: "🧭 나는 어떤 사람인가", v: "타고난 성격과 그릇, 숨겨진 본질" }
    ];

    // ===== 시나리오 =====
    var script = [
      { id: 0, bg: "black", gob: true, name: "고블럽", cls: "n-gob", text: "……너, 진짜 사주가 보고 싶은 거야?" },
      { id: 1, name: "고블럽", cls: "n-gob", text: "내가 아는 분이 있어.\n훨씬… 깊게 보셔. 대신—" },
      { id: 2, name: "고블럽", cls: "n-gob", text: "[아주 무서운 곳]으로 가야 해.\n…각오됐어?", choices: [
        { label: "🌀 보러 간다", goto: 3 },
        { label: "🫣 아직은… 무서워", exit: true }
      ]},
      { id: 3, fx: "swallow", name: "", cls: "n-nar", text: "" },
      { id: 4, bg: "black", name: "", cls: "n-nar", text: "……\n차가운 흙냄새." },
      { id: 5, vbg: "forest", name: "", cls: "n-nar", text: "…눈을 떴다.\n여기가, 어디지?", choices: [
        { label: "👈 왼쪽을 둘러본다", goto: 6 },
        { label: "👉 오른쪽을 둘러본다", goto: 7 }
      ]},
      { id: 6, vbg: "look_left", vbgOnce: true, name: "", cls: "n-nar", text: "뒤틀린 나무들 사이로\n안개가… 기어 다닌다.", goto: 8 },
      { id: 7, vbg: "look_right", vbgOnce: true, name: "", cls: "n-nar", text: "까마귀 한 마리가 소리 없이\n이쪽을 내려다보고 있다.\n…눈이 마주쳤다.", goto: 8 },
      { id: 8, name: "", cls: "n-nar", text: "…멀리, 불빛 하나가 흔들린다.", choices: [
        { label: "🕯 불빛을 향해 걷는다", goto: 9 }
      ]},
      { id: 9, vbg: "path", name: "", cls: "n-nar", text: "발걸음을 옮긴다.\n숲이 등 뒤에서 닫히는 기분이다." },
      { id: 10, name: "", cls: "n-nar", text: "…등 뒤에서, 바스락.", choices: [
        { label: "👀 뒤를 돌아본다", goto: 11 },
        { label: "🏃 무시하고 걷는다", goto: 12 }
      ]},
      { id: 11, bg: "black", gob: true, gobPeek: true, name: "고블럽", cls: "n-gob",
        text: "…나야.\n혼자 보내면 안 될 것 같아서.\n\n(낯익은 보라색 눈이 어둠 속에서 껌뻑인다)", goto: 13 },
      { id: 12, name: "", cls: "n-nar", text: "숨을 죽이고 발걸음을 서두른다.", goto: 13 },
      { id: 13, bg: "tent", name: "", cls: "n-nar", text: "낡은 천막.\n틈새로 촛불이 새어 나온다." },
      { id: 14, name: "???", cls: "n-unk", text: "……밖은 위험하다.\n들어와라.", choices: [
        { label: "⛺ 들어간다", goto: 16 },
        { label: "😮‍💨 숨을 고른다", goto: 15 }
      ]},
      { id: 15, name: "", cls: "n-nar", text: "크게 숨을 들이쉰다.\n…가자.", goto: 16 },
      { id: 16, bg: "gwigok", name: "귀곡", cls: "n-gwi", text: "…앉거라.\n먼 길 오느라 혼이 다 시렸겠구나." },
      // 이름 입력
      { id: 17, name: "귀곡", cls: "n-gwi", text: "산 자여. 네 이름을 이 천막에\n똑똑히 남겨라.",
        input: { kind: "text", key: "name", placeholder: "이름 (또는 불리고 싶은 이름)", maxlen: 12, submit: "🖊 이름을 새긴다" } },
      // 생년월일 입력
      { id: 18, name: "귀곡", cls: "n-gwi", text: function () { return (collected.name ? collected.name + "… " : "") + "언제 이 세상에 왔느냐.\n한 치도 틀리지 말고 아뢰라."; },
        input: { kind: "birth", key: "birth", submit: "🔮 명(命)을 아뢴다" } },
      // 콜드리딩 (생년월일 확정 후 재계산된 base/deep 사용)
      { id: 19, name: "귀곡", cls: "n-gwi", text: function () { var c = coldRead(); return c.ilju ? ("[" + hj(c.ilju) + "(" + c.ilju + ")] 일주.\n" + c.strengthLine) : c.strengthLine; } },
      { id: 20, name: "귀곡", cls: "n-gwi", text: function () { return coldRead().missLine; } },
      { id: 21, name: "귀곡", cls: "n-gwi", text: "내 이름은 [귀곡(鬼哭)].\n산 자의 팔자를 읽는 저승의 사자다." },
      // 궁금한 것(초점) 선택
      { id: 22, name: "귀곡", cls: "n-gwi", text: "무엇이 그리 궁금하여\n저승 문턱까지 넘어왔느냐?", choices: [
        { label: FOCI[0].label, setFocus: 0, goto: 24 },
        { label: FOCI[1].label, setFocus: 1, goto: 24 },
        { label: FOCI[2].label, setFocus: 2, goto: 24 },
        { label: FOCI[3].label, setFocus: 3, goto: 24 },
        { label: "✍️ 직접 물어보겠소", goto: 23 }
      ]},
      { id: 23, name: "귀곡", cls: "n-gwi", text: "…말해 보아라.\n무엇이 네 밤잠을 앗아갔느냐.",
        input: { kind: "text", key: "focusFree", placeholder: "궁금한 것을 적어라 (예: 그 사람과 이어질까)", maxlen: 40, submit: "🕯 마음을 아뢴다" }, goto: 24 },
      { id: 24, name: "귀곡", cls: "n-gwi",
        text: function () {
          if (opts.owned) return "…또 왔구나.\n네 명부는 이미 내가 새겨두었다.\n다시 펼쳐 보겠나?";
          if (opts.costText) return "네 팔자를 뼛속까지 들춰주마.\n대신 [" + opts.costText + "]을 바쳐야 한다.\n…자세히 알고 싶으냐?";
          return "네 팔자를 뼛속까지 들춰주마.\n지금은 값을 받지 않으마.\n…자세히 알고 싶으냐?";
        },
        choices: [
          { label: "🩸 낱낱이 보여주시오", enter: true },
          { label: "❓ …두렵소. 잠시만.", goto: 25 }
        ]
      },
      { id: 25, name: "귀곡", cls: "n-gwi", text: "두려움도 네 팔자의 일부다.\n…준비되거든, 내 눈을 마주쳐라.", choices: [
        { label: "🩸 …보여주시오", enter: true }
      ]}
    ];
    var byId = {}; script.forEach(function (s) { byId[s.id] = s; });

    var bgm = makeBGM(), muted = false;

    var root = document.createElement("div");
    root.className = "tale";
    root.innerHTML =
      '<video class="tale-bgv" playsinline muted autoplay loop preload="auto"></video>' +
      '<div class="tale-bg a"></div><div class="tale-bg b"></div>' +
      '<div class="tale-vig"></div>' +
      '<div class="tale-gob">' + (window.GoblubArt ? GoblubArt.svg(150) : '<span style="font-size:110px">👾</span>') + "</div>" +
      '<div class="tale-vortex"></div>' +
      '<video class="tale-vid" playsinline webkit-playsinline muted preload="auto"></video>' +
      '<p class="tale-vcap"></p>' +
      '<div class="tale-top"><button class="t-mute">🔊</button><button class="t-skip">건너뛰기 ➤</button></div>' +
      '<div class="tale-box"><p class="tale-name"></p><p class="tale-text"></p>' +
      '<div class="tale-next">▼</div><div class="tale-choices"></div><div class="tale-inp" style="display:none"></div></div>';
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";
    if (opts.gobIn !== false) root.querySelector(".tale-gob").style.animation = "gob-in .7s cubic-bezier(.34,1.56,.64,1) .1s forwards";

    var bgA = root.querySelector(".tale-bg.a"), bgB = root.querySelector(".tale-bg.b"), useA = true;
    var gob = root.querySelector(".tale-gob"), vortex = root.querySelector(".tale-vortex");
    var nameEl = root.querySelector(".tale-name"), textEl = root.querySelector(".tale-text");
    var nextEl = root.querySelector(".tale-next"), chEl = root.querySelector(".tale-choices");
    var inpEl = root.querySelector(".tale-inp");
    var vid = root.querySelector(".tale-vid"), vcap = root.querySelector(".tale-vcap");
    var bgv = root.querySelector(".tale-bgv");
    var box = root.querySelector(".tale-box");
    var typing = null, fullText = "", canTap = false, ended = false, ritualDone = false, bgmOn = false, bgvKey = null;

    function kickBGM() { if (!bgmOn && bgm) { bgmOn = true; bgm.start(); } }

    // 배경 정지 이미지
    function setBg(key, walk) {
      hideBgVideo();
      if (key === "black") { bgA.classList.remove("on"); bgB.classList.remove("on"); return; }
      var el = useA ? bgA : bgB, other = useA ? bgB : bgA;
      el.style.backgroundImage = "url('" + IMG + key + ".webp" + IMGV + "')";
      el.classList.remove("walk"); void el.offsetWidth;
      if (walk) el.classList.add("walk");
      el.classList.add("on"); other.classList.remove("on");
      useA = !useA;
    }
    // 배경 동영상(무한 루프) — 없으면 조용히 정지 이미지로 폴백
    function setBgVideo(key, once) {
      if (bgvKey === key) return;
      bgvKey = key;
      bgv.loop = !once;   // once면 한 번 재생 후 마지막 프레임에서 정지
      bgA.classList.remove("on"); bgB.classList.remove("on");
      bgv.onerror = function () { if (bgvKey === key) { bgvKey = null; bgv.classList.remove("on"); setBg(key); } };
      bgv.muted = true;
      bgv.src = IMG + "vid_" + key + ".mp4" + IMGV;
      function tryPlay() { var p = bgv.play(); if (p && p.catch) p.catch(function () {}); }
      bgv.oncanplay = tryPlay; tryPlay();
      bgv.classList.add("on"); // 자동재생 안 되는 브라우저도 첫 프레임(정지 이미지처럼)은 보임
    }
    function hideBgVideo() {
      if (bgvKey == null) return;
      bgvKey = null; bgv.classList.remove("on");
      try { bgv.pause(); } catch (e) {}
    }
    function fmt(t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\[([^\]]+)\]/g, '<span class="em">$1</span>');
    }
    function type(t, done) {
      clearInterval(typing);
      fullText = t; var i = 0; textEl.innerHTML = "";
      typing = setInterval(function () {
        i += 1; textEl.innerHTML = fmt(t.slice(0, i));
        if (i >= t.length) { clearInterval(typing); typing = null; if (done) done(); }
      }, 26);
    }
    function finishType() {
      if (typing) { clearInterval(typing); typing = null; textEl.innerHTML = fmt(fullText); return true; }
      return false;
    }

    function proceedChoice(c) {
      if (c.setFocus != null) { collected.focus = FOCI[c.setFocus].v; collected.focusLabel = FOCI[c.setFocus].label; }
      if (c.enter) { playRitual(); return; }
      if (c.exit) { end("exit"); return; }
      show(c.goto);
    }
    function renderChoices(list) {
      chEl.innerHTML = "";
      list.forEach(function (c) {
        var b = document.createElement("button");
        b.innerHTML = c.label;
        b.onclick = function (e) { e.stopPropagation(); kickBGM(); proceedChoice(c); };
        chEl.appendChild(b);
      });
    }

    // ---- 입력 스텝 ----
    function renderInput(inp) {
      inpEl.style.display = "flex"; inpEl.innerHTML = "";
      nextEl.style.visibility = "hidden";
      if (inp.kind === "text") {
        var i = document.createElement("input");
        i.type = "text"; i.maxLength = inp.maxlen || 20; i.placeholder = inp.placeholder || "";
        if (inp.key === "name" && collected.name) i.value = collected.name;
        var ok = document.createElement("button"); ok.className = "ok"; ok.textContent = inp.submit || "확인";
        function done() {
          var v = (i.value || "").trim();
          kickBGM();
          if (inp.key === "name") collected.name = v.slice(0, inp.maxlen || 20);
          else if (inp.key === "focusFree" && v) { collected.focus = v.slice(0, inp.maxlen || 40); collected.focusLabel = "✍️ " + collected.focus; }
          advance();
        }
        ok.onclick = function (e) { e.stopPropagation(); done(); };
        i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); done(); } });
        inpEl.appendChild(i); inpEl.appendChild(ok);
        // 자동 포커스 안 함 — 사용자가 칸을 직접 눌러야 키보드가 올라오게
      } else if (inp.kind === "birth") {
        var pre = collected.birth || (opts.hasBirth && opts.initialBirth) || {};
        var wrapY = sel("y"), wrapM = sel("m"), wrapD = sel("d"), wrapH = sel("h"), wrapMi = sel("mi"), wrapG = sel("g");
        var row1 = document.createElement("div"); row1.className = "row";
        row1.appendChild(wrapY.el); row1.appendChild(wrapM.el); row1.appendChild(wrapD.el);
        var row2 = document.createElement("div"); row2.className = "row";
        row2.appendChild(wrapH.el); row2.appendChild(wrapMi.el); row2.appendChild(wrapG.el);
        // 시를 모르면 분 선택 비활성화
        function syncMin() { wrapMi.el.disabled = (wrapH.el.value === ""); if (wrapMi.el.disabled) wrapMi.el.value = 0; }
        wrapH.el.addEventListener("change", syncMin); syncMin();
        var ok2 = document.createElement("button"); ok2.className = "ok"; ok2.textContent = inp.submit || "확인";
        ok2.onclick = function (e) {
          e.stopPropagation(); kickBGM();
          var b = { y: +wrapY.el.value, m: +wrapM.el.value, d: +wrapD.el.value };
          var hv = wrapH.el.value; b.hour = hv === "" ? null : +hv;
          b.min = b.hour == null ? 0 : (+wrapMi.el.value || 0);
          b.gender = wrapG.el.value || null;
          collected.birth = b;
          if (opts.compute) { var r = opts.compute(b); if (r) { base = r.base; deep = r.deep; } }
          advance();
        };
        inpEl.appendChild(row1); inpEl.appendChild(row2); inpEl.appendChild(ok2);
        function sel(kind) {
          var s = document.createElement("select"); var o;
          if (kind === "y") { for (var y = new Date().getFullYear(); y >= 1930; y--) { o = new Option(y + "년", y); s.add(o); } s.value = pre.y || 1995; }
          if (kind === "m") { for (var m = 1; m <= 12; m++) s.add(new Option(m + "월", m)); s.value = pre.m || 1; }
          if (kind === "d") { for (var d = 1; d <= 31; d++) s.add(new Option(d + "일", d)); s.value = pre.d || 1; }
          if (kind === "h") { s.add(new Option("태어난 시 모름", "")); for (var h = 0; h < 24; h++) s.add(new Option(h + "시", h)); s.value = (pre.hour == null ? "" : pre.hour); }
          if (kind === "mi") { for (var mi2 = 0; mi2 < 60; mi2++) s.add(new Option(mi2 + "분", mi2)); s.value = (pre.min == null ? 0 : pre.min); }
          if (kind === "g") { s.add(new Option("성별 안 밝힘", "")); s.add(new Option("남", "M")); s.add(new Option("여", "F")); s.value = pre.gender || ""; }
          return { el: s };
        }
      }
    }

    // ===== 점사 영상 =====
    function playRitual() {
      if (ritualDone) { end("enter"); return; }
      ritualDone = true;
      box.style.display = "none"; inpEl.style.display = "none";
      var go = false;
      function proceed() { if (go) return; go = true; end("enter"); }
      vid.src = RITUAL_VID; vid.onended = proceed;
      vid.onerror = function () { end("enter"); };
      var p = vid.play();
      if (p && p.catch) p.catch(function () { vid.muted = true; vid.play().catch(function () { end("enter"); }); });
      setTimeout(function () { vid.classList.add("on"); }, 30);
      setTimeout(function () { vcap.innerHTML = '🕯 귀곡이 네 명부(冥府)를 펼친다<span class="dot">…</span>'; vcap.classList.add("on"); }, 900);
      setTimeout(proceed, 8000);
    }

    function end(kind) {
      if (ended) return; ended = true;
      if (bgm) bgm.stop();
      root.classList.add("fadeout");
      setTimeout(function () {
        root.remove(); document.body.style.overflow = "";
        var payload = { name: collected.name, focus: collected.focus, focusLabel: collected.focusLabel, birth: collected.birth, base: base, deep: deep };
        if (kind === "enter") { if (opts.onEnter) opts.onEnter(payload); }
        else { if (opts.onExit) opts.onExit(payload); }
      }, 1000);
    }

    var cur = null;
    function advance() { if (cur && cur.goto != null) show(cur.goto); else if (cur) show(cur.id + 1); }

    function show(id) {
      var s = byId[id];
      if (!s) { end("enter"); return; }
      cur = s; canTap = false;
      chEl.innerHTML = ""; inpEl.style.display = "none"; inpEl.innerHTML = ""; nextEl.style.visibility = "hidden";
      if (s.vbg) setBgVideo(s.vbg, s.vbgOnce);
      else if (s.bg) setBg(s.bg, s.walk);
      gob.style.display = (s.gob || s.fx === "swallow") ? "block" : "none";
      // 뒤를 돌아봤을 때 고블럽이 어둠 속에서 스르륵 드러나는 연출
      if (s.gobPeek) {
        gob.classList.remove("swallow");   // 삼킴 연출 잔여 상태(opacity:0) 해제
        gob.classList.add("peek");         // 보라색 발광만 담당
        gob.style.animation = "none";
        void gob.offsetWidth;              // 리플로우 강제 — 애니메이션 재시작
        gob.style.animation = "gob-peek 2s cubic-bezier(.2,.7,.3,1) forwards";
      } else { gob.classList.remove("peek"); }
      nameEl.textContent = (typeof s.name === "function" ? s.name() : s.name) || "";
      nameEl.className = "tale-name " + (s.cls || "n-nar");

      if (s.fx === "swallow") {
        textEl.innerHTML = "";
        root.classList.add("shake"); gob.classList.add("swallow"); vortex.classList.add("on");
        setTimeout(function () {
          root.classList.remove("shake"); vortex.classList.remove("on"); gob.style.display = "none";
          show(s.id + 1);
        }, s.auto || 2400);
        return;
      }

      var txt = typeof s.text === "function" ? s.text() : s.text;
      type(txt, function () {
        if (s.input) { renderInput(s.input); }
        else if (s.choices) { renderChoices(s.choices); }
        else { canTap = true; nextEl.style.visibility = "visible"; }
      });
    }

    root.addEventListener("click", function (e) {
      if (e.target.closest(".tale-choices") || e.target.closest(".tale-inp") || e.target.closest(".tale-top")) return;
      kickBGM();
      if (finishType()) {
        if (cur && cur.input) renderInput(cur.input);
        else if (cur && cur.choices) renderChoices(cur.choices);
        else { canTap = true; nextEl.style.visibility = "visible"; }
        return;
      }
      if (!canTap || !cur) return;
      advance();
    });
    root.querySelector(".t-skip").onclick = function () { if (ritualDone) end("enter"); else end("skip"); };
    root.querySelector(".t-mute").onclick = function () {
      muted = !muted; kickBGM();
      if (bgm) bgm.mute(muted);
      this.textContent = muted ? "🔇" : "🔊";
    };

    show(0);
  }

  window.GoblubTale = { start: start };
})();
