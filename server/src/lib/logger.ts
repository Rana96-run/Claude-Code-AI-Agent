import type { Request, Response, NextFunction } from "express";

/* Tiny pino-compatible logger shim so route files written against
   pino-http keep working without pulling the full pino stack.
   Each log call prints a one-line JSON with level + context. */

type Level = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface Logger {
  trace: (obj?: unknown, msg?: string) => void;
  debug: (obj?: unknown, msg?: string) => void;
  info:  (obj?: unknown, msg?: string) => void;
  warn:  (obj?: unknown, msg?: string) => void;
  error: (obj?: unknown, msg?: string) => void;
  fatal: (obj?: unknown, msg?: string) => void;
}

function write(level: Level, obj: unknown, msg?: string) {
  const ts = new Date().toISOString();
  const base: Record<string, unknown> =
    obj === undefined
      ? {}
      : typeof obj === "string"
        ? { msg: obj }
        : { ...(obj as object) };
  if (msg) base.msg = msg;
  base.level = level;
  base.time = ts;
  // eslint-disable-next-line no-console
  const stream = level === "error" || level === "fatal" ? console.error : console.log;
  stream(JSON.stringify(base));
}

function bindCtx(ctx: Record<string, unknown>): Logger {
  const merge = (obj: unknown): unknown => {
    if (obj === undefined) return { ...ctx };
    if (typeof obj === "string") return { ...ctx, msg: obj };
    return { ...ctx, ...(obj as object) };
  };
  return {
    trace: (o, m) => write("trace", merge(o), m),
    debug: (o, m) => write("debug", merge(o), m),
    info:  (o, m) => write("info",  merge(o), m),
    warn:  (o, m) => write("warn",  merge(o), m),
    error: (o, m) => write("error", merge(o), m),
    fatal: (o, m) => write("fatal", merge(o), m),
  };
}

export const logger: Logger = {
  trace: (o, m) => write("trace", o, m),
  debug: (o, m) => write("debug", o, m),
  info:  (o, m) => write("info",  o, m),
  warn:  (o, m) => write("warn",  o, m),
  error: (o, m) => write("error", o, m),
  fatal: (o, m) => write("fatal", o, m),
};

/* Task-scoped child logger: every line carries task_id + persona so
   you can grep a single run out of the pile (`grep task_id=abc123`). */
export function taskLogger(ctx: { task_id: string; persona?: string; source?: string }): Logger {
  return bindCtx({ task_id: ctx.task_id, persona: ctx.persona, source: ctx.source });
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  (req as Request & { log: Logger }).log = logger;
  next();
}

declare module "express-serve-static-core" {
  interface Request {
    log: Logger;
  }
}
