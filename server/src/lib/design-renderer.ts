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

  /* Identity helper for short single-word strings where wrapping never occurs. */
  const ar = (s: string): string => s || "";

  /**
   * Arabic text as RTL flex words — reliable multi-line Arabic in Satori.
   * Each word is a separate flex item; RTL flex container orders right-to-left.
   * Avoids gap shorthand (Yoga compat) and never passes undefined style values.
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
    if (!words.length) {
      return { type: "div", props: { style: { display: "flex" }, children: "" } };
    }
    const spacing = Math.round(Number(wordStyle.fontSize) * 0.28);
    // Build safe word style — never include undefined values
    const wStyle: Record<string, unknown> = {
      display: "flex",
      fontSize: wordStyle.fontSize,
      fontWeight: wordStyle.fontWeight,
      color: wordStyle.color,
      lineHeight: wordStyle.lineHeight ?? 1.25,
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
          justifyContent: "flex-start",  // flex-start = right edge in RTL
          width: "100%",
          ...containerStyle,
        },
        children: words.map((word, i) => ({
          type: "div",
          props: {
            style: {
              ...wStyle,
              // word spacing via margin — no gap shorthand needed
              marginLeft: i < words.length - 1 ? spacing : 0,
            },
            children: word,
          },
        })),
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
  const brandSize = ratio === "9:16" ? 56 : ratio === "16:9" ? 44 : 48;

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

  /* Portrait (9:16, 4:5) = text centered top.
     Landscape / square = text right-aligned (RTL natural). */
  // isPortrait / isWide already declared above for the gradient overlay — reuse them
  const textAlign = isPortrait ? "center" : "right";
  const justifyWords = isPortrait ? "center" : "flex-start"; // flex-start=right in RTL

  const textOverlay = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        direction: "rtl",
        textAlign,
        ...textContainerStyle,
        alignItems: "flex-end", // always right-edge within the container
      },
      children: [
        // Headline — CYAN on dark backgrounds (production design standard)
        // NOTE: Logo is NOT here — it lives at bottom-right corner (see brandCorner)
        arabicWords(copy.headline, {
          fontSize: headlineSize,
          fontWeight: 700,
          color: scheme.accent,  // cyan, not white — matches production designs
          lineHeight: 1.2,
        }, { marginBottom: 14, justifyContent: justifyWords }),
        // Hook — white supporting line
        arabicWords(copy.hook, {
          fontSize: hookSize,
          fontWeight: 400,
          color: scheme.headline, // white
          lineHeight: 1.5,
        }, { marginBottom: 26, justifyContent: justifyWords }),
        // Trust badge (single — per ads guideline)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              direction: "rtl",
              backgroundColor: scheme.trust_fill,
              borderRadius: 100,
              marginBottom: 22,
              overflow: "hidden",
            },
            children: [
              arabicWords(copy.trust, {
                fontSize: trustSize,
                fontWeight: 600,
                color: scheme.trust_text,
              }, { paddingTop: 12, paddingBottom: 12, paddingLeft: 28, paddingRight: 28 }),
            ],
          },
        },
        // CTA (single — per ads guideline)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              direction: "rtl",
              backgroundColor: scheme.cta_fill,
              borderRadius: 100,
              overflow: "hidden",
            },
            children: [
              arabicWords(copy.cta, {
                fontSize: ctaSize,
                fontWeight: 700,
                color: scheme.cta_text,
              }, { paddingTop: 18, paddingBottom: 18, paddingLeft: 50, paddingRight: 50 }),
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
