// goblub 공용 헤더/푸터 삽입
(function () {
  var root = (document.currentScript && document.currentScript.dataset.root) || ".";

  // 로그인 상태에 따라 '로그인' ↔ '마이페이지' (둘 다 mypage.html로 — 페이지가 상태별 화면 처리)
  var loggedIn = false;
  try { var u = JSON.parse(localStorage.getItem("goblub_user")); loggedIn = !!(u && u.sub); } catch (e) {}

  var headerHTML =
    '<header class="site-header">' +
    '<a class="logo" href="' + root + '/index.html">' +
    '<span class="l1">g</span><span class="l2">o</span><span class="l3">b</span>' +
    '<span class="l4">l</span><span class="l5">u</span><span class="l6">b</span>' +
    "</a>" +
    '<nav class="site-nav">' +
    '<a href="' + root + '/index.html">홈</a>' +
    '<a href="' + root + '/apps.html">앱</a>' +
    '<a href="' + root + '/mypage.html">' + (loggedIn ? "마이페이지" : "로그인") + "</a>" +
    "</nav>" +
    "</header>";

  var footerHTML =
    '<footer class="site-footer">© 2026 goblub · 재미로 즐겨주세요!</footer>';

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  // 고블럽 마스코트(모든 페이지) — GoblubArt가 없으면 먼저 로드한 뒤 buddy 실행
  function initBuddy() {
    if (window.__goblubBuddy) return;
    loadScript(root + "/play/js/goblub-buddy.js?v=4");
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
