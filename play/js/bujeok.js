// 귀곡의 부적 — 캔버스 렌더 + 인장(印章) 데이터 격자 인코딩/디코딩.
// 인장은 도장처럼 보이지만 8×8 격자에 생년월일시·성별이 비트로 새겨져 있어
// 부적 이미지를 업로드하면 사주를 복원할 수 있다(명부 대조용).
// window.BujeokSeal = { encode, decode(imgOrCanvas, cb) }
// window.BujeokArt = { render(canvas, opts, onDone) }  opts={birth, elemKo, pillarsHj[], strengthLabel}
(function () {
  var GAN_HJ = "甲乙丙丁戊己庚辛壬癸";
  var JI_HJ = "子丑寅卯辰巳午未申酉戌亥";
  var GAN_KO = "갑을병정무기경신임계";
  var JI_KO = "자축인묘진사오미신유술해";
  var ELEM = {
    "목": { hj: "木", bg: "wood",  ko: "목", desc: "자라나는 나무의 기운" },
    "화": { hj: "火", bg: "fire",  ko: "화", desc: "타오르는 불의 기운" },
    "토": { hj: "土", bg: "earth", ko: "토", desc: "받쳐주는 땅의 기운" },
    "금": { hj: "金", bg: "metal", ko: "금", desc: "벼려진 쇠의 기운" },
    "수": { hj: "水", bg: "water", ko: "수", desc: "흐르는 물의 기운" }
  };
  var W = 720, H = 1280;
  // 인장 격자 위치(비율 고정 — 업로드 이미지를 720×1280으로 늘려 읽는다)
  var SEAL = { cx: 0.5, cy: 0.852, frac: 0.27 }; // 한 변 = W*frac
  var MAGIC = 0xB2, MAGIC_INV = 0x4D;

  function crc8(bytes) {
    var c = 0;
    for (var i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (var b = 0; b < 8; b++) c = (c & 0x80) ? ((c << 1) ^ 0x07) & 0xFF : (c << 1) & 0xFF;
    }
    return c;
  }

  // birth {y,m,d,hour(null허용),min,gender} → 64bit 배열
  function encode(birth) {
    var ver = 1;
    var y = Math.max(0, Math.min(255, (birth.y || 1990) - 1900));
    var m = birth.m || 1, d = birth.d || 1;
    var h = birth.hour == null ? 0 : (birth.hour + 1); // 0=모름
    var mi = birth.hour == null ? 0 : (birth.min || 0);
    var g = birth.gender === "M" ? 1 : birth.gender === "F" ? 2 : 0;
    // 32비트 payload: ver2 y8 m4 d5 h5 mi6 g2
    var p = [];
    function push(v, n) { for (var i = n - 1; i >= 0; i--) p.push((v >> i) & 1); }
    push(ver, 2); push(y, 8); push(m, 4); push(d, 5); push(h, 5); push(mi, 6); push(g, 2);
    var payloadBytes = [];
    for (var i = 0; i < 4; i++) {
      var by = 0;
      for (var b = 0; b < 8; b++) by = (by << 1) | p[i * 8 + b];
      payloadBytes.push(by);
    }
    var reserved = 0x00;
    var crc = crc8(payloadBytes.concat([reserved]));
    var bytes = [MAGIC].concat(payloadBytes, [reserved, crc, MAGIC_INV]); // 8바이트 = 64비트
    var bits = [];
    bytes.forEach(function (by) { for (var b = 7; b >= 0; b--) bits.push((by >> b) & 1); });
    return bits;
  }

  function bitsToBirth(bits) {
    var bytes = [];
    for (var i = 0; i < 8; i++) {
      var by = 0;
      for (var b = 0; b < 8; b++) by = (by << 1) | bits[i * 8 + b];
      bytes.push(by);
    }
    if (bytes[0] !== MAGIC || bytes[7] !== MAGIC_INV) return null;
    if (crc8(bytes.slice(1, 6)) !== bytes[6]) return null;
    var p = [];
    bytes.slice(1, 5).forEach(function (by) { for (var b = 7; b >= 0; b--) p.push((by >> b) & 1); });
    var pos = 0;
    function take(n) { var v = 0; for (var i = 0; i < n; i++) v = (v << 1) | p[pos++]; return v; }
    var ver = take(2); if (ver !== 1) return null;
    var y = take(8) + 1900, m = take(4), d = take(5), h = take(5), mi = take(6), g = take(2);
    if (m < 1 || m > 12 || d < 1 || d > 31 || h > 24 || mi > 59) return null;
    return { y: y, m: m, d: d, hour: h === 0 ? null : h - 1, min: h === 0 ? 0 : mi, gender: g === 1 ? "M" : g === 2 ? "F" : "" };
  }

  function sealRect(w, h) {
    var size = w * SEAL.frac;
    return { x: w * SEAL.cx - size / 2, y: h * SEAL.cy - size / 2, size: size };
  }

  function drawSeal(g, w, h, bits) {
    var r = sealRect(w, h), s = r.size, cell = s / 8;
    // 도장 몸체(테두리 + 여백)
    var pad = cell * 0.55;
    g.save();
    g.shadowColor = "rgba(120,10,10,.5)"; g.shadowBlur = 18;
    g.fillStyle = "#8f1d12";
    rr(g, r.x - pad, r.y - pad, s + pad * 2, s + pad * 2, cell * 0.5); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = "#240a06";
    rr(g, r.x - pad * 0.45, r.y - pad * 0.45, s + pad * 0.9, s + pad * 0.9, cell * 0.35); g.fill();
    // 데이터 셀
    for (var i = 0; i < 64; i++) {
      var cx = i % 8, cy = Math.floor(i / 8);
      g.fillStyle = bits[i] ? "#ef4f2b" : "#240a06";
      g.fillRect(r.x + cx * cell + 0.6, r.y + cy * cell + 0.6, cell - 1.2, cell - 1.2);
    }
    g.restore();
  }

  function rr(g, x, y, w2, h2, rad) {
    g.beginPath(); g.moveTo(x + rad, y);
    g.arcTo(x + w2, y, x + w2, y + h2, rad); g.arcTo(x + w2, y + h2, x, y + h2, rad);
    g.arcTo(x, y + h2, x, y, rad); g.arcTo(x, y, x + w2, y, rad); g.closePath();
  }

  // 업로드 이미지에서 인장 읽기 — 720×1280으로 늘려 셀 중심 샘플링
  function decode(img, cb) {
    try {
      var c = document.createElement("canvas"); c.width = W; c.height = H;
      var g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, W, H);
      var r = sealRect(W, H), cell = r.size / 8;
      var vals = [];
      for (var i = 0; i < 64; i++) {
        var cx = r.x + (i % 8) * cell + cell / 2, cy = r.y + Math.floor(i / 8) * cell + cell / 2;
        var d = g.getImageData(Math.round(cx - 2), Math.round(cy - 2), 5, 5).data;
        var sum = 0;
        for (var p = 0; p < d.length; p += 4) sum += d[p] * 2 + d[p + 1] + d[p + 2]; // 붉은 강조 가중
        vals.push(sum / (d.length / 4));
      }
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), th = (mn + mx) / 2;
      if (mx - mn < 60) { cb(null); return; } // 대비 부족 = 인장 아님
      var bits = vals.map(function (v) { return v > th ? 1 : 0; });
      cb(bitsToBirth(bits));
    } catch (e) { cb(null); }
  }

  // ===== 부적 본체 렌더 =====
  // opts = { birth, elemKo("목"...), pillars [{gan,ji}] year..hour 순, genderLabel }
  function render(canvas, opts, onDone) {
    var el = ELEM[opts.elemKo] || ELEM["토"];
    canvas.width = W; canvas.height = H;
    var g = canvas.getContext("2d");
    var bg = new Image();
    bg.onload = function () { paint(); };
    bg.onerror = function () { paint(true); };
    bg.src = "img/bujeok/bg_" + el.bg + ".webp";

    function paint(noBg) {
      if (noBg) { g.fillStyle = "#d9c184"; g.fillRect(0, 0, W, H); }
      else g.drawImage(bg, 0, 0, W, H);
      var SERIF = "'Nanum Myeongjo','Batang','AppleMyungjo',serif";
      g.textAlign = "center";

      // 제목
      g.fillStyle = "#8f1d12";
      g.font = "700 44px " + SERIF;
      g.fillText("開 運 符", W / 2, 218);
      g.font = "24px " + SERIF;
      g.fillStyle = "rgba(120,30,18,.85)";
      g.fillText("귀 곡 개 운 부", W / 2, 258);

      // 중앙 대형 오행 한자
      g.save();
      g.shadowColor = "rgba(140,20,10,.35)"; g.shadowBlur = 26;
      g.fillStyle = "#a11616";
      g.font = "700 235px " + SERIF;
      g.fillText(el.hj, W / 2, 585);
      g.restore();
      g.font = "28px " + SERIF; g.fillStyle = "#6d1a10";
      g.fillText("너의 운을 여는 기운 · " + el.ko + "(" + el.hj + ") — " + el.desc, W / 2, 650);

      // 사주 4주 세로 한자 (전통식 우→좌: 년월일시)
      var cols = [];
      var order = ["year", "month", "day", "hour"];
      var labels = { year: "年", month: "月", day: "日", hour: "時" };
      order.forEach(function (k) { if (opts.pillars[k]) cols.push({ k: k, p: opts.pillars[k] }); });
      var span = 118, x0 = W / 2 + ((cols.length - 1) * span) / 2;
      cols.forEach(function (c, i) {
        var x = x0 - i * span;
        g.fillStyle = "rgba(110,26,14,.75)"; g.font = "26px " + SERIF;
        g.fillText(labels[c.k], x, 742);
        g.fillStyle = "#7a1010"; g.font = "700 62px " + SERIF;
        g.fillText(GAN_HJ[c.p.gan], x, 816);
        g.fillText(JI_HJ[c.p.ji], x, 886);
        g.font = "20px " + SERIF; g.fillStyle = "rgba(110,26,14,.7)";
        g.fillText(GAN_KO[c.p.gan] + JI_KO[c.p.ji], x, 916);
      });

      // 생년 정보 한 줄
      var b = opts.birth;
      var gTxt = b.gender === "M" ? " 乾命" : b.gender === "F" ? " 坤命" : "";
      var hTxt = b.hour == null ? "" : " " + b.hour + "時 " + (b.min || 0) + "分";
      g.font = "24px " + SERIF; g.fillStyle = "rgba(100,24,14,.8)";
      g.fillText(b.y + "年 " + b.m + "月 " + b.d + "日" + hTxt + gTxt, W / 2, 972);

      // 인장(데이터 격자)
      drawSeal(g, W, H, encode(b));
      g.font = "22px " + SERIF; g.fillStyle = "rgba(110,26,14,.85)";
      g.fillText("鬼 哭 之 印", W / 2, H - 46);

      if (onDone) onDone();
    }
  }

  window.BujeokSeal = { encode: encode, decode: decode };
  window.BujeokArt = { render: render, ELEM: ELEM };
})();
