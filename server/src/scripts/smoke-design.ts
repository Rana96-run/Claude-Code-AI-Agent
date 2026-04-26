/**
 * Smoke test for the design renderer — runs the full Satori → resvg pipeline
 * with a fake hero image and verifies a PNG comes out.
 *
 * Usage: npm run smoke:design
 */

import { renderDesign, resolveScheme, warmDesignRenderer } from "../lib/design-renderer.js";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("warming fonts...");
  await warmDesignRenderer();

  // 1×1 transparent PNG as a stand-in hero image
  const fakeHero =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const ratios = ["1:1", "4:5", "9:16", "16:9"];
  const outDir = path.resolve(process.cwd(), "smoke-output");
  fs.mkdirSync(outDir, { recursive: true });

  for (const ratio of ratios) {
    console.log(`rendering ${ratio}...`);
    const t = Date.now();
    const out = await renderDesign({
      copy: {
        headline: "أدِر أعمالك بذكاء",
        hook: "فاتورة إلكترونية متوافقة مع زاتكا",
        cta: "ابدأ مجاناً",
        trust: "زاتكا المرحلة الثانية",
        tagline: "محاسبة سحابية",
      },
      scheme: resolveScheme("navy"),
      ratio,
      heroImageDataUrl: fakeHero,
    });
    const buf = Buffer.from(out.pngBase64, "base64");
    const file = path.join(outDir, `smoke-${ratio.replace(":", "x")}.png`);
    fs.writeFileSync(file, buf);
    console.log(`  ✓ ${file} (${buf.length} bytes, ${Date.now() - t}ms)`);
  }

  // No hero image variant
  console.log("rendering 1:1 with no hero image...");
  const out = await renderDesign({
    copy: {
      headline: "اختبار بدون صورة",
      hook: "نص اختباري قصير",
      cta: "زر",
      trust: "ZATCA",
      tagline: "تجربة",
    },
    scheme: resolveScheme("teal"),
    ratio: "1:1",
    heroImageDataUrl: null,
  });
  fs.writeFileSync(
    path.join(outDir, "smoke-no-hero.png"),
    Buffer.from(out.pngBase64, "base64"),
  );
  console.log("  ✓ no-hero variant rendered");

  console.log("all smoke tests passed");
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
