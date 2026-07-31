// 허브 페이지 카드 등장 연출
// 데스크톱: 홈에서 고브럽이 카드 뱉는 것과 동일한 부채꼴 촤라락(크기·위치·기울기·물리 동일)
// 모바일: 기존 뽕뽕 순차 팝
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

  document.body.classList.add("fanmode");

  // 홈과 동일한 부채꼴 지오메트리
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
  function deal() {
    var tg = targets(cards.length);
    var ox = window.innerWidth / 2, oy = window.innerHeight * 0.82; // 아래 중앙에서 촤라락
    cards.forEach(function (k, i) {
      var g = tg[i];
      k.style.width = g.w + "px"; k.style.height = g.h + "px";
      k.style.zIndex = String(5 + i);
      k.style.pointerEvents = "none"; k.style.opacity = "0"; k.style.transition = "none";
      var t0 = Date.now() + 80 + i * 70;
      anims.push({
        el: k, x: ox - g.w / 2, y: oy - g.h / 2,
        vx: (g.x + g.w / 2 - ox) * 3.3, vy: (g.y + g.h / 2 - oy) * 3.3 - 620,
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

  var last = Date.now();
  function loop() {
    var now = Date.now();
    window.requestAnimationFrame(loop);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
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

  deal();
  window.requestAnimationFrame(loop);

  // 리사이즈 시 최종 위치만 재배치
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
