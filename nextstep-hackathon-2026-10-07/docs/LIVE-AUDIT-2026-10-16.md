# NextStep live audit — 16 October 2026

## Status

Stages: 1 research/source audit complete; 2 local workspace implementation complete; 3 local regression and browser acceptance complete; 4 deployment and post-deployment acceptance pending. Three complete, one remaining. No commit, push, migration or deployment performed.

The public site is https://next-step-six-theta.vercel.app. It still serves the older frontend (`index-65MiunQH.js`). Render health returned 200 and revision `eec8b0b85fc5b56df420b494e446b132e98e99b6`, matching the committed checkout before these uncommitted changes. Health alone does not establish authenticated feature correctness.

The signed-in account already had 12/12 completed missions and saved history. Its progress and notes were preserved. Live checks revisited an existing mission, tested trace predictions, requested guidance with synthetic unsaved text, discarded that draft and reloaded. The final live progress remained 12/12. No production completion, notes, schedule or goal writes were performed.

## Reproduced problems and local repairs

| Problem | Evidence | Local change |
| --- | --- | --- |
| Completed-mission revision help fails | Live M04 request returned `NO_PENDING_MISSION: All missions are already completed.` | Guidance accepts recorded completed missions as read-only revision, while rejecting future incomplete missions. Contract and fixture agree. |
| Transient auth lookup can remove a usable session | Focused probes failed for auth 503 and network failure before repair | Preserve credentials on temporary failures, expose retry, expire only rejected sessions, and guard delayed responses against account/sign-out races. |
| Direct recovery-page refresh cannot load a persisted goal | Source/browser recovery audit | Load the goal on route entry; distinguish missing goal from outage. |
| Recovery retry can repeat an uncertain write or do nothing | Failure-path inspection and synthetic preview outage | Preview retry actually retries; uncertain apply/conflict reloads the saved plan rather than blindly repeating mutation. |
| Onboarding outage can look like a new account | Synthetic goal-lookup outage | Block creation until lookup succeeds; show a working retry. |
| Sign-in flow can mislabel goal loading failure | Auth-flow inspection | Dashboard owns goal lookup after authentication; form rejection no longer broadcasts session expiry. |
| Unsupported pacing claim / misleading fixture source | Copy and fixture inspection | Remove claim that hints adapt scheduling; label synthetic AI output `fixture`. |

## Verification

- Client: 58/58 automated tests pass, including auth outages/races, fixture revision, scheduling, review derivation, timer math and export sanitization.
- Server: 48/48 automated tests pass, including completed-track revision without progress mutation and future-mission rejection. Provider calls in these tests are mocked.
- Production client build passes. `git diff --check` passes.
- Hands-on isolated browser: auth-outage retry; onboarding lookup retry; direct recovery entry; failed preview retry; successful preview/apply; roadmap search; completed-mission fixture guidance; save notes/reload; hint completion and next mission; review queue; recall/reveal/view-switch draft preservation; Insights 2 completions = 1 independent + 1 hint; actual JSON download.
- Mobile viewport 390px: document width 384px and scroll width 384px; no horizontal overflow. Desktop layout visually inspected. Temporary viewport restored.
- Desktop screenshot: `client/.local/live-audit/dashboard-desktop.jpg`; mobile: `client/.local/live-audit/dashboard-mobile.jpg`. These are ignored local synthetic evidence, not production/student data.
- Earlier workspace verification separately covered 13 synthetic journeys and 72 view/width/theme combinations; that complete matrix was not rerun in this audit.

Antigravity implementation was attempted but denied project file reads in its headless permission context and made no edits. Codex used the fallback the owner explicitly authorized. Permissions were not weakened.

## What is not established

These fixes are local. The live completed-track error blocked the actual Gemini call; successful real-provider revision remains unverified until the backend is deployed. Synthetic browser flows do not establish live Supabase writes or RLS isolation. Public signup/email delivery and cross-account ownership need a dedicated empty test account after deployment. No schema changes or service-role credentials are needed for this patch.

Current product scope remains one authored 12-mission DSA goal. Focus time and recall drafts are session-only and explicitly labelled. Review suggestions are derived from recorded notes/outcomes; there is no persisted spaced-review history or measured learning improvement.

## Next product milestones, in priority order

1. Persist review attempts, confidence and next-review date with owner-scoped access. Acceptance: a review survives refresh/sign-out; feedback is shown after recall; another account cannot read or write it. Retrieval plus later feedback provides a stronger learning loop than another completion badge. Research: https://www.learningscientists.org/blog/2016/6/23-1.
2. Add multiple goals and editable milestones with realistic durations and an explicit next-goal path after completion. Requires a reviewed database/API migration from the current one-goal model. Acceptance: switching goals cannot mix schedules, notes, reviews or completions; existing goal/history migrate intact.
3. Extend authored predict/explain/transfer exercises beyond the three current trace missions. Acceptance: deterministic checks for every supported exercise, accessible controls, useful feedback for incorrect reasoning, and honest AI failure states.
4. Add an explicitly labelled, isolated interactive public demo for judges. Acceptance: no email dependency, no real student data, resettable synthetic state, no silent fixture fallback in the real app.
5. Pilot the complete loop with students and record consented usability findings. Demonstrate: start a mission → explain a mistake → adjust an exam week → recall the concept later. Do not claim improved retention or contest-winning odds without evidence.

For visual direction, keep navigation subdued, actions predictable and work content prominent. Dense UI should support decisions rather than add decorative charts. Reference: https://linear.app/now/behind-the-latest-design-refresh.

## Deployment acceptance gate

After explicit owner authorization to commit/push and deploy to the existing Vercel/Render project: review the complete patch including the preceding workspace upgrade; run the documented production build/tests; deploy matching frontend/backend; verify the Render revision and new frontend asset; repeat authenticated revision on the completed account without changing history. On a dedicated empty account, exercise create → guidance → save → completion → recovery → reload and verify isolation with a second account. Keep secrets out of logs and Git. Approval is required by project AGENTS.md and the delegation skill before publication.
