# Meridian Technologies — Applicant Tracking System (MVP)

Internal recruiting prototype for Meridian Technologies Pvt. Ltd. (Indian IT services, ~450 employees). Replaces shared Excel on a network drive for 4 recruiters, 1 Head of Talent Acquisition, and ~15 hiring managers.

**http://localhost:5173 only works after you start the app on your PC.** GitHub is not a live website. If you type that address with no server running, the browser will say it cannot connect.

### Fastest: no Node required
Double-click **`ats.html`** in this folder, or use:
https://htmlpreview.github.io/?https://github.com/nandinihalarnkar09-jpg/CLASS-AR-HR-1/blob/cursor/meridian-ats-mvp-798e/ats.html

### Windows — start localhost:5173
1. Install **Node.js LTS** from https://nodejs.org and tick **Add to PATH**.
2. Unzip the project (or `git checkout cursor/meridian-ats-mvp-798e`).
3. Double-click **`OPEN-THE-WEBSITE.bat`**.
4. Wait until the window says the server is ready, then open **http://localhost:5173**
5. Do not close the black window.

If install of the database fails, the website still starts (demo mode).

```bash
npm install --prefix client
npm run web
```

Then open http://localhost:5173

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
