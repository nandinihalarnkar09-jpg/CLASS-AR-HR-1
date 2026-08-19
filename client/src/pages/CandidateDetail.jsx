import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { PageHead } from "../App.jsx";

export default function CandidateDetail({ meta }) {
  const { id } = useParams();
  const [pack, setPack] = useState(null);
  const [note, setNote] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    const [d, j] = await Promise.all([api.candidate(id), api.jobs()]);
    setPack(d);
    setJobs(j);
  }
  useEffect(() => { load(); }, [id]);

  if (!pack) return <p>Loading candidate…</p>;
  const c = pack.candidate;
  const canEdit = meta.user.role !== "hiring_manager";

  async function addNote(e) {
    e.preventDefault();
    await api.addNote(c.id, note);
    setNote("");
    load();
  }

  async function linkJob(e) {
    e.preventDefault();
    try {
      await api.linkApplication(c.id, Number(jobId));
      setErr("");
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function onResume(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.uploadResume(c.id, file);
    load();
  }

  return (
    <div>
      <PageHead
        eyebrow="Candidate record"
        title={c.name}
        actions={<a className="btn" href={`mailto:${c.email}?subject=${encodeURIComponent("Meridian Technologies — opportunity")}`}>Email candidate</a>}
      />
      <div className="split">
        <div>
          <div className="card">
            <p className="meta">{c.phone} · {c.email}</p>
            <p>{c.current_company || "—"} · {c.total_experience_years} yrs · {c.notice_period_days} days notice</p>
            <p>Skills: {c.skills}</p>
            <p>
              Source: {c.source_type}
              {c.consultancy_name ? ` · ${c.consultancy_name}` : ""}
              {c.referred_by ? ` · ${c.referred_by}` : ""}
            </p>
            {!c.compensation_masked && (
              <p>CTC current {c.current_ctc_lpa ?? "—"} LPA · expected {c.expected_ctc_lpa ?? "—"} LPA</p>
            )}
            {c.compensation_masked && <p className="meta">Compensation hidden for hiring-manager role (need-to-know).</p>}
            <p className="meta">
              Consent {c.consent_given ? "recorded" : "missing"} · retain until {c.retention_until} · purpose: {c.consent_purpose}
            </p>
            {canEdit && (
              <label className="field" style={{ marginTop: 12 }}>
                Resume (PDF/DOC)
                <input type="file" accept=".pdf,.doc,.docx" onChange={onResume} />
              </label>
            )}
            {c.resume_path && (
              <p><a href={`/api/resumes/${c.resume_path}`} target="_blank" rel="noreferrer">Download {c.resume_original_name || "resume"}</a></p>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>Applications</h2>
            {err && <div className="alert danger">{err}</div>}
            {canEdit && (
              <form className="toolbar" onSubmit={linkJob}>
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} required>
                  <option value="">Link to another job</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.client_name}</option>)}
                </select>
                <button className="btn small" type="submit">Link</button>
              </form>
            )}
            <table>
              <thead>
                <tr><th>Job</th><th>Stage</th><th>Outcome</th><th>Notice risk</th><th>Offer</th></tr>
              </thead>
              <tbody>
                {pack.applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.job_title}<div className="meta">{a.client_name} · {a.project_name}</div></td>
                    <td>{meta.stageLabels[a.stage]}</td>
                    <td>{a.outcome}</td>
                    <td>
                      <span className={`tag ${a.notice_risk.level}`}>{a.notice_risk.level}</span>
                      <div className="meta">Project start {a.project_start}</div>
                    </td>
                    <td>{a.offered_ctc_lpa ? `${a.offered_ctc_lpa} LPA · ${a.joining_date}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>Interviews</h2>
            {pack.interviews.length === 0 && <p className="meta">None scheduled. Use the pipeline card to add a panel & time.</p>}
            <ul>
              {pack.interviews.map((i) => (
                <li key={i.id}>{i.round_type} · {i.job_title} · {i.panel_names} · {i.scheduled_at}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>Notes</h2>
            <form onSubmit={addNote}>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Competing offers, client feedback…" />
              <button className="btn small" style={{ marginTop: 8 }} type="submit">Add note</button>
            </form>
            <ul className="timeline" style={{ marginTop: 16 }}>
              {pack.notes.map((n) => (
                <li key={n.id}>
                  <time>{n.created_at} · {n.author_name}</time>
                  <div>{n.body}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Stage history</h2>
            <ul className="timeline">
              {pack.history.map((h) => (
                <li key={h.id}>
                  <time>{h.moved_at} · {h.moved_by_name || "system"}</time>
                  <div>{h.from_stage || "—"} → {h.to_stage} ({h.outcome})</div>
                  {h.note && <div className="meta">{h.note}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
