import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHead } from "../App.jsx";

export default function Dashboard({ meta }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.dashboard().then(setData);
  }, []);
  if (!data) return <p>Loading dashboard…</p>;
  const max = Math.max(1, ...data.byStage.map((s) => s.count));
  const k = data.kpis;
  return (
    <div>
      <PageHead
        eyebrow="Head of TA · daily pulse"
        title={`Open hiring for ${k.openJobs} client projects`}
      />
      <div className="kpis">
        <div className="kpi"><span>Open positions</span><strong>{k.openJobs}</strong></div>
        <div className="kpi"><span>Active pipeline</span><strong>{k.activeApps}</strong></div>
        <div className="kpi"><span>Offer / BGV</span><strong>{k.offered}</strong></div>
        <div className="kpi"><span>Joined (30d)</span><strong>{k.joined30}</strong></div>
        <div className="kpi"><span>Dropped out</span><strong>{k.dropped}</strong></div>
        <div className="kpi"><span>Avg days to fill</span><strong>{k.avgTimeToFillDays ?? "—"}</strong></div>
      </div>
      <div className="grid-2">
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
        </div>
        <div className="card">
          <h2>Source efficiency</h2>
          <table>
            <thead>
              <tr><th>Source</th><th>Records</th><th>Joined</th><th>Dropped</th></tr>
            </thead>
            <tbody>
              {data.sources.map((s) => (
                <tr key={s.source_type}>
                  <td>{s.source_type}</td>
                  <td>{s.n}</td>
                  <td>{s.joined}</td>
                  <td>{s.dropped}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="meta" style={{ marginTop: 12 }}>
            Consultancies bill 8.33% of annual CTC. Track join vs drop before renewing retainers.
          </p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Time-to-fill vs target closure</h2>
        <table>
          <thead>
            <tr>
              <th>Requisition</th>
              <th>Opened</th>
              <th>Target close</th>
              <th>Joined on</th>
              <th>Days open</th>
            </tr>
          </thead>
          <tbody>
            {data.timeToFill.map((r) => (
              <tr key={r.id}>
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
      <p className="meta" style={{ marginTop: 18 }}>
        Signed in as {meta.user.name} ({meta.user.role.replace("_", " ")}). Hiring managers see masked CTC.
        Out of scope: payroll, post-join onboarding, performance.
      </p>
    </div>
  );
}
