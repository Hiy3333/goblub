// 공용 결과 짤 카드 — Canvas 720x1280(9:16, 인스타 스토리 비율) PNG. ShareCard.render(spec) → 미리보기+저장버튼 DOM.
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
    c.fillStyle = bg; c.fillRect(0, 0, W, 300);
    c.textAlign = "center";
    c.fillStyle = "#ffffff"; c.font = "34px Jua, sans-serif";
    c.fillText(spec.badge || "", W / 2, 168);
    c.font = "160px sans-serif"; c.fillText(spec.emoji || "👾", W / 2, 560);
    c.fillStyle = "#38352f"; c.font = "54px Jua, sans-serif";
    c.fillText(spec.title || "", W / 2, 680);
    c.fillStyle = "#7a766d"; c.font = "30px Jua, sans-serif";
    var yy = 770;
    (spec.lines || []).forEach(function (ln) { yy = wrapText(c, ln, W / 2, yy, W - 130, 46) + 56; });
    c.fillStyle = "#b0a99a"; c.font = "24px Jua, sans-serif";
    c.fillText(spec.footer || "goblub · 대환장 테스트", W / 2, H - 60);
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
