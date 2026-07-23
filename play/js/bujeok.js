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
  var SEAL = { cx: 0.5, cy: 0.9, frac: 0.155 }; // 한 변 = W*frac (낙관처럼 작게)
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
  var SEAL_LEGACY = [{ cx: 0.5, cy: 0.888, frac: 0.21 }, { cx: 0.5, cy: 0.852, frac: 0.27 }];
  function sealRect(w, h, sp) {
    sp = sp || SEAL;
    var size = w * sp.frac;
    return { x: w * sp.cx - size / 2, y: h * sp.cy - size / 2, size: size };
  }

  function drawSeal(g, w, h, bits) {
    var r = sealRect(w, h), s = r.size, cell = s / 8;
    // 백문(白文) 낙관 — 붉은 인주로 꽉 찬 도장에 획이 하얗게 파여 있다.
    // (파인 자리가 곧 명(命) 데이터. 1=파임(밝음) / 0=인주(붉음))
    var pad = cell * 1.15;
    g.save();
    g.shadowColor = "rgba(130,15,8,.45)"; g.shadowBlur = 14;
    g.fillStyle = "#b21b0e";                                   // 인주 몸체
    rr(g, r.x - pad, r.y - pad, s + pad * 2, s + pad * 2, cell * 0.5); g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = "rgba(240,214,168,.45)"; g.lineWidth = Math.max(1, cell * 0.16);
    rr(g, r.x - pad * 0.52, r.y - pad * 0.52, s + pad * 1.04, s + pad * 1.04, cell * 0.34); g.stroke();
    // 파인 획 — 종이색
    g.fillStyle = "#efe0b8";
    for (var i = 0; i < 64; i++) {
      if (!bits[i]) continue;
      var cx = i % 8, cy = Math.floor(i / 8);
      rr(g, r.x + cx * cell + cell * 0.1, r.y + cy * cell + cell * 0.1,
         cell * 0.8, cell * 0.8, cell * 0.2);
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
          var sp = Math.max(1, Math.min(4, Math.floor(cell * 0.3)));   // 셀이 작아져도 중앙만 표본
          var d = g.getImageData(Math.round(cx - sp / 2), Math.round(cy - sp / 2), sp, sp).data;
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
    bg.src = opts.bgSrc || "img/bujeok/bg_hanji.webp";   // 정통 괴황지 (bgSrc: 후보 비교용)

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

  // ── 붓획 primitives — 전부 한자 획(가로·세로·점·갈고리·삐침)만 쓴다 ──
  // 획 하나를 끝으로 갈수록 가늘어지는 붓자국으로 그린다
  function bs(g, x1, y1, x2, y2, w1, w2) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L;
    function path(k) {
      g.beginPath();
      g.moveTo(x1 + nx * w1 * k / 2, y1 + ny * w1 * k / 2);
      g.lineTo(x2 + nx * w2 * k / 2, y2 + ny * w2 * k / 2);
      g.lineTo(x2 - nx * w2 * k / 2, y2 - ny * w2 * k / 2);
      g.lineTo(x1 - nx * w1 * k / 2, y1 - ny * w1 * k / 2);
      g.closePath();
    }
    g.save(); g.fillStyle = "rgba(150,26,14,.20)"; path(1.55); g.fill(); g.restore();
    g.fillStyle = "#9d1710"; path(1); g.fill();
    // 起筆(입필) — 획머리에 붓이 눌린 자국
    g.beginPath(); g.arc(x1, y1, w1 * 0.5, 0, Math.PI * 2); g.fill();
  }
  // 가로획 — 오른쪽이 살짝 올라가는 서예 관습
  function hs(g, cx, y, w, t) { bs(g, cx - w / 2, y + t * 0.22, cx + w / 2, y - t * 0.22, t, t * 0.82); }
  // 세로획
  function vs(g, x, y1, y2, t) { bs(g, x, y1, x, y2, t, t * 0.86); }
  // 갈고리(亅) — 세로 끝을 왼쪽으로 채올린다
  function hook(g, x, y1, y2, t) {
    vs(g, x, y1, y2, t);
    bs(g, x, y2, x - t * 2.1, y2 - t * 1.5, t * 0.95, t * 0.2);
  }
  // 점(丶)
  function dot(g, x, y, t, dir) {
    bs(g, x, y, x + (dir || 1) * t * 0.75, y + t * 1.15, t * 0.42, t * 0.95);
  }
  // 口 — 네 획으로(선이 아니라 획으로 그려야 한자로 읽힌다)
  function boxG(g, cx, y, w, h, t) {
    vs(g, cx - w / 2, y, y + h, t);
    hs(g, cx, y + t * 0.35, w, t);
    vs(g, cx + w / 2, y, y + h, t);
    hs(g, cx, y + h, w, t);
  }

  // ── 실제 무속 부적의 구조를 그대로 따른다 ──
  //  · 敕令(칙령)이 머리에 오고
  //  · 파자(破字)한 한자 부속(口·日·田·三·⊙)이 세로로 쌓이며
  //  · 굵은 척추가 관통해 아래로 길게 내려와 큰 갈고리로 말리고
  //  · 긴 대각선이 문양 전체를 꿰뚫고 바깥까지 뻗는다  ← 부적다움의 핵심
  var _rng = Math.random;   // drawSigil 에서 시드 난수로 교체(손맛 흔들림용)

  // 붓획 — 끝으로 갈수록 가늘어지고, 가장자리가 미세하게 흔들린다
  function bs(g, x1, y1, x2, y2, w1, w2) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L;
    var j = (L > 60 ? 1.6 : 0.7);                       // 획이 길수록 흔들림 폭↑
    var mx = (x1 + x2) / 2 + (_rng() - 0.5) * j, my = (y1 + y2) / 2 + (_rng() - 0.5) * j;
    var mw = (w1 + w2) / 2 * (0.9 + _rng() * 0.2);
    function path(k) {
      g.beginPath();
      g.moveTo(x1 + nx * w1 * k / 2, y1 + ny * w1 * k / 2);
      g.quadraticCurveTo(mx + nx * mw * k / 2, my + ny * mw * k / 2,
                         x2 + nx * w2 * k / 2, y2 + ny * w2 * k / 2);
      g.lineTo(x2 - nx * w2 * k / 2, y2 - ny * w2 * k / 2);
      g.quadraticCurveTo(mx - nx * mw * k / 2, my - ny * mw * k / 2,
                         x1 - nx * w1 * k / 2, y1 - ny * w1 * k / 2);
      g.closePath();
    }
    g.save(); g.fillStyle = "rgba(150,26,14,.18)"; path(1.5); g.fill(); g.restore();  // 번짐
    g.fillStyle = "#9d1710"; path(1); g.fill();
    g.beginPath(); g.arc(x1, y1, w1 * 0.5, 0, Math.PI * 2); g.fill();                 // 입필
  }
  function hs(g, cx, y, w, t) { bs(g, cx - w / 2, y + t * 0.2, cx + w / 2, y - t * 0.2, t, t * 0.85); }
  function vs(g, x, y1, y2, t) { bs(g, x, y1, x, y2, t, t * 0.88); }
  function dot(g, x, y, t, dir) { bs(g, x, y, x + (dir || 1) * t * 0.7, y + t * 1.1, t * 0.4, t * 0.9); }
  function boxG(g, cx, y, w, h, t) {
    vs(g, cx - w / 2, y, y + h, t);
    hs(g, cx, y + t * 0.3, w, t);
    vs(g, cx + w / 2, y, y + h, t);
    hs(g, cx, y + h, w, t);
  }
  function ringG(g, cx, cy, r, t) {          // ⊙ — 해·달
    var n = 14, pts = [];
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92]);
    }
    for (var k = 0; k < n; k++) bs(g, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], t, t);
  }
  // 척추 끝의 큰 갈고리 — 실제 부적에서 가장 눈에 띄는 마무리
  function bigHook(g, x, yTop, yBot, t) {
    vs(g, x, yTop, yBot, t);
    var r = t * 1.9;
    var n = 10;
    for (var i = 0; i < n; i++) {
      var a1 = i / n * Math.PI * 1.25, a2 = (i + 1) / n * Math.PI * 1.25;
      bs(g, x - Math.sin(a1) * r, yBot + r - Math.cos(a1) * r,
            x - Math.sin(a2) * r, yBot + r - Math.cos(a2) * r,
            t * (1 - i / n * 0.45), t * (1 - (i + 1) / n * 0.45));
    }
  }
  // 관통선 — 문양을 꿰뚫고 바깥까지 뻗는 긴 사선
  function slash(g, cx, y, len, ang, t) {
    var dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
    bs(g, cx - dx, y - dy, cx + dx, y + dy, t, t * 0.35);
  }

  // ── 관(冠): 일간 오행이 머리를 정한다 ──
  function crown(g, cx, y, w, oh) {
    var t = 14, hw = w / 2;
    if (oh === "목") {                       // 쌍 口 (吅)
      boxG(g, cx - hw * 0.34, y + 8, w * 0.34, 58, t);
      boxG(g, cx + hw * 0.34, y + 8, w * 0.34, 58, t);
    } else if (oh === "화") {                // 亠 + 두 점
      dot(g, cx - hw * 0.28, y + 4, t, -1);
      dot(g, cx + hw * 0.28, y + 4, t, 1);
      hs(g, cx, y + 48, w * 0.82, t);
    } else if (oh === "토") {                // 三 겹침
      hs(g, cx, y + 14, w * 0.56, t);
      hs(g, cx, y + 42, w * 0.74, t);
      hs(g, cx, y + 70, w * 0.9, t * 1.1);
    } else if (oh === "금") {                // 人 지붕
      bs(g, cx, y + 6, cx - hw * 0.84, y + 72, t * 0.55, t * 1.2);
      bs(g, cx, y + 6, cx + hw * 0.84, y + 72, t * 0.55, t * 1.2);
    } else {                                  // 冖 + 삼수변
      hs(g, cx, y + 50, w * 0.84, t);
      dot(g, cx - hw * 0.22, y + 8, t, 1);
      dot(g, cx + hw * 0.04, y + 8, t, 1);
      dot(g, cx + hw * 0.3, y + 8, t, 1);
    }
  }

  // ── 몸통 마디 — 파자한 한자 부속들 ──
  var SEGS = [
    function pairKou(g, cx, y, w, h) {                 // 吅 — 쌍 입
      var bw = w * 0.33, bh = h * 0.52;
      boxG(g, cx - w * 0.25, y + h * 0.1, bw, bh, 12);
      boxG(g, cx + w * 0.25, y + h * 0.1, bw, bh, 12);
    },
    function bars(g, cx, y, w, h) {                    // 三 — 척추를 꿰는 가로 세 획
      hs(g, cx, y + h * 0.18, w * 0.9, 13);
      hs(g, cx, y + h * 0.44, w * 0.7, 12);
      hs(g, cx, y + h * 0.7, w * 0.98, 14);
    },
    function rings(g, cx, y, w, h) {                   // ⊙⊙ — 해와 달
      ringG(g, cx - w * 0.22, y + h * 0.42, h * 0.2, 11);
      ringG(g, cx + w * 0.22, y + h * 0.42, h * 0.2, 11);
    },
    function ri(g, cx, y, w, h) {                      // 日
      var bw = w * 0.44, bh = h * 0.58, ty = y + h * 0.1;
      boxG(g, cx, ty, bw, bh, 12);
      hs(g, cx, ty + bh * 0.5, bw, 11);
    },
    function tian(g, cx, y, w, h) {                    // 田
      var bw = w * 0.5, bh = h * 0.58, ty = y + h * 0.1;
      boxG(g, cx, ty, bw, bh, 12);
      hs(g, cx, ty + bh * 0.5, bw, 10);
      vs(g, cx, ty, ty + bh, 10);
    },
    function ringBars(g, cx, y, w, h) {                // ⊙ 하나 + 가로획
      ringG(g, cx, y + h * 0.36, h * 0.22, 12);
      hs(g, cx, y + h * 0.76, w * 0.92, 13);
    },
    function crescents(g, cx, y, w, h) {               // 반달 셋
      for (var i = -1; i <= 1; i++) {
        var bx = cx + i * w * 0.26, by = y + h * 0.42, r = h * 0.17;
        for (var k = 0; k < 7; k++) {
          var a1 = Math.PI * (0.15 + k / 7 * 0.7), a2 = Math.PI * (0.15 + (k + 1) / 7 * 0.7);
          bs(g, bx - Math.cos(a1) * r, by - Math.sin(a1) * r,
                bx - Math.cos(a2) * r, by - Math.sin(a2) * r, 10, 10);
        }
      }
      hs(g, cx, y + h * 0.78, w * 0.8, 12);
    },
    function gong(g, cx, y, w, h) {                    // 工
      hs(g, cx, y + h * 0.16, w * 0.66, 13);
      hs(g, cx, y + h * 0.72, w * 0.88, 14);
    },
    function fang(g, cx, y, w, h) {                    // 匚
      hs(g, cx - w * 0.04, y + h * 0.14, w * 0.7, 13);
      vs(g, cx - w * 0.39, y + h * 0.14, y + h * 0.76, 13);
      hs(g, cx - w * 0.04, y + h * 0.76, w * 0.7, 13);
    },
    function er(g, cx, y, w, h) {                      // 儿
      hs(g, cx, y + h * 0.12, w * 0.56, 12);
      bs(g, cx - w * 0.12, y + h * 0.14, cx - w * 0.4, y + h * 0.78, 12, 7);
      bs(g, cx + w * 0.12, y + h * 0.14, cx + w * 0.4, y + h * 0.76, 12, 9);
    }
  ];

  // ── 살(殺): 신살이 붙이는 곁획 ──
  function sideMark(g, kind, x, y, s, dir) {
    if (kind === "도화") { bs(g, x, y, x + dir * s * 1.5, y - s * 0.7, 9, 3); dot(g, x + dir * s * 1.4, y - s * 0.5, 9, dir); }
    else if (kind === "역마") { bs(g, x, y - s, x, y + s, 9, 6); bs(g, x, y + s, x - dir * s * 0.8, y + s * 0.4, 8, 2); }
    else if (kind === "화개") { hs(g, x, y, s * 1.8, 10); vs(g, x, y, y + s * 0.85, 9); }
    else if (kind === "천을귀인") { dot(g, x, y - s * 0.7, 10, dir); dot(g, x, y, 10, dir); dot(g, x, y + s * 0.7, 10, dir); }
    else if (kind === "양인") { bs(g, x + dir * s * 0.7, y - s, x - dir * s * 0.5, y + s, 11, 2); }
    else { hs(g, x, y - s * 0.45, s * 1.6, 11); hs(g, x, y + s * 0.45, s * 1.3, 10); }
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
    _rng = rng;                                  // 붓 흔들림도 사주로 고정(같은 사주=같은 그림)
    var ilOh = GAN_OH2[o.ilgan] || "토";
    var need = (o.use && o.use[0]) || ilOh;
    var oheng = o.oheng || {};

    g.save();
    // 관
    crown(g, cx, top, w, ilOh);

    // 몸통 — 부족한 기운이 많을수록 마디가 늘어난다(3~5)
    var lack = 0;
    OH_KEYS.forEach(function (k) { if ((oheng[k] || 0) < 1) lack++; });
    var nSeg = Math.max(3, Math.min(5, 3 + Math.round(lack / 2)));
    var segTop = top + 108, segBot = top + h - 250, segH = (segBot - segTop) / nSeg;

    // 척추 — 관 아래부터 문양을 관통해 아래로 길게 내려가 큰 갈고리로 말린다
    bigHook(g, cx, top + 74, top + h - 96, 17);

    var favor = { 목: [0, 4], 화: [6, 2], 토: [1, 7], 금: [8, 9], 수: [5, 3] }[need] || [1, 3];
    for (var i = 0; i < nSeg; i++) {
      var idx = (rng() < 0.62) ? favor[Math.floor(rng() * favor.length)] : Math.floor(rng() * SEGS.length);
      SEGS[idx](g, cx, segTop + i * segH, w * (0.64 + rng() * 0.28), segH);
    }

    // 관통선 — 문양 전체를 꿰뚫고 바깥까지 뻗는다(부적다움의 핵심)
    var nSlash = 2 + Math.floor(rng() * 2);
    for (var s2 = 0; s2 < nSlash; s2++) {
      var yy = segTop + segH * (0.5 + rng() * (nSeg - 1));
      var ang = (rng() < 0.5 ? 1 : -1) * (0.17 + rng() * 0.16);   // 완만한 사선
      slash(g, cx, yy, w * (1.5 + rng() * 0.5), ang, 11);
    }

    // 살 — 신살 곁획
    var kinds = [];
    (o.sinsal || []).forEach(function (s3) {
      ["도화", "역마", "화개", "천을귀인", "양인", "괴강", "백호"].forEach(function (k) {
        if (s3.indexOf(k) >= 0 && kinds.indexOf(k) < 0) kinds.push(k);
      });
    });
    kinds.slice(0, 3).forEach(function (k, i) {
      var side = i % 2 ? 1 : -1;
      sideMark(g, k, cx + side * (w * 0.66), segTop + 70 + i * (segH * 1.25), 16, side);
    });
    g.restore();
    _rng = Math.random;
  }

  window.BujeokSeal = { encode: encode, decode: decode };
  window.BujeokArt = { render: render, ELEM: ELEM, GAN_HJ: GAN_HJ, JI_HJ: JI_HJ };
})();
