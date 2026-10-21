# NextStep overnight goal: turn the curriculum into an adaptive practice companion

## Mission and working agreement

You are implementing a complete local product milestone, not writing suggestions. Work in D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07. Read AGENTS.md, START-HERE.md, contracts/API-V1.md, the latest handoff, docs/FIRST-USE-RELEASE-2026-10-20.md and relevant source. Historical scope text may be older than working code; inspect before assuming features are missing.

Goal: after the 12 starter milestones, a student can identify what needs practice, understand why, complete a short targeted session, see the actual results, and choose their next week. Support ongoing students too. Preserve the simple Today -> activity -> feedback -> explicit save -> next step journey.

Use up to six hours of real elapsed time. This is a maximum budget, not a minimum runtime. Do not invent timestamps, sleep to consume time, or add features to fill hours. Record startedAtUtc from the actual system clock, deadlineUtc = start + 6 hours, stage start/end times and actual check results. Reserve roughly the final 60 minutes for integration, testing and handoff. Finish early if acceptance is achieved. If approaching the deadline, stop adding scope and stabilize completed work. Never claim unfinished stages complete.

Routine scoped edits, local scripts, synthetic account tests and loopback previews are authorized. Continue from stage to stage without asking for routine design decisions. Use the fallbacks below if external services are unavailable. Respect actual tool permissions: do not disable confirmation controls or bypass denied actions. A prompt cannot guarantee uninterrupted execution, model quota or service availability. Report genuine blockers and continue independent local work.

Use the coding model currently selected by the owner. Do not silently switch models or incur additional services/cost. One editing agent per checkout; no concurrent editing agents.

## Verified baseline and research direction

The project already has 12 starter missions, a foundations checkpoint, accepted continuation plans, My week, a curriculum of 12 published topics / 48 lessons / 18 traces with variants / 120 external practice problems, review suggestions, optional confidence/focus check-ins, per-item histories, server grading, fixtures and an interactive guide. Do not rebuild these or imply the product ends at mission 12.

Current gap: client/src/services/workspace.js derives reviews and recommendations from outcomes/dates but does not yet use checkIn. A student reporting needs_example, unsure or edge_cases does not receive a corresponding learning response. Confirm against current source before implementing.

Pedagogical reference: https://ies.ed.gov/ncee/wwc/PracticeGuide/1 . It recommends spacing, retrieval practice and combining worked examples with problem solving. These motivate the feature; they do not validate a particular interval, score or algorithm. Do not claim scientifically calibrated mastery or interview readiness.

“OpenAI database” is not a defined project dependency. Use the existing reviewed curriculum as the content source. Do not add a provider, vector database, scraping pipeline or unreviewed AI-generated course overnight. No new API keys are needed for this milestone.

## Preserve and prepare — Stage 0

1. Inspect branch, git status and current diff. Preserve all existing work; record starting HEAD and changed paths. Do not reset, clean, stash, force-push or overwrite unrelated work.
2. If the checkout is clean and a suitable branch does not already exist, create codex/adaptive-practice. If dirty, retain its work and record your scoped files rather than rearranging history. Fetch is read-only; network failure must not block local implementation.
3. Write docs/ADAPTIVE-PRACTICE-PROGRESS.md with six stages, acceptance criteria, one active stage and completed/in-progress/remaining counts. Reopen and update this ledger across context resets.
4. Inspect current contracts, normalizers, CAS writes, owner auth, server grading and fixture parity. Record a small data-flow sketch.
5. Start or reuse the synthetic preview. Do not kill an unknown process on a busy port; inspect it or choose a free loopback port and pass that URL to scripts.
6. Run focused baseline tests. If an existing unrelated test fails, reproduce and record it, then continue independent work. Never hide it or relabel baseline failures as feature success.

## Stage 1 — Explainable reinforcement and a useful content index

Implement pure, tested derivation helpers using the current published catalog and saved records. Avoid parallel competing recommendation engines: build one reinforcement derivation consumed by Today, Review, Progress and session proposals.

Evidence inputs:
- Authoritative trace outcome, mistakes and assistance.
- Existing review dates and latest successful attempts.
- Lesson completion and optional lesson/trace checkIn.
- External practice logs, explicitly self-reported.
- Checkpoint topic results and prerequisites.

Self-report is distinct from measured correctness. No confidence or focus selection changes a verified grade. Absence of evidence means insufficient evidence, not weak ability.

Rules must be deterministic and documented:
- Latest unresolved needs_example -> linked existing worked example, then an eligible trace/practice action.
- Unsure -> a short relevant example/check; never label the student incapable.
- Focus invariant -> the exact lesson explanation/tracked-state section.
- Focus update_order -> relevant existing execution step/trace.
- Focus edge_cases -> linked boundary question or alternate input when available.
- Due recall -> relevant retrieval action.
- Supported trace -> fresh unassisted retry, never erase its original outcome.
- With no valid reinforcement, recommend an eligible uncompleted lesson or revision if all lessons are complete.

Use stable catalog IDs and explicit mappings for existing supported concepts. Validate every mapping. Do not match solely on brittle title strings or invent links to nonexistent lessons. Build a small derived searchable index over published lesson titles, topic names, patterns, boundary guidance and external practice metadata if it helps resolve targets. No duplicated problem database or copied provider statements.

Resolve conflicting and stale signals: a newer relevant evaluated attempt can supersede older uncertainty. State the policy and test timestamps/IST boundaries. A self-report alone must not erase an evaluated difficulty; avoid making old reports permanent blockers.

Deduplicate reasons for the same activity. Return structured reasons, evidence type, source item, target, estimated effort and short explanation. Stable tie-breaks, bounded results. Empty/deleted/draft records must not crash or leak into the published experience.

Acceptance: tests cover each check-in, unknown values, no evidence, newer-success resolution, different variants, exercise-free lessons and external practice disclosure. Do not change global scheduling intervals in this stage.

## Stage 2 — A short guided practice session

Add one feature to existing Today/Review surfaces: “Practise what needs work”. It opens a proposal of up to three linked activities; no additional top-level navigation destination.

Student chooses a time budget such as 10 / 20 / 30 minutes. Fit only activities with reasonable estimates; do not pretend a 20-minute task fits a 10-minute budget. Offer a single smaller step or honestly explain insufficient budget. Estimates are estimates, not tracked time.

Proposal can combine an existing example, a trace/boundary retry and a relevant practice link. Prioritize studied or prerequisite-eligible material. Mix topics only when useful evidence exists; never randomly select locked material to look adaptive. For topics without an attached trace, propose their real lesson check or linked practice, not an unrelated fallback exercise.

Before starting, show each activity and why selected. Let the student remove/replace eligible activities and regenerate explicitly. Proposal generation must not save progress or apply a weekly plan.

During the session:
- Show activity 1 of N, purpose and one primary action.
- Reuse current lesson/trace/practice UI and authoritative evaluation endpoints.
- Preserve reflection/check-in/answer isolation by item and variant.
- Allow pause/exit and return to Today; keep actual recorded results.
- Returning to the session shows the next remaining task after a successful explicit save.
- Opening an example is “viewed”, not verified understanding. External problem outcomes remain self-reported.
- Hints/references retain current assistance rules; no automatic hint reveal.

Use the smallest maintainable persistence model. Prefer additive bounded studyWorkspace state over a new database/schema. If a session needs durable state, use one active session (max three tasks) and at most five compact completed/abandoned summaries; do not duplicate full answers, notes or catalog content. Document exact caps and payload size implications. Reuse existing goal CAS/auth conventions; never accept a client-provided grade or task-completed flag as authoritative evidence.

State-changing endpoints require strict validation, ownership, expectedVersion and canonical request IDs where appropriate. Define retry behavior: identical retry is safe; altered payload under the same ID conflicts; expired/stale writes preserve drafts. Apply contract changes before dependent code. Keep live adapter, normalizer, fixture adapter and tests in parity. Do not add permissive generic state-replacement endpoints.

Fresh retry evidence must postdate the session's task baseline; a pre-session completed lesson or old trace must not auto-complete a requested revisit. Handle same timestamps with stable IDs/order/version. Use server-observed evidence for measured completion. A student's explicit “I reviewed this example” can be recorded only as self-report. Viewing, abandoning or merely starting a session must not complete underlying lessons or planned sessions.

Summary: show what was viewed, verified, hinted and self-reported separately; relevant mistakes/focus; next suggested action. No fabricated mastery, XP or score aggregation across incompatible evidence.

## Stage 3 — Topic evidence and the next week

Extend existing Progress/Learning path rather than adding another dashboard.

For each topic, present compact evidence:
- Lessons completed / available.
- Distinct traces verified, with independent vs supported outcomes identified.
- External practice logged, explicitly self-reported.
- Due reviews and unresolved reinforcement signals.
- “Not started”, “Learning”, “Practise again”, or “Recent evidence” with explanation. These are descriptive states, not mastery percentages.

Make cards actionable: Show why -> open the matching lesson, trace, review or practice item. A topic with no trace cannot be shown as 0% capable. Respect actual prerequisite links and published items.

Wire “Plan my next week” to the existing candidate-selection/preview/explicit-apply flow. Seed a bounded set of due reviews, relevant revisits and eligible new work. Preserve the existing signed preview binding, seven-day horizon, capacity, spillover and non-destructive replanning behavior. Completed lessons used as revisits must remain intentional revisits. Never auto-apply a plan from a session summary.

Starter history remains 12/12. Curriculum/session activity must not fabricate starter completions. All-lessons-complete state offers revision/practice without inventing lessons 49+ or suggesting the learning loop ended.

## Stage 4 — Integration, resilience and interaction quality

Keep the released first-use hierarchy: one clear Today action, existing navigation names, optional guide. Integrate reinforcement without duplicating the main action or covering it with several new banners. Add short contextual guidance only where necessary.

Use existing theme tokens and icons. Subtle transitions, respect reduced motion. Touch targets and focus indicators must work at 320px. Avoid technical plumbing terms in student copy. Keep optional check-ins/notes optional.

Handle: slow catalog, missing mapping, storage unavailable, page reload, account switch, offline save, lost response, double click, stale version and cancelled session. No uncaught errors, infinite observers/polling, focus traps away from required inputs or silent background mutations.

Use lazy imports for new heavy views/dialogs; avoid adding the entire session UI to the login bundle. No new animation/state-management dependency. Do not modify auth redirects or provider configuration.

The owner has not supplied accounts/credentials for overnight production testing. Missing Supabase/Gemini/hosting access is not a local-feature blocker: use labelled fixtures and provider stubs, preserve live paths, report live acceptance pending. No account creation emails, paid calls, production records or deployment overnight.

## Stage 5 — Verification, review and morning handoff

Use actual time and execute commands; do not copy previous counts as new evidence.

Required:
1. npm.cmd --prefix server test
2. npm.cmd --prefix client test
3. node server/scripts/validate-curriculum.mjs (if it rewrites the fixture, inspect parity and ensure no accidental content edits)
4. npm.cmd --prefix client run build
5. Existing full gate: powershell.exe -ExecutionPolicy Bypass -File scripts/verify-continuation-release.ps1 -PreviewUrl http://127.0.0.1:5173
6. git -c core.safecrlf=false diff --check, including newly added files once reviewed/staged only if staging is explicitly appropriate; otherwise inspect untracked whitespace separately.

Synthetic preview: npm.cmd --prefix client run preview:synthetic -- --strictPort
Playwright module: D:/Projects/Deadline-Catcher/node_modules/playwright
Use actual selected loopback URL in all commands. Synthetic fixture credentials are already documented in the project; never use an owner's real account as a fixture.

Add focused server/unit/browser tests for new rules and integrate the new browser suite into the release gate. Required scenarios:
- 12/12 starter -> existing checkpoint/path -> targeted session -> saved result -> next-week preview -> explicit accept.
- Ongoing student with needs_example + edge_cases gets relevant content, not an unrelated topic.
- Same inputs give identical proposal; invalid/draft/locked IDs rejected.
- Fresh retry required despite pre-existing completion; old evidence does not finish a revisit.
- Actual server rejection/lost response/double submission/stale version recovery without duplicated attempts or overwritten drafts.
- Reload/resume, session abandon, account isolation, independent/support/self-report distinctions.
- 10-minute budget cannot overfill silently; no valid candidates has a truthful empty state.
- Full curriculum completion still has a useful revision route.
- New feature does not weaken student-safe public catalog, hidden keys, grading or signed plan acceptance.
- Desktop 1440, tablet 1024, mobile 390 and 320; all existing theme variants and reduced motion on changed surfaces. Capture readable screenshots; assert real geometry, no blanket overflow hiding.

Inspect your own full diff once against the starting baseline, including new files. Fix actual in-scope defects; do not refactor unrelated code to fill the night. Existing regression assertions must remain meaningful. If a check fails repeatedly, diagnose the same failure before rerunning. Limit each reproduced defect to two focused repair attempts; if unresolved, record exact evidence and continue independent stages. Do not declare the release ready with a failed required gate.

Write docs/ADAPTIVE-PRACTICE-RESULT.md with:
- Stage counts/status, real start/deadline/end and actual elapsed time.
- Implemented behaviors and exact files.
- Persistence/data-flow/retention contract and migration requirement (expected none).
- Executed tests, exit codes, screenshots and failures/skips.
- Existing curriculum counts and whether any source content changed.
- Known limitations, live behavior unverified and rollback scope.
- Five-minute owner exercise and the next exact action.

Append a dated concise entry to handoffs/DARSHIT.md. Keep logs/evidence under ignored .local folders. Do not persist secrets or confirmation links.

Stop when this milestone is complete and verified, or at the deadline with an honest partial result. Do not start a new judge demo, code execution sandbox, chatbot, scraped LeetCode database, social system or new learning track. Leave changes uncommitted/unpushed on the working branch and keep the labelled local preview available. No merge, deployment, dependency installation, actual environment edits, schema migration or external messages.

The deliverable is a coherent working learning loop with evidence, not a larger collection of buttons. Complete stages sequentially and keep the next stage moving without routine owner input.
