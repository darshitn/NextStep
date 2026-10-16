# NextStep — Antigravity IDE implementation and release handoff

Paste this entire file into Antigravity, with this project folder open. Use Gemini 3.8 Flash Medium. This is an execution task: inspect, finish defects, test and release the existing implementation. Do not rewrite the application from scratch.

## Owner authorization and project

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.
The Git repository is its parent `D:\Projects\BuildToShip`; do not create a nested repository. The last inspected branch was `codex/release-audit`; verify current state before any operation.

On 16 October 2026, the owner replied “GO AHEAD either use antigravity-delegator or give me full prompt for IDE for implementation” after being asked for approval to commit/push the reviewed upgrade and deploy to the existing Vercel and Render projects. This authorizes publishing this reviewed release. Do not request that same approval again. Stop only for missing provider access, an unexpected destination/security permission, substantive scope changes, or an irreversible operation outside this release.

Existing frontend: https://next-step-six-theta.vercel.app
Existing backend: https://nextstep-j78x.onrender.com
Preserve those submitted URLs and the existing Supabase project. Do not create replacement provider projects or change account billing.

## Start here

Read `AGENTS.md`, `START-HERE.md`, `docs/PRODUCT-UPGRADE.md`, `docs/PRODUCT-UPGRADE-VERIFICATION.md`, `docs/LIVE-AUDIT-2026-10-16.md`, `contracts/API-V1.md`, `contracts/SCHEDULER.md`, `contracts/ARCHITECTURE.md`, and `docs/06-deployment-and-release.md`.
The current ownership override gives Darshit full frontend/backend/database/deployment ownership. Historical split-role and hackathon-time instructions do not reopen completed work.

Give a numbered plan with one active stage, acceptance criteria, and complete/in-progress/remaining counts. Work through these stages in order. Report results honestly; a command succeeding is not proof of deployed behavior.

## Preservation boundaries

- The working tree is intentionally dirty and contains the implementation to ship. Capture its file list and diff before editing. Preserve all existing changes, including untracked source/tests/docs. Inspect untracked file contents too; `git diff` alone omits them.
- Never reset, clean, stash, discard, overwrite from another branch, or broadly stage the parent repository. Preserve unrelated parent deletions/files and all existing environment files.
- Do not read or print `.env` contents, passwords, tokens, service-role keys or authorization headers. Use existing provider settings and private sign-in. Never copy credentials from chat into files, code or prompts.
- Only edit files inside the project. No new dependencies or lockfile churn unless a reproduced defect makes it necessary and you first explain the specific change.
- Keep `.local/`, screenshots/test artifacts, browser profiles, downloads, dependencies, builds and environment files out of Git.
- No schema migration is required for this release. Do not apply the old migrations again, truncate tables, reset an account, or modify production student history.
- Use synthetic test records only. The existing signed-in live account already has 12/12 completions; preserve its goal, notes and completion history. Revisit/read-only guidance is allowed. For live create/save/complete/recovery tests, use an owner-confirmed empty test account; never assume an account is disposable.
- Do not weaken RLS, auth, CORS, permission prompts or sandbox settings. If IDE tools require approval, state the precise project-scoped action for the owner to approve; never add blanket permission rules.

## Stage 1 — Independently review the implementation already present

The workspace upgrade is implemented locally: Today, Roadmap, Review and Insights; responsive navigation; search/status filters; notes/reflections library; recall before reveal; focus timer; JSON export. Relevant files: `client/src/pages/DashboardPage.jsx`, `client/src/components/workspace/**`, `client/src/services/workspace.js`, `client/src/workspace.css`, `client/src/fixtures/workspace.test.js`, `client/scripts/verify-workspace.cjs`.

The subsequent audit added fixes in `client/src/App.jsx`, `client/src/lib/supabase.js`, `client/src/services/apiService.js`, `client/src/pages/{LoginPage,OnboardingPage,RecoveryPage}.jsx`, `client/src/components/{CompletionForm,ErrorNotice,LoadingState}.jsx`, `client/src/fixtures/apiFixture.js`, `server/src/routes/goal.js`, and their tests. Inspect the actual contracts and source rather than trusting this description.

Verify these acceptance criteria and fix reproducible defects in these paths:

1. Temporary auth lookup network/503/malformed responses preserve the session and show a working retry. Genuine 401/403 expires only the same session. Delayed results cannot resurrect a signed-out session or revoke a newer account. Invalid sign-in/signup must not globally expire an unrelated session.
2. A direct `/recovery` load fetches the saved goal; outages must not redirect to onboarding. Preview retries actually retry. Ambiguous apply failures/conflicts reload saved state instead of silently repeating a schedule mutation. A successful accepted recovery preserves completed work.
3. Goal lookup failure on onboarding blocks creation and has a working retry. Authentication succeeds independently of subsequent goal loading.
4. Guidance accepts the next eligible incomplete mission OR an already recorded completed mission, including after all 12 are complete. Future incomplete missions remain rejected. Revision guidance must not mutate completions, XP or schedule. Unknown mission behavior matches the contract.
5. Recall drafts stay separate per mission and survive workspace view changes; closing a nonempty attempt warns. Session-only limits are disclosed. Review dismissal does not erase notes. Timers never mark work complete, award XP or masquerade as measured study time.
6. Notes/completion/recovery use the real API outside explicitly labelled isolated fixture tests. Synthetic AI responses say `source: fixture`, not Gemini. No production mock fallback, fabricated trends, learning gains or adaptive scheduling claims.
7. All four views work on mobile and desktop, all existing appearance styles and light/dark modes. Prioritize readable hierarchy, useful density and working controls. Keep the current restrained design; do not add gratuitous animation or decorative charts.

Acceptance: reviewed scoped diff; no known blocking reproducible defect; meaningful regression checks for fixes; preservation boundaries met. Do not expand into multiple goals or database-backed review scheduling during this release.

## Stage 2 — Run independent verification

Run commands separately in the indicated working directories and record exit codes:

```powershell
# working directory: <project>\server
npm.cmd test
# working directory: <project>\client
npm.cmd test
npm.cmd run build
# working directory: <project>
git diff --check
node --check client/scripts/verify-workspace.cjs
```

The latest observed baseline is 58 client tests and 48 server tests passing, plus a successful client build. Re-run; do not copy those counts as your result. Tests mock provider/database calls and do not prove live integrations. Install from existing lockfiles only if dependencies are missing, and explain a network/install permission blocker accurately.

Run the workspace browser harness as documented in `docs/PRODUCT-UPGRADE-VERIFICATION.md`. It requires an existing Playwright module and Edge; find the installed module rather than inventing a path or downloading tools automatically. Start Vite on loopback port 5187 only if free; do not kill unknown processes. From `client/` run:

```powershell
node scripts/verify-workspace.cjs '<verified absolute path to playwright>' http://127.0.0.1:5187
```

Inspect its actual results, screenshots and browser errors. Also use the browser interactively to verify a meaningful student journey. Check Today, focus pause/resume, Roadmap search/filter, notes save/reload, completion with hint, Review recall/reveal, Insights and an actual downloaded JSON snapshot. Check 390px and 320px layouts for overflow; inspect focus states and dialogs. Clearly label synthetic evidence. Never use production student records as fixtures.

Acceptance: all required automated checks pass, browser findings resolved or explicitly documented as blockers, and evidence paths recorded. If a tool is denied, report the denied action; do not describe a skipped test as passing.

## Stage 3 — Publish this reviewed release

Publication is owner-authorized above. Inspect the existing Git remote and connected Vercel/Render project configuration privately. Verify which branch each provider actually deploys; do not assume this checkout branch is the production branch. Do not print credential-bearing remote URLs. Do not force-push or switch branches over dirty work.

Review each intended staged file explicitly. Commit only the project implementation, relevant tests/contracts and honest documentation. Include new workspace source files. Exclude `.local/`, environment files, dist, node_modules, personal data and unrelated parent changes. Never `git add .` from the parent repository. Verify staged scope and credential safety without printing secret matches.

Commit and push the reviewed release through the existing repository workflow. If merging a release branch is required, use the established non-destructive workflow and inspect conflicts; never overwrite existing work to make deployment easy. If creating a PR, provide its URL and checks. Do not call a branch preview the production deployment.

Use the existing Render service first and Vercel project second. Correct roots for this parent repo are `nextstep-hackathon-2026-10-07/server` and `nextstep-hackathon-2026-10-07/client`; verify linked project settings. Preserve existing environment values; do not copy historical AI model names from documentation over a working current setting. Missing provider access is a blocker to report, not permission to create replacement projects or seek service-role credentials.

Acceptance: release commit recorded, successful matching provider deployments observed, existing production URLs serve the reviewed version. Check Render's `X-NextStep-Revision` against the released commit and inspect the served frontend asset/content. A push or health 200 alone is insufficient.

## Stage 4 — Verify the deployed student workflow

On the completed account, reopen a completed mission and request revision guidance using synthetic input. Verify a real provider-backed response, without changing saved history; discard unsaved text afterwards. The previously reproduced failure was `NO_PENDING_MISSION: All missions are already completed.` Verify that the failure is gone. Distinguish provider output from a fixture in evidence. Do not copy private account notes into the report.

On an owner-confirmed empty test account: sign in → create goal → obtain real guidance → save notes → reload → record completion → reload → preview reduced capacity → cancel and verify no change → preview/apply → reload and confirm preserved completion. With a second isolated test account, verify account separation. Missing empty-account access must be reported as an unverified gate; do not mutate the completed account instead.

Check public routes and direct refreshes, mobile navigation, session error/retry behavior where safely reproducible, and production browser console errors. Record exactly which checks ran against production, which used fixtures and which were blocked. Do not claim public signup/email delivery works without observing it.

Acceptance: truthful production evidence, preserved existing history, no new blocking regression. If release acceptance fails, report the failing step and exact repair; use the provider's previous known successful deployment for rollback only if necessary to restore a regression caused by this release. Never destructively reset Git or database contents.

## Next feature proposal — prepare after this release, do not mix into it

Create a concrete bounded design for persisted recall review: attempt text, self-rated confidence, deterministic next-review date, owner-scoped API/storage, conflict/idempotency behavior, retention and export. Inspect whether the existing versioned goal document can support it cleanly before proposing a new table. Keep the learner's attempt before feedback, label scheduling as a heuristic, and never infer mastery from a checkbox. Include example request/response, UI states, migration/rollback if needed, and ownership-isolation tests.

Then outline multiple goals/editable milestones as a separate later stage, preserving the original DSA goal and histories. Do not apply a new data migration or publish this broader architecture without presenting its concrete proposal for owner approval. These are explicitly deferred features, not release acceptance blockers.

## Required final report

Write `docs/ANTIGRAVITY-RELEASE-RESULT.md` with: completed/active/remaining stages; files changed and why; actual test commands/results; browser evidence paths; commit/PR if created; frontend deployment and served asset; backend deployed revision; live Gemini/Supabase results; preserved-data statement; denied/skipped checks; remaining blockers; and the next exact action. Separate implementation, automated tests, synthetic browser checks and live production evidence. No credentials or private student content.

Give the owner a concise report and a small exercise: open Today, find a completed mission in Roadmap, revisit its practice, find a saved note in Review, and export the goal. Do not claim this guarantees a hackathon win or improves learning outcomes without student evidence.
