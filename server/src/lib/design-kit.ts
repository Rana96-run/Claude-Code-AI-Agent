/**
 * design-kit.ts — TypeScript port of qoyod-design-kit/agent.py.py
 *
 * Pipeline (ZERO SVG, ZERO HTML text overlay):
 *   1. LLM plans the design → DesignPlan JSON
 *   2. build_image_prompt() assembles a full image-gen prompt
 *      (Arabic text described INSIDE the prompt — model renders it natively)
 *   3. Caller passes prompt to Nano Banana 2 / Freepik / GPT Image-1
 *   4. Optional: Pillow-equivalent PNG overlays for pixel-exact elements
 *
 * The image model owns ALL text. No SVG ever touches this pipeline.
 */

/* ── Brand constants ────────────────────────────────────────────── */

export const BRAND_COLORS = {
  navy:       "#0A1F44",
  cyan:       "#00D4C8",
  orange:     "#FF6B35",
  light_blue: "#B8E0F0",
  white:      "#FFFFFF",
};

export const ASPECT_DIMS: Record<string, [number, number]> = {
  "1:1":  [1080, 1080],
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
  "4:5":  [1080, 1350],
};

/* ── Template layouts ───────────────────────────────────────────── */

export const TEMPLATE_LAYOUTS: Record<string, string> = {
  hero_person_right: `\
- Top 40%: Arabic text zone, right-aligned (RTL)
- Bottom 60%: Saudi businessman in traditional dress (white thobe, red shumagh), looking at camera
- Bottom-left: qoyod.com  /  Bottom-right: QOYOD logo`,

  device_showcase_split: `\
- Right 50%: Realistic device mockup (phone/laptop/tablet) showing QOYOD UI
- Left 50%: Headline (top), subheadline (middle), CTA button (bottom)
- Bottom-left: qoyod.com  /  Bottom-right: QOYOD logo`,

  dual_device_hero: `\
- Center-bottom 60%: MacBook + iPhone mockups overlapping, showing QOYOD dashboard
- Top 40%: Headline + subheadline + CTA (right-aligned)
- Bottom corners: qoyod.com (left) + QOYOD logo (right)`,

  illustration_split: `\
- One side 50%: Flat vector illustration in QOYOD brand colors
- Other side 50%: Headline + subheadline + CTA
- Wave/curve shape separates the two zones`,

  full_photo_overlay: `\
- Full-bleed cinematic photo with #0A1F44 70% gradient overlay on top half
- Top 30-40%: Headline + subheadline overlaid on darkened area
- Bottom-right area: ZATCA pill + CTA pill stacked
- Bottom corners: qoyod.com (left) + QOYOD logo (right)`,

  pricing_offer: `\
- Top 30%: Cyan headline + white subheadline (right-aligned)
- Middle-left 40%: Rounded pricing card with new price huge, old price strikethrough
- Right 50%: Saudi person holding phone with app dashboard
- Bottom: qoyod.com + ZATCA logo + QOYOD logo`,

  government_partnership: `\
- Top 15%: ZATCA logo + Arabic authority name centered
- Middle 40%: Two-line bold headline announcement
- Center: iPhone mockup showing ZATCA screen
- Bottom-right: navy rounded card with deadline date in white
- Bottom corners: qoyod.com (left) + QOYOD logo (right)`,

  service_features_card: `\
- Top 25%: Orange headline + white subheadline
- Middle 30%: Three feature pills with check icons (horizontal row)
- Lower 30%: Tablet/laptop mockup with concentric circle pattern
- Bottom 15%: Orange CTA button
- Bottom corners: qoyod.com + service logo + QOYOD logo`,

  bold_typographic: `\
- Top 50%: HUGE 2-3 word cyan typographic headline (possibly underlined)
- Middle 25%: Supporting white subheadline
- Bottom 25%: Device mockup showing QOYOD UI
- Bottom corners: qoyod.com (left) + QOYOD logo (right)`,

  text_dominant_modern: `\
- Top 60%: Multi-line cyan headline, large, stacked vertically
- Middle 15%: White supporting paragraph
- Bottom 25%: Laptop on small platform showing QOYOD dashboard
- Bottom corners: qoyod.com (left) + QOYOD logo (right)`,
};

/* ── DesignPlan data structure ──────────────────────────────────── */

export interface DesignPlan {
  template: keyof typeof TEMPLATE_LAYOUTS;
  aspect_ratio: "1:1" | "9:16" | "16:9" | "4:5";
  headline_ar: string;
  subheadline_ar: string;
  cta_ar: string;
  main_subject: string;
  background_notes: string;
  include_zatca?: boolean;
  pricing?: { new: string; old: string } | null;
  extra_notes?: string;
  model_override?: string | null;
}

/* ── Planner system prompt ──────────────────────────────────────── */

export const PLANNER_SYSTEM_PROMPT = `\
You are the planning brain of the QOYOD design agent. Read the user's brief and return a JSON DesignPlan.

TEMPLATE OPTIONS (pick the most fitting one):
- hero_person_right       — trust-building with a Saudi person
- device_showcase_split   — product feature / UI highlight
- dual_device_hero        — multi-platform pitch
- illustration_split      — educational / how-it-works
- full_photo_overlay      — emotional pain-point / testimonial
- pricing_offer           — discount / special package
- government_partnership  — ZATCA compliance / official news
- service_features_card   — service benefits list
- bold_typographic        — urgent CTA / announcement
- text_dominant_modern    — brand statement / mission

TEMPLATE SELECTION GUIDE:
trust / human connection → hero_person_right
product UI / feature     → device_showcase_split
multi-platform           → dual_device_hero
educational              → illustration_split
pain point / story       → full_photo_overlay
discount / offer         → pricing_offer
ZATCA / compliance       → government_partnership
service benefits         → service_features_card
urgent announcement      → bold_typographic
brand statement          → text_dominant_modern

Return ONLY a JSON object with these exact fields:
{
  "template": "<one of the 10 template names above>",
  "aspect_ratio": "1:1" | "9:16" | "16:9" | "4:5",
  "headline_ar": "3-7 word Arabic headline, punchy, Saudi style",
  "subheadline_ar": "6-12 word Arabic subheadline",
  "cta_ar": "2-4 word Arabic call to action",
  "main_subject": "Detailed English description of the focal visual (person/device/illustration) — pose, expression, clothing, lighting",
  "background_notes": "Background colour, gradient, decorative elements",
  "include_zatca": true if design relates to tax/zakat/compliance,
  "pricing": {"new": "2,211 ﷼", "old": "3,300"} only if brief mentions a discount, otherwise null,
  "extra_notes": "any special instructions",
  "model_override": null
}

CRITICAL: never suggest SVG, HTML, or code-rendered text. The image model renders ALL text. Your only job is planning.

Return ONLY the JSON object, no commentary, no markdown.`;

/* ── Prompt builder ─────────────────────────────────────────────── */

export function buildImagePrompt(plan: DesignPlan): string {
  const [width, height] = ASPECT_DIMS[plan.aspect_ratio] ?? [1080, 1080];
  const layout = TEMPLATE_LAYOUTS[plan.template] ?? TEMPLATE_LAYOUTS.hero_person_right;

  const pricingBlock = plan.pricing
    ? `
- PRICING CARD (middle-left, rounded rectangle on transparent dark background):
    * Top line, medium white: "الآن بـ"
    * Huge bold white number: "${plan.pricing.new}"
    * Below, smaller white: descriptive line
    * Bottom, small grey with red strikethrough: "بدلاً من ${plan.pricing.old}"
`
    : "";

  const zatcaBlock = plan.include_zatca
    ? `- Small ZATCA partnership pill above CTA: dark navy bg, white text "معتمد ZATCA"\n- Bottom-center: ZATCA Authority official logo\n`
    : "";

  return `Professional Saudi Arabic social media advertisement, ${plan.aspect_ratio} aspect ratio, ${width}x${height} pixels.

LAYOUT — ${plan.template}:
${layout}

ARABIC TEXT (render INSIDE the image with proper right-to-left flow, naturally connected letters, normal word spacing, no broken characters):

- HEADLINE (top, very large, cyan ${BRAND_COLORS.cyan}, extra-bold Arabic display typeface like 29LT Bukra ExtraBold or IBM Plex Sans Arabic Black):
  "${plan.headline_ar}"

- SUBHEADLINE (below headline, medium size, white ${BRAND_COLORS.white}, medium-weight Arabic typeface like Tajawal Medium):
  "${plan.subheadline_ar}"

- CTA BUTTON (pill-shaped, cyan ${BRAND_COLORS.cyan} background, navy ${BRAND_COLORS.navy} Arabic text, medium-bold):
  "${plan.cta_ar}"
${pricingBlock}${zatcaBlock}
MAIN SUBJECT:
${plan.main_subject}

BACKGROUND:
${plan.background_notes}

BRANDING:
- Bottom-left corner: small white text "qoyod.com" in clean sans-serif
- Bottom-right corner: white "QOYOD" wordmark logo, modern geometric sans

STYLE: Premium Saudi fintech advertisement, photorealistic where applicable, sharp focus, professional studio lighting, clean modern composition, authentic Saudi cultural context. Strict palette: navy ${BRAND_COLORS.navy}, cyan ${BRAND_COLORS.cyan}, white ${BRAND_COLORS.white}, light blue ${BRAND_COLORS.light_blue}.

AVOID: broken Arabic letters, disconnected characters, left-to-right Arabic, romanized text, excessive word spacing, justified text alignment, generic stock photo look, AI artifacts on faces or hands, illegible typography, incorrect or paraphrased Arabic, low-quality rendering, fake-looking devices.

${plan.extra_notes ?? ""}`.trim();
}

/* ── LLM planner ────────────────────────────────────────────────── */

/**
 * Call Claude to convert a user brief into a DesignPlan JSON.
 * Falls back to a sensible default if parsing fails.
 */
export async function planDesign(
  userBrief: string,
  anthropicKey: string,
  model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
): Promise<DesignPlan> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 30_000);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.7,
        system: PLANNER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userBrief }],
      }),
    });

    const raw = await r.text();
    const parsed = JSON.parse(raw) as { content?: Array<{ text?: string }> };
    const text = (parsed.content?.[0]?.text ?? "").replace(/```json\n?|\n?```/g, "").trim();

    // Extract JSON object
    const fi = text.indexOf("{");
    const li = text.lastIndexOf("}");
    if (fi >= 0 && li > fi) {
      const plan = JSON.parse(text.slice(fi, li + 1)) as DesignPlan;
      // Validate template exists
      if (!TEMPLATE_LAYOUTS[plan.template]) plan.template = "hero_person_right";
      return plan;
    }
  } catch (err) {
    // fall through to default
  } finally {
    clearTimeout(timeout);
  }

  // Default fallback plan
  return {
    template: "device_showcase_split",
    aspect_ratio: "1:1",
    headline_ar: "أدر أعمالك بثقة",
    subheadline_ar: "محاسبة سحابية معتمدة من ZATCA لكل الأعمال السعودية",
    cta_ar: "ابدأ مجاناً",
    main_subject: "Photorealistic iPhone and laptop showing QOYOD accounting dashboard with Arabic UI, floating on clean surface, soft studio lighting",
    background_notes: `Deep navy ${BRAND_COLORS.navy} with subtle cyan glow`,
    include_zatca: false,
    pricing: null,
    extra_notes: "",
  };
}

/* ── Nano Banana 2 image generation ────────────────────────────── */

/**
 * Generate a complete design image using Gemini image model.
 * Returns base64-encoded PNG string.
 *
 * model: "gemini-2.5-flash-preview-05-20" = Nano Banana (available now)
 *        "gemini-3-pro-image"              = Nano Banana 2 (use when released)
 */
export async function generateWithNanoBanana(
  prompt: string,
  aspectRatio: string,
  geminiKey: string,
  modelId = "gemini-2.0-flash-preview-image-generation",
): Promise<{ base64: string; mimeType: string }> {
  const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.85,
    },
  };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 90_000);

  try {
    const r = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Gemini ${r.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };

    const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imgPart?.inlineData) {
      throw new Error("Nano Banana returned no image data");
    }

    return { base64: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Full pipeline ──────────────────────────────────────────────── */

export interface DesignKitResult {
  png: string;          // data:image/png;base64,...
  plan: DesignPlan;
  imagePrompt: string;
  model: string;
}

export async function runDesignKitPipeline(opts: {
  userBrief: string;
  anthropicKey: string;
  geminiKey: string;
  model?: string;
}): Promise<DesignKitResult> {
  const { userBrief, anthropicKey, geminiKey, model = "gemini-2.0-flash-preview-image-generation" } = opts;

  // Step 1: LLM plans the design
  const plan = await planDesign(userBrief, anthropicKey);

  // Step 2: Build the full image prompt
  const imagePrompt = buildImagePrompt(plan);

  // Step 3: Generate the complete design as a single image
  const { base64, mimeType } = await generateWithNanoBanana(imagePrompt, plan.aspect_ratio, geminiKey, model);

  return {
    png: `data:${mimeType};base64,${base64}`,
    plan,
    imagePrompt,
    model,
  };
}
