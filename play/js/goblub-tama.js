// 고브럽 다마고치 — 코너 버디를 누르면 펼쳐지는 레트로 케어 기계.
// 매운맛: 배부름·행복·기력·청결이 실시간으로 줄고, 오래 방치하면 아프고 → 삐져서 가출(리셋).
// 성장/레벨은 feed.js(GoblubFeed)를 그대로 사용. 케어 상태는 localStorage "goblub_tama".
// window.GoblubTama = { open }
(function () {
  if (window.GoblubTama) return;
  var base = (function () {
    var b = (document.currentScript && document.currentScript.src) || "";
    if (!b) { var ss = document.getElementsByTagName("script"); for (var i = 0; i < ss.length; i++) if (ss[i].src && /\/play\/js\/goblub-/.test(ss[i].src)) { b = ss[i].src; break; } }
    return b.replace(/[^/]+$/, "");
  })();
  var KEY = "goblub_tama";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DECAY = { hunger: 10, happy: 9, energy: 7, clean: 6 }; // 시간당 감소
  var SICK_H = 12, GONE_H = 72; // 방치 12시간→아픔, 72시간→가출

  function now() { return Date.now(); }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function fresh() {
    return { hunger: 80, happy: 80, energy: 85, clean: 90, sleeping: false, poop: false,
      lastFeed: now(), lastUpdate: now(), lowSince: null, lastEmotion: 0, gone: false };
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s.hunger === "number") return s; } catch (e) {}
    return fresh();
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  // 경과 시간만큼 상태 감소/회복 계산
  function tick(s) {
    var t = now(), hrs = (t - (s.lastUpdate || t)) / 3600000;
    if (hrs > 0) {
      var m = s.sleeping ? 0.3 : 1;
      s.hunger = clamp(s.hunger - DECAY.hunger * hrs * m);
      s.happy = clamp(s.happy - DECAY.happy * hrs * m);
      s.clean = clamp(s.clean - DECAY.clean * hrs * m * (s.poop ? 1.8 : 1));
      if (s.sleeping) { s.energy = clamp(s.energy + 22 * hrs); if (s.energy >= 100) s.sleeping = false; }
      else s.energy = clamp(s.energy - DECAY.energy * hrs);
      if (!s.poop && s.lastFeed && (t - s.lastFeed) > (3 + Math.random() * 1.5) * 3600000) s.poop = true;
      var lowmin = Math.min(s.hunger, s.happy, s.energy, s.clean);
      var avg = (s.hunger + s.happy + s.energy + s.clean) / 4;
      if (lowmin <= 2 || avg < 15) { if (!s.lowSince) s.lowSince = t; }
      else if (avg > 40) s.lowSince = null;
      if (s.lowSince && (t - s.lowSince) > GONE_H * 3600000) s.gone = true;
      s.lastUpdate = t;
    }
    return s;
  }
  function isSick(s) { return !s.gone && s.lowSince && (now() - s.lowSince) > SICK_H * 3600000; }

  function mood(s) {
    if (s.gone) return { face: "", txt: "", cls: "" };
    if (s.sleeping) return { face: "😴", txt: "쿨쿨 자는 중… (다시 눌러 깨우기)", cls: "sleep" };
    if (isSick(s)) return { face: "🤒", txt: "아파요… 얼른 돌봐주세요!", cls: "sick" };
    if (s.poop) return { face: "🤢", txt: "지저분해요! 씻겨주세요", cls: "" };
    var arr = [["hunger", s.hunger, "😫", "배고파요… 밥 주세요!"], ["energy", s.energy, "😪", "졸려요… 재워주세요"],
      ["happy", s.happy, "😢", "심심해요… 놀아주세요"], ["clean", s.clean, "😣", "꿉꿉해요… 씻고 싶어요"]];
    arr.sort(function (a, b) { return a[1] - b[1]; });
    if (arr[0][1] < 30) return { face: arr[0][2], txt: arr[0][3], cls: "" };
    return { face: pick(["😊", "💕", "😄", "✨"]), txt: "기분 최고예요!", cls: "happy" };
  }

  function feedState() { return (window.GoblubFeed && GoblubFeed.state()) || { name: "고브럽", level: 0, levelInfo: { art: false, emoji: "🥚", deco: "" } }; }

  // ---- UI ----
  var el = {}, iv = null, s = null;

  function injectCss() {
    if (document.getElementById("gt-css")) return;
    var c = document.createElement("style"); c.id = "gt-css";
    c.textContent =
      ".gt-back{position:fixed;inset:0;z-index:10000;background:rgba(4,2,20,.62);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s;}" +
      ".gt-back.show{opacity:1;}" +
      ".gt-dev{width:min(92vw,344px);background:linear-gradient(160deg,#2a1c66,#17103e);border:2px solid #9d6bff;border-radius:34px 34px 26px 26px;box-shadow:0 0 30px rgba(157,107,255,.5),inset 0 0 22px rgba(255,255,255,.04);padding:16px 16px 18px;transform:scale(.5);opacity:0;transform-origin:bottom right;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s;font-family:inherit;}" +
      ".gt-back.show .gt-dev{transform:scale(1);opacity:1;}" +
      ".gt-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 4px;}" +
      ".gt-name{color:#fff;font-size:1.02rem;}" +
      ".gt-lv{color:#b9a8e8;font-size:.78rem;}" +
      ".gt-x{width:26px;height:26px;border-radius:50%;border:1.5px solid #9d6bff;background:#251a56;color:#f3ecff;font-size:15px;line-height:22px;cursor:pointer;padding:0;}" +
      ".gt-screen{position:relative;background:radial-gradient(circle at 50% 35%,#241a54,#120c30);border:2px solid #3f2d80;border-radius:18px;padding:14px 12px 10px;overflow:hidden;transition:filter .3s;}" +
      ".gt-screen.sleep{filter:brightness(.6) saturate(.7);}" +
      ".gt-screen.sick{animation:gt-shake .5s ease infinite;}" +
      "@keyframes gt-shake{25%{transform:translateX(-2px);}75%{transform:translateX(2px);}}" +
      ".gt-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px);}" +
      ".gt-stage{position:relative;text-align:center;min-height:132px;display:flex;align-items:center;justify-content:center;}" +
      ".gt-pet{position:relative;display:inline-block;}" +
      (reduce ? "" : ".gt-pet.idle{animation:gt-bob 2.6s ease-in-out infinite;}") +
      "@keyframes gt-bob{0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-6px) rotate(2deg);}}" +
      ".gt-pet.nom{animation:gt-nom .5s ease;}@keyframes gt-nom{30%{transform:scale(1.2,.85) rotate(-6deg);}65%{transform:scale(.9,1.15) rotate(6deg);}}" +
      ".gt-pet.bounce{animation:gt-bounce .5s ease;}@keyframes gt-bounce{30%{transform:translateY(-18px) scale(1.05);}60%{transform:translateY(4px) scale(.96);}}" +
      ".gt-pet.chomp{animation:gt-chomp .55s ease;}@keyframes gt-chomp{20%{transform:scale(1.25,.8);}45%{transform:scale(.82,1.22) rotate(-8deg);}70%{transform:scale(1.08,.94) rotate(6deg);}}" +
      ".gt-pet .goblub-svg{width:118px!important;height:auto!important;display:block;}" +
      ".gt-egg{font-size:82px;line-height:1;}" +
      ".gt-deco{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:1.7rem;pointer-events:none;}" +
      ".gt-face{position:absolute;top:-6px;right:8px;font-size:1.5rem;}" +
      ".gt-poop{position:absolute;bottom:6px;right:16px;font-size:1.5rem;}" +
      ".gt-zzz{position:absolute;top:2px;right:20px;font-size:1.3rem;color:#cdbdf6;animation:gt-zzz 2s ease-in-out infinite;}@keyframes gt-zzz{0%{opacity:.2;transform:translateY(4px);}50%{opacity:1;transform:translateY(-4px);}100%{opacity:.2;transform:translateY(-10px);}}" +
      ".gt-fx{position:absolute;font-size:1.3rem;pointer-events:none;animation:gt-fx 1s ease forwards;}@keyframes gt-fx{0%{opacity:0;transform:translateY(0) scale(.5);}30%{opacity:1;}100%{opacity:0;transform:translateY(-46px) scale(1.3);}}" +
      ".gt-status{text-align:center;color:#e6dcff;font-size:.9rem;min-height:1.3em;margin:6px 2px 10px;}" +
      ".gt-warn{text-align:center;color:#ffb3c8;font-size:.8rem;margin:-4px 2px 8px;text-shadow:0 0 8px rgba(255,110,150,.5);}" +
      ".gt-meters{display:flex;flex-direction:column;gap:6px;margin:2px 4px 4px;}" +
      ".gt-meter{display:flex;align-items:center;gap:8px;}" +
      ".gt-mlabel{width:5.4em;font-size:.76rem;color:#cdbdf6;flex:none;}" +
      ".gt-bar{flex:1;height:11px;border-radius:999px;background:#1b1240;border:1px solid #3f2d80;overflow:hidden;}" +
      ".gt-fill{display:block;height:100%;border-radius:999px;transition:width .4s,background .4s;}" +
      ".gt-btns{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:12px;}" +
      ".gt-btn{background:#251a56;border:1.5px solid #9d6bff;border-radius:14px;padding:9px 2px 6px;font-family:inherit;font-size:.66rem;color:#e6dcff;cursor:pointer;line-height:1.25;box-shadow:0 0 8px rgba(157,107,255,.25);transition:transform .1s,box-shadow .15s;}" +
      ".gt-btn:hover{box-shadow:0 0 14px rgba(157,107,255,.6);}" +
      ".gt-btn:active{transform:translateY(2px);}" +
      ".gt-btn .em{font-size:1.4rem;display:block;margin-bottom:2px;}" +
      ".gt-btn.emo{border-color:#ff6ec7;box-shadow:0 0 10px rgba(255,110,199,.4);}" +
      ".gt-btn.emo:hover{box-shadow:0 0 16px rgba(255,110,199,.7);}" +
      ".gt-hatch{width:100%;margin-top:12px;background:linear-gradient(90deg,#ffd93d,#ff9a5a);color:#2a1a05;border:none;border-radius:14px;padding:12px;font-family:inherit;font-size:.95rem;cursor:pointer;box-shadow:0 0 16px rgba(255,217,61,.5);}" +
      ".gt-hint{text-align:center;color:#8f7fc0;font-size:.7rem;margin-top:8px;}";
    document.head.appendChild(c);
  }

  function build() {
    injectCss();
    var back = document.createElement("div"); back.className = "gt-back";
    back.innerHTML =
      '<div class="gt-dev" role="dialog" aria-label="고브럽 다마고치">' +
      '<div class="gt-top"><div><div class="gt-name" id="gt-name"></div><div class="gt-lv" id="gt-lv"></div></div>' +
      '<button class="gt-x" id="gt-x" type="button" aria-label="닫기">×</button></div>' +
      '<div class="gt-screen" id="gt-screen"><div class="gt-scan"></div>' +
      '<div class="gt-stage" id="gt-stage"></div>' +
      '<div class="gt-warn" id="gt-warn" style="display:none"></div>' +
      '<div class="gt-status" id="gt-status"></div>' +
      '<div class="gt-meters" id="gt-meters"></div></div>' +
      '<div id="gt-controls"></div>' +
      '<div class="gt-hint">매운맛 모드 · 오래 방치하면 고브럽이 떠날 수도 있어요</div>' +
      '</div>';
    document.body.appendChild(back);
    el.back = back;
    el.name = back.querySelector("#gt-name"); el.lv = back.querySelector("#gt-lv");
    el.screen = back.querySelector("#gt-screen"); el.stage = back.querySelector("#gt-stage");
    el.warn = back.querySelector("#gt-warn"); el.status = back.querySelector("#gt-status");
    el.meters = back.querySelector("#gt-meters"); el.controls = back.querySelector("#gt-controls");
    back.querySelector("#gt-x").onclick = close;
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
  }

  function meter(emoji, label, val) {
    var col = val >= 60 ? "#6bffa0" : val >= 30 ? "#ffd93d" : "#ff6b6b";
    return '<div class="gt-meter"><span class="gt-mlabel">' + emoji + " " + label + '</span>' +
      '<span class="gt-bar"><span class="gt-fill" style="width:' + Math.round(val) + "%;background:" + col + '"></span></span></div>';
  }

  function petHtml() {
    var li = feedState().levelInfo;
    if (li.art && window.GoblubArt) return GoblubArt.svg(118) + (li.deco ? '<span class="gt-deco">' + li.deco + "</span>" : "");
    return '<span class="gt-egg">' + (li.emoji || "🥚") + "</span>";
  }

  function render() {
    var st = feedState();
    el.name.textContent = st.name;
    el.lv.textContent = "Lv." + (st.level + 1) + " " + st.levelInfo.name;

    if (s.gone) {
      el.stage.innerHTML = '<span class="gt-egg">💨</span>';
      el.status.textContent = "고브럽이 삐져서 여행을 떠났어요…";
      el.warn.style.display = "none";
      el.meters.innerHTML = "";
      el.controls.innerHTML = '<button class="gt-hatch" id="gt-hatch" type="button">🥚 새 알 받아 다시 키우기</button>';
      el.controls.querySelector("#gt-hatch").onclick = function () {
        try { localStorage.removeItem(KEY); localStorage.removeItem("goblub_pet"); } catch (e) {}
        s = fresh(); save(s); render();
      };
      return;
    }

    var m = mood(s);
    el.screen.className = "gt-screen" + (s.sleeping ? " sleep" : "") + (isSick(s) ? " sick" : "");
    el.stage.innerHTML = '<span class="gt-pet ' + (reduce ? "" : "idle") + '" id="gt-pet">' + petHtml() +
      (m.face ? '<span class="gt-face">' + m.face + "</span>" : "") +
      (s.poop ? '<span class="gt-poop">💩</span>' : "") +
      (s.sleeping ? '<span class="gt-zzz">z</span>' : "") + "</span>";
    el.pet = el.stage.querySelector("#gt-pet");
    el.status.textContent = m.txt;

    if (isSick(s)) {
      var left = Math.max(1, Math.round(GONE_H - (now() - s.lowSince) / 3600000));
      el.warn.style.display = "block";
      el.warn.textContent = "⚠️ 아파요! 얼른 케어 안 하면 약 " + left + "시간 뒤 떠나요";
    } else el.warn.style.display = "none";

    el.meters.innerHTML = meter("🍚", "배부름", s.hunger) + meter("😊", "행복", s.happy) +
      meter("⚡", "기력", s.energy) + meter("✨", "청결", s.clean);

    if (!el.controls.querySelector(".gt-btns")) {
      el.controls.innerHTML =
        '<div class="gt-btns">' +
        '<button class="gt-btn" data-a="feed" type="button"><span class="em">🍬</span>밥</button>' +
        '<button class="gt-btn" data-a="play" type="button"><span class="em">🎮</span>놀기</button>' +
        '<button class="gt-btn" data-a="sleep" type="button"><span class="em">😴</span>잠</button>' +
        '<button class="gt-btn" data-a="clean" type="button"><span class="em">🧼</span>씻기</button>' +
        '<button class="gt-btn emo" data-a="emotion" type="button"><span class="em">😤</span>기분<br>먹이기</button>' +
        "</div>";
      Array.prototype.forEach.call(el.controls.querySelectorAll(".gt-btn"), function (b) {
        b.onclick = function () { act(b.getAttribute("data-a")); };
      });
    }
  }

  function anim(cls) { if (!el.pet) return; el.pet.classList.remove("idle", "nom", "bounce", "chomp"); void el.pet.offsetWidth; el.pet.classList.add(cls); setTimeout(function () { if (el.pet) { el.pet.classList.remove(cls); if (!reduce) el.pet.classList.add("idle"); } }, 560); }
  function fx(txt, x) { var f = document.createElement("span"); f.className = "gt-fx"; f.textContent = txt; f.style.left = (x || 46) + "%"; f.style.bottom = "40%"; el.stage.appendChild(f); setTimeout(function () { f.remove(); }, 1000); }
  function say(t) { el.status.textContent = t; }

  function celebrate() { ["🎉", "⭐", "✨"].forEach(function (e2, i) { setTimeout(function () { fx(e2, 30 + i * 20); }, i * 120); }); }

  function act(a) {
    if (s.gone) return;
    var msg = null;
    if (a === "feed") {
      if (s.hunger >= 96) { render(); say("배불러~ 그만! 🫃"); return; }
      s.hunger = clamp(s.hunger + 30); s.lastFeed = now(); anim("nom"); fx("🍬");
      if (window.GoblubFeed && GoblubFeed.state().pending > 0) {
        var r = GoblubFeed.feedOne();
        if (r && r.levelUp) { msg = "냠냠! 🎉 레벨 업 — 고브럽이 자랐어요!"; celebrate(); }
        else msg = "냠냠! 쑥쑥 자라는 중 🌱";
      } else msg = "냠냠! (콘텐츠 즐겨 먹이를 모으면 레벨업해요)";
    } else if (a === "play") {
      if (s.energy < 12) { render(); say("너무 졸려서 못 놀겠어… 😴"); return; }
      s.happy = clamp(s.happy + 28); s.energy = clamp(s.energy - 10); anim("bounce");
      fx("💕", 34); setTimeout(function () { fx("💜", 58); }, 150);
      msg = pick(["까르르! 신난다!", "한 판 더! 한 판 더!", "히히 잡았다 요놈!", "너랑 노는 게 최고야!"]);
    } else if (a === "sleep") {
      s.sleeping = !s.sleeping;
      msg = s.sleeping ? "잘 자… 다시 누르면 깨어나요 (자는 동안 기력 회복)"
        : "잘 잤다! 간밤에 '" + pick(["구름빵 먹는 꿈", "전생에 왕이었던 꿈", "별을 삼키는 꿈", "네가 쓰다듬어주는 꿈", "로또 1등 꿈(재미로!)", "온 세상 나쁜 기분을 먹어치우는 꿈"]) + "'을 꿨대 ✨";
    } else if (a === "clean") {
      if (!s.poop && s.clean >= 96) { render(); say("이미 반짝반짝해요! ✨"); return; }
      s.poop = false; s.clean = 100; fx("🫧", 40); setTimeout(function () { fx("✨", 56); }, 150);
      msg = "뽀득뽀득— 개운해! ✨";
    } else if (a === "emotion") {
      if (now() - (s.lastEmotion || 0) < 20 * 60000) { render(); say("아직 배불러— 잠시 후에 또 먹여줘! 🤤"); return; }
      s.lastEmotion = now(); s.happy = clamp(s.happy + 26); s.energy = clamp(s.energy + 8);
      if (!s.lastFeed) s.lastFeed = now();
      anim("chomp"); fx(pick(["😤", "😩", "😖", "💢"]), 40);
      msg = "나쁜 기분을 고브럽 입에 쏙!";
      setTimeout(function () { say("우걱우걱… 꺼억! 나쁜 기분 냠 — 개운하지? 😎"); }, 700);
    }
    if (window.GoblubFeed && GoblubFeed.earnCare) GoblubFeed.earnCare(); // 케어 → 젬리 +1 (하루 최대 5)
    save(s); render();
    if (msg) say(msg);
  }

  function loop() { tick(s); save(s); render(); }

  function open() {
    if (!window.GoblubFeed) { var sc = document.createElement("script"); sc.src = base + "feed.js?v=4"; sc.onload = open; sc.onerror = open; document.head.appendChild(sc); return; }
    if (!el.back) build();
    s = tick(load()); save(s);
    render();
    el.back.style.display = "flex";
    void el.back.offsetWidth; // reflow 후 show → rAF 없이도 전환 애니메이션 재생(백그라운드 탭 안전)
    el.back.classList.add("show");
    clearInterval(iv); iv = setInterval(loop, 20000); // 열려있는 동안 상태 서서히 갱신
  }
  function close() {
    if (!el.back) return;
    el.back.classList.remove("show");
    clearInterval(iv);
    setTimeout(function () { if (el.back) el.back.style.display = "none"; }, 260);
  }

  window.GoblubTama = { open: open };
})();
