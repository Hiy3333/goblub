// goblub 사주 계산 모듈 v2.
// window.Saju = { compute, pillarText, sipseong, branchMainGan, GAN, JI, SIPSEONG }
// compute(data, birth, opts): birth={y,m,d,hour,min}, opts={trueSolar:bool, gender:'M'|'F'|null}
(function () {
  var GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  var GAN_HANJA = "甲乙丙丁戊己庚辛壬癸";
  var JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  var JI_HANJA = "子丑寅卯辰巳午未申酉戌亥";
  var OH = ["목", "화", "토", "금", "수"];
  var ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  var TERM_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
  var SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  // 지장간: [천간인덱스, 가중치] — 본기 1.0, 중기 0.5, 여기 0.3
  var JIJANGGAN = [
    [[8, 0.3], [9, 1.0]],            // 자: 임·계
    [[9, 0.3], [7, 0.5], [5, 1.0]],  // 축: 계·신·기
    [[4, 0.3], [2, 0.5], [0, 1.0]],  // 인: 무·병·갑
    [[0, 0.3], [1, 1.0]],            // 묘: 갑·을
    [[1, 0.3], [9, 0.5], [4, 1.0]],  // 진: 을·계·무
    [[4, 0.3], [6, 0.5], [2, 1.0]],  // 사: 무·경·병
    [[2, 0.3], [5, 0.5], [3, 1.0]],  // 오: 병·기·정
    [[3, 0.3], [1, 0.5], [5, 1.0]],  // 미: 정·을·기
    [[4, 0.3], [8, 0.5], [6, 1.0]],  // 신: 무·임·경
    [[6, 0.3], [7, 1.0]],            // 유: 경·신
    [[7, 0.3], [3, 0.5], [4, 1.0]],  // 술: 신·정·무
    [[4, 0.3], [0, 0.5], [8, 1.0]]   // 해: 무·갑·임
  ];

  function ganOh(g) { return Math.floor(g / 2); }

  function sipseong(ilgan, gan) {
    var rel = ((ganOh(gan) - ganOh(ilgan)) + 5) % 5;
    var same = (gan % 2) === (ilgan % 2);
    return rel * 2 + (same ? 0 : 1);
  }

  function branchMainGan(ji) {
    var arr = JIJANGGAN[ji];
    return arr[arr.length - 1][0];
  }

  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
      Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function compute(data, birth, opts) {
    opts = opts || {};
    var adj = { y: birth.y, m: birth.m, d: birth.d, hour: birth.hour, min: birth.hour == null ? 0 : (birth.min || 0) };
    if (opts.trueSolar && birth.hour != null) {
      var t0 = new Date(adj.y, adj.m - 1, adj.d, adj.hour, adj.min - 30);
      adj = { y: t0.getFullYear(), m: t0.getMonth() + 1, d: t0.getDate(), hour: t0.getHours(), min: t0.getMinutes() };
    }
    var h = adj.hour == null ? 12 : adj.hour;
    var mi = adj.min;
    var stamp = ts(adj.y, adj.m, adj.d, h, mi);

    var ipchun = termTs(data, adj.y, 1);
    var effYear = stamp < ipchun ? adj.y - 1 : adj.y;
    var yIdx = ((effYear - 4) % 60 + 60) % 60;

    var branch = 0;
    for (var i = 0; i < 12; i++) {
      if (stamp >= termTs(data, adj.y, i)) branch = TERM_BRANCH[i];
      else break;
    }
    var yGan = yIdx % 10;
    var startGan = (((yGan % 5) * 2) + 2) % 10;
    var mGan = (startGan + ((branch - 2 + 12) % 12)) % 10;

    var j = jdn(adj.y, adj.m, adj.d);
    if (adj.hour != null && adj.hour >= 23) j += 1;
    var dIdx = ((j - data.anchorJdn) % 60 + 60) % 60;

    var hourPillar = null;
    if (adj.hour != null) {
      var hBranch = Math.floor(((adj.hour + 1) % 24) / 2);
      hourPillar = [((dIdx % 10) % 5 * 2 + hBranch) % 10, hBranch];
    }

    var pillars = { year: [yGan, yIdx % 12], month: [mGan, branch], day: [dIdx % 10, dIdx % 12], hour: hourPillar };
    var ilgan = pillars.day[0];
    var myOh = ganOh(ilgan);

    // 가중 오행 + 신강약 (일간 자신은 세력 계산에서 제외, 월지 항목 ×2)
    var ohw = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    var support = 0, totalW = 0;
    function addW(oh, w, isMonthJi) {
      ohw[OH[oh]] += w;
      var sw = isMonthJi ? w * 2 : w;
      totalW += sw;
      if (oh === myOh || (oh + 1) % 5 === myOh) support += sw;
    }
    ["year", "month", "day", "hour"].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      if (k !== "day") addW(ganOh(p[0]), 1.0, false);
      else ohw[OH[myOh]] += 1.0; // 일간은 차트에는 포함, 세력에는 불포함
      JIJANGGAN[p[1]].forEach(function (jg) { addW(ganOh(jg[0]), jg[1], k === "month"); });
    });
    var ratio = totalW ? support / totalW : 0.5;
    var strength = ratio >= 0.55 ? "신강" : (ratio <= 0.45 ? "신약" : "중화");

    // 십성 분포(천간 3 + 지지 본기 4, 일간 제외)
    var ssCount = {};
    function addSS(g) { var s = sipseong(ilgan, g); ssCount[s] = (ssCount[s] || 0) + 1; }
    ["year", "month", "hour"].forEach(function (k) { if (pillars[k]) addSS(pillars[k][0]); });
    ["year", "month", "day", "hour"].forEach(function (k) { if (pillars[k]) addSS(branchMainGan(pillars[k][1])); });
    var topSS = null;
    for (var s in ssCount) if (topSS == null || ssCount[s] > ssCount[topSS]) topSS = s;

    return {
      pillars: pillars, ilgan: ilgan, zodiac: ZODIAC[yIdx % 12],
      oheng: ohw, strength: { ratio: ratio, label: strength },
      topSipseong: topSS == null ? null : +topSS,
      daeun: opts.gender ? daeun(data, adj, opts.gender, pillars) : null,
      adj: adj
    };
  }

  function daeun(data, adj, gender, pillars) {
    var yangYear = pillars.year[0] % 2 === 0;
    var forward = (yangYear && gender === "M") || (!yangYear && gender === "F");
    var birthDate = new Date(adj.y, adj.m - 1, adj.d, adj.hour == null ? 12 : adj.hour, adj.min || 0);
    var target = null, approx = false;
    for (var yy = adj.y - 1; yy <= adj.y + 1; yy++) {
      if (yy < 1900 || yy > 2100) { approx = true; continue; }
      data.terms[String(yy)].forEach(function (t) {
        var c = new Date(yy, +t.slice(0, 2) - 1, +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
        if (forward) { if (c > birthDate && (!target || c < target)) target = c; }
        else { if (c < birthDate && (!target || c > target)) target = c; }
      });
    }
    var num = 5;
    if (target) {
      num = Math.round(Math.abs(target - birthDate) / 86400000 / 3);
      if (num < 1) num = 1;
      if (num > 10) num = 10;
      approx = false;
    } else approx = true;
    var mIdx = 0;
    for (var i = 0; i < 60; i++) if (i % 10 === pillars.month[0] && i % 12 === pillars.month[1]) { mIdx = i; break; }
    var list = [];
    for (var n = 1; n <= 8; n++) {
      var idx = ((mIdx + (forward ? n : -n)) % 60 + 60) % 60;
      list.push({ age: num + (n - 1) * 10, gan: idx % 10, ji: idx % 12 });
    }
    return { forward: forward, num: num, approx: approx, list: list };
  }

  function ts(y, m, d, h, mi) { return ((y * 100 + m) * 100 + d) * 10000 + h * 100 + mi; }
  function termTs(data, year, idx) {
    var t = data.terms[String(year)][idx];
    return ts(year, +t.slice(0, 2), +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
  }

  function pillarText(p) {
    return { hanja: GAN_HANJA[p[0]] + JI_HANJA[p[1]], hangul: GAN[p[0]] + JI[p[1]] };
  }

  window.Saju = {
    compute: compute, pillarText: pillarText, sipseong: sipseong,
    branchMainGan: branchMainGan, GAN: GAN, JI: JI, SIPSEONG: SIPSEONG
  };
})();

// 풀이 텍스트
(function () {
  window.SajuText = {
    ilgan: [
      "큰 나무(甲木)처럼 곧고 당당한 리더형이에요. 한번 정한 방향은 흔들림 없이 밀고 나가고, 주변에 그늘을 내어주는 든든함이 있어요. 다만 가끔은 휘어질 줄 아는 유연함도 필요해요.",
      "들풀과 덩굴(乙木)처럼 부드럽지만 끈질긴 생존력의 소유자예요. 어떤 환경에서도 길을 찾아내는 적응력이 최고 무기! 은근한 고집은 아무도 못 말려요.",
      "태양(丙火)처럼 밝고 화끈한 에너지의 소유자예요. 어디서든 존재감이 빛나고 사람들을 끌어당겨요. 다만 열정이 과열되면 금방 지칠 수 있으니 완급 조절이 포인트.",
      "촛불과 달빛(丁火)처럼 섬세하고 따뜻한 감성파예요. 통찰력이 깊어 사람 마음을 잘 읽고, 조용히 주변을 밝혀요. 속마음을 너무 감추지만 않으면 금상첨화.",
      "큰 산(戊土)처럼 묵직하고 믿음직한 사람이에요. 쉽게 흔들리지 않는 안정감으로 주변의 기둥이 되어줘요. 가끔 고집이 산만큼 클 수 있다는 건 비밀.",
      "기름진 밭(己土)처럼 포용력 있고 실속 있는 타입이에요. 남을 키워주고 보듬는 데 재능이 있어요. 정작 자기 챙기는 건 뒷전이 되기 쉬우니 셀프 케어 잊지 마세요.",
      "무쇠와 바위(庚金)처럼 결단력 있고 의리 넘치는 타입! 옳다고 믿으면 정면 돌파하는 강단이 있어요. 날이 너무 서 있으면 주변이 긴장하니 가끔은 칼집에 넣어두기.",
      "보석(辛金)처럼 세련되고 예리한 감각의 소유자예요. 디테일에 강하고 완성도에 대한 기준이 높아요. 스스로에게도 남에게도 조금만 너그러워지면 완벽.",
      "큰 강물(壬水)처럼 스케일 크고 지혜로운 자유인이에요. 새로운 것을 향한 호기심이 넘치고 발상이 유연해요. 흐르다 보면 산만해질 수 있으니 물길 하나는 정해두기.",
      "이슬비와 옹달샘(癸水)처럼 맑고 섬세한 직관파예요. 조용해 보여도 속에는 깊은 생각이 흐르고 있어요. 예민한 만큼 혼자 충전하는 시간이 꼭 필요해요."
    ],
    ohengMost: {
      목: "오행 중 나무(木) 기운이 가장 많아요. 성장욕과 추진력이 넘치는 타입!",
      화: "오행 중 불(火) 기운이 가장 많아요. 열정과 표현력이 넘치는 타입!",
      토: "오행 중 흙(土) 기운이 가장 많아요. 신뢰감과 안정감이 강점인 타입!",
      금: "오행 중 쇠(金) 기운이 가장 많아요. 결단력과 원칙이 뚜렷한 타입!",
      수: "오행 중 물(水) 기운이 가장 많아요. 지혜와 유연함이 흐르는 타입!"
    },
    ohengNone: {
      목: "나무(木) 기운이 비어 있어요. 새로운 시작 앞에서 머뭇거릴 때는 초록 식물 곁에서 기운을 빌려보세요.",
      화: "불(火) 기운이 비어 있어요. 표현이 아쉬울 땐 밝은 색 옷과 햇볕이 도움이 된대요.",
      토: "흙(土) 기운이 비어 있어요. 마음이 붕 뜰 때는 흙 밟기, 산책으로 중심을 잡아보세요.",
      금: "쇠(金) 기운이 비어 있어요. 결정이 어려울 땐 마감 시간을 정해두는 습관이 좋아요.",
      수: "물(水) 기운이 비어 있어요. 생각이 막힐 땐 물가 산책이나 반신욕이 특효약!"
    },
    sipseongDesc: [
      "비견이 많아요 — 주체성과 자립심이 강한 사주. 내 사업, 내 브랜드와 인연이 깊어요.",
      "겁재가 많아요 — 승부사 기질! 경쟁에서 강하지만 동업·금전 관리는 신중하게.",
      "식신이 많아요 — 먹복과 표현력을 타고났어요. 만들고 나누는 일에서 빛납니다.",
      "상관이 많아요 — 번뜩이는 재능과 말솜씨. 틀을 깨는 창의성이 무기예요.",
      "편재가 많아요 — 돈 냄새를 맡는 감각! 활동 반경이 넓을수록 재물이 붙어요.",
      "정재가 많아요 — 성실하게 모으는 알부자 스타일. 신용이 곧 재산입니다.",
      "편관이 많아요 — 위기에 강한 승부 근성. 책임이 클수록 크게 성장해요.",
      "정관이 많아요 — 반듯한 명예운. 조직에서 인정받는 모범생 기운입니다.",
      "편인이 많아요 — 독특한 시선과 깊은 탐구심. 전문 분야를 파면 대성해요.",
      "정인이 많아요 — 배움복과 어른복. 공부·자격·문서에서 운이 따라요."
    ],
    strengthDesc: {
      신강: "신강(身強) — 일간의 힘이 튼튼해요. 스스로 끌고 가는 힘이 강하니, 기운을 쏟아낼 무대가 넓을수록 잘 풀립니다.",
      중화: "중화(中和) — 힘의 균형이 좋은 사주예요. 상황에 따라 유연하게 강약을 조절할 수 있는 안정형입니다.",
      신약: "신약(身弱) — 일간이 섬세한 타입. 주변의 도움을 잘 받는 것이 곧 실력이에요. 무리한 확장보다 내실이 유리합니다."
    }
  };
})();
