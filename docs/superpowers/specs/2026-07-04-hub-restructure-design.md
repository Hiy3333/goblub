# 허브 개편 + 타로 설계·계획 (통합 문서)

날짜: 2026-07-04 / 상태: 승인됨(대화로 합의)

## 메인 구조 (12칸 → 6칸)

🔮 운세(허브, tint-purple) / 🧪 대환장 테스트(허브, tint-mint) / 👾 고블럽 키우기(tint-coral) / ⚡ 결정의 신(tint-yellow) / ⚖️ 밸런스 게임(tint-sky) / 📱 앱(tint-sky). "새 즐길거리" 빈 슬롯 제거(신규는 허브 안으로).

## 공유 프로필 (`play/js/profile.js`)

- `GoblubProfile.get()/set(p)` — localStorage `goblub_birth` 확장: `{y,m,d,hour,min,gender}` (기존 필드 호환, gender는 ""|"M"|"F")
- 운세 허브에서 입력·수정. saju.html은 계산 시 프로필 자동 저장 + 진입 시 프리필(성별 라디오 포함). gunghap(나)·pastlife는 기존 프리필 유지.

## 운세 허브 = `play/fortune.html` 개편 (URL 유지)

- 히어로: "🔮 운세 — 내 사주 하나로 전부"
- 상단 프로필 존: 미입력 시 입력 폼(년월일+시+성별 선택) / 입력 시 요약 배지("乙巳일주 · 돼지띠" + 신강약) + [수정]
- 프로필 있으면 기존 운세 4카드(총운·연애·재물·이번달) 즉시 표시(현행 로직 유지)
- 하단 타일 메뉴(카드 그리드 재사용): 🔮 사주팔자 심층(saju) / 💑 우리 궁합(gunghap) / 🃏 타로(tarot, 신규) / 📅 오늘의 사주(today) / 🌀 전생 대환장 파티(pastlife)

## 테스트 허브 = `play/tests.html` (신규, 단순 메뉴)

타일 4개: 🍞 대환장 MBTI / 💘 연애 스타일 / 🔥 스트레스 유형 / 🌈 스펙트럼 찾기 (+한 줄 설명)

## 타로 = `play/tarot.html` (신규, API 불필요)

- 데이터: 메이저 아르카나 22장 {name, en, emoji, up(정방향 1~2문장), rev(역방향 1~2문장)} 페이지 내장
- **오늘의 타로 1장**: 하루 1장 고정(localStorage `goblub_tarot_YYYYMMDD`에 {card, reversed} 저장, 재방문 시 같은 카드). 카드 뒤집기 애니메이션(rotateY)
- **3장 스프레드**: 질문 입력(선택) → 셔플 → 과거/현재/미래 3장, 클릭으로 한 장씩 공개. 매번 랜덤
- 역방향 확률 30%. 포지션 라벨과 함께 해석 표시. 하단 "타로는 재미로" 문구
- feed.js SOURCES에 tarot 추가(🃏 오늘의 타로), 오늘의 타로 공개 시 grant("tarot")

## index.html

콘텐츠 개별 카드 제거 → 위 6칸으로 교체.

## 검증

- 프로필: 허브에서 저장 → saju/gunghap/pastlife 프리필 반영, gender 저장·수정
- 허브: 프로필 없으면 폼, 있으면 요약+운세 4카드 즉시
- 타로: 오늘 1장 재방문 동일 카드, 3장 스프레드 공개 플로우, 역방향 표기
- tests.html 링크 4개, index 6칸, 모바일 375px, 배포 후 신규/개편 페이지 200
