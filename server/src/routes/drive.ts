import { Router } from "express";
import { google } from "googleapis";
import { Readable } from "stream";

const router = Router();

/* ───────────────────────────────────────────────
   Google Drive integration via service account.
   Env:
     GOOGLE_SERVICE_ACCOUNT_JSON = <inline JSON string>  (preferred, path-free)
     — or —
     GOOGLE_APPLICATION_CREDENTIALS = /absolute/path/to/key.json
     GOOGLE_DRIVE_FOLDER_ID        = target folder id (required)
   The service account must be given Editor access to the Drive folder.
   ─────────────────────────────────────────────── */

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

function getDriveClient() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const scopes = ["https://www.googleapis.com/auth/drive"];
  let auth;
  if (inline) {
    const creds = JSON.parse(inline);
    auth = new google.auth.GoogleAuth({ credentials: creds, scopes });
  } else {
    auth = new google.auth.GoogleAuth({ scopes });
  }
  return google.drive({ version: "v3", auth });
}

/* List all files currently in the Drive folder → Map<name, fileId> */
async function listFolderFiles(
  drive: ReturnType<typeof getDriveClient>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let pageToken: string | undefined;
  /* supportsAllDrives + includeItemsFromAllDrives are required for
     Shared Drives (IDs starting with 0AH). They are no-ops for regular
     My Drive folders, so safe to always include. */
  do {
    const { data } = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name)",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of data.files ?? []) {
      if (f.id && f.name) map.set(f.name, f.id);
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
  return map;
}

async function createOrUpdateFile(
  drive: ReturnType<typeof getDriveClient>,
  existing: Map<string, string>,
  name: string,
  buf: Buffer,
  mime: string
): Promise<{ id: string; action: "created" | "updated" }> {
  const body = Readable.from(buf);
  if (existing.has(name)) {
    const id = existing.get(name)!;
    await drive.files.update({
      fileId: id,
      media: { mimeType: mime, body },
      supportsAllDrives: true,
    });
    return { id, action: "updated" };
  }
  const { data } = await drive.files.create({
    requestBody: { name, parents: [FOLDER_ID], mimeType: mime },
    media: { mimeType: mime, body },
    fields: "id,webViewLink",
    supportsAllDrives: true,
  });
  return { id: data.id!, action: "created" };
}

/* ── GET /api/drive/status ─────────────────────── */
router.get("/status", (_req, res) => {
  res.json({
    configured:
      !!FOLDER_ID &&
      (!!process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
        !!process.env.GOOGLE_APPLICATION_CREDENTIALS),
    folder_id: FOLDER_ID || null,
    folder_link: FOLDER_ID ? `https://drive.google.com/drive/folders/${FOLDER_ID}` : null,
  });
});

/* ── POST /api/drive/upload ────────────────────────
   Body: { content, filename, mimeType, binaryBase64? }
   If binaryBase64=true, content is decoded from base64 before upload.  */
router.post("/upload", async (req, res) => {
  const {
    content,
    filename,
    mimeType,
    binaryBase64 = false,
  } = req.body as {
    content?: string;
    filename?: string;
    mimeType?: string;
    binaryBase64?: boolean;
  };
  if (!content || !filename || !mimeType)
    return res.status(400).json({ error: "content, filename and mimeType are required" });
  if (!FOLDER_ID) return res.status(500).json({ error: "GOOGLE_DRIVE_FOLDER_ID not configured" });

  try {
    const drive = getDriveClient();
    const existing = await listFolderFiles(drive);
    const buf = binaryBase64 ? Buffer.from(content, "base64") : Buffer.from(content, "utf-8");
    const { id, action } = await createOrUpdateFile(drive, existing, filename, buf, mimeType);
    const { data } = await drive.files.get({ fileId: id, fields: "webViewLink", supportsAllDrives: true });
    res.json({
      ok: true,
      id,
      action,
      link: data.webViewLink ?? `https://drive.google.com/file/d/${id}/view`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err: msg }, "Drive upload failed");
    res.status(500).json({ error: msg });
  }
});

/* ── POST /api/drive/list ──────────────────────────
   Lists the target folder's contents (for the agent to see what exists). */
router.post("/list", async (_req, res) => {
  if (!FOLDER_ID) return res.status(500).json({ error: "GOOGLE_DRIVE_FOLDER_ID not configured" });
  try {
    const drive = getDriveClient();
    const map = await listFolderFiles(drive);
    res.json({
      ok: true,
      count: map.size,
      files: [...map.entries()].map(([name, id]) => ({
        name,
        id,
        link: `https://drive.google.com/file/d/${id}/view`,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

/* Helper reused by the autonomous agent */
export async function driveUploadText(
  filename: string,
  content: string,
  mimeType = "text/plain"
): Promise<{ ok: boolean; link?: string; error?: string }> {
  try {
    if (!FOLDER_ID) return { ok: false, error: "GOOGLE_DRIVE_FOLDER_ID not configured" };
    const drive = getDriveClient();
    const existing = await listFolderFiles(drive);
    const { id } = await createOrUpdateFile(
      drive,
      existing,
      filename,
      Buffer.from(content, "utf-8"),
      mimeType
    );
    const { data } = await drive.files.get({ fileId: id, fields: "webViewLink", supportsAllDrives: true });
    return { ok: true, link: data.webViewLink ?? `https://drive.google.com/file/d/${id}/view` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
