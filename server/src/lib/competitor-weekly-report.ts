/* ══════════════════════════════════════════════════════════════════════════
   Competitor Weekly Intelligence Report — formatter + AI summarizer
   ──────────────────────────────────────────────────────────────────────────
   Pipeline:
   1. Take raw scraped snapshots (FB/IG/Google) for each competitor
   2. Diff vs last week (or treat all as new on first run)
   3. Pick top 3 ads per competitor to embed visually in Slack
   4. Ask Claude to produce strategic brief in Saudi Arabic with:
      - what each competitor does well (good)
      - their gaps (bad)
      - how Qoyod can excel (qoyod_advantage)
      - concrete tasks the team should do this week
   5. Render to Slack Block Kit with image blocks + tasks + sheet link
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
  competitor: string;
  domain: string;
  fetched_at: string;
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
  /* Top 3 ads (mix of FB + Google + IG) with images, used to render samples in Slack */
  top_samples: Array<AdSnapshot & { source: "facebook" | "google" | "instagram" }>;
}

/* ─── Diff: this week vs last week ─────────────────────────────────────── */
export function diffSnapshots(
  thisWeek: CompetitorSnapshot,
  lastWeek: CompetitorSnapshot | null,
): WeekDiff {
  const idsThis = (arr: AdSnapshot[] = []) =>
    new Set(arr.map((a) => a.detail_url || `${a.page_name}|${a.hook}`));
  const lastFb = idsThis(lastWeek?.facebook);
  const lastGoogle = idsThis(lastWeek?.google);
  const lastIg = idsThis(lastWeek?.instagram);

  const fbNew = (thisWeek.facebook || []).filter(
    (a) => !lastFb.has(a.detail_url || `${a.page_name}|${a.hook}`),
  );
  const fbPaused = (lastWeek?.facebook || []).filter(
    (a) => !idsThis(thisWeek.facebook).has(a.detail_url || `${a.page_name}|${a.hook}`),
  );
  const gNew = (thisWeek.google || []).filter(
    (a) => !lastGoogle.has(a.detail_url || `${a.page_name}|${a.hook}`),
  );
  const gPaused = (lastWeek?.google || []).filter(
    (a) => !idsThis(thisWeek.google).has(a.detail_url || `${a.page_name}|${a.hook}`),
  );
  const igNew = (thisWeek.instagram || []).filter(
    (a) => !lastIg.has(a.detail_url || `${a.page_name}|${a.hook}`),
  );

  // Notable angles — distinct hooks across all new content
  const angles = [...fbNew, ...gNew, ...igNew]
    .map((a) => a.hook?.slice(0, 60))
    .filter((h): h is string => !!h)
    .slice(0, 5);

  // Top 3 visual samples: prefer ones WITH images, mix sources
  const samples: WeekDiff["top_samples"] = [];
  const tag = (arr: AdSnapshot[], src: "facebook" | "google" | "instagram"): WeekDiff["top_samples"] =>
    arr.map((a) => ({ ...a, source: src }));
  const candidates = [...tag(fbNew, "facebook"), ...tag(gNew, "google"), ...tag(igNew, "instagram")];
  for (const c of candidates) {
    if (c.image_url && samples.length < 3) samples.push(c);
  }
  // Backfill with non-image ads if we have fewer than 3 with images
  if (samples.length < 3) {
    for (const c of candidates) {
      if (!samples.includes(c) && samples.length < 3) samples.push(c);
    }
  }

  return {
    competitor: thisWeek.competitor,
    facebook_new: fbNew.length,
    facebook_paused: fbPaused.length,
    google_new: gNew.length,
    google_paused: gPaused.length,
    instagram_new_posts: igNew.length,
    instagram_top_post: igNew[0],
    notable_angles: angles,
    top_samples: samples,
  };
}

/* ─── AI summary prompt ─────────────────────────────────────────────────
   Asks Claude for richer output: per-competitor good/bad analysis,
   Qoyod's strategic advantage, and concrete tasks for the team. */
export function buildAIPrompt(
  diffs: WeekDiff[],
  weekLabel: string,
): { system: string; user: string } {
  const system = `You are a senior competitive intelligence analyst for Qoyod (Saudi cloud accounting SaaS, ZATCA-certified since 2018).

Your weekly job: read the competitor activity diff, identify what they're doing right and wrong, and tell the Qoyod marketing team EXACTLY what to do this week to win.

Output style:
- Write in Saudi Arabic dialect (مو/وش/ليش/يكلفك). NEVER Egyptian Arabic.
- Be direct and tactical — no fluff, no marketing speak.
- Each "good" should be specific (a real angle, hook, or tactic they're using).
- Each "bad" must be a real gap Qoyod can exploit, not a generic complaint.
- Tasks must be doable in 1 week, with a clear owner role (e.g., "Content Writer", "Paid Media").

Return ONLY valid JSON:
{
  "headline": "اتجاه الأسبوع — جملة قصيرة جداً (max 15 words)",
  "competitors": [
    {
      "name": "Daftra",
      "summary": "ملخص نشاطهم هذا الأسبوع بجملتين كحد أقصى",
      "good": ["شي يعملونه صح — تكتيك محدد", "تكتيك آخر"],
      "bad": ["ثغرة قيود تقدر تستفيد منها", "ثغرة أخرى"],
      "qoyod_advantage": "كيف قيود يتفوق عليهم تحديداً"
    }
  ],
  "tasks": [
    {
      "title": "عنوان المهمة بجملة واحدة",
      "owner": "Content Writer | Social Media | Paid Media | CRO",
      "deadline": "هذا الأسبوع | الأسبوع القادم",
      "why": "ليش نسوي هالمهمة (سبب استراتيجي بجملة واحدة)"
    }
  ],
  "alert": "أي شي عاجل يحتاج اهتمام فوري — أو null"
}`;

  const user = `Week: ${weekLabel}\n\nCompetitor activity diff:\n${diffs
    .map(
      (d) =>
        `${d.competitor}:
  Facebook: +${d.facebook_new} new ads, -${d.facebook_paused} paused
  Google:   +${d.google_new} new ads, -${d.google_paused} paused
  Instagram: +${d.instagram_new_posts} new posts
  Notable hooks/angles seen:
${d.notable_angles.map((a) => `    - "${a}"`).join("\n") || "    (none captured)"}`,
    )
    .join("\n\n")}`;

  return { system, user };
}

/* ─── Slack Block Kit formatter — now includes ad images + tasks ───────── */
export function formatSlackBlocks(
  diffs: WeekDiff[],
  ai: {
    headline?: string;
    competitors?: Array<{
      name: string;
      summary: string;
      good?: string[];
      bad?: string[];
      qoyod_advantage?: string;
    }>;
    tasks?: Array<{ title: string; owner: string; deadline?: string; why?: string }>;
    alert?: string | null;
  },
  weekLabel: string,
  sheetUrl?: string,
  reportDocUrl?: string,
) {
  const totalNew = diffs.reduce(
    (s, d) => s + d.facebook_new + d.google_new + d.instagram_new_posts,
    0,
  );
  const opener =
    totalNew === 0
      ? "أسبوع هادئ على ساحة المنافسين — مافي حركة كبيرة هذا الأسبوع."
      : totalNew < 5
      ? `أسبوع متوسط — رصدنا ${totalNew} نشاط جديد عند المنافسين.`
      : `أسبوع نشط جداً — المنافسين أطلقوا ${totalNew} نشاط جديد.`;

  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `ملخّص المنافسين — ${weekLabel}`, emoji: false },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${opener}\n\n*${ai.headline || "اتجاه الأسبوع"}*`,
      },
    },
    { type: "divider" },
  ];

  // Per-competitor: narrative + good/bad + Qoyod advantage + 2-3 ad image samples
  for (const d of diffs) {
    const ct = (ai.competitors || []).find(
      (c) => c.name.toLowerCase() === d.competitor.toLowerCase(),
    );
    const compTotal = d.facebook_new + d.google_new + d.instagram_new_posts;
    if (compTotal === 0 && d.facebook_paused === 0 && d.google_paused === 0) continue;

    // Activity sentence in natural Arabic
    const activity: string[] = [];
    if (d.facebook_new > 0) activity.push(`أطلقوا ${d.facebook_new} إعلان جديد على Meta`);
    if (d.google_new > 0) activity.push(`${d.google_new} إعلان على Google`);
    if (d.instagram_new_posts > 0) activity.push(`نشروا ${d.instagram_new_posts} منشور على إنستغرام`);
    if (d.facebook_paused > 0) activity.push(`أوقفوا ${d.facebook_paused} إعلان من Meta`);
    if (d.google_paused > 0) activity.push(`أوقفوا ${d.google_paused} إعلان من Google`);
    const activityLine = activity.length > 0 ? activity.join("، ") : "لا تغيير ملحوظ";

    // Header section for this competitor
    let headerText = `*${d.competitor}*\n${activityLine}.`;
    if (ct?.summary) headerText += `\n\n_${ct.summary}_`;
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: headerText },
    });

    // Good / Bad / Advantage analysis (NEW)
    const analysisBits: string[] = [];
    if (ct?.good && ct.good.length > 0) {
      analysisBits.push(`*✅ يعملونه صح:*\n${ct.good.map((g) => `• ${g}`).join("\n")}`);
    }
    if (ct?.bad && ct.bad.length > 0) {
      analysisBits.push(`*❌ ثغرات نقدر نستفيد منها:*\n${ct.bad.map((b) => `• ${b}`).join("\n")}`);
    }
    if (ct?.qoyod_advantage) {
      analysisBits.push(`*ميزة قيود:*\n${ct.qoyod_advantage}`);
    }
    if (analysisBits.length > 0) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: analysisBits.join("\n\n") },
      });
    }

    // Real ad samples — Slack image blocks (max 3 per competitor)
    for (const sample of d.top_samples.slice(0, 3)) {
      if (sample.image_url) {
        const altText =
          (sample.hook || sample.body || `${d.competitor} ad`).slice(0, 100) || "Ad sample";
        blocks.push({
          type: "image",
          image_url: sample.image_url,
          alt_text: altText,
          title: {
            type: "plain_text",
            text: `${sample.source.toUpperCase()} · ${(sample.hook || sample.body || "—").slice(0, 60)}`,
            emoji: true,
          },
        });
      } else if (sample.hook || sample.body) {
        // Text-only ad sample (e.g., FB ads without images)
        blocks.push({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*${sample.source}* — _"${(sample.hook || sample.body || "").slice(0, 120)}"_`,
            },
          ],
        });
      }
    }

    blocks.push({ type: "divider" });
  }

  // Action tasks — concrete, owner-tagged, deadline-tagged
  if (ai.tasks && ai.tasks.length > 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*مهام هذا الأسبوع للفريق*` },
    });
    for (const t of ai.tasks) {
      const meta = [t.owner, t.deadline].filter(Boolean).join(" · ");
      const why = t.why ? `\n      _${t.why}_` : "";
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• *${t.title}*\n      \`${meta}\`${why}`,
        },
      });
    }
    blocks.push({ type: "divider" });
  }

  // Alert
  if (ai.alert) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*تنبيه عاجل*\n${ai.alert}` },
    });
    blocks.push({ type: "divider" });
  }

  // Links — sheet for raw data, doc for full visual report
  const links: string[] = [];
  if (reportDocUrl) links.push(`<${reportDocUrl}|التقرير الكامل بالصور (Google Doc)>`);
  if (sheetUrl) links.push(`<${sheetUrl}|البيانات الخام في Google Sheet>`);
  if (links.length > 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: links.join("\n") },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `_Somaa — وكيل المحتوى الذكي · ${new Date().toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}_`,
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
): Promise<{ blocks: any[]; markdown: string; ai: any; diffs: WeekDiff[] }> {
  const diffs = thisWeek.map((tw) => {
    const lw = lastWeek.find((l) => l.competitor === tw.competitor) || null;
    return diffSnapshots(tw, lw);
  });

  const weekLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const { system, user } = buildAIPrompt(diffs, weekLabel);
  const ai = await callAI(system, user, 3500);
  const blocks = formatSlackBlocks(diffs, ai, weekLabel);

  // Plain markdown fallback for email/preview
  const markdown = blocks
    .filter((b) => b.type === "section" || b.type === "header")
    .map((b: any) => (b.type === "header" ? `# ${b.text.text}` : b.text?.text || ""))
    .join("\n\n");

  return { blocks, markdown, ai, diffs };
}
