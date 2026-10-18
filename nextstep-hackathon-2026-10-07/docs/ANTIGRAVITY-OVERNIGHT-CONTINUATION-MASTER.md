# NextStep six-hour overnight goal: continuation + product hardening

## Read this goal completely before acting

Owner intent: develop the next useful student journey after the twelve starter missions, while hardening the existing learning workbench. Work autonomously on routine implementation choices and local checks. The owner will review the result in the morning. Do not spend the night asking which component name, layout, helper, test or file organization to use. Make a reasonable compatible decision, document it and continue.

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.
Repository: https://github.com/darshitn/NextStep
Confirmed deployed/merged release: `ce6405d694009827673e90558ddf8b1ec0cb3d33` on main, merging PR #3. The local checkout may still be on `codex/ui-workbench` at `9856641`. Inspect actual Git state; do not assume branch names prove content or discard differences.

Use **Gemini 4 Argon** selected by the owner in Antigravity for this sustained run. Keep that selection. Do not silently switch to Opus, another model or paid service. Limited Opus 5.5 usage is reserved for a focused morning review. If the IDE offers reasoning effort, use High for the contract/state/concurrency design and its normal implementation setting for routine work; don't claim a setting exists if the interface lacks it.

## Routine actions pre-authorized for this run

You may read relevant project files and Git diffs/history, edit the scoped source/tests/docs below, create a local feature branch, run installed test/build/browser tools, start hidden loopback preview/test processes, use synthetic local fixtures, and make small LOCAL commits of tested coherent milestones on your feature branch. These permissions apply only within this goal; they do not override IDE/host permissions.

Do not ask for confirmation between successful stages. Do not stop after a plan, a scaffold, a single route, or a passing unit test when required integration work remains. Continue until acceptance is achieved, a real blocker prevents dependent work, or the six-hour deadline arrives.

**No bypasses:** do not disable confirmations, use skip-permissions flags, change global approval/model/login policies, auto-approve unrelated actions, or retry a denied operation through another tool. If a host permission prompt requires owner intervention, record the blocked action and continue independent authorized work. If none remains, checkpoint and stop. No prompt can override a quota, permission boundary or missing owner login.

**Excluded:** no production account/data use, cloud writes, schema migrations, environment-file edits, secret inspection, provider-account creation, external messages, dependency upgrades, package additions, arbitrary-code execution service, LeetCode scraping, merges into main, remote push, deployment or infrastructure reconfiguration. If a problem truly requires one of these, prepare a precise proposal for the morning and finish the allowed local slice.

Keep secrets out of prompts, reports, screenshots, logs and Git. Application startup may load existing environment configuration normally; don't print its values. Do not read private environment files as a debugging shortcut. Preserve user changes, existing history, ignored browser profiles/builds and unrelated parent-repository files. No reset/clean/stash/force checkout or destructive cleanup.

## Real clock budget, not an instruction to wait

At the start read the actual clock. Record `startedAtUtc`, local time with timezone **Asia/Kolkata**, and `deadlineUtc = startedAtUtc + 6 hours` in `docs/OVERNIGHT-CONTINUATION-PROGRESS.md`. Do not copy an old date/time from a report as the start time. Use elapsed clock time, not estimated token speed, to manage the budget.

Finish earlier if the required goal is complete. Never sleep, generate filler or repeatedly rerun passing commands just to occupy six hours. Do not start new features during the final hour.

Suggested allocation (adapt within the same overall deadline):

| Stage | Target elapsed time | Deliverable |
| --- | --- | --- |
| 0 | 0–25 min | Baseline, ownership, reproducible local preview and real-clock ledger |
| 1 | 25–60 min | Contract/state design, acceptance tests and smallest coherent journey |
| 2 | 60–180 min | Completed-starter checkpoint and server-evaluated assessment |
| 3 | 180–255 min | Reviewed next-week plan and Today/Atlas/Proof continuation |
| 4 | 255–300 min | Reliability, accessibility and scoped regression fixes |
| 5 | 300–360 min | Full relevant validation, visual inspection, report and usable preview |

Update the progress ledger at every stage transition and at least every 30 minutes of active work. Include complete/active/blocked/remaining counts and last verified command. Write a checkpoint before long tool calls or context compaction. On restart, read the ledger and inspect actual source/Git before resuming; don't redo finished work blindly.

If fewer than 90 minutes remain and the full scope is unfinished, freeze new scope. Stabilize the smallest integrated assessment-to-plan slice already built; defer optional polish. If fewer than 45 minutes remain, focus only on validation, clear failure handling and the final handoff. Mark unfinished stages partially verified or blocked rather than complete.

## Parallel ownership: two workstreams, one integration owner

**Darshit's overnight run, Track A:** product continuation, assessment/state contract, next-week plan and frontend integration.

**Darshit's overnight run, Track B:** current-workbench regression, responsive/accessibility/error handling and quality improvements directly needed by Track A.

**Friend's separate checkout:** `server/data/curriculum/**`, NEW curriculum reference tests/helpers, generated catalog fixture updates and their coverage/corrections report, as assigned in `handoffs/COLLABORATOR-CURRICULUM-GOAL.md`.

Do not edit the friend's curriculum files, reference tests, coverage documents or branch, and don't assume their unpublished work is available. No merge/rebase/cherry-pick of their work overnight. Consume the currently published curriculum through stable IDs and existing services. If an existing content error blocks an assessment, omit that item with an honest explanation and report it for the friend; don't fix it in their files.

Use **one source-code writer in this checkout**. If Antigravity supports parallel helpers, you may use read-only review/research or isolated test processes while the main writer implements. Do not ask independent writers to modify shared components, schemas or goal routes simultaneously. If helpers are unavailable, interleave the two tracks; don't block the goal waiting for a parallelism feature. Run independent client/server checks concurrently only when they do not share ports, fixtures or generated files. Keep schema/contract mutations, Git operations and generated-fixture updates sequential.

## Required reading and baseline

Read `AGENTS.md`, `START-HERE.md`, `contracts/API-V1.md`, `contracts/SCHEDULER.md`, `contracts/ARCHITECTURE.md`, `docs/05-audit-and-tests.md`, `docs/UI-RELEASE-CHECKPOINT-2026-10-18.md`, the existing UI audit/rebuild reports and current collaborator handoff.

Inspect current code, not only reports:

- `client/src/pages/DashboardPage.jsx`, `client/src/App.jsx`, `client/src/components/workspace/TodayView.jsx`, `AtlasView.jsx`, `ProofStudio.jsx`, `PracticeLibraryView.jsx`, `WorkspaceNav.jsx`, `client/src/services/workspace.js`.
- `client/src/services/apiService.js`, `client/src/lib/api.js`, `client/src/fixtures/apiFixture.js` and existing fixture tests.
- `server/src/routes/goal.js`, `server/src/routes/catalog.js`, `server/src/schemas/goalSchemas.js`, `server/src/services/scheduler.js`, `server/src/services/curriculumRegistry.js`, current migrations and mocked route tests.
- Preview/browser scripts, Tailwind/PostCSS/Vite config and existing `package.json` scripts.

Capture the initial tracked/untracked files and baseline test results without dumping personal data. If clean, fetch main if network access is permitted and create `codex/starter-continuation` from the verified merged release or latest compatible main. If dirty, preserve changes, record them, create a new branch without resetting, and avoid conflicting edits. Do not change an existing collaborator branch. Network failure is not a reason to discard a usable local baseline or invent remote verification.

Current known starting capability: the twelve-mission starter has a completed congratulations state; a separate curriculum recommendation and study planner exist. Do not rebuild those from scratch or silently equate starter completion with curriculum completion. The visible next journey is missing a coherent assessment-to-next-plan transition.

## Track A: the product behavior to finish

### A1. Meaningful completion and clear continuation

When all twelve known starter missions are completed, Today should celebrate that specific achievement and offer a dominant **Choose my next step** or **Check my foundations** action. Show actual recorded evidence (starter work, checks, hint-assisted work, saved blockers) without claiming mastery or interview readiness. Preserve 12/12, original timestamps, notes, recall history, schedule and export.

The continuation must be optional. Students may revisit the starter, go directly to the broader Atlas, or take the checkpoint. Do not gate the existing library behind a new assessment. Existing users with missing continuation fields must load normally and retain all previous features. Partially completed starter users continue their current mission; do not interrupt them with a completion wizard. Empty users still get onboarding.

### A2. Short, server-evaluated foundations checkpoint

Build a bounded 3-topic checkpoint covering arrays/scanning, sets/maps and binary-search boundaries. Use a small reviewed selection of current published exercises/questions or a separate server-owned checkpoint definition outside the friend's content paths. Prefer reuse of existing authoritative grading and current curriculum IDs, not a new giant course or AI-generated test bank.

Disclose when items are reused practice. Do not label an existing primary/alternate exercise as an unseen assessment. A self-reported completed mission alone cannot pass a checkpoint. A free-text explanation may be saved/reflected against a reference; do not pretend deterministic automatic semantic grading exists.

Requirements:

- Useful short instructions and estimated effort, accessible question/trace controls and clear feedback/retry.
- Correctness derived by the server from selected answers/evidence and versioned checkpoint content. Don't trust a client score, passed flag or outcome. Keep answer keys private; public lesson/exercise responses remain student-safe.
- Use existing authoritative trace evaluation when reusing exercises; maintain explicit hints/reference reveals. Record assistance as self-reported unless genuinely observed server-side. Do not claim browser UI can prevent cheating or reliably prove independent work.
- Persist partial progress, so leaving/refreshing resumes the correct checkpoint and the original answer draft. Specify a small, bounded attempt history and text/payload limits.
- Keep attempts distinct. A retry may improve the result without erasing the history of earlier assistance. A new retry must not reuse a finalized request ID with changed data. Identical network retries must be idempotent, including timestamps.
- Accessible loading/error/retry/empty/no-eligible-content states. Requests failing or arriving late must not mix users, attempts or questions. A stale goal version preserves unsaved answers for an explicit retry/reload path.
- Result categories tied to actual evidence: e.g. ready to continue, revisit a particular concept, or insufficient evidence. If showing counts, use literal correct/answered counts, not an invented mastery percentage or job-readiness score. Show the concrete reason and corresponding lesson/practice action.
- Do not loop indefinitely until a student gets everything right and call the original attempt independent. Distinguish formative correction and a new attempt.

Minimum complete checkpoint can have one meaningful graded task per topic. Extra questions are optional only after the complete workflow is verified; avoid a large content-authoring detour. A topic with no eligible validated content remains explicitly unavailable rather than fabricated.

### A3. An editable next-week plan based on real evidence

After the checkpoint (or when explicitly choosing to skip it), offer a short suggested selection: targeted revisit where evidence shows difficulty, one eligible new lesson/practice activity and due review where appropriate. Explain each suggestion using actual checkpoint/history fields. Preserve prerequisite order; don't mark topics passed because the student finished a goal. Use deterministic documented rules first; no mandatory provider call or AI dependency for scheduling.

Let the student edit activities and weekly availability within existing supported capacity values. Reuse the current planner and its prerequisite/capacity logic. Do not reimplement a second scheduler. Show estimated durations, date range, overload/unscheduled items and spillover beyond the proposed week honestly. A seven-day plan must not silently schedule all forty-eight lessons. Use actual Asia/Kolkata dates derived on execution, including midnight/week transitions.

Preview is read-only. Only explicit acceptance persists a plan. Bind acceptance to the exact preview's item selection, availability, date, curriculum/checkpoint version and base goal version; edits or concurrent changes invalidate the preview. Reject stale acceptance rather than applying a different regenerated schedule silently. Preserve all starter fields and previous learning evidence.

On acceptance, Today exposes the planned next activity and why; Atlas opens the selected topic; Proof opens the right lesson/exercise/variant. Completed or already-recorded study items must not remain the permanent recommended next action. Review-due rules must not endlessly drown out new planned learning; document the ordering and allow students to choose another available activity. End-of-library state gives a useful review/mixed-practice action without inventing new content.

Cancel/dismiss/skip must be reversible and non-destructive. Do not create another goal or alter the one-goal-per-owner constraint. Keep exported continuation/plan data sanitized and bounded.

## Architecture and contract boundaries

This goal authorizes a small additive local API/state extension needed for A1–A3; no schema migration or new infrastructure. Prefer bounded optional data under existing owner-scoped `studyWorkspace`, e.g. a versioned `continuation` subtree. Inspect normalization, every touched legacy mutation and export sanitization: unknown/additive fields must survive old completion, recall, recovery and lesson/practice updates.

Write the exact request/response/state contract in `contracts/API-V1.md` BEFORE dependent client/server changes. Current docs contain historical discrepancies: actual schemas/routes and meaningful tests are the baseline, and your additions must make the affected contract accurate. Record an ADR explaining the narrow design, retention, assessment versioning and deterministic suggestion rules.

Existing JSON state CAS/version protection must cover every new mutation. Reuse per-user Supabase request clients and RLS. Missing authentication/owner isolation must fail; never introduce service-role access. Test two synthetic owners. Reject unknown/deleted/draft content IDs, wrong checkpoint/attempt/variant IDs, malformed payloads, oversized text and duplicate/conflicting request IDs. The same finalized attempt's identical retry must remain valid even if unrelated goal data subsequently changed; its changed payload must conflict.

Use stable content/checkpoint identifiers, not array positions. Store the relevant definition version with an attempt. Define how older attempts load when the catalog changes; do not silently regrade an old result against new keys or wipe data. Invalid future versions fail gracefully with a meaningful message rather than making all goals unreadable.

Allowed implementation paths:
- Focused new continuation/checkpoint React components and view wiring in existing frontend files.
- Client service/API adapters, pure workspace derivations, matching synthetic fixtures and meaningful tests.
- Focused goal routes/schemas/services and a new server-owned checkpoint definition outside `server/data/curriculum/**`, plus mocked tests.
- Existing scheduling service only for a concrete demonstrated scheduling defect needed by continuation; keep its public behavior compatible and add regression coverage.
- Contracts/ADR, progress/result/handoff docs and relevant browser scripts.

Do not change public curriculum schemas, content source files or reference-test ownership. No global restyling, new design system, auth rewrite, arbitrary AI task generation, leaderboard, calendar integration, multi-goal architecture or code judge in this run.

## Track B: harden the workflow while Track A is built

Prioritize defects demonstrated by the new journey or current regressions; do not spend the night hunting speculative unrelated issues. Preserve the polished UI from release `ce6405d`.

- Test complete/partial/empty starter accounts and legacy goals missing continuation fields. Seed only clearly synthetic completed goals in fixtures, never production data.
- Keyboard and focus behavior: enter/exit/resume assessment, question navigation, More menu Escape return, selected route focus, dialogs if introduced and no hidden focus traps. Use native controls/semantics; tabs need appropriate keyboard/selection relationships if using tab roles.
- At 1440x900, 1024x768, 390x844 and 320x568: no horizontal page overflow or covered actions; first checkpoint action reachable quickly; long text wraps sensibly; substantive reading remains readable. Test all three styles in light/dark and reduced motion. Smooth transitions must not reset state or block input.
- Loading/slow/failure states for assessment load/evaluation/save and plan preview/accept. Verify selections/reflections survive retry. Mock HTTP 401/409/422/503 and delayed/out-of-order responses without masking a real error as success. A transient failure must not automatically sign out a valid user.
- Save/reload/back/deep links, skip then resume, reference reveal then retry, cancelled plan, capacity change after preview, concurrent tabs and idempotent retry after network uncertainty.
- Export includes only intended bounded learning/continuation data; no tokens/session fields. Live environment/provider behavior remains distinct from fixture outcomes.
- Existing library paging/filter drafts, Proof Learn/Trace/Reflect and completed-starter recovery boundaries must not regress.

Capture before/after screenshots under ignored `.local/` and actually inspect them. A screenshot file or zero overflow alone does not prove a good layout. Use independent expectations and mutation/negative cases; don't write tests that merely mirror implementation or assert a claimed PASS string.

## Required gates and commands

Run baseline once, then targeted checks as components change. Final checks from the PROJECT directory:

```powershell
npm.cmd --prefix server test
npm.cmd --prefix client test
node server/scripts/validate-curriculum.mjs
npm.cmd --prefix client run build
git diff --check
```

The curriculum validator regenerates `client/src/fixtures/curriculum.json`. Do not blindly commit it: curriculum source is friend-owned, so a regeneration should be unchanged unless the baseline content legitimately differs; inspect and report differences without overwriting anyone's work.

Start the labelled local preview using installed scripts (choose a free loopback port):

```powershell
npm.cmd --prefix client run preview:synthetic -- --port 5173
```

Check the ACTUAL logged URL; don't assume port 5173 if fallback occurs. Use current fixture account names from source, not obsolete reports. Keep processes hidden on Windows, record owned PIDs, and stop only those created by this run. Do not kill an existing owner browser/server or use ports belonging to another run.

Existing browser tooling is available at `D:/Projects/Deadline-Catcher/node_modules/playwright` on Darshit's machine; verify availability and do not edit that other project. Harnesses may accept explicit module path and URL; inspect arguments before invoking:

```powershell
node client/scripts/verify-preview-styling.mjs
node client/scripts/verify-atlas-proof.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173
node client/scripts/browser-state-isolation-test.mjs http://127.0.0.1:5173
node client/scripts/verify-workspace.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173
```

Add a focused `client/scripts/verify-continuation.cjs` for the new complete/partial/empty journey, grading/persistence/retry, accepted-plan preservation and responsive focus cases. Give it configurable module/URL paths and isolated browser contexts, bounded timeouts, error collection, failure screenshots and owned-process cleanup. No copied real account credentials.

Test contract cases on the actual mocked Express routes, not only fixture methods. A fixture/backend mismatch is a defect. Do not weaken old assertions or expose server keys to make browser tests pass. A production build check is not a live production check.

## Bounded recovery: keep useful progress without hiding blockers

For a failing check, inspect the error and make at most two focused repair attempts for that cause. If still failing, record the evidence, effect and next action; switch to independent work or final stabilization. Don't keep rerunning the identical failed command, create dozens of speculative replacements, or mark a blocked stage complete.

If a prerequisite core build/data-preservation check fails, stop dependent expansion. If network sources are inaccessible, reuse existing content and local references; no fabricated citations. If a package is missing and installing locked existing dependencies is allowed by the IDE, use npm ci only as necessary; no upgrades/new dependencies. Authentication/permission/quota failures must remain explicit. Never change host policies to finish the night.

If the feature needs a production migration/provider configuration, finish the locally testable implementation and exact review/runbook proposal instead of applying it. No promised six-hour guarantee can override actual tool availability; preserve a resumable state and report time honestly.

## Git checkpoints

Make local commits only after a coherent stage's relevant tests pass and the diff contains solely your scoped work. Verify filenames and scan for secrets without printing matches. Exclude environments, builds, node_modules, local screenshot/profiles/logs and the friend's work. Use explicit paths; don't use `git add .` in the parent repository. Suggested checkpoints: contract + assessed completion flow; accepted next-plan integration; final verified hardening. If a stage is incomplete, leave it documented locally instead of presenting a broken snapshot as a polished release.

No remote push/PR merge/deployment overnight. The public deployed version must remain available while the owner sleeps. Morning review will decide publication. Do not silently keep editing after the six-hour deadline.

## Morning deliverables

Write `docs/OVERNIGHT-CONTINUATION-RESULT.md` with:

1. Actual start/end UTC and Asia/Kolkata times, elapsed duration and how much of the target budget was used. Don't claim six hours if it ran for twenty minutes.
2. Stage counts and a concise plain-language explanation of implemented behavior. Distinguish complete, partial, blocked and optional work deferred.
3. Exact changed files, endpoint/state decisions, retention/versioning and preservation of starter 12/12 and friend-owned content.
4. Actual executed commands, exits/counts, negative/concurrency tests and screenshot paths; separate independent sub-review, same-agent checks and unverified live behavior.
5. Local branch/commit IDs, dirty work remaining, actual listening preview URL, synthetic account instructions and owned process IDs.
6. Any known defects, missing coverage, denied operations or quota issues with precise reproduction/resume steps.
7. A five-minute walkthrough: completed starter -> checkpoint -> wrong answer/retry -> saved result/reload -> suggested activities -> edited capacity -> plan preview -> accept -> Today/Proof -> export; show partial-starter behavior separately.
8. Explicit statement of whether any remote publication/production/database/environment/dependency change occurred (expected: none).

Append a concise dated checkpoint to `handoffs/DARSHIT.md` without overwriting prior history. Add a **draft local** release note describing the user-visible change, not a long agent execution transcript. Leave a working local preview if permitted; otherwise provide the tested startup command and exact blocker. Do not say "everything is verified" when only fixtures or a subset were checked.

The task is complete when a student can finish the starter, understand their recorded evidence, optionally complete and resume a correctly graded checkpoint, accept an explainable capacity-aware next plan, and continue learning without losing earlier history—and the important failure paths have meaningful checks. Otherwise report the exact remaining requirement and stop at the time limit.
