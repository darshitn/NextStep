# First-session journey: independent local review

Date: 2026-10-19. Implementation report reviewed against the current dirty checkout. Existing check-in and slider work was preserved; no publication was authorized for this checkpoint.

## Corrections made directly

- Guide navigation now waits for React to render the requested mode, then scrolls and focuses the actual question control. Previously Predict/Check queried hidden or unmounted controls immediately after changing mode; exercise-free Check targeted a heading that did not exist in that view. Pending navigation is cancelled if the selected lesson/input changes. Reduced motion is respected.
- Trace save confirmations, notices, errors and the guide's saved indicator now resolve the selected input variant. A primary save no longer labels an untouched alternate input as saved.
- Next-lesson actions use the real selection callbacks instead of referring to an undefined `onOpenProofLesson` identifier. A shared, tested helper skips the current lesson, completed lessons and lessons with unmet prerequisites, using the same lesson-prerequisite rule as the existing recommendation helper.
- Removed new conditional hooks below the empty-lesson return so empty catalog recovery does not change the component's hook order.
- Success copy now explicitly keeps written notes optional.

## Durable regression evidence

The first-session browser harness now asserts actual focus movement, not just that a heading exists. It injects a failed trace save, verifies selections and save eligibility survive, retries successfully, and checks primary/alternate save-status isolation. Exercise-free Check is exercised through Learn mode. Responsive tests now assert document width in addition to saving screenshots.

Added a unit test against the production next-eligible-lesson helper, including completed, locked and unavailable-catalog cases.

Focused first-session browser rerun: **6/6 passed**, zero uncaught page errors. Desktop first-session Today and mobile Proof screenshots visually inspected. A fresh synthetic first-time account also passed 390px and 320px invitation/action width checks; the 320px screenshot was inspected visually.

## Release verification

`scripts/verify-continuation-release.ps1` passed all **12 groups**, exit code 0: server **135/135**, client **107/107**, production build, Week **6/6**, continuation failure integration **5/5**, continuation **9/9**, Atlas/Proof **9/9**, check-ins/sliders **4/4**, first session **6/6**, state isolation **10/10**, workspace **14/14**, and whitespace validation.

Full gate log: `client/.local/first-session-independent-release.log`.

After that gate, a final navigation cleanup made each guide destination single-use so it cannot steal focus when returning to a previously selected lesson. The browser harness now asserts the lesson picker retains focus on return; its final rerun passed **6/6**. Client tests and production build were rerun for that final cleanup; their logs are `client/.local/first-session-final-client.log` and `client/.local/first-session-final-build.log`. The full gate preceded this final cleanup; it was not rerun a second time.

The production bundle still exceeds Vite's 500 kB chunk advisory. This is a non-blocking existing performance backlog item, not a build failure.

## Scope

All browser accounts are isolated synthetic fixtures on `http://127.0.0.1:5173`. This does not establish live Supabase persistence or a deployed release. No credentials, environment settings, curriculum content, database schema or dependencies were changed. Work remains uncommitted and unpushed.
