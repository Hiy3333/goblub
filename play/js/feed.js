// goblub 공용 재화·기록 모듈.
// GoblubFeed.record(key, data): 종합 프로필 카드용 결과 기록.
// 지갑: localStorage "goblub_wallet" — 잔액은 이 기기 기준(유료 별은 서버 원장 별도).
// ※ 콘텐츠 플레이 적립은 폐지됨 — grant()는 호환용 no-op (별 획득은 운영자 지급·충전만).
(function () {
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

  // ================= 가상재화 '별' 지갑 =================
  var WKEY = "goblub_wallet";
  function wload() { try { var w = JSON.parse(localStorage.getItem(WKEY)); if (w && typeof w.balance === "number") return w; } catch (e) {} return { balance: 0, streak: 0, lastCheck: "", earnLog: {} }; }
  function wsave(w) { try { localStorage.setItem(WKEY, JSON.stringify(w)); } catch (e) {} }

  function wallet() { var w = wload(); return { balance: w.balance, streak: w.streak }; }
  function earn(n, silent) { var w = wload(); w.balance += n; wsave(w); if (!silent) toast("⭐ 별 +" + n + "! (보유 " + w.balance + ")"); return w.balance; }
  function spend(n) { var w = wload(); if (w.balance < n) return false; w.balance -= n; wsave(w); return true; }

  // 콘텐츠 플레이 적립 폐지 — 각 페이지의 grant() 호출은 그대로 두고 여기서 무시한다
  function grant() { return false; }

  // 종합 프로필 카드용 — 테스트 결과를 goblub_card 에 모아둠
  function record(key, data) {
    try {
      var c = JSON.parse(localStorage.getItem("goblub_card") || "{}");
      c[key] = { e: (data && data.emoji) || "", t: (data && data.title) || "", tags: (data && data.tags) || [] };
      localStorage.setItem("goblub_card", JSON.stringify(c));
    } catch (e) {}
  }
  function cardData() { try { return JSON.parse(localStorage.getItem("goblub_card") || "{}"); } catch (e) { return {}; } }

  // 관리자 지급 별 보관분 수령(로그인 순간 feed.js가 없던 페이지 대비)
  try {
    var gift = +(localStorage.getItem("goblub_gift_pending") || 0);
    if (gift > 0) {
      localStorage.removeItem("goblub_gift_pending");
      earn(gift, true);
      toast("🎁 운영자가 보낸 별 +" + gift + " 도착!");
    }
  } catch (e) {}

  window.GoblubFeed = { grant: grant, record: record, cardData: cardData,
    wallet: wallet, earn: earn, spend: spend };
})();
