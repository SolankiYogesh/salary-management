# ACME Salary Management

Web app for an HR Manager to manage salary data for 10,000 employees across
8 countries, and answer questions about how the org pays people.

- `REQUIREMENTS.md` — scope, what's deliberately left out, and why
- `SYSTEM_DESIGN.md` — architecture, data model, API, trade-offs
- `backend/` — Node.js + TypeScript + Express + Prisma (SQLite)
- `frontend/` — Next.js + TypeScript + shadcn/ui

## Run it

Requires Node.js 20+.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # defaults to SQLite file + port 4310
npm run prisma:push           # create the SQLite schema
npm run seed                  # generate 10,000 employees (~1-2s)
npm run dev                   # http://localhost:4310
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # points at the backend above
npm run dev -- -p 3210        # http://localhost:3210
```

Open http://localhost:3210 — dashboard, employee directory, employee detail
with salary history, and "add employee" are all live against the seeded data.

## Tests

```bash
cd backend && npm test        # 33 tests: unit (pure logic) + API integration
cd frontend && npm test       # 10 tests: formatting + derived-salary logic
```

## Notes

- Ports default to `4310` (backend) and `3210` (frontend) to avoid clashing
  with other local dev servers; change them in `backend/.env` and
  `frontend/.env.local` if needed.
- No authentication — see `REQUIREMENTS.md` for why that's out of scope.
- Deployment was deliberately skipped in favor of a reliable one-command
  local run — see `REQUIREMENTS.md`.
