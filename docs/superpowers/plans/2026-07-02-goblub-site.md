# goblub 즐길거리 포털 사이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 밝고 알록달록한 정적 포털 사이트(goblub) 첫 버전 — 메인 페이지 + 앱 다운로드 페이지, GitHub Pages 배포.

**Architecture:** 빌드 도구 없는 순수 정적 HTML/CSS/JS. 공용 헤더/푸터는 `js/common.js`가 삽입. 콘텐츠 확장은 `play/` 폴더에 HTML 추가 + 메인에 카드 추가 방식.

**Tech Stack:** HTML5, CSS3(변수 기반 팔레트), Vanilla JS, Google Fonts(Jua), GitHub Pages.

**검증 방식:** 정적 사이트이므로 단위 테스트 대신 로컬 정적 서버 + 브라우저 확인이 각 태스크의 "테스트"다. 서버 실행: 저장소 루트에서 `python -m http.server 8777` (또는 Claude Preview 도구).

---

### Task 1: 프로젝트 뼈대 — 공용 스타일과 공용 스크립트

**Files:**
- Create: `.gitignore`
- Create: `css/style.css`
- Create: `js/common.js`

- [ ] **Step 1: `.gitignore` 작성**

```gitignore
Thumbs.db
Desktop.ini
*.log
```

- [ ] **Step 2: `css/style.css` 작성**

```css
/* goblub 공용 스타일 */
:root {
  --coral: #ff6b6b;
  --yellow: #ffd93d;
  --mint: #6bcb77;
  --sky: #4d96ff;
  --purple: #b983ff;
  --cream: #fff9ec;
  --ink: #38352f;
  --ink-soft: #7a766d;
  --card-radius: 22px;
  --shadow: 0 6px 18px rgba(56, 53, 47, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--cream);
  color: var(--ink);
  font-family: "Jua", "Malgun Gothic", sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: inherit;
  text-decoration: none;
}

/* 헤더 */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}

.logo {
  font-size: 1.9rem;
  letter-spacing: 1px;
}

.logo .l1 { color: var(--coral); }
.logo .l2 { color: var(--yellow); }
.logo .l3 { color: var(--mint); }
.logo .l4 { color: var(--sky); }
.logo .l5 { color: var(--purple); }
.logo .l6 { color: var(--coral); }

.site-nav a {
  margin-left: 18px;
  font-size: 1.05rem;
  color: var(--ink-soft);
}

.site-nav a:hover {
  color: var(--ink);
}

/* 본문 공통 */
main {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 16px 24px 48px;
}

.hero {
  text-align: center;
  padding: 36px 0 28px;
}

.hero h1 {
  font-size: 2.4rem;
  margin-bottom: 10px;
}

.hero p {
  color: var(--ink-soft);
  font-size: 1.15rem;
}

/* 카드 그리드 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.card {
  border-radius: var(--card-radius);
  padding: 28px 22px;
  box-shadow: var(--shadow);
  background: #fff;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

a.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(56, 53, 47, 0.16);
}

.card .icon {
  font-size: 2.6rem;
  display: block;
  margin-bottom: 12px;
}

.card h2 {
  font-size: 1.3rem;
  margin-bottom: 6px;
}

.card p {
  color: var(--ink-soft);
  font-size: 0.98rem;
  line-height: 1.45;
}

.card.tint-coral { background: #ffe3e3; }
.card.tint-yellow { background: #fff3c4; }
.card.tint-mint { background: #dcf5e1; }
.card.tint-sky { background: #dfeaff; }
.card.tint-purple { background: #efe2ff; }

/* 준비 중 카드 */
.card.soon {
  opacity: 0.65;
  cursor: default;
}

.badge-soon {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--ink);
  color: #fff;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
}

/* 앱 카드 */
.app-card {
  display: flex;
  gap: 18px;
  align-items: center;
  background: #fff;
  border-radius: var(--card-radius);
  padding: 22px;
  box-shadow: var(--shadow);
  margin-bottom: 18px;
}

.app-card .app-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
}

.app-card .app-info {
  flex: 1;
}

.app-card h2 {
  font-size: 1.25rem;
  margin-bottom: 4px;
}

.app-card p {
  color: var(--ink-soft);
  font-size: 0.95rem;
}

.btn-download {
  background: var(--sky);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-download:disabled {
  background: #cfccc4;
  cursor: default;
}

/* 푸터 */
.site-footer {
  text-align: center;
  padding: 22px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}

/* 모바일 */
@media (max-width: 480px) {
  .hero h1 { font-size: 1.9rem; }
  .site-header { padding: 14px 16px; }
  main { padding: 8px 16px 40px; }
  .app-card { flex-wrap: wrap; }
}
```

- [ ] **Step 3: `js/common.js` 작성**

각 페이지는 `<script src="js/common.js" data-root="."></script>`처럼 로드한다. `data-root`는 저장소 루트까지의 상대 경로(루트 페이지는 `.`, `play/` 하위 페이지는 `..`).

```js
// goblub 공용 헤더/푸터 삽입
(function () {
  var root = (document.currentScript && document.currentScript.dataset.root) || ".";

  var headerHTML =
    '<header class="site-header">' +
    '<a class="logo" href="' + root + '/index.html">' +
    '<span class="l1">g</span><span class="l2">o</span><span class="l3">b</span>' +
    '<span class="l4">l</span><span class="l5">u</span><span class="l6">b</span>' +
    "</a>" +
    '<nav class="site-nav">' +
    '<a href="' + root + '/index.html">홈</a>' +
    '<a href="' + root + '/apps.html">앱</a>' +
    "</nav>" +
    "</header>";

  var footerHTML =
    '<footer class="site-footer">© 2026 goblub · 재미로 즐겨주세요!</footer>';

  document.addEventListener("DOMContentLoaded", function () {
    var h = document.getElementById("site-header");
    var f = document.getElementById("site-footer");
    if (h) h.outerHTML = headerHTML;
    if (f) f.outerHTML = footerHTML;
  });
})();
```

- [ ] **Step 4: 커밋**

```bash
git add .gitignore css/style.css js/common.js
git commit -m "feat: 공용 스타일·헤더/푸터 스크립트"
```

---

### Task 2: 메인 페이지 (index.html)

**Files:**
- Create: `index.html`

- [ ] **Step 1: `index.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>goblub — 즐길거리 놀이터</title>
  <meta name="description" content="사주, 심리테스트, 앱까지 — 와서 놀다 가는 곳 goblub" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="site-header"></div>

  <main>
    <section class="hero">
      <h1>🎡 와서 놀다 가세요!</h1>
      <p>사주도 보고, 심리테스트도 하고, 쓸만한 앱도 받아 가는 곳</p>
    </section>

    <section class="card-grid">
      <a class="card tint-sky" href="apps.html">
        <span class="icon">📱</span>
        <h2>앱 다운로드</h2>
        <p>직접 만든 모바일 앱들을 소개하고 다운로드 링크를 모아둔 곳</p>
      </a>

      <div class="card tint-purple soon">
        <span class="badge-soon">준비 중</span>
        <span class="icon">🔮</span>
        <h2>사주</h2>
        <p>생년월일로 보는 나의 사주팔자 — 곧 찾아옵니다</p>
      </div>

      <div class="card tint-yellow soon">
        <span class="badge-soon">준비 중</span>
        <span class="icon">🧠</span>
        <h2>심리테스트</h2>
        <p>나도 몰랐던 내 성격 — 곧 찾아옵니다</p>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="js/common.js" data-root="."></script>
</body>
</html>
```

- [ ] **Step 2: 브라우저 검증**

로컬 서버 실행 후 `http://localhost:8777/index.html` 접속.

확인 항목:
- 헤더에 알록달록 goblub 로고와 "홈 / 앱" 내비게이션 표시
- 카드 3개: 앱 다운로드(클릭 가능), 사주·심리테스트(준비 중 배지, 반투명)
- 푸터 문구 표시
- "앱 다운로드" 카드 클릭 시 `apps.html`로 이동(다음 태스크 전이면 404가 정상)

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "feat: 메인 페이지(콘텐츠 카드 그리드)"
```

---

### Task 3: 앱 다운로드 페이지 (apps.html)

**Files:**
- Create: `apps.html`

- [ ] **Step 1: `apps.html` 작성**

앱 카드 3개는 틀(placeholder)이다. 실제 이름·설명·링크는 추후 사용자가 제공하면 채운다. 버튼은 `disabled` 상태로 시작.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>앱 다운로드 — goblub</title>
  <meta name="description" content="goblub이 만든 모바일 앱 모음과 다운로드 링크" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="site-header"></div>

  <main>
    <section class="hero">
      <h1>📱 앱 다운로드</h1>
      <p>직접 만든 앱들이에요. 다운로드 버튼은 곧 열립니다!</p>
    </section>

    <section class="app-list">
      <article class="app-card">
        <div class="app-icon card tint-coral" style="padding:0; box-shadow:none;">💰</div>
        <div class="app-info">
          <h2>가계부 앱</h2>
          <p>간단하게 쓰는 안드로이드 가계부</p>
        </div>
        <button class="btn-download" disabled>준비 중</button>
      </article>

      <article class="app-card">
        <div class="app-icon card tint-mint" style="padding:0; box-shadow:none;">✈️</div>
        <div class="app-info">
          <h2>Moment Trip</h2>
          <p>여행의 순간을 기록하는 앱</p>
        </div>
        <button class="btn-download" disabled>준비 중</button>
      </article>

      <article class="app-card">
        <div class="app-icon card tint-sky" style="padding:0; box-shadow:none;">🌡️</div>
        <div class="app-info">
          <h2>마음온도</h2>
          <p>오늘 내 마음의 온도를 재보는 자가성찰 웹앱</p>
        </div>
        <button class="btn-download" disabled>준비 중</button>
      </article>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="js/common.js" data-root="."></script>
</body>
</html>
```

- [ ] **Step 2: 브라우저 검증**

`http://localhost:8777/apps.html` 접속.

확인 항목:
- 앱 카드 3개(아이콘·이름·소개·"준비 중" 비활성 버튼)
- 헤더 "홈" 클릭 → 메인으로 이동, 메인의 "앱 다운로드" 카드 클릭 → 다시 앱 페이지
- 버튼이 회색 비활성 상태

- [ ] **Step 3: 커밋**

```bash
git add apps.html
git commit -m "feat: 앱 다운로드 페이지(앱 카드 틀)"
```

---

### Task 4: 반응형(모바일) 검증

**Files:**
- Modify: (검증 중 발견된 문제 있는 파일만)

- [ ] **Step 1: 모바일 뷰포트(375×812)로 두 페이지 확인**

확인 항목:
- 카드 그리드가 1열로 쌓임
- 헤더 로고·내비가 한 줄에 들어가고 깨지지 않음
- 앱 카드가 좁은 화면에서 줄바꿈되어도 버튼이 잘리지 않음
- 가로 스크롤이 생기지 않음

- [ ] **Step 2: 문제가 있으면 `css/style.css`의 `@media (max-width: 480px)` 블록에서 수정 후 재확인**

- [ ] **Step 3: 수정이 있었으면 커밋**

```bash
git add css/style.css
git commit -m "fix: 모바일 레이아웃 보정"
```

---

### Task 5: GitHub Pages 배포

**Files:** 없음 (저장소 설정 작업)

⚠️ 원격 푸시 전 반드시 사용자에게 확인받는다 (사용자 원칙: 푸시는 명시 요청/확인 시에만).

- [ ] **Step 1: 사용자에게 배포 확인** — GitHub에 `goblub` 공개 저장소를 만들어 푸시해도 되는지 확인

- [ ] **Step 2: GitHub 저장소 생성 및 푸시**

```bash
gh repo create goblub --public --source . --push
```

- [ ] **Step 3: GitHub Pages 활성화**

```bash
gh api repos/{owner}/goblub/pages -X POST -f "source[branch]=master" -f "source[path]=/"
```

- [ ] **Step 4: 배포 확인**

1~2분 후 `https://<계정>.github.io/goblub/` 접속, 메인·앱 페이지가 뜨는지 확인.

Expected: 두 페이지 정상 렌더링, 폰트·스타일 적용.
