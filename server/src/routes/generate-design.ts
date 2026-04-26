/**
 * /api/generate-design — direct AI image generation, brand-faithful pipeline
 *
 * Architecture (matches the user's Miro workflow + Qoyod Playbook):
 *   1. Claude (loaded with the full Qoyod Playbook + Ads Guideline) writes
 *      ONE photographer-level English image prompt that describes the COMPLETE
 *      final ad — composition, lens, lighting, exact Arabic copy embedded
 *      as text-in-image, hex brand colors, trust badge styling, CTA styling.
 *   2. That prompt is passed to GPT-Image-1 (default — best Arabic text
 *      rendering) or Nano Banana. The model output IS the final ad.
 *   3. Satori-based composition is kept ONLY as a last-resort fallback
 *      when both image providers fail.
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
  QOYOD_REFERENCE_PROMPT_EXAMPLE,
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

/* Balanced-brace JSON extractor — robust to commentary before/after */
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

  /* Full system prompt — playbook + rules + reference example */
  const sys = `You are the Qoyod AI Graphic Designer. You write a single photographer-level English prompt that an AI image model (GPT-Image-1 / Nano Banana) will render as the COMPLETE final social media ad — text + branding + composition baked in.

${QOYOD_BRAND_PLAYBOOK}

${QOYOD_CREATIVE_RULES}

${QOYOD_REFERENCE_PROMPT_EXAMPLE}

OUTPUT CONTRACT
You always return a single JSON object with two top-level keys: "copy" (the structured Arabic copy that appears in the image) and "image_prompt" (the rendering instructions for the AI image model).

The 'copy' fields:
- headline: 5–7 Arabic words MAX. MSA Arabic for ad copy. Direct, calm, confident.
- hook: 6–10 Arabic words supporting line. Optional secondary message.
- cta: 2–3 Arabic words. ONE CTA: 'اشترك الآن' / 'احجز ديمو' / 'ابدأ تجربتك' / 'اطلب عرض'.
- trust: max 4 Arabic words. ONE trust element ONLY: 'ZATCA-معتمد' / 'هيئة الزكاة والضريبة' / '+25,000 شركة' / 'SOCPA' / similar.
- tagline: 2–3 Arabic words under the brand mark (e.g. 'محاسبة سحابية', 'محاسبة معتمدة').

The 'image_prompt' is THE deliverable. It MUST:
- Be 250–500 words of dense, photographer-level English.
- Open with shot type + lens (e.g. 'Extreme close-up macro photo, Canon 100mm lens', 'Editorial product still-life, 50mm', 'Cinematic flat illustration, isometric overhead', 'Editorial portrait of Saudi business owner, 85mm, natural light').
- Specify composition for ${ratio} aspect ratio.
- Specify lighting: cinematic rim light, color temp, mood (e.g. 'dramatic side rim light in cyan #1FCACB, navy ambient fill, soft volumetric haze').
- Brand integration: the Qoyod brand mark "قيود" rendered subtly in cyan #17A3A4 in the lower-right corner. Tagline below it in muted body text.
- Render the EXACT Arabic copy from the 'copy' object as text-in-image. Quote each phrase verbatim. After each phrase add: 'every Arabic letter razor sharp, crisp modern Arabic sans-serif, bold weight, white #FFFFFF on the navy background, perfectly legible'.
- Trust element: rendered as a single pill badge with the trust text. ONE only.
- CTA: rendered as a single rounded button with cyan #1FCACB fill, navy #021544 text, with the CTA text. ONE only.
- Mood/style: cinematic, photorealistic, 8K. OR for non-photo: editorial flat-design illustration, no 3D, clean lines.
- NEVER include: stock-photo aesthetic, multiple trust badges, more than one CTA, watermarks, emojis, Egyptian Arabic, gradients/colors outside the brand palette, 3D heavy renders, drop shadows.
- Mention the visual subject — real Saudi product UI screenshot, real Saudi business owner photo (modest professional dress), or clean editorial composition. NO stock photo people.

This is a Saudi B2B SaaS ad. Calm, trust-building, professional. Match the macro reference example's level of technical detail. NO emojis anywhere.`;

  const usr = `Build a complete social-media ad for ${product}.

Inputs:
- Main Arabic message: "${message}"
- Concept (this variant): "${concept || "use your judgement"}"
- Art direction hint: "${artDirection || "editorial photoreal or flat brand illustration"}"
- Variant angle: ${angle}
- Hook hint: "${hook || "(your call — pick a Saudi SME pain point)"}"
- CTA hint: "${cta || "اشترك الآن"}"
- Trust hint: "${trust || "ZATCA-معتمد"}"
- Aspect ratio: ${ratio}
- Color scheme: ${scheme.name} (bg ${scheme.bg}, accent ${scheme.accent}, cta ${scheme.cta_fill})

Return JSON ONLY (no markdown, no commentary):
{
  "copy": {
    "headline": "5–7 Arabic words, hero headline",
    "hook": "6–10 Arabic words, supporting line",
    "cta": "2–3 Arabic words, button label",
    "trust": "max 4 Arabic words, ONE trust element",
    "tagline": "2–3 Arabic words under brand mark"
  },
  "image_prompt": "Single 250-500 word English prompt as specified in the system message — this is the EXACT prompt that will be sent to the AI image model. Include all elements: shot type, lens, composition, lighting, hex colors, exact Arabic copy verbatim with rendering instructions, trust badge styling, CTA button styling, brand mark, mood. Make it photographer-level detailed."
}`;

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
      try {
        return JSON.parse(block) as DesignBundle;
      } catch { /* fall through to fallback */ }
    }

    // graceful fallback
    return {
      copy: {
        headline: message || "أدر أعمالك بثقة",
        hook: hook || "محاسبة معتمدة من ZATCA",
        cta: cta || "ابدأ تجربتك",
        trust: trust || "ZATCA-معتمد",
        tagline: "محاسبة سحابية",
      },
      image_prompt: `Editorial close-up of a Saudi product UI screenshot for Qoyod cloud accounting. ${ratio} aspect ratio. Deep navy #021544 background with cyan #17A3A4 accent rim light, dramatic side lighting. Render Arabic headline "${message || "أدر أعمالك بثقة"}" in bold modern Arabic sans-serif, white #FFFFFF, perfectly legible, every letter razor sharp. Trust badge pill with "${trust || "ZATCA-معتمد"}" in cyan fill. Cyan #1FCACB rounded CTA button with text "${cta || "ابدأ تجربتك"}" in navy. Brand mark "قيود" lower-right in cyan. Cinematic photorealistic 8K. No stock, no 3D, no extra text.`,
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
    const { copy, image_prompt } = await generateDesignBundle(
      product, message, hook, cta, trust, concept, art_direction,
      ratio, Number(variant) || 1, scheme, apiKey,
    );

    /* AI image generation — this IS the final ad */
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

    /* Last-resort Satori fallback when both AI providers fail */
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
