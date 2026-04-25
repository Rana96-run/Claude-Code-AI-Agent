#!/usr/bin/env tsx
/* Delete an Asana webhook by GID.
   Usage:  npm run asana:delete -- <webhook_gid>           */

const PAT = process.env.ASANA_ACCESS_TOKEN;
const gid = process.argv[2];

if (!PAT) { console.error("ASANA_ACCESS_TOKEN not set"); process.exit(1); }
if (!gid) { console.error("Usage: npm run asana:delete -- <webhook_gid>"); process.exit(1); }

const res = await fetch(`https://app.asana.com/api/1.0/webhooks/${gid}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${PAT}` },
});

if (res.status === 200 || res.status === 204) {
  console.log(`✓  Webhook ${gid} deleted.`);
} else {
  const j = await res.json().catch(() => ({}));
  console.error(`✗  ${res.status}`, j);
}
