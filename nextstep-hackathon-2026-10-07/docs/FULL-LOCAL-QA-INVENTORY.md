# NextStep Complete Feature Inventory & Verification Matrix

- **Audit Date**: 2026-10-21
- **Branch**: `codex/adaptive-practice`
- **Preview Target**: `http://127.0.0.1:5173`
- **Total Cataloged Items**: 92
- **Evidence status**: 68 REPORTED PASS; 8 PARTIAL; 15 VERIFIED; 1 PENDING. Reported pass means the implementer cited a check, not that this review independently proved the full row.

Evidence types are intentionally separated. This inventory is not an exhaustive end-to-end acceptance certificate. Open checks: every one of 48 lessons rendered individually; complete browser saves for all 18 traces and their alternate variants; remaining failure-injection cases; live Supabase/Gemini/production persistence; real novice usability.

---

## 1. Authentication & Session Shell

| ID | Feature / Component | Account State | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Login Page Form | Unauthenticated | Email and password inputs, submit button, "Fixture Mode" badge | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 1, `01-signin-validation-errors.png`) | Browser — implementer-reported, sampled |
| **AUTH-02** | Login Input Validation | Unauthenticated | Client validation rejects empty email or short password (<6 chars) | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 1, HTML5 validation check) | Browser — implementer-reported, sampled |
| **AUTH-03** | Fixture Account Quick Links | Unauthenticated | Quick-fill buttons for synthetic personas (`student.active`, `student.completed`, etc.) | **REPORTED PASS** | `qa-stage0-sanity.cjs` (`00-initial-load.png`, persona button check) | Browser — implementer-reported, sampled |
| **AUTH-04** | Invalid Credentials | Unauthenticated | Accessible error notice on unrecognized email/password | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 1, error alert display) | Browser — implementer-reported, sampled |
| **AUTH-05** | Successful Sign-In | Unauthenticated -> Authenticated | Session stored in storage; redirects to `/dashboard` or `/onboarding` | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 1, redirect to `/dashboard`) | Browser — implementer-reported, sampled |
| **AUTH-06** | Session Expiration Banner | Authenticated -> Expired | Banner announces expired session with "Sign In Again" action | **REPORTED PASS** | `client/src/fixtures/authSession.test.js` (Session expiry subscription suite) | Route/unit — implementer-reported |
| **AUTH-07** | Sign-Out Action | Authenticated | Clears state and storage, restores focus, redirects to `/login` | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 8, `08-logout-isolation.png`) | Browser — implementer-reported, sampled |
| **AUTH-08** | Multi-Account Isolation | Switch accounts | User B cannot view or mutate User A's goal, progress, or session state | **PARTIAL** | `qa-stage2-onboarding-navigation.cjs` (Test 8, unauthenticated redirect) | Logout browser check; broader isolation covered separately by route/session tests |
| **AUTH-09** | Theme / Appearance Controls | Any | Theme selector renders all 6 styles, applies semantic CSS tokens without contrast break | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 6, `06-appearance-themes.png`) | Browser — implementer-reported, sampled |

---

## 2. Onboarding & Goal Configuration

| ID | Feature / Component | Account State | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ONBD-01** | Goal Form Initiation | New account | Goal title input, target date picker, availability sliders | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, `02-onboarding-sliders.png`) | Browser — implementer-reported, sampled |
| **ONBD-02** | Target Date Constraints | New account | Enforces minimum date in the future; shows weeks/days calculation | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, date picker calculation) | Browser — implementer-reported, sampled |
| **ONBD-03** | Availability Sliders | New account | 7 weekday sliders snapping to 0, 30, 60, 90 mins; keyboard arrow operable | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, slider step & keyboard tests) | Browser — implementer-reported, sampled |
| **ONBD-04** | Availability Presets | New account | Weekdays · 30 min/day and Weekdays · 60 min/day presets update available minutes | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, preset selection & total hours) | Browser — implementer-reported, sampled |
| **ONBD-05** | All-Zero Validation | New account | Disables submission and alerts user if all 7 days have 0 hours | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, zero validation notice) | Browser — implementer-reported, sampled |
| **ONBD-06** | Goal Creation Submission | New account | Submits goal, generates deterministic starter schedule, transitions to Dashboard | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 2, dashboard transition) | Browser — implementer-reported, sampled |
| **ONBD-07** | Goal Rename | Existing goal | Allows inline renaming of goal, saves and updates UI | **VERIFIED** | verify-qa-repairs.cjs: save renamed goal and verify after reload | Independent browser |

---

## 3. Today View & Getting-Started Guide

| ID | Feature / Component | Account State | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TDY-01** | Dominant Hero Card | New student | Recommends first lesson (`les_arrays_01`) or starter mission (`m01`) | **REPORTED PASS** | `verify-first-use.cjs` (FU01, `01-dominant-hero-new-student.png`) | Browser — implementer-reported, sampled |
| **TDY-02** | Dominant Hero Card | Resumed lesson | Precedence 1: Explicit resumable in-progress activity | **REPORTED PASS** | `client/src/fixtures/todayAction.test.js` (TA02, explicit resumable test) | Route/unit — implementer-reported |
| **TDY-03** | Dominant Hero Card | Weekly plan pending | Precedence 2: Next pending allocation from accepted continuation plan | **REPORTED PASS** | `client/src/fixtures/todayAction.test.js` (TA04, pending weekly plan session) | Route/unit — implementer-reported |
| **TDY-04** | Dominant Hero Card | Completed Starter | Precedence: Recommends Foundations Checkpoint | **REPORTED PASS** | `verify-first-use.cjs` (FU02, `02-dominant-hero-starter-completed.png`) | Browser — implementer-reported, sampled |
| **TDY-05** | Dominant Hero Card | All Completed | Precedence: Deliberate review/revision without fabricated mastery | **REPORTED PASS** | `client/src/fixtures/todayAction.test.js` (TA06, full completion revision) | Route/unit — implementer-reported |
| **TDY-06** | Getting-Started Invitation | New student | Non-blocking banner with "Start walkthrough" and dismissible "Not now" | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 5, `05-interactive-guide-traversal.png`) | Browser — implementer-reported, sampled |
| **TDY-07** | Guide Step Traversal | Active guide | Steps 1–5: Observers actual elements; spotlight aligns on resize/scroll | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 5, steps 1–5 traversed) | Browser — implementer-reported, sampled |
| **TDY-08** | Guide Focus & Replay | Active guide | Escape restores focus to trigger; replay resets to Step 1 | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 5, replay & focus assertion) | Browser — implementer-reported, sampled |
| **TDY-09** | Guide Non-Lesson Branch | Completed starter | Explains Foundations Checkpoint and ends cleanly without overlapping lesson guide | **REPORTED PASS** | `verify-first-use.cjs` (FU05b, completed starter checkpoint guide branch) | Browser — implementer-reported, sampled |
| **TDY-10** | Focus Timer | Any | 15m / 25m / 30m presets; start/pause/resume/reset; session-only timer resets on reload | **REPORTED PASS** | `qa-stage3-starter-journey.cjs` (Test 2, `02-focus-timer.png`) | Browser — implementer-reported, sampled |
| **TDY-11** | Quick Check-in Banners | Active struggle | Displays explainable reinforcement alert with direct practice link | **REPORTED PASS** | `client/src/fixtures/adaptiveReinforcement.test.js` (AR16, check-in struggle banner) | Route/unit — implementer-reported |

---

## 4. Navigation & Layout

| ID | Feature / Component | Screen Size | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NAV-01** | Desktop Navigation | >=1024px | Study: Today, Learn & practise, My week, Learning path, Practice, Review. Track: Starter track, Progress | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 3, `03-desktop-navigation.png`) | Browser — implementer-reported, sampled |
| **NAV-02** | Mobile Primary Navigation | <768px | Compact navigation bar: Today / Learn / My week / More; not a fixed bottom bar | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 4, mobile tab bar layout) | Browser — implementer-reported, sampled |
| **NAV-03** | Mobile More Sheet | <768px | Opens slide-up sheet with Learning path, Starter track, Progress; Escape closes | **REPORTED PASS** | `qa-stage2-onboarding-navigation.cjs` (Test 4, `04-mobile-navigation-sheet.png`) | Browser — implementer-reported, sampled |
| **NAV-04** | Direct URL Links | Any | `/atlas`, `/learn/:id`, `/practice`, `/recovery`, `/dashboard?view=*` load correctly | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Direct URL navigation suite) | Browser — implementer-reported, sampled |
| **NAV-05** | Browser Back/Forward | Any | Synchronizes active view with browser history | **REPORTED PASS** | `verify-loading-performance.cjs` (S3, back/forward history preservation) | Browser — implementer-reported, sampled |
| **NAV-06** | Multi-Viewport Geometry | 1440, 1024, 390, 320 | Zero horizontal overflow; WCAG AA contrast across 6 themes | **REPORTED PASS** | `qa-stage7-failure-responsive.cjs` (Part A, `01-responsive-320-narrow.png`) | Browser — implementer-reported, sampled |

---

## 5. Starter Track (Missions M01–M12)

| ID | Feature / Component | Mission | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **STR-01** | Mission M01 Execution | M01 | Map your starting point: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-02** | Mission M02 Execution | M02 | Trace array lookups: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-03** | Mission M03 Execution | M03 | Attempt Contains Duplicate: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-04** | Mission M04 Execution | M04 | Explain the duplicate check: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-05** | Mission M05 Execution | M05 | Attempt Two Sum: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-06** | Mission M06 Execution | M06 | Trace a hash-map solution: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-07** | Mission M07 Execution | M07 | Revisit without your notes: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-08** | Mission M08 Execution | M08 | Attempt Binary Search: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-09** | Mission M09 Execution | M09 | Check binary-search boundaries: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-10** | Mission M10 Execution | M10 | Compare search choices: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-11** | Mission M11 Execution | M11 | Try a transfer exercise: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-12** | Mission M12 Execution | M12 | Review the starter checkpoint: explicitly record a self-reported outcome/reflection and advance; this is not proof of solving the underlying task | **VERIFIED** | Independent M01–M12 UI journey; reload checkpoints at M03/M06/M09; 18 checks passed | Independent browser — completion recording only |
| **STR-13** | Roadmap Search & Filters | Any | Search step text, filter all/completed/pending, no-result recovery | **REPORTED PASS** | `qa-stage3-starter-journey.cjs` (M03 checkpoint roadmap verification) | Browser — implementer-reported, sampled |
| **STR-14** | Guidance Panel | Any | AI explanation (deterministic provider in test), rate-limit notice | **REPORTED PASS** | `server/tests/guidance.test.js` (Mock provider & rate limiter suite) | Route/unit — implementer-reported |

---

## 6. Learning Path & Curriculum Atlas

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ATL-01** | Topic Map & List Modes | All 12 topics | Interactive map toggle; accessible list table; topic cards render prerequisites | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part A, `01-atlas-topics-map.png`, `02-atlas-topic-inspector.png`) | Browser — implementer-reported, sampled |
| **ATL-02** | Topic Inspector | Selected topic | Shows description, learning objectives, attached lessons (4 each), exercise status | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part A, 12 topic inspection pass) | Browser — implementer-reported, sampled |
| **ATL-03** | Topic Evidence Cards | Active topic | Compact facts (completed lessons, verified vs hinted traces, due reviews) | **REPORTED PASS** | `verify-adaptive-practice.cjs` (Check 4, topic evidence cards) | Browser — implementer-reported, sampled |
| **ATL-04** | "Show Why" Drawer | Topic evidence | Explains topic state (`not_started`, `learning`, `practise_again`, `recent_evidence`) | **REPORTED PASS** | `client/src/fixtures/topicEvidence.test.js` (TE02–TE04, state explanations) | Route/unit — implementer-reported |
| **ATL-05** | "Practise this topic" | Topic evidence | Direct trigger opening practice proposal modal pre-focused on topic | **REPORTED PASS** | `verify-adaptive-practice.cjs` (Check 4, practice trigger from topic card) | Browser — implementer-reported, sampled |
| **ATL-06** | Curriculum Planner Drawer | Curriculum | Allows selecting topics, capacity-aware schedule derivation, acceptance | **REPORTED PASS** | `verify-atlas-proof.cjs` (Check 3, capacity-aware study planner) | Browser — implementer-reported, sampled |

---

## 7. Proof Studio & Trace Verification

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRF-01** | Lesson Mode Progression | 48 lessons | Learn -> Try -> Check -> Finish tabs with predictable step advancement | **PARTIAL** | `qa-stage4-curriculum-traces.cjs` (Part B, mode tabs traversal); full per-item browser completion coverage not established | Selected browser cases; complete catalog UI coverage pending |
| **PRF-02** | Learn Mode | Any lesson | Renders concept explanation, formal loop invariant, code snippet | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part B, invariant & code snippet verified) | Browser — implementer-reported, sampled |
| **PRF-03** | Try Mode (Trace Steps) | 18 exercises | Interactive trace renderer (array pointers, etc.), checkpoint multiple-choice | **PARTIAL** | `qa-stage4-curriculum-traces.cjs` (Part B, `03-proof-studio-trace-active.png`); full per-item browser completion coverage not established | Selected browser cases; complete catalog UI coverage pending |
| **PRF-04** | Alternate Variant Switch | 18 exercises | Variant selector switches between primary and alternate inputs without state bleed | **PARTIAL** | `qa-stage4-curriculum-traces.cjs` (Part B, `04-proof-studio-trace-complete.png`); full per-item browser completion coverage not established | Selected browser cases; complete catalog UI coverage pending |
| **PRF-05** | Edge Case Check | 18 exercises | Boundary challenge question tested before attempt save is enabled | **PARTIAL** | `qa-stage4-curriculum-traces.cjs` (Part B, boundary challenge verified); full per-item browser completion coverage not established | Selected browser cases; complete catalog UI coverage pending |
| **PRF-06** | Check Mode Feedback | Any exercise | Immediate evaluation; misconception explanation; wrong choices highlight | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part B, step feedback evaluation) | Browser — implementer-reported, sampled |
| **PRF-07** | Assistance Tracking | Any exercise | Hint and reference reveal flags recorded; degrades verified to hinted | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part B, hint/invariant tracking) | Browser — implementer-reported, sampled |
| **PRF-08** | Finish Mode & Save | Any exercise | Reflection note, difficulty rating, saves attempt to `exerciseAttempts` | **REPORTED PASS** | `qa-stage4-curriculum-traces.cjs` (Part B, check-in reflection & save) | Browser — implementer-reported, sampled |
| **PRF-09** | Exercise-Free Lessons | 30 lessons | Exercise-free lesson explanation/check/completion; selected lesson tested, not every exercise-free lesson | **PARTIAL** | `qa-stage4-curriculum-traces.cjs` (Part C, `05-exercise-free-lesson-complete.png`); full per-item browser completion coverage not established | Selected browser cases; complete catalog UI coverage pending |
| **PRF-10** | Target Deep Linking | Direct link | `/learn/:lessonId?mode=trace&variant=alternate` loads exact variant/mode | **PARTIAL** | `verify-adaptive-practice.cjs` (Check 8, exact variant & section deep link) | Browser session navigation tested; direct URL parameter contract unverified |

---

## 8. Practice Library

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRC-01** | Search & Topic Filters | 120 problems | Keyword search, topic dropdown, difficulty filter (Easy/Med/Hard) | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part A, `01-practice-library.png`) | Browser — implementer-reported, sampled |
| **PRC-02** | Status Filters | 120 problems | All / Not Started / Solved / Needs Review filter tabs | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part A, filter tabs test) | Browser — implementer-reported, sampled |
| **PRC-03** | Pagination & Count | 120 problems | 20 items per page, pagination buttons, total matching counter | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part A, 20 items pagination) | Browser — implementer-reported, sampled |
| **PRC-04** | External Problem Link | Any problem | Validates external URL (e.g. LeetCode); opens safely with rel="noreferrer" | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part A, external href safe check) | Browser — implementer-reported, sampled |
| **PRC-05** | Self-Reported Logging | Any problem | Records outcome (solved, need review, struggled), notes, review bookmark | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part A, self-reported log save) | Browser — implementer-reported, sampled |
| **PRC-06** | Draft Preservation | Any problem | Unsaved drafts survive workspace view switches; reload survival is a separate check | **PARTIAL** | `verify-workspace.cjs` (Practice draft survives view switch) | Browser view-switch coverage; draft reload coverage unverified |

---

## 9. Review & Spaced Recall

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REV-01** | Unified Review Queue | Starter + Proof | Aggregates due recall items from both starter track and curriculum | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part B, `02-review-queue-recall.png`, 11 items queued) | Browser — implementer-reported, sampled |
| **REV-02** | Recall Panel | Due item | "Recall before reveal" interface; test memory before viewing solution | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part B, recall before reveal interface) | Browser — implementer-reported, sampled |
| **REV-03** | Confidence Rating | Due item | 1-4 confidence rating; derives next review date in Asia/Kolkata (IST) | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part B, confidence rating saved) | Browser — implementer-reported, sampled |
| **REV-04** | Notes Library Search | Notes | Searchable repository of all saved student notes across missions/exercises | **REPORTED PASS** | `verify-workspace.cjs` (Notes search and recall reveal) | Browser — implementer-reported, sampled |
| **REV-05** | Dismiss Suggestion | Review queue | Dismisses item from review queue while retaining notes and underlying history | **REPORTED PASS** | `verify-workspace.cjs` (Dismissing review suggestion retains notes) | Browser — implementer-reported, sampled |

---

## 10. Progress & Insights

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **INS-01** | Activity Streak | IST midnight | Computes active learning days based on Asia/Kolkata calendar | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part C, `03-progress-insights.png`, active days) | Browser — implementer-reported, sampled |
| **INS-02** | Evidence Breakdown | Saved work | Authoritative counts: independent verified traces, assisted, self-reported | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part C, metric breakdown counts) | Browser — implementer-reported, sampled |
| **INS-03** | Chronological History | Reflections | Ordered reflections list from newest to oldest with timestamps | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part C, reflections list descending) | Browser — implementer-reported, sampled |
| **INS-04** | Goal Export JSON | Workspace | Sanitized JSON download containing goal and progress, zero auth tokens | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part C, sanitized JSON snapshot) | Browser — implementer-reported, sampled |

---

## 11. My Week & Continuation Hardening

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WEK-01** | Weekly Execution View | 7-day grid | Visualizes scheduled daily allocations, rest days, completed vs pending | **REPORTED PASS** | `qa-stage5-practice-review-week.cjs` (Part D, `04-my-week-continuation.png`) | Browser — implementer-reported, sampled |
| **WEK-02** | Direct Week Action Links | Allocations | Clicking a scheduled item directly opens the lesson, trace, or practice problem | **REPORTED PASS** | `verify-weekly-execution.cjs` (Start actions resolve right lesson/exercise) | Browser — implementer-reported, sampled |
| **WEK-03** | Foundations Checkpoint | Modal | Foundations checkpoint uses its authored question definition, draft saving and server evaluation; do not equate 10 estimated minutes with 10 questions | **REPORTED PASS** | `verify-continuation.cjs` (T02/T03, student-safe evaluation) | Browser — implementer-reported, sampled |
| **WEK-04** | Continuation Plan Preview | Continuation | Seeds due reviews and failed checkpoint concepts as revisits; signed token | **REPORTED PASS** | `verify-continuation.cjs` (T05, capacity-aware plan preview) | Browser — implementer-reported, sampled |
| **WEK-05** | Continuation Plan Apply | Continuation | Accepts preview plan, updates `studyPlan`, preserves all starter data | **REPORTED PASS** | `verify-continuation.cjs` (T06, plan acceptance & starter preservation) | Browser — implementer-reported, sampled |
| **WEK-06** | Non-Destructive Replan | Spillover | Reschedules unfinished activities without erasing completed work | **REPORTED PASS** | `verify-weekly-execution.cjs` (Replanning seeds only unfinished activities) | Browser — implementer-reported, sampled |

---

## 12. Guided Practice Sessions & Adaptive Integrity

| ID | Feature / Component | Target | Expected Behavior | Status | Evidence & Test Suite | Evidence level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADP-01** | Proposal Modal | 10m/20m/30m | Generates 1-3 tasks fitting selected budget; shows plain-English reason | **REPORTED PASS** | `qa-stage6-adaptive-practice.cjs` (Part A, budget toggle 10m/20m/30m) | Browser — implementer-reported, sampled |
| **ADP-02** | Task Regeneration | Proposal | Excludes unwanted tasks, recalculates valid alternative proposal | **REPORTED PASS** | `verify-adaptive-practice.cjs` (Check 1, proposal modal exclusion) | Browser — implementer-reported, sampled |
| **ADP-03** | Session Start & Baselines | Lifecycle | Creates `activePracticeSession`, records task baselines, locks active session | **REPORTED PASS** | `qa-stage6-adaptive-practice.cjs` (Part B, runner initialized) | Browser — implementer-reported, sampled |
| **ADP-04** | Trace Execution & Return | Practice runner | Solves trace in Proof Studio, saves attempt, returns with authentic badge | **REPORTED PASS** | `verify-adaptive-practice.cjs` (Check 2, trace solve & authentic summary) | Browser — implementer-reported, sampled |
| **ADP-05** | Evaluated Check Verification | Knowledge check | Validates answer server-side; blocks completion unless evaluated correct | **PENDING** | PS15 tests hinted trace evidence, not lesson-check grading; add a directly relevant check before marking this row passed | Evidence reference mismatch |
| **ADP-06** | Session Summary & History | Finalization | Enforces all tasks completed, produces compact summary, archives into history | **REPORTED PASS** | `verify-adaptive-practice.cjs` (Check 2, authentic session summary) | Browser — implementer-reported, sampled |
| **ADP-07** | Retry Idempotency | Network replay | Identical update succeeds without version bump; altered payload conflicts (409) | **VERIFIED** | PS16/PS17/PS20 and PSP07; independent altered-note probe returned UPDATE_CONFLICT | Independent real-route and fixture tests |
| **ADP-08** | Fresh Attempt Enforcement | Evidence | Historical attempt saved before baseline or wrong variant rejected (422) | **VERIFIED** | PS19/PSP06; original wrong-variant historical-attempt probe now returns UNVERIFIED_ATTEMPT | Independent real-route and fixture tests |
