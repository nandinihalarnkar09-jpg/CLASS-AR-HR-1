const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = process.env.ATS_DB_PATH || path.join(DATA_DIR, "meridian-ats.db");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function openDb() {
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
  migrate(db);
  return db;
}

function columnNames(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

function migrate(db) {
  if (!columnNames(db, "users").includes("password")) {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'Meridian@2026'");
  }
  if (!columnNames(db, "candidates").includes("portal_password")) {
    db.exec("ALTER TABLE candidates ADD COLUMN portal_password TEXT NOT NULL DEFAULT 'Welcome@123'");
  }
  if (!columnNames(db, "jobs").includes("description")) {
    db.exec("ALTER TABLE jobs ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  }
  if (!columnNames(db, "jobs").includes("requirements")) {
    db.exec("ALTER TABLE jobs ADD COLUMN requirements TEXT NOT NULL DEFAULT ''");
  }
  if (!columnNames(db, "jobs").includes("pay")) {
    db.exec("ALTER TABLE jobs ADD COLUMN pay TEXT NOT NULL DEFAULT ''");
  }
  if (!columnNames(db, "jobs").includes("benefits")) {
    db.exec("ALTER TABLE jobs ADD COLUMN benefits TEXT NOT NULL DEFAULT ''");
  }
}

module.exports = { openDb, DATA_DIR, UPLOAD_DIR, DB_PATH };
