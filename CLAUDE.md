# goblub 작업 규칙

## 배포
- `git push origin master` 하나로 GitHub Pages(hiy3333.github.io/goblub)와 Vercel(goblub-2.vercel.app) 양쪽에 배포된다.
- 배포 후에는 반드시 양쪽 호스트를 curl로 폴링해 실제 반영을 확인하고 사용자에게 Ctrl+F5를 안내한다.
- Vercel 서버리스 함수는 12개 한도. 함수 파일을 지울 땐 vercel.json의 functions 항목도 함께 지울 것(안 지우면 빌드 실패).

## "오류 체크해줘" = 아래 전 항목을 돌린다
사용자가 "오류 체크", "꼼꼼하게 봐줘", "전체 점검" 등으로 요청하면 고장 점검만 하지 말고 다음을 모두 수행한다:

1. **고장 점검** — 콘솔 에러, 화면 잘림/가로 넘침(375px·320px), 주요 플로우 동작(퀴즈 결과까지, 게임 플레이, 폼 제출).
2. **페이지 간 통일성 점검** — 홈(index.html)을 기준으로 허브 5곳(fortune-hub/tests/mini/mini2/apps)의 공통 요소를 diff 대조:
   - 행성 링 애니메이션 keyframes(밝기 맥동만, scale 금지), SAT 좌표 규격 `{x:1151, y:190, r:45, rx:78, ry:78}`
   - 헤더 알약·로고 크기, 카드 팔레트, gbPop 등장 애니
   - 한 방 점검: `grep -n "keyframes plRing\|var SAT" index.html apps.html play/*hub*.html play/tests.html play/mini*.html`
3. **문구 정합성** — 기능을 없애거나 바꿨을 때 옛 기능을 전제로 한 안내 문구가 남아있지 않은지 grep (예: 삭제된 적립·출석 언급).
4. **모바일 실기기 조건** — Browser pane 모바일 에뮬레이션은 innerWidth를 4배로 잘못 보고하므로, 보이는 375px iframe으로 재현해 검증한다.

## 배경 이미지 교체 규칙
- 허브 배경 속 행성은 공통 규격 좌표 (1151, 190), 반경 ~52px에 있어야 CLICK 링이 맞는다.
- 새 배경을 쓰기 전에 밝기 프로파일로 행성 중심·반경을 픽셀 실측해 규격 일치를 확인한다. 규격과 다른 그림은 쓰지 않거나 SAT를 실측값으로 조정한다.

## CSS 함정 (실제로 겪은 것)
- 허브 페이지 html에 background를 주면 body 배경색의 캔버스 전파가 끊겨 z-index:-1 행성 배경 레이어가 덮여 사라진다. html 배경 금지.
- body의 overflow:hidden만으로는 모바일 터치 팬이 안 막힌다. 홈은 body position:fixed로 잠근다.
- 홈 장면 좌표는 핀치줌에 흔들리지 않도록 window.innerWidth 대신 VW()/VH()(clientWidth) 헬퍼를 쓴다.

## 재화
- 이름은 "별"(⭐). 콘텐츠 플레이 적립은 폐지됨 — 획득은 운영자 지급·향후 충전만. 저장 키는 goblub_wallet(로컬)·pg:{sub}(서버) 그대로.
