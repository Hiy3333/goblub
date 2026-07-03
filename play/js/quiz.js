// goblub 공용 퀴즈 엔진.
// 사용: Quiz.init(document.getElementById("quiz"), config)
// config = {
//   emoji, title, intro,                       // 시작 화면
//   questions: [{ q, choices: [{ text, scores: {키:점수} }] }],
//   results: { 키: { emoji, name, desc } },
//   resolve: function(totals) -> 결과키,
//   extraResultHTML: (선택) 결과 카드 하단에 붙일 HTML 문자열
// }
(function () {
  function init(el, config) {
    var idx = 0;
    var totals = {};

    function addScores(scores) {
      for (var k in scores) totals[k] = (totals[k] || 0) + scores[k];
    }

    function renderStart() {
      idx = 0; totals = {};
      el.innerHTML =
        '<span class="result-emoji">' + config.emoji + "</span>" +
        '<h2 style="text-align:center">' + config.title + "</h2>" +
        '<p class="result-desc" style="text-align:center; margin:12px 0 20px">' + config.intro + "</p>" +
        '<div class="result-actions"><button class="btn-primary" id="qz-start">시작하기</button></div>';
      el.querySelector("#qz-start").onclick = renderQ;
    }

    function renderQ() {
      var q = config.questions[idx];
      var pct = Math.round(idx / config.questions.length * 100);
      var html =
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="quiz-q">Q' + (idx + 1) + ". " + q.q + "</p>";
      q.choices.forEach(function (c, i) {
        html += '<button class="choice-btn" data-i="' + i + '">' + c.text + "</button>";
      });
      el.innerHTML = html;
      Array.prototype.forEach.call(el.querySelectorAll(".choice-btn"), function (btn) {
        btn.onclick = function () {
          addScores(q.choices[+btn.dataset.i].scores);
          idx++;
          if (idx < config.questions.length) renderQ();
          else renderResult();
        };
      });
    }

    function renderResult() {
      var key = config.resolve(totals);
      var r = config.results[key];
      el.innerHTML =
        '<span class="result-emoji">' + r.emoji + "</span>" +
        '<p class="result-name">' + r.name + "</p>" +
        '<p class="result-desc">' + r.desc + "</p>" +
        (config.extraResultHTML || "") +
        '<div class="result-actions">' +
        '<button class="btn-primary" id="qz-retry">다시하기</button>' +
        '<button class="btn-ghost" id="qz-share">링크 복사</button>' +
        "</div>";
      el.querySelector("#qz-retry").onclick = renderStart;
      el.querySelector("#qz-share").onclick = function () {
        var btn = el.querySelector("#qz-share");
        (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
          .then(function () { btn.textContent = "복사됨!"; })
          .catch(function () { btn.textContent = location.href; });
      };
    }

    renderStart();
  }

  window.Quiz = { init: init };
})();
