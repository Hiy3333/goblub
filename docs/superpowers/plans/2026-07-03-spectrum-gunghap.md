# 스펙트럼 찾기 + 우리 궁합 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. 스펙은 `2026-07-03-spectrum-gunghap-design.md` — 수치·규칙은 스펙이 기준.

**Goal:** 궁합 페이지(엔진 점수+부적 카드+AI 리포트)와 스펙트럼 자기탐색 테스트를 제작·검증·배포.

---

### Task 1: 궁합 엔진 + 페이지 (`play/js/gunghap.js`, `play/gunghap.html`, dosa.js 확장)

- [ ] **gunghap.js** — `window.Gunghap = { score(rA, rB), texts }`
  - 천간합: `(ganA - ganB + 10) % 10 === 5`
  - 오행 관계: `rel = (ohB - ohA + 5) % 5` → 0 비겁 / 1·4 상생 / 2·3 상극
  - 일지: 육합맵·충맵(운세와 동일 쌍), 삼합: `jiA % 4 === jiB % 4 && jiA !== jiB`
  - 점수: 일간 합30/생24/비겁18/극13, 일지 육합30/삼합26/평18/충8, 띠 육합15/삼합13/평10/충4
  - 오행 보완: 결핍 = 가중치<0.5. `n = A결핍 중 B가 1.0+ 보유 + B결핍 중 A가 1.0+ 보유`. 양쪽 다 결핍 없음→20, 아니면 `min(25, 13 + 4*n)`
  - 등급: 90+/75+/60+/45+/else → 천생연분·찰떡궁합·노력하면 꿀떡·서로 배우는 사이·파란만장 드라마
  - 항목별 고정 텍스트(합/생/비겁/극, 육합/삼합/평/충, 보완 n별, 띠 4종) + 등급 총평·조언 각 1~2문장 — 구현 시 작성(재미 톤, 근거 항목 명시)
- [ ] **dosa.js 확장** — 내부 fetch 로직을 `fetchStream(apiPath, body, cacheKey, cb)`로 추출, `fetchReading`(기존 시그니처 유지)과 `fetchGunghap(payload, cb)`(→ `/api/gunghap-reading`) 둘 다 이를 사용. 쿨다운 키 공유(`goblub_dosa_last`).
- [ ] **gunghap.html** — 두 사람 입력 폼(나: goblub_birth 프리필) → 결과(점수 게이지+등급+두 일주 한자+항목 풀이 4줄+조언) → 버튼: 🧧 부적 저장 / 🧙 도사의 궁합 리포트 / 다시하기
  - 부적 Canvas 720×1080: 바탕 #ffe9a8, 테두리 이중 사각 #d64545, 상단 "戀愛運上昇符"(세로 배치 글자), 중앙 두 일주 한자 + ❤️👾, 점수·등급, "휴대폰 배경화면으로 하면 연애운이 커진대요", goblub.vercel.app
  - AI 페이로드: `{gunghap: {a: Dosa.buildPayload(rA,...), b: Dosa.buildPayload(rB,...), score: {...}}}`

### Task 2: `api/gunghap-reading.js`

- saju-reading 구조 복제: CORS·OPTIONS·501·400·streaming·refusal 동일. 검증 = 사주 페이로드 검증기 ×2 + score 범위. `max_tokens: 1800`.
- 시스템 프롬프트: 도사 페르소나 + 사실 규칙 동일 + 출력 5섹션(💞 첫인상 케미 / 🔥 불붙는 지점 / 🌧 부딪히는 지점 / 🤝 화해 공식 / 🧙 도사의 연애 처방), 600~900자, 마지막 "궁합은 재미로, 사랑은 두 사람의 몫으로. — 고블럽 도사".

### Task 3: 스펙트럼 테스트 (`play/spectrum.html`)

- 단독 페이지(엔진 없음). 12문항 콘텐츠는 스펙 구조대로 구현 시 작성: 끌림 4(눈길·심쿵·캐릭터·상상), 로맨스 4(연애감정·사귐 상상·질투·미래 연인), 자기인식 4(확신도·변화 가능성·라벨관·예상 밖 설렘). 스코어 키 same/other/both/ace/fluid (both=same1+other1, 단독 2점, 자기인식 축은 fluid 0~2).
- 결과: `pos = same/(same+other)*100`(분모 0→에이스), 프로필 5구간 + 🌊 고요한 호수(ace≥6) + 보조 코멘트(ace 3~5, fluid≥5 "아직 그리는 중"). 무지개 바(linear-gradient) 위 마커. 용어 소개 문단 + "라벨은 도구일 뿐, 주인은 언제나 너야." + 지원단체 한 줄.
- **저장·공유 없음**: localStorage 미사용, 해시 미사용, 링크복사/짤 버튼 없음. 다시하기만.

### Task 4: 메인 카드 2개 + 검증 + 배포

- index: 💑 우리 궁합(tint-coral) MBTI 카드 뒤 / 🌈 스펙트럼 찾기(tint-purple) 그 뒤
- 검증: ① 궁합 — 갑(1984-02-05?) 대신 **일간 갑+기 조합**과 **일지 자+오 충 조합**을 콘솔로 직접 rA/rB 만들어 대조(일간 30, 일지 8) ② 부적 toBlob ③ AI 버튼 501 ④ 스펙트럼 — 전부 other→pos<20, 전부 same→pos>80, 전부 both→40~60, 전부 ace→고요한 호수, localStorage 키 0개 ⑤ 모바일 ⑥ push 후 실사이트 200
