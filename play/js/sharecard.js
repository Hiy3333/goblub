// 공용 결과 짤 카드 — Canvas 720x1280(9:16, 인스타 스토리 비율) PNG. ShareCard.render(spec) → 미리보기+저장버튼 DOM.
// spec = { palette, emoji, badge, title, lines:[...], footer }
// 미드나잇 시티팝 네온 룩: 야경 그라데이션 + 레트로 선 + 네온 프레임/글로우 + 시티 스카이라인.
(function () {
  var PALETTE = { coral: "#ff6ec7", yellow: "#ffd93d", mint: "#6bffa0", sky: "#4deeea", purple: "#9d6bff", cream: "#ff6ec7" };

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

  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function draw(canvas, spec) {
    var c = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    var neon = PALETTE[spec.palette] || PALETTE.purple;

    // 야경 그라데이션 배경
    var grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0d0a2b"); grd.addColorStop(0.45, "#1c1250"); grd.addColorStop(1, "#45227a");
    c.fillStyle = grd; c.fillRect(0, 0, W, H);

    // 레트로 선(줄무늬 태양) — 이모지 뒤 장식
    c.save();
    c.beginPath(); c.arc(W / 2, 400, 170, 0, Math.PI * 2); c.clip();
    var sun = c.createLinearGradient(0, 230, 0, 570);
    sun.addColorStop(0, "#ffd93d"); sun.addColorStop(0.4, "#ff9a5a"); sun.addColorStop(0.75, "#ff6ec7"); sun.addColorStop(1, "#c85cff");
    c.globalAlpha = 0.55; c.fillStyle = sun; c.fillRect(W / 2 - 170, 230, 340, 340);
    c.globalAlpha = 1; c.fillStyle = "#151040";
    for (var s = 0; s < 5; s++) c.fillRect(W / 2 - 170, 380 + s * 34, 340, 10 + s * 2);
    c.restore();

    // 시티 스카이라인
    c.fillStyle = "#0a0620";
    [[0, 1150, 90, 130], [110, 1120, 70, 160], [200, 1160, 80, 120], [300, 1100, 65, 180], [385, 1140, 95, 140],
     [500, 1110, 70, 170], [590, 1155, 80, 125], [685, 1125, 60, 155]].forEach(function (b) { c.fillRect(b[0], b[1], b[2], b[3]); });
    var win = ["#ffd93d", "#ff6ec7", "#4deeea"];
    [[30, 1175], [135, 1150], [230, 1185], [325, 1130], [420, 1165], [525, 1140], [615, 1180], [705, 1155],
     [60, 1210], [160, 1190], [350, 1170], [550, 1185]].forEach(function (p, i) {
      c.fillStyle = win[i % 3]; c.globalAlpha = 0.85; c.fillRect(p[0], p[1], 7, 7); c.globalAlpha = 1;
    });

    // 네온 프레임
    c.save(); c.shadowColor = neon; c.shadowBlur = 24; c.strokeStyle = neon; c.lineWidth = 5;
    roundRect(c, 28, 28, W - 56, H - 56, 32); c.stroke(); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.5;
    roundRect(c, 28, 28, W - 56, H - 56, 32); c.stroke();

    // 반짝이 장식
    c.fillStyle = "#ffd93d"; c.font = "30px sans-serif"; c.textAlign = "center";
    c.save(); c.shadowColor = "#ffd93d"; c.shadowBlur = 14;
    c.fillText("✦", 96, 200); c.fillText("✦", W - 90, 620); c.fillText("✧", W - 120, 160); c.fillText("✧", 110, 660);
    c.restore();

    // 상단 네온 pill 배지
    var badge = spec.badge || "goblub 판정 결과";
    c.font = "30px Jua, sans-serif";
    var bw = c.measureText(badge).width + 56;
    c.save(); c.shadowColor = neon; c.shadowBlur = 16; c.strokeStyle = neon; c.lineWidth = 3;
    roundRect(c, (W - bw) / 2, 96, bw, 62, 31); c.stroke(); c.restore();
    c.fillStyle = "#fff";
    c.save(); c.shadowColor = neon; c.shadowBlur = 10; c.fillText(badge, W / 2, 138); c.restore();

    // 이모지 (레트로 선 위)
    c.font = "150px sans-serif";
    c.save(); c.shadowColor = neon; c.shadowBlur = 30; c.fillText(spec.emoji || "👾", W / 2, 455); c.restore();

    // 타이틀 — 네온사인
    c.font = "58px Jua, sans-serif"; c.fillStyle = "#ffffff";
    c.save(); c.shadowColor = neon; c.shadowBlur = 26;
    c.fillText(spec.title || "", W / 2, 590); c.fillText(spec.title || "", W / 2, 590);
    c.restore();

    // 본문/해시태그 — #으로 시작하는 줄은 네온색으로
    var yy = 690;
    (spec.lines || []).forEach(function (ln) {
      if (/^#/.test(ln)) {
        c.font = "30px Jua, sans-serif"; c.fillStyle = neon;
        c.save(); c.shadowColor = neon; c.shadowBlur = 12;
        yy = wrapText(c, ln, W / 2, yy, W - 150, 46) + 58;
        c.restore();
      } else {
        c.font = "30px Jua, sans-serif"; c.fillStyle = "#cdbdf6";
        yy = wrapText(c, ln, W / 2, yy, W - 150, 46) + 58;
      }
    });

    // 하단 CTA
    c.font = "26px Jua, sans-serif"; c.fillStyle = "#b9a8e8";
    c.fillText(spec.footer || "🌃 goblub · 대환장 놀이터", W / 2, H - 116);
    c.font = "28px Jua, sans-serif"; c.fillStyle = "#4deeea";
    c.save(); c.shadowColor = "#4deeea"; c.shadowBlur = 12;
    c.fillText("나도 해보기 ▶ goblub-2.vercel.app", W / 2, H - 72);
    c.restore();
    c.textAlign = "center";
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
    canvas.width = 720; canvas.height = 1280;
    canvas.style.cssText = "width:100%; max-width:260px; border-radius:16px; display:block; margin:0 auto;";
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
