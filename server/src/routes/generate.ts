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

  const { system, user, max_tokens = 1400 } = req.body ?? {};

  if (!system || !user) {
    res.status(400).json({ error: "Missing system or user prompt" });
    return;
  }

  const totalLength = String(system).length + String(user).length;
  if (totalLength > MAX_PROMPT_CHARS) {
    res.status(400).json({ error: `Prompt too long (${totalLength} chars > ${MAX_PROMPT_CHARS})` });
    return;
  }

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
        messages: [{ role: "user", content: user }],
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

    const data = await anthropicRes.json();
    res.status(200).json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[generate] error", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

export default router;
