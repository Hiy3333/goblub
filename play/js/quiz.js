// goblub 공용 퀴즈 엔진 — 흐름+채점. 결과는 config.renderResult 로 위임.
// config = {
//   emoji, title, intro,                        // 시작 화면
//   feedSrc,                                     // (선택) 결과 도달 시 GoblubFeed.grant(feedSrc)
//   questions: [{ q, choices: [{ text, scores:{키:점수} }] }],
//   renderResult: function(totals, el, api)      // 테스트별 커스텀 결과. api={restart, shareLink}
// }
(function () {
  function init(el, config) {
    var idx = 0, totals = {};
    function addScores(s) { for (var k in s) totals[k] = (totals[k] || 0) + s[k]; }

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
          else finish();
        };
      });
    }

    function finish() {
      if (window.GoblubFeed && config.feedSrc) GoblubFeed.grant(config.feedSrc);
      config.renderResult(totals, el, { restart: renderStart, shareLink: shareLink });
    }

    function shareLink(btn) {
      // 모바일: 네이티브 공유 시트(카톡·인스타 바로), 미지원 시 링크 복사
      if (navigator.share) {
        navigator.share({ title: config.title + " — goblub", url: location.href })
          .then(function () { btn.textContent = "공유 완료!"; })
          .catch(function () { /* 사용자가 시트 닫음 — 조용히 무시 */ });
        return;
      }
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
        .then(function () { btn.textContent = "복사됨!"; })
        .catch(function () { btn.textContent = location.href; });
    }

    renderStart();
  }

  // 이산 결과 최고점 키(동점이면 order 앞선 키 우선). 순수 함수.
  function top(totals, order) {
    var best = order[0], bestV = -Infinity;
    order.forEach(function (k) { var v = totals[k] || 0; if (v > bestV) { bestV = v; best = k; } });
    return best;
  }

  window.Quiz = { init: init, top: top };
})();
