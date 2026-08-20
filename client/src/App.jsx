import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, getUserId, setUserId, isDemoMode } from "./api";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import Candidates from "./pages/Candidates.jsx";
import CandidateDetail from "./pages/CandidateDetail.jsx";
import Audit from "./pages/Audit.jsx";

export default function App() {
  const [meta, setMeta] = useState(null);
  const [bootError, setBootError] = useState("");
  const [userId, setUid] = useState(getUserId());

  useEffect(() => {
    api
      .meta()
      .then(setMeta)
      .catch((e) => setBootError(e.message || "Could not start"));
  }, [userId]);

  function switchUser(id) {
    setUserId(id);
    setUid(Number(id));
    window.location.reload();
  }

  if (bootError) {
    return (
      <div className="main">
        <h1>Meridian ATS did not start</h1>
        <p>{bootError}</p>
        <p>On your computer run these in a terminal from the project folder, then open <strong>http://localhost:5173</strong>:</p>
        <pre>npm run install:all{"\n"}npm run dev</pre>
        <p>Keep that terminal open. GitHub is only the source code — it is not the live website.</p>
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
          <select value={userId} onChange={(e) => switchUser(e.target.value)}>
            {meta.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role.replace("_", " ")}
              </option>
            ))}
          </select>
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
