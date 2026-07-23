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

  // ── 관(冠): 일간 오행이 머리를 정한다 (전부 한자 부수 꼴) ──
  function crown(g, cx, y, w, oh) {
    var t = 13, hw = w / 2;
    if (oh === "목") {                       // 艹 — 풀 머리
      hs(g, cx, y + 48, w * 0.86, t);
      vs(g, cx - hw * 0.42, y + 16, y + 74, t);
      vs(g, cx + hw * 0.42, y + 16, y + 74, t);
    } else if (oh === "화") {                // 亠 + 두 점
      hs(g, cx, y + 52, w * 0.8, t);
      dot(g, cx - hw * 0.3, y + 12, t, -1);
      dot(g, cx + hw * 0.3, y + 12, t, 1);
      vs(g, cx, y + 52, y + 82, t);
    } else if (oh === "토") {                // 三 — 겹친 땅
      hs(g, cx, y + 18, w * 0.6, t);
      hs(g, cx, y + 48, w * 0.78, t);
      hs(g, cx, y + 78, w * 0.94, t * 1.15);
    } else if (oh === "금") {                // 人 지붕
      bs(g, cx, y + 10, cx - hw * 0.86, y + 82, t * 0.5, t * 1.2);
      bs(g, cx, y + 10, cx + hw * 0.86, y + 82, t * 0.5, t * 1.2);
    } else {                                  // 冖 + 삼수변 점
      hs(g, cx, y + 56, w * 0.86, t);
      vs(g, cx - hw * 0.43, y + 56, y + 84, t * 0.9);
      vs(g, cx + hw * 0.43, y + 56, y + 84, t * 0.9);
      dot(g, cx - hw * 0.2, y + 14, t, 1);
      dot(g, cx + hw * 0.06, y + 14, t, 1);
      dot(g, cx + hw * 0.32, y + 14, t, 1);
    }
  }

  // ── 몸통 마디 — 전부 한자처럼 보이는 조합 ──
  var SEGS = [
    function kou(g, cx, y, w, h) {            // 口
      boxG(g, cx, y + h * 0.12, w * 0.52, h * 0.6, 12);
    },
    function ri(g, cx, y, w, h) {             // 日
      var bw = w * 0.46, bh = h * 0.62, ty = y + h * 0.12;
      boxG(g, cx, ty, bw, bh, 12);
      hs(g, cx, ty + bh * 0.5, bw, 11);
    },
    function tian(g, cx, y, w, h) {           // 田
      var bw = w * 0.52, bh = h * 0.62, ty = y + h * 0.12;
      boxG(g, cx, ty, bw, bh, 12);
      hs(g, cx, ty + bh * 0.5, bw, 10);
      vs(g, cx, ty, ty + bh, 10);
    },
    function wang(g, cx, y, w, h) {           // 王 — 가로 세 획이 척추를 관통
      hs(g, cx, y + h * 0.16, w * 0.74, 12);
      hs(g, cx, y + h * 0.44, w * 0.56, 11);
      hs(g, cx, y + h * 0.72, w * 0.86, 13);
    },
    function shi(g, cx, y, w, h) {            // 十 + 좌우 점
      hs(g, cx, y + h * 0.42, w * 0.82, 13);
      dot(g, cx - w * 0.44, y + h * 0.66, 12, -1);
      dot(g, cx + w * 0.38, y + h * 0.66, 12, 1);
    },
    function pin(g, cx, y, w, h) {            // 品 — 세 입
      boxG(g, cx, y + h * 0.04, w * 0.34, h * 0.32, 10);
      boxG(g, cx - w * 0.28, y + h * 0.46, w * 0.32, h * 0.32, 10);
      boxG(g, cx + w * 0.28, y + h * 0.46, w * 0.32, h * 0.32, 10);
    },
    function mi(g, cx, y, w, h) {             // 冖 — 덮개 + 아래 가로
      hs(g, cx, y + h * 0.2, w * 0.86, 13);
      vs(g, cx - w * 0.43, y + h * 0.2, y + h * 0.44, 11);
      vs(g, cx + w * 0.43, y + h * 0.2, y + h * 0.44, 11);
      hs(g, cx, y + h * 0.72, w * 0.6, 12);
    },
    function er(g, cx, y, w, h) {             // 儿 — 두 다리
      bs(g, cx - w * 0.1, y + h * 0.1, cx - w * 0.42, y + h * 0.8, 12, 7);
      bs(g, cx + w * 0.1, y + h * 0.1, cx + w * 0.42, y + h * 0.78, 12, 9);
      hs(g, cx, y + h * 0.08, w * 0.5, 11);
    },
    function fang(g, cx, y, w, h) {           // 匚 — 감싸 담음
      hs(g, cx - w * 0.06, y + h * 0.14, w * 0.72, 13);
      vs(g, cx - w * 0.42, y + h * 0.14, y + h * 0.78, 13);
      hs(g, cx - w * 0.06, y + h * 0.78, w * 0.72, 13);
    },
    function gong(g, cx, y, w, h) {           // 工 — 버팀
      hs(g, cx, y + h * 0.16, w * 0.72, 13);
      vs(g, cx, y + h * 0.16, y + h * 0.7, 13);
      hs(g, cx, y + h * 0.7, w * 0.86, 14);
    }
  ];

  // ── 족(足): 용신이 딛는 자리 ──
  function base(g, cx, y, w, oh) {
    var t = 14, hw = w / 2;
    if (oh === "목") {                        // 뿌리 — 좌우 삐침
      bs(g, cx, y, cx - hw * 0.86, y + 78, t, 7);
      bs(g, cx, y, cx + hw * 0.86, y + 78, t, 7);
      hs(g, cx, y + 8, w * 0.5, t);
    } else if (oh === "화") {                 // 灬 — 네 점
      for (var i = 0; i < 4; i++) dot(g, cx - hw * 0.6 + i * (hw * 0.4), y + 24, 13, i < 2 ? -1 : 1);
      hs(g, cx, y + 4, w * 0.72, t);
    } else if (oh === "토") {                 // 土 받침
      vs(g, cx, y, y + 52, t);
      hs(g, cx, y + 26, w * 0.5, t);
      hs(g, cx, y + 66, w * 0.94, t * 1.2);
    } else if (oh === "금") {                 // 亼 — 모아 딛음
      bs(g, cx, y + 4, cx - hw * 0.8, y + 62, t * 0.5, t);
      bs(g, cx, y + 4, cx + hw * 0.8, y + 62, t * 0.5, t);
      hs(g, cx, y + 74, w * 0.9, t * 1.15);
    } else {                                   // 수 — 이수변 + 받침
      hs(g, cx, y + 20, w * 0.86, t);
      dot(g, cx - hw * 0.5, y + 40, 13, -1);
      dot(g, cx, y + 44, 13, 1);
      dot(g, cx + hw * 0.5, y + 40, 13, 1);
    }
  }

  // ── 살(殺): 신살이 붙이는 곁획 — 이것도 한자 획으로 ──
  function sideMark(g, kind, x, y, s, dir) {
    if (kind === "도화") {                      // 밖으로 뻗는 삐침 + 점
      bs(g, x, y, x + dir * s * 1.5, y - s * 0.7, 9, 3);
      dot(g, x + dir * s * 1.5, y - s * 0.5, 9, dir);
    } else if (kind === "역마") {               // 갈고리 획
      hook(g, x, y - s, y + s, 9);
    } else if (kind === "화개") {               // 덮개 획
      hs(g, x, y, s * 1.9, 10);
      vs(g, x, y, y + s * 0.9, 9);
    } else if (kind === "천을귀인") {           // 점 세 개(귀인의 별)
      dot(g, x, y - s * 0.7, 10, dir);
      dot(g, x, y, 10, dir);
      dot(g, x, y + s * 0.7, 10, dir);
    } else if (kind === "양인") {               // 날카로운 삐침
      bs(g, x + dir * s * 0.7, y - s, x - dir * s * 0.5, y + s, 11, 2);
    } else {                                     // 괴강·백호 — 겹친 가로획
      hs(g, x, y - s * 0.5, s * 1.7, 11);
      hs(g, x, y + s * 0.5, s * 1.4, 10);
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
    // 관 — 일간 오행이 머리를 정한다
    crown(g, cx, top, w, ilOh);

    // 몸통 — 마디 수는 부족한 기운이 많을수록 늘어난다(3~5)
    var lack = 0;
    OH_KEYS.forEach(function (k) { if ((oheng[k] || 0) < 1) lack++; });
    var nSeg = Math.max(3, Math.min(5, 3 + Math.round(lack / 2)));
    var segTop = top + 118, segBot = top + h - 116, segH = (segBot - segTop) / nSeg;

    // 척추 — 부적의 기둥. 관 아래부터 족 위까지 관통하고 끝은 갈고리로 채올린다
    hook(g, cx, top + 86, segBot + 26, 17);

    // 마디 종류 — 용신 계열에 가중치
    var favor = { 목: [7, 3], 화: [4, 5], 토: [9, 2], 금: [8, 0], 수: [6, 1] }[need] || [0, 1];
    for (var i = 0; i < nSeg; i++) {
      var idx = (rng() < 0.6) ? favor[Math.floor(rng() * favor.length)] : Math.floor(rng() * SEGS.length);
      var yy = segTop + i * segH;
      SEGS[idx](g, cx, yy, w * (0.66 + rng() * 0.26), segH);
      // 마디 사이 좌우 대칭 곁획(짧은 가로) — 부적 특유의 리듬
      if (rng() < 0.45 && i < nSeg - 1) {
        var y2 = yy + segH * 0.92, sw = w * (0.3 + rng() * 0.14);
        bs(g, cx - w * 0.16, y2, cx - w * 0.16 - sw, y2 - 6, 10, 4);
        bs(g, cx + w * 0.16, y2, cx + w * 0.16 + sw, y2 - 6, 10, 4);
      }
    }

    // 족 — 용신이 딛는 자리
    base(g, cx, segBot + 6, w, need);

    // 살 — 신살이 붙이는 곁획
    var kinds = [];
    (o.sinsal || []).forEach(function (s2) {
      ["도화", "역마", "화개", "천을귀인", "양인", "괴강", "백호"].forEach(function (k) {
        if (s2.indexOf(k) >= 0 && kinds.indexOf(k) < 0) kinds.push(k);
      });
    });
    kinds.slice(0, 4).forEach(function (k, i) {
      var side = i % 2 ? 1 : -1;
      var y2 = segTop + 60 + Math.floor(i / 2) * (segH * 1.7) + rng() * 30;
      sideMark(g, k, cx + side * (w * 0.62), y2, 16, side);
    });
    g.restore();
  }

  window.BujeokSeal = { encode: encode, decode: decode };
  window.BujeokArt = { render: render, ELEM: ELEM, GAN_HJ: GAN_HJ, JI_HJ: JI_HJ };
})();
