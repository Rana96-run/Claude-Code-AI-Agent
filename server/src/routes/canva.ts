/**
 * Canva — deep-link only (NO OAuth)
 *
 * We removed the OAuth flow entirely. Designs are generated as PNG and the
 * user opens Canva in a new tab with a one-click deep link. The PNG is hosted
 * temporarily on the server so Canva can pick it up via URL.
 *
 * Endpoints:
 *   POST /api/canva/stage  — accepts { png_base64 }, returns { url } valid ~1h
 *   GET  /api/canva/asset/:id  — serves the staged PNG
 *   GET  /api/canva/status — kept for backwards compat with the client
 *
 * Also exposes canvaUploadSvgAndCreateDesign() as a no-op stub so the weekly
 * digest's optional Canva call still compiles.
 */

import { Router } from "express";
import crypto from "crypto";
import { Resvg } from "@resvg/resvg-js";

const router = Router();

interface StagedAsset {
  png: Buffer;
  contentType: string;
  expiresAt: number;
}

const STAGE_TTL_MS = 60 * 60 * 1_000; // 1 hour
const stage = new Map<string, StagedAsset>();

function gcStage() {
  const now = Date.now();
  for (const [k, v] of stage) {
    if (v.expiresAt < now) stage.delete(k);
  }
}
setInterval(gcStage, 5 * 60 * 1_000).unref?.();

/* ── POST /api/canva/stage ─────────────────────────────────────
   Accepts { png_base64 } OR { svg } (we'll rasterize). Returns { url, id }. */
router.post("/stage", async (req, res) => {
  try {
    const { png_base64, svg } = (req.body ?? {}) as { png_base64?: string; svg?: string };
    let buf: Buffer | null = null;

    if (png_base64) {
      const cleaned = png_base64.replace(/^data:image\/png;base64,/, "");
      buf = Buffer.from(cleaned, "base64");
    } else if (svg) {
      const m = svg.match(/viewBox=["']\s*0\s+0\s+(\d+)\s+(\d+)/);
      const width = m ? parseInt(m[1], 10) : 1080;
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: width },
        background: "rgba(0,0,0,0)",
        font: { loadSystemFonts: false },
      });
      buf = resvg.render().asPng();
    } else {
      res.status(400).json({ error: "Provide png_base64 or svg" });
      return;
    }

    const id = crypto.randomBytes(12).toString("hex");
    stage.set(id, {
      png: buf,
      contentType: "image/png",
      expiresAt: Date.now() + STAGE_TTL_MS,
    });

    const host =
      process.env.PUBLIC_HOST ??
      (req.headers["x-forwarded-host"] as string | undefined) ??
      req.headers.host ??
      "localhost:8080";
    const proto = /^https?:\/\//i.test(host)
      ? ""
      : (req.headers["x-forwarded-proto"] as string | undefined) ??
        (host.includes("localhost") ? "http" : "https");
    const base = /^https?:\/\//i.test(host) ? host.replace(/\/+$/, "") : `${proto}://${host}`;
    const url = `${base}/api/canva/asset/${id}.png`;

    res.json({ id, url, expires_in: STAGE_TTL_MS / 1000 });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "stage failed" });
  }
});

/* ── GET /api/canva/asset/:idDotPng ────────────────────────────
   Public endpoint — Canva fetches this to import the PNG. */
router.get("/asset/:file", (req, res) => {
  const id = String(req.params.file).replace(/\.png$/i, "");
  const item = stage.get(id);
  if (!item || item.expiresAt < Date.now()) {
    res.status(404).send("Not found or expired");
    return;
  }
  res.setHeader("Content-Type", item.contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(item.png);
});

/* ── GET /api/canva/status ─────────────────────────────────────
   Always reports "ready" — there is no auth state any more. */
router.get("/status", (_req, res) => {
  res.json({ connected: true, mode: "deep-link" });
});

/* ── Stub for weekly-digest's optional Canva call ──────────────
   Returns null edit_url so callers know nothing was created. */
export async function canvaUploadSvgAndCreateDesign(
  _svg: string,
  _title: string,
): Promise<{ edit_url?: string }> {
  return {};
}

export default router;
