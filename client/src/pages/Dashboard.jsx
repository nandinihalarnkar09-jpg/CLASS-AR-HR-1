import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageHead } from "../App.jsx";

const inr = (n) => (n ? "₹" + Math.round(n).toLocaleString("en-IN") : "—");

export default function Dashboard({ meta }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="alert danger">{err}</div>;
  if (!data) return <p>Loading dashboard…</p>;
  const max = Math.max(1, ...data.byStage.map((s) => s.count));
  const k = data.kpis;
  const oc = data.offerCohort || {};
  return (
    <div>
      <PageHead eyebrow="Head of TA · daily pulse" title={`${k.openJobs} open requisitions`} />
      <div className="kpis">
        <div className="kpi"><span>Open requisitions</span><strong>{k.openJobs}</strong></div>
        <div className="kpi"><span>Active pipeline</span><strong>{k.activeApps}</strong></div>
        <div className="kpi"><span>Offer / BGV now</span><strong>{k.offered}</strong></div>
        <div className="kpi"><span>Joined (30d)</span><strong>{k.joined30}</strong></div>
        <div className="kpi highlight"><span>Offer → join drop</span><strong>{oc.dropRatePct != null ? `${oc.dropRatePct}%` : "—"}</strong></div>
        <div className="kpi"><span>Avg days to fill</span><strong>{k.avgTimeToFillDays ?? "—"}</strong></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Offer → joining</h2>
          <p>
            Of <strong>{(oc.joined || 0) + (oc.dropped || 0)}</strong> offers with a final outcome,{" "}
            <strong>{oc.dropped || 0}</strong> candidates dropped out before joining
            {oc.dropRatePct != null && <> — <strong>{oc.dropRatePct}%</strong></>}. {oc.pending || 0} offers are still open.
          </p>
          <h3 style={{ marginTop: 18 }}>Likely to drop out</h3>
          {data.atRisk?.length ? (
            <table>
              <thead><tr><th>Candidate</th><th>Role</th><th>Risk</th><th>Why</th></tr></thead>
              <tbody>
                {data.atRisk.map((r) => (
                  <tr key={r.id}>
                    <td><Link to={`/candidates/${r.candidate_id}`}>{r.name}</Link></td>
                    <td>{r.job_title}<div className="meta">{meta.stageLabels[r.stage]}</div></td>
                    <td><span className={`tag ${r.risk.level}`}>{r.risk.level}</span></td>
                    <td className="meta">{r.risk.reasons.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="meta">No offers flagged right now.</p>}
          <p className="meta" style={{ marginTop: 8 }}>Rules: other offers held, long notice, offer below expectation. Not AI.</p>
        </div>
        <div className="card">
          <h2>Candidates by stage</h2>
          <div className="stage-bars">
            {data.byStage.map((s) => (
              <div className="stage-row" key={s.stage}>
                <span>{s.label}</span>
                <div className="bar"><i style={{ width: `${(s.count / max) * 100}%` }} /></div>
                <strong>{s.count}</strong>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 18 }}>Interviews in the next 7 days</h3>
          {data.upcoming?.length ? (
            <ul className="timeline">
              {data.upcoming.map((i) => (
                <li key={i.id}>
                  <time>{i.scheduled_at.replace("T", " ")} · {i.round_type} round</time>
                  <div><Link to={`/candidates/${i.candidate_id}`}>{i.name}</Link> — {i.job_title}</div>
                  <div className="meta">{i.panel_names}</div>
                </li>
              ))}
            </ul>
          ) : <p className="meta">None scheduled.</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Which source actually works</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Source</th><th>Applications</th><th>Reached client round</th><th>Joined</th><th>Dropped</th><th>Join rate</th><th>Consultancy fees (8.33% CTC)</th></tr>
            </thead>
            <tbody>
              {(data.sourceRows || []).map((s) => (
                <tr key={s.source}>
                  <td>{s.source}</td>
                  <td>{s.applications}</td>
                  <td>{s.client_round_plus}</td>
                  <td>{s.joined}</td>
                  <td>{s.dropped}</td>
                  <td><strong>{s.joinRatePct}%</strong></td>
                  <td>{inr(s.fee_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Time-to-fill vs target closure</h2>
        <p className="meta">Time to fill = requisition opened → candidate joined.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Requisition</th><th>Opened</th><th>Target close</th><th>Joined on</th><th>Days open</th></tr></thead>
            <tbody>
              {data.timeToFill.map((r, i) => (
                <tr key={`${r.id}-${i}`}>
                  <td>{r.title}</td>
                  <td>{r.created_at?.slice(0, 10)}</td>
                  <td>{r.target_closure_date}</td>
                  <td>{r.joining_date || "—"}</td>
                  <td>{r.days_open}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
