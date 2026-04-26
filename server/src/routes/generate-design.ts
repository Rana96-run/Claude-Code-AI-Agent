/**
 * /api/generate-design — direct AI image generation pipeline
 *
 * Architecture (matches the user's actual workflow shown in Miro):
 *   1. Claude writes a SINGLE comprehensive English image prompt that
 *      describes the COMPLETE final design — composition, lighting, lens,
 *      lighting/mood, all Arabic copy embedded with exact rendering,
 *      brand colors as hex, typography character.
 *   2. Send that prompt to Nano Banana (Gemini 2.5 Flash Image) or
 *      GPT-Image-1. The output IS the final design.
 *   3. (Optional) Satori fallback ONLY if the AI image gen fails entirely.
 *
 * This is NOT HTML/CSS composition. The AI model produces the complete ad
 * with text + branding + layout baked in. User can then download as PNG/JPG
 * or open in Canva to refine.
 *
 * Returns { png, content, scheme, provider, image_prompt, width, height,
 *           rendered_via: 'ai' | 'satori-fallback' }
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

interface DesignBundle {
  copy: AdCopy;
  image_prompt: string;
}

/* Step 1 — Claude writes BOTH the Arabic copy (for fallback / library) AND
   a comprehensive image prompt that describes the complete final ad.

   The image prompt is the critical asset. It must be ~200-400 words,
   photographer-level detailed, embedding the exact Arabic copy that should
   be rendered IN the image, brand colors as hex, lighting, lens, mood. */
async function generateDesignBundle(
  product: string,
  message: string,
  hook: string,
  cta: string,
  trust: string,
  concept: string,
  artDirection: string,
  ratio: string,
  variant: number,
  scheme: { name: string; bg: string; accent: string; cta_fill: string },
  apiKey: string,
): Promise<DesignBundle> {
  const angle = ANGLES[(variant - 1) % ANGLES.length];

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 30_000);

  const sys =
    `You are a senior art director who writes complete, photographer-level prompts for AI image generators (Nano Banana / GPT-Image-1). You produce the final design in ONE prompt — composition, lighting, camera lens, mood, brand integration, typography rendering, ALL embedded.

Brand: Qoyod (قيود) — Saudi cloud accounting SaaS, ZATCA-certified.
Brand colors: deep navy #021544 (primary), accent cyan/turquoise #17A3A4, brighter cyan #1FCACB for CTAs.
Brand voice: confident, Saudi-professional, Fazaa, modern.
Saudi dialect ONLY for Arabic (مو / وش / ليش — NEVER Egyptian).

Your output is JSON. The 'image_prompt' field is the single most important deliverable — it is sent verbatim to the image model. It must be 200-400 words of dense, evocative, technical art direction. Treat the image prompt like a brief to a photographer + designer hybrid. Specify: shot type, lens, lighting, composition, palette as hex, typography character (e.g. "bold modern Arabic sans-serif, crisp"), exact text content that must appear in the image, mood, photographic style or illustration style.

NO emojis anywhere.`;

  const usr = `Create a complete social-media ad design for ${product}.

Inputs:
- Main message: "${message}"
- Concept (this variant): "${concept}"
- Art direction hint: "${artDirection}"
- Variant angle to lean into: ${angle}
- Hook hint: "${hook}"
- CTA hint: "${cta}"
- Trust element: "${trust}"
- Aspect ratio: ${ratio}
- Color scheme: ${scheme.name} (bg ${scheme.bg}, accent ${scheme.accent}, cta ${scheme.cta_fill})

Return JSON:
{
  "copy": {
    "headline": "2-4 Arabic words, hero headline",
    "hook": "6-10 Arabic words, supporting line",
    "cta": "2-3 Arabic words for the CTA button",
    "trust": "max 4 Arabic words for the trust badge",
    "tagline": "2-3 Arabic words under the brand mark"
  },
  "image_prompt": "Single comprehensive English prompt, 200-400 words, that the AI image model will render directly into the FINAL ad. MUST include: 1) Shot type and lens (e.g. 'extreme close-up macro photo, 100mm lens', 'editorial product still-life, 50mm', 'flat illustrated composition', '3D isometric render'). 2) Composition (where things sit in the frame for ${ratio}). 3) Lighting (e.g. 'cinematic rim light from upper-left, navy fill, cyan accent reflections'). 4) Brand integration: place the Qoyod brand mark 'قيود' top-right area, render in cyan #17A3A4 over navy #021544 background. 5) Exact Arabic text that must appear AS RENDERED TEXT IN THE IMAGE — copy verbatim from the 'copy' object above (headline, hook, trust badge, CTA). Each Arabic phrase should be specified with its exact characters and described as 'crisp Arabic sans-serif, bold weight, white #FFFFFF on navy #021544' or similar. 6) Mood and style descriptors (cinematic, photoreal, 8K, premium financial). 7) Trust element rendered as a pill badge with the trust text. 8) CTA rendered as a rounded button with the CTA text on cyan #1FCACB fill. 9) DO NOT add emojis, watermarks, stock-photo logos, or other Arabic text not specified above. 10) The aspect should fit ${ratio} naturally."
}

The 'image_prompt' is THE deliverable — write it as if you are paying a top-tier image AI to render the final ad in one shot.`;

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
        max_tokens: 1500,
        temperature: 0.85,
        system: sys,
        messages: [{ role: "user", content: usr }],
      }),
    });

    const raw = await r.text();
    let parsed: { content?: Array<{ text?: string }> } = {};
    try { parsed = JSON.parse(raw); } catch { /* keep raw */ }
    const text = parsed.content?.[0]?.text ?? "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();

    // Balanced-brace extractor (Claude sometimes adds prose after the JSON)
    let depth = 0, start = -1, inStr = false, esc = false, jsonStr = "";
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === "{") { if (depth === 0) start = i; depth++; }
      else if (c === "}") { depth--; if (depth === 0 && start !== -1) { jsonStr = clean.slice(start, i + 1); break; } }
    }

    try {
      return JSON.parse(jsonStr) as DesignBundle;
    } catch {
      return {
        copy: {
          headline: message || "أدِر أعمالك بذكاء",
          hook: hook || "فاتورة إلكترونية متوافقة مع زاتكا",
          cta: cta || "ابدأ مجاناً",
          trust: trust || "زاتكا المرحلة الثانية",
          tagline: "محاسبة سحابية",
        },
        image_prompt: `A premium social media ad for Qoyod (Saudi cloud accounting, ZATCA-certified). ${concept || message}. ${ratio} aspect ratio. Cinematic lighting on deep navy #021544 background with cyan #17A3A4 accents. Render Arabic headline "${message || "أدِر أعمالك بذكاء"}" in bold modern sans-serif white text top-right. Brand mark "قيود" in cyan top-right corner. Cyan #1FCACB rounded CTA button with text "${cta || "ابدأ مجاناً"}" lower-center. Trust badge "${trust || "زاتكا المرحلة الثانية"}" as pill above the CTA. Premium photoreal style, 8K, no watermarks, no extra text.`,
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
  } = req.body ?? {};

  const [w, h] = RATIO_DIMS[ratio] ?? [1080, 1080];
  const scheme = resolveScheme(color_scheme);

  try {
    /* 1. Claude writes copy + comprehensive image prompt */
    const { copy, image_prompt } = await generateDesignBundle(
      product, message, hook, cta, trust, concept, art_direction,
      ratio, Number(variant) || 1, scheme, apiKey,
    );

    /* 2. AI image generation — this IS the final design */
    const ai = await generateHeroImage(image_prompt, image_provider as ImageProvider, ratio);

    if (ai) {
      res.status(200).json({
        png: ai.dataUrl,
        content: copy,
        image_prompt,
        provider: ai.provider,
        scheme: scheme.name,
        width: w,
        height: h,
        rendered_via: "ai",
      });
      return;
    }

    /* 3. AI image gen failed — fall back to Satori composition so the user
       still sees something. Logged so we know when this happens. */
    logger.warn(
      { image_provider, product },
      "[generate-design] AI image gen failed, falling back to Satori",
    );
    const out = await renderDesign({
      copy,
      scheme,
      ratio,
      heroImageDataUrl: null,
    });
    res.status(200).json({
      png: `data:image/png;base64,${out.pngBase64}`,
      content: copy,
      image_prompt,
      provider: null,
      scheme: scheme.name,
      width: out.width,
      height: out.height,
      rendered_via: "satori-fallback",
    });
  } catch (err) {
    logger.error({ err: String(err) }, "[generate-design] failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

export default router;
