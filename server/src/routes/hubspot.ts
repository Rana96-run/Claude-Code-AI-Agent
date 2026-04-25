import { Router } from "express";

const router = Router();

router.get("/hs-config", (_req, res) => {
  const configured = !!process.env.HS_ACCESS_TOKEN;
  res.status(200).json({ configured });
});

router.post("/hs-draft", async (req, res) => {
  const { title, content, slug } = req.body ?? {};
  const accessToken = req.body?.accessToken || process.env.HS_ACCESS_TOKEN;

  if (!accessToken) {
    res.status(400).json({ error: "HubSpot access token not configured." });
    return;
  }
  if (!content) {
    res.status(400).json({ error: "Missing required field: content" });
    return;
  }

  const pageSlug = (slug || `qoyod-lp-${Date.now()}`).toLowerCase().replace(/\s+/g, "-");
  const pageTitle = title || "Qoyod Landing Page";

  const body = {
    name: pageTitle,
    htmlTitle: pageTitle,
    slug: pageSlug,
    state: "DRAFT",
    htmlBody: content,
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Try landing-pages first, then site-pages as fallback
  const endpoints = [
    "https://api.hubapi.com/cms/v3/pages/landing-pages",
    "https://api.hubapi.com/cms/v3/pages/site-pages",
  ];

  let lastError = "";

  for (const endpoint of endpoints) {
    try {
      const hsRes = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = (await hsRes.json()) as {
        id?: string | number;
        url?: string;
        state?: string;
        category?: string;
        message?: string;
        errors?: Array<{ message: string }>;
      };

      if (hsRes.ok && data.id) {
        const portalId = String(accessToken).split("-")[2] || "";
        const editUrl = `https://app.hubspot.com/pages/${portalId}/edit/${data.id}`;
        res.status(200).json({
          id: data.id,
          editUrl,
          previewUrl: data.url || null,
          endpoint: endpoint.includes("landing") ? "landing-pages" : "site-pages",
        });
        return;
      }

      const errMsg =
        data.message ||
        (data.errors || []).map((e) => e.message).join(", ") ||
        `HubSpot error ${hsRes.status}`;
      lastError = errMsg;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Request failed";
    }
  }

  req.log.error({ lastError }, "HubSpot draft creation failed");
  res.status(500).json({ error: lastError });
});

export default router;
