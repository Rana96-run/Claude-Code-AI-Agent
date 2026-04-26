import { Router } from "express";

const router = Router();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

/* ── Canvas dimensions per ratio ─────────────────────────────── */
const RATIO_DIMS: Record<string, [number, number]> = {
  "1:1":  [1080, 1080],
  "4:5":  [1080, 1350],
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
};

/* ── Text content filled by Claude ───────────────────────────── */
interface AdContent {
  headline: string;   // 2–4 words, hero text
  hook: string;       // 6–10 words, supporting line
  cta: string;        // 2–3 words, button label
  trust: string;      // badge text (ZATCA Phase 2 / +25,000 شركة)
  tagline: string;    // under logo, 2–3 words
}

/* Step 1 — let Claude produce ONLY the Arabic copy, nothing else */
async function generateAdText(
  product: string,
  message: string,
  hook: string,
  cta: string,
  trust: string,
  concept: string,
  apiKey: string,
  variant = 1,
): Promise<AdContent> {
  // Each variant gets a different angle so multiple variants don't read identically
  const ANGLES = [
    "direct/benefit-driven — emphasise the outcome the user gets",
    "fear/loss — what they avoid by using Qoyod (penalties, manual work, errors)",
    "time/speed — speed and ease, minutes not hours",
    "social proof — joining 25,000+ Saudi businesses",
    "control/clarity — peace of mind, full visibility",
    "before/after — the transformation",
  ];
  const angle = ANGLES[(variant - 1) % ANGLES.length];

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 25_000); // 25s guard
  let r: Response;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.9, // higher temp + variant angle = real diversity
      system:
        "You write concise Arabic Saudi-dialect ad copy for Qoyod (ZATCA-certified Saudi cloud accounting). Saudi dialect ONLY (مو/وش/ليش — never Egyptian). NO emojis anywhere in the output. Return ONLY valid JSON with no markdown, no explanation.",
      messages: [
        {
          role: "user",
          content: `Write short ad copy elements for a ${product} ad. Variant ${variant}.
Main message: "${message}"
Concept (this variant only): "${concept}"
Variant angle: ${angle}
Hook hint: "${hook}"
CTA hint: "${cta}"
Trust element: "${trust}"

Make this variant DISTINCT from other variants by leaning into the variant angle above. Vary headline word choice and hook framing accordingly. NO emojis.

Return JSON:
{
  "headline": "2-4 Arabic words, punchy hero headline",
  "hook": "6-10 Arabic words, benefit-driven supporting line",
  "cta": "2-3 Arabic words for the button",
  "trust": "badge text, max 4 Arabic words (e.g. زاتكا المرحلة الثانية / +25,000 شركة)",
  "tagline": "2-3 Arabic words under the logo"
}`,
        },
      ],
    }),
  });
  } finally {
    clearTimeout(timeout);
  }
  const data = (await r!.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const raw = data.content?.[0]?.text ?? "";
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
    const fi = clean.indexOf("{");
    const li = clean.lastIndexOf("}");
    return JSON.parse(clean.slice(fi, li + 1)) as AdContent;
  } catch {
    return {
      headline: message || "أدِر أعمالك بذكاء",
      hook: hook || "فاتورة إلكترونية متوافقة مع زاتكا",
      cta: cta || "ابدأ مجاناً",
      trust: trust || "زاتكا المرحلة الثانية",
      tagline: "محاسبة سحابية",
    };
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
const FONT =
  "'IBM Plex Sans Arabic','Segoe UI','Tahoma','Arial',sans-serif";

function txt(
  x: number,
  y: number,
  content: string,
  opts: {
    size: number;
    weight?: number | string;
    fill?: string;
    anchor?: string;
    opacity?: number;
    baseline?: string;
  }
): string {
  const {
    size,
    weight = 400,
    fill = "#FFFFFF",
    anchor = "middle",
    opacity = 1,
    baseline = "auto",
  } = opts;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" direction="rtl" dominant-baseline="${baseline}" opacity="${opacity}">${escXML(content)}</text>`;
}

function escXML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ctaBtn(
  cx: number,
  cy: number,
  label: string,
  teal: string,
  bw = 320,
  bh = 72,
  fs = 32,
  textColor = "#FFFFFF"
): string {
  const rx = bh / 2;
  return `
  <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${rx}" fill="${teal}"/>
  ${txt(cx, cy, label, { size: fs, weight: 700, fill: textColor, anchor: "middle", baseline: "middle" })}`;
}

function trustBadge(
  cx: number,
  cy: number,
  label: string,
  teal: string,
  bw = 220,
  bh = 44,
  fs = 19
): string {
  return `
  <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${teal}" opacity="0.18"/>
  <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="none" stroke="${teal}" stroke-width="1.5"/>
  ${txt(cx, cy, label, { size: fs, fill: teal, anchor: "middle", baseline: "middle" })}`;
}

/** High-contrast trust badge: solid fill + readable text. */
function trustBadgeFilled(
  cx: number, cy: number,
  label: string,
  fill: string, textColor: string,
  bw = 340, bh = 56, fs = 22,
): string {
  return `
  <rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${fill}"/>
  ${txt(cx, cy, label, { size: fs, weight: 600, fill: textColor, anchor: "middle", baseline: "middle" })}`;
}

function topBar(w: number, teal: string): string {
  return `<rect x="0" y="0" width="${w}" height="6" fill="${teal}" opacity="0.8"/>`;
}

function brandMark(
  x: number,
  y: number,
  teal: string,
  size = 40,
  anchor = "end"
): string {
  return txt(x, y, "قيود", {
    size,
    weight: 800,
    fill: teal,
    anchor,
  });
}

/* ── Color schemes ────────────────────────────────────────────── */
interface ColorScheme {
  bg: string;       // background fill
  bg2: string;      // secondary bg (glow / shape tint)
  accent: string;   // dividers, brand name, lines
  cta_fill: string; // CTA button fill (brighter for prominence)
  headline: string; // hero headline text
  body: string;     // hook + tagline text
  cta_text: string; // text inside CTA button
  trust_fill: string;   // trust badge fill
  trust_text: string;   // trust badge text (high contrast over fill)
  name: string;
}

/* Brand colors: navy #021544, teal #17A3A4, deep #01355A.
   For CTAs we use a slightly brighter teal #1ABABB for visibility on dark backgrounds.
   Trust badges use solid filled teal with white text for readability. */

const SCHEMES: Record<string, ColorScheme> = {
  /* ── 1. Navy (default dark) ── */
  navy: {
    name: "navy",
    bg: "#021544", bg2: "#17A3A4",
    accent: "#17A3A4",
    cta_fill: "#1FCACB", cta_text: "#021544",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  /* ── 2. Teal — vibrant inverted ── */
  teal: {
    name: "teal",
    bg: "#17A3A4", bg2: "#021544",
    accent: "#021544",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#02265B",
    trust_fill: "#021544", trust_text: "#FFFFFF",
  },
  /* ── 3. Ocean — deep blue-green ── */
  ocean: {
    name: "ocean",
    bg: "#01355A", bg2: "#17A3A4",
    accent: "#17A3A4",
    cta_fill: "#1FCACB", cta_text: "#01355A",
    headline: "#FFFFFF", body: "#A8E6E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  /* ── 4. Light — clean white ── */
  light: {
    name: "light",
    bg: "#F4FBFB", bg2: "#17A3A4",
    accent: "#17A3A4",
    cta_fill: "#17A3A4", cta_text: "#FFFFFF",
    headline: "#021544", body: "#01355A",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  /* ── 5. Midnight — near-black deep navy ── */
  midnight: {
    name: "midnight",
    bg: "#050E24", bg2: "#17A3A4",
    accent: "#17A3A4",
    cta_fill: "#22D4D5", cta_text: "#050E24",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  /* ── 6. Slate — cool grey-blue ── */
  slate: {
    name: "slate",
    bg: "#1A2B4A", bg2: "#17A3A4",
    accent: "#17A3A4",
    cta_fill: "#1FCACB", cta_text: "#1A2B4A",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
};

const SCHEME_ORDER = ["navy", "teal", "ocean", "light", "midnight", "slate"] as const;

/** Resolve scheme: named key > custom hex pair > auto-rotate */
function resolveScheme(
  color_scheme?: string,
  color_accent?: string,
): ColorScheme {
  if (color_scheme && SCHEMES[color_scheme]) return SCHEMES[color_scheme];
  if (color_scheme === "auto") {
    const idx = Math.floor(Date.now() / 600_000) % SCHEME_ORDER.length;
    return SCHEMES[SCHEME_ORDER[idx]];
  }
  if (color_accent) {
    return { ...SCHEMES.navy, accent: color_accent, bg2: color_accent };
  }
  return SCHEMES.navy;
}

/* ── Step 2 — pixel-perfect SVG templates ────────────────────── */

function renderSVG(
  ratio: string,
  c: AdContent,
  scheme: ColorScheme,
): string {
  const BG = scheme.bg;
  const T  = scheme.accent;
  const CB = scheme.cta_fill;     // CTA button fill (brighter)
  const CT = scheme.cta_text;     // CTA button text
  const HL = scheme.headline;
  const BD = scheme.body;
  const TF = scheme.trust_fill;   // Trust badge fill (solid)
  const TT = scheme.trust_text;   // Trust badge text
  const G  = scheme.bg2;
  const [w, h] = RATIO_DIMS[ratio] ?? [1080, 1080];
  const cx = w / 2;

  // For light scheme, use darker tone for borders
  const borderOpacity = scheme.name === "light" ? "0.12" : "0.18";

  /* ── 1:1  (1080 × 1080) ─ Instagram Square ──────────────────── */
  if (ratio === "1:1") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <!-- Background -->
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <!-- Decorative arcs -->
  <circle cx="${w}" cy="0" r="520" fill="${G}" opacity="0.10"/>
  <circle cx="${w}" cy="0" r="320" fill="${G}" opacity="0.08"/>
  <circle cx="0" cy="${h}" r="380" fill="${G}" opacity="0.06"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${w}" height="10" rx="0" fill="${T}"/>
  <!-- Left accent stripe -->
  <rect x="60" y="180" width="7" height="200" rx="3.5" fill="${T}"/>
  <!-- Brand block top-right -->
  ${txt(w - 70, 80, "قيود", { size: 52, weight: 800, fill: T, anchor: "end" })}
  ${txt(w - 70, 112, c.tagline, { size: 20, fill: BD, anchor: "end", opacity: 0.75 })}
  <!-- Headline -->
  ${txt(cx, 380, c.headline, { size: 100, weight: 800, fill: HL, anchor: "middle", baseline: "middle" })}
  <!-- Divider -->
  <line x1="160" y1="440" x2="${w - 160}" y2="440" stroke="${T}" stroke-width="2" opacity="0.35"/>
  <!-- Hook -->
  ${txt(cx, 500, c.hook, { size: 36, fill: BD, anchor: "middle" })}
  <!-- CTA button -->
  ${ctaBtn(cx, 630, c.cta, CB, 380, 88, 38, CT)}
  <!-- Trust badge -->
  ${trustBadgeFilled(cx, 770, c.trust, TF, TT, 340, 52, 22)}
  <!-- Bottom pip -->
  <rect x="${cx - 50}" y="${h - 20}" width="100" height="6" rx="3" fill="${T}" opacity="0.5"/>
</svg>`;
  }

  /* ── 4:5  (1080 × 1350) ─ Instagram Portrait ─────────────────── */
  if (ratio === "4:5") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <!-- Decorative arcs -->
  <circle cx="${w}" cy="0" r="600" fill="${G}" opacity="0.10"/>
  <circle cx="${w}" cy="0" r="360" fill="${G}" opacity="0.07"/>
  <circle cx="0" cy="${h}" r="480" fill="${G}" opacity="0.06"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${w}" height="10" fill="${T}"/>
  <!-- Left accent stripe -->
  <rect x="60" y="220" width="7" height="240" rx="3.5" fill="${T}"/>
  <!-- Brand block -->
  ${txt(w - 70, 90, "قيود", { size: 56, weight: 800, fill: T, anchor: "end" })}
  ${txt(w - 70, 126, c.tagline, { size: 22, fill: BD, anchor: "end", opacity: 0.75 })}
  <!-- Headline -->
  ${txt(cx, 520, c.headline, { size: 108, weight: 800, fill: HL, anchor: "middle", baseline: "middle" })}
  <!-- Divider -->
  <line x1="140" y1="590" x2="${w - 140}" y2="590" stroke="${T}" stroke-width="2" opacity="0.35"/>
  <!-- Hook -->
  ${txt(cx, 650, c.hook, { size: 38, fill: BD, anchor: "middle" })}
  <!-- CTA button -->
  ${ctaBtn(cx, 810, c.cta, CB, 420, 96, 40, CT)}
  <!-- Trust badge -->
  ${trustBadgeFilled(cx, 960, c.trust, TF, TT, 380, 56, 24)}
  <!-- Bottom pip -->
  <rect x="${cx - 55}" y="${h - 24}" width="110" height="7" rx="3.5" fill="${T}" opacity="0.5"/>
</svg>`;
  }

  /* ── 9:16  (1080 × 1920) ─ Stories / Reels ──────────────────── */
  if (ratio === "9:16") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <circle cx="${w}" cy="0" r="700" fill="${G}" opacity="0.09"/>
  <circle cx="${w}" cy="0" r="440" fill="${G}" opacity="0.07"/>
  <circle cx="0" cy="${h}" r="600" fill="${G}" opacity="0.06"/>
  <circle cx="${cx}" cy="${h * 0.5}" r="700" fill="${G}" opacity="0.03"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${w}" height="12" fill="${T}"/>
  <!-- Left accent stripe -->
  <rect x="70" y="280" width="8" height="300" rx="4" fill="${T}"/>
  <!-- Brand block -->
  ${txt(w - 80, 110, "قيود", { size: 64, weight: 800, fill: T, anchor: "end" })}
  ${txt(w - 80, 152, c.tagline, { size: 26, fill: BD, anchor: "end", opacity: 0.75 })}
  <!-- Headline -->
  ${txt(cx, 760, c.headline, { size: 120, weight: 800, fill: HL, anchor: "middle", baseline: "middle" })}
  <!-- Divider -->
  <line x1="160" y1="840" x2="${w - 160}" y2="840" stroke="${T}" stroke-width="2.5" opacity="0.35"/>
  <!-- Hook -->
  ${txt(cx, 920, c.hook, { size: 44, fill: BD, anchor: "middle" })}
  <!-- CTA button -->
  ${ctaBtn(cx, 1110, c.cta, CB, 480, 110, 46, CT)}
  <!-- Trust badge -->
  ${trustBadgeFilled(cx, 1280, c.trust, TF, TT, 440, 64, 26)}
  <rect x="${cx - 60}" y="${h - 30}" width="120" height="8" rx="4" fill="${T}" opacity="0.5"/>
</svg>`;
  }

  /* ── 16:9  (1920 × 1080) ─ YouTube / LinkedIn Banner ─────────── */
  if (ratio === "16:9") {
    const rEdge = w - 90;
    const rCX   = w * 0.73;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <!-- Left illustration circles -->
  <circle cx="${w * 0.25}" cy="${h / 2}" r="${h * 0.62}" fill="${G}" opacity="0.09"/>
  <circle cx="${w * 0.25}" cy="${h / 2}" r="${h * 0.40}" fill="${G}" opacity="0.08"/>
  <circle cx="${w * 0.25}" cy="${h / 2}" r="${h * 0.20}" fill="${G}" opacity="0.12"/>
  <!-- Vertical divider -->
  <line x1="${w * 0.5}" y1="50" x2="${w * 0.5}" y2="${h - 50}" stroke="${T}" stroke-width="2" opacity="0.2"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${w}" height="10" fill="${T}"/>
  <!-- Brand block right side -->
  ${txt(rEdge, 90, "قيود", { size: 58, weight: 800, fill: T, anchor: "end" })}
  ${txt(rEdge, 126, c.tagline, { size: 24, fill: BD, anchor: "end", opacity: 0.75 })}
  <!-- Headline right-aligned -->
  ${txt(rEdge, 380, c.headline, { size: 108, weight: 800, fill: HL, anchor: "end", baseline: "middle" })}
  <!-- Divider line right side -->
  <line x1="${w * 0.52}" y1="440" x2="${rEdge}" y2="440" stroke="${T}" stroke-width="2" opacity="0.35"/>
  <!-- Hook right-aligned -->
  ${txt(rEdge, 500, c.hook, { size: 38, fill: BD, anchor: "end" })}
  <!-- CTA button right-aligned -->
  <rect x="${rEdge - 380}" y="580" width="380" height="96" rx="48" fill="${CB}"/>
  ${txt(rEdge - 190, 628, c.cta, { size: 40, weight: 700, fill: CT, anchor: "middle", baseline: "middle" })}
  <!-- Trust badge right-aligned -->
  ${trustBadgeFilled(rEdge - 190, 740, c.trust, TF, TT, 380, 56, 22)}
  <rect x="${rEdge - 60}" y="${h - 22}" width="120" height="6" rx="3" fill="${T}" opacity="0.5"/>
</svg>`;
  }

  return renderSVG("1:1", c, scheme);
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
    variant = 1,
    color_scheme,
    color_accent,
  } = req.body ?? {};

  const [w, h] = RATIO_DIMS[ratio] ?? [1080, 1080];
  const scheme = resolveScheme(color_scheme, color_accent);

  try {
    const content = await generateAdText(product, message, hook, cta, trust, concept, apiKey, Number(variant) || 1);
    const svg = renderSVG(ratio, content, scheme);
    res.status(200).json({ svg, width: w, height: h, content, scheme: scheme.name });
  } catch (err) {
    console.error("[generate-design] error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

export default router;
