#!/usr/bin/env tsx
/* ══════════════════════════════════════════════════════════════════
   Asana webhook registration — run once after PUBLIC_HOST is set.

   Usage:
     npm run asana:register

   What it does:
     1. Reads ASANA_ACCESS_TOKEN + ASANA_PROJECT_GID from .env
     2. POSTs to Asana /webhooks to subscribe to project events
     3. Asana immediately sends a handshake GET — the running server
        echoes the X-Hook-Secret back automatically (already in agent.ts)
     4. Prints the webhook GID — save it if you ever need to delete it

   Prerequisites:
     - Server must be running:     npm run dev   (in another terminal)
     - PUBLIC_HOST must be set:    e.g. https://xxxx.ngrok.app
   ══════════════════════════════════════════════════════════════════ */

const PAT = process.env.ASANA_ACCESS_TOKEN;
const PROJECT_GID = process.env.ASANA_PROJECT_GID;
const PUBLIC_HOST = process.env.PUBLIC_HOST;

function fail(msg: string): never {
  console.error(`\n  ✗  ${msg}\n`);
  process.exit(1);
}

if (!PAT) fail("ASANA_ACCESS_TOKEN is not set in server/.env");
if (!PROJECT_GID) fail("ASANA_PROJECT_GID is not set in server/.env");
if (!PUBLIC_HOST) {
  console.error(`
  ✗  PUBLIC_HOST is not set in server/.env

  You need a public HTTPS URL pointing at your running server.
  Quickest way:

    1. Open a NEW terminal
    2. Run:  ngrok http 8080
    3. Copy the  https://xxxx.ngrok.app  URL it shows
    4. Add it to server/.env:  PUBLIC_HOST=https://xxxx.ngrok.app
    5. Restart the server (Ctrl+C then npm run dev)
    6. Run this script again:  npm run asana:register
`);
  process.exit(1);
}

const target = `${PUBLIC_HOST.replace(/\/$/, "")}/api/agent/webhook`;

async function run() {
  console.log(`\n  Registering Asana webhook`);
  console.log(`  Project GID : ${PROJECT_GID}`);
  console.log(`  Target URL  : ${target}\n`);

  /* Check for existing webhooks on this project first to avoid duplicates */
  const listRes = await fetch(
    `https://app.asana.com/api/1.0/webhooks?workspace=${process.env.ASANA_WORKSPACE_GID}&resource=${PROJECT_GID}`,
    { headers: { Authorization: `Bearer ${PAT}`, "Accept": "application/json" } },
  );
  const listJson: any = await listRes.json();
  const existing = (listJson.data ?? []).filter(
    (w: any) => w.target === target && w.active,
  );
  if (existing.length > 0) {
    console.log(`  ✓  Active webhook already registered: ${existing[0].gid}`);
    console.log(`     target: ${existing[0].target}`);
    console.log(`\n  Nothing to do — Asana is already pointing at your server.\n`);
    return;
  }

  /* Register */
  const res = await fetch("https://app.asana.com/api/1.0/webhooks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      data: {
        resource: PROJECT_GID,
        target,
        filters: [
          { resource_type: "task", action: "added" },
          { resource_type: "task", action: "changed", fields: ["assignee"] },
        ],
      },
    }),
  });

  const json: any = await res.json();

  if (!res.ok) {
    console.error(`  ✗  Asana API error ${res.status}:`);
    console.error(JSON.stringify(json, null, 2));
    if (res.status === 403) {
      console.error(`\n  Hint: the PAT may lack 'webhooks:write' scope, or the project GID is wrong.\n`);
    }
    if (res.status === 400 && JSON.stringify(json).includes("handshake")) {
      console.error(`\n  Hint: Asana tried to handshake with ${target} but got no valid response.`);
      console.error(`  Make sure the server is running AND PUBLIC_HOST resolves publicly.\n`);
    }
    process.exit(1);
  }

  const hook = json.data;
  console.log(`  ✓  Webhook registered!`);
  console.log(`     GID    : ${hook.gid}`);
  console.log(`     Target : ${hook.target}`);
  console.log(`     Active : ${hook.active}`);
  console.log(`\n  SAVE THIS GID in case you need to delete it later:`);
  console.log(`  npm run asana:delete -- ${hook.gid}\n`);

  /* Verify the server is already receiving events by checking its health */
  try {
    const health = await fetch(
      `${PUBLIC_HOST.replace(/\/$/, "")}/api/agent/tasks?limit=1`,
    );
    if (health.ok) {
      console.log(`  ✓  Server reachable at ${PUBLIC_HOST} — all good.\n`);
    }
  } catch {
    console.warn(`  ⚠  Could not reach ${PUBLIC_HOST} — check the server is running.\n`);
  }
}

run().catch((e) => {
  console.error("  ✗ Unexpected error:", e);
  process.exit(1);
});
