> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Frozen interface: NextStep API v1

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
- Client timeout: 20 seconds, display retry/manual recovery; Render cold start may take longer. Wake the service before judging.

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

## Client integration obligations

- One `client/src/lib/api.js` adapter adds base URL, access token, JSON handling, and error translation.
- Refresh the displayed goal after save using the returned goal; no speculative permanent XP.
- Disable duplicate submissions while pending; show API errors near the relevant control.
- On 401 show session-expired/sign-in. On 409 reload the goal and invalidate any preview.
- On network error retain the form, show failure, allow explicit retry/load-current-state.
- Fixture-only development must carry a visible FIXTURE MODE badge and be disabled for production builds.
