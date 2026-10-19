# Continuation local release checkpoint — 2026-10-19

Decision: **local repair milestone complete; ready for a publication checkpoint.** This is not a claim that the new branch is deployed or production-authenticated. Three local stages complete: scoped repair, integration verification, delivery. No further repair prompt is required for review-3 findings I1–I3.

## Why the repair loop happened

Earlier checks proved individual helpers/routes and happy-path fixture journeys while missing the joins between them: the modal's catalog argument, the schedule's revisit intent, and a draft write overlapping evaluation. Passing counts were repeatedly used as stronger completion evidence than they supported. Review and implementation were also being handed back and forth instead of keeping one owner responsible through acceptance.

The response is a frozen release scope, direct repair of reproduced failures, permanent integrated regressions and a single release command. Cosmetic improvements or speculative risks do not restart the milestone. New reproducible correctness/data-loss failures still block publication; non-blocking work goes into the backlog.

## Repairs delivered

1. `ContinuationPlanModal.jsx` passes the full catalog to the review queue. Due reviews now appear as selectable candidates next to eligible new learning.
2. `goal.js` binds effective revisit IDs into signed preview data and returns them to the client. Applying altered flags returns `PREVIEW_MISMATCH` without mutation. Omitted flags preserve authenticated preview intent. The fixture adapter follows the same acceptance rules. CP25 and C14 cover changed, omitted and matching flags.
3. `FoundationsCheckpointModal.jsx` waits for the current draft queue before capturing the submission version. It retains immutable finalized content on ambiguous retries. A genuine version conflict exposes **Refresh workspace version**, which preserves local answers and updates concurrency metadata explicitly instead of resending a permanently stale version. Busy controls prevent overlapping input mutations while submitting.
4. Added `verify-continuation-integration.cjs`: five isolated fresh-context browser scenarios, with explicit assertions that injected failure modes actually ran. It covers visible due review selection, rapid answer persistence, submit during delayed save, a dropped finalized response, and actual conflict/recovery. Existing authored content was not changed.

## Executed acceptance gate

From the app folder, with the labelled synthetic preview running:

```powershell
./scripts/verify-continuation-release.ps1
```

Optional parameters: `-PreviewUrl http://127.0.0.1:5173 -PlaywrightModule <installed-playwright-path>`. The gate refuses non-loopback targets, stops on a failed command and performs no publication or production-data operations. The default Playwright location is specific to this machine; other machines should supply their installed module path.

Actual result: **PASS**, exit 0.

| Check | Result |
| --- | --- |
| Server regressions | 132/132 passed |
| Client regressions | 89/89 passed |
| Production client build | Passed |
| New failure-path browser integration | 5/5 passed |
| Continuation journey / responsive harness | 9/9 passed |
| Atlas & Proof harness | 9/9 passed |
| Browser state-isolation / geometry harness | All 10 scenarios passed |
| Starter workspace harness | 14/14 passed |
| Git whitespace check | Passed |

Ignored complete execution log: `client/.local/continuation-release-gate.log`. Continuation screenshot evidence: `client/.local/continuation-evidence/2026-10-19T05-33-13-214Z/`. Workspace screenshot evidence: `.local/workspace-evidence/2026-10-19T05-34-04-159Z/`.

These checks exercise mocked Express persistence and labelled browser fixtures. Live Supabase authentication/RLS/provider behavior and new production deployment are separate checks. The curriculum validator was not rerun in this final patch because no curriculum/fixture content changed; the server curriculum regression suite passed and collaborator-owned curriculum paths have no diff.

## Publication and backlog boundaries

No commit, push, merge, deployment, migration, dependency installation, environment/secret inspection or production-data operation occurred during this repair. Existing owner changes remain uncommitted on `codex/starter-continuation`. The latest owner request authorized direct repair after the earlier delegated CLI attempt stalled; the old CLI run was not resumed. Existing work and starter history were preserved.

Publication can now be handled as one scoped release checkpoint, followed by deployed version/authenticated smoke verification. Do not interpret fixture success as live success. For multiple server instances, follow the existing stable private preview-signing-secret runbook; do not print secret values.

Non-blocking backlog (does not reopen this local milestone): production JS chunk-size optimization; stronger content-version mutation coverage beyond ordinary historical retry tests. New feature proposals belong in the next milestone, rather than being folded into this repair.

## Five-minute owner check

Open the labelled preview at `http://127.0.0.1:5173` using the synthetic completed account. Complete/reopen the checkpoint, change the activity checklist/availability, preview and accept a plan, and open its next activity from Today. Starter evidence remains 12/12. Synthetic account credentials are the existing local demo credentials; no production credentials are needed. The automated gate already exercised save timing and network uncertainty.
