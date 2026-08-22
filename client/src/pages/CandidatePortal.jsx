import { useEffect, useState } from "react";
import { api } from "../api";
import { Modal, PageHead } from "../App.jsx";

const ROLE_Q = {
  default: "What is the strongest project that matches this job description?",
  java: "How many years have you built production Spring Boot + React applications?",
  react: "Have you shipped production TypeScript React apps with Jest tests?",
  data: "Which AWS + Spark/Kafka pipelines have you owned in production?",
  qa: "What automation framework did you last lead?",
  devops: "Describe a Kubernetes/Terraform production incident you resolved.",
  ba: "Give an example of a BFSI process you mapped into user stories.",
};

function roleQuestion(title = "") {
  const t = title.toLowerCase();
  if (t.includes("java")) return ROLE_Q.java;
  if (t.includes("react") || t.includes("frontend")) return ROLE_Q.react;
  if (t.includes("data")) return ROLE_Q.data;
  if (t.includes("qa") || t.includes("automation")) return ROLE_Q.qa;
  if (t.includes("devops")) return ROLE_Q.devops;
  if (t.includes("analyst") || t.includes("business")) return ROLE_Q.ba;
  return ROLE_Q.default;
}

export default function CandidatePortal({ session, onLogout }) {
  const [me, setMe] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState("");
  const [applyJob, setApplyJob] = useState(null);

  async function load() {
    const [m, j] = await Promise.all([api.portalMe(), api.portalJobs()]);
    setMe(m);
    setJobs(j);
  }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, []);

  async function submitApply(e) {
    e.preventDefault();
    setMsg("");
    const fd = new FormData(e.target);
    fd.set("job_id", String(applyJob.id));
    const cv = fd.get("cv");
    if (!cv || !cv.name || !/\.pdf$/i.test(cv.name)) {
      setMsg("Please attach your CV as a PDF.");
      return;
    }
    try {
      await api.portalApply(fd);
      setApplyJob(null);
      setMsg("Application submitted with your documents. Recruiters will screen your profile.");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!me) return <p>Loading your applications… {msg}</p>;
  const c = me.candidate;

  return (
    <div>
      <PageHead
        eyebrow="Candidate portal"
        title={`Hello, ${c.name}`}
        actions={<button className="btn secondary" onClick={onLogout}>Log out</button>}
      />
      {msg && <div className="alert">{msg}</div>}
      <div className="card">
        <h2>My applications</h2>
        {me.applications.length === 0 && <p className="meta">You have not applied to a role yet.</p>}
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
        <h2>Open jobs — apply to as many as you like</h2>
        <p className="meta">Fill the application form, attach a PDF CV, and optionally a cover letter or other documents.</p>
        {jobs.map((j) => (
          <div key={j.id} className="card" style={{ marginTop: 12, boxShadow: "none" }}>
            <h3 style={{ marginTop: 0 }}>{j.title}</h3>
            <p className="meta">{j.client_name} · {j.location} · {j.exp_min_years}–{j.exp_max_years} yrs</p>
            <h4>Job description</h4>
            <p>{j.description}</p>
            <h4>Requirements</h4>
            <ul>{(j.requirements || "").split("\n").filter(Boolean).map((line) => <li key={line}>{line}</li>)}</ul>
            <h4>Pay</h4>
            <p>{j.pay}</p>
            <h4>Benefits</h4>
            <ul>{(j.benefits || "").split("\n").filter(Boolean).map((line) => <li key={line}>{line}</li>)}</ul>
            {j.applied
              ? <span className="tag ok">Applied</span>
              : <button className="btn small" onClick={() => setApplyJob(j)}>Apply to this job</button>}
          </div>
        ))}
      </div>

      {applyJob && (
        <Modal title={`Apply — ${applyJob.title}`} onClose={() => setApplyJob(null)}>
          <p className="meta">{applyJob.client_name} · {applyJob.location}</p>
          <form onSubmit={submitApply} className="form-grid">
            <label className="field">Full name<input name="full_name" defaultValue={c.name} required /></label>
            <label className="field">Phone<input name="phone" defaultValue={c.phone} required /></label>
            <label className="field">Email<input name="email" type="email" defaultValue={c.email} required /></label>
            <label className="field">Current city<input name="city" required /></label>
            <label className="field">Highest qualification
              <select name="qualification" required>
                <option value="">Select</option>
                <option>B.E / B.Tech</option>
                <option>M.E / M.Tech</option>
                <option>MCA / M.Sc</option>
                <option>MBA</option>
                <option>Other</option>
              </select>
            </label>
            <label className="field">Total experience (years)<input name="experience" type="number" step="0.1" defaultValue={c.total_experience_years} required /></label>
            <label className="field">Current company<input name="current_company" /></label>
            <label className="field">Current CTC (LPA)<input name="current_ctc" type="number" step="0.1" /></label>
            <label className="field">Expected CTC (LPA)<input name="expected_ctc" type="number" step="0.1" required /></label>
            <label className="field">Notice period (days)<input name="notice" type="number" defaultValue={c.notice_period_days} required /></label>
            <label className="field">LinkedIn / portfolio URL<input name="linkedin" type="url" placeholder="https://" /></label>
            <label className="field full">Attach CV (PDF, required)<input name="cv" type="file" accept=".pdf,application/pdf" required /></label>
            <label className="field full">Attach cover letter (PDF or Word, optional)<input name="cover_letter" type="file" accept=".pdf,.doc,.docx" /></label>
            <label className="field full">Other documents (education, relieving letter)<input name="other_docs" type="file" accept=".pdf,.doc,.docx,image/*" multiple /></label>
            <label className="field">Serving notice now?
              <select name="serving_notice" required><option value="">Select</option><option>Yes</option><option>No</option></select>
            </label>
            <label className="field">Willing to relocate / work at job location?
              <select name="relocate" required><option value="">Select</option><option>Yes</option><option>No</option><option>Already in this city</option></select>
            </label>
            <label className="field">Holding other offers?
              <select name="other_offers" required><option value="">Select</option><option>Yes</option><option>No</option></select>
            </label>
            <label className="field">Willing to attend a client interview round?
              <select name="client_round" required><option value="">Select</option><option>Yes</option><option>No</option></select>
            </label>
            <label className="field">Consent to BGV before joining?
              <select name="bgv" required><option value="">Select</option><option>Yes</option><option>No</option></select>
            </label>
            <label className="field">Earliest joining date<input name="joining" type="date" required /></label>
            <label className="field full">{roleQuestion(applyJob.title)}<input name="role_answer" required /></label>
            <label className="field full">Why are you a fit for this job?<textarea name="why_fit" rows={3} required /></label>
            <label className="consent full">
              <input name="consent" type="checkbox" required /> I consent to processing this application (including documents) only for recruitment.
            </label>
            <div className="full"><button className="btn" type="submit">Submit application</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
