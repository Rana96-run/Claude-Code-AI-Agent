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

/* ── Structured content-gen form config ── */
const CHANNELS = ["Instagram", "LinkedIn", "TikTok", "Twitter/X", "Snapchat", "Email"] as const;
const PRODUCTS = [
  "Qoyod Main",
  "QFlavours",
  "QoyodPOS",
  "QBookkeeping",
  "E-Invoice (ZATCA Ph2)",
  "API Integration",
] as const;
const FORMATS: Record<string, string> = {
  post: "كابشن / منشور",
  reel: "سكربت ريلز",
  story: "ستوري",
  ad: "إعلان مدفوع",
  email: "إيميل",
  blog: "مقال",
};
const AD_SIZES = ["1:1", "4:5", "9:16", "16:9"] as const;

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

/* ── Lightweight markdown → JSX renderer ─────────────────────────────────
   Handles: **bold**, # headings, - bullet lists, --- dividers, newlines   */
function renderMd(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let key = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Divider
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid rgba(1,53,90,.4)", margin: "10px 0" }} />);
      i++; continue;
    }
    // H1
    if (line.startsWith("# ")) {
      nodes.push(<p key={key++} style={{ fontWeight: 700, color: "#17a3a3", margin: "10px 0 4px", fontSize: "1.15em" }}>{inlineMd(line.slice(2))}</p>);
      i++; continue;
    }
    // H2
    if (line.startsWith("## ")) {
      nodes.push(<p key={key++} style={{ fontWeight: 700, color: "#ddeef4", margin: "8px 0 3px", fontSize: "1.05em" }}>{inlineMd(line.slice(3))}</p>);
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      nodes.push(<p key={key++} style={{ fontWeight: 700, color: "#8aafc4", margin: "6px 0 2px" }}>{inlineMd(line.slice(4))}</p>);
      i++; continue;
    }
    // Bullet list — collect consecutive items
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} style={{ margin: "4px 0 4px 0", paddingRight: 18, listStyle: "none" }}>
          {items.map((it, j) => (
            <li key={j} style={{ lineHeight: 1.75, marginBottom: 3, display: "flex", gap: 6 }}>
              <span style={{ color: "#17a3a3", flexShrink: 0 }}>·</span>
              <span>{inlineMd(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} style={{ margin: "4px 0 4px 0", paddingRight: 18, listStyle: "none", counterReset: "li" }}>
          {items.map((it, j) => (
            <li key={j} style={{ lineHeight: 1.75, marginBottom: 3, display: "flex", gap: 6 }}>
              <span style={{ color: "#17a3a3", flexShrink: 0, minWidth: 16 }}>{j + 1}.</span>
              <span>{inlineMd(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Empty line → spacer
    if (line.trim() === "") {
      nodes.push(<div key={key++} style={{ height: 5 }} />);
      i++; continue;
    }
    // Normal paragraph
    nodes.push(<p key={key++} style={{ lineHeight: 1.75, margin: "2px 0" }}>{inlineMd(line)}</p>);
    i++;
  }
  return nodes;
}

/* Inline markdown: **bold**, *italic*, `code` */
function inlineMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i} style={{ color: "#17a3a3", fontStyle: "normal" }}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ background: "rgba(23,163,164,.15)", color: "#17a3a3", borderRadius: 3, padding: "0 4px", fontSize: 11 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

/* Split long summary into pages by --- dividers or every ~600 chars */
function paginateSummary(text: string, pageSize = 600): string[] {
  // First try splitting by --- section dividers
  const sections = text.split(/\n---+\n/);
  if (sections.length > 2) {
    // Group sections into pages of ~2 sections each
    const pages: string[] = [];
    for (let i = 0; i < sections.length; i += 2) {
      pages.push(sections.slice(i, i + 2).join("\n---\n"));
    }
    return pages;
  }
  // Fallback: split by paragraph breaks every ~600 chars
  if (text.length <= pageSize) return [text];
  const pages: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + pageSize;
    if (end < text.length) {
      // Find nearest paragraph break
      const breakAt = text.lastIndexOf("\n\n", end);
      if (breakAt > start + 200) end = breakAt;
    }
    pages.push(text.slice(start, Math.min(end, text.length)));
    start = end;
  }
  return pages;
}

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
  const [composerTab, setComposerTab] = useState<"quick" | "free">("quick");
  const [summaryPage, setSummaryPage] = useState(0);
  /* Quick-form state */
  const [qfProduct, setQfProduct] = useState<string>(PRODUCTS[0]);
  const [qfChannel, setQfChannel] = useState<string>(CHANNELS[0]);
  const [qfFormat, setQfFormat] = useState<string>("post");
  const [qfSize, setQfSize] = useState<string>("1:1");
  const [qfScheme, setQfScheme] = useState<string>("auto");
  const [qfBrief, setQfBrief] = useState<string>("");

  const pollRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* ── Panel size (resizable) ── */
  const [panelSize, setPanelSize] = useState({ w: 420, h: Math.min(600, window.innerHeight - 100) });
  const resizeRef = useRef<{ active: boolean; startX: number; startY: number; startW: number; startH: number }>({
    active: false, startX: 0, startY: 0, startW: 0, startH: 0,
  });

  function onResizeStart(e: React.MouseEvent) {
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, startW: panelSize.w, startH: panelSize.h };
    e.preventDefault();
    e.stopPropagation();
  }

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
      if (resizeRef.current.active) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        setPanelSize({
          w: Math.max(320, Math.min(window.innerWidth - 40, resizeRef.current.startW + dx)),
          h: Math.max(300, Math.min(window.innerHeight - 80, resizeRef.current.startH + dy)),
        });
        return;
      }
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(window.innerWidth - panelSize.w, dragRef.current.originX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.originY + dy));
      setPos({ x: newX, y: newY });
    }
    function onMouseUp() {
      dragRef.current.active = false;
      resizeRef.current.active = false;
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [panelSize.w]);

  /* ── Scroll to top when switching tasks ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeId]);

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
      setSummaryPage(0);
      setPrompt("");
      setTitle("");
      refreshList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function runQuickForm() {
    const isDesign = qfFormat === "ad";
    const schemeNote = isDesign && qfScheme !== "auto" ? ` استخدم color_scheme="${qfScheme}".` : isDesign ? " استخدم color_scheme=auto." : "";
    const body = isDesign
      ? `اعمل تصميم إعلان ${qfSize} لمنتج ${qfProduct} على ${qfChannel}.${qfBrief ? ` ملاحظات: ${qfBrief}.` : ""} أنتج حجم ${qfSize} فقط.${schemeNote}`
      : `اكتب ${FORMATS[qfFormat] ?? qfFormat} لمنتج ${qfProduct} على ${qfChannel} فقط — لا تكتب لقنوات أخرى.${qfBrief ? ` تفاصيل: ${qfBrief}.` : ""}`;
    const t = isDesign
      ? `تصميم إعلان ${qfSize} — ${qfProduct} على ${qfChannel}`
      : `${FORMATS[qfFormat]} — ${qfProduct} على ${qfChannel}`;
    setSending(true);
    setErr("");
    try {
      const r = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body, actor: "ui", persona: persona || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setActiveId(d.task_id);
      setQfBrief("");
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
          bottom: 18,
          right: 18,
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
        title="Soma'a Agent — Your Content Maestro"
      >
        {open ? "× Close" : "✦ Soma'a Agent · Your Content Maestro"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: pos.y,
            left: pos.x,
            width: panelSize.w,
            height: panelSize.h,
            maxWidth: "calc(100vw - 20px)",
            maxHeight: "calc(100vh - 20px)",
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
                يشتغل بنفسه أو بأمر منك — تسويق ذكي 24/7
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

              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {(["quick", "free"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setComposerTab(tab)}
                    style={{
                      flex: 1, padding: "5px 0", fontSize: 11, borderRadius: 6, cursor: "pointer",
                      fontFamily: "inherit", fontWeight: composerTab === tab ? 700 : 400,
                      background: composerTab === tab ? "rgba(23,163,163,0.18)" : "transparent",
                      border: `1px solid ${composerTab === tab ? "rgba(23,163,163,0.5)" : "rgba(1,53,90,0.5)"}`,
                      color: composerTab === tab ? "#17a3a3" : "#6a96aa",
                    }}
                  >
                    {tab === "quick" ? "🚀 منشئ سريع" : "✏️ أمر حر"}
                  </button>
                ))}
              </div>

              {/* ── Quick Form ── */}
              {composerTab === "quick" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <select value={qfProduct} onChange={(e) => setQfProduct(e.target.value)} style={{ ...inputS, marginBottom: 0 }}>
                      {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={qfChannel} onChange={(e) => setQfChannel(e.target.value)} style={{ ...inputS, marginBottom: 0 }}>
                      {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {Object.entries(FORMATS).map(([k, v]) => (
                      <button key={k} onClick={() => setQfFormat(k)} style={{
                        padding: "3px 9px", fontSize: 10.5, borderRadius: 12, cursor: "pointer",
                        fontFamily: "inherit", fontWeight: qfFormat === k ? 700 : 400,
                        background: qfFormat === k ? "rgba(23,163,163,0.2)" : "rgba(23,163,163,0.05)",
                        border: `1px solid ${qfFormat === k ? "rgba(23,163,163,0.6)" : "rgba(23,163,163,0.2)"}`,
                        color: qfFormat === k ? "#17a3a3" : "#9fd3d4",
                      }}>{v}</button>
                    ))}
                  </div>

                  {qfFormat === "ad" && (
                    <>
                      {/* Size picker */}
                      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                        {AD_SIZES.map((s) => (
                          <button key={s} onClick={() => setQfSize(s)} style={{
                            flex: 1, padding: "4px 0", fontSize: 11, borderRadius: 6, cursor: "pointer",
                            fontFamily: "inherit", fontWeight: qfSize === s ? 700 : 400,
                            background: qfSize === s ? "rgba(245,166,35,0.18)" : "transparent",
                            border: `1px solid ${qfSize === s ? "rgba(245,166,35,0.5)" : "rgba(1,53,90,0.5)"}`,
                            color: qfSize === s ? "#f5a623" : "#6a96aa",
                          }}>{s}</button>
                        ))}
                      </div>
                      {/* Color scheme picker */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9.5, color: "#2e5468", marginBottom: 4, fontWeight: 700 }}>اللون</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {[
                            { id: "auto",     label: "تلقائي", bg: "linear-gradient(135deg,#021544,#17A3A4,#01355A,#F4FBFB)", border: "#17A3A4" },
                            { id: "navy",     label: "نيفي",   bg: "#021544",  border: "#17A3A4" },
                            { id: "teal",     label: "تيل",    bg: "#17A3A4",  border: "#021544" },
                            { id: "ocean",    label: "أوشن",   bg: "#01355A",  border: "#17A3A4" },
                            { id: "light",    label: "فاتح",   bg: "#F4FBFB",  border: "#17A3A4" },
                            { id: "midnight", label: "ليلي",   bg: "#050E24",  border: "#17A3A4" },
                            { id: "slate",    label: "سليت",   bg: "#1A2B4A",  border: "#17A3A4" },
                          ].map((sc) => (
                            <button key={sc.id} onClick={() => setQfScheme(sc.id)} title={sc.label} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "3px 7px", borderRadius: 8, cursor: "pointer",
                              border: `2px solid ${qfScheme === sc.id ? sc.border : "rgba(1,53,90,0.4)"}`,
                              background: "transparent", fontFamily: "inherit",
                              outline: qfScheme === sc.id ? `1px solid ${sc.border}` : "none",
                            }}>
                              <span style={{
                                display: "inline-block", width: 14, height: 14, borderRadius: 3,
                                background: sc.bg, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0,
                              }} />
                              <span style={{ fontSize: 9.5, color: qfScheme === sc.id ? "#ddeef4" : "#6a96aa", fontWeight: qfScheme === sc.id ? 700 : 400 }}>
                                {sc.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <input
                    value={qfBrief}
                    onChange={(e) => setQfBrief(e.target.value)}
                    placeholder="ملاحظات إضافية (اختياري) — مثال: ركّز على ZATCA Phase 2"
                    style={inputS}
                  />

                  {/* Quick-action chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {QUICK_ACTIONS.map((qa) => (
                      <button key={qa.label} onClick={() => { setComposerTab("free"); setTitle(qa.title); setPrompt(qa.body); }}
                        style={{ padding: "2px 7px", fontSize: 9.5, borderRadius: 10, background: "rgba(23,163,163,0.06)", border: "1px solid rgba(23,163,163,0.2)", color: "#6a96aa", cursor: "pointer", fontFamily: "inherit" }}
                        title={qa.body}>{qa.label}</button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Free-text form ── */}
              {composerTab === "free" && (
                <>
                  {personas.length > 0 && (
                    <select value={persona} onChange={(e) => setPersona(e.target.value)} style={{ ...inputS, cursor: "pointer" }}>
                      <option value="">— خلّها تختار أو حدّد دور —</option>
                      {personas.map((p) => <option key={p.id} value={p.id}>{p.label} · {p.tagline}</option>)}
                    </select>
                  )}
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة (اختياري)" style={inputS} />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="اكتب تفاصيل المهمة — مثال: اعمل إعلان 1:1 عن ZATCA Ph2 لـ Instagram فقط."
                    rows={5}
                    style={{ ...inputS, minHeight: 90, resize: "vertical" }}
                  />
                </>
              )}

              {err && (
                <div style={{ padding: "6px 10px", background: "rgba(240,112,112,0.08)", border: "1px solid rgba(240,112,112,0.3)", borderRadius: 6, color: "#f07070", fontSize: 11, marginBottom: 8 }}>
                  {err}
                </div>
              )}

              <button
                onClick={composerTab === "quick" ? runQuickForm : runAgent}
                disabled={sending || (composerTab === "free" && !prompt.trim())}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: 7, border: "none",
                  background: sending ? "rgba(23,163,163,0.3)" : "linear-gradient(135deg,#17a3a3,#13778d)",
                  color: "#fff", fontWeight: 700, fontSize: 12,
                  cursor: sending ? "default" : "pointer", fontFamily: "inherit",
                }}
              >
                {sending ? "جارٍ التشغيل..." : "شغّل سمعه ▶"}
              </button>
            </div>
          )}

          {/* ── Task detail view ── */}
          {activeId && task && (
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: `${statusColor[task.status]}22`, color: statusColor[task.status],
                    border: `1px solid ${statusColor[task.status]}66`, fontWeight: 700,
                  }}
                >
                  {task.status}
                </span>
                <span style={{ fontSize: 11, color: "#6a96aa" }}>
                  {task.trigger.source}{task.trigger.actor ? ` · ${task.trigger.actor}` : ""}
                </span>
                <span style={{ fontSize: 11, color: "#2e5468", marginRight: "auto" }}>#{task.id}</span>
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

              {task.status !== "done" && task.status !== "error" && (
                <div style={{ fontSize: 13, color: "#f5a623", padding: "6px 0 10px" }}>
                  <Spinner /> سمعه يعمل على المهمة...
                </div>
              )}

              {Object.keys(task.outputs).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#2e5468", marginBottom: 6, fontWeight: 700 }}>المخرجات</div>
                  <OutputsBlock outputs={task.outputs} />
                </div>
              )}

              {task.summary && (()=>{
                const pages = paginateSummary(task.summary);
                const pg = Math.min(summaryPage, pages.length - 1);
                const pageText = pages[pg] || "";
                return (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      padding: "12px 14px", background: "rgba(23,163,163,0.07)",
                      borderRadius: 7, border: "1px solid rgba(23,163,163,0.25)",
                      direction: "rtl", textAlign: "right",
                      fontSize: 14, color: "#ddeef4", lineHeight: 1.8,
                    }}>
                      {renderMd(pageText)}
                    </div>
                    {pages.length > 1 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "4px 2px" }}>
                        <button
                          onClick={() => setSummaryPage(p => Math.max(0, p - 1))}
                          disabled={pg === 0}
                          style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid rgba(23,163,164,.3)", background: pg===0?"rgba(1,53,90,.2)":"rgba(23,163,164,.1)", color: pg===0?"#2e5468":"#17a3a3", fontSize: 11, cursor: pg===0?"default":"pointer", fontFamily: "inherit" }}
                        >→ السابق</button>
                        <span style={{ fontSize: 11, color: "#6a96aa" }}>{pg + 1} / {pages.length}</span>
                        <button
                          onClick={() => setSummaryPage(p => Math.min(pages.length - 1, p + 1))}
                          disabled={pg === pages.length - 1}
                          style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid rgba(23,163,164,.3)", background: pg===pages.length-1?"rgba(1,53,90,.2)":"rgba(23,163,164,.1)", color: pg===pages.length-1?"#2e5468":"#17a3a3", fontSize: 11, cursor: pg===pages.length-1?"default":"pointer", fontFamily: "inherit" }}
                        >التالي ←</button>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                      fontSize: 10, padding: "1px 6px", borderRadius: 3,
                      background: `${statusColor[t.status]}22`, color: statusColor[t.status],
                      border: `1px solid ${statusColor[t.status]}55`, fontWeight: 700,
                    }}>{t.status}</span>
                    <span style={{ fontSize: 10, color: "#2e5468" }}>{t.source}</span>
                    <span style={{ fontSize: 10, color: "#2e5468", marginRight: "auto" }}>
                      {new Date(t.created_at).toLocaleTimeString("ar", { hour12: false })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#ddeef4", lineHeight: 1.5 }}>
                    {t.title || t.summary?.slice(0, 80) || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Resize handle (bottom-right corner) ── */}
          <div
            onMouseDown={onResizeStart}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 18,
              height: 18,
              cursor: "sw-resize",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              padding: "0 0 3px 3px",
              opacity: 0.4,
            }}
            title="اسحب لتغيير الحجم"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 9L9 1M5 9L9 5" stroke="#17a3a3" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
    </>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  const [expanded, setExpanded] = useState(false);
  const bg = {
    think: "#02102a", tool_use: "rgba(245,166,35,0.07)",
    tool_result: "rgba(23,163,163,0.07)", error: "rgba(240,112,112,0.08)", finish: "rgba(93,200,122,0.07)",
  }[step.kind];
  const color = {
    think: "#aac5d5", tool_use: "#f5a623",
    tool_result: "#17a3a3", error: "#f07070", finish: "#5dc87a",
  }[step.kind];

  /* think + finish: render markdown with expand/collapse */
  const isNarrative = step.kind === "think" || step.kind === "finish";
  const COLLAPSE_LIMIT = 300;
  const msgText = step.message ?? "";
  const isLong = isNarrative && msgText.length > COLLAPSE_LIMIT;
  const visibleText = isNarrative
    ? (isLong && !expanded ? msgText.slice(0, COLLAPSE_LIMIT) : msgText)
    : msgText;

  return (
    <div style={{ padding: "7px 10px", background: bg, borderRadius: 5, borderRight: `2px solid ${color}`, fontSize: 12, lineHeight: 1.65 }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 3 }}>
        {step.kind}{step.tool ? ` · ${step.tool}` : ""}
      </div>
      {step.message && (
        isNarrative ? (
          <div style={{ direction: "rtl", textAlign: "right" }}>
            {renderMd(visibleText)}
            {isLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{ fontSize: 11, color: "#17a3a3", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0", marginTop: 2 }}
              >
                {expanded ? "▲ طيّ" : "▼ عرض المزيد"}
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: "#ddeef4", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {msgText.length > 400 ? msgText.slice(0, 400) + "…" : msgText}
          </div>
        )
      )}
      {step.input !== undefined && (
        <div style={{ color: "#6a96aa", fontSize: 11, marginTop: 2 }}>
          {truncate(JSON.stringify(step.input), 220)}
        </div>
      )}
      {step.output !== undefined && (
        <div style={{ color: "#6a96aa", fontSize: 11, marginTop: 2 }}>
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
