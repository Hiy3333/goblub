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
    bg.src = opts.bgSrc || ("img/bujeok/bg_" + el.bg + ".webp");   // bgSrc: 배경 후보 비교용

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

      // 부적 이름 — 사주에서 뽑아낸 이 부적만의 이름
      var ilOh = GAN_OH2[opts.ilgan] || "토";
      g.font = "26px " + SERIF; g.fillStyle = INK_S;
      g.fillText(bujeokName(opts), W / 2, 215);

      // ── 중앙: 부문(符文) — 사주에서 생성되는 나만의 문양 ──
      drawSigil(g, opts, 360, 250, 470, 780);

      // ── 생년 + 인장 ──
      var b = opts.birth;
      var gTxt = b.gender === "M" ? " 乾命" : b.gender === "F" ? " 坤命" : "";
      var hTxt = b.hour == null ? "" : " " + b.hour + "時 " + (b.min || 0) + "分";
      g.font = "20px " + SERIF; g.fillStyle = "rgba(100,24,14,.7)";
      g.fillText((opts.name ? opts.name + " · " : "") + b.y + "年 " + b.m + "月 " + b.d + "日" + hTxt + gTxt, W / 2, 1085);

      drawSeal(g, W, H, encode(b));
      g.font = "19px " + SERIF; g.fillStyle = "rgba(110,26,14,.8)";
      g.fillText("鬼 哭 之 印", W / 2, H - 26);

      if (onDone) onDone();
    }
  }
  function jiOh(ji) { return "수토목목토화화토금금토수"[ji] || "토"; }  // 자축인묘진사오미신유술해

  // ===================================================================
  //  부문(符文) 생성기 — 도표가 아니라 '기운을 올리는 문양'을 사주에서 그린다
  //   · 관(冠)  : 일간 오행이 머리 모양을 정한다
  //   · 신(身)  : 용신·부족한 기운이 몸통 마디를 정한다(부족할수록 그 기운을 더 채워 그린다)
  //   · 족(足)  : 용신이 딛는 자리를 정한다
  //   · 살(殺)  : 신살이 곁가지 장식을 붙인다
  //  같은 사주면 항상 같은 문양, 사주가 다르면 모양이 확 달라진다.
  // ===================================================================
  function seedOf(o) {
    var key = [o.ilgan, o.strength, (o.use || []).join(""), (o.avoid || []).join(""),
               JSON.stringify(o.oheng || {}), JSON.stringify(o.pillars || {}),
               (o.sinsal || []).join("|")].join("#");
    var h = 2166136261 >>> 0;
    for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rngFrom(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 주사(朱砂) 붓획 — 번짐 위에 본획
  function ink(g, w, draw) {
    g.lineCap = "round"; g.lineJoin = "round";
    g.save();
    g.strokeStyle = "rgba(150,26,14,.20)"; g.lineWidth = w * 2.3; draw(g); g.stroke();
    g.restore();
    g.strokeStyle = "#9d1710"; g.lineWidth = w; draw(g); g.stroke();
  }
  function inkFill(g, draw) {
    g.save(); g.fillStyle = "rgba(150,26,14,.22)"; draw(g); g.fill(); g.restore();
    g.fillStyle = "#9d1710"; draw(g); g.fill();
  }

  // ── 관(冠): 일간 오행별 머리 ──
  function crown(g, cx, y, w, oh, R) {
    var hw = w / 2;
    if (oh === "목") {            // 자라나는 가지
      ink(g, 9, function () { g.beginPath(); g.moveTo(cx, y + 74); g.lineTo(cx, y + 6); });
      [-1, 1].forEach(function (s) {
        ink(g, 7, function () { g.beginPath();
          g.moveTo(cx, y + 46); g.quadraticCurveTo(cx + s * hw * .5, y + 30, cx + s * hw * .72, y - 2); });
        ink(g, 6, function () { g.beginPath();
          g.moveTo(cx, y + 66); g.quadraticCurveTo(cx + s * hw * .34, y + 56, cx + s * hw * .46, y + 30); });
      });
    } else if (oh === "화") {      // 세 갈래 불꽃
      [-1, 0, 1].forEach(function (s) {
        var bx = cx + s * hw * .52, top = y + (s === 0 ? 0 : 26);
        ink(g, 8, function () { g.beginPath();
          g.moveTo(bx - 14, y + 78); g.quadraticCurveTo(bx - 6, y + 34, bx, top);
          g.quadraticCurveTo(bx + 8, y + 36, bx + 14, y + 78); });
      });
    } else if (oh === "토") {      // 겹쳐 쌓은 산
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx - hw * .78, y + 78); g.lineTo(cx - hw * .3, y + 20);
        g.lineTo(cx, y + 56); g.lineTo(cx + hw * .3, y + 20); g.lineTo(cx + hw * .78, y + 78); });
      ink(g, 6, function () { g.beginPath(); g.moveTo(cx - hw * .55, y + 80); g.lineTo(cx + hw * .55, y + 80); });
    } else if (oh === "금") {      // 벼려진 칼끝
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx, y + 4); g.lineTo(cx - hw * .5, y + 62); g.lineTo(cx + hw * .5, y + 62); g.closePath(); });
      ink(g, 7, function () { g.beginPath(); g.moveTo(cx - hw * .82, y + 80); g.lineTo(cx + hw * .82, y + 80); });
    } else {                       // 수 — 물마루
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx - hw * .82, y + 52);
        g.bezierCurveTo(cx - hw * .3, y + 6, cx + hw * .3, y + 92, cx + hw * .82, y + 42); });
      [-1, 1].forEach(function (s) {
        inkFill(g, function () { g.beginPath(); g.arc(cx + s * hw * .42, y + 78, 8, 0, Math.PI * 2); });
      });
    }
  }

  // ── 몸통 마디 — 종류가 많을수록 사람마다 조합이 달라진다 ──
  var SEGS = [
    function box(g, cx, y, w, h) {              // 口 — 가둠
      var hw = w * .3;
      ink(g, 8, function () { g.beginPath(); g.rect(cx - hw, y, hw * 2, h * .78); });
      ink(g, 6, function () { g.beginPath(); g.moveTo(cx - hw * .5, y + h * .4); g.lineTo(cx + hw * .5, y + h * .4); });
    },
    function grid(g, cx, y, w, h) {             // 田 — 다스림
      var hw = w * .3, hh = h * .74;
      ink(g, 8, function () { g.beginPath(); g.rect(cx - hw, y, hw * 2, hh); });
      ink(g, 5, function () { g.beginPath();
        g.moveTo(cx, y); g.lineTo(cx, y + hh); g.moveTo(cx - hw, y + hh / 2); g.lineTo(cx + hw, y + hh / 2); });
    },
    function curl(g, cx, y, w, h) {             // 소용돌이 — 끌어당김
      ink(g, 8, function () {
        g.beginPath();
        var r0 = w * .3, steps = 34;
        for (var i = 0; i <= steps; i++) {
          var t = i / steps, a = t * Math.PI * 3.1, r = r0 * (1 - t * .78);
          var x = cx + Math.cos(a) * r, yy = y + h * .4 + Math.sin(a) * r * .62;
          i ? g.lineTo(x, yy) : g.moveTo(x, yy);
        }
      });
    },
    function zig(g, cx, y, w, h) {              // 之 — 흐름
      var hw = w * .32;
      ink(g, 8, function () { g.beginPath();
        g.moveTo(cx - hw, y + 6); g.lineTo(cx + hw, y + h * .3);
        g.lineTo(cx - hw, y + h * .56); g.lineTo(cx + hw, y + h * .8); });
    },
    function hooks(g, cx, y, w, h) {            // 겹갈고리 — 붙잡음
      var hw = w * .34;
      [-1, 1].forEach(function (s) {
        ink(g, 8, function () { g.beginPath();
          g.moveTo(cx + s * hw, y + 4); g.lineTo(cx + s * hw, y + h * .58);
          g.quadraticCurveTo(cx + s * hw, y + h * .82, cx + s * hw * .32, y + h * .78); });
      });
    },
    function ladder(g, cx, y, w, h) {           // 사다리 — 오름
      var hw = w * .3, n = 3;
      ink(g, 8, function () { g.beginPath();
        g.moveTo(cx - hw, y); g.lineTo(cx - hw, y + h * .8);
        g.moveTo(cx + hw, y); g.lineTo(cx + hw, y + h * .8); });
      for (var i = 0; i < n; i++) {
        (function (yy) { ink(g, 5, function () { g.beginPath(); g.moveTo(cx - hw, yy); g.lineTo(cx + hw, yy); }); })
          (y + h * .16 + i * h * .24);
      }
    },
    function star(g, cx, y, w, h) {             // 별점 — 귀인
      var r = w * .3, cy2 = y + h * .4;
      ink(g, 7, function () { g.beginPath(); g.arc(cx, cy2, r, 0, Math.PI * 2); });
      for (var i = 0; i < 4; i++) {
        (function (a) { ink(g, 5, function () { g.beginPath();
          g.moveTo(cx + Math.cos(a) * r * .3, cy2 + Math.sin(a) * r * .3);
          g.lineTo(cx + Math.cos(a) * r * 1.34, cy2 + Math.sin(a) * r * 1.34); }); })(i * Math.PI / 2 + Math.PI / 4);
      }
    },
    function wave(g, cx, y, w, h) {             // 물결 — 풀어냄
      var hw = w * .36;
      for (var i = 0; i < 2; i++) {
        (function (yy) { ink(g, 7, function () { g.beginPath();
          g.moveTo(cx - hw, yy);
          g.bezierCurveTo(cx - hw * .3, yy - 16, cx + hw * .3, yy + 16, cx + hw, yy); }); })(y + h * .28 + i * h * .34);
      }
    },
    function flame(g, cx, y, w, h) {            // 불꽃 혀 — 돋움
      [-1, 1].forEach(function (s) {
        ink(g, 7, function () { g.beginPath();
          g.moveTo(cx + s * w * .06, y + h * .82);
          g.quadraticCurveTo(cx + s * w * .34, y + h * .42, cx + s * w * .16, y + 4); });
      });
    },
    function eye(g, cx, y, w, h) {              // 눈 — 지켜봄
      var hw = w * .32, cy2 = y + h * .42;
      ink(g, 8, function () { g.beginPath();
        g.moveTo(cx - hw, cy2); g.quadraticCurveTo(cx, cy2 - h * .34, cx + hw, cy2);
        g.quadraticCurveTo(cx, cy2 + h * .34, cx - hw, cy2); });
      inkFill(g, function () { g.beginPath(); g.arc(cx, cy2, w * .09, 0, Math.PI * 2); });
    }
  ];

  // ── 족(足): 용신이 딛는 자리 ──
  function base(g, cx, y, w, oh) {
    var hw = w / 2;
    if (oh === "목") {
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx, y); g.lineTo(cx, y + 40);
        g.moveTo(cx, y + 40); g.quadraticCurveTo(cx - hw * .5, y + 52, cx - hw * .84, y + 84);
        g.moveTo(cx, y + 40); g.quadraticCurveTo(cx + hw * .5, y + 52, cx + hw * .84, y + 84); });
    } else if (oh === "화") {
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx - hw * .8, y + 84); g.quadraticCurveTo(cx - hw * .2, y + 30, cx, y + 78);
        g.quadraticCurveTo(cx + hw * .2, y + 30, cx + hw * .8, y + 84); });
    } else if (oh === "토") {
      ink(g, 10, function () { g.beginPath();
        g.moveTo(cx - hw * .8, y + 12); g.lineTo(cx - hw * .8, y + 80);
        g.lineTo(cx + hw * .8, y + 80); g.lineTo(cx + hw * .8, y + 12); });
    } else if (oh === "금") {
      ink(g, 9, function () { g.beginPath();
        g.moveTo(cx - hw * .8, y + 16); g.lineTo(cx, y + 88); g.lineTo(cx + hw * .8, y + 16); });
    } else {
      for (var i = 0; i < 2; i++) {
        (function (yy) { ink(g, 8, function () { g.beginPath();
          g.moveTo(cx - hw * .84, yy);
          g.bezierCurveTo(cx - hw * .28, yy - 18, cx + hw * .28, yy + 18, cx + hw * .84, yy); }); })(y + 34 + i * 34);
      }
    }
  }

  // ── 살(殺): 신살이 붙이는 곁장식 ──
  function sideMark(g, kind, x, y, s) {
    if (kind === "도화") {           // 꽃잎
      for (var i = 0; i < 5; i++) {
        (function (a) { ink(g, 4, function () { g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + Math.cos(a) * s * 1.5, y + Math.sin(a) * s * 1.5, x, y); }); })(i * Math.PI * 2 / 5);
      }
      ink(g, 4, function () { g.beginPath(); g.arc(x, y, s * .34, 0, Math.PI * 2); });
    } else if (kind === "역마") {    // 화살
      ink(g, 5, function () { g.beginPath();
        g.moveTo(x, y + s); g.lineTo(x, y - s);
        g.moveTo(x - s * .5, y - s * .4); g.lineTo(x, y - s); g.lineTo(x + s * .5, y - s * .4); });
    } else if (kind === "화개") {    // 일산(가리개)
      ink(g, 5, function () { g.beginPath();
        g.moveTo(x - s, y); g.quadraticCurveTo(x, y - s * 1.2, x + s, y);
        g.moveTo(x, y); g.lineTo(x, y + s * .9); });
    } else if (kind === "천을귀인") { // 별
      for (var j = 0; j < 3; j++) {
        (function (a) { ink(g, 4, function () { g.beginPath();
          g.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s);
          g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); }); })(j * Math.PI / 3);
      }
    } else if (kind === "양인") {    // 칼날
      ink(g, 6, function () { g.beginPath();
        g.moveTo(x - s * .6, y + s); g.lineTo(x + s * .6, y - s);
        g.moveTo(x + s * .2, y - s); g.lineTo(x + s * .6, y - s); });
    } else {                          // 괴강·백호 — 발톱
      for (var k = -1; k <= 1; k++) {
        (function (o) { ink(g, 4, function () { g.beginPath();
          g.moveTo(x + o * s * .45, y - s); g.quadraticCurveTo(x + o * s * .8, y, x + o * s * .35, y + s); }); })(k);
      }
    }
  }

  // ── 부적 이름 — 사주에서 뽑은다(도표가 아니라 이름으로 성격을 말한다) ──
  var NAME_HEAD = { 목: "청목", 화: "적화", 토: "황토", 금: "백금", 수: "현수" };
  var NAME_TAIL = { 목: "생발부", 화: "발양부", 토: "안정부", 금: "단금부", 수: "통류부" };
  function bujeokName(o) {
    var need = (o.use && o.use[0]) || GAN_OH2[o.ilgan] || "토";
    return (NAME_HEAD[GAN_OH2[o.ilgan] || "토"]) + " " + (NAME_TAIL[need]) +
           (o.name ? "  ·  " + o.name : "");
  }

  // ── 부문 전체 ──
  function drawSigil(g, o, cx, top, w, h) {
    var rng = rngFrom(seedOf(o));
    var ilOh = GAN_OH2[o.ilgan] || "토";
    var need = (o.use && o.use[0]) || ilOh;
    var oheng = o.oheng || {};

    g.save();
    // 세로 중심선(척추)
    ink(g, 3, function () { g.beginPath(); g.moveTo(cx, top + 96); g.lineTo(cx, top + h - 96); });

    // 관 — 일간 오행
    crown(g, cx, top, w, ilOh);

    // 몸통 — 마디 수는 부족한 기운이 많을수록 늘어난다(3~5)
    var lack = 0;
    OH_KEYS.forEach(function (k) { if ((oheng[k] || 0) < 1) lack++; });
    var nSeg = Math.max(3, Math.min(5, 3 + Math.round(lack / 2)));
    var segTop = top + 120, segH = (h - 250) / nSeg;

    // 마디 종류 선택 — 용신 계열에 가중치를 준다
    var pool = SEGS.slice();
    var favor = { 목: [5, 3], 화: [8, 6], 토: [0, 1], 금: [4, 9], 수: [7, 2] }[need] || [0, 1];
    for (var i = 0; i < nSeg; i++) {
      var idx = (rng() < 0.55) ? favor[Math.floor(rng() * favor.length)] : Math.floor(rng() * pool.length);
      var yy = segTop + i * segH;
      pool[idx](g, cx, yy, w * (0.72 + rng() * 0.3), segH);
      // 마디 사이 좌우 대칭 갈고리
      if (rng() < 0.5) {
        (function (y2, sw) {
          [-1, 1].forEach(function (s) {
            ink(g, 5, function () { g.beginPath();
              g.moveTo(cx + s * sw * .4, y2); g.quadraticCurveTo(cx + s * sw * .62, y2 + 10, cx + s * sw * .5, y2 + 26); });
          });
        })(yy + segH * 0.86, w);
      }
    }

    // 족 — 용신이 딛는 자리
    base(g, cx, top + h - 108, w, need);

    // 신살 곁장식 — 좌우로 뻗는다
    var kinds = [];
    (o.sinsal || []).forEach(function (s2) {
      ["도화", "역마", "화개", "천을귀인", "양인", "괴강", "백호"].forEach(function (k) {
        if (s2.indexOf(k) >= 0 && kinds.indexOf(k) < 0) kinds.push(k);
      });
    });
    kinds.slice(0, 4).forEach(function (k, i) {
      var side = i % 2 ? 1 : -1;
      var y2 = top + 210 + Math.floor(i / 2) * 250 + rng() * 40;
      sideMark(g, k, cx + side * (w * .58), y2, 17);
    });
    g.restore();
  }

  window.BujeokSeal = { encode: encode, decode: decode };
  window.BujeokArt = { render: render, ELEM: ELEM, GAN_HJ: GAN_HJ, JI_HJ: JI_HJ };
})();
