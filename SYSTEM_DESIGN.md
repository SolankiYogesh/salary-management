# System Design

See `REQUIREMENTS.md` for scope. This document covers architecture, data model,
API design, and the trade-offs behind them.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js, TypeScript, Express | Matches the role (Node/React/TS); Express is minimal enough that the design decisions are mine, not the framework's. |
| Database | SQLite via Prisma | Assessment's own suggestion. Zero infra to run the grader's copy; a schema this simple doesn't need Postgres. Prisma gives migrations, a typed client, and raw-SQL escape hatches when needed. |
| Frontend | Next.js (App Router), TypeScript | Specified in the brief. Pages are client components — this is an internal dashboard behind no auth, every screen needs live data, so SSR/static generation buys nothing. |
| UI components | shadcn/ui (on Base UI, Tailwind v4) | Accessible primitives, owns the code (no black-box dependency), fast to assemble a data-heavy admin UI. |
| Data fetching | TanStack Query | Caching, request de-dupe, loading/error state, without hand-rolling `useEffect` fetch logic. |
| Charts | Recharts | Declarative, small API surface, enough for bar/pie/histogram. |
| Forms | react-hook-form + zod | Same zod schemas shape backend validation; one mental model for "what's a valid employee". |
| Testing | Vitest (+ Supertest for API) | Fast, Jest-compatible, no separate runner per package. |

## Data model

```
Employee
├─ id, employeeCode, firstName, lastName, email, gender
├─ country, currency        (currency derived from country at creation time)
├─ department, jobTitle, level
├─ status (ACTIVE | TERMINATED)
├─ hireDate
└─ salaryRecords[]

SalaryRecord                 (immutable, append-only)
├─ employeeId
├─ amount, currency
├─ reason (HIRE | ANNUAL_REVIEW | PROMOTION | MARKET_ADJUSTMENT | DEMOTION | CORRECTION)
├─ effectiveDate
└─ note?

ExchangeRate
├─ currency (PK)
└─ rateToUsd                 (fixed seed-time snapshot, see "Multi-currency" below)
```

**The core decision**: an employee's salary is never stored as a column on
`Employee` and never updated in place. It's always *derived* — the
`SalaryRecord` with the latest `effectiveDate` (ties broken by `createdAt`).
Two reasons:

1. **It's how comp actually works.** HR needs to answer "what did this person
   earn in 2023" just as often as "what do they earn now." A single mutable
   `salary` column can't answer that; a ledger can.
2. **It removes a whole class of bugs.** There's no `employee.salary` that can
   drift out of sync with `salaryRecords`— there's one source of truth, and
   "current salary" is a pure function (`pickCurrentSalaryRecord`, tested on
   both backend and frontend) over it.

The same function is duplicated once, intentionally, in `backend/src/modules/
salaries/salaries.service.ts` and `frontend/src/lib/salary.ts`. The backend
also returns salary history pre-sorted, so in practice the frontend copy is a
defensive display-layer guarantee, not a second source of truth — but it's a
real duplication and the honest trade-off is: a shared `packages/shared` module
would remove it, at the cost of a monorepo build step this project doesn't
otherwise need. Not worth it at this scope.

## Multi-currency

Each employee is paid in their own country's currency. Analytics need a single
number to sum/average/compare across countries, so every aggregate query joins
against a small `ExchangeRate` table (seeded once, fixed) and converts to USD.
This is **a snapshot, not a live feed** — a real deployment would pull daily
rates from a provider and probably timestamp each conversion. For a system
whose job is "what do we pay people *right now*", a fixed table is simpler,
deterministic (tests don't flake on network calls or rate drift), and honest
about its limitation (documented in `REQUIREMENTS.md`).

## API

REST, under `/api`:

```
GET    /api/employees                        search, filter, sort, paginate
GET    /api/employees/:id                     profile + full salary history
POST   /api/employees                         create (+ initial HIRE record, one transaction)
PATCH  /api/employees/:id                     update profile fields
GET    /api/employees/:id/salary-records      history (same data as /employees/:id, exposed standalone)
POST   /api/employees/:id/salary-records      record a raise/adjustment/correction
GET    /api/analytics/overview                headcount, total payroll, avg/median (USD)
GET    /api/analytics/breakdown/:dimension    department | country | level
GET    /api/analytics/distribution            salary histogram buckets
GET    /api/analytics/gender-pay-gap          avg pay by gender, per department
GET    /api/meta                              dropdown data (countries, departments, levels, ...)
```

Each route is a thin Express handler → zod-validated input → a service
function that holds the actual logic. Services are plain functions, no DI
container, no classes with single methods pretending to be services — there's
one Express app, this is proportionate.

**Two business rules live in `salaries.service.ts`**, not the database or the
UI, because they're domain rules, not storage constraints:
- A salary record's `effectiveDate` can't predate the employee's `hireDate`.
- A terminated employee can only receive a `CORRECTION` record (you can fix a
  past mistake; you can't give a raise to someone who no longer works here).

## Listing 10,000+ employees without shipping 10,000 rows to a browser

`GET /api/employees` always paginates server-side (default 25/page, capped at
100). The list query is a single hand-written SQL query (via
`prisma.$queryRaw`) that joins each employee to their *latest* salary record
through a correlated subquery:

```sql
LEFT JOIN SalaryRecord s ON s.id = (
  SELECT sr.id FROM SalaryRecord sr
  WHERE sr.employeeId = e.id
  ORDER BY sr.effectiveDate DESC, sr.createdAt DESC
  LIMIT 1
)
```

This was a deliberate choice over Prisma's query builder: "give me each
employee's current salary" is a correlated-subquery problem, and Prisma's ORM
API doesn't express that directly — the alternative is N+1 queries or pulling
every salary record into memory. One raw, parameterized (via `Prisma.sql`,
never string concatenation) query scales to the dataset size that matters
here.

**Known trade-off**: sorting by `currentSalaryUsd` and the USD conversion
itself happen in Node after the query runs, not in SQL, because the
conversion needs the `ExchangeRate` join and SQLite's query planner handles
that better as "fetch matching rows, convert, sort" at this scale (10k rows,
few hundred KB) than as a more complex single query. Profiled: this list
endpoint responds in low single-digit milliseconds against the full seeded
dataset. At 100k+ rows this would need to move into the query (or a
materialized `currentSalaryUsd` column maintained on write) — noted here so
it's a known lever, not a surprise.

## Analytics

Each analytics endpoint reuses one function,
`getActiveEmployeeSalarySnapshots()` — one query joining Employee ×
latest-SalaryRecord × ExchangeRate for every active employee — and then a set
of **pure functions** (`computeOverview`, `computeBreakdownBy`,
`computeDistribution`, `computeGenderPayGap`) do the actual math over plain
arrays. That split is why the analytics logic has unit tests that run in
milliseconds with no database at all: the hard-to-get-wrong part (percentages,
medians, bucketing) is isolated from the part that's hard to get fast
(the SQL).

## Seeding 10,000 employees

`prisma/seed.ts` generates 10,000 employees (names via `@faker-js/faker`,
`faker.seed(42)`) across 8 countries, 10 departments, and 9 levels, each with
a realistic multi-year salary history (a `HIRE` record plus 0–5 raises spaced
roughly annually). The whole run takes **~1–2 seconds** via batched
`createMany` calls (chunked at 1,000–2,000 rows) instead of 10,000+
individual `INSERT`s.

**Every random choice in the script goes through faker's seeded RNG, not
`Math.random()`** — that was a bug caught during development (two seed runs
produced different salary-record counts) and fixed so `npm run seed` is fully
reproducible: same names, same departments, same salary history, every time.

Gender is generated independently of salary — the seed does **not** inject an
artificial pay gap. The dashboard's gender-pay-gap view still reports whatever
small variance falls out of the random level/department assignment, same as
it would against real (equitable) payroll data; that's the honest baseline
for a feature meant to catch real gaps, not a demo rigged to show one.

## Testing

- **Backend (33 tests, Vitest + Supertest)**: pure-function unit tests for
  currency conversion, pagination math, "pick the current salary record", and
  all four analytics aggregations — plus integration tests that hit the real
  Express app + an isolated SQLite file (created fresh via `prisma db push`
  in `globalSetup`, torn down after) for the employee list/create endpoints
  and the two salary-record business rules. Integration test files run
  sequentially (`fileParallelism: false`) — they share one SQLite file, and
  running them concurrently caused real cross-test data races during
  development (caught by the test suite itself, not by luck).
- **Frontend (10 tests, Vitest)**: the duplicated `pickCurrentSalaryRecord`
  and all the currency/number/label formatting helpers. No component/DOM
  tests — with the logic that matters (business rules, derived state)
  concentrated in plain functions on both sides, component tests would
  mostly be re-testing React Query and shadcn, not this app's logic. That's
  a scope line, not an oversight: noted here rather than silently skipped.

## What I'd do differently at 10x the scope

- Move the `currentSalaryUsd` computation onto a column maintained by a
  trigger or on-write, instead of joining+converting on every read.
- Replace the fixed `ExchangeRate` table with a provider + daily snapshot
  job, and store the rate used on each `SalaryRecord` for audit accuracy.
- Extract the shared zod schemas and the `pickCurrentSalaryRecord` logic into
  one workspace package instead of two copies.
- Add database-level indexes beyond the current `department`/`country`/
  `status`/`lastName+firstName` set once real query patterns (not guesses)
  are known.
