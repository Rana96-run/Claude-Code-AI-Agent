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

export default router;
