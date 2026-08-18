// goblub 「부엉이 별자리 궁합」 천문 엔진 — window.Astro
// 생일의 실제 하늘: 태양·달·수성~명왕성의 황경(黃經)과 별자리, 달의 위상,
// 노드(북교점)·릴리트, 역행 여부, (시각을 알면) 상승궁까지 계산한다.
// 두 사람 행성 사이의 각(시나스트리)도 산출.
//
// 외부 API 없이 궤도 요소로 직접 계산한다(Paul Schlyter 방식 + 명왕성 곡선맞춤).
// 정확도(1900~2100): 태양 ~0.01° · 달 ~0.3° · 행성 ~0.5° · 명왕성 ~1° —
// 별자리(30° 폭)와 각(오브 5~7°) 판정에는 차고 넘친다.
// 검증: 전문 점성술 차트(1989-03-06 대구)와 전 천체 대조 — 커밋 메시지 참조.
(function () {
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function rev(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * D2R); }
  function cosd(x) { return Math.cos(x * D2R); }
  function atan2d(y, x) { return rev(Math.atan2(y, x) * R2D); }

  // 2000년 1월 0.0(UT) 기준 경과일. 한국 출생 시각(KST)은 UT+9.
  function dayNumber(y, m, D, hourKST, minKST) {
    var h = (hourKST == null ? 12 : hourKST) + (minKST || 0) / 60 - 9; // KST → UT
    var d = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
          + Math.floor(275 * m / 9) + D - 730530;
    return d + h / 24;
  }

  function eccAnom(M, e) {
    var E = M + e * R2D * sind(M) * (1 + e * cosd(M));
    for (var i = 0; i < 6; i++)
      E = E - (E - e * R2D * sind(E) - M) / (1 - e * cosd(E));
    return E;
  }

  function orbitXYZ(N, inc, w, a, e, M) {
    var E = eccAnom(rev(M), e);
    var xv = a * (cosd(E) - e), yv = a * Math.sqrt(1 - e * e) * sind(E);
    var v = atan2d(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
    var u = v + w;
    return {
      x: r * (cosd(N) * cosd(u) - sind(N) * sind(u) * cosd(inc)),
      y: r * (sind(N) * cosd(u) + cosd(N) * sind(u) * cosd(inc)),
      z: r * sind(u) * sind(inc), r: r
    };
  }

  function sunState(d) {
    var w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d;
    var M = rev(356.0470 + 0.9856002585 * d);
    var E = M + e * R2D * sind(M) * (1 + e * cosd(M));
    var xv = cosd(E) - e, yv = Math.sqrt(1 - e * e) * sind(E);
    var v = atan2d(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
    var lon = rev(v + w);
    return { lon: lon, x: r * cosd(lon), y: r * sind(lon), Ms: M, ws: w };
  }

  function moonLonAt(d, sun) {
    var N = 125.1228 - 0.0529538083 * d, inc = 5.1454;
    var w = 318.0634 + 0.1643573223 * d, a = 60.2666, e = 0.054900;
    var M = rev(115.3654 + 13.0649929509 * d);
    var p = orbitXYZ(N, inc, w, a, e, M);
    var lon = atan2d(p.y, p.x);
    // 주요 섭동 — 안 넣으면 1.5°씩 틀어진다
    var Ls = rev(sun.Ms + sun.ws), Lm = rev(N + w + M);
    var Dm = rev(Lm - Ls), F = rev(Lm - N), Ms = sun.Ms;
    lon += -1.274 * sind(M - 2 * Dm) + 0.658 * sind(2 * Dm) - 0.186 * sind(Ms)
         - 0.059 * sind(2 * M - 2 * Dm) - 0.057 * sind(M - 2 * Dm + Ms)
         + 0.053 * sind(M + 2 * Dm) + 0.046 * sind(2 * Dm - Ms) + 0.041 * sind(M - Ms)
         - 0.035 * sind(Dm) - 0.031 * sind(M + Ms) - 0.015 * sind(2 * F - 2 * Dm)
         + 0.011 * sind(M - 4 * Dm);
    return rev(lon);
  }

  var EL = {
    mercury: function (d) { return [48.3313 + 3.24587e-5 * d, 7.0047 + 5.00e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d]; },
    venus:   function (d) { return [76.6799 + 2.46590e-5 * d, 3.3946 + 2.75e-8 * d, 54.8910 + 1.38374e-5 * d, 0.723330, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d]; },
    mars:    function (d) { return [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d]; },
    jupiter: function (d) { return [100.4542 + 2.76854e-5 * d, 1.3030 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.8950 + 0.0830853001 * d]; },
    saturn:  function (d) { return [113.6634 + 2.38980e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.9670 + 0.0334442282 * d]; },
    uranus:  function (d) { return [74.0005 + 1.3978e-5 * d, 0.7733 + 1.9e-8 * d, 96.6612 + 3.0565e-5 * d, 19.18171 - 1.55e-8 * d, 0.047318 + 7.45e-9 * d, 142.5905 + 0.011725806 * d]; },
    neptune: function (d) { return [131.7806 + 3.0173e-5 * d, 1.7700 - 2.55e-7 * d, 272.8461 - 6.027e-6 * d, 30.05826 + 3.313e-8 * d, 0.008606 + 2.15e-9 * d, 260.2471 + 0.005995147 * d]; }
  };

  function planetHelioLonLatR(name, d) {
    if (name === "pluto") {
      // 명왕성 — 궤도요소 대신 곡선맞춤(1900~2100 유효)
      var S = 50.03 + 0.033459652 * d, P = 238.95 + 0.003968789 * d;
      var lon = 238.9508 + 0.00400703 * d
        - 19.799 * sind(P) + 19.848 * cosd(P) + 0.897 * sind(2 * P) - 4.956 * cosd(2 * P)
        + 0.610 * sind(3 * P) + 1.211 * cosd(3 * P) - 0.341 * sind(4 * P) - 0.190 * cosd(4 * P)
        + 0.128 * sind(5 * P) - 0.034 * cosd(5 * P) - 0.038 * sind(6 * P) + 0.031 * cosd(6 * P)
        + 0.020 * sind(S - P) - 0.010 * cosd(S - P);
      var lat = -3.9082 - 5.453 * sind(P) - 14.975 * cosd(P) - 1.673 * sind(2 * P) - 1.055 * cosd(2 * P)
        + 0.174 * sind(3 * P) + 0.522 * cosd(3 * P) + 0.061 * sind(4 * P) + 0.185 * cosd(4 * P)
        + 0.014 * sind(5 * P) - 0.014 * cosd(5 * P);
      var r = 40.72 + 6.68 * sind(P) + 6.90 * cosd(P) - 1.18 * sind(2 * P) - 0.03 * cosd(2 * P)
        + 0.15 * sind(3 * P) - 0.14 * cosd(3 * P);
      return { lon: rev(lon), lat: lat, r: r };
    }
    var el = EL[name](d);
    var p = orbitXYZ(el[0], el[1], el[2], el[3], el[4], el[5]);
    var lon = atan2d(p.y, p.x), lat = Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y)) * R2D;
    var Mj = rev(EL.jupiter(d)[5]), Msat = rev(EL.saturn(d)[5]), Mura = rev(EL.uranus(d)[5]);
    if (name === "jupiter") {
      lon += -0.332 * sind(2 * Mj - 5 * Msat - 67.6) - 0.056 * sind(2 * Mj - 2 * Msat + 21)
           + 0.042 * sind(3 * Mj - 5 * Msat + 21) - 0.036 * sind(Mj - 2 * Msat)
           + 0.022 * cosd(Mj - Msat) + 0.023 * sind(2 * Mj - 3 * Msat + 52)
           - 0.016 * sind(Mj - 5 * Msat - 69);
    } else if (name === "saturn") {
      lon += 0.812 * sind(2 * Mj - 5 * Msat - 67.6) - 0.229 * cosd(2 * Mj - 4 * Msat - 2)
           + 0.119 * sind(Mj - 2 * Msat - 3) + 0.046 * sind(2 * Mj - 6 * Msat - 69)
           + 0.014 * sind(Mj - 3 * Msat + 32);
    } else if (name === "uranus") {
      lon += 0.040 * sind(Msat - 2 * Mura + 6) + 0.035 * sind(Msat - 3 * Mura + 33)
           - 0.015 * sind(Mj - Mura + 20);
    }
    return { lon: rev(lon), lat: lat, r: p.r };
  }

  function planetGeoLon(name, d, sun) {
    var h = planetHelioLonLatR(name, d);
    var xh = h.r * cosd(h.lon) * cosd(h.lat), yh = h.r * sind(h.lon) * cosd(h.lat);
    return atan2d(yh + sun.y, xh + sun.x);
  }

  // 평균 릴리트(달 원지점) — J2000 평균 근지점 83.353° + 0.1114035°/일, 원지점 = +180°
  function lilithLon(d) { return rev(263.3532 + 0.11140353 * (d - 1.5)); }
  // 평균 북교점 — 역행한다
  function nodeLon(d) { return rev(125.1228 - 0.0529538083 * d); }

  // 상승궁(ASC)·중천(MC) — 시각을 알 때만. 출생지 미입력이므로 한국 중부(위도 36.5, 동경 127.8) 기준.
  function ascMc(d, lat, lon) {
    var eps = 23.4393 - 3.563e-7 * d;
    var s = sunState(d);
    // 지방 항성시(도 단위): 자정 항성시(태양 평균황경+180) + 15°/h × UT + 경도.
    // d 의 정수 경계가 자정 UT 이므로 소수부가 곧 그날의 UT 다.
    var UT = (d - Math.floor(d)) * 24;
    var GMST0 = rev(s.Ms + s.ws + 180);
    var LST = rev(GMST0 + UT * 15 + lon);
    // MC: atan2 가 사분면을 이미 처리한다(LST 와 최대 2.5° 차이) — 추가 보정 금지
    var MC = atan2d(sind(LST), cosd(LST) * cosd(eps));
    var ASC = atan2d(cosd(LST), -(sind(LST) * cosd(eps) + Math.tan(lat * D2R) * sind(eps)));
    return { asc: rev(ASC), mc: rev(MC) };
  }

  var SIGNS = [
    { ko: "양자리", sym: "♈" }, { ko: "황소자리", sym: "♉" }, { ko: "쌍둥이자리", sym: "♊" },
    { ko: "게자리", sym: "♋" }, { ko: "사자자리", sym: "♌" }, { ko: "처녀자리", sym: "♍" },
    { ko: "천칭자리", sym: "♎" }, { ko: "전갈자리", sym: "♏" }, { ko: "사수자리", sym: "♐" },
    { ko: "염소자리", sym: "♑" }, { ko: "물병자리", sym: "♒" }, { ko: "물고기자리", sym: "♓" }
  ];
  function sign(lon) {
    var L = rev(lon), i = Math.floor(L / 30);
    var dg = L % 30, dd = Math.floor(dg), mm = Math.round((dg - dd) * 60);
    if (mm === 60) { dd++; mm = 0; }
    return { ko: SIGNS[i].ko, sym: SIGNS[i].sym, deg: dd, min: mm,
             degText: dd + "°" + (mm < 10 ? "0" : "") + mm + "′" };
  }

  var PHASES = [
    { max: 22.5, ko: "삭(달이 숨은 밤)", emo: "🌑" }, { max: 67.5, ko: "초승달", emo: "🌒" },
    { max: 112.5, ko: "상현달", emo: "🌓" }, { max: 157.5, ko: "차오르는 달", emo: "🌔" },
    { max: 202.5, ko: "보름달", emo: "🌕" }, { max: 247.5, ko: "기우는 달", emo: "🌖" },
    { max: 292.5, ko: "하현달", emo: "🌗" }, { max: 337.5, ko: "그믐달", emo: "🌘" },
    { max: 360.1, ko: "삭(달이 숨은 밤)", emo: "🌑" }
  ];
  function moonPhase(elong) {
    var e = rev(elong);
    for (var i = 0; i < PHASES.length; i++)
      if (e < PHASES[i].max)
        return { name: PHASES[i].ko, emo: PHASES[i].emo,
                 illum: Math.round((1 - cosd(e)) / 2 * 100) };
  }

  var PLANET_KO = { sun: "태양", moon: "달", mercury: "수성", venus: "금성", mars: "화성",
                    jupiter: "목성", saturn: "토성", uranus: "천왕성", neptune: "해왕성",
                    pluto: "명왕성", node: "노드", lilith: "릴리트" };
  var PLANET_SYM = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
                     jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆",
                     pluto: "♇", node: "☊", lilith: "⚸" };

  function lonsAt(d) {
    var s = sunState(d);
    var out = { sun: s.lon, moon: moonLonAt(d, s) };
    ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
      .forEach(function (k) { out[k] = planetGeoLon(k, d, s); });
    out.node = nodeLon(d); out.lilith = lilithLon(d);
    return out;
  }

  function chart(b) {
    var d = dayNumber(b.y, b.m, b.d, b.hour, b.min);
    var lons = lonsAt(d);
    // 역행 — 반나절 뒤와 비교해 황경이 줄면 역행 (노드는 원래 역행이라 표시 안 함)
    var lons2 = lonsAt(d + 0.5), retro = {};
    ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
      .forEach(function (k) {
        var dl = lons2[k] - lons[k];
        if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
        retro[k] = dl < 0;
      });
    var signs = {};
    for (var k in lons) signs[k] = sign(lons[k]);
    var c = { lons: lons, signs: signs, retro: retro,
              phase: moonPhase(lons.moon - lons.sun), hourKnown: b.hour != null };
    if (b.hour != null) {                       // 상승궁은 시각을 알 때만 의미가 있다
      var am = ascMc(d, 36.5, 127.8);           // 출생지 미입력 — 한국 중부 기준
      c.asc = sign(am.asc); c.mc = sign(am.mc);
      c.ascLon = am.asc; c.mcLon = am.mc;
    }
    return c;
  }

  var ASPECTS = [
    { ang: 0, orb: 7, ko: "합(合)", feel: "같은 자리에서 겹친 빛 — 강하게 끌어당긴다" },
    { ang: 60, orb: 5, ko: "육각(60°)", feel: "순풍 — 애쓰지 않아도 흘러간다" },
    { ang: 90, orb: 6, ko: "사각(90°)", feel: "부딪히는 각 — 긴장이 곧 자극이 된다" },
    { ang: 120, orb: 7, ko: "삼각(120°)", feel: "타고난 조화 — 편안하게 맞물린다" },
    { ang: 180, orb: 7, ko: "대극(180°)", feel: "마주 보는 자석 — 정반대라서 당긴다" }
  ];
  var PAIR_W = { "venus-mars": 5, "mars-venus": 5, "sun-moon": 4, "moon-sun": 4,
                 "venus-venus": 3, "moon-moon": 3, "sun-sun": 2.5, "moon-venus": 3,
                 "venus-moon": 3, "sun-venus": 2, "venus-sun": 2, "mars-mars": 2 };
  function aspects(cA, cB, limit) {
    var keys = ["sun", "moon", "venus", "mars", "mercury", "jupiter", "saturn"];
    var out = [];
    keys.forEach(function (pa) {
      keys.forEach(function (pb) {
        var diff = Math.abs(rev(cA.lons[pa]) - rev(cB.lons[pb]));
        if (diff > 180) diff = 360 - diff;
        ASPECTS.forEach(function (asp) {
          var orb = Math.abs(diff - asp.ang);
          if (orb <= asp.orb) {
            var w = (PAIR_W[pa + "-" + pb] || 1) + (asp.orb - orb) / asp.orb;
            out.push({ pa: pa, pb: pb, paKo: PLANET_KO[pa], pbKo: PLANET_KO[pb],
              paSym: PLANET_SYM[pa], pbSym: PLANET_SYM[pb],
              type: asp.ko, feel: asp.feel, angle: asp.ang,
              orb: Math.round(orb * 10) / 10, weight: w });
          }
        });
      });
    });
    out.sort(function (a, b) { return b.weight - a.weight; });
    return out.slice(0, limit || 5);
  }

  window.Astro = { chart: chart, aspects: aspects, PLANET_KO: PLANET_KO, PLANET_SYM: PLANET_SYM };
})();
