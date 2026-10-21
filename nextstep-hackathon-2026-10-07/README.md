# NextStep Application Directory

This directory contains the primary implementation of NextStep: the React frontend, Express API server, contracts, database migrations, and comprehensive technical documentation.

> [!IMPORTANT]
> **Working Directory Notice:**
> Run application build and test commands separately from within [`client/`](client/) and [`server/`](server/).
> For complete project setup, refer to the authoritative [`START-HERE.md`](START-HERE.md) guide.

---

## Directory Navigation

- **[`client/`](client/)**: React frontend with Vite, Tailwind CSS, six appearance combinations and browser regression scripts.
- **[`server/`](server/)**: Express backend with Zod validation, authoritative grading, scheduling, Gemini guidance and route/unit tests.
- **[`contracts/`](contracts/)**: Authoritative interface specifications:
  - [`contracts/API-V1.md`](contracts/API-V1.md): Canonical API endpoints, request/response schemas, error codes, and concurrency rules.
  - [`contracts/ARCHITECTURE.md`](contracts/ARCHITECTURE.md): Minimal stack and per-request client architecture.
  - [`contracts/SCHEDULER.md`](contracts/SCHEDULER.md): Deterministic capacity calculations on Asia/Kolkata dates.
- **[`database/`](database/)**: PostgreSQL migrations with per-user Row-Level Security:
  - [`database/migrations/001-nextstep-goals.sql`](database/migrations/001-nextstep-goals.sql): Goals table and RLS policies.
  - [`database/migrations/002-learning-records.sql`](database/migrations/002-learning-records.sql): Learning records table and RLS policies.
- **[`docs/`](docs/)**: Full technical documentation and milestone reports (see [`docs/README.md`](docs/README.md) for master index).
- **[`templates/`](templates/)**: Environment configuration examples (`client.env.example`, `server.env.example`).
- **[`fixtures/`](fixtures/)**: Curated 12-mission DSA starter catalog.

---

## Authoritative Documentation Links

- **[Repository Root Overview](../README.md)**: Main GitHub landing page, product vision, live deployment link, and curriculum inventory.
- **[Developer Setup (START-HERE.md)](START-HERE.md)**: Authoritative local setup instructions, environment variables, and ownership decision.
- **[Documentation Hub (docs/README.md)](docs/README.md)**: Categorized directory of all 76+ architecture, testing, and milestone documents.
- **[Local QA Report (docs/FULL-LOCAL-QA-RESULT.md)](docs/FULL-LOCAL-QA-RESULT.md)**: Executed checks, evidence levels and remaining acceptance gaps.
- **[Repository Maintenance Plan (docs/REPOSITORY-MAINTENANCE-PLAN.md)](docs/REPOSITORY-MAINTENANCE-PLAN.md)**: Codebase audit and reorganization plan.
- **[Branch Audit (docs/BRANCH-AUDIT.md)](docs/BRANCH-AUDIT.md)**: Branch status and PR tracking.

---

## Historical Notes
The `prompts/`, `roles/`, and early planning files (`PROJECT.md`, `ROADMAP.md`, `TASKS.md`, `ARCHITECTURE.md`) preserve the original hackathon development history. Their pre-implementation status claims are historical; use `START-HERE.md`, `contracts/API-V1.md`, and `docs/FULL-LOCAL-QA-RESULT.md` for current system state.
