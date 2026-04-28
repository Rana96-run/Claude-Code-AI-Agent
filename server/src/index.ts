import app from "./app.js";
import { startSocialPoller } from "./lib/hubspot-social-poller.js";
import { startCompetitorPoller } from "./lib/competitor-poller.js";
import { startWeeklyDigest } from "./lib/weekly-digest.js";
import { startMonitorScheduler } from "./lib/competitor-monitor.js";
import { warmDesignRenderer } from "./lib/design-renderer.js";
import { warmBrandAssets } from "./lib/brand-assets.js";

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
  startSocialPoller();
  startCompetitorPoller();
  startWeeklyDigest();
  startMonitorScheduler();
  // Pre-load Arabic font cache so the first design call isn't slow
  warmDesignRenderer();
  // Pre-fetch the Qoyod logo from local file or Drive
  warmBrandAssets();
});
