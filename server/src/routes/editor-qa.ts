import { Router } from "express";
import { getChecklistSnippet } from "../lib/qoyod-brand-law.js";

const router = Router();

/* ─── POST /api/editor-qa/check ──────────────────────────────────────────
   Runs a creative through the master-prompt §13 pre-publish checklist.
   Returns pass/fail per item + repair suggestions.

   Body: {
     creative: { atomic_id?, hook_ar, body_ar, cta_ar, trust_element,
                 visual_concept, funnel_stage, sector, icp_tier,
                 hypothesis, kill_criteria }
   }

   Response:
     { ok: true|false, score: 0-15, items: [{name, pass, reason}], blockers: [] }
*/
router.post("/editor-qa/check", async (req, res) => {
  const { creative } = req.body ?? {};
  if (!creative || typeof creative !== "object") {
    res.status(400).json({ error: "creative object required" });
    return;
  }

  const c = creative as Record<string, any>;
  const items: Array<{ name: string; pass: boolean; reason?: string }> = [];

  // Lightweight rule-based checks (no AI call — instant feedback)
  const hook = String(c.hook_ar || "").trim();
  const body = String(c.body_ar || "").trim();
  const cta = String(c.cta_ar || "").trim();
  const trust = String(c.trust_element || "").trim();
  const concept = String(c.visual_concept || "").trim();

  // Egyptian dialect detector
  const EGYPTIAN_WORDS = ["مش", "ايه", "بتاعك", "هيكلفك", "بص", "دخول", "ازاي", "ازيك"];
  const allText = [hook, body, cta].join(" ").toLowerCase();
  const egyptianHits = EGYPTIAN_WORDS.filter((w) => allText.includes(w));
  items.push({
    name: "Saudi dialect (no Egyptian)",
    pass: egyptianHits.length === 0,
    reason: egyptianHits.length > 0 ? `Egyptian words found: ${egyptianHits.join(", ")}` : undefined,
  });

  // Hook in 5-9 words
  const hookWords = hook.split(/\s+/).filter(Boolean).length;
  items.push({
    name: "Hook 5-9 words",
    pass: hookWords >= 5 && hookWords <= 9,
    reason:
      hookWords < 5
        ? `Hook too short (${hookWords} words)`
        : hookWords > 9
        ? `Hook too long (${hookWords} words)`
        : undefined,
  });

  // Body 2-4 lines
  const bodyLines = body.split(/\n/).filter((l) => l.trim()).length;
  items.push({
    name: "Body 2-4 lines",
    pass: bodyLines >= 2 && bodyLines <= 4,
    reason:
      bodyLines < 2 ? `Body too short` : bodyLines > 4 ? `Body too long (${bodyLines} lines)` : undefined,
  });

  // Single CTA
  const multiCtaSignals = (cta.match(/\b(و|أو|or|and)\b/gi) || []).length;
  items.push({
    name: "ONE CTA only",
    pass: cta.length > 0 && multiCtaSignals === 0,
    reason:
      cta.length === 0
        ? "CTA is missing"
        : multiCtaSignals > 0
        ? `Multiple CTAs detected (joined by و/أو/and/or)`
        : undefined,
  });

  // Single trust element
  items.push({
    name: "ONE trust element",
    pass: trust.length > 0 && !trust.includes(",") && !trust.includes("،"),
    reason:
      trust.length === 0
        ? "Trust element missing"
        : trust.includes(",") || trust.includes("،")
        ? "Multiple trust elements detected"
        : undefined,
  });

  // No exaggeration
  const EXAGGERATION = ["100%", "مضمون", "أفضل في العالم", "best in the world", "guaranteed"];
  const exaggHits = EXAGGERATION.filter((e) =>
    [hook, body, cta].some((t) => t.toLowerCase().includes(e.toLowerCase())),
  );
  items.push({
    name: "No exaggeration",
    pass: exaggHits.length === 0,
    reason: exaggHits.length > 0 ? `Exaggeration found: ${exaggHits.join(", ")}` : undefined,
  });

  // No competitor names in paid copy
  const COMPETITORS = ["daftra", "دفترة", "rewaa", "رواء", "wafeq", "وافق", "foodics", "فودكس"];
  const compHits = COMPETITORS.filter((cp) => allText.includes(cp));
  items.push({
    name: "No competitor names (paid copy)",
    pass: compHits.length === 0,
    reason: compHits.length > 0 ? `Found: ${compHits.join(", ")} — restrict to organic only` : undefined,
  });

  // Funnel stage declared
  items.push({
    name: "Funnel stage declared",
    pass: ["TOF", "MOF", "BOF"].includes(c.funnel_stage),
    reason: !["TOF", "MOF", "BOF"].includes(c.funnel_stage) ? "Missing or invalid funnel_stage" : undefined,
  });

  // Hypothesis declared
  items.push({
    name: "Hypothesis logged",
    pass: !!c.hypothesis && String(c.hypothesis).length > 10,
    reason: !c.hypothesis ? "Missing hypothesis (If X then Y because Z)" : undefined,
  });

  // Kill criteria declared
  items.push({
    name: "Kill criteria defined",
    pass: !!c.kill_criteria && String(c.kill_criteria).length > 5,
    reason: !c.kill_criteria ? "Missing kill_criteria" : undefined,
  });

  // Visual concept = idea level (no design specs)
  const DESIGN_SPECS = ["font", "color #", "logo placement", "layout grid", "typography"];
  const designHits = DESIGN_SPECS.filter((d) => concept.toLowerCase().includes(d));
  items.push({
    name: "Visual concept = idea only (no design specs)",
    pass: designHits.length === 0,
    reason:
      designHits.length > 0
        ? `Design specs found (${designHits.join(", ")}) — keep concept at idea level only`
        : undefined,
  });

  const failed = items.filter((i) => !i.pass);
  const blockers = failed
    .filter((i) => /dialect|exaggeration|competitor|hypothesis|kill/i.test(i.name))
    .map((i) => `${i.name}: ${i.reason || "fail"}`);
  const score = items.filter((i) => i.pass).length;

  res.status(200).json({
    ok: failed.length === 0,
    score,
    total: items.length,
    items,
    blockers,
    checklist_doc: getChecklistSnippet(),
  });
});

export default router;
