import { Router } from "express";
import { diffSnapshots, buildAIPrompt, formatSlackBlocks, type CompetitorSnapshot } from "../lib/competitor-weekly-report.js";

const router = Router();

const APIFY_TIMEOUT_MS = 90_000;

/* ─── Competitor → identifiers map ────────────────────────────────────────
   Different Apify actors take different inputs (FB query, Google domain,
   IG handle). IG handles verified manually — null = no public IG. */
const COMPETITORS: Record<
  string,
  { domain: string; ig: string | null; fb_query: string; aliases: string[] }
> = {
  daftra:  { domain: "daftra.com",     ig: "daftraonline", fb_query: "daftra",  aliases: ["دفترة", "daftra"] },
  dafater: { domain: "dafater.com",    ig: null,           fb_query: "dafater", aliases: ["دفاتر", "dafater"] },
  foodics: { domain: "foodics.com",    ig: "foodics",      fb_query: "foodics", aliases: ["فودكس", "foodics"] },
  rewaa:   { domain: "rewaatech.com",  ig: "rewaatech",    fb_query: "rewaa",   aliases: ["رواء", "rewaa"] },
  wafeq:   { domain: "wafeq.com",      ig: "wafeq.app",    fb_query: "wafeq",   aliases: ["وافق", "wafeq"] },
  smacc:   { domain: "smacc.com",      ig: null,           fb_query: "smacc",   aliases: ["smacc"] },
  zoho:    { domain: "zoho.com",       ig: "zoho",         fb_query: "zoho books", aliases: ["zoho", "zoho books"] },
};

function resolve(input: string) {
  const lc = input.trim().toLowerCase();
  for (const [, def] of Object.entries(COMPETITORS)) {
    if (def.aliases.some((a) => lc.includes(a.toLowerCase()))) return def;
  }
  return null;
}

/* ─── Apify runner ────────────────────────────────────────────────────────
   Calls run-sync-get-dataset-items: starts the actor and returns the dataset
   contents in a single HTTP call (vs async runs that need polling). */
async function runActor(actor: string, input: object, token: string): Promise<{ ok: true; items: any[] } | { ok: false; status: number; error: string }> {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=80`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APIFY_TIMEOUT_MS);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return { ok: false, status: r.status, error: errText.slice(0, 300) || `Apify ${r.status}` };
    }

    const items = (await r.json()) as any[];
    return { ok: true, items: Array.isArray(items) ? items : [] };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

/* ─── GET /api/competitor-ads/health ─────────────────────────────────────── */
router.get("/competitor-ads/health", async (_req, res) => {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(200).json({ ok: false, configured: false, error: "APIFY_TOKEN not set" });
    return;
  }
  try {
    const r = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const j = (await r.json().catch(() => ({}))) as { data?: { username?: string; usageMonthly?: any }; error?: any };
    if (!r.ok) {
      res.status(200).json({ ok: false, configured: true, error: j?.error?.message || `HTTP ${r.status}` });
      return;
    }
    res.status(200).json({ ok: true, configured: true, username: j.data?.username || "unknown" });
  } catch (err) {
    res.status(200).json({ ok: false, configured: true, error: err instanceof Error ? err.message : String(err) });
  }
});

/* ─── POST /api/competitor-ads ────────────────────────────────────────────
   Body: { source: "facebook" | "google" | "instagram", competitor: string,
           country?: "SA", limit?: 10 }
   Returns normalized {ads:[{page_name, hook, body, image_url, detail_url,
   platforms, started}]} regardless of source. */
router.post("/competitor-ads", async (req, res) => {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: "APIFY_TOKEN not set in Railway" });
    return;
  }

  const { source, competitor, country = "SA", limit = 10 } = req.body ?? {};
  if (!competitor || typeof competitor !== "string") {
    res.status(400).json({ error: "Missing competitor" });
    return;
  }
  if (!source || !["facebook", "google", "instagram"].includes(source)) {
    res.status(400).json({ error: 'source must be "facebook", "google", or "instagram"' });
    return;
  }

  const c = resolve(competitor);
  if (!c) {
    res.status(400).json({ error: `Unknown competitor: ${competitor}` });
    return;
  }

  // Cap user-facing display, but always request at least 10 from Apify (FB actor minimum)
  const cap = Math.min(Math.max(Number(limit) || 10, 1), 30);
  const apifyMinCount = Math.max(cap, 10);
  let actor = "";
  let input: any = {};

  if (source === "facebook") {
    actor = "curious_coder~facebook-ads-library-scraper";
    const fbUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(c.fb_query)}&search_type=keyword_unordered`;
    input = { urls: [{ url: fbUrl }], count: apifyMinCount };
  } else if (source === "google") {
    // fortuitous_pirate's Google Ads Transparency scraper (8K+ runs, 200+ users).
    // Uses simpler input shape: query (advertiser/domain) + region.
    actor = "fortuitous_pirate~google-ads-transparency-scraper";
    input = {
      query: c.domain,
      region: country,
      maxItems: apifyMinCount,
    };
  } else if (source === "instagram") {
    if (!c.ig) {
      res.status(400).json({ error: `No Instagram handle known for ${competitor}` });
      return;
    }
    actor = "apify~instagram-scraper";
    // Use directUrls (more reliable than username search)
    input = {
      directUrls: [`https://www.instagram.com/${c.ig}/`],
      resultsType: "posts",
      resultsLimit: apifyMinCount,
      addParentData: false,
    };
  }

  const result = await runActor(actor, input, token);
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error(`[competitor-ads] ${source} failed`, result);
    res.status(502).json({ error: result.error, source, competitor: c.domain, actor });
    return;
  }

  // Normalize across sources
  const ads = result.items.slice(0, cap).map((it) => normalize(it, source));

  // Debug mode: include first raw item so we can see actual field names
  const debug = req.body?._debug;
  res.status(200).json({
    ok: true,
    source,
    competitor: c.domain,
    country,
    actor,
    count: ads.length,
    ads,
    ...(debug && result.items[0] ? { _raw_keys: Object.keys(result.items[0]).slice(0, 30), _raw_sample: result.items[0] } : {}),
  });
});

/* ─── POST /api/competitor-ads/weekly-report-preview ──────────────────────
   Manual trigger: scrapes 3 competitors right now, builds a fake "last
   week" baseline (empty for first run), runs AI summary, returns Slack
   blocks. Use this to validate the report format before wiring auto-cron. */
router.post("/competitor-ads/weekly-report-preview", async (req, res) => {
  const apifyToken = process.env.APIFY_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!apifyToken || !anthropicKey) {
    res.status(500).json({ error: "APIFY_TOKEN or ANTHROPIC_API_KEY not set" });
    return;
  }
  const { competitors = ["Daftra", "Foodics", "Rewaa"], country = "SA" } = req.body ?? {};

  // Fetch current week for each competitor (parallel)
  const thisWeek: CompetitorSnapshot[] = [];
  for (const compName of competitors) {
    const c = resolve(compName);
    if (!c) continue;
    const snap: CompetitorSnapshot = {
      competitor: compName,
      domain: c.domain,
      fetched_at: new Date().toISOString(),
    };
    // Run all 3 sources in parallel
    const results = await Promise.allSettled([
      runActor("curious_coder~facebook-ads-library-scraper", { urls: [{ url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(c.fb_query)}&search_type=keyword_unordered` }], count: 10 }, apifyToken),
      runActor("solidcode~ads-transparency-scraper", { startUrls: [{ url: `https://adstransparency.google.com/?region=${country}&domain=${c.domain}` }], maxResults: 10 }, apifyToken),
      c.ig
        ? runActor("apify~instagram-scraper", { directUrls: [`https://www.instagram.com/${c.ig}/`], resultsType: "posts", resultsLimit: 10, addParentData: false }, apifyToken)
        : Promise.resolve({ ok: true, items: [] } as const),
    ]);
    const fb = results[0].status === "fulfilled" && results[0].value.ok ? results[0].value.items.map((i) => normalize(i, "facebook")) : [];
    const goog = results[1].status === "fulfilled" && results[1].value.ok ? results[1].value.items.map((i) => normalize(i, "google")) : [];
    const ig = results[2].status === "fulfilled" && results[2].value.ok ? results[2].value.items.map((i) => normalize(i, "instagram")) : [];
    snap.facebook = fb;
    snap.google = goog;
    snap.instagram = ig;
    thisWeek.push(snap);
  }

  // For preview, treat lastWeek as empty so everything shows as "new"
  const diffs = thisWeek.map((tw) => diffSnapshots(tw, null));
  const weekLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const { system, user } = buildAIPrompt(diffs, weekLabel);

  // Call Anthropic for the AI summary (using same generate route logic)
  const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 2500,
      system,
      messages: [{ role: "user", content: user }, { role: "assistant", content: "{" }],
    }),
  });
  const aiData = (await aiResp.json().catch(() => ({}))) as any;
  let ai: any = {};
  try {
    const text = "{" + (aiData.content?.[0]?.text || "");
    ai = JSON.parse(text);
  } catch {
    ai = { headline: "AI parse failed", competitors: [], recommended_actions: [], alert: null };
  }

  const blocks = formatSlackBlocks(diffs, ai, weekLabel);
  res.status(200).json({ ok: true, week: weekLabel, diffs, ai, slack_blocks: blocks });
});

/* ─── GET /api/competitor-ads/actor-schema?id=user~name ───────────────────
   Returns the actor's input schema so we know what fields it expects. */
router.get("/competitor-ads/actor-schema", async (req, res) => {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: "APIFY_TOKEN not set" });
    return;
  }
  const id = String(req.query.id || "").trim();
  if (!id) {
    res.status(400).json({ error: "Missing id parameter" });
    return;
  }
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/${id}?token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(10000),
    });
    const j = (await r.json().catch(() => ({}))) as { data?: any };
    if (!r.ok) {
      res.status(r.status).json({ error: `HTTP ${r.status}` });
      return;
    }
    const a = j.data || {};
    res.status(200).json({
      id: `${a.username}~${a.name}`,
      title: a.title,
      defaultRunInput: a.defaultRunOptions?.input,
      exampleInput: a.exampleRunInput || a.defaultRunInput,
      inputSchema: a.inputSchema ? Object.keys(a.inputSchema?.properties || {}) : null,
      readme_excerpt: (a.readme || "").slice(0, 1000),
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/* ─── GET /api/competitor-ads/discover-actor?q=google+ads ─────────────────
   Helper to find the right Apify actor ID for a search term, since
   actor names change and there's no canonical list. */
router.get("/competitor-ads/discover-actor", async (req, res) => {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: "APIFY_TOKEN not set" });
    return;
  }
  const q = String(req.query.q || "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing q parameter" });
    return;
  }
  try {
    const r = await fetch(
      `https://api.apify.com/v2/store?search=${encodeURIComponent(q)}&limit=10&token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const j = (await r.json().catch(() => ({}))) as { data?: { items?: any[] } };
    const items = (j.data?.items || []).map((it: any) => ({
      id: `${it.username}~${it.name}`,
      title: it.title,
      runs: it.stats?.totalRuns,
      users: it.stats?.totalUsers,
    }));
    res.status(200).json({ q, count: items.length, items });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/* ─── Normalize each source's response into a common ad shape ────────── */
function normalize(item: any, source: string) {
  if (source === "facebook") {
    return {
      page_name: item.advertiser?.name || item.page_name || item.pageName || "",
      hook: item.snapshot?.title || item.title || "",
      body: item.snapshot?.body?.markdown || item.body || item.snapshot?.body?.text || "",
      caption: item.snapshot?.link_description || "",
      image_url: item.snapshot?.images?.[0]?.original_image_url || item.snapshot?.cards?.[0]?.original_image_url || null,
      detail_url: item.url || item.snapshotUrl || null,
      platforms: item.publisher_platform || item.publisherPlatforms || [],
      started: item.start_date_string || item.startDate,
    };
  }
  if (source === "google") {
    return {
      page_name: item.advertiserName || item.advertiser_name || "",
      hook: item.title || "",
      body: item.description || item.body || "",
      caption: item.format || "",
      image_url: item.imageUrl || item.image || null,
      detail_url: item.creativeUrl || item.url || null,
      platforms: ["Google " + (item.format || "Ad")],
      started: item.firstShown || item.lastShown,
    };
  }
  // instagram
  return {
    page_name: item.ownerUsername || item.owner_username || "",
    hook: (item.caption || "").split("\n")[0]?.slice(0, 80) || "",
    body: item.caption || "",
    caption: `${item.likesCount || 0} likes, ${item.commentsCount || 0} comments`,
    image_url: item.displayUrl || item.thumbnailUrl || null,
    detail_url: item.url || null,
    platforms: ["Instagram"],
    started: item.timestamp,
  };
}

export default router;
