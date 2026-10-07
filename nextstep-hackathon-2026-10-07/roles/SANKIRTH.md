> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Sankirth — integration captain

## Your responsibility

Own server/**, database/**, Supabase, Render, Vercel settings, and the shared release. Make the platform chain work early. Darshit owns client files; request client changes through the contract and handoff instead of editing his working tree.

## Before starting

1. Read scope, API v1, architecture, scheduler, and setup guide.
2. Verify provider access and actual repo/branch. Record local paths and public URLs only.
3. Confirm Node versions with Darshit and G0 contract acceptance.
4. Use your own checkout and paste Common Start + S1 from your prompt file.
5. Privately create the dedicated Supabase project/accounts and review/apply the migration when S1 prepares it. No service-role key is required.

## S1 — foundation and real read

Create Express package, health/catalog, JWT validation, per-request Supabase client, RLS migration, GET goal, JSON errors, and CORS. Copy catalogue into server/data. Confirm scripts dev/start/test. Keep service independent of parent repo packages.

Acceptance: health 200, catalogue 200, invalid/absent session 401, authenticated fresh account GET goal null, OPTIONS allowed before auth. Send Darshit health URL and contract confirmation. Wait for his browser connection evidence before declaring G1 passed. While waiting, write pure scheduler tests.

## S2 — initial planning and persistence

Implement pure scheduler, create validation, singleton-goal creation retry, and row version handling. Use exact fixture dates from SCHEDULER.md. Agent writes focused tests; you inspect output.

Acceptance: create + GET saves full twelve-entry plan, same creation ID retry does not duplicate, invalid input rejected, user ownership verified. Ask Darshit to prove refresh persistence from his UI. Accept G2 only with that evidence.

## S3 — completion and recovery

Implement idempotent completion, prerequisite enforcement, XP derivation, read-only preview, and CAS Apply. Check fixed/flexible behaviour and completed work preservation. Do not add an AI dependency or new schema to solve a UI-only problem.

Acceptance: server tests pass; two racing writes cannot lose progress; preview never writes; stale preview rejected. Send response examples and server test output to Darshit. Wait for his completion/recovery browser test before G3 acceptance.

## S4 — release owner

Follow deployment runbook. Configure root directories precisely. Publish only reviewed owned changes through the agreed human Git workflow. Coordinate Darshit's Vercel environment/build. Watch logs while he runs the production path. If a request fails, investigate its exact URL/status rather than changing all CORS/auth settings.

## Your gate announcement

```text
S[n] READY / WAITING
API v1 unchanged / agreed revision:
Local or deployed URL:
Automated command + actual results:
Live DB/auth checks:
What remains unverified:
Darshit can now perform:
```

## During interruptions

Leave server terminal/PID in your private handoff, save current milestone, and stop broad agent work. If Darshit is waiting, give a concrete next readiness condition. He may polish UI but should not replace your server implementation.

## Technical Q&A

Explain the planner as a deterministic allocation of ordered missions into available daily capacity. Explain the one-row JSONB tradeoff and versioned updates. Explain that Supabase Auth + RLS isolate users, Render owns business rules, Vercel serves the client, and Antigravity accelerated implementation. Distinguish automated tests from live deployed checks.
