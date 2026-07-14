// 프리미엄 리포트 공용 UI — 명식 대시보드 · 대운 타임라인 · 본문 렌더(강조/항목/스포일러/처방 카드/도사 연출)
// window.ReportUI = { dashboard(el, base, deep), timeline(el, deep), render(el, text, opts), flashYear(y) }
(function () {
  var GAN_H = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
  var JI_H = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };
  var OH_COLOR = { 목: "#35c98a", 화: "#ff5a76", 토: "#f5a623", 금: "#9aa2c4", 수: "#3a8bff" };
  var SPOILER_RE = /(안 보여주는 얼굴|열등감|함정|돈구멍|뺏어가는 인연|조심해야 할)/;
  var RX_RE = /^(색|방향|공간|행동|습관)\s*·/;
  var RX_ICON = { 색: "🎨", 방향: "🧭", 공간: "🏠", 행동: "🏃", 습관: "📿" };

  // ---- 스타일 주입(1회) ----
  var css = "\
.rdash{background:rgba(255,255,255,.55);border:1px solid rgba(150,160,205,.28);border-radius:16px;padding:14px;margin-bottom:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}\
.rdash h4{color:var(--ink-soft);font-size:.82rem;font-weight:normal;margin:0 0 8px;text-align:center}\
.rd-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}\
.rd-p{background:rgba(255,255,255,.75);border:1px solid rgba(150,160,205,.25);border-radius:12px;padding:8px 4px;text-align:center}\
.rd-p .r{display:block;font-size:.68rem;color:var(--ink-soft)}\
.rd-p .hj{display:block;font-size:1.25rem;color:var(--ink);line-height:1.25}\
.rd-p .hg{display:block;font-size:.72rem;color:var(--ink-soft)}\
.rd-p .ss{display:block;font-size:.66rem;color:var(--ink-soft)}\
.rd-p.me{border-color:rgba(255,90,118,.55);box-shadow:0 0 0 1px rgba(255,90,118,.25)}\
.rd-p.me .hj{color:#e8365f}\
.rd-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:.82rem;color:var(--ink-soft)}\
.rd-row .lb{flex:none;width:56px}\
.rd-meter{flex:1;height:10px;border-radius:999px;background:rgba(140,150,210,.18);overflow:hidden;box-shadow:inset 0 1px 2px rgba(90,100,170,.15)}\
.rd-meter i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3a8bff,#ff5a76)}\
.rd-row b{flex:none;color:var(--ink);font-weight:normal;font-size:.85rem}\
.rd-oh{display:flex;gap:5px;flex:1}\
.rd-oh .o{flex:1;text-align:center;font-size:.72rem;color:var(--ink-soft)}\
.rd-oh .o i{display:block;height:8px;border-radius:6px;margin-bottom:3px;opacity:.9}\
.rd-badges{text-align:center;margin-top:4px}\
.rd-bd{display:inline-block;border-radius:999px;padding:3px 11px;font-size:.78rem;margin:2px 3px;border:1px solid}\
.rd-bd.use{color:#1f8a5f;border-color:rgba(53,201,138,.5);background:rgba(53,201,138,.12)}\
.rd-bd.avoid{color:#c2452f;border-color:rgba(255,138,61,.5);background:rgba(255,138,61,.1)}\
.rd-bd.miss{color:#7079a8;border-color:rgba(122,134,195,.4);background:rgba(122,134,195,.1)}\
.rtl{background:rgba(255,255,255,.55);border:1px solid rgba(150,160,205,.28);border-radius:16px;padding:12px 10px 8px;margin-bottom:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}\
.rtl svg{width:100%;height:auto;display:block}\
.rtl .tip{min-height:1.4em;text-align:center;font-size:.82rem;color:#e8365f;margin-top:2px}\
.rtl .lg{text-align:center;font-size:.76rem;color:var(--ink-soft)}\
.st-star{cursor:pointer;transform-box:fill-box;transform-origin:center}\
.st-star.pulse{animation:rpulse .9s ease 3}\
@keyframes rpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.7)}}\
.dosa-line{display:flex;gap:10px;align-items:flex-start;margin:2px 0 14px}\
.dosa-line .av{flex:none;width:46px;line-height:0;filter:drop-shadow(0 4px 8px rgba(143,91,255,.3))}\
.dosa-bub{background:rgba(255,255,255,.72);border:1px solid rgba(150,160,205,.3);border-radius:4px 16px 16px 16px;padding:10px 14px;color:var(--ink);line-height:1.8;font-size:.95rem;box-shadow:0 6px 14px rgba(88,99,172,.12)}\
.spoil{position:relative;border-radius:12px;margin:4px 0}\
.spoil .sp-body{filter:blur(7px);pointer-events:none;user-select:none;transition:filter .4s}\
.spoil .sp-cover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;color:var(--ink);font-size:.95rem;background:rgba(255,255,255,.2);border-radius:12px}\
.spoil .sp-cover span{background:rgba(255,255,255,.9);border:1px solid rgba(150,160,205,.35);border-radius:999px;padding:8px 18px;box-shadow:0 8px 18px rgba(88,99,172,.18)}\
.spoil.open .sp-body{filter:none;pointer-events:auto;user-select:auto}\
.spoil.open .sp-cover{display:none}\
.rx-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}\
.rx{background:rgba(255,255,255,.68);border:1px solid rgba(150,160,205,.28);border-radius:14px;padding:12px 10px;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}\
.rx .ic{font-size:1.6rem;display:block}\
.rx b{color:#e8365f;display:block;margin:3px 0 4px;font-size:.95rem}\
.rx span{color:var(--ink-soft);font-size:.83rem;line-height:1.55;display:block;white-space:normal}\
@media (max-width:420px){.rx-grid{grid-template-columns:1fr}}\
.hl-y{cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hanja(gj) { return (GAN_H[gj[0]] || gj[0]) + (JI_H[gj[1]] || gj[1]); }

  // ===== ② 명식 대시보드 =====
  function dashboard(el, base, deep) {
    var order = [["year", "년주"], ["month", "월주"], ["day", "일주(나)"], ["hour", "시주"]];
    var ph = order.map(function (o) {
      var p = base.pillars[o[0]];
      if (!p) return '<div class="rd-p"><span class="r">' + o[1] + '</span><span class="hj">?</span><span class="hg">시간 모름</span><span class="ss"></span></div>';
      return '<div class="rd-p' + (o[0] === "day" ? " me" : "") + '"><span class="r">' + o[1] + "</span>" +
        '<span class="hj">' + hanja(p.ganji) + '</span><span class="hg">' + p.ganji + "</span>" +
        '<span class="ss">' + p.jiSipseong + "</span></div>";
    }).join("");
    var ratio = Math.round((base.strength.ratio || 0.5) * 100);
    var maxOh = 0.001;
    ["목", "화", "토", "금", "수"].forEach(function (k) { if (base.oheng[k] > maxOh) maxOh = base.oheng[k]; });
    var oh = ["목", "화", "토", "금", "수"].map(function (k) {
      var h = Math.max(8, Math.round(base.oheng[k] / maxOh * 100));
      return '<div class="o"><i style="background:' + OH_COLOR[k] + ';width:' + h + '%;margin:0 auto 3px"></i>' + k + " " + base.oheng[k] + "</div>";
    }).join("");
    var badges = "";
    if (deep && deep.yongshin) {
      badges += deep.yongshin.use.map(function (u) { return '<span class="rd-bd use">용신 ' + u + "</span>"; }).join("");
      badges += deep.yongshin.avoid.map(function (a) { return '<span class="rd-bd avoid">조심 ' + a + "</span>"; }).join("");
    }
    if (deep && deep.missing && deep.missing.length) badges += deep.missing.map(function (m) { return '<span class="rd-bd miss">결핍 ' + m + "</span>"; }).join("");
    el.className = "rdash";
    el.innerHTML =
      "<h4>🧾 이 리포트가 읽어낸 내 명식</h4>" +
      '<div class="rd-pillars">' + ph + "</div>" +
      '<div class="rd-row"><span class="lb">기운 세기</span><div class="rd-meter"><i style="width:' + ratio + '%"></i></div><b>' + base.strength.label + "</b></div>" +
      '<div class="rd-row"><span class="lb">오행</span><div class="rd-oh">' + oh + "</div></div>" +
      (badges ? '<div class="rd-badges">' + badges + "</div>" : "");
  }

  // ===== ① 인생 대운 타임라인 =====
  var tlEl = null;
  function timeline(el, deep) {
    if (!deep || !deep.daeun || !deep.daeun.length) { el.style.display = "none"; return; }
    tlEl = el;
    var list = deep.daeun;
    var start = list[0].age, end = list[list.length - 1].age + 10;
    var W = 720, H = 178, pad = 26;
    function x(age) { return pad + (age - start) / (end - start) * (W - pad * 2); }
    var cols = ["#ffd9e2", "#dbe7ff", "#ffefd2", "#e3f6e9", "#eadffd", "#d9f3f6", "#ffe3d4", "#e6e9f7"];
    var s = "";
    list.forEach(function (d, i) {
      var x0 = x(d.age), w = x(d.age + 10) - x0;
      s += '<rect x="' + x0 + '" y="52" width="' + (w - 2) + '" height="46" rx="9" fill="' + cols[i % cols.length] + '"' +
        (d.current ? ' stroke="#ff5a76" stroke-width="2.5"' : ' stroke="rgba(255,255,255,.9)" stroke-width="1"') + "/>";
      s += '<text x="' + (x0 + w / 2 - 1) + '" y="80" text-anchor="middle" font-size="15" fill="#2b3057" font-family="Jua,sans-serif">' + d.ganji + "</text>";
      s += '<text x="' + (x0 + w / 2 - 1) + '" y="115" text-anchor="middle" font-size="11" fill="#7079a8" font-family="Jua,sans-serif">' + d.age + "세</text>";
    });
    // 지금 위치
    if (deep.koreanAge >= start && deep.koreanAge <= end) {
      var cx = x(deep.koreanAge);
      s += '<line x1="' + cx + '" y1="30" x2="' + cx + '" y2="104" stroke="#ff5a76" stroke-width="2" stroke-dasharray="4 3"/>';
      s += '<text x="' + cx + '" y="22" text-anchor="middle" font-size="13" fill="#e8365f" font-family="Jua,sans-serif">📍 지금 ' + deep.koreanAge + "세</text>";
    }
    // 큰 기운의 해(세운 노트) ⭐
    (deep.seun || []).forEach(function (se) {
      if (!se.notes || !se.notes.length) return;
      var sx = x(Math.min(Math.max(se.age, start), end));
      s += '<text class="st-star" data-year="' + se.year + '" x="' + sx + '" y="146" text-anchor="middle" font-size="17">⭐' +
        "<title>" + se.year + "년 " + se.ganji + " — " + se.notes.join(", ") + "</title></text>";
      s += '<text x="' + sx + '" y="164" text-anchor="middle" font-size="10" fill="#7079a8" font-family="Jua,sans-serif">' + String(se.year).slice(2) + "</text>";
    });
    el.className = "rtl";
    el.innerHTML = "<h4 style='color:var(--ink-soft);font-size:.82rem;font-weight:normal;text-align:center;margin-bottom:6px'>🚉 내 인생 대운 지도</h4>" +
      '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg">' + s + "</svg>" +
      '<p class="tip" id="tl-tip"></p><p class="lg">⭐ = 큰 기운이 모이는 해 — 탭해보세요 · 본문의 <u>빨간 연도</u>를 눌러도 찾아가요</p>';
    el.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".st-star") : null;
      if (!t) return;
      showStar(t);
    });
  }
  function showStar(t) {
    var tip = document.getElementById("tl-tip");
    var title = t.querySelector("title");
    if (tip && title) tip.textContent = "⭐ " + title.textContent;
    t.classList.remove("pulse");
    void t.getBBox && t.getBBox();
    t.classList.add("pulse");
  }
  function flashYear(y) {
    if (!tlEl) return;
    var t = tlEl.querySelector('.st-star[data-year="' + y + '"]');
    tlEl.scrollIntoView({ behavior: "smooth", block: "center" });
    if (t) setTimeout(function () { showStar(t); }, 350);
    else {
      var tip = document.getElementById("tl-tip");
      if (tip) tip.textContent = y + "년 — 지도에서 위치를 가늠해보세요";
    }
  }

  // ===== ③⑤⑥ 본문 렌더 =====
  function lineHtml(t) {
    if (/^▸/.test(t)) {
      var body = t.replace(/^▸\s*/, "");
      var m = body.match(RX_RE);
      if (m) {
        var idx = body.indexOf("·");
        var key = body.slice(0, idx).trim(), val = body.slice(idx + 1).trim();
        return { rx: true, html: '<div class="rx"><span class="ic">' + (RX_ICON[key] || "✨") + "</span><b>" + key + "</b><span>" + val + "</span></div>" };
      }
      return { kv: true, html: '<span class="kv">' + body + "</span>" };
    }
    return { html: t };
  }

  function render(el, text, opts) {
    opts = opts || {};
    var lines = esc(text.trim()).split("\n");
    // 도입부(첫 ◆ 이전) 분리 → 도사 말풍선
    var introLines = [];
    while (lines.length && !/^◆/.test(lines[0].trim())) introLines.push(lines.shift());
    var intro = introLines.join("\n").trim();

    var html = "";
    if (intro) {
      var av = (window.GoblubArt && GoblubArt.svg) ? GoblubArt.svg(46) : '<span style="font-size:38px">🧙</span>';
      html += '<div class="dosa-line"><span class="av">' + av + '</span><div class="dosa-bub"><span class="bub-txt">' + intro + "</span></div></div>";
    }

    // ◆ 블록 단위 조립 (+스포일러 / ▸카드 그룹)
    var i = 0;
    while (i < lines.length) {
      var t = lines[i].trim();
      if (/^◆/.test(t)) {
        var spoiler = SPOILER_RE.test(t);
        html += '<span class="sub">' + t + "</span>\n";
        i++;
        var block = "", rxGroup = [];
        function flushRx() {
          if (rxGroup.length >= 2) block += '<div class="rx-grid">' + rxGroup.join("") + "</div>";
          else rxGroup.forEach(function (r2) { block += r2 + "\n"; });
          rxGroup = [];
        }
        while (i < lines.length && !/^◆/.test(lines[i].trim())) {
          var lh = lineHtml(lines[i].trim() ? lines[i].trim() : "");
          if (lh.rx) rxGroup.push(lh.html);
          else { flushRx(); block += (lh.kv ? lh.html : lines[i]) + "\n"; }
          i++;
        }
        flushRx();
        if (spoiler) {
          html += '<span class="spoil"><span class="sp-body">' + block + "</span>" +
            '<span class="sp-cover"><span>🫣 마음의 준비가 되면 탭하세요</span></span></span>';
        } else html += block;
      } else { html += lines[i] + "\n"; i++; }
    }

    // 『강조』 → 빨간 볼드 (+연도 포함 시 타임라인 링크)
    html = html.replace(/『([^『』]{1,60})』/g, function (_, inner) {
      var ym = inner.match(/20\d{2}/);
      if (ym) return '<b class="hl hl-y" data-year="' + ym[0] + '">' + inner + "</b>";
      return '<b class="hl">' + inner + "</b>";
    });
    el.innerHTML = html;

    // ⑥ 도입부 타이핑 연출(새 생성일 때만)
    if (opts.animate && intro) {
      var bt = el.querySelector(".bub-txt");
      if (bt) {
        var full = bt.textContent;
        bt.textContent = "";
        var ci = 0, step = Math.max(1, Math.round(full.length / 120));
        var iv = setInterval(function () {
          ci += step;
          bt.textContent = full.slice(0, ci);
          if (ci >= full.length) { bt.textContent = full; clearInterval(iv); }
        }, 24);
      }
    }
  }

  // 전역 위임: 스포일러 열기 · 연도 강조 → 타임라인
  document.addEventListener("click", function (e) {
    var cov = e.target.closest ? e.target.closest(".sp-cover") : null;
    if (cov) { cov.parentElement.classList.add("open"); return; }
    var hy = e.target.closest ? e.target.closest(".hl-y") : null;
    if (hy) flashYear(hy.getAttribute("data-year"));
  });

  window.ReportUI = { dashboard: dashboard, timeline: timeline, render: render, flashYear: flashYear };
})();
