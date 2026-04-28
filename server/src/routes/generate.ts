import { Router } from "express";

const router = Router();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const MAX_PROMPT_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 8192;
const ANTHROPIC_TIMEOUT_MS = 120_000; // 2 min hard cap on a single API call
const MAX_RETRIES = 3;                // total attempts = MAX_RETRIES + 1

// Retry on transient failures: 429 (rate limit), 529 (overloaded), 5xx, network errors.
// Use exponential backoff with jitter.
function shouldRetry(status: number | null, attempt: number): boolean {
  if (attempt >= MAX_RETRIES) return false;
  if (status === null) return true;             // network error / timeout
  if (status === 429 || status === 529) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function backoffMs(attempt: number): number {
  const base = 800 * Math.pow(2, attempt);      // 800, 1600, 3200ms
  const jitter = Math.random() * 400;
  return base + jitter;
}

async function callAnthropicWithRetry(
  apiKey: string,
  body: object,
): Promise<{ ok: true; data: any } | { ok: false; status: number | null; error: string }> {
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
        return { ok: true, data };
      }

      lastStatus = res.status;
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      lastError = errBody?.error?.message || `Anthropic API error ${res.status}`;

      if (!shouldRetry(res.status, attempt)) {
        return { ok: false, status: res.status, error: lastError };
      }

      // eslint-disable-next-line no-console
      console.warn(`[generate] retry ${attempt + 1}/${MAX_RETRIES} after ${res.status}: ${lastError}`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastStatus = null;
      lastError = err instanceof Error ? err.message : String(err);

      if (!shouldRetry(null, attempt)) {
        return { ok: false, status: null, error: lastError };
      }

      // eslint-disable-next-line no-console
      console.warn(`[generate] retry ${attempt + 1}/${MAX_RETRIES} after network error: ${lastError}`);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, backoffMs(attempt)));
    }
  }

  return { ok: false, status: lastStatus, error: lastError };
}

router.post("/generate", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY not set" });
    return;
  }

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

  // json_mode: prefill the assistant turn with "{" so Claude is forced
  // to emit a JSON object from character 1 — eliminates "Here is the JSON:"
  // preamble and prevents partial-JSON truncation patterns.
  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: String(user) },
    ...(json_mode ? [{ role: "assistant", content: "{" }] : []),
  ];

  const body = {
    model: MODEL,
    max_tokens: Math.min(Number(max_tokens) || 1400, MAX_OUTPUT_TOKENS),
    system,
    messages,
  };

  const result = await callAnthropicWithRetry(apiKey, body);

  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error("[generate] failed after retries", { status: result.status, error: result.error });
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    res.status(status).json({ error: result.error });
    return;
  }

  const data = result.data as {
    content?: Array<{ text?: string }>;
    [key: string]: unknown;
  };

  // When using json_mode, the prefilled "{" is not included in the response —
  // prepend it so the client receives a complete JSON object string.
  if (json_mode && data.content?.[0]?.text !== undefined) {
    data.content[0].text = "{" + data.content[0].text;
  }

  res.status(200).json(data);
});

export default router;
