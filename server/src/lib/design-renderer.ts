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
import { getBrandLogoDataUrlSync, getBookkeepingLogoDataUrlSync } from "./brand-assets.js";

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
 * IBM Plex Sans Arabic via fontsource CDN (versioned — stable).
 * Lama Sans is Qoyod's brand font but isn't published to npm/fontsource,
 * so we use IBM Plex Sans Arabic which closely matches the brand weight/style.
 * Satori accepts WOFF (not WOFF2) — using the fontsource WOFF files.
 */
const IBM_PLEX_URLS: Record<400 | 600 | 700, string> = {
  400: "https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans-arabic@5/files/ibm-plex-sans-arabic-arabic-400-normal.woff",
  600: "https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans-arabic@5/files/ibm-plex-sans-arabic-arabic-600-normal.woff",
  700: "https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-sans-arabic@5/files/ibm-plex-sans-arabic-arabic-700-normal.woff",
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
    logger.info("design-renderer: loading fonts (IBM Plex Sans Arabic via fontsource CDN)");
    const entries = await tryLoadFamily("IBM Plex Sans Arabic", IBM_PLEX_URLS);
    if (!entries) {
      throw new Error("Could not load IBM Plex Sans Arabic font");
    }
    FONTS = entries;
    logger.info(
      { family: "IBM Plex Sans Arabic", count: entries.length, total_kb: Math.round(entries.reduce((s, e) => s + e.data.byteLength, 0) / 1024) },
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
  /* ── Dark backgrounds ─────────────────────────────────────────── */
  /* QOYOD Main — Navy + Cyan headlines + Navy CTA (white text) per unified design system */
  navy: {
    name: "navy",
    bg: "#021544", bg2: "#00B4D8",
    accent: "#00B4D8",            // Cyan #00B4D8 for headlines (unified spec)
    cta_fill: "#021544", cta_text: "#FFFFFF",  // Navy bg + white text (unified spec)
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#00B4D8", trust_text: "#FFFFFF",
  },
  ocean: {
    name: "ocean",
    bg: "#01355A", bg2: "#00B4D8",
    accent: "#00B4D8",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#A8E6E6",
    trust_fill: "#00B4D8", trust_text: "#FFFFFF",
  },
  midnight: {
    name: "midnight",
    bg: "#050E24", bg2: "#5B9FFF",
    accent: "#5B9FFF",            // Electric Blue variant
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#5B9FFF", trust_text: "#FFFFFF",
  },
  slate: {
    name: "slate",
    bg: "#1A2B4A", bg2: "#5B9FFF",
    accent: "#5B9FFF",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#9FE5E6",
    trust_fill: "#5B9FFF", trust_text: "#FFFFFF",
  },
  /* Q-Flavours — Dark Navy #0B1B3A + Electric Blue #5B9FFF (restaurant POS) */
  flavours: {
    name: "flavours",
    bg: "#0B1B3A", bg2: "#1A2E5A",
    accent: "#5B9FFF",            // Electric Blue — Q-Flavours signature
    cta_fill: "#5B9FFF", cta_text: "#FFFFFF",  // Electric Blue CTA + white text
    headline: "#FFFFFF", body: "#B8D0FF",
    trust_fill: "#5B9FFF", trust_text: "#FFFFFF",
  },

  /* ── Light backgrounds (match production graphic-design style) ── */
  /* Cyan-to-white gradient, dark navy text — design ref style 1 & 3 */
  light_cyan: {
    name: "light_cyan",
    bg: "#D6F4F9", bg2: "#FFFFFF",
    accent: "#021544",
    cta_fill: "#021544", cta_text: "#FFFFFF",  // Navy CTA + white text
    headline: "#021544", body: "#00B4D8",
    trust_fill: "#00B4D8", trust_text: "#FFFFFF",
  },
  /* Purple / Electric Blue gradient, dark navy text */
  light_purple: {
    name: "light_purple",
    bg: "#C8C6F7", bg2: "#FFFFFF",
    accent: "#021544",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#021544", body: "#3D3B8E",
    trust_fill: "#5B9FFF", trust_text: "#FFFFFF",
  },
  /* Electric Blue gradient — light blue → white */
  light_blue: {
    name: "light_blue",
    bg: "#DBE9FF", bg2: "#FFFFFF",
    accent: "#021544",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#021544", body: "#5B9FFF",
    trust_fill: "#5B9FFF", trust_text: "#FFFFFF",
  },
  /* Legacy light — keep for compat */
  light: {
    name: "light",
    bg: "#F4FBFB", bg2: "#00B4D8",
    accent: "#021544",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#021544", body: "#00B4D8",
    trust_fill: "#00B4D8", trust_text: "#FFFFFF",
  },
  teal: {
    name: "teal",
    bg: "#00B4D8", bg2: "#021544",
    accent: "#FFFFFF",
    cta_fill: "#021544", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#02265B",
    trust_fill: "#021544", trust_text: "#FFFFFF",
  },

  /* ── Sub-brands ───────────────────────────────────────────────── */
  /* مسك الدفاتر — dark navy + orange accent (unified spec: orange CTA + white text) */
  bookkeeping: {
    name: "bookkeeping",
    bg: "#021544", bg2: "#0A2266",
    accent: "#FF6B2B",
    cta_fill: "#FF6B2B", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#C8D5F0",
    trust_fill: "#FF6B2B", trust_text: "#FFFFFF",
  },
};

const SCHEME_ORDER = ["navy", "light_cyan", "midnight", "light_purple", "ocean", "light_blue"] as const;

/** True for light-background schemes — no dark gradient overlay needed */
function isLightScheme(s: ColorScheme): boolean {
  return ["light_cyan", "light_purple", "light_blue", "light"].includes(s.name);
}

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
  isBookkeeping = false,
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

  /* Smart gradient overlay for legibility.
     Light schemes (light_cyan, light_purple): NO overlay — bg IS the design,
     text is dark navy and readable without any scrim.
     Dark schemes: ratio-aware overlay so text reads over any AI background.
       Portrait  → dark top, transparent bottom (text lives at top)
       Landscape → dark right, transparent left (text lives at right)
       Square    → dark right, transparent left
  */
  const isPortrait = ratio === "9:16" || ratio === "4:5";
  const isWide = ratio === "16:9";
  const lightBg = isLightScheme(scheme);
  const gradientOverlay = {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        height: "100%",
        // Light schemes: no overlay at all — bg gradient IS the design
        ...(lightBg ? {} : {
          backgroundImage: isWide
            ? `linear-gradient(to left, ${scheme.bg}EE 0%, ${scheme.bg}AA 35%, transparent 65%)`
            : isPortrait
            ? `linear-gradient(to bottom, ${scheme.bg}F0 0%, ${scheme.bg}CC 25%, ${scheme.bg}77 45%, transparent 70%)`
            : `linear-gradient(to left, ${scheme.bg}EE 0%, ${scheme.bg}AA 40%, transparent 70%)`,
        }),
      },
      children: [],
    },
  };

  /**
   * Arabic text block — renders as a single RTL text node so Satori's BiDi
   * algorithm handles word-order, ligatures, and wrapping correctly.
   * Replaces the old word-by-word flex approach which caused scattered layout.
   */
  function arabicWords(
    text: string,
    wordStyle: {
      fontSize: number;
      fontWeight: number | string;
      color: string;
      lineHeight?: number;
      textShadow?: string;
    },
    containerStyle: Record<string, unknown> = {},
  ): object {
    const trimmed = (text || "").trim();
    if (!trimmed) return { type: "div", props: { style: { display: "flex" }, children: "" } };

    const innerStyle: Record<string, unknown> = {
      direction: "rtl",
      fontSize: wordStyle.fontSize,
      fontWeight: wordStyle.fontWeight,
      color: wordStyle.color,
      lineHeight: wordStyle.lineHeight ?? 1.25,
      width: "100%",
    };
    if (wordStyle.textShadow) innerStyle.textShadow = wordStyle.textShadow;

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          direction: "rtl",
          width: "100%",
          ...containerStyle,
        },
        children: [
          {
            type: "div",
            props: {
              style: innerStyle,
              children: trimmed,
            },
          },
        ],
      },
    };
  }

  /**
   * Short Arabic/mixed-script text — for CTA, trust badge, tagline.
   * Renders as a single RTL text node so the browser BiDi algorithm correctly
   * handles Arabic + Latin acronyms (ZATCA, SOCPA) in one pass.
   * Does NOT split into words — avoids mixed-script garbling.
   */
  function arabicInline(
    text: string,
    style: {
      fontSize: number;
      fontWeight: number | string;
      color: string;
      lineHeight?: number;
    },
    containerStyle: Record<string, unknown> = {},
  ): object {
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          direction: "rtl",
          justifyContent: "center",
          alignItems: "center",
          ...containerStyle,
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                direction: "rtl",
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                color: style.color,
                lineHeight: style.lineHeight ?? 1.25,
              },
              children: (text || "").trim(),
            },
          },
        ],
      },
    };
  }

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

  /* Container positioning per ratio + scheme.
     Dark schemes:
       - 16:9 → text RIGHT half, visual LEFT half
       - 9:16 / 4:5 → text TOP full-width
       - 1:1 → text TOP-RIGHT column
     Light schemes (match production graphic-design refs):
       - 16:9 → text RIGHT half (same — visual/mockup lives on left)
       - 9:16 → text TOP full-width (same)
       - 1:1 → text TOP full-width (refs 1, 4, 5 all show centered top text) */
  const textContainerStyle =
    ratio === "16:9"
      ? {
          position: "absolute",
          top: 0, right: 0,
          width: "52%", height: "100%",
          paddingTop: 60, paddingBottom: 60,
          paddingLeft: 60, paddingRight: 70,
          alignItems: "flex-end",
          justifyContent: "center",
        }
      : ratio === "9:16"
      ? {
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "48%",
          paddingTop: 70, paddingBottom: 40,
          paddingLeft: 60, paddingRight: 60,
          alignItems: "flex-end",
          justifyContent: "flex-start",
        }
      : ratio === "4:5"
      ? {
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "44%",
          paddingTop: 60, paddingBottom: 30,
          paddingLeft: 55, paddingRight: 55,
          alignItems: "flex-end",
          justifyContent: "flex-start",
        }
      : lightBg
      ? {
          // 1:1 light scheme — full-width top zone (matches refs 1, 4, 5)
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "52%",
          paddingTop: 55, paddingBottom: 30,
          paddingLeft: 60, paddingRight: 60,
          alignItems: "center",
          justifyContent: "flex-start",
        }
      : {
          // 1:1 dark scheme — text top-right column
          position: "absolute",
          top: 0, right: 0,
          width: "55%", height: "100%",
          paddingTop: 55, paddingBottom: 55,
          paddingLeft: 50, paddingRight: 60,
          alignItems: "flex-end",
          justifyContent: "center",
        };

  /* Pick the correct logo:
     - Bookkeeping product → dual logo (مسك الدفاتر + QOYOD)
     - All other products  → regular QOYOD logo only */
  const logoDataUrl = isBookkeeping
    ? getBookkeepingLogoDataUrlSync()
    : getBrandLogoDataUrlSync();

  /* Text alignment logic:
     Light schemes → always centered (matches production graphic-design refs)
     Dark schemes  → portrait=center, landscape/square=right (RTL natural) */
  const forceCenter = lightBg;
  const justifyWords = (isPortrait || forceCenter) ? "center" : "flex-start";
  const containerAlign = (isPortrait || forceCenter) ? "center" : "flex-end";

  /* Text shadow only on dark/photo backgrounds — not needed on light bg */
  const headlineShadow = lightBg ? undefined : `0 2px 12px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)`;
  const hookShadow = lightBg ? undefined : `0 1px 6px rgba(0,0,0,0.45)`;

  const textOverlay = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        direction: "rtl",
        ...textContainerStyle,
        alignItems: containerAlign,
      },
      children: [
        // ── Headline — brand accent colour (cyan/orange) with shadow ──────────
        arabicWords(copy.headline, {
          fontSize: headlineSize,
          fontWeight: 700,
          color: scheme.accent,
          lineHeight: 1.15,
          textShadow: headlineShadow,
        }, { marginBottom: 12 }),

        // ── Hook ─────────────────────────────────────────────────────────────
        arabicWords(copy.hook, {
          fontSize: hookSize,
          fontWeight: 400,
          color: scheme.headline,
          lineHeight: 1.45,
          textShadow: hookShadow,
        }, { marginBottom: 22 }),

        // ── Trust badge ───────────────────────────────────────────────────────
        // arabicInline (not arabicWords) — handles "ZATCA-معتمد" mixed script
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              backgroundColor: scheme.trust_fill,
              borderRadius: 100,
              marginBottom: 16,
              paddingTop: 10, paddingBottom: 10,
              paddingLeft: 28, paddingRight: 28,
            },
            children: [
              arabicInline(copy.trust, {
                fontSize: trustSize,
                fontWeight: 700,
                color: scheme.trust_text,
              }),
            ],
          },
        },

        // ── CTA button ────────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              direction: "rtl",
              backgroundColor: scheme.cta_fill,
              borderRadius: 100,
              paddingTop: 18, paddingBottom: 18,
              paddingLeft: 54, paddingRight: 54,
            },
            children: [
              arabicInline(copy.cta, {
                fontSize: ctaSize,
                fontWeight: 700,
                color: scheme.cta_text,
              }),
            ],
          },
        },
      ],
    },
  };

  const logoW = ratio === "9:16" ? 200 : ratio === "16:9" ? 180 : 175;
  const logoH = ratio === "9:16" ? 62  : ratio === "16:9" ? 56  : 54;
  const footerBottom = 32;

  /* Footer text color — dark on light bg, white on dark bg */
  const footerColor = lightBg ? "#021544" : "#FFFFFF";
  const footerOpacity = lightBg ? 0.7 : 0.75;
  /* Footer label — matches production refs ("للمزيد قم بزيارة qoyod.com") */
  const footerLabel = lightBg
    ? `للمزيد قم بزيارة\nqoyod.com`
    : "qoyod.com";

  /* Bottom-left: website link */
  const websiteFooter = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        bottom: footerBottom,
        left: 40,
        fontSize: ratio === "9:16" ? 22 : 18,
        fontWeight: 600,
        color: footerColor,
        opacity: footerOpacity,
        letterSpacing: 0.5,
        direction: "ltr",
      },
      children: lightBg
        ? [
            { type: "div", props: { style: { display: "flex", fontSize: ratio === "9:16" ? 15 : 13, fontWeight: 400, direction: "rtl" }, children: "للمزيد قم بزيارة" } },
            { type: "div", props: { style: { display: "flex", fontWeight: 700 }, children: "qoyod.com" } },
          ]
        : { type: "div", props: { style: { display: "flex", fontWeight: 700, fontSize: ratio === "9:16" ? 22 : 18 }, children: "qoyod.com" } },
    },
  };

  /* Bottom-right: QOYOD logo PNG or wordmark */
  const brandCorner = logoDataUrl
    ? {
        type: "div",
        props: {
          style: {
            display: "flex",
            position: "absolute",
            bottom: footerBottom,
            right: 36,
          },
          children: [
            {
              type: "img",
              props: {
                src: logoDataUrl,
                width: logoW,
                height: logoH,
                style: { width: logoW, height: logoH, objectFit: "contain" },
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
            bottom: footerBottom,
            right: 36,
            fontSize: ratio === "9:16" ? 44 : ratio === "16:9" ? 36 : 40,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: 1,
          },
          children: "QOYOD",
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
      children: [background, gradientOverlay, textOverlay, websiteFooter, brandCorner],
    },
  };
}

/* ── Public render ─────────────────────────────────────────────── */

export interface RenderInput {
  copy: AdCopy;
  scheme: ColorScheme;
  ratio: string;
  heroImageDataUrl: string | null;
  product?: string;  // used to select logo: bookkeeping vs main
}

export interface RenderOutput {
  pngBase64: string;
  width: number;
  height: number;
}

export async function renderDesign(input: RenderInput): Promise<RenderOutput> {
  const [w, h] = RATIO_DIMS[input.ratio] ?? [1080, 1080];
  const fonts = await loadFonts();
  const isBookkeeping = /bookkeeping|مسك|دفاتر/i.test(input.product ?? "");
  const vdom = buildVdom(input.copy, input.scheme, input.heroImageDataUrl, input.ratio, w, h, isBookkeeping);

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
