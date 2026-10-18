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
  "knowledgeCheckOptionId": "kc_les_hashing_01_b"
}
```
- Server validates `lessonId` and `topicId` against published curriculum, grades `knowledgeCheckOptionId` server-side against authoritative curriculum, enforces `requestId` idempotency (identical retry returns 200 without version bump; conflicting payload with same `requestId` returns 409 `REQUEST_CONFLICT`), and updates `studyWorkspace.lessonProgress[lessonId]` with CAS.
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
  "reflection": "Forgot that index 1 value 5 stays in the set when index 2 is checked."
}
```
- **Authoritative Grading**: Server grades every `stepAnswer` and `edgeChoiceId` against the authoritative (answer-key-bearing) curriculum. Incomplete traces or incorrect choices are rejected with HTTP 422 (`VALIDATION_ERROR`).
- **Authoritative Outcome Derivation**: Regardless of the client-supplied `outcome`, the server normalizes the outcome:
  - `needed_reference` if `referenceRevealed` is true.
  - `with_hint` if `hintRevealed` is true or `mistakeCount > 0`.
  - `independent` only if zero mistakes, no hint, and no reference reveal.
- **CAS & Idempotency**: Computes server-assigned `savedAt` and `nextReviewDate` in `Asia/Kolkata`, caps history at 20 attempts per exercise, and enforces `attemptId` idempotency (identical retry returns 200; altered payload with same `attemptId` returns 409 `ATTEMPT_CONFLICT`).

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
