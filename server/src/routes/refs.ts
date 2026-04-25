import { Router } from "express";

const router = Router();

/* GET /api/refs — returns design reference links (Figma, etc.)
   so the client can render them as quick-access chips. */
router.get("/refs", (_req, res) => {
  res.json({
    figma: {
      /* Accept either naming convention — the rebuilt server uses
         FIGMA_APP_URL / FIGMA_WEB_URL, but the original .env had
         QOYOD_APP_DESIGN_SYSTEM / QOYOD_DESIGN_SYSTEM. Either works. */
      app:
        process.env.FIGMA_APP_URL ||
        process.env.QOYOD_APP_DESIGN_SYSTEM ||
        null,
      web:
        process.env.FIGMA_WEB_URL ||
        process.env.QOYOD_DESIGN_SYSTEM ||
        null,
    },
    miro: {
      board_id: process.env.MIRO_BOARD_ID || null,
      board_url: process.env.MIRO_BOARD_ID
        ? `https://miro.com/app/board/${process.env.MIRO_BOARD_ID}/`
        : null,
    },
  });
});

export default router;
