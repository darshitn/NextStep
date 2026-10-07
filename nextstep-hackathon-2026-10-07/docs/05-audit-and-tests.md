# Audits and acceptance evidence

**Initial state: every app check below is NOT RUN.** This document is a test plan. The kit validator checks documentation/fixtures only. Nobody has built, tested, or deployed NextStep merely by generating this folder.

## Small audit after every gate

1. Owner runs the focused checks for changed behaviour.
2. Owner records actual command, exit/result, fixture or live context, and skipped checks in their handoff.
3. Other developer checks the interface at the gate: one normal case, one failure case.
4. Both say READY only when the cross-boundary check passes.
5. If an agent says “tested”, require commands/results; a green screenshot of a static page is not a database test.

Use [the audit prompt](../prompts/AUDIT-AND-RESUME.md) for an independent read-only review. In the same checkout, stop the editing agent before reviewing; do not launch overlapping agents that both mutate files.

## Server tests — Sankirth

Create focused Node tests for pure scheduling and HTTP behaviour; repository dependency injection is acceptable for route tests. Mocked persistence tests do not replace live RLS and refresh checks.

| ID | Test | Expected |
|---|---|---|
| S01 | Initial schedule fixture | Exact dates in SCHEDULER.md |
| S02 | Zero/invalid availability, invalid date, reversed dates | 422 / pure validation failure; no hang |
| S03 | Required order | No successor before prerequisite in schedule |
| S04 | Fixed target insufficient | All work retained; original target unchanged; warning |
| S05 | Flexible recovery | Proposed target extends only if needed; pending work moved |
| S06 | Completed work preserved | Event content/timestamps unchanged after recovery |
| S06b | Work already completed today | Its minutes consume today's revised capacity; no extra overload today |
| S07 | Duplicate completion | Exactly one completion, 20 XP, no second write |
| S08 | Concurrent writes | Stale update rejected; completion not lost |
| S09 | Preview is read-only | Repository update/insert call count stays zero |
| S10 | Invalid/absent JWT and auth outage | 401 for invalid; 503 for service outage |
| S11 | Allowed/disallowed origin, OPTIONS | Valid preflight succeeds before auth; unwanted browser origin rejected |
| S12 | Unexpected DB error | 503/sanitized error; no false success |
| S13 | Unknown route / malformed JSON | JSON 404 / JSON 400 |
| S14 | Local date boundary / old preview date | Correct Asia/Kolkata day; 409 stale preview |
| S15 | Two creation retries with same ID | One goal; repeat response 200; different ID gets 409 |

Required scaffold command: from server/, `npm.cmd test`. Record exact test totals from the actual runner; do not prefill them here.

## Client checks — Darshit

From client/, `npm.cmd run build` must pass. Then in a browser:

- [ ] Empty account shows setup rather than a broken dashboard.
- [ ] Invalid form input is explained; server validation remains authoritative.
- [ ] Loading and disabled buttons prevent repeated submissions.
- [ ] Save success happens only after the successful response.
- [ ] 401 returns to sign-in; 409 clears preview/reloads; 503/network failure retains inputs.
- [ ] Goal, XP, and completed mission survive refresh.
- [ ] Recovery before/after shows moved work and any changed target explicitly.
- [ ] Cancel preview makes no state change.
- [ ] Applying recovery preserves completed cards and reflects new dates.
- [ ] Production has no FIXTURE MODE or silent fallback.
- [ ] Keyboard can reach controls; modal has labels/focus; narrow layout does not clip core actions.

## Live database / two-account checks — both

Use two synthetic accounts in two separate browser profiles/incognito contexts. Do not share a mutable server Supabase session.

1. Account A creates a goal; record its ID privately in test notes.
2. Account B GET /api/goal returns null or B's goal, never A's.
3. With B's user session, a direct Supabase select filtered by A's ID returns no row; direct update of that row affects zero rows. Use a temporary local test helper; never put tokens in shell history or durable reports.
4. Unauthenticated Data API calls cannot read/write the table.
5. A logs in on a second context and sees A's saved state after reload.
6. Two tabs submit against the same version: one succeeds; the stale write fails or an already-completed response is returned as specified. Verify no duplicated XP/lost completion.

Record LIVE PASS/FAIL separately from mocked tests. Dashboard SQL as admin is not an RLS test.

## Deployment acceptance — all must pass for a cloud claim

- [ ] Vercel page loads over HTTPS.
- [ ] Render health responds on correct service/version.
- [ ] Browser sign-in uses the intended Supabase project.
- [ ] Browser Network shows API requests to Render, no localhost/mixed content.
- [ ] Create/read/complete/recovery preview/apply work through the deployed UI.
- [ ] Reload retains state; a second account is isolated.
- [ ] Open browser Console shows no unresolved errors in the demo path.
- [ ] Harshita records a successful run, with time and release commit/identifier.

## Evidence labels

Use exactly one per claim: PLANNED, FIXTURE DEMO, AUTOMATED PASS, LOCAL LIVE PASS, DEPLOYED LIVE PASS, FAILED, NOT RUN. Preserve a brief limitation next to each. “Works” alone is not an evidence label.

## Verification log format

```text
Gate / date / owner:
Environment: fixture | local live | deployed live
Command or exact interaction:
Expected / actual:
Evidence path or sanitized screenshot:
PASS / FAIL / NOT RUN:
Remaining limitation:
```

Keep secrets and private student data out of screenshots and logs. Do not commit recordings containing account passwords or open provider API-key pages.
