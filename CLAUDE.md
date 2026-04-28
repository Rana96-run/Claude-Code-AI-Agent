# Qoyod Creative OS — Claude Rules

## DEPLOYMENT: GitHub → Railway (CRITICAL)

**Railway auto-deploys from GitHub. `railway up` does NOT update the live server.**

### Rules — enforced every session

1. **Before any code change**, check unpushed commits:
   ```
   git log origin/main..HEAD --oneline
   ```
   If output is non-empty → push first, then make changes.

2. **To deploy**, always use:
   ```
   git push origin main
   ```
   Never use `railway up` — it uploads to a shadow deployment that Railway ignores in favour of the GitHub-linked auto-deploy.

3. **After pushing**, wait ~2 min then verify the live commit hash matches:
   ```
   railway status --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['meta']['commitHash'][:7])"
   ```
   Compare against `git rev-parse --short HEAD`.

4. **Never mix** `railway up` + GitHub deploys in the same session — Railway will serve whichever built last, making it impossible to know what's live.

## Stack

- **Server**: `server/` — Express + TypeScript, port 8080
- **Client**: `client/` — React (Vite), proxied through server in prod
- **Live URL**: https://claude-code-ai-agent-production.up.railway.app
- **Repo**: https://github.com/Rana96-run/Content-AI-Agent

## Key files

| File | Purpose |
|------|---------|
| `server/src/routes/generate.ts` | Anthropic proxy — json_mode prefill |
| `server/src/routes/generate-design.ts` | Design kit + Gemini pipeline |
| `server/src/lib/design-kit.ts` | DesignPlan → image prompt → Gemini |
| `client/src/pages/CreativeOS.jsx` | Main UI (all tabs) |
