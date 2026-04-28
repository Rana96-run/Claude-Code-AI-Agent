import { Router } from "express";
import { createHash } from "crypto";

const router = Router();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_PROMPT_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 8192;
const ANTHROPIC_TIMEOUT_MS = 120_000;
const GEMINI_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 3;

// ─── A) Multi-provider fallback ────────────────────────────────────────────
// Tries Anthropic with retries; falls back to Gemini on terminal failure.
// Both providers return responses in Anthropic's content[].text shape.
//
// ─── B) Request deduplication ──────────────────────────────────────────────
// In-memory cache: same (system + user + max_tokens + json_mode) within 30s
// returns the cached response. Prevents accidental double-clicks from spending
// tokens twice. Cache is per-process (resets on Railway redeploy).
//
// ─── C) Health probe ───────────────────────────────────────────────────────
// /api/ai-health endpoint pings Anthropic with a 1-token request. Used by the
// client to show a degraded-mode banner if Anthropic is unreachable.

type Resp = { ok: true; data: any; provider: "anthropic" | "gemini" } | { ok: false; status: number | null; error: string };

// ─── Retry helpers ──────────────────────────────────────────────────────────

function shouldRetry(status: number | null, attempt: number): boolean {
  if (attempt >= MAX_RETRIES) return false;
  if (status === null) return true;
  if (status === 429 || status === 529) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function backoffMs(attempt: number): number {
  return 800 * Math.pow(2, attempt) + Math.random() * 400;
}

// ─── Anthropic call with retry ──────────────────────────────────────────────

async function callAnthropic(apiKey: string, body: object): Promise<Resp> {
  let lastError = "Unknown error";
  let lastStatus: number | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { ok: true, data, provider: "anthropic" };
      }

      lastStatus = res.status;
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      lastError = errBody?.error?.message || `Anthropic API error ${res.status}`;

      if (!shouldRetry(res.status, attempt)) return { ok: false, status: res.status, error: lastError };
      // eslint-disable-next-line no-console
      console.warn(`[anthropic] retry ${attempt + 1}/${MAX_RETRIES} after ${res.status}: ${lastError}`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastStatus = null;
      lastError = err instanceof Error ? err.message : String(err);
      if (!shouldRetry(null, attempt)) return { ok: false, status: null, error: lastError };
      // eslint-disable-next-line no-console
      console.warn(`[anthropic] retry ${attempt + 1}/${MAX_RETRIES} after network: ${lastError}`);
    }

    if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, backoffMs(attempt)));
  }

  return { ok: false, status: lastStatus, error: lastError };
}

// ─── Gemini fallback (single attempt, no retry — already a fallback) ────────

async function callGemini(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<Resp> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body: any = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: Math.min(maxTokens, MAX_OUTPUT_TOKENS),
      temperature: 0.7,
    },
  };
  if (jsonMode) body.generationConfig.responseMimeType = "application/json";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return { ok: false, status: res.status, error: errBody?.error?.message || `Gemini error ${res.status}` };
    }

    const gem = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = gem.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!text) return { ok: false, status: 502, error: "Gemini returned empty response" };

    // Reshape to Anthropic format so client doesn't need to care which provider
    return {
      ok: true,
      data: { content: [{ type: "text", text }], model: GEMINI_MODEL, fallback: true },
      provider: "gemini",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: null, error: msg };
  }
}

// ─── Provider chain: Anthropic → Gemini ─────────────────────────────────────

async function generateWithFallback(
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<Resp> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) {
    const messages: Array<{ role: string; content: string }> = [
      { role: "user", content: user },
      ...(jsonMode ? [{ role: "assistant", content: "{" }] : []),
    ];

    const result = await callAnthropic(anthropicKey, {
      model: MODEL,
      max_tokens: Math.min(maxTokens, MAX_OUTPUT_TOKENS),
      system,
      messages,
    });

    if (result.ok) {
      // Re-prepend the "{" prefill that the assistant turn ate
      if (jsonMode && result.data.content?.[0]?.text !== undefined) {
        result.data.content[0].text = "{" + result.data.content[0].text;
      }
      return result;
    }

    // eslint-disable-next-line no-console
    console.warn(`[generate] Anthropic exhausted, falling back to Gemini: ${result.error}`);
  }

  if (geminiKey) {
    const result = await callGemini(geminiKey, system, user, maxTokens, jsonMode);
    if (result.ok) return result;

    // eslint-disable-next-line no-console
    console.error(`[generate] Gemini fallback also failed: ${result.error}`);
    return result;
  }

  return {
    ok: false,
    status: 500,
    error: anthropicKey ? "Both Anthropic and Gemini failed" : "No AI provider configured (ANTHROPIC_API_KEY or GEMINI_API_KEY)",
  };
}

// ─── Dedup cache ────────────────────────────────────────────────────────────

const DEDUP_TTL_MS = 30_000;
const dedupCache = new Map<string, { ts: number; resp: any }>();

function cacheKey(system: string, user: string, max_tokens: number, json_mode: boolean): string {
  return createHash("sha256")
    .update(`${system} ${user} ${max_tokens} ${json_mode}`)
    .digest("hex");
}

function pruneCache() {
  const now = Date.now();
  for (const [k, v] of dedupCache) {
    if (now - v.ts > DEDUP_TTL_MS) dedupCache.delete(k);
  }
}

// ─── Main route ─────────────────────────────────────────────────────────────

router.post("/generate", async (req, res) => {
  const { system, user, max_tokens = 1400, json_mode = false } = req.body ?? {};

  if (!system || !user) {
    res.status(400).json({ error: "Missing system or user prompt" });
    return;
  }

  const totalLength = String(system).length + String(user).length;
  if (totalLength > MAX_PROMPT_CHARS) {
    res.status(400).json({ error: `Prompt too long (${totalLength} chars > ${MAX_PROMPT_CHARS})` });
    return;
  }

  const tokens = Math.min(Number(max_tokens) || 1400, MAX_OUTPUT_TOKENS);
  const jm = Boolean(json_mode);

  // Dedup: same request within 30s returns cached response
  pruneCache();
  const key = cacheKey(String(system), String(user), tokens, jm);
  const cached = dedupCache.get(key);
  if (cached && Date.now() - cached.ts < DEDUP_TTL_MS) {
    res.set("X-Cache", "HIT");
    res.status(200).json(cached.resp);
    return;
  }

  const result = await generateWithFallback(String(system), String(user), tokens, jm);

  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error("[generate] failed", { status: result.status, error: result.error });
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    res.status(status).json({ error: result.error });
    return;
  }

  // Stamp the provider so the client can show a "fallback active" hint if it wants
  if (result.provider === "gemini") result.data.provider = "gemini";

  dedupCache.set(key, { ts: Date.now(), resp: result.data });
  res.set("X-Cache", "MISS");
  res.set("X-Provider", result.provider);
  res.status(200).json(result.data);
});

// ─── Health probe ───────────────────────────────────────────────────────────

router.get("/ai-health", async (_req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(200).json({ ok: false, provider: "none", error: "No ANTHROPIC_API_KEY", fallback_available: !!process.env.GEMINI_API_KEY });
    return;
  }

  const t0 = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 5,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - t0;

    if (r.ok) {
      res.status(200).json({ ok: true, provider: "anthropic", latency_ms: latency, fallback_available: !!process.env.GEMINI_API_KEY });
      return;
    }

    res.status(200).json({
      ok: false,
      provider: "anthropic",
      status: r.status,
      latency_ms: latency,
      degraded: true,
      fallback_available: !!process.env.GEMINI_API_KEY,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    res.status(200).json({
      ok: false,
      provider: "anthropic",
      error: err instanceof Error ? err.message : String(err),
      degraded: true,
      fallback_available: !!process.env.GEMINI_API_KEY,
    });
  }
});

export default router;
