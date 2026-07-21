// 귀곡 사운드 — 명부 리포트용 BGM(합성 드론+심장박동) + 시댄스 추출 앰비언트 + 효과음.
// 모든 재생은 WebAudio(무결절 루프·게이트웨이 1개). 음소거는 localStorage "goblub_snd"="off".
// window.GwigokAudio = { begin, startAnalyzing, playEnding, startReading, stopAll, sfxPage, sfxThud, toggleMute, isMuted }
(function () {
  var ac = null, master = null, buffers = {}, nodes = [], ambSrc = null, started = false;
  var MUTE_KEY = "goblub_snd";
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "off"; } catch (e) { return false; } }

  function ensure() {
    if (ac) { if (ac.state === "suspended") ac.resume().catch(function () {}); return true; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = isMuted() ? 0 : 1;
      master.connect(ac.destination);
      return true;
    } catch (e) { return false; }
  }

  function loadBuf(name, url) {
    if (buffers[name]) return;
    buffers[name] = "loading";
    fetch(url).then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) { return ac.decodeAudioData(ab); })
      .then(function (b) { buffers[name] = b; })
      .catch(function () { buffers[name] = null; });
  }

  function reg(n) { nodes.push(n); return n; }
  function killNodes() {
    nodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    nodes = [];
    if (ambSrc) { try { ambSrc.stop(); } catch (e) {} ambSrc = null; }
  }

  // ===== 합성 레이어 =====
  function drone(freq, gainV) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.value = freq;
    o2.type = "sawtooth"; o2.frequency.value = freq * 1.007; // 미세 디튠 — 불안한 맥놀이
    f.type = "lowpass"; f.frequency.value = 220; f.Q.value = 2;
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(gainV, ac.currentTime + 3);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o.start(); o2.start();
    reg(o); reg(o2); reg(g);
    // 느린 울렁임
    var lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = gainV * 0.5;
    lfo.connect(lg); lg.connect(g.gain); lfo.start(); reg(lfo); reg(lg);
  }
  function heartbeat(bpm, gainV) {
    var iv = 60 / bpm;
    var t0 = ac.currentTime + 0.5;
    var g = ac.createGain(); g.gain.value = gainV; g.connect(master); reg(g);
    var timer = setInterval(function () {
      if (!ac) return;
      var t = ac.currentTime + 0.05;
      [0, 0.28].forEach(function (off, i) { // 쿵-쿵(2박)
        var o = ac.createOscillator(), eg = ac.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(i ? 52 : 58, t + off);
        eg.gain.setValueAtTime(0.0001, t + off);
        eg.gain.exponentialRampToValueAtTime(i ? 0.7 : 1, t + off + 0.02);
        eg.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.22);
        o.connect(eg); eg.connect(g);
        o.start(t + off); o.stop(t + off + 0.3);
      });
    }, iv * 1000);
    reg({ stop: function () { clearInterval(timer); } });
  }
  function windNoise(gainV) {
    var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    var f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 300; f.Q.value = 0.4;
    var g = ac.createGain(); g.gain.value = gainV;
    var lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.13; lg.gain.value = gainV * 0.6;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(); lfo.start();
    reg(src); reg(lfo); reg(g);
  }
  function ambLoop(name, gainV) {
    var b = buffers[name];
    if (!b || b === "loading") { setTimeout(function () { if (nodes.length) ambLoop(name, gainV); }, 400); return; }
    var src = ac.createBufferSource(); src.buffer = b; src.loop = true;
    var g = ac.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(gainV, ac.currentTime + 1.2);
    src.connect(g); g.connect(master);
    src.start(); ambSrc = src; reg(g);
  }

  // ===== 공개 API =====
  function begin() { // 유저 제스처 안에서 호출 — 컨텍스트 언락 + 버퍼 프리로드
    if (!ensure()) return;
    started = true;
    loadBuf("write", "audio/amb_write.m4a?v=1");
    loadBuf("close", "audio/amb_close.m4a?v=1");
  }
  function startAnalyzing() { // 명부 새기는 중 — 드론+심장박동+붓 앰비언트
    if (!started && !ensure()) return;
    killNodes();
    drone(55, 0.05);
    heartbeat(44, 0.5);
    windNoise(0.02);
    ambLoop("write", 0.5);
  }
  function playEnding() { // 명부 덮는 순간 — 앰비언트 끊고 엔딩 오디오(영상과 동시 시작)
    if (!ac) return;
    if (ambSrc) { try { ambSrc.stop(); } catch (e) {} ambSrc = null; }
    var b = buffers.close;
    if (b && b !== "loading") {
      var src = ac.createBufferSource(); src.buffer = b;
      var g = ac.createGain(); g.gain.value = 0.85;
      src.connect(g); g.connect(master); src.start(); reg(g);
    }
  }
  function startReading() { // 명부 읽는 중 — 아주 낮은 드론만
    if (!ac) return;
    killNodes();
    drone(49, 0.028);
    windNoise(0.012);
  }
  function stopAll() { if (ac) killNodes(); }
  function sfxPage() { // 종이 넘김 — 필터 노이즈 스윕
    if (!ac || isMuted()) return;
    var len = ac.sampleRate * 0.28, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource(); src.buffer = buf;
    var f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 0.8;
    f.frequency.setValueAtTime(900, ac.currentTime);
    f.frequency.exponentialRampToValueAtTime(2600, ac.currentTime + 0.16);
    var g = ac.createGain(); g.gain.value = 0.16;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }
  function sfxThud() { // 낮은 북 '쿵'
    if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(38, ac.currentTime + 0.28);
    g.gain.setValueAtTime(0.9, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ac.currentTime + 0.6);
  }
  function toggleMute() {
    var m = !isMuted();
    try { localStorage.setItem(MUTE_KEY, m ? "off" : "on"); } catch (e) {}
    if (master) master.gain.value = m ? 0 : 1;
    return m;
  }

  window.GwigokAudio = {
    begin: begin, startAnalyzing: startAnalyzing, playEnding: playEnding,
    startReading: startReading, stopAll: stopAll,
    sfxPage: sfxPage, sfxThud: sfxThud,
    toggleMute: toggleMute, isMuted: isMuted
  };
})();
