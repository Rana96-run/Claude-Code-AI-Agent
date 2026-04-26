/**
 * /api/generate-design — hybrid AI scene + Satori text composition
 *
 * The architecture real designers use in production:
 *   1. Claude (loaded with Qoyod Playbook + Ads Guideline) writes
 *      Arabic copy AND a SCENE-ONLY image prompt — no text rendering
 *      instructions, because AI image models mangle Arabic text.
 *   2. Image model (GPT-Image-1 default, Nano Banana fallback) renders
 *      the visual scene only — product UI, business owner, lighting,
 *      composition. No copy, no CTA.
 *   3. Satori composites Arabic text on top with Lama Sans (or IBM
 *      Plex Sans Arabic fallback). Brand mark "قيود", tagline, headline,
 *      hook, trust badge, CTA, and qoyod.com link — all crisp and
 *      typographically correct.
 *
 * Result: the visual richness of AI imagery + pixel-perfect Arabic typography.
 */

import { Router } from "express";
import { generateHeroImage, type ImageProvider } from "../lib/image-gen.js";
import {
  renderDesign,
  resolveScheme,
  RATIO_DIMS,
  type AdCopy,
} from "../lib/design-renderer.js";
import {
  QOYOD_BRAND_PLAYBOOK,
  QOYOD_CREATIVE_RULES,
  QOYOD_HEADLINE_PATTERNS,
} from "../lib/brand-context.js";
import { logger } from "../lib/logger.js";

const router = Router();
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const ANGLES = [
  "direct/benefit-driven — emphasise the outcome the user gets",
  "fear/loss — what they avoid (penalties, manual work, errors)",
  "time/speed — speed and ease, minutes not hours",
  "social proof — joining 25,000+ Saudi businesses",
  "control/clarity — peace of mind, full visibility",
  "before/after — the transformation",
];

interface DesignBundle {
  copy: AdCopy;
  image_prompt: string;
}

/* Provider-specific tuning — each model has different strengths. */
function tuneForProvider(scenePrompt: string, provider: ImageProvider): string {
  const base = scenePrompt.trim();
  if (provider === "gpt-image") {
    /* GPT-Image-1 likes editorial product photography, struggles with
       very abstract scenes. Lean into product-shot realism. */
    return `${base}

Style guidance for this rendering:
- Editorial commercial photography, premium fintech magazine aesthetic
- Sharp focus on the visual subject, shallow depth of field
- Clean studio-style or environmental lighting
- Saudi business context — modest professional dress if a person is shown
- Photorealistic, NOT illustrated
- No text, no logos, no watermarks anywhere in the frame
- Leave clear empty space on the right side (or bottom for portrait orientations) — copy will be added in post-production`;
  }
  if (provider === "nanobanana") {
    /* Nano Banana (Gemini 2.5 Flash Image) handles cinematic scenes
       and creative compositions well. Lean into cinematic look. */
    return `${base}

Style guidance for this rendering:
- Cinematic still frame, premium financial brand campaign
- Volumetric lighting, soft haze, subtle bokeh
- Saudi business context — authentic, modest, professional
- 8K, depth, atmosphere
- Render with NO text, NO logos, NO watermarks anywhere in the image
- Leave clear empty space on the right side (or bottom for portrait orientations) for typography that will be composited later`;
  }
  return base;
}

/* Balanced-brace JSON extractor */
function extractJsonObject(text: string): string | null {
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
  }
  return null;
}

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
  const timeout = setTimeout(() => ctrl.abort(), 35_000);

  /* Claude is asked for a SCENE-ONLY prompt — no Arabic text in the image.
     Arabic text will be composited correctly by Satori in post-production. */
  const sys = `You are the Qoyod AI Graphic Designer. You produce a 250-400 word English image prompt for an AI image model that paints the VISUAL SCENE for a Qoyod social media ad. The Arabic copy is added in post-production with proper typography — DO NOT instruct the model to render Arabic text in the image.

${QOYOD_BRAND_PLAYBOOK}

${QOYOD_CREATIVE_RULES}

${QOYOD_HEADLINE_PATTERNS}

EXAMPLES OF GOOD SCENE PROMPTS

Example 1 — Product UI close-up:
"Editorial product photography. Premium tablet device on a clean dark surface, screen displaying the Qoyod cloud accounting dashboard interface in soft glowing detail — clean rows of financial data, subtle cyan #17A3A4 UI accents, navy #021544 dashboard chrome. Tablet tilted 15 degrees toward camera, partial Saudi business owner's hand resting beside it (modest professional dress, sleeve visible). Background: deep navy #021544 with soft cyan #1FCACB rim light from upper-left, gentle volumetric haze. Right two-thirds of frame intentionally empty / uncluttered for typography overlay in post. No text on the screen, no logos, no watermarks anywhere. Cinematic 8K, Canon 50mm at f/2.0, photorealistic."

Example 2 — Saudi business owner:
"Editorial portrait of a confident Saudi business owner in his 30s, modest professional thobe, looking thoughtfully at his phone. Clean office background slightly out of focus, subtle navy #021544 blue gradient. Cyan #17A3A4 rim light catches one side of his face. Mid-shot, 85mm portrait lens, soft natural light. Calm, professional, no smile. Frame composed with the subject on the left so the right side is open for headline + CTA in post. No text, no logos, no signage in the frame."

Example 3 — Document / artifact close-up:
"Macro photo, perfectly crisp ZATCA-compliant invoice document on a navy #021544 textured surface, with a stylus or pen resting at an angle. Cyan #17A3A4 accent light raking across the paper. Composition leaves the upper-right and right side empty for typography. Flat-lay slightly angled, 100mm macro, photorealistic 8K, no text rendering on the document — only abstract row patterns and ZATCA QR placeholder shape, no readable Arabic anywhere."

OUTPUT FORMAT
Return ONE JSON object:
{
  "copy": {
    "headline": "5-7 Arabic MSA words, hero headline. Calm, direct, confident.",
    "hook": "6-10 Arabic words, supporting line",
    "cta": "2-3 Arabic words, button label (اشترك الآن / احجز ديمو / ابدأ تجربتك)",
    "trust": "max 4 Arabic words, ONE trust element only (ZATCA-معتمد / SOCPA / +25,000 شركة / etc)",
    "tagline": "2-3 Arabic words, under brand mark"
  },
  "image_prompt": "250-400 word English SCENE-ONLY prompt. Specify: shot type + lens, lighting, composition (always leave clean empty space on the right side for square/landscape, or bottom for portrait — typography will be added in post). Saudi business context. Brand colors as hex (#021544 navy, #17A3A4 teal, #1FCACB bright cyan, #FFFFFF white). NO text rendering anywhere. NO logos in the frame. NO watermarks. Mood and style descriptors (cinematic, photoreal, 8K) or (editorial flat illustration, no 3D)."
}

NEVER ask the model to render Arabic text in the image — that's our job in post.`;

  const usr = `Build the visual scene for a Qoyod social media ad.

Inputs:
- Product: ${product}
- Main Arabic message: "${message}"
- Concept (this variant): "${concept || "your judgement"}"
- Art direction hint: "${artDirection || "editorial photoreal scene"}"
- Variant angle: ${angle}
- Hook hint: "${hook || "(your call — Saudi SME pain point)"}"
- CTA hint: "${cta || "اشترك الآن"}"
- Trust hint: "${trust || "ZATCA-معتمد"}"
- Aspect ratio: ${ratio}
- Color scheme: ${scheme.name}

Return JSON ONLY (no markdown, no commentary).`;

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
        max_tokens: 2200,
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

    const block = extractJsonObject(clean);
    if (block) {
      try { return JSON.parse(block) as DesignBundle; } catch { /* fall through */ }
    }

    return {
      copy: {
        headline: message || "أدر أعمالك بثقة",
        hook: hook || "محاسبة سحابية معتمدة من ZATCA",
        cta: cta || "ابدأ تجربتك",
        trust: trust || "ZATCA-معتمد",
        tagline: "محاسبة سحابية",
      },
      image_prompt: `Editorial photo-real scene for a Qoyod cloud accounting ad. ${ratio} aspect ratio. Premium product UI screenshot or Saudi business context. Deep navy #021544 background with cyan #17A3A4 rim light. Clean empty space on the right (or bottom for portrait) for typography overlay in post. Cinematic 8K, photorealistic. No text in the image, no logos, no watermarks.`,
    };
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
    cta = "",
    trust = "",
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
    /* 1. Claude → copy + scene-only image prompt */
    const { copy, image_prompt } = await generateDesignBundle(
      product, message, hook, cta, trust, concept, art_direction,
      ratio, Number(variant) || 1, scheme, apiKey,
    );

    /* 2. AI → render the scene (per-provider tuning) */
    const tunedPrompt = tuneForProvider(
      image_prompt,
      (image_provider === "auto" ? "auto" : image_provider) as ImageProvider,
    );
    const ai = await generateHeroImage(tunedPrompt, image_provider as ImageProvider, ratio);

    /* 3. Satori → composite Arabic text + brand + qoyod.com over the scene */
    const out = await renderDesign({
      copy,
      scheme,
      ratio,
      heroImageDataUrl: ai?.dataUrl ?? null,
    });

    res.status(200).json({
      png: `data:image/png;base64,${out.pngBase64}`,
      content: copy,
      image_prompt,
      provider: ai?.provider ?? null,
      scheme: scheme.name,
      width: out.width,
      height: out.height,
      rendered_via: ai ? "ai-scene+typography" : "typography-only",
    });
  } catch (err) {
    logger.error({ err: String(err) }, "[generate-design] failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

export default router;
