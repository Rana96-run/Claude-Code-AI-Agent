/**
 * ZATCA News Watcher
 *
 * Pulls ZATCA-related news daily from:
 *   1. zatca.gov.sa/ar/MediaCenter/News (official Arabic news page)
 *   2. @ZATCA_Saudi Twitter (via Apify, optional)
 *
 * Synthesizes into a SHORT brief and makes it injectable into prompts.
 * When ZATCA announces a new wave / regulation / deadline, the agent knows
 * within 24h and can produce timely briefs (master prompt §7.2: ZATCA
 * news → fast-response within 24h).
 *
 * Storage: server/data/zatca-news.md
 * Refresh: every 6 hours
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "./logger.js";

const ZATCA_PATH = path.resolve(process.cwd(), "server/data/zatca-news.md");
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1_000; // 6h
const MAX_CHARS = 1500;

const ZATCA_NEWS_URL = "https://zatca.gov.sa/ar/MediaCenter/News";

interface NewsItem {
  source: string;
  title: string;
  body?: string;
  date?: string;
}

/* ─── Scrape ZATCA's news page via jina ──────────────────────────────── */
async function fetchZatcaNews(): Promise<NewsItem[]> {
  try {
    const r = await fetch(`https://r.jina.ai/${ZATCA_NEWS_URL}`, {
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return [];
    const text = await r.text();

    // Strip jina chrome
    const stripped = text
      .replace(/^Title:.*$/m, "")
      .replace(/^URL Source:.*$/m, "")
      .replace(/^Markdown Content:.*$/m, "");

    // Extract headlines — ZATCA's site uses fairly consistent line patterns
    // Lines that are 30-200 chars + contain Arabic = likely a news headline
    const lines = stripped
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 25 && l.length < 250)
      .filter((l) => /[؀-ۿ]/.test(l)); // Arabic characters

    // Dedupe + take top 10
    const seen = new Set<string>();
    const items: NewsItem[] = [];
    for (const l of lines) {
      const key = l.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ source: "zatca.gov.sa", title: l });
      if (items.length >= 10) break;
    }
    return items;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "zatca-watcher: news fetch failed",
    );
    return [];
  }
}

/* ─── @ZATCA_Saudi tweets via Apify (optional) ────────────────────────── */
async function fetchZatcaTweets(): Promise<NewsItem[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return [];
  const actor = "apidojo~tweet-scraper";
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=60`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twitterHandles: ["Zatca_Saudi"],
        tweetsDesired: 10,
        sort: "Latest",
      }),
      signal: AbortSignal.timeout(70_000),
    });
    if (!r.ok) return [];
    const items = (await r.json()) as any[];
    return (items || []).slice(0, 10).map((t) => ({
      source: "@ZATCA_Saudi",
      title: (t.text || t.full_text || "").slice(0, 200),
      date: t.createdAt,
    }));
  } catch {
    return [];
  }
}

/* ─── Synthesize raw items into actionable brief ────────────────────── */
async function synthesize(
  items: NewsItem[],
  callAI: (system: string, user: string, max: number) => Promise<any>,
): Promise<{ summary: string; deadlines: string[]; opportunities: string[] } | null> {
  if (items.length === 0) return null;
  const corpus = items
    .map((it, i) => `[${i + 1}] ${it.source} (${it.date || ""}): ${it.title}`)
    .join("\n");

  const system = `You read ZATCA (Saudi Zakat, Tax & Customs Authority) news + tweets.
Distill what's relevant for a Saudi accounting SaaS marketing team. Saudi Arabic dialect.
Return ONLY valid JSON:
{
  "summary": "جملتين عن آخر تحركات الزكاة/الضرائب هذا الأسبوع",
  "deadlines": ["مواعيد أو موجات قادمة (e-invoice waves, إقرارات, etc.)"],
  "opportunities": ["زوايا محتوى أو حملات يقدر قيود يطلقها بناءً على هذا الخبر"]
}`;
  try {
    return await callAI(system, corpus.slice(0, 5000), 1200);
  } catch {
    return null;
  }
}

function renderMarkdown(
  data: { summary: string; deadlines: string[]; opportunities: string[] },
  generated: string,
): string {
  return [
    `<!-- Generated: ${generated} -->`,
    ``,
    `# تنبيهات ZATCA — آخر تحديث`,
    ``,
    `## الملخص`,
    data.summary,
    ``,
    `## مواعيد ومراحل قادمة`,
    ...(data.deadlines || []).map((d) => `- ${d}`),
    ``,
    `## فرص محتوى لقيود`,
    ...(data.opportunities || []).map((o) => `- ${o}`),
  ]
    .join("\n")
    .slice(0, MAX_CHARS);
}

/* ─── Public API ──────────────────────────────────────────────────────── */

export async function refreshZatcaNews(
  callAI: (system: string, user: string, max: number) => Promise<any>,
): Promise<{ ok: boolean; items_seen: number; error?: string }> {
  try {
    fs.mkdirSync(path.dirname(ZATCA_PATH), { recursive: true });
    const [pageItems, tweets] = await Promise.all([fetchZatcaNews(), fetchZatcaTweets()]);
    const all = [...pageItems, ...tweets];
    if (all.length === 0) {
      return { ok: false, items_seen: 0, error: "No ZATCA news fetched" };
    }
    const data = await synthesize(all, callAI);
    if (!data) return { ok: false, items_seen: all.length, error: "AI synthesis failed" };
    fs.writeFileSync(ZATCA_PATH, renderMarkdown(data, new Date().toISOString()), "utf-8");
    logger.info({ items: all.length }, "zatca-watcher: refreshed");
    return { ok: true, items_seen: all.length };
  } catch (err) {
    return {
      ok: false,
      items_seen: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getZatcaSnippet(): string {
  try {
    const stat = fs.statSync(ZATCA_PATH);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > 14 * 24 * 60 * 60 * 1_000) return "";
    const text = fs.readFileSync(ZATCA_PATH, "utf-8").replace(/^<!--[\s\S]*?-->\s*/, "");
    return `\n\n--- ZATCA INTEL (recent — use for timely briefs) ---\n${text}\n--- END ZATCA ---\n`;
  } catch {
    return "";
  }
}

export function startZatcaWatcher(
  callAI: (system: string, user: string, max: number) => Promise<any>,
): void {
  const tick = async () => {
    try {
      const stat = fs.statSync(ZATCA_PATH);
      if (Date.now() - stat.mtimeMs < REFRESH_INTERVAL_MS) return;
    } catch {
      /* missing → refresh */
    }
    await refreshZatcaNews(callAI).catch(() => {});
  };
  setTimeout(tick, 60_000); // 1 min after server start
  setInterval(tick, 60 * 60 * 1_000); // check hourly, refresh if >6h old
  logger.info("zatca-watcher: started (6h cadence)");
}
