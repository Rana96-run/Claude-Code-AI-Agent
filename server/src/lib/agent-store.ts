import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

/* Disk-backed task snapshot. The agent runs in-memory for speed, but we
   persist a slim snapshot after every status transition so a server restart
   doesn't lose the task feed. One JSON file, rewritten atomically. */

const STORE_DIR = path.resolve(process.cwd(), "data");
const STORE_PATH = path.join(STORE_DIR, "agent-tasks.json");

export interface PersistedTask {
  id: string;
  created_at: number;
  updated_at: number;
  status: string;
  trigger: unknown;
  steps: unknown[];
  outputs: Record<string, unknown>;
  summary?: string;
  error?: string;
  priority?: "low" | "normal" | "high";
  schedule_id?: string;
  persona?: string;
}

export function loadTasks(): PersistedTask[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.tasks) ? parsed.tasks : [];
  } catch (e) {
    logger.warn({ err: String(e) }, "agent-store: load failed, starting fresh");
    return [];
  }
}

let writeQueued = false;
let lastWrite = 0;
const MIN_WRITE_INTERVAL_MS = 400;

export function saveTasks(tasks: PersistedTask[]) {
  /* Debounce: agents push many steps per second. We coalesce with a short
     trailing-edge timer so we still capture the last state, but only write
     every ~400ms. */
  const now = Date.now();
  const due = now - lastWrite >= MIN_WRITE_INTERVAL_MS;
  if (due) {
    flush(tasks);
    return;
  }
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    writeQueued = false;
    flush(tasks);
  }, MIN_WRITE_INTERVAL_MS);
}

function flush(tasks: PersistedTask[]) {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    const tmp = STORE_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify({ tasks, written_at: Date.now() }, null, 2), "utf8");
    fs.renameSync(tmp, STORE_PATH);
    lastWrite = Date.now();
  } catch (e) {
    logger.error({ err: String(e) }, "agent-store: write failed");
  }
}
