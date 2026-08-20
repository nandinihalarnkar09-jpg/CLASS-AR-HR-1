# Meridian Technologies — Applicant Tracking System (MVP)

Internal recruiting prototype for Meridian Technologies Pvt. Ltd.

## How to open the web page

GitHub is **only the code**. Opening the repository URL will not show the ATS. You must run the app on your computer, then use a browser.

### Windows (easiest)

1. Install **Node.js LTS** from https://nodejs.org (keep the “Add to PATH” box checked).
2. Download this project: GitHub → green **Code** → **Download ZIP**, then unzip.  
   If you use git: `git clone https://github.com/nandinihalarnkar09-jpg/CLASS-AR-HR-1.git` then `git checkout cursor/meridian-ats-mvp-798e`.
3. Double-click **`OPEN-THE-WEBSITE.bat`**.
4. When Chrome/Edge opens, go to **http://localhost:5173** if it did not open by itself.
5. **Leave the black terminal window open** while you use the site.

### Mac / Linux

```bash
cd CLASS-AR-HR-1   # or the unzipped folder
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

Use the sidebar to switch Priya Nair (TA Head), Arjun Mehta (recruiter), or Vikram Rao (hiring manager).

If the API is not running, the UI still loads in **browser demo** mode (sample data in localStorage).

## Tests and production build

```bash
npm test
npm run build
npm start   # serves API + client/dist on http://localhost:4000
```

SQLite data lives in `data/` (gitignored). Schema: `server/schema.sql`. Entity notes: `docs/data-model.md`.

## Pipeline

Applied → Screened → Internal Interview → Client Round → Offered → BGV → Joined
