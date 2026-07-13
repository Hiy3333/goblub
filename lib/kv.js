// Vercel KV(Upstash Redis) REST 헬퍼 — 의존성 없이 fetch 사용.
// 환경변수: KV_REST_API_URL, KV_REST_API_TOKEN (Vercel 대시보드 > Storage > Upstash 연동 시 자동 주입)

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

export function kvConfigured() {
  return !!(URL_ && TOKEN);
}

// 단일 명령: kv("SET", "key", "value") / kv("GET", "key") / kv("SADD", "s", "m") ...
export async function kv(...args) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.map(String)),
  });
  const j = await r.json();
  if (j.error) throw new Error("kv: " + j.error);
  return j.result;
}

// 파이프라인: kvPipe([["GET","a"],["GET","b"]]) → [resultA, resultB]
export async function kvPipe(cmds) {
  const r = await fetch(URL_ + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds.map((c) => c.map(String))),
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error("kv pipeline: " + JSON.stringify(j).slice(0, 200));
  return j.map((x) => x.result);
}

// 구글 ID 토큰 검증 — Google tokeninfo 엔드포인트 사용.
// 성공 시 { sub, email, name, picture } 반환, 실패 시 null.
export async function verifyGoogleToken(idToken) {
  if (!idToken || typeof idToken !== "string" || idToken.length > 4096) return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken));
    if (!r.ok) return null;
    const p = await r.json();
    if (!p.sub || p.email_verified !== "true") return null;
    // GOOGLE_CLIENT_ID 환경변수가 설정돼 있으면 우리 앱으로 발급된 토큰인지 확인
    if (process.env.GOOGLE_CLIENT_ID && p.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    return { sub: p.sub, email: p.email || "", name: p.name || "", picture: p.picture || "" };
  } catch {
    return null;
  }
}

export function isAdmin(email) {
  const list = (process.env.ADMIN_EMAILS || "billhaho@gmail.com")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}
