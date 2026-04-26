/**
 * Design Renderer — composes a real social-media-quality PNG using:
 *   1. Claude-generated copy
 *   2. Nano Banana / GPT-Image hero image
 *   3. Satori (JSX → SVG) + resvg (SVG → PNG)
 *
 * No browser, no Chromium. Runs natively on Railway.
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { logger } from "./logger.js";
import { getBrandLogoDataUrlSync } from "./brand-assets.js";

/* ── Font loader (cached at module level) ──────────────────────── */

interface FontEntry {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
}

let FONTS: FontEntry[] | null = null;
let fontLoadPromise: Promise<FontEntry[]> | null = null;

/**
 * Try Lama Sans first (Qoyod's brand font, via fontsource on jsdelivr),
 * fall back to IBM Plex Sans Arabic. Satori only accepts TTF/OTF/WOFF.
 */
const LAMA_SANS_URLS: Record<400 | 600 | 700, string> = {
  400: "https://cdn.jsdelivr.net/npm/@fontsource/lama-sans@5/files/lama-sans-arabic-400-normal.woff",
  600: "https://cdn.jsdelivr.net/npm/@fontsource/lama-sans@5/files/lama-sans-arabic-600-normal.woff",
  700: "https://cdn.jsdelivr.net/npm/@fontsource/lama-sans@5/files/lama-sans-arabic-700-normal.woff",
};

const IBM_PLEX_URLS: Record<400 | 600 | 700, string> = {
  400: "https://cdn.jsdelivr.net/gh/IBM/plex@master/packages/plex-sans-arabic/fonts/complete/ttf/IBMPlexSansArabic-Regular.ttf",
  600: "https://cdn.jsdelivr.net/gh/IBM/plex@master/packages/plex-sans-arabic/fonts/complete/ttf/IBMPlexSansArabic-SemiBold.ttf",
  700: "https://cdn.jsdelivr.net/gh/IBM/plex@master/packages/plex-sans-arabic/fonts/complete/ttf/IBMPlexSansArabic-Bold.ttf",
};

async function fetchTtf(url: string): Promise<ArrayBuffer> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`Font fetch HTTP ${r.status} for ${url}`);
    return await r.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
}

async function tryLoadFamily(
  name: string,
  urls: Record<400 | 600 | 700, string>,
): Promise<FontEntry[] | null> {
  try {
    const weights: Array<400 | 600 | 700> = [400, 600, 700];
    const buffers = await Promise.all(weights.map((w) => fetchTtf(urls[w])));
    return weights.map((weight, i) => ({
      name,
      data: buffers[i],
      weight,
      style: "normal" as const,
    }));
  } catch (e) {
    logger.warn({ family: name, err: String(e) }, "design-renderer: family load failed");
    return null;
  }
}

async function loadFonts(): Promise<FontEntry[]> {
  if (FONTS) return FONTS;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    logger.info("design-renderer: loading fonts (Lama Sans → IBM Plex)");
    /* Try Qoyod's brand font first, fall back to IBM Plex Sans Arabic */
    let entries = await tryLoadFamily("Lama Sans", LAMA_SANS_URLS);
    let family = "Lama Sans";
    if (!entries) {
      entries = await tryLoadFamily("IBM Plex Sans Arabic", IBM_PLEX_URLS);
      family = "IBM Plex Sans Arabic";
    }
    if (!entries) {
      throw new Error("Could not load any Arabic font (Lama Sans or IBM Plex)");
    }
    FONTS = entries;
    logger.info(
      { family, count: entries.length, total_kb: Math.round(entries.reduce((s, e) => s + e.data.byteLength, 0) / 1024) },
      "design-renderer: fonts loaded",
    );
    return entries;
  })();

  return fontLoadPromise;
}

/** Public — exposes the active font family name for prompts / debugging. */
export function activeFontFamily(): string {
  return FONTS?.[0]?.name ?? "IBM Plex Sans Arabic";
}

/* ── Color schemes (kept compatible with old route) ────────────── */

export interface ColorScheme {
  bg: string;
  bg2: string;
  accent: string;
  cta_fill: string;
  cta_text: string;
  headline: string;
  body: string;
  trust_fill: string;
  trust_text: string;
  name: string;
}

export const SCHEMES: Record<string, ColorScheme> = {
  navy: {
    name: "navy",
    bg: "#021544", bg2: "#17A3A4",
    accent: "#1FCACB",
    cta_fill: "#1FCACB", cta_text: "#021544",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  teal: {
    name: "teal",
    bg: "#17A3A4", bg2: "#021544",
    accent: "#FFFFFF",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#02265B",
    trust_fill: "#021544", trust_text: "#FFFFFF",
  },
  ocean: {
    name: "ocean",
    bg: "#01355A", bg2: "#17A3A4",
    accent: "#1FCACB",
    cta_fill: "#1FCACB", cta_text: "#01355A",
    headline: "#FFFFFF", body: "#A8E6E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  light: {
    name: "light",
    bg: "#F4FBFB", bg2: "#17A3A4",
    accent: "#01355A",
    cta_fill: "#17A3A4", cta_text: "#FFFFFF",
    headline: "#021544", body: "#01355A",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  midnight: {
    name: "midnight",
    bg: "#050E24", bg2: "#22D4D5",
    accent: "#22D4D5",
    cta_fill: "#22D4D5", cta_text: "#050E24",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
  slate: {
    name: "slate",
    bg: "#1A2B4A", bg2: "#1FCACB",
    accent: "#1FCACB",
    cta_fill: "#1FCACB", cta_text: "#1A2B4A",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
};

const SCHEME_ORDER = ["navy", "ocean", "midnight", "teal", "slate", "light"] as const;

export function resolveScheme(color_scheme?: string): ColorScheme {
  if (color_scheme && SCHEMES[color_scheme]) return SCHEMES[color_scheme];
  if (color_scheme === "auto") {
    const idx = Math.floor(Date.now() / 600_000) % SCHEME_ORDER.length;
    return SCHEMES[SCHEME_ORDER[idx]];
  }
  return SCHEMES.navy;
}

/* ── Ratio dims ────────────────────────────────────────────────── */

export const RATIO_DIMS: Record<string, [number, number]> = {
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
};

/* ── Ad content ───────────────────────────────────────────────── */

export interface AdCopy {
  headline: string;
  hook: string;
  cta: string;
  trust: string;
  tagline: string;
}

/* ── Template (VDOM tree, Satori-compatible) ───────────────────── */

/**
 * Hybrid layout — AI image fills the entire canvas as a full-bleed background;
 * Arabic text + brand mark + CTA composited on top with a smart gradient
 * overlay for legibility. This matches how production designers work in
 * Photoshop / Canva: the AI paints the scene, the typography is added
 * with the correct font (Lama Sans / IBM Plex) so Arabic is always crisp.
 *
 * Layout per ratio:
 *   1:1, 4:5    — text overlaid right side (RTL natural), vertical gradient
 *   9:16        — text overlaid bottom-third, fade up
 *   16:9        — text overlaid right side, fade left-to-right
 */
function buildVdom(
  copy: AdCopy,
  scheme: ColorScheme,
  heroImageDataUrl: string | null,
  ratio: string,
  width: number,
  height: number,
) {
  /* Full-bleed background — AI image OR a brand-color gradient if image gen
     failed. Either way, fills the entire canvas. */
  const background = heroImageDataUrl
    ? {
        type: "div",
        props: {
          style: {
            display: "flex",
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: scheme.bg,
          },
          children: [
            {
              type: "img",
              props: {
                src: heroImageDataUrl,
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              },
            },
          ],
        },
      }
    : {
        type: "div",
        props: {
          style: {
            display: "flex",
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${scheme.bg}, ${scheme.bg2})`,
          },
          children: [],
        },
      };

  /* Smart gradient overlay for legibility — ratio-aware so text always
     reads cleanly over any AI background. */
  const isPortrait = ratio === "9:16" || ratio === "4:5";
  const isWide = ratio === "16:9";
  const gradientOverlay = {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: isWide
          ? `linear-gradient(to left, ${scheme.bg}EE 0%, ${scheme.bg}AA 35%, transparent 65%)`
          : isPortrait
          ? `linear-gradient(to top, ${scheme.bg}F2 0%, ${scheme.bg}CC 30%, ${scheme.bg}55 50%, transparent 80%)`
          : `linear-gradient(135deg, transparent 30%, ${scheme.bg}77 55%, ${scheme.bg}EE 100%)`,
      },
      children: [],
    },
  };

  /* Satori 0.10+ supports direction:'rtl' natively — no manual token reversal.
     We just pass the Arabic string as-is; the engine handles BiDi and
     multi-line wrapping correctly when direction is set on the element. */
  const ar = (s: string): string => s || "";

  /* Adaptive font sizes — shrink the headline if it's too long so we never
     wrap into 5+ lines. Each Arabic word averages ~5 chars. */
  const headlineLen = (copy.headline || "").length;
  const tooLong = headlineLen > 30;
  const headlineSize = tooLong
    ? (ratio === "9:16" ? 64 : ratio === "16:9" ? 54 : 58)
    : (ratio === "9:16" ? 84 : ratio === "16:9" ? 70 : 76);
  const hookSize = ratio === "9:16" ? 34 : ratio === "16:9" ? 28 : 30;
  const ctaSize = ratio === "9:16" ? 36 : 32;
  const trustSize = ratio === "9:16" ? 24 : 20;
  const brandSize = ratio === "9:16" ? 56 : ratio === "16:9" ? 44 : 48;

  /* Container positioning per ratio — text sits in the gradient zone where
     legibility is highest. */
  const textContainerStyle =
    ratio === "16:9"
      ? {
          // wide — text on the right half
          position: "absolute",
          top: 0,
          right: 0,
          width: "55%",
          height: "100%",
          padding: "60px 70px",
          alignItems: "flex-end",
          justifyContent: "center",
        }
      : ratio === "9:16" || ratio === "4:5"
      ? {
          // portrait — text in the bottom 55%
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "55%",
          padding: ratio === "9:16" ? "60px 70px 80px" : "50px 60px 70px",
          alignItems: "flex-end",
          justifyContent: "flex-end",
        }
      : {
          // square — text on the right half
          position: "absolute",
          top: 0,
          right: 0,
          width: "55%",
          height: "100%",
          padding: "55px 60px",
          alignItems: "flex-end",
          justifyContent: "center",
        };

  /* If the official logo PNG is loaded, use it as a real image — otherwise
     fall back to the typographic mark "قيود". */
  const logoDataUrl = getBrandLogoDataUrlSync();
  const logoBlock = logoDataUrl
    ? {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginBottom: 18,
          },
          children: [
            {
              type: "img",
              props: {
                src: logoDataUrl,
                width: ratio === "9:16" ? 180 : ratio === "16:9" ? 150 : 160,
                height: ratio === "9:16" ? 56 : ratio === "16:9" ? 46 : 50,
                style: {
                  width: ratio === "9:16" ? 180 : ratio === "16:9" ? 150 : 160,
                  height: ratio === "9:16" ? 56 : ratio === "16:9" ? 46 : 50,
                  objectFit: "contain",
                },
              },
            },
            {
              type: "div",
              props: {
                style: {
                  direction: "rtl",
                  fontSize: 16,
                  color: scheme.body,
                  opacity: 0.7,
                  marginTop: 8,
                },
                children: ar(copy.tagline || "محاسبة سحابية"),
              },
            },
          ],
        },
      }
    : {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginBottom: 18,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  direction: "rtl",
                  fontSize: brandSize,
                  fontWeight: 700,
                  color: scheme.accent,
                  lineHeight: 1,
                },
                children: ar("قيود"),
              },
            },
            {
              type: "div",
              props: {
                style: {
                  direction: "rtl",
                  fontSize: 18,
                  color: scheme.body,
                  opacity: 0.85,
                  marginTop: 6,
                },
                children: ar(copy.tagline || "محاسبة سحابية"),
              },
            },
          ],
        },
      };

  const textOverlay = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        direction: "rtl",
        textAlign: "right",
        ...textContainerStyle,
        alignItems: "flex-end", // physical right edge — RTL doesn't flip this in column flex
      },
      children: [
        // Brand mark — official PNG when loaded, typographic fallback otherwise
        logoBlock,
        // Headline
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              fontSize: headlineSize,
              fontWeight: 700,
              color: scheme.headline,
              lineHeight: 1.2,
              marginBottom: 16,
              textAlign: "right",
              textShadow: `0 2px 24px ${scheme.bg}AA`,
              width: "100%",
            },
            children: ar(copy.headline),
          },
        },
        // Hook
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              fontSize: hookSize,
              fontWeight: 400,
              color: scheme.body,
              lineHeight: 1.5,
              marginBottom: 26,
              textAlign: "right",
              width: "100%",
            },
            children: ar(copy.hook),
          },
        },
        // Trust badge (single — per ads guideline)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              backgroundColor: scheme.trust_fill,
              color: scheme.trust_text,
              padding: "12px 28px",
              borderRadius: 100,
              fontSize: trustSize,
              fontWeight: 600,
              marginBottom: 22,
            },
            children: ar(copy.trust),
          },
        },
        // CTA (single — per ads guideline)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              backgroundColor: scheme.cta_fill,
              color: scheme.cta_text,
              padding: "18px 50px",
              borderRadius: 100,
              fontSize: ctaSize,
              fontWeight: 700,
            },
            children: ar(copy.cta),
          },
        },
      ],
    },
  };

  /* Website link footer — qoyod.com always present in the bottom-left
     corner, subtle so it doesn't compete with the CTA. */
  const websiteFooter = {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "absolute",
        bottom: 28,
        left: 36,
        fontSize: 18,
        color: scheme.body,
        opacity: 0.7,
        letterSpacing: 1,
      },
      children: "qoyod.com",
    },
  };

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: scheme.bg,
        fontFamily: activeFontFamily(),
      },
      children: [background, gradientOverlay, textOverlay, websiteFooter],
    },
  };
}

/* ── Public render ─────────────────────────────────────────────── */

export interface RenderInput {
  copy: AdCopy;
  scheme: ColorScheme;
  ratio: string;
  heroImageDataUrl: string | null;
}

export interface RenderOutput {
  pngBase64: string;
  width: number;
  height: number;
}

export async function renderDesign(input: RenderInput): Promise<RenderOutput> {
  const [w, h] = RATIO_DIMS[input.ratio] ?? [1080, 1080];
  const fonts = await loadFonts();
  const vdom = buildVdom(input.copy, input.scheme, input.heroImageDataUrl, input.ratio, w, h);

  // Satori expects React-flavoured VDOM — we hand it a plain object that matches
  const svg = await satori(vdom as unknown as Parameters<typeof satori>[0], {
    width: w,
    height: h,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: w },
    background: "rgba(0,0,0,0)",
    font: { loadSystemFonts: false },
  });
  const png = resvg.render().asPng();

  return {
    pngBase64: png.toString("base64"),
    width: w,
    height: h,
  };
}

/** Pre-warm the font cache at boot. Safe to call multiple times. */
export async function warmDesignRenderer(): Promise<void> {
  try {
    await loadFonts();
  } catch (e) {
    logger.warn({ err: String(e) }, "design-renderer: font pre-warm failed");
  }
}
