# NextStep First-Time Student Learning Journey: Progress & Architecture Plan

Date: 2026-10-19
Branch: `codex/quick-checkins-time-sliders` (uncommitted working tree preserved)
Status: Complete · Stages 0, 1, 2, 3 Implemented & Release Gate Verified PASS

---

## 1. Baseline Inspection & Journey Trace

### 1.1 Existing Student Journey
1. **Today (`TodayView.jsx`)**:
   - Renders the active Starter Track mission (`MissionCard`) in the primary left column.
   - For brand-new students with no curriculum history, the only pointer to the Curriculum Path (Atlas & Proof) is a secondary card in the right-hand context rail (`workspaceRecommendation`).
   - The distinction between the 12-mission Starter Track (study habits and foundational reasoning) and the formal Curriculum Path (invariants, worked traces, and practice problems) is not prominently explained to a first-time student.
2. **Topic Atlas (`TopicAtlasView.jsx`)**:
   - Outlines 12 topics, lessons, exercises, and practice counts.
   - Deep-links directly into Proof Studio via `onOpenProofLesson({ topicId, lessonId, exerciseId })`.
3. **Proof Studio (`ProofStudio.jsx`)**:
   - Three tab modes: `trace` (step-by-step prediction), `learn` (concept mechanics & worked examples), and `reflect` (history and notes).
   - Trace flow: `currentStepIdx`, choice selection, server evaluation (`evaluateTraceStep`), boundary evaluation (`evaluateEdgeCheck`), optional `ReflectionCheckIn`, and `Save Proof Attempt`.
   - Disabled save currently shows: `Complete all N trace steps (X/N verified) ... to enable saving.` but lacks granular remaining requirement counts (e.g. "Verify 2 more trace steps and the boundary check") and lacks an actionable jump-to-unanswered-requirement button.
   - Exercise-free lessons (e.g. `les_arrays_03`, `les_arrays_04`): Have no attached exercise; display a static note pointing to Learn, but lack a clear contextual learning loop guide.
   - Save confirmation: Prints `Proof attempt saved (independent) · Next review: ...` without explicitly distinguishing an exercise attempt save from a lesson completion, and without surfacing a concrete next action button.

### 1.2 Observations vs Assumptions
- **Observation (Codebase Fact)**: `deriveExplainableRecommendation(goal, catalog)` in `client/src/services/workspace.js` already returns the first unlocked lesson with zero unmet prerequisites (e.g. `les_arrays_01`, title "Array Layout & Contiguity Invariant", estimated 20m, reason "Recommended starting point in Arrays & Memory Allocation with zero unmet prerequisites.") when a student has 0 recorded progress.
- **Observation (Codebase Fact)**: `goal.studyWorkspace` stores `lessonProgress`, `exerciseAttempts`, and `practiceAttempts`. A student who has not yet recorded any curriculum activity has empty/null entries across all three collections.
- **Observation (Codebase Fact)**: Established students can have incomplete starter tracks while actively learning in the curriculum. The first-session invitation must not trigger for established students purely because starter missions are < 12.
- **Assumption to Reject**: "We need a separate onboarding modal or guided multi-step tutorial." -> Rejected: The prompt explicitly mandates *no mandatory tour, no blocking welcome modal, and no fabricated progress*.
- **Assumption to Reject**: "We need a second recommendation engine or curriculum catalog." -> Rejected: The prompt requires reusing existing recommendation, navigation, and eligibility helpers.

---

## 2. Shared Helpers & Architecture Reuse Plan

| Capability | Existing Shared Helper | Location | Reuse Plan |
| :--- | :--- | :--- | :--- |
| **Recommendation** | `deriveExplainableRecommendation(goal, catalog)` | `client/src/services/workspace.js` | Reuse directly in Today without duplicate sorting or heuristics. |
| **Activity Detection** | `hasRecordedCurriculumActivity(goal)` | New shared utility in `workspace.js` | Checks `lessonProgress`, `exerciseAttempts`, `practiceAttempts`, `continuation.checkpoint`. |
| **Navigation** | `onOpenProofLesson({ topicId, lessonId, exerciseId })` | `TodayView.jsx`, `DashboardPage.jsx` | Invoked directly from the prominent "Start your first lesson" action. |
| **Trace Evaluation** | `onEvaluateTraceStep`, `onEvaluateEdgeCheck` | `ProofStudio.jsx`, `apiService.js` | Preserved unchanged; server-authoritative evaluation. |
| **Save Eligibility** | `canSaveExercise` | `ProofStudio.jsx` | Strict: `allStepsCompleted && edgePassed && submittingExerciseId !== activeExerciseId`. Check-in selections never grant eligibility. |
| **Check-ins & Notes** | `ReflectionCheckIn.jsx` | `client/src/components/workspace/` | Preserved optional self-report choices and written takeaways. |

---

## 3. Implementation Stages

### Stage 1: A Clear Starting Point on Today
- Implement `hasRecordedCurriculumActivity(goal)` in `workspace.js`.
- If `!hasRecordedCurriculumActivity(goal)`, render a prominent First-Session Invitation card at the top of `today-main` in `TodayView.jsx`:
  - Concrete headline: “Start your first lesson”
  - Recommended lesson title and estimated minutes from catalog.
  - Suitability rationale from `workspaceRecommendation.reason`.
  - Educational explanation distinguishing the 12-mission Starter Track (study habits) and the formal Curriculum Path (invariants & proof traces).
  - Primary button: “Start your first lesson” (navigates to Proof Studio with recommended topic, lesson, and exercise).
  - Secondary links: “Explore Topic Atlas”, “Practice Library”.
  - Honest empty/error state when catalog or recommendation is unavailable.
  - Keep Starter Track mission card immediately available below.

### Stage 2: Guide the Existing Proof Learning Loop
- Create a compact, contextual learning loop progress guide at the top of `ProofStudio.jsx`:
  - Traced lessons: **Understand** (concept mechanics in Learn) → **Predict** (N of M trace steps verified) → **Check** (boundary condition verified) → **Save** (record proof attempt).
  - Exercise-free lessons: **Understand** (concept & worked examples in Learn) → **Check** (invariant knowledge check MCQ) → **Save** (lesson reflection & completion).
- Enhance disabled `Save Proof Attempt`:
  - Show exact remaining counts: e.g. "Verify 2 more trace steps and the boundary check to enable saving." or "Verify the boundary check to enable saving."
  - Provide a clearly labelled jump button: e.g. "Go to Step X" or "Jump to boundary check" that smoothly scrolls and focuses the first unanswered item without stealing focus on background saves.
  - Respect `prefers-reduced-motion`.
  - Preserve strict server-authoritative grading; self-reported check-ins never enable save.

### Stage 3: Make Successful Progress Obvious
- After a successful trace attempt save:
  - Truthful confirmation banner: confirm only what the server recorded (outcome, next review date).
  - Clear distinction: state that the *trace attempt* is saved, while the lesson remains in progress until marked complete.
  - Actionable next action button:
    1. If lesson incomplete: "Complete Lesson Invariant Check" (scrolls to knowledge check).
    2. If linked practice exists: "Try linked practice: [Title]".
    3. If next unlocked lesson exists: "Next lesson: [Title]".
- Keep retryable errors visible on save failure; preserve local inputs, check-ins, and draft reflections.
- No automatic page navigation or unexpected focus changes.

---

## 4. Acceptance Criteria Checklist

- [x] **AC 1**: A synthetic new student can reach the first eligible lesson from Today with one primary action.
- [x] **AC 2**: An established student retains their current recommendation and progress without seeing the first-session invitation.
- [x] **AC 3**: The learning loop guide accurately adapts to both traced lessons and exercise-free lessons.
- [x] **AC 4**: Save remains disabled at 0/3 verified trace steps, even when check-ins are selected.
- [x] **AC 5**: The remaining-requirements jump action smoothly reaches the correct unanswered requirement.
- [x] **AC 6**: Save enables only after existing objective requirements pass (all steps + boundary check).
- [x] **AC 7**: A successful save displays truthful confirmation and a valid next action.
- [x] **AC 8**: Save failure preserves local work and supports retry.
- [x] **AC 9**: Lesson/topic/variant switching does not leak guidance or answer state.
- [x] **AC 10**: Guidance fits 1440, 1024, 390, and 320px viewports, works by keyboard, and respects reduced motion.
- [x] **AC 11**: Existing starter, continuation, Week, and review behavior remains intact.

---

## 5. Current Status

- Stage 0: **COMPLETE** (baseline inspected, dependencies checked, progress document created).
- Stage 1: **COMPLETE** (Today first-session invitation implemented with track separation and primary action).
- Stage 2: **COMPLETE** (Learning loop guide Understand → Predict → Check → Save, jump buttons, and remaining counts implemented).
- Stage 3: **COMPLETE** (Truthful save confirmation, lesson completion distinction, and contextual next actions implemented).
- Verification: **COMPLETE** (135 server tests, 106 client tests, client build, and all 11 release gate suites passed with zero errors).
