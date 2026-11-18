/**
 * In-browser backend for the live website (GitHub Pages) and whenever the Node API is not running.
 * Seed data is exported from the real server seed at build time (scripts/export-demo-seed.js) and
 * the rules below mirror server/index.js, so the live site behaves like the local app.
 * Data lives in this browser only (localStorage); "Reset demo data" restores the seed.
 */
import SEED from "./demoSeed.json";

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
const HM_STAGES = STAGES.slice(2);
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
const SOURCE_TYPES = ["naukri", "linkedin", "referral", "consultancy", "direct"];
const STAFF_PASSWORD = "Meridian@2026";
const KEY = "meridian-ats-demo-v4";

const nowTs = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) =>
  Math.round((Date.parse(b.slice(0, 10) + "T00:00:00Z") - Date.parse(a.slice(0, 10) + "T00:00:00Z")) / 86400000);

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

// Shift every date in the seed so the demo is always "current", whenever it is opened.
function freshSeed() {
  const shift = daysBetween(SEED.exportedOn, today());
  const text = JSON.stringify(SEED).replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (m) => addDays(m, shift));
  const s = JSON.parse(text);
  for (const u of s.users) u.password = STAFF_PASSWORD;
  s.application_forms = [];
  s.audit = [];
  const max = (arr) => arr.reduce((m, r) => Math.max(m, r.id), 0);
  s.ids = {};
  for (const t of ["jobs", "candidates", "applications", "stage_history", "notes", "interviews", "offers", "application_forms"]) {
    s.ids[t] = max(s[t]) + 100;
  }
  return s;
}

let memory = null;
function state() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw);
  } catch {
    /* storage unavailable — use memory only */
  }
  if (!memory) memory = freshSeed();
  return memory;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* quota or private mode — keep in memory */
  }
}
export function resetDemo() {
  memory = freshSeed();
  save();
}

export let demoActive = false;
export function enableDemo() {
  demoActive = true;
}

class HttpError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
const fail = (status, message, extra) => {
  throw new HttpError(status, message, { error: message, ...(extra || {}) });
};

// ---------- joins & rules (mirror server/index.js) ----------

const byId = (arr, id) => arr.find((x) => x.id === Number(id));
const isHM = (u) => u.role === "hiring_manager";
const canSeeComp = (u) => u.role === "recruiter" || u.role === "ta_head";

function mask(u, row) {
  if (canSeeComp(u)) return row;
  return { ...row, current_ctc_lpa: null, expected_ctc_lpa: null, offered_ctc_lpa: null, compensation_masked: true };
}

function jobView(s, j) {
  const cl = byId(s.clients, j.client_id);
  const p = byId(s.projects, j.project_id);
  const r = byId(s.users, j.recruiter_id);
  return {
    ...j,
    client_name: cl?.name,
    project_name: p?.name,
    project_start: p?.start_date,
    billing_rate_inr: p?.billing_rate_inr,
    recruiter_name: r?.name,
    active_pipeline: s.applications.filter((a) => a.job_id === j.id && a.outcome === "active").length,
  };
}

function noticeRisk(noticeDays, projectStart) {
  if (!projectStart) return { level: "unknown", untilStart: null };
  const untilStart = daysBetween(today(), projectStart);
  if (noticeDays > untilStart) return { level: "high", untilStart };
  if (noticeDays > untilStart - 14) return { level: "medium", untilStart };
  return { level: "low", untilStart };
}

const notesText = (s, cid) => s.notes.filter((n) => n.candidate_id === cid).map((n) => n.body).join(" ");

function offerRisk(a, c, text) {
  if (a.outcome !== "active" || !["client_round", "offered", "bgv"].includes(a.stage)) return null;
  let score = 0;
  const reasons = [];
  if (c.holds_other_offers) { score += 3; reasons.push("Holds other offers"); }
  else if (/(competing|counter|other)[ -]offer/i.test(text || "")) { score += 2; reasons.push("Notes mention a competing offer"); }
  if (c.notice_period_days >= 60) { score += 2; reasons.push(c.notice_period_days + "-day notice"); }
  else if (c.notice_period_days >= 30) { score += 1; reasons.push(c.notice_period_days + "-day notice"); }
  if (a.offered_ctc_lpa && c.expected_ctc_lpa && a.offered_ctc_lpa < c.expected_ctc_lpa) {
    score += 2;
    reasons.push("Offer below expected CTC");
  }
  return { level: score >= 5 ? "high" : score >= 3 ? "medium" : "low", score, reasons };
}

function hmVisibleApps(s, u) {
  const mine = new Set(s.jobs.filter((j) => j.hiring_manager_id === u.id).map((j) => j.id));
  return s.applications.filter(
    (a) => mine.has(a.job_id) && (a.outcome === "active" || a.outcome === "joined") && HM_STAGES.includes(a.stage)
  );
}

function history(s, appId, from, to, outcome, u, note) {
  s.stage_history.push({
    id: ++s.ids.stage_history, application_id: appId, from_stage: from, to_stage: to, outcome,
    moved_by: u?.id ?? null, moved_at: nowTs(), note: note || null,
  });
}

function audit(s, u, action, entity_type, entity_id, details) {
  s.audit.unshift({
    id: (s.audit[0]?.id || 0) + 1, user_id: u?.id ?? null, user_name: u?.name ?? null, action, entity_type,
    entity_id, details: details ? JSON.stringify(details) : null, created_at: nowTs(),
  });
  if (s.audit.length > 300) s.audit.length = 300;
}

function erase(s, id) {
  const c = byId(s.candidates, id);
  if (!c) return false;
  s.notes = s.notes.filter((n) => n.candidate_id !== c.id);
  const appIds = new Set(s.applications.filter((a) => a.candidate_id === c.id).map((a) => a.id));
  s.application_forms = s.application_forms.filter((f) => !appIds.has(f.application_id));
  for (const a of s.applications) {
    if (a.candidate_id === c.id && a.outcome === "active") {
      a.outcome = "dropped_out";
      a.dropout_reason = a.dropout_reason || "Data erased (DPDP)";
    }
  }
  Object.assign(c, {
    name: `Erased candidate #${c.id}`, phone: `ERASED-${c.id}`, email: `erased-${c.id}@invalid`,
    current_company: null, current_ctc_lpa: null, expected_ctc_lpa: null, skills: "", source_detail: null,
    referred_by: null, resume_path: null, resume_original_name: null, portal_password: Math.random().toString(36),
    consent_given: 0, erased_at: nowTs(),
  });
  return true;
}

// ---------- request entry point ----------

export async function demoRequest(path, options = {}, userId = 2, session = null) {
  enableDemo();
  const s = state();
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://local.demo");
  const qp = (k) => url.searchParams.get(k) || "";
  let body = {};
  if (options.body instanceof FormData) {
    options.body.forEach((v, k) => {
      if (typeof v === "string") body[k] = v;
    });
    if (body.job_id) body.job_id = Number(body.job_id);
  } else if (options.body) {
    body = JSON.parse(options.body);
  }
  try {
    return route(s, method, url.pathname, qp, body, options, userId, session);
  } catch (e) {
    if (e instanceof HttpError) {
      const err = new Error(e.message);
      err.status = e.status;
      err.data = e.data;
      throw err;
    }
    throw e;
  } finally {
    if (method !== "GET" || url.pathname.startsWith("/api/candidates/")) save();
  }
}

function route(s, method, p, qp, body, options, userId, session) {
  const m = (re) => p.match(re);

  // ---- public / auth ----
  if (p === "/api/auth/demo-accounts") {
    return {
      staffPassword: STAFF_PASSWORD,
      candidatePassword: "Welcome@123",
      staff: s.users.map(({ password, ...rest }) => rest),
      candidates: s.candidates.filter((c) => !c.erased_at).slice(0, 8).map((c) => ({ name: c.name, email: c.email, phone: c.phone })),
    };
  }
  if (p === "/api/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    if (body.portal === "candidate") {
      const c = s.candidates.find((x) => x.email.toLowerCase() === email && !x.erased_at);
      if (!c || c.portal_password !== body.password) fail(401, "Invalid candidate email or password");
      return { type: "candidate", candidate: { id: c.id, name: c.name, email: c.email, phone: c.phone } };
    }
    const u = s.users.find((x) => x.email.toLowerCase() === email);
    if (!u || u.password !== body.password) fail(401, "Invalid recruiter email or password");
    audit(s, u, "login", "user", u.id, { portal: "staff" });
    return { type: "staff", user: { id: u.id, name: u.name, email: u.email, role: u.role } };
  }

  // ---- candidate portal ----
  if (p.startsWith("/api/portal/")) {
    const c = byId(s.candidates, session?.candidate?.id);
    if (!c || c.erased_at) fail(401, "Please log in as a candidate");
    if (p === "/api/portal/jobs") {
      const applied = new Set(s.applications.filter((a) => a.candidate_id === c.id).map((a) => a.job_id));
      return s.jobs.filter((j) => j.status === "open").map((j) => ({
        id: j.id, title: j.title, skills_required: j.skills_required, description: j.description,
        requirements: j.requirements, pay: j.pay, benefits: j.benefits, exp_min_years: j.exp_min_years,
        exp_max_years: j.exp_max_years, location: j.location, target_closure_date: j.target_closure_date,
        client_name: byId(s.clients, j.client_id)?.name, applied: applied.has(j.id),
      }));
    }
    if (p === "/api/portal/me") {
      const applications = s.applications.filter((a) => a.candidate_id === c.id).map((a) => {
        const j = byId(s.jobs, a.job_id);
        return {
          id: a.id, stage: a.stage, outcome: a.outcome, joining_date: a.joining_date, job_title: j?.title,
          location: j?.location, client_name: byId(s.clients, j?.client_id)?.name, stage_label: STAGE_LABELS[a.stage],
        };
      });
      return {
        candidate: {
          id: c.id, name: c.name, email: c.email, phone: c.phone, notice_period_days: c.notice_period_days,
          skills: c.skills, total_experience_years: c.total_experience_years,
        },
        applications,
        stageLabels: STAGE_LABELS,
      };
    }
    if (p === "/api/portal/apply" && method === "POST") {
      const job = byId(s.jobs, body.job_id);
      if (!job || job.status !== "open") fail(404, "Job not found");
      if (s.applications.some((a) => a.candidate_id === c.id && a.job_id === job.id)) fail(409, "You have already applied to this role");
      const fd = options.body instanceof FormData ? options.body : null;
      const cv = fd?.get("cv");
      if (!cv || !cv.name) fail(400, "Please attach your CV as a PDF");
      if (!/\.pdf$/i.test(cv.name)) fail(400, "CV must be a PDF");
      const id = ++s.ids.applications;
      s.applications.push({
        id, candidate_id: c.id, job_id: job.id, stage: "applied", outcome: "active", bgv_status: "not_started",
        created_at: nowTs(), updated_at: nowTs(),
      });
      history(s, id, null, "applied", "active", null, "Candidate self-apply");
      const { job_id, ...answers } = body;
      if (answers.other_offers === "Yes") c.holds_other_offers = 1;
      s.application_forms.push({
        id: ++s.ids.application_forms, application_id: id, answers_json: JSON.stringify(answers),
        cv_filename: cv.name, cover_letter_filename: fd.get("cover_letter")?.name || null, other_docs: "",
        created_at: nowTs(),
      });
      audit(s, null, "create", "application", id, { candidate_id: c.id, job_id: job.id, source: "portal" });
      return { id };
    }
    if (p === "/api/portal/erase" && method === "POST") {
      erase(s, c.id);
      audit(s, null, "erase", "candidate", c.id, { reason: "candidate withdrew consent" });
      return { ok: true };
    }
    fail(404, "Not found");
  }

  // ---- staff area ----
  if (session?.type === "candidate") fail(403, "This area is for recruiters and hiring managers only");
  const u = byId(s.users, session?.type === "staff" ? session.user.id : userId) || s.users[1];

  if (p === "/api/meta") {
    return {
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
      stages: STAGES, stageLabels: STAGE_LABELS, rejectReasons: REJECT_REASONS, sourceTypes: SOURCE_TYPES,
      retentionYears: 3,
      users: s.users.map(({ password, ...r }) => r),
      clients: s.clients,
      projects: s.projects.map((pr) => ({ ...pr, client_name: byId(s.clients, pr.client_id)?.name })),
      consultancies: s.consultancies,
      demoMode: true,
    };
  }

  if (p === "/api/dashboard") return dashboard(s);

  if (p === "/api/jobs" && method === "GET") {
    const jobs = s.jobs.map((j) => jobView(s, j)).sort((a, b) => a.target_closure_date.localeCompare(b.target_closure_date));
    return isHM(u) ? jobs.filter((j) => j.hiring_manager_id === u.id) : jobs;
  }
  if ((p === "/api/jobs" && method === "POST") || (m(/^\/api\/jobs\/\d+$/) && method === "PUT")) {
    if (isHM(u)) fail(403, "Hiring managers cannot create or edit requisitions");
    const fields = ["title", "client_id", "project_id", "skills_required", "exp_min_years", "exp_max_years",
      "ctc_min_lpa", "ctc_max_lpa", "location", "target_closure_date", "recruiter_id", "status", "description",
      "requirements", "pay", "benefits", "hiring_manager_id", "openings"];
    const clean = Object.fromEntries(fields.map((f) => [f, body[f] ?? null]));
    if (method === "POST") {
      const id = ++s.ids.jobs;
      s.jobs.push({ ...clean, id, status: clean.status || "open", openings: clean.openings || 1, created_at: nowTs(), updated_at: nowTs() });
      audit(s, u, "create", "job", id, { title: clean.title });
      return { id };
    }
    const j = byId(s.jobs, p.split("/").pop());
    if (!j) fail(404, "Job not found");
    Object.assign(j, clean, { updated_at: nowTs() });
    audit(s, u, "update", "job", j.id, { title: clean.title });
    return { ok: true };
  }

  if (p === "/api/candidates/check-phone") {
    const phone = normalizePhone(qp("phone"));
    const c = s.candidates.find((x) => x.phone === phone);
    if (!c || c.id === Number(qp("excludeId") || 0)) return { duplicate: false };
    const activeWith = s.applications
      .filter((a) => a.candidate_id === c.id && a.outcome === "active")
      .map((a) => {
        const j = byId(s.jobs, a.job_id);
        return { title: j?.title, recruiter_name: byId(s.users, j?.recruiter_id)?.name, stage: a.stage };
      });
    return { duplicate: true, candidate: { id: c.id, name: c.name, email: c.email, phone: c.phone }, activeWith };
  }
  if (p === "/api/candidates" && method === "GET") {
    let rows = s.candidates.filter((c) => !c.erased_at);
    if (isHM(u)) {
      const allowed = new Set(hmVisibleApps(s, u).map((a) => a.candidate_id));
      rows = rows.filter((c) => allowed.has(c.id));
    }
    const skill = qp("skill").toLowerCase().trim();
    const source = qp("source");
    const q = qp("q").toLowerCase().trim();
    const maxNotice = Number(qp("maxNotice") || 0);
    if (skill) rows = rows.filter((r) => (r.skills || "").toLowerCase().includes(skill));
    if (source) rows = rows.filter((r) => r.source_type === source);
    if (maxNotice) rows = rows.filter((r) => r.notice_period_days <= maxNotice);
    if (q) rows = rows.filter((r) => [r.name, r.email, r.phone, r.current_company, r.skills].join(" ").toLowerCase().includes(q));
    return rows
      .map((c) => mask(u, {
        ...c,
        consultancy_name: c.consultancy_id ? byId(s.consultancies, c.consultancy_id)?.name : null,
        application_count: s.applications.filter((a) => a.candidate_id === c.id).length,
      }))
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  }
  if (p === "/api/candidates" && method === "POST") {
    if (isHM(u)) fail(403, "Hiring managers cannot add candidates");
    const phone = normalizePhone(body.phone);
    if (!phone || phone.length < 10) fail(400, "Valid phone is required");
    const dup = s.candidates.find((c) => c.phone === phone);
    if (dup) fail(409, "Duplicate phone — candidate already exists. Do not re-outreach without checking history.", { candidate: dup });
    if (!body.consent_given) fail(400, "DPDP: explicit consent is required before storing candidate personal data.");
    const id = ++s.ids.candidates;
    s.candidates.unshift({
      id, name: body.name, phone, email: body.email, current_company: body.current_company || null,
      current_ctc_lpa: body.current_ctc_lpa ?? null, expected_ctc_lpa: body.expected_ctc_lpa ?? null,
      notice_period_days: Number(body.notice_period_days || 0), total_experience_years: Number(body.total_experience_years || 0),
      skills: body.skills || "", source_type: body.source_type, source_detail: body.source_detail || null,
      consultancy_id: body.consultancy_id || null, referred_by: body.referred_by || null, portal_password: "Welcome@123",
      holds_other_offers: body.holds_other_offers ? 1 : 0, consent_given: 1, consent_at: nowTs(),
      consent_purpose: body.consent_purpose || "Recruitment for client-delivery roles at Meridian Technologies",
      retention_until: addDays(today(), 3 * 365), created_at: nowTs(), updated_at: nowTs(),
    });
    audit(s, u, "create", "candidate", id, { phone });
    return { id };
  }
  if (m(/^\/api\/candidates\/\d+$/) && method === "GET") return candidateDetail(s, u, Number(p.split("/").pop()));
  if (m(/^\/api\/candidates\/\d+$/) && method === "PUT") {
    if (isHM(u)) fail(403, "Hiring managers cannot edit candidate records");
    const c = byId(s.candidates, p.split("/").pop());
    if (!c) fail(404, "Not found");
    const phone = normalizePhone(body.phone);
    if (s.candidates.some((x) => x.phone === phone && x.id !== c.id)) fail(409, "Phone already belongs to another candidate");
    Object.assign(c, body, { phone, updated_at: nowTs() });
    return { ok: true };
  }
  if (m(/^\/api\/candidates\/\d+\/resume$/)) {
    if (isHM(u)) fail(403, "Only recruiters upload resumes");
    const c = byId(s.candidates, p.split("/")[3]);
    const f = options.body instanceof FormData ? options.body.get("resume") : null;
    c.resume_original_name = f?.name || "resume.pdf";
    c.resume_path = null; // the browser demo records the file name only
    return { filename: null, original: c.resume_original_name };
  }
  if (m(/^\/api\/candidates\/\d+\/notes$/) && method === "POST") {
    const text = String(body.body || "").trim();
    if (!text) fail(400, "Note cannot be empty");
    const id = ++s.ids.notes;
    s.notes.push({ id, candidate_id: Number(p.split("/")[3]), author_id: u.id, body: text, created_at: nowTs() });
    return { id };
  }

  if (p === "/api/applications" && method === "POST") {
    if (isHM(u)) fail(403, "Only recruiters link candidates to jobs");
    const cid = Number(body.candidate_id);
    const jid = Number(body.job_id);
    const existing = s.applications.find((a) => a.candidate_id === cid && a.job_id === jid);
    if (existing) fail(409, "Candidate already linked to this job", { application: existing });
    const id = ++s.ids.applications;
    s.applications.push({
      id, candidate_id: cid, job_id: jid, stage: "applied", outcome: "active", bgv_status: "not_started",
      created_at: nowTs(), updated_at: nowTs(),
    });
    history(s, id, null, "applied", "active", u, "Linked to requisition");
    return { id };
  }

  if (p === "/api/pipeline") return pipeline(s, u, Number(qp("jobId") || 0));

  const appMatch = m(/^\/api\/applications\/(\d+)\/(move|interview|offer|bgv)$/);
  if (appMatch && method === "POST") return applicationAction(s, u, Number(appMatch[1]), appMatch[2], body);

  if (p === "/api/privacy/retention") {
    if (u.role !== "ta_head") fail(403, "Limited to Head of TA");
    const t = today();
    return s.candidates
      .filter((c) => !c.erased_at && c.retention_until <= t)
      .map((c) => ({
        id: c.id, name: c.name, email: c.email, created_at: c.created_at, retention_until: c.retention_until,
        active_apps: s.applications.filter((a) => a.candidate_id === c.id && a.outcome === "active").length,
      }));
  }
  if (m(/^\/api\/privacy\/erase\/\d+$/) && method === "POST") {
    if (u.role !== "ta_head") fail(403, "Limited to Head of TA");
    const id = Number(p.split("/").pop());
    if (!erase(s, id)) fail(404, "Not found");
    audit(s, u, "erase", "candidate", id, { reason: body.reason || "retention expired" });
    return { ok: true };
  }
  if (p === "/api/audit") {
    if (u.role !== "ta_head") fail(403, "Audit log is limited to Head of TA");
    return s.audit.slice(0, 200);
  }
  fail(404, "Not found in demo");
}

function dashboard(s) {
  const t = today();
  const active = s.applications.filter((a) => a.outcome === "active");
  const offeredIds = new Set(s.stage_history.filter((h) => h.to_stage === "offered").map((h) => h.application_id));
  const cohort = s.applications.filter(
    (a) => ["offered", "bgv", "joined"].includes(a.stage) || a.outcome === "joined" || offeredIds.has(a.id)
  );
  const oc = {
    offered: cohort.length,
    joined: cohort.filter((a) => a.outcome === "joined").length,
    dropped: cohort.filter((a) => a.outcome === "dropped_out").length,
    pending: cohort.filter((a) => a.outcome === "active").length,
  };
  const decided = oc.joined + oc.dropped;
  oc.dropRatePct = decided ? Math.round((oc.dropped / decided) * 100) : null;

  const groups = {};
  for (const a of s.applications) {
    const c = byId(s.candidates, a.candidate_id);
    if (!c) continue;
    const cons = c.consultancy_id ? byId(s.consultancies, c.consultancy_id) : null;
    const key = c.source_type === "consultancy" ? `consultancy: ${cons?.name || "other"}` : c.source_type;
    const g = (groups[key] ||= { source: key, applications: 0, client_round_plus: 0, joined: 0, dropped: 0, fee_inr: 0 });
    g.applications++;
    if (["client_round", "offered", "bgv", "joined"].includes(a.stage)) g.client_round_plus++;
    if (a.outcome === "joined") {
      g.joined++;
      if (c.source_type === "consultancy") g.fee_inr += ((a.offered_ctc_lpa || 0) * 100000 * (cons?.fee_percent || 8.33)) / 100;
    }
    if (a.outcome === "dropped_out") g.dropped++;
  }
  const sourceRows = Object.values(groups)
    .map((g) => ({ ...g, joinRatePct: g.applications ? Math.round((g.joined / g.applications) * 100) : 0 }))
    .sort((a, b) => b.applications - a.applications);

  const atRisk = active
    .map((a) => {
      const c = byId(s.candidates, a.candidate_id);
      return { id: a.id, candidate_id: c.id, name: c.name, job_title: byId(s.jobs, a.job_id)?.title, stage: a.stage, risk: offerRisk(a, c, notesText(s, c.id)) };
    })
    .filter((r) => r.risk && r.risk.level !== "low")
    .sort((x, y) => y.risk.score - x.risk.score);

  const upcoming = s.interviews
    .filter((i) => i.scheduled_at.slice(0, 10) >= t && i.scheduled_at.slice(0, 10) <= addDays(t, 7))
    .map((i) => {
      const a = byId(s.applications, i.application_id);
      return { ...i, name: byId(s.candidates, a?.candidate_id)?.name, job_title: byId(s.jobs, a?.job_id)?.title, candidate_id: a?.candidate_id };
    });

  const joinedApps = s.applications.filter((a) => a.outcome === "joined" && a.joining_date);
  const fillDays = joinedApps.map((a) => daysBetween(byId(s.jobs, a.job_id).created_at, a.joining_date));
  const timeToFill = s.jobs
    .filter((j) => j.status === "open" || j.status === "filled")
    .map((j) => {
      const ja = joinedApps.find((a) => a.job_id === j.id);
      return {
        id: j.id, title: j.title, created_at: j.created_at, target_closure_date: j.target_closure_date,
        joining_date: ja?.joining_date || null, days_open: daysBetween(j.created_at, ja?.joining_date || t),
      };
    });

  return {
    offerCohort: oc,
    sourceRows,
    atRisk,
    upcoming,
    kpis: {
      openJobs: s.jobs.filter((j) => j.status === "open").length,
      activeApps: active.length,
      offered: active.filter((a) => a.stage === "offered" || a.stage === "bgv").length,
      joined30: joinedApps.filter((a) => a.joining_date >= addDays(t, -30)).length,
      dropped: s.applications.filter((a) => a.outcome === "dropped_out").length,
      rejected: s.applications.filter((a) => a.outcome === "rejected").length,
      avgTimeToFillDays: fillDays.length ? Math.round(fillDays.reduce((x, y) => x + y, 0) / fillDays.length) : null,
    },
    byStage: STAGES.map((stage) => ({ stage, label: STAGE_LABELS[stage], count: active.filter((a) => a.stage === stage).length })),
    timeToFill,
  };
}

function candidateDetail(s, u, id) {
  const c = byId(s.candidates, id);
  if (!c) fail(404, "Not found");
  let apps = s.applications.filter((a) => a.candidate_id === c.id);
  if (isHM(u)) {
    const vis = new Set(hmVisibleApps(s, u).map((a) => a.id));
    apps = apps.filter((a) => vis.has(a.id));
    if (!apps.length) fail(403, "Hiring managers can only open shortlisted candidates for their own roles");
  }
  const text = notesText(s, c.id);
  const appIds = new Set(apps.map((a) => a.id));
  const jobTitleFor = (appId) => byId(s.jobs, byId(s.applications, appId)?.job_id)?.title;
  audit(s, u, "read", "candidate", c.id, { name: c.name });
  return {
    candidate: mask(u, { ...c, consultancy_name: c.consultancy_id ? byId(s.consultancies, c.consultancy_id)?.name : null }),
    notes: s.notes
      .filter((n) => n.candidate_id === c.id)
      .map((n) => ({ ...n, author_name: byId(s.users, n.author_id)?.name }))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    forms: isHM(u) ? [] : s.application_forms.filter((f) => appIds.has(f.application_id)),
    applications: apps.map((a) => {
      const v = jobView(s, byId(s.jobs, a.job_id));
      const row = {
        ...a, job_title: v.title, location: v.location, target_closure_date: v.target_closure_date,
        client_name: v.client_name, project_name: v.project_name, project_start: v.project_start,
        billing_rate_inr: v.billing_rate_inr,
      };
      return {
        ...(isHM(u) ? { ...row, offered_ctc_lpa: null } : row),
        notice_risk: noticeRisk(c.notice_period_days, v.project_start),
        offer_risk: offerRisk(a, c, text),
      };
    }),
    history: s.stage_history
      .filter((h) => appIds.has(h.application_id))
      .map((h) => ({ ...h, moved_by_name: byId(s.users, h.moved_by)?.name }))
      .sort((a, b) => String(b.moved_at).localeCompare(String(a.moved_at))),
    interviews: s.interviews.filter((i) => appIds.has(i.application_id)).map((i) => ({ ...i, job_title: jobTitleFor(i.application_id) })),
    offers: s.offers
      .filter((o) => appIds.has(o.application_id))
      .map((o) => ({ ...o, offered_ctc_lpa: canSeeComp(u) ? o.offered_ctc_lpa : null, job_title: jobTitleFor(o.application_id) })),
  };
}

function pipeline(s, u, jobId) {
  let items = isHM(u) ? hmVisibleApps(s, u) : s.applications.filter((a) => a.outcome === "active" || a.outcome === "joined");
  let terminal = isHM(u) ? [] : s.applications.filter((a) => a.outcome === "rejected" || a.outcome === "dropped_out");
  if (jobId) {
    items = items.filter((a) => a.job_id === jobId);
    terminal = terminal.filter((a) => a.job_id === jobId);
  }
  const enrich = (a) => {
    const c = byId(s.candidates, a.candidate_id);
    const v = jobView(s, byId(s.jobs, a.job_id));
    const row = mask(u, {
      ...a, name: c.name, phone: c.phone, email: c.email, notice_period_days: c.notice_period_days,
      total_experience_years: c.total_experience_years, skills: c.skills, source_type: c.source_type,
      expected_ctc_lpa: c.expected_ctc_lpa, current_ctc_lpa: c.current_ctc_lpa, holds_other_offers: c.holds_other_offers,
      job_title: v.title, location: v.location, client_name: v.client_name, project_name: v.project_name,
      project_start: v.project_start, billing_rate_inr: v.billing_rate_inr, target_closure_date: v.target_closure_date,
    });
    return { ...row, notice_risk: noticeRisk(c.notice_period_days, v.project_start), offer_risk: offerRisk(a, c, notesText(s, c.id)) };
  };
  return { columns: isHM(u) ? HM_STAGES : STAGES, items: items.map(enrich), terminal: terminal.map(enrich) };
}

function applicationAction(s, u, appId, action, body) {
  const a = byId(s.applications, appId);
  if (!a) fail(404, "Application not found");
  if (isHM(u)) fail(403, "Hiring managers can review and add notes, but recruiters update the pipeline");

  if (action === "move") {
    const { to_stage, outcome } = body;
    if (outcome === "rejected" || outcome === "dropped_out") {
      Object.assign(a, {
        outcome, reject_reason_code: body.reject_reason_code || null, reject_notes: body.reject_notes || null,
        dropout_reason: body.dropout_reason || null, updated_at: nowTs(),
      });
      history(s, a.id, a.stage, a.stage, outcome, u, body.reject_notes || body.dropout_reason || outcome);
      return { ok: true };
    }
    if (outcome === "active" && a.outcome !== "active") {
      Object.assign(a, { outcome: "active", reject_reason_code: null, reject_notes: null, dropout_reason: null });
    }
    if (to_stage) {
      if (!STAGES.includes(to_stage)) fail(400, "Invalid stage");
      const from = STAGES.indexOf(a.stage);
      const to = STAGES.indexOf(to_stage);
      if (to > from + 1) {
        fail(400, `Move one stage at a time — next is ${STAGE_LABELS[STAGES[from + 1]]}. Client round and BGV cannot be skipped.`);
      }
      if (to_stage === "joined" && a.bgv_status !== "clear") {
        fail(400, "Background verification must be marked Clear before the candidate can be marked Joined.");
      }
      const next = to_stage === "joined" ? "joined" : "active";
      history(s, a.id, a.stage, to_stage, next, u, body.note);
      Object.assign(a, { stage: to_stage, outcome: next, updated_at: nowTs() });
      if (to_stage === "joined" && !a.joining_date) a.joining_date = today();
      audit(s, u, "stage_move", "application", a.id, { to: to_stage });
    }
    return { ok: true };
  }
  if (action === "interview") {
    const id = ++s.ids.interviews;
    s.interviews.push({
      id, application_id: a.id, round_type: body.round_type, panel_names: body.panel_names,
      scheduled_at: body.scheduled_at, location_or_link: body.location_or_link || null, created_by: u.id, created_at: nowTs(),
    });
    return { id };
  }
  if (action === "offer") {
    if (!["client_round", "offered", "bgv"].includes(a.stage)) {
      fail(400, "An offer can only be made after the client round (client approval is required).");
    }
    const id = ++s.ids.offers;
    s.offers.push({
      id, application_id: a.id, offered_ctc_lpa: body.offered_ctc_lpa, joining_date: body.joining_date,
      status: body.status || "pending", created_by: u.id, created_at: nowTs(),
    });
    const declined = body.status === "declined";
    const nextStage = a.stage === "bgv" ? "bgv" : "offered";
    history(s, a.id, a.stage, nextStage, declined ? "dropped_out" : "active", u, `Offer ${body.offered_ctc_lpa} LPA, join ${body.joining_date}`);
    Object.assign(a, {
      offered_ctc_lpa: body.offered_ctc_lpa, joining_date: body.joining_date, offer_status: body.status || "pending",
      stage: nextStage, outcome: declined ? "dropped_out" : "active", dropout_reason: declined ? "Declined our offer" : null,
      updated_at: nowTs(),
    });
    return { id };
  }
  if (!["not_started", "in_progress", "clear", "discrepancy"].includes(body.bgv_status)) fail(400, "Invalid BGV status");
  a.bgv_status = body.bgv_status;
  return { ok: true };
}
