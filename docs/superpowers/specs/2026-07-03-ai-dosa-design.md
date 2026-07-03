# 고블럽 도사 — AI 심층 사주 풀이 설계

날짜: 2026-07-03
상태: 승인됨

## 목적

사주 결과 화면에서 버튼 한 번으로, 우리 엔진이 계산한 사주 데이터를 근거로 한 개인화 장문 풀이를 AI(Claude)가 스트리밍으로 생성한다. 원칙: **계산은 엔진(정확), 해석은 AI(풍부), 키는 서버에만.**

## 결정 사항

| 항목 | 결정 |
|------|------|
| AI | Claude API, 모델 `claude-opus-4-8` |
| 서버 | Vercel Node.js Function `api/saju-reading.js` (@anthropic-ai/sdk) |
| 키 | Vercel 환경변수 `ANTHROPIC_API_KEY` (사용자가 대시보드에서 등록, 코드/저장소에 절대 미포함) |
| 응답 | 스트리밍(텍스트 청크 패스스루) — 클라이언트는 fetch reader로 실시간 표시 |
| CORS | `https://goblub.vercel.app`, `https://hiy3333.github.io`, `http://localhost:8777` |
| 캐시 | 클라이언트 localStorage, 입력 해시 키(`goblub_dosa_<hash>`). 동일 사주 재요청 없음 |
| 쿨다운 | 클라이언트 60초(localStorage 타임스탬프) |
| 비용 상한 | `max_tokens: 2000` 서버 고정. 시스템 프롬프트는 `cache_control`로 프롬프트 캐싱 |
| 미등록 상태 | 함수가 키 없음을 감지하면 501 + 안내 메시지, 버튼은 "도사님이 아직 수련 중이에요" 표시 |

## 데이터 흐름

```
saju.html (결과 표시 후)
  └─ [🧙 심층 풀이 버튼] → buildDosaPayload(r)   // 엔진 계산 결과를 구조화
       └─ POST https://goblub.vercel.app/api/saju-reading  { saju: {...} }
            └─ api/saju-reading.js
                 ├─ 검증(스키마·간지 범위) → 400 if invalid
                 ├─ ANTHROPIC_API_KEY 없음 → 501
                 ├─ Claude opus-4-8 스트리밍 호출 (system: 도사 페르소나+사실 규칙, user: 데이터 JSON)
                 └─ 텍스트 청크를 그대로 응답 스트림에 전달
       └─ reader로 읽어 실시간 렌더 → 완료 시 localStorage 캐시
```

## 페이로드 (buildDosaPayload)

엔진(`Saju.compute` 결과 `r`)에서 추출, 전부 한글 문자열로 변환해 전송(모델이 인덱스 해석할 여지 제거):

```json
{
  "birth": {"y":1995,"m":3,"d":15,"hour":14,"gender":"M","trueSolar":true},
  "zodiac": "돼지",
  "pillars": {
    "year":  {"ganji":"을해","gan":"을","ji":"해","ganSipseong":"비견","jiSipseong":"정인"},
    "month": {"ganji":"기묘", ... },
    "day":   {"ganji":"을사","gan":"을","ji":"사","ganSipseong":"나(일간)","jiSipseong":"상관"},
    "hour":  {...} | null
  },
  "ilgan": "을",
  "oheng": {"목":4.3,"화":1.3,"토":2.6,"금":0.5,"수":2.0},
  "strength": {"label":"신강","ratio":0.60},
  "topSipseong": "비견",
  "daeun": {"forward":false,"num":3,"list":[{"age":3,"ganji":"무인","sipseong":"정재"}, ...]} | null
}
```

## 시스템 프롬프트 (요지 — 구현 계획에 전문 수록)

- 페르소나: "고블럽 도사" — 나쁜 감정을 먹어주는 몬스터들의 스승. 따뜻하고 유머 있는 존댓말.
- 사실 규칙(정확성 핵심):
  1. 너는 사주를 계산하지 않는다. 아래 데이터가 유일한 사실이다.
  2. 데이터에 없는 간지·십성·오행 수치·대운을 언급하지 마라. 데이터에 있는 값을 바꿔 말하지 마라.
  3. 모든 해석 문장은 근거를 명시하라 (예: "월지 묘(卯)의 비견이 …").
  4. 불확실하거나 데이터로 뒷받침되지 않는 내용은 다루지 마라.
  5. 의료·법률·투자에 대한 단정적 조언 금지. 마지막에 "재미로 봐주세요" 성격의 한 줄.
- 출력 구조(고정 6섹션, 마크다운 헤딩 없이 이모지 소제목): 🔮 총평 / 🌱 성격과 기질 / 💰 재물과 일 / 💞 관계와 사랑 / 🚉 대운의 흐름 / 🧙 도사의 처방
- 분량: 700~1100자. 시주 없으면 시주 관련 언급 생략, 대운 없으면 대운 섹션을 "성별을 알려주면 대운도 봐드려요"로 대체.

## API 호출 형태

- `client.messages.stream({ model: "claude-opus-4-8", max_tokens: 2000, system: [{type:"text", text: SYSTEM, cache_control:{type:"ephemeral"}}], messages:[{role:"user", content: dataBlock}] })`
- `thinking` 미설정(빠른 응답), 샘플링 파라미터 미사용(4.8에서 미지원).
- 스트림의 text 델타를 그대로 클라이언트로 전달. `maxDuration: 300` 설정.

## 에러 처리

| 상황 | 서버 | 클라이언트 표시 |
|------|------|----------------|
| 키 미등록 | 501 `{error:"not_configured"}` | "도사님이 아직 수련 중이에요. 곧 찾아옵니다!" |
| 잘못된 페이로드 | 400 | "사주 데이터를 다시 계산해 주세요." |
| Claude 429/529/5xx | 502 `{error:"busy"}` | "도사님이 지금 손님이 많아요. 잠시 후 다시!" |
| refusal stop_reason | 스트림 종료 후 빈 결과면 안내 | "이 사주는 도사님이 말을 아끼시네요. 다시 시도해 주세요." |
| 쿨다운 중 | (요청 안 보냄) | "도사님이 숨 고르는 중… N초 후에 다시!" |

## 테스트/검증

1. 로컬: `vercel dev` + `vercel env pull`(키 등록 후) 또는 키 없이 501 경로 확인.
2. 정확성 검증: 1995-03-15 14:30 남 데이터로 실호출 → 응답에 등장하는 모든 간지·십성이 입력 데이터에 존재하는지 대조(스크립트로 응답 텍스트에서 간지 패턴 추출 검사).
3. CORS: github.io 오리진에서 호출 성공 확인(헤더 검사).
4. 캐시: 같은 입력 2회째는 네트워크 요청 없이 즉시 표시. 쿨다운 동작.
5. 키 미등록 상태의 UI 안내 확인(배포 직후).

## 향후 확장 (범위 아님)

- 일일 총량 제한(Vercel KV), 운세 페이지 AI 한 줄, 궁합 AI 리포트, 대화형 상담
