# NextStep: final focused MVP pass

Implement this milestone in the existing NextStep application. Work in `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`. Finish the work, test it, and report evidence. Do not stop at a plan.

## Scope and safeguards

Priority order: (1) verify and repair the real learning loop, (2) remove obvious UX defects, (3) implement ONE deterministic m04 practice exercise, (4) align the demo with the running app. This is the active milestone; do not implement the entire judge-readiness report.

Read AGENTS.md and the latest handoff. Darshit owns implementation; Sankirth supplies configuration/access; Harshitha presents. Use one editing session. Preserve dirty files, existing .env files, lockfiles and unrelated work. Git root is the parent BuildToShip repository. No reset, clean, stash, nested Git, commit, push, deploy or shared database changes. Never read credentials aloud or include them in logs/report. Use synthetic accounts/data only.

No new tracks, chat, study rooms, calendar integration, code execution, voice, leaderboards, authentication replacement or complete visual redesign. Keep existing routes and scheduling contracts unless a small documented change is required by this scope.

## 1. Finish the reliability gate

The previous report records 37 server tests, 14 client fixture tests and a passing build. Inspect the current source; do not treat that report as proof of a live authenticated flow or React draft behavior.

Inspect DashboardPage.jsx, GuidancePanel.jsx, ResumePracticeCard.jsx, both API adapters, goal routes/schemas, curatedChecks.js and learningLoop tests. Preserve the repairs to strict payloads, question normalization, server-side assessment preservation, mission isolation and 503-versus-409 handling.

Run the existing baseline commands from the application directory:
```powershell
npm.cmd --prefix server test
npm.cmd --prefix client test
npm.cmd --prefix client run build
```

Do not repeatedly reinstall packages or change versions. If Windows blocks npm.ps1 use npm.cmd. If a port is occupied, inspect/reuse the correct process or choose an available port; do not kill unrelated Node processes.

Use the running browser and existing API when available. If login is required, tell the user which local login page to sign into; never request a password in chat, extract saved passwords, bypass authentication, or switch production to fixtures. Continue independent local implementation while waiting. Missing sign-in blocks live acceptance, not the remaining code work.

With an authenticated synthetic account and valid prerequisites for m04, verify:
1. Save a blocker, get real guidance and submit the displayed curated check.
2. Toggle Still unsure / Ready to continue, then dismiss the reminder. Notes and assessment must remain saved.
3. Refresh and reopen the mission. Saved question/notes/answer remain available; continuing saved practice should not require a new AI call just to display previous guidance.
4. Type an unsaved draft, provoke a controlled stale-version conflict from a second session, and verify the actual rendered form keeps the draft for an explicit retry.
5. Switch missions and verify inputs/assessments belong to the selected mission. Watch for a slow response from the old mission arriving after the switch; ignore or cancel stale UI responses.
6. Change availability, preview/apply recovery and reload. Completion and learning context remain intact.
7. Use a second synthetic user to verify real account isolation when access permits. Mock owner filtering is not proof of Supabase RLS.

Fix failures within this journey before adding polish. Checkpoint report must distinguish actual browser tests, mocked HTTP tests, fixture tests and unperformed checks. A variable named studentDraft in a fixture test does not verify React input preservation.

## 2. Small UX fixes with high value

- Remove the current answer placeholder containing the answer “3 comparisons ... 4 comparisons”. Use a neutral prompt: “Explain your reasoning and when the algorithm stops.”
- Associate all blocker/answer labels with inputs using id/htmlFor. Expose selected states, accessible icon-button names, visible focus and a status announcement for save/error feedback.
- Use short student-facing copy: Save my notes, Help me get unstuck, Check my reasoning, Continue practising. Remove implementation jargon from primary labels. Keep honest self-report/AI limitations in concise secondary text.
- Put the next/resume action ahead of the large progress summary. Keep the roadmap collapsed and put calendar/activity behind an expandable Progress section if that is the smallest safe change. Do not build a new navigation architecture.
- Make Start practising the primary mission action, opening/focusing the practice panel. Keep Record completion secondary and retain its current validation. For missions without an interactive exercise, show existing steps/resources/guidance.
- When opening practice, scroll/focus to its heading so users are not left looking at the old card. Use reduced-motion preferences.
- Use existing semantic CSS variables/classes consistently. Inspect ResumePracticeCard's `ui-bg-soft/50`, `ui-border-border/60` and mixed `dark:` usage; replace ineffective/inconsistent variants with actual supported theme classes. Verify the theme switch, not only the OS theme.
- Ensure a completed/resolved earlier record does not crowd out a relevant unresolved record. Keep reviewed notes accessible; do not delete records to hide reminders.
- Preserve drafts during network failures and same-mission updates. If closing the panel would lose unsaved work, provide Save and close / Keep editing / Discard with explicit behavior. A failed save must not close the panel or show saved success.

## 3. Add ONE small interactive exercise for m04

Create a reusable component such as `client/src/components/DuplicateTrace.jsx` and a pure transition helper, using the existing React/CSS stack. Render it inside m04 practice only. No new provider, package or drawing framework is needed.

Use two curated arrays: `[2, 5, 2]` and retry `[4, 1, 4]`.

Show array cells, current index, current value, seen-set and one question at a time. The interaction is:
- Before updating the set, ask whether the current value has already been seen.
- On a correct “No”, visibly insert the value and advance.
- On a correct “Yes”, stop and identify the duplicate/index.
- On a wrong prediction, explain the actual set state and let the student retry without corrupting the transition.
- At the end offer Try another example, then the EXISTING curated m04 reasoning check.

Keep the existing AI assessment bound to its original question/array. Do not send an answer about the alternate array to the rubric for `[2,5,2]`. Clearly label the transition back to the original check. The visual exercise is deterministic practice, not a new AI-graded assessment.

Show a concise explanation of check-before-insert. Do not reveal each prediction's answer before the student chooses. Keep all operations available by keyboard and expose textual state; animation must not be the only way to understand the result.

Exercise progress must never award XP, complete a mission, replace an assessment or change a schedule. Do not build a new database subsystem for transient animation state. Label Restart exercise behavior honestly; keep the important student takeaway in the existing saved notes flow. Do not claim the animation position survives reload if it does not. Never silently overwrite an existing note with generated exercise text.

Add focused tests for absent/present predictions, set-before-insert behavior, duplicate at index 2, reset/alternate array and invalid actions after completion. Put the helper tests where the current test script discovers them, or adjust the script narrowly. Do not claim fixture tests cover the rendered component.

## 4. Verify and prepare the exact demo

Rerun server/client tests and client build after changes. Run `node scripts/validate-kit.mjs` if contracts/planning docs were changed; it is not a substitute for application tests.

Browser-check Light/Dark, desktop, approximately 390px mobile width, keyboard operation, draft save/failure behavior and one complete trace. If browser access is blocked, report that clearly and provide the exact manual checks; do not claim visual verification.

Update `presentation/LEARNING-LOOP-DEMO.md` with actual button labels and this short sequence:
1. Ananya's saved blocker for m04; prerequisite missions m01–m03 correctly completed on an isolated synthetic account.
2. One wrong prediction in the trace, then a corrected attempt.
3. Original curated reasoning question and actual AI feedback if available.
4. Save, reload and resume the notes.
5. Reduced study availability; recovery preview preserves completed work.

Use actual catalogue titles. Remove sweeping claims about competing platforms. Clearly identify synthetic persona, recorded fallback and any local-only demonstration. Do not fake completion history, responses or live deployment. Keep script within the organizer's actual time allowance; aim for about 3 minutes if no different requirement is available.

Correct START-HERE.md and handoffs/DARSHIT.md to state the real status: locally tested versus authenticated browser verified versus deployed verified. No “no blockers” or “complete MVP” claim while required live checks remain unavailable.

## Final report and stop

Report only: changes, exact commands/counts, browser evidence, real AI/persistence/account isolation results, remaining blockers, Git status and next exact release action. If sign-in is the only blocker, identify the page and the outstanding checks; do not ask for secrets or repeat an appearance milestone.

Finish this bounded milestone and stop. No optional integrations or automatic publication. Readiness means the actual user journey works, not merely that the health endpoint responds.
