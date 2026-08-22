import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHead } from "../App.jsx";

export default function CandidatePortal({ session, onLogout }) {
  const [me, setMe] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const [m, j] = await Promise.all([api.portalMe(), api.portalJobs()]);
    setMe(m);
    setJobs(j);
  }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, []);

  async function apply(jobId) {
    setMsg("");
    try {
      await api.portalApply(jobId);
      setMsg("Application submitted. Recruiters will screen your profile.");
      load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  if (!me) return <p>Loading your applications… {msg}</p>;

  return (
    <div>
      <PageHead
        eyebrow="Candidate portal"
        title={`Hello, ${me.candidate.name}`}
        actions={<button className="btn secondary" onClick={onLogout}>Log out</button>}
      />
      {msg && <div className="alert">{msg}</div>}
      <div className="card">
        <h2>My applications</h2>
        {me.applications.length === 0 && <p className="meta">You have not applied to a Meridian role yet.</p>}
        <table>
          <thead><tr><th>Role</th><th>Client</th><th>Stage</th><th>Status</th></tr></thead>
          <tbody>
            {me.applications.map((a) => (
              <tr key={a.id}>
                <td>{a.job_title}<div className="meta">{a.location}</div></td>
                <td>{a.client_name}</td>
                <td>{a.stage_label}</td>
                <td>{a.outcome}{a.joining_date ? ` · join ${a.joining_date}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Open positions</h2>
        <p className="meta">Apply only if you have consented to Meridian processing your data for this search.</p>
        <table>
          <thead><tr><th>Title</th><th>Skills</th><th>Location</th><th></th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.title}<div className="meta">{j.client_name} · {j.exp_min_years}–{j.exp_max_years} yrs</div></td>
                <td>{j.skills_required}</td>
                <td>{j.location}</td>
                <td>
                  {j.applied
                    ? <span className="tag ok">Applied</span>
                    : <button className="btn small" onClick={() => apply(j.id)}>Apply</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
