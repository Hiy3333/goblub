// 유료 별 서버 원장 — 잔액의 진실은 서버(KV)에만 있다.
//
// 놀이 별(feed.js, localStorage 적립)와 완전히 분리된 별도 재화다.
// 잔액은 JSON 회원 레코드가 아니라 숫자 키 pg:{sub} 에 보관한다 —
// INCRBY/DECRBY 가 원자적이라 동시 요청(이중 클릭)에도 이중 차감·초과 차감이 없다.
//
// 키 구조:
//   pg:{sub}              유료 별 잔액 (정수)
//   sales:idx             매출이 발생한 콘텐츠 이름 집합
//   sales:cnt:{content}   콘텐츠별 누적 사용 횟수
//   sales:gems:{content}  콘텐츠별 누적 사용 별
//   sales:day:{yyyymmdd}  일자별 사용 별 (40일 보관 — 추후 그래프용)
//   pev                   유료 별 감사 로그 (최근 1000건)
import { kv, kvPipe } from "./kv.js";

function kstDay() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
}

export async function paidBalance(sub) {
  return +(await kv("GET", "pg:" + sub)) || 0;
}

// 지급(양수)/회수(음수). 회수로 잔액이 음수가 되면 0으로 되돌리고 실제 변화량을 반환.
export async function adjustPaidGems(sub, n, memo) {
  let bal = +(await kv("INCRBY", "pg:" + sub, n));
  let applied = n;
  if (bal < 0) {                       // 잔액보다 큰 회수 → 0으로 바닥 고정
    applied = n - bal;                 // (bal<0 이므로 실제로는 |bal|만큼 덜 회수됨)
    await kv("SET", "pg:" + sub, 0);
    bal = 0;
  }
  kvPipe([
    ["LPUSH", "pev", JSON.stringify({ t: "adjust", sub, n: applied, memo: memo || "", at: Date.now() })],
    ["LTRIM", "pev", 0, 999],
  ]).catch(() => {});
  return { balance: bal, applied };
}

// 유료 콘텐츠 차감 — 유료화 API 가 Gemini 호출 전에 부른다.
// 성공: { ok:true, balance } / 잔액 부족: { ok:false, balance } (차감 없음)
export async function spendPaidGems(sub, n, content) {
  const bal = +(await kv("DECRBY", "pg:" + sub, n));
  if (bal < 0) {                       // 부족 → 원복
    await kv("INCRBY", "pg:" + sub, n);
    return { ok: false, balance: bal + n };
  }
  const day = kstDay();
  kvPipe([
    ["SADD", "sales:idx", content],
    ["INCR", "sales:cnt:" + content],
    ["INCRBY", "sales:gems:" + content, n],
    ["INCRBY", "sales:day:" + day, n],
    ["EXPIRE", "sales:day:" + day, 3456000],
    ["LPUSH", "pev", JSON.stringify({ t: "spend", sub, n, content, at: Date.now() })],
    ["LTRIM", "pev", 0, 999],
  ]).catch(() => {});
  return { ok: true, balance: bal };
}
