// 공용 결과 짤 카드 — Canvas 720x1280(9:16, 인스타 스토리 비율) PNG. ShareCard.render(spec) → 미리보기+저장버튼 DOM.
// spec = { palette, emoji, badge, title, lines:[...], footer }
// 리퀴드 글래스 룩: 라이트 파스텔 그라데이션 배경 + 유리 패널 + 사이트 공용 포인트 컬러.
(function () {
  var PALETTE = { coral: "#ff5a76", yellow: "#f5a623", mint: "#35c98a", sky: "#3a8bff", purple: "#8f5bff", orange: "#ff8a3d", cream: "#ff5a76" };
  var INK = "#2b3057", INK_SOFT = "#7079a8", INK_BODY = "#4a5180";

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

  function blob(c, x, y, r, color, alpha) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)");
    c.save(); c.globalAlpha = alpha; c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }

  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function draw(canvas, spec) {
    var c = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    var accent = PALETTE[spec.palette] || PALETTE.purple;

    // 라이트 파스텔 배경 (사이트 body와 동일 톤)
    var grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#f7f8fc"); grd.addColorStop(0.55, "#f0f2f9"); grd.addColorStop(1, "#e9ecf7");
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
    blob(c, 90, 60, 420, "rgba(255,110,145,0.55)", 0.30);
    blob(c, W - 60, 180, 460, "rgba(70,135,255,0.55)", 0.30);
    blob(c, 180, H * 0.55, 380, "rgba(255,190,90,0.5)", 0.22);
    blob(c, W - 110, H - 120, 480, "rgba(150,96,255,0.55)", 0.28);
    blob(c, W / 2, 400, 300, hexToRgba(accent, 0.5), 0.22);

    // 유리 패널 (부드러운 그림자 + 흰 림 라이트)
    c.save();
    c.shadowColor = "rgba(96,106,155,0.30)"; c.shadowBlur = 44; c.shadowOffsetY = 18;
    c.fillStyle = "rgba(255,255,255,0.46)";
    roundRect(c, 48, 60, W - 96, H - 120, 40); c.fill();
    c.restore();
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 2.5;
    roundRect(c, 48, 60, W - 96, H - 120, 40); c.stroke();
    c.strokeStyle = "rgba(122,134,195,0.22)"; c.lineWidth = 1;
    roundRect(c, 52, 64, W - 104, H - 128, 37); c.stroke();
    // 상단 유리 글린트
    var glint = c.createLinearGradient(0, 60, 0, 220);
    glint.addColorStop(0, "rgba(255,255,255,0.55)"); glint.addColorStop(1, "rgba(255,255,255,0)");
    c.save(); roundRect(c, 48, 60, W - 96, 160, 40); c.clip();
    c.fillStyle = glint; c.fillRect(48, 60, W - 96, 160); c.restore();

    // 반짝이 장식 (포인트 컬러, 은은하게)
    c.font = "30px sans-serif"; c.textAlign = "center";
    c.globalAlpha = 0.7; c.fillStyle = "#f5a623";
    c.fillText("✦", 110, 218); c.fillText("✧", W - 120, 176);
    c.fillStyle = accent;
    c.fillText("✧", 126, 660); c.fillText("✦", W - 104, 620);
    c.globalAlpha = 1;

    // 상단 유리 pill 배지
    var badge = spec.badge || "goblub 판정 결과";
    c.font = "30px Jua, sans-serif";
    var bw = c.measureText(badge).width + 56;
    c.fillStyle = "rgba(255,255,255,0.72)";
    roundRect(c, (W - bw) / 2, 108, bw, 62, 31); c.fill();
    c.strokeStyle = hexToRgba(accent, 0.55); c.lineWidth = 2.5;
    roundRect(c, (W - bw) / 2, 108, bw, 62, 31); c.stroke();
    c.fillStyle = accent; c.fillText(badge, W / 2, 150);

    // 이모지 — 뒤에 파스텔 헤일로
    blob(c, W / 2, 400, 190, hexToRgba(accent, 0.55), 0.30);
    c.beginPath(); c.arc(W / 2, 400, 128, 0, Math.PI * 2);
    c.fillStyle = "rgba(255,255,255,0.55)"; c.fill();
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 2; c.stroke();
    c.font = "130px sans-serif"; c.fillStyle = INK;
    c.fillText(spec.emoji || "👾", W / 2, 448);

    // 타이틀 + 포인트 언더라인
    c.font = "58px Jua, sans-serif"; c.fillStyle = INK;
    c.fillText(spec.title || "", W / 2, 610);
    c.fillStyle = hexToRgba(accent, 0.9);
    roundRect(c, W / 2 - 46, 634, 92, 9, 5); c.fill();

    // 본문 — #으로 시작하는 줄은 포인트 컬러로
    var yy = 712;
    (spec.lines || []).forEach(function (ln) {
      c.font = "30px Jua, sans-serif";
      c.fillStyle = /^#/.test(ln) ? accent : INK_BODY;
      yy = wrapText(c, ln, W / 2, yy, W - 170, 46) + 58;
    });

    // 하단 CTA
    c.font = "26px Jua, sans-serif"; c.fillStyle = INK_SOFT;
    c.fillText(spec.footer || "goblub · 대환장 놀이터", W / 2, H - 148);
    c.font = "28px Jua, sans-serif"; c.fillStyle = PALETTE.sky;
    c.fillText("나도 해보기 ▶ goblub-2.vercel.app", W / 2, H - 104);
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
    var btn = document.createElement("button"); btn.className = "btn-primary";
    btn.textContent = window.GoblubI18n ? GoblubI18n.t("🖼 결과 짤 저장") : "🖼 결과 짤 저장";
    btn.onclick = function () { save(canvas, spec.title || "goblub"); };
    actions.appendChild(btn);
    wrap.appendChild(canvas); wrap.appendChild(actions);
    return wrap;
  }

  window.ShareCard = { render: render };
})();
