import { Router } from "express";

const router = Router();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const RATIO_DIMS: Record<string, [number, number]> = {
  "1:1": [800, 800],
  "4:5": [800, 1000],
  "9:16": [500, 889],
  "16:9": [889, 500],
};

router.post("/generate-design", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY not set" });
    return;
  }

  const {
    product = "Qoyod Main",
    message = "",
    hook = "",
    cta = "ابدأ الآن",
    trust = "ZATCA Logo",
    ratio = "1:1",
    concept = "",
    art_direction = "",
    color_accent = "#17A3A4",
  } = req.body ?? {};

  const [w, h] = RATIO_DIMS[ratio] || [800, 800];

  const systemPrompt = `You are a world-class Saudi Arabian digital ad designer. You generate complete, valid, beautiful SVG ad creatives for Qoyod — a ZATCA-certified Saudi cloud accounting SaaS.

Brand identity:
- Primary background: #021544 (deep navy blue)
- Accent color: #17A3A4 (vibrant teal)
- Logo name: "قيود" in teal, bold
- Style: modern, premium, clean flat design with subtle geometric depth
- All text must be in Arabic, layout must be RTL
- Text-anchor: "end" for right-aligned Arabic text, "middle" for centered
- Use viewBox="0 0 ${w} ${h}" and width="${w}" height="${h}"

Design principles:
- Bold geometric shapes as visual foundation
- Strong typographic hierarchy: main message → hook → CTA
- CTA is a teal rounded-rectangle button with white Arabic text
- Trust badge (ZATCA/SOCPA etc.) as a small pill or stamp in a corner
- Subtle gradient overlays or pattern elements for depth
- "قيود" brand mark visible but not dominant

Output: Return ONLY the raw SVG code starting with <svg — no markdown, no explanation, no code blocks.`;

  const userPrompt = `Generate a ${w}×${h}px SVG digital ad with these exact specifications:

Product: ${product}
Main Message (use this exact Arabic text, make it the hero): "${message}"
Hook line (Arabic, secondary text): "${hook}"
CTA button text (Arabic): "${cta}"
Trust element: ${trust}
Visual concept: ${concept}
Art direction note: ${art_direction}
Color accent override: ${color_accent}

Layout requirements:
1. Fill entire ${w}×${h}px canvas — no white borders, no clipping
2. Navy (#021544) background — add subtle diagonal lines or dot grid for texture
3. Large geometric teal shape (rectangle, diagonal band, or circle arc) as the dominant visual element
4. Main message text: largest, boldest, white or very light, RTL, text-anchor="end" or "middle"
5. Hook text: smaller, teal or light gray, below or near main message
6. CTA button: teal (#17A3A4) filled rectangle with rounded corners (rx="12"), white Arabic label centered inside
7. Trust badge: small pill-shaped element with trust text, bottom corner, subtle border
8. "قيود" wordmark in teal, positioned at top or bottom, bold, clean
9. Optional: ZATCA checkmark icon (simple SVG path or circle with checkmark) if ZATCA is mentioned in trust

Return ONLY valid SVG code starting with <svg.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errData = (await anthropicRes.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      res.status(anthropicRes.status).json({
        error: errData?.error?.message || `Generation failed (${anthropicRes.status})`,
      });
      return;
    }

    const data = (await anthropicRes.json()) as { content: Array<{ type: string; text: string }> };
    const rawText = data.content?.[0]?.text || "";

    const svgMatch = rawText.match(/<svg[\s\S]*<\/svg>/i);
    const svg = svgMatch ? svgMatch[0] : rawText;

    res.status(200).json({ svg, width: w, height: h });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[generate-design] error", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

export default router;
