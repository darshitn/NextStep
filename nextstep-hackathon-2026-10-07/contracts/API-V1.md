> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Frozen interface: NextStep API v1

Runtime Gemini is implemented through the backend guidance service. Missing AI configuration returns HTTP 503 with `AI_NOT_CONFIGURED`; provider failures never return canned advice labeled as Gemini. Automated tests isolate local credentials and use mocked providers.

**Authority:** Darshit + Sankirth. Freeze at G0. All fields below are camelCase. All routes return JSON, including errors. This specification is planned behaviour, not evidence of an existing endpoint.

## Transport

- Local API: `http://localhost:3001`; local client: `http://localhost:5173` (strict port).
- Production API base: exact Render HTTPS origin, with no trailing `/api`.
- The client always requests `${API_BASE}/api/...`; never append `/api` twice.
- `Content-Type: application/json` for writes. Body limit 32 KB.
- All routes except health/catalog require `Authorization: Bearer <Supabase user access token>`.
- Browser sign-in calls Supabase Auth directly. The publishable key is not a user access token.
- Render validates the JWT with Supabase `auth.getUser(token)`; no caller-supplied owner ID.
- A successful write responds only after the database save succeeds. Do not auto-retry writes on timeout.
- Client timeout: 60 seconds for reads to accommodate a Render cold start; 20 seconds for writes, with no automatic write retry. After a timed-out write, reload saved state before retrying. Expiring Supabase sessions are refreshed before authenticated API requests.

## Envelopes

```json
{"data": {"example": "success payload"}}
```

```json
{"error":{"code":"VALIDATION_ERROR","message":"Choose at least one study session.","fields":{"availability":"At least one day must have 30 minutes."}}}
```

`fields` is optional. Do not expose SQL, stack traces, environment values, or JWTs. HTTP codes: 400 malformed JSON; 401 absent/invalid session; 403 blocked origin or forbidden operation; 404 unknown route/mission/no goal where required; 409 stale version or different existing goal; 422 invalid values/prerequisite; 503 database/auth service unavailable; 500 unexpected internal error.

## GET /api/health — public

HTTP 200: `{"ok":true,"service":"nextstep-api","apiVersion":1}`.

This proves Express is alive only. It makes no claim about the database. Missing required server environment variables should fail startup clearly without printing values.

## GET /api/catalog — public

HTTP 200: `{"data":{"trackId":"dsa-starter-v1","title":"DSA foundations starter","missions":[...]}}`.

Mission fields are exactly those in `fixtures/dsa-starter.json`. Backend copies the fixture to `server/data/dsa-starter.json` during scaffold so Render can deploy the server directory alone. Do not fetch resources or scrape their contents at runtime.

## GET /api/goal — authenticated

HTTP 200: `{"data":{"goal":null}}` for a new user. Otherwise `{"data":{"goal":Goal}}`.

## POST /api/goal — authenticated, initial creation

```json
{
  "creationRequestId":"10000000-0000-4000-8000-000000000001",
  "trackId":"dsa-starter-v1",
  "planStartDate":"2026-10-07",
  "targetDate":"2026-11-06",
  "deadlineMode":"flexible",
  "timezone":"Asia/Kolkata",
  "availability":{"mon":60,"tue":0,"wed":60,"thu":0,"fri":60,"sat":0,"sun":0}
}
```

HTTP 201 on creation, `{"data":{"goal":Goal}}`. Client generates creationRequestId once and retains it while retrying the same creation. Existing goal with the same creationRequestId returns HTTP 200 and that goal; a different request returns 409 GOAL_EXISTS with a message to load the existing goal. One active goal per owner in the pilot. No destructive reset endpoint.

Validation: known track only; real ISO dates; target >= planStartDate; dates within 30 days before today through 365 days after today; target cannot be before today. Timezone must be Asia/Kolkata. Deadline mode fixed/flexible. Exactly seven availability keys, each integer in {0,30,60,90}; at least one nonzero. Reject unknown fields in write input. Client passes no XP, completion map, owner, or schedule.

## Goal response shape

```json
{
  "id":"20000000-0000-4000-8000-000000000001",
  "version":1,
  "trackId":"dsa-starter-v1",
  "planStartDate":"2026-10-07",
  "targetDate":"2026-11-06",
  "deadlineMode":"flexible",
  "timezone":"Asia/Kolkata",
  "availability":{"mon":60,"tue":0,"wed":60,"thu":0,"fri":60,"sat":0,"sun":0},
  "schedule":[{"missionId":"m01","date":"2026-10-07"}],
  "completions":{},
  "estimatedFinishDate":"2026-10-19",
  "remainingMinutes":360,
  "status":"on_track",
  "xp":0,
  "level":1,
  "nextMissionId":"m01",
  "updatedAt":"2026-10-07T03:30:00.000Z"
}
```

This example truncates schedule to one entry for readability; real responses contain all twelve mission entries. Status values: on_track, over_capacity, completed. Estimates are recomputed from saved state. `nextMissionId` is the first incomplete mission, null when all done. `estimatedFinishDate` is the last pending scheduled date, or the last completion's local date when all done. `remainingMinutes`, `xp`, and `level` are server-derived.

Completion map entry:

```json
{"m01":{"completedAt":"2026-10-07T04:00:00.000Z","outcome":"independent","reflection":"I can describe an array lookup."}}
```

Outcomes: independent, with_hint. Reflection optional, max 280 characters. Time is server-assigned. This is self-reported practice, not independently verified skill. Missed dates never generate completion entries.

## POST /api/goal/complete

```json
{"missionId":"m01","expectedVersion":1,"outcome":"independent","reflection":"I can describe an array lookup."}
```

HTTP 200: `{"data":{"goal":Goal,"alreadyCompleted":false}}`.

If the mission is already complete, return current goal with alreadyCompleted=true and no mutation, even if expectedVersion is now older. Otherwise a stale expectedVersion gives 409 VERSION_CONFLICT; unmet prerequisite gives 422 PREREQUISITE_REQUIRED. Completing the next eligible mission early is allowed; UI can call it “Next mission” on a rest/future day. Duplicate clicks cannot award duplicate XP. Completion keeps existing scheduled dates; it does not silently reschedule other work.

## POST /api/goal/recovery/preview

```json
{"expectedVersion":2,"availability":{"mon":30,"tue":0,"wed":30,"thu":0,"fri":30,"sat":0,"sun":0}}
```

HTTP 200:

```json
{"data":{"preview":{"baseVersion":2,"previewForDate":"2026-10-07","availability":{"mon":30,"tue":0,"wed":30,"thu":0,"fri":30,"sat":0,"sun":0},"schedule":[],"estimatedFinishDate":"2026-10-30","proposedTargetDate":"2026-11-06","status":"on_track","remainingMinutes":330,"movedMissionCount":8}}}
```

The numbers are illustrative; server computes real values. Actual schedule is complete, not empty. This route must not write. Completed missions retain their old schedule entries. Pending work is scheduled from max(today, planStartDate); subtract minutes actually completed today from today's proposed capacity, floored at zero. Flexible: proposedTargetDate = max(current target, estimated finish). Fixed: proposedTargetDate remains the original target, status over_capacity if finishing later. Explain the difference in UI. Include overflow work in the preview; never drop it to make the plan fit.

## POST /api/goal/recovery/apply

```json
{"expectedVersion":2,"previewForDate":"2026-10-07","availability":{"mon":30,"tue":0,"wed":30,"thu":0,"fri":30,"sat":0,"sun":0}}
```

Recompute from the latest state; do not trust a client-provided schedule or finish date. Reject stale version or a preview from a different current local date with 409. Save state atomically, increment version once, return `{"data":{"goal":Goal}}` HTTP 200. In flexible mode this explicitly approved action can extend targetDate to proposedTargetDate. Fixed mode preserves targetDate and the warning. A repeated Apply with an old version returns 409; client reloads and asks for a fresh preview. No automatic retry that could overwrite another tab's work.

## POST /api/goal/guidance — authenticated

```json
{"expectedVersion":2,"missionId":"m02","category":"too_difficult","feedback":"I do not understand how the index moves."}
```

HTTP 200:

```json
{"data":{"guidance":{"baseVersion":2,"missionId":"m02","mode":"guided_practice","explanation":"Use a small example to make each index change visible.","steps":["Write a short example array.","Trace each operation on paper.","Attempt the mission and check its completion criteria."],"checkQuestion":"What changes after the first operation?","source":"gemini"}}}
```

Authenticated read-only AI endpoint. Server validates that `expectedVersion` matches the current goal version, and that `missionId` is either the next eligible incomplete mission or a mission already recorded as completed. Completed missions remain eligible for revision after the track finishes. Unknown mission IDs return 404 `MISSION_NOT_FOUND`; future incomplete missions return 422 `INVALID_MISSION`. Categories: `too_difficult`, `need_revision`, `ready_to_continue`. Feedback optional, max 280 chars. AI guidance is ephemeral and does not mutate the saved goal, completion history, XP or schedule. Returns 502 on malformed AI output, 503 on provider unavailable, 504 on timeout.

## Client integration obligations

- One `client/src/lib/api.js` adapter adds base URL, access token, JSON handling, and error translation.
- Refresh the displayed goal after save using the returned goal; no speculative permanent XP.
- Disable duplicate submissions while pending; show API errors near the relevant control.
- On 401 show session-expired/sign-in. On 409 reload the goal and invalidate any preview.
- On network error retain the form, show failure, allow explicit retry/load-current-state.
- Fixture-only development must carry a visible FIXTURE MODE badge and be disabled for production builds.

## Personal goal name extension (7 October 2026)
Create accepts optional `goalName` (trimmed 1-80 characters). Existing goals display a fallback name. Authenticated PATCH /api/goal accepts `{goalName, expectedVersion}` and returns `{data:{goal}}`. Saving increments version with compare-and-set; schedule and completions remain unchanged. Names live in state JSONB; no migration. Renaming does not generate a curriculum: DSA Foundations remains the only supported track.

## DSA Learning Loop extension (7 October 2026)

### Data model
Persisted inside `goal.state.learning[missionId]` (empty object default for existing goals):
```json
{
  "missionId": "m02",
  "category": "too_difficult",
  "whatTried": "Traced linear search on paper with [4, 1, 8, 3].",
  "whereStuck": "Confused why worst case is 4 comparisons instead of 3.",
  "selfReportedStatus": "still_unsure",
  "dismissed": false,
  "guidance": {
    "questionId": "q_m02_trace_search",
    "questionText": "Trace a linear search for target 8 in [4, 1, 8, 3]. How many comparisons are made, and what is the worst-case number of comparisons if the target is absent?",
    "mode": "guided_practice",
    "explanation": "...",
    "steps": ["..."],
    "generatedAt": "2026-10-07T12:00:00.000Z"
  },
  "assessment": {
    "questionId": "q_m02_trace_search",
    "answer": "It takes 3 comparisons to find 8, but if absent it compares with all 4 elements.",
    "status": "on_track",
    "explanation": "Spot on. Unsorted search requires checking every element to confirm absence.",
    "nextStep": "Trace what happens if target is at index 0.",
    "assessedAt": "2026-10-07T12:05:00.000Z",
    "source": "gemini"
  },
  "updatedAt": "2026-10-07T12:05:00.000Z"
}
```

### POST /api/goal/learning/context — authenticated
Save or edit blocker context for a mission without requiring AI generation.
```json
{
  "expectedVersion": 2,
  "missionId": "m02",
  "category": "too_difficult",
  "whatTried": "Traced linear search by hand.",
  "whereStuck": "Not sure why comparison count varies.",
  "selfReportedStatus": "still_unsure",
  "dismissed": false
}
```
Validation:
- `expectedVersion`: integer >= 1
- `missionId`: string, known in track
- `category`: `too_difficult` | `need_revision` | `ready_to_continue`
- `whatTried`: optional string <= 280 chars
- `whereStuck`: optional string <= 280 chars
- `selfReportedStatus`: optional enum `still_unsure` | `ready_to_continue`
- `dismissed`: optional boolean

HTTP 200: `{"data":{"goal":Goal}}`. Atomically updates `goal.state.learning[missionId]` and increments `version`. Stale version returns 409 `VERSION_CONFLICT`.

### POST /api/goal/learning/check — authenticated
Submit student's understanding check answer for AI assessment against the server's reference rubric.
```json
{
  "expectedVersion": 3,
  "missionId": "m02",
  "questionId": "q_m02_trace_search",
  "answer": "3 comparisons for 8, and 4 comparisons when absent.",
  "selfReportedStatus": "ready_to_continue"
}
```
Validation:
- `expectedVersion`: integer >= 1
- `missionId`: known mission in track
- `questionId`: string, must match server-authoritative question for `missionId`. Mismatched or unsupported returns 422 `INVALID_QUESTION_ID`.
- `answer`: string, 1 to 1000 characters
- `selfReportedStatus`: optional enum `still_unsure` | `ready_to_continue`

HTTP 200:
```json
{
  "data": {
    "goal": Goal,
    "assessment": {
      "missionId": "m02",
      "questionId": "q_m02_trace_search",
      "status": "on_track",
      "explanation": "Correctly notes 3 comparisons for index 2 and 4 comparisons across the full array when absent.",
      "nextStep": "Implement the search function in your practice session.",
      "source": "gemini"
    }
  }
}
```
Assessment statuses: `on_track`, `needs_another_try`, `uncertain`.
Assessment answers and coaching signals NEVER complete the mission or award XP. Atomically saves into `goal.state.learning[missionId].assessment` and increments `version`. Returns 409 on stale version, 502 on malformed AI output, 503 on provider unavailable, 504 on timeout. Preserves student answer in client on failure.

### Curated check missions
Three representative missions have server-curated questions and reference rubrics:
1. `m02`: Linear search comparisons (target 8 vs absent worst case in `[4, 1, 8, 3]`). Question ID: `q_m02_trace_search`.
2. `m04`: Set-based duplicate detection (trace `[2, 5, 2]`, index detected and contents immediately prior). Question ID: `q_m04_duplicate_set`.
3. `m06`: Two Sum hash map (target 9 on `[2, 7, 11, 15]`, complement lookup key and insertion order rationale). Question ID: `q_m06_hash_map_twosum`.
Other missions retain open-ended practice guidance without curated question rubrics.

### POST /api/goal/learning/recall — authenticated
Record a retrieval practice attempt with self-rated confidence and calculate an authoritative next review due date.
```json
{
  "expectedVersion": 2,
  "missionId": "m02",
  "attemptId": "10000000-0000-4000-8000-000000000002",
  "attemptText": "Linear search checks each index sequentially until target is found or array ends.",
  "confidence": 4
}
```
Validation:
- `expectedVersion`: integer >= 1
- `missionId`: known mission in track
- `attemptId`: client-generated UUID (reused for identical retries)
- `attemptText`: string, trimmed 1 to 2000 characters; whitespace-only is rejected
- `confidence`: integer in {1, 2, 3, 4, 5} (1=very unsure, 2=unsure, 3=fair, 4=confident, 5=very confident)

Eligibility:
- Mission must be the next eligible incomplete mission OR an already completed mission.
- Unknown mission ID returns 404 `MISSION_NOT_FOUND`.
- Future incomplete mission returns 422 `INVALID_MISSION`.

Storage & Idempotency:
- Stored under `goal.state.learning[missionId].recallHistory` as an array of up to 20 latest chronological records:
  ```json
  {
    "attemptId": "10000000-0000-4000-8000-000000000002",
    "attemptText": "...",
    "confidence": 4,
    "savedAt": "2026-10-16T10:30:00.000Z",
    "nextReviewDate": "2026-10-23"
  }
  ```
- Server computes `savedAt` at receipt and derives `nextReviewDate` (YYYY-MM-DD in Asia/Kolkata) using confidence intervals: 1 -> +1 day, 2 -> +2 days, 3 -> +3 days, 4 -> +7 days, 5 -> +14 days. This mapping is an explicit product heuristic, not a validated memory model. Client timestamps or dates are never accepted.
- Duplicate retry: if `attemptId` already exists in `recallHistory` with identical `attemptText` and `confidence`, returns HTTP 200 with current goal and saved record without incrementing version or mutating state, even if `expectedVersion` is stale.
- Reusing an existing `attemptId` with different text or confidence returns 409 `ATTEMPT_CONFLICT`.
- Stale version on a new `attemptId` returns 409 `VERSION_CONFLICT`.
- Atomically increments version on new write. Does not alter schedules, completions, XP, or dismiss blockers.

HTTP 200:
```json
{
  "data": {
    "goal": Goal,
    "recallAttempt": {
      "attemptId": "10000000-0000-4000-8000-000000000002",
      "attemptText": "...",
      "confidence": 4,
      "savedAt": "2026-10-16T10:30:00.000Z",
      "nextReviewDate": "2026-10-23"
    }
  }
}
```

## Atlas + Proof Learning Workspace Extension (17 October 2026)

### Preservation of Starter Track & One-Goal Constraint
- Existing `dsa-starter-v1` missions (`m01`–`m12`), `schedule`, `completions`, `learning`, `xp`, `level`, `remainingMinutes`, `nextMissionId`, `estimatedFinishDate`, and `status` are preserved unchanged.
- All Atlas + Proof learning workspace state is stored additively under `goal.state.studyWorkspace` within the existing owner-scoped `public.nextstep_goals` row using optimistic compare-and-set (`version`). No database schema migration is required.
- Legacy goals without `studyWorkspace` receive a normalized default `studyWorkspace` object on read and retain all additive fields across every legacy mutation (`/complete`, `/recovery/apply`, `/learning/context`, `/learning/check`, `/learning/recall`, `PATCH /api/goal`).

### Namespaced Curriculum IDs & Public Catalog
- Curriculum IDs use strict prefixes disjoint from `m01`–`m12`:
  - Topics: `topic_<slug>`
  - Prerequisite edges: `{ fromTopicId, toTopicId, rationale }`
  - Lessons: `les_<topic>_<nn>`
  - Interactive exercises: `ex_<topic>_<nn>`
  - External practice references: `prac_<topic>_<nn>`
  - Source attributions: `src_<slug>`
- `GET /api/catalog` returns the existing starter mission fields AND an additive `curriculum` object containing only items with `reviewStatus === "published"`. Unreviewed drafts (`reviewStatus !== "published"`) are excluded from production catalog indexes and published counts.
- **Grading Integrity & Student-Safe Catalog**: `GET /api/catalog` outputs student-safe curriculum representations. Answer keys (`isCorrect` flags on step and edge choices, `correctOptionId` on lesson knowledge checks, and `referenceImplementation` code) are stripped from public responses to prevent client-side answer sniffing.
- **Evaluation Endpoints (Interactive Formative Feedback)**:
  - `POST /api/catalog/exercise/evaluate-step`: `{ exerciseId, variantKey, stepIndex, choiceId }` -> `{ data: { isCorrect, feedback, explanation } }`
  - `POST /api/catalog/exercise/evaluate-edge`: `{ exerciseId, choiceId }` -> `{ data: { isCorrect, feedback, explanation } }`
  - `POST /api/catalog/lesson/evaluate-check`: `{ lessonId, optionId }` -> `{ data: { isCorrect, feedback, explanation } }`
  - `GET /api/catalog/exercise/:exerciseId/reference`: Explicit on-demand request for reference invariant, implementation, and edge case notes.

### Additive `goal.studyWorkspace` Shape
```json
{
  "schemaVersion": 1,
  "curriculumVersion": "atlas-proof-v1",
  "selectedTopicId": "topic_hashing",
  "lessonProgress": {},
  "exerciseAttempts": {},
  "practiceAttempts": {},
  "studyPlan": null,
  "updatedAt": "2026-10-17T10:00:00.000Z"
}
```
- **Retention & Bounds**:
  - `exerciseAttempts[exerciseId]`: up to 20 latest chronological attempts per exercise.
  - `practiceAttempts[problemId]`: up to 20 latest chronological attempts per problem.
  - `lessonProgress[lessonId]`: keyed by published `lessonId`, `reflection` trimmed up to 500 characters.
  - `studyPlan.selectedItemIds`: up to 40 explicitly selected curriculum items.

### POST /api/goal/workspace/lesson — authenticated
Save lesson progress, reflection, knowledge check outcome, or selected topic in Atlas/Proof.
```json
{
  "expectedVersion": 2,
  "requestId": "20000000-0000-4000-8000-000000000001",
  "lessonId": "les_hashing_01",
  "topicId": "topic_hashing",
  "status": "completed",
  "completedSections": ["explanation", "worked_example", "trace", "edge_case", "knowledge_check", "reflection"],
  "reflection": "Check membership before inserting so an element never matches itself.",
  "knowledgeCheckOptionId": "kc_les_hashing_01_b",
  "checkIn": {
    "version": 1,
    "confidence": "ready",
    "focus": "invariant"
  }
}
```
- Server validates `lessonId` and `topicId` against published curriculum, grades `knowledgeCheckOptionId` server-side against authoritative curriculum, enforces `requestId` idempotency (identical retry returns 200 without version bump; conflicting payload with same `requestId` returns 409 `REQUEST_CONFLICT`), and updates `studyWorkspace.lessonProgress[lessonId]` with CAS.
- `checkIn`: Optional bounded object `{ version: 1, confidence: "ready"|"needs_example"|"unsure", focus: "invariant"|"update_order"|"edge_cases"|"none" }`. Unknown versions or keys are rejected.
  Omission preserves a saved lesson check-in; explicit `null` clears it. The lesson record retains `lastRequestCheckInProvided` to distinguish these operations during idempotent retries.
- Recording lesson progress never claims verified mastery and never alters starter `m01`–`m12` completions or XP.

### POST /api/goal/workspace/exercise — authenticated
Record an interactive Proof trace/reasoning exercise attempt with authoritative server-side grading.
```json
{
  "expectedVersion": 3,
  "attemptId": "30000000-0000-4000-8000-000000000001",
  "exerciseId": "ex_hashing_01",
  "variantKey": "primary",
  "stepAnswers": [
    { "stepIndex": 0, "choiceId": "c1_correct" },
    { "stepIndex": 1, "choiceId": "c2_correct" }
  ],
  "edgeChoiceId": "ec_hash1_correct",
  "outcome": "with_hint",
  "mistakeCount": 1,
  "hintRevealed": false,
  "referenceRevealed": true,
  "reflection": "Forgot that index 1 value 5 stays in the set when index 2 is checked.",
  "checkIn": {
    "version": 1,
    "confidence": "needs_example",
    "focus": "update_order"
  }
}
```
- **Authoritative Grading**: Server grades every `stepAnswer` and `edgeChoiceId` against the authoritative (answer-key-bearing) curriculum. Incomplete traces or incorrect choices are rejected with HTTP 422 (`VALIDATION_ERROR`).
- **Authoritative Outcome Derivation**: Regardless of the client-supplied `outcome`, the server normalizes the outcome:
  - `needed_reference` if `referenceRevealed` is true.
  - `with_hint` if `hintRevealed` is true or `mistakeCount > 0`.
  - `independent` only if zero mistakes, no hint, and no reference reveal.
- **CAS & Idempotency**: Computes server-assigned `savedAt` and `nextReviewDate` in `Asia/Kolkata`, caps history at 20 attempts per exercise, and enforces `attemptId` idempotency (identical retry returns 200; altered payload or changed checkIn with same `attemptId` returns 409 `ATTEMPT_CONFLICT`).
- `checkIn`: Optional bounded self-reported check-in `{ version: 1, confidence: "ready"|"needs_example"|"unsure", focus: "invariant"|"update_order"|"edge_cases"|"none" }`. Unknown enum values or extra keys return 422 `VALIDATION_ERROR`. Check-in choices never alter algorithmic grading, score, or review due dates.

### POST /api/goal/workspace/practice — authenticated
Record a self-reported attempt on an external practice problem reference.
```json
{
  "expectedVersion": 4,
  "attemptId": "40000000-0000-4000-8000-000000000001",
  "problemId": "prac_hashing_01",
  "outcome": "with_hint",
  "note": "Used a hash set to check seen values in O(1) average time.",
  "needsReview": true
}
```
- Outcomes: `independent`, `with_hint`, `not_yet`.
- Server validates `problemId` against published practice references, always sets `selfReported: true`, assigns `savedAt` and `nextReviewDate` (`Asia/Kolkata`), caps history at 20 attempts per problem, and enforces `attemptId` idempotency.

### POST /api/goal/workspace/plan/preview — authenticated (read-only)
Calculate a capacity-aware study plan for explicitly selected curriculum items without mutating saved state.
```json
{
  "expectedVersion": 5,
  "availability": { "mon": 30, "tue": 0, "wed": 30, "thu": 0, "fri": 30, "sat": 0, "sun": 0 },
  "selectedItemIds": ["les_hashing_01", "les_hashing_02", "prac_hashing_01"],
  "targetDate": "2026-10-31"
}
```
- Respects topic and lesson prerequisites, skips already-completed lessons unless explicitly requested for revisit, uses content duration estimates (never claiming measured focus time), supports multi-session spanning when an item's estimated minutes exceed a single day's slot without marking it complete, and returns `sessions`, `unscheduledItemIds`, `deadlineConflict`, `baseVersion`, `previewForDate`, and `curriculumVersion`.

### POST /api/goal/workspace/plan/apply — authenticated
Atomically save an accepted study plan under `goal.state.studyWorkspace.studyPlan`.
```json
{
  "expectedVersion": 5,
  "previewForDate": "2026-10-17",
  "curriculumVersion": "atlas-proof-v1",
  "availability": { "mon": 30, "tue": 0, "wed": 30, "thu": 0, "fri": 30, "sat": 0, "sun": 0 },
  "selectedItemIds": ["les_hashing_01", "les_hashing_02", "prac_hashing_01"],
  "targetDate": "2026-10-31"
}
```
- Recomputes deterministically on the server, rejects stale `expectedVersion`, stale `previewForDate`, or mismatched `curriculumVersion` with 409, and saves `studyWorkspace.studyPlan` without modifying the starter track schedule (`goal.schedule`) or starter availability.

---

## Continuation & Foundations Checkpoint Extensions (Track A)

### Additive State Structure: `goal.state.studyWorkspace.continuation`
Saved under `goal.state.studyWorkspace.continuation`. If absent on older goals, defaults to initial unstarted state upon normalization:
```json
{
  "schemaVersion": 1,
  "status": "not_started",
  "checkpoint": {
    "checkpointId": "chk_foundations_v1",
    "status": "not_started",
    "definitionVersion": 1,
    "draftAnswers": {},
    "draftReflection": "",
    "draftAssistance": {},
    "draftCurrentIndex": 0,
    "draftSavedAt": null,
    "latestAttempt": null,
    "history": []
  },
  "suggestedPlan": {
    "previewId": null,
    "generatedAt": null,
    "sourceEvidence": null,
    "items": [],
    "weeklyCommitmentHours": 0,
    "accepted": false,
    "acceptedAt": null
  }
}
```
- **Bounds & Retention**:
  - `draftAnswers`: map of `questionId -> optionId`, limited to known checkpoint question and option IDs.
  - `draftReflection`: trimmed student reflection string, max 500 characters.
  - `draftAssistance`: map of `questionId -> { usedHint: boolean }` tracking self-reported assistance.
  - `draftCurrentIndex`: 0-indexed integer for question position.
  - `latestAttempt`: object describing score, topic results, feedback, definitionVersion, and category.
  - `history`: capped at the 5 most recent attempts per user.
  - Text fields (`reflection`, `note`) trimmed to max 500 characters.

### GET /api/goal/workspace/checkpoint/:checkpointId — authenticated
Retrieves student-safe checkpoint details, current user draft (including restored answers, reflection, assistance, and position), and latest attempt.
- **Parameters**: `checkpointId` (must match supported definition, e.g. `chk_foundations_v1`).
- **Privacy & Safety**: Answer keys, correct choices, and grading logic are NEVER returned on this route.
- **Response**: HTTP 200
```json
{
  "data": {
    "checkpoint": {
      "id": "chk_foundations_v1",
      "version": 1,
      "title": "DSA Foundations Checkpoint",
      "description": "A quick 3-topic check covering arrays, hashing, and binary search boundaries.",
      "estimatedMinutes": 10,
      "topics": [
        { "id": "topic_arrays", "title": "Arrays & Invariant Scanning", "questionCount": 1 },
        { "id": "topic_hashing", "title": "Hash Sets & Complement Lookup", "questionCount": 1 },
        { "id": "topic_binary_search", "title": "Binary Search Boundaries", "questionCount": 1 }
      ],
      "questions": [
        {
          "id": "chk_q_arrays_01",
          "topicId": "topic_arrays",
          "lessonId": "les_arrays_01",
          "exerciseId": "ex_arrays_01",
          "prompt": "When scanning an array to find maximum single-transaction profit, why must the candidate profit (prices[i] - minPrice) be evaluated before updating minPrice with prices[i]?",
          "options": [
            { "id": "opt_arr_1", "label": "To prevent an element at index i from pairing with itself and falsely reporting a zero-profit trade when prices are strictly descending." },
            { "id": "opt_arr_2", "label": "Because JavaScript arrays require 1-based indexing for running minima." },
            { "id": "opt_arr_3", "label": "Because updating minPrice first triggers an out-of-bounds exception." },
            { "id": "opt_arr_4", "label": "Because profits can only be calculated on even indices." }
          ],
          "hint": "Think about what prices[i] - minPrice evaluates to if minPrice was just updated to prices[i]."
        }
      ]
    },
    "draft": {
      "answers": { "chk_q_arrays_01": "opt_arr_1" },
      "reflection": "Tricky binary search bounds.",
      "assistance": { "chk_q_arrays_01": { "usedHint": false } },
      "currentIndex": 0,
      "definitionVersion": 1,
      "savedAt": "2026-10-18T18:45:00.000Z"
    },
    "latestAttempt": null
  }
}
```

### POST /api/goal/workspace/checkpoint/draft — authenticated
Saves unsubmitted work-in-progress draft state. Does not grade or advance attempt status.
- **Request Body**:
```json
{
  "expectedVersion": 2,
  "checkpointId": "chk_foundations_v1",
  "draftAnswers": {
    "chk_q_arrays_01": "opt_arr_1"
  },
  "draftReflection": "Working on question 2 reflection.",
  "draftAssistance": {
    "chk_q_arrays_01": { "usedHint": false }
  },
  "draftCurrentIndex": 1,
  "definitionVersion": 1
}
```
- **Validation**: Rejects unknown question IDs, unknown option IDs, unknown assistance keys, or text > 500 chars with 422.
- **Response**: HTTP 200 `{"data": {"goal": Goal, "draftSavedAt": "2026-10-18T18:45:00.000Z"}}`
- **Errors**: 404 checkpoint not found; 409 `VERSION_CONFLICT` if `expectedVersion` mismatches; 422 if invalid answer format.

### POST /api/goal/workspace/checkpoint/evaluate — authenticated
Authoritatively evaluates student answers on the server against server-side answer keys.
- **Request Body**:
```json
{
  "expectedVersion": 2,
  "attemptId": "50000000-0000-4000-8000-000000000001",
  "checkpointId": "chk_foundations_v1",
  "definitionVersion": 1,
  "answers": {
    "chk_q_arrays_01": "opt_arr_1",
    "chk_q_hashing_01": "opt_hash_1",
    "chk_q_bs_01": "opt_bs_2"
  },
  "selfReportedAssistance": {
    "chk_q_arrays_01": { "usedHint": false },
    "chk_q_hashing_01": { "usedHint": true },
    "chk_q_bs_01": { "usedHint": false }
  },
  "reflection": "Need to be more disciplined about binary search inclusive boundary conditions."
}
```
- **Evaluation Logic**:
  - Validates known question IDs, option membership, and assistance keys; returns 422 on invalid/unknown IDs.
  - Scores each question against server-side definition.
  - Derives literal score: `{ correct: 2, total: 3 }` (never an invented percentage or job-readiness claim).
  - Derives category:
    - `"ready_to_continue"`: all 3 questions answered correctly without reference reveal.
    - `"revisit_recommended"`: 1 or more questions incorrect or required hints.
    - `"insufficient_evidence"`: fewer than 2 questions attempted.
  - Produces `topicResults` with student-safe feedback, concrete recommended revisit lessons, and actual observed assistance.
  - Attaches `definitionVersion` to evaluation result.
  - Clears student draft answers upon successful evaluation.
- **Idempotency & Concurrency**:
  - Submitting identical `attemptId` with identical answers, reflection, assistance, and definition version returns HTTP 200 with the existing evaluated result without incrementing goal version. Idempotency evaluation occurs before active checkpoint definition validation to guarantee historical attempts under older definition versions can be retried safely.
  - Submitting identical `attemptId` with conflicting answers, reflection, or assistance returns HTTP 409 `ATTEMPT_CONFLICT`.
- **Response**: HTTP 200 `{"data": {"goal": Goal, "evaluation": AttemptResult}}`

### POST /api/goal/workspace/checkpoint/skip — authenticated
Allows student to optionally bypass the foundations checkpoint and move directly to continuation planning.
- **Request Body**:
```json
{
  "expectedVersion": 2,
  "checkpointId": "chk_foundations_v1"
}
```
- **Response**: HTTP 200 `{"data": {"goal": Goal}}` (sets `continuation.status = "skipped"`).

### POST /api/goal/workspace/checkpoint/reset — authenticated
Resets checkpoint status back to `in_progress` and clears draft state to permit a fresh, clean evaluation attempt.
- **Request Body**:
```json
{
  "expectedVersion": 3,
  "checkpointId": "chk_foundations_v1"
}
```
- **Response**: HTTP 200 `{"data": {"goal": Goal}}`

### POST /api/goal/workspace/continuation/plan/preview — authenticated (read-only)
Computes a capacity-aware 7-day proposal derived from real student evidence (checkpoint results, failed concepts, due reviews, and next eligible curriculum lessons).
- **Request Body**:
```json
{
  "expectedVersion": 3,
  "availability": { "mon": 60, "tue": 0, "wed": 60, "thu": 0, "fri": 60, "sat": 0, "sun": 0 },
  "selectedItemIds": ["les_binary_search_01", "les_two_pointers_01"],
  "revisitItemIds": ["les_binary_search_01"],
  "targetDate": "2026-10-31"
}
```
- If `selectedItemIds` is omitted or empty (`[]`), the server deterministically generates recommendations based on:
  1. Targeted revisit for any checkpoint topic where evidence shows difficulty (`revisitRecommended === true`).
  2. Any due reviews from exercise and practice attempts where `nextReviewDate <= today` or `needsReview === true`.
  3. First incomplete eligible lessons in curriculum prerequisite order.
  4. End-of-library deliberate review: if all curriculum lessons are completed, schedules a foundational invariant revisit with `isRevisit: true` and `(Revisit)` title suffix to maintain mastery.
- `revisitItemIds`: Optional list of activity IDs explicitly marked as revisits. Sessions for these items are generated with `isRevisit: true`.
- Does NOT mutate database state.
- Generates an HMAC-SHA256 signed `previewToken` binding ownerId, baseVersion, selectedItemIds, effective revisitItemIds, availability, previewForDate, curriculumVersion, and targetDate. The response also includes the effective revisitItemIds. The signing key is private; the publishable Supabase key is never used to sign tokens. Without a configured stable signing secret, tokens are valid only for the current server process.
- **Response**: HTTP 200 with `previewId`, `previewToken`, `previewForDate` (`Asia/Kolkata`), `horizonEndDate`, `weeklyCapacityMinutes`, `sessions`, `weekSessions`, `spilloverSessions`, `hasSpillover`, `unscheduledItemIds`, `deadlineConflict`, `baseVersion`, and `curriculumVersion`.

### POST /api/goal/workspace/continuation/plan/apply — authenticated
Atomically accepts and persists the previewed continuation plan into `goal.state.studyWorkspace.studyPlan` and marks `goal.state.studyWorkspace.continuation.suggestedPlan.accepted = true`.
- **Request Body**:
```json
{
  "expectedVersion": 3,
  "previewForDate": "2026-10-19",
  "curriculumVersion": "atlas-proof-v1",
  "availability": { "mon": 60, "tue": 0, "wed": 60, "thu": 0, "fri": 60, "sat": 0, "sun": 0 },
  "selectedItemIds": ["les_binary_search_01", "les_two_pointers_01"],
  "revisitItemIds": ["les_binary_search_01"],
  "targetDate": "2026-10-31",
  "previewToken": "eyJ..."
}
```
- **Validation**:
  - Rejects if `previewToken` signature is invalid or tampered with (409 `INVALID_PREVIEW_TOKEN`).
  - Rejects if `previewToken` belongs to a different student account (403 `FORBIDDEN`).
  - Rejects if `expectedVersion` does not match previewed baseVersion (409 `PREVIEW_VERSION_MISMATCH`).
  - Rejects if `selectedItemIds`, `availability`, `previewForDate`, `curriculumVersion`, or a supplied `targetDate` differ from previewed values (409 `PREVIEW_MISMATCH`). An omitted `targetDate` uses the signed preview date.
  - Falls back to server preview cache if `previewToken` is omitted.
  - A supplied `revisitItemIds` must exactly match the canonical preview list, or apply returns 409 `PREVIEW_MISMATCH` without mutation. Omitting the list preserves the authenticated preview flags. Older previews without this binding require regeneration (409 `PREVIEW_REQUIRED`).
- **Response**: HTTP 200 `{"data": {"goal": Goal, "studyPlan": SavedStudyPlan}}`

---

## Targeted Practice Session Extensions (Track B)

### Additive State Structure: `goal.state.studyWorkspace`

```json
{
  "activePracticeSession": {
    "sessionId": "11111111-2222-3333-4444-555555555555",
    "startedAt": "2026-10-21T09:00:00.000Z",
    "timeBudgetMinutes": 20,
    "title": "Targeted Reinforcement",
    "reason": "Reinforcing invariant evaluation.",
    "status": "in_progress",
    "currentTaskIndex": 0,
    "tasks": [
      {
        "taskId": "task_1",
        "activityType": "worked_example",
        "targetId": "les_arrays_01",
        "lessonId": "les_arrays_01",
        "exerciseId": "ex_arrays_01",
        "title": "Review Worked Example: Prefix Invariants",
        "topicId": "topic_arrays",
        "topicTitle": "Arrays & Hashing",
        "estimatedMinutes": 8,
        "reason": "You requested an example on this lesson.",
        "evidenceType": "viewed",
        "status": "pending",
        "baselineTimestamp": "2026-10-21T09:00:00.000Z",
        "baselineAttemptCount": 0
      }
    ],
    "replayReceipts": [
      {
        "updateId": "44444444-5555-6666-7777-888888888888",
        "timestamp": "2026-10-21T09:05:00.000Z",
        "status": "in_progress",
        "currentTaskIndex": 1,
        "completedTaskId": "task_1",
        "evidenceType": "viewed",
        "attemptId": null
      }
    ]
  },
  "practiceSessionHistory": [
    {
      "sessionId": "00000000-1111-2222-3333-444444444444",
      "startedAt": "2026-10-20T10:00:00.000Z",
      "completedAt": "2026-10-20T10:20:00.000Z",
      "timeBudgetMinutes": 20,
      "status": "completed",
      "tasksCount": 2,
      "completedTasksCount": 2,
      "viewedCount": 1,
      "verifiedCount": 1,
      "hintedCount": 0,
      "selfReportedCount": 0,
      "topicsCovered": ["topic_arrays"]
    }
  ]
}
```

- **Bounds & Retention**:
  - `activePracticeSession`: At most 1 active session at any time. Max 3 tasks.
  - `replayReceipts`: Capped at the 10 most recent update receipts within the active session.
  - `practiceSessionHistory`: Bounded array capped at maximum 5 compact session summaries (FIFO eviction).
  - Tasks count: between 1 and 3 tasks inclusive.
  - Total task estimated minutes sum MUST NOT exceed `timeBudgetMinutes`.

### POST /api/goal/workspace/practice-session/start — authenticated
Starts a new bounded targeted practice session and persists it into `goal.state.studyWorkspace.activePracticeSession`.

- **Request Body**:
```json
{
  "expectedVersion": 2,
  "sessionId": "11111111-2222-3333-4444-555555555555",
  "timeBudgetMinutes": 20,
  "title": "Reinforcement Session",
  "reason": "Targeted practice for Prefix Invariants.",
  "tasks": [
    {
      "taskId": "task_1",
      "activityType": "worked_example",
      "targetId": "les_arrays_01",
      "lessonId": "les_arrays_01",
      "exerciseId": "ex_arrays_01",
      "title": "Review Worked Example: Prefix Invariants",
      "topicId": "topic_arrays",
      "topicTitle": "Arrays & Hashing",
      "estimatedMinutes": 8,
      "reason": "You requested an example on this lesson."
    },
    {
      "taskId": "task_2",
      "activityType": "trace_retry",
      "targetId": "ex_arrays_01",
      "lessonId": "les_arrays_01",
      "exerciseId": "ex_arrays_01",
      "variantKey": "primary",
      "title": "Proof Trace: Best Time to Buy and Sell Stock",
      "topicId": "topic_arrays",
      "topicTitle": "Arrays & Hashing",
      "estimatedMinutes": 10,
      "reason": "Reinforce invariant evaluation."
    }
  ]
}
```

- **Validation Rules**:
  - `timeBudgetMinutes`: Must be 10, 20, or 30.
  - `tasks`: Array of 1 to 3 tasks. Task IDs must be unique within the session.
  - Total effort: Sum of `estimatedMinutes` across all tasks must be `<= timeBudgetMinutes`. (Throws `422 BUDGET_EXCEEDED` if exceeded).
  - Canonical target relationships:
    - `lessonId` must exist in published curriculum.
    - If `exerciseId` is specified, it must exist and belong to `lessonId` and `topicId`.
    - If `variantKey` is specified, it must exist in `exercise.variants`.
    - If `problemId` is specified, it must exist in published practice problems and match `topicId`.
    - For uncompleted lessons, prerequisites must be satisfied or the activity must be an eligible studied revisit.
  - Single active session constraint: If an active session already exists with a different `sessionId`, rejected with `409 ACTIVE_SESSION_EXISTS`.
  - Finalized protection: If `sessionId` exists in `practiceSessionHistory`, rejected with `409 SESSION_FINALIZED` (cannot resurrect finalized session).
  - Idempotency: Repeating with identical canonical fields and same `sessionId` returns HTTP 200 without version bump. Altered payload with same `sessionId` returns `409 SESSION_CONFLICT`.
  - Stale version: Returns `409 VERSION_CONFLICT` if `expectedVersion !== goal.version`.

- **Response**: HTTP 200 `{"data": {"goal": Goal, "activePracticeSession": PracticeSession}}`

### POST /api/goal/workspace/practice-session/update — authenticated
Updates task progress, pauses, completes, or abandons an active practice session.

- **Request Body**:
```json
{
  "expectedVersion": 3,
  "sessionId": "11111111-2222-3333-4444-555555555555",
  "updateId": "44444444-5555-6666-7777-888888888888",
  "status": "in_progress",
  "currentTaskIndex": 1,
  "completedTask": {
    "taskId": "task_1",
    "attemptId": "optional-uuid",
    "notes": "Studied the worked example."
  }
}
```

- **Authoritative Evidence Rules (Server-Enforced)**:
  - Client cannot dictate `evidenceType`. Evidence is derived strictly by the server:
    - `worked_example`: Always recorded as `viewed`.
    - `practice_problem`: Always recorded as `self_reported`.
    - `trace_retry` or `boundary_retry`:
      - Server checks `goal.state.studyWorkspace.exerciseAttempts[task.exerciseId]`.
      - Requires a fresh evaluated attempt saved AFTER `task.baselineTimestamp` matching `task.variantKey` (default `'primary'`).
      - If `attemptId` is supplied, it is resolved exclusively within fresh, matching-variant attempts saved after baseline. Any historical attempt (saved before baseline) or mismatched-variant attempt is rejected.
      - Authoritative classification:
        - If `attempt.outcome === 'independent'` and `mistakeCount === 0`: `verified`.
        - If `attempt.outcome === 'with_hint'` or `mistakeCount > 0` or `supported`: `hinted`.
      - If no matching fresh evaluated attempt is found: rejects completion with `422 UNVERIFIED_ATTEMPT` ("No fresh evaluated exercise attempt found for exercise <id> (variant: <variant>).").
  - Completion requirement: `status: "completed"` requires all tasks to be completed (`status: "completed"`). Incomplete tasks block completion with `422 INCOMPLETE_SESSION` (must finish all tasks or mark `status: "abandoned"`).
  - Finalization: When status is `completed` or `abandoned`, produces compact `sessionSummary`, appends to `practiceSessionHistory` (capped at 5), and clears `activePracticeSession` to `null`.
  - Replay receipts & idempotency:
    - Bounded `replayReceipts` (capped at 10) store canonical normalized payloads including `status`, `currentTaskIndex`, and `completedTask` (`taskId`, `notes`, `attemptId`).
    - If `updateId` matches a previously recorded receipt with an identical canonical payload, returns HTTP 200 with original data without version bump.
    - If `updateId` matches but any payload field differs (e.g. altered notes, attemptId, status, or task index), returns `409 UPDATE_CONFLICT`.
    - If `expectedVersion !== goal.version` and `updateId` is not in receipts, returns `409 VERSION_CONFLICT`.

- **Response**: HTTP 200 `{"data": {"goal": Goal, "activePracticeSession": PracticeSession | null, "sessionSummary": SessionSummary | null}}`
