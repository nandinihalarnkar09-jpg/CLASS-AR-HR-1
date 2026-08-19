import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Modal, PageHead } from "../App.jsx";

export default function Pipeline({ meta }) {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);
  const [mode, setMode] = useState(null);
  const nav = useNavigate();

  function load(id = jobId) {
    api.pipeline(id).then(setData);
  }
  useEffect(() => {
    api.jobs().then(setJobs);
    load("");
  }, []);

  async function move(to) {
    await api.move(active.id, { to_stage: to });
    setMode(null);
    setActive(null);
    load();
  }

  async function terminal(outcome, extra) {
    await api.move(active.id, { outcome, ...extra });
    setMode(null);
    setActive(null);
    load();
  }

  const idx = (s) => meta.stages.indexOf(s);

  return (
    <div>
      <PageHead
        eyebrow="Kanban pipeline"
        title="Applied → Joined (client round & BGV required)"
        actions={
          <select
            style={{ width: 280 }}
            value={jobId}
            onChange={(e) => {
              setJobId(e.target.value);
              api.pipeline(e.target.value).then(setData);
            }}
          >
            <option value="">All open requisitions</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title} · {j.client_name}</option>
            ))}
          </select>
        }
      />
      {!data ? (
        <p>Loading pipeline…</p>
      ) : (
        <>
          <div className="kanban">
            {data.columns.map((col) => (
              <div className="column" key={col}>
                <h3>
                  {meta.stageLabels[col]}
                  <span className="tag">{data.items.filter((i) => i.stage === col).length}</span>
                </h3>
                {data.items
                  .filter((i) => i.stage === col)
                  .map((item) => (
                    <div className="card-item" key={item.id} onClick={() => setActive(item)}>
                      <h4>{item.name}</h4>
                      <div className="meta">{item.job_title}</div>
                      <div className="meta">{item.client_name} · {item.notice_period_days}d notice</div>
                      {item.notice_risk?.level === "high" && <span className="tag high">Notice vs project start</span>}
                      {item.notice_risk?.level === "medium" && <span className="tag medium">Tight notice</span>}
                      <span className="tag">{item.source_type}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
          {data.terminal.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h2>Rejected / dropped out</h2>
              <table>
                <thead><tr><th>Candidate</th><th>Job</th><th>Outcome</th><th>Reason</th></tr></thead>
                <tbody>
                  {data.terminal.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.job_title}</td>
                      <td>{t.outcome}</td>
                      <td>{t.reject_reason_code || t.dropout_reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {active && !mode && (
        <Modal title={active.name} onClose={() => setActive(null)}>
          <p className="meta">{active.job_title} · {active.client_name} · {meta.stageLabels[active.stage]}</p>
          {active.notice_risk?.level === "high" && (
            <div className="alert danger">
              {active.notice_period_days}-day notice vs project start in {active.notice_risk.untilStart} days. Likely unusable for this billing start.
            </div>
          )}
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button className="btn small" disabled={idx(active.stage) === 0} onClick={() => move(meta.stages[idx(active.stage) - 1])}>Move back</button>
            <button className="btn small" disabled={idx(active.stage) === meta.stages.length - 1} onClick={() => move(meta.stages[idx(active.stage) + 1])}>Move forward</button>
            <button className="btn secondary small" onClick={() => setMode("interview")}>Schedule interview</button>
            <button className="btn secondary small" onClick={() => setMode("offer")}>Offer details</button>
            <button className="btn warn small" onClick={() => setMode("drop")}>Dropped out</button>
            <button className="btn danger small" onClick={() => setMode("reject")}>Reject</button>
            <button className="btn ghost small" onClick={() => nav(`/candidates/${active.candidate_id}`)}>Open record</button>
            <a className="btn ghost small" href={`mailto:${active.email}`}>Email candidate</a>
          </div>
        </Modal>
      )}

      {active && mode === "reject" && (
        <Modal title="Reject candidate" onClose={() => setMode(null)}>
          <RejectForm reasons={meta.rejectReasons} onSubmit={(payload) => terminal("rejected", payload)} />
        </Modal>
      )}
      {active && mode === "drop" && (
        <Modal title="Mark dropped out" onClose={() => setMode(null)}>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); terminal("dropped_out", { dropout_reason: fd.get("reason") }); }}>
            <label className="field">Reason (competing offer, delay, etc.)
              <textarea name="reason" required rows={3} />
            </label>
            <button className="btn warn" type="submit" style={{ marginTop: 12 }}>Confirm dropout</button>
          </form>
        </Modal>
      )}
      {active && mode === "interview" && (
        <Modal title="Schedule interview" onClose={() => setMode(null)}>
          <InterviewForm
            onSubmit={async (body) => {
              await api.scheduleInterview(active.id, body);
              setMode(null);
              setActive(null);
              load();
            }}
          />
        </Modal>
      )}
      {active && mode === "offer" && (
        <Modal title="Record offer" onClose={() => setMode(null)}>
          <OfferForm
            onSubmit={async (body) => {
              await api.saveOffer(active.id, body);
              setMode(null);
              setActive(null);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function RejectForm({ reasons, onSubmit }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); onSubmit({ reject_reason_code: fd.get("code"), reject_notes: fd.get("notes") }); }}>
      <label className="field">Reason code
        <select name="code">{reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}</select>
      </label>
      <label className="field" style={{ marginTop: 10 }}>Notes
        <textarea name="notes" rows={3} />
      </label>
      <button className="btn danger" type="submit" style={{ marginTop: 12 }}>Reject</button>
    </form>
  );
}

function InterviewForm({ onSubmit }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit({
        round_type: fd.get("round_type"),
        panel_names: fd.get("panel_names"),
        scheduled_at: fd.get("scheduled_at"),
        location_or_link: fd.get("location_or_link"),
      });
    }} className="form-grid">
      <label className="field">Round
        <select name="round_type">
          <option value="internal">Internal</option>
          <option value="client">Client round</option>
        </select>
      </label>
      <label className="field">Date & time
        <input type="datetime-local" name="scheduled_at" required />
      </label>
      <label className="field full">Panel names
        <input name="panel_names" placeholder="e.g. Vikram Rao, client: Rakesh Iyer" required />
      </label>
      <label className="field full">Location or meeting link
        <input name="location_or_link" />
      </label>
      <div className="full"><button className="btn" type="submit">Save interview</button></div>
    </form>
  );
}

function OfferForm({ onSubmit }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit({
        offered_ctc_lpa: Number(fd.get("ctc")),
        joining_date: fd.get("joining_date"),
        status: fd.get("status"),
      });
    }} className="form-grid">
      <label className="field">Offered CTC (LPA)
        <input name="ctc" type="number" step="0.1" required />
      </label>
      <label className="field">Joining date
        <input name="joining_date" type="date" required />
      </label>
      <label className="field full">Status
        <select name="status">
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </label>
      <div className="full"><button className="btn" type="submit">Save offer & move to Offered</button></div>
    </form>
  );
}
