# NextStep local QA: corrected evidence report

Date: 2026-10-21. Branch: codex/adaptive-practice. Work remains uncommitted/unpushed. Historical implementer execution window: 17:18–18:36 IST (reported; this correction did not rerun that window).

## Coverage and verdict

92 feature rows across 12 domains are classified in [the inventory](FULL-LOCAL-QA-INVENTORY.md): 68 REPORTED PASS; 8 PARTIAL; 15 VERIFIED; 1 PENDING. These counts replace the incorrect 68/68 claim. Browser journeys, fixture evaluation, route/unit checks and pending acceptance are separate. Passing sampled checks does not prove every feature or item was exercised.

READY FOR PUBLICATION REVIEW of the bounded adaptive-practice milestone. The full 15-group release gate was independently rerun and passed with exit code 0, including 155 server tests, 152 client tests and the production build (9.89 seconds). The pending/partial inventory checks remain disclosed. This is not exhaustive UI acceptance, production acceptance or authorization to publish. No new application blocker was reproduced in the focused QA repair review; that does not assert zero undiscovered defects.

## Independently verified

- Complete release gate: 15/15 groups passed. Local log: client/.local/full-local-review-release.log. Changed/untracked file scan reviewed 41 files and found no secret-shaped values or private/generated paths; no dependency, database or curriculum-content paths changed. Pattern scanning is not a proof of absence of every possible secret.
- Goal rename saves and survives reload in an isolated synthetic browser.
- Review has no horizontal overflow at 320x568.
- All 12 starter completion dialogs, explicit self-reported outcomes/reflections, advancement, reload checkpoints and final continuation action: 18 checks passed. Does not prove every underlying DSA task was solved or every guidance interaction used.
- Adaptive session repairs: permanent route suite 20/20 and focused client suite 7/7; stale wrong-variant evidence rejects with 422, altered same-ID notes reject with 409. Browser suite previously rerun 8/8.
- Detailed evidence: [independent QA review](FULL-LOCAL-QA-INDEPENDENT-REVIEW.md) and [session repair review](ADAPTIVE-PRACTICE-INDEPENDENT-REVIEW.md).

## Curriculum coverage and limits

Published catalog: 12 topics, 48 lessons, 18 traces, 120 external practice links. The QA stage4 script inspects 12 topic cards and selected lesson/trace UI. Its 18-exercise primary/alternate matrix calls apiFixture in Node. That establishes fixture-evaluation coverage, not complete browser save journeys for all traces, nor rendering of all 48 lessons. Earlier algorithm execution tests are distinct evidence.

Remaining requested checks: per-lesson rendered inspection, every trace/variant UI save, further failure injections outside existing suites, real unfamiliar-person usability and authenticated live integrations. ADP-05's cited PS15 is a trace-assistance test, not proof of lesson-check grading; that row is pending. No runtime behavior was changed to satisfy incorrect report expectations.

## Confirmed repairs

QA-001: missing synthetic renameGoal method repaired; independent persistence check passed.
QA-002: narrow Review action overflow repaired; independent 320px geometry check passed. See [findings](FULL-LOCAL-QA-FINDINGS.md).

Correct terminology: actual availability presets are weekdays 30 or 60 minutes/day. Timer presets are 15/25/30 minutes; timer resets on reload. Starter mission names come from the real catalog; they are not interchangeable with later curriculum exercises.

## Screenshot index

Actual PNG count at correction: 27, replacing the unsupported 29 claim. Links below are generated from existing files under the ignored evidence directory. Screenshots establish visible state, not API correctness.

- [00-initial-load.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/00-initial-load.png)
- [stage2/01-signin-validation-errors.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/01-signin-validation-errors.png)
- [stage2/02-onboarding-sliders.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/02-onboarding-sliders.png)
- [stage2/03-desktop-navigation.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/03-desktop-navigation.png)
- [stage2/04-mobile-navigation-sheet.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/04-mobile-navigation-sheet.png)
- [stage2/05-interactive-guide-traversal.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/05-interactive-guide-traversal.png)
- [stage2/06-appearance-themes.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/06-appearance-themes.png)
- [stage2/07-goal-rename.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/07-goal-rename.png)
- [stage2/08-logout-isolation.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage2/08-logout-isolation.png)
- [stage3/09-starter-track-m12-completed.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage3/09-starter-track-m12-completed.png)
- [stage3/10-roadmap-all-completed.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage3/10-roadmap-all-completed.png)
- [stage4/01-atlas-topics-map.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage4/01-atlas-topics-map.png)
- [stage4/02-atlas-topic-inspector.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage4/02-atlas-topic-inspector.png)
- [stage4/03-proof-studio-trace-active.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage4/03-proof-studio-trace-active.png)
- [stage4/04-proof-studio-trace-complete.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage4/04-proof-studio-trace-complete.png)
- [stage4/05-exercise-free-lesson-complete.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage4/05-exercise-free-lesson-complete.png)
- [stage5/01-practice-library.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage5/01-practice-library.png)
- [stage5/02-review-queue-recall.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage5/02-review-queue-recall.png)
- [stage5/03-progress-insights.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage5/03-progress-insights.png)
- [stage5/04-my-week-continuation.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage5/04-my-week-continuation.png)
- [stage6/01-adaptive-practice-proposal.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage6/01-adaptive-practice-proposal.png)
- [stage6/02-active-practice-session.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage6/02-active-practice-session.png)
- [stage7/01-responsive-1024-tablet.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/01-responsive-1024-tablet.png)
- [stage7/01-responsive-1440-desktop.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/01-responsive-1440-desktop.png)
- [stage7/01-responsive-320-narrow.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/01-responsive-320-narrow.png)
- [stage7/01-responsive-390-mobile.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/01-responsive-390-mobile.png)
- [stage7/02-failure-conflict-recovery.png](../client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/02-failure-conflict-recovery.png)

## Original implementer-reported command evidence

The following retains the original execution report; it is not a statement that this documentation correction independently reran every command.

| Command Line | Directory | Exit Code | Results Summary |
| :--- | :--- | :--- | :--- |
| `npm.cmd --prefix server test` | `server/` | `0` | 155 tests passed, 0 failed, 12 suites, 5.92s |
| `npm.cmd --prefix client test` | `client/` | `0` | 152 tests passed, 0 failed, 1.56s |
| `node server/scripts/validate-curriculum.mjs` | root | `0` | 12 topics, 48 lessons, 18 exercises, 120 practice problems, 0 schema errors |
| `npm.cmd --prefix client run build` | `client/` | `0` | Vite v5.4.21 production build clean in 15.54s |
| `powershell -ExecutionPolicy Bypass -File scripts/verify-continuation-release.ps1` | root | `0` | All 15 continuation release gates passed cleanly |
| `git -c core.safecrlf=false diff --check` | root | `0` | 0 whitespace or formatting issues detected |
| `node client/scripts/qa-stage0-sanity.cjs` | root | `0` | 1/1 passed |
| `node client/scripts/qa-stage2-onboarding-navigation.cjs` | root | `0` | 8/8 passed |
| `node client/scripts/qa-stage3-starter-journey.cjs` | root | `0` | 18/18 passed |
| `node client/scripts/qa-stage4-curriculum-traces.cjs` | root | `0` | 9/9 passed |
| `node client/scripts/qa-stage5-practice-review-week.cjs` | root | `0` | 4/4 passed |
| `node client/scripts/qa-stage6-adaptive-practice.cjs` | root | `0` | 3/3 passed |
| `node client/scripts/qa-stage7-failure-responsive.cjs` | root | `0` | 5/5 passed |
| `node client/scripts/verify-adaptive-practice.cjs` | root | `0` | 8/8 passed |
| `node client/scripts/verify-continuation.cjs` | root | `0` | 9/9 passed |

## Owner walkthrough and remaining acceptance

1. Open labelled synthetic localhost, sign in to student.active and inspect the primary action.
2. Open Practise what needs work, solve and save a real trace, return and inspect the session summary.
3. Rename the goal, reload, and confirm it persisted.
4. Open Learning path and Review at mobile width; inspect evidence explanations and keyboard access.
5. Ask an unfamiliar person to start an activity, find their week and explain saved progress without coaching. Record what they actually do.

Live Supabase confirmation, Gemini provider calls, production persistence and novice usability remain unverified here. No production data was used. No commit, push, deployment, dependency change, environment edit or database migration was performed by the documentation correction.
