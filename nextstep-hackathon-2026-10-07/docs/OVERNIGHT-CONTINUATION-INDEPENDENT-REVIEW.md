# Overnight continuation: independent review — 2026-10-19

Verdict: implementation exists and the reported main checks reproduce, but the release is not ready. The claim that every requirement is complete is not supported by negative-case checks and source inspection. Finishing early is allowed; elapsed time is not the issue.

Reviewed local baseline: `codex/starter-continuation`, HEAD `34a6d54`, including `2102ffe`, `1f6b9da`, `0d7f918`. No application source was changed during this review. No remote push, merge, deployment, credentials inspection or production-data operation was performed.

## Independent evidence

- Server tests: 119/119 passed with local socket permission. Initial restricted execution failed to run socket-dependent checks; that was not treated as an application defect.
- Client tests: 81/81 passed.
- Production client build: passed, 1,630 modules; CSS 71.40 kB, JS 499.34 kB.
- Existing continuation browser harness: 9/9 passed against the local synthetic preview. These are fixture browser journeys, not authenticated production API verification.
- Git diff whitespace check: passed before this review document was added.
- Four additional in-memory API negative tests: all four failed their required expectations, reproducing the defects below. The 12 original integration cases in the same process passed.
- Independent browser reload probe: `answerRestored: true`, `reflectionRestored: false`, `hintStillMarked: 0`, after explicitly saving a draft containing an answer, revealed hint and reflection.
- Inspected the newly generated plan-preview screenshot visually. The modal is legible and organized; it provides availability editing but no activity editing.

Ignored review artifacts, relative to the app directory:

- `server/.local/continuation-independent.test.mjs`
- `server/.local/continuation-independent-result.log`
- `client/.local/continuation-independent-browser.cjs`
- `client/.local/continuation-independent-browser.json`
- `client/.local/continuation-independent-browser.png`
- `client/.local/continuation-evidence/2026-10-19T02-13-10-392Z/`

The temporary API probe reuses the existing in-memory route harness and adds independent expectations. It does not connect to Supabase. Its failing exit is expected evidence of the current defects, not a passing repair gate.

## Findings

### R1 — P1: incomplete and unsafe checkpoint save/retry lifecycle

`FoundationsCheckpointModal.jsx` loads only `draft.answers`; both save paths send only `draftAnswers`. Reflection and hint assistance do not survive refresh, confirmed by the independent browser probe. A student can reveal a hint, reload, and submit without that earlier assistance represented. Assistance remains self-reported, but a recorded disclosure must not silently disappear.

Automatic saves run concurrently against `goal.version`, failures are only logged to the console, and late save responses are not scoped to the active modal/attempt. Serialize/coalesce writes, preserve unsaved data on conflict and show actionable errors. Inspect focus effect dependencies as well: parent inline `onClose` callbacks change whenever goal updates and can retrigger focus initialization.

Submission generates a fresh UUID for every click. An ambiguous network failure followed by Retry can create another attempt instead of retrying the original finalized request. Retain the request identity and immutable submitted payload until its outcome is resolved. A deliberate new attempt gets a new identity.

### R2 — P1: idempotency compares answers only

In `server/src/routes/goal.js`, the existing-attempt comparison ignores reflection, assistance and checkpoint identity/version. Submitting the same attempt ID and answers with a changed reflection returned HTTP 200; the required response is a conflict. Validate a canonical full submission identity, excluding concurrency metadata such as expectedVersion. Preserve identical retry timestamps and permit it after unrelated goal changes.

### R3 — P1: answer IDs and content versions are not enforced

An evaluation containing `unknown_question: unknown_option` returned HTTP 200 and persisted a result instead of HTTP 422. Record schemas bound individual string lengths but do not bound record cardinality or validate membership against the definition. Validate drafts and submissions, including assistance keys and options belonging to each question.

Checkpoint definitions have a version, but `gradeCheckpointAttempt` does not store it in the result and requests do not bind to it. Store and validate the definition version; retain older results without regrading them against changed keys. Handle unsupported future versions gracefully.

### R4 — P1: acceptance is not bound to the actual preview

Preview generates a UUID, but apply does not require or validate it or an equivalent integrity binding. A preview of `les_arrays_01` followed by apply of `les_arrays_02` at the same goal version returned HTTP 200. Apply recomputes arbitrary submitted inputs. Bind owner, selected activities, availability, dates, content versions and base goal version to the preview, without making preview mutate learning state. Reject changes until re-previewed.

### R5 — P1: required revisits disappear and Today never advances

Continuation derives failed-topic lesson IDs, then passes them through the normal planner, which intentionally skips completed lessons. A failed checkpoint concept with a completed linked lesson produced no revisit session in the independent API probe. Represent intentional review explicitly; preserve the existing normal planner behavior of skipping completed new lessons.

`TodayView.jsx` reads `studyPlan.sessions[0]` for both title and open action without filtering recorded completion. The first item can remain the permanent next action. Derive the next pending activity from actual evidence, respecting multi-part sessions and intentional reviews, and handle all-done plans honestly.

### R6 — P2: activity editing and due-review selection are missing

The modal lets students edit availability only. The master requires editable activities. Backend automatic selection derives failed lessons and the first eligible new lesson; it contains no due-review selection. Add bounded selectable suggestions with individual reasons and explicit remove/change controls. Check end-of-library and no-eligible cases.

The modal hardcodes “Foundation Ready” and “verified core pattern comprehension” whenever failedTopics is empty, including an unattempted/skipped checkpoint. It also hardcodes Two Pointers/Sliding Window rather than describing the actual suggested lesson. Use actual evidence and selected items.

### R7 — P2: next-week horizon and spillover are not represented

Preview defaults its targetDate to the original goal deadline. The UI presents “Next-Week Study Plan” without establishing a seven-day horizon or displaying unscheduled IDs/spillover. Use execution-time Asia/Kolkata dates, separate proposed-week capacity from later spillover, and display unscheduled work and overload honestly. A valid short plan may finish before seven days; do not pad it artificially.

## Coverage limits and next stages

Stage 1 independent review: complete. Stage 2 bounded repair: pending. Stage 3 independent release verification: pending. Counts: 1 complete, 0 active implementation, 2 pending.

The existing harnesses cover happy paths, selected isolation and responsive behavior; passing them does not cover the failures reproduced above. The other legacy browser harnesses and the friend's full algorithm content coverage were not rerun in this review. Live authentication, production RLS and deployment of this new branch remain unverified. Keep the currently deployed baseline available until repairs pass review.
