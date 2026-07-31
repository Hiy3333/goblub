// 허브 페이지 고브럽 + 카드 부채꼴 엔진 (홈과 동일한 연출)
// - 진입: 고브럽이 중앙에서 이미 카드를 뱉어 둔 상태(부채꼴 촤라락)
// - 고브럽/빈 화면 클릭 → 카드 닫힘 → 고브럽이 이 행성에서도 걸어다님
// - 다시 클릭 → 중앙으로 달려와 카드를 다시 뱉음
// 모바일: 기존 뽕뽕 팝 그리드 유지(캐릭터 없음)
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card-grid .card"));
  if (!cards.length) return;

  if (window.innerWidth < 701) {
    cards.forEach(function (c, i) {
      setTimeout(function () {
        c.classList.add("pop");
        c.addEventListener("animationend", function () { c.classList.remove("pop"); c.classList.add("shown"); }, { once: true });
      }, 130 * i + 150);
    });
    return;
  }

  var ROOT = (document.currentScript && document.currentScript.dataset.root) || "..";
  var IMG_WALK = ROOT + "/design/img/home/gb-walk.webp";
  var IMG_FRONT = ROOT + "/design/img/home/gb-front.webp";

  document.body.classList.add("fanmode");

  // ===== 고브럽 스타일(홈과 동일 값) =====
  var css = document.createElement("style");
  css.textContent = "\
.hg-goblub{position:fixed;left:0;top:0;z-index:4;width:170px;cursor:pointer;will-change:transform;visibility:hidden;transition:opacity .18s}\
.hg-goblub .bodywrap{position:relative;width:100%;will-change:transform}\
.hg-goblub img{width:100%;height:auto;display:block;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 8px 9px rgba(0,22,32,.22));transition:filter .18s}\
.hg-goblub:hover img{filter:drop-shadow(0 8px 9px rgba(0,22,32,.22)) drop-shadow(0 0 8px rgba(255,255,255,.85))}\
.hg-mouth{position:absolute;left:57.33%;top:39.22%;width:30.4%;height:29.75%;border-radius:50%;overflow:hidden;pointer-events:none;\
-webkit-mask-image:radial-gradient(circle,#000 58%,transparent 96%);mask-image:radial-gradient(circle,#000 58%,transparent 96%)}\
.hg-mouth svg{display:block;width:100%;height:100%;filter:blur(.5px);animation:hg-spin 2.6s linear infinite}\
@keyframes hg-spin{to{transform:rotate(360deg)}}\
.hg-goblub.front .hg-mouth{display:none}\
.hg-orb{position:absolute;left:-9%;top:41.4%;width:46%;aspect-ratio:1;border-radius:50%;pointer-events:none;display:none;mix-blend-mode:screen;\
background:radial-gradient(circle,rgba(215,248,255,1) 0%,rgba(150,220,255,.7) 34%,rgba(130,210,255,0) 68%);animation:hg-orbp 1.3s ease-in-out infinite}\
.hg-goblub.front .hg-orb{left:-15%;top:35.4%}\
.hg-goblub.orbon .hg-orb{display:block}\
@keyframes hg-orbp{0%,100%{opacity:.6;transform:scale(.88)}50%{opacity:1;transform:scale(1.18)}}\
.hg-shad{position:fixed;left:0;top:0;z-index:3;pointer-events:none;border-radius:50%;filter:blur(3px);visibility:hidden;\
background:radial-gradient(ellipse at center,rgba(4,10,20,.68) 0%,rgba(4,10,20,.4) 45%,rgba(4,10,20,0) 72%);will-change:transform,width,opacity}";
  document.head.appendChild(css);

  var SPIRAL_A = "M51.5 50.0 L52.0 50.4 L52.4 51.0 L52.5 51.7 L52.5 52.5 L52.2 53.4 L51.6 54.1 L50.9 54.8 L49.9 55.3 L48.7 55.7 L47.5 55.7 L46.1 55.4 L44.8 54.9 L43.6 54.0 L42.6 52.8 L41.7 51.3 L41.2 49.6 L41.1 47.8 L41.3 45.9 L41.9 44.0 L43.0 42.2 L44.5 40.7 L46.3 39.4 L48.4 38.4 L50.8 37.9 L53.2 37.9 L55.7 38.5 L58.1 39.5 L60.4 41.1 L62.3 43.1 L63.8 45.5 L64.8 48.3 L65.2 51.3 L65.1 54.4 L64.2 57.4 L62.8 60.4 L60.7 63.0 L58.2 65.2 L55.1 66.9 L51.7 68.0 L48.1 68.3 L44.4 68.0 L40.7 66.8 L37.4 65.0 L34.3 62.4 L31.9 59.2 L30.0 55.6 L28.9 51.5 L28.7 47.3 L29.2 43.0 L30.7 38.9 L33.0 35.0 L36.1 31.6 L39.8 28.9 L44.1 26.9 L48.7 25.8 L53.6 25.7 L58.4 26.5 L63.1 28.3 L67.4 31.1 L71.1 34.7 L74.1 39.0 L76.1 43.9 L77.2 49.1 L77.2 54.6 L76.1 60.0 L73.9 65.2 L70.7 69.9 L66.6 73.9 L61.7 77.0 L56.2 79.2 L50.3 80.2 L44.3 80.0 L38.3 78.6 L32.7 76.1 L27.6 72.4 L23.3 67.7 L20.0 62.2 L17.8 56.1 L16.8 49.7 L17.2 43.0 L18.9 36.5 L21.9 30.4 L26.0 25.0 L31.3 20.5 L37.3 17.0 L44.0 14.8 L51.1 13.9 L58.3 14.5 L65.3 16.5 L71.9 19.9 L77.6 24.6 L82.4 30.4 L86.0 37.0 L88.2 44.4 L89.0 52.0 L88.1 59.8 L85.8 67.3 L81.9 74.2 L76.8 80.3 L70.4 85.4 L63.1 89.0 L55.2 91.2 L46.9 91.8 L38.6 90.7 L30.6 88.0 L23.3 83.7 L16.9 78.0 L11.7 71.1 L8.0 63.2 L5.8 54.6 L5.4 45.8 L6.8 37.0 L9.9 28.5 L14.7 20.8 L20.9 14.1 L28.4 8.7 L36.9 4.9 L46.0 2.9 L55.5 2.7 L64.8 4.3";
  var SPIRAL_B = "M48.5 50.0 L48.0 49.6 L47.6 49.0 L47.5 48.3 L47.5 47.5 L47.8 46.6 L48.4 45.9 L49.1 45.2 L50.1 44.7 L51.3 44.3 L52.5 44.3 L53.9 44.6 L55.2 45.1 L56.4 46.0 L57.4 47.2 L58.3 48.7 L58.8 50.4 L58.9 52.2 L58.7 54.1 L58.1 56.0 L57.0 57.8 L55.5 59.3 L53.7 60.6 L51.6 61.6 L49.2 62.1 L46.8 62.1 L44.3 61.5 L41.9 60.5 L39.6 58.9 L37.7 56.9 L36.2 54.5 L35.2 51.7 L34.8 48.7 L34.9 45.6 L35.8 42.6 L37.2 39.6 L39.3 37.0 L41.8 34.8 L44.9 33.1 L48.3 32.0 L51.9 31.7 L55.6 32.0 L59.3 33.2 L62.6 35.0 L65.7 37.6 L68.1 40.8 L70.0 44.4 L71.1 48.5 L71.3 52.7 L70.8 57.0 L69.3 61.1 L67.0 65.0 L63.9 68.4 L60.2 71.1 L55.9 73.1 L51.3 74.2 L46.4 74.3 L41.6 73.5 L36.9 71.7 L32.6 68.9 L28.9 65.3 L25.9 61.0 L23.9 56.1 L22.8 50.9 L22.8 45.4 L23.9 40.0 L26.1 34.8 L29.3 30.1 L33.4 26.1 L38.3 23.0 L43.8 20.8 L49.7 19.8 L55.7 20.0 L61.7 21.4 L67.3 23.9 L72.4 27.6 L76.7 32.3 L80.0 37.8 L82.2 43.9 L83.2 50.3 L82.8 57.0 L81.1 63.5 L78.1 69.6 L74.0 75.0 L68.7 79.5 L62.7 83.0 L56.0 85.2 L48.9 86.1 L41.7 85.5 L34.7 83.5 L28.1 80.1 L22.4 75.4 L17.6 69.6 L14.0 63.0 L11.8 55.6 L11.0 48.0 L11.9 40.2 L14.2 32.7 L18.1 25.8 L23.2 19.7 L29.6 14.6 L36.9 11.0 L44.8 8.8 L53.1 8.2 L61.4 9.3 L69.4 12.0 L76.7 16.3 L83.1 22.0 L88.3 28.9 L92.0 36.8 L94.2 45.4 L94.6 54.2 L93.2 63.0 L90.1 71.5 L85.3 79.2 L79.1 85.9 L71.6 91.3 L63.1 95.1 L54.0 97.1 L44.5 97.3 L35.2 95.7";

  var el = document.createElement("div");
  el.className = "hg-goblub";
  el.innerHTML = '<div class="bodywrap"><img class="main" src="' + IMG_WALK + '" alt="고브럽" draggable="false" />' +
    '<div class="hg-mouth"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#33373b"/>' +
    '<path fill="none" stroke="#22272d" stroke-width="8" stroke-linecap="round" d="' + SPIRAL_A + '"/>' +
    '<path fill="none" stroke="#5c646e" stroke-width="4" stroke-linecap="round" opacity=".85" d="' + SPIRAL_B + '"/></svg></div>' +
    '<div class="hg-orb"></div></div>';
  var shad = document.createElement("div");
  shad.className = "hg-shad";
  document.body.appendChild(shad);
  document.body.appendChild(el);
  var bod = el.querySelector(".bodywrap");
  var img = el.querySelector("img.main");

  // ===== 홈과 동일한 상수/상태 =====
  var WALK_SPEED = 200, RUN_SPEED = 1250;
  var WALK_W = 170, FRONT_W = 186;
  var MOUTH_FX = 0.593, MOUTH_FY = 0.539;
  var SAT = { w: 1376, h: 768, x: 1151, y: 150, r: 78 };
  function groundY() { return window.innerHeight * 0.94 - 75; }
  function centerX() { return (window.innerWidth - el.offsetWidth) / 2; }
  function saturnPos() {
    var W = window.innerWidth, H = window.innerHeight;
    var s = Math.max(W / SAT.w, H / SAT.h);
    return { x: (W - SAT.w * s) / 2 + SAT.x * s, y: H - SAT.h * s + SAT.y * s };
  }
  function setMouth(open) {
    var want = open ? IMG_FRONT : IMG_WALK;
    var w = open ? FRONT_W : WALK_W;
    if (img.src.indexOf(want.split("/").pop()) === -1) {
      x -= (w - el.offsetWidth) / 2;
      img.src = want;
    }
    el.style.width = w + "px";
    el.classList.toggle("front", !!open);
  }

  // 허브에서는 고브럽이 걷지 않는다 — 중앙에 서서 카드를 펼쳐 둔 채 대기(걷기는 홈에서만)
  var x = 0, dir = 1;
  var squashT = 0;
  var jumpT = 0, JUMP_DUR = 0.86; // 클릭하면 방방 두 번 뛴다

  // ===== 카드 부채꼴(홈 지오메트리) =====
  function targets(n) {
    var W = window.innerWidth, H = window.innerHeight;
    var cw = Math.min(204, W * 0.165), ch = Math.round(cw * 1.34);
    var span = Math.min(W * 0.80, 1100);
    var cy = H * 0.40, curve = H * 0.16;
    var out = [];
    for (var j = 0; j < n; j++) {
      var t = n === 1 ? 0 : j / (n - 1) - 0.5;
      out.push({ x: W / 2 + t * span - cw / 2, y: cy + t * t * 4 * curve - ch / 2, w: cw, h: ch, rot: t * 54 });
    }
    return out;
  }
  var anims = [];
  function dealFrom(mx, my) {
    anims = [];
    var tg = targets(cards.length);
    cards.forEach(function (k, i) {
      var g = tg[i];
      k.style.width = g.w + "px"; k.style.height = g.h + "px";
      k.style.zIndex = String(5 + i);
      k.style.pointerEvents = "none"; k.style.opacity = "0"; k.style.transition = "none";
      var t0 = Date.now() + 80 + i * 70;
      anims.push({
        el: k, x: mx - g.w / 2, y: my - g.h / 2,
        vx: (g.x + g.w / 2 - mx) * 3.3, vy: (g.y + g.h / 2 - my) * 3.3 - 620,
        rot: (Math.random() - 0.5) * 30, vr: (Math.random() - 0.5) * 560,
        rotF: g.rot, z: 5 + i, tx: g.x, ty: g.y, t0: t0, t1: t0 + 300,
        fx: 0, fy: 0, frot: 0, done: false
      });
      if (!k._hb) {
        k._hb = true;
        k.addEventListener("mouseenter", function () {
          if (!this._fin) return;
          this.style.zIndex = "99";
          this.style.transform = "translate(" + this._fin.x + "px," + (this._fin.y - 14) + "px) rotate(0deg) scale(1.06)";
        });
        k.addEventListener("mouseleave", function () {
          if (!this._fin) return;
          this.style.zIndex = this._fin.z;
          this.style.transform = "translate(" + this._fin.x + "px," + this._fin.y + "px) rotate(" + this._fin.rot + "deg)";
        });
      }
    });
  }

  // ===== 메인 루프 =====
  var last = Date.now(), booted = false;
  function tick(now, dt) {
    var W = window.innerWidth;
    x = centerX(); // 항상 화면 중앙(리사이즈에도 따라감)

    // 클릭 점프: 방방 두 번 튀고 착지할 때마다 살짝 눌린다
    var hop = 0, sx = 1, sy = 1;
    if (jumpT > 0) {
      jumpT -= dt;
      var u = 1 - jumpT / JUMP_DUR;                 // 0 → 1
      var arc = Math.abs(Math.sin(u * Math.PI * 2)); // 두 번의 산
      var decay = 1 - u * 0.45;                      // 두 번째는 낮게
      hop = arc * 46 * decay;
      if (u < 0.06) { sx = 1 + 0.18; sy = 1 - 0.18; }              // 웅크림
      else if (Math.abs(u - 0.5) < 0.05) { sx = 1 + 0.12; sy = 1 - 0.12; } // 중간 착지
      else if (u > 0.94) { sx = 1 + 0.1; sy = 1 - 0.1; }           // 마지막 착지
      else { sx = 1 - hop / 620; sy = 1 + hop / 520; }             // 공중에선 살짝 늘어남
      if (jumpT <= 0) { jumpT = 0; squashT = 0.22; }
    }
    var ph = now / 1000 * 7;
    var rock = Math.sin(now / 1000 * 1.4) * 1.2;
    var lean = 0, step = 0;
    var y = groundY() - el.offsetHeight - hop;
    if (squashT > 0) {
      squashT -= dt;
      var k2 = Math.sin((1 - squashT / 0.22) * Math.PI) * 0.16;
      sx = 1 + k2; sy = 1 - k2;
    }
    el.style.transform = "translate(" + x + "px, " + y + "px)";
    var face = 1;
    bod.style.transformOrigin = "50% 100%";
    bod.style.transform = "rotate(" + (rock + lean) + "deg) scaleX(" + (face * (sx + step)) + ") scaleY(" + (sy - step) + ")";

    // 행성 광원 그림자(홈과 동일 공식)
    var sat = saturnPos();
    var ccx = x + el.offsetWidth / 2;
    var dN = (ccx - sat.x) / W;
    var sw2 = 170 * (0.74 + Math.min(0.5, Math.abs(dN)) * 0.6) * (1 - hop / 40);
    var sh2 = sw2 * 0.17;
    shad.style.width = sw2 + "px"; shad.style.height = sh2 + "px";
    shad.style.opacity = String(0.94 - Math.min(0.3, Math.abs(dN) * 0.45) - hop / 30);
    var dC = Math.max(-0.6, Math.min(0.6, dN));
    shad.style.transform = "translate(" + (ccx + dC * 110 - sw2 / 2) + "px," + (groundY() - sh2 / 2 - 3) + "px)";

    // 카드 비행/착지
    for (var i = 0; i < anims.length; i++) {
      var p = anims[i];
      if (p.done || now < p.t0) continue;
      var kEl = p.el;
      kEl.style.opacity = "1";
      if (now < p.t1) {
        p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        var sc = 0.3 + 0.25 * (1 - (p.t1 - now) / 300);
        kEl.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.rot + "deg) scale(" + sc + ")";
        p.fx = p.x; p.fy = p.y; p.frot = p.rot;
      } else {
        var u = Math.min(1, (now - p.t1) / 440);
        var e = 1 + 2.6 * Math.pow(u - 1, 3) + 1.6 * Math.pow(u - 1, 2);
        var eb = 1 + 3.2 * Math.pow(u - 1, 3) + 2.2 * Math.pow(u - 1, 2);
        var eo = 1 - Math.pow(1 - u, 3);
        var xx = p.fx + (p.tx - p.fx) * eo, yy = p.fy + (p.ty - p.fy) * eo;
        var sc2 = Math.max(0.2, 0.5 + 0.5 * e);
        var rot2 = p.frot + (p.rotF - p.frot) * eb;
        kEl.style.transform = "translate(" + xx + "px," + yy + "px) rotate(" + rot2 + "deg) scale(" + sc2 + ")";
        if (u >= 1) {
          kEl.style.transform = "translate(" + p.tx + "px," + p.ty + "px) rotate(" + p.rotF + "deg)";
          kEl.style.transition = "transform .18s, box-shadow .15s";
          kEl.style.pointerEvents = "auto";
          kEl._fin = { x: p.tx, y: p.ty, rot: p.rotF, z: String(p.z) };
          p.done = true;
        }
      }
    }
  }
  function loop() {
    var now = Date.now();
    window.requestAnimationFrame(loop);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    try {
      tick(now, dt);
      if (!booted) { booted = true; el.style.visibility = "visible"; shad.style.visibility = "visible"; }
    } catch (e) {}
  }

  // ===== 클릭: 카드는 그대로 두고 고브럽만 방방 뛴다(허브에서는 카드가 사라지지 않음) =====
  el.addEventListener("click", function (e) {
    e.stopPropagation();
    if (jumpT > 0) return;
    jumpT = JUMP_DUR;
  });

  // ===== 시작: 중앙에서 이미 뱉어 둔 상태 =====
  setMouth(true);
  el.classList.add("orbon");
  x = (window.innerWidth - FRONT_W) / 2;
  var h0 = FRONT_W * 560 / 600; // front 이미지 비율로 초기 입 위치 계산(offsetHeight 로드 전 대비)
  dealFrom(x + FRONT_W * MOUTH_FX, groundY() - h0 + h0 * MOUTH_FY);
  window.requestAnimationFrame(loop);

  // 페이지를 떠날 때 걷던 위치를 남긴다(홈으로 돌아가면 같은 자리에서 이어 걷기)
  window.addEventListener("pagehide", function () {
    try { sessionStorage.setItem("goblub_walk", JSON.stringify({ x: x, dir: dir, t: Date.now() })); } catch (e) {}
  });

  // 리사이즈: 착지 카드 재배치
  window.addEventListener("resize", function () {
    var tg = targets(cards.length);
    cards.forEach(function (k, i) {
      if (!k._fin) return;
      var g = tg[i];
      k.style.width = g.w + "px"; k.style.height = g.h + "px";
      k._fin = { x: g.x, y: g.y, rot: g.rot, z: String(5 + i) };
      k.style.transform = "translate(" + g.x + "px," + g.y + "px) rotate(" + g.rot + "deg)";
    });
  });
})();
