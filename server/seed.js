const { openDb } = require("./db");
const { retentionUntil } = require("./constants");

const JOB_DETAILS = {
  "Java Full Stack Engineer": {
    description:
      "Build and own end-to-end features on the HDFC Digital Lending Platform: REST APIs in Spring Boot, React screens for loan origination, and PostgreSQL data model changes. You will work with the client squad in Bengaluru, take part in client-round demos, and support production releases against a billed monthly rate.",
    requirements:
      "4–8 years in Java (17+) and Spring Boot\nHands-on React and PostgreSQL\nExperience on banking or lending systems preferred\nNotice period must fit a 15 Sep 2026 project start\nWillingness to join after BGV clearance",
    pay: "₹18–28 LPA CTC (about 80% fixed + 20% variable). Joining bonus ₹1,00,000 after 90 days in employment.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh floater + personal accident cover\nHybrid: 8 office / 12 WFH days per month after probation\n₹25,000 annual learning budget and certification support\nRelocation assistance up to ₹50,000 for Bengaluru joins\n13th-month payout in December if billed utilisation ≥80%",
  },
  "React Frontend Developer": {
    description:
      "Create accessible, tested UI for HDFC Core Banking Modernisation. You will implement TypeScript React modules, Redux state, and Jest coverage, then present builds in the internal interview and a client round with HDFC panel.",
    requirements:
      "3–6 years of React and TypeScript\nRedux (or equivalent) and Jest/RTL\nStrong CSS and design-system discipline\nComfortable with Hyderabad hybrid delivery\nCTC expectation within 14–22 LPA",
    pay: "₹14–22 LPA CTC (85% fixed + 15% variable). No joining bonus; review at 12 months.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh floater\nHyderabad hybrid (3 days office)\nInternet stipend ₹1,500/month\n₹20,000 annual learning budget\nPaid parental leave as per company policy",
  },
  "Data Engineer": {
    description:
      "Design Spark/Kafka pipelines on AWS for Tata Motors Connected Vehicle Analytics. You will ingest telemetry, publish curated datasets, and support analysts. Client approval is required before offer; BGV is mandatory before joining.",
    requirements:
      "5–9 years in data engineering\nPython, Spark, Kafka, and AWS (S3/EMR/MSK)\nPerformance tuning on large batch/stream jobs\nAble to work from Pune with travel to client sites\nNotice period compatible with 1 Sep 2026 start",
    pay: "₹20–32 LPA CTC (80% fixed + 20% variable). Spot bonus for on-time pipeline go-live.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹7.5 lakh floater (senior band)\nPune office + client travel reimbursed at actuals\nNight-support allowance if production windows slip to IST late hours\n₹30,000 annual cloud certification budget\nTerm life cover 3× CTC",
  },
  "QA Automation Lead": {
    description:
      "Lead automation for Infosys BPM KYC Automation: framework design in Selenium/Cypress, API test packs, and a small QA pod. You will define exit criteria for client round and sign off BGV-ready releases.",
    requirements:
      "6–10 years in QA with 2+ years leading automation\nJava, Selenium, Cypress, REST API testing\nCI integration (Jenkins/GitHub Actions)\nChennai-based or ready to relocate\nExperience in BFSI/KYC is a plus",
    pay: "₹16–24 LPA CTC (80% fixed + 20% variable). Team-lead allowance ₹15,000/month after confirmation.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh floater\nRelocation to Chennai up to ₹40,000\nShift allowance if UAT overlaps client US hours\n₹25,000 learning budget\n12 casual + 12 earned leave",
  },
  "DevOps Engineer": {
    description:
      "Run Kubernetes, Terraform, and Jenkins for Reliance Jio 5G OSS support. You will own environments, deployment pipelines, and on-call for billed production windows. Client round with Jio OSS stakeholders is required.",
    requirements:
      "4–7 years DevOps/SRE\nKubernetes, Terraform, Jenkins, AWS\nLinux, networking, and observability (Prometheus/Grafana)\nMumbai location preferred\n90-day notice only if project start can slip; 25 Aug start is tight",
    pay: "₹18–26 LPA CTC (75% fixed + 25% variable tied to uptime SLAs). On-call stipend ₹8,000/month.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh + enhanced accident cover for on-call staff\nMumbai hybrid 4 days office during hypercare\nMeal coupons ₹2,200/month\n₹30,000 CKA/CKS certification support\nComp-off for weekend production windows",
  },
  "Business Analyst — Collections": {
    description:
      "Translate Mahindra Finance Collections Transformation needs into user stories, SQL-backed reports, and UAT scripts. You will sit with operations SMEs, facilitate internal and client workshops, and track drop-off between offer and joining.",
    requirements:
      "5–8 years BA experience, ideally BFSI collections\nSQL, Jira, and stakeholder management\nAbility to write clear acceptance criteria\nMumbai-based\nComfortable with a 20 Oct 2026 programme start",
    pay: "₹15–22 LPA CTC (90% fixed + 10% variable). No joining bonus.",
    benefits:
      "PF and gratuity as per Indian law\nFamily mediclaim ₹5 lakh floater\nMumbai office 5 days during workshops, then 3+2 hybrid\nLTA as per IT rules\n₹15,000 domain (NCFM/IIBF) course support\nStandard 12+12 leave plus 3 volunteering days",
  },
};

function applyJobDetails(db) {
  const upd = db.prepare("UPDATE jobs SET description = ?, requirements = ?, pay = ?, benefits = ? WHERE title = ?");
  for (const [title, d] of Object.entries(JOB_DETAILS)) {
    upd.run(d.description, d.requirements, d.pay, d.benefits, title);
  }
}

const D = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function seed(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) {
    applyJobDetails(db);
    return;
  }

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
  insertProject.run(1, "Digital Lending Platform", D(21), 185000);
  insertProject.run(1, "Core Banking Modernisation", D(35), 210000);
  insertProject.run(2, "Connected Vehicle Analytics", D(14), 165000);
  insertProject.run(3, "KYC Automation", D(60), 140000);
  insertProject.run(4, "5G OSS Support", D(10), 175000);
  insertProject.run(5, "Collections Transformation", D(45), 150000);

  const insertCons = db.prepare(
    "INSERT INTO consultancies (name, fee_percent) VALUES (?, 8.33)"
  );
  for (const n of ["Adecco India", "TeamLease Digital", "Randstad India"]) {
    insertCons.run(n);
  }

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      title, client_id, project_id, skills_required, exp_min_years, exp_max_years,
      ctc_min_lpa, ctc_max_lpa, location, target_closure_date, recruiter_id, status,
      description, requirements, pay, benefits
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(
    "Java Full Stack Engineer",
    1, 1, "Java, Spring Boot, React, PostgreSQL",
    4, 8, 18, 28, "Bengaluru", D(18), 2, "open",
    JOB_DETAILS["Java Full Stack Engineer"].description,
    JOB_DETAILS["Java Full Stack Engineer"].requirements,
    JOB_DETAILS["Java Full Stack Engineer"].pay,
    JOB_DETAILS["Java Full Stack Engineer"].benefits
  );
  insertJob.run(
    "React Frontend Developer",
    1, 2, "React, TypeScript, Redux, Jest",
    3, 6, 14, 22, "Pune", D(30), 3, "open",
    JOB_DETAILS["React Frontend Developer"].description,
    JOB_DETAILS["React Frontend Developer"].requirements,
    JOB_DETAILS["React Frontend Developer"].pay,
    JOB_DETAILS["React Frontend Developer"].benefits
  );
  insertJob.run(
    "Data Engineer",
    2, 3, "Python, Spark, Kafka, AWS",
    5, 9, 20, 32, "Pune", D(12), 2, "open",
    JOB_DETAILS["Data Engineer"].description,
    JOB_DETAILS["Data Engineer"].requirements,
    JOB_DETAILS["Data Engineer"].pay,
    JOB_DETAILS["Data Engineer"].benefits
  );
  insertJob.run(
    "QA Automation Lead",
    3, 4, "Selenium, Cypress, Java, API Testing",
    6, 10, 16, 24, "Goa", D(50), 4, "open",
    JOB_DETAILS["QA Automation Lead"].description,
    JOB_DETAILS["QA Automation Lead"].requirements,
    JOB_DETAILS["QA Automation Lead"].pay,
    JOB_DETAILS["QA Automation Lead"].benefits
  );
  insertJob.run(
    "DevOps Engineer",
    4, 5, "Kubernetes, Terraform, Jenkins, AWS",
    4, 7, 18, 26, "Bengaluru", D(-3), 5, "open",
    JOB_DETAILS["DevOps Engineer"].description,
    JOB_DETAILS["DevOps Engineer"].requirements,
    JOB_DETAILS["DevOps Engineer"].pay,
    JOB_DETAILS["DevOps Engineer"].benefits
  );
  insertJob.run(
    "Business Analyst — Collections",
    5, 6, "BFSI, SQL, Jira, Stakeholder Mgmt",
    5, 8, 15, 22, "Pune", D(40), 3, "open",
    JOB_DETAILS["Business Analyst — Collections"].description,
    JOB_DETAILS["Business Analyst — Collections"].requirements,
    JOB_DETAILS["Business Analyst — Collections"].pay,
    JOB_DETAILS["Business Analyst — Collections"].benefits
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
    [3, 3, "offered", "active", 28, D(40)],
    [4, 1, "bgv", "active", 24, D(20)],
    [5, 5, "screened", "active", null, null],
    [6, 2, "applied", "active", null, null],
    [7, 4, "client_round", "active", null, null],
    [8, 6, "screened", "active", null, null],
    [9, 1, "rejected", "rejected", null, null],
    [10, 3, "joined", "joined", 18, D(-20)],
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
    VALUES (1, 'client', 'HDFC panel: Rakesh Iyer, Sunita Rao', ?, 'Teams', 2)
  `).run(D(2) + "T15:00");

  db.prepare(`
    INSERT INTO offers (application_id, offered_ctc_lpa, joining_date, status, created_by)
    VALUES (3, 28, ?, 'pending', 2)
  `).run(D(40));
  db.prepare(`
    INSERT INTO offers (application_id, offered_ctc_lpa, joining_date, status, created_by)
    VALUES (4, 24, ?, 'accepted', 2)
  `).run(D(20));
  applyJobDetails(db);
  seedHistory(db);
}

// Requisition ages, hiring-manager ownership, risk signals and 6 months of closed offers so the
// dashboard can answer "how many do we lose between offer and joining?" with real numbers.
function seedHistory(db) {
  const ages = [45, 38, 52, 20, 60, 25];
  ages.forEach((age, i) => {
    db.prepare("UPDATE jobs SET created_at = ?, hiring_manager_id = ? WHERE id = ?").run(D(-age) + " 09:00:00", [6, 6, 7, 7, 8, 8][i], i + 1);
  });
  db.prepare("UPDATE jobs SET openings = 3 WHERE id = 1").run();
  db.prepare("UPDATE candidates SET holds_other_offers = 1 WHERE id IN (3, 12)").run();
  db.prepare("UPDATE applications SET bgv_status = 'in_progress' WHERE stage = 'bgv'").run();
  db.prepare("UPDATE applications SET bgv_status = 'clear' WHERE outcome = 'joined'").run();

  const job = db.prepare(`INSERT INTO jobs (title, client_id, project_id, skills_required, exp_min_years, exp_max_years,
    ctc_min_lpa, ctc_max_lpa, location, target_closure_date, recruiter_id, status, created_at, openings, hiring_manager_id,
    description) VALUES ('Java Developer (closed batch)', 1, 1, 'Java, Spring Boot', 3, 7, 12, 22, 'Pune', ?, 2, 'filled', ?, 10, 6,
    'Historical batch hire for earlier client ramp-up.')`).run(D(-60), D(-180) + " 09:00:00").lastInsertRowid;

  const people = [
    ["Rakesh Pillai", "joined", "naukri", null], ["Sana Shaikh", "joined", "referral", null],
    ["Gaurav Joshi", "dropped_out", "consultancy", 1], ["Neha Kapoor", "joined", "linkedin", null],
    ["Arvind Swamy", "dropped_out", "naukri", null], ["Priyanka Das", "joined", "consultancy", 2],
    ["Tarun Sethi", "dropped_out", "linkedin", null], ["Lakshmi Rao", "joined", "consultancy", 3],
    ["Manish Tiwari", "joined", "direct", null],
  ];
  const reasons = ["Accepted competing offer", "Took counter-offer from current employer", "Current employer would not release early"];
  let r = 0;
  people.forEach(([name, outcome, src, cons], i) => {
    const phone = "98765100" + String(10 + i);
    const created = D(-170 + i * 4);
    const cid = db.prepare(`INSERT INTO candidates (name, phone, email, current_company, current_ctc_lpa, expected_ctc_lpa,
      notice_period_days, total_experience_years, skills, source_type, source_detail, consultancy_id, consent_given, consent_at,
      retention_until, created_at) VALUES (?, ?, ?, 'Infosys', 12, 17, ?, 5, 'Java, Spring Boot', ?, ?, ?, 1, ?, ?, ?)`)
      .run(name, phone, name.toLowerCase().replace(" ", ".") + "@example.com", outcome === "joined" ? 30 : 90, src,
        src === "consultancy" ? "Consultancy submission" : "Sourced", cons, created, D(3 * 365 - 170 + i * 4), created).lastInsertRowid;
    const ctc = 16 + (i % 4);
    const aid = db.prepare(`INSERT INTO applications (candidate_id, job_id, stage, outcome, offered_ctc_lpa, joining_date,
      offer_status, bgv_status, dropout_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(cid, job, outcome === "joined" ? "joined" : "offered", outcome, ctc, D(-110 + i * 4),
        outcome === "joined" ? "accepted" : "declined", outcome === "joined" ? "clear" : "not_started",
        outcome === "joined" ? null : reasons[r++ % 3], created, D(-110 + i * 4)).lastInsertRowid;
    const h = db.prepare("INSERT INTO stage_history (application_id, from_stage, to_stage, outcome, moved_by, moved_at, note) VALUES (?, ?, ?, ?, 2, ?, ?)");
    h.run(aid, "client_round", "offered", "active", D(-140 + i * 4) + " 11:00:00", "Offer released");
    if (outcome === "joined") h.run(aid, "bgv", "joined", "joined", D(-110 + i * 4) + " 10:00:00", "Joined");
    else h.run(aid, "offered", "offered", "dropped_out", D(-115 + i * 4) + " 10:00:00", "Dropped after offer");
  });

  // Two records captured over 3 years ago: they appear in the DPDP retention queue.
  ["Old Applicant One", "Old Applicant Two"].forEach((name, i) => {
    db.prepare(`INSERT INTO candidates (name, phone, email, notice_period_days, total_experience_years, skills, source_type,
      consent_given, consent_at, retention_until, created_at) VALUES (?, ?, ?, 30, 4, 'PHP', 'naukri', 1, ?, ?, ?)`)
      .run(name, "98765200" + String(10 + i), `old${i + 1}@example.com`, D(-1180), D(-85 - i * 10), D(-1180));
  });
}

if (require.main === module) {
  const db = openDb();
  seed(db);
  console.log("Seed complete:", db.prepare("SELECT COUNT(*) AS n FROM candidates").get());
}

module.exports = { seed };
