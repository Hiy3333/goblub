// goblub 사주 심층 팩트 엔진 — 신살·합충형·용신(간이)·세운 테이블.
// Saju.compute 결과를 받아 AI 리포트용 "근거 팩트"를 전부 한글로 계산한다.
// window.SajuDeep = { facts(r, birth, gender) }
(function () {
  var JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  var GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  var OH = ["목", "화", "토", "금", "수"];
  var SIPSEONG = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  var GROUP_NAME = ["비겁", "식상", "재성", "관성", "인성"];
  var PILLAR_KO = { year: "년주", month: "월주", day: "일주", hour: "시주" };
  var JI_KO = { year: "년지", month: "월지", day: "일지", hour: "시지" };

  // 삼합국: [구성 지지, 왕지, 오행, 도화, 역마, 화개]
  var SAMHAP = [
    { set: [8, 0, 4], wang: 0, oh: "수", dohwa: 9, yeokma: 2, hwagae: 4, name: "수국(申子辰)" },
    { set: [5, 9, 1], wang: 9, oh: "금", dohwa: 6, yeokma: 11, hwagae: 1, name: "금국(巳酉丑)" },
    { set: [2, 6, 10], wang: 6, oh: "화", dohwa: 3, yeokma: 8, hwagae: 10, name: "화국(寅午戌)" },
    { set: [11, 3, 7], wang: 3, oh: "목", dohwa: 0, yeokma: 5, hwagae: 7, name: "목국(亥卯未)" }
  ];
  var CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  var YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  var HYEONG_PAIR = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
  var JAHYEONG = [4, 6, 9, 11]; // 진·오·유·해 자형
  // 양인(양간): 갑→묘, 병→오, 무→오, 경→유, 임→자
  var YANGIN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
  // 천을귀인: 일간 → 지지들
  var CHEONEUL = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
  var GOEGANG = ["경진", "경술", "임진", "임술"];
  var BAEKHO = ["갑진", "을미", "병술", "정축", "무진", "임술", "계축"];

  function groupOf(ji) { for (var i = 0; i < SAMHAP.length; i++) if (SAMHAP[i].set.indexOf(ji) >= 0) return SAMHAP[i]; return null; }
  function ssGroup(ilgan, gan) { return GROUP_NAME[Math.floor(Saju.sipseong(ilgan, gan) / 2)]; }
  function ohRel(myOh, rel) { return OH[(myOh + rel) % 5]; } // rel 0비겁 1식상 2재성 3관성 4인성

  function facts(r, birth, gender) {
    var P = r.pillars;
    var ilgan = r.ilgan;
    var myOh = Math.floor(ilgan / 2);
    var keys = ["year", "month", "day", "hour"].filter(function (k) { return P[k]; });
    var branches = keys.map(function (k) { return { k: k, ji: P[k][1] }; });

    // ---- 신살 ----
    var sinsal = [];
    var baseJis = [P.year[1], P.day[1]]; // 년지·일지 기준
    var seen = {};
    branches.forEach(function (b) {
      baseJis.forEach(function (base) {
        var g = groupOf(base);
        if (!g) return;
        var hits = [];
        if (b.ji === g.dohwa) hits.push("도화살(매력·인기)");
        if (b.ji === g.yeokma) hits.push("역마살(이동·변화)");
        if (b.ji === g.hwagae) hits.push("화개살(고독한 재능·자기만의 세계)");
        hits.forEach(function (h) {
          var id = b.k + h;
          if (seen[id]) return; seen[id] = 1;
          sinsal.push(JI_KO[b.k] + " " + JI[b.ji] + " — " + h);
        });
      });
    });
    if (YANGIN[ilgan] != null) branches.forEach(function (b) {
      if (b.ji === YANGIN[ilgan] && !seen["y" + b.k]) { seen["y" + b.k] = 1; sinsal.push(JI_KO[b.k] + " " + JI[b.ji] + " — 양인살(강한 추진력·양날의 검)"); }
    });
    branches.forEach(function (b) {
      if (CHEONEUL[ilgan].indexOf(b.ji) >= 0 && !seen["c" + b.k]) { seen["c" + b.k] = 1; sinsal.push(JI_KO[b.k] + " " + JI[b.ji] + " — 천을귀인(위기 때 돕는 귀인)"); }
    });
    var iljuGanji = GAN[P.day[0]] + JI[P.day[1]];
    if (GOEGANG.indexOf(iljuGanji) >= 0) sinsal.push("일주 " + iljuGanji
      + " — 괴강살(극단적 총명·리더십)");
    keys.forEach(function (k) {
      var gj = GAN[P[k][0]] + JI[P[k][1]];
      if (BAEKHO.indexOf(gj) >= 0) sinsal.push(PILLAR_KO[k] + " " + gj + " — 백호살(강렬한 기운·사건성)");
    });

    // ---- 지지 관계(합·충·형) ----
    var rel = [];
    function jiName(i) { return JI_KO[branches[i].k] + " " + JI[branches[i].ji]; }
    for (var a = 0; a < branches.length; a++) {
      for (var b2 = a + 1; b2 < branches.length; b2++) {
        var x = branches[a].ji, y = branches[b2].ji;
        CHUNG.forEach(function (p) { if ((x === p[0] && y === p[1]) || (x === p[1] && y === p[0])) rel.push(jiName(a) + " ↔ " + jiName(b2) + " 충(沖) — 부딪히며 변화를 만드는 자리"); });
        YUKHAP.forEach(function (p) { if ((x === p[0] && y === p[1]) || (x === p[1] && y === p[0])) rel.push(jiName(a) + " · " + jiName(b2) + " 육합 — 서로 끌어안는 자리"); });
        HYEONG_PAIR.forEach(function (p) { if ((x === p[0] && y === p[1]) || (x === p[1] && y === p[0])) rel.push(jiName(a) + " · " + jiName(b2) + " 형(刑) — 조정·시련을 통한 성장"); });
        if (x === y && JAHYEONG.indexOf(x) >= 0) rel.push(jiName(a) + " · " + jiName(b2) + " 자형(自刑) — 스스로를 볶는 기운");
      }
    }
    // 삼합·반합
    var jiSet = branches.map(function (b) { return b.ji; });
    SAMHAP.forEach(function (g) {
      var have = g.set.filter(function (j) { return jiSet.indexOf(j) >= 0; });
      if (have.length === 3) rel.push(g.name + " 삼합 완성 — " + g.oh + " 기운이 크게 뭉침");
      else if (have.length === 2 && have.indexOf(g.wang) >= 0) rel.push(g.name + " 반합(" + have.map(function (j) { return JI[j]; }).join("·") + ") — " + g.oh + " 기운이 뭉치는 중, " + JI[g.set.filter(function (j) { return have.indexOf(j) < 0; })[0]] + " 운이 오면 삼합 완성");
    });

    // ---- 오행 결핍·과다 ----
    var total = 0; OH.forEach(function (k) { total += r.oheng[k]; });
    var missing = [], excess = [];
    OH.forEach(function (k) {
      if (r.oheng[k] < 0.35) missing.push(k);
      else if (total && r.oheng[k] / total >= 0.34) excess.push(k);
    });

    // ---- 용신·기신 (간이 판정: 억부 + 조후 보정) ----
    var use = [], avoid = [], why = [];
    if (r.strength.label === "신약") {
      use = [ohRel(myOh, 4), ohRel(myOh, 0)];
      avoid = [ohRel(myOh, 3), ohRel(myOh, 2)];
      why.push("신약 — 나를 살리는 인성(" + ohRel(myOh, 4) + ")·비겁(" + ohRel(myOh, 0) + ")이 힘이 됨");
    } else if (r.strength.label === "신강") {
      use = [ohRel(myOh, 1), ohRel(myOh, 2)];
      avoid = [ohRel(myOh, 4), ohRel(myOh, 0)];
      why.push("신강 — 기운을 흘려보내는 식상(" + ohRel(myOh, 1) + ")·재성(" + ohRel(myOh, 2) + ")이 살 길");
    } else {
      use = missing.length ? missing.slice(0, 2) : [ohRel(myOh, 1)];
      avoid = excess.slice(0, 2);
      why.push("중화 — 부족한 오행을 채우는 방향이 유리");
    }
    var wolJi = P.month[1];
    if ([11, 0, 1].indexOf(wolJi) >= 0) { if (use.indexOf("화") < 0) use.unshift("화"); why.push("겨울생(월지 " + JI[wolJi] + ") — 따뜻한 화 기운이 조후상 필요"); }
    if ([5, 6, 7].indexOf(wolJi) >= 0) { if (use.indexOf("수") < 0) use.unshift("수"); why.push("여름생(월지 " + JI[wolJi] + ") — 식혀주는 수 기운이 조후상 필요"); }
    use = use.slice(0, 3);
    avoid = avoid.filter(function (o) { return use.indexOf(o) < 0; }).slice(0, 2);

    // ---- 배우자궁(일지) ----
    var spouseJi = P.day[1];
    var spouse = {
      ji: JI[spouseJi],
      sipseong: SIPSEONG[Saju.sipseong(ilgan, Saju.branchMainGan(spouseJi))],
      sinsal: sinsal.filter(function (s) { return s.indexOf("일지") === 0; }).map(function (s) { return s.split("— ")[1]; })
    };

    // ---- 대운(현재 표시 + 지지 십성 추가) ----
    var nowYear = new Date().getFullYear();
    var age = nowYear - birth.y + 1; // 세는나이
    var daeun = null;
    if (r.daeun) {
      daeun = r.daeun.list.map(function (d) {
        return {
          age: d.age,
          ganji: GAN[d.gan] + JI[d.ji],
          ganSipseong: SIPSEONG[Saju.sipseong(ilgan, d.gan)],
          jiSipseong: SIPSEONG[Saju.sipseong(ilgan, Saju.branchMainGan(d.ji))],
          current: age >= d.age && age < d.age + 10
        };
      });
    }

    // ---- 세운 테이블(올해부터 10년) ----
    var seun = [];
    for (var yy = nowYear; yy < nowYear + 10; yy++) {
      var idx = ((yy - 4) % 60 + 60) % 60;
      var yg = idx % 10, yj = idx % 12;
      var notes = [];
      branches.forEach(function (b) {
        CHUNG.forEach(function (p) { if ((yj === p[0] && b.ji === p[1]) || (yj === p[1] && b.ji === p[0])) notes.push(JI_KO[b.k] + "와 충"); });
        YUKHAP.forEach(function (p) { if ((yj === p[0] && b.ji === p[1]) || (yj === p[1] && b.ji === p[0])) notes.push(JI_KO[b.k] + "와 육합"); });
      });
      SAMHAP.forEach(function (g) {
        if (g.set.indexOf(yj) < 0) return;
        var have = g.set.filter(function (j) { return jiSet.indexOf(j) >= 0 && j !== yj; });
        if (have.length >= 2) notes.push(g.name + " 삼합 완성");
      });
      seun.push({
        year: yy, age: yy - birth.y + 1,
        ganji: GAN[yg] + JI[yj],
        ganSipseong: SIPSEONG[Saju.sipseong(ilgan, yg)],
        jiSipseong: SIPSEONG[Saju.sipseong(ilgan, Saju.branchMainGan(yj))],
        notes: notes
      });
    }

    return {
      nowYear: nowYear, koreanAge: age,
      sinsal: sinsal, relations: rel,
      missing: missing, excess: excess,
      yongshin: { use: use, avoid: avoid, reason: why.join(" / ") },
      spouse: spouse,
      daeun: daeun, seun: seun
    };
  }

  window.SajuDeep = { facts: facts };
})();
