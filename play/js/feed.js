// goblub 공용 재화·기록 모듈.
// GoblubFeed.grant(src): 콘텐츠 결과를 볼 때 호출 → 소스당 하루 1회 노바 +2.
// GoblubFeed.record(key, data): 종합 프로필 카드용 결과 기록.
// 지갑: localStorage "goblub_wallet" — 잔액은 이 기기 기준(유료 노바는 서버 원장 별도).
(function () {
  var SOURCES = {
    saju: { label: "🔮 사주 보기", url: "saju.html" },
    fortune: { label: "🌞 오늘의 운세", url: "today.html" },
    today: { label: "📅 오늘의 사주", url: "today.html" },
    gunghap: { label: "✧ 부엉이 별자리 궁합", url: "gunghap.html" },
    mbti: { label: "🍞 대환장 MBTI", url: "mbti.html" },
    love: { label: "💘 연애세포 테스트", url: "love-test.html" },
    stress: { label: "🌋 스트레스 몬스터", url: "stress-test.html" },
    zombie: { label: "🧟 좀비 생존 유형", url: "zombie.html" },
    chatroom: { label: "💬 단톡방 캐릭터", url: "chatroom.html" },
    foodtype: { label: "🍜 음식형 인간", url: "foodtype.html" },
    decide: { label: "⚡ 결정의 신", url: "decide.html" },
    tarot: { label: "🐱 고양이 타로", url: "cat-tarot.html" },
    cookie: { label: "🥠 해달의 포춘쿠키", url: "cookie.html" },
    letter: { label: "💌 마음 배달", url: "letter.html" },
    balance: { label: "⚖️ 밸런스 게임", url: "balance.html" },
    roulette: { label: "🎡 복불복 룰렛", url: "roulette.html" },
    bomb: { label: "💣 폭탄 돌리기", url: "bomb.html" },
    race: { label: "🏁 고브럽 생존 레이스", url: "race.html" },
    questions: { label: "🎴 질문 카드", url: "questions.html" },
    naming: { label: "📛 네이밍 생성기", url: "naming.html" },
    whack: { label: "🕳️ 감정 몬스터 팡팡", url: "whack.html" },
    reflex: { label: "⚡ 고브럽 반응속도", url: "reflex.html" },
    lotto: { label: "🍀 고브럽 로또 번호", url: "lotto.html" }
  };

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed; left:50%; bottom:26px; transform:translateX(-50%);" +
      "background:rgba(255,255,255,0.92); color:#2b3057; padding:10px 18px; border-radius:999px;" +
      "border:1px solid rgba(255,255,255,0.95); box-shadow:0 12px 26px rgba(88,99,172,0.28), inset 0 1.5px 0 rgba(255,255,255,0.9);" +
      "backdrop-filter:blur(10px); font-family:inherit; font-size:0.95rem; z-index:9999; opacity:0; transition:opacity 0.3s;";
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = "1"; }, 30);
    setTimeout(function () { t.style.opacity = "0"; }, 2400);
    setTimeout(function () { t.remove(); }, 2900);
  }

  // ================= 가상재화 '노바' 지갑 =================
  var WKEY = "goblub_wallet";
  function today() { var d = new Date(); return "" + d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2); }
  function wload() { try { var w = JSON.parse(localStorage.getItem(WKEY)); if (w && typeof w.balance === "number") return w; } catch (e) {} return { balance: 0, streak: 0, lastCheck: "", earnLog: {} }; }
  function wsave(w) { try { localStorage.setItem(WKEY, JSON.stringify(w)); } catch (e) {} }

  function wallet() { var w = wload(); return { balance: w.balance, streak: w.streak, checkedToday: w.lastCheck === today() }; }
  function earn(n, silent) { var w = wload(); w.balance += n; wsave(w); if (!silent) toast("💫 노바 +" + n + "! (보유 " + w.balance + ")"); return w.balance; }
  function earnOnce(reason, n) { var w = wload(); var k = reason + "_" + today(); if (w.earnLog[k]) return 0; w.earnLog[k] = 1; w.balance += n; wsave(w); return n; }
  function spend(n) { var w = wload(); if (w.balance < n) return false; w.balance -= n; wsave(w); return true; }

  // 콘텐츠 즐기기 → 노바 +2 (소스당 하루 1회)
  function grant(src) {
    if (!SOURCES[src]) return false;
    var g = earnOnce("play_" + src, 2);
    if (g) toast("💫 노바 +" + g + " (" + SOURCES[src].label + ")");
    return !!g;
  }

  // 종합 프로필 카드용 — 테스트 결과를 goblub_card 에 모아둠
  function record(key, data) {
    try {
      var c = JSON.parse(localStorage.getItem("goblub_card") || "{}");
      c[key] = { e: (data && data.emoji) || "", t: (data && data.title) || "", tags: (data && data.tags) || [] };
      localStorage.setItem("goblub_card", JSON.stringify(c));
    } catch (e) {}
  }
  function cardData() { try { return JSON.parse(localStorage.getItem("goblub_card") || "{}"); } catch (e) { return {}; } }

  // 관리자 지급 노바 보관분 수령(로그인 순간 feed.js가 없던 페이지 대비)
  try {
    var gift = +(localStorage.getItem("goblub_gift_pending") || 0);
    if (gift > 0) {
      localStorage.removeItem("goblub_gift_pending");
      earn(gift, true);
      toast("🎁 운영자가 보낸 노바 +" + gift + " 도착!");
    }
  } catch (e) {}

  window.GoblubFeed = { grant: grant, record: record, cardData: cardData,
    wallet: wallet, earn: earn, spend: spend };
})();
