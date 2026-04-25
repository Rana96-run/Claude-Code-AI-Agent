import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import type { PersonaId } from "./agent-personas.js";

/* ══════════════════════════════════════════════════════════════════
   Long-term agent memory.

   Three slices:
     1. FACTS     — brand truths, ZATCA language, customer counts, do/don't
                    rules. Written once, read on every task. Survives restarts.
     2. RECALL    — short rolling log of recent tasks (id, persona, title,
                    summary). Injected into the system prompt so the agent
                    "remembers" what it did yesterday.
     3. NOTES     — persona-scoped scratchpad. The agent can call a
                    memory_write tool to jot something ("winning hook:
                    'اشتراك بريال'") for the next run to pick up.

   Everything lands in server/data/agent-memory.json. Writes are atomic
   and debounced. We keep it small — truncation rules below.
   ══════════════════════════════════════════════════════════════════ */

const MEM_DIR = path.resolve(process.cwd(), "data");
const MEM_PATH = path.join(MEM_DIR, "agent-memory.json");

const MAX_FACTS = 200;
const MAX_RECALL = 40;
const MAX_NOTES_PER_PERSONA = 25;

export interface MemoryFact {
  id: string;           // stable slug — e.g. "zatca_phase2"
  text: string;         // the fact itself (bilingual ok)
  source?: string;      // where it came from
  updated_at: number;
}
export interface RecallItem {
  task_id: string;
  persona: PersonaId | string;
  title: string;
  summary: string;
  ts: number;
}
export interface PersonaNote {
  id: string;
  text: string;
  ts: number;
}

interface MemoryShape {
  facts: MemoryFact[];
  recall: RecallItem[];
  notes: Record<string, PersonaNote[]>;
}

const EMPTY: MemoryShape = {
  facts: [
    {
      id: "brand_name",
      text: "Qoyod (قيود) — Saudi cloud accounting SaaS, ZATCA Phase-2 certified, serves 25,000+ SMBs.",
      updated_at: Date.now(),
    },
    {
      id: "voice_rules",
      text:
        "Arabic-first Saudi dialect. Use مو / وش / ليش. NEVER use Egyptian markers مش / ايه / ازاي / بتاع / يلا.",
      updated_at: Date.now(),
    },
    {
      id: "palette",
      text: "Qoyod palette — Navy #021544, Deep Turquoise #01355A, Accent Teal #17A3A4.",
      updated_at: Date.now(),
    },
  ],
  recall: [],
  notes: {},
};

let STATE: MemoryShape = EMPTY;

function load() {
  try {
    if (!fs.existsSync(MEM_PATH)) {
      STATE = structuredClone(EMPTY);
      persist(true);
      return;
    }
    const raw = JSON.parse(fs.readFileSync(MEM_PATH, "utf8"));
    STATE = {
      facts: Array.isArray(raw?.facts) ? raw.facts : EMPTY.facts,
      recall: Array.isArray(raw?.recall) ? raw.recall : [],
      notes: raw?.notes && typeof raw.notes === "object" ? raw.notes : {},
    };
  } catch (e) {
    logger.warn({ err: String(e) }, "agent-memory: load failed, using defaults");
    STATE = structuredClone(EMPTY);
  }
}
load();

let writeQueued = false;
function persist(immediate = false) {
  const flush = () => {
    try {
      if (!fs.existsSync(MEM_DIR)) fs.mkdirSync(MEM_DIR, { recursive: true });
      const tmp = MEM_PATH + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(STATE, null, 2), "utf8");
      fs.renameSync(tmp, MEM_PATH);
    } catch (e) {
      logger.error({ err: String(e) }, "agent-memory: persist failed");
    }
  };
  if (immediate) return flush();
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    writeQueued = false;
    flush();
  }, 500);
}

/* ───────── FACTS ───────── */

export function listFacts(): MemoryFact[] {
  return [...STATE.facts];
}

export function upsertFact(id: string, text: string, source?: string) {
  const existing = STATE.facts.findIndex((f) => f.id === id);
  const fact: MemoryFact = { id, text, source, updated_at: Date.now() };
  if (existing >= 0) STATE.facts[existing] = fact;
  else STATE.facts.unshift(fact);
  if (STATE.facts.length > MAX_FACTS) STATE.facts.length = MAX_FACTS;
  persist();
}

export function deleteFact(id: string): boolean {
  const before = STATE.facts.length;
  STATE.facts = STATE.facts.filter((f) => f.id !== id);
  const changed = STATE.facts.length !== before;
  if (changed) persist();
  return changed;
}

/* ───────── RECALL ───────── */

export function addRecall(item: Omit<RecallItem, "ts">) {
  STATE.recall.unshift({ ...item, ts: Date.now() });
  if (STATE.recall.length > MAX_RECALL) STATE.recall.length = MAX_RECALL;
  persist();
}

export function recentRecall(personaId?: PersonaId | string, limit = 8): RecallItem[] {
  const filtered = personaId
    ? STATE.recall.filter((r) => r.persona === personaId)
    : STATE.recall;
  return filtered.slice(0, limit);
}

/* ───────── PERSONA NOTES ───────── */

export function writeNote(personaId: string, text: string): PersonaNote {
  const note: PersonaNote = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    ts: Date.now(),
  };
  const arr = STATE.notes[personaId] ?? [];
  arr.unshift(note);
  if (arr.length > MAX_NOTES_PER_PERSONA) arr.length = MAX_NOTES_PER_PERSONA;
  STATE.notes[personaId] = arr;
  persist();
  return note;
}

export function readNotes(personaId: string, limit = 10): PersonaNote[] {
  return (STATE.notes[personaId] ?? []).slice(0, limit);
}

export function deleteNote(personaId: string, noteId: string): boolean {
  const arr = STATE.notes[personaId];
  if (!arr) return false;
  const next = arr.filter((n) => n.id !== noteId);
  if (next.length === arr.length) return false;
  STATE.notes[personaId] = next;
  persist();
  return true;
}

/* ───────── Prompt builder ─────────
   Called by the agent loop to build the "memory block" that gets
   prepended to the persona prompt. Kept short on purpose — raw facts
   bloat the context window fast. */
export function buildMemoryBlock(personaId: PersonaId | string): string {
  const facts = STATE.facts.slice(0, 12).map((f) => `- ${f.text}`).join("\n");
  const notes = readNotes(personaId, 5)
    .map((n) => `- ${n.text}`)
    .join("\n");
  const recall = recentRecall(personaId, 3)
    .map((r) => `- [${new Date(r.ts).toISOString().slice(0, 10)}] ${r.title}: ${r.summary}`)
    .join("\n");

  const blocks: string[] = [];
  if (facts) blocks.push(`BRAND FACTS (always honor):\n${facts}`);
  if (notes) blocks.push(`PERSONA NOTES (from your past runs):\n${notes}`);
  if (recall) blocks.push(`RECENT WORK:\n${recall}`);
  return blocks.join("\n\n");
}
