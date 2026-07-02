// goblub 공용 헤더/푸터 삽입
(function () {
  var root = (document.currentScript && document.currentScript.dataset.root) || ".";

  var headerHTML =
    '<header class="site-header">' +
    '<a class="logo" href="' + root + '/index.html">' +
    '<span class="l1">g</span><span class="l2">o</span><span class="l3">b</span>' +
    '<span class="l4">l</span><span class="l5">u</span><span class="l6">b</span>' +
    "</a>" +
    '<nav class="site-nav">' +
    '<a href="' + root + '/index.html">홈</a>' +
    '<a href="' + root + '/apps.html">앱</a>' +
    "</nav>" +
    "</header>";

  var footerHTML =
    '<footer class="site-footer">© 2026 goblub · 재미로 즐겨주세요!</footer>';

  document.addEventListener("DOMContentLoaded", function () {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.outerHTML = headerHTML;
    if (f) f.outerHTML = footerHTML;
  });
})();
