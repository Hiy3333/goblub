// 고블럽 먹이 시스템. 콘텐츠 결과를 볼 때 GoblubFeed.grant(src) 호출 → 소스당 하루 1개 먹이 적립.
// 데이터: localStorage "goblub_pet" = { name, xp, pending, log: {"src_YYYYMMDD": 1} }
(function () {
  var KEY = "goblub_pet";

  var LEVELS = [
    { need: 0, name: "알", emoji: "🥚", size: 4.2, art: false, deco: "" },
    { need: 3, name: "아기 고블럽", emoji: "👾", size: 4.6, art: true, deco: "" },
    { need: 8, name: "청소년 고블럽", emoji: "👾", size: 5.2, art: true, deco: "✨" },
    { need: 15, name: "어른 고블럽", emoji: "👾", size: 5.8, art: true, deco: "🎩" },
    { need: 25, name: "대왕 고블럽", emoji: "👾", size: 6.6, art: true, deco: "👑" },
    { need: 40, name: "전설의 고블럽", emoji: "👾", size: 7.4, art: true, deco: "🌟" }
  ];

  var SOURCES = {
    saju: { label: "🔮 사주 보기", url: "saju.html" },
    fortune: { label: "🌞 오늘의 운세", url: "fortune.html" },
    today: { label: "📅 오늘의 사주", url: "today.html" },
    gunghap: { label: "💑 우리 궁합", url: "gunghap.html" },
    mbti: { label: "🍞 대환장 MBTI", url: "mbti.html" },
    love: { label: "💘 연애세포 테스트", url: "love-test.html" },
    stress: { label: "🌋 스트레스 몬스터", url: "stress-test.html" },
    zombie: { label: "🧟 좀비 생존 유형", url: "zombie.html" },
    chatroom: { label: "💬 단톡방 캐릭터", url: "chatroom.html" },
    foodtype: { label: "🍜 음식형 인간", url: "foodtype.html" },
    decide: { label: "⚡ 결정의 신", url: "decide.html" },
    tarot: { label: "🃏 오늘의 타로", url: "tarot.html" },
    cookie: { label: "🥠 오늘의 포춘쿠키", url: "cookie.html" },
    letter: { label: "💌 마음 배달", url: "letter.html" },
    pastlife: { label: "🔮 전생 파티", url: "pastlife.html" },
    balance: { label: "⚖️ 밸런스 게임", url: "balance.html" },
    roulette: { label: "🎡 복불복 룰렛", url: "roulette.html" },
    questions: { label: "🎴 질문 카드", url: "questions.html" },
    naming: { label: "📛 네이밍 생성기", url: "naming.html" },
    whack: { label: "🕳️ 감정 몬스터 팡팡", url: "whack.html" },
    reflex: { label: "⚡ 고블럽 반응속도", url: "reflex.html" },
    lotto: { label: "🎱 고블럽 로또 번호", url: "lotto.html" }
  };

  function load() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY));
      if (p && typeof p.xp === "number") return p;
    } catch (e) {}
    return { name: "이름 없는 고블럽", xp: 0, pending: 0, log: {} };
  }

  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }

  function dayKey(src) {
    var d = new Date();
    var mm = ("0" + (d.getMonth() + 1)).slice(-2), dd = ("0" + d.getDate()).slice(-2);
    return src + "_" + d.getFullYear() + mm + dd;
  }

  function levelOf(xp) {
    var lv = 0;
    for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].need) lv = i;
    return lv;
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed; left:50%; bottom:26px; transform:translateX(-50%);" +
      "background:#38352f; color:#fff; padding:10px 18px; border-radius:999px;" +
      "font-family:inherit; font-size:0.95rem; z-index:9999; opacity:0; transition:opacity 0.3s;";
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = "1"; }, 30);
    setTimeout(function () { t.style.opacity = "0"; }, 2400);
    setTimeout(function () { t.remove(); }, 2900);
  }

  function grant(src) {
    if (!SOURCES[src]) return false;
    var p = load();
    var key = dayKey(src);
    if (p.log[key]) return false;
    p.log[key] = 1;
    p.pending = (p.pending || 0) + 1;
    save(p);
    toast("🍬 고블럽 먹이 +1! (" + SOURCES[src].label + ") — 고블럽 키우기에서 먹여주세요");
    return true;
  }

  // 오늘 아직 먹이를 안 준 소스 목록
  function todayRemaining() {
    var p = load();
    return Object.keys(SOURCES).filter(function (s) { return !p.log[dayKey(s)]; })
      .map(function (s) { return { src: s, label: SOURCES[s].label, url: SOURCES[s].url }; });
  }

  // 먹이 1개 소비 → xp 1. 결과 {fed, levelUp, level}
  function feedOne() {
    var p = load();
    if ((p.pending || 0) <= 0) return { fed: false };
    var before = levelOf(p.xp);
    p.pending--;
    p.xp++;
    save(p);
    var after = levelOf(p.xp);
    return { fed: true, levelUp: after > before, level: after };
  }

  function setName(name) {
    var p = load();
    p.name = (name || "").trim().slice(0, 12) || p.name;
    save(p);
  }

  function state() {
    var p = load();
    var lv = levelOf(p.xp);
    var next = lv < LEVELS.length - 1 ? LEVELS[lv + 1].need : null;
    return { name: p.name, xp: p.xp, pending: p.pending || 0, level: lv,
      levelInfo: LEVELS[lv], nextNeed: next, maxLevel: lv === LEVELS.length - 1 };
  }

  window.GoblubFeed = { grant: grant, feedOne: feedOne, state: state, setName: setName,
    todayRemaining: todayRemaining, LEVELS: LEVELS };
})();
