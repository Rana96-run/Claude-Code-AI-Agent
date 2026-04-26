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
  const rawHost =
    process.env.PUBLIC_HOST ??
    (req.headers["x-forwarded-host"] as string | undefined) ??
    req.headers.host ??
    "localhost:8080";
  if (/^https?:\/\//i.test(rawHost)) {
    return `${rawHost.replace(/\/+$/, "")}/api/miro/callback`;
  }
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ??
    (rawHost.includes("localhost") ? "http" : "https");
  return `${proto}://${rawHost}/api/miro/callback`;
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
  const { board_id, clear = true } = req.body as { board_id?: string; clear?: boolean };
  if (!board_id) return res.status(400).json({ error: "board_id required" });
  try {
    if (clear) await clearBoard(miroToken.access_token, board_id);
    await drawAgentFlow(miroToken.access_token, board_id);
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

/* Delete every item on a board so we can start fresh */
async function clearBoard(token: string, boardId: string) {
  const hdrs = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const url = cursor
      ? `${MIRO_API}/boards/${boardId}/items?limit=50&cursor=${cursor}`
      : `${MIRO_API}/boards/${boardId}/items?limit=50`;
    const r = await fetch(url, { headers: hdrs });
    if (!r.ok) break;
    const data = (await r.json()) as { data?: { id: string }[]; cursor?: string };
    const items = data.data ?? [];
    for (const item of items) {
      await fetch(`${MIRO_API}/boards/${boardId}/items/${item.id}`, {
        method: "DELETE",
        headers: hdrs,
      }).catch(() => {});
      deleted++;
    }
    cursor = data.cursor;
  } while (cursor);
  return deleted;
}

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

/* ── Simplified column flow: APIs → Triggers → Roles → Actions → Outputs ── */
async function drawAgentFlow(token: string, boardId: string) {
  const BASE = `${MIRO_API}/boards/${boardId}`;
  const hdrs = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const post = async (path: string, body: object) => {
    const r = await fetch(`${BASE}${path}`, { method: "POST", headers: hdrs, body: JSON.stringify(body) });
    const d = (await r.json()) as { message?: string; description?: string; id?: string };
    if (!r.ok) throw new Error(`${path}: ${d.message || d.description || JSON.stringify(d)}`);
    return d as { id: string };
  };

  const NAVY = "#021544", TEAL = "#17A3A4", GOLD = "#F5A623";
  const GREEN = "#22C55E", PURPLE = "#7D2AE8", ORANGE = "#ff7a59";
  const DARK = "#0f2744", WHITE = "#FFFFFF", INDIGO = "#4f46e5";
  const BLUE = "#0284c7", PINK = "#db2777";

  /* ── Layout ── */
  const CARD_W = 260;
  const CARD_H = 80;
  const GAP_Y  = 24;   // vertical gap between cards
  const GAP_X  = 140;  // horizontal gap between columns
  const COLS   = 5;
  const TOTAL_W = COLS * CARD_W + (COLS - 1) * GAP_X;
  const X0 = -(TOTAL_W / 2);           // left edge of col 0
  const cx = (col: number) => X0 + col * (CARD_W + GAP_X) + CARD_W / 2;
  const lx = (col: number) => X0 + col * (CARD_W + GAP_X);
  const ry = (row: number) => 220 + row * (CARD_H + GAP_Y);

  type Node = { id: string; col: number; row: number; label: string; sub: string; fill: string };

  /* ── 5 items per column max ── */
  const columns: Node[][] = [
    // Col 0 — APIs / Connectors
    [
      { id: "api_ai",      col: 0, row: 0, label: "Claude + Gemini",    sub: "AI core + image gen",        fill: DARK   },
      { id: "api_social",  col: 0, row: 1, label: "HubSpot + Slack",    sub: "Social, CRM, @mention",      fill: ORANGE },
      { id: "api_publish", col: 0, row: 2, label: "WordPress + Canva",  sub: "Publish & design export",    fill: PURPLE },
      { id: "api_storage", col: 0, row: 3, label: "Google Drive",       sub: "File storage & links",       fill: GREEN  },
      { id: "api_tasks",   col: 0, row: 4, label: "Asana + Miro",       sub: "Tasks & visual boards",      fill: BLUE   },
    ],
    // Col 1 — Triggers
    [
      { id: "tr_ui",       col: 1, row: 0, label: "UI (Quick Form)",    sub: "Manual request in app",      fill: DARK   },
      { id: "tr_mention",  col: 1, row: 1, label: "Slack @mention",     sub: "Direct team request",        fill: "#4A154B" },
      { id: "tr_webhook",  col: 1, row: 2, label: "Webhook / Zapier",   sub: "External automation",        fill: DARK   },
      { id: "tr_hs",       col: 1, row: 3, label: "HubSpot Poller",     sub: "Every 5 min — new posts",    fill: ORANGE },
      { id: "tr_comp",     col: 1, row: 4, label: "Competitor Poller",  sub: "Every 6h — IG/TikTok/X",    fill: PINK   },
    ],
    // Col 2 — Roles (personas)
    [
      { id: "r_designer",  col: 2, row: 0, label: "Designer",           sub: "SVG ads, Canva, images",     fill: TEAL   },
      { id: "r_social",    col: 2, row: 1, label: "Social Media",       sub: "Captions + competitor intel",fill: TEAL   },
      { id: "r_writer",    col: 2, row: 2, label: "Content Writer",     sub: "Copy, blog, Google Ads",     fill: TEAL   },
      { id: "r_cro",       col: 2, row: 3, label: "CRO / Email",        sub: "Landing pages, A/B, email",  fill: TEAL   },
      { id: "r_intel",     col: 2, row: 4, label: "Intelligence",       sub: "Library + memory + insights",fill: INDIGO },
    ],
    // Col 3 — Actions (tools)
    [
      { id: "act_content",  col: 3, row: 0, label: "Generate Content",  sub: "Captions, copy, scripts",    fill: DARK   },
      { id: "act_design",   col: 3, row: 1, label: "Generate Design",   sub: "SVG ads + AI images",        fill: DARK   },
      { id: "act_page",     col: 3, row: 2, label: "Build Page / Email",sub: "Landing page + sequences",   fill: DARK   },
      { id: "act_campaign", col: 3, row: 3, label: "Build Campaign",    sub: "360° plan + RSA + A/B",      fill: DARK   },
      { id: "act_intel",    col: 3, row: 4, label: "Intel & Memory",    sub: "Competitors + library + memory", fill: INDIGO },
    ],
    // Col 4 — Outputs
    [
      { id: "out_canva",   col: 4, row: 0, label: "Canva Design",       sub: "Ready to edit & publish",    fill: PURPLE },
      { id: "out_social",  col: 4, row: 1, label: "HubSpot / Slack",    sub: "Published post or reply",    fill: ORANGE },
      { id: "out_web",     col: 4, row: 2, label: "WordPress",          sub: "Draft page or blog post",    fill: BLUE   },
      { id: "out_drive",   col: 4, row: 3, label: "Google Drive",       sub: "File + shareable link",      fill: GREEN  },
      { id: "out_memory",  col: 4, row: 4, label: "Library & Memory",   sub: "Stored for future tasks",    fill: INDIGO },
    ],
  ];

  const COL_LABELS = [
    "APIs / Connectors", "Triggers", "Roles", "Actions", "Outputs",
  ];
  const COL_FILLS = [DARK, "#0c2f52", "#0c2f52", "#0c2f52", "#0c2f52"];

  /* ── Build nodes list ── */
  type ShapeNode = {
    id: string; x: number; y: number; w: number; h: number;
    label: string; fill: string; text: string;
    shape: "rectangle" | "round_rectangle"; fontSize: string;
  };
  const nodes: ShapeNode[] = [];

  // Title banner
  nodes.push({
    id: "title", x: X0, y: -120, w: TOTAL_W, h: 64,
    label: "Qoyod Creative OS  —  نظام الذكاء التسويقي",
    fill: NAVY, text: WHITE, shape: "rectangle", fontSize: "18",
  });
  // Sub-banner
  nodes.push({
    id: "sub", x: X0, y: -46, w: TOTAL_W, h: 40,
    label: "Claude Sonnet 4.5  ·  persona routing  ·  long-term memory  ·  cache",
    fill: GOLD, text: NAVY, shape: "rectangle", fontSize: "13",
  });

  // Column headers
  for (let c = 0; c < COLS; c++) {
    nodes.push({
      id: `h${c}`, x: lx(c), y: 140, w: CARD_W, h: 56,
      label: COL_LABELS[c],
      fill: COL_FILLS[c], text: TEAL, shape: "round_rectangle", fontSize: "14",
    });
  }

  // Cards
  for (const col of columns) {
    for (const n of col) {
      nodes.push({
        id: n.id, x: lx(n.col), y: ry(n.row), w: CARD_W, h: CARD_H,
        label: `${n.label}\n${n.sub}`,
        fill: n.fill, text: WHITE, shape: "round_rectangle", fontSize: "12",
      });
    }
  }

  /* ── Create all shapes ── */
  const idMap: Record<string, string> = {};
  for (const n of nodes) {
    const item = await post("/shapes", {
      data: {
        shape: n.shape,
        content: `<p style="text-align:center"><strong>${n.label.split("\n")[0]}</strong>${
          n.label.includes("\n") ? `<br><span style="font-size:10px;opacity:0.85">${n.label.split("\n")[1]}</span>` : ""
        }</p>`,
      },
      style: {
        fillColor: n.fill,
        color: n.text,
        borderColor: n.fill,
        borderWidth: n.shape === "rectangle" ? "3" : "2",
        fontSize: n.fontSize,
      },
      geometry: { width: n.w, height: n.h },
      position: { x: n.x, y: n.y },
    });
    idMap[n.id] = item.id;
  }

  /* ── Connectors — one per logical link only ── */
  const connect = async (a: string, b: string, colour = TEAL, dashed = false) => {
    if (!idMap[a] || !idMap[b]) return;
    await post("/connectors", {
      startItem: { id: idMap[a] },
      endItem:   { id: idMap[b] },
      style: { strokeColor: colour, strokeWidth: "2",
               strokeStyle: dashed ? "dashed" : "normal",
               startStrokeCap: "none", endStrokeCap: "arrow" },
    }).catch(() => {});
  };

  // APIs → Triggers (5 clean 1:1 links)
  await connect("api_ai",      "tr_ui",      TEAL);
  await connect("api_social",  "tr_mention", "#4A154B");
  await connect("api_social",  "tr_hs",      ORANGE);
  await connect("api_ai",      "tr_comp",    PINK, true);
  await connect("api_tasks",   "tr_webhook", BLUE);

  // Triggers → Roles (5 clean links)
  await connect("tr_ui",      "r_designer", TEAL);
  await connect("tr_mention", "r_social",   TEAL);
  await connect("tr_webhook", "r_writer",   TEAL);
  await connect("tr_hs",      "r_social",   ORANGE);
  await connect("tr_comp",    "r_intel",    PINK, true);

  // Roles → Actions (5 clean links)
  await connect("r_designer", "act_design",   TEAL);
  await connect("r_social",   "act_content",  TEAL);
  await connect("r_writer",   "act_page",     TEAL);
  await connect("r_cro",      "act_campaign", TEAL);
  await connect("r_intel",    "act_intel",    INDIGO);

  // Actions → Outputs (5 clean links)
  await connect("act_design",   "out_canva",  PURPLE);
  await connect("act_content",  "out_social", ORANGE);
  await connect("act_page",     "out_web",    BLUE);
  await connect("act_campaign", "out_drive",  GREEN);
  await connect("act_intel",    "out_memory", INDIGO);
}

export default router;
