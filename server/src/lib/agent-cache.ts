import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "./logger.js";

/* ══════════════════════════════════════════════════════════════════
   Tool-response cache — the single biggest token/credit saver.

   Most of our tools are pure: same input → same output (copy review,
   hashtag generation, RSA drafts, competitor scrape of a fixed URL).
   We hash (tool_name, input_json, persona) and cache the result on
   disk with a TTL. A repeat run inside the TTL window returns the
   cached result in ~1ms instead of firing a fresh Anthropic call.

   Three tiers of TTL (`ttlFor`):
     - deterministic      (1 week)   — review, translate, brand_fact_lookup
     - semi-fresh         (24h)      — copy gen, RSA, hashtags, email seq
     - time-sensitive     (1h)       — competitor scrape, metrics, LP audit

   Cache can be disabled per-call via {skipCache:true} — used when the
   user explicitly asks for a fresh variant.
   ══════════════════════════════════════════════════════════════════ */

const CACHE_DIR = path.resolve(process.cwd(), "data");
const CACHE_PATH = path.join(CACHE_DIR, "agent-tool-cache.json");

const TTL_LONG  = 7 * 24 * 60 * 60 * 1000;  // 1 week
const TTL_DAY   = 24 * 60 * 60 * 1000;       // 24h
const TTL_HOUR  = 60 * 60 * 1000;             // 1h

const LONG_TOOLS = new Set([
  "review_copy",
  "translate_copy",
  "brand_fact_lookup",
  "generate_seo_meta",
]);

const HOUR_TOOLS = new Set([
  "analyze_competitor_content",
  "analyze_landing_page",
  "analyze_metrics_report",
]);

/* Tools we never cache — side effects or personalized output. */
const NO_CACHE = new Set([
  "save_to_drive",
  "upload_canva",
  "publish_wordpress",
  "publish_hubspot",
  "slack_post",
  "create_asana_task",
  "generate_nb_image",      // image gen — always regenerate if asked
  "generate_openai_image",  // DALL-E — always regenerate
]);

function ttlFor(tool: string): number {
  if (NO_CACHE.has(tool)) return 0;
  if (LONG_TOOLS.has(tool)) return TTL_LONG;
  if (HOUR_TOOLS.has(tool)) return TTL_HOUR;
  return TTL_DAY;
}

interface CacheEntry {
  key: string;
  tool: string;
  created_at: number;
  expires_at: number;
  output: unknown;
  hits: number;
  tokens_saved_estimate: number; // rough: chars/4
}

const MEM = new Map<string, CacheEntry>();
const MAX_ENTRIES = 2000;

/* Stats we surface via /api/agent/cache/stats so the team sees the ROI. */
const stats = {
  hits: 0,
  misses: 0,
  skips: 0,
  tokens_saved_estimate: 0,
};

function keyOf(tool: string, input: unknown, persona?: string): string {
  const canonical = JSON.stringify(input, Object.keys((input ?? {}) as object).sort());
  return crypto
    .createHash("sha1")
    .update(`${tool}|${persona ?? ""}|${canonical}`)
    .digest("hex");
}

function load() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return;
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    const entries: CacheEntry[] = Array.isArray(raw?.entries) ? raw.entries : [];
    const now = Date.now();
    for (const e of entries) {
      if (e.expires_at > now) MEM.set(e.key, e);
    }
    if (raw?.stats) Object.assign(stats, raw.stats);
    logger.info({ count: MEM.size }, "agent-cache: hydrated from disk");
  } catch (e) {
    logger.warn({ err: String(e) }, "agent-cache: load failed");
  }
}
load();

let writeQueued = false;
function persist() {
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    writeQueued = false;
    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
      const entries = Array.from(MEM.values());
      const tmp = CACHE_PATH + ".tmp";
      fs.writeFileSync(
        tmp,
        JSON.stringify({ entries, stats, written_at: Date.now() }, null, 2),
        "utf8",
      );
      fs.renameSync(tmp, CACHE_PATH);
    } catch (e) {
      logger.error({ err: String(e) }, "agent-cache: persist failed");
    }
  }, 800);
}

function evictIfFull() {
  if (MEM.size <= MAX_ENTRIES) return;
  /* Drop the oldest by created_at. */
  const arr = Array.from(MEM.values()).sort((a, b) => a.created_at - b.created_at);
  const drop = arr.slice(0, MEM.size - MAX_ENTRIES);
  for (const e of drop) MEM.delete(e.key);
}

export interface CacheLookup {
  hit: boolean;
  output?: unknown;
  age_ms?: number;
}

export function cacheLookup(
  tool: string,
  input: unknown,
  persona?: string,
  opts?: { skipCache?: boolean },
): CacheLookup {
  if (opts?.skipCache) {
    stats.skips++;
    return { hit: false };
  }
  const ttl = ttlFor(tool);
  if (ttl <= 0) {
    stats.skips++;
    return { hit: false };
  }
  const key = keyOf(tool, input, persona);
  const entry = MEM.get(key);
  if (!entry) {
    stats.misses++;
    return { hit: false };
  }
  if (entry.expires_at < Date.now()) {
    MEM.delete(key);
    stats.misses++;
    return { hit: false };
  }
  entry.hits += 1;
  stats.hits++;
  stats.tokens_saved_estimate += entry.tokens_saved_estimate;
  persist();
  return { hit: true, output: entry.output, age_ms: Date.now() - entry.created_at };
}

export function cacheStore(tool: string, input: unknown, output: unknown, persona?: string) {
  const ttl = ttlFor(tool);
  if (ttl <= 0) return;
  const key = keyOf(tool, input, persona);
  const now = Date.now();
  const outStr = (() => {
    try { return JSON.stringify(output); } catch { return ""; }
  })();
  MEM.set(key, {
    key,
    tool,
    created_at: now,
    expires_at: now + ttl,
    output,
    hits: 0,
    tokens_saved_estimate: Math.ceil(outStr.length / 4),
  });
  evictIfFull();
  persist();
}

export function cacheStats() {
  return {
    ...stats,
    entries: MEM.size,
    hit_rate:
      stats.hits + stats.misses === 0
        ? 0
        : Number((stats.hits / (stats.hits + stats.misses)).toFixed(3)),
  };
}

export function cacheClear() {
  MEM.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.skips = 0;
  stats.tokens_saved_estimate = 0;
  persist();
}
