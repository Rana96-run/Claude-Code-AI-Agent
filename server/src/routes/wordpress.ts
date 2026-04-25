import { Router } from "express";

const router = Router();

router.get("/wp-config", (_req, res) => {
  const siteUrl = process.env.WP_SITE_URL || "";
  const username = process.env.WP_USERNAME || "";
  const configured = !!(siteUrl && username && process.env.WP_APP_PASSWORD);
  res.status(200).json({ siteUrl, username, configured });
});

router.post("/wp-draft", async (req, res) => {
  const {
    siteUrl: bodySiteUrl,
    username: bodyUsername,
    appPassword: bodyAppPassword,
    title,
    content,
    slug,
  } = req.body ?? {};

  const siteUrl = bodySiteUrl || process.env.WP_SITE_URL || "";
  const username = bodyUsername || process.env.WP_USERNAME || "";
  const appPassword = bodyAppPassword || process.env.WP_APP_PASSWORD || "";

  if (!siteUrl || !username || !appPassword) {
    res.status(400).json({
      error:
        "WordPress credentials not configured. Set WP_SITE_URL, WP_USERNAME, and WP_APP_PASSWORD.",
    });
    return;
  }

  if (!content) {
    res.status(400).json({ error: "Missing required field: content" });
    return;
  }

  const base = String(siteUrl).replace(/\/$/, "");
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  try {
    const wpRes = await fetch(`${base}/wp-json/wp/v2/pages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Qoyod Landing Page",
        content,
        status: "draft",
        slug: slug || "qoyod-landing",
      }),
    });

    const data = (await wpRes.json()) as {
      id?: number;
      link?: string;
      code?: string;
      message?: string;
    };

    if (!wpRes.ok || data.code) {
      res.status(wpRes.status).json({ error: data.message || `WordPress error ${wpRes.status}` });
      return;
    }

    res.status(200).json({
      id: data.id,
      previewUrl: data.link ? `${data.link}?preview=true` : null,
      editUrl: `${base}/wp-admin/post.php?post=${data.id}&action=edit`,
    });
  } catch (err) {
    req.log.error({ err }, "WordPress upload error");
    const message = err instanceof Error ? err.message : "Upload failed";
    res.status(500).json({ error: message });
  }
});

export default router;
