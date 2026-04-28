/**
 * Competitor Context Synthesizer
 *
 * Reads the latest weekly competitor scrape and produces a SHORT
 * synthesized brief that gets injected into Content / Campaign / Calendar
 * generation prompts. The point: when the marketing team generates content,
 * the AI already knows what competitors are doing this week and can position
 * Qoyod against them automatically — no manual context entry needed.
 *
 * Output is intentionally compact (target 800-1500 chars) so it doesn't
 * blow the prompt budget. Refreshed weekly by the monitor scheduler.
 *
 * Storage: server/data/competitor-context.md (markdown for portability)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "./logger.js";
import type { WeekDiff } from "./competitor-weekly-report.js";

const CONTEXT_PATH = path.resolve(process.cwd(), "server/data/competitor-context.md");
const MAX_CHARS = 1500;

export interface ContextDoc {
  generated_at: string;
  week: string;
  summary: string;          // 1-paragraph TL;DR
  themes: string[];         // 3-5 cross-competitor themes
  qoyod_positioning: string; // "Use this when writing content"
  raw_markdown: string;
}

/* Build the context-building prompt (different from the Slack prompt) */
export function buildContextPrompt(
  diffs: WeekDiff[],
  weekLabel: string,
): { system: string; user: string } {
  const system = `You are the competitive intelligence layer for Qoyod's content team.

Your output will be INJECTED into every content/campaign/calendar generation prompt this week. So it must be:
- SHORT (target 800 chars, hard cap 1500)
- Tactical and copy-ready (not academic)
- Actionable for a copywriter — what angles to pursue, what to avoid

Return ONLY valid JSON:
{
  "summary": "جملة أو جملتين تلخص نشاط المنافسين هذا الأسبوع — بالعامية السعودية",
  "themes": ["3 إلى 5 ثيمات مشتركة عند المنافسين", "كل ثيمة في 6-10 كلمات", "..."],
  "qoyod_positioning": "فقرة قصيرة تشرح للكاتب: كيف يموضع قيود ضد هذه الثيمات. ركز على ZATCA منذ 2018 + SOCPA + جهاز موحد + 8 سنوات سعودي."
}`;

  const user = `Week: ${weekLabel}

Competitor activity summary:
${diffs
  .map(
    (d) =>
      `${d.competitor}: ${d.facebook_new}+ FB ads, ${d.google_new}+ Google ads, ${d.instagram_new_posts}+ IG posts.
  Hooks/angles seen:
${d.notable_angles.map((a) => `    - "${a}"`).join("\n") || "    (no new angles captured)"}`,
  )
  .join("\n\n")}`;

  return { system, user };
}

/* Render the synthesized context as a markdown doc — readable by humans
   AND injectable into other prompts */
export function renderContextMarkdown(
  ai: { summary?: string; themes?: string[]; qoyod_positioning?: string },
  weekLabel: string,
): string {
  const lines: string[] = [
    `# ذكاء المنافسين — أسبوع ${weekLabel}`,
    ``,
    `## نظرة عامة`,
    ai.summary || "(no summary)",
    ``,
    `## ثيمات المنافسين هذا الأسبوع`,
    ...(ai.themes || []).map((t) => `- ${t}`),
    ``,
    `## كيف نموضع قيود`,
    ai.qoyod_positioning || "(no positioning guidance)",
  ];
  return lines.join("\n").slice(0, MAX_CHARS);
}

/* Persist context to disk so other modules can load it without re-running the AI */
export function saveContext(doc: ContextDoc): void {
  try {
    fs.mkdirSync(path.dirname(CONTEXT_PATH), { recursive: true });
    const front = `<!--\nGenerated: ${doc.generated_at}\nWeek: ${doc.week}\n-->\n\n`;
    fs.writeFileSync(CONTEXT_PATH, front + doc.raw_markdown, "utf-8");
    logger.info({ path: CONTEXT_PATH, chars: doc.raw_markdown.length }, "competitor-context: saved");
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "competitor-context: save failed",
    );
  }
}

/* Load the cached context for injection into prompts. Returns null if no
   context has been generated yet (safe — caller should just not inject). */
export function loadContext(): { markdown: string; age_hours: number } | null {
  try {
    const stat = fs.statSync(CONTEXT_PATH);
    const text = fs.readFileSync(CONTEXT_PATH, "utf-8");
    const ageMs = Date.now() - stat.mtimeMs;
    return { markdown: text, age_hours: Math.round(ageMs / 3_600_000) };
  } catch {
    return null;
  }
}

/* Format the context as a SHORT system-prompt addendum.
   Caller does: `system = baseSystem + "\n\n" + getContextSnippet()` */
export function getContextSnippet(): string {
  const ctx = loadContext();
  if (!ctx) return "";
  // Only inject if reasonably fresh (< 2 weeks old)
  if (ctx.age_hours > 14 * 24) return "";
  // Strip the HTML comment header before injecting
  const clean = ctx.markdown.replace(/^<!--[\s\S]*?-->\s*/, "").trim();
  return `\n\n--- COMPETITOR CONTEXT (this week) ---\n${clean}\n--- END CONTEXT ---\nUse this context to position Qoyod's content against current competitor activity. Reference our differentiators (ZATCA since 2018, SOCPA, all-in-one device, 8 years Saudi-native).\n`;
}
