# Continuation integration review 3 — 2026-10-19

**Closed locally:** I1–I3 were repaired directly following the owner's instruction to end the repeated delegation cycle. The complete release gate passed. See `docs/CONTINUATION-RELEASE-CHECKPOINT-2026-10-19.md` for the current outcome; the findings below are historical reproductions, not a new implementation request.

Baseline reviewed: local `codex/starter-continuation`, existing uncommitted repair diff preserved. Source reports are evidence to verify, not acceptance gates.

## Confirmed repairs and checks

- Server: 131/131 tests passed with local socket access and in-memory DB.
- Client: 88/88 tests passed.
- Three progression probes: 3/3 passed using actual persisted record shapes.
- Delayed save reproduction: latest answer survives reload, no alert.
- Dropped evaluation response reproduction: both requests use identical ID and original reflection, no alert.
- Existing continuation browser suite: 9/9 passed.
- Production build passed: CSS 72.09 kB, JS 514.53 kB. Bundle-size warning remains informational.

These are local synthetic and mocked-server checks, not live Supabase/Render/Vercel verification. The client test titled “simulated definition update” still does not mutate the definition; its name alone is not proof of that scenario.

## Remaining reproduced findings

### I1: due reviews are absent from the modal candidates

`ContinuationPlanModal.jsx` calls `deriveWorkspaceReviewQueue(goal, curriculum, new Date())`; the helper requires a catalog wrapper containing `.curriculum`. With an authored exercise and due attempt, the correct wrapper yields `["ex_arrays_01"]`, whereas the modal's argument yields `[]`. Server CP24 tests auto-derivation, not the modal integration, so it cannot catch this call-site error.

### I2: revisit semantics can change after a signed preview

New `revisitItemIds` request input affects the schedule but is omitted from the signed preview payload. Applying a valid preview with an empty revisit list changes an exercise session from `isRevisit: true` to `false` with HTTP 200. Earlier evidence can then satisfy an activity intended as a new review.

In-memory reproduction: `server/.local/review3-preview-integrity.test.mjs`. The original 24 cases pass; the added integrity expectation fails. Apply must reject changed flags or preserve authenticated preview semantics, including when optional flags are omitted.

### I3: draft-save/submission overlap can make retry permanently stale

Reproduction: `client/.local/review3-submit-race.cjs`. Save commits but its response is delayed 600ms. Submit while it is in flight. Evaluation rejects expectedVersion 5. The generation guard discards the delayed save response, and frozen submission metadata resends version 5; retry rejects again. Local inputs remain present, but the suggested retry does not resolve the conflict.

Coordinate draft draining with submit; preserve canonical uncertain submission identity and payload while handling concurrency metadata/reconciliation explicitly. Regression must include the real overlap, not just a dropped evaluation response.

## Follow-up execution

A bounded handoff for I1–I3 was sent through the installed antigravity-delegator helper using its verified `gemini-3.8-flash-medium` model. CLI doctor passed (model/auth readiness), but the implementation run repeatedly read the same files without a patch. The owned runner and direct child were stopped; the runner exited -1. This is a stopped incomplete run, not a successful implementation or an approval denial. No CLI fallback model or permission setting was used. The handoff prohibits publication, secrets/config changes, destructive Git operations, dependencies and collaborator curriculum edits. Implementation and independent acceptance results remain pending; do not treat this document as release approval.

Scratch handoff: `D:\Projects\BuildToShip\.local\continuation-review3-handoff.md`. Ignored reproduction artifacts remain local. No commit, push, merge or deployment was performed by the review.

Owner IDE handoff: `docs/ANTIGRAVITY-CONTINUATION-INTEGRATION-FIXES.md`. It contains the three reproductions, allowed files, preservation boundaries, checks and acceptance criteria. No additional feature implementation is needed for this follow-up.
