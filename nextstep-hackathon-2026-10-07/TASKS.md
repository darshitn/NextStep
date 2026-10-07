# NextStep — Granular Task Tracker

## Phase 0: Project Discovery & Architecture
- [x] Review hackathon problem statement and master prompt constraints.
- [x] Run kit validator (`node scripts/validate-kit.mjs`) and preflight (`node scripts/preflight.mjs`).
- [x] Create `PROJECT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TASKS.md`, `AI_INSTRUCTIONS.md`.
- [x] Initialize Darshit handoff (`handoffs/DARSHIT.md`).

## Phase 1: Client Scaffold & Design System (Darshit - Milestone D1)
- [x] Initialize `client/` package with React, Vite, React Router, Tailwind CSS, Lucide React.
- [x] Configure `vite.config.js` for strict port 5173.
- [x] Configure Tailwind CSS and create `client/src/index.css` with dark theme tokens, glassmorphic utilities, and smooth micro-interactions.
- [x] Create development fixture adapter `client/src/fixtures/apiFixture.js` matching API v1 contracts and guidance extension.
- [x] Create `AppShell` with navigation, active track pill, user status, and fixture mode indicator.
- [x] Implement route skeleton (`/login`, `/onboarding`, `/dashboard`, `/recovery`, `*`).
- [x] Verify `npm run build` succeeds cleanly in `client/`.

## Phase 2: Goal Onboarding & Mission Cockpit (Darshit - Milestone D2)
- [x] Build `SignInForm` supporting demo credentials and validation.
- [x] Build `AvailabilityPicker` with 0/30/60/90 minute slot controls for Mon–Sun.
- [x] Build `GoalForm` collecting planStartDate, targetDate, deadlineMode, and availability.
- [x] Build `ProgressSummary` showing XP (20/completed), level, progress bar, and remaining workload.
- [x] Build `MissionCard` displaying current mission, purpose, steps, criteria, and external resource link.
- [x] Build `CompletionForm` modal capturing outcome (`independent` / `with_hint`) and 280-char reflection.
- [x] Validate goal creation, mission completion, and persistent state reload via fixture adapter.

## Phase 3: Adaptive AI Guidance & Plan Recovery (Darshit - Milestone D3)
- [x] Build `GuidancePanel`:
  - [x] Category buttons (`too_difficult`, `need_revision`, `ready_to_continue`).
  - [x] Feedback text input (max 280 chars) with char counter.
  - [x] Loading spinner / skeleton state during generation.
  - [x] Render structured AI guidance (mode badge, explanation, numbered micro-steps, check question).
  - [x] Error alert with honest retry button on simulation failure.
- [x] Build `RecoveryComparison`:
  - [x] Recovery availability form.
  - [x] Deterministic before/after comparison showing moved count and projected finish date.
  - [x] Explicit Cancel vs Apply actions.
- [x] Handle stale state conflict (409) with automated refresh notification.

## Phase 4: Integration, Audit & Deployment (Darshit & Sankirth - Milestone D4)
- [ ] Connect client to Sankirth's live adapters (`client/src/lib/api.js`, `client/src/lib/supabase.js`) once backend is ready.
- [ ] Verify end-to-end flow with real Supabase Auth and database persistence.
- [ ] Conduct multi-device responsive audit (mobile, tablet, desktop).
- [ ] Conduct accessibility & keyboard navigation review.
- [x] Verify build output and Vercel configuration (`client/vercel.json`).
- [ ] Complete final acceptance checks and update `handoffs/DARSHIT.md`.
