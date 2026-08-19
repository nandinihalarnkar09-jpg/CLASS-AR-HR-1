# Meridian Technologies — Applicant Tracking System (MVP)

Internal recruiting prototype for Meridian Technologies Pvt. Ltd. (Indian IT services, ~450 employees). Replaces shared Excel on a network drive for 4 recruiters, 1 Head of Talent Acquisition, and ~15 hiring managers.

**In scope:** requisitions tied to client projects, candidate pipeline including client round and BGV, duplicate-phone warnings, source tracking, DPDP-oriented consent and audit.

**Out of scope:** payroll, post-join onboarding, performance management, AI features, candidate self-service portal (future).

## Quick start

```bash
npm run install:all
npm run dev
```

- API: http://localhost:4000  
- UI (Vite, proxied to API): http://localhost:5173  

Demo users are in the sidebar switcher (recruiter / TA head / hiring manager). Hiring managers see masked CTC.

```bash
npm test
npm run build
npm start   # serves API + client/dist
```

SQLite database and resume uploads live in `data/` (gitignored). Schema: `server/schema.sql`. Entity notes: `docs/data-model.md`.

## Pipeline

Applied → Screened → Internal Interview → Client Round → Offered → BGV → Joined  

Rejected and Dropped Out can be applied at any stage, with reason codes. Every move is timestamped in `stage_history`.
