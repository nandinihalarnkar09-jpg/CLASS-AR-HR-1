# Meridian ATS — P.R.O.T.O. artifacts

Live app: https://nandinihalarnkar09-jpg.github.io/CLASS-AR-HR-1/

## P — Problem

> "Four recruiters share one Excel file on a network drive — four versions of the truth. Last month two of
> them called the same candidate on the same day for two different roles, and she posted about it on LinkedIn.
> When a client asked for the status of a Java position, it took me a day and a half to answer. We have 60
> hires to close this quarter, attrition is near 20%, and I *feel* we lose about a third of candidates between
> offer and joining — but I can't prove it."
> — Head of Talent Acquisition, Meridian Technologies (450 people, Pune / Bengaluru / Goa)

- **Who:** Head of TA and 4 recruiters. **How often:** duplicate outreach weekly; client status questions every week.
- **Cost:** 24–36 hours per client status answer, reputational damage, and unmeasured offer drop-outs on 60 hires.

## R — Research

| Product | Built for whom | Pricing model | One thing it does badly for our user |
| --- | --- | --- | --- |
| Zoho Recruit | Staffing agencies and corporate HR, SMB | Free tier, then per-recruiter monthly subscription | Generic pipeline; no notion of a client project, billing rate or notice-period-vs-start-date risk |
| Keka (Hire) | Indian mid-market HR suite | Per-employee monthly, hiring as part of the HR suite | Strong on payroll/HRMS; recruiting is one module and has no client approval round as a first-class stage |
| Darwinbox | Large Indian enterprises | Quote-based enterprise licence | Too heavy and too expensive for a 4-recruiter team needing something in 2 weeks |
| greytHR | Indian SMB payroll and HR | Per-employee monthly | Payroll-first; recruiting is minimal |
| Naukri RMS | Recruiters already sourcing on Naukri | Subscription bundled with Naukri products | Optimised for one source, so it can't tell you which source actually works |
| Greenhouse (global) | Product companies, structured hiring | Quote-based | Built for product-company hiring, not client-billed IT services staffing; no DPDP focus |

**The gap we are aiming at:** an ATS for Indian IT-services firms where every requisition belongs to a client
project, the client round and BGV are mandatory stages, and notice period and offer-drop risk are visible before
they cost a billed start date.

*(Pricing models as publicly described by vendors; check vendor sites for current prices.)*

## O — Owners

| Role | Frequency | Primary need | Must not see |
| --- | --- | --- | --- |
| Recruiter (4) | All day | Fast data entry, duplicate warning, pipeline moves | Audit log, retention queue |
| Hiring manager (~15) | Weekly | Shortlist quality for **their** roles | Current / expected / offered CTC; candidates before Internal Interview; rejected candidates |
| Head of TA (1) | Daily / weekly | Dashboards: drop-out rate, source effectiveness, time-to-fill | — |
| Candidate | A few times per application | Status transparency, apply for jobs | Internal notes, other candidates, interview feedback, CTC of others |

## T — Tasks (user stories)

| ID | As a… I want to… so that… | Done when… |
| --- | --- | --- |
| US-01 | As a recruiter, I want to add a candidate against an open job, so that colleagues see they are already being pursued. | I can save name, phone, email, notice period and CTC; the candidate appears under that job; if the phone (incl. `+91` / leading `0`) exists I see a warning naming the job and recruiter before saving. |
| US-02 | As a recruiter, I want to link one candidate to several jobs, so that the same person can be at Client Round for one role and Rejected for another. | One candidate shows several applications, each with its own stage and outcome. |
| US-03 | As a recruiter, I want to record the source of every candidate, so that the TA head can see which source works. | Source is mandatory (Naukri / LinkedIn / Referral / named consultancy / Direct) and appears on the dashboard. |
| US-04 | As a recruiter, I want to move a candidate to the next stage, so that the pipeline reflects reality without Excel. | The card moves, the change is timestamped with who moved it, I can move backward, and I cannot skip Client Round or BGV. |
| US-05 | As a recruiter, I want to reject or mark a drop-out with a reason code, so that we learn why we lose people. | Reason codes are required and listed in the pipeline's Rejected / Dropped list. |
| US-06 | As a recruiter, I want to mark BGV status, so that nobody joins without verification. | A candidate cannot be marked Joined until BGV is Clear. |
| US-07 | As a recruiter, I want to add notes, so that context is not lost. | Notes show author and time; candidates never see them. |
| US-08 | As a recruiter, I want to see notice-period risk against project start, so that I don't pursue someone who can't join in time. | Cards are flagged when notice is longer than the days left before project start. |
| US-09 | As a hiring manager, I want to see only shortlisted candidates for my roles, so that I'm not reviewing people already rejected. | I see Internal Interview and later only, for jobs where I'm the hiring manager; no rejected candidates; no salary field anywhere. |
| US-10 | As the TA head, I want to see the offer → joining drop-out rate, so that I can prove (or disprove) "about a third". | Dashboard shows offers with a final outcome, how many dropped, and the %. |
| US-11 | As the TA head, I want to see likely drop-outs before they happen, so that recruiters can intervene. | Offers are flagged high/medium on clear rules: other offers held, notice ≥ 60 days, offer below expectation. |
| US-12 | As the TA head, I want join rate and consultancy fees per source, so that I renew only consultancies that work. | Dashboard lists applications, client-round reach, joins, drop-outs, join % and 8.33% fees per source. |
| US-13 | As the TA head, I want records past 3 years erased, so that we comply with the DPDP Act. | A retention queue lists expired records; erasing removes personal data but keeps anonymous statistics; erasures are audited. |
| US-14 | As a candidate, I want to see my application status and apply to open roles, so that I don't have to chase recruiters. | I see only my own applications and stages; I can apply with a PDF CV; I can withdraw consent and erase my data. |

## Bridge — nouns to data model

| Noun / table | Fields it holds | Connects to |
| --- | --- | --- |
| Client / Project | name; project start date, billing rate | Project → many Jobs |
| Job (requisition) | title, skills, experience band, CTC range, location, target close, openings, JD | Client, Project, Recruiter, Hiring manager; many Applications |
| Candidate | name, phone (unique, normalised), email, company, current/expected CTC, notice, experience, skills, source, consent, retention date | many Applications, many Notes |
| Application | candidate, job, stage, outcome, reject/drop reasons, offer CTC, joining date, BGV status | one Job, one Candidate, many Stage history rows, Interviews, Offers |
| Stage history | from → to, outcome, who, when | one Application |
| Note | body, author, time | one Candidate, one User |
| User | name, email, role | Jobs (as recruiter / HM), Notes |

**Application is a thing in its own right**, which is why one person can be at Client Round for one job and Rejected for another at the same time. Full schema: [`server/schema.sql`](../server/schema.sql).

## O — One slice

**Core loop:** A recruiter can take one candidate from Applied to Joined — through the client round and BGV — without opening Excel.

| Must have (built) | Should have (built) | Could have (built in v1) | Will not have — and why |
| --- | --- | --- | --- |
| Job requisition tied to client project | Resume upload (local app) | Candidate self-service portal | **Payroll** — a separate product (greytHR/Keka already do it) |
| Candidate record | Skill, source and notice-period filters | Offer-drop risk flag (rules, not AI) | **Onboarding after joining** — starts where the ATS ends |
| Application (many jobs per candidate) | Recruiter + hiring-manager assignment per job | Consultancy commission (8.33%) | **Performance management** — different users, different product |
| Pipeline stages incl. Rejected / Dropped Out | Interview scheduling (panel, time) | Audit log + DPDP retention / erasure | **Anything AI-powered in v1** — explicit client instruction |
| Timestamped stage moves, backward allowed | Offer details (CTC, joining date) | Mobile layout for hiring managers | **Naukri / LinkedIn integration** — needs paid API access; recruiters paste for now |
| Duplicate phone detection | Dashboard: stages, time-to-fill, offer drop-out | | **Bulk resume import, automated email templates, client-facing report** — deferred (cut test 2: a human can do it manually for now) |
| Notes with author and time | Reject reason codes | | |
| Source tracking | Email candidate (mailto) | | |

**Definitions agreed:** time-to-fill = requisition opened → candidate joined. Offer drop-out rate = dropped ÷ (joined + dropped) among applications that reached Offered.

## What broke and how we fixed it

The app worked on the developer's laptop but not on the client's Windows PC: `npm install` failed because the
`better-sqlite3` database driver must be compiled natively, so the API never started and the site silently fell back
to a hand-written browser demo whose data and rules had drifted from the server. The GitHub Pages deploy had also
failed on every push because Pages was never enabled for the repository, so there was no live URL. We replaced the
native driver with Node's built-in SQLite (nothing to compile), made the live site use data exported from the same
server seed and the same rules (hiring-manager visibility, one-stage-at-a-time moves, BGV before joining), made the
seed dates relative to today so project start dates are never in the past, and switched the deploy to publish to a
`gh-pages` branch.
