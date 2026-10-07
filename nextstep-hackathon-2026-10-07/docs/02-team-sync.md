> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Team coordination: gates, dialogue, and interruptions

## People and decision rights

| Person | Owns | Does not wait on Harshita for |
|---|---|---|
| Darshit | Client, UX, product scope, browser integration | Colours, copy, assets: use the approved plain defaults |
| Sankirth | Server, Supabase, API correctness, release integration | Backend logic, schema, provider configuration |
| Harshita | Story, user interviews, pitch, screenshots, rehearsal, deadline | Implementation work; she has no coding milestone |

Sankirth is the integration captain. Darshit resolves product cuts. Harshita announces the freeze and records what is demo-ready. Both developers must pass their personal audit before offering a gate.

## Schedule by deliverables, not imaginary uninterrupted hours

Reserve roughly 150–180 focused minutes per developer and use remaining calendar time as interruption/debugging reserve. These budgets can overrun. Keep four 5-minute syncs: initial agreement; first API/client connection; core-loop verification; feature freeze. If both are busy mentoring, post the handoff instead of scheduling a long meeting.

| Gate | Darshit delivers | Sankirth delivers | Passing evidence / dependency |
|---|---|---|---|
| G0: agreement | Accept API and UI states | Accept data and scheduler rules | Both write `G0 accepted, API v1` in their handoffs |
| G1: foundations | Client shell + login + health call; ~25 min | Server health + Supabase/table/accounts; ~35 min | Client can reach API; login token accepted; missing token rejected |
| G2: first vertical slice | Goal setup + render returned plan; ~35 min | POST/GET goal + scheduler + persistence; ~45 min | Create once, reload, same goal/dates; second account isolated |
| G3: product loop | Complete mission + recovery preview/apply UI; ~45 min | Idempotent completion + recovery + version check; ~45 min | Completion survives reload; preview doesn't write; Apply does |
| G4: release | Production browser checks + responsive fixes; ~30 min | Provider deployment/config + negative checks; ~30 min | Real Vercel → Render → Supabase flow; no production mocks |
| G5: presentation | Demonstrate as operator | Technical Q&A + release check | Harshita runs 2 rehearsals, records backup, stores submission URL |

## The required dialogue

### G0 → G1

Darshit: “I accept API v1. I own client only. I will make the UI against the agreed shape while you prepare the service.”

Sankirth: “I accept it. I own server/database. I will send the health URL and auth readiness. Do not guess new response fields.”

Harshita: “I am preparing the story and screenshots checklist. I will label everything unbuilt until you show it working.”

### If Darshit finishes first

Darshit: “D1 READY. UI shell and fixture states pass. Live API is WAITING for S1. I have not claimed integration.”

Sankirth: “S1 is still in progress. Keep your API adapter unchanged. You may improve labels and keyboard navigation; wait before wiring the goal routes.”

Darshit may polish owned static states or rehearse the pitch. He does not implement a competing backend.

### If Sankirth finishes first

Sankirth: “S1 READY. Health passes; authenticated goal GET returns null; invalid token returns 401. Darshit, connect your client and return the Network result.”

Darshit: “I am mentoring for 15 minutes. Resume note is saved. Please audit your scheduler tests while I am away.”

Sankirth may work on pure scheduler tests and documentation. He waits for Darshit's browser result before declaring G1 complete; he does not edit Darshit's UI.

### Passing G2

Darshit: “I created a goal through the browser and reloaded. Same ID and dates returned. Here are URL, HTTP status, and screenshot, with tokens hidden.”

Sankirth: “The row exists under the correct user. Second-user access check passed. G2 accepted. You can wire completion and recovery now.”

### Change request

Sankirth: “I propose adding field X for reason Y. API v1 currently says Z. Please acknowledge before I change it.”

Darshit: “Accepted / not accepted. If accepted, update the contract and example first; I will update my adapter in D2.”

No silent renames, status-code changes, timezone changes, or new global package files.

### Passing G3 / release

Darshit: “Complete → preview → apply → refresh works against your real API. Duplicate completion doesn't increase XP. G3 browser evidence is in my handoff.”

Sankirth: “Version conflict and RLS tests pass. G3 accepted. Feature freeze starts; I will configure deployment.”

Harshita: “Send the exact deployed URL and confirmed limitations. I will capture the demo and stop using placeholder screenshots.”

## Mentoring interruption protocol — 60 seconds

Before stepping away, append to your own handoff:

```text
Time / milestone:
Last passing command or interaction:
Files being edited:
Server terminal/PID and whether it should remain running:
Next exact action:
Waiting for:
Do not touch:
```

Stop the agent at a safe milestone or leave one explicitly bounded task. Do not leave a broad “finish everything” agent running. On return, read your handoff and the other developer's most recent one before starting another agent.

## Git synchronization

Use separate local checkouts of the same human-approved repository. The project lives in `nextstep-hackathon-2026-10-07/` under the parent Git root. Do not initialize Git inside it.

Human branch choices: `codex/nextstep-client` and `codex/nextstep-server`. Sankirth integrates reviewed milestone commits into the agreed integration branch. Never run a pull/rebase/merge over dirty work. Commit only owned reviewed paths when you choose to publish a milestone; never `git add .` in the parent root because it contains old deletions.

Example human-only staging after reviewing changes:

```powershell
git status --short
git diff -- nextstep-hackathon-2026-10-07/client
git add -- nextstep-hackathon-2026-10-07/client nextstep-hackathon-2026-10-07/handoffs/DARSHIT.md
git diff --cached --stat
```

Inspect the staged diff for secrets and unrelated changes before choosing to commit. Record commit IDs in handoffs; do not put credentials into Git. Both developers own separate package-lock files. Integration captain handles a shared contract conflict only after both agree.

## Clock-time stop rules

- By 11:30 aim for G2; if not, cut polish and focus on connectivity.
- By 1:30 aim for G3; if not, stop new features and pair on one failing request.
- At 2:15 feature freeze, even if the planned UI is incomplete.
- By 3:00 target one successful deployed rehearsal.
- 3:00–4:00 is demonstration/submission reserve, not a new-feature window.

If mentoring shifts those milestones, use the last passing gate and scope cuts. Never represent an unfinished gate as passed to stay on schedule.
