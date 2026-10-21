# NextStep End-to-End QA Findings & Defect Ledger

- **QA Date**: 2026-10-21
- **Branch**: `codex/adaptive-practice`
- **Severity Guidelines**:
  - **P1**: Data loss, false verified results, isolation/security issue, blocked core workflow, unsafe retries.
  - **P2**: Broken secondary behavior, inaccessible controls, misleading state, significant mobile usability failure.
  - **P3**: Minor visual/copy issue or non-blocking polish item.

---

## Defect Summary Table

| Defect ID | Severity | Stage Found | Feature / Target | Brief Description | Status | Retest Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QA-001** | P2 | Stage 2 | `apiFixture.renameGoal` | `apiFixture` missing `renameGoal` method, causing goal inline rename in synthetic preview to crash with `TypeError: apiService.renameGoal is not a function` | REPAIRED | PASSED (`07-goal-rename.png`) |
| **QA-002** | P2 | Stage 7 | `ReviewView.jsx` layout | "Practise what needs work (10–30 min)" header button had `shrink-0` causing 11px horizontal overflow on 320px narrow screens | REPAIRED | PASSED (`01-responsive-320-narrow.png`) |

---

## Detailed Defect Records

### QA-001: Missing `renameGoal` implementation on `apiFixture`

- **Severity**: P2
- **Area**: Synthetic Preview / Fixture Parity (`client/src/fixtures/apiFixture.js`)
- **Reproduction**:
  1. Start synthetic preview via `npm.cmd --prefix client run preview:synthetic -- --strictPort`.
  2. Log in as an active student (e.g. `student.active@nextstep.local`).
  3. Click "Name my goal" button on the Today dashboard.
  4. Enter a revised goal name and click "Save goal name".
  5. The UI failed to update and displayed an error notice because `apiService.renameGoal` was undefined.
- **Root Cause Diagnosis**:
  While `server/src/routes/goal.js` implements `PATCH /api/goal` with optimistic locking and validation, and `client/src/services/apiService.js` delegates to `liveApi.renameGoal`, the synthetic mock fixture `apiFixture` in `client/src/fixtures/apiFixture.js` had no `renameGoal` method defined.
- **Repair**:
  Implemented `renameGoal({ goalName, expectedVersion })` on `apiFixture` with validation (1-80 chars non-empty), 404 for missing goal, 409 `VERSION_CONFLICT` when `expectedVersion !== goal.version`, version bumping (`version + 1`), persistent safeStorage update, and `deriveGoalStats` return.
- **Verification Evidence**:
  Executed `qa-stage2-onboarding-navigation.cjs` Test 7. Goal name saved, version bumped, header updated to "Google SDE Preparation (Sprint 2026)", and evidence captured at `07-goal-rename.png`.

---

### QA-002: Responsive Horizontal Overflow at 320px on Review Queue View

- **Severity**: P2
- **Area**: Responsive Usability & Mobile Layout (`client/src/components/workspace/ReviewView.jsx`)
- **Reproduction**:
  1. Set viewport to 320px width (`320x568`).
  2. Log in as `student.completed@nextstep.local` and navigate to `http://127.0.0.1:5173/dashboard?view=review`.
  3. Observe that `document.documentElement.scrollWidth` equals 331px, exceeding `window.innerWidth` (320px) by 11px, creating horizontal scrolling and broken card alignment.
- **Root Cause Diagnosis**:
  In `client/src/components/workspace/ReviewView.jsx`, the header action button (`secondary-button`) was configured with `shrink-0` and fixed horizontal padding containing the 38-character label `"Practise what needs work (10–30 min)"`. At 320px screen width with container margins, the element forced the parent container past 320px.
- **Repair**:
  Removed `shrink-0` from the button, added `w-full sm:w-auto max-w-full text-center`, and wrapped the text in a `<span className="truncate">` wrapper so it scales and truncates smoothly when space is constricted.
- **Verification Evidence**:
  Executed `qa-stage7-failure-responsive.cjs` across all 7 views on 320px narrow viewport. All 7 views evaluated to `scrollWidth === 320` (`overflow === false`). Evidence captured at `client/.local/full-local-qa/2026-10-21T11-48-00Z/stage7/01-responsive-320-narrow.png`.
