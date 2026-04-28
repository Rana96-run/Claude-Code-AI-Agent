/**
 * Competitor Weekly Visual Report — HTML renderer.
 *
 * Produces a single self-contained HTML doc that Google Drive auto-converts
 * into a Google Doc. Includes embedded ad images, structured analysis,
 * action tasks, and a summary table. Linked from the Slack message.
 */

import type { WeekDiff } from "./competitor-weekly-report.js";

interface AIOutput {
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
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderWeeklyDocHtml(
  diffs: WeekDiff[],
  ai: AIOutput,
  weekLabel: string,
  sheetUrl?: string,
): string {
  const totalNew = diffs.reduce((s, d) => s + d.facebook_new + d.google_new + d.instagram_new_posts, 0);

  const competitorSections = diffs
    .map((d) => {
      const ct = (ai.competitors || []).find(
        (c) => c.name.toLowerCase() === d.competitor.toLowerCase(),
      );
      if (
        d.facebook_new + d.google_new + d.instagram_new_posts === 0 &&
        d.facebook_paused === 0 &&
        d.google_paused === 0
      ) {
        return "";
      }

      const activity: string[] = [];
      if (d.facebook_new > 0) activity.push(`${d.facebook_new} إعلان جديد على Meta`);
      if (d.google_new > 0) activity.push(`${d.google_new} إعلان على Google`);
      if (d.instagram_new_posts > 0) activity.push(`${d.instagram_new_posts} منشور إنستغرام`);
      if (d.facebook_paused > 0) activity.push(`${d.facebook_paused} إعلان Meta أوقفوه`);
      if (d.google_paused > 0) activity.push(`${d.google_paused} إعلان Google أوقفوه`);

      const goodList = (ct?.good || []).map((g) => `<li>${escapeHtml(g)}</li>`).join("");
      const badList = (ct?.bad || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");

      // Image gallery: up to 3 ad samples with captions
      const imgHtml = d.top_samples
        .slice(0, 3)
        .map((s) => {
          const cap = escapeHtml((s.hook || s.body || "—").slice(0, 100));
          if (s.image_url) {
            return `<div style="margin:8px 0;">
              <img src="${escapeHtml(s.image_url)}" alt="${cap}" style="max-width:300px;border:1px solid #ddd;border-radius:4px;"/>
              <p style="font-size:11px;color:#666;margin-top:4px;"><strong>${s.source.toUpperCase()}:</strong> ${cap}</p>
            </div>`;
          }
          return `<div style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
            <p style="font-size:11px;color:#666;"><strong>${s.source.toUpperCase()}:</strong> ${cap}</p>
          </div>`;
        })
        .join("");

      return `<section style="margin:24px 0;padding:16px;border:1px solid #ddd;border-radius:6px;">
        <h2 style="margin:0 0 8px 0;color:#021544;">${escapeHtml(d.competitor)}</h2>
        <p style="font-size:13px;color:#444;margin:4px 0;">${activity.join("، ")}.</p>
        ${ct?.summary ? `<p style="font-style:italic;color:#666;margin:8px 0;">${escapeHtml(ct.summary)}</p>` : ""}

        ${goodList ? `<div style="margin:12px 0;">
          <h4 style="margin:4px 0;color:#16a34a;">✅ يعملونه صح</h4>
          <ul style="margin:4px 0 4px 20px;">${goodList}</ul>
        </div>` : ""}

        ${badList ? `<div style="margin:12px 0;">
          <h4 style="margin:4px 0;color:#dc2626;">❌ ثغرات نقدر نستفيد منها</h4>
          <ul style="margin:4px 0 4px 20px;">${badList}</ul>
        </div>` : ""}

        ${ct?.qoyod_advantage ? `<div style="margin:12px 0;padding:10px;background:#eff6ff;border-right:3px solid #17a3a3;">
          <strong>ميزة قيود:</strong> ${escapeHtml(ct.qoyod_advantage)}
        </div>` : ""}

        ${imgHtml ? `<div style="margin-top:16px;">
          <h4 style="margin:8px 0;">عينات من إعلاناتهم</h4>
          ${imgHtml}
        </div>` : ""}
      </section>`;
    })
    .filter(Boolean)
    .join("\n");

  // Action tasks table
  const tasksHtml = (ai.tasks || []).length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#021544;color:white;">
          <th style="padding:8px;text-align:right;">المهمة</th>
          <th style="padding:8px;text-align:right;">المسؤول</th>
          <th style="padding:8px;text-align:right;">الموعد</th>
        </tr></thead>
        <tbody>
        ${(ai.tasks || []).map((t) => `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;">${escapeHtml(t.title)}${t.why ? `<br/><small style="color:#666;">${escapeHtml(t.why)}</small>` : ""}</td>
          <td style="padding:8px;color:#17a3a3;font-weight:600;">${escapeHtml(t.owner)}</td>
          <td style="padding:8px;">${escapeHtml(t.deadline || "")}</td>
        </tr>`).join("")}
        </tbody>
      </table>`
    : "";

  const alertHtml = ai.alert
    ? `<div style="margin:24px 0;padding:14px;background:#fef2f2;border:2px solid #dc2626;border-radius:6px;">
        <h3 style="margin:0;color:#dc2626;">تنبيه عاجل</h3>
        <p style="margin:8px 0 0 0;">${escapeHtml(ai.alert)}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>تقرير المنافسين الأسبوعي — ${escapeHtml(weekLabel)}</title>
</head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:780px;margin:30px auto;padding:0 20px;color:#222;direction:rtl;">

<header style="border-bottom:3px solid #17a3a3;padding-bottom:16px;margin-bottom:24px;">
  <h1 style="margin:0;color:#021544;">تقرير المنافسين الأسبوعي</h1>
  <p style="color:#666;margin:8px 0 0 0;">${escapeHtml(weekLabel)} · ${totalNew} نشاط جديد رصدناه هذا الأسبوع</p>
</header>

${ai.headline ? `<div style="background:#f0fdfa;border-right:4px solid #17a3a3;padding:14px;margin-bottom:24px;">
  <h2 style="margin:0;font-size:18px;color:#021544;">${escapeHtml(ai.headline)}</h2>
</div>` : ""}

<h2 style="color:#021544;margin-top:32px;">تحليل المنافسين</h2>
${competitorSections || "<p>لا تغييرات ملحوظة هذا الأسبوع.</p>"}

${tasksHtml ? `<h2 style="color:#021544;margin-top:32px;">مهام الفريق هذا الأسبوع</h2>${tasksHtml}` : ""}

${alertHtml}

${sheetUrl ? `<div style="margin:32px 0;padding:14px;background:#f9fafb;border-radius:6px;">
  <p style="margin:0;"><strong>البيانات الخام:</strong> <a href="${escapeHtml(sheetUrl)}" style="color:#17a3a3;">افتح في Google Sheet</a></p>
</div>` : ""}

<footer style="margin-top:48px;padding-top:16px;border-top:1px solid #ddd;color:#999;font-size:11px;text-align:center;">
  <p>Somaa — وكيل المحتوى الذكي لقيود · أُنشئ تلقائياً ${new Date().toLocaleString("ar-SA")}</p>
</footer>

</body>
</html>`;
}
