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

test("recruiter and candidate can log in", async () => {
  const staff = await req("POST", "/api/auth/login", {
    portal: "staff",
    email: "arjun.mehta@meridian.tech",
    password: "Meridian@2026",
  });
  assert.equal(staff.status, 200);
  assert.equal(staff.json.type, "staff");
  assert.equal(staff.json.user.role, "recruiter");

  const cand = await req("POST", "/api/auth/login", {
    portal: "candidate",
    email: "aditya.menon@example.com",
    password: "Welcome@123",
  });
  assert.equal(cand.status, 200);
  assert.equal(cand.json.type, "candidate");

  const bad = await req("POST", "/api/auth/login", {
    portal: "staff",
    email: "arjun.mehta@meridian.tech",
    password: "wrong",
  });
  assert.equal(bad.status, 401);
});

test("candidate cannot open recruiter APIs", async () => {
  const res = await new Promise((resolve, reject) => {
    const r = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/jobs",
        method: "GET",
        headers: { "x-auth-role": "candidate", "x-candidate-id": "1" },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => resolve({ status: res.statusCode, json: JSON.parse(buf || "{}") }));
      }
    );
    r.on("error", reject);
    r.end();
  });
  assert.equal(res.status, 403);
});

test("US-01: +91 and leading-0 phone variants are caught as duplicates", async () => {
  const r = await req("GET", "/api/candidates/check-phone?phone=" + encodeURIComponent("+91 98765 00001"));
  assert.equal(r.json.duplicate, true);
  assert.ok(r.json.activeWith.length >= 1);
  const r2 = await req("GET", "/api/candidates/check-phone?phone=09876500001");
  assert.equal(r2.json.duplicate, true);
});

test("US-04: stages cannot be skipped", async () => {
  const pipe = await req("GET", "/api/pipeline");
  const card = pipe.json.items.find((i) => i.stage === "screened");
  const res = await req("POST", `/api/applications/${card.id}/move`, { to_stage: "offered" });
  assert.equal(res.status, 400);
});

test("US-06: joining requires BGV clear", async () => {
  const pipe = await req("GET", "/api/pipeline");
  const card = pipe.json.items.find((i) => i.stage === "bgv");
  const blocked = await req("POST", `/api/applications/${card.id}/move`, { to_stage: "joined" });
  assert.equal(blocked.status, 400);
  await req("POST", `/api/applications/${card.id}/bgv`, { bgv_status: "clear" });
  const ok = await req("POST", `/api/applications/${card.id}/move`, { to_stage: "joined" });
  assert.equal(ok.status, 200);
});

test("US-09: hiring manager sees only shortlisted candidates for own roles, no salary", async () => {
  const pipe = await req("GET", "/api/pipeline", null, 6);
  assert.ok(pipe.json.items.length > 0);
  for (const i of pipe.json.items) {
    assert.ok(["internal_interview", "client_round", "offered", "bgv", "joined"].includes(i.stage));
    assert.equal(i.current_ctc_lpa, null);
    assert.equal(i.expected_ctc_lpa, null);
    assert.equal(i.offered_ctc_lpa, null);
  }
  assert.equal(pipe.json.terminal.length, 0);
  const move = await req("POST", `/api/applications/${pipe.json.items[0].id}/move`, { to_stage: "screened" }, 6);
  assert.equal(move.status, 403);
});

test("US-10/13: dashboard drop-out rate and DPDP erasure", async () => {
  const d = await req("GET", "/api/dashboard", null, 1);
  assert.ok(d.json.offerCohort.dropRatePct > 0);
  const due = await req("GET", "/api/privacy/retention", null, 1);
  assert.ok(due.json.length >= 1);
  const er = await req("POST", `/api/privacy/erase/${due.json[0].id}`, {}, 1);
  assert.equal(er.status, 200);
  const c = await req("GET", `/api/candidates/${due.json[0].id}`, null, 1);
  assert.match(c.json.candidate.name, /Erased/);
  const recruiterTry = await req("GET", "/api/privacy/retention", null, 2);
  assert.equal(recruiterTry.status, 403);
});
