# Meridian Technologies — Applicant Tracking System (MVP)

Internal recruiting prototype for Meridian Technologies Pvt. Ltd. (Indian IT services, ~450 employees). Replaces shared Excel on a network drive for 4 recruiters, 1 Head of Talent Acquisition, and ~15 hiring managers.

**In scope:** requisitions tied to client projects, candidate pipeline including client round and BGV, duplicate-phone warnings, source tracking, DPDP-oriented consent and audit, recruiter and candidate login.

**Out of scope:** payroll, post-join onboarding, performance management, AI features.

## How to open the web page

GitHub is **only the code**. Opening the repository URL will not show the ATS. You must run the app on your computer, then use a browser.

Standalone HTML (login + demo UI):

https://htmlpreview.github.io/?https://github.com/nandinihalarnkar09-jpg/CLASS-AR-HR-1/blob/cursor/meridian-ats-mvp-798e/ats.html

### Windows (easiest)

1. Install **Node.js LTS** from https://nodejs.org (keep the “Add to PATH” box checked).
2. Download this project: GitHub → green **Code** → **Download ZIP**, then unzip.
3. Double-click **`OPEN-THE-WEBSITE.bat`**.
4. When Chrome/Edge opens, go to **http://localhost:5173** if it did not open by itself.
5. **Leave the black terminal window open** while you use the site.

### Mac / Linux

```bash
cd CLASS-AR-HR-1
chmod +x OPEN-THE-WEBSITE.sh
./OPEN-THE-WEBSITE.sh
```

Then open **http://localhost:5173**.

### Commands (any OS)

```bash
npm run install:all
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:4000

If the API is not running, the UI still loads in **browser demo** mode (sample data in localStorage).

### Demo logins

| Portal | Email | Password |
| --- | --- | --- |
| Recruiter | arjun.mehta@meridian.tech | Meridian@2026 |
| TA Head | priya.nair@meridian.tech | Meridian@2026 |
| Candidate | aditya.menon@example.com | Welcome@123 |

Hiring managers see masked CTC. Candidates see only their own applications.

## Tests and production build

```bash
npm test
npm run build
npm start   # serves API + client/dist on http://localhost:4000
```

SQLite database and resume uploads live in `data/` (gitignored). Schema: `server/schema.sql`. Entity notes: `docs/data-model.md`.

## Pipeline

Applied → Screened → Internal Interview → Client Round → Offered → BGV → Joined

Rejected and Dropped Out can be applied at any stage, with reason codes. Every move is timestamped in `stage_history`.
