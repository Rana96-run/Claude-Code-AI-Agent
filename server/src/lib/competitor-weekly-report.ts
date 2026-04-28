/* ══════════════════════════════════════════════════════════════════════════
   Competitor Weekly Intelligence Report — formatter + AI summarizer
   ──────────────────────────────────────────────────────────────────────────
   This module is ready but NOT yet wired into a scheduler. It takes raw
   competitor snapshots (from Apify scrapes) plus a previous-week snapshot,
   asks Claude to summarize what changed, and produces a Slack-formatted
   message ready to post.

   To activate: call generateWeeklyReport() from a cron job (suggest Sunday
   09:00 UTC, alongside the existing weekly-digest scheduler), then post the
   returned blocks to Slack via slack.chat.postMessage.
   ══════════════════════════════════════════════════════════════════════════ */

export interface AdSnapshot {
  page_name: string;
  hook?: string;
  body?: string;
  caption?: string;
  image_url?: string | null;
  detail_url?: string | null;
  platforms?: string[];
  started?: string;
}

export interface CompetitorSnapshot {
  competitor: string;       // "Daftra"
  domain: string;           // "daftra.com"
  fetched_at: string;       // ISO timestamp
  facebook?: AdSnapshot[];
  google?: AdSnapshot[];
  instagram?: AdSnapshot[];
}

export interface WeekDiff {
  competitor: string;
  facebook_new: number;
  facebook_paused: number;
  google_new: number;
  google_paused: number;
  instagram_new_posts: number;
  instagram_top_post?: AdSnapshot;
  notable_angles: string[];
}

/* ─── Diff: this week vs last week ─────────────────────────────────────── */
export function diffSnapshots(thisWeek: CompetitorSnapshot, lastWeek: CompetitorSnapshot | null): WeekDiff {
  const idsThis = (arr: AdSnapshot[] = []) => new Set(arr.map((a) => a.detail_url || `${a.page_name}|${a.hook}`));
  const lastFb = idsThis(lastWeek?.facebook);
  const lastGoogle = idsThis(lastWeek?.google);
  const lastIg = idsThis(lastWeek?.instagram);

  const fbNew = (thisWeek.facebook || []).filter((a) => !lastFb.has(a.detail_url || `${a.page_name}|${a.hook}`));
  const fbPaused = (lastWeek?.facebook || []).filter((a) => !idsThis(thisWeek.facebook).has(a.detail_url || `${a.page_name}|${a.hook}`));
  const gNew = (thisWeek.google || []).filter((a) => !lastGoogle.has(a.detail_url || `${a.page_name}|${a.hook}`));
  const gPaused = (lastWeek?.google || []).filter((a) => !idsThis(thisWeek.google).has(a.detail_url || `${a.page_name}|${a.hook}`));
  const igNew = (thisWeek.instagram || []).filter((a) => !lastIg.has(a.detail_url || `${a.page_name}|${a.hook}`));

  // Notable angles — extract distinct hooks from new ads
  const angles = [...fbNew, ...gNew, ...igNew]
    .map((a) => a.hook?.slice(0, 60))
    .filter((h): h is string => !!h)
    .slice(0, 5);

  return {
    competitor: thisWeek.competitor,
    facebook_new: fbNew.length,
    facebook_paused: fbPaused.length,
    google_new: gNew.length,
    google_paused: gPaused.length,
    instagram_new_posts: igNew.length,
    instagram_top_post: igNew[0],
    notable_angles: angles,
  };
}

/* ─── AI summary prompt ────────────────────────────────────────────────── */
export function buildAIPrompt(diffs: WeekDiff[], weekLabel: string): { system: string; user: string } {
  const system = `You are a senior competitive intelligence analyst for Qoyod (Saudi cloud accounting SaaS, ZATCA-certified).
Your job is to read this week's competitor activity diff and produce a concise, action-oriented brief in Saudi Arabic dialect.
Focus on:
1. What changed materially (new ads, paused ads, new angles)
2. Strategic interpretation — WHY are they doing this, what does it signal?
3. Recommended Qoyod response (1-3 specific tactical actions)

Return ONLY valid JSON:
{
  "headline": "اتجاه الأسبوع — جملة قصيرة جداً",
  "competitors": [
    {
      "name": "Daftra",
      "summary": "ملخص نشاطهم بجملتين بالعامية السعودية",
      "watch": "ما يستحق المراقبة المستمرة"
    }
  ],
  "recommended_actions": ["إجراء 1", "إجراء 2", "إجراء 3"],
  "alert": "أي شيء عاجل يحتاج اهتمام فوري — أو null"
}`;

  const user = `Week: ${weekLabel}\n\nCompetitor activity diff:\n${diffs
    .map(
      (d) =>
        `${d.competitor}:
  Facebook: +${d.facebook_new} new ads, -${d.facebook_paused} paused
  Google:   +${d.google_new} new ads, -${d.google_paused} paused
  Instagram: +${d.instagram_new_posts} new posts
  Notable angles: ${d.notable_angles.join(" | ") || "none"}`,
    )
    .join("\n\n")}`;

  return { system, user };
}

/* ─── Slack Block Kit formatter ────────────────────────────────────────── */
export function formatSlackBlocks(
  diffs: WeekDiff[],
  ai: {
    headline?: string;
    competitors?: Array<{ name: string; summary: string; watch: string }>;
    recommended_actions?: string[];
    alert?: string | null;
  },
  weekLabel: string,
) {
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 Competitor Intel — ${weekLabel}`, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${ai.headline || "أسبوع نشاط منافسين"}*` },
    },
    { type: "divider" },
  ];

  // Per-competitor cards
  for (const d of diffs) {
    const ct = (ai.competitors || []).find((c) => c.name.toLowerCase() === d.competitor.toLowerCase());
    const totalNew = d.facebook_new + d.google_new + d.instagram_new_posts;
    if (totalNew === 0 && d.facebook_paused === 0 && d.google_paused === 0) continue;

    const stats = [
      d.facebook_new > 0 ? `Meta: +${d.facebook_new}` : null,
      d.facebook_paused > 0 ? `Meta paused: -${d.facebook_paused}` : null,
      d.google_new > 0 ? `Google: +${d.google_new}` : null,
      d.google_paused > 0 ? `Google paused: -${d.google_paused}` : null,
      d.instagram_new_posts > 0 ? `IG posts: +${d.instagram_new_posts}` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${d.competitor.toUpperCase()}*\n${stats}${ct ? `\n_${ct.summary}_` : ""}${ct?.watch ? `\n⚠ Watch: ${ct.watch}` : ""}`,
      },
    });
    if (d.notable_angles.length > 0) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `Angles: ${d.notable_angles.map((a) => `\`${a}\``).join(" · ")}` }],
      });
    }
  }

  // Recommended actions
  if (ai.recommended_actions && ai.recommended_actions.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎯 *الإجراءات المقترحة لقيود:*\n${ai.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
      },
    });
  }

  // Urgent alert
  if (ai.alert) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `🚨 *تنبيه:* ${ai.alert}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `_Auto-generated by Somaa · Powered by Apify + Claude · Open the app to drill in._`,
      },
    ],
  });

  return blocks;
}

/* ─── End-to-end pipeline (when monitoring is wired) ───────────────────── */
export async function generateWeeklyReport(
  thisWeek: CompetitorSnapshot[],
  lastWeek: CompetitorSnapshot[],
  callAI: (system: string, user: string, max_tokens: number) => Promise<any>,
): Promise<{ blocks: any[]; markdown: string; ai: any }> {
  const diffs = thisWeek.map((tw) => {
    const lw = lastWeek.find((l) => l.competitor === tw.competitor) || null;
    return diffSnapshots(tw, lw);
  });

  const weekLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const { system, user } = buildAIPrompt(diffs, weekLabel);
  const ai = await callAI(system, user, 2500);
  const blocks = formatSlackBlocks(diffs, ai, weekLabel);

  // Plain markdown fallback for email/preview
  const markdown = blocks
    .filter((b) => b.type === "section" || b.type === "header")
    .map((b: any) => (b.type === "header" ? `# ${b.text.text}` : b.text?.text || ""))
    .join("\n\n");

  return { blocks, markdown, ai };
}
