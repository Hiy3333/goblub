// 공유 사주 프로필. localStorage "goblub_birth" = {y,m,d,hour,min,gender}
// gender: "" | "M" | "F" (선택 입력)
(function () {
  var KEY = "goblub_birth";

  function get() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY));
      if (p && p.y >= 1900 && p.y <= 2100 && p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= 31) {
        if (p.gender !== "M" && p.gender !== "F") p.gender = "";
        return p;
      }
    } catch (e) {}
    return null;
  }

  function set(p) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        y: p.y, m: p.m, d: p.d,
        hour: p.hour == null ? null : p.hour,
        min: p.min || 0,
        gender: p.gender === "M" || p.gender === "F" ? p.gender : ""
      }));
    } catch (e) {}
  }

  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  window.GoblubProfile = { get: get, set: set, clear: clear };
})();
