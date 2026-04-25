# Qoyod Creative OS

Internal marketing tool for the Qoyod team — a password-protected React web app powered by Claude AI.

## Architecture

### Monorepo structure (pnpm workspaces)
- `artifacts/qoyod-creative-os/` — React + Vite frontend (port 18292, preview at `/`)
- `artifacts/api-server/` — Express + TypeScript backend API (port 8080, proxied at `/api/`)

### Key files
- `artifacts/qoyod-creative-os/src/App.tsx` — root component: auth gate → Login or CreativeOS
- `artifacts/qoyod-creative-os/src/pages/Login.tsx` — RTL Arabic password gate, stores `qoyod_auth=1` in sessionStorage
- `artifacts/qoyod-creative-os/src/pages/CreativeOS.jsx` — main 8-tab app (ported from original source)
- `artifacts/api-server/src/routes/generate.ts` — POST `/api/generate` (Claude proxy) + POST `/api/auth` (password check)
- `artifacts/api-server/src/routes/index.ts` — route registration

## Features (11 tabs)
1. **إنشاء محتوى** — Ad content generator: hook + headline + body + UGC script + design direction. Toggle "Single / A/B" — A/B mode generates two variants with different angles, side-by-side.
2. **حملة** — Full campaign builder (multi-channel, budget split, hooks per channel)
3. **خطة المحتوى** — Monthly content calendar with per-post caption, design text, hashtags
4. **رسائل / بريد** — Email / WhatsApp / SMS sequence generator (welcome, nurture, win-back, demo, announcement)
5. **تحليل الأداء** — Performance analyzer: paste metrics → diagnosis, quick wins, creative recommendations
6. **مراقبة السوق** — Competitor ad scanner + counter-creative generator (Daftra, Foodics, Rewaa, Wafeq)
7. **التصميم** — Design brief generator (1-3 variants, art direction, dos/donts, file checklist) + "Generate Ad Specs" button appears after brief is generated (dimensions, text limits, safe zones per platform)
8. **صفحات الوصول** — 2-step landing page builder (strategy JSON → full self-contained HTML download)
9. **مكتبة الإعلانات** — Reference ad library with real examples and "use as reference" cross-tab links
10. **شرائح العملاء** — 10 customer personas (ICP) with pain points, hooks, and quick ad creation
11. **مراجعة** — Creative compliance checklist + AI copy reviewer (dialect check, score, improved version)

Note: A/B Variants and Ad Specs were standalone tabs — now merged into Content and Design tabs respectively.

## Products (13 products across 4 groups)
- **Core**: Qoyod Main, QFlavours, QoyodPOS, QBookkeeping
- **Segments**: قيود للمحاسبين, قيود لأصحاب الأعمال
- **Services**: VAT Services, API Integration, E-Invoice Phase 2
- **Seasonal offers**: Ramadan, National Day, Founding Day, Year-End

## Features list (10 items baked into content/brief tabs)
ZATCA e-invoice, Tax Declaration, Financial Reports, Inventory, Mobile Management, Integrations, 24h Support, Bookkeeping (SOCPA), Budgets, Recurring Transactions

## Auth
- Team password: stored in `TEAM_PASSWORD` env secret
- Frontend checks `sessionStorage.getItem("qoyod_auth") === "1"`
- POST `/api/auth` validates password server-side

## AI
- Model: `claude-sonnet-4-5` via Anthropic API
- Max 2000 output tokens, 20K character prompt limit
- API key in `ANTHROPIC_API_KEY` env secret

## Brand
- Dark navy background: `#021544`
- Teal accent: `#17a3a3`
- RTL Arabic UI throughout

## Workflows
- `artifacts/qoyod-creative-os: web` — Vite dev server
- `artifacts/api-server: API Server` — Express backend
