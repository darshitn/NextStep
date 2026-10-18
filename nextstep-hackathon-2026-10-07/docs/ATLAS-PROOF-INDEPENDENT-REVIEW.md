# Atlas + Proof independent review — 2026-10-18

Status: local checks pass, but NOT ready for publication. This is a focused source/behavior review, not an exhaustive curriculum or live integration certification.

## Independently executed

- Client tests: 70/70 passed.
- Server tests: 69/69 passed after an authorized loopback-enabled rerun. The initial sandbox run failed with connect EACCES; that was an environment restriction, not a demonstrated application defect.
- Client production build: passed (433.04 kB main JS, 62.21 kB CSS).
- Curriculum validator: passed; 12 topics, 48 lessons, 18 exercises, 120 practice entries, 1 excluded draft. Note: this command also rewrites/synchronizes `client/src/fixtures/curriculum.json`; it is not read-only.
- git diff --check: passed, with Windows line-ending notices.
- Direct invocation of the real scheduler against every published practice entry reproduced six prerequisite-order violations.
- Direct inspection of getPublishedCurriculum() confirmed public correctOptionId/isCorrect answer keys.

No fresh browser execution, live Supabase verification or full external-link/content accuracy audit was completed in this review. The delivery's browser results remain agent-reported evidence.

## Findings and focused repair requirements

### R1 — P1: untouched exercises can be saved as independent successes

`client/src/components/workspace/ProofStudio.jsx:192` defaults computedExerciseOutcome to independent when no hint, reference or mistakes exist. `handleRecordExerciseAttempt` does not require completed trace steps or a passed edge check. The submit button at line 823 is disabled only while saving. `allStepsCompleted` is merely displayed elsewhere. A student can open an exercise and immediately save an independent attempt without answering anything.

The server compounds this: `server/src/routes/goal.js:1442` accepts client-supplied outcome/mistakeCount without answer evidence. `server/src/schemas/goalSchemas.js:165` has no variant or answer sequence. `curriculumRegistry.js:341` strips review metadata but exposes correctOptionId/isCorrect through public catalog responses.

Repair: distinguish unfinished activity from a completed check; enforce required responses in UI and server. Submit versioned exercise/variant identifiers and answer evidence; derive assessment on the server. Keep assistance provenance honest and do not describe self-reported assistance as tamper-proof. Serve student-safe catalog data; provide reference content explicitly when requested. Update contracts, fixture behavior and clients together. Avoid arbitrary code execution or extra infrastructure.

Tests: empty/partial traces cannot become independent successes; wrong boundary answer cannot pass; forged client outcome is rejected or ignored; valid primary/alternate evidence grades correctly; retries remain idempotent; server grading keys absent from public catalog; hint/reference use remains reflected in saved results.

### R2 — P1: study planner places some problems before their prerequisites

`server/src/services/scheduler.js:175` assigns practice order using only the first linked lesson. The global sort at line 189 then breaks the prerequisite-first sequence originally constructed by enqueueLessonWithPrereqs.

Reproduction: select only `prac_sliding_window_05` with an empty studyWorkspace and daily 90-minute availability. selectedItemIds becomes:

`les_arrays_01, les_arrays_02, les_hashing_01, les_hashing_02, les_sliding_window_01, prac_sliding_window_05, les_sliding_window_02, les_sliding_window_03`.

The problem explicitly links to `les_sliding_window_03` but precedes it. A sweep over all published practice entries found six such dependency violations.

Repair: use a dependency-respecting stable topological ordering for all selected work, including every required linked lesson. Use display order only to break ties between eligible items. Preserve capacity splitting, completed lessons, preview version checks and the starter schedule.

Tests: every dependency precedes its dependent for all current practice entries; cover several prerequisite lessons, shared dependencies, shuffled catalog order and completed prerequisites.

### R3 — P2: Proof state is not isolated by lesson/exercise

`ProofStudio.jsx:80` accepts an explicitly selected exercise without checking whether it belongs to the active topic/lesson. Dashboard selection callbacks change lesson/topic without clearing or reconciling the selected exercise. This can pair a new lesson with the previously selected exercise.

Additionally, the effect at ProofStudio.jsx:124 resets trace controls on exercise changes but does not reset or restore exerciseReflection. Text written for exercise A can therefore be saved against exercise B.

Repair: make navigation select a coherent topic/lesson/exercise tuple; render no attached exercise when the lesson has none rather than silently showing unrelated content. Key drafts and pending request state by exercise and variant. Preserve unsaved text for its original item without transferring it to another one. Reconcile in-flight saves against the submitted item identity.

Tests: topic/lesson switching, direct URLs, back/forward, two different exercise drafts, variant switching, conflict retries and navigation during save.

### R4 — P2: delivery report describes a different API/content model

`docs/ATLAS-PROOF-RESULT.md` lists /api/v1 endpoints and a topic-detail route absent from current catalog.js. Current goal routes are /workspace/lesson, /workspace/exercise, /workspace/practice and separate /workspace/plan/preview and /apply. The report also lists topic IDs, source counts/licences and history bounds that differ from the actual source. For example, it describes original material as CC-BY-4.0 while sources.js labels it proprietary; it lists four sources while validation returns five; it claims 15-attempt retention while the exercise route retains 20.

Repair: regenerate the report from actual source and executed evidence after repairs. Do not change working APIs merely to match an inaccurate report, and do not invent a new licence. Check the API contract and source ledger separately. Distinguish structural validation from independent content verification and fixture persistence from live cloud verification.

## Curriculum validation limitation

The six curriculum tests check schemas, counts, references, cycles, answer-choice cardinality and duplicate URLs. The registry checks exactly one choice is marked correct, but does not execute reference algorithms to establish that the marked choice or state snapshot is actually correct. This does not substantiate an exhaustive algorithm-correctness claim for 18 traces and their alternate inputs. Add executable reference/edge-case comparisons for published traces, or narrow the report's verification claims until those checks exist.

## Antigravity repair handoff

Read this review and `docs/ANTIGRAVITY-ATLAS-PROOF-MASTER.md`. Preserve all current tracked/untracked work. Fix R1, then R2, then R3, then correct R4. Add the focused regressions above and deterministic trace-content checks. Use one editing session, existing dependencies, synthetic data and local tests only. Do not commit/push/deploy, modify environment files or production data, or run migrations. Do not bypass permissions. Limit each failed repair approach to two focused attempts, then report the exact blocker and continue only independent work.

Run server/client suites, curriculum validation, build, diff check and the existing/new browser journeys if permitted. Record actual results in `docs/ATLAS-PROOF-REPAIR-RESULT.md`, with changed files, content coverage, unresolved items and a local owner exercise. Do not mark release-ready while these behavioral defects remain. Publication remains a separate owner decision.
