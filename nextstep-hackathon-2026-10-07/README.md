# NextStep — hackathon field guide

> **Current entry point: [START-HERE.md](START-HERE.md).** NextStep is locked under Personalized AI Experiences. Darshit owns UI implementation; Sankirth owns integrations/APIs including the client adapters; Harshitha owns demo/presentation. Runtime AI is now required. The detailed guide below is earlier reference material; its scope and prompts are superseded where they conflict with START-HERE. Use [the 23-section master prompt](prompts/NEXTSTEP-MASTER-PROMPT.md) for Antigravity; it replaces earlier role-prompt sequences.

**7 October 2026 · 9 a.m.–4 p.m. IST · two interrupted developers + one presentation owner**

> Big goals. A doable today. A way back after a break.

This folder is a planning and handoff kit, not an implemented application. Platform accounts, app packages, migrations, and deployments still need to be created by the implementation team. Every app test starts as **NOT RUN**. No cloud service has been configured by creating this kit.

## Start here: ten-minute team meeting

1. Darshit and Sankirth open [scope](docs/01-product-scope.md) and agree to the essential tier.
2. Read [the sync gates](docs/02-team-sync.md) together. Appoint Sankirth integration captain; Harshita maintains the deadline and presentation.
3. Confirm the repo and accounts using [setup](docs/03-platform-setup.md). The existing parent Git repository has deleted tracked files: do not stage those accidentally.
4. Freeze [API v1](contracts/API-V1.md). This is the shared frontend/backend agreement.
5. Each developer opens their own Antigravity checkout and their role guide. Do not put two editing agents in the same working directory.
6. Start only the first prompt for your role. Pass the next gate before moving to dependent work.

## Read only what you need

| Person / need | Entry point |
|---|---|
| Darshit: product, frontend, UX | [Darshit's guide](roles/DARSHIT.md) + [Darshit's prompts](prompts/DARSHIT-ANTIGRAVITY.md) |
| Sankirth: backend, database, integration, deployment | [Sankirth's guide](roles/SANKIRTH.md) + [Sankirth's prompts](prompts/SANKIRTH-ANTIGRAVITY.md) |
| Harshita: narrative, visual assets, presentation, evidence | [Harshita's guide](roles/HARSHITA.md) + [pitch and demo](presentation/PITCH-AND-DEMO.md) |
| Everyone: who waits for whom? | [Sync gates and dialogue](docs/02-team-sync.md) |
| Starting local servers / linking providers | [Platform setup](docs/03-platform-setup.md) |
| A red terminal or failed browser request | [Troubleshooting](docs/04-troubleshooting.md) |
| Is a milestone actually complete? | [Audit and acceptance](docs/05-audit-and-tests.md) |
| Publish and rehearse | [Release runbook](docs/06-deployment-and-release.md) |
| Scheduling / database rules | [Architecture](contracts/ARCHITECTURE.md), [scheduler specification](contracts/SCHEDULER.md) |
| Resume after mentoring | Your file under [handoffs](handoffs/DARSHIT.md); read the other developer's file before resuming |
| Official references | [Sources](docs/07-sources.md) |
| What was verified when this kit was created? | [Kit verification](docs/08-kit-verification.md) |

## Scope in one sentence

One DSA starter track → availability-based mission schedule → record progress → reduce availability → preview and accept a revised plan → refresh and see it saved.

**Realistic budget:** approximately 150–180 focused minutes per developer, with extra debugging reserve where mentoring permits. These are planning estimates, not guarantees. If either developer has less than two hours, apply the cuts in the scope guide immediately.

## Folder layout

- `docs/`: scope, coordination, setup, troubleshooting, verification, release, sources.
- `roles/`: personal instructions and completion checklist.
- `contracts/`: frozen API, architecture, and scheduler behaviour.
- `fixtures/`: synthetic catalogue and example request. These are planning inputs, not live student data.
- `prompts/`: one bounded Antigravity task at a time.
- `presentation/`: pitch, demo, Q&A, evidence checklist.
- `handoffs/`: append-only progress and evidence per person.
- `templates/`: environment examples and a draft SQL migration for review.
- `scripts/`: kit validator and read-only workstation preflight.
- `client/`, `server/`: **created later by the implementation agents**.

## Run now vs run later

These commands work on this kit before an app exists:

```powershell
Set-Location 'D:/Projects/BuildToShip/nextstep-hackathon-2026-10-07'
node scripts/validate-kit.mjs
node scripts/preflight.mjs
```

`npm run dev`, `npm test`, and `npm run build` are future scaffold contracts. Do not run them in this folder now: there is no root package.json. Each agent must create and verify the scripts listed in their guide before handing off.

After the API exists, use `node scripts/preflight.mjs --check-api`. For a deployed service, add `--api-base https://YOUR_ACTUAL_RENDER_ORIGIN`. The optional PowerShell script is provided only for machines that already permit local scripts; Node is the default to avoid execution-policy friction.

## Final submission requires

- The Vercel URL works in a normal browser.
- Render handles the actual scheduling and writes.
- Supabase retains the goal after reload and isolates different users.
- Recovery visibly changes the plan without removing completed work.
- Harshita can explain exactly what is live, self-reported, synthetic, and planned.

No guarantee of winning or improved long-term student retention is implied. Present a working pilot and a testable hypothesis.
