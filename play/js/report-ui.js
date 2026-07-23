// 프리미엄 리포트 공용 UI — 명식 대시보드 · 대운 타임라인 · 본문 렌더(강조/항목/스포일러/처방 카드/도사 연출)
// window.ReportUI = { dashboard(el, base, deep), timeline(el, deep), render(el, text, opts), flashYear(y) }
(function () {
  var GAN_H = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
  var JI_H = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };
  var OH_COLOR = { 목: "#4c9c78", 화: "#c0455a", 토: "#c99a4e", 금: "#8a90aa", 수: "#4a6fae" };
  var SPOILER_RE = /(안 보여주는 얼굴|열등감|함정|돈구멍|뺏어가는 인연|조심해야 할)/;
  var RX_RE = /^(시간|사람|돈|몸|말버릇|신호|색|방향|공간|행동|습관)\s*·/;
  var RX_ICON = { 시간: "🕐", 사람: "👥", 돈: "🪙", 몸: "🫀", 말버릇: "👄", 신호: "🕯", 색: "🩸", 방향: "🧭", 공간: "🕯", 행동: "🚶", 습관: "📿" };

  // ---- 스타일 주입(1회) · 어두운 명부(冥府) 테마 ----
  var css = "\
.rdash,.rtl{background:linear-gradient(180deg,rgba(23,16,29,.92),rgba(13,9,18,.92));border:1px solid rgba(150,60,70,.38);border-radius:14px;padding:15px 13px 13px;margin-bottom:13px;box-shadow:inset 0 1px 0 rgba(255,180,150,.07),0 10px 30px rgba(0,0,0,.45)}\
.rdash h4,.rtl h4{color:#c9a08c;font-family:'Nanum Myeongjo',serif;font-size:.9rem;font-weight:700;margin:0 0 11px;text-align:center;letter-spacing:.22em}\
.rdash h4 em,.rtl h4 em{font-style:normal;color:#7d7089;font-size:.76rem;letter-spacing:0;display:block;margin-top:3px;font-family:inherit;font-weight:400}\
.ms{display:grid;grid-template-columns:2.1em repeat(4,1fr);border:1px solid rgba(160,95,100,.3);border-radius:10px;overflow:hidden;background:rgba(10,7,14,.5)}\
.ms>div{text-align:center;padding:5px 1px;border-right:1px solid rgba(160,95,100,.14);border-bottom:1px solid rgba(160,95,100,.14);display:flex;align-items:center;justify-content:center}\
.ms>div:nth-child(5n){border-right:none}\
.ms .hd{background:rgba(150,60,70,.16);color:#d8bdae;font-size:.76rem;font-family:'Nanum Myeongjo',serif;letter-spacing:.05em;padding:6px 1px}\
.ms .lb{background:rgba(255,255,255,.025);color:#6f6479;font-size:.6rem;line-height:1.25;writing-mode:horizontal-tb}\
.ms .ss{color:#9a8ba8;font-size:.7rem}\
.ms .gz{font-family:'Nanum Myeongjo',serif;font-size:1.62rem;font-weight:700;line-height:1.15;padding:3px 1px;text-shadow:0 0 14px currentColor}\
.ms .gz u{display:block;font-size:.56rem;text-decoration:none;opacity:.62;letter-spacing:0;margin-top:-1px}\
.ms .me{background:rgba(200,50,70,.14)}\
.ms .hd.me{background:rgba(200,50,70,.3);color:#ffd0d6}\
.ms-ilgan{text-align:center;margin:11px 0 9px;color:#e8dcc8;font-family:'Nanum Myeongjo',serif;font-size:.95rem}\
.ms-ilgan b{color:#ff8a5a;font-size:1.08rem}\
.ms-ilgan span{color:#8a7f9a;font-size:.82rem}\
.gau{margin:0 0 13px}\
.gau .tr{position:relative;height:7px;border-radius:999px;background:linear-gradient(90deg,#3d5a8c 0%,#4a4a72 38%,#6b4560 62%,#a8394a 100%);box-shadow:inset 0 1px 3px rgba(0,0,0,.55)}\
.gau .pin{position:absolute;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#fff3ea;border:2.5px solid #ff5a3a;box-shadow:0 0 12px rgba(255,90,50,.85)}\
.gau .sc{display:flex;justify-content:space-between;margin-top:5px;font-size:.66rem;color:#6f6479}\
.oh-list{display:flex;flex-direction:column;gap:5px}\
.oh-r{display:flex;align-items:center;gap:7px;font-size:.76rem}\
.oh-r .k{flex:none;width:3.4em;font-family:'Nanum Myeongjo',serif;font-size:.86rem;letter-spacing:.04em}\
.oh-r .bar{flex:1;height:9px;border-radius:999px;background:rgba(255,255,255,.05);overflow:hidden}\
.oh-r .bar i{display:block;height:100%;border-radius:999px;box-shadow:0 0 10px currentColor}\
.oh-r .n{flex:none;width:2.1em;text-align:right;color:#c4b8d0;font-size:.75rem}\
.oh-r .tg{flex:none;font-size:.63rem;border-radius:999px;padding:1.5px 7px;border:1px solid;white-space:nowrap}\
.tg.use{color:#7fd0a8;border-color:rgba(80,180,130,.5);background:rgba(60,140,100,.14)}\
.tg.avd{color:#e0956a;border-color:rgba(220,130,70,.5);background:rgba(180,90,50,.14)}\
.tg.non{color:#8a7f9a;border-color:rgba(140,110,150,.42);background:rgba(90,70,110,.16)}\
.tg.gap{visibility:hidden}\
.du-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:5px;scrollbar-width:thin}\
.du-wrap::-webkit-scrollbar{height:4px}.du-wrap::-webkit-scrollbar-thumb{background:rgba(150,60,70,.5);border-radius:2px}\
.du{display:flex;gap:5px;min-width:min-content;padding:2px 1px}\
.du .c{flex:none;width:56px;border-radius:9px;border:1px solid rgba(140,110,150,.3);background:rgba(30,22,38,.6);padding:7px 2px 5px;text-align:center}\
.du .c .hj{display:block;font-family:'Nanum Myeongjo',serif;font-size:1.02rem;color:#cdc0d8;line-height:1.2}\
.du .c .ko{display:block;font-size:.6rem;color:#7d7089;margin-top:1px}\
.du .c .ag{display:block;font-size:.63rem;color:#8a7f9a;margin-top:3px;border-top:1px solid rgba(140,110,150,.2);padding-top:3px}\
.du .c.past{opacity:.45}\
.du .c.now{border-color:#ff5a3a;background:rgba(160,40,30,.26);box-shadow:0 0 16px rgba(220,70,40,.4)}\
.du .c.now .hj{color:#ffb08a}.du .c.now .ag{color:#ff8a5a}\
.du .c.now .nowtag{display:block;font-size:.58rem;color:#ff5a3a;margin-top:2px}\
.ys{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;justify-content:center}\
.ys .y{background:rgba(30,20,26,.8);border:1px solid rgba(200,80,60,.4);border-radius:9px;padding:6px 11px;cursor:pointer;font-family:inherit;text-align:center;transition:border-color .15s,background .15s}\
.ys .y:hover{border-color:#ff8a5a;background:rgba(60,26,26,.9)}\
.ys .y b{display:block;color:#ffb08a;font-size:.82rem;font-family:'Nanum Myeongjo',serif}\
.ys .y em{display:block;font-style:normal;color:#8a7f9a;font-size:.63rem;margin-top:1px}\
.ys .y.pulse{animation:rpulse .8s ease 3}\
@keyframes rpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.13);border-color:#ff5a3a}}\
.rtl .tip{min-height:1.3em;text-align:center;font-size:.79rem;color:#ff8a5a;margin:7px 0 0}\
.rtl .lg{text-align:center;font-size:.7rem;color:#6f6479;margin-top:4px}\
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

  // ===== ② 명식(命式) — 만세력 정식 배치 =====
  var GAN_OH = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
  var JI_OH = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };
  var OH_HJ = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

  function dashboard(el, base, deep) {
    var cols = [["year", "년"], ["month", "월"], ["day", "일"], ["hour", "시"]];
    var use = (deep && deep.yongshin && deep.yongshin.use) || [];
    var avoid = (deep && deep.yongshin && deep.yongshin.avoid) || [];

    // 1행 머리 / 2행 천간십성 / 3행 천간 / 4행 지지 / 5행 지지십성
    var rowHd = '<div class="hd"></div>', rowGS = '<div class="lb">십성</div>',
        rowG = '<div class="lb">천간</div>', rowJ = '<div class="lb">지지</div>',
        rowJS = '<div class="lb">십성</div>';
    cols.forEach(function (c) {
      var p = base.pillars[c[0]], me = (c[0] === "day") ? " me" : "";
      rowHd += '<div class="hd' + me + '">' + c[1] + (c[0] === "day" ? " (我)" : "") + "</div>";
      if (!p) {
        rowGS += '<div class="ss">—</div>'; rowG += '<div class="gz" style="color:#5a5266">·</div>';
        rowJ += '<div class="gz" style="color:#5a5266">·</div>'; rowJS += '<div class="ss">시 모름</div>';
        return;
      }
      var gOh = GAN_OH[p.gan] || "토", jOh = JI_OH[p.ji] || "토";
      rowGS += '<div class="ss' + me + '">' + (c[0] === "day" ? "일간(我)" : p.ganSipseong) + "</div>";
      rowG += '<div class="gz' + me + '" style="color:' + OH_COLOR[gOh] + '">' + (GAN_H[p.gan] || p.gan) +
        "<u>" + p.gan + gOh + "</u></div>";
      rowJ += '<div class="gz' + me + '" style="color:' + OH_COLOR[jOh] + '">' + (JI_H[p.ji] || p.ji) +
        "<u>" + p.ji + jOh + "</u></div>";
      rowJS += '<div class="ss' + me + '">' + p.jiSipseong + "</div>";
    });

    // 일간 요약 + 신강/신약 게이지
    var dayP = base.pillars.day;
    var ilOh = dayP ? (GAN_OH[dayP.gan] || "토") : "토";
    var pct = Math.max(4, Math.min(96, Math.round((base.strength.ratio || 0.5) * 100)));

    // 오행 분포
    var keys = ["목", "화", "토", "금", "수"];
    var maxOh = 0.001, sum = 0;
    keys.forEach(function (k) { var v = base.oheng[k] || 0; if (v > maxOh) maxOh = v; sum += v; });
    var ohHtml = keys.map(function (k) {
      var v = base.oheng[k] || 0;
      var w = Math.max(3, Math.round(v / maxOh * 100));
      var tag = use.indexOf(k) >= 0 ? '<span class="tg use">용신</span>'
              : avoid.indexOf(k) >= 0 ? '<span class="tg avd">기신</span>'
              : v === 0 ? '<span class="tg non">없음</span>' : '<span class="tg gap">·</span>';
      return '<div class="oh-r"><span class="k" style="color:' + OH_COLOR[k] + '">' + OH_HJ[k] + " " + k + "</span>" +
        '<div class="bar"><i style="width:' + w + "%;background:" + OH_COLOR[k] + ";color:" + OH_COLOR[k] + '"></i></div>' +
        '<span class="n">' + (Math.round(v * 10) / 10) + "</span>" + tag + "</div>";
    }).join("");

    el.className = "rdash";
    el.innerHTML =
      "<h4>命 式<em>귀곡이 읽어낸 네 여덟 글자</em></h4>" +
      '<div class="ms">' + rowHd + rowGS + rowG + rowJ + rowJS + "</div>" +
      (dayP ? '<p class="ms-ilgan"><b>' + (GAN_H[dayP.gan] || "") + OH_HJ[ilOh] + " " + dayP.gan + ilOh +
        '</b> 일간 · <span>' + base.strength.label + " (" + pct + "%)</span></p>" : "") +
      '<div class="gau"><div class="tr"><span class="pin" style="left:' + pct + '%"></span></div>' +
      '<div class="sc"><span>← 신약 (도움이 필요)</span><span>중화</span><span>(스스로 밀어붙임) 신강 →</span></div></div>' +
      '<div class="oh-list">' + ohHtml + "</div>";
  }

  // ===== ① 대운(大運) 흐름 + 주목할 해 =====
  var tlEl = null;
  function timeline(el, deep) {
    if (!deep || !deep.daeun || !deep.daeun.length) { el.style.display = "none"; return; }
    tlEl = el;
    var age = deep.koreanAge || 0;

    var cards = deep.daeun.map(function (d, i) {
      var cls = d.current ? " now" : (d.age + 10 <= age ? " past" : "");
      var hj = hanja(d.ganji);
      return '<div class="c' + cls + '" data-i="' + i + '">' +
        '<span class="hj">' + hj + "</span>" +
        '<span class="ko">' + d.ganji + "</span>" +
        '<span class="ag">' + d.age + "세</span>" +
        (d.current ? '<span class="nowtag">지금 ' + age + "세</span>" : "") + "</div>";
    }).join("");

    // 주목할 해 — 합충 등 기운이 겹치는 해만, 올해 이후 우선
    var notable = (deep.seun || []).filter(function (s2) { return s2.notes && s2.notes.length; });
    var now = deep.nowYear || 0;
    var upcoming = notable.filter(function (s2) { return s2.year >= now; });
    var pick = (upcoming.length ? upcoming : notable).slice(0, 5);
    var chips = pick.map(function (s2) {
      return '<button class="y" data-year="' + s2.year + '" data-note="' + esc(s2.notes.join(" · ")) + '">' +
        "<b>" + s2.year + " " + s2.ganji + "</b><em>" + esc(s2.notes[0]) + "</em></button>";
    }).join("");

    el.className = "rtl";
    el.innerHTML =
      "<h4>大 運<em>10년마다 판이 바뀐다 · 지금 서 있는 자리</em></h4>" +
      '<div class="du-wrap"><div class="du">' + cards + "</div></div>" +
      (chips ? '<p class="lg" style="margin:10px 0 0">주목할 해 — 눌러서 무엇이 겹치는지 보라</p><div class="ys">' + chips + "</div>" : "") +
      '<p class="tip" id="tl-tip"></p>';

    el.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".y") : null;
      if (t) showYear(t);
    });
    // 현재 대운이 보이도록 가로 스크롤 위치 조정
    setTimeout(function () {
      var wrap = el.querySelector(".du-wrap"), cur = el.querySelector(".du .c.now");
      if (wrap && cur) wrap.scrollLeft = cur.offsetLeft - wrap.clientWidth / 2 + cur.offsetWidth / 2;
    }, 60);
  }
  function showYear(t) {
    var tip = document.getElementById("tl-tip");
    if (tip) tip.textContent = "🕯 " + t.getAttribute("data-year") + "년 — " + t.getAttribute("data-note");
    t.classList.remove("pulse"); void t.offsetWidth; t.classList.add("pulse");
  }
  function flashYear(y) {
    if (!tlEl) return;
    var t = tlEl.querySelector('.y[data-year="' + y + '"]');
    tlEl.scrollIntoView({ behavior: "smooth", block: "center" });
    if (t) setTimeout(function () { showYear(t); }, 350);
    else {
      var tip = document.getElementById("tl-tip");
      if (tip) tip.textContent = y + "년 — 대운 흐름에서 위치를 가늠해보라";
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
