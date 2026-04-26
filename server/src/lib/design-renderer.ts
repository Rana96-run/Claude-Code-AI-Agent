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
 * Fetch IBM Plex Sans Arabic TTF directly from jsdelivr CDN.
 * Satori only accepts TTF/OTF/WOFF — not WOFF2 (which is what Google Fonts
 * serves regardless of User-Agent now).
 */
const FONT_URLS: Record<400 | 600 | 700, string> = {
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

async function loadFonts(): Promise<FontEntry[]> {
  if (FONTS) return FONTS;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    logger.info("design-renderer: loading fonts");
    const family = "IBM Plex Sans Arabic";
    const weights: Array<400 | 600 | 700> = [400, 600, 700];
    const buffers = await Promise.all(weights.map((w) => fetchTtf(FONT_URLS[w])));
    const entries: FontEntry[] = weights.map((weight, i) => ({
      name: family,
      data: buffers[i],
      weight,
      style: "normal" as const,
    }));
    FONTS = entries;
    logger.info({ count: entries.length, total_kb: Math.round(entries.reduce((s, e) => s + e.data.byteLength, 0) / 1024) }, "design-renderer: fonts loaded");
    return entries;
  })();

  return fontLoadPromise;
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
 * Layout strategy:
 *   1:1, 4:5, 9:16  → image top, copy bottom (vertical split)
 *   16:9            → image left, copy right (horizontal split)
 */
function buildVdom(
  copy: AdCopy,
  scheme: ColorScheme,
  heroImageDataUrl: string | null,
  ratio: string,
  width: number,
  height: number,
) {
  const horizontal = ratio === "16:9";

  const imageBlock = heroImageDataUrl
    ? {
        type: "div",
        props: {
          style: {
            display: "flex",
            position: "relative",
            width: horizontal ? "50%" : "100%",
            height: horizontal ? "100%" : "55%",
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
            // Soft fade overlay where copy meets image
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  display: "flex",
                  ...(horizontal
                    ? { right: 0, top: 0, width: "30%", height: "100%" }
                    : { bottom: 0, left: 0, width: "100%", height: "30%" }),
                  backgroundImage: horizontal
                    ? `linear-gradient(to right, transparent, ${scheme.bg})`
                    : `linear-gradient(to bottom, transparent, ${scheme.bg})`,
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
            width: horizontal ? "50%" : "100%",
            height: horizontal ? "100%" : "55%",
            background: `linear-gradient(135deg, ${scheme.bg}, ${scheme.bg2})`,
          },
          children: [],
        },
      };

  /* Satori does not do bidi reordering — Arabic words render in stored
     (logical) order which looks reversed visually. Workaround: reverse the
     space-separated tokens so the visual reading order is correct.
     Joiners / RTL-marks within a single word are preserved. */
  const rtl = (s: string): string =>
    (s || "")
      .split(/(\s+)/)
      .filter((t) => t.length > 0)
      .reverse()
      .join("");

  // Tighter headline sizes — the previous values overflowed and clipped CTA
  const headlineSize =
    ratio === "9:16" ? 92 : ratio === "16:9" ? 76 : 84;
  const hookSize = ratio === "9:16" ? 38 : ratio === "16:9" ? 32 : 34;
  const ctaSize = ratio === "9:16" ? 38 : 36;
  const trustSize = ratio === "9:16" ? 24 : 22;

  // Brand mark sits in the corner of the copy block
  const brandBlock = {
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
              fontSize: width > 1200 ? 56 : 48,
              fontWeight: 800,
              color: scheme.accent,
              lineHeight: 1,
            },
            children: rtl("قيود"),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 18,
              color: scheme.body,
              opacity: 0.75,
              marginTop: 4,
            },
            children: rtl(copy.tagline || "محاسبة سحابية"),
          },
        },
      ],
    },
  };

  const copyBlock = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: width > 1200 ? "50px 70px" : "40px 50px",
        flex: 1,
        textAlign: "right",
      },
      children: [
        brandBlock,
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: headlineSize,
              fontWeight: 700,
              color: scheme.headline,
              lineHeight: 1.15,
              marginBottom: 16,
              textAlign: "right",
            },
            children: rtl(copy.headline),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: hookSize,
              fontWeight: 400,
              color: scheme.body,
              lineHeight: 1.4,
              marginBottom: 28,
              textAlign: "right",
            },
            children: rtl(copy.hook),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              backgroundColor: scheme.trust_fill,
              color: scheme.trust_text,
              padding: "12px 28px",
              borderRadius: 100,
              fontSize: trustSize,
              fontWeight: 600,
              marginBottom: 22,
            },
            children: rtl(copy.trust),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              backgroundColor: scheme.cta_fill,
              color: scheme.cta_text,
              padding: "18px 50px",
              borderRadius: 100,
              fontSize: ctaSize,
              fontWeight: 700,
            },
            children: rtl(copy.cta),
          },
        },
      ],
    },
  };

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        width: "100%",
        height: "100%",
        backgroundColor: scheme.bg,
        fontFamily: "IBM Plex Sans Arabic",
      },
      children: [imageBlock, copyBlock],
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
