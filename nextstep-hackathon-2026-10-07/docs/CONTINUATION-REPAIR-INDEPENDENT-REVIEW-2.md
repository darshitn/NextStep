# Continuation repair: independent review 2

Date: 2026-10-19. Branch: `codex/starter-continuation`. Existing application changes were preserved. No application source edits, commit, push, merge, deployment, secret inspection or production-data operations were performed by this review.

Verdict: substantial repairs are verified, but the claim that R1–R7 are fully resolved remains premature. Finish the specific integration defects below before publication; do not start new features or another visual redesign.

## Verified this review

- Server regression suite: **127/127 passed**, including CP19/CP20 now present in the working tree. The earlier 125 count predates those cases.
- Client regression suite: **84/84 passed**.
- Production client build: passed (CSS 72.09 kB, JS 511.93 kB). Vite reports its normal >500 kB chunk warning; that warning is not a release correctness blocker.
- Existing independent API probe: **16/16 passed**. The four previously failing API expectations now pass.
- Existing browser draft probe: answers, reflection and revealed hint all restore successfully.
- Existing continuation browser harness: **9/9 passed**.
- `git diff --check`: passed (line-ending normalization warnings are separate).
- No diff under collaborator-owned `server/data/curriculum/**`.

These browser checks use synthetic fixtures, not live authentication or the production backend. Full Atlas/workspace/style/state-isolation harnesses were not rerun during this review. No current live deployment claim is made.

## F1 — P1: save queue reuses a stale version and fails to save the latest selection

Location: `client/src/components/workspace/FoundationsCheckpointModal.jsx`, `queueSaveDraft`, around lines 180–225.

The queue calls `onGoalUpdated(res.data.goal)` but does not synchronously advance its own `latestGoalRef` before sending queued work. React has not necessarily rendered the parent's updated goal when the next queued request starts.

Independent browser reproduction: delay synthetic draft saves by 400 ms, select answer 1 and then answer 2 before the first response. The UI displays answer 2; the queue reports a goal-version conflict; the persisted draft contains answer 1. Reload restores answer 1. Recorded result:

```json
{"latestChoiceVisible":true,"draft":{"answers":{"chk_q_arrays_01":"opt_arr_1"}},"latestChoiceAfterReload":false}
```

The error banner exists, which is better than silent console failure, but normal rapid input should not produce a self-inflicted concurrency conflict. Scope queued work to account/open/attempt generation; prevent old draft responses from replacing goal state after reset or evaluation.

Evidence: `client/.local/repair-save-race.cjs` and `repair-save-race-result.json`. The interceptor matches Vite's optional timestamp query. An initial uninstrumented run missed timestamped module requests; it was discarded, then the instrumented run reproduced the bug.

## F2 — P1: next-session derivation reads a different schema from the one persistence writes

Location: `client/src/services/workspace.js`, `deriveActiveStudyPlanSession`, around lines 1044–1137.

- Exercise attempts are arrays of records with `outcome` and `savedAt`. The helper reads the array as one object and looks for `passed`, `status`, or `completedAt`. A successful exercise remains pending.
- Actual saved lesson records contain `status`, `updatedAt` and `lastVisitedAt`; the server does not write `completedAt`. Intentional lesson revisits require that nonexistent field, so re-completing a revisit does not advance the plan.
- Practice revisit records use `savedAt`, but the helper requires `completedAt`.

Independent pure probes using the actual persisted record shapes produced **3/3 failed expectations**: ordinary successful exercise, completed lesson revisit after acceptance, solved practice revisit after acceptance. All returned `allCompleted: false` when completion evidence was present.

Evidence: `client/.local/repair-progress-probe.mjs` and `repair-progress-result.log`. The probes do not mutate application data. Fix with explicit completion/recency rules grounded in real persisted fields; do not simply mark a revisit complete on any unrelated note edit. Preserve distinctions among successful proof outcomes, bookmarks/editorial review and intentional practice.

## F3 — P1: retry identity is retained, but finalized payload is mutable

Location: `FoundationsCheckpointModal.jsx`, `handleSubmitEvaluation`, around lines 262–299.

The handler retains the attempt ID across errors but reads live answers/reflection/assistance on each subsequent submission. It does not retain an immutable finalized payload. The backend correctly rejects the edited retry; the UI mislabels all HTTP 409 responses as goal-version changes and tells the user to retry again.

Independent browser reproduction: synthetic evaluation commits successfully but its response is dropped; edit the reflection and retry. Recorded requests used the same attempt ID with these two reflections:

```text
Original finalized reflection
Edited reflection after uncertain response
```

The resulting UI says the goal version changed and suggests retry, rather than resolving the finalized attempt or offering an explicit new attempt. Keep the original ID and canonical payload together until uncertainty is resolved. Deliberate new attempts need a distinct user action and a new ID. Distinguish `ATTEMPT_CONFLICT` from `VERSION_CONFLICT` in recovery copy.

Evidence: `client/.local/repair-ambiguous-retry.cjs` and `repair-ambiguous-retry-result.json`. Only synthetic fixtures were used.

## F4 — P2: remaining completion claims need correction

Source inspection shows the checkpoint load effect does not call `setCurrentIndex` from the saved draft. The field is persisted but question position is not restored. The original reload probe always navigates from question 1 and does not verify this requirement.

Continuation candidate derivation still contains only failed-topic lessons and eligible lessons, with no due-review candidate rule. When all lessons are complete it falls back to the first lesson as a new lesson, which the planner skips. R6 cannot be called fully complete without implementing the required due-review/end-of-library behavior or explicitly documenting an agreed deferral.

Checkpoint definition version is stored and checked when supplied, but the client hardcodes 1, the schemas permit omission and validation runs before old-attempt idempotency lookup. Version-update retry behavior needs a meaningful regression rather than assuming storage of a version establishes compatibility.

## Bounded next repair prompt

Read this document, the original continuation master, contracts and current source. Preserve the existing uncommitted work. Work in `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`. Do not edit the friend's curriculum/reference files, read secrets, change dependencies or production configuration, migrate data, reset work, push, merge or deploy.

1. Repair F1–F3 first with durable tests that fail against this exact current implementation. Use the ignored probes as reproductions, then put maintainable regressions in normal test/browser suites. Assert the injected failure actually ran; do not let a missing module interceptor produce a false pass. Guard save/evaluate/reset sequencing and late responses across modal/account/attempt transitions.
2. Use actual API-returned record shapes for completion tests. Cover ordinary exercise outcomes, successful revisit after plan acceptance, pre-plan evidence not completing a revisit, unsuccessful/bookmarked work not satisfying solve requirements, and all-done/multi-part behavior. Do not create test-only fields that production never stores.
3. Restore bounded saved question position. Add real due-review and end-of-library behavior within existing published content, preserving prerequisite/capacity rules; make unsupported scope explicit. Use the loaded definition version in the client and test historical attempt loading/retry across a simulated definition update without regrading old outcomes.
4. Rerun server/client tests, production build, diff check, the three reproductions and continuation browser suite. Broaden to existing Atlas/workspace/state-isolation regressions for affected paths. Preserve zero-overflow/modal keyboard behavior. Correct the repair result report with exact counts, remaining limitations and a short owner walkthrough.

Use one source writer, installed tools and labelled loopback preview. Routine reversible edits/checks are authorized. Report genuine denied access or architectural blockers without bypassing permission controls. Do not replace precise completion evidence with a generic “all verified” assertion.

Stage status: independent repair review complete; focused follow-up repair pending; final release verification/publication pending. The currently deployed baseline remains separate from this local feature branch.
