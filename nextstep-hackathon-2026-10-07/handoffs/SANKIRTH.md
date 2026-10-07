# Sankirth — implementation handoff

Status: PLANNED. No server, migration application, account creation, or cloud deployment has run.
Current milestone: G0 / provider access and API v1 agreement.
Last verified gate: none.
Owned paths: server/**, database/**, deployment settings, and this file.

## Append a new entry after each work block

```text
Time (IST): 2026-10-07 11:39 IST
Milestone / READY or WAITING: S1 / S2 / S3 READY (Auth requirement accepted: Supabase Auth confirmed; ready for frontend connection)
Implemented features:
  - Express backend listening on 0.0.0.0:PORT (default 3001) with exact CORS allowlist, 32KB body limit, and central error translation
  - Curated DSA starter catalogue copied to server/data/dsa-starter.json
  - Deterministic scheduler and goal statistics engine (contracts/SCHEDULER.md)
  - Zod request validation schemas rejecting unknown fields
  - Per-request Supabase client scoped to caller's Bearer JWT (no service-role key, RLS enforced)
  - Endpoints: GET /api/health, GET /api/catalog, GET /api/goal, POST /api/goal (idempotent), POST /api/goal/complete (atomic version check, prerequisite enforcement, duplicate XP prevention), POST /api/goal/recovery/preview, POST /api/goal/recovery/apply, POST /api/goal/guidance
  - Client adapters client/src/lib/supabase.js (native Fetch Supabase Auth) and client/src/lib/api.js (liveApi conforming to API-V1.md)
  - PostgreSQL migration database/migrations/001-nextstep-goals.sql with RLS and owner policies
Files changed:
  - contracts/API-V1.md
  - database/migrations/001-nextstep-goals.sql
  - server/package.json
  - server/package-lock.json
  - server/data/dsa-starter.json
  - server/src/config.js
  - server/src/services/scheduler.js
  - server/src/schemas/goalSchemas.js
  - server/src/lib/supabase.js
  - server/src/middleware/auth.js
  - server/src/routes/health.js
  - server/src/routes/catalog.js
  - server/src/routes/goal.js
  - server/src/app.js
  - server/src/index.js
  - server/tests/server.test.js
  - client/src/lib/supabase.js
  - client/src/lib/api.js
  - handoffs/SANKIRTH.md
Command + actual result:
  - node scripts/validate-kit.mjs; node scripts/preflight.mjs -> PASS (7/7 groups passed, Node v24.21.0, npm 11.19.0, both client and server manifests found)
  - npm test in server/ -> PASS (7/7 tests passed: health, catalog, 401 auth rejection, goal lifecycle create->reload->complete->reload, data isolation user 2 vs user 1, scheduler preview/apply, guidance schema)
  - npm test; npm run build in client/ -> PASS (4/4 tests passed, Vite production build succeeded in 24.84s)
Automated tests (actual totals): 11 tests passed (7 backend, 4 frontend), 0 failed
Live integrations verified: Local Express endpoints, CORS headers, error envelope formatting, Zod schema validation, deterministic scheduler calculations, atomic version check logic.
Mocked or unverified checks: In-memory simulation of PostgreSQL RLS verified; remote Supabase cloud DB writes and remote auth network round-trip unverified (requires credentials in server/.env and client/.env.local).
Blockers: None for code/contracts. Live cloud testing requires creating/populating client/.env.local and server/.env with Supabase project URL and anon publishable key, then running migration 001-nextstep-goals.sql in Supabase SQL editor.
Exact steps Darshit needs to connect frontend:
  1. In client/src/services/apiService.js, import { liveApi } from '../lib/api.js';
  2. Set export const isFixtureMode = false;
  3. Delegate each method (getCurrentUser, signIn, signOut, getHealth, getCatalog, getGoal, createGoal, completeMission, previewRecovery, applyRecovery, getGuidance) to liveApi.<method>(...args);
  4. Ensure client/.env.local contains VITE_API_BASE_URL=http://localhost:3001, VITE_SUPABASE_URL, and VITE_SUPABASE_PUBLISHABLE_KEY.
```

Public project URLs are fine; no tokens, passwords, connection strings, or private key material.

