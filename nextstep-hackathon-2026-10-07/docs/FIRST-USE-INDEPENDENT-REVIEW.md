# First-use milestone: focused independent review

## Final focused verification — 2026-10-20

Review status: CLOSED for the reproduced walkthrough findings. Independently reran the updated first-use browser suite: 8/8 passed, including spotlight alignment after scrolling and completed-starter checkpoint branching without an overlapping lesson guide. Inspected source confirming scroll/resize listeners are attached and positional transitions removed. Git diff --check passed. No additional repair scope is requested.

The implementer reports 123/123 client tests, a successful production build and all 14 release groups passing; those broader checks were not independently rerun in this final focused verification. Real novice usability, authenticated production behavior and deployment of this milestone remain separate acceptance steps. Changes remain uncommitted; this review does not authorize publication.

## Repair verification follow-up — 2026-10-20

Independently reran verify-first-use.cjs: 7/7 passed, including repaired normal-path anchors, replay and focus assertions. Preference fallback is now present in source. Full release gate was not independently rerun.

Two remaining reproduced defects, confined to the existing guide:

1. **Spotlight loses its target on scroll.** InteractiveGuide's target effect returns immediately when `foundImmediately` is true, before attaching resize/scroll listeners. On mobile step 2, scrolling 150px left the spotlight exactly 150px away from its button. Always install and clean up geometry listeners, even when the target is immediately available. Check actual target/callout geometry after scroll and viewport resize; avoid scroll handlers that continually fight intentional user scrolling.
2. **Completed-starter recommendation opens an incompatible flow.** On student.completed, step 2 clicks Check My Foundations, opens that modal, and advances to step 3's Proof instructions. Browser result: missing target true, Proof not visible, two dialogs. Resolve guide behavior from the real activity type. A minimal acceptable repair is to explain that this recommendation opens the foundations checkpoint and end/close the guide before opening that modal. Do not continue lesson-only steps over checkpoint/planner/starter flows. No new checkpoint tour is required.

Evidence: ignored client/.local/usability-audit/review-guide-repair.cjs. Both cases reproduced in isolated synthetic accounts at 390x844 with reduced motion.

Repair only these cases, add targeted assertions, and rerun first-use tests/client tests/build. Preserve current feature scope. These findings do not invalidate the passing normal new-student journey.

2026-10-20. Status: core changes present; interactive guide needs a bounded repair before release.

## Verification performed

Read the actual source diff, guide service/component, Dashboard integration and first-use browser harness. Ran an independent isolated Edge browser against the labelled synthetic preview with student.firsttime. No production data accessed or changed. The independent probe is under ignored client/.local/usability-audit/review-guide.cjs.

This review did not rerun the full release gate. Reported 135 server / 121 client tests and 13 release groups remain implementer-reported for this review.

## Required repairs

### R1 — Guide cannot reach its main teaching steps

guideService.js targets `proof-try-container` and `proof-save-section`, but neither anchor exists in the rendered source. Independent browser reproduction reached steps 4 and 5 and both displayed "Step target is not on this screen." Clicking Next from step 2 also navigates directly to Proof rather than observing opening the actual recommended lesson.

Fix the complete guided journey with real anchors and appropriate mode transitions. Observe the actual recommended activity selection rather than substituting a generic view transition. Support exercise-free lessons and non-lesson recommendations with truthful branching or a clearly labelled separate lesson walkthrough. A step must not describe a hidden control as usable.

Wait for asynchronous content robustly; same-view retry must actually rescan. The current 1.5-second poll stops and its fallback can call onSelectView with the already-active view, leaving no state change to restart discovery.

Users may skip or finish a guide without learning completion; never gate actual product use on guide completion.

### R2 — Replay and focus restoration are broken

Browser reproduction: open guide, advance to step 2, press Escape, replay. Focus did not return to the trigger; replay started at step 2.

Dashboard's guideTriggerRef is created and passed into the guide but never attached to a trigger. Guide step/chapter state persists while closed, with no reset on a fresh replay or initialChapter change.

Capture the actual launching element, restore it when still available, and use a sensible visible fallback after navigation. Reset step/chapter for explicit replay. Ensure opening/advancing announces useful context to keyboard/screen-reader users while leaving highlighted controls operable.

### R3 — Acceptance coverage must exercise behavior, not presence alone

FU05 stops after step 2 and asserts only that the dialog closed/reopened. It does not assert restored focus, reset step, actual lesson selection, or successful anchors for later steps.

Add focused regression coverage for R1/R2:
- Traverse the complete chapter via actual UI interactions.
- Assert visible targets in every supported step and no missing-target fallback on the normal path.
- Verify step reset, correct chapter, and exact restored focus.
- Delayed lazy content and retry while remaining on the same view.
- Mobile target/callout non-overlap.
- Guide navigation itself causes no learning/schedule saves.

The claimed in-memory preference fallback also is not implemented: save catches storage errors and discards the value; load returns defaults. Add a small account-scoped in-memory fallback and test storage-denied save/load, or explicitly report this requirement incomplete. Validate persisted preference shape so malformed local storage cannot break completion.

## Completion boundary

Repair these guide issues without reopening the dashboard redesign or adding features. Run targeted regressions, client tests and build, then the existing release gate after integration. Add the new first-use suite to the release gate if it is still separate. Report actual results and limitations. Preserve existing dirty work; no commit, push or deployment in this repair.
