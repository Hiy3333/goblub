// goblub 궁합 엔진. window.Gunghap = { score(rA, rB) }
// rA, rB = Saju.compute 결과. 점수 100 = 일간30 + 일지30 + 오행25 + 띠15.
(function () {
  var YUKHAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  var CHUNG = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
  var OH = ["목", "화", "토", "금", "수"];

  function ganOh(g) { return Math.floor(g / 2); }

  function jiRel(a, b) {
    if (YUKHAP[a] === b) return "육합";
    if (CHUNG[a] === b) return "충";
    if (a !== b && a % 4 === b % 4) return "삼합";
    return "평";
  }

  function score(rA, rB) {
    var ganA = rA.pillars.day[0], ganB = rB.pillars.day[0];
    var jiA = rA.pillars.day[1], jiB = rB.pillars.day[1];

    // 1) 일간 케미 (30)
    var ilganType, ilganPt;
    if ((ganA - ganB + 10) % 10 === 5) { ilganType = "천간합"; ilganPt = 30; }
    else {
      var rel = (ganOh(ganB) - ganOh(ganA) + 5) % 5;
      if (rel === 1 || rel === 4) { ilganType = "상생"; ilganPt = 24; }
      else if (rel === 0) { ilganType = "비겁"; ilganPt = 18; }
      else { ilganType = "상극"; ilganPt = 13; }
    }

    // 2) 일지 케미 (30)
    var iljiType = jiRel(jiA, jiB);
    var iljiPt = { 육합: 30, 삼합: 26, 평: 18, 충: 8 }[iljiType];

    // 3) 오행 보완 (25)
    var lackA = OH.filter(function (k) { return rA.oheng[k] < 0.5; });
    var lackB = OH.filter(function (k) { return rB.oheng[k] < 0.5; });
    var ohengType, ohengPt, fill = 0;
    if (lackA.length === 0 && lackB.length === 0) { ohengType = "균형"; ohengPt = 20; }
    else {
      lackA.forEach(function (k) { if (rB.oheng[k] >= 1.0) fill++; });
      lackB.forEach(function (k) { if (rA.oheng[k] >= 1.0) fill++; });
      ohengType = fill > 0 ? "보완" : "결핍";
      ohengPt = Math.min(25, 13 + 4 * fill);
    }

    // 4) 띠 케미 (15)
    var ttiType = jiRel(rA.pillars.year[1], rB.pillars.year[1]);
    var ttiPt = { 육합: 15, 삼합: 13, 평: 10, 충: 4 }[ttiType];

    var total = ilganPt + iljiPt + ohengPt + ttiPt;
    var grade =
      total >= 90 ? "천생연분" :
      total >= 75 ? "찰떡궁합" :
      total >= 60 ? "노력하면 꿀떡" :
      total >= 45 ? "서로 배우는 사이" : "파란만장 드라마";

    return {
      total: total, grade: grade,
      ilgan: { type: ilganType, pt: ilganPt, max: 30 },
      ilji: { type: iljiType, pt: iljiPt, max: 30 },
      oheng: { type: ohengType, pt: ohengPt, max: 25, fill: fill },
      tti: { type: ttiType, pt: ttiPt, max: 15 }
    };
  }

  var TEXTS = {
    ilgan: {
      천간합: "두 사람의 일간이 천간합! 다섯 쌍뿐인 '운명의 합'이라 만나는 순간 서로에게 없는 반쪽을 알아봅니다.",
      상생: "한쪽의 기운이 다른 쪽을 살려주는 상생 관계예요. 함께 있을수록 서로가 자라나는 조합.",
      비겁: "일간의 오행이 같은 닮은꼴 케미. 말 안 해도 통하는 대신, 고집도 똑같이 세니 양보 연습은 필수!",
      상극: "서로를 자극하는 상극 관계 — 밀당의 정석입니다. 긴장감이 설렘이 되면 최고, 승부욕이 되면 불꽃 튀어요."
    },
    ilji: {
      육합: "일지가 육합! 생활 리듬과 속마음이 자석처럼 붙는 조합이에요. 같이 있는 게 제일 편한 사이.",
      삼합: "일지가 같은 삼합 팀이에요. 목표가 같아지면 무서운 시너지가 나는 동지형 케미.",
      평: "일지는 무난한 관계 — 큰 마찰도, 큰 끌림도 아닌 백지예요. 둘이 그리기 나름!",
      충: "일지가 충이라 생활 습관에서 부딪히기 쉬워요. 대신 권태기가 없는 다이나믹 커플이 되기도!"
    },
    oheng: {
      균형: "두 사람 모두 오행이 고르게 차 있어요. 서로에게 기대기보다 나란히 걷는 안정형 조합.",
      보완: "상대가 내게 없는 기운을 채워주는 퍼즐 케미! 함께 있으면 혼자일 때보다 완전해져요.",
      결핍: "둘 다 비슷한 기운이 비어 있어요. 같은 곳에서 함께 헤맬 수 있으니, 부족한 부분은 의식적으로 챙겨요."
    },
    tti: {
      육합: "띠끼리도 육합 — 어른들이 보면 '잘 만났다' 소리 나오는 조합이에요.",
      삼합: "띠가 같은 삼합 팀! 집안 행사에서도 척척 맞는 그림이 나옵니다.",
      평: "띠 궁합은 무난 그 자체. 특별한 가산점도 감점도 없어요.",
      충: "띠끼리는 충이라 첫인상에서 티격태격했을 수도? 알고 보면 그게 시작의 신호였을지도요."
    },
    grade: {
      천생연분: "이 정도면 사주가 아니라 예언입니다. 두 사람, 놓치면 우주가 아쉬워해요.",
      찰떡궁합: "찰떡같이 붙는 조합! 서로의 부족함이 상대의 장점으로 메워지는 사이예요.",
      "노력하면 꿀떡": "기본기는 충분해요. 서로의 다름을 '틀림'으로 읽지만 않으면 꿀떡으로 진화합니다.",
      "서로 배우는 사이": "쉽지만은 않지만, 그래서 더 크게 배우는 관계예요. 부딪힌 만큼 단단해집니다.",
      "파란만장 드라마": "순탄한 로맨스보다 시청률 높은 드라마 같은 사이! 매회 위기, 매회 명장면입니다."
    },
    advice: {
      천생연분: "💌 도사의 한 줄: 잘 맞는 만큼 서로를 당연하게 여기지 않기 — 그게 유일한 숙제예요.",
      찰떡궁합: "💌 도사의 한 줄: 고마움을 말로 표현하는 습관 하나면 이 궁합은 완성입니다.",
      "노력하면 꿀떡": "💌 도사의 한 줄: 한 달에 한 번, 서로의 방식대로 데이트를 번갈아 기획해 보세요.",
      "서로 배우는 사이": "💌 도사의 한 줄: 싸운 날엔 '누가 맞나'보다 '뭘 배웠나'를 먼저 물어보세요.",
      "파란만장 드라마": "💌 도사의 한 줄: 드라마의 결말은 대본(두 사람의 선택)이 정합니다. 명장면을 쌓아가세요."
    }
  };

  window.Gunghap = { score: score, TEXTS: TEXTS };
})();
