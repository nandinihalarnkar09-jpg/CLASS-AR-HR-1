import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, PageHead } from "../App.jsx";

const empty = {
  title: "",
  client_id: "",
  project_id: "",
  skills_required: "",
  exp_min_years: 3,
  exp_max_years: 7,
  ctc_min_lpa: 12,
  ctc_max_lpa: 20,
  location: "Bengaluru",
  target_closure_date: "",
  recruiter_id: "",
  status: "open",
};

export default function Jobs({ meta }) {
  const [jobs, setJobs] = useState([]);
  const [edit, setEdit] = useState(null);
  const canEdit = meta.user.role !== "hiring_manager";

  function load() {
    api.jobs().then(setJobs);
  }
  useEffect(load, []);

  const projects = meta.projects.filter((p) => !edit?.client_id || p.client_id === Number(edit.client_id));

  async function save(e) {
    e.preventDefault();
    const body = { ...edit, client_id: Number(edit.client_id), project_id: Number(edit.project_id), recruiter_id: Number(edit.recruiter_id) };
    if (edit.id) await api.updateJob(edit.id, body);
    else await api.createJob(body);
    setEdit(null);
    load();
  }

  return (
    <div>
      <PageHead
        eyebrow="Job requisitions"
        title="Client-tied open positions"
        actions={canEdit && <button className="btn" onClick={() => setEdit({ ...empty, recruiter_id: meta.user.id, client_id: meta.clients[0].id, project_id: meta.projects[0].id })}>New requisition</button>}
      />
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Client / project</th>
              <th>Billing</th>
              <th>Band</th>
              <th>Location</th>
              <th>Close by</th>
              <th>Recruiter</th>
              <th>Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} onClick={() => canEdit && setEdit(j)} style={{ cursor: canEdit ? "pointer" : "default" }}>
                <td>
                  <strong>{j.title}</strong>
                  <div className="meta">{j.skills_required}</div>
                </td>
                <td>
                  {j.client_name}
                  <div className="meta">{j.project_name} · start {j.project_start}</div>
                </td>
                <td>₹{(j.billing_rate_inr / 1000).toFixed(0)}k / mo</td>
                <td>
                  {j.exp_min_years}–{j.exp_max_years} yrs
                  <div className="meta">{j.ctc_min_lpa}–{j.ctc_max_lpa} LPA</div>
                </td>
                <td>{j.location}</td>
                <td>{j.target_closure_date}</td>
                <td>{j.recruiter_name}</td>
                <td>{j.active_pipeline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? "Edit requisition" : "Create requisition"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="form-grid">
            <label className="field full">Title
              <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required />
            </label>
            <label className="field">Client
              <select value={edit.client_id} onChange={(e) => setEdit({ ...edit, client_id: e.target.value })}>
                {meta.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">Project
              <select value={edit.project_id} onChange={(e) => setEdit({ ...edit, project_id: e.target.value })}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="field full">Skills required
              <input value={edit.skills_required} onChange={(e) => setEdit({ ...edit, skills_required: e.target.value })} required />
            </label>
            <label className="field">Exp min (yrs)
              <input type="number" step="0.5" value={edit.exp_min_years} onChange={(e) => setEdit({ ...edit, exp_min_years: Number(e.target.value) })} />
            </label>
            <label className="field">Exp max (yrs)
              <input type="number" step="0.5" value={edit.exp_max_years} onChange={(e) => setEdit({ ...edit, exp_max_years: Number(e.target.value) })} />
            </label>
            <label className="field">CTC min (LPA)
              <input type="number" step="0.5" value={edit.ctc_min_lpa} onChange={(e) => setEdit({ ...edit, ctc_min_lpa: Number(e.target.value) })} />
            </label>
            <label className="field">CTC max (LPA)
              <input type="number" step="0.5" value={edit.ctc_max_lpa} onChange={(e) => setEdit({ ...edit, ctc_max_lpa: Number(e.target.value) })} />
            </label>
            <label className="field">Location
              <input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
            </label>
            <label className="field">Target closure
              <input type="date" value={edit.target_closure_date?.slice(0, 10)} onChange={(e) => setEdit({ ...edit, target_closure_date: e.target.value })} required />
            </label>
            <label className="field">Assigned recruiter
              <select value={edit.recruiter_id} onChange={(e) => setEdit({ ...edit, recruiter_id: e.target.value })}>
                {meta.users.filter((u) => u.role === "recruiter" || u.role === "ta_head").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
            <label className="field">Status
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="open">Open</option>
                <option value="on_hold">On hold</option>
                <option value="filled">Filled</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <div className="full"><button className="btn" type="submit">Save requisition</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
