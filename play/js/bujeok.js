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
  var SEAL = { cx: 0.5, cy: 0.888, frac: 0.21 }; // 한 변 = W*frac
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

  // 구버전 부적(인장 위치가 달랐음)도 계속 읽히도록 후보로 보관
  var SEAL_LEGACY = [{ cx: 0.5, cy: 0.852, frac: 0.27 }];
  function sealRect(w, h, sp) {
    sp = sp || SEAL;
    var size = w * sp.frac;
    return { x: w * sp.cx - size / 2, y: h * sp.cy - size / 2, size: size };
  }

  function drawSeal(g, w, h, bits) {
    var r = sealRect(w, h), s = r.size, cell = s / 8;
    // 전각(篆刻) 인장 — 붉은 인주 테두리 + 안쪽에 새겨진 문양(실은 명(命) 데이터)
    var pad = cell * 0.95;
    g.save();
    g.shadowColor = "rgba(140,20,10,.5)"; g.shadowBlur = 20;
    g.fillStyle = "#a81f14";
    rr(g, r.x - pad, r.y - pad, s + pad * 2, s + pad * 2, cell * 0.6); g.fill();
    g.shadowBlur = 0;
    // 인장 안쪽 테두리선(전각 특유의 굵은 변)
    g.strokeStyle = "rgba(255,215,190,.35)"; g.lineWidth = Math.max(1, cell * 0.13);
    rr(g, r.x - pad * 0.5, r.y - pad * 0.5, s + pad, s + pad, cell * 0.45); g.stroke();
    // 새김 바탕
    g.fillStyle = "#2e0a06";
    rr(g, r.x - pad * 0.22, r.y - pad * 0.22, s + pad * 0.44, s + pad * 0.44, cell * 0.32); g.fill();
    // 문양 셀(둥근 획 — 격자 느낌을 줄인다)
    for (var i = 0; i < 64; i++) {
      var cx = i % 8, cy = Math.floor(i / 8);
      if (!bits[i]) continue;
      g.fillStyle = "#ff5f33";
      rr(g, r.x + cx * cell + cell * 0.11, r.y + cy * cell + cell * 0.11,
         cell * 0.78, cell * 0.78, cell * 0.24);
      g.fill();
    }
    g.restore();
  }

  function rr(g, x, y, w2, h2, rad) {
    g.beginPath(); g.moveTo(x + rad, y);
    g.arcTo(x + w2, y, x + w2, y + h2, rad); g.arcTo(x + w2, y + h2, x, y + h2, rad);
    g.arcTo(x, y + h2, x, y, rad); g.arcTo(x, y, x + w2, y, rad); g.closePath();
  }

  // 업로드 이미지에서 인장 읽기 — 720×1280으로 늘려 셀 중심 샘플링
  // 현재 인장 위치를 먼저 시도하고, 실패하면 구버전 위치도 시도(예전 부적 호환)
  function decode(img, cb) {
    try {
      var c = document.createElement("canvas"); c.width = W; c.height = H;
      var g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, W, H);
      var cands = [SEAL].concat(SEAL_LEGACY);
      for (var s = 0; s < cands.length; s++) {
        var r = sealRect(W, H, cands[s]), cell = r.size / 8, vals = [];
        for (var i = 0; i < 64; i++) {
          var cx = r.x + (i % 8) * cell + cell / 2, cy = r.y + Math.floor(i / 8) * cell + cell / 2;
          var d = g.getImageData(Math.round(cx - 2), Math.round(cy - 2), 5, 5).data;
          var sum = 0;
          for (var p = 0; p < d.length; p += 4) sum += d[p] * 2 + d[p + 1] + d[p + 2]; // 붉은 강조 가중
          vals.push(sum / (d.length / 4));
        }
        var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
        if (mx - mn < 60) continue;                       // 대비 부족 = 인장 아님
        var th = (mn + mx) / 2;
        var got = bitsToBirth(vals.map(function (v) { return v > th ? 1 : 0; }));
        if (got) { cb(got); return; }
      }
      cb(null);
    } catch (e) { cb(null); }
  }

  // ===== 부적 본체 렌더 =====
  // opts = { birth, name, elemKo, use[], avoid[], oheng{}, pillars{year..hour:{gan,ji}}, ilgan, strength, sinsal[] }
  var OH_KEYS = ["목", "화", "토", "금", "수"];
  var OH_HJ2 = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
  var OH_RGB = { 목: [74, 140, 96], 화: [178, 45, 45], 토: [166, 122, 52], 금: [110, 118, 140], 수: [56, 92, 150] };
  // 괴황지 위 글자용 — 배경과 대비가 서도록 더 진한 먹색 계열
  var OH_INK = { 목: [26, 84, 46], 화: [146, 22, 22], 토: [104, 66, 14], 금: [56, 64, 88], 수: [22, 52, 104] };
  var GAN_OH2 = "목목화화토토금금수수";   // 갑을병정무기경신임계
  var SS_MARK = [
    [/도화/, "桃花", "끄는 힘"], [/역마/, "驛馬", "움직임"], [/화개/, "華蓋", "홀로 깊음"],
    [/천을귀인/, "天乙", "귀인"], [/양인/, "羊刃", "칼날"], [/괴강/, "魁罡", "우두머리"], [/백호/, "白虎", "맹렬함"]
  ];

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
      var INK = "#7a1010", INK_S = "rgba(110,26,14,.78)";
      g.textAlign = "center";

      // ── 상단: 敕令(칙령) — 전통 부적의 머리 ──
      g.fillStyle = "#8f1d12"; g.font = "700 46px " + SERIF;
      g.fillText("敕  令", W / 2, 150);
      g.strokeStyle = "rgba(140,30,18,.55)"; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(150, 172); g.lineTo(W - 150, 172); g.stroke();

      // 이름 + 부적 이름(일간 기준)
      var ilOh = GAN_OH2[opts.ilgan] || "토";
      var ilTxt = GAN_HJ[opts.ilgan] + OH_HJ2[ilOh];
      g.font = "27px " + SERIF; g.fillStyle = INK_S;
      g.fillText((opts.name ? opts.name + " 의 " : "") + "開 運 符", W / 2, 213);
      g.font = "22px " + SERIF; g.fillStyle = "rgba(110,26,14,.62)";
      g.fillText(ilTxt + "(" + GAN_KO[opts.ilgan] + ilOh + ") 일간 · " + (opts.strength || ""), W / 2, 248);

      // ── 중앙: 오행 상생상극 원환 (사람마다 모양이 달라진다) ──
      var cx = W / 2, cy = 500, R = 168;
      var oh = opts.oheng || {}, maxV = 0.001;
      OH_KEYS.forEach(function (k) { if ((oh[k] || 0) > maxV) maxV = oh[k]; });
      var pos = OH_KEYS.map(function (k, i) {
        var a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        return { k: k, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
      });
      // 상극(내부 오각별) — 옅은 파선
      g.save();
      g.strokeStyle = "rgba(120,30,18,.28)"; g.lineWidth = 1.6; g.setLineDash([7, 6]);
      for (var i2 = 0; i2 < 5; i2++) {
        g.beginPath(); g.moveTo(pos[i2].x, pos[i2].y);
        g.lineTo(pos[(i2 + 2) % 5].x, pos[(i2 + 2) % 5].y); g.stroke();
      }
      g.restore();
      // 상생(외곽 오각형) — 실선
      g.strokeStyle = "rgba(140,30,18,.5)"; g.lineWidth = 2.2;
      g.beginPath();
      pos.forEach(function (p, i) { i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); });
      g.closePath(); g.stroke();

      // 각 오행 마디 — 크기 = 그 기운의 양(사람마다 다름)
      var use = opts.use || [], avoid = opts.avoid || [];
      pos.forEach(function (p) {
        var v = oh[p.k] || 0;
        var rad = v === 0 ? 20 : 24 + (v / maxV) * 26;
        var c = OH_RGB[p.k];
        var isUse = use.indexOf(p.k) >= 0, isAvoid = avoid.indexOf(p.k) >= 0;
        g.save();
        if (isUse) { g.shadowColor = "rgba(" + c.join(",") + ",.95)"; g.shadowBlur = 26; }
        g.beginPath(); g.arc(p.x, p.y, rad, 0, Math.PI * 2);
        if (v === 0) {                        // 없는 기운 — 비어 있는 자리
          g.setLineDash([5, 5]); g.strokeStyle = "rgba(110,26,14,.5)"; g.lineWidth = 2; g.stroke();
        } else {
          g.fillStyle = "rgba(" + c.join(",") + ",.9)"; g.fill();
          g.setLineDash([]); g.strokeStyle = "rgba(255,240,225,.5)"; g.lineWidth = 2; g.stroke();
        }
        g.restore();
        // 용신은 이중 원, 기신은 가로줄
        if (isUse) {
          g.strokeStyle = "rgba(" + c.join(",") + ",.75)"; g.lineWidth = 2;
          g.beginPath(); g.arc(p.x, p.y, rad + 9, 0, Math.PI * 2); g.stroke();
        }
        if (isAvoid) {
          g.strokeStyle = "rgba(120,20,10,.8)"; g.lineWidth = 3;
          g.beginPath(); g.moveTo(p.x - rad * .62, p.y); g.lineTo(p.x + rad * .62, p.y); g.stroke();
        }
        g.fillStyle = v === 0 ? "rgba(110,26,14,.65)" : "#fff6ee";
        g.font = "700 " + Math.round(rad * 0.92) + "px " + SERIF;
        g.fillText(OH_HJ2[p.k], p.x, p.y + rad * 0.33);
        g.font = "700 17px " + SERIF;
        g.fillStyle = "rgb(" + OH_INK[p.k].join(",") + ")";
        g.fillText(p.k + " " + (Math.round(v * 10) / 10), p.x, p.y + rad + 24);
      });

      // 원환 중심 — 나 자신(일간)
      g.save();
      g.shadowColor = "rgba(140,20,10,.45)"; g.shadowBlur = 30;
      g.fillStyle = "#a11616"; g.font = "700 128px " + SERIF;
      g.fillText(GAN_HJ[opts.ilgan], cx, cy + 34);
      g.restore();
      g.font = "19px " + SERIF; g.fillStyle = INK_S;
      g.fillText("我", cx, cy - 62);

      // ── 사주 원국 (전통 우→좌: 時日月年) ──
      var order = ["hour", "day", "month", "year"];
      var labels = { year: "年", month: "月", day: "日", hour: "時" };
      var cols = order.filter(function (k) { return opts.pillars[k]; });
      var span = 116, x0 = W / 2 - ((cols.length - 1) * span) / 2, yTop = 762;
      g.strokeStyle = "rgba(140,30,18,.3)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(110, yTop - 34); g.lineTo(W - 110, yTop - 34); g.stroke();
      cols.forEach(function (k, i) {
        var p = opts.pillars[k], x = x0 + i * span, isDay = (k === "day");
        g.fillStyle = "rgba(110,26,14,.7)"; g.font = "23px " + SERIF;
        g.fillText(labels[k], x, yTop);
        if (isDay) {  // 일주는 붉은 테를 둘러 강조
          g.strokeStyle = "rgba(160,25,20,.55)"; g.lineWidth = 2;
          rr(g, x - 47, yTop + 12, 94, 132, 12); g.stroke();
        }
        var go = GAN_OH2[p.gan], jo = jiOh(p.ji);
        g.font = "700 58px " + SERIF;
        g.lineWidth = 3; g.strokeStyle = "rgba(255,244,225,.55)";   // 괴황지 위에서 획이 또렷하게
        g.strokeText(GAN_HJ[p.gan], x, yTop + 66);
        g.fillStyle = "rgb(" + OH_INK[go].join(",") + ")"; g.fillText(GAN_HJ[p.gan], x, yTop + 66);
        g.strokeText(JI_HJ[p.ji], x, yTop + 130);
        g.fillStyle = "rgb(" + OH_INK[jo].join(",") + ")"; g.fillText(JI_HJ[p.ji], x, yTop + 130);
        g.font = "18px " + SERIF; g.fillStyle = INK_S;
        g.fillText(GAN_KO[p.gan] + JI_KO[p.ji], x, yTop + 158);
      });

      // ── 신살 — 이 사람에게만 붙은 기운 ──
      var marks = [];
      (opts.sinsal || []).forEach(function (s2) {
        SS_MARK.forEach(function (m) {
          if (m[0].test(s2) && marks.length < 4 && !marks.some(function (x) { return x[0] === m[1]; })) marks.push([m[1], m[2]]);
        });
      });
      if (marks.length) {
        var mw = 150, mx = W / 2 - ((marks.length - 1) * mw) / 2, my = 985;
        marks.forEach(function (m, i) {
          var x = mx + i * mw;
          g.strokeStyle = "rgba(150,30,20,.5)"; g.lineWidth = 1.8;
          rr(g, x - 62, my - 30, 124, 62, 10); g.stroke();
          g.font = "700 27px " + SERIF; g.fillStyle = "#8f1d12";
          g.fillText(m[0], x, my - 2);
          g.font = "16px " + SERIF; g.fillStyle = INK_S;
          g.fillText(m[1], x, my + 22);
        });
      }

      // ── 용신 처방 한 줄 ──
      g.font = "23px " + SERIF; g.fillStyle = "rgba(100,24,14,.9)";
      g.fillText("用神 " + (use.join("·") || "—") + "   ·   忌神 " + (avoid.join("·") || "—"), W / 2, 1062);

      // ── 생년 + 인장 ──
      var b = opts.birth;
      var gTxt = b.gender === "M" ? " 乾命" : b.gender === "F" ? " 坤命" : "";
      var hTxt = b.hour == null ? "" : " " + b.hour + "時 " + (b.min || 0) + "分";
      g.font = "21px " + SERIF; g.fillStyle = "rgba(100,24,14,.75)";
      g.fillText(b.y + "年 " + b.m + "月 " + b.d + "日" + hTxt + gTxt, W / 2, 1100);

      drawSeal(g, W, H, encode(b));
      g.font = "19px " + SERIF; g.fillStyle = "rgba(110,26,14,.8)";
      g.fillText("鬼 哭 之 印", W / 2, H - 26);

      if (onDone) onDone();
    }
  }
  function jiOh(ji) { return "수토목목토화화토금금토수"[ji] || "토"; }  // 자축인묘진사오미신유술해

  window.BujeokSeal = { encode: encode, decode: decode };
  window.BujeokArt = { render: render, ELEM: ELEM, GAN_HJ: GAN_HJ, JI_HJ: JI_HJ };
})();
