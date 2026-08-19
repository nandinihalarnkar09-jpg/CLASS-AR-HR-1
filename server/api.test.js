const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ats-"));
process.env.ATS_DB_PATH = path.join(tmp, "test.db");

const { app, db } = require("./index");
let server;
let port;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  port = server.address().port;
});

after(() => {
  server.close();
  db.close();
});

function req(method, urlPath, body, userId = 2) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: urlPath,
        method,
        headers: {
          "content-type": "application/json",
          "x-user-id": String(userId),
          ...(data ? { "content-length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let json = null;
          try {
            json = buf ? JSON.parse(buf) : null;
          } catch {
            json = buf;
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

test("duplicate phone is rejected", async () => {
  const first = await req("POST", "/api/candidates", {
    name: "Test One",
    phone: "9991112222",
    email: "one@example.com",
    skills: "Java",
    source_type: "direct",
    notice_period_days: 30,
    total_experience_years: 4,
    consent_given: true,
  });
  assert.equal(first.status, 201);
  const dup = await req("POST", "/api/candidates", {
    name: "Test Two",
    phone: "9991112222",
    email: "two@example.com",
    skills: "Java",
    source_type: "naukri",
    consent_given: true,
  });
  assert.equal(dup.status, 409);
  assert.match(dup.json.error, /Duplicate/);
});

test("consent is required (DPDP)", async () => {
  const res = await req("POST", "/api/candidates", {
    name: "No Consent",
    phone: "9991113333",
    email: "nc@example.com",
    skills: "React",
    source_type: "direct",
    consent_given: false,
  });
  assert.equal(res.status, 400);
});

test("one candidate can link to two jobs", async () => {
  const created = await req("POST", "/api/candidates", {
    name: "Multi Apply",
    phone: "9991114444",
    email: "ma@example.com",
    skills: "Python, Spark",
    source_type: "linkedin",
    consent_given: true,
    notice_period_days: 60,
    total_experience_years: 5,
  });
  const a1 = await req("POST", "/api/applications", { candidate_id: created.json.id, job_id: 1 });
  const a2 = await req("POST", "/api/applications", { candidate_id: created.json.id, job_id: 3 });
  assert.equal(a1.status, 201);
  assert.equal(a2.status, 201);
});

test("stage move writes timestamped history", async () => {
  const pipe = await req("GET", "/api/pipeline");
  const card = pipe.json.items.find((i) => i.stage === "applied");
  assert.ok(card);
  const moved = await req("POST", `/api/applications/${card.id}/move`, { to_stage: "screened" });
  assert.equal(moved.status, 200);
  const detail = await req("GET", `/api/candidates/${card.candidate_id}`);
  const hist = detail.json.history.find((h) => h.to_stage === "screened" && h.application_id === card.id);
  assert.ok(hist);
  assert.ok(hist.moved_at);
});

test("hiring manager cannot create jobs", async () => {
  const res = await req("POST", "/api/jobs", { title: "X" }, 6);
  assert.equal(res.status, 403);
});
