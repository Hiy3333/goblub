// Gemini 스트리밍 헬퍼 — 의존성 없이 fetch 사용.
// 클라이언트(dosa.js)는 "순수 텍스트 스트림"을 기대하므로,
// Gemini의 SSE(JSON 청크)를 파싱해 텍스트 조각만 res.write 한다.
//
// 환경변수:
//   GEMINI_API_KEY  — 필수 (Google AI Studio 발급 키)
//   GEMINI_MODEL    — 선택, 기본 "gemini-2.5-flash" (가성비 모델). "gemini-2.5-flash-lite"(더 저렴)·"gemini-2.5-pro"(고품질) 등으로 교체 가능

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

function model(override) {
  // 전역 GEMINI_MODEL 이 있으면 최우선(비용/일괄 제어), 없으면 호출부 지정, 없으면 기본 flash.
  return process.env.GEMINI_MODEL || override || "gemini-2.5-flash";
}

// opts: { system, user, maxTokens=2000, temperature=0.85, model }
// 성공 시 텍스트를 스트리밍하고 true 반환. fetch 실패 등은 throw(헤더 전송 전이면 호출부에서 502 처리).
export async function streamGemini(res, opts) {
  const key = process.env.GEMINI_API_KEY;
  const url = `${ENDPOINT}/${model(opts.model)}:streamGenerateContent?alt=sse&key=${key}`;
  const payload = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens || 2000,
      temperature: opts.temperature == null ? 0.85 : opts.temperature,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok || !r.body) {
    const detail = await r.text().catch(() => "");
    throw new Error("gemini " + r.status + " " + detail.slice(0, 300));
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let wrote = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      let line = buf.slice(0, nl).replace(/\r$/, "");
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const obj = JSON.parse(json);
        const parts = obj && obj.candidates && obj.candidates[0] &&
          obj.candidates[0].content && obj.candidates[0].content.parts;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (p && typeof p.text === "string" && p.text) { res.write(p.text); wrote = true; }
          }
        }
      } catch (e) { /* 부분 청크 — 다음 read에서 이어붙음 */ }
    }
  }
  return wrote;
}
