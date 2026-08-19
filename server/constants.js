const STAGES = [
  "applied",
  "screened",
  "internal_interview",
  "client_round",
  "offered",
  "bgv",
  "joined",
];

const STAGE_LABELS = {
  applied: "Applied",
  screened: "Screened",
  internal_interview: "Internal Interview",
  client_round: "Client Round",
  offered: "Offered",
  bgv: "BGV",
  joined: "Joined",
};

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

const RETENTION_YEARS = 3;

function addYears(isoDate, years) {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function retentionUntil(from = new Date()) {
  return addYears(from.toISOString(), RETENTION_YEARS);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

module.exports = {
  STAGES,
  STAGE_LABELS,
  REJECT_REASONS,
  SOURCE_TYPES,
  RETENTION_YEARS,
  retentionUntil,
  daysUntil,
};
