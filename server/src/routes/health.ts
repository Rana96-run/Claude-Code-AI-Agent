import { Router } from "express";
import { libraryStats } from "../lib/content-library.js";
import { sheetsHealthCheck } from "../lib/sheets-client.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "qoyod-creative-os", time: new Date().toISOString() });
});

router.get("/health/sheets", async (_req, res) => {
  const [sheetsStatus, libStats] = await Promise.all([
    sheetsHealthCheck(),
    Promise.resolve(libraryStats()),
  ]);
  res.json({
    sheets: sheetsStatus,
    local_library: libStats,
    sheets_id: process.env.GOOGLE_SHEETS_ID ?? null,
  });
});

export default router;
