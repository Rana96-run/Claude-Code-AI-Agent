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

export default router;
