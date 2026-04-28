# Qoyod Creative OS — System Handoff

**Last updated:** April 28, 2026 · Commit `f662668`
**Live URL:** https://claude-code-ai-agent-production.up.railway.app

This document is the **complete system map** for anyone (human or AI) picking up this codebase. Read this first before making changes.

---

## What this system is

A self-learning closed-loop creative operator for **Qoyod (قيود)** — a Saudi cloud accounting + e-invoicing SaaS. It is intentionally focused on **4 capabilities**:

1. **Social media analysis** — performance trends, what's working
2. **Social media monitoring / listening** — competitor weekly auto-reports
3. **Content creator / writer** — ad copy, captions, calendars, sequences
4. **Paid media analyst** — ad library scraping, counter-creative strategy

It is **NOT** a graphic designer. Design execution and landing-page production are out of scope (Master Prompt v1.1 §0).

---

## Source of truth

`server/data/qoyod-master-prompt.md` — the full 535-line **Master Operating Prompt v1.1**. This defines:
- Brand law (Saudi dialect, golden rule, tone)
- Analytical OS, testing discipline, optimization protocol
- Content production engine (atomic briefs, hook angle library)
- Listening posture and competitor intelligence
- Reporting cadence (daily/weekly/monthly/quarterly)
- Hard stops and out-of-scope rules

Everything in the codebase is in service of this prompt.

---

## Architecture — closed-loop layers

```
┌────────────────────────────────────────────────────────────────────┐
│  BRAND LAW (auto-injected into every /api/generate call)          │
│  Saudi dialect · ONE message=CTA=trust · No Egyptian · Hard stops │
├────────────────────────────────────────────────────────────────────┤
│                          INPUTS                                    │
│  Quick Agent Terminal  ·  Master Prompt  ·  Per-tab UI            │
├────────────────────────────────────────────────────────────────────┤
│                  KNOWLEDGE FEEDS (auto-injected)                   │
│  Competitor Context  ·  Customer Voice  ·  ZATCA Intel            │
│  Pattern Library (recent WINs from Hypothesis Ledger)             │
├────────────────────────────────────────────────────────────────────┤
│                          AI ENGINE                                 │
│  Anthropic Sonnet 4.5  →  OpenAI gpt-4o-mini  →  Gemini 2.5       │
│  Retry · Dedup · Health probe · 180s timeout                      │
├────────────────────────────────────────────────────────────────────┤
│                       PRODUCTION TABS                              │
│  Content (1-5 variants) · Campaign · Calendar · Email & WA        │
│  Market Watch · Ad Library · ICP                                   │
├────────────────────────────────────────────────────────────────────┤
│                  COMPETITOR INTEL PIPELINE                         │
│  Sunday 09:00 UTC: Apify FB + IG + YouTube · jina Google →        │
│  AI synthesis → Sheet + Google Doc + Slack                         │
├────────────────────────────────────────────────────────────────────┤
│                    SELF-LEARNING LOOP                              │
│  Hypothesis Ledger (Sheet tab) → WIN-tagged → Pattern Library     │
│  → injected as few-shot examples → next generation gets smarter   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### AI generation
- `POST /api/generate` — Anthropic→OpenAI→Gemini. Auto-injects layered context. Body opt-outs: `skip_brand_law`, `skip_competitor_context`, `skip_customer_voice`, `skip_zatca`, `skip_pattern_library`, `creative_kit`, `persona`
- `GET /api/ai-health` — probe primary provider, returns `{ok, provider, latency_ms, fallback_available}`

### Competitor intelligence
- `POST /api/competitor-ads` — body `{source: "facebook"|"google"|"instagram"|"youtube", competitor, country, limit}`
- `POST /api/competitor-ads/run-monitor-now` — manual trigger of weekly pipeline
- `POST /api/competitor-ads/weekly-report-preview` — preview format without posting to Slack

### URL fetcher
- `POST /api/fetch-url` — generic web scrape via r.jina.ai, blocks login walls

### Self-learning
- `POST /api/hypothesis/log` — append to Hypothesis Ledger Sheet tab. Auto-busts pattern cache on WIN
- `GET /api/hypothesis/help` — schema + example payload

### QA
- `POST /api/editor-qa/check` — 11-rule pre-publish checklist (rule-based, no AI call)

### Reporting
- `POST /api/reports/daily-pulse` — formatted daily 6-line report
- `POST /api/reports/monthly-strategic` — multi-section monthly review
- `GET /api/reports/help` — schemas + examples

### Visualization
- `POST /api/miro/draw-system-architecture` — async fire-and-forget Miro render of v2 architecture

### Agent
- `POST /api/agent/run` — submit a task, returns `task_id`
- `GET /api/agent/tasks/:id` — poll task status
- Slack webhook + Asana webhook also wired

---

## Schedulers (auto-running on boot)

| Cadence | What |
|---|---|
| Sunday 09:00 UTC | Full competitor monitor → 4 sources → AI → Sheet + Slack + Google Doc |
| Every 6 hours | ZATCA watcher refresh (`zatca-news.md`) |
| Every 24 hours | Customer voice refresh (`customer-voice.md`) |
| Every 6 hours | Competitor poller (legacy IG/Twitter scraper) |
| Every 5 min | HubSpot social poller (Qoyod's own posts) |
| Every 5 min | AI health probe (client-side) |
| Sunday 09:00 UTC | Weekly digest (separate from competitor monitor — own social activity) |

---

## Data files

| Path | Purpose | Refresh |
|---|---|---|
| `server/data/qoyod-master-prompt.md` | Source of truth | Manual |
| `server/data/competitor-context.md` | Weekly competitor synthesis (D4) | Sunday |
| `server/data/customer-voice.md` | Real customer pain quotes (D2) | 24h |
| `server/data/zatca-news.md` | ZATCA regulatory awareness (D3) | 6h |
| `server/data/competitor-snapshots/<comp>/<date>.json` | Raw weekly scrapes | Sunday |
| `server/data/agent-memory.json` | Agent task history | Continuous |

---

## Required Railway environment variables

| Var | Purpose | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Primary AI provider | ✅ Required |
| `OPENAI_API_KEY` | AI fallback layer 1 | Optional |
| `GEMINI_API_KEY` | AI fallback layer 2 + image gen | ✅ Required |
| `APIFY_TOKEN` | FB/IG/Twitter scraping | ✅ Required for monitoring |
| `GOOGLE_SERVICE_ACCOUNT_B64` (or _JSON) | Drive + Sheets + YouTube | ✅ Required |
| `GOOGLE_SHEETS_ID` | Hypothesis Ledger + Competitor Posts | ✅ Required |
| `GOOGLE_DRIVE_FOLDER_ID` | Where weekly Google Doc lands | ✅ Required |
| `SLACK_BOT_TOKEN` | Slack reports + agent mentions | ✅ Required for Slack |
| `SLACK_DEFAULT_CHANNEL` | Default report channel | ✅ Required for Slack |
| `SLACK_TEAM_ID` | Slack webhook security | ✅ Required for Slack |
| `MIRO_ACCESS_TOKEN` + `MIRO_BOARD_ID` | Architecture board | Optional |
| `META_*` (5 vars) | Meta Ad Library (currently unused — Apify replaced) | Legacy, can remove |
| `ASANA_ACCESS_TOKEN` + `ASANA_PROJECT_GID` | Agent → Asana tasks | Optional |
| `APP_STORE_APP_ID` (Apple numeric ID) | Customer voice D2 | Optional |
| `PLAY_STORE_APP_ID` (package name) | Customer voice D2 | Optional |
| `YT_*` (3 vars) | YouTube — currently uses service account, OAuth vars are legacy | Optional |
| `TEAM_PASSWORD` | App auth gate | ✅ Required |

---

## Personas (6)

Defined in `server/src/lib/agent-personas.ts`. Each has a tool whitelist + role prompt:

1. **social_media** — analysis + listening + organic content
2. **content_creator** — copywriting (ads, captions, sequences)
3. **cro** — paid media funnel doctor
4. **email_lifecycle** — email + WhatsApp sequences
5. **editor_qa** — pre-publish QA + checklist enforcement
6. **orchestrator** — default router (full tool access)

`graphic_designer` was removed (Apr 28, 2026).

Mention handles: `@social`, `@محتوى`, `@cro`, `@editor`, `@boss` etc. — see `agent-mentions.ts`.

---

## Deployment

GitHub → Railway auto-deploy. **NEVER use `railway up`** — it creates shadow deployments. Always:

```
git push origin main
```

Then verify the live commit hash matches HEAD via `railway status --json`.

`client/dist/` is committed to git so Railway serves pre-built bundles directly. Run `npm --prefix client run build` after EVERY client change before pushing.

---

## CLAUDE.md rules (enforced every session)

See `CLAUDE.md` for full text. Critical highlights:

1. **Build the client every time** — even tiny changes. Catches over-deletion silently.
2. **Typecheck the server** when touching `server/src/` (pre-existing errors elsewhere are OK).
3. **For non-Edit tool deletes (sed/python by line)** — re-grep symbols that should still exist BEFORE pushing.
4. **After deploy** — wait for SUCCESS, hit endpoints live with curl, tell user how to refresh.

---

## Known limitations

- **Google Ads** uses jina scraping (free) — only returns ~4 visible ads, no copy text
- **Instagram organic posts** — handles must be verified manually (some competitors don't have IG)
- **TikTok ads** — no source yet (TikTok Ad Library has no API)
- **APIFY_TOKEN** — must have credit balance ($30-50/month covers normal usage)
- **YouTube Data API** — must be enabled in the GCP project the service account belongs to

---

## What's NOT done yet (Phase 5+)

These are written but UI-side mostly skeleton:

- **Atomic Brief schema enforcement** in Content tab (master prompt §6.2 + §11.1) — Content tab still outputs simple `{hook, body, cta, caption}` instead of full schema. The brand law is auto-injected, so output is on-brand, but the structured fields (atomic_id, hypothesis, kill_criteria visible in UI) aren't there yet
- **Anti-pattern Library** — counterpart to Pattern Library (LOSS-tagged). Schema exists in Sheet, no automation yet
- **Win-rate matrix** — sector × hook lookup that injects "F&B+Fear has 67% win-rate" hints. Needs ~20+ logged hypotheses to be useful
- **Daily Pulse / Monthly Strategic Review auto-runs** — endpoints exist but no scheduler. Currently called manually with metrics body
- **TikTok ads scraping** — would need Apify TikTok actor or paid scraper

---

## How to extend

### Add a new knowledge feed
1. Create `server/src/lib/<name>-watcher.ts` (mirror `customer-voice.ts` or `zatca-watcher.ts`)
2. Export `start<Name>Refresher(callAI)` and `get<Name>Snippet()`
3. Wire start function in `server/src/index.ts`
4. Inject snippet in `server/src/routes/generate.ts` with opt-out flag

### Add a new persona
1. Add to `PersonaId` union in `agent-personas.ts`
2. Add definition to `PERSONAS` record
3. Add handles to `HANDLE_MAP` in `agent-mentions.ts`
4. Optional: add role-specific addendum in `qoyod-brand-law.ts` `ROLE_ADDENDUMS`

### Add a new competitor source
1. Add scraper to `server/src/routes/competitor-ads.ts` (one of 4 patterns: Apify actor, jina scrape, official API, custom)
2. Update `CompetitorSnapshot` type in `competitor-weekly-report.ts`
3. Update `diffSnapshots` to handle new source
4. Update `scrapeCompetitor` in `competitor-monitor.ts` to include in weekly run
5. Update Slack/Doc renderers to surface

---

## Testing manually

```bash
# Trigger weekly monitor right now
curl -X POST https://claude-code-ai-agent-production.up.railway.app/api/competitor-ads/run-monitor-now \
  -H "Content-Type: application/json" \
  -d '{"competitors":["Daftra","Foodics"],"postToSlack":true}'

# Test pre-publish checklist
curl -X POST https://claude-code-ai-agent-production.up.railway.app/api/editor-qa/check \
  -H "Content-Type: application/json" \
  -d '{"creative":{"hook_ar":"شوف أرباحك لحظياً","body_ar":"...","cta_ar":"ابدأ الآن","trust_element":"ZATCA","funnel_stage":"MOF","hypothesis":"If we lead with control then MOF clicks rise","kill_criteria":"<2% CTR after 72h","visual_concept":"phone showing dashboard"}}'

# Re-render Miro architecture
curl -X POST https://claude-code-ai-agent-production.up.railway.app/api/miro/draw-system-architecture \
  -H "Content-Type: application/json" \
  -d '{"clear":true}'
```

---

## Contact

For changes, follow the CLAUDE.md rules. The project repo is the source of truth — no separate docs system. This file should be updated whenever a new layer is added to the architecture.
