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
 * Trick: requesting Google Fonts CSS with an old User-Agent makes the API
 * return TTF URLs (Satori only accepts TTF/OTF/WOFF, not WOFF2).
 */
async function fetchTtfFromGoogleFonts(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}&display=swap`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      // Old WebKit asks for TTF rather than WOFF2
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8) AppleWebKit/536.25 (KHTML, like Gecko) Version/6.0 Safari/536.25",
    },
  });
  if (!cssRes.ok) {
    throw new Error(`Failed to fetch font CSS: HTTP ${cssRes.status}`);
  }
  const css = await cssRes.text();
  const m = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
  if (!m) {
    throw new Error("No TTF URL found in font CSS — Google may have switched format");
  }
  const fontRes = await fetch(m[1]);
  if (!fontRes.ok) {
    throw new Error(`Failed to fetch TTF: HTTP ${fontRes.status}`);
  }
  return fontRes.arrayBuffer();
}

async function loadFonts(): Promise<FontEntry[]> {
  if (FONTS) return FONTS;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    logger.info("design-renderer: loading fonts");
    const family = "IBM Plex Sans Arabic";
    const weights: Array<400 | 600 | 700> = [400, 600, 700];
    const buffers = await Promise.all(weights.map((w) => fetchTtfFromGoogleFonts(family, w)));
    const entries: FontEntry[] = weights.map((weight, i) => ({
      name: family,
      data: buffers[i],
      weight,
      style: "normal" as const,
    }));
    FONTS = entries;
    logger.info({ count: entries.length }, "design-renderer: fonts loaded");
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

  // Brand mark sits in the corner of the copy block
  const brandBlock = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        marginBottom: 24,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: width > 1200 ? 64 : 56,
              fontWeight: 800,
              color: scheme.accent,
              lineHeight: 1,
            },
            children: "قيود",
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 22,
              color: scheme.body,
              opacity: 0.75,
              marginTop: 6,
            },
            children: copy.tagline || "محاسبة سحابية",
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
        padding: width > 1200 ? "60px 80px" : "50px 60px",
        flex: 1,
        textAlign: "right",
        // Satori applies direction inside text via the lang/RTL trick
      },
      children: [
        brandBlock,
        // Headline
        {
          type: "div",
          props: {
            style: {
              fontSize: ratio === "9:16" ? 110 : ratio === "16:9" ? 92 : 100,
              fontWeight: 800,
              color: scheme.headline,
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: "100%",
              textAlign: "right",
              width: "100%",
            },
            children: copy.headline,
          },
        },
        // Hook
        {
          type: "div",
          props: {
            style: {
              fontSize: 36,
              fontWeight: 400,
              color: scheme.body,
              lineHeight: 1.4,
              marginBottom: 36,
              maxWidth: "100%",
              textAlign: "right",
              width: "100%",
            },
            children: copy.hook,
          },
        },
        // Trust badge
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              backgroundColor: scheme.trust_fill,
              color: scheme.trust_text,
              padding: "14px 32px",
              borderRadius: 100,
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 28,
            },
            children: copy.trust,
          },
        },
        // CTA button
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              backgroundColor: scheme.cta_fill,
              color: scheme.cta_text,
              padding: "22px 60px",
              borderRadius: 100,
              fontSize: 40,
              fontWeight: 700,
            },
            children: copy.cta,
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
      children: horizontal ? [imageBlock, copyBlock] : [imageBlock, copyBlock],
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
