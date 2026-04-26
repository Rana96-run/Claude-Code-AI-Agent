/**
 * Image generation helpers — internal callable versions of /api/nb/* routes.
 * Used by the design pipeline to fetch a hero image without going through HTTP.
 */

import { logger } from "./logger.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type ImageProvider = "nanobanana" | "gpt-image" | "auto";

export interface ImageResult {
  mimeType: string;
  base64: string;
  dataUrl: string;
  provider: "nanobanana" | "gpt-image";
}

/* ── Nano Banana (Gemini 2.5 Flash Image) ──────────────────────── */

async function generateWithNanoBanana(prompt: string): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 50_000);

  try {
    const r = await fetch(
      `${GEMINI_BASE}/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, responseModalities: ["IMAGE", "TEXT"] },
        }),
      },
    );
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Nano Banana HTTP ${r.status}: ${err.slice(0, 200)}`);
    }
    const data = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!img?.data) throw new Error("Nano Banana returned no image");
    return {
      mimeType: img.mimeType,
      base64: img.data,
      dataUrl: `data:${img.mimeType};base64,${img.data}`,
      provider: "nanobanana",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* ── OpenAI gpt-image-1 / DALL-E 3 ─────────────────────────────── */

async function generateWithGptImage(
  prompt: string,
  size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024",
): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 90_000); // OpenAI image gen is slow

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size,
      }),
    });
    if (!r.ok) {
      // Some accounts only have dall-e-3 access — fall back automatically
      if (r.status === 403 || r.status === 404) {
        return generateWithDallE3(prompt, size);
      }
      const err = await r.text();
      throw new Error(`OpenAI HTTP ${r.status}: ${err.slice(0, 200)}`);
    }
    const data = (await r.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image");
    return {
      mimeType: "image/png",
      base64: b64,
      dataUrl: `data:image/png;base64,${b64}`,
      provider: "gpt-image",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Fallback for accounts without gpt-image-1 access. */
async function generateWithDallE3(prompt: string, size: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "hd",
      style: "vivid",
      response_format: "b64_json",
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`DALL-E 3 HTTP ${r.status}: ${err.slice(0, 200)}`);
  }
  const data = (await r.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("DALL-E 3 returned no image");
  return {
    mimeType: "image/png",
    base64: b64,
    dataUrl: `data:image/png;base64,${b64}`,
    provider: "gpt-image",
  };
}

/* ── Public API ───────────────────────────────────────────────── */

/**
 * Generate a hero image. `auto` picks Nano Banana if GEMINI_API_KEY is set,
 * otherwise GPT Image.
 */
export async function generateHeroImage(
  prompt: string,
  provider: ImageProvider = "auto",
  ratio = "1:1",
): Promise<ImageResult | null> {
  const size: "1024x1024" | "1024x1792" | "1792x1024" =
    ratio === "9:16" || ratio === "4:5"
      ? "1024x1792"
      : ratio === "16:9"
        ? "1792x1024"
        : "1024x1024";

  const tryNB = provider === "nanobanana" || (provider === "auto" && !!process.env.GEMINI_API_KEY);
  const tryGPT = provider === "gpt-image" || (provider === "auto" && !!process.env.OPENAI_API_KEY);

  if (tryNB) {
    try {
      return await generateWithNanoBanana(prompt);
    } catch (e) {
      logger.warn({ err: String(e) }, "image-gen: Nano Banana failed");
      if (provider === "nanobanana") return null;
    }
  }
  if (tryGPT) {
    try {
      return await generateWithGptImage(prompt, size);
    } catch (e) {
      logger.warn({ err: String(e) }, "image-gen: GPT-Image failed");
      return null;
    }
  }
  return null;
}
