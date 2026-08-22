/** Browser-side demo data when the Express API is not running (GitHub / missing Node server). */

const STAGE_LABELS = {
  applied: "Applied",
  screened: "Screened",
  internal_interview: "Internal Interview",
  client_round: "Client Round",
  offered: "Offered",
  bgv: "BGV",
  joined: "Joined",
};
const STAGES = Object.keys(STAGE_LABELS);
const REJECT_REASONS = [
  { code: "skills_mismatch", label: "Skills mismatch" },
  { code: "ctc_mismatch", label: "CTC mismatch" },
  { code: "notice_too_long", label: "Notice period too long" },
  { code: "client_reject", label: "Rejected in client round" },
  { code: "internal_reject", label: "Rejected in internal interview" },
  { code: "bgv_fail", label: "BGV failed" },
  { code: "location", label: "Location / work-mode mismatch" },
  { code: "experience", label: "Experience band mismatch" },
  { code: "other", label: "Other" },
];

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function seed() {
  const users = [
    { id: 1, name: "Priya Nair", email: "priya.nair@meridian.tech", role: "ta_head", password: "Meridian@2026" },
    { id: 2, name: "Arjun Mehta", email: "arjun.mehta@meridian.tech", role: "recruiter", password: "Meridian@2026" },
    { id: 3, name: "Sneha Iyer", email: "sneha.iyer@meridian.tech", role: "recruiter", password: "Meridian@2026" },
    { id: 6, name: "Vikram Rao", email: "vikram.rao@meridian.tech", role: "hiring_manager", password: "Meridian@2026" },
  ];
  const clients = [
    { id: 1, name: "HDFC Bank" },
    { id: 2, name: "Tata Motors" },
    { id: 4, name: "Reliance Jio" },
  ];
  const projects = [
    { id: 1, client_id: 1, name: "Digital Lending Platform", start_date: "2026-09-15", billing_rate_inr: 185000, client_name: "HDFC Bank" },
    { id: 3, client_id: 2, name: "Connected Vehicle Analytics", start_date: "2026-09-01", billing_rate_inr: 165000, client_name: "Tata Motors" },
    { id: 5, client_id: 4, name: "5G OSS Support", start_date: "2026-08-25", billing_rate_inr: 175000, client_name: "Reliance Jio" },
  ];
  const consultancies = [
    { id: 1, name: "Adecco India", fee_percent: 8.33 },
    { id: 2, name: "TeamLease Digital", fee_percent: 8.33 },
    { id: 3, name: "Randstad India", fee_percent: 8.33 },
  ];
  const jobs = [
    { id: 1, title: "Java Full Stack Engineer", client_id: 1, project_id: 1, skills_required: "Java, Spring Boot, React, PostgreSQL", description: "Build and own end-to-end features on the HDFC Digital Lending Platform: REST APIs in Spring Boot, React screens for loan origination, and PostgreSQL data model changes.", requirements: "4–8 years in Java and Spring Boot\nHands-on React and PostgreSQL\nBanking or lending experience preferred", pay: "₹18–28 LPA CTC (80% fixed + 20% variable). Joining bonus ₹1,00,000 after 90 days.", benefits: "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh floater\nHybrid 8 office / 12 WFH days\n₹25,000 learning budget", exp_min_years: 4, exp_max_years: 8, ctc_min_lpa: 18, ctc_max_lpa: 28, location: "Bengaluru", target_closure_date: "2026-09-10", recruiter_id: 2, status: "open", client_name: "HDFC Bank", project_name: "Digital Lending Platform", project_start: "2026-09-15", billing_rate_inr: 185000, recruiter_name: "Arjun Mehta", created_at: "2026-07-01 09:00:00" },
    { id: 2, title: "React Frontend Developer", client_id: 1, project_id: 1, skills_required: "React, TypeScript, Redux, Jest", description: "Create accessible, tested UI for HDFC Core Banking Modernisation using TypeScript React, Redux, and Jest.", requirements: "3–6 years of React and TypeScript\nRedux and Jest\nHyderabad hybrid delivery", pay: "₹14–22 LPA CTC (85% fixed + 15% variable).", benefits: "PF and gratuity\nFamily mediclaim ₹5 lakh\nHyderabad hybrid 3 days office\nInternet stipend ₹1,500/month", exp_min_years: 3, exp_max_years: 6, ctc_min_lpa: 14, ctc_max_lpa: 22, location: "Hyderabad", target_closure_date: "2026-09-20", recruiter_id: 3, status: "open", client_name: "HDFC Bank", project_name: "Digital Lending Platform", project_start: "2026-09-15", billing_rate_inr: 185000, recruiter_name: "Sneha Iyer", created_at: "2026-07-05 09:00:00" },
    { id: 3, title: "Data Engineer", client_id: 2, project_id: 3, skills_required: "Python, Spark, Kafka, AWS", description: "Design Spark/Kafka pipelines on AWS for Tata Motors Connected Vehicle Analytics.", requirements: "5–9 years in data engineering\nPython, Spark, Kafka, AWS\nPune-based", pay: "₹20–32 LPA CTC (80% fixed + 20% variable).", benefits: "PF and gratuity\nMediclaim ₹7.5 lakh floater\nClient travel at actuals\n₹30,000 cloud certification budget", exp_min_years: 5, exp_max_years: 9, ctc_min_lpa: 20, ctc_max_lpa: 32, location: "Pune", target_closure_date: "2026-08-28", recruiter_id: 2, status: "open", client_name: "Tata Motors", project_name: "Connected Vehicle Analytics", project_start: "2026-09-01", billing_rate_inr: 165000, recruiter_name: "Arjun Mehta", created_at: "2026-07-08 09:00:00" },
    { id: 5, title: "DevOps Engineer", client_id: 4, project_id: 5, skills_required: "Kubernetes, Terraform, Jenkins, AWS", description: "Run Kubernetes, Terraform, and Jenkins for Reliance Jio 5G OSS support.", requirements: "4–7 years DevOps/SRE\nKubernetes, Terraform, Jenkins, AWS\nMumbai preferred", pay: "₹18–26 LPA CTC plus ₹8,000/month on-call stipend.", benefits: "PF and gratuity\nMediclaim ₹5 lakh\nMeal coupons ₹2,200/month\nComp-off for weekend releases", exp_min_years: 4, exp_max_years: 7, ctc_min_lpa: 18, ctc_max_lpa: 26, location: "Mumbai", target_closure_date: "2026-08-22", recruiter_id: 2, status: "open", client_name: "Reliance Jio", project_name: "5G OSS Support", project_start: "2026-08-25", billing_rate_inr: 175000, recruiter_name: "Arjun Mehta", created_at: "2026-07-10 09:00:00" },
  ];
  const candidates = [
    { id: 1, name: "Aditya Menon", phone: "9876500001", email: "aditya.menon@example.com", current_company: "Wipro", current_ctc_lpa: 16, expected_ctc_lpa: 22, notice_period_days: 90, total_experience_years: 6.5, skills: "Java, Spring Boot, React", source_type: "naukri", source_detail: "Naukri search", consultancy_id: null, referred_by: null, portal_password: "Welcome@123", consent_given: 1, consent_purpose: "Recruitment for client-delivery roles at Meridian Technologies", retention_until: "2029-08-20", updated_at: now() },
    { id: 2, name: "Nisha Verma", phone: "9876500002", email: "nisha.verma@example.com", current_company: "TCS", current_ctc_lpa: 14, expected_ctc_lpa: 18, notice_period_days: 30, total_experience_years: 4.2, skills: "React, TypeScript, Redux", source_type: "linkedin", source_detail: "InMail", consultancy_id: null, referred_by: null, portal_password: "Welcome@123", consent_given: 1, consent_purpose: "Recruitment for client-delivery roles at Meridian Technologies", retention_until: "2029-08-20", updated_at: now() },
    { id: 3, name: "Farhan Qureshi", phone: "9876500003", email: "farhan.q@example.com", current_company: "Capgemini", current_ctc_lpa: 22, expected_ctc_lpa: 30, notice_period_days: 60, total_experience_years: 8, skills: "Python, Spark, Kafka, AWS", source_type: "consultancy", source_detail: "Adecco India", consultancy_id: 1, referred_by: null, portal_password: "Welcome@123", consent_given: 1, consent_purpose: "Recruitment for client-delivery roles at Meridian Technologies", retention_until: "2029-08-20", updated_at: now() },
    { id: 4, name: "Kavya Reddy", phone: "9876500004", email: "kavya.reddy@example.com", current_company: "Accenture", current_ctc_lpa: 18, expected_ctc_lpa: 24, notice_period_days: 15, total_experience_years: 5.5, skills: "Java, Spring, Microservices", source_type: "referral", source_detail: "Employee referral", consultancy_id: null, referred_by: "Vikram Rao", portal_password: "Welcome@123", consent_given: 1, consent_purpose: "Recruitment for client-delivery roles at Meridian Technologies", retention_until: "2029-08-20", updated_at: now() },
  ];
  const applications = [
    { id: 1, candidate_id: 1, job_id: 1, stage: "client_round", outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null, offered_ctc_lpa: null, joining_date: null, updated_at: now() },
    { id: 2, candidate_id: 2, job_id: 2, stage: "internal_interview", outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null, offered_ctc_lpa: null, joining_date: null, updated_at: now() },
    { id: 3, candidate_id: 3, job_id: 3, stage: "offered", outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null, offered_ctc_lpa: 28, joining_date: "2026-10-15", updated_at: now() },
    { id: 4, candidate_id: 4, job_id: 1, stage: "bgv", outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null, offered_ctc_lpa: 24, joining_date: "2026-09-01", updated_at: now() },
    { id: 5, candidate_id: 2, job_id: 1, stage: "screened", outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null, offered_ctc_lpa: null, joining_date: null, updated_at: now() },
    { id: 6, candidate_id: 1, job_id: 5, stage: "applied", outcome: "dropped_out", reject_reason_code: null, reject_notes: null, dropout_reason: "Accepted competing offer", offered_ctc_lpa: null, joining_date: null, updated_at: now() },
  ];
  return {
    users, clients, projects, consultancies, jobs, candidates, applications,
    notes: [
      { id: 1, candidate_id: 3, author_id: 2, author_name: "Arjun Mehta", body: "Holds competing offer from Infosys (28 LPA).", created_at: now() },
      { id: 2, candidate_id: 1, author_id: 3, author_name: "Sneha Iyer", body: "90-day notice vs HDFC start 15 Sep — timeline risk.", created_at: now() },
    ],
    history: applications.map((a) => ({
      id: a.id,
      application_id: a.id,
      from_stage: null,
      to_stage: a.stage,
      outcome: a.outcome,
      moved_by_name: "Arjun Mehta",
      moved_at: now(),
      note: "Seeded",
    })),
    interviews: [
      { id: 1, application_id: 1, job_id: 1, job_title: "Java Full Stack Engineer", round_type: "client", panel_names: "HDFC panel: Rakesh Iyer", scheduled_at: "2026-08-21T15:00:00" },
    ],
    offers: [
      { id: 1, application_id: 3, job_id: 3, job_title: "Data Engineer", offered_ctc_lpa: 28, joining_date: "2026-10-15", status: "pending" },
    ],
    audit: [],
    ids: { job: 10, candidate: 10, app: 10, note: 10, hist: 20, interview: 10, offer: 10 },
  };
}

const KEY = "meridian-ats-demo-v3";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const s = seed();
  save(s);
  return s;
}

function save(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function user(s, userId) {
  return s.users.find((u) => u.id === Number(userId)) || s.users[1];
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function noticeRisk(noticeDays, projectStart) {
  const untilStart = daysUntil(projectStart);
  if (untilStart == null) return { level: "unknown", untilStart: null };
  if (noticeDays > untilStart) return { level: "high", untilStart };
  if (noticeDays > untilStart - 14) return { level: "medium", untilStart };
  return { level: "low", untilStart };
}

function jobRow(s, j) {
  return {
    ...j,
    active_pipeline: s.applications.filter((a) => a.job_id === j.id && a.outcome === "active").length,
  };
}

function mask(u, c) {
  if (u.role === "recruiter" || u.role === "ta_head") return c;
  return { ...c, current_ctc_lpa: null, expected_ctc_lpa: null, compensation_masked: true };
}

export let demoActive = false;

export function enableDemo() {
  demoActive = true;
}

export async function demoRequest(path, options = {}, userId = 2, session = null) {
  enableDemo();
  const s = load();
  const u = user(s, session?.type === "staff" ? session.user.id : userId);
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://local.demo");
  const p = url.pathname;
  const body = options.body && !(options.body instanceof FormData)
    ? JSON.parse(options.body)
    : {};

  const json = (data, status = 200) => {
    save(s);
    if (status >= 400) {
      const err = new Error(data.error || "Error");
      err.status = status;
      err.data = data;
      throw err;
    }
    return data;
  };

  if (p === "/api/auth/demo-accounts") {
    return json({
      staffPassword: "Meridian@2026",
      candidatePassword: "Welcome@123",
      staff: s.users.map(({ password, ...rest }) => rest),
      candidates: s.candidates.map((c) => ({ name: c.name, email: c.email, phone: c.phone })),
    });
  }
  if (p === "/api/auth/login" && method === "POST") {
    const email = String(body.email || "").toLowerCase();
    if (body.portal === "candidate") {
      const c = s.candidates.find((x) => x.email.toLowerCase() === email);
      if (!c || c.portal_password !== body.password) return json({ error: "Invalid candidate email or password" }, 401);
      return json({ type: "candidate", candidate: { id: c.id, name: c.name, email: c.email, phone: c.phone } });
    }
    const staff = s.users.find((x) => x.email.toLowerCase() === email);
    if (!staff || staff.password !== body.password) return json({ error: "Invalid recruiter email or password" }, 401);
    return json({ type: "staff", user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
  }
  if (p === "/api/portal/jobs") {
    const cid = session?.candidate?.id;
    const applied = new Set(s.applications.filter((a) => a.candidate_id === cid).map((a) => a.job_id));
    return json(s.jobs.filter((j) => j.status === "open").map((j) => ({
      id: j.id, title: j.title, skills_required: j.skills_required, description: j.description, requirements: j.requirements, pay: j.pay, benefits: j.benefits, location: j.location,
      exp_min_years: j.exp_min_years, exp_max_years: j.exp_max_years, client_name: j.client_name,
      applied: applied.has(j.id),
    })));
  }
  if (p === "/api/portal/me") {
    const cid = session?.candidate?.id;
    const c = s.candidates.find((x) => x.id === cid);
    if (!c) return json({ error: "Please log in as a candidate" }, 401);
    const STAGE_LABELS_LOCAL = STAGE_LABELS;
    const applications = s.applications.filter((a) => a.candidate_id === cid).map((a) => {
      const j = s.jobs.find((job) => job.id === a.job_id);
      return { ...a, job_title: j?.title, location: j?.location, client_name: j?.client_name, stage_label: STAGE_LABELS_LOCAL[a.stage] };
    });
    return json({ candidate: { id: c.id, name: c.name, email: c.email, phone: c.phone, skills: c.skills, notice_period_days: c.notice_period_days }, applications, stageLabels: STAGE_LABELS });
  }
  if (p === "/api/portal/apply" && method === "POST") {
    const cid = session?.candidate?.id;
    const existing = s.applications.find((a) => a.candidate_id === cid && a.job_id === body.job_id);
    if (existing) return json({ error: "You have already applied to this role" }, 409);
    const id = ++s.ids.app;
    s.applications.push({ id, candidate_id: cid, job_id: body.job_id, stage: "applied", outcome: "active" });
    return json({ id }, 201);
  }

  s.audit.unshift({
    id: s.audit.length + 1,
    created_at: now(),
    user_name: u.name,
    action: method === "GET" ? "read" : "write",
    entity_type: p,
    entity_id: null,
    details: "{}",
  });

  if (p === "/api/meta") {
    return json({
      user: u,
      stages: STAGES,
      stageLabels: STAGE_LABELS,
      rejectReasons: REJECT_REASONS,
      sourceTypes: ["naukri", "linkedin", "referral", "consultancy", "direct"],
      retentionYears: 3,
      users: s.users,
      clients: s.clients,
      projects: s.projects,
      consultancies: s.consultancies,
      demoMode: true,
    });
  }
  if (p === "/api/dashboard") {
    const active = s.applications.filter((a) => a.outcome === "active");
    const byStage = STAGES.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      count: active.filter((a) => a.stage === stage).length,
    }));
    return json({
      kpis: {
        openJobs: s.jobs.filter((j) => j.status === "open").length,
        activeApps: active.length,
        offered: active.filter((a) => a.stage === "offered" || a.stage === "bgv").length,
        joined30: s.applications.filter((a) => a.outcome === "joined").length,
        dropped: s.applications.filter((a) => a.outcome === "dropped_out").length,
        rejected: s.applications.filter((a) => a.outcome === "rejected").length,
        avgTimeToFillDays: 42,
      },
      byStage,
      timeToFill: s.jobs.map((j) => ({
        id: j.id,
        title: j.title,
        created_at: j.created_at,
        target_closure_date: j.target_closure_date,
        joining_date: null,
        days_open: 40,
      })),
      sources: ["naukri", "linkedin", "referral", "consultancy", "direct"].map((source_type) => ({
        source_type,
        n: s.candidates.filter((c) => c.source_type === source_type).length,
        joined: 0,
        dropped: source_type === "naukri" ? 1 : 0,
      })),
      offerToJoin: {},
    });
  }
  if (p === "/api/jobs" && method === "GET") return json(s.jobs.map((j) => jobRow(s, j)));
  if (p === "/api/jobs" && method === "POST") {
    if (u.role === "hiring_manager") return json({ error: "Hiring managers cannot create requisitions" }, 403);
    const id = ++s.ids.job;
    const client = s.clients.find((c) => c.id === Number(body.client_id));
    const project = s.projects.find((pr) => pr.id === Number(body.project_id));
    const rec = s.users.find((x) => x.id === Number(body.recruiter_id));
    s.jobs.push({
      ...body,
      id,
      client_name: client?.name,
      project_name: project?.name,
      project_start: project?.start_date,
      billing_rate_inr: project?.billing_rate_inr,
      recruiter_name: rec?.name,
      created_at: now(),
    });
    return json({ id }, 201);
  }
  if (p.startsWith("/api/jobs/") && method === "PUT") {
    const id = Number(p.split("/").pop());
    const i = s.jobs.findIndex((j) => j.id === id);
    if (i >= 0) s.jobs[i] = { ...s.jobs[i], ...body };
    return json({ ok: true });
  }
  if (p === "/api/candidates" && method === "GET") {
    const skill = (url.searchParams.get("skill") || "").toLowerCase();
    const source = url.searchParams.get("source") || "";
    const q = (url.searchParams.get("q") || "").toLowerCase();
    let rows = s.candidates.map((c) => ({
      ...mask(u, c),
      consultancy_name: s.consultancies.find((x) => x.id === c.consultancy_id)?.name,
      application_count: s.applications.filter((a) => a.candidate_id === c.id).length,
    }));
    if (skill) rows = rows.filter((r) => (r.skills || "").toLowerCase().includes(skill));
    if (source) rows = rows.filter((r) => r.source_type === source);
    if (q) rows = rows.filter((r) => [r.name, r.email, r.phone, r.skills].join(" ").toLowerCase().includes(q));
    return json(rows);
  }
  if (p === "/api/candidates" && method === "POST") {
    if (!body.consent_given) return json({ error: "DPDP: consent required" }, 400);
    const phone = String(body.phone || "").replace(/\D/g, "");
    const dup = s.candidates.find((c) => c.phone === phone);
    if (dup) return json({ error: "Duplicate phone — candidate already exists.", candidate: dup }, 409);
    const id = ++s.ids.candidate;
    s.candidates.unshift({ ...body, id, phone, consent_given: 1, retention_until: "2029-08-20", consent_purpose: body.consent_purpose, updated_at: now() });
    return json({ id }, 201);
  }
  if (p === "/api/candidates/check-phone") {
    const phone = String(url.searchParams.get("phone") || "").replace(/\D/g, "");
    const row = s.candidates.find((c) => c.phone === phone);
    return json(row ? { duplicate: true, candidate: row } : { duplicate: false });
  }
  if (p.match(/^\/api\/candidates\/\d+$/) && method === "GET") {
    const id = Number(p.split("/").pop());
    const c = s.candidates.find((x) => x.id === id);
    if (!c) return json({ error: "Not found" }, 404);
    const applications = s.applications.filter((a) => a.candidate_id === id).map((a) => {
      const j = s.jobs.find((job) => job.id === a.job_id);
      return { ...a, job_title: j?.title, client_name: j?.client_name, project_name: j?.project_name, project_start: j?.project_start, notice_risk: noticeRisk(c.notice_period_days, j?.project_start) };
    });
    return json({
      candidate: mask(u, { ...c, consultancy_name: s.consultancies.find((x) => x.id === c.consultancy_id)?.name }),
      notes: s.notes.filter((n) => n.candidate_id === id),
      applications,
      history: s.history.filter((h) => applications.some((a) => a.id === h.application_id)),
      interviews: s.interviews.filter((i) => applications.some((a) => a.id === i.application_id)),
      offers: s.offers.filter((o) => applications.some((a) => a.id === o.application_id)),
    });
  }
  if (p.match(/^\/api\/candidates\/\d+\/notes$/) && method === "POST") {
    const id = Number(p.split("/")[3]);
    s.notes.unshift({ id: ++s.ids.note, candidate_id: id, author_id: u.id, author_name: u.name, body: body.body, created_at: now() });
    return json({ id: s.ids.note }, 201);
  }
  if (p === "/api/applications" && method === "POST") {
    const existing = s.applications.find((a) => a.candidate_id === body.candidate_id && a.job_id === body.job_id);
    if (existing) return json({ error: "Candidate already linked to this job", application: existing }, 409);
    const id = ++s.ids.app;
    s.applications.push({ id, candidate_id: body.candidate_id, job_id: body.job_id, stage: "applied", outcome: "active" });
    return json({ id }, 201);
  }
  if (p === "/api/pipeline") {
    const jobId = url.searchParams.get("jobId");
    const enrich = (a) => {
      const c = s.candidates.find((x) => x.id === a.candidate_id);
      const j = s.jobs.find((job) => job.id === a.job_id);
      return {
        ...a,
        ...mask(u, c),
        id: a.id,
        candidate_id: a.candidate_id,
        job_title: j?.title,
        client_name: j?.client_name,
        project_start: j?.project_start,
        notice_risk: noticeRisk(c.notice_period_days, j?.project_start),
      };
    };
    let items = s.applications.filter((a) => a.outcome === "active" || a.outcome === "joined");
    let terminal = s.applications.filter((a) => a.outcome === "rejected" || a.outcome === "dropped_out");
    if (jobId) {
      items = items.filter((a) => a.job_id === Number(jobId));
      terminal = terminal.filter((a) => a.job_id === Number(jobId));
    }
    return json({ columns: STAGES, items: items.map(enrich), terminal: terminal.map(enrich) });
  }
  if (p.match(/^\/api\/applications\/\d+\/move$/) && method === "POST") {
    const id = Number(p.split("/")[3]);
    const app = s.applications.find((a) => a.id === id);
    if (!app) return json({ error: "Not found" }, 404);
    if (body.outcome === "rejected" || body.outcome === "dropped_out") {
      Object.assign(app, body);
    }
    if (body.to_stage) {
      s.history.unshift({
        id: ++s.ids.hist,
        application_id: id,
        from_stage: app.stage,
        to_stage: body.to_stage,
        outcome: body.to_stage === "joined" ? "joined" : "active",
        moved_by_name: u.name,
        moved_at: now(),
        note: body.note,
      });
      app.stage = body.to_stage;
      app.outcome = body.to_stage === "joined" ? "joined" : "active";
    }
    return json({ ok: true });
  }
  if (p.match(/^\/api\/applications\/\d+\/interview$/) && method === "POST") {
    const id = Number(p.split("/")[3]);
    const app = s.applications.find((a) => a.id === id);
    const j = s.jobs.find((job) => job.id === app?.job_id);
    s.interviews.unshift({ id: ++s.ids.interview, application_id: id, job_id: app?.job_id, job_title: j?.title, ...body });
    return json({ id: s.ids.interview }, 201);
  }
  if (p.match(/^\/api\/applications\/\d+\/offer$/) && method === "POST") {
    const id = Number(p.split("/")[3]);
    const app = s.applications.find((a) => a.id === id);
    s.offers.unshift({ id: ++s.ids.offer, application_id: id, ...body });
    if (app) {
      app.stage = "offered";
      app.offered_ctc_lpa = body.offered_ctc_lpa;
      app.joining_date = body.joining_date;
    }
    return json({ id: s.ids.offer }, 201);
  }
  if (p === "/api/audit") {
    if (u.role !== "ta_head") return json({ error: "Audit log is limited to Head of TA" }, 403);
    return json(s.audit.slice(0, 200));
  }
  if (options.body instanceof FormData) return json({ filename: "demo-resume.pdf", original: "resume.pdf" });
  return json({ error: "Not found in demo" }, 404);
}
