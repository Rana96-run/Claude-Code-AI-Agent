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
  /* مسك الدفاتر sub-brand — orange accent, dark navy on white */
  bookkeeping: {
    name: "bookkeeping",
    bg: "#021544", bg2: "#0A2266",
    accent: "#FF6B2B",           // orange — bookkeeping brand
    cta_fill: "#FF6B2B", cta_text: "#FFFFFF",
    headline: "#FFFFFF", body: "#C8D5F0",
    trust_fill: "#17A3A4", trust_text: "#FFFFFF",
  },
};

const SCHEME_ORDER = ["navy", "ocean", "midnight", "teal", "slate", "light", "bookkeeping"] as const;

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

  /* Smart gradient overlay for legibility — ratio-aware so text always
     reads cleanly over any AI background.
     Portrait: text lives at TOP → dark at top, fades to transparent at bottom.
     Landscape/Square: text lives on the RIGHT → dark right, transparent left.
  */
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
          /* TOP = text zone: dark overlay; BOTTOM = visual scene: transparent */
          ? `linear-gradient(to bottom, ${scheme.bg}F0 0%, ${scheme.bg}CC 25%, ${scheme.bg}77 45%, transparent 70%)`
          : `linear-gradient(to left, ${scheme.bg}EE 0%, ${scheme.bg}AA 40%, transparent 70%)`,
      },
      children: [],
    },
  };

  /**
   * Arabic multi-word text — for headlines and hooks (long, multi-line capable).
   * Each word is a separate RTL flex item so Yoga's flex engine handles
   * right-to-left word ordering natively. Avoids gap shorthand (Yoga compat)
   * and never passes undefined CSS values.
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
    const words = (text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return { type: "div", props: { style: { display: "flex" }, children: "" } };

    const spacing = Math.round(Number(wordStyle.fontSize) * 0.18);
    const wStyle: Record<string, unknown> = {
      display: "flex",
      fontSize: wordStyle.fontSize,
      fontWeight: wordStyle.fontWeight,
      color: wordStyle.color,
      lineHeight: wordStyle.lineHeight ?? 1.3,
    };
    if (wordStyle.textShadow) wStyle.textShadow = wordStyle.textShadow;

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          direction: "rtl",
          justifyContent: "flex-start",   // flex-start = right in RTL
          alignItems: "flex-start",
          width: "100%",
          ...containerStyle,
        },
        children: words.map((word, i) => ({
          type: "div",
          props: {
            style: { ...wStyle, marginLeft: i < words.length - 1 ? spacing : 0 },
            children: word,
          },
        })),
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

  /* Container positioning per ratio.
     RTL layout rules from production designs:
     - 16:9 landscape : text RIGHT half, visual LEFT half
     - 9:16 / 4:5 portrait : text TOP full-width (not bottom column)
     - 1:1 square : text TOP-RIGHT column */
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
          // portrait: text spans full width at the TOP — visual fills bottom
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
      : {
          // 1:1 square — text top-right column
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

  /* Portrait (9:16, 4:5) = text centered top, full-width.
     Landscape (16:9) = text right column.
     Square (1:1) = text top-right column.
     isPortrait / isWide reused from gradient overlay declaration. */
  const justifyWords = isPortrait ? "center" : "flex-start"; // flex-start = right in RTL
  // Portrait: center all items; Landscape/Square: right-align (flex-end in RTL context)
  const containerAlign = isPortrait ? "center" : "flex-end";

  /* Headline text shadow for readability over any AI background */
  const headlineShadow = `0 2px 12px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)`;

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
          lineHeight: 1.2,
          textShadow: headlineShadow,
        }, { marginBottom: 16, justifyContent: justifyWords }),

        // ── Hook — white body text ────────────────────────────────────────────
        arabicWords(copy.hook, {
          fontSize: hookSize,
          fontWeight: 400,
          color: scheme.headline,
          lineHeight: 1.55,
          textShadow: `0 1px 6px rgba(0,0,0,0.45)`,
        }, { marginBottom: 28, justifyContent: justifyWords }),

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
              marginBottom: 20,
              paddingTop: 11, paddingBottom: 11,
              paddingLeft: 30, paddingRight: 30,
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

  const logoW = ratio === "9:16" ? 160 : ratio === "16:9" ? 130 : 140;
  const logoH = ratio === "9:16" ? 50  : ratio === "16:9" ? 40  : 44;
  const footerBottom = 28;

  /* Bottom-left: qoyod.com */
  const websiteFooter = {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "absolute",
        bottom: footerBottom,
        left: 36,
        fontSize: ratio === "9:16" ? 20 : 17,
        color: "#FFFFFF",
        opacity: 0.75,
        letterSpacing: 0.5,
      },
      children: "qoyod.com",
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
