import { Router, type Request } from "express";
import crypto from "crypto";

const router = Router();

const CLIENT_ID = process.env.MIRO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.MIRO_CLIENT_SECRET ?? "";
const STATIC_TOKEN = process.env.MIRO_ACCESS_TOKEN ?? "";
const MIRO_AUTH = "https://miro.com/oauth/authorize";
const MIRO_TOKEN = "https://api.miro.com/v1/oauth/token";
const MIRO_API = "https://api.miro.com/v2";

/* ── in-memory token store ── */
type MiroToken = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  team_id?: string;
};
let miroToken: MiroToken | null = STATIC_TOKEN
  ? { access_token: STATIC_TOKEN, expires_at: Date.now() + 365 * 24 * 3600 * 1000 }
  : null;

function getRedirectUri(req: Request): string {
  const fwdHost = req.headers["x-forwarded-host"] as string | undefined;
  const host = process.env.PUBLIC_HOST ?? fwdHost ?? req.headers.host ?? "localhost:8080";
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}/api/miro/callback`;
}

router.get("/auth-url", (req, res) => {
  if (!CLIENT_ID) return res.status(500).json({ error: "MIRO_CLIENT_ID not configured" });
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    state,
    scope: "boards:read boards:write",
  });
  res.json({ auth_url: `${MIRO_AUTH}?${params}` });
});

router.get("/callback", async (req, res) => {
  const { code, error } = req.query as Record<string, string>;
  if (error)
    return res.send(
      `<script>window.opener?.postMessage({miro_error:"${error}"},"*");window.close();</script>`
    );
  if (!code)
    return res.send(
      `<script>window.opener?.postMessage({miro_error:"no_code"},"*");window.close();</script>`
    );
  try {
    const redirect_uri = getRedirectUri(req);
    const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri });
    const r = await fetch(MIRO_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: body.toString(),
    });
    const data = (await r.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      team_id?: string;
      error?: string;
      error_description?: string;
    };
    if (!r.ok || data.error)
      throw new Error(data.error_description || data.error || "Token exchange failed");
    miroToken = {
      access_token: data.access_token!,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
      team_id: data.team_id,
    };
    res.send(`<script>window.opener?.postMessage({miro_ok:true},"*");window.close();</script>`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.send(
      `<script>window.opener?.postMessage({miro_error:"${msg.replace(/"/g, "'")}"},"*");window.close();</script>`
    );
  }
});

router.get("/status", (_req, res) => {
  res.json({ connected: !!miroToken && Date.now() < miroToken.expires_at });
});

router.delete("/logout", (_req, res) => {
  miroToken = STATIC_TOKEN
    ? { access_token: STATIC_TOKEN, expires_at: Date.now() + 365 * 24 * 3600 * 1000 }
    : null;
  res.json({ ok: true });
});

router.post("/create-board", async (req, res) => {
  if (!miroToken) return res.status(401).json({ error: "Not connected to Miro" });
  const { board_name = "Qoyod Creative OS — Workflow" } = req.body as { board_name?: string };
  try {
    const br = await fetch(`${MIRO_API}/boards`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${miroToken.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: board_name }),
    });
    const board = (await br.json()) as { id?: string; viewLink?: string; message?: string };
    if (!br.ok || !board.id) throw new Error(board.message || "Board creation failed");
    const boardId = board.id;
    const viewLink = board.viewLink || `https://miro.com/app/board/${boardId}/`;
    await drawWorkflow(miroToken.access_token, boardId);
    res.json({ ok: true, board_id: boardId, view_link: viewLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

router.post("/update-board", async (req, res) => {
  if (!miroToken) return res.status(401).json({ error: "Not connected to Miro" });
  const { board_id } = req.body as { board_id?: string };
  if (!board_id) return res.status(400).json({ error: "board_id required" });
  try {
    await drawWorkflow(miroToken.access_token, board_id);
    res.json({ ok: true, view_link: `https://miro.com/app/board/${board_id}/` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

/* Draw سمعه agent-specific workflow onto an existing board */
router.post("/draw-agent-flow", async (req, res) => {
  if (!miroToken) return res.status(401).json({ error: "Not connected to Miro" });
  const boardId =
    (req.body as { board_id?: string }).board_id ??
    process.env.MIRO_BOARD_ID;
  if (!boardId) return res.status(400).json({ error: "board_id required or set MIRO_BOARD_ID" });
  try {
    await drawAgentFlow(miroToken.access_token, boardId);
    res.json({ ok: true, view_link: `https://miro.com/app/board/${boardId}/` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

async function drawWorkflow(token: string, boardId: string) {
  const BASE = `${MIRO_API}/boards/${boardId}`;
  const hdrs = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const post = async (path: string, body: object) => {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(body),
    });
    const d = (await r.json()) as { message?: string; description?: string; id?: string };
    if (!r.ok)
      throw new Error(`${path}: ${d.message || d.description || JSON.stringify(d)}`);
    return d as { id: string };
  };

  const NAVY = "#021544",
    TEAL = "#17A3A4",
    GOLD = "#F5A623",
    PURPLE = "#7D2AE8",
    GREEN = "#22C55E",
    BLUE = "#21759b",
    ORANGE = "#ff7a59",
    YELLOW = "#FFD02F",
    WHITE = "#FFFFFF",
    DARK = "#0f2744";

  const BANNER_W = 1150,
    COL_W = 240,
    COL_H = 70,
    EXP_W = 160,
    EXP_H = 60;
  const C = [-405, -135, 135, 405];
  const E = [-462, -277, -92, 93, 278, 463];

  type Node = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    fill: string;
    text: string;
  };
  const nodes: Node[] = [
    { id: "title", x: 0, y: 0, w: BANNER_W, h: 65, label: "Qoyod Creative OS  |  نظام تسويق متكامل", fill: NAVY, text: WHITE },
    { id: "brand", x: C[0], y: 130, w: COL_W, h: COL_H, label: "Brand Kit\nالهوية والألوان", fill: TEAL, text: WHITE },
    { id: "prod", x: C[1], y: 130, w: COL_W, h: COL_H, label: "Products  x13\n13 منتجاً", fill: TEAL, text: WHITE },
    { id: "persona", x: C[2], y: 130, w: COL_W, h: COL_H, label: "Audience / ICP\n10 شرائح", fill: TEAL, text: WHITE },
    { id: "intel", x: C[3], y: 130, w: COL_W, h: COL_H, label: "Market Intel\nتحليل المنافسين", fill: TEAL, text: WHITE },
    { id: "ai", x: 0, y: 260, w: BANNER_W, h: 65, label: "Nano Banana AI Engine  |  توليد · تعديل · مراجعة", fill: GOLD, text: NAVY },
    { id: "content", x: C[0], y: 390, w: COL_W, h: COL_H, label: "Content Studio\nنصوص + كابشن A/B", fill: DARK, text: WHITE },
    { id: "design", x: C[1], y: 390, w: COL_W, h: COL_H, label: "Design Studio\nSVG + إعلانات", fill: DARK, text: WHITE },
    { id: "campaigns", x: C[2], y: 390, w: COL_W, h: COL_H, label: "Campaigns + Email\nخطة 360°", fill: DARK, text: WHITE },
    { id: "landing", x: C[3], y: 390, w: COL_W, h: COL_H, label: "Landing Pages\nHTML جاهز للنشر", fill: DARK, text: WHITE },
    { id: "canva", x: E[0], y: 520, w: EXP_W, h: EXP_H, label: "Canva\nExport", fill: PURPLE, text: WHITE },
    { id: "svgdl", x: E[1], y: 520, w: EXP_W, h: EXP_H, label: "SVG\nDownload", fill: GREEN, text: WHITE },
    { id: "miro2", x: E[2], y: 520, w: EXP_W, h: EXP_H, label: "Miro\nWorkflow", fill: YELLOW, text: NAVY },
    { id: "dlhtml", x: E[3], y: 520, w: EXP_W, h: EXP_H, label: "HTML\nDownload", fill: TEAL, text: WHITE },
    { id: "wp", x: E[4], y: 520, w: EXP_W, h: EXP_H, label: "WordPress\nDraft", fill: BLUE, text: WHITE },
    { id: "hs", x: E[5], y: 520, w: EXP_W, h: EXP_H, label: "HubSpot\nPage", fill: ORANGE, text: WHITE },
  ];

  const idMap: Record<string, string> = {};
  for (const n of nodes) {
    const isBanner = n.id === "title" || n.id === "ai";
    const item = await post("/shapes", {
      data: {
        shape: isBanner ? "rectangle" : "round_rectangle",
        content: `<p style="text-align:center"><strong>${n.label.replace(
          /\n/g,
          "</strong><br><strong>"
        )}</strong></p>`,
      },
      style: {
        fillColor: n.fill,
        color: n.text,
        borderColor: n.fill,
        borderWidth: "2",
        fontSize: isBanner ? "16" : "13",
      },
      geometry: { width: n.w, height: n.h },
      position: { x: n.x, y: n.y },
    });
    idMap[n.id] = item.id;
  }

  const conns: [string, string][] = [
    ["brand", "ai"],
    ["prod", "ai"],
    ["persona", "ai"],
    ["intel", "ai"],
    ["ai", "content"],
    ["ai", "design"],
    ["ai", "campaigns"],
    ["ai", "landing"],
    ["design", "canva"],
    ["design", "svgdl"],
    ["campaigns", "miro2"],
    ["landing", "dlhtml"],
    ["landing", "wp"],
    ["landing", "hs"],
  ];

  for (const [from, to] of conns) {
    if (!idMap[from] || !idMap[to]) continue;
    await post("/connectors", {
      startItem: { id: idMap[from] },
      endItem: { id: idMap[to] },
      style: {
        strokeColor: TEAL,
        strokeWidth: "2",
        startStrokeCap: "none",
        endStrokeCap: "arrow",
      },
    }).catch(() => {});
  }
}

async function drawAgentFlow(token: string, boardId: string) {
  const BASE = `${MIRO_API}/boards/${boardId}`;
  const hdrs = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const post = async (path: string, body: object) => {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(body),
    });
    const d = (await r.json()) as { message?: string; description?: string; id?: string };
    if (!r.ok) throw new Error(`${path}: ${d.message || d.description || JSON.stringify(d)}`);
    return d as { id: string };
  };

  const NAVY = "#021544", TEAL = "#17A3A4", GOLD = "#F5A623",
    GREEN = "#22C55E", PURPLE = "#7D2AE8", ORANGE = "#ff7a59",
    DARK = "#0f2744", WHITE = "#FFFFFF", RED = "#ef4444";

  /* ── Layout constants ── */
  const BW = 1400;          // banner width
  const COL = 5;            // trigger columns
  const TW = 220, TH = 65;  // trigger box size
  const PW = 160, PH = 60;  // persona box
  const OW = 160, OH = 60;  // output box

  const TY = 100, CY = 250, PY = 410, TOOLY = 560, OUTY = 720;
  const tXs = [-440, -220, 0, 220, 440];   // 5 trigger x positions
  const pXs = [-480, -300, -120, 60, 240, 420]; // 6 persona x positions
  const oXs = [-490, -310, -130, 50, 230, 410, 590]; // 7 output x positions

  type Node = { id: string; x: number; y: number; w: number; h: number; label: string; fill: string; text: string; shape?: string };
  const nodes: Node[] = [
    /* Title banner */
    { id: "title", x: 0, y: 0, w: BW, h: 70, label: "سمعه — وكيل التسويق الذكي | كيف تشتغل؟", fill: NAVY, text: WHITE, shape: "rectangle" },

    /* Trigger row */
    { id: "t1", x: tXs[0], y: TY, w: TW, h: TH, label: "UI يدوي\nشغّل سمعه", fill: DARK, text: WHITE },
    { id: "t2", x: tXs[1], y: TY, w: TW, h: TH, label: "Webhook\nAsana / HubSpot", fill: DARK, text: WHITE },
    { id: "t3", x: tXs[2], y: TY, w: TW, h: TH, label: "Zapier\nأتمتة خارجية", fill: DARK, text: WHITE },
    { id: "t4", x: tXs[3], y: TY, w: TW, h: TH, label: "Slack @mention\nتكليف مباشر", fill: DARK, text: WHITE },
    { id: "t5", x: tXs[4], y: TY, w: TW, h: TH, label: "Scheduled\nمواعيد تلقائية", fill: DARK, text: WHITE },

    /* Core processing */
    { id: "core", x: 0, y: CY, w: BW, h: 70, label: "سمعه Core · Claude Sonnet 4.5 | اختيار شخصية → dedup → ذاكرة → cache الأدوات", fill: GOLD, text: NAVY, shape: "rectangle" },

    /* Personas */
    { id: "p1", x: pXs[0], y: PY, w: PW, h: PH, label: "مصمم جرافيك\nSVG · Canva · صور", fill: TEAL, text: WHITE },
    { id: "p2", x: pXs[1], y: PY, w: PW, h: PH, label: "متخصص السوشيال\nمحتوى + تحليل", fill: TEAL, text: WHITE },
    { id: "p3", x: pXs[2], y: PY, w: PW, h: PH, label: "كاتب محتوى\nكوبي · مدونة · RSA", fill: TEAL, text: WHITE },
    { id: "p4", x: pXs[3], y: PY, w: PW, h: PH, label: "أخصائي CRO\nلاندنج · A/B · SEO", fill: TEAL, text: WHITE },
    { id: "p5", x: pXs[4], y: PY, w: PW, h: PH, label: "إيميل & سيكونس\nwelcome · nurture", fill: TEAL, text: WHITE },
    { id: "p6", x: pXs[5], y: PY, w: PW, h: PH, label: "كل الأدوات\nمهام متعددة", fill: PURPLE, text: WHITE },

    /* Tools summary row */
    { id: "tools", x: 0, y: TOOLY, w: BW, h: 70, label: "20+ أداة | SVG · صور AI · محتوى · إيميلات · لاندنج · خطط حملات · SEO · A/B · هاشتاقات · مراجعة...", fill: DARK, text: TEAL, shape: "rectangle" },

    /* Outputs */
    { id: "o1", x: oXs[0], y: OUTY, w: OW, h: OH, label: "Canva\nتصميم جاهز", fill: PURPLE, text: WHITE },
    { id: "o2", x: oXs[1], y: OUTY, w: OW, h: OH, label: "Google Drive\nملفات + SVG", fill: GREEN, text: WHITE },
    { id: "o3", x: oXs[2], y: OUTY, w: OW, h: OH, label: "WordPress\nمسودة نشر", fill: "#21759b", text: WHITE },
    { id: "o4", x: oXs[3], y: OUTY, w: OW, h: OH, label: "HubSpot\nصفحة / بريد", fill: ORANGE, text: WHITE },
    { id: "o5", x: oXs[4], y: OUTY, w: OW, h: OH, label: "Miro Board\nخريطة ومسار", fill: "#FFD02F", text: NAVY },
    { id: "o6", x: oXs[5], y: OUTY, w: OW, h: OH, label: "Slack\nرد تلقائي", fill: "#4A154B", text: WHITE },
    { id: "o7", x: oXs[6], y: OUTY, w: OW, h: OH, label: "Asana Task\nمهمة متابعة", fill: RED, text: WHITE },
  ];

  const idMap: Record<string, string> = {};
  for (const n of nodes) {
    const isBanner = n.shape === "rectangle";
    const item = await post("/shapes", {
      data: {
        shape: isBanner ? "rectangle" : "round_rectangle",
        content: `<p style="text-align:center"><strong>${n.label.replace(/\n/g, "</strong><br><strong>")}</strong></p>`,
      },
      style: {
        fillColor: n.fill,
        color: n.text,
        borderColor: n.fill,
        borderWidth: "2",
        fontSize: isBanner ? "15" : "12",
      },
      geometry: { width: n.w, height: n.h },
      position: { x: n.x, y: n.y },
    });
    idMap[n.id] = item.id;
  }

  /* Connectors */
  const conns: [string, string][] = [
    ["t1","core"],["t2","core"],["t3","core"],["t4","core"],["t5","core"],
    ["core","p1"],["core","p2"],["core","p3"],["core","p4"],["core","p5"],["core","p6"],
    ["p1","tools"],["p2","tools"],["p3","tools"],["p4","tools"],["p5","tools"],["p6","tools"],
    ["tools","o1"],["tools","o2"],["tools","o3"],["tools","o4"],["tools","o5"],["tools","o6"],["tools","o7"],
  ];
  for (const [from, to] of conns) {
    if (!idMap[from] || !idMap[to]) continue;
    await post("/connectors", {
      startItem: { id: idMap[from] },
      endItem: { id: idMap[to] },
      style: { strokeColor: TEAL, strokeWidth: "2", startStrokeCap: "none", endStrokeCap: "arrow" },
    }).catch(() => {});
  }
}

export default router;
