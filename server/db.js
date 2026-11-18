const fs = require("fs");
const path = require("path");

// Node's built-in SQLite (Node 22.13+). No native module to compile, so `npm install`
// works on Windows without Visual Studio build tools (better-sqlite3 used to fail here).
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (w.name === "ExperimentalWarning" && /SQLite/i.test(w.message)) return;
  console.warn(w.name + ": " + w.message);
});
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = process.env.ATS_DB_PATH || path.join(DATA_DIR, "meridian-ats-v2.db");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function norm(params) {
  return params.map((v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));
}

// Thin wrapper exposing the better-sqlite3 API the rest of the server already uses.
function wrap(raw) {
  const cache = new Map();
  const stmt = (sql) => {
    if (!cache.has(sql)) cache.set(sql, raw.prepare(sql));
    return cache.get(sql);
  };
  const plain = (row) => (row ? { ...row } : row);
  return {
    raw,
    prepare(sql) {
      return {
        get: (...p) => plain(stmt(sql).get(...norm(p))),
        all: (...p) => stmt(sql).all(...norm(p)).map(plain),
        run: (...p) => {
          const r = stmt(sql).run(...norm(p));
          return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
        },
      };
    },
    exec: (sql) => raw.exec(sql),
    pragma: (p) => raw.exec(`PRAGMA ${p}`),
    transaction: (fn) => (...args) => {
      raw.exec("BEGIN");
      try {
        const out = fn(...args);
        raw.exec("COMMIT");
        return out;
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => raw.close(),
  };
}

function openDb() {
  ensureDirs();
  const db = wrap(new DatabaseSync(DB_PATH));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  migrate(db);
  return db;
}

function columnNames(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

function addColumn(db, table, col, ddl) {
  if (!columnNames(db, table).includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
}

function migrate(db) {
  addColumn(db, "users", "password", "TEXT NOT NULL DEFAULT 'Meridian@2026'");
  addColumn(db, "candidates", "portal_password", "TEXT NOT NULL DEFAULT 'Welcome@123'");
  addColumn(db, "candidates", "holds_other_offers", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "candidates", "erased_at", "TEXT");
  for (const c of ["description", "requirements", "pay", "benefits"]) addColumn(db, "jobs", c, "TEXT NOT NULL DEFAULT ''");
  addColumn(db, "jobs", "hiring_manager_id", "INTEGER REFERENCES users(id)");
  addColumn(db, "jobs", "openings", "INTEGER NOT NULL DEFAULT 1");
  addColumn(db, "applications", "bgv_status", "TEXT NOT NULL DEFAULT 'not_started'");
  addColumn(db, "applications", "offer_status", "TEXT");
}

module.exports = { openDb, DATA_DIR, UPLOAD_DIR, DB_PATH };
