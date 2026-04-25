import { Router } from "express";
import crypto from "crypto";

const router = Router();

const CLIENT_ID = process.env.CANVA_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET ?? "";
const CANVA_API = "https://api.canva.com/rest/v1";

/* ── helpers ── */
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function codeVerifier(): string {
  return b64url(crypto.randomBytes(96));
}
function codeChallenge(v: string): string {
  return b64url(crypto.createHash("sha256").update(v).digest());
}
function basicAuth(): string {
  return Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

function getRedirectUri(req: {
  headers: { host?: string; "x-forwarded-host"?: string; "x-forwarded-proto"?: string };
}): string {
  const fwdHost = req.headers["x-forwarded-host"] as string | undefined;
  const host = process.env.PUBLIC_HOST ?? fwdHost ?? req.headers.host ?? "localhost:8080";
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}/api/canva/callback`;
}

/* ── in-memory state store (state → verifier) ── */
const stateStore = new Map<string, string>();

/* ── single-team token store ── */
type Token = { access_token: string; refresh_token?: string; expires_at: number };
/* If env already contains a Canva token pair (common after prior OAuth
   persisted to .env), seed the in-memory store on boot so the agent's
   upload_canva tool works without a fresh browser round-trip. */
let token: Token | null = process.env.CANVA_ACCESS_TOKEN
  ? {
      access_token: process.env.CANVA_ACCESS_TOKEN,
      refresh_token: process.env.CANVA_REFRESH_TOKEN,
      /* Canva access tokens are ~4h. Assume fresh on boot; the refresh
         helper will swap in a new one on 401. */
      expires_at: Date.now() + 3.5 * 3600 * 1000,
    }
  : null;

/* ── GET /api/canva/auth-url ──────────────────── */
router.get("/auth-url", (req, res) => {
  if (!CLIENT_ID) return res.status(500).json({ error: "CANVA_CLIENT_ID not configured" });
  const verifier = codeVerifier();
  const challenge = codeChallenge(verifier);
  const state = crypto.randomUUID();
  stateStore.set(state, verifier);
  if (stateStore.size > 50) {
    const firstKey = stateStore.keys().next().value;
    if (firstKey) stateStore.delete(firstKey);
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(req),
    scope: "design:content:write asset:write design:content:read",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  res.json({ auth_url: `https://www.canva.com/api/oauth/authorize?${params}` });
});

/* ── GET /api/canva/callback ─────────────────── */
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;
  if (error) {
    return res.send(
      `<script>window.opener?.postMessage({type:"canva_auth_error",error:${JSON.stringify(error)}},"*");window.close();</script>`
    );
  }
  const verifier = stateStore.get(state);
  if (!verifier) {
    return res.send(
      `<script>window.opener?.postMessage({type:"canva_auth_error",error:"invalid_state"},"*");window.close();</script>`
    );
  }
  stateStore.delete(state);

  try {
    const r = await fetch(`${CANVA_API}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth()}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(req),
        code_verifier: verifier,
      }).toString(),
    });
    const data = (await r.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (!r.ok || !data.access_token) {
      throw new Error(data.error ?? `HTTP ${r.status}`);
    }
    token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    res.send(
      `<!DOCTYPE html><html><body><script>window.opener?.postMessage({type:"canva_auth_success"},"*");window.close();</script><p>Connected! You can close this window.</p></body></html>`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.send(
      `<script>window.opener?.postMessage({type:"canva_auth_error",error:${JSON.stringify(msg)}},"*");window.close();</script>`
    );
  }
});

/* ── GET /api/canva/status ───────────────────── */
router.get("/status", (_req, res) => {
  res.json({ connected: !!(token && token.expires_at > Date.now()) });
});

/* ── DELETE /api/canva/logout ────────────────── */
router.delete("/logout", (_req, res) => {
  token = null;
  res.json({ ok: true });
});

/* ── POST /api/canva/upload-svg ──────────────── */
router.post("/upload-svg", async (req, res) => {
  if (!token || token.expires_at <= Date.now()) {
    return res.status(401).json({ error: "Not authenticated with Canva" });
  }
  const { svg, name = "Qoyod Ad Design" } = req.body as { svg?: string; name?: string };
  if (!svg) return res.status(400).json({ error: "svg is required" });

  try {
    const svgBytes = Buffer.from(svg, "utf-8");
    const metadata = Buffer.from(
      JSON.stringify({ name_base64: Buffer.from(name).toString("base64"), mime_type: "image/svg+xml" })
    ).toString("base64");

    const r = await fetch(`${CANVA_API}/assets/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "image/svg+xml",
        "Asset-Upload-Metadata": metadata,
      },
      body: svgBytes,
    });
    const data = (await r.json()) as {
      job?: { id?: string };
      error?: string;
      message?: string;
    };
    if (!r.ok)
      return res.status(r.status).json({ error: data.error ?? data.message ?? `HTTP ${r.status}` });

    res.json({ job_id: data.job?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

/* ── GET /api/canva/upload-job/:id ──────────── */
router.get("/upload-job/:id", async (req, res) => {
  if (!token || token.expires_at <= Date.now()) {
    return res.status(401).json({ error: "Not authenticated with Canva" });
  }
  try {
    const r = await fetch(`${CANVA_API}/asset-upload-jobs/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const data = (await r.json()) as {
      job?: { status?: string; asset?: { id?: string } };
      error?: string;
    };
    if (!r.ok) return res.status(r.status).json({ error: data.error ?? `HTTP ${r.status}` });
    res.json({ status: data.job?.status, asset_id: data.job?.asset?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

/* ── POST /api/canva/create-design ──────────── */
router.post("/create-design", async (req, res) => {
  if (!token || token.expires_at <= Date.now()) {
    return res.status(401).json({ error: "Not authenticated with Canva" });
  }
  const {
    title = "Qoyod Ad",
    asset_id,
    design_type = "SocialMedia",
  } = req.body as { title?: string; asset_id?: string; design_type?: string };

  try {
    const body: Record<string, unknown> = {
      title,
      design_type: { type: "preset", name: design_type },
    };
    if (asset_id) body.asset_id = asset_id;

    const r = await fetch(`${CANVA_API}/designs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await r.json()) as {
      design?: { id?: string; urls?: { edit_url?: string; view_url?: string } };
      error?: string;
      message?: string;
    };
    if (!r.ok)
      return res.status(r.status).json({ error: data.error ?? data.message ?? `HTTP ${r.status}` });

    res.json({
      design_id: data.design?.id,
      edit_url: data.design?.urls?.edit_url,
      view_url: data.design?.urls?.view_url,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export default router;

/* Exported for the autonomous agent to call Canva directly */
export async function canvaUploadSvgAndCreateDesign(
  svg: string,
  name: string,
  design_type = "SocialMedia"
): Promise<{ asset_id?: string; design_id?: string; edit_url?: string; view_url?: string; error?: string }> {
  if (!token || token.expires_at <= Date.now()) {
    return { error: "Not authenticated with Canva" };
  }
  try {
    const metadata = Buffer.from(
      JSON.stringify({
        name_base64: Buffer.from(name).toString("base64"),
        mime_type: "image/svg+xml",
      })
    ).toString("base64");
    const up = await fetch(`${CANVA_API}/assets/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "image/svg+xml",
        "Asset-Upload-Metadata": metadata,
      },
      body: Buffer.from(svg, "utf-8"),
    });
    const upData = (await up.json()) as { job?: { id?: string }; error?: string };
    if (!up.ok || !upData.job?.id) return { error: upData.error ?? `upload HTTP ${up.status}` };

    /* Poll the job until the asset is ready (max 10 × 800ms) */
    let asset_id: string | undefined;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 800));
      const j = await fetch(`${CANVA_API}/asset-upload-jobs/${upData.job.id}`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const jd = (await j.json()) as {
        job?: { status?: string; asset?: { id?: string } };
      };
      if (jd.job?.status === "success" && jd.job?.asset?.id) {
        asset_id = jd.job.asset.id;
        break;
      }
      if (jd.job?.status === "failed") break;
    }
    if (!asset_id) return { error: "asset upload did not finish in time" };

    const dr = await fetch(`${CANVA_API}/designs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: name,
        design_type: { type: "preset", name: design_type },
        asset_id,
      }),
    });
    const dd = (await dr.json()) as {
      design?: { id?: string; urls?: { edit_url?: string; view_url?: string } };
      error?: string;
    };
    if (!dr.ok) return { error: dd.error ?? `design HTTP ${dr.status}`, asset_id };
    return {
      asset_id,
      design_id: dd.design?.id,
      edit_url: dd.design?.urls?.edit_url,
      view_url: dd.design?.urls?.view_url,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
