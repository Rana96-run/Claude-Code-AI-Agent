import { Router } from "express";

const router = Router();

const APIFY_TIMEOUT_MS = 90_000;

/* ─── Competitor → identifiers map ────────────────────────────────────────
   Different Apify actors take different inputs (FB query, Google domain,
   IG handle). We keep them all in one place. */
const COMPETITORS: Record<
  string,
  { domain: string; ig: string | null; fb_query: string; aliases: string[] }
> = {
  daftra:  { domain: "daftra.com",    ig: "daftra",  fb_query: "daftra",  aliases: ["دفترة", "daftra"] },
  dafater: { domain: "dafater.com",   ig: null,      fb_query: "dafater", aliases: ["دفاتر", "dafater"] },
  foodics: { domain: "foodics.com",   ig: "foodics", fb_query: "foodics", aliases: ["فودكس", "foodics"] },
  rewaa:   { domain: "rewaatech.com", ig: "rewaa",   fb_query: "rewaa",   aliases: ["رواء", "rewaa"] },
  wafeq:   { domain: "wafeq.com",     ig: "wafeq",   fb_query: "wafeq",   aliases: ["وافق", "wafeq"] },
  smacc:   { domain: "smacc.com",     ig: null,      fb_query: "smacc",   aliases: ["smacc"] },
  zoho:    { domain: "zoho.com",      ig: "zoho",    fb_query: "zoho books", aliases: ["zoho", "zoho books"] },
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

  const cap = Math.min(Math.max(Number(limit) || 10, 1), 30);
  let actor = "";
  let input: any = {};

  if (source === "facebook") {
    // Apify's official FB Ads scraper
    actor = "curious_coder~facebook-ads-library-scraper";
    const fbUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(c.fb_query)}&search_type=keyword_unordered`;
    input = { urls: [{ url: fbUrl }], count: cap };
  } else if (source === "google") {
    actor = "apify~google-ads-transparency-scraper";
    input = { domains: [c.domain], region: country, maxItems: cap };
  } else if (source === "instagram") {
    if (!c.ig) {
      res.status(400).json({ error: `No Instagram handle known for ${competitor}` });
      return;
    }
    actor = "apify~instagram-scraper";
    input = { username: [c.ig], resultsType: "posts", resultsLimit: cap, addParentData: false };
  }

  const result = await runActor(actor, input, token);
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error(`[competitor-ads] ${source} failed`, result);
    res.status(502).json({ error: result.error, source, competitor: c.domain });
    return;
  }

  // Normalize across sources
  const ads = result.items.slice(0, cap).map((it) => normalize(it, source));

  res.status(200).json({
    ok: true,
    source,
    competitor: c.domain,
    country,
    count: ads.length,
    ads,
  });
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
