import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "./logger.js";

/* Minimal in-memory scheduler for recurring agent triggers.
   Supports two shapes:
     - { every_minutes: 60 }   → fire every N minutes
     - { daily_at: "09:00" }   → fire once per server-local day at HH:mm
   Persisted to data/agent-schedules.json. A single setInterval ticks every
   30s and fires anything that's due. */

const STORE_DIR = path.resolve(process.cwd(), "data");
const STORE_PATH = path.join(STORE_DIR, "agent-schedules.json");

export interface Schedule {
  id: string;
  name: string;
  created_at: number;
  last_run_at: number | null;
  next_run_at: number;
  active: boolean;
  cadence:
    | { every_minutes: number }
    | { daily_at: string }; // "HH:mm" in server-local time
  /* The payload handed to the agent when this schedule fires */
  trigger: {
    title?: string;
    body: string;
    actor?: string;
  };
}

let schedules: Schedule[] = loadSchedules();

function loadSchedules(): Schedule[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return Array.isArray(parsed?.schedules) ? parsed.schedules : [];
  } catch (e) {
    logger.warn({ err: String(e) }, "schedule: load failed");
    return [];
  }
}

function saveSchedules() {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    const tmp = STORE_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify({ schedules }, null, 2), "utf8");
    fs.renameSync(tmp, STORE_PATH);
  } catch (e) {
    logger.error({ err: String(e) }, "schedule: write failed");
  }
}

function computeNextRun(cadence: Schedule["cadence"], from = Date.now()): number {
  if ("every_minutes" in cadence) {
    return from + Math.max(1, cadence.every_minutes) * 60_000;
  }
  /* daily_at */
  const [hh, mm] = cadence.daily_at.split(":").map((n) => parseInt(n, 10));
  const d = new Date(from);
  d.setHours(hh || 9, mm || 0, 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function listSchedules(): Schedule[] {
  return [...schedules];
}

export function addSchedule(input: {
  name: string;
  cadence: Schedule["cadence"];
  trigger: Schedule["trigger"];
}): Schedule {
  const s: Schedule = {
    id: "s_" + crypto.randomBytes(5).toString("hex"),
    name: input.name,
    created_at: Date.now(),
    last_run_at: null,
    next_run_at: computeNextRun(input.cadence),
    active: true,
    cadence: input.cadence,
    trigger: input.trigger,
  };
  schedules.push(s);
  saveSchedules();
  return s;
}

export function deleteSchedule(id: string): boolean {
  const n = schedules.length;
  schedules = schedules.filter((s) => s.id !== id);
  if (schedules.length !== n) {
    saveSchedules();
    return true;
  }
  return false;
}

export function toggleSchedule(id: string, active: boolean): boolean {
  const s = schedules.find((x) => x.id === id);
  if (!s) return false;
  s.active = active;
  saveSchedules();
  return true;
}

export function markFired(id: string) {
  const s = schedules.find((x) => x.id === id);
  if (!s) return;
  s.last_run_at = Date.now();
  s.next_run_at = computeNextRun(s.cadence, s.last_run_at);
  saveSchedules();
}

let tickHandle: NodeJS.Timeout | null = null;

/* The scheduler is decoupled from the agent: we only expose a hook. The
   agent module wires its own trigger function in via startScheduler(). */
export function startScheduler(fire: (s: Schedule) => void, intervalMs = 30_000) {
  if (tickHandle) return;
  tickHandle = setInterval(() => {
    const now = Date.now();
    for (const s of schedules) {
      if (!s.active) continue;
      if (s.next_run_at <= now) {
        try {
          fire(s);
          markFired(s.id);
        } catch (e) {
          logger.error({ err: String(e), schedule_id: s.id }, "schedule: fire failed");
        }
      }
    }
  }, intervalMs);
  /* Keep the event loop free to exit during tests */
  if (tickHandle.unref) tickHandle.unref();
  logger.info({ intervalMs, count: schedules.length }, "agent scheduler started");
}

export function stopScheduler() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}
