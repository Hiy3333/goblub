// 프리미엄 리포트 공용 UI — 명식 대시보드 · 대운 타임라인 · 본문 렌더(강조/항목/스포일러/처방 카드/도사 연출)
// window.ReportUI = { dashboard(el, base, deep), timeline(el, deep), render(el, text, opts), flashYear(y) }
(function () {
  var GAN_H = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
  var JI_H = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };
  var OH_COLOR = { 목: "#4c9c78", 화: "#c0455a", 토: "#c99a4e", 금: "#8a90aa", 수: "#4a6fae" };
  var SPOILER_RE = /(안 보여주는 얼굴|열등감|함정|돈구멍|뺏어가는 인연|조심해야 할)/;
  var RX_RE = /^(색|방향|공간|행동|습관)\s*·/;
  var RX_ICON = { 색: "🩸", 방향: "🧭", 공간: "🕯", 행동: "🚶", 습관: "📿" };

  // ---- 스타일 주입(1회) · 어두운 명부(冥府) 테마 ----
  var css = "\
.rdash{background:rgba(16,12,24,.72);border:1px solid rgba(150,60,70,.35);border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:inset 0 1px 0 rgba(255,180,150,.06),0 0 26px rgba(120,30,40,.12)}\
.rdash h4{color:#9a8ba8;font-size:.82rem;font-weight:normal;margin:0 0 8px;text-align:center;letter-spacing:1px}\
.rd-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}\
.rd-p{background:rgba(30,22,38,.75);border:1px solid rgba(120,100,130,.28);border-radius:11px;padding:8px 4px;text-align:center}\
.rd-p .r{display:block;font-size:.68rem;color:#8a7f9a}\
.rd-p .hj{display:block;font-size:1.25rem;color:#e8dff2;line-height:1.25}\
.rd-p .hg{display:block;font-size:.72rem;color:#8a7f9a}\
.rd-p .ss{display:block;font-size:.66rem;color:#8a7f9a}\
.rd-p.me{border-color:rgba(220,70,90,.6);box-shadow:0 0 12px rgba(200,50,70,.28)}\
.rd-p.me .hj{color:#ff5a6e;text-shadow:0 0 10px rgba(255,60,80,.5)}\
.rd-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:.82rem;color:#9a8ba8}\
.rd-row .lb{flex:none;width:56px}\
.rd-meter{flex:1;height:10px;border-radius:999px;background:rgba(120,90,110,.2);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.4)}\
.rd-meter i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#5a3a8a,#c0455a)}\
.rd-row b{flex:none;color:#e8dff2;font-weight:normal;font-size:.85rem}\
.rd-oh{display:flex;gap:5px;flex:1}\
.rd-oh .o{flex:1;text-align:center;font-size:.72rem;color:#8a7f9a}\
.rd-oh .o i{display:block;height:8px;border-radius:6px;margin-bottom:3px;opacity:.85}\
.rd-badges{text-align:center;margin-top:4px}\
.rd-bd{display:inline-block;border-radius:999px;padding:3px 11px;font-size:.78rem;margin:2px 3px;border:1px solid}\
.rd-bd.use{color:#7fd0a8;border-color:rgba(80,180,130,.45);background:rgba(60,140,100,.12)}\
.rd-bd.avoid{color:#e0956a;border-color:rgba(220,130,70,.45);background:rgba(180,90,50,.12)}\
.rd-bd.miss{color:#9a8ba8;border-color:rgba(140,110,150,.4);background:rgba(90,70,110,.14)}\
.rtl{background:rgba(16,12,24,.72);border:1px solid rgba(150,60,70,.35);border-radius:14px;padding:12px 10px 8px;margin-bottom:16px;box-shadow:inset 0 1px 0 rgba(255,180,150,.06)}\
.rtl svg{width:100%;height:auto;display:block}\
.rtl .tip{min-height:1.4em;text-align:center;font-size:.82rem;color:#ff6b7e;margin-top:2px}\
.rtl .lg{text-align:center;font-size:.76rem;color:#8a7f9a}\
.st-star{cursor:pointer;transform-box:fill-box;transform-origin:center}\
.st-star.pulse{animation:rpulse .9s ease 3}\
@keyframes rpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.7)}}\
.dosa-line{display:flex;gap:10px;align-items:flex-start;margin:2px 0 14px}\
.dosa-line .av{flex:none;width:48px;height:48px;line-height:0;border-radius:8px;overflow:hidden;border:1px solid rgba(200,60,70,.4);box-shadow:0 0 14px rgba(150,30,40,.35)}\
.dosa-line .av img{width:100%;height:100%;object-fit:cover;object-position:center 22%}\
.dosa-bub{background:rgba(24,16,30,.82);border:1px solid rgba(160,70,80,.35);border-radius:4px 14px 14px 14px;padding:10px 14px;color:#ded3ea;line-height:1.8;font-size:.95rem;box-shadow:0 6px 16px rgba(0,0,0,.4)}\
.spoil{position:relative;border-radius:12px;margin:4px 0}\
.spoil .sp-body{filter:blur(7px);pointer-events:none;user-select:none;transition:filter .4s}\
.spoil .sp-cover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;color:#ded3ea;font-size:.95rem;background:rgba(8,5,14,.55);border-radius:12px}\
.spoil .sp-cover span{background:rgba(30,18,26,.92);border:1px solid rgba(200,60,70,.45);border-radius:999px;padding:8px 18px;box-shadow:0 8px 18px rgba(0,0,0,.5)}\
.spoil.open .sp-body{filter:none;pointer-events:auto;user-select:auto}\
.spoil.open .sp-cover{display:none}\
.rx-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}\
.rx{background:rgba(28,20,34,.72);border:1px solid rgba(150,80,90,.3);border-radius:13px;padding:12px 10px;text-align:center;box-shadow:inset 0 1px 0 rgba(255,180,150,.05)}\
.rx .ic{font-size:1.6rem;display:block}\
.rx b{color:#ff6b7e;display:block;margin:3px 0 4px;font-size:.95rem}\
.rx span{color:#9a8ba8;font-size:.83rem;line-height:1.55;display:block;white-space:normal}\
@media (max-width:420px){.rx-grid{grid-template-columns:1fr}}\
.rd-p .hj,.hanja{font-family:'Nanum Myeongjo',serif}\
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
      "<h4>🕯 귀곡이 읽어낸 네 명식(命式)</h4>" +
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
    var cols = ["#2a1c30", "#1c2436", "#2e2418", "#1c2a22", "#241a30", "#182a2c", "#2e2018", "#20202e"];
    var s = "";
    list.forEach(function (d, i) {
      var x0 = x(d.age), w = x(d.age + 10) - x0;
      s += '<rect x="' + x0 + '" y="52" width="' + (w - 2) + '" height="46" rx="9" fill="' + cols[i % cols.length] + '"' +
        (d.current ? ' stroke="#ff5a6e" stroke-width="2.5"' : ' stroke="rgba(140,110,150,.35)" stroke-width="1"') + "/>";
      s += '<text x="' + (x0 + w / 2 - 1) + '" y="80" text-anchor="middle" font-size="15" fill="' + (d.current ? "#ffd0d6" : "#c8bcd8") + '" font-family="Jua,sans-serif">' + d.ganji + "</text>";
      s += '<text x="' + (x0 + w / 2 - 1) + '" y="115" text-anchor="middle" font-size="11" fill="#8a7f9a" font-family="Jua,sans-serif">' + d.age + "세</text>";
    });
    // 지금 위치
    if (deep.koreanAge >= start && deep.koreanAge <= end) {
      var cx = x(deep.koreanAge);
      s += '<line x1="' + cx + '" y1="30" x2="' + cx + '" y2="104" stroke="#ff5a6e" stroke-width="2" stroke-dasharray="4 3"/>';
      s += '<text x="' + cx + '" y="22" text-anchor="middle" font-size="13" fill="#ff6b7e" font-family="Jua,sans-serif">📍 지금 ' + deep.koreanAge + "세</text>";
    }
    // 큰 기운의 해(세운 노트) — 붉은 인장
    (deep.seun || []).forEach(function (se) {
      if (!se.notes || !se.notes.length) return;
      var sx = x(Math.min(Math.max(se.age, start), end));
      s += '<text class="st-star" data-year="' + se.year + '" x="' + sx + '" y="147" text-anchor="middle" font-size="16">🔴' +
        "<title>" + se.year + "년 " + se.ganji + " — " + se.notes.join(", ") + "</title></text>";
      s += '<text x="' + sx + '" y="164" text-anchor="middle" font-size="10" fill="#8a7f9a" font-family="Jua,sans-serif">' + String(se.year).slice(2) + "</text>";
    });
    el.className = "rtl";
    el.innerHTML = "<h4 style='color:#9a8ba8;font-size:.82rem;font-weight:normal;text-align:center;margin-bottom:6px'>🗺 명부에 새겨진 네 대운 지도</h4>" +
      '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg">' + s + "</svg>" +
      '<p class="tip" id="tl-tip"></p><p class="lg">🔴 = 큰 기운이 모이는 해 — 눌러보라 · 본문의 <u>붉은 연도</u>를 눌러도 이곳으로 온다</p>';
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
    // ◈ 낙인 · 『인장명』 → 붉은 도장 스탬프
    if (/^◈/.test(t)) {
      var nk = t.replace(/^◈\s*/, "").replace(/^낙인\s*·?\s*/, "").replace(/[『』]/g, "").trim();
      return { kv: true, html: '<span class="nak"><i>落印</i>' + nk + "</span>" };
    }
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

  // 한 ◆ 블록의 본문을 HTML로 (▸카드 그룹 처리, 스포일러·도사말풍선 없음)
  function blockHtml(lines) {
    var html = "", rxGroup = [];
    function flushRx() {
      if (rxGroup.length >= 2) html += '<div class="rx-grid">' + rxGroup.join("") + "</div>";
      else rxGroup.forEach(function (r2) { html += r2 + "\n"; });
      rxGroup = [];
    }
    lines.forEach(function (raw) {
      var lh = lineHtml(raw.trim() ? raw.trim() : "");
      if (lh.rx) rxGroup.push(lh.html);
      else { flushRx(); html += (lh.kv ? lh.html : raw) + "\n"; }
    });
    flushRx();
    return html;
  }
  // 『강조』 → 피 흘리는 붉은 글씨
  function bleed(html) {
    return html.replace(/『([^『』]{1,60})』/g, '<b class="hl">$1</b>');
  }

  // 한 파트 텍스트 → 페이지 배열 [{title, html}] (◆ 소제목 단위로 분할)
  // 도입부(첫 ◆ 이전)는 첫 페이지의 리드 문단으로 흡수(도사 말풍선 제거)
  function pageify(text) {
    var lines = esc(text.trim()).split("\n");
    var intro = [];
    while (lines.length && !/^◆/.test(lines[0].trim())) intro.push(lines.shift());
    var introHtml = bleed(intro.join("\n").trim());

    var pages = [], i = 0, first = true;
    while (i < lines.length) {
      var t = lines[i].trim();
      if (/^◆/.test(t)) {
        var title = t.replace(/^◆\s*/, "");
        i++;
        var body = [];
        while (i < lines.length && !/^◆/.test(lines[i].trim())) { body.push(lines[i]); i++; }
        var html = bleed(blockHtml(body));
        if (first && introHtml) { html = '<p class="lead">' + introHtml + "</p>" + html; first = false; }
        pages.push({ title: title, html: html });
      } else { i++; }
    }
    // ◆ 가 하나도 없으면 통째 한 페이지
    if (!pages.length) pages.push({ title: "", html: (introHtml ? '<p class="lead">' + introHtml + "</p>" : "") + bleed(blockHtml(lines)) });
    return pages;
  }

  // 전역 위임: 연도 강조 → 타임라인
  document.addEventListener("click", function (e) {
    var hy = e.target.closest ? e.target.closest(".hl-y") : null;
    if (hy) flashYear(hy.getAttribute("data-year"));
  });

  window.ReportUI = { dashboard: dashboard, timeline: timeline, pageify: pageify, flashYear: flashYear };
})();
