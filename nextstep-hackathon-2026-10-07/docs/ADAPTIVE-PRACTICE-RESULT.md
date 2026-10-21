# NextStep Adaptive Practice Implementation Report

- **Branch**: `codex/adaptive-practice` (uncommitted, unpushed)
- **Starting Commit**: `6453358455cb21ac3806afa9f21870ea6beb3e65`
- **Started At (UTC)**: `2026-10-20T18:19:04Z`
- **Completed At (UTC)**: `2026-10-20T19:16:30Z`
- **Total Elapsed Time**: ~57 minutes (well within the 6-hour budget)
- **Target URL**: `http://127.0.0.1:5173` (preview active for morning inspection)

---

## 1. Executive Summary

This milestone transforms NextStep from a static sequential roadmap into an **adaptive practice companion** that identifies why a student struggled, targets what needs work in bounded 10-, 20-, or 30-minute sessions, exposes authentic topic evidence without fabricated mastery percentages, and feeds due reviews and targeted revisits directly into weekly planning.

All requirements from `docs/ANTIGRAVITY-ADAPTIVE-PRACTICE-OVERNIGHT.md` have been implemented sequentially across Stages 0 through 5. Every regression suite, unit suite, production build, and browser integration check passes with exit code 0.

---

## 2. Implemented Capabilities by Stage

### Stage 0: Preserve and Prepare
- Created and checked out working branch `codex/adaptive-practice`.
- Initialized the progress tracking ledger at `docs/ADAPTIVE-PRACTICE-PROGRESS.md`.
- Verified clean initial state: server tests (135/135 pass), client tests (123/123 pass), clean production build, and curriculum validation passed.
- Kept local Vite dev preview operational on `http://127.0.0.1:5173`.

### Stage 1: Explainable Reinforcement & Content Index
- **Pure Derivation Functions (`client/src/services/workspace.js`)**:
  - `buildCurriculumSearchIndex(catalog)`: Pure, memoized inverted index indexing published topics, lessons, exercises, and practice problems by topic titles, lesson titles, keywords, algorithmic patterns (e.g. `sliding_window`, `monotonic_stack`, `kahn`), and boundary conditions.
  - `deriveAdaptiveReinforcement(goal, catalog, now)`: Deterministic derivation combining:
    1. **Check-in signals**:
       - `needs_example` on a lesson with an attached exercise links to the worked example trace; on an exercise-free lesson, links to its own conceptual explanation.
       - `unsure` self-reports surface respectful, targeted practice check-ins.
       - Focus selections (`invariant` -> formal loop invariants; `update_order` -> step-by-step trace order; `edge_cases` -> alternate boundary variant).
    2. **Authoritative difficulty**: Measured wrong choices and hints from `exerciseAttempts`.
    3. **Due recall**: Evaluated `nextReviewDate <= today` from recall intervals.
  - **Resolution Mechanics**:
    - Newer evaluated independent success strictly resolves older self-reported uncertainty.
    - Self-reporting alone cannot erase an evaluated difficulty or overdue recall.
    - Unknown or unexpected check-in/focus values are safely ignored without throwing.
    - External practice problems are explicitly tagged with `isSelfReported: true`.
    - End-of-library curriculum completion recommends deliberate foundational revision with zero fabricated lessons.
- **Unit Suite**: Created `client/src/fixtures/adaptiveReinforcement.test.js` (16 tests, 100% pass).

### Stage 2: Short Guided Practice Session ("Practise what needs work")
- **Bounded Persistence Schema (`server/src/schemas/goalSchemas.js`)**:
  - `practiceSessionTaskSchema`: Strict task validation (`taskId`, `activityType`, `targetId`, `lessonId`, `exerciseId`, `problemId`, `variantKey`, `title`, `topicId`, `topicTitle`, `estimatedMinutes`, `reason`, `evidenceType`, `section`, `status`).
  - `practiceSessionStartSchema`: Session start validation (`expectedVersion`, `sessionId`, `timeBudgetMinutes`, `title`, `reason`, `tasks`).
  - `practiceSessionUpdateSchema`: Session task progress and finalization validation (`expectedVersion`, `sessionId`, `status`, `completedTaskId`, `summary`).
- **Server Endpoints (`server/src/routes/goal.js`)**:
  - `POST /api/goal/workspace/practice-session/start`: Validates CAS version, initializes `activePracticeSession`, limits history to 5 items, and stores state in `goal.studyWorkspace`.
  - `POST /api/goal/workspace/practice-session/update`: Idempotently updates task status (`completed`, `skipped`), requires genuine attempt evidence for verification, and caps history at 5 items upon session finalization.
- **Client & Fixture Parity**:
  - Added endpoints to `client/src/lib/api.js`, `client/src/services/apiService.js`, and `client/src/fixtures/apiFixture.js`.
  - Implemented `derivePracticeSessionProposal(goal, catalog, { timeBudgetMinutes, excludedActivityIds })` in `client/src/services/workspace.js`:
    - Strict budget fitting: 10m (1 task), 20m (1-2 tasks), 30m (up to 3 tasks).
    - Preserves excluded activity IDs and supports regeneration.
- **User Interface Components**:
  - `client/src/components/workspace/PracticeSessionProposalModal.jsx`: Budget picker (10m / 20m / 30m), plain-language justification, task list with individual exclusion controls, regeneration button, accessible dialog attributes, keyboard trapping, and Escape handling.
  - `client/src/components/workspace/PracticeSessionModal.jsx`: Focused practice runner showing current task, progress counter, integrated activity launcher, and authentic completion summary separating:
    - *Viewed lessons*
    - *Verified traces (independent vs supported)*
    - *Hinted attempts*
    - *Self-reported external practice*
- **Unit Suites**: Added 8 server tests in `server/tests/practiceSessionRoutes.test.js` and 5 client tests in `client/src/fixtures/practiceSession.test.js`.

### Stage 3: Topic Evidence Cards & Continuation Planner
- **Compact Topic Evidence in Learning Path / Atlas (`client/src/services/workspace.js`)**:
  - Enriched `deriveTopicAtlasModel` with:
    - `completedLessonsCount` / `totalLessonsCount`
    - `distinctTracesVerifiedCount`, `independentTracesCount`, `supportedTracesCount`, `hasTraces`
    - `externalPracticeCount`, `isPracticeSelfReported: true`
    - `dueReviewCount`, `dueReviews`
    - `unresolvedSignalCount`, `unresolvedReinforcements`
    - Plain-language descriptive states: `not_started`, `learning`, `practise_again`, `recent_evidence`. Never shows a fabricated mastery percentage or false 0% capability for unattempted interactive traces.
    - `actionableTarget`: Direct deep link to the exact next activity.
- **Presentation in `AtlasView.jsx`**:
  - Compact structured evidence pill grid on each topic card.
  - Expandable "Show why" drawer revealing exact reasons, check-in signals, and due reviews.
  - Actionable direct buttons pointing to specific lessons or exercises.
  - Top header action: "Plan my next week" button wired to `ContinuationPlanModal`.
- **Continuation Planner Integration**:
  - Enhanced `deriveCandidateActivities` in `workspace.js` to seed unresolved reinforcement signals and due reviews as revisits into weekly planning, without auto-applying or mutating the 12/12 starter track.
- **Unit Suite**: Created `client/src/fixtures/topicEvidence.test.js` (6 tests, 100% pass).

### Stage 4: Integration, Resilience & Quality
- **Dashboard & Entry Placement**:
  - Integrated practice launcher banner into `TodayView.jsx` ("Practise what needs work") alongside the single dominant hero card.
  - Integrated practice session launcher into `ReviewView.jsx` alongside the due recall queue and starter notes.
  - Code-split and lazy-loaded both modals in `DashboardPage.jsx` (`PracticeSessionProposalModal`, `PracticeSessionModal`).
- **Visual Design & Semantic Tokens**:
  - Refactored all modals, cards, and buttons to use the existing semantic design token system (`ui-bg-surface`, `ui-border-border`, `ui-text-ink`, `ui-text-muted`, `ui-text-accent`, `primary-button`, `secondary-button`).
  - Verified visual integrity across all 3 themes: *Frosted Sage* (default), *Midnight Ink*, and *Calm Slate*.
- **Responsive Layout & Accessibility**:
  - Verified seamless layout across 1440px desktop, 1024px tablet, 390px mobile, and 320px narrow mobile. Zero horizontal scrolling or clipped buttons.
  - Respected `prefers-reduced-motion` with disabled/subtle transitions.
  - Accessible dialog roles, `aria-modal`, `aria-labelledby`, focus trapping, body scroll locks, and Escape focus restoration.
  - Zero external runtime dependencies added.

### Stage 5: Verification & Delivery
- Created end-to-end Playwright browser suite: `client/scripts/verify-adaptive-practice.cjs` covering all 7 critical scenarios.
- Integrated adaptive practice suite into the official local release gate script `scripts/verify-continuation-release.ps1`.
- Executed the full automated release gate with 100% pass across all 15 checks.

---

## 3. Inventory of Modified and Created Files

### Created Files
| File | Purpose |
|---|---|
| `client/scripts/verify-adaptive-practice.cjs` | 7-scenario Playwright browser verification suite for adaptive practice, topic evidence, responsive layouts, and themes |
| `client/src/components/workspace/PracticeSessionModal.jsx` | Focused practice session runner with real-time task progression and authentic separated summary |
| `client/src/components/workspace/PracticeSessionProposalModal.jsx` | 10/20/30m practice proposal modal with task exclusion and regeneration |
| `client/src/fixtures/adaptiveReinforcement.test.js` | 16 unit tests for deterministic reinforcement signals, check-ins, resolution, and search indexing |
| `client/src/fixtures/practiceSession.test.js` | 5 unit tests for time budget derivation, task caps, and fixture lifecycle |
| `client/src/fixtures/topicEvidence.test.js` | 6 unit tests for topic evidence counts, descriptive states, and continuation planner seeding |
| `docs/ADAPTIVE-PRACTICE-PROGRESS.md` | Implementation tracking ledger maintaining state across resets |
| `docs/ADAPTIVE-PRACTICE-RESULT.md` | Comprehensive final implementation report, test evidence, and owner walkthrough |
| `server/tests/practiceSessionRoutes.test.js` | 8 server API tests for practice session validation, CAS versioning, and history capping |

### Modified Files
| File | Changes Made |
|---|---|
| `client/src/components/workspace/AtlasView.jsx` | Added compact topic evidence cards, descriptive state badges, "Show why" expandable drawers, direct activity actions, and "Plan my next week" continuation launcher |
| `client/src/components/workspace/ReviewView.jsx` | Added "Practise what needs work" launcher button in header alongside due recall queue |
| `client/src/components/workspace/TodayView.jsx` | Added "Practise what needs work" targeted practice card below dominant hero activity |
| `client/src/components/workspace/ContinuationPlanModal.jsx` | Synchronized candidate badges with review and reinforcement types |
| `client/src/fixtures/apiFixture.js` | Added synthetic client persistence for start/update practice session endpoints |
| `client/src/lib/api.js` | Exported `startPracticeSession` and `updatePracticeSession` API client functions |
| `client/src/pages/DashboardPage.jsx` | Lazy-loaded practice modals and wired session state handlers |
| `client/src/services/apiService.js` | Added service methods with offline and fixture fallbacks for practice sessions |
| `client/src/services/workspace.js` | Implemented `buildCurriculumSearchIndex`, `deriveAdaptiveReinforcement`, `derivePracticeSessionProposal`, and enriched `deriveTopicAtlasModel` and `deriveCandidateActivities` |
| `scripts/verify-continuation-release.ps1` | Integrated `verify-adaptive-practice.cjs` into the local release gate pipeline |
| `server/src/routes/goal.js` | Added `/api/goal/workspace/practice-session/start` and `/update` endpoints; seeded reviews into continuation preview |
| `server/src/schemas/goalSchemas.js` | Added Zod schemas for practice session tasks, start payloads, and update payloads |
| `server/src/services/scheduler.js` | Cleaned up scheduler utilities to preserve deterministic candidate ordering |

---

## 4. Bounded Persistence Contracts

All new practice data is stored in the existing `studyWorkspace` JSONB field on the `goals` table with optimistic locking (`expectedVersion`). No SQL migrations or database alterations were introduced.

```typescript
interface GoalStudyWorkspace {
  // Existing fields
  lessonProgress: Record<string, LessonProgress>;
  exerciseAttempts: Record<string, ExerciseAttempt[]>;
  practiceAttempts: Record<string, PracticeAttempt[]>;
  continuation: ContinuationState;

  // Adaptive Practice extensions (bounded)
  activePracticeSession: null | {
    sessionId: string;
    startedAt: string; // ISO 8601
    timeBudgetMinutes: 10 | 20 | 30;
    title: string;
    reason: string;
    tasks: Array<{
      taskId: string;
      activityType: 'lesson' | 'exercise' | 'practice';
      targetId: string;
      lessonId: string;
      exerciseId?: string;
      problemId?: string;
      variantKey?: string;
      title: string;
      topicId: string;
      topicTitle: string;
      estimatedMinutes: number;
      reason: string;
      evidenceType: string;
      section?: string;
      status: 'pending' | 'completed' | 'skipped';
      completedAt?: string;
    }>;
    status: 'in_progress' | 'completed' | 'abandoned';
  };

  // Capped at maximum 5 items (FIFO eviction)
  practiceSessionHistory: Array<{
    sessionId: string;
    completedAt: string;
    timeBudgetMinutes: number;
    tasksCompletedCount: number;
    totalTasksCount: number;
    summary: {
      viewedCount: number;
      verifiedCount: number;
      hintedCount: number;
      selfReportedCount: number;
    };
  }>;
}
```

---

## 5. Verification Test Evidence

All checks executed on Windows shell with Node v24.21.0 against loopback preview `http://127.0.0.1:5173`.

```
======================================================================
NEXTSTEP LOCAL CONTINUATION RELEASE GATE VERIFICATION RESULTS
======================================================================
1.  Server Regressions (Node Test Runner)       : PASS (143/143 tests passed, exit 0)
2.  Client Regressions (Node Test Runner)       : PASS (150/150 tests passed, exit 0)
3.  Curriculum Dataset Validation               : PASS (12 topics, 48 lessons, 18 exercises, 120 problems, exit 0)
4.  Production Build (Vite v5.4.21)             : PASS (1640 modules, 14.63s, exit 0)
5.  Weekly Execution & Replanning               : PASS (6/6 scenarios passed, exit 0)
6.  Continuation Failure-Path Integration       : PASS (5/5 scenarios passed, exit 0)
7.  Completed Starter to Accepted Continuation  : PASS (Exit 0)
8.  Atlas & Proof Regressions                   : PASS (9/9 scenarios passed, exit 0)
9.  Quick Check-ins and Time Sliders            : PASS (4/4 scenarios passed, exit 0)
10. First-Time Student Learning Journey         : PASS (6/6 scenarios passed, exit 0)
11. Loading Performance & Code-Splitting        : PASS (6/6 scenarios passed, exit 0)
12. State Isolation & Audit                     : PASS (10/10 scenarios passed, exit 0)
13. Starter Workspace Regressions               : PASS (14/14 scenarios passed, exit 0)
14. First-Use Usability Milestone               : PASS (8/8 scenarios passed, exit 0)
15. Adaptive Practice & Topic Evidence          : PASS (7/7 scenarios passed, exit 0)
16. Whitespace Validation (git diff --check)    : PASS (0 trailing whitespace issues, exit 0)
----------------------------------------------------------------------
OVERALL RESULT: CONTINUATION LOCAL RELEASE GATE: PASS (Exit code 0)
======================================================================
```

---

## 6. Screenshot Inventory

Visual evidence automatically captured during the Playwright verification runs and saved in `client/.local/adaptive-practice-evidence/2026-10-20T19-14-59-972Z/`:

| File | Resolution | Description |
|---|---|---|
| `01-today-practice-entry-desktop.png` | 1440x900 | Today dashboard showing single dominant activity card alongside "Practise what needs work" launcher |
| `02-practice-proposal-modal.png` | 1440x900 | 20-minute practice session proposal modal showing 2 targeted tasks, reasons, and task exclusion controls |
| `03-practice-runner-active.png` | 1440x900 | Active practice runner modal showing task 1 of 2, timer budget, task badge, and deep link to Proof Studio |
| `04-practice-summary-authentic.png` | 1440x900 | Completion summary authentically distinguishing viewed lessons, verified traces, and self-reported practice |
| `05-atlas-topic-evidence-cards.png` | 1440x900 | Topic Atlas / Learning path displaying compact evidence pills and descriptive status badges |
| `06-atlas-topic-show-why.png` | 1440x900 | Topic card with "Show why" drawer expanded revealing check-in difficulty and actionable practice link |
| `07-continuation-next-week-preview.png` | 1440x900 | "Plan my next week" continuation planner seeded with due reviews and targeted revisits |
| `08-review-practice-launcher.png` | 1440x900 | Review view with due recall queue and integrated "Practise what needs work" action |
| `09-tablet-1024-today.png` | 1024x768 | Tablet layout showing clean responsive wrapping without horizontal overflow |
| `10-mobile-390-today.png` | 390x844 | Mobile 390px view with sticky primary bottom navigation and stacked practice cards |
| `11-mobile-320-proposal.png` | 320x640 | Narrow mobile 320px viewport demonstrating modal responsiveness and zero horizontal scroll |
| `12-theme-midnight-ink.png` | 1440x900 | Midnight Ink theme token verification showing correct high-contrast background and accents |
| `13-theme-calm-slate.png` | 1440x900 | Calm Slate theme token verification showing clean cool-slate surfaces |
| `14-completed-starter-today.png` | 1440x900 | Completed starter student (`student.completed@nextstep.local`) isolating Foundations Checkpoint |

---

## 7. Five-Minute Owner Walkthrough

When reviewing NextStep on the active preview (`http://127.0.0.1:5173`):

1. **Sign in as Active Student (`student.active@nextstep.local`)**:
   - Navigate to **Today** (`http://127.0.0.1:5173/dashboard?view=today`).
   - Notice the single dominant hero card at the top ("Continue learning").
   - Below it, observe the new **Targeted Practice** banner: *"Practise what needs work"*.
2. **Launch a Practice Session**:
   - Click **Practise what needs work**.
   - The proposal dialog opens with 10m, 20m, and 30m time buttons. Toggle between 10m (1 task) and 20m (2 tasks). Notice how tasks explain *why* they were selected (e.g. *"Check-in indicated struggle with loop invariant"* or *"Due for spaced recall"*).
   - Click **Start Practice Session**.
   - The practice runner opens with step 1 of 2. Click **Start Task** to navigate directly to the exercise in Proof Studio.
   - Return to the modal and click **Finish Session** to observe the **Authentic Summary** (viewed lessons, verified traces, and self-reported practice are strictly separated).
3. **Inspect Topic Evidence in Learning Path**:
   - Switch to **Learning path** (Atlas) from the navigation bar.
   - Look at the topic cards (e.g. *Arrays & Hashing*, *Binary Search*).
   - Notice the descriptive status badge (*Learning*, *Practise again*, or *Recent evidence*) and the concrete evidence counts (e.g. `2/4 lessons · 1 solo trace · 1 review due`).
   - Click **Show why** on any topic with pending reviews or check-in struggle to view the expanded evidence drawer.
4. **Plan Next Week**:
   - In the Atlas header, click **Plan my next week**.
   - The continuation planner modal opens with candidate activities already seeded with the student's due reviews and targeted revisits.
5. **Inspect Review View**:
   - Switch to **Review** (`http://127.0.0.1:5173/dashboard?view=review`).
   - Notice the practice launcher button in the review header, allowing the student to start a targeted practice sprint directly from their review queue.
6. **Verify Account Isolation**:
   - Sign out and sign in as `student.completed@nextstep.local`.
   - On Today, the student is presented with the Foundations Checkpoint ("Check My Foundations") without any fabricated next lesson or automatic practice override.

---

## 8. Preservation & Clean Working State

- **Branch**: `codex/adaptive-practice` remains checked out.
- **Git State**: All changes are left uncommitted and unpushed per specification instructions.
- **Preview Server**: Running and healthy at `http://127.0.0.1:5173`.
- **Database / Schema**: Zero database migrations or new tables created.
- **Dependencies**: Zero new npm packages added.
