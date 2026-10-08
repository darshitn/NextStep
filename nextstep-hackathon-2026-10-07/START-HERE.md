> **Current ownership decision:** Darshit owns the complete implementation, integration and deployment configuration. Sankirth supplies access/configuration; Harshitha owns demo/presentation. This supersedes earlier split-role acknowledgment gates. Use one active editing session and preserve existing work.

# Run and review NextStep

**Current milestone:** final production reliability audit, 8 October 2026. See [audit evidence](docs/FINAL-PRODUCTION-AUDIT.md) for actual checks and deployment status. Correct observed defects without expanding the submitted feature scope.

NextStep is implemented. The [deployed frontend](https://next-step-six-theta.vercel.app/) calls a Render Express API, Supabase Auth/PostgreSQL, and server-side Gemini. No fixture mode is enabled in production.

## Local setup

1. Use Node.js 24 LTS. Run `npm ci` separately inside `server/` and `client/`.
2. Preserve existing environment files. If absent, create `server/.env` and `client/.env.local` from their examples under `templates/` and supply your own values.
3. Apply `database/migrations/001-nextstep-goals.sql` and `002-learning-records.sql` in order to your own Supabase project. Review existing schema before reapplying migrations.
4. Configure Supabase email/password auth, Site URL and permitted confirmation redirects using [the auth runbook](docs/09-supabase-auth-config.md).
5. Run `npm run dev` in `server/` and `client/` in separate terminals. Open `http://localhost:5173`.

Backend variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`, `AI_API_KEY`, `AI_MODEL`; optional `PORT` (3001 locally), `NODE_ENV`. Use a Gemini model available to your API account. The SDK explicitly receives `AI_API_KEY`.

Frontend variables: `VITE_API_BASE_URL` (origin without `/api`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put AI or privileged database keys in a `VITE_` variable. Missing live configuration must not be replaced by fake success.

## Validate

- `server/`: `npm test` (mocked database/provider tests; no production mutations).
- `client/`: `npm test`, then `npm run build`.
- Browser regression: start Vite on port 5187, then from `client/` run `node scripts/verify-layout.cjs <path-to-playwright> http://127.0.0.1:5187`. The harness uses labelled synthetic fixtures, blocks external traffic and writes evidence under ignored `.local/layout-evidence`.
- Verify deployed sign-in, notes persistence, AI generation, recovery and responsive layouts separately. A successful build or fixture test does not prove a live integration.

## Product contract

One DSA track, twelve ordered 30-minute missions, weekly slots of 0/30/60/90 minutes. Gemini adapts the approach using the current mission and learner notes. Three missions have curated reasoning checks; M04 includes an interactive duplicate trace. AI cannot complete missions or alter schedules. Notes, self-reported completion and calendar history persist in Supabase. Schedule changes require a preview and explicit acceptance.

See [API v1](contracts/API-V1.md), [scheduler rules](contracts/SCHEDULER.md), [architecture](contracts/ARCHITECTURE.md) and [deployment](docs/06-deployment-and-release.md). Older prompts document history and do not reopen completed milestones. Read `AGENTS.md` for preservation and operational boundaries.
