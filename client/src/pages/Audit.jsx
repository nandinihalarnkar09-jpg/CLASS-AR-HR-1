import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageHead } from "../App.jsx";

export default function Audit() {
  const [rows, setRows] = useState(null);
  const [due, setDue] = useState([]);
  const [error, setError] = useState("");
  function load() {
    api.audit().then(setRows).catch((e) => setError(e.message));
    api.retention().then(setDue).catch(() => setDue([]));
  }
  useEffect(load, []);

  async function erase(c) {
    if (!window.confirm(`Erase personal data for ${c.name}? Name, contact, CTC, notes and resume are removed. Pipeline statistics are kept anonymously. This cannot be undone.`)) return;
    try {
      await api.erase(c.id, "Retention period (3 years) expired");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHead eyebrow="DPDP accountability" title="Privacy & audit" />
      {error && <div className="alert danger">{error}</div>}
      <div className="card">
        <h2>Retention queue</h2>
        <p className="meta">Candidate data is kept for 3 years from capture, then erased. Records below have passed that date.</p>
        {due.length === 0 ? <p className="meta">Nothing due for erasure.</p> : (
          <table>
            <thead><tr><th>Candidate</th><th>Captured</th><th>Retain until</th><th>Active applications</th><th></th></tr></thead>
            <tbody>
              {due.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/candidates/${c.id}`}>{c.name}</Link><div className="meta">{c.email}</div></td>
                  <td>{String(c.created_at).slice(0, 10)}</td>
                  <td>{c.retention_until}</td>
                  <td>{c.active_apps}</td>
                  <td><button className="btn danger small" onClick={() => erase(c)}>Erase personal data</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {rows && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Processing log</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.created_at}</td>
                    <td>{r.user_name || "candidate / system"}</td>
                    <td>{r.action}</td>
                    <td>{r.entity_type} #{r.entity_id || "—"}</td>
                    <td className="meta">{r.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
