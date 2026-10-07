# NextStep — Implementation Roadmap

This roadmap organizes the development of NextStep into phased milestones across team roles.

## Phase 0: Project Discovery & Architecture Alignment (Current)
- [x] Challenge idea, identify target students, and lock 30-minute mission approach.
- [x] Create project artifacts: `PROJECT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TASKS.md`, `AI_INSTRUCTIONS.md`.
- [x] Confirm environment readiness (Node 24.x, npm 11.x, Git).
- [x] Validate planning kit integrity via `node scripts/validate-kit.mjs`.

## Phase 1: Client Shell & Scaffolding (Milestone D1 / S1)
- [ ] Scaffold `client/` package using Vite + React 19 + Tailwind CSS + Lucide React.
- [ ] Implement design tokens: premium dark theme, typography, glassmorphism, responsive shell.
- [ ] Build isolated client development fixture adapter (`client/src/fixtures/apiFixture.js`).
- [ ] Implement core route shells: `/login`, `/onboarding`, `/dashboard`, `/recovery`, `*` (404).
- [ ] Verify `npm run build` passes cleanly.
- [ ] Parallel backend: Express setup, health/catalog endpoints, Zod schemas (Sankirth).

## Phase 2: Core Goal Flow & Client-Side Verification (Milestone D2 / S2)
- [ ] Complete `Onboarding` flow with 7-day availability selection (0, 30, 60, 90 mins).
- [ ] Build `Dashboard` cockpit:
  - Progress summary bar, XP derivation, level badge.
  - Next eligible mission card with steps, rationale, and external resource link.
  - Mission completion modal (`independent` vs `with_hint` and 280-char reflection).
- [ ] Complete goal creation and load flows against fixture adapter.
- [ ] Parallel backend: Database migration, Supabase auth/RLS, POST /api/goal, GET /api/goal (Sankirth).

## Phase 3: Adaptive AI Guidance & Deterministic Recovery (Milestone D3 / S3)
- [ ] Implement `GuidancePanel`:
  - Category selector (`too_difficult`, `need_revision`, `ready_to_continue`).
  - Student feedback input (max 280 chars).
  - Form submission with pending/error/timeout states.
  - Display structured guidance (mode, explanation, micro-steps, check question).
- [ ] Implement `RecoveryComparison`:
  - Proposed availability picker.
  - Side-by-side comparison of current vs proposed schedule (moved missions, new finish date).
  - Explicit Apply and Cancel actions.
- [ ] Stale state & version conflict error handling.
- [ ] Parallel backend: Gemini 2.5 Flash backend service, recovery preview/apply logic (Sankirth).

## Phase 4: Integration, Hardening & Release Polish (Milestone D4 / S4)
- [ ] Connect Darshit's UI with Sankirth's live `client/src/lib/api.js` and `client/src/lib/supabase.js`.
- [ ] Verify complete end-to-end loop: Login -> Onboard -> View -> Complete -> Guidance -> Recover -> Refresh.
- [ ] Verify two-account isolation and concurrent tab conflict resolution.
- [ ] Finalize responsive design, keyboard accessibility, and subtle polish animations.
- [ ] Deploy frontend to Vercel and backend to Render.
- [ ] Support Harshitha with live demo verification and submission video assets.
