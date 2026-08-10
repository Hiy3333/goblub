// ===== 오류 수집(Sentry) =====
// sentry.io 프로젝트 설정 → Client Keys(DSN) 값을 아래에 붙여넣으면 켜진다. 비어 있으면 아무것도 안 함.
(function () {
  var SENTRY_DSN = "https://7df6fb30d466067833814aaf6fb5d24c@o4511885094158336.ingest.us.sentry.io/4511885166641152";
  if (!SENTRY_DSN || location.protocol === "file:") return;
  var s = document.createElement("script");
  s.src = "https://browser.sentry-cdn.com/9.46.0/bundle.min.js";
  s.crossOrigin = "anonymous";
  s.onload = function () {
    if (!window.Sentry) return;
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: location.hostname,   // github.io / vercel.app 구분용
      sampleRate: 1.0,
      // 무료 플랜은 월 5,000건이라 잡음이 할당량을 먹으면 정작 볼 걸 못 본다.
      // 아래는 우리 코드 문제가 아닌, 확장·광고차단기·브라우저 자체가 만드는 것들.
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
        "Failed to fetch",
        "NetworkError when attempting to fetch resource",
        "Load failed",
        "AbortError"
      ],
      denyUrls: [
        /extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i, /^safari-extension:\/\//i,
        /googletagmanager\.com/i, /amplitude\.com/i
      ]
    });
  };
  document.head.appendChild(s);
})();

// ===== 사용 지표(Amplitude) =====
// gbTrack(이름, 속성) 은 SDK 로드 전에 불러도 안전하다 — 큐에 쌓았다가 준비되면 흘려보낸다.
// SDK 가 아예 안 뜨더라도 호출부는 그냥 조용히 지나간다.
(function () {
  var AMP_KEY = "39faff975e6b6d83de9a1dee44c42a6c";
  var queue = [], ready = false;

  function flush() {
    if (!ready || !window.amplitude) return;
    while (queue.length) {
      var e = queue.shift();
      try { window.amplitude.track(e[0], e[1]); } catch (err) {}
    }
  }
  window.gbTrack = function (name, props) {
    queue.push([name, props || {}]);
    if (queue.length > 200) queue.shift();   // SDK 차단 시 무한 적재 방지
    flush();
  };

  // 로컬(file://)은 집계 제외 — 개발 중 클릭이 실제 지표를 오염시키지 않게
  if (!AMP_KEY || location.protocol === "file:") return;

  var s = document.createElement("script");
  s.src = "https://cdn.amplitude.com/libs/analytics-browser-2.45.0-min.js.gz";
  s.async = true;
  s.onload = function () {
    if (!window.amplitude) return;
    try {
      window.amplitude.init(AMP_KEY, {
        autocapture: {
          pageViews: true, sessions: true, attribution: true,
          formInteractions: false, fileDownloads: false, elementInteractions: false
        }
      });
      ready = true;
      flush();
    } catch (err) {}
  };
  document.head.appendChild(s);
})();

// goblub 공용 헤더/푸터 삽입
(function () {
  var root = (document.currentScript && document.currentScript.dataset.root) || ".";

  // 로그인 상태에 따라 '로그인' ↔ '마이페이지' (둘 다 mypage.html로 — 페이지가 상태별 화면 처리)
  var loggedIn = false;
  try { var u = JSON.parse(localStorage.getItem("goblub_user")); loggedIn = !!(u && u.sub); } catch (e) {}

  // 홈에서는 goblub 로고, 그 외 페이지에서는 Home(누르면 홈으로)
  var isHome = !!(document.body && document.body.classList.contains("home-moon"));
  var logoHTML = isHome
    ? '<span class="l1">g</span><span class="l2">o</span><span class="l3">b</span>' +
      '<span class="l4">l</span><span class="l5">u</span><span class="l6">b</span>'
    : '<span class="l1">H</span><span class="l2">o</span><span class="l3">m</span><span class="l4">e</span>';
  var headerHTML =
    '<header class="site-header">' +
    '<a class="logo" href="' + root + '/index.html">' + logoHTML + "</a>" +
    '<nav class="site-nav">' +
    '<a href="' + root + '/index.html">홈</a>' +
    '<a href="#" data-soon="📱 앱은 아직 준비 중이에요!">앱</a>' +
    '<a href="' + root + '/mypage.html">' + (loggedIn ? "마이페이지" : "로그인") + "</a>" +
    "</nav>" +
    "</header>";

  var footerHTML =
    '<footer class="site-footer">© 2026 goblub</footer>';

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  // 고브럽 마스코트(모든 페이지) — GoblubArt가 없으면 먼저 로드한 뒤 buddy 실행
  function initBuddy() {
    if (window.__goblubBuddy) return;
    loadScript(root + "/play/js/goblub-buddy.js?v=5");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.outerHTML = headerHTML;
    if (f) f.outerHTML = footerHTML;
    if (window.GoblubArt) initBuddy();
    else loadScript(root + "/play/js/goblub-art.js", initBuddy);
  });
})();

// ===== 준비 중 안내 토스트 (앱 다운로드 등) =====
(function () {
  var st = document.createElement("style");
  st.textContent = ".gb-toast{position:fixed;left:50%;bottom:44px;transform:translateX(-50%) translateY(14px);z-index:99999;background:linear-gradient(180deg,#f9f0d4,#efe3bd);color:#235a6b;border:3px solid rgba(29,90,107,.28);border-radius:16px;padding:13px 22px;font-family:'Jua','Malgun Gothic',sans-serif;font-size:1.05rem;box-shadow:0 14px 30px rgba(0,22,32,.45);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;white-space:nowrap}.gb-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}";
  document.head.appendChild(st);
  var el = null, timer = null;
  window.goblubToast = function (msg) {
    if (!el) { el = document.createElement("div"); el.className = "gb-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    void el.offsetWidth;
    el.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove("on"); }, 1900);
  };
  // data-soon 이 붙은 요소는 이동하지 않고 안내만 띄운다
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-soon]") : null;
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    window.goblubToast(t.getAttribute("data-soon") || "준비 중이에요!");
  }, true);
})();
