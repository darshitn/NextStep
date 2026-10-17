# Persistent Recall Reviews — Milestone Verification Report

**Project**: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`  
**Execution Context**: Local implementation milestone (Gemini 3.8 Flash Medium)  
**Date**: 2026-10-16  
**Status**: Completed and Locally Verified (Not Deployed to Production)

---

## 1. Executive Summary

This milestone delivers the persistent recall reviews feature defined in `docs/PERSISTENT-REVIEW-HANDOFF.md`:
1. **Saved Recall Attempts**: Students can write and save their memory retrieval attempts before revealing earlier recorded reflections.
2. **Self-Rated Confidence**: Interactive 1–5 confidence rating selector with explicit intervals (+1, +2, +3, +7, +14 days).
3. **Calculated Review Due Dates**: Server-authoritative due dates computed in the `Asia/Kolkata` calendar.
4. **Duplicate-Safe Idempotency**: Reusing an `attemptId` with identical payload safely returns 200 without CAS version increments or duplicate history; reusing an `attemptId` with altered content returns a strict 409 conflict.
5. **Review History Retention**: Latest 20 recall attempts are preserved chronologically per mission in the versioned goal state (`state.learning[missionId].recallHistory`).
6. **Smart Queue Scheduling & Blocker Retention**: Due reviews appear in the review queue; future due reviews suppress repeated age/hint suggestions, but *never* hide an active, unresolved blocker.
7. **Notes Library & Search Integration**: Recall attempts are accessible for review even when no longer due, and are fully searchable via keyword search.
8. **Export Safety**: Sanitized JSON goal export includes bounded review history and due dates, with zero token, credential, or session leakage.

> [!IMPORTANT]
> **Production Isolation & Data Safety**:
> - Preexisting uncommitted release evidence in `docs/ANTIGRAVITY-RELEASE-RESULT.md` was preserved verbatim.
> - No database schema migrations or table modifications were performed (additive JSON fields within existing RLS-scoped `state`).
> - No dependencies or lockfiles were changed.
> - No remote Git commits, pushes, or deployments (Vercel/Render) were executed.
> - The live 12/12 student account was never touched; all automated browser and client tests executed against isolated synthetic local fixtures.

---

## 2. Architecture & Data Flow

### 2.1 State Storage Model
Recall history is stored as an additive array in the owner-scoped versioned goal state:
```json
{
  "state": {
    "learning": {
      "m01": {
        "recallHistory": [
          {
            "attemptId": "a1111111-1111-4111-8111-111111111111",
            "attemptText": "Retrieved two pointers approach from memory. Time complexity O(N).",
            "confidence": 4,
            "savedAt": "2026-10-16T10:30:00.000Z",
            "nextReviewDate": "2026-10-23"
          }
        ]
      }
    }
  }
}
```

### 2.2 API Contract (`POST /api/goal/learning/recall`)
- **Request Body**:
  ```json
  {
    "expectedVersion": 2,
    "missionId": "m01",
    "attemptId": "a1111111-1111-4111-8111-111111111111",
    "attemptText": "Two pointers from memory...",
    "confidence": 4
  }
  ```
- **Validation Rules**:
  - `expectedVersion`: positive integer
  - `missionId`: string matching an eligible mission (must be either `nextMissionId` or already in `completions`). Unknown mission returns `404 MISSION_NOT_FOUND`. Future unstarted mission returns `422 MISSION_NOT_ELIGIBLE`.
  - `attemptId`: valid RFC 4122 UUID
  - `attemptText`: trimmed string, 1 to 2000 characters; whitespace-only rejected with `422 VALIDATION_ERROR`
  - `confidence`: integer between 1 and 5 (heuristic intervals: 1 -> +1d, 2 -> +2d, 3 -> +3d, 4 -> +7d, 5 -> +14d)

### 2.3 Idempotency & Concurrency Lifecycle
1. **Duplicate Retry**: If `attemptId` exists in `recallHistory` with identical normalized `attemptText` and `confidence`, the server immediately returns `200 OK` with the current goal and existing attempt, even if `expectedVersion` is stale.
2. **Payload Conflict**: If `attemptId` matches an existing attempt with *different* text or confidence, the server rejects the request with `409 ATTEMPT_CONFLICT`.
3. **Optimistic Version Lock**: If `attemptId` is new and `expectedVersion !== row.version`, the server returns `409 VERSION_CONFLICT`.
4. **CAS Race Recovery**: If the database CAS update affects 0 rows, the server re-reads once. If the attempt was already saved by a concurrent identical request, it returns `200 OK`; otherwise, it returns `409 VERSION_CONFLICT`.
5. **History Cap**: Retains the latest 20 chronological attempts per mission (`[...existingHistory, newAttempt].slice(-20)`).

### 2.4 Queue Derivation Rules (`deriveReviewItems`)
- **Due Date Scheduling**: When `nextReviewDate <= todayIST`, the item enters the queue with high priority (`type: 'recall_due'`).
- **Hint/Age Suppression**: When `nextReviewDate > todayIST`, repeated 3+ day recall and hint suggestions for that completed mission are suppressed.
- **Blocker Safety**: If a mission has an active, unresolved blocker (`selfReportedStatus !== 'ready_to_continue'`), it is **never** suppressed by a future recall date.
- **Dismissal Semantics**: Explicitly dismissed notes remain removed from the active queue while preserved in the Notes library.

---

## 3. Files Modified and Added

| File | Status | Description of Changes |
| :--- | :---: | :--- |
| `contracts/API-V1.md` | Modified | Documented `POST /api/goal/learning/recall` endpoint, schemas, intervals, and duplicate-safe idempotency rules. |
| `server/src/schemas/goalSchemas.js` | Modified | Added `recallAttemptSchema`, `CONFIDENCE_INTERVALS` mapping, and `calculateNextReviewDate` helper. |
| `server/src/routes/goal.js` | Modified | Implemented `POST /api/goal/learning/recall` with eligibility check, duplicate retry, CAS version lock, re-read race recovery, and 20-cap history slice. |
| `server/tests/persistentReview.test.js` | **Added** | 10 unit and integration tests covering persistence, eligibility, validation boundaries, idempotency, payload conflicts, history cap, and IST timezone date math. |
| `client/src/lib/api.js` | Modified | Added `saveRecallAttempt(payload)` to `liveApi` adapter. |
| `client/src/services/apiService.js` | Modified | Added `saveRecallAttempt(payload)` wrapper with standardized `handleApiError`. |
| `client/src/fixtures/apiFixture.js` | Modified | Added matching synthetic implementation of `saveRecallAttempt` with duplicate retry, 20-cap, and conflict handling. |
| `client/src/services/workspace.js` | Modified | Updated `deriveReviewItems` (recall due scheduling, hint/age suppression, unresolved blocker retention), priority scoring, `deriveNotesLibrary`, and `filterNotesLibrary` (search matching across recall attempts). |
| `client/src/components/workspace/RecallPanel.jsx` | Modified | Added confidence selector (1–5), "Save review" action, duplicate-safe UUID generation, inline retry/conflict handling, save feedback, and 20-attempt history timeline. |
| `client/src/components/workspace/ReviewView.jsx` | Modified | Wired `onSaveRecallAttempt`, isolated draft/confidence state across missions, added due date badges to queue cards, and added direct recall entry point in Notes library. |
| `client/src/pages/DashboardPage.jsx` | Modified | Connected `handleSaveRecallAttempt` to `apiService.saveRecallAttempt` and updated canonical goal state on save. |
| `client/src/workspace.css` | Modified | Added small-screen padding rules for `.recall-panel` and notes articles to prevent horizontal overflow down to 320px. |
| `client/src/fixtures/persistentReview.test.js` | **Added** | 7 client tests covering due vs. future scheduling, blocker retention, legacy goal compatibility, notes keyword search, export safety, and fixture parity. |
| `client/scripts/verify-workspace.cjs` | Modified | Added browser test step testing recall writing, confidence rating, review saving, reload persistence, queue updates, and notes reopening. |
| `docs/PERSISTENT-REVIEW-RESULT.md` | **Added** | Milestone verification report. |

---

## 4. Verification Evidence & Test Execution

### 4.1 Server Test Suite (`npm test`)
- **Command**: `npm.cmd test` in `nextstep-hackathon-2026-10-07/server`
- **Output**:
  ```
  ✔ goal creation accepts browser UUID format and rejects legacy req_ IDs (44.3642ms)
  ✔ Gemini Guidance Service & Route Test Suite (322.4354ms)
  ✔ DSA Learning Loop — Blocker Persistence & Curated Understanding Checks (322.334ms)
  ▶ Persistent Recall Reviews — Backend Route, Idempotency & IST Date Math
    ✔ POST /api/goal/learning/recall - persists recall on completed mission with calculated IST due date (125.784ms)
    ✔ POST /api/goal/learning/recall - persists recall on current incomplete mission (nextMissionId) (12.4385ms)
    ✔ POST /api/goal/learning/recall - rejects future incomplete mission with 422 (7.3507ms)
    ✔ POST /api/goal/learning/recall - rejects unknown mission ID with 404 (6.7574ms)
    ✔ POST /api/goal/learning/recall - validates confidence boundaries (1 to 5) and trimmed text (30.6147ms)
    ✔ POST /api/goal/learning/recall - duplicate retry with identical payload returns 200 without version increment (8.0219ms)
    ✔ POST /api/goal/learning/recall - reused attemptId with different payload returns 409 ATTEMPT_CONFLICT (7.4809ms)
    ✔ POST /api/goal/learning/recall - version conflict on new attemptId returns 409 VERSION_CONFLICT (5.1517ms)
    ✔ POST /api/goal/learning/recall - caps history retention at 20 latest entries (85.728ms)
    ✔ calculateNextReviewDate - computes IST date correctly across UTC/IST midnight (1.8262ms)
  ✔ Persistent Recall Reviews — Backend Route, Idempotency & IST Date Math (302.0297ms)
  ✔ NextStep API & Integration Test Suite (291.8276ms)
  ℹ tests 58
  ℹ suites 4
  ℹ pass 58
  ℹ fail 0
  ```
- **Result**: **58 passed, 0 failed** (baseline: 48 passed -> 10 new tests added).

### 4.2 Client Test Suite (`npm test`)
- **Command**: `npm.cmd test` in `nextstep-hackathon-2026-10-07/client`
- **Output**:
  ```
  ✔ PR01: Due recall review is scheduled into review queue when nextReviewDate <= today (29.5361ms)
  ✔ PR02: Future recall date suppresses old hint/age suggestions (1.0195ms)
  ✔ PR03: Future recall date NEVER hides an unresolved blocker (0.8113ms)
  ✔ PR04: Legacy goals without recallHistory preserve backwards compatibility (1.5428ms)
  ✔ PR05: Notes library exposes recall attempts to search (0.7802ms)
  ✔ PR06: Goal export includes bounded review history without credentials (0.5377ms)
  ✔ PR07: Synthetic apiFixture saveRecallAttempt matches live duplicate-safe contract (225.8587ms)
  ...
  ℹ tests 65
  ℹ suites 0
  ℹ pass 65
  ℹ fail 0
  ```
- **Result**: **65 passed, 0 failed** (baseline: 58 passed -> 7 new tests added).

### 4.3 Client Production Build (`npm run build`)
- **Command**: `npm.cmd run build` in `nextstep-hackathon-2026-10-07/client`
- **Output**:
  ```
  vite v5.4.21 building for production...
  transforming...
  ✓ 1624 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   1.64 kB │ gzip:  0.85 kB
  dist/assets/index-DhoO4aSG.css   60.88 kB │ gzip: 11.98 kB
  dist/assets/index-BrmVivMN.js   354.04 kB │ gzip: 98.60 kB
  ✓ built in 39.23s
  ```
- **Result**: Clean build with zero warnings or errors.

### 4.4 Git Diff Whitespace & Hygiene Check
- **Command**: `git diff --check` in repository root
- **Result**: Exit code 0 (all trailing whitespace and EOF blank lines resolved).

### 4.5 Synthetic Browser Regression Harness (`verify-workspace.cjs`)
- **Command**: `node scripts/verify-workspace.cjs "D:/Projects/Deadline-Catcher/node_modules/playwright" http://127.0.0.1:5187`
- **Harness Results**:
  ```
  PASS Today renders current mission and saved progress
  PASS Focus timer pauses, resumes, survives view changes and never completes a mission
  PASS Roadmap search, filters, no-result recovery, and URL refresh
  PASS Practice draft survives workspace view switches
  PASS Review and Insights render real empty/recorded states
  PASS Saved blocker survives reload and appears in Review
  PASS Completion records hint outcome and reflection without losing earlier progress
  PASS Goal JSON export contains current progress and excludes session credentials
  PASS Notes search and recall reveal work without altering completion
  PASS Dismissing a review suggestion retains the saved notes
  PASS Recovery previews and applies a revised week while preserving completion
  PASS Persistent review saves attempt, rates confidence, calculates due date, and survives reload
  PASS All workspace views fit desktop/mobile with computed text contrast across six themes
  PASS No nested buttons or browser console errors
  Evidence: D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07\client\.local\workspace-evidence\2026-10-16T11-02-40-318Z
  ```
- **Result**: **14 out of 14 passed, 0 failures, 0 page errors, 0 failed local requests**.
- **Responsive & Contrast Validation**:
  - Viewports tested: `1440px`, `390px`, `320px`
  - Themes tested: `frosted-sage`, `study-journal`, `quiet-focus` in both `light` and `dark` modes (6 combinations)
  - Horizontal overflow: `false` across all views and viewports
  - Contrast ratios verified: WCAG AA compliant on all active elements.

---

## 5. Technical Disclosures & Product Heuristics

1. **Review Scheduling Heuristic**:
   Review intervals (1, 2, 3, 7, 14 days) are starter scheduling suggestions based on student self-rated confidence (1–5). They are explicitly labelled in the UI as product heuristics, not a validated cognitive/spaced repetition algorithm.
2. **History Boundary**:
   Up to 20 chronological recall attempts per mission are retained. Excess attempts are pruned oldest-first on the server.
3. **No Unintended Side Effects**:
   - Saving a recall review does not increment mission completions, award XP, or alter focus timer session times.
   - Confidence self-ratings are never described as formal mastery metrics.
4. **Deployment Status**:
   This milestone was developed and verified entirely in the local environment. It has **NOT** been deployed to Vercel or Render, and remote Git has not been modified.
