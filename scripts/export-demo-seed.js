// Builds client/src/demoSeed.json from the real server seed so the live (browser-only)
// site shows exactly the same data as the local app. Run automatically by `npm run build`.
const fs = require("fs");
const os = require("os");
const path = require("path");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ats-seed-"));
process.env.ATS_DB_PATH = path.join(tmp, "seed.db");
const { openDb } = require("../server/db");
const { seed } = require("../server/seed");
const db = openDb();
seed(db);
const tables = ["users", "clients", "projects", "consultancies", "jobs", "candidates", "applications",
  "stage_history", "notes", "interviews", "offers"];
const out = { exportedOn: new Date().toISOString().slice(0, 10) };
for (const t of tables) out[t] = db.prepare(`SELECT * FROM ${t}`).all();
for (const u of out.users) delete u.password;
db.close();
fs.writeFileSync(path.join(__dirname, "..", "client", "src", "demoSeed.json"), JSON.stringify(out));
console.log("demo seed:", tables.map((t) => `${t}=${out[t].length}`).join(" "));
