/**
 * Pattern Library Auto-Feed (D1)
 *
 * Reads recent WIN-tagged hypotheses from the Google Sheet "Hypothesis
 * Ledger" tab and formats them as few-shot examples to inject into the
 * Content generation prompt.
 *
 * Master prompt §3.2: "After 5+ wins a pattern becomes a template."
 *
 * Why this matters: brand law tells the AI WHAT NOT to do (rules).
 * Pattern library tells it WHAT WORKS (examples). Combined, the AI
 * iterates on real winners instead of producing generic best-practice copy.
 *
 * Cache: in-memory, 30-min TTL — sheet reads are cheap but not free,
 * and library doesn't change minute-to-minute.
 */

import { sheetsReadWinners } from "./sheets-client.js";

const CACHE_TTL_MS = 30 * 60 * 1_000;
let cache: { ts: number; snippet: string } | null = null;

/* Render winners as few-shot examples for prompt injection */
function format(
  winners: Array<{
    id: string;
    hypothesis: string;
    actual_result?: string;
    lesson?: string;
    sector?: string;
    channel?: string;
    funnel_stage?: string;
  }>,
): string {
  if (winners.length === 0) return "";
  const lines = winners.map((w, i) => {
    const meta = [w.sector, w.channel, w.funnel_stage].filter(Boolean).join(" · ");
    return `${i + 1}. \`${w.id}\` — ${w.hypothesis}${meta ? ` (${meta})` : ""}${w.actual_result ? `\n   Result: ${w.actual_result}` : ""}${w.lesson ? `\n   Lesson: ${w.lesson}` : ""}`;
  });
  return `\n\n--- PATTERN LIBRARY (your own recent winners — build on what works) ---\n${lines.join("\n")}\n--- END PATTERNS ---\nWhen generating new copy, reference patterns above where the angle/sector/funnel match. Don't repeat losers.\n`;
}

/** Get the pattern library snippet for prompt injection. Cached for 30min. */
export async function getPatternLibrarySnippet(): Promise<string> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.snippet;
  try {
    const winners = await sheetsReadWinners(5);
    const snippet = format(winners);
    cache = { ts: Date.now(), snippet };
    return snippet;
  } catch {
    return "";
  }
}

/** Force-refresh the cache (call after a new WIN is logged) */
export function bustPatternLibraryCache(): void {
  cache = null;
}
