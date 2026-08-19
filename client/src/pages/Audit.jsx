import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHead } from "../App.jsx";

export default function Audit() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.audit().then(setRows).catch((e) => setError(e.message));
  }, []);
  return (
    <div>
      <PageHead eyebrow="DPDP accountability" title="Processing audit log" />
      {error && <div className="alert danger">{error}</div>}
      {rows && (
        <div className="card">
          <table>
            <thead>
              <tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.created_at}</td>
                  <td>{r.user_name}</td>
                  <td>{r.action}</td>
                  <td>{r.entity_type} #{r.entity_id || "—"}</td>
                  <td className="meta">{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
