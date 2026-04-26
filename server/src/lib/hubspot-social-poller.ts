/**
 * HubSpot Social Poller
 *
 * Runs every 5 minutes, fetches recently-published social broadcasts from
 * HubSpot, and fires the Qoyod Creative Agent for each new post so it can
 * analyse, repurpose, or log the content automatically.
 *
 * State: last-seen finishedAt timestamp stored in data/hs-social-cursor.json
 */

import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

const DATA_DIR  = path.resolve(process.cwd(), "data");
const CURSOR_PATH = path.join(DATA_DIR, "hs-social-cursor.json");

const POLL_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes

/* ── channel key → human-readable label ───────────────────────── */
const CHANNEL_LABELS: Record<string, string> = {
  "17841403066920736": "Instagram",
  "1331104100252779":  "Facebook",
  "13231520":          "LinkedIn",
  "752153850132455424": "Twitter/X",
  "UCfuMHRo60rYN0wHeKxz9DsA": "YouTube",
};

function channelLabel(channelKey: string): string {
  for (const [id, label] of Object.entries(CHANNEL_LABELS)) {
    if (channelKey.includes(id)) return label;
  }
  return channelKey.split(":")[0] ?? channelKey;
}

/* ── cursor helpers ──────────────────────────────────────────────*/
function loadCursor(): number {
  try {
    if (!fs.existsSync(CURSOR_PATH)) return Date.now() - 24 * 60 * 60 * 1_000; // 24 h ago on first run
    const { lastFinishedAt } = JSON.parse(fs.readFileSync(CURSOR_PATH, "utf8"));
    return typeof lastFinishedAt === "number" ? lastFinishedAt : Date.now() - 24 * 60 * 60 * 1_000;
  } catch {
    return Date.now() - 24 * 60 * 60 * 1_000;
  }
}

function saveCursor(lastFinishedAt: number) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CURSOR_PATH, JSON.stringify({ lastFinishedAt }, null, 2), "utf8");
  } catch (e) {
    logger.warn({ err: String(e) }, "hs-poller: cursor save failed");
  }
}

/* ── HubSpot fetch ────────────────────────────────────────────── */
interface Broadcast {
  broadcastGuid: string;
  channelKey: string;
  finishedAt: number;
  status: string;
  messageUrl?: string;
  content?: {
    body?: string;
    title?: string;
    thumbUrl?: string;
  };
}

async function fetchRecentSuccess(since: number): Promise<Broadcast[]> {
  const token = process.env.HS_ACCESS_TOKEN;
  if (!token) {
    logger.warn("hs-poller: HS_ACCESS_TOKEN not set, skipping poll");
    return [];
  }

  const url = "https://api.hubapi.com/broadcast/v1/broadcasts?status=SUCCESS&limit=25";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    logger.warn({ status: res.status, body: await res.text() }, "hs-poller: API error");
    return [];
  }

  const data = await res.json() as Broadcast[];
  if (!Array.isArray(data)) return [];

  return data.filter((b) => b.finishedAt && b.finishedAt > since);
}

/* ── agent trigger ────────────────────────────────────────────── */
async function fireAgent(b: Broadcast) {
  const channel = channelLabel(b.channelKey);
  const postBody = b.content?.body ?? b.content?.title ?? "(no text)";
  const postUrl  = b.messageUrl ?? "";

  const agentBody = [
    `New Qoyod social post published on ${channel}. Save it to the library silently — no analysis, no Slack notification.`,
    ``,
    `Post text: ${postBody}`,
    postUrl ? `Live URL: ${postUrl}` : "",
    `Broadcast ID: ${b.broadcastGuid}`,
    ``,
    `Action: Call content_library_save ONCE with:`,
    `  id = "${b.broadcastGuid}"`,
    `  channel = "${channel}"`,
    `  type = (detect: reel/story/post; default to "post")`,
    `  published_at = ISO timestamp now`,
    `  content_text = the post body above`,
    `  post_url = the live URL above (if present)`,
    `  topic = (infer the Qoyod product/concept from post text)`,
    `  tone = (infer: educational/promotional/community/humour)`,
    `  quality = brand voice (1-10), dialect_correct (Saudi?), hook_strength (1-10), clarity (1-10), notes`,
    ``,
    `Then write a one-line summary like "Saved post to library: <topic>" and stop. Do NOT call any other tool. Do NOT analyze. Do NOT search competitors. Do NOT write to memory. Do NOT generate designs. Do NOT save HTML to Drive.`,
  ].filter(Boolean).join("\n");

  const payload = {
    zap_type: "social_media_published",
    source:   "hubspot_poller",
    channel,
    broadcast_guid: b.broadcastGuid,
    post_url: postUrl,
    post_body: postBody,
    body: agentBody,
  };

  // Post to our own webhook endpoint (runs in the same process)
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:" + (process.env.PORT ?? "8080");
  try {
    const r = await fetch(`${baseUrl}/api/agent/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await r.json() as { task_id?: string };
    logger.info({ channel, broadcast_guid: b.broadcastGuid, task_id: result.task_id }, "hs-poller: agent triggered");
  } catch (e) {
    logger.error({ err: String(e), broadcast_guid: b.broadcastGuid }, "hs-poller: agent trigger failed");
  }
}

/* ── main poll cycle ─────────────────────────────────────────── */
async function poll() {
  const cursor = loadCursor();
  logger.info({ since: new Date(cursor).toISOString() }, "hs-poller: checking new broadcasts");

  const newBroadcasts = await fetchRecentSuccess(cursor);

  if (newBroadcasts.length === 0) {
    logger.info("hs-poller: no new posts");
    return;
  }

  logger.info({ count: newBroadcasts.length }, "hs-poller: new posts found");

  // Sort oldest-first so agent tasks are created in publish order
  newBroadcasts.sort((a, b) => a.finishedAt - b.finishedAt);

  let maxFinishedAt = cursor;
  for (const b of newBroadcasts) {
    await fireAgent(b);
    if (b.finishedAt > maxFinishedAt) maxFinishedAt = b.finishedAt;
  }

  saveCursor(maxFinishedAt);
}

/* ── public API ──────────────────────────────────────────────── */
let handle: NodeJS.Timeout | null = null;

export function startSocialPoller() {
  if (handle) return;
  if (!process.env.HS_ACCESS_TOKEN) {
    logger.warn("hs-poller: HS_ACCESS_TOKEN missing — social poller disabled");
    return;
  }

  // First poll after 10s (let server finish booting), then every 5 min
  setTimeout(async () => {
    await poll().catch((e) => logger.error({ err: String(e) }, "hs-poller: initial poll error"));
    handle = setInterval(() => {
      poll().catch((e) => logger.error({ err: String(e) }, "hs-poller: poll error"));
    }, POLL_INTERVAL_MS);
    if (handle?.unref) handle.unref();
  }, 10_000);

  logger.info({ interval_min: 5 }, "hs-poller: HubSpot social poller started");
}

export function stopSocialPoller() {
  if (handle) {
    clearInterval(handle);
    handle = null;
  }
}

/** Manual trigger for /api/social/poll-now */
export async function pollNow() {
  return poll();
}
