# Adaptive practice: independent review

## Final focused verification — 2026-10-21

Status: reproduced repair findings CLOSED. Independently reran the original follow-up probes: stale wrong-variant attempt now returns 422 UNVERIFIED_ATTEMPT; altered same-ID notes now return 409 UPDATE_CONFLICT. Current permanent route suite passed 20/20; focused client session suite passed 7/7; whitespace check passed. Source confirms both live and fixture lookup only within freshAttempts and use canonical replay comparison. Previous focused browser verification passed 8/8 before this last server/fixture-only correction.

The implementer reports full server 155/155, client 152/152, build and all 15 release groups passing. These broader checks were not independently rerun during final focused verification. No additional repair scope requested. Real user acceptance, complete publication review and authenticated deployed behavior remain separate steps. Changes remain uncommitted/unpushed; review closure does not authorize publication.

## Repair verification follow-up — 2026-10-21

Independently reran the repaired route suite: 18/18 passed. Updated adaptive browser suite: 8/8 passed, including real trace evaluation/save and exact alternate-target navigation. These establish progress on the original findings; broader reported release counts were not independently rerun in this follow-up.

Two original integrity requirements still fail independent real-route probes:

1. **Old, wrong-variant evidence accepted by explicit attempt ID (P1).** In the update route, lookup first searches freshAttempts but falls back to `exAttempts.find(...)`. That fallback bypasses both freshness and variant matching. Seed a primary independent attempt dated 2020, start an alternate boundary retry today, then complete with the old attemptId: HTTP 200 and summary verifiedCount = 1. Fix by resolving only within valid fresh, matching-variant evidence; an explicit invalid ID must reject, never fall back to an unfiltered history. Test old same-variant, old wrong-variant and fresh wrong-variant IDs, plus valid fresh ID. Preserve the stable same-time evidence policy.
2. **Altered same-ID retry accepted (P2).** Receipt identity compares status, optional index and task ID but omits notes, attempt ID and remaining meaningful payload. Repeating an updateId after changing completedTask.notes from Original to Altered returned HTTP 200. Store/compare a canonical normalized request digest covering all meaningful fields for active and finalized receipts, with clear omitted/default semantics. Identical lost-response retry must still return success without version bump; altered payload must return UPDATE_CONFLICT. Test notes and attempt ID changes, not just status changes, and keep fixture parity.

Evidence: ignored server/.local/adaptive-repair-independent.test.mjs, built from current route-suite setup plus independent synthetic scenarios. Output: STALE_WRONG_VARIANT_PROBE {http:200,verified:1}; ALTERED_REPLAY_PROBE {http:200}. No production data accessed or changed.

Scope: repair these two existing paths only, add permanent regressions, run targeted route/client/browser checks and build, then the release gate before declaring ready. No redesign or new features. Application source was not edited during this review.

Date: 2026-10-21. Status: NOT READY FOR PUBLICATION. Useful implementation exists, but the report's all-requirements-complete claim is not supported by failure-path behavior.

## What was checked

Read the actual new routes/schemas, normalizer, client adapter/fixtures, runner/proposal components, Dashboard navigation and browser harness. Independently executed server/client regressions (client 150 passed), adaptive browser suite (7/7 passed), real Express route probes with isolated mock Supabase rows, and a synthetic navigation probe. No production accounts/records changed. Review probes are ignored files under server/.local/adaptive-independent.test.mjs and client/.local/usability-audit/.

## R1 — P1: server evidence is client-controlled

In goal.js update route, authoritativeEvidence starts from completedTask.evidenceType. Only the trace/boundary branch with requested value verified inspects evidence. A worked_example submitted as verified gets recorded verified without an attempt. A trace submitted as hinted is accepted and finalized despite zero attempts. Probe outputs: fakeVerifiedExample HTTP 200 with evidenceType verified and attemptId null; unsolvedTraceSummary HTTP 200 with hintedCount 1. Requested verified with no fresh trace is downgraded to self_reported but still marks the trace completed, contrary to the required evaluated retry.

Repair: derive allowed result types from actual activity and persisted authoritative evidence. Reading an example remains explicitly viewed/self-report. Trace/boundary completion requires the correct fresh graded exercise attempt and variant; validate any supplied attempt ID, bind to task baseline and resolve equal timestamps by stable evidence IDs/version. Wrong/no evidence must leave the task pending. Lesson checks must use the existing evaluation flow instead of treating any selected option as success. External logs remain self-reported and must not count as trace verification. Never accept verified/hinted labels from the client as proof. Finalizing completed must require the appropriate completed tasks; abandonment must remain distinct.

## R2 — P1: unsafe retries and lifecycle replacement

updateId is parsed but unused. Repeating an identical committed update after a lost response returns 409 VERSION_CONFLICT. Client generates new session/update IDs inside each click handler, so a retry does not retain the original request identity. Start idempotency compares only selected fields, and fixture equality is weaker still. Finalization returns any history match even for an altered status; finalized start IDs are not protected against resurrection.

Probe: start a session, record task 1, resend identical update with same updateId and original expectedVersion -> 409. Start another session using latest version -> HTTP 200 replaces the active session without abandonment/history retention.

Repair: use canonical request payloads and bounded replay receipts for active/finalized sessions. Identical retries return original logical success without version bump; altered same-ID requests conflict. Preserve IDs across ambiguous client failures. Enforce one active session; explicit abandon/replace is required. Reject unknown task IDs and invalid transitions. Fixture and live behavior must match. Add a visible non-destructive version-refresh/retry path preserving local choices.

## R3 — P1: launcher opens the wrong lesson; runner bypasses actual learning

Dashboard handleOpenProofLesson expects one object, but session onOpenProofStudio calls it positionally. A synthetic boundary task targeting les_binary_search_01/ex_binary_search_01 opened les_arrays_01. variantKey/section are also not propagated. Runner offers Mark Trace Completed & Continue without evaluating or saving the trace. Its knowledge check just selects opt.feedback; no evaluation call is made. Existing browser scenario 2 clicks that completion button rather than proving a fresh trace save and return.

Repair the signature and carry exact topic/lesson/exercise/variant/mode/section. Reuse Proof's real evaluation and save flow. On return, derive/record session task progress from the fresh authoritative save instead of a generic completion toggle. Add regression: different previously selected lesson, alternate-input boundary task, actual trace save, return/resume, reload, summary evidence. No fabricated independent completion.

## R4 — P1: server does not enforce proposal validity

Start checks whether individual lesson/exercise/problem IDs exist, but not their relationships, activity type requirements, topic membership, variant existence, prerequisites, task ID uniqueness or sum of effort. A 10-minute request containing the existing 8-minute example plus 10-minute trace was accepted with HTTP 200 and 18 allocated minutes. Client-only fitting is insufficient for persisted integrity.

Repair: validate canonical target relationships against the published registry, reject inconsistent/duplicate/locked tasks, validate required target types/variants, and enforce bounded task count and total effort <= selected budget on the server. Do not trust client labels/titles as authoritative catalog metadata. Handle permissible studied revisits explicitly rather than loosening prerequisite checks for everything. Match fixtures and cover malformed/adversarial inputs.

## R5 — P2: missing contract and overstated verification

contracts/API-V1.md has no practice-session routes/state extension, despite contract-first requirement. Eight server tests omit forged evidence, variants, update idempotency, active-session overwrite and task/budget relationships. Browser tests check that summary labels exist, not that their values derive from real saves. The report lists ContinuationPlanModal.jsx as modified although it is absent from git diff. Theme names in the report should be verified against actual theme identifiers.

Update contracts with exact request/response/error/state limits and retry semantics before implementation. Replace overbroad completion claims with executed evidence. Add durable regressions for R1-R4 and lost-response/conflict paths, retaining all existing checks. Keep logs/screenshot fixtures separate from production acceptance. History must stay bounded at five compact summaries and replay state must also have explicit bounds.

## Bounded repair instruction

Fix R1-R5 as one session-integrity milestone: contract/lifecycle first, UI integration second, focused failure-path tests and full release gate last. Do not add features or redesign the dashboard. Preserve every existing dirty file and original learner history. No dependencies, environment edits, migrations, curriculum changes, commit, push or deployment. Reuse current branch. Produce docs/ADAPTIVE-PRACTICE-REPAIR-RESULT.md with actual commands, outcomes and remaining limitations. Release readiness requires fresh evidence, not matching expected test counts.
