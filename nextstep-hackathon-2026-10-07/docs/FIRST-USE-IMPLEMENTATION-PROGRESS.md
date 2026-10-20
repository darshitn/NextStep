# First-Use Usability Implementation Progress

Branch: `codex/quick-checkins-time-sliders`
Date: 2026-10-20
Status: COMPLETED (Verified via local release gate and Playwright first-use suite)

## Milestone Checklist

### Stage 1: One Obvious Starting Point & Navigation Hierarchy
- [x] Today Primary Action Precedence:
  - [x] 1. Explicit resumable activity (starter resumeContext or curriculum draft/in-progress)
  - [x] 2. Pending active weekly plan session
  - [x] 3. Deterministic explainable recommendation (starter or curriculum)
- [x] Today UI Refactor:
  - [x] Single dominant hero card ("Start today's activity" / "Continue learning")
  - [x] Activity title, estimated time, plain-language reason, dominant action button
  - [x] Secondary "Choose another activity" / alternative route
  - [x] Deduplicate recommendations (no duplicate cards in rail + hero)
  - [x] Move detailed schedule stats, history, focus timer below the main action
  - [x] Truthful handling for all account states: new student, in-progress starter, completed 12/12 starter, active weekly plan, completed weekly plan, all curriculum completed, catalog unavailable
- [x] Navigation Restructuring:
  - [x] Visible label updates: Atlas -> Learning path, Proof -> Learn & practise, Week -> My week, Roadmap -> Starter track, Insights -> Progress
  - [x] Desktop grouping: Study group (Today, Learn & practise, My week, Learning path, Practice, Review) vs Track group (Starter track, Progress)
  - [x] Mobile primary navigation: Today / Learn / My week / More
  - [x] Preserve all route IDs (`nav-*`, `mobile-nav-*`, `menu-nav-*`), data-view attributes, and deep links
  - [x] My week: distinguish "no curriculum plan yet" from "no scheduled work" with route to starter work
- [x] Atlas Stage Header Fix:
  - [x] Fix fallback stage labels: avoid "Stage 5 · Stage 5"; display neutral "Stage 5"

### Stage 2: Optional Interactive Getting-Started Guide
- [x] Dismissible first-use invitation ("Want a quick walkthrough?" -> Start / Not now)
- [x] Persistent "Getting started" / "Help" replay trigger
- [x] Three task-based chapters: Start learning, Plan my week, Understand my progress
- [x] "Start learning" chapter (5 steps max):
  - [x] Step 1: Identify recommended Today activity (`[data-guide="today-activity-card"]`)
  - [x] Step 2: Open real lesson (`[data-guide="today-primary-action-btn"]`)
  - [x] Step 3: Explain example and where to try (`[data-guide="proof-learn-tab"]`)
  - [x] Step 4: Explain answer selection and feedback (`[data-guide="proof-try-container"]`)
  - [x] Step 5: Explain saving and next action (`[data-guide="proof-save-section"]`)
- [x] Non-mutating behavior: observing only, zero automated answers/completions/schedules
- [x] Keyboard accessibility, Escape handling, visible focus, aria attributes
- [x] Accessible target interaction (no inert trap on target elements; non-blocking SVG spotlight)
- [x] Account-scoped, versioned preference storage with graceful fallback

### Stage 3: Clear Lesson Progression & Unambiguous Finish
- [x] Reuse existing learning strip: Learn -> Try -> Check -> Finish
- [x] New lessons begin with "Learn" by default; preserve resume/direct modes
- [x] Compact topic/lesson selector behind clear secondary toggle on mobile
- [x] Unambiguous finish: clearly explain "Trace saved" vs "Lesson completed"
- [x] Truthful post-save states: remaining requirements, next eligible action
- [x] Retain all grading integrity, CAS versioning, retries, and drafts

### Stage 4: Verification, Responsive Audit & Documentation
- [x] Server tests pass (135/135)
- [x] Client unit tests pass (123/123, including TA01–TA07 and G01–G05)
- [x] Client production build clean (0 errors, 0 warnings, 15.64s)
- [x] Comprehensive Playwright browser verification suite for first-use usability (`verify-first-use.cjs` - 8/8 passed)
- [x] Multi-viewport audit (1440x900, 1024x768, 390x844, 320x568) across all 6 appearance styles/themes
- [x] Full release gate (`verify-continuation-release.ps1` - all 14 gates passed)
- [x] Independent review follow-up repairs verified (`review-guide-repair.cjs` passed with 0 delta and 1 dialog)
- [x] Final documentation in `docs/FIRST-USE-IMPLEMENTATION-RESULT.md`
- [x] Handoff entry appended to `handoffs/DARSHIT.md`
