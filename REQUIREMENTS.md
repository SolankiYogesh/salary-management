# Requirements — Salary Management Software

## Goal

Give an HR Manager at a 10,000-employee, multi-country organization a web app to
manage employee salary data and answer questions about how the org pays people,
replacing spreadsheets.

## Scope (in)

- **Employee directory**: search, filter (department, country, status), paginate
  across 10,000 employees. Server-side pagination — never ship 10k rows to a browser tab.
- **Employee profile**: personal + job details (department, title, level, country,
  hire date, status) and full salary history.
- **Salary changes as an audit trail**: a salary is never edited in place. Every
  hire, raise, market adjustment, promotion, demotion or correction is a new,
  timestamped `SalaryRecord`. The "current salary" is derived (latest effective
  record), never stored redundantly — one source of truth, no sync bugs.
- **Add employee** (with a starting salary) and **record a salary change** for an
  existing employee, with basic domain validation (e.g. effective date can't
  predate hire date; a terminated employee can only get a `CORRECTION` record).
- **Pay analytics dashboard**: headcount, total payroll, average/median salary,
  breakdowns by department/country/level, a salary distribution histogram, and a
  gender pay-gap-by-department view — the actual "how do we pay people" questions
  an HR Manager asks. All cross-country numbers are normalized to USD.
- **Multi-currency**: each employee is paid in their country's currency; a fixed
  exchange-rate table normalizes analytics to USD.
- **Seed data**: a deterministic script generating 10,000 employees with realistic
  departments, levels, countries and multi-year salary histories, so the app is
  demoable immediately.

## Scope (out) — and why

- **Auth / roles / multi-tenant**. The brief names a single persona (one HR
  Manager). Building login, sessions, and role checks would spend the whole time
  budget on plumbing that doesn't change the salary-management problem. Flagged as
  the first thing to add before this touches real data.
- **Payroll processing, tax/benefits calculation, bank integration**. This is a
  salary *records* system, not a payroll *run* system — a materially different,
  much larger problem (tax tables per country, pay cycles, deductions).
- **Live FX rates**. Rates are a static seed-time table. A real deployment would
  pull from a provider and timestamp each conversion; for analytics on a snapshot
  of current salaries, a fixed table is simpler and deterministic for tests.
- **Approval workflows for salary changes**. Real orgs gate raises behind manager/
  finance sign-off. Out of scope here; the data model (an immutable, reason-coded
  `SalaryRecord` ledger) is intentionally shaped so an approval step could be
  inserted later without a schema rewrite.
- **Editing or deleting past salary records**. Salary history is an append-only
  audit log by design — correcting a mistake appends a `CORRECTION` record rather
  than rewriting history, which is how real compensation audits work.
- **i18n / localized UI text**. Only currency and numbers are locale-aware.
- **Org chart / manager hierarchy**. Interesting for future "span of control"
  analytics, not needed to answer the pay questions in scope now.

## Deployment

Shipped as a reliable one-command local run (seed script + `npm run dev` on
both sides) rather than a hosted URL. A live deployment needs real
infrastructure decisions (where SQLite's file persists, what serves the
Next.js build) that depend on accounts and constraints outside this exercise;
a working `git clone && npm install && npm run seed && npm run dev` is more
useful to a reviewer than a demo link that may be asleep, rate-limited, or
gone by the time it's reviewed.

## Technical approach

Node.js + TypeScript + Express REST API, Prisma + SQLite (per the assessment's own
suggestion), Next.js + TypeScript frontend. Full rationale, data model and
trade-offs are in `SYSTEM_DESIGN.md`.
