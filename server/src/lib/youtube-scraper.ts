/**
 * YouTube Competitor Scraper
 *
 * Fetches the latest videos from a competitor's YouTube channel using the
 * YouTube Data API v3. Uses the existing Google service account (same as
 * Drive/Sheets) — requires YouTube Data API v3 to be enabled in the GCP
 * project the service account belongs to.
 *
 * Quota: each scrape uses ~2 quota units (channels.list + playlistItems.list).
 * Default daily quota is 10,000 units — plenty of headroom for weekly runs
 * across 5-10 competitors.
 *
 * Resolution path for competitor → channel:
 *   1. If COMPETITOR_YT[handle] has channelId, use it
 *   2. If it has a handle, look up via channels.list({forHandle})
 *   3. Otherwise, search.list({q: brandName}) (100 units — fallback only)
 */

import { google } from "googleapis";
import { logger } from "./logger.js";

const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

// Competitor → YouTube identifier. handle wins if both set.
// Fill in as you confirm the actual handles/IDs.
const COMPETITOR_YT: Record<
  string,
  { channelId?: string; handle?: string }
> = {
  daftra: { handle: "daftra" },
  foodics: { handle: "foodics" },
  rewaa: { handle: "rewaa" },
  wafeq: { handle: "wafeqaccounting" },
  smacc: { handle: "SMACCsoftware" },
  zoho: { handle: "Zoho" },
};

function parseServiceAccountJson(raw: string): object {
  let s = raw.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      s = JSON.parse(s) as string;
    } catch { /* keep */ }
  }
  s = s.replace(/\\n/g, "\n");
  return JSON.parse(s);
}

function getAuth() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  let creds: object | null = null;
  if (b64) {
    try {
      creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch { /* fall through */ }
  }
  if (!creds) {
    const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (inline) {
      try {
        creds = parseServiceAccountJson(inline);
      } catch { /* fall through */ }
    }
  }
  if (!creds) throw new Error("youtube-scraper: no service account credentials");
  return new google.auth.GoogleAuth({ credentials: creds, scopes: SCOPES });
}

function getYoutubeClient() {
  return google.youtube({ version: "v3", auth: getAuth() });
}

/* Resolve competitor key → YouTube channelId */
async function resolveChannelId(competitorKey: string): Promise<string | null> {
  const yt = getYoutubeClient();
  const def = COMPETITOR_YT[competitorKey.toLowerCase()];
  if (def?.channelId) return def.channelId;

  if (def?.handle) {
    try {
      const r = await yt.channels.list({
        forHandle: def.handle,
        part: ["id"],
      });
      const id = r.data.items?.[0]?.id;
      if (id) return id;
    } catch (e) {
      logger.warn(
        { handle: def.handle, err: String(e) },
        "youtube-scraper: handle lookup failed",
      );
    }
  }

  // Fallback: search by name (expensive — 100 quota units)
  try {
    const r = await yt.search.list({
      q: competitorKey,
      type: ["channel"],
      maxResults: 1,
      part: ["snippet"],
    });
    return r.data.items?.[0]?.id?.channelId ?? null;
  } catch {
    return null;
  }
}

export interface YoutubeVideo {
  page_name: string;     // channel name
  hook: string;          // video title
  body: string;          // description (truncated)
  caption: string;       // published date
  image_url: string | null; // thumbnail
  detail_url: string;    // youtube watch URL
  platforms: string[];   // ["YouTube"]
  started: string;       // publishedAt
}

export async function scrapeYoutubeChannel(
  competitorKey: string,
  limit = 10,
): Promise<{ ok: boolean; channelId?: string; videos: YoutubeVideo[]; error?: string }> {
  try {
    const channelId = await resolveChannelId(competitorKey);
    if (!channelId) {
      return { ok: false, videos: [], error: `No YouTube channel found for "${competitorKey}"` };
    }

    const yt = getYoutubeClient();

    // 1. Get channel's uploads playlist + display name (1 unit)
    const ch = await yt.channels.list({
      id: [channelId],
      part: ["snippet", "contentDetails"],
    });
    const channelData = ch.data.items?.[0];
    if (!channelData) return { ok: false, channelId, videos: [], error: "Channel not found" };
    const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads;
    const channelName = channelData.snippet?.title || competitorKey;
    if (!uploadsPlaylistId) {
      return { ok: false, channelId, videos: [], error: "No uploads playlist" };
    }

    // 2. Get latest videos from uploads playlist (1 unit)
    const items = await yt.playlistItems.list({
      playlistId: uploadsPlaylistId,
      part: ["snippet"],
      maxResults: Math.min(Math.max(limit, 1), 50),
    });

    const videos: YoutubeVideo[] = (items.data.items || []).map((it) => {
      const sn = it.snippet;
      const videoId = sn?.resourceId?.videoId || "";
      const thumb =
        sn?.thumbnails?.maxres?.url ||
        sn?.thumbnails?.high?.url ||
        sn?.thumbnails?.medium?.url ||
        sn?.thumbnails?.default?.url ||
        null;
      return {
        page_name: channelName,
        hook: sn?.title || "",
        body: (sn?.description || "").slice(0, 500),
        caption: sn?.publishedAt || "",
        image_url: thumb,
        detail_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        platforms: ["YouTube"],
        started: sn?.publishedAt || "",
      };
    });

    return { ok: true, channelId, videos };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ competitor: competitorKey, err: msg }, "youtube-scraper: failed");
    return {
      ok: false,
      videos: [],
      error: msg.includes("API has not been")
        ? "YouTube Data API v3 not enabled in your GCP project. Enable it at https://console.cloud.google.com/apis/library/youtube.googleapis.com"
        : msg,
    };
  }
}

/* Health check */
export async function youtubeHealthCheck(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Lightweight test: try resolving Qoyod's own channel
    const yt = getYoutubeClient();
    const ownChannel = process.env.YT_CHANNEL_ID;
    if (ownChannel) {
      await yt.channels.list({ id: [ownChannel], part: ["id"] });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
