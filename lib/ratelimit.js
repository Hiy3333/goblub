// AI 엔드포인트 공용 가드 — 서버측 레이트리밋 + 일일 사용량 계량.
//
// 왜 필요한가: 클라이언트 쿨다운(localStorage)은 브라우저 안에만 있어서
// curl·시크릿 창·봇이면 그냥 우회된다. Gemini 호출 전에 서버가 IP별 횟수를
// 세서 한도를 넘으면 429로 거절한다. 저장소는 이미 붙어 있는 Upstash KV.
//
// 한도(환경변수로 조절):
//   AI_RL_PER_MIN  — IP당 분당 허용 횟수 (기본 12 — 명부 8장 연속 생성을 감안)
//   AI_RL_PER_DAY  — IP당 하루 허용 횟수, 전 AI 기능 합산 (기본 80)
//
// KV가 없거나(로컬 개발) KV 장애면 제한 없이 통과(fail-open) —
// 레이트리밋 때문에 서비스 전체가 죽는 일은 없게 한다.
//
// 사용량 계량: 허용된 호출만 aiuse:{KST일자}:{기능이름} / :_total 에 적재(40일 보관),
// 거절된 횟수는 :_denied 에 따로 적재 — admin의 "ai" 액션에서 조회한다.
import { kvPipe, kvConfigured } from "./kv.js";

const MIN_LIMIT = +(process.env.AI_RL_PER_MIN || 12);
const DAY_LIMIT = +(process.env.AI_RL_PER_DAY || 80);

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (typeof xf === "string" && xf.split(",")[0].trim()) ||
    req.headers["x-real-ip"] ||
    (req.socket && req.socket.remoteAddress) ||
    "unknown";
  return String(ip).slice(0, 64);
}

function kstDay() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
}

// 허용이면 true. 한도 초과면 429 응답을 이미 보내고 false를 반환한다.
// 호출부: if (!(await aiGuard(req, res, "gunghap"))) return;
export async function aiGuard(req, res, name) {
  if (!kvConfigured()) return true;
  const day = kstDay();
  try {
    const ip = clientIp(req);
    const minute = Math.floor(Date.now() / 60000);
    const mKey = `airl:m:${ip}:${minute}`;
    const dKey = `airl:d:${ip}:${day}`;
    const r = await kvPipe([
      ["INCR", mKey], ["EXPIRE", mKey, 120],
      ["INCR", dKey], ["EXPIRE", dKey, 172800],
    ]);
    const perMin = +r[0] || 0;
    const perDay = +r[2] || 0;
    if (perMin > MIN_LIMIT || perDay > DAY_LIMIT) {
      const deniedKey = `aiuse:${day}:_denied`;
      kvPipe([["INCR", deniedKey], ["EXPIRE", deniedKey, 3456000]]).catch(() => {});
      res.status(429).json({
        error: "rate_limited",
        retry: perMin > MIN_LIMIT ? 60 : 3600,
      });
      return false;
    }
    // 허용된 호출만 계량 (Gemini 실제 호출 수 ≈ 비용 추적용)
    const uKey = `aiuse:${day}:${name}`;
    const tKey = `aiuse:${day}:_total`;
    kvPipe([
      ["INCR", uKey], ["EXPIRE", uKey, 3456000],
      ["INCR", tKey], ["EXPIRE", tKey, 3456000],
    ]).catch(() => {});
    return true;
  } catch {
    return true; // KV 장애가 서비스 장애로 번지지 않게
  }
}
