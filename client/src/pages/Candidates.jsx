import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Modal, PageHead } from "../App.jsx";

const empty = {
  name: "",
  phone: "",
  email: "",
  current_company: "",
  current_ctc_lpa: "",
  expected_ctc_lpa: "",
  notice_period_days: 30,
  total_experience_years: "",
  skills: "",
  source_type: "naukri",
  source_detail: "",
  consultancy_id: "",
  referred_by: "",
  consent_given: false,
};

export default function Candidates({ meta }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [source, setSource] = useState("");
  const [form, setForm] = useState(null);
  const [dup, setDup] = useState(null);
  const nav = useNavigate();
  const canEdit = meta.user.role !== "hiring_manager";

  function load(params) {
    api.candidates(params || { q, skill, source }).then(setRows);
  }
  useEffect(() => { load({ q: "", skill: "", source: "" }); }, []);

  async function onPhone(phone) {
    setForm((f) => ({ ...f, phone }));
    if (String(phone).replace(/\D/g, "").length >= 10) {
      const r = await api.checkPhone(phone);
      setDup(r.duplicate ? r.candidate : null);
    } else setDup(null);
  }

  async function save(e) {
    e.preventDefault();
    if (dup) return;
    try {
      const created = await api.createCandidate({
        ...form,
        current_ctc_lpa: form.current_ctc_lpa === "" ? null : Number(form.current_ctc_lpa),
        expected_ctc_lpa: form.expected_ctc_lpa === "" ? null : Number(form.expected_ctc_lpa),
        consultancy_id: form.source_type === "consultancy" ? Number(form.consultancy_id) : null,
      });
      setForm(null);
      nav(`/candidates/${created.id}`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Candidate database"
        title="Search, source, and duplicate-safe records"
        actions={canEdit && <button className="btn" onClick={() => { setForm({ ...empty }); setDup(null); }}>Add candidate</button>}
      />
      <div className="toolbar">
        <input placeholder="Name, phone, company…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        <input placeholder="Skill filter e.g. Kafka" value={skill} onChange={(e) => setSkill(e.target.value)} style={{ maxWidth: 200 }} />
        <select value={source} onChange={(e) => setSource(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All sources</option>
          {meta.sourceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn secondary" onClick={() => load({ q, skill, source })}>Search</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone / email</th>
              <th>Company</th>
              <th>Exp / notice</th>
              <th>Skills</th>
              <th>Source</th>
              <th>Jobs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => nav(`/candidates/${c.id}`)}>
                <td><strong>{c.name}</strong></td>
                <td>{c.phone}<div className="meta">{c.email}</div></td>
                <td>{c.current_company || "—"}</td>
                <td>{c.total_experience_years} yrs · {c.notice_period_days}d</td>
                <td>{c.skills}</td>
                <td>{c.source_type}{c.consultancy_name ? ` · ${c.consultancy_name}` : ""}</td>
                <td>{c.application_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title="New candidate" onClose={() => setForm(null)}>
          <form onSubmit={save} className="form-grid">
            <label className="field">Full name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">Phone
              <input value={form.phone} onChange={(e) => onPhone(e.target.value)} required />
            </label>
            {dup && (
              <div className="alert danger full">
                Duplicate phone: {dup.name} ({dup.email}). Open the existing record instead of creating a second outreach trail.
                <div><button type="button" className="btn small" style={{ marginTop: 8 }} onClick={() => nav(`/candidates/${dup.id}`)}>Open existing</button></div>
              </div>
            )}
            <label className="field">Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="field">Current company
              <input value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} />
            </label>
            <label className="field">Current CTC (LPA)
              <input type="number" step="0.1" value={form.current_ctc_lpa} onChange={(e) => setForm({ ...form, current_ctc_lpa: e.target.value })} />
            </label>
            <label className="field">Expected CTC (LPA)
              <input type="number" step="0.1" value={form.expected_ctc_lpa} onChange={(e) => setForm({ ...form, expected_ctc_lpa: e.target.value })} />
            </label>
            <label className="field">Notice (days)
              <input type="number" value={form.notice_period_days} onChange={(e) => setForm({ ...form, notice_period_days: Number(e.target.value) })} />
            </label>
            <label className="field">Total experience (yrs)
              <input type="number" step="0.1" value={form.total_experience_years} onChange={(e) => setForm({ ...form, total_experience_years: Number(e.target.value) })} />
            </label>
            <label className="field full">Skills (comma separated)
              <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} required />
            </label>
            <label className="field">Source
              <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })}>
                {meta.sourceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {form.source_type === "consultancy" && (
              <label className="field">Consultancy (8.33% CTC)
                <select value={form.consultancy_id} onChange={(e) => setForm({ ...form, consultancy_id: e.target.value })}>
                  <option value="">Select</option>
                  {meta.consultancies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            {form.source_type === "referral" && (
              <label className="field">Referred by
                <input value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })} />
              </label>
            )}
            <label className="field full">Source detail
              <input value={form.source_detail} onChange={(e) => setForm({ ...form, source_detail: e.target.value })} />
            </label>
            <label className="consent full">
              <input type="checkbox" checked={form.consent_given} onChange={(e) => setForm({ ...form, consent_given: e.target.checked })} />{" "}
              DPDP consent: candidate has agreed to process name, contact, employment and compensation data solely for recruitment at Meridian Technologies. Retention is 3 years from capture, then delete or anonymise.
            </label>
            <div className="full"><button className="btn" disabled={!!dup || !form.consent_given} type="submit">Create record</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
