import { useEffect, useState } from "react";

type Refs = { figma?: { app?: string | null; web?: string | null } };

/* Tiny floating chip (top-right, under the agent button) that exposes
   the two Figma design references the server advertises via /api/refs.
   Stays invisible if neither URL is configured. */
export default function FigmaRefsChip() {
  const [refs, setRefs] = useState<Refs | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/refs")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive) setRefs(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const app = refs?.figma?.app || null;
  const web = refs?.figma?.web || null;
  if (!app && !web) return null;

  const linkStyle: React.CSSProperties = {
    color: "#9fd3d4",
    textDecoration: "none",
    fontSize: 10.5,
    padding: "2px 7px",
    borderRadius: 5,
    border: "1px solid rgba(23,163,164,.35)",
    background: "rgba(7,22,48,0.75)",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 180,
        zIndex: 1000,
        display: "flex",
        gap: 6,
        fontFamily: "inherit",
        direction: "ltr",
      }}
    >
      <span style={{ color: "#6a96aa", fontSize: 10.5, alignSelf: "center" }}>
        Figma:
      </span>
      {app && (
        <a href={app} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          App
        </a>
      )}
      {web && (
        <a href={web} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Web
        </a>
      )}
    </div>
  );
}
