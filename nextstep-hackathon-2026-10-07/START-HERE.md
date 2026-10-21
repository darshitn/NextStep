> **Current ownership decision:** Darshit owns the complete implementation, integration and deployment configuration. Sankirth supplies access/configuration; Harshitha owns demo/presentation. This supersedes earlier split-role acknowledgment gates. Use one active editing session and preserve existing work.

# Run and review NextStep

**Current milestone:** End-to-End QA, Adaptive Practice, and Repository Maintenance (21 October 2026).<br>
See [Full Local QA Result](docs/FULL-LOCAL-QA-RESULT.md), [Adaptive Practice Result](docs/ADAPTIVE-PRACTICE-RESULT.md), and [Documentation Hub](docs/README.md).<br>
The 8 October [production audit](docs/FINAL-PRODUCTION-AUDIT.md) describes the initial hackathon release; subsequent milestones are verified on the local testbed and loopback preview.

NextStep's adaptive-practice milestone is implemented and has passed the local release gate. This does not establish deployment: production may serve an earlier release until this branch is merged and both hosts deploy. The [deployed frontend](https://next-step-six-theta.vercel.app/) uses a Render Express API, Supabase Auth/PostgreSQL, and server-side Gemini. Fixture mode is reserved for the dedicated local preview.

---

## Local Setup

1. **Prerequisites**: Use Node.js 24 LTS and npm 11+.
2. **Install Dependencies**: Run `npm ci` separately inside `server/` and `client/`.
3. **Environment Files**: Preserve existing environment files. If absent, copy templates:
   - In `server/`: copy `../templates/server.env.example` to `.env` and populate `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `AI_API_KEY`, `AI_MODEL`.
   - In `client/`: copy `../templates/client.env.example` to `.env.local` and populate `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. **Database Migrations**: For a new database, apply `database/migrations/001-nextstep-goals.sql` and `002-learning-records.sql` in order to your dedicated Supabase project. Review an existing schema before reapplying migrations; this adaptive-practice release adds no migration.
5. **Supabase Auth**: Configure email/password authentication, Site URL, and permitted confirmation redirect URLs using [the auth runbook](docs/09-supabase-auth-config.md).
6. **Start Local Services**:
   - Terminal 1: `cd server && npm run dev` (API runs at `http://localhost:3001`).
   - Terminal 2: `cd client && npm run dev` (App runs at `http://localhost:5173`).

---

## Local Synthetic Preview (No Cloud Credentials)

After installing client dependencies, inspect NextStep using synthetic local data without configuring Supabase or external AI keys:
```sh
npm --prefix client run preview:synthetic -- --strictPort
```
Open `http://127.0.0.1:5173`. The application runs against client-side synthetic mock adapters, clearly marked with a **"Fixture Mode"** header badge, pre-seeded with isolated demo personas (`student.active@nextstep.local`, `student.completed@nextstep.local`, password: `password123`).

---

## Validation & Test Suites

- **Server Test Suite**: `npm --prefix server test` (155 tests in `node:test` covering routes, schemas, grading, and scheduler).
- **Client Test Suite**: `npm --prefix client test` (152 tests covering state derivation, pure calculators, and UI fixtures).
- **Curriculum Validation**: `node server/scripts/validate-curriculum.mjs` (Validates 12 topics, 48 lessons, 18 trace exercises, 120 practice problems).
- **Production Build**: `npm --prefix client run build` (Vite production bundle compilation).
- **Full 15-Gate Release Verification**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/verify-continuation-release.ps1
  ```
- **Browser State Isolation & Layout**: `node client/scripts/browser-state-isolation-test.mjs http://127.0.0.1:5173`

---

## Core Product Contracts

NextStep follows strict, frozen architectural contracts:
- **[API v1 Specification](contracts/API-V1.md)**: Authoritative REST endpoints, request/response envelopes, error codes, and optimistic locking compare-and-set versioning.
- **[Scheduler Rules](contracts/SCHEDULER.md)**: Deterministic 30-minute capacity calculations using `Asia/Kolkata` (IST) calendar dates.
- **[System Architecture](contracts/ARCHITECTURE.md)**: Minimal-dependency stack, per-request publishable key client, and row-level security.
- **[Documentation Hub](docs/README.md)**: Master index of all 76+ architecture, testing, and milestone documents.
- **[Implementation Boundaries (AGENTS.md)](AGENTS.md)**: Operational rules and single-owner guidelines.
