import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, getSession, clearSession, isDemoMode } from "./api";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import Candidates from "./pages/Candidates.jsx";
import CandidateDetail from "./pages/CandidateDetail.jsx";
import Audit from "./pages/Audit.jsx";
import Login from "./pages/Login.jsx";
import CandidatePortal from "./pages/CandidatePortal.jsx";

export default function App() {
  const [session, setSessionState] = useState(getSession());
  const [meta, setMeta] = useState(null);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    if (!session || session.type !== "staff") {
      setMeta(null);
      return;
    }
    api
      .meta()
      .then(setMeta)
      .catch((e) => setBootError(e.message || "Could not start"));
  }, [session]);

  function logout() {
    clearSession();
    setSessionState(null);
    setMeta(null);
  }

  if (!session) {
    return <Login onLoggedIn={(s) => setSessionState(s)} />;
  }

  if (session.type === "candidate") {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-mark">M</div>
            <div className="brand-type">Meridian ATS</div>
            <small>Candidate portal</small>
          </div>
          <nav className="nav">
            <span className="nav a" style={{ display: "block", padding: "10px 12px" }}>My status</span>
          </nav>
          <button className="btn secondary" onClick={logout} style={{ marginTop: "auto" }}>Log out</button>
        </aside>
        <main className="main">
          <CandidatePortal session={session} onLogout={logout} />
        </main>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="main">
        <h1>Meridian ATS did not start</h1>
        <p>{bootError}</p>
        <button className="btn" onClick={logout}>Back to login</button>
      </div>
    );
  }
  if (!meta) return <div className="main">Loading Meridian ATS…</div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">M</div>
          <div className="brand-type">Meridian ATS</div>
          <small>Talent · DPDP v1{isDemoMode() ? " · browser demo" : ""}</small>
        </div>
        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/jobs">Requisitions</NavLink>
          <NavLink to="/pipeline">Pipeline</NavLink>
          <NavLink to="/candidates">Candidates</NavLink>
          {meta.user.role === "ta_head" && <NavLink to="/audit">Audit log</NavLink>}
        </nav>
        <div className="user-switch">
          <label>Signed in as</label>
          <div style={{ marginTop: 8, color: "#eadfce" }}>{meta.user.name}</div>
          <div className="meta" style={{ color: "#cbbfae" }}>{meta.user.role.replace("_", " ")}</div>
          <button className="btn secondary" style={{ marginTop: 12, width: "100%" }} onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard meta={meta} />} />
          <Route path="/jobs" element={<Jobs meta={meta} />} />
          <Route path="/pipeline" element={<Pipeline meta={meta} />} />
          <Route path="/candidates" element={<Candidates meta={meta} />} />
          <Route path="/candidates/:id" element={<CandidateDetail meta={meta} />} />
          <Route path="/audit" element={<Audit />} />
        </Routes>
      </main>
    </div>
  );
}

export function PageHead({ eyebrow, title, actions }) {
  return (
    <div className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {actions}
        <span className="dpdp-chip">Personal data · purpose-limited to hiring · 3-year retention</span>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="topbar">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn secondary small" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
