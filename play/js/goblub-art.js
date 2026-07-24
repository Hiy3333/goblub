// 고브럽 캐릭터 SVG (외눈·소용돌이 입·초록 점박이·에너지 구슬).
// GoblubArt.svg(px) → 지정 크기의 인라인 SVG 문자열.
// [data-goblub="<px>"] 요소는 로드 시 자동으로 채워집니다.
(function () {
  var seq = 0;

  function svg(px) {
    px = px || 64;
    var w = px, h = Math.round(px * 196 / 240 * 100) / 100;
    var id = "gorb" + (++seq);
    return '<svg class="goblub-svg" viewBox="0 0 240 196" width="' + w + '" height="' + h +
      '" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;overflow:visible;vertical-align:middle" aria-label="고브럽" role="img">' +
      '<defs><radialGradient id="' + id + '" cx="38%" cy="34%" r="70%">' +
      '<stop offset="0%" stop-color="#ffffff"/><stop offset="55%" stop-color="#d4e9fb"/>' +
      '<stop offset="100%" stop-color="#8fbfe8"/></radialGradient></defs>' +
      '<ellipse cx="106" cy="176" rx="8" ry="11" fill="#8877ad"/>' +
      '<ellipse cx="134" cy="176" rx="8" ry="11" fill="#8877ad"/>' +
      '<path d="M86 154 Q52 172 40 164" fill="none" stroke="#8877ad" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="35" cy="164" r="13" fill="url(#' + id + ')"/>' +
      '<circle cx="35" cy="164" r="13" fill="none" stroke="#bcdcf5" stroke-width="1" opacity=".6"/>' +
      '<path d="M120 20 C168 20 182 62 183 104 C184 148 158 172 120 172 C82 172 56 148 57 104 C58 62 72 20 120 20 Z" fill="#9a8ac2"/>' +
      '<ellipse cx="102" cy="90" rx="24" ry="34" fill="#ab9dd4" opacity=".45"/>' +
      '<ellipse cx="120" cy="158" rx="44" ry="15" fill="#8877ad" opacity=".4"/>' +
      '<path d="M60 104 Q45 110 41 120" fill="none" stroke="#8877ad" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="40" cy="122" r="6" fill="#8877ad"/>' +
      '<path d="M180 104 Q195 110 199 120" fill="none" stroke="#8877ad" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="200" cy="122" r="6" fill="#8877ad"/>' +
      '<g fill="#aec13d">' +
      '<circle cx="74" cy="52" r="2.6"/><circle cx="64" cy="80" r="2.4"/><circle cx="72" cy="104" r="2.2"/>' +
      '<circle cx="166" cy="52" r="2.6"/><circle cx="176" cy="80" r="2.4"/><circle cx="168" cy="104" r="2.2"/>' +
      '<circle cx="90" cy="150" r="2.3"/><circle cx="150" cy="150" r="2.3"/></g>' +
      '<circle cx="120" cy="44" r="25" fill="#f4f0e6"/>' +
      '<circle cx="127" cy="49" r="13" fill="#17141f"/>' +
      '<circle cx="112" cy="37" r="5.5" fill="#ffffff"/>' +
      '<ellipse cx="120" cy="120" rx="54" ry="46" fill="#f0ede2"/>' +
      '<g stroke="#8877ad" stroke-width="2.2" stroke-linecap="round">' +
      '<line x1="162" y1="120" x2="174" y2="120"/><line x1="156" y1="137" x2="167" y2="143"/>' +
      '<line x1="141" y1="150" x2="147" y2="160"/><line x1="120" y1="155" x2="120" y2="166"/>' +
      '<line x1="99" y1="150" x2="93" y2="160"/><line x1="84" y1="137" x2="73" y2="143"/>' +
      '<line x1="78" y1="120" x2="66" y2="120"/><line x1="84" y1="103" x2="73" y2="97"/>' +
      '<line x1="99" y1="90" x2="93" y2="80"/><line x1="120" y1="85" x2="120" y2="74"/>' +
      '<line x1="141" y1="90" x2="147" y2="80"/><line x1="156" y1="103" x2="167" y2="97"/></g>' +
      '<ellipse cx="120" cy="120" rx="42" ry="35" fill="#1a1622"/>' +
      '<path d="M120 88 A30 30 0 0 1 120 148 A26 26 0 0 1 120 96 A22 22 0 0 1 120 140 A18 18 0 0 1 120 104 A14 14 0 0 1 120 132 A10 10 0 0 1 120 112 A6 6 0 0 1 120 124" fill="none" stroke="#4b4060" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
  }

  function render(root) {
    var els = (root || document).querySelectorAll("[data-goblub]");
    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute("data-goblub-done")) continue;
      els[i].innerHTML = svg(parseFloat(els[i].getAttribute("data-goblub")) || 64);
      els[i].setAttribute("data-goblub-done", "1");
    }
  }

  window.GoblubArt = { svg: svg, render: render };

  if (document.readyState !== "loading") render();
  else document.addEventListener("DOMContentLoaded", function () { render(); });
})();
