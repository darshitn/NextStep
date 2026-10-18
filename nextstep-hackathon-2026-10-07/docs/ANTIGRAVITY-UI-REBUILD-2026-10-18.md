# NextStep UI correction prompts — execute sequentially

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.
Current shared baseline: `d09e77c` on `codex/atlas-proof-baseline`.

Use one editing session in this checkout. Do not run prompts simultaneously or switch models silently. Select the named model in the IDE before each task. Start a local UI branch such as `codex/ui-workbench` if the current checkout is clean except for audit planning documents; preserve all uncommitted work. Do not move the collaborator's branch or edit their checkout. User has requested prompts here, not an automatic new publication.

## Shared instructions for every prompt

Read `AGENTS.md`, `START-HERE.md`, `docs/COLLABORATION-CHECKPOINT-2026-10-18.md`, `docs/UI-AUDIT-2026-10-18.md`, and actual code before edits. Follow current contracts. Audit screenshots are local under `client/.local/ui-audit-2026-10-18/`; if missing, regenerate equivalent synthetic captures. Use the real rendered UI, not just source inspection.

Preserve the original 12-mission goal and existing saved progress, recall history, new studyWorkspace, CAS and idempotency contracts, server grading, source attribution, explicit reference reveal, export and recovery preview/accept. Do not expose answer keys, fake saves, add fake metrics or weaken tests. Use synthetic data. No live credentials, personal account mutation, environment edits, database migrations, major dependencies, package upgrades, production deployments, automatic commits/pushes or resets. Use existing React/Router/Lucide/CSS. The collaborator owns `server/data/curriculum/**` and curriculum reference tests: do not edit them. If a shared schema/API change is necessary, propose it and finish independent frontend work first.

Bound repeated failing approaches to two focused attempts, record exact blockers and continue only independent authorized work. Permission or quota failure is not permission to bypass limits. Reports must distinguish passed tests, manual inspection, same-agent claims and unverified live behavior.

## Prompt A — Gemini 3.8 Flash, Medium: make preview and UI verification trustworthy

Implement only the bounded test/preview repairs below. Do not redesign the application in this task.

1. `client/scripts/start-synthetic-preview.mjs`: bind to `127.0.0.1`; validate the optional port value and print the actual listening URL. Keep synthetic mode clearly labelled. Keep fixture interception exact to the intended module path. Normal dev/production must continue using live services. Check that the preview starts from the documented working directory and an occupied port reports a usable actual URL or a clear error.
2. `client/scripts/verify-atlas-proof.cjs`: fix the failure at line ~219 caused by reading `.choices.find(c=>c.isCorrect)` from the sanitized catalog. Assert student-safe payloads remain key-free. Select expected answers using stable authored semantic data or test-only authoritative imports in the Node test process. Never inject answer keys into the browser's public catalog. Do not skip the trace flow or weaken correctness assertions. Update assertions for current lesson content; don't blindly retain stale sorted-deduplication reflection text for a stock-profit exercise.
3. Make isolation tests reproducible: fresh test contexts/profile per run, bounded startup and evaluation waits, actual console/page-error collection, screenshot capture on failure, cleanup of only test-owned processes. The current CDP harness's reused profile meant the audit started already signed in. Prefer extending the existing Playwright infrastructure over another browser protocol client. Do not kill all node/Chrome processes.
4. Cover all seven views at 1440/1024/390/320 widths; all six themes; reduced motion; active/interrupted/new onboarding; ready and empty review/practice filter states; exercise/lesson drafts, no-exercise lesson, evaluation failure/retry and delayed responses, refresh/back/deep links. Add completed/partially completed synthetic states where needed. Record any incomplete matrix explicitly. Avoid claiming all possible conditions are verified.

Allowed: `client/scripts/**`, a small optional preview script entry in `client/package.json`, and `docs/UI-PLUMBING-RESULT.md`. Fixture edits only when needed for explicitly labelled QA states; no changes to backend/content/schema. Don't add packages.

Run existing client/server tests, build, content validator and both UI harnesses as appropriate. The source-harness changes need executed browser evidence, not only syntax checks. Save screenshots/results under ignored `.local/`. Finish with `docs/UI-PLUMBING-RESULT.md`, exact executed commands/results and the actual local preview URL. Stop before Prompt B.

## Prompt B — Gemini 4 Argon: rebuild the frontend as a coherent interactive workbench

You are implementing a product UI redesign based on observed running-app problems, not adding new backend features. Read the shared instructions and completed Prompt A report. Keep the existing theme palettes but replace the current repetitive card composition with a coherent layout.

Diagnosis from actual browser measurements: Proof ~7,174px tall at 390px; Practice ~45,037px tall at 390px and ~51,579px at 320px; mobile navigation consumes four rows before content; Atlas is a grid labelled a map and places mobile topic details after all 12 cards. These are baseline observations, not arbitrary scores to optimize by shrinking fonts or hiding all content.

### Visual direction

Use an intentional learning workbench: compact app chrome, calm neutral surfaces with one primary accent, clear current location and next action, reading text around 14–16px, purposeful hierarchy, sparse structural borders and generous but economical spacing. Avoid a container around every paragraph, repeated badges, decorative scores, gratuitous gradients and gigantic hero copy. Use existing installed fonts and icons. Keep metadata secondary and teaching content readable. Short display labels can be UI aliases; do not rename published content IDs or edit the collaborator's curriculum source.

Smooth interaction means predictable opening/selection, state changes and continuation—not auto-animation. Use 150–250ms transitions for panel selection, trace movement/highlight and disclosure. Honor reduced motion, no looping effects or interaction-blocking delays. Do not introduce hidden game mechanics or auto-completion.

### Stage B1 — Shell and focused Proof studio

- Compact desktop rail with clearly distinguished current page vs keyboard focus. At mobile widths, use an accessible primary navigation and More menu or compact menu with current location. All seven routes remain discoverable. Aim for no more than ~100px persistent header/navigation combined at 390px, excluding opened menus. No horizontally clipped tiny tabs. Keep keyboard focus, escape/return and active labels correct.
- Reorganize Proof into explicit Learn / Trace / Reflect modes or steps. A lesson with a trace offers immediate Trace access; a lesson without one offers Learn and reflection with a meaningful empty trace state. Preserve old links and selected lesson/topic semantics.
- Desktop Trace mode shows current code and state/prediction together; mobile prioritizes input/state -> question -> response -> feedback -> next step, with code accessible on demand. The first actionable prediction must be reachable in the initial viewport or within one short scroll at 390x844. Don't place the full lesson above it.
- Keep overview/objective short and expand reading material intentionally. Treat code-like fragments in text safely; no raw Markdown backticks in polished prose and no unsafe HTML rendering.
- Keep lesson check, exercise boundary check and reflection saves distinct. Preserve per-item/variant drafts, pending IDs, retry, assisted outcome provenance, server grading and stale-response guards. Navigation must not accidentally save another item's text. Keep all reference/hint actions explicit.
- No sticky action bars covering content; if using one, reserve space and test focus/virtual keyboard behavior. Finishing a step should clearly advance or focus the next step, respecting user control.

Gate: inspect screenshots at 1440/1024/390/320, keyboard traversal, failure/retry, a no-trace lesson and A/B draft switching. Run relevant tests/build. Fix regressions before B2; update `docs/UI-REBUILD-PROGRESS.md`.

### Stage B2 — Atlas and Practice

- Atlas: show compact topic stages/path structure derived from actual prerequisite data. A real connection diagram can use native SVG/HTML with accessible controls; provide a semantic list alternative. Do not fake new relationships or mastery. A grouped path is preferable to a pretend graph with inaccurate edges.
- Selecting a topic reveals useful details near the selection. Desktop may use a compact inspector; mobile must not require scrolling past every topic to inspect one. Use an accessible in-flow detail or controlled sheet with correct focus behavior. Keep actual progress and prerequisite details available on demand.
- Recommendation panel stacks cleanly on mobile; title gets useful width and CTA follows. Avoid the current ~140px title column beside a large button.
- Separate the legacy starter track explicitly, preserving its completion counts. Keep planner selection, preview, cancel/accept and warnings correct. Include stale preview/evaluation/loading states; never apply a plan different from what the student accepted.
- Practice: use compact rows/cards and 15–20 results per page. Preserve full 120-entry catalog, topic/difficulty/status filters and search. Filters update counts and return to a valid page. Expanded details expose guidance, notes, related lesson, resource link and log form. Keep one main action per context. No 120 expanded cards or 240 repeated prominent buttons at once.
- Deep-linked/highlighted problems must be found, shown on the correct page, expanded and focusable. Closing detail or changing page/filter must preserve unsaved notes or clearly ask before discarding them. Don't claim page-local search covers all items if it doesn't.

Gate: paging/filter combinations, no-results/reset, opening/logging/reloading an attempt, deep links, long titles, mobile layout and touch controls; Atlas immediate details and lesson navigation; planner preview/accept regression.

### Stage B3 — Today, Review, Insights and onboarding coherence

- Today has one dominant next action, a reason and estimated effort. Retain access to the starter mission and current curriculum recommendation without presenting two equally dominant primary workflows. Identify the progress scope clearly; existing 12/12 stays starter completion, not curriculum mastery. Keep timer and recovery useful but secondary.
- Clarify Atlas vs Starter Roadmap in navigation/labels. Keep route compatibility and all supported functionality. Do not implement universal goals or new course enrollment APIs during this visual task.
- New onboarding explains the starter plan and broader library truthfully, using plain language rather than outdated MVP/internal implementation wording. Existing APIs and 30-minute starter scheduling remain intact.
- Review makes due action, active blockers, saved notes and history easy to distinguish. Keep empty states useful. Insights uses recorded evidence only; no fabricated trends/learning claims.
- Reduce generic badges/borders and repeated explanatory boilerplate across views. Maintain all theme modes and readable contrast.

Allowed: frontend workspace components, DashboardPage, navigation/AppShell, onboarding presentation, frontend styles and small presentational helpers; browser tests/selectors to match legitimate layout changes. No backend/content/schema refactor, dependencies or unrelated reformatting. Keep stable semantic hooks where feasible; update tests for actual user behavior rather than resurrecting old markup.

### Final acceptance/report

Run client tests/build, server tests and content validator; run the updated starter, Atlas/Proof and failure/isolation browser suites. Compare before/after images of Today, Atlas, Trace and Practice at desktop/mobile. Verify all six appearances, reduced motion, keyboard and all documented test-account states. Record what was actually covered. No requirement to shrink pages at the expense of content accessibility: modes, grouping and on-demand detail should make the central task immediately usable.

Deliver `docs/UI-REBUILD-RESULT.md`: behavior changed, files, stage counts, exact checks, screenshots, unresolved defects and a five-minute owner walkthrough. Leave an actual local preview. Do not claim release-ready, commit, push or deploy automatically. Stop for independent review.

## Prompt C — Opus 5.5: one bounded final review using limited usage

Review the completed UI redesign and its reports; do not start a second redesign or read the whole repository indiscriminately. Focus first on changed UI/state components, generated screenshots and failing tests. Use the audit findings and Prompt B acceptance gates.

Look for concrete issues: lost/mixed drafts during mode/page/topic changes; retry duplication and stale updates; lesson vs trace completion ambiguity; planner acceptance of stale inputs; incorrect selected problem after filtering/paging; broken direct routes/back/refresh; mobile overlay/focus traps; wrong progress denominators; any public answer-key regression. Check that visual changes improved actual task access and that all reference/notes functions remain available. Distinguish aesthetically subjective feedback from reproducible defects.

Review the new desktop/mobile screenshots. Report at most the five most consequential findings with file/line, reproduction, impact and minimal fix. If the main work meets the gates, say so with evidence and remaining limits. No broad speculative wishlist, expensive repeated full-suite runs or new scope. Fix a critical issue only inside Prompt B's allowed paths and after recording its reproduction; otherwise provide a narrow fix prompt for Argon/Flash. Preserve the collaborator's content/test ownership. Finish with `docs/UI-REBUILD-REVIEW.md`. No commit/push/deployment or production access.

## Model allocation rationale (planning judgment)

Official pages confirm Opus 5.5 and Gemini 4 Argon exist; Google's model documentation describes Argon for complex software engineering. These sources do not establish a benchmark winner for NextStep's particular UI. Allocate the broad UI/state restructuring to Argon, use Flash for mechanical preview/test work, and reserve limited Opus usage for a focused integration review. If a named model is unavailable or quota-limited, checkpoint and ask the owner to select an available option rather than silently switching.

Sources checked 18 October 2026:
- https://ai.google.dev/gemini-api/docs/models/gemini-4-argon
- https://www.anthropic.com/claude/opus
