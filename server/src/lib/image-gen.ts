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

/** Pick the closest-supported image model size for the requested ratio. */
function gptImageSize(ratio: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (ratio === "9:16" || ratio === "4:5") return "1024x1536";
  if (ratio === "16:9") return "1536x1024";
  return "1024x1024";
}

function dalle3Size(ratio: string): "1024x1024" | "1024x1792" | "1792x1024" {
  if (ratio === "9:16" || ratio === "4:5") return "1024x1792";
  if (ratio === "16:9") return "1792x1024";
  return "1024x1024";
}

/** Append an aspect-ratio hint to the prompt for models that don't
 *  accept dimensions as a separate parameter (Nano Banana). */
function withAspectHint(prompt: string, ratio: string): string {
  const aspectMap: Record<string, string> = {
    "1:1": "Square 1:1 aspect ratio.",
    "4:5": "Portrait 4:5 aspect ratio (Instagram portrait).",
    "9:16": "Vertical 9:16 aspect ratio (Stories / Reels / TikTok).",
    "16:9": "Landscape 16:9 aspect ratio (YouTube / LinkedIn banner).",
  };
  return `${prompt.trim()}\n\nFinal aspect ratio: ${aspectMap[ratio] ?? aspectMap["1:1"]}`;
}

/* ── Nano Banana (Gemini 2.5 Flash Image) ──────────────────────── */

async function generateWithNanoBanana(prompt: string, ratio: string): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 60_000);

  try {
    const r = await fetch(
      `${GEMINI_BASE}/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: withAspectHint(prompt, ratio) }] }],
          generationConfig: {
            temperature: 0.9,
            responseModalities: ["IMAGE", "TEXT"],
          },
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

async function generateWithGptImage(prompt: string, ratio: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const size = gptImageSize(ratio);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000); // OpenAI image gen can be slow

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
        quality: "high",
      }),
    });
    if (!r.ok) {
      // Account doesn't have gpt-image-1 → fall back to DALL-E 3
      if (r.status === 403 || r.status === 404 || r.status === 400) {
        const errText = await r.text();
        logger.info({ status: r.status, err: errText.slice(0, 200) }, "image-gen: gpt-image-1 unavailable, trying dall-e-3");
        return generateWithDallE3(prompt, ratio);
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

/** DALL-E 3 fallback for accounts without gpt-image-1 access. */
async function generateWithDallE3(prompt: string, ratio: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const size = dalle3Size(ratio);
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
 * Generate the FINAL ad image. The model returns the complete design
 * (composition + text + branding) in a single shot — no compositing needed.
 *
 * `auto` prefers GPT-Image-1 (better Arabic text rendering) if OPENAI_API_KEY
 * is set, falling back to Nano Banana. Set `provider` explicitly to lock.
 */
export async function generateHeroImage(
  prompt: string,
  provider: ImageProvider = "auto",
  ratio = "1:1",
): Promise<ImageResult | null> {
  const hasGPT = !!process.env.OPENAI_API_KEY;
  const hasNB = !!process.env.GEMINI_API_KEY;

  const order: Array<"gpt-image" | "nanobanana"> =
    provider === "gpt-image"   ? ["gpt-image"]
    : provider === "nanobanana" ? ["nanobanana"]
    /* auto: GPT-Image first (better text rendering), then Nano Banana */
    : hasGPT && hasNB           ? ["gpt-image", "nanobanana"]
    : hasGPT                    ? ["gpt-image"]
    : hasNB                     ? ["nanobanana"]
    : [];

  for (const p of order) {
    try {
      if (p === "gpt-image") return await generateWithGptImage(prompt, ratio);
      if (p === "nanobanana") return await generateWithNanoBanana(prompt, ratio);
    } catch (e) {
      logger.warn({ provider: p, err: String(e) }, "image-gen: provider failed, trying next");
    }
  }
  return null;
}
