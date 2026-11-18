const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { openDb, UPLOAD_DIR } = require("./db");
const { seed } = require("./seed");
const {
  STAGES,
  STAGE_LABELS,
  REJECT_REASONS,
  SOURCE_TYPES,
  RETENTION_YEARS,
  retentionUntil,
  daysUntil,
} = require("./constants");

const PORT = process.env.PORT || 4000;
const db = openDb();
seed(db);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.originalname);
    cb(ok ? null : new Error("Attach PDF, Word, or image files only"), ok);
  },
});
const applyUpload = upload;

function currentUser(req) {
  const id = Number(req.header("x-user-id") || 2);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || db.prepare("SELECT * FROM users WHERE id = 2").get();
}

function audit(userId, action, entityType, entityId, details) {
  db.prepare(
    "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, action, entityType, entityId, details ? JSON.stringify(details) : null);
}

function canSeeCompensation(user) {
  return user.role === "recruiter" || user.role === "ta_head";
}

function maskCandidate(user, c) {
  if (canSeeCompensation(user)) return c;
  const { current_ctc_lpa, expected_ctc_lpa, offered_ctc_lpa, ...rest } = c;
  return { ...rest, current_ctc_lpa: null, expected_ctc_lpa: null, offered_ctc_lpa: null, compensation_masked: true };
}

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const HM_STAGES = ["internal_interview", "client_round", "offered", "bgv", "joined"];
const HM_STAGE_SQL = "('internal_interview','client_round','offered','bgv','joined')";
function isHM(user) {
  return user.role === "hiring_manager";
}

function offerRisk(a, c, notesText) {
  if (a.outcome !== "active" || !["client_round", "offered", "bgv"].includes(a.stage)) return null;
  let score = 0;
  const reasons = [];
  if (c.holds_other_offers) { score += 3; reasons.push("Holds other offers"); }
  else if (/(competing|counter|other)[ -]offer/i.test(notesText || "")) { score += 2; reasons.push("Notes mention a competing offer"); }
  if (c.notice_period_days >= 60) { score += 2; reasons.push(c.notice_period_days + "-day notice"); }
  else if (c.notice_period_days >= 30) { score += 1; reasons.push(c.notice_period_days + "-day notice"); }
  if (a.offered_ctc_lpa && c.expected_ctc_lpa && a.offered_ctc_lpa < c.expected_ctc_lpa) {
    score += 2; reasons.push("Offer below expected CTC");
  }
  const level = score >= 5 ? "high" : score >= 3 ? "medium" : "low";
  return { level, score, reasons };
}

function noticeRisk(noticeDays, projectStart) {
  const untilStart = daysUntil(projectStart);
  if (untilStart == null) return { level: "unknown", untilStart: null };
  if (noticeDays > untilStart) return { level: "high", untilStart };
  if (noticeDays > untilStart - 14) return { level: "medium", untilStart };
  return { level: "low", untilStart };
}

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/portal")) return next();
  if (req.header("x-auth-role") === "candidate") {
    return res.status(403).json({ error: "This area is for recruiters and hiring managers only" });
  }
  next();
});

app.get("/api/auth/demo-accounts", (_req, res) => {
  res.json({
    staffPassword: "Meridian@2026",
    candidatePassword: "Welcome@123",
    staff: db.prepare("SELECT name, email, role FROM users ORDER BY id").all(),
    candidates: db.prepare("SELECT name, email, phone FROM candidates ORDER BY id LIMIT 8").all(),
  });
});

app.post("/api/auth/login", (req, res) => {
  const portal = req.body.portal === "candidate" ? "candidate" : "staff";
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  if (portal === "staff") {
    const user = db.prepare("SELECT * FROM users WHERE lower(email) = ?").get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid recruiter email or password" });
    }
    audit(user.id, "login", "user", user.id, { portal: "staff" });
    return res.json({
      type: "staff",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }

  const candidate = db.prepare("SELECT * FROM candidates WHERE lower(email) = ?").get(email);
  if (!candidate || candidate.portal_password !== password) {
    return res.status(401).json({ error: "Invalid candidate email or password" });
  }
  audit(null, "login", "candidate", candidate.id, { portal: "candidate" });
  return res.json({
    type: "candidate",
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
    },
  });
});

function currentCandidate(req) {
  const id = Number(req.header("x-candidate-id") || 0);
  return db.prepare("SELECT * FROM candidates WHERE id = ?").get(id);
}

app.get("/api/portal/jobs", (req, res) => {
  const c = currentCandidate(req);
  if (!c) return res.status(401).json({ error: "Please log in as a candidate" });
  const jobs = db.prepare(`
    SELECT j.id, j.title, j.skills_required, j.description, j.requirements, j.pay, j.benefits,
           j.exp_min_years, j.exp_max_years,
           j.location, j.target_closure_date, cl.name AS client_name
    FROM jobs j JOIN clients cl ON cl.id = j.client_id
    WHERE j.status = 'open'
    ORDER BY j.target_closure_date
  `).all();
  const applied = new Set(
    db.prepare("SELECT job_id FROM applications WHERE candidate_id = ?").all(c.id).map((r) => r.job_id)
  );
  res.json(jobs.map((j) => ({ ...j, applied: applied.has(j.id) })));
});

app.get("/api/portal/me", (req, res) => {
  const c = currentCandidate(req);
  if (!c) return res.status(401).json({ error: "Please log in as a candidate" });
  audit(null, "read", "candidate_portal", c.id, {});
  const applications = db.prepare(`
    SELECT a.id, a.stage, a.outcome, a.joining_date, a.reject_reason_code,
           j.title AS job_title, j.location, cl.name AS client_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN clients cl ON cl.id = j.client_id
    WHERE a.candidate_id = ?
    ORDER BY a.updated_at DESC
  `).all(c.id);
  res.json({
    candidate: {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      notice_period_days: c.notice_period_days,
      skills: c.skills,
    },
    applications: applications.map((a) => ({ ...a, stage_label: STAGE_LABELS[a.stage] })),
    stageLabels: STAGE_LABELS,
  });
});

app.post("/api/portal/apply", applyUpload.fields([
  { name: "cv", maxCount: 1 },
  { name: "cover_letter", maxCount: 1 },
  { name: "other_docs", maxCount: 5 },
]), (req, res) => {
  const c = currentCandidate(req);
  if (!c) return res.status(401).json({ error: "Please log in as a candidate" });
  const jobId = Number(req.body.job_id);
  const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND status = 'open'").get(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  const existing = db.prepare("SELECT * FROM applications WHERE candidate_id=? AND job_id=?").get(c.id, jobId);
  if (existing) return res.status(409).json({ error: "You have already applied to this role" });
  const cv = (req.files && req.files.cv && req.files.cv[0]) || null;
  if (!cv) return res.status(400).json({ error: "Please attach your CV as a PDF" });
  if (!/\.pdf$/i.test(cv.originalname)) return res.status(400).json({ error: "CV must be a PDF" });
  const cover = req.files && req.files.cover_letter && req.files.cover_letter[0];
  const others = (req.files && req.files.other_docs) || [];
  const answers = { ...req.body };
  delete answers.job_id;
  const info = db.prepare(
    "INSERT INTO applications (candidate_id, job_id, stage, outcome) VALUES (?, ?, 'applied', 'active')"
  ).run(c.id, jobId);
  db.prepare(
    "INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note) VALUES (?, NULL, 'applied', 'active', NULL, ?)"
  ).run(info.lastInsertRowid, "Candidate self-apply");
  db.prepare(`
    INSERT INTO application_forms (application_id, answers_json, cv_filename, cover_letter_filename, other_docs)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    info.lastInsertRowid,
    JSON.stringify(answers),
    cv.filename,
    cover ? cover.filename : null,
    others.map((f) => f.filename).join(",")
  );
  audit(null, "create", "application", info.lastInsertRowid, { candidate_id: c.id, job_id: jobId, source: "portal" });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/meta", (req, res) => {
  const user = currentUser(req);
  audit(user.id, "read", "meta", null, { route: "/api/meta" });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    stages: STAGES,
    stageLabels: STAGE_LABELS,
    rejectReasons: REJECT_REASONS,
    sourceTypes: SOURCE_TYPES,
    retentionYears: RETENTION_YEARS,
    users: db.prepare("SELECT id, name, email, role FROM users").all(),
    clients: db.prepare("SELECT * FROM clients").all(),
    projects: db.prepare(`
      SELECT p.*, c.name AS client_name FROM projects p JOIN clients c ON c.id = p.client_id
    `).all(),
    consultancies: db.prepare("SELECT * FROM consultancies").all(),
  });
});

app.get("/api/dashboard", (req, res) => {
  const user = currentUser(req);
  audit(user.id, "read", "dashboard", null, {});

  const openJobs = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE status = 'open'").get().n;
  const activeApps = db.prepare("SELECT COUNT(*) AS n FROM applications WHERE outcome = 'active'").get().n;
  const offered = db.prepare("SELECT COUNT(*) AS n FROM applications WHERE stage IN ('offered','bgv') AND outcome = 'active'").get().n;
  const joined30 = db.prepare(`
    SELECT COUNT(*) AS n FROM applications
    WHERE outcome = 'joined' AND joining_date >= date('now', '-30 day')
  `).get().n;
  const dropped = db.prepare("SELECT COUNT(*) AS n FROM applications WHERE outcome = 'dropped_out'").get().n;
  const rejected = db.prepare("SELECT COUNT(*) AS n FROM applications WHERE outcome = 'rejected'").get().n;

  const byStage = STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: db.prepare(
      "SELECT COUNT(*) AS n FROM applications WHERE stage = ? AND outcome = 'active'"
    ).get(stage).n,
  }));

  const timeToFill = db.prepare(`
    SELECT j.id, j.title, j.target_closure_date, j.created_at,
           a.joining_date,
           CAST(julianday(COALESCE(a.joining_date, date('now'))) - julianday(j.created_at) AS INTEGER) AS days_open
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id AND a.outcome = 'joined'
    WHERE j.status IN ('open','filled')
    ORDER BY j.target_closure_date
  `).all();

  const avgFill = db.prepare(`
    SELECT AVG(julianday(a.joining_date) - julianday(j.created_at)) AS avg_days
    FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.outcome = 'joined' AND a.joining_date IS NOT NULL
  `).get();

  const sources = db.prepare(`
    SELECT c.source_type, COUNT(*) AS n,
           SUM(CASE WHEN a.outcome = 'joined' THEN 1 ELSE 0 END) AS joined,
           SUM(CASE WHEN a.outcome = 'dropped_out' THEN 1 ELSE 0 END) AS dropped
    FROM candidates c
    LEFT JOIN applications a ON a.candidate_id = c.id
    GROUP BY c.source_type
  `).all();

  const offerToJoin = db.prepare(`
    SELECT
      SUM(CASE WHEN stage IN ('offered','bgv','joined') OR outcome = 'joined' THEN 1 ELSE 0 END) AS offered_plus,
      SUM(CASE WHEN outcome = 'joined' THEN 1 ELSE 0 END) AS joined,
      SUM(CASE WHEN outcome = 'dropped_out' THEN 1 ELSE 0 END) AS dropped_out
    FROM applications
  `).get();

  const offerCohort = db.prepare(`
    SELECT
      COUNT(*) AS offered,
      SUM(CASE WHEN a.outcome = 'joined' THEN 1 ELSE 0 END) AS joined,
      SUM(CASE WHEN a.outcome = 'dropped_out' THEN 1 ELSE 0 END) AS dropped,
      SUM(CASE WHEN a.outcome = 'active' THEN 1 ELSE 0 END) AS pending
    FROM applications a
    WHERE a.stage IN ('offered','bgv','joined') OR a.outcome = 'joined'
       OR EXISTS (SELECT 1 FROM stage_history h WHERE h.application_id = a.id AND h.to_stage = 'offered')
  `).get();
  const decided = (offerCohort.joined || 0) + (offerCohort.dropped || 0);
  offerCohort.dropRatePct = decided ? Math.round((offerCohort.dropped / decided) * 100) : null;

  const sourceRows = db.prepare(`
    SELECT CASE WHEN c.source_type = 'consultancy' THEN 'consultancy: ' || COALESCE(cons.name, 'other') ELSE c.source_type END AS source,
      COUNT(a.id) AS applications,
      SUM(CASE WHEN a.stage IN ('client_round','offered','bgv','joined') THEN 1 ELSE 0 END) AS client_round_plus,
      SUM(CASE WHEN a.outcome = 'joined' THEN 1 ELSE 0 END) AS joined,
      SUM(CASE WHEN a.outcome = 'dropped_out' THEN 1 ELSE 0 END) AS dropped,
      SUM(CASE WHEN a.outcome = 'joined' AND c.source_type = 'consultancy'
          THEN a.offered_ctc_lpa * 100000 * COALESCE(cons.fee_percent, 8.33) / 100 ELSE 0 END) AS fee_inr
    FROM applications a JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN consultancies cons ON cons.id = c.consultancy_id
    GROUP BY source ORDER BY applications DESC
  `).all().map((r) => ({ ...r, joinRatePct: r.applications ? Math.round((r.joined / r.applications) * 100) : 0 }));

  const atRisk = db.prepare(`
    SELECT a.*, c.name, c.notice_period_days, c.expected_ctc_lpa, c.holds_other_offers, j.title AS job_title,
      (SELECT group_concat(body, ' ') FROM notes n WHERE n.candidate_id = c.id) AS notes_text
    FROM applications a JOIN candidates c ON c.id = a.candidate_id JOIN jobs j ON j.id = a.job_id
    WHERE a.outcome = 'active' AND a.stage IN ('client_round','offered','bgv')
  `).all().map((r) => ({ id: r.id, candidate_id: r.candidate_id, name: r.name, job_title: r.job_title, stage: r.stage, risk: offerRisk(r, r, r.notes_text) }))
    .filter((r) => r.risk && r.risk.level !== "low")
    .sort((x, y) => y.risk.score - x.risk.score);

  const upcoming = db.prepare(`
    SELECT i.*, c.name, j.title AS job_title, a.candidate_id FROM interviews i
    JOIN applications a ON a.id = i.application_id JOIN candidates c ON c.id = a.candidate_id
    JOIN jobs j ON j.id = a.job_id
    WHERE date(i.scheduled_at) BETWEEN date('now') AND date('now', '+7 day') ORDER BY i.scheduled_at
  `).all();

  res.json({
    offerCohort,
    sourceRows,
    atRisk,
    upcoming,
    kpis: {
      openJobs,
      activeApps,
      offered,
      joined30,
      dropped,
      rejected,
      avgTimeToFillDays: avgFill.avg_days ? Math.round(avgFill.avg_days) : null,
    },
    byStage,
    timeToFill,
    sources,
    offerToJoin,
  });
});

app.get("/api/jobs", (req, res) => {
  const user = currentUser(req);
  audit(user.id, "read", "job", null, {});
  const jobs = db.prepare(`
    SELECT j.*, cl.name AS client_name, p.name AS project_name, p.start_date AS project_start,
           p.billing_rate_inr, u.name AS recruiter_name,
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.outcome = 'active') AS active_pipeline
    FROM jobs j
    JOIN clients cl ON cl.id = j.client_id
    JOIN projects p ON p.id = j.project_id
    LEFT JOIN users u ON u.id = j.recruiter_id
    ORDER BY j.target_closure_date
  `).all();
  res.json(isHM(user) ? jobs.filter((j) => j.hiring_manager_id === user.id) : jobs);
});

app.post("/api/jobs", (req, res) => {
  const user = currentUser(req);
  if (user.role === "hiring_manager") {
    return res.status(403).json({ error: "Hiring managers cannot create requisitions" });
  }
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO jobs (
      title, client_id, project_id, skills_required, exp_min_years, exp_max_years,
      ctc_min_lpa, ctc_max_lpa, location, target_closure_date, recruiter_id, status,
      description, requirements, pay, benefits, hiring_manager_id, openings
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.title, b.client_id, b.project_id, b.skills_required,
    b.exp_min_years, b.exp_max_years, b.ctc_min_lpa, b.ctc_max_lpa,
    b.location, b.target_closure_date, b.recruiter_id || user.id, b.status || "open",
    b.description || "", b.requirements || "", b.pay || "", b.benefits || "",
    b.hiring_manager_id || null, b.openings || 1
  );
  audit(user.id, "create", "job", info.lastInsertRowid, { title: b.title });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.put("/api/jobs/:id", (req, res) => {
  const user = currentUser(req);
  if (user.role === "hiring_manager") {
    return res.status(403).json({ error: "Hiring managers cannot edit requisitions" });
  }
  const b = req.body;
  db.prepare(`
    UPDATE jobs SET title=?, client_id=?, project_id=?, skills_required=?, exp_min_years=?,
      exp_max_years=?, ctc_min_lpa=?, ctc_max_lpa=?, location=?, target_closure_date=?,
      recruiter_id=?, status=?, description=?, requirements=?, pay=?, benefits=?, hiring_manager_id=?, openings=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    b.title, b.client_id, b.project_id, b.skills_required, b.exp_min_years, b.exp_max_years,
    b.ctc_min_lpa, b.ctc_max_lpa, b.location, b.target_closure_date, b.recruiter_id, b.status,
    b.description || "", b.requirements || "", b.pay || "", b.benefits || "", b.hiring_manager_id || null, b.openings || 1, req.params.id
  );
  audit(user.id, "update", "job", Number(req.params.id), { title: b.title });
  res.json({ ok: true });
});

app.get("/api/candidates", (req, res) => {
  const user = currentUser(req);
  const skill = (req.query.skill || "").toLowerCase().trim();
  const source = req.query.source || "";
  const q = (req.query.q || "").toLowerCase().trim();
  let rows = db.prepare(`
    SELECT c.*, cons.name AS consultancy_name,
      (SELECT COUNT(*) FROM applications a WHERE a.candidate_id = c.id) AS application_count
    FROM candidates c
    LEFT JOIN consultancies cons ON cons.id = c.consultancy_id
    ORDER BY c.updated_at DESC
  `).all();
  if (isHM(user)) {
    const allowed = new Set(db.prepare(`
      SELECT a.candidate_id FROM applications a JOIN jobs j ON j.id = a.job_id
      WHERE j.hiring_manager_id = ? AND a.outcome IN ('active','joined') AND a.stage IN ${HM_STAGE_SQL}
    `).all(user.id).map((r) => r.candidate_id));
    rows = rows.filter((r) => allowed.has(r.id));
  }
  rows = rows.filter((r) => !r.erased_at);
  if (skill) rows = rows.filter((r) => (r.skills || "").toLowerCase().includes(skill));
  if (source) rows = rows.filter((r) => r.source_type === source);
  const maxNotice = Number(req.query.maxNotice || 0);
  if (maxNotice) rows = rows.filter((r) => r.notice_period_days <= maxNotice);
  if (q) {
    rows = rows.filter((r) =>
      [r.name, r.email, r.phone, r.current_company, r.skills].join(" ").toLowerCase().includes(q)
    );
  }
  audit(user.id, "read", "candidate", null, { skill, source, q, count: rows.length });
  res.json(rows.map((r) => maskCandidate(user, r)));
});

app.get("/api/candidates/check-phone", (req, res) => {
  const phone = normalizePhone(req.query.phone);
  const excludeId = Number(req.query.excludeId || 0);
  const row = db.prepare("SELECT id, name, email, phone FROM candidates WHERE phone = ?").get(phone);
  if (row && row.id !== excludeId) {
    const activeWith = db.prepare(`
      SELECT j.title, u.name AS recruiter_name, a.stage FROM applications a
      JOIN jobs j ON j.id = a.job_id LEFT JOIN users u ON u.id = j.recruiter_id
      WHERE a.candidate_id = ? AND a.outcome = 'active'
    `).all(row.id);
    return res.json({ duplicate: true, candidate: row, activeWith });
  }
  res.json({ duplicate: false });
});

app.get("/api/candidates/:id", (req, res) => {
  const user = currentUser(req);
  const c = db.prepare(`
    SELECT c.*, cons.name AS consultancy_name
    FROM candidates c LEFT JOIN consultancies cons ON cons.id = c.consultancy_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  let hmJobIds = null;
  if (isHM(user)) {
    hmJobIds = new Set(db.prepare(`
      SELECT a.job_id FROM applications a JOIN jobs j ON j.id = a.job_id
      WHERE a.candidate_id = ? AND j.hiring_manager_id = ? AND a.outcome IN ('active','joined') AND a.stage IN ${HM_STAGE_SQL}
    `).all(c.id, user.id).map((r) => r.job_id));
    if (!hmJobIds.size) return res.status(403).json({ error: "Hiring managers can only open shortlisted candidates for their own roles" });
  }
  const notes = db.prepare(`
    SELECT n.*, u.name AS author_name FROM notes n JOIN users u ON u.id = n.author_id
    WHERE n.candidate_id = ? ORDER BY n.created_at DESC
  `).all(c.id);
  const applications = db.prepare(`
    SELECT a.*, j.title AS job_title, j.location, j.target_closure_date,
           cl.name AS client_name, p.name AS project_name, p.start_date AS project_start,
           p.billing_rate_inr
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN clients cl ON cl.id = j.client_id
    JOIN projects p ON p.id = j.project_id
    WHERE a.candidate_id = ?
    ORDER BY a.updated_at DESC
  `).all(c.id);
  const history = db.prepare(`
    SELECT h.*, u.name AS moved_by_name FROM stage_history h
    JOIN applications a ON a.id = h.application_id
    LEFT JOIN users u ON u.id = h.moved_by
    WHERE a.candidate_id = ? ORDER BY h.moved_at DESC
  `).all(c.id);
  const interviews = db.prepare(`
    SELECT i.*, a.job_id, j.title AS job_title FROM interviews i
    JOIN applications a ON a.id = i.application_id
    JOIN jobs j ON j.id = a.job_id
    WHERE a.candidate_id = ? ORDER BY i.scheduled_at DESC
  `).all(c.id);
  const offers = db.prepare(`
    SELECT o.*, a.job_id, j.title AS job_title FROM offers o
    JOIN applications a ON a.id = o.application_id
    JOIN jobs j ON j.id = a.job_id
    WHERE a.candidate_id = ? ORDER BY o.created_at DESC
  `).all(c.id);
  audit(user.id, "read", "candidate", c.id, { name: c.name });
  const notesText = notes.map((n) => n.body).join(" ");
  const visibleApps = hmJobIds ? applications.filter((a) => hmJobIds.has(a.job_id)) : applications;
  const forms = db.prepare(`
    SELECT f.* FROM application_forms f JOIN applications a ON a.id = f.application_id WHERE a.candidate_id = ?
  `).all(c.id);
  res.json({
    candidate: maskCandidate(user, c),
    notes,
    forms: isHM(user) ? [] : forms,
    applications: visibleApps.map((a) => ({
      ...(isHM(user) ? { ...a, offered_ctc_lpa: null } : a),
      notice_risk: noticeRisk(c.notice_period_days, a.project_start),
      offer_risk: offerRisk(a, c, notesText),
    })),
    history,
    interviews,
    offers: canSeeCompensation(user) ? offers : offers.map((o) => ({ ...o, offered_ctc_lpa: null })),
  });
});

app.post("/api/candidates", (req, res) => {
  const user = currentUser(req);
  if (user.role === "hiring_manager") {
    return res.status(403).json({ error: "Hiring managers cannot add candidates" });
  }
  const b = req.body;
  const phone = normalizePhone(b.phone);
  if (!phone || phone.length < 10) return res.status(400).json({ error: "Valid phone is required" });
  const dup = db.prepare("SELECT id, name, email, phone FROM candidates WHERE phone = ?").get(phone);
  if (dup) {
    return res.status(409).json({
      error: "Duplicate phone — candidate already exists. Do not re-outreach without checking history.",
      candidate: dup,
    });
  }
  if (!b.consent_given) {
    return res.status(400).json({ error: "DPDP: explicit consent is required before storing candidate personal data." });
  }
  try {
    const info = db.prepare(`
      INSERT INTO candidates (
        name, phone, email, current_company, current_ctc_lpa, expected_ctc_lpa,
        notice_period_days, total_experience_years, skills, source_type, source_detail,
        consultancy_id, referred_by, consent_given, consent_at, consent_purpose, retention_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), ?, ?)
    `).run(
      b.name, phone, b.email, b.current_company || null, b.current_ctc_lpa || null,
      b.expected_ctc_lpa || null, b.notice_period_days || 0, b.total_experience_years || 0,
      b.skills || "", b.source_type, b.source_detail || null, b.consultancy_id || null,
      b.referred_by || null, b.consent_purpose || "Recruitment for client-delivery roles at Meridian Technologies",
      retentionUntil()
    );
    audit(user.id, "create", "candidate", info.lastInsertRowid, { phone });
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/candidates/:id", (req, res) => {
  const user = currentUser(req);
  if (user.role === "hiring_manager") {
    return res.status(403).json({ error: "Hiring managers cannot edit candidate records" });
  }
  const b = req.body;
  const phone = normalizePhone(b.phone);
  const dup = db.prepare("SELECT id FROM candidates WHERE phone = ? AND id != ?").get(phone, req.params.id);
  if (dup) return res.status(409).json({ error: "Phone already belongs to another candidate", candidateId: dup.id });
  db.prepare(`
    UPDATE candidates SET name=?, phone=?, email=?, current_company=?, current_ctc_lpa=?,
      expected_ctc_lpa=?, notice_period_days=?, total_experience_years=?, skills=?,
      source_type=?, source_detail=?, consultancy_id=?, referred_by=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    b.name, phone, b.email, b.current_company, b.current_ctc_lpa, b.expected_ctc_lpa,
    b.notice_period_days, b.total_experience_years, b.skills, b.source_type, b.source_detail,
    b.consultancy_id || null, b.referred_by || null, req.params.id
  );
  audit(user.id, "update", "candidate", Number(req.params.id), {});
  res.json({ ok: true });
});

app.post("/api/candidates/:id/resume", upload.single("resume"), (req, res) => {
  const user = currentUser(req);
  if (isHM(user)) return res.status(403).json({ error: "Only recruiters upload resumes" });
  if (!req.file) return res.status(400).json({ error: "No file" });
  db.prepare(
    "UPDATE candidates SET resume_path=?, resume_original_name=?, updated_at=datetime('now') WHERE id=?"
  ).run(req.file.filename, req.file.originalname, req.params.id);
  audit(user.id, "upload_resume", "candidate", Number(req.params.id), { file: req.file.originalname });
  res.json({ filename: req.file.filename, original: req.file.originalname });
});

app.get("/api/resumes/:filename", (req, res) => {
  const user = currentUser(req);
  audit(user.id, "download_resume", "resume", null, { file: req.params.filename });
  const file = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(file)) return res.status(404).end();
  res.download(file);
});

app.post("/api/candidates/:id/notes", (req, res) => {
  const user = currentUser(req);
  const body = (req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Note cannot be empty" });
  const info = db.prepare("INSERT INTO notes (candidate_id, author_id, body) VALUES (?, ?, ?)").run(
    req.params.id, user.id, body
  );
  audit(user.id, "create", "note", info.lastInsertRowid, { candidateId: Number(req.params.id) });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post("/api/applications", (req, res) => {
  const user = currentUser(req);
  const { candidate_id, job_id } = req.body;
  const existing = db.prepare("SELECT * FROM applications WHERE candidate_id=? AND job_id=?").get(candidate_id, job_id);
  if (existing) return res.status(409).json({ error: "Candidate already linked to this job", application: existing });
  const info = db.prepare(
    "INSERT INTO applications (candidate_id, job_id, stage, outcome) VALUES (?, ?, 'applied', 'active')"
  ).run(candidate_id, job_id);
  db.prepare(
    "INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note) VALUES (?, NULL, 'applied', 'active', ?, ?)"
  ).run(info.lastInsertRowid, user.id, "Linked to requisition");
  audit(user.id, "create", "application", info.lastInsertRowid, { candidate_id, job_id });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/pipeline", (req, res) => {
  const user = currentUser(req);
  const jobId = req.query.jobId;
  const params = [];
  let where = "a.outcome IN ('active','joined')";
  if (isHM(user)) {
    where += ` AND a.stage IN ${HM_STAGE_SQL} AND j.hiring_manager_id = ?`;
    params.push(user.id);
  }
  if (jobId) {
    where += " AND a.job_id = ?";
    params.push(jobId);
  }
  const rows = db.prepare(`
    SELECT a.*, c.name, c.phone, c.email, c.notice_period_days, c.total_experience_years,
           c.skills, c.source_type, c.expected_ctc_lpa, c.current_ctc_lpa, c.holds_other_offers,
           (SELECT group_concat(body, ' ') FROM notes n WHERE n.candidate_id = c.id) AS notes_text,
           j.title AS job_title, j.location, cl.name AS client_name, p.name AS project_name,
           p.start_date AS project_start, p.billing_rate_inr, j.target_closure_date
    FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN jobs j ON j.id = a.job_id
    JOIN clients cl ON cl.id = j.client_id
    JOIN projects p ON p.id = j.project_id
    WHERE ${where}
    ORDER BY a.updated_at DESC
  `).all(...params);

  const terminal = db.prepare(`
    SELECT a.*, c.name, c.notice_period_days, c.source_type, j.title AS job_title, cl.name AS client_name
    FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN jobs j ON j.id = a.job_id
    JOIN clients cl ON cl.id = j.client_id
    WHERE a.outcome IN ('rejected','dropped_out') ${jobId ? "AND a.job_id = ?" : ""}
    ORDER BY a.updated_at DESC
  `).all(...(jobId ? [jobId] : []));

  audit(user.id, "read", "pipeline", jobId ? Number(jobId) : null, {});
  const mapped = rows.map((r) => {
    const m = maskCandidate(user, r);
    const { notes_text, ...rest } = m;
    return {
      ...rest,
      notice_risk: noticeRisk(r.notice_period_days, r.project_start),
      offer_risk: offerRisk(r, r, notes_text),
    };
  });
  res.json({ columns: isHM(user) ? HM_STAGES : STAGES, items: mapped, terminal: isHM(user) ? [] : terminal });
});

app.post("/api/applications/:id/move", (req, res) => {
  const user = currentUser(req);
  if (isHM(user)) return res.status(403).json({ error: "Hiring managers can review and add notes, but recruiters move stages" });
  const appRow = db.prepare("SELECT * FROM applications WHERE id=?").get(req.params.id);
  if (!appRow) return res.status(404).json({ error: "Application not found" });
  const { to_stage, outcome, reject_reason_code, reject_notes, dropout_reason } = req.body;
  if (to_stage && STAGES.includes(to_stage)) {
    const from = STAGES.indexOf(appRow.stage);
    const to = STAGES.indexOf(to_stage);
    if (to > from + 1) {
      return res.status(400).json({ error: `Move one stage at a time — next is ${STAGE_LABELS[STAGES[from + 1]]}. Client round and BGV cannot be skipped.` });
    }
    if (to_stage === "joined" && appRow.bgv_status !== "clear") {
      return res.status(400).json({ error: "Background verification must be marked Clear before the candidate can be marked Joined." });
    }
  }
  if (outcome === "rejected" || outcome === "dropped_out") {
    db.prepare(`
      UPDATE applications SET outcome=?, reject_reason_code=?, reject_notes=?, dropout_reason=?,
        updated_at=datetime('now') WHERE id=?
    `).run(outcome, reject_reason_code || null, reject_notes || null, dropout_reason || null, appRow.id);
    db.prepare(
      "INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(appRow.id, appRow.stage, appRow.stage, outcome, user.id, reject_notes || dropout_reason || outcome);
    audit(user.id, "status_change", "application", appRow.id, { outcome });
    return res.json({ ok: true });
  }
  if (outcome === "active" && appRow.outcome !== "active") {
    db.prepare("UPDATE applications SET outcome='active', reject_reason_code=NULL, reject_notes=NULL, dropout_reason=NULL, updated_at=datetime('now') WHERE id=?").run(appRow.id);
  }
  if (to_stage) {
    if (!STAGES.includes(to_stage)) return res.status(400).json({ error: "Invalid stage" });
    const nextOutcome = to_stage === "joined" ? "joined" : "active";
    db.prepare("UPDATE applications SET stage=?, outcome=?, joining_date=CASE WHEN ? = 'joined' THEN COALESCE(joining_date, date('now')) ELSE joining_date END, updated_at=datetime('now') WHERE id=?").run(
      to_stage, nextOutcome, to_stage, appRow.id
    );
    db.prepare(
      "INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(appRow.id, appRow.stage, to_stage, nextOutcome, user.id, req.body.note || null);
    audit(user.id, "stage_move", "application", appRow.id, { from: appRow.stage, to: to_stage });
  }
  res.json({ ok: true });
});

app.post("/api/applications/:id/interview", (req, res) => {
  const user = currentUser(req);
  if (isHM(user)) return res.status(403).json({ error: "Only recruiters schedule interviews" });
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO interviews (application_id, round_type, panel_names, scheduled_at, location_or_link, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, b.round_type, b.panel_names, b.scheduled_at, b.location_or_link || null, user.id);
  audit(user.id, "create", "interview", info.lastInsertRowid, { application_id: Number(req.params.id) });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post("/api/applications/:id/offer", (req, res) => {
  const user = currentUser(req);
  if (user.role === "hiring_manager") {
    return res.status(403).json({ error: "Hiring managers cannot record offers" });
  }
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO offers (application_id, offered_ctc_lpa, joining_date, status, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, b.offered_ctc_lpa, b.joining_date, b.status || "pending", user.id);
  const prev = db.prepare("SELECT stage FROM applications WHERE id=?").get(req.params.id);
  if (prev && !["client_round", "offered", "bgv"].includes(prev.stage)) {
    db.prepare("DELETE FROM offers WHERE id = ?").run(info.lastInsertRowid);
    return res.status(400).json({ error: "An offer can only be made after the client round (client approval is required)." });
  }
  const nextStage = prev.stage === "bgv" ? "bgv" : "offered";
  const declined = b.status === "declined";
  db.prepare("UPDATE applications SET offered_ctc_lpa=?, joining_date=?, offer_status=?, stage=?, outcome=?, dropout_reason=?, updated_at=datetime('now') WHERE id=?").run(
    b.offered_ctc_lpa, b.joining_date, b.status || "pending", nextStage, declined ? "dropped_out" : "active",
    declined ? "Declined our offer" : null, req.params.id
  );
  db.prepare(
    "INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note) VALUES (?, ?, 'offered', 'active', ?, ?)"
  ).run(req.params.id, prev ? prev.stage : null, user.id, `Offer ${b.offered_ctc_lpa} LPA, join ${b.joining_date}`);
  audit(user.id, "create", "offer", info.lastInsertRowid, { ctc: b.offered_ctc_lpa });
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post("/api/applications/:id/bgv", (req, res) => {
  const user = currentUser(req);
  if (isHM(user)) return res.status(403).json({ error: "Only recruiters update BGV" });
  const status = req.body.bgv_status;
  if (!["not_started", "in_progress", "clear", "discrepancy"].includes(status)) {
    return res.status(400).json({ error: "Invalid BGV status" });
  }
  db.prepare("UPDATE applications SET bgv_status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  audit(user.id, "bgv_update", "application", Number(req.params.id), { status });
  res.json({ ok: true });
});

// DPDP: data past its retention date (or on request) is anonymised, keeping only stats.
app.get("/api/privacy/retention", (req, res) => {
  const user = currentUser(req);
  if (user.role !== "ta_head") return res.status(403).json({ error: "Limited to Head of TA" });
  res.json(db.prepare(`
    SELECT c.id, c.name, c.email, c.created_at, c.retention_until,
      (SELECT COUNT(*) FROM applications a WHERE a.candidate_id = c.id AND a.outcome = 'active') AS active_apps
    FROM candidates c WHERE c.erased_at IS NULL AND c.retention_until <= date('now')
    ORDER BY c.retention_until
  `).all());
});

function eraseCandidate(id) {
  const c = db.prepare("SELECT * FROM candidates WHERE id = ?").get(id);
  if (!c) return false;
  if (c.resume_path) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(c.resume_path))); } catch { /* already gone */ }
  }
  db.prepare("DELETE FROM notes WHERE candidate_id = ?").run(id);
  db.prepare("DELETE FROM application_forms WHERE application_id IN (SELECT id FROM applications WHERE candidate_id = ?)").run(id);
  db.prepare("UPDATE applications SET outcome = CASE WHEN outcome = 'active' THEN 'dropped_out' ELSE outcome END, dropout_reason = COALESCE(dropout_reason, 'Data erased (DPDP)') WHERE candidate_id = ?").run(id);
  db.prepare(`UPDATE candidates SET name = ?, phone = ?, email = ?, current_company = NULL, current_ctc_lpa = NULL,
    expected_ctc_lpa = NULL, skills = '', source_detail = NULL, referred_by = NULL, resume_path = NULL,
    resume_original_name = NULL, portal_password = ?, consent_given = 0, erased_at = datetime('now'),
    updated_at = datetime('now') WHERE id = ?`).run(
    `Erased candidate #${id}`, `ERASED-${id}`, `erased-${id}@invalid`, Math.random().toString(36), id
  );
  return true;
}

app.post("/api/privacy/erase/:id", (req, res) => {
  const user = currentUser(req);
  if (user.role !== "ta_head") return res.status(403).json({ error: "Limited to Head of TA" });
  if (!eraseCandidate(Number(req.params.id))) return res.status(404).json({ error: "Not found" });
  audit(user.id, "erase", "candidate", Number(req.params.id), { reason: req.body.reason || "retention expired" });
  res.json({ ok: true });
});

app.post("/api/portal/erase", (req, res) => {
  const c = currentCandidate(req);
  if (!c) return res.status(401).json({ error: "Please log in as a candidate" });
  eraseCandidate(c.id);
  audit(null, "erase", "candidate", c.id, { reason: "candidate withdrew consent" });
  res.json({ ok: true });
});

app.get("/api/audit", (req, res) => {
  const user = currentUser(req);
  if (user.role !== "ta_head") return res.status(403).json({ error: "Audit log is limited to Head of TA" });
  const rows = db.prepare(`
    SELECT a.*, u.name AS user_name FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC LIMIT 200
  `).all();
  res.json(rows);
});

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

function start() {
  return app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meridian ATS API on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, db, start };
