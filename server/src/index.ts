import app from "./app.js";
import { startSocialPoller } from "./lib/hubspot-social-poller.js";
import { startCompetitorPoller } from "./lib/competitor-poller.js";
import { startWeeklyDigest } from "./lib/weekly-digest.js";
import { startMonitorScheduler } from "./lib/competitor-monitor.js";

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
  startSocialPoller();
  startCompetitorPoller();
  startWeeklyDigest();
  startMonitorScheduler();
});
