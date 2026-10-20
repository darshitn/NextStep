# Quick check-ins and sliders: independent review

Reviewed locally on 2026-10-19. This document supplements the implementation report; reported results there were not treated as independent evidence.

## Bounded corrections made during review

1. **Variant isolation:** Proof's saved check-in fallback now resolves the latest attempt for the selected input variant. Written trace drafts also use the exercise-and-variant key. A primary attempt no longer preselects answers in an untouched alternate variant.
2. **Clearing saved choices:** Deselecting both lesson check-in choices sends explicit `null`. The real route and synthetic fixture distinguish omission (preserve) from null (clear). Retry metadata preserves this distinction, so exact retries do not bump the version and changing an omitted field to null under the same request ID returns a conflict.
3. **Keyboard access:** Choice cards now have one tab stop per radio group and support Arrow, Home and End keys. The optional written reflection has an accessible name.
4. **Regression evidence:** Browser checks cover saved primary-to-alternate isolation, radio keyboard behavior, and save/deselect/reload. Route and fixture tests cover omission, clearing, exact retry, and changed-content conflict.

The original objective step/edge grading remains in place. Self-report answers do not establish correctness or upgrade assisted outcomes. No curriculum content, dependencies, database schema, production records or environment settings were changed during this review.

## Verification

`scripts/verify-continuation-release.ps1` passed all 11 groups with exit code 0:

- Server: **135/135**; client: **101/101**.
- Production client build passed.
- Week 6/6, continuation integration 5/5, continuation 9/9, Atlas/Proof 9/9, check-ins/sliders 4/4, state isolation 10/10, starter workspace 14/14.
- Whitespace check passed.

Local log: `client/.local/checkins-independent-release.log`.

Screenshot inspection found that the original harness captured Week under some Proof filenames and did not scroll the modal to the sliders. The harness now explicitly navigates to Proof for each width, opens the mobile lesson picker, captures the check-in component, scrolls to the slider controls, and checks modal picker widths across all six appearances. It also fails on uncaught page errors. This final test-only change was verified by rerunning the check-ins/sliders harness: **4/4 passed**, zero uncaught page errors. Its label now describes layout checks accurately; this harness does not independently measure text contrast. Existing Atlas/Proof and workspace gates include computed contrast checks.

Corrected 390px slider and check-in screenshots were visually inspected. Evidence: `client/.local/checkins-sliders-evidence/`. All browser checks use isolated synthetic accounts on loopback; live Supabase persistence and deployed assets were not tested in this review.

## Two-minute owner check

Owner-requested button recheck (2026-10-19): added explicit browser assertions that Save Proof Attempt remains disabled after self-report choices at 0/3 and before boundary verification, then enables, saves and survives reload after the actual trace is verified. Fresh runs passed: check-ins/sliders 4/4, Week 6/6, workspace 14/14. No new application defect was found in these flows. Logs: `client/.local/button-check.log`, `button-week-check.log`, and `button-workspace-check.log`.

Open the labelled synthetic preview at `http://127.0.0.1:5173`. In Week, open the plan dialog, adjust a slider using Arrow/Home/End keys and try the weekday presets; cancel without applying. In Proof, select a confidence card using arrow keys, switch primary/alternate input and confirm selections remain separate. In an exercise-free lesson, save a choice, deselect it, save again and reload; it should remain cleared.

## Publication boundary

All implementation and review corrections remain uncommitted on `codex/quick-checkins-time-sliders`. No push, merge or deployment was performed.
