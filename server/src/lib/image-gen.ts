/**
 * Image & Video generation helpers for the design pipeline.
 *
 * Providers:
 *   gpt-image      — OpenAI gpt-image-1 (→ dall-e-3 fallback)
 *   nanobanana     — Gemini 2.0 Flash Preview image generation  (fastest)
 *   nanobanana-25  — Gemini 2.5 Flash Preview image generation  (higher quality)
 *   imagen3        — Google Imagen 3  (photorealistic, product shots)
 *   imagen4        — Google Imagen 4 preview  (highest quality Google image)
 *   veo2           — Google Veo 2  (video scene, no text overlay)
 *   veo3           — Google Veo 3  (video + audio scene, no text overlay)
 *   auto           — prefers gpt-image → nanobanana
 */

import { logger } from "./logger.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_OPS  = "https://generativelanguage.googleapis.com/v1beta/operations";

export type ImageProvider =
  | "nanobanana"
  | "nanobanana-25"
  | "imagen3"
  | "imagen4"
  | "gpt-image"
  | "veo2"
  | "veo3"
  | "auto";

export interface ImageResult {
  mimeType: string;
  base64: string;
  dataUrl: string;
  provider: string;
}

export interface VideoResult {
  mimeType: "video/mp4";
  base64: string;
  dataUrl: string;
  provider: "veo2" | "veo3";
}

/* ── Helpers ─────────────────────────────────────────────────────── */

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

function imagenAspect(ratio: string): string {
  const map: Record<string, string> = {
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "16:9": "16:9",
  };
  return map[ratio] ?? "1:1";
}

function withAspectHint(prompt: string, ratio: string): string {
  const aspectMap: Record<string, string> = {
    "1:1":  "Square 1:1 aspect ratio.",
    "4:5":  "Portrait 4:5 aspect ratio (Instagram portrait).",
    "9:16": "Vertical 9:16 aspect ratio (Stories / Reels / TikTok).",
    "16:9": "Landscape 16:9 aspect ratio (YouTube / LinkedIn banner).",
  };
  return `${prompt.trim()}\n\nFinal aspect ratio: ${aspectMap[ratio] ?? aspectMap["1:1"]}`;
}

/* ── Gemini image generation (Nano Banana variants) ──────────────── */

async function generateWithGeminiImage(
  prompt: string,
  ratio: string,
  model: string,
  providerLabel: string,
): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 60_000);

  try {
    const r = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      throw new Error(`${providerLabel} HTTP ${r.status}: ${err.slice(0, 300)}`);
    }
    const data = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!img?.data) throw new Error(`${providerLabel} returned no image`);
    return {
      mimeType: img.mimeType,
      base64: img.data,
      dataUrl: `data:${img.mimeType};base64,${img.data}`,
      provider: providerLabel,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Imagen 3 / 4 ────────────────────────────────────────────────── */

async function generateWithImagen(
  prompt: string,
  ratio: string,
  model: string,
  providerLabel: string,
): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 90_000);

  try {
    const r = await fetch(
      `${GEMINI_BASE}/${model}:predict?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: imagenAspect(ratio),
            safetyFilterLevel: "block_only_high",
            personGeneration: "allow_adult",
          },
        }),
      },
    );
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`${providerLabel} HTTP ${r.status}: ${err.slice(0, 300)}`);
    }
    const data = (await r.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };
    const pred = data.predictions?.[0];
    if (!pred?.bytesBase64Encoded) throw new Error(`${providerLabel} returned no image`);
    const mimeType = pred.mimeType ?? "image/png";
    return {
      mimeType,
      base64: pred.bytesBase64Encoded,
      dataUrl: `data:${mimeType};base64,${pred.bytesBase64Encoded}`,
      provider: providerLabel,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* ── OpenAI gpt-image-1 / DALL-E 3 ──────────────────────────────── */

async function generateWithGptImage(prompt: string, ratio: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const size = gptImageSize(ratio);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000);

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size, quality: "high" }),
    });
    if (!r.ok) {
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
    return { mimeType: "image/png", base64: b64, dataUrl: `data:image/png;base64,${b64}`, provider: "gpt-image" };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithDallE3(prompt: string, ratio: string): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const size = dalle3Size(ratio);
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, quality: "hd", style: "vivid", response_format: "b64_json" }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`DALL-E 3 HTTP ${r.status}: ${err.slice(0, 200)}`);
  }
  const data = (await r.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("DALL-E 3 returned no image");
  return { mimeType: "image/png", base64: b64, dataUrl: `data:image/png;base64,${b64}`, provider: "gpt-image" };
}

/* ── Veo 2 / Veo 3 (video generation, async polling) ─────────────── */

async function generateWithVeo(
  prompt: string,
  ratio: string,
  model: string,
  providerLabel: "veo2" | "veo3",
): Promise<VideoResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const aspectMap: Record<string, string> = {
    "1:1": "1:1", "4:5": "4:5", "9:16": "9:16", "16:9": "16:9",
  };

  /* Step 1 — kick off the long-running generation */
  const startR = await fetch(
    `${GEMINI_BASE}/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{
          prompt,
          video: { durationSeconds: 5 },
        }],
        parameters: {
          aspectRatio: aspectMap[ratio] ?? "1:1",
          sampleCount: 1,
        },
      }),
    },
  );
  if (!startR.ok) {
    const err = await startR.text();
    throw new Error(`${providerLabel} start HTTP ${startR.status}: ${err.slice(0, 300)}`);
  }
  const startData = (await startR.json()) as { name?: string };
  const opName = startData.name;
  if (!opName) throw new Error(`${providerLabel}: no operation name returned`);

  /* Step 2 — poll until done (max 90 s) */
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4_000));
    const pollR = await fetch(
      `${GEMINI_OPS}/${opName.split("/").pop()}?key=${encodeURIComponent(apiKey)}`,
    );
    if (!pollR.ok) continue;
    const op = (await pollR.json()) as {
      done?: boolean;
      response?: {
        generatedSamples?: Array<{ video?: { encodedVideo?: string; uri?: string } }>;
      };
    };
    if (!op.done) continue;

    const sample = op.response?.generatedSamples?.[0];
    const encoded = sample?.video?.encodedVideo;
    if (!encoded) throw new Error(`${providerLabel}: operation done but no video`);
    return {
      mimeType: "video/mp4",
      base64: encoded,
      dataUrl: `data:video/mp4;base64,${encoded}`,
      provider: providerLabel,
    };
  }
  throw new Error(`${providerLabel}: timed out after 90s`);
}

/* ── Public API ──────────────────────────────────────────────────── */

export async function generateHeroImage(
  prompt: string,
  provider: ImageProvider = "auto",
  ratio = "1:1",
): Promise<ImageResult | null> {
  const hasGPT = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  /* Veo is video — handled separately by generateHeroVideo */
  if (provider === "veo2" || provider === "veo3") return null;

  type ImageProv = "gpt-image" | "nanobanana" | "nanobanana-25" | "imagen3" | "imagen4";

  const order: ImageProv[] =
    provider === "gpt-image"      ? ["gpt-image"]
    : provider === "nanobanana"   ? ["nanobanana"]
    : provider === "nanobanana-25"? ["nanobanana-25"]
    : provider === "imagen3"      ? ["imagen3"]
    : provider === "imagen4"      ? ["imagen4"]
    /* auto: GPT-Image first, then Nano Banana */
    : hasGPT && hasGemini         ? ["gpt-image", "nanobanana"]
    : hasGPT                      ? ["gpt-image"]
    : hasGemini                   ? ["nanobanana"]
    : [];

  for (const p of order) {
    try {
      if (p === "gpt-image")
        return await generateWithGptImage(prompt, ratio);
      if (p === "nanobanana")
        return await generateWithGeminiImage(prompt, ratio, "gemini-2.0-flash-preview-image-generation", "nanobanana");
      if (p === "nanobanana-25")
        return await generateWithGeminiImage(prompt, ratio, "gemini-2.5-flash-preview-05-20", "nanobanana-25");
      if (p === "imagen3")
        return await generateWithImagen(prompt, ratio, "imagen-3.0-generate-002", "imagen3");
      if (p === "imagen4")
        return await generateWithImagen(prompt, ratio, "imagen-4.0-generate-preview-05-20", "imagen4");
    } catch (e) {
      logger.warn({ provider: p, err: String(e) }, "image-gen: provider failed, trying next");
    }
  }
  return null;
}

export async function generateHeroVideo(
  prompt: string,
  provider: "veo2" | "veo3",
  ratio = "1:1",
): Promise<VideoResult | null> {
  try {
    const model = provider === "veo3" ? "veo-3.0-generate-preview" : "veo-2.0-generate-001";
    return await generateWithVeo(prompt, ratio, model, provider);
  } catch (e) {
    logger.warn({ provider, err: String(e) }, "image-gen: veo failed");
    return null;
  }
}
