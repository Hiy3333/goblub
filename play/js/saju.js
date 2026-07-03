// goblub 사주 계산 모듈. window.Saju = { compute, pillarText, GAN, JI }
(function () {
  var GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  var GAN_HANJA = "甲乙丙丁戊己庚辛壬癸";
  var JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  var JI_HANJA = "子丑寅卯辰巳午未申酉戌亥";
  var GAN_OHENG = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
  var JI_OHENG = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
  var ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  // terms 배열 인덱스 → 그 절 이후의 월지: 소한→축, 입춘→인, ... 대설→자
  var TERM_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];

  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
      Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // birth: {y,m,d,hour,min} (hour=null이면 시주 생략, 경계판정은 12:00 가정)
  function compute(data, birth) {
    var h = birth.hour == null ? 12 : birth.hour;
    var mi = birth.hour == null ? 0 : birth.min;
    var stamp = ts(birth.y, birth.m, birth.d, h, mi);

    // 년주: 입춘(terms[1]) 기준
    var ipchun = termTs(data, birth.y, 1);
    var effYear = stamp < ipchun ? birth.y - 1 : birth.y;
    var yIdx = ((effYear - 4) % 60 + 60) % 60;

    // 월주: 출생년의 절들 중 마지막으로 지난 절. 소한 이전이면 전년 대설 이후 = 자월.
    var branch = 0; // 자
    for (var i = 0; i < 12; i++) {
      if (stamp >= termTs(data, birth.y, i)) branch = TERM_BRANCH[i];
      else break;
    }
    var yGan = yIdx % 10;
    var startGan = (((yGan % 5) * 2) + 2) % 10; // 오호둔: 인월의 월간
    var mOffset = (branch - 2 + 12) % 12; // 인=0 … 축=11
    var mGan = (startGan + mOffset) % 10;

    // 일주: 23시 이후는 다음날로
    var j = jdn(birth.y, birth.m, birth.d);
    if (birth.hour != null && birth.hour >= 23) j += 1;
    var dIdx = ((j - data.anchorJdn) % 60 + 60) % 60;

    // 시주 (오서둔)
    var hourPillar = null;
    if (birth.hour != null) {
      var hBranch = Math.floor(((birth.hour + 1) % 24) / 2);
      var hGan = ((dIdx % 10) % 5 * 2 + hBranch) % 10;
      hourPillar = [hGan, hBranch];
    }

    var pillars = {
      year: [yGan, yIdx % 12],
      month: [mGan, branch],
      day: [dIdx % 10, dIdx % 12],
      hour: hourPillar
    };
    var oheng = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    ["year", "month", "day", "hour"].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      oheng[GAN_OHENG[p[0]]]++;
      oheng[JI_OHENG[p[1]]]++;
    });
    return {
      pillars: pillars,
      ilgan: pillars.day[0],
      zodiac: ZODIAC[yIdx % 12],
      oheng: oheng
    };
  }

  function ts(y, m, d, h, mi) { return ((y * 100 + m) * 100 + d) * 10000 + h * 100 + mi; }
  function termTs(data, year, idx) {
    var t = data.terms[String(year)][idx]; // 'MM-DD HH:MM'
    return ts(year, +t.slice(0, 2), +t.slice(3, 5), +t.slice(6, 8), +t.slice(9, 11));
  }

  function pillarText(p) {
    return {
      hanja: GAN_HANJA[p[0]] + JI_HANJA[p[1]],
      hangul: GAN[p[0]] + JI[p[1]]
    };
  }

  window.Saju = { compute: compute, pillarText: pillarText, GAN: GAN, JI: JI };
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
    }
  };
})();
