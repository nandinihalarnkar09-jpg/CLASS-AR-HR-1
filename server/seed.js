const { openDb } = require("./db");
const { retentionUntil } = require("./constants");

function seed(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, role) VALUES (?, ?, ?)"
  );
  const users = [
    ["Priya Nair", "priya.nair@meridian.tech", "ta_head"],
    ["Arjun Mehta", "arjun.mehta@meridian.tech", "recruiter"],
    ["Sneha Iyer", "sneha.iyer@meridian.tech", "recruiter"],
    ["Rohit Sharma", "rohit.sharma@meridian.tech", "recruiter"],
    ["Ananya Gupta", "ananya.gupta@meridian.tech", "recruiter"],
    ["Vikram Rao", "vikram.rao@meridian.tech", "hiring_manager"],
    ["Meera Krishnan", "meera.krishnan@meridian.tech", "hiring_manager"],
    ["Karan Patel", "karan.patel@meridian.tech", "hiring_manager"],
  ];
  for (const u of users) insertUser.run(...u);

  const insertClient = db.prepare("INSERT INTO clients (name) VALUES (?)");
  for (const c of ["HDFC Bank", "Tata Motors", "Infosys BPM", "Reliance Jio", "Mahindra Finance"]) {
    insertClient.run(c);
  }

  const insertProject = db.prepare(
    "INSERT INTO projects (client_id, name, start_date, billing_rate_inr) VALUES (?, ?, ?, ?)"
  );
  insertProject.run(1, "Digital Lending Platform", "2026-09-15", 185000);
  insertProject.run(1, "Core Banking Modernisation", "2026-10-01", 210000);
  insertProject.run(2, "Connected Vehicle Analytics", "2026-09-01", 165000);
  insertProject.run(3, "KYC Automation", "2026-11-01", 140000);
  insertProject.run(4, "5G OSS Support", "2026-08-25", 175000);
  insertProject.run(5, "Collections Transformation", "2026-10-20", 150000);

  const insertCons = db.prepare(
    "INSERT INTO consultancies (name, fee_percent) VALUES (?, 8.33)"
  );
  for (const n of ["Adecco India", "TeamLease Digital", "Randstad India"]) {
    insertCons.run(n);
  }

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      title, client_id, project_id, skills_required, exp_min_years, exp_max_years,
      ctc_min_lpa, ctc_max_lpa, location, target_closure_date, recruiter_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(
    "Java Full Stack Engineer",
    1, 1, "Java, Spring Boot, React, PostgreSQL",
    4, 8, 18, 28, "Bengaluru", "2026-09-10", 2, "open"
  );
  insertJob.run(
    "React Frontend Developer",
    1, 2, "React, TypeScript, Redux, Jest",
    3, 6, 14, 22, "Hyderabad", "2026-09-20", 3, "open"
  );
  insertJob.run(
    "Data Engineer",
    2, 3, "Python, Spark, Kafka, AWS",
    5, 9, 20, 32, "Pune", "2026-08-28", 2, "open"
  );
  insertJob.run(
    "QA Automation Lead",
    3, 4, "Selenium, Cypress, Java, API Testing",
    6, 10, 16, 24, "Chennai", "2026-10-15", 4, "open"
  );
  insertJob.run(
    "DevOps Engineer",
    4, 5, "Kubernetes, Terraform, Jenkins, AWS",
    4, 7, 18, 26, "Mumbai", "2026-08-22", 5, "open"
  );
  insertJob.run(
    "Business Analyst — Collections",
    5, 6, "BFSI, SQL, Jira, Stakeholder Mgmt",
    5, 8, 15, 22, "Mumbai", "2026-10-01", 3, "open"
  );

  const insertCand = db.prepare(`
    INSERT INTO candidates (
      name, phone, email, current_company, current_ctc_lpa, expected_ctc_lpa,
      notice_period_days, total_experience_years, skills, source_type, source_detail,
      consultancy_id, referred_by, consent_given, consent_at, retention_until
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)
  `);

  const retain = retentionUntil();
  const candidates = [
    ["Aditya Menon", "9876500001", "aditya.menon@example.com", "Wipro", 16, 22, 90, 6.5, "Java, Spring Boot, React", "naukri", "Naukri search", null, null],
    ["Nisha Verma", "9876500002", "nisha.verma@example.com", "TCS", 14, 18, 30, 4.2, "React, TypeScript, Redux", "linkedin", "InMail", null, null],
    ["Farhan Qureshi", "9876500003", "farhan.q@example.com", "Capgemini", 22, 30, 60, 8, "Python, Spark, Kafka, AWS", "consultancy", "Adecco India", 1, null],
    ["Kavya Reddy", "9876500004", "kavya.reddy@example.com", "Accenture", 18, 24, 15, 5.5, "Java, Spring, Microservices", "referral", "Employee referral", null, "Vikram Rao"],
    ["Siddharth Jain", "9876500005", "sid.jain@example.com", "Cognizant", 15, 20, 90, 5, "Kubernetes, Terraform, AWS", "direct", "Career page", null, null],
    ["Pooja Desai", "9876500006", "pooja.desai@example.com", "L&T Infotech", 12, 16, 45, 3.8, "React, Jest, CSS", "naukri", "Job alert", null, null],
    ["Rahul Banerjee", "9876500007", "rahul.b@example.com", "HCLTech", 17, 23, 60, 7, "Selenium, Cypress, Java", "consultancy", "TeamLease Digital", 2, null],
    ["Ishita Bose", "9876500008", "ishita.bose@example.com", "Deloitte", 19, 26, 30, 6, "BFSI, SQL, Jira", "linkedin", "Recruiter outreach", null, null],
    ["Mohammed Irfan", "9876500009", "irfan.m@example.com", "Mindtree", 21, 28, 90, 8.5, "Java, PostgreSQL, Kafka", "consultancy", "Randstad India", 3, null],
    ["Anjali Kulkarni", "9876500010", "anjali.k@example.com", "Persistent", 13, 18, 0, 4, "Python, Spark, AWS", "referral", "Employee referral", null, "Meera Krishnan"],
    ["Varun Malhotra", "9876500011", "varun.m@example.com", "Tech Mahindra", 16, 21, 75, 5.8, "Kubernetes, Jenkins, Terraform", "naukri", "Hot vacancy", null, null],
    ["Divya Nambiar", "9876500012", "divya.n@example.com", "Oracle", 24, 32, 90, 9, "Java, Spring Boot, React", "linkedin", "Easy Apply", null, null],
  ];
  for (const c of candidates) insertCand.run(...c, retain);

  const insertApp = db.prepare(`
    INSERT INTO applications (candidate_id, job_id, stage, outcome, offered_ctc_lpa, joining_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const hist = db.prepare(`
    INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const apps = [
    [1, 1, "client_round", "active", null, null],
    [2, 2, "internal_interview", "active", null, null],
    [3, 3, "offered", "active", 28, "2026-10-15"],
    [4, 1, "bgv", "active", 24, "2026-09-01"],
    [5, 5, "screened", "active", null, null],
    [6, 2, "applied", "active", null, null],
    [7, 4, "client_round", "active", null, null],
    [8, 6, "screened", "active", null, null],
    [9, 1, "rejected", "rejected", null, null],
    [10, 3, "joined", "joined", 18, "2026-08-01"],
    [11, 5, "dropped_out", "dropped_out", null, null],
    [12, 1, "applied", "active", null, null],
    [2, 1, "screened", "active", null, null],
    [6, 6, "applied", "active", null, null],
  ];

  const tx = db.transaction(() => {
    for (const [cid, jid, stage, outcome, ctc, join] of apps) {
      const realStage = outcome === "rejected" || outcome === "dropped_out" ? "screened" : stage === "joined" ? "joined" : stage;
      const info = insertApp.run(cid, jid, realStage === "rejected" ? "screened" : realStage, outcome, ctc, join);
      hist.run(info.lastInsertRowid, null, realStage, outcome, 2, "Seeded pipeline");
    }
  });
  tx();

  db.prepare("INSERT INTO notes (candidate_id, author_id, body) VALUES (?, ?, ?)").run(
    3, 2, "Holds competing offer from Infosys (28 LPA). High dropout risk if we delay."
  );
  db.prepare("INSERT INTO notes (candidate_id, author_id, body) VALUES (?, ?, ?)").run(
    1, 3, "90-day notice. HDFC Digital Lending starts 15 Sep — flag as timeline risk."
  );
  db.prepare("INSERT INTO notes (candidate_id, author_id, body) VALUES (?, ?, ?)").run(
    4, 2, "BGV vendor: AuthBridge. Documents collected. Awaiting police verification."
  );

  db.prepare(`
    INSERT INTO interviews (application_id, round_type, panel_names, scheduled_at, location_or_link, created_by)
    VALUES (1, 'client', 'HDFC panel: Rakesh Iyer, Sunita Rao', '2026-08-21T15:00:00', 'Teams', 2)
  `).run();

  db.prepare(`
    INSERT INTO offers (application_id, offered_ctc_lpa, joining_date, status, created_by)
    VALUES (3, 28, '2026-10-15', 'pending', 2)
  `).run();
  db.prepare(`
    INSERT INTO offers (application_id, offered_ctc_lpa, joining_date, status, created_by)
    VALUES (4, 24, '2026-09-01', 'accepted', 2)
  `).run();
}

if (require.main === module) {
  const db = openDb();
  seed(db);
  console.log("Seed complete:", db.prepare("SELECT COUNT(*) AS n FROM candidates").get());
}

module.exports = { seed };
