// 명부 열람 기록 — 귀곡관 페이지들이 남기는 장부.
// window.GwigokLog = { add(type, title, line), list(), clear() }
// type: day(일지) | cal(달력) | sinsal(신살) | ask(문답) | dream(해몽) | bujeok(부적) | myeongbu(대조) | book(본편)
(function () {
  var KEY = "goblub_myeongbu_log";
  var MAX = 120;

  function load() {
    try { var a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  function add(type, title, line) {
    var a = load();
    var now = new Date();
    var stamp = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate();
    // 같은 날 같은 종류·제목이면 덮어쓴다(재방문 도배 방지)
    a = a.filter(function (e) { return !(e.d === stamp && e.t === type && e.h === title); });
    a.unshift({ d: stamp, t: type, h: String(title || "").slice(0, 60), l: String(line || "").slice(0, 120) });
    if (a.length > MAX) a = a.slice(0, MAX);
    save(a);
  }

  window.GwigokLog = {
    add: add,
    list: load,
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
