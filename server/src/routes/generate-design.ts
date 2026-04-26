/**
 * /api/generate-design — new pipeline
 *
 *   1. Claude writes Arabic ad copy (headline / hook / cta / trust / tagline)
 *   2. Claude writes a visual prompt for the hero image
 *   3. Hero image generated via Nano Banana or GPT-Image
 *   4. Satori (JSX → SVG) + resvg (SVG → PNG) composes the final design
 *
 * Returns { png, content, scheme, provider, image_prompt, width, height }
 */

import { Router } from "express";
import { generateHeroImage, type ImageProvider } from "../lib/image-gen.js";
import {
  renderDesign,
  resolveScheme,
  RATIO_DIMS,
  type AdCopy,
} from "../lib/design-renderer.js";
import { logger } from "../lib/logger.js";

const router = Router();
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const ANGLES = [
  "direct/benefit-driven — emphasise the outcome the user gets",
  "fear/loss — what they avoid by using Qoyod (penalties, manual work, errors)",
  "time/speed — speed and ease, minutes not hours",
  "social proof — joining 25,000+ Saudi businesses",
  "control/clarity — peace of mind, full visibility",
  "before/after — the transformation",
];

interface CopyAndPrompt {
  copy: AdCopy;
  image_prompt: string;
}

/* Step 1+2 — Claude writes both the Arabic copy AND the visual prompt in one call */
async function generateCopyAndPrompt(
  product: string,
  message: string,
  hook: string,
  cta: string,
  trust: string,
  concept: string,
  artDirection: string,
  variant: number,
  apiKey: string,
): Promise<CopyAndPrompt> {
  const angle = ANGLES[(variant - 1) % ANGLES.length];

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 25_000);

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        temperature: 0.85,
        system:
          "You are a senior creative director for Qoyod (Saudi cloud accounting, ZATCA-certified). You write concise Arabic Saudi-dialect ad copy AND a vivid English visual prompt for an AI image generator. NO emojis. Saudi dialect ONLY (مو/وش/ليش — never Egyptian). Return ONLY valid JSON.",
        messages: [
          {
            role: "user",
            content: `Build a social-media ad for ${product}.
Main message: "${message}"
Concept (this variant): "${concept}"
Art direction (this variant): "${artDirection}"
Variant angle: ${angle}
Hook hint: "${hook}"
CTA hint: "${cta}"
Trust element: "${trust}"

Return JSON:
{
  "copy": {
    "headline": "2-4 Arabic words, hero headline",
    "hook": "6-10 Arabic words, supporting line",
    "cta": "2-3 Arabic words for the button",
    "trust": "max 4 Arabic words trust badge (ZATCA المرحلة الثانية / +25,000 شركة / SOCPA / etc)",
    "tagline": "2-3 Arabic words under the brand mark"
  },
  "image_prompt": "vivid English prompt for an AI image generator. Describe a clean, modern, professional photo or illustration that fits the concept above. Saudi business context. Cinematic lighting, brand-safe, no text overlays (text will be added separately), no watermarks, no logos. 80-150 words."
}`,
          },
        ],
      }),
    });

    const raw = await r.text();
    let parsed: { content?: Array<{ text?: string }> } = {};
    try { parsed = JSON.parse(raw); } catch { /* keep raw */ }
    const text = parsed.content?.[0]?.text ?? "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const fi = clean.indexOf("{");
    const li = clean.lastIndexOf("}");

    try {
      return JSON.parse(clean.slice(fi, li + 1)) as CopyAndPrompt;
    } catch {
      // graceful fallback
      return {
        copy: {
          headline: message || "أدِر أعمالك بذكاء",
          hook: hook || "فاتورة إلكترونية متوافقة مع زاتكا",
          cta: cta || "ابدأ مجاناً",
          trust: trust || "زاتكا المرحلة الثانية",
          tagline: "محاسبة سحابية",
        },
        image_prompt: `A modern professional ${product} ad scene: ${concept || message}. Clean, cinematic, Saudi business context. No text overlay.`,
      };
    }
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Route ───────────────────────────────────────────────────── */

router.post("/generate-design", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
    return;
  }

  const {
    product = "Qoyod Main",
    message = "",
    hook = "",
    cta = "ابدأ مجاناً",
    trust = "زاتكا المرحلة الثانية",
    ratio = "1:1",
    concept = "",
    art_direction = "",
    variant = 1,
    color_scheme,
    image_provider = "auto",
    skip_image = false,
  } = req.body ?? {};

  const [w, h] = RATIO_DIMS[ratio] ?? [1080, 1080];
  const scheme = resolveScheme(color_scheme);

  try {
    /* Step 1+2 — copy and image prompt */
    const { copy, image_prompt } = await generateCopyAndPrompt(
      product, message, hook, cta, trust, concept, art_direction,
      Number(variant) || 1, apiKey,
    );

    /* Step 3 — hero image (best-effort; if it fails, render gradient bg) */
    let heroDataUrl: string | null = null;
    let provider: string | null = null;
    if (!skip_image) {
      const hero = await generateHeroImage(image_prompt, image_provider as ImageProvider, ratio);
      if (hero) {
        heroDataUrl = hero.dataUrl;
        provider = hero.provider;
      }
    }

    /* Step 4 — compose with Satori + resvg */
    const out = await renderDesign({
      copy,
      scheme,
      ratio,
      heroImageDataUrl: heroDataUrl,
    });

    res.status(200).json({
      png: `data:image/png;base64,${out.pngBase64}`,
      content: copy,
      image_prompt,
      provider,
      scheme: scheme.name,
      width: out.width,
      height: out.height,
    });
  } catch (err) {
    logger.error({ err: String(err) }, "[generate-design] failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

export default router;
