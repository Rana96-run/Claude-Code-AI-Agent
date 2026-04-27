import { Router } from "express";

const router = Router();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const MAX_PROMPT_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 8192;

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

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Number(max_tokens) || 1400, MAX_OUTPUT_TOKENS),
        system,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errData = (await anthropicRes.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      res.status(anthropicRes.status).json({
        error: errData?.error?.message || `Anthropic API error ${anthropicRes.status}`,
      });
      return;
    }

    const data = (await anthropicRes.json()) as {
      content?: Array<{ text?: string }>;
      [key: string]: unknown;
    };

    // When using json_mode, the prefilled "{" is not included in the response —
    // prepend it so the client receives a complete JSON object string.
    if (json_mode && data.content?.[0]?.text !== undefined) {
      data.content[0].text = "{" + data.content[0].text;
    }

    res.status(200).json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[generate] error", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

export default router;
