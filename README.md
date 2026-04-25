# Qoyod Creative OS

Internal AI-powered marketing tool for the Qoyod team — a password-gated web app with:

1. **11 manual Claude-powered tabs** pre-tuned for Qoyod products, Saudi Arabic voice, and ZATCA compliance messaging.
2. **An autonomous Creative Agent** that acts on its own when someone @mentions it or assigns it a task — can draft copy, generate SVG ads + Nano Banana images, build landing pages / calendars / email sequences, and publish to Canva, WordPress, HubSpot, or Drive.

## Stack

- **Frontend**: React 18 + Vite + TypeScript (Arabic/RTL)
- **Backend**: Express 4 + TypeScript (Claude proxy + password gate + integrations + agent loop)
- **Main model**: `claude-sonnet-4-5` (configurable)
- **Image model**: Gemini 2.5 Flash Image ("Nano Banana")

## Layout

```
.
├── server/                 # Express API
│   └── src/
│       ├── app.ts
│       ├── index.ts
│       ├── lib/logger.ts   # pino-compatible req.log shim
│       └── routes/
│           ├── health.ts       auth.ts       generate.ts     generate-design.ts
│           ├── canva.ts        miro.ts       drive.ts        convert.ts
│           ├── hubspot.ts      wordpress.ts  nanobanana.ts
│           └── agent.ts         ← autonomous creative agent
├── client/                 # Vite React app — Login + CreativeOS (11 tabs) + AgentPanel
└── package.json            # concurrently runs both in dev
```

## Setup

1. Install dependencies for root, server, and client:

   ```bash
   npm run install:all
   ```

2. Copy the server env template and fill it in:

   ```bash
   cp server/.env.example server/.env
   ```

   Required: `ANTHROPIC_API_KEY`, `TEAM_PASSWORD` (default: `QoyodTeam2026`).

   Optional per integration: `GEMINI_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_DRIVE_FOLDER_ID`, `CANVA_CLIENT_ID/_SECRET`, `MIRO_CLIENT_ID/_SECRET` (or `MIRO_ACCESS_TOKEN`), `WP_SITE_URL/_USERNAME/_APP_PASSWORD`, `HS_ACCESS_TOKEN`, `FIGMA_APP_URL`, `FIGMA_WEB_URL`.

3. Start both servers in dev mode:

   ```bash
   npm run dev
   ```

   - API: <http://localhost:8080>
   - App: <http://localhost:5173> (proxies `/api` → API)

Open the app, enter the team password, and use any of the 11 tabs — or click the floating **🤖 وكيل الإبداع** button (top-right) to drive the autonomous agent.

## The 11 manual tabs

1. **إنشاء محتوى** — Ad content generator (hook + headline + body + UGC script + design direction; A/B variants toggle)
2. **حملة** — Full multi-channel campaign builder (hooks, ad copies, budget split)
3. **خطة المحتوى** — Monthly content calendar (per-post caption, design text, hashtags)
4. **رسائل / بريد** — Welcome / nurture / win-back / demo / announcement sequences across email, WhatsApp, SMS
5. **تحليل الأداء** — Paste metrics → diagnosis + quick wins + creative recommendations
6. **مراقبة السوق** — Competitor scan (Daftra, Foodics, Rewaa, Wafeq…) + counter-creative generator
7. **التصميم** — Design brief (1–5 variants) + optional AI-generated SVG visual + per-platform ad specs
8. **صفحات الوصول** — Two-step landing page: strategy JSON → full self-contained HTML download
9. **مكتبة الإعلانات** — Curated reference ads; click "use as reference" to prefill other tabs
10. **شرائح العملاء** — 10 ICP personas; one-click "Create ad for this persona"
11. **مراجعة** — Brand compliance checklist + AI copy reviewer (dialect check, score, improved rewrite)

## Autonomous Creative Agent

The agent is a Claude tool-use loop that can be triggered three ways:

| Trigger          | Endpoint                  | Example source                          |
| ---------------- | ------------------------- | --------------------------------------- |
| Manual from UI   | `POST /api/agent/run`     | Team member clicks **Run agent** in the floating panel |
| Direct @mention  | `POST /api/agent/mention` | Any script you wire up                  |
| Generic webhook  | `POST /api/agent/webhook` | Slack `app_mention`, HubSpot workflow, Asana task webhook (auto-detected) |

### Personas (multi-specialist roles)

The agent runs "as" one persona per task. Each persona is a scoped tool subset + a role-specific prompt. The dispatcher auto-picks from the trigger wording, or a caller can force one via `persona` in the POST body / `context.persona` in webhooks.

| id | Role | What they do |
| --- | --- | --- |
| `graphic_designer` | AI Graphic Designer | SVG ads, Nano Banana images, Canva uploads |
| `social_media` | Social Media Specialist | Competitor scans, weekly calendars, captions, hashtags, **organic** performance analytics |
| `content_creator` | Content Creator | Ad copy, Google Ads RSAs, captions, blog posts |
| `cro` | CRO Specialist | Landing pages, A/B tests, on-page audits |
| `email_lifecycle` | Email / Lifecycle Marketer | Welcome, nurture, winback sequences |
| `pr_comms` | PR & Comms | Bilingual press releases, partnership announcements |
| `editor_qa` | Editor / Copy QA | Brand voice, dialect policing, rewrite |
| `orchestrator` | Orchestrator (default fallback) | Full toolbox — coordinates multi-specialist work |

List them live: `GET /api/agent/personas`. Filter the task feed: `GET /api/agent/tasks?persona=cro`.

### Tools

The persona's tool whitelist is a subset of the full catalog below. Orchestrator has access to all of them:

- `generate_content` — Saudi-dialect ad copy / captions (hooks + message + CTA)
- `generate_ad_svg` — SVG ad creative (Navy + Teal brand), 1:1 / 4:5 / 9:16 / 16:9
- `generate_nb_image` — Nano Banana photorealistic/illustration image
- `build_landing_page_html` — Mobile-first RTL Arabic LP (self-contained HTML)
- `build_campaign_plan` — Multi-week 360° campaign JSON
- `build_content_calendar` — Weekly post calendar
- `build_email_sequence` — Nurture email sequence
- `review_copy` — Brand/voice/dialect review + rewrite
- `publish_wordpress` — Draft to WP
- `publish_hubspot` — Draft to HubSpot CMS
- `upload_canva` — SVG → Canva asset → new Design
- `save_to_drive` — Any text/binary artifact to the team Drive folder
- `analyze_landing_page` — Fetch a URL and critique conversion / clarity / dialect
- `brief_to_spec` — Expand a 1-line brief into a full marketing spec (goal, audience, KPIs, channels)
- `translate_copy` — Arabic (Saudi-dialect) ↔ English
- `generate_video_script` — Short-form video scripts (TikTok / Reels / Shorts / Snap)
- `generate_seo_meta` — Arabic-first SEO meta + keywords
- `plan_ab_test` — Structured A/B test spec with kill criteria
- `generate_hashtags` — Gulf-market hashtag suggestions
- `generate_miro_board` — Workflow/funnel board via Miro
- `brand_fact_lookup` — Internal KV of palette / fonts / products / trust / dialect rules
- `analyze_competitor_content` — Scan a competitor URL/handle for themes, hooks, cadence, gaps
- `generate_google_ads_rsa` — 15 headlines + 4 descriptions with char-count validation
- `build_blog_article` — Long-form SEO article with FAQ schema
- `analyze_metrics_report` — Organic metrics JSON → insight + 3 actions (Social Media persona only)
- `build_press_release` — Bilingual (ar+en) press release
- `slack_post` / `create_asana_task` — Mid-task ops actions
- `memory_read` / `memory_write` — Every persona can read/write long-term notes (always-on)

Task state (steps, tool calls, results, outputs) is persisted to `server/data/agent-tasks.json` (last 100 tasks) and streamed into the UI panel. In-flight work that got interrupted by a restart is marked `error` on boot. Duplicate triggers within 60 seconds are skipped.

### @mentions

Any trigger body can address a persona with an `@handle`. The first recognized handle wins the routing; extra handles are recorded on the step for future multi-step workflows. Handles include the persona id (`@cro`, `@editor_qa`), English shortcuts (`@designer`, `@copy`, `@pr`, `@qa`), and Arabic aliases (`@مصمم`, `@محتوى`, `@محرر`). Unknown handles are preserved as `actors`.

### Memory

Three slices at `server/data/agent-memory.json`:

- **Facts** — brand truths injected into every system prompt (palette, voice rules, ZATCA line). CRUD via `GET/POST/DELETE /api/agent/memory/fact`.
- **Recall** — auto-captured title + summary of the last 40 completed tasks, scoped per persona.
- **Notes** — persona-scoped scratchpad the agent writes itself via `memory_write`. Surfaces in next runs so the team compounds learnings ("winning hook X", "avoid CTA Y").

### Tool-response cache (token saver)

Deterministic tool calls (`review_copy`, `translate_copy`, `generate_hashtags`, `generate_google_ads_rsa`, etc.) are hashed on `(tool, input, persona)` and cached on disk:

| Tier | TTL | Examples |
| --- | --- | --- |
| Long | 1 week | `review_copy`, `translate_copy`, `brand_fact_lookup`, `generate_seo_meta` |
| Day | 24h | `generate_content`, `generate_google_ads_rsa`, `generate_hashtags`, `build_email_sequence`, … |
| Hour | 1h | `analyze_competitor_content`, `analyze_landing_page`, `analyze_metrics_report` |
| Never | — | Side-effect tools (`save_to_drive`, `publish_*`, `slack_post`, `generate_nb_image`) |

Repeat runs return the cached result in ~1ms and log `agent.tool.cache_hit`. Bypass with `context.skipCache: true` in the trigger or the `/skip` command in the console. Stats: `GET /api/agent/cache/stats`. Wipe: `POST /api/agent/cache/clear`.

### Console interface

Run `npm run console` in a second terminal (needs `npm run dev` alive on 8787). It's a readline REPL with coloured output and quick-fire presets:

```
/p cro                  # switch persona
/quick calendar         # run a preset brief
/ask اكتب ثلاث هوكات    # free-form brief on the current persona
/tasks                  # last 10 tasks
/cache                  # token-savings stats
/memory                 # facts + notes + recall for current persona
/note winning hook: …   # jot a note on current persona
/skip                   # bypass the tool cache on the next ask
/q
```

Presets live at the top of `server/src/console.ts` — edit `QUICK_PROMPTS` to add your own. Point at a different host with `/host https://…` or `CREATIVE_OS_HOST` env.

### Structured logging

Every task emits structured JSON lines with `task_id`, `persona`, and `source` so you can `grep` a single run out of the feed. Key events: `agent.run.start`, `agent.tool.cache_hit`, `agent.tool.error`, `agent.run.done`.

### Scheduled / recurring runs

The agent supports server-side cron-lite schedules — fire a preset prompt on a cadence:

- `POST /api/agent/schedules` — `{name, cadence:{every_minutes:N} | {daily_at:"HH:mm"}, trigger:{title,body,actor}}`
- `GET /api/agent/schedules` — list all
- `PATCH /api/agent/schedules/:id` — `{active:boolean}` pause/resume
- `DELETE /api/agent/schedules/:id`
- `POST /api/agent/schedules/:id/fire` — run once now

Schedules live in `server/data/agent-schedules.json`.

### Slack reply-back

If `SLACK_BOT_TOKEN` is set, the agent posts its final summary + output links back to the originating Slack channel (threaded on the @mention it replied to).

### Wiring auto-triggers

- **Slack**: add `/api/agent/webhook` as your Events API URL; the route handles URL-verification and `app_mention` events.
- **HubSpot workflows**: add a "Trigger a webhook" action pointing at `/api/agent/webhook`.
- **Asana**: create a webhook on the "Creative Agent" user's assigned-tasks, target `/api/agent/webhook`.
- **Generic**: POST `{actor, channel, text, context}` to `/api/agent/mention`.

## API endpoints (server)

### Core
| Method | Path                   | Purpose                                                 |
| ------ | ---------------------- | ------------------------------------------------------- |
| GET    | `/api/health`          | Liveness probe                                          |
| POST   | `/api/auth`            | `{password}` → 200 / 401                                |
| POST   | `/api/generate`        | `{system, user, max_tokens?}` → Anthropic messages      |
| POST   | `/api/generate-design` | Brief → SVG ad creative                                 |
| POST   | `/api/convert`         | webm → mp4 via local ffmpeg                             |

### Agent
| Method | Path                    | Purpose                                      |
| ------ | ----------------------- | -------------------------------------------- |
| POST   | `/api/agent/run`        | UI trigger (title + body + context + actor) |
| POST   | `/api/agent/mention`    | Generic @mention ingestion                   |
| POST   | `/api/agent/webhook`    | Slack / HubSpot / Asana webhook ingress      |
| GET    | `/api/agent/tasks`      | List last 50 tasks (filter by `?status=&source=&schedule_id=`) |
| GET    | `/api/agent/tasks/:id`  | Inspect one task (full step log)             |
| DELETE | `/api/agent/tasks/:id`  | Remove a task                                |
| POST   | `/api/agent/tasks/:id/rerun` | Re-run a prior task (bypasses dedup)    |
| GET    | `/api/agent/schedules`  | List recurring schedules                     |
| POST   | `/api/agent/schedules`  | Create a schedule (every-N-minutes or daily-at HH:mm) |
| PATCH  | `/api/agent/schedules/:id` | Pause / resume (`{active}`)               |
| DELETE | `/api/agent/schedules/:id` | Remove schedule                           |
| POST   | `/api/agent/schedules/:id/fire` | Fire once immediately                |
| GET    | `/api/agent/status`     | Model, tool list, task counts, integration flags |

### Integrations
| Method | Path                        | Purpose                           |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/api/canva/auth-url`       | Start Canva OAuth (PKCE)          |
| GET    | `/api/canva/status`         | Canva connection status           |
| POST   | `/api/canva/upload-svg`     | Upload SVG → Canva asset          |
| POST   | `/api/canva/create-design`  | Create Canva design from asset    |
| GET    | `/api/miro/auth-url`        | Start Miro OAuth                  |
| POST   | `/api/miro/create-board`    | Create + draw Creative OS board   |
| POST   | `/api/drive/upload`         | Upload text/binary to team Drive  |
| POST   | `/api/drive/list`           | List target folder                |
| POST   | `/api/wp-draft`             | WordPress draft                   |
| POST   | `/api/hs-draft`             | HubSpot draft                     |
| POST   | `/api/nb/generate`          | Gemini 2.5 Flash text             |
| POST   | `/api/nb/generate-image`    | Nano Banana image                 |

## Environment variables (server)

See `server/.env.example` for the full list. Essentials:

| Name                           | Required | Purpose                                   |
| ------------------------------ | -------- | ----------------------------------------- |
| `ANTHROPIC_API_KEY`            | yes      | Claude API key                            |
| `TEAM_PASSWORD`                | yes      | Login gate password                       |
| `ANTHROPIC_MODEL`              | no       | Default `claude-sonnet-4-5`               |
| `PORT`                         | no       | Default `8080`                            |
| `PUBLIC_HOST`                  | no       | Used for OAuth redirect URIs              |
| `GEMINI_API_KEY`               | no       | Nano Banana image + Gemini text           |
| `GOOGLE_SERVICE_ACCOUNT_JSON`  | no       | Drive service account (inline JSON)       |
| `GOOGLE_DRIVE_FOLDER_ID`       | no       | Target Drive folder id                    |
| `CANVA_CLIENT_ID / _SECRET`    | no       | Canva OAuth (PKCE)                        |
| `MIRO_CLIENT_ID / _SECRET`     | no       | Miro OAuth                                |
| `MIRO_ACCESS_TOKEN`            | no       | Miro static token (bypass OAuth)          |
| `WP_SITE_URL / _USERNAME / _APP_PASSWORD` | no | WordPress publishing                  |
| `HS_ACCESS_TOKEN`              | no       | HubSpot CMS publishing                    |
| `FIGMA_APP_URL`                | no       | Figma reference — app screens             |
| `FIGMA_WEB_URL`                | no       | Figma reference — marketing web pages     |

The Anthropic + Gemini keys never reach the browser — all model calls are proxied through the server.

## Brand constants (baked into prompts)

- Navy `#021544`, Deep Turquoise `#01355A`, Accent Turquoise `#17A3A4`
- Fonts: IBM Plex Sans Arabic + Space Grotesk (Lama Sans in design specs)
- Saudi Arabic dialect only (مو / وش / ليش) — never Egyptian
- 13 products across Core / Segments / Services / Seasonal Offers
- 8 tracked competitors, 10 ICP personas, 14 reference ads

Edit `client/src/pages/CreativeOS.jsx` to change any of the above.

## Production build

```bash
npm run build
```

Builds the client to `client/dist/`. Serve those static files from any CDN and point the backend at the same origin (or serve `client/dist` from Express if you prefer a single process).
