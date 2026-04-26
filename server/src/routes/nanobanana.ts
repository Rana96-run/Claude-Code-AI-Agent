import { Router } from "express";

const router = Router();

/* Direct Gemini 2.5 Flash / Flash Image call — replaces the Replit Connectors SDK
   proxy so this runs standalone.
   Env: GEMINI_API_KEY  (required) */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

router.post("/generate", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }
    const {
      prompt,
      systemPrompt,
      model = "gemini-2.5-flash",
      maxTokens = 2000,
      temperature = 0.85,
    } = req.body ?? {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
      }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("").trim();
    const inlineImage =
      parts.find((p) => p.inlineData)?.inlineData ?? null; // { mimeType, data: base64 }

    res.json({ text, image: inlineImage });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: message });
  }
});

/* POST /api/nb/generate-image — dedicated Nano Banana (gemini-2.5-flash-image)
   flow that returns the base64 PNG inline. */
router.post("/generate-image", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    const { prompt, model = "gemini-2.5-flash-image", temperature = 0.9 } = req.body ?? {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const response = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature, responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!img?.data) return res.status(500).json({ error: "No image returned" });
    res.json({
      mimeType: img.mimeType,
      base64: img.data,
      dataUrl: `data:${img.mimeType};base64,${img.data}`,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/* POST /api/nb/generate-image-openai — DALL-E 3 / gpt-image-1 via OpenAI API
   Env: OPENAI_API_KEY (required) */
router.post("/generate-image-openai", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured — add it in Railway env vars" });

    const {
      prompt,
      model = "dall-e-3",
      size = "1024x1024",
      quality = "hd",
      style = "vivid",
    } = req.body ?? {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    // gpt-image-1 uses "standard"/"hd" quality; dall-e-3 uses "standard"/"hd"
    const isGptImage = model === "gpt-image-1";

    const body: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    };
    if (!isGptImage) {
      body.quality = quality;
      body.style = style;
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = (await response.json()) as { error?: { message?: string } };
      return res.status(response.status).json({
        error: err.error?.message ?? `OpenAI HTTP ${response.status}`,
      });
    }

    const data = (await response.json()) as {
      data?: Array<{ b64_json?: string; revised_prompt?: string }>;
    };
    const b64 = data.data?.[0]?.b64_json;
    const revisedPrompt = data.data?.[0]?.revised_prompt;
    if (!b64) return res.status(500).json({ error: "No image data returned from OpenAI" });

    res.json({
      mimeType: "image/png",
      base64: b64,
      dataUrl: `data:image/png;base64,${b64}`,
      revised_prompt: revisedPrompt,
      model,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
