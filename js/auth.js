// goblub 구글 간편 로그인 — Google Identity Services(GIS) 기반.
// GOOGLE_CLIENT_ID 는 Google Cloud Console(APIs & Services > Credentials)에서 발급한
// OAuth 2.0 클라이언트 ID(웹 애플리케이션). 공개값이라 클라이언트 코드에 둬도 안전.
// ★발급 시 '승인된 JavaScript 원본'에 반드시 등록:
//   https://goblub.vercel.app / https://hiy3333.github.io / http://localhost:8777
// 발급한 ID를 아래 상수에 넣으면 로그인 버튼이 활성화된다.
(function () {
  var CLIENT_ID = ""; // TODO: 구글 OAuth 클라이언트 ID 입력 (예: "1234567890-abc.apps.googleusercontent.com")
  var KEY = "goblub_user";
  var API_BASE = "https://goblub.vercel.app";

  function user() {
    try { var u = JSON.parse(localStorage.getItem(KEY)); return (u && u.sub) ? u : null; } catch (e) { return null; }
  }
  function save(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} }

  // 서버 회원 동기화: 등록/강퇴 확인/관리자 지급 젬리 수령
  function syncServer(u, done) {
    if (!u || !u.tok) { if (done) done(); return; }
    fetch(API_BASE + "/api/auth-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: u.tok })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.banned) {
        signOut();
        alert("운영자에 의해 이용이 제한된 계정이에요.");
        location.reload();
        return;
      }
      if (res && res.ok && res.pendingGems > 0) {
        // feed.js가 로드돼 있으면 즉시 지급+토스트, 아니면 보관해뒀다 feed.js가 지급
        if (window.GoblubFeed && GoblubFeed.earn) {
          GoblubFeed.earn(res.pendingGems, true);
          try {
            var t = document.createElement("div");
            t.textContent = "🎁 운영자가 보낸 젬리 +" + res.pendingGems + " 도착!";
            t.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:rgba(255,255,255,.94);color:#2b3057;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.95);box-shadow:0 12px 26px rgba(88,99,172,.28);font-family:inherit;z-index:9999";
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 3200);
          } catch (e) {}
        } else {
          try {
            var p = +(localStorage.getItem("goblub_gift_pending") || 0);
            localStorage.setItem("goblub_gift_pending", String(p + res.pendingGems));
          } catch (e) {}
        }
      }
      if (done) done();
    }).catch(function () { if (done) done(); });
  }
  function signOut() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
  }
  // JWT(ID 토큰) payload 디코드 — UTF-8 한글 이름 처리 포함
  function decodeJwt(t) {
    try {
      var p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return null; }
  }
  function ready() { return !!CLIENT_ID; }

  // el 안에 구글 로그인 버튼 렌더. 로그인 성공 시 onLogin(user) 호출.
  function renderButton(el, onLogin) {
    if (!CLIENT_ID) {
      el.innerHTML = '<p style="color:var(--ink-soft); line-height:1.7; text-align:center">' +
        '🔧 구글 로그인 연동 준비 중이에요.<br>곧 간편하게 로그인할 수 있어요!</p>';
      return;
    }
    function init() {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: function (resp) {
          var p = decodeJwt(resp.credential);
          if (!p || !p.sub) return;
          var u = { name: p.name || "", email: p.email || "", picture: p.picture || "", sub: p.sub, tok: resp.credential };
          save(u);
          syncServer(u, function () { if (onLogin) onLogin(u); });
        }
      });
      google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "signin_with", locale: "ko" });
    }
    if (window.google && google.accounts && google.accounts.id) init();
    else {
      var s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = init;
      s.onerror = function () { el.innerHTML = '<p style="color:var(--ink-soft)">로그인 모듈을 불러오지 못했어요. 새로고침 해주세요.</p>'; };
      document.head.appendChild(s);
    }
  }

  window.GoblubAuth = { user: user, signOut: signOut, renderButton: renderButton, ready: ready, sync: syncServer };
})();
