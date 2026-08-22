-- Meridian Technologies ATS — relational schema
-- Designed for ~40 open jobs, ~200 candidates/month, 3-year retention (DPDP).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'ta_head', 'hiring_manager')),
  password TEXT NOT NULL DEFAULT 'Meridian@2026',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  start_date TEXT,
  billing_rate_inr INTEGER NOT NULL,
  UNIQUE (client_id, name)
);

CREATE TABLE IF NOT EXISTS consultancies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  fee_percent REAL NOT NULL DEFAULT 8.33
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  skills_required TEXT NOT NULL,
  exp_min_years REAL NOT NULL,
  exp_max_years REAL NOT NULL,
  ctc_min_lpa REAL NOT NULL,
  ctc_max_lpa REAL NOT NULL,
  location TEXT NOT NULL,
  target_closure_date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  pay TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '',
  recruiter_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'on_hold', 'closed', 'filled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);

-- Personal data (DPDP: purpose-limited recruiting). Phone unique for duplicate outreach prevention.
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  current_company TEXT,
  current_ctc_lpa REAL,
  expected_ctc_lpa REAL,
  notice_period_days INTEGER NOT NULL DEFAULT 0,
  total_experience_years REAL NOT NULL DEFAULT 0,
  skills TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL CHECK (source_type IN ('naukri', 'linkedin', 'referral', 'consultancy', 'direct')),
  source_detail TEXT,
  consultancy_id INTEGER REFERENCES consultancies(id),
  referred_by TEXT,
  resume_path TEXT,
  resume_original_name TEXT,
  portal_password TEXT NOT NULL DEFAULT 'Welcome@123',
  consent_given INTEGER NOT NULL DEFAULT 0,
  consent_at TEXT,
  consent_purpose TEXT DEFAULT 'Recruitment for client-delivery roles at Meridian Technologies',
  retention_until TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_retention ON candidates(retention_until);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN (
    'applied', 'screened', 'internal_interview', 'client_round', 'offered', 'bgv', 'joined'
  )),
  outcome TEXT NOT NULL DEFAULT 'active' CHECK (outcome IN ('active', 'rejected', 'dropped_out', 'joined')),
  reject_reason_code TEXT,
  reject_notes TEXT,
  dropout_reason TEXT,
  offered_ctc_lpa REAL,
  joining_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_stage ON applications(job_id, stage, outcome);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);

CREATE TABLE IF NOT EXISTS stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  outcome TEXT,
  moved_by INTEGER REFERENCES users(id),
  moved_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_stage_history_app ON stage_history(application_id, moved_at);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_candidate ON notes(candidate_id, created_at);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL CHECK (round_type IN ('internal', 'client')),
  panel_names TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  location_or_link TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  offered_ctc_lpa REAL NOT NULL,
  joining_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- DPDP: immutable processing log for personal data access and mutation.
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS application_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  answers_json TEXT NOT NULL,
  cv_filename TEXT,
  cover_letter_filename TEXT,
  other_docs TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
