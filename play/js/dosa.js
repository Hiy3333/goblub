// 고블럽 도사 심층 풀이 클라이언트.
// window.Dosa = { buildPayload, fetchReading }
(function () {
  var API = "https://goblub.vercel.app/api/saju-reading";
  var COOLDOWN_KEY = "goblub_dosa_last";
  var COOLDOWN_MS = 60000;

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // 엔진 계산 결과 r 를 전부 한글 문자열로 변환해 전송(모델이 인덱스를 해석할 여지 제거)
  function buildPayload(r, birth, gender, trueSolar) {
    function pv(p, isDay) {
      if (!p) return null;
      var t = Saju.pillarText(p);
      return {
        ganji: t.hangul,
        gan: Saju.GAN[p[0]],
        ji: Saju.JI[p[1]],
        ganSipseong: isDay ? "나(일간)" : Saju.SIPSEONG[Saju.sipseong(r.ilgan, p[0])],
        jiSipseong: Saju.SIPSEONG[Saju.sipseong(r.ilgan, Saju.branchMainGan(p[1]))]
      };
    }
    var o = {};
    ["목", "화", "토", "금", "수"].forEach(function (k) { o[k] = Math.round(r.oheng[k] * 10) / 10; });
    return {
      birth: { y: birth.y, m: birth.m, d: birth.d, hour: birth.hour, gender: gender || null, trueSolar: !!trueSolar },
      zodiac: r.zodiac,
      pillars: {
        year: pv(r.pillars.year),
        month: pv(r.pillars.month),
        day: pv(r.pillars.day, true),
        hour: pv(r.pillars.hour)
      },
      ilgan: Saju.GAN[r.ilgan],
      oheng: o,
      strength: { label: r.strength.label, ratio: Math.round(r.strength.ratio * 100) / 100 },
      topSipseong: r.topSipseong == null ? null : Saju.SIPSEONG[r.topSipseong],
      daeun: r.daeun ? {
        forward: r.daeun.forward,
        num: r.daeun.num,
        list: r.daeun.list.map(function (d) {
          return {
            age: d.age,
            ganji: Saju.pillarText([d.gan, d.ji]).hangul,
            sipseong: Saju.SIPSEONG[Saju.sipseong(r.ilgan, d.gan)]
          };
        })
      } : null
    };
  }

  // cb = { onChunk(text), onDone(fromCache), onError(code, sec?) }
  function fetchReading(payload, cb) {
    var key = "goblub_dosa_" + hash(JSON.stringify(payload));
    try {
      var cached = localStorage.getItem(key);
      if (cached) { cb.onChunk(cached); cb.onDone(true); return; }
    } catch (e) {}

    var last = 0;
    try { last = +localStorage.getItem(COOLDOWN_KEY) || 0; } catch (e) {}
    var wait = COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) { cb.onError("cooldown", Math.ceil(wait / 1000)); return; }
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch (e) {}

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saju: payload })
    })
      .then(function (resp) {
        if (resp.status === 501) { cb.onError("not_configured"); return; }
        if (!resp.ok || !resp.body) { cb.onError("busy"); return; }
        var reader = resp.body.getReader();
        var dec = new TextDecoder();
        var full = "";
        (function pump() {
          reader.read().then(function (x) {
            if (x.done) {
              if (full.trim()) {
                try { localStorage.setItem(key, full); } catch (e) {}
                cb.onDone(false);
              } else cb.onError("busy");
              return;
            }
            var t = dec.decode(x.value, { stream: true });
            full += t;
            cb.onChunk(t);
            pump();
          }).catch(function () { cb.onError("busy"); });
        })();
      })
      .catch(function () { cb.onError("busy"); });
  }

  window.Dosa = { buildPayload: buildPayload, fetchReading: fetchReading };
})();
