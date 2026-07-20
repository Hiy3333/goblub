// 귀곡의 오늘 한 마디 — 오늘 일진(日辰)과 내 일간의 십성 관계로 매일 바뀌는 한 줄.
// 엔진 계산(결정적) — 같은 날 같은 사주면 항상 같은 문장. API 비용 없음.
// window.GwigokToday = { line(data, birth) → {ganji, hj, group, text} | null }
(function () {
  var GAN = "갑을병정무기경신임계", JI = "자축인묘진사오미신유술해";
  var GAN_HJ = "甲乙丙丁戊己庚辛壬癸", JI_HJ = "子丑寅卯辰巳午未申酉戌亥";
  var CHUNG = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  var YUKHAP = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];

  // 십성 5그룹별 문구 풀 — 귀곡 말투
  var POOL = {
    0: [ // 비겁 — 나와 같은 기운
      "오늘은 네 기운이 배로 서는 날이다. 밀어붙일 일은 오전에 끝내라.",
      "동지가 붙는 날이군. 혼자 끙끙대지 말고 손을 빌려라 — 오늘은 빌려도 빚이 안 된다.",
      "고집이 세지는 날이다. 네 말이 맞아도, 오늘만은 한 박자 늦게 뱉어라.",
      "네 편이 늘어나는 날이다. 다만 지갑도 같이 열리기 쉬우니 계산은 미리 정해라."
    ],
    1: [ // 식상 — 내가 내보내는 기운
      "말과 재주가 술술 풀리는 날이다. 미뤄둔 말, 오늘 꺼내라.",
      "머리에 물이 오르는 날이군. 새 아이디어는 오늘 적어두면 산다.",
      "입이 가벼워지는 날이다. 아이디어는 좋되, 남 얘기는 오늘만 삼켜라.",
      "표현이 먹히는 날이다. 부탁·제안·고백… 뭐든 말로 하는 일에 운이 붙는다."
    ],
    2: [ // 재성 — 내가 취하는 기운
      "재물 기운이 스치는 날이다. 들어오는 돈보다 나가는 돈부터 단속해라.",
      "오늘은 손에 잡히는 것을 좇아라. 계산은 빠르게, 욕심은 반 걸음 뒤에.",
      "기회가 값을 달고 오는 날이다. 공짜를 조심하고, 값있는 것에 값을 치러라.",
      "재성이 뜨는 날이군. 흥정·계약·장보기 — 오늘은 네 눈이 밝다."
    ],
    3: [ // 관성 — 나를 누르는 기운
      "위에서 누르는 기운이 있는 날이다. 부딪히지 말고 절차대로 가라 — 그게 이기는 길이다.",
      "오늘은 이름값·책임값을 치르는 날이다. 약속 시간만 지켜도 반은 성공이다.",
      "시험대에 오르는 날이군. 보는 눈이 있으니 오늘만은 흐트러지지 마라.",
      "관(官)의 기운이 스치는 날이다. 서류·규칙·윗사람 — 오늘은 격식이 부적이다."
    ],
    4: [ // 인성 — 나를 돕는 기운
      "배움이 스며드는 날이다. 오늘 읽은 한 줄이 다음 달 너를 살린다.",
      "귀인의 기운이 도는 날이군. 연락 오면 미루지 말고 받아라.",
      "머리보다 마음이 맑은 날이다. 결정은 오늘, 실행은 내일이 좋다.",
      "도장·문서에 운이 붙는 날이다. 미뤄둔 신청·정리, 오늘 해치워라."
    ]
  };
  var CHUNG_LINE = "다만 오늘 일진이 네 일지를 치는 날이니(충), 급한 결정과 언쟁 한 번은 삼켜라.";
  var HAP_LINE = "게다가 오늘 일진이 네 일지와 합을 이루니, 사람 만나는 일에 운이 붙는다.";

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h >>> 0; }

  function line(data, birth) {
    try {
      var now = new Date();
      var today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), hour: 12, min: 0 };
      var rT = Saju.compute(data, today, {});
      var rMe = Saju.compute(data, { y: birth.y, m: birth.m, d: birth.d, hour: birth.hour, min: birth.min || 0 }, { trueSolar: true, gender: birth.gender || null });
      var tg = rT.pillars.day[0], tj = rT.pillars.day[1];
      var ss = Saju.sipseong(rMe.ilgan, tg);
      var group = Math.floor(ss / 2);
      var seed = hash(today.y + "-" + today.m + "-" + today.d + "|" + birth.y + birth.m + birth.d);
      var pool = POOL[group];
      var text = pool[seed % pool.length];
      var myJi = rMe.pillars.day[1];
      var isChung = CHUNG.some(function (p) { return (p[0] === tj && p[1] === myJi) || (p[1] === tj && p[0] === myJi); });
      var isHap = YUKHAP.some(function (p) { return (p[0] === tj && p[1] === myJi) || (p[1] === tj && p[0] === myJi); });
      if (isChung) text += "\n" + CHUNG_LINE;
      else if (isHap) text += "\n" + HAP_LINE;
      return {
        ganji: GAN[tg] + JI[tj],
        hj: GAN_HJ[tg] + JI_HJ[tj],
        group: ["비겁", "식상", "재성", "관성", "인성"][group],
        text: text
      };
    } catch (e) { return null; }
  }

  window.GwigokToday = { line: line };
})();
