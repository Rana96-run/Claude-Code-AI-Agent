import { Router } from "express";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const router = Router();
const execFileAsync = promisify(execFile);

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, _file, cb) => cb(null, `webm-${Date.now()}.webm`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

/* POST /api/convert
   webm → mp4 via local ffmpeg binary.
   Pipes the mp4 back to the caller directly (no Drive round-trip here —
   if the caller wants to save to Drive they should call /api/drive/upload). */
router.post("/convert", upload.single("video"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No video file uploaded" });
    return;
  }

  const inputPath = file.path;
  const outputPath = path.join(os.tmpdir(), `mp4-${Date.now()}.mp4`);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      outputPath,
    ]);

    fs.unlink(inputPath, () => {});

    const stat = fs.statSync(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", 'attachment; filename="qoyod-creative-os-promo.mp4"');

    const readStream = fs.createReadStream(outputPath);
    readStream.pipe(res);
    readStream.on("end", () => fs.unlink(outputPath, () => {}));
  } catch (err: unknown) {
    fs.unlink(inputPath, () => {});
    fs.unlink(outputPath, () => {});
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Conversion failed", detail: message });
  }
});

export default router;
