# Weekly execution workspace — local delivery

Date: 2026-10-19. Branch: `codex/weekly-execution`. Local milestone complete: **3/3 stages**, zero remaining local acceptance tasks. No commit, push, merge or deployment was performed.

## Student-visible behavior

- New **Week** destination: desktop rail, mobile More, direct `/dashboard?view=week`, and View week in Today's accepted-plan card.
- Seven-day Asia/Kolkata agenda, previous/next week navigation, recorded/remaining filters, capacity and allocated minutes. Past unfinished allocations and later spillover are separate.
- Lesson, Proof and Practice Start buttons resolve the actual planned content. Starting only navigates; completion continues to use existing explicit learning actions.
- **Replan remaining work** carries forward unfinished and unscheduled activities, accepted availability and review intent. Students edit the checklist/capacity in the existing planner, preview, then explicitly accept. Preview/cancel leave goal state unchanged; acceptance replaces only the curriculum study plan.
- Empty, all-done and no-slot states remain honest. No sessions are invented for an empty plan. More than 40 pending activities is explained rather than silently truncated.
- Mobile layout uses a constrained grid; at the narrowest width navigation keeps readable text labels. The prior intrinsic-width expansion is addressed without hiding page overflow.

## Architecture and preserved boundaries

`weeklyExecution.js` derives calendar state using the existing `deriveActiveStudyPlanSession` completion rules; it does not invent another persistence schema or completion outcome. Split allocations share one activity's recorded completion. Replanning uses full estimated activity effort, since actual time spent per allocation is not recorded. That limitation appears in the UI.

`WeeklyPlanView.jsx` renders the derived agenda and delegates navigation/replanning. `DashboardPage.jsx` owns the optional replan seed, and `ContinuationPlanModal.jsx` merges the published pending content into its candidates while preselecting only that seed. The existing authenticated preview/apply API, CAS and signed-preview checks remain unchanged.

No server, database, curriculum, dependencies, environment/secret or production student data changes. All new browser mutations used isolated synthetic accounts. Existing starter completion/schedule preservation is asserted before and after accepting the replacement curriculum plan.

## Verification actually executed

Final command, app directory:

```powershell
./scripts/verify-continuation-release.ps1
```

Result: **PASS, exit 0**. Gate includes the new weekly browser suite.

| Check | Result |
| --- | --- |
| Server regression suite | 132/132 passed |
| Client regression suite | 97/97 passed |
| Production client build | Passed |
| Weekly execution integrated browser scenarios | 6/6 passed |
| Continuation failure-path integration | 5/5 passed |
| Continuation journey/responsive harness | 9/9 passed |
| Atlas & Proof harness | 9/9 passed |
| State isolation/geometry | All 10 scenarios passed |
| Starter workspace harness | 14/14 checks passed |
| Whitespace validation | Passed |

Six new unit cases cover IST year/midnight boundaries and accepted capacity; missed/current/future separation; unique counts for split activities; fresh review evidence; empty/no-plan state; and unscheduled work retention. The Week browser suite verifies direct URL, empty plan, actual content routing, pending/complete filters, no-mutation cancel/preview, explicit apply preserving starter history and review flags, unscheduled selection retention, all-done behavior, mobile More, four viewports and six appearances under reduced motion.

An initial full-gate run stopped at a legacy keyboard assertion expecting Roadmap to be the first More item. Week is now intentionally first. Expected first/next items were updated to Week/Roadmap; Escape, outside-click and destination-focus checks remain intact and passed in the final run. One permission-review launch timed out before execution; its single allowed retry launched the final gate successfully.

Evidence (ignored): `client/.local/weekly-release-gate.log`, `client/.local/weekly-execution-evidence/result.json`, and four `week-<width>.png` files in that directory. Desktop and 320px screenshots were inspected visually after the final UI adjustments.

## Owner walkthrough

1. Open the running labelled synthetic preview: `http://127.0.0.1:5173/dashboard?view=week`.
2. Use the existing synthetic account `student.completed@nextstep.local` / `password123` (these are local fixture credentials, not live Supabase credentials).
3. With no plan, choose Build my week, select activities/capacity, preview and accept.
4. In Week, use Remaining/Completed and date controls; Start opens the chosen content.
5. Replan remaining work, inspect carried-forward choices, then cancel or explicitly accept the preview. On mobile, Week lives in More.

The browser test's seeded missed-work example lives only in its isolated context; normal preview accounts are not silently preloaded with invented missed work. Production remains on the earlier deployed release until a separate publication action.

## Practical limits

Completion is recorded per activity, not per timed allocation. Replanning may add prerequisite work through the existing scheduler. Date offsets and visibility filters are session UI choices and reset on reload. The existing >500 kB production JS warning remains a non-blocking optimization backlog item. No new live deployment/provider verification was performed for this unpublished feature.
