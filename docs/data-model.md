# Relational data model — Meridian ATS

Designed for ~40 concurrent open positions, ~200 new candidates / month, and **3 years** of history (DPDP retention). Compensation and contact fields are personal data; access is role-gated and written to `audit_logs`.

## Entities

| Table | Purpose |
| --- | --- |
| `users` | Recruiter, TA head, hiring manager. |
| `clients` / `projects` | Every req maps to a **client project** with `billing_rate_inr` and `start_date` (notice-period risk). |
| `jobs` | Requisition: title, skills, experience band, CTC range, location, target close, assigned recruiter. |
| `consultancies` | Adecco / TeamLease / Randstad; default fee **8.33%** of annual CTC. |
| `candidates` | Person record. **`phone` UNIQUE** for duplicate outreach. Consent, purpose, `retention_until`. |
| `applications` | Many jobs per candidate (`UNIQUE(candidate_id, job_id)`). Stage + outcome. |
| `stage_history` | Forward/back moves with `moved_at` / `moved_by`. |
| `notes` | Free-text, author, timestamp. |
| `interviews` | Panel names, time, internal vs client round. |
| `offers` | Offered CTC and joining date. |
| `audit_logs` | DPDP processing log (read/create/update/resume download). |

## Application stage & outcome

- **Stage:** `applied` → `screened` → `internal_interview` → `client_round` → `offered` → `bgv` → `joined`
- **Outcome:** `active` \| `rejected` \| `dropped_out` \| `joined`

Reject reason codes: skills_mismatch, ctc_mismatch, notice_too_long, client_reject, internal_reject, bgv_fail, location, experience, other.

## Source types

`naukri` \| `linkedin` \| `referral` \| `consultancy` \| `direct`

## DPDP (v1 controls)

- No candidate insert without `consent_given`.
- Purpose string stored on the record.
- `retention_until` = capture date + 3 years.
- Hiring managers cannot create/edit candidates or jobs; CTC masked in API.
- Resume download and candidate reads are audited.
- Candidate self-service (apply / status) is **not** in v1.

SQL source of truth: [`server/schema.sql`](../server/schema.sql).
