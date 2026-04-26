import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════════════
   AgentPanel — لوحة سمعه، المساعد التسويقي الذكي لفريق قيود
   • تشغيل مهام المحتوى مباشرةً أو عبر الأتمتة
   • متابعة الخطوات والمخرجات في الوقت الفعلي
   • تاريخ آخر 50 مهمة
   • تحريك النافذة بالسحب (Drag)، RTL بالكامل
   ══════════════════════════════════════════════════════════════════ */

type TaskStep = {
  ts: number;
  kind: "think" | "tool_use" | "tool_result" | "error" | "finish";
  tool?: string;
  message?: string;
  input?: unknown;
  output?: unknown;
};
type Task = {
  id: string;
  created_at: number;
  updated_at: number;
  status: "queued" | "thinking" | "running" | "done" | "error";
  trigger: { source: string; actor?: string; title?: string; body?: string };
  steps: TaskStep[];
  outputs: Record<string, unknown>;
  summary?: string;
  error?: string;
};
type TaskSummary = {
  id: string;
  status: Task["status"];
  source: string;
  actor?: string;
  title?: string;
  summary?: string;
  created_at: number;
  steps: number;
};

const QUICK_ACTIONS: { label: string; title: string; body: string }[] = [
  {
    label: "تحليل لاندنج",
    title: "تحليل صفحة هبوط",
    body: "حلّل الصفحة https://qoyod.com — ركّز على الوضوح، CTA، عناصر الثقة، ومدى ملاءمتها للسوق السعودي. اقترح 5 تحسينات فورية.",
  },
  {
    label: "بريف → خطة",
    title: "تحويل بريف لخطة",
    body: "عندي فكرة حملة: إطلاق وحدة الفاتورة الإلكترونية لمطاعم QFlavours. حوّل هذا البريف إلى خطة تسويقية كاملة (جمهور، قنوات، رسائل، KPIs).",
  },
  {
    label: "فيديو 30ث",
    title: "سكربت فيديو قصير",
    body: "اكتب سكربت فيديو 30 ثانية لـ TikTok عن QoyodPOS للتجار بالتجزئة، هوك قوي في أول 1.5 ثانية، CTA: ابدأ مجاناً.",
  },
  {
    label: "A/B Test",
    title: "خطة A/B Test",
    body: "صمّم A/B test لصفحة الهبوط الرئيسية لـ Qoyod — الفرضية: تغيير الـ Hero Headline من تقني إلى عاطفي يرفع معدل التحويل.",
  },
  {
    label: "إعلان + كانفا",
    title: "إعلان جاهز للنشر",
    body: "اعمل إعلان 1:1 عن Qoyod Main (ZATCA Phase 2)، نسخة سعودية، ثم ارفعه لـ Canva كتصميم جديد.",
  },
  {
    label: "إيميل سيكونس",
    title: "سلسلة إيميلات تغذية",
    body: "اكتب سلسلة 4 إيميلات لأصحاب المحلات الصغار الذين جرّبوا QoyodPOS ولم يكملوا التفعيل.",
  },
  {
    label: "كالندر محتوى",
    title: "خطة محتوى أسبوعين",
    body: "ابنِ كالندر محتوى لأسبوعين لـ Qoyod على Instagram وLinkedIn وX، قطاع: مطاعم.",
  },
  {
    label: "SEO meta",
    title: "وسوم SEO",
    body: "اكتب SEO meta (title + description + keywords + OG) لصفحة 'الفاتورة الإلكترونية للمطاعم' بالعربي.",
  },
];

const statusColor: Record<Task["status"], string> = {
  queued: "#6a96aa",
  thinking: "#f5a623",
  running: "#17a3a3",
  done: "#5dc87a",
  error: "#f07070",
};

type Persona = {
  id: string;
  label: string;
  label_en: string;
  tagline: string;
  tools: string[];
};

/* Default position: top-right corner */
const DEFAULT_POS = () => ({
  x: window.innerWidth - 440,
  y: 52,
});

export default function AgentPanel() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(DEFAULT_POS);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [list, setList] = useState<TaskSummary[]>([]);
  const [err, setErr] = useState<string>("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<string>("");

  const pollRef = useRef<number | null>(null);

  /* ── Drag logic ── */
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; originX: number; originY: number }>({
    active: false, startX: 0, startY: 0, originX: 0, originY: 0,
  });

  function onDragStart(e: React.MouseEvent<HTMLDivElement>) {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 440, dragRef.current.originX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.originY + dy));
      setPos({ x: newX, y: newY });
    }
    function onMouseUp() {
      dragRef.current.active = false;
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* ── Data fetching ── */
  async function refreshList() {
    try {
      const r = await fetch("/api/agent/tasks");
      if (!r.ok) return;
      const d = await r.json();
      setList(d.tasks ?? []);
    } catch { /* ignore */ }
  }

  async function refreshActive(id: string) {
    try {
      const r = await fetch(`/api/agent/tasks/${id}`);
      if (!r.ok) return;
      const d: Task = await r.json();
      setTask(d);
      if (d.status === "done" || d.status === "error") {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!open || personas.length) return;
    fetch("/api/agent/personas")
      .then((r) => (r.ok ? r.json() : { personas: [] }))
      .then((d) => setPersonas(d.personas ?? []))
      .catch(() => {});
  }, [open, personas.length]);

  useEffect(() => {
    if (!open) return;
    refreshList();
    const i = window.setInterval(refreshList, 4000);
    return () => window.clearInterval(i);
  }, [open]);

  useEffect(() => {
    if (!activeId) return;
    refreshActive(activeId);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => refreshActive(activeId), 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null; };
  }, [activeId]);

  async function runAgent() {
    if (!prompt.trim()) return;
    setSending(true);
    setErr("");
    try {
      const r = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          body: prompt.trim(),
          actor: "ui",
          persona: persona || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setActiveId(d.task_id);
      setPrompt("");
      setTitle("");
      refreshList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ── Floating launcher button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1000,
          padding: "7px 13px",
          borderRadius: 20,
          border: "1px solid rgba(23,163,163,0.45)",
          background: open ? "#0a1f3d" : "linear-gradient(135deg,#17a3a3,#13778d)",
          color: open ? "#17a3a3" : "#fff",
          fontSize: 11.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 14px rgba(2,21,68,0.4)",
        }}
        title="سمعه — مساعدك التسويقي"
      >
        {open ? "× إغلاق" : "🤖 سمعه"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: pos.y,
            left: pos.x,
            width: 420,
            maxWidth: "calc(100vw - 20px)",
            maxHeight: "calc(100vh - 70px)",
            background: "#071630",
            border: "1px solid rgba(1,53,90,0.6)",
            borderRadius: 12,
            zIndex: 999,
            direction: "rtl",
            fontFamily: "inherit",
            color: "#ddeef4",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* ── Header (drag handle) ── */}
          <div
            onMouseDown={onDragStart}
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(1,53,90,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "grab",
              userSelect: "none",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#17a3a3" }}>سمعه</span>
                <span style={{
                  fontSize: 9,
                  padding: "1px 6px",
                  borderRadius: 8,
                  background: "rgba(23,163,163,0.12)",
                  border: "1px solid rgba(23,163,163,0.3)",
                  color: "#6a96aa",
                  fontWeight: 600,
                }}>AI</span>
              </div>
              <div style={{ fontSize: 10, color: "#6a96aa", marginTop: 2 }}>
                مساعدك التسويقي الذكي · يعمل تلقائياً أو عند التكليف المباشر
              </div>
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setActiveId(null); setTask(null); }}
              style={{
                padding: "3px 8px",
                fontSize: 10,
                borderRadius: 5,
                background: "transparent",
                border: "1px solid rgba(1,53,90,0.6)",
                color: "#6a96aa",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              مهمة جديدة
            </button>
          </div>

          {/* ── Composer ── */}
          {!activeId && (
            <div style={{ padding: 14, borderBottom: "1px solid rgba(1,53,90,0.5)" }}>
              {/* Quick-action chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => { setTitle(qa.title); setPrompt(qa.body); }}
                    style={{
                      padding: "3px 8px",
                      fontSize: 10,
                      borderRadius: 12,
                      background: "rgba(23,163,163,0.08)",
                      border: "1px solid rgba(23,163,163,0.3)",
                      color: "#9fd3d4",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    title={qa.body}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              {/* Persona selector */}
              {personas.length > 0 && (
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  style={{ ...inputS, cursor: "pointer" }}
                  title="حدّد دور سمعه — أو اتركه فارغاً ليختار تلقائياً"
                >
                  <option value="">— اختر الدور أو اتركه تلقائياً —</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} · {p.tagline}
                    </option>
                  ))}
                </select>
              )}

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان المهمة (اختياري)"
                style={inputS}
              />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="اكتب تفاصيل المهمة هنا — مثال: اعمل إعلان 1:1 عن فاتورة ZATCA Phase 2 لفليفرز، نسخة لـ Instagram، وانشر صفحة هبوط على WordPress."
                rows={5}
                style={{ ...inputS, minHeight: 90, resize: "vertical" }}
              />
              {err && (
                <div
                  style={{
                    padding: "6px 10px",
                    background: "rgba(240,112,112,0.08)",
                    border: "1px solid rgba(240,112,112,0.3)",
                    borderRadius: 6,
                    color: "#f07070",
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  {err}
                </div>
              )}
              <button
                onClick={runAgent}
                disabled={sending || !prompt.trim()}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: sending
                    ? "rgba(23,163,163,0.3)"
                    : "linear-gradient(135deg,#17a3a3,#13778d)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: sending ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sending ? "جارٍ التشغيل..." : "شغّل سمعه"}
              </button>
            </div>
          )}

          {/* ── Task detail view ── */}
          {activeId && task && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4,
                    background: `${statusColor[task.status]}22`, color: statusColor[task.status],
                    border: `1px solid ${statusColor[task.status]}66`, fontWeight: 700,
                  }}
                >
                  {task.status}
                </span>
                <span style={{ fontSize: 10, color: "#6a96aa" }}>
                  {task.trigger.source}{task.trigger.actor ? ` · ${task.trigger.actor}` : ""}
                </span>
                <span style={{ fontSize: 10, color: "#2e5468", marginRight: "auto" }}>#{task.id}</span>
              </div>
              {task.trigger.title && (
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{task.trigger.title}</div>
              )}
              {task.trigger.body && (
                <div style={{
                  fontSize: 11, color: "#aac5d5", lineHeight: 1.6, marginBottom: 10,
                  padding: 8, background: "#02102a", borderRadius: 6, border: "1px solid rgba(1,53,90,0.4)",
                }}>
                  {task.trigger.body}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#2e5468", marginBottom: 6, fontWeight: 700 }}>خطوات التنفيذ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {task.steps.map((s, i) => <StepRow key={i} step={s} />)}
                {task.status !== "done" && task.status !== "error" && (
                  <div style={{ fontSize: 10, color: "#f5a623", padding: "4px 0" }}>
                    <Spinner /> سمعه تعمل على المهمة...
                  </div>
                )}
              </div>

              {Object.keys(task.outputs).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: "#2e5468", marginBottom: 6, fontWeight: 700 }}>المخرجات</div>
                  <OutputsBlock outputs={task.outputs} />
                </div>
              )}

              {task.summary && (
                <div style={{
                  marginTop: 10, padding: 10, background: "rgba(23,163,163,0.08)",
                  borderRadius: 7, border: "1px solid rgba(23,163,163,0.3)",
                  fontSize: 12, lineHeight: 1.7, color: "#ddeef4", whiteSpace: "pre-wrap",
                }}>
                  {task.summary}
                </div>
              )}

              {task.error && (
                <div style={{
                  marginTop: 10, padding: 8, background: "rgba(240,112,112,0.08)",
                  borderRadius: 7, border: "1px solid rgba(240,112,112,0.3)",
                  color: "#f07070", fontSize: 11,
                }}>
                  {task.error}
                </div>
              )}
            </div>
          )}

          {/* ── Recent tasks list ── */}
          {!activeId && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ padding: "8px 14px", fontSize: 10, color: "#2e5468", fontWeight: 700 }}>
                آخر المهام
              </div>
              {list.length === 0 && (
                <div style={{ padding: "14px 14px 20px", color: "#2e5468", fontSize: 11 }}>
                  لا توجد مهام بعد.
                </div>
              )}
              {list.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  style={{ padding: "8px 14px", borderTop: "1px solid rgba(1,53,90,0.4)", cursor: "pointer", background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#02102a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 9, padding: "1px 6px", borderRadius: 3,
                      background: `${statusColor[t.status]}22`, color: statusColor[t.status],
                      border: `1px solid ${statusColor[t.status]}55`, fontWeight: 700,
                    }}>{t.status}</span>
                    <span style={{ fontSize: 9, color: "#2e5468" }}>{t.source}</span>
                    <span style={{ fontSize: 9, color: "#2e5468", marginRight: "auto" }}>
                      {new Date(t.created_at).toLocaleTimeString("ar", { hour12: false })}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#ddeef4", lineHeight: 1.5 }}>
                    {t.title || t.summary?.slice(0, 80) || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  const bg = {
    think: "#02102a", tool_use: "rgba(245,166,35,0.07)",
    tool_result: "rgba(23,163,163,0.07)", error: "rgba(240,112,112,0.08)", finish: "rgba(93,200,122,0.07)",
  }[step.kind];
  const color = {
    think: "#aac5d5", tool_use: "#f5a623",
    tool_result: "#17a3a3", error: "#f07070", finish: "#5dc87a",
  }[step.kind];
  return (
    <div style={{ padding: "6px 8px", background: bg, borderRadius: 5, borderRight: `2px solid ${color}`, fontSize: 10.5, lineHeight: 1.6 }}>
      <div style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 2 }}>
        {step.kind}{step.tool ? ` · ${step.tool}` : ""}
      </div>
      {step.message && (
        <div style={{ color: "#ddeef4", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {step.message.length > 400 ? step.message.slice(0, 400) + "…" : step.message}
        </div>
      )}
      {step.input !== undefined && (
        <div style={{ color: "#6a96aa", fontSize: 9.5, marginTop: 2 }}>
          {truncate(JSON.stringify(step.input), 220)}
        </div>
      )}
      {step.output !== undefined && (
        <div style={{ color: "#6a96aa", fontSize: 9.5, marginTop: 2 }}>
          {truncate(JSON.stringify(step.output), 220)}
        </div>
      )}
    </div>
  );
}

function OutputsBlock({ outputs }: { outputs: Record<string, unknown> }) {
  const links: Array<{ label: string; url: string }> = [];
  const add = (label: string, url?: unknown) =>
    typeof url === "string" && url && links.push({ label, url });
  add("Canva", outputs.canva_edit_url);
  add("Canva (معاينة)", outputs.canva_view_url);
  add("WordPress", outputs.wordpress_edit_url);
  add("WordPress (معاينة)", outputs.wordpress_preview_url);
  add("HubSpot", outputs.hubspot_edit_url);
  add("HubSpot (معاينة)", outputs.hubspot_preview_url);
  add("Drive", outputs.drive_link);
  add("Nano Banana — صورة", outputs.nb_image_drive_link);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noreferrer"
          style={{
            fontSize: 11, color: "#17a3a3", textDecoration: "none",
            padding: "4px 8px", background: "rgba(23,163,163,0.08)",
            border: "1px solid rgba(23,163,163,0.25)", borderRadius: 5,
            direction: "ltr", textAlign: "left",
          }}
        >
          {l.label} ↗
        </a>
      ))}
      {Array.isArray(outputs.svgs) && (outputs.svgs as unknown[]).length > 0 && (
        <div style={{ fontSize: 10, color: "#6a96aa" }}>
          SVGs: {(outputs.svgs as unknown[]).length}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      border: "1.5px solid rgba(245,166,35,0.3)", borderTopColor: "#f5a623",
      animation: "qspin 0.7s linear infinite", verticalAlign: "-1px", marginLeft: 4,
    }} />
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  marginBottom: 7,
  borderRadius: 6,
  border: "1px solid rgba(1,53,90,0.6)",
  background: "#02102a",
  color: "#ddeef4",
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  direction: "rtl",
};
