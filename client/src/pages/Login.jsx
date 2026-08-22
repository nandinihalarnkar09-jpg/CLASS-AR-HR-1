import { useEffect, useState } from "react";
import { api, setSession } from "../api";

export default function Login({ onLoggedIn }) {
  const [portal, setPortal] = useState("staff");
  const [email, setEmail] = useState("arjun.mehta@meridian.tech");
  const [password, setPassword] = useState("Meridian@2026");
  const [error, setError] = useState("");
  const [hints, setHints] = useState(null);

  useEffect(() => {
    api.demoAccounts().then(setHints).catch(() => setHints(null));
  }, []);

  useEffect(() => {
    if (portal === "staff") {
      setEmail("arjun.mehta@meridian.tech");
      setPassword("Meridian@2026");
    } else {
      setEmail("aditya.menon@example.com");
      setPassword("Welcome@123");
    }
    setError("");
  }, [portal]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const session = await api.login({ portal, email, password });
      setSession(session);
      onLoggedIn(session);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-hero">
        <div className="logo-mark">M</div>
        <h1>Meridian ATS</h1>
        <p>Talent acquisition for client-delivery hiring. Recruiters run the pipeline. Candidates check status and apply.</p>
        <p className="meta" style={{ color: "#cbbfae" }}>DPDP: personal data is processed only for recruitment at Meridian Technologies Pvt. Ltd.</p>
      </div>
      <div className="login-panel">
        <p className="eyebrow">Sign in</p>
        <h2 style={{ marginTop: 0 }}>Choose your portal</h2>
        <div className="portal-toggle">
          <button type="button" className={portal === "staff" ? "on" : ""} onClick={() => setPortal("staff")}>
            Recruiter
          </button>
          <button type="button" className={portal === "candidate" ? "on" : ""} onClick={() => setPortal("candidate")}>
            Candidate
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="field">Work or personal email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label className="field" style={{ marginTop: 12 }}>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          {error && <div className="alert danger">{error}</div>}
          <button className="btn" type="submit" style={{ marginTop: 16, width: "100%" }}>
            {portal === "staff" ? "Enter recruiting workspace" : "View my applications"}
          </button>
        </form>
        {hints && (
          <div className="login-hints">
            <strong>Demo logins</strong>
            {portal === "staff" ? (
              <ul>
                {hints.staff.slice(0, 4).map((u) => (
                  <li key={u.email}>
                    <button type="button" className="btn ghost small" onClick={() => { setEmail(u.email); setPassword(hints.staffPassword); }}>
                      {u.name}
                    </button>
                    <span className="meta"> {u.role.replace("_", " ")} · {hints.staffPassword}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {hints.candidates.slice(0, 4).map((c) => (
                  <li key={c.email}>
                    <button type="button" className="btn ghost small" onClick={() => { setEmail(c.email); setPassword(hints.candidatePassword); }}>
                      {c.name}
                    </button>
                    <span className="meta"> {hints.candidatePassword}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
