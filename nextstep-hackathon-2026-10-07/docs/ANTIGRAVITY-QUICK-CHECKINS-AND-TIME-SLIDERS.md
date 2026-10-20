# NextStep: quick multiple-choice check-ins and time sliders

## Goal and scope

Make Proof's reflective interaction quicker and replace the four availability buttons per day with tactile, theme-matched sliders inspired by the owner's Windows brightness/volume reference. Implement this as one bounded feature milestone, not another dashboard redesign or content-bank expansion.

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`. Git root is its parent. Read AGENTS.md, START-HERE.md, current contracts and the Week/continuation release result before editing. Inspect the actual branch/diff/remote first. Preserve all existing work. Use one writer and a new `codex/quick-checkins-time-sliders` branch from the compatible released baseline. Do not reset, discard, stash, force-push or overwrite unrelated changes. Don't edit curriculum content, reference models, actual environment files, credentials, dependencies or database schema. No production student data for tests. No commit, push, merge or deployment in this implementation run.

The owner requests an implementation, not another planning response. Finish the scoped changes, run the acceptance gate, inspect screenshots and provide one reviewable result. Continue routine reversible work without repeated permission questions. Report genuine denied operations rather than bypassing controls. Use the owner's selected model; no silent model switching.

## Ground truth from the current code

- `ProofStudio.jsx` has free-text exercise and lesson reflections, including the exercise-free lesson variant. Those strings are already optional. `canSaveExercise` requires completed trace steps and passed edge check, not reflection text. The UX makes the writing look like another assignment; do not add a new compulsory gate while fixing it.
- There is already a server-graded lesson knowledge-check MCQ and authoritative trace step/edge evaluation. Keep these. A self-reported confidence selection cannot replace algorithmic grading or prove independent work.
- `AvailabilityPicker.jsx` is shared by `GoalForm.jsx`, `RecoveryComparison.jsx` and `ContinuationPlanModal.jsx`. Its contract is a seven-day object with only 0/30/60/90 minute values and `onChange(updatedValue)`, plus disabled support.
- Lesson and exercise records currently persist an optional `reflection` string with a 500-character limit. Do not stuff fabricated prose or serialized JSON into that field to simulate structured persistence.

## Stage 1 — slider availability control

Replace the per-day 0/30/60/90 button grid inside the shared picker with a native accessible range input, styled as a modern slider. Use the screenshots for interaction inspiration, not the Windows shell's colors, symbols or layout.

Each day card/row must have:
- Day name and a clear current-value badge: `Rest` or `60 min`.
- A generous clickable track, visible circular thumb and filled accent segment. Use existing semantic theme variables, including surface, accent, border, muted and focus colors; no fixed green palette or copied translucent Windows panel.
- Four visible tick labels: Rest/0, 30, 60, 90. The underlying input is exactly min=0, max=90, step=30; do not allow continuous values or expand backend scheduling limits.
- Full accessible label such as “Monday study time” and aria-valuetext such as “Rest day” or “60 minutes”. Native Arrow, Home and End controls must work. Touch and keyboard focus must be obvious; avoid a custom drag engine or an animation library.
- Smooth short visual transitions, respecting reduced motion. Do not animate the real value independently of state. Slider movement updates the badge and total immediately.

Use a balanced responsive card grid on wide layouts and readable full-width tracks where needed on mobile. Fit actual modal width, not only viewport width. Keep sufficient thumb/hit area; at 320px no clipped thumb, tick, label or horizontal page overflow.

Show weekly total as hours/minutes. Remove the misleading generic “N missions” equivalence from this shared picker, since curriculum work has variable duration. 0 remains a supported rest day; all-zero availability retains the existing validation and does not silently generate or apply a schedule.

Add at most two optional, explicit presets: “Weekdays · 30 min/day” and “Weekdays · 60 min/day” with weekends at 0. If implemented, they only change the editable draft, obey disabled state and invalidate any current plan preview. Do not add auto-planning, time-of-day booking or a second availability source.

Ensure onboarding, starter recovery, continuation planning and Week replanning all use this same control. Existing preview/accept boundaries, CAS, review flags and 12/12 starter history must remain intact.

## Stage 2 — multiple-choice reflection check-ins

In Proof's exercise reflection and lesson reflection areas, make two compact, optional single-choice questions the primary interaction:

1. “How did this feel?”
   - Ready to apply it
   - I need another example
   - I'm still unsure
2. “What needs another look?”
   - The invariant / tracked state
   - Pointer or update order
   - Boundary / edge cases
   - No particular blocker

These are self-reported check-ins, not scored questions. Use concise themed selectable cards/radios with a clear selected state, keyboard interaction and no automatic default selection. Keep a small optional note behind an “Add a note” disclosure. Existing saved prose must remain visible/editable; do not replace or erase it when users select an option. Preserve stable textarea IDs for accessibility and adapt tests to open the optional-note disclosure explicitly.

Keep the actual lesson invariant MCQ and trace/edge questions authoritative and unchanged. Do not manufacture 66 new technical questions, re-label these check-ins as concept mastery, call any option correct, auto-complete work, upgrade independent outcomes or hide hint/reference assistance. Avoid asking the same graded lesson MCQ twice.

Persist choices as a bounded additive optional `checkIn` object under lesson progress / exercise attempt records, for example:
`{ version: 1, confidence: 'ready'|'needs_example'|'unsure', focus: 'invariant'|'update_order'|'edge_cases'|'none' }`.
Unanswered choices are omitted. `reflection` remains the original optional text string. Document the exact affected request/response/state contract BEFORE dependent implementation. Reuse existing routes and owner-scoped JSON state; no new table, migration or endpoint is needed.

Inspect and update schemas, route persistence/idempotency, client adapters, fixture parity, bounded normalization/export and relevant saved-record display. Reject unknown enum values/versions and extra object keys without mutating state. Identical retries must remain identical, and a changed check-in under a finalized request/attempt ID must not silently be treated as an identical retry. Do not rewrite unrelated endpoint semantics.

Draft choices and optional text must remain isolated by lesson and by exercise/variant. Switching items, alternate inputs or users must not leak selections. Explicit saves persist them; reload restores saved choices. Older records without checkIn still load normally. Lesson completion and trace submission retain their existing eligibility rules; no written summary or new check-in is mandatory.

Show saved choices as labelled self-reports in the relevant saved lesson/attempt summary and sanitized export. Do not generate fake notes, change review due dates or reschedule based solely on a confidence click in this milestone. Keep other free-text features (recall practice, personal notes, actual answers) outside this scope.

## Stage 3 — integrated acceptance, not just component snapshots

Add permanent meaningful tests covering:
1. Pointer/touch slider selection snaps to supported values and calls onChange with the correct day map. Keyboard Arrow/Home/End and aria-valuetext work.
2. The value badge and weekly total match exact state; 0/rest and all-zero validation are truthful. Disabled controls/presets cannot change state.
3. Onboarding, recovery and continuation/Week replanning use the sliders. Capacity edits after preview invalidate it; cancel changes nothing; explicit acceptance preserves starter history and review intent.
4. Check-in radios work without typing. Optional notes remain available and legacy notes are preserved.
5. Lesson/exercise/variant draft isolation, saved-choice reload and slow/error/retry preservation are tested through actual UI.
6. Server and fixture validation persist checkIn faithfully, reject malformed input and preserve retry/conflict behavior. Confidence cannot forge a successful trace or independent outcome.
7. Exercise-free lessons still work. Existing Learn/Trace/Reflect and lesson knowledge checks remain functional.
8. At 1440/1024/390/320 widths and six existing appearances, actually inspect both a Proof check-in and a slider inside a modal. Include keyboard and reduced motion. Check readable contrast and no overflow rather than merely screenshot existence.

Update old browser tests that located availability buttons to operate the real range control; keep their behavioral expectations. Do not leave legacy tests querying removed controls or weaken grading/history assertions.

Run the normal server/client suites, production build and `./scripts/verify-continuation-release.ps1` including Week and continuation failure-path suites. Add the new integrated scenarios to the release gate or extend the appropriate existing harness. Use the existing installed Playwright module, installed dependencies and labelled synthetic preview. The curriculum validator regenerates a fixture; don't invoke it unnecessarily when no curriculum content changed.

Acceptance is student-visible behavior plus state integrity. Non-blocking polish goes into a backlog; do not restart broad redesigns or add features to fill time. If a real blocker prevents completion, document the exact scenario and current state instead of claiming all verified.

Deliver `docs/QUICK-CHECKINS-SLIDERS-RESULT.md` with three-stage counts, files, actual commands/results, limitations and a short owner walkthrough. Append a concise handoff entry. Leave the preview running and state the actual local URL. All implementation remains uncommitted for independent review.
