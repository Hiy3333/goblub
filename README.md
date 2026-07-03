# goblub — 즐길거리 놀이터

사주, 심리테스트, 미니게임 등 재미난 HTML 페이지와 직접 만든 모바일 앱을 모아둔 포털.

- 사이트: https://hiy3333.github.io/goblub/
- 기술: 순수 정적 HTML/CSS/JS (빌드 없음). master에 푸시하면 GitHub Pages에 자동 반영.

## 콘텐츠 추가 방법

1. 만든 HTML 파일을 `play/` 폴더에 넣는다. (예: `play/saju.html`)
2. `index.html`의 카드 그리드에 카드 하나를 추가한다:

   ```html
   <a class="card tint-mint" href="play/saju.html">
     <span class="icon">🔮</span>
     <h2>사주</h2>
     <p>한 줄 소개</p>
   </a>
   ```

   카드 배경색은 `tint-coral / tint-yellow / tint-mint / tint-sky / tint-purple` 중 선택.

3. (선택) 추가한 페이지에서 공용 헤더/푸터를 쓰려면 페이지에 아래를 넣는다.
   `play/` 하위 페이지는 `data-root=".."`:

   ```html
   <link rel="stylesheet" href="../css/style.css" />
   ...
   <div id="site-header"></div>
   (본문)
   <div id="site-footer"></div>
   <script src="../js/common.js" data-root=".."></script>
   ```

## 앱 링크 추가 방법

`apps.html`의 앱 카드에서 `<button class="btn-download" disabled>준비 중</button>`을
`<a class="btn-download" href="다운로드링크">다운로드</a>`로 바꾼다.
