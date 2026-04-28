import { Router } from "express";

const router = Router();

const META_API_VERSION = "v21.0";
const FETCH_TIMEOUT_MS = 15_000;

// Map our competitor IDs/names → search terms for Meta Ad Library
// Page IDs are more reliable than name search but require knowing them upfront.
const COMPETITOR_HANDLES: Record<string, { search_terms: string; aliases: string[] }> = {
  daftra: { search_terms: "Daftra", aliases: ["دفترة", "daftra"] },
  dafater: { search_terms: "Dafater", aliases: ["دفاتر", "dafater"] },
  foodics: { search_terms: "Foodics", aliases: ["فودكس", "foodics"] },
  rewaa: { search_terms: "Rewaa", aliases: ["رواء", "rewaa"] },
  wafeq: { search_terms: "Wafeq", aliases: ["وافق", "wafeq"] },
  smacc: { search_terms: "SMACC", aliases: ["smacc"] },
  alostaz: { search_terms: "Al-Ostaz", aliases: ["الأستاذ", "al-ostaz", "alostaz"] },
  zoho: { search_terms: "Zoho Books", aliases: ["zoho", "zoho books"] },
};

function resolveSearch(input: string): string {
  const lc = input.trim().toLowerCase();
  for (const [, def] of Object.entries(COMPETITOR_HANDLES)) {
    if (def.aliases.some((a) => lc.includes(a.toLowerCase()))) return def.search_terms;
  }
  return input.trim();
}

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/meta-ads/health
   Verifies that META_ACCESS_TOKEN is set and a real token (not the literal
   "pasted-here-DO-NOT-USE" placeholder). Useful for debugging Railway env.
   ─────────────────────────────────────────────────────────────────────────── */
router.get("/meta-ads/health", async (_req, res) => {
  const token = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  if (!token) {
    res.status(200).json({ ok: false, configured: false, error: "META_ACCESS_TOKEN not set" });
    return;
  }
  // Probe the Graph API with a tiny call
  try {
    const r = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/me?access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const j = (await r.json().catch(() => ({}))) as { error?: { message?: string }; name?: string };
    if (!r.ok) {
      res.status(200).json({ ok: false, configured: true, app_id: appId, error: j?.error?.message || `HTTP ${r.status}` });
      return;
    }
    res.status(200).json({ ok: true, configured: true, app_id: appId, account: j.name || "unknown" });
  } catch (err) {
    res.status(200).json({ ok: false, configured: true, error: err instanceof Error ? err.message : String(err) });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   POST /api/meta-ads/search
   Body: { competitor: "Rewaa" | "rewaa" | "رواء", country?: "SA", limit?: 12 }
   Returns: { ads: [{ id, page_name, snapshot_url, creative_body, creative_link_caption,
                       cta_type, platforms, started, languages, image_url? }, ...] }
   Uses Meta Ad Library /ads_archive endpoint. Free, no special permission needed
   for political/social ads or business ads in country=SA.
   ─────────────────────────────────────────────────────────────────────────── */
router.post("/meta-ads/search", async (req, res) => {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    res.status(500).json({ error: "META_ACCESS_TOKEN not set in Railway" });
    return;
  }

  const { competitor, country = "SA", limit = 12 } = req.body ?? {};
  if (!competitor || typeof competitor !== "string") {
    res.status(400).json({ error: "Missing competitor name" });
    return;
  }

  const search = resolveSearch(competitor);
  const fields = [
    "id",
    "page_id",
    "page_name",
    "ad_snapshot_url",
    "ad_creative_bodies",
    "ad_creative_link_captions",
    "ad_creative_link_titles",
    "ad_creative_link_descriptions",
    "publisher_platforms",
    "ad_delivery_start_time",
    "ad_delivery_stop_time",
    "languages",
  ].join(",");

  const url =
    `https://graph.facebook.com/${META_API_VERSION}/ads_archive?` +
    `search_terms=${encodeURIComponent(search)}` +
    `&ad_reached_countries=["${country}"]` +
    `&ad_active_status=ALL` +
    `&fields=${fields}` +
    `&limit=${Math.min(Math.max(Number(limit) || 12, 1), 50)}` +
    `&access_token=${encodeURIComponent(token)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const j = (await r.json().catch(() => ({}))) as {
      data?: Array<{
        id: string;
        page_id?: string;
        page_name?: string;
        ad_snapshot_url?: string;
        ad_creative_bodies?: string[];
        ad_creative_link_captions?: string[];
        ad_creative_link_titles?: string[];
        ad_creative_link_descriptions?: string[];
        publisher_platforms?: string[];
        ad_delivery_start_time?: string;
        ad_delivery_stop_time?: string;
        languages?: string[];
      }>;
      error?: { message?: string; code?: number };
    };

    if (!r.ok || j.error) {
      res.status(r.ok ? 502 : r.status).json({
        error: j.error?.message || `Meta Ad Library returned ${r.status}`,
      });
      return;
    }

    const ads = (j.data || []).map((ad) => ({
      id: ad.id,
      page_name: ad.page_name || "Unknown",
      page_id: ad.page_id,
      snapshot_url: ad.ad_snapshot_url,
      // Meta returns these as arrays — most ads have just one creative body
      hook: ad.ad_creative_link_titles?.[0] || "",
      body: ad.ad_creative_bodies?.[0] || "",
      caption: ad.ad_creative_link_captions?.[0] || "",
      description: ad.ad_creative_link_descriptions?.[0] || "",
      platforms: ad.publisher_platforms || [],
      started: ad.ad_delivery_start_time,
      stopped: ad.ad_delivery_stop_time,
      languages: ad.languages || [],
    }));

    res.status(200).json({ ok: true, search_term: search, country, count: ads.length, ads });
  } catch (err) {
    clearTimeout(timeoutId);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
