# NextStep continuation repair handoff

Work in `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07` on the existing continuation branch. Git root is its parent, `D:\Projects\BuildToShip`. Use the implementation model selected in the IDE; do not silently switch models. Gemini 4 Argon is a reasonable implementation choice if currently available in the owner's IDE. Reserve limited Opus usage for a specific unresolved concurrency/design defect.

Read `docs/OVERNIGHT-CONTINUATION-INDEPENDENT-REVIEW.md`, the original overnight master, current contracts, source, tests and repository instructions first. The review contains four reproduced API failures and a reproduced browser draft-loss bug. Fix requirements, not assertions. Do not start another feature or redesign the whole dashboard.

## Authorization and preservation

Proceed through routine local inspection, scoped source fixes and installed test/browser commands without asking repeated questions. Preserve existing work and all starter history. Do not read secrets, change .env/dependencies, use production accounts, migrate databases, reset/clean/stash work, alter global settings or bypass permission controls. If a tool genuinely denies access, record it and continue independent work; do not pretend it passed. No push, merge or deploy in this repair run. Leave a reviewable diff; do not commit unless the owner separately requests it.

Do not edit `server/data/curriculum/**`, the friend's reference verification files or coverage documents. Own the continuation schemas/routes/service/helpers, relevant client components/API/fixtures, contracts, regression tests and repair documentation. Extract a small shared pure continuation helper when it reduces fixture/live divergence; do not expose server answer keys to the production browser.

## Stage 1 — save, grading and request identity (R1–R3)

1. Persist a bounded complete draft: answers, reflection, assistance already disclosed, question position and definition version. Restore it on refresh/reopen. Keep question/attempt/account state isolated. Intentional retry resets only new-attempt data, preserving bounded history. A previously disclosed hint must not become independent through a refresh; label assistance self-reported.
2. Serialize/coalesce auto-saves and reconcile latest goal versions. Show accessible unsaved/save-error status with explicit retry/reload that preserves local input. Guard delayed responses after close, reset or account change. Fix modal focus initialization so draft updates do not steal focus; Escape restores the original connected opener.
3. Keep one finalized submission ID and canonical payload across ambiguous network retries. A purposeful new attempt gets a fresh ID. Backend identical retry compares the complete relevant payload, returns the original evaluation/timestamp without bumping goal version, and works after unrelated goal updates. Changed answers, reflection, assistance or definition identity under an existing ID conflict. Ensure fixture parity.
4. Validate known question IDs, option membership and assistance keys, record cardinality and text limits in drafts/evaluations. Reject malformed, unknown and wrong-version inputs without mutation. Persist checkpoint definition version with results; define backwards-compatible loading without silent regrading or deletion.

Acceptance: browser reload preserves saved reflection, answers and hint evidence; rapid choices/delayed save/conflict cannot silently lose the latest draft; dropped evaluation response and retry creates one attempt; canonical mismatches conflict; invalid IDs produce 422. Add durable meaningful regressions.

## Stage 2 — truthful editable continuation (R4–R7)

1. Bind explicit acceptance to exactly the previewed owner/base version, activities, availability, date horizon and curriculum/checkpoint definition version. A stateless integrity-protected token or equivalent server-verified binding is acceptable; do not add a database migration or use a process-local cache as the only binding. Preview remains read-only. Changed inputs require a fresh preview; reject stale/tampered/other-owner acceptance. Inspect existing permitted server configuration before choosing a signing design; do not invent a new secret dependency silently.
2. Represent intentional revisits separately from already-completed new learning, using the existing planner rather than a second scheduler. Include applicable due review and eligible new work with evidence-derived reasons. Preserve prerequisite order and normal planner skip behavior. Support no-checkpoint/skipped/all-done/empty/zero-capacity states truthfully.
3. Let students edit bounded suggested activities as well as availability; removals and changed selections invalidate preview. Replace hardcoded readiness/frontier statements with actual checkpoint/history and chosen content. No checkpoint means no claim of verified comprehension.
4. Establish an explicit seven-day proposal using actual Asia/Kolkata calendar dates. Display planned dates, estimated effort, overflow beyond the week, unscheduled items and capacity conflicts. Do not reuse an expired starter deadline as the week boundary or silently expand to the whole curriculum.
5. Today derives its next pending planned activity rather than always sessions[0]. Completion advances correctly; multi-part work and intentional reviews are distinguished; all-done plans offer a useful next choice. Open actions resolve the correct topic/lesson/exercise. Preserve 12/12 starter evidence and original schedule throughout.

Acceptance: a completed lesson can be scheduled as an explicit failed-concept review; activity editing changes the reviewed plan; applying different inputs without preview fails; Today advances after completion; no-checkpoint copy is honest; week/spillover/unscheduled behavior is visible and tested.

## Stage 3 — independent expectations and delivery

The ignored probes are review evidence, not a release suite. Inspect them, then add focused durable regressions to normal tests; do not merely copy the implementation into expected values. Test real Express routes with the in-memory DB, and separate browser-fixture checks from live server behavior. Cover 401/409/422/503, delayed/out-of-order requests, two owners, matching and mismatched retries, midnight boundary, completed revisit and end-of-library cases.

Run from the app directory:

```powershell
npm.cmd --prefix server test
npm.cmd --prefix client test
node server/scripts/validate-curriculum.mjs
npm.cmd --prefix client run build
git diff --check
node client/scripts/verify-continuation.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173
node client/scripts/verify-atlas-proof.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173
node client/scripts/browser-state-isolation-test.mjs http://127.0.0.1:5173
node client/scripts/verify-workspace.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173
```

Curriculum validation regenerates a client fixture: inspect its diff sequentially and preserve friend's ownership. Reuse the running labelled synthetic preview; if stopped use `npm.cmd --prefix client run preview:synthetic -- --port 5173`, loopback only, and report the actual URL. Inspect new modal flows at 1440, 1024, 390 and 320 widths and keyboard/reduced-motion behavior. Run styling regression if configuration or styling infrastructure changes. Use one source writer.

Track three stable stages with acceptance outcomes and complete/active/remaining counts. Update contracts and write `docs/CONTINUATION-REPAIR-RESULT.md` mapping R1–R7 to changed behavior, exact tests and any remaining limitations. Correct the old completion report's overclaims while preserving its historical evidence. A failed or unexecuted check stays failed/unverified. Stop after a bounded repair if architecture/access is blocked and record the precise blocker. Leave a working preview and a concise owner walkthrough. Do not add unrelated features to consume a time budget.
