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
import { generateHeroImage, generateHeroVideo, type ImageProvider } from "../lib/image-gen.js";
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
  QOYOD_PERSONAS,
  QOYOD_SECTOR_CONTEXT,
  IDEAL_DESIGN_REFERENCE,
  QOYOD_CLASSIC_STYLE,
  QOYOD_BOOKKEEPING_CONTEXT,
  QOYOD_MAIN_VISUAL_STYLES,
  QOYOD_UNIFIED_DESIGN_SYSTEM,
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

/* Provider-specific tuning — each model has different strengths.
   spaceHint: where to leave empty space for text overlay.
   - "right"  → square/landscape dark: text lives on right
   - "top"    → square/portrait light: text lives at top
   - "bottom" → portrait dark: text lives at bottom
*/
function tuneForProvider(
  scenePrompt: string,
  provider: ImageProvider,
  spaceHint: "right" | "top" | "bottom" = "right",
): string {
  const base = scenePrompt.trim();
  const spaceStr =
    spaceHint === "top"    ? "Leave the TOP portion of the frame completely empty / clean gradient — copy will be added in post-production above the device" :
    spaceHint === "bottom" ? "Leave the BOTTOM portion of the frame empty — copy will be composited in post" :
                             "Leave clear empty space on the RIGHT side — copy will be added in post-production";

  if (provider === "gpt-image") {
    return `${base}

Style guidance for this rendering:
- Editorial commercial photography, premium fintech magazine aesthetic
- Sharp focus on the visual subject, shallow depth of field
- Clean studio-style or environmental lighting
- Saudi business context — modest professional dress if a person is shown
- Photorealistic, NOT illustrated
- No text, no logos, no watermarks anywhere in the frame
- ${spaceStr}`;
  }
  if (provider === "nanobanana") {
    return `${base}

Style guidance for this rendering:
- Cinematic still frame, premium financial brand campaign
- Volumetric lighting, soft haze, subtle bokeh
- Saudi business context — authentic, modest, professional
- 8K, depth, atmosphere
- Render with NO text, NO logos, NO watermarks anywhere in the image
- ${spaceStr}`;
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
  persona: string,
  sector: string,
): Promise<DesignBundle> {
  const angle = ANGLES[(variant - 1) % ANGLES.length];

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 35_000);

  /* Claude is asked for a SCENE-ONLY prompt — no Arabic text in the image.
     Arabic text will be composited correctly by Satori in post-production. */
  /* Detect bookkeeping product to inject sub-brand context */
  const isBookkeeping = /bookkeeping|مسك|دفاتر/i.test(product);

  const sys = `You are the Qoyod AI Graphic Designer. You produce a 250-400 word English image prompt for an AI image model that paints the VISUAL SCENE for a Qoyod social media ad. The Arabic copy is added in post-production with proper typography — DO NOT instruct the model to render Arabic text in the image.

${QOYOD_UNIFIED_DESIGN_SYSTEM}

${QOYOD_BRAND_PLAYBOOK}

${QOYOD_CREATIVE_RULES}

${QOYOD_HEADLINE_PATTERNS}

${isBookkeeping ? `THIS IS A BOOKKEEPING SUB-BRAND DESIGN — apply these specific guidelines:\n${QOYOD_BOOKKEEPING_CONTEXT}` : ""}

${persona ? QOYOD_PERSONAS + `\n\nFOR THIS DESIGN — TARGET PERSONA: ${persona}` : ""}

${sector ? QOYOD_SECTOR_CONTEXT + `\n\nFOR THIS DESIGN — TARGET SECTOR: ${sector}` : ""}

QOYOD VISUAL STYLE GUIDE — production-approved styles:
${QOYOD_MAIN_VISUAL_STYLES}

DESIGN REFERENCES — use these as inspiration, not rigid templates. Evolve, mix, and subvert as the concept demands:

REFERENCE 1 — Cinematic photo-based (high drama):
${IDEAL_DESIGN_REFERENCE}

REFERENCE 2 — Classic Qoyod gradient (copy-led, clean):
${QOYOD_CLASSIC_STYLE}

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
    "headline": "EXACTLY 4-6 Arabic words. HARD LIMIT. Single complete phrase. Calm, direct, confident. NO em-dashes, NO commas, NO ellipsis, NO joining hook+headline. Just the hero headline alone.",
    "hook": "EXACTLY 6-9 Arabic words supporting line. Separate from headline.",
    "cta": "EXACTLY 2-3 Arabic words, button label only (اشترك الآن / احجز ديمو / ابدأ تجربتك)",
    "trust": "SHORT trust label. Keep Latin acronyms as Latin — do NOT transliterate into Arabic letters. Good examples: ZATCA-معتمد | SOCPA-معتمد | +25,000 شركة | فاتورة إلكترونية معتمدة. MAX 5 tokens.",
    "tagline": "EXACTLY 2-3 Arabic words, under brand mark"
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
    persona = "",        // P1..P6 or persona description (optional)
    sector = "",         // retail / f&b / construction / e-commerce / healthcare / enterprise / bookkeeping
    visual_style = "",   // device_dashboard / 2d_character / Before_After / Saudi_Person / etc.
  } = req.body ?? {};

  const [w, h] = RATIO_DIMS[ratio] ?? [1080, 1080];
  /* Auto-apply bookkeeping scheme when no scheme explicitly chosen and product is bookkeeping */
  const isBookkeepingProduct = /bookkeeping|مسك|دفاتر/i.test(String(product));
  const effectiveScheme = color_scheme || (isBookkeepingProduct ? "bookkeeping" : undefined);
  const scheme = resolveScheme(effectiveScheme);

  try {
    /* 1. Claude → copy + scene-only image prompt */
    /* If user picked an explicit visual style, fold it into art_direction
       so Claude leans the scene that way. */
    const VISUAL_STYLE_HINTS: Record<string, string> = {
      device_dashboard: "laptop or tablet showing Qoyod dashboard UI, clean studio product shot on a light gradient background — NO people, device floating on clean surface, plenty of empty space for text overlay",
      "2d_character": "minimal 2D flat illustration with one Saudi character, clean vector style, light gradient background",
      Before_After: "split-screen before/after — chaos vs calm, dramatic lighting contrast",
      Saudi_Person: "editorial portrait of a Saudi business owner, modest professional dress, soft natural light",
      mockup_light: "MacBook Pro laptop angled at 15 degrees showing a financial dashboard UI on screen, placed on a clean white surface. Background is a soft light cyan-to-white gradient (#D6F4F9 top to #FFFFFF bottom). Studio product photography lighting, no shadows, ultra-clean minimal composition. NO people, NO text overlays, NO logos on devices. The bottom 55% of the frame is filled with the device mockup; the TOP 45% is left completely empty/clean gradient — this space is reserved for typography that will be composited in post.",
      mockup_dark: "MacBook Pro laptop angled at 15 degrees showing a Qoyod financial dashboard on screen, placed on a deep navy #021544 surface. Dramatic cyan #17A3A4 rim light from upper left. Premium dark product photography. Bottom 55% is the device; top 45% is clear dark navy — reserved for text overlay in post.",
    };
    /* Light schemes should bias toward device mockup / clean bg style */
    const isLightSch = ["light_cyan","light_purple","light"].includes(scheme.name);
    const autoStyleHint = isLightSch && !visual_style ? "mockup_light" : visual_style;
    const styleHint = autoStyleHint && VISUAL_STYLE_HINTS[autoStyleHint]
      ? `${VISUAL_STYLE_HINTS[autoStyleHint]}. ${art_direction || ""}`.trim()
      : art_direction;
    const { copy, image_prompt } = await generateDesignBundle(
      product, message, hook, cta, trust, concept, styleHint,
      ratio, Number(variant) || 1, scheme, apiKey,
      String(persona), String(sector),
    );

    /* 2. AI → render the scene (per-provider tuning) */
    const isVeo = image_provider === "veo2" || image_provider === "veo3";
    /* For light schemes, append a hard reminder to keep the bg clean */
    const lightScheme = ["light_cyan","light_purple","light"].includes(scheme.name);
    const promptWithSchemeHint = lightScheme
      ? `${image_prompt}\n\nCRITICAL: This design uses a LIGHT background. The scene must have a clean, light gradient background (cyan-to-white or lavender-to-white). NO dark backgrounds. Leave the top portion of the frame completely empty/clear for text overlay.`
      : image_prompt;
    /* Space hint — where the text overlay will live so the AI leaves that zone clean:
       - Light 1:1 / light portrait / dark portrait → text at TOP
       - Dark 16:9 / dark 1:1 → text on RIGHT
    */
    const isPortraitRatio = ratio === "9:16" || ratio === "4:5";
    const spaceHint =
      lightScheme && ratio !== "16:9" ? "top" :
      isPortraitRatio ? "top" :
      "right";

    const tunedPrompt = tuneForProvider(
      promptWithSchemeHint,
      (image_provider === "auto" ? "auto" : image_provider) as ImageProvider,
      spaceHint,
    );

    /* Veo generates video — return raw video, no Satori text compositing */
    if (isVeo) {
      const vid = await generateHeroVideo(tunedPrompt, image_provider as "veo2" | "veo3", ratio);
      res.status(200).json({
        video: vid?.dataUrl ?? null,
        content: copy,
        image_prompt,
        provider: vid?.provider ?? null,
        scheme: scheme.name,
        rendered_via: vid ? "veo-video-only" : "veo-failed",
      });
      return;
    }

    const ai = await generateHeroImage(tunedPrompt, image_provider as ImageProvider, ratio);

    /* 3. Satori → composite Arabic text + brand + qoyod.com over the scene */
    const out = await renderDesign({
      copy,
      scheme,
      ratio,
      heroImageDataUrl: ai?.dataUrl ?? null,
      product,
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
