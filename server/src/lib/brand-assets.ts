/**
 * Brand assets — Qoyod logo loader.
 *
 * Resolution order:
 *   1. Local file at server/assets/qoyod-logo.png  (drop the official
 *      transparent PNG here — fastest, no network)
 *   2. Google Drive download via the existing service-account auth, using
 *      QOYOD_LOGO_FILE_ID env var (default: the transparent logo-01 in
 *      "01.Qoyod Logo > 4.Transparent > Qoyod" found in the team's Drive)
 *   3. null — design renderer falls back to the text mark "قيود"
 *
 * Cached in memory after first successful load.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface BrandLogo {
  buffer: Buffer;
  mimeType: string;
  dataUrl: string;
}

let LOGO: BrandLogo | null = null;
let logoLoadPromise: Promise<BrandLogo | null> | null = null;

let LOGO_BOOKKEEPING: BrandLogo | null = null;
let logoBookkeepingPromise: Promise<BrandLogo | null> | null = null;

/* Default: transparent QOYOD main logo in the team's Drive.
   Override via QOYOD_LOGO_FILE_ID env var. */
const DEFAULT_LOGO_FILE_ID = "167HvB9Qk_46j3hQQI-QBb8x43cnOJhj1";

/* Bookkeeping dual-logo (مسك الدفاتر + QOYOD).
   Override via QOYOD_BOOKKEEPING_LOGO_FILE_ID env var.
   Falls back to main logo if not set. */
const DEFAULT_BOOKKEEPING_LOGO_FILE_ID = process.env.QOYOD_BOOKKEEPING_LOGO_FILE_ID || "";

const LOCAL_LOGO_PATHS = [
  path.resolve(process.cwd(), "server", "assets", "qoyod-logo.png"),
  path.resolve(process.cwd(), "assets", "qoyod-logo.png"),
  path.resolve(__dirname, "../../assets/qoyod-logo.png"),
];

const LOCAL_BOOKKEEPING_LOGO_PATHS = [
  path.resolve(process.cwd(), "server", "assets", "qoyod-bookkeeping-logo.png"),
  path.resolve(process.cwd(), "assets", "qoyod-bookkeeping-logo.png"),
  path.resolve(__dirname, "../../assets/qoyod-bookkeeping-logo.png"),
];

function tryLoadLocalLogo(): BrandLogo | null {
  for (const p of LOCAL_LOGO_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const buffer = fs.readFileSync(p);
        const mimeType = "image/png";
        const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
        logger.info({ path: p, kb: Math.round(buffer.length / 1024) }, "brand-assets: loaded local logo");
        return { buffer, mimeType, dataUrl };
      }
    } catch { /* keep trying */ }
  }
  return null;
}

/* Re-create the same auth-resolution flow as routes/drive.ts so we don't
   need a second set of env vars. */
function getServiceAccountCreds(): object | null {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (b64) {
    try { return JSON.parse(Buffer.from(b64, "base64").toString("utf8")); } catch { /* fall through */ }
  }
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      let s = inline.trim();
      if (s.startsWith('"') && s.endsWith('"')) {
        try { s = JSON.parse(s) as string; } catch { /* keep */ }
      }
      s = s.replace(/\\n/g, "\n");
      return JSON.parse(s);
    } catch { /* fall through */ }
  }
  return null;
}

async function downloadFromDrive(fileId: string): Promise<BrandLogo | null> {
  const scopes = ["https://www.googleapis.com/auth/drive.readonly"];
  const creds = getServiceAccountCreds();
  if (!creds) {
    logger.warn("brand-assets: no service-account creds configured, skipping Drive download");
    return null;
  }
  try {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes });
    const drive = google.drive({ version: "v3", auth });
    const meta = await drive.files.get({
      fileId,
      fields: "id,name,mimeType",
      supportsAllDrives: true,
    });
    const mimeType = meta.data.mimeType ?? "image/png";

    const file = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );
    const buffer = Buffer.from(file.data as ArrayBuffer);
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    logger.info(
      { fileId, name: meta.data.name, kb: Math.round(buffer.length / 1024) },
      "brand-assets: downloaded logo from Drive",
    );
    return { buffer, mimeType, dataUrl };
  } catch (e) {
    logger.warn({ fileId, err: String(e) }, "brand-assets: Drive download failed");
    return null;
  }
}

export async function getBrandLogo(): Promise<BrandLogo | null> {
  if (LOGO) return LOGO;
  if (logoLoadPromise) return logoLoadPromise;
  logoLoadPromise = (async () => {
    const local = tryLoadLocalLogo();
    if (local) { LOGO = local; return local; }
    const fileId = process.env.QOYOD_LOGO_FILE_ID || DEFAULT_LOGO_FILE_ID;
    const drive = await downloadFromDrive(fileId);
    if (drive) { LOGO = drive; return drive; }
    logger.warn("brand-assets: no Qoyod logo available — design renderer will use text mark fallback");
    return null;
  })();
  return logoLoadPromise;
}

/** Load the bookkeeping dual-logo (مسك الدفاتر + QOYOD).
 *  Falls back to the main Qoyod logo if no bookkeeping logo is configured. */
export async function getBookkeepingLogo(): Promise<BrandLogo | null> {
  if (LOGO_BOOKKEEPING) return LOGO_BOOKKEEPING;
  if (logoBookkeepingPromise) return logoBookkeepingPromise;
  logoBookkeepingPromise = (async () => {
    /* Try local file first */
    for (const p of LOCAL_BOOKKEEPING_LOGO_PATHS) {
      try {
        if (fs.existsSync(p)) {
          const buffer = fs.readFileSync(p);
          const mimeType = "image/png";
          const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
          logger.info({ path: p }, "brand-assets: loaded local bookkeeping logo");
          LOGO_BOOKKEEPING = { buffer, mimeType, dataUrl };
          return LOGO_BOOKKEEPING;
        }
      } catch { /* keep trying */ }
    }
    /* Try Drive if a specific file ID is configured */
    const fileId = DEFAULT_BOOKKEEPING_LOGO_FILE_ID;
    if (fileId) {
      const drive = await downloadFromDrive(fileId);
      if (drive) { LOGO_BOOKKEEPING = drive; return drive; }
    }
    /* Fall back to main logo */
    logger.info("brand-assets: no bookkeeping logo configured — falling back to main logo");
    return getBrandLogo();
  })();
  return logoBookkeepingPromise;
}

/** Pre-warm the logo cache at server boot. Safe to call multiple times. */
export async function warmBrandAssets(): Promise<void> {
  try {
    await getBrandLogo();
    /* Warm bookkeeping logo only if it has its own file ID */
    if (DEFAULT_BOOKKEEPING_LOGO_FILE_ID) await getBookkeepingLogo();
  } catch (e) {
    logger.warn({ err: String(e) }, "brand-assets: warm-up failed");
  }
}

/** Synchronous accessor — returns the cached main logo data URL or null. */
export function getBrandLogoDataUrlSync(): string | null {
  return LOGO?.dataUrl ?? null;
}

/** Synchronous accessor — returns bookkeeping logo data URL, or main logo
 *  as fallback, or null if nothing is loaded yet. */
export function getBookkeepingLogoDataUrlSync(): string | null {
  return LOGO_BOOKKEEPING?.dataUrl ?? LOGO?.dataUrl ?? null;
}
