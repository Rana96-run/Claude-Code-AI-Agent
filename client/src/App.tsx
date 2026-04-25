import { useState, useEffect } from "react";
import Login from "./pages/Login";
import AgentPanel from "./components/AgentPanel";
import FigmaRefsChip from "./components/FigmaRefsChip";

function CreativeOSLoader() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("./pages/CreativeOS.jsx").then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#021544,#01355a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#17a3a3",
          fontFamily: "sans-serif",
          fontSize: 16,
        }}
      >
        جارٍ التحميل...
      </div>
    );
  }

  return <Component />;
}

export default function App() {
  const [authed, setAuthed] = useState<boolean>(
    () => typeof sessionStorage !== "undefined" && sessionStorage.getItem("qoyod_auth") === "1",
  );

  const handleLogout = () => {
    sessionStorage.removeItem("qoyod_auth");
    setAuthed(false);
  };

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <>
      <CreativeOSLoader />
      <AgentPanel />
      <FigmaRefsChip />
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 1000,
          padding: "4px 10px",
          borderRadius: 5,
          border: "1px solid rgba(1,53,90,.6)",
          background: "rgba(7,22,48,0.8)",
          color: "#6a96aa",
          fontSize: 10.5,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        خروج
      </button>
    </>
  );
}
