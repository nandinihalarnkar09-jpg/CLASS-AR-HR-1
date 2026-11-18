# Meridian ATS — Applicant Tracking System

Recruiting app for **Meridian Technologies Pvt. Ltd.** (Indian IT services, 450 people, Pune / Bengaluru / Goa).
It replaces the shared Excel tracker for 4 recruiters, ~15 hiring managers, the Head of Talent Acquisition, and candidates.

**Core loop:** a recruiter can take one candidate from Applied to Joined — through the client round and BGV — without opening Excel.

## Two ways to use it

| | Live app (online) | Local app (your computer) |
| --- | --- | --- |
| Open | **https://nandinihalarnkar09-jpg.github.io/CLASS-AR-HR-1/** | Double-click `OPEN-THE-WEBSITE.bat` → http://localhost:5173 |
| Install needed | Nothing | Node.js 22.13+ (Node 24 LTS recommended) |
| Where data lives | In that visitor's browser (each visitor gets their own sample copy; "Reset demo data" restores it) | One shared SQLite database in `data/` — all recruiters on the office network see the same data |
| Resume / CV files | File name recorded only | Stored in `data/uploads` |
| Best for | Demos, reviewers, class submission | Real day-to-day use by the team |

Both use the same rules and the same sample data.

### Demo logins (password for all staff: `Meridian@2026`)

| Role | Email | What you'll see |
| --- | --- | --- |
| Head of TA | priya.nair@meridian.tech | Dashboard, offer→join drop-out %, source effectiveness, DPDP retention queue, audit log |
| Recruiter | arjun.mehta@meridian.tech | Requisitions, kanban pipeline, candidates, duplicate warnings |
| Hiring manager | vikram.rao@meridian.tech | Only shortlisted candidates (Internal Interview onward) for their own roles, no salary fields |
| Candidate | aditya.menon@example.com / `Welcome@123` | Own application status, open jobs, apply with CV, erase my data |

## Run locally

**Windows:** install Node.js LTS from https://nodejs.org, then double-click **`OPEN-THE-WEBSITE.bat`**. It installs packages,
builds the site and opens http://localhost:5173. Keep the black window open while using the app.

**Mac / Linux:** `./OPEN-THE-WEBSITE.sh`

**Commands:**

```bash
npm run setup     # install packages (root + client)
npm run build     # build the website
npm start         # app + API on http://localhost:4000 (PORT=5173 npm start for 5173)
npm test          # API tests
npm run dev       # developer mode with hot reload (API :4000, site :5173)
```

Other people on the same office network can open `http://<this-computer's-IP>:5173`.
To start again with fresh sample data, stop the app and delete `data/meridian-ats-v2.db`.

## What it does

- **Requisitions** tied to a client project (start date, billing rate), with skills, experience band, CTC range, location,
  target closure, openings, recruiter and hiring manager.
- **Candidates** with CTC, notice period, experience, skills and source (Naukri, LinkedIn, referral, named consultancy, direct).
  **Duplicate detection** on phone, including `+91` / leading-`0` variants, showing which job and recruiter already own the candidate.
- **Pipeline:** Applied → Screened → Internal Interview → Client Round → Offered → BGV → Joined, plus Rejected / Dropped Out with
  reason codes. Moves are timestamped and can go backward; Client Round and BGV cannot be skipped; Joined requires BGV = Clear.
- **Risk flags:** notice period vs project start, and offer-drop risk (other offers held, long notice, offer below expectation — plain rules, not AI).
- **Dashboard:** open requisitions, candidates by stage, **offer → joining drop-out %**, likely drop-outs, interviews this week,
  join rate and consultancy fees (8.33% of CTC) per source, time-to-fill.
- **DPDP Act:** consent required before saving a candidate, 3-year retention date on every record, retention queue and erasure for the
  Head of TA, candidate self-erasure, hiring managers never see CTC, audit log of reads and changes.
- **Candidate portal:** status of each application, open jobs with JD / pay / benefits, apply with PDF CV and screening questions.

**Out of scope (v1):** payroll, onboarding after joining, performance management, anything AI-powered, Naukri/LinkedIn integration.

## Project docs

- [`docs/PROTO.md`](docs/PROTO.md) — Problem, Research, Owners, user stories, data model, MoSCoW, core loop, what broke and how it was fixed
- [`docs/data-model.md`](docs/data-model.md) and [`server/schema.sql`](server/schema.sql) — data model

## Known limitations

- Staff login is a prototype: passwords are stored as plain text in the local database and the API trusts the signed-in user id from the browser. Fine for a demo; add real authentication before storing real candidate data.
- The live site keeps data per browser, so two people on the live URL don't see each other's changes. Use the local app for shared data.
