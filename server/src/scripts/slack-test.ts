#!/usr/bin/env tsx
/* Test the Slack bot token — posts a single message to SLACK_DEFAULT_CHANNEL.
   Usage:  npm run slack:test                                                  */

const TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL = process.env.SLACK_DEFAULT_CHANNEL;

if (!TOKEN) { console.error("SLACK_BOT_TOKEN not set"); process.exit(1); }
if (!CHANNEL) { console.error("SLACK_DEFAULT_CHANNEL not set"); process.exit(1); }

const res = await fetch("https://slack.com/api/chat.postMessage", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({
    channel: CHANNEL,
    text: "Qoyod Creative Agent is connected to Slack. Mention me with @QoyodAgent + a brief to start a task.",
  }),
});

const json: any = await res.json();
if (json.ok) {
  console.log(`✓  Message posted to ${CHANNEL} (ts: ${json.ts})`);
} else {
  console.error(`✗  Slack error: ${json.error}`);
  if (json.error === "channel_not_found") {
    console.error("   Hint: make sure the bot is invited to the channel first:");
    console.error(`   In Slack: /invite @QoyodAgent in the channel`);
  }
  if (json.error === "invalid_auth") {
    console.error("   Hint: the token is invalid or expired — regenerate it at api.slack.com/apps");
  }
}
