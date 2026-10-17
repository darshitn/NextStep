# NextStep: Atlas + Proof overnight implementation goal

## Goal and authority

Implement a polished, useful local NextStep learning workspace combining Atlas (topic map and planning) with Proof (interactive reasoning studio), backed by a substantial, reviewed curriculum and an external practice library. Finish a complete, tested three-topic release first, then expand content only while quality gates hold. The target is useful student learning behavior, not dashboard decoration or inflated counts.

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.

This is the owner's next local implementation milestone. It supersedes older instructions restricting the product to twelve missions or requiring a pause after each older prompt milestone. Continue automatically through the numbered stages below, within these boundaries. This prompt authorizes the described additive local architecture, source edits, tests and preview; it does not authorize publication, production data changes or permission bypasses.

Use Gemini 3.8 Flash Medium if that exact option is available in this IDE. Do not silently switch models, buy credits, change account settings or delegate to additional agents. Keep one editing session for this checkout.

## Non-negotiable preservation boundaries

- Work inside this project. Read the concept file specified below only as a design reference. Do not modify unrelated projects or the parent repository's existing changes.
- Inspect `git status`, diffs and untracked files first. There is existing UNCOMMITTED persistent-review implementation. Preserve and integrate it; do not treat it as disposable or overwrite it from Git.
- Never reset, clean, stash, delete old work, force checkout, commit, push, merge, deploy, or create provider accounts.
- Do not read or print secret values, `.env` contents, passwords, authorization headers or tokens. Existing application startup may load its environment normally. Do not edit environment files or security policies.
- Use synthetic accounts and local test data only. Do not sign into or mutate the owner's production account. No live Supabase migrations, no service-role keys, no production Gemini calls required.
- Preserve the existing 12-mission track and all history, notes, recovery behavior, recall attempts and exports. A completed 12/12 goal must remain 12/12 after adding a library.
- No package upgrades, new major libraries, arbitrary-code runner, external service or database schema migration in this run. Use existing React, Router, lucide-react, Express, Zod and test tooling. If something truly needs an unapproved dependency or migration, prepare a concrete proposal and continue independent allowed work.
- Do not weaken auth, RLS, validation, idempotency, CAS/version-conflict handling or tests to obtain a pass. Never hide a live failure behind fixtures.
- No scraping LeetCode, downloading proprietary question dumps, copying premium material, inventing citations, or presenting an unofficial integration as supported.

## Read before editing

Read `AGENTS.md`, `START-HERE.md`, `prompts/NEXTSTEP-MASTER-PROMPT.md`, `contracts/API-V1.md`, `contracts/SCHEDULER.md`, `contracts/ARCHITECTURE.md`, `docs/05-audit-and-tests.md`, `handoffs/DARSHIT.md`, `docs/PRODUCT-UPGRADE.md`, `docs/PERSISTENT-REVIEW-HANDOFF.md` and `docs/PERSISTENT-REVIEW-RESULT.md`. Treat reports as claims to verify, not proof that tests pass now.

Inspect the actual data flow in:

- `server/data/dsa-starter.json`, `server/src/routes/catalog.js`, `server/src/routes/goal.js`, `server/src/schemas/goalSchemas.js`, `server/src/services/scheduler.js`, `server/src/services/curatedChecks.js` and guidance services.
- `client/src/pages/DashboardPage.jsx`, workspace components, `client/src/services/workspace.js`, `client/src/services/apiService.js`, `client/src/lib/api.js`, `client/src/fixtures/apiFixture.js`, `client/src/workspace.css`.
- Existing migrations, client/server tests and `client/scripts/verify-workspace.cjs`.

Design reference (read-only, if available):
`C:\Users\Darshit N\.codex\visualizations\2026\10\16\01a1430f-392e-7641-bc51-fbce4376f514\nextstep-design-directions.html`

Use its Atlas and Proof concepts as inspiration, not production code. It contains synthetic data and host-only visualization APIs. Do not copy the carousel, Tweak, window.openai calls or fake sample statistics into the app. If inaccessible, use the specification below and continue.

## Product experience

One coherent application: Today, Atlas, Practice, Review and Insights. Preserve existing useful actions, deep links and mobile navigation. Make the home screen answer: What should I work on? Why? How long might it take? What happens when I get stuck?

Atlas is the broad view. Show real topic prerequisites, available lessons, recorded learning evidence and the next recommended activity. Provide an accessible list alternative to the connected map. Selecting a topic opens its detail panel and real actions. Distinguish availability, prerequisites, completion and recommended order; never imply that finishing a lesson proves mastery.

Proof is the focused view opened from Atlas, Today or the library. A lesson combines a short explanation, worked example, interactive prediction/trace, edge-case check and reflection. Render algorithm state, active code line and feedback coherently. Include previous/next/reset where meaningful. Wrong answers must teach the misconception; they must not silently complete an exercise. Keep retry and save states clear.

Practice is a searchable/filterable external problem library. Filters include topic, pattern, source and difficulty when legitimately sourced; use an explicit unknown state instead of guessing. Each entry links to relevant NextStep lessons and the provider's problem page. Record attempts, independent/with-hint/not-yet outcomes, a note and a review action. Label provider completion as self-reported unless a supported verification mechanism actually exists. No fake acceptance rates, company-frequency tags or automatic account synchronization.

Review connects existing recall work with new practice evidence. Preserve active blockers and old recall history. Explain recommendations using actual recorded events; a simple documented rule is preferable to invented AI intelligence. Suggested follow-up never automatically mutates the schedule.

Example acceptance journey: student opens Hashing, traces a set lookup, makes a mistake, receives specific feedback, retries, saves an attempt, opens a related external problem, records needing a hint, refreshes, sees the attempt and a relevant review suggestion, previews a smaller study week, accepts it, and retains all past progress.

## Visual and interaction requirements

- Create a deliberate Atlas + Proof design: spacious editorial heading, compact navigation, connected map, clear learning detail, strong typography hierarchy and restrained accent colors. Atlas can use warm neutral/olive accents and Proof a complementary ink/lavender accent within ONE semantic theme system.
- Make the main area useful and information-rich without a wall of cards. Reuse tokens and components. Avoid giant empty hero areas, gratuitous gradients, decorative scores and dead controls.
- Use smooth 150–300 ms state transitions for panels, selection, trace movement and planning previews. Respect reduced-motion preferences. No looping decorative motion or delays before content becomes usable.
- Support existing appearances and 1440, 1024, 390 and 320px widths. No horizontal page overflow, clipped code controls, inaccessible graph-only navigation or hover-only actions.
- Use native keyboard-accessible controls, visible focus, labelled inputs, correct modal focus/escape behavior if used, meaningful empty/loading/error/saved states and accessible dynamic feedback.
- Back/forward navigation, refresh and direct routes must work. Preserve old roadmap links with a compatible route or redirect.
- Do not use mockup counts in production. Show empty states for a new student and actual content availability when a pack is not published.

## Data architecture decisions authorized for this run

Keep content in version-controlled structured files with schema validation. Separate: topic, prerequisite edge, lesson, authored exercise, external problem reference, source attribution, and curriculum pack/version. Stable namespaced IDs must not collide with `m01`–`m12`. Published content IDs and old versions remain resolvable.

Keep the starter goal and its scheduler intact. Add the new learning workspace as additive, versioned state under the existing owner-scoped goal JSON, using current per-user authentication and CAS. Do not create multiple goals, loosen the one-goal constraint, or silently enroll existing users in a new track. New users can follow the existing goal creation flow before saving workspace activity; unauthenticated catalog exploration can be read-only.

Define the contract before implementing client/server consumers. Prefer an additive `studyWorkspace` structure containing schemaVersion, enrollment/content version, activity records and a separate optional study plan. Inspect actual state update paths so every old mutation preserves unknown/additive fields. Bound histories and text sizes; document retention limits and never truncate unrelated existing data.

Add authenticated endpoints for workspace actions only as needed. Server validates owner, content IDs/versions, payload limits and expectedVersion. Use request/attempt IDs for retry-safe writes. Preserve original timestamps/results on identical retries; reject conflicting reuse. Never trust client-supplied expected answers or scoring rubrics. Clients must handle stale-version conflicts without discarding unsaved text or overwriting newer records.

Keep lessons/catalog metadata separate from private attempts. Load only needed detail content. Do not ship server grading keys through public catalog endpoints. An explicit reference reveal is allowed when the workflow calls for it; revealed/hint-assisted attempts must be represented honestly. Guard against rendering unsafe external markup.

For the new study plan, allow task durations based on content estimates, not measured focus time. Plan only explicitly selected work; library additions do not become backlog. Respect prerequisites, daily capacity and completed items. Treat estimated duration as an estimate; support an activity spanning sessions if necessary, without falsely completing it. Preview must show unscheduled work and deadline conflicts. Accepting a preview must bind to the same content/state/capacity version; stale previews are rejected. It must not alter the starter schedule.

Avoid replacing the stack or implementing a general-purpose LMS. If a broader migration becomes necessary, document it and complete the local compatible slice instead.

## Content scope and publishing gate

Required first release: arrays, hashing and binary search; 12 substantial short lessons; 6 original interactive exercises; 30 reviewed external practice references where sources can be verified. No duplicate entries counted twice. If references cannot be verified, publish only verified entries and report the shortfall rather than filling the count with guesses.

Expansion target AFTER all required workflow gates pass: 12 topics, 48 substantive lessons total, 120 distinct reviewed practice references total and 18 interactive exercises total. These counts include the first release. Target topics: arrays/strings, hashing, binary search, two pointers, sliding window, linked lists, stacks/queues, trees, heaps, graphs, recursion/backtracking and introductory dynamic programming. Do not claim comprehensive DSA coverage. Defer greedy, advanced graphs and advanced DP if they are not reviewed.

Each published lesson needs prerequisites, a measurable objective, concise explanation, accurate worked example, pitfalls, an edge case, a practice link where appropriate, a knowledge check, estimated duration, provenance and review status. Avoid repetitive template filler. Each exercise needs inputs, deterministic expected transitions/results, explanations and regression tests. Exercise variation must not be a renamed duplicate.

Build reusable trace renderers, starting with array/index/range state and set/map state. Add other renderer types only when real authored content needs them. These are authored demonstrations, not execution of arbitrary user code. Validate their state sequences against reference implementations and meaningful edge cases, including duplicates, empty/single-item inputs and binary-search boundaries. Do not assume a generic array renderer adequately teaches graph traversal or DP.

Content pipeline: draft -> source/licence check -> technical validation -> editorial review -> published. Record exactly what review happened; do not call same-agent work independently reviewed. Unreviewed drafts are excluded from production indexes and published counts. Every content pack can be validated offline. Flag curriculum gaps explicitly.

Permitted research starting points:
- https://opendatastructures.org/ : Creative Commons Attribution; verify selected edition and carry required attribution.
- https://opendsa.org/home/license : MIT; verify asset-specific notices before adapting.
- https://github.com/yangshun/tech-interview-handbook/blob/main/LICENSE : MIT for that repository's material, not linked third-party questions.
- https://www.techinterviewhandbook.org/grind75/ : planning reference, not a blanket content licence.
- https://leetcode.com/studyplan/top-interview-150/ : external study reference.
- https://leetcode.com/terms/ : do not scrape or mirror proprietary content.
- https://codeforces.com/apiHelp/methods#problemset.problems : future integration research only; no extra provider integration needed overnight.

For each reused source, record URL, creator, verified licence, required notice, changes made and actual verification date. For original material say original; do not invent third-party attribution. External entries store a link and our own educational mappings; no copied full statements, editorials, solutions or hidden tests. A GitHub dump's licence is not proof it owns third-party material. If network access is blocked, continue original first-slice content and local functionality; do not fabricate source verification or add unverified imports.

## Execution stages — one active stage

0. Baseline and plan: inspect dirty files; record baseline test/build results and existing failures; create `docs/ATLAS-PROOF-PROGRESS.md` with the six stages, acceptance gates and counts. Record a concise implementation design and endpoint/data contract. Do not reinterpret every routine implementation decision as needing permission.
1. Content foundation: versioned schemas, registry, first three-topic pack, source ledger and validator. Tests prove stable IDs, valid references, prerequisite acyclicity, content completeness, publication filtering and deterministic exercise answers.
2. Complete product slice: integrated Atlas + Proof + library, actual save/load APIs and matching fixtures, useful navigation and accessible responsive UI. Required first-release content is usable end to end. Existing starter behavior remains intact.
3. Planning and evidence: explainable recommendations, review integration, separate capacity-aware study plan with preview/accept, concurrency and error handling, sanitized export of new bounded data. No automatic completion or unsupported mastery claims.
4. Expansion: only after stages 1–3 pass their relevant checks, grow reviewed topic packs toward the expansion target in small batches. Run content validation and relevant tests after each pack. If the time/usage budget cannot cover expansion, preserve the completed first slice and document exact remaining packs.
5. Final audit and delivery: full tests/build/content validator, browser journeys/screenshots where available, diff review, local preview and final report. Repair concrete failures within retry limits. Do not spend the last budget on new scope.

At each transition update progress with completed/in-progress/blocked/remaining counts, changed files, checks and next action. Do not claim a stage complete because its code exists; required checks must pass or it remains partially verified. No automatic pause is required between successful local stages.

## Exact baseline and final checks

From the project root:

```powershell
git status --short
npm.cmd --prefix server test
npm.cmd --prefix client test
npm.cmd --prefix client run build
git diff --check
```

Add and document `server/scripts/validate-curriculum.mjs`, then run:

```powershell
node server/scripts/validate-curriculum.mjs
```

Verify existing Playwright availability before using the harness. A previously used module path is `D:/Projects/Deadline-Catcher/node_modules/playwright`; use only if it exists, do not modify that project. From `client/`, with the appropriate synthetic preview running:

```powershell
node scripts/verify-workspace.cjs "D:/Projects/Deadline-Catcher/node_modules/playwright" http://127.0.0.1:5187
```

Inspect the harness/config first; don't assume a server or fixture interception exists. Extend the current harness or add a focused local one for the new journeys. Existing `client/.local/vite-audit.config.mjs` is an ignored manual-QA config and may be unavailable in another checkout; production must never depend on it. Make any new reproducible preview setup explicitly opt-in and visibly labelled synthetic, with production build exclusion.

Required verification:
- Old active and completed starter accounts retain progress, notes, recall history, recovery and export.
- New student, old goal missing additive fields, partially completed workspace and fully completed starter states.
- Atlas selection, accessible list, prerequisites, direct lesson route and back/forward navigation.
- Correct/incorrect trace answers, reset, explicit hint/reference reveal, retry, reflection and saved attempt after refresh.
- Problem search/filter/empty results, safe external links and honest self-reported outcomes.
- Due reviews and active blockers; no fabricated mastery or evidence.
- Plan preview/accept/cancel, insufficient capacity, stale version, concurrent updates and no completed-work loss.
- Auth expiry, API failure, malformed content ID and duplicate/conflicting request IDs.
- Owner isolation and production/fixture separation. Mocked persistence does not prove live Supabase writes.
- Screenshots at desktop and 390/320px; check dark/light appearances, reduced motion, keyboard access, overflow and console errors. Do not merely collect screenshots: inspect them and fix findings.

Don't delete or weaken tests. A pre-existing failure remains recorded separately; add focused regression coverage for touched behavior. Do not repeatedly rerun passing suites unless changes justify it.

## Bounded recovery and unattended operation

- Set a finite session budget before starting; default target is up to 6 hours, reserving the final 45 minutes for verification/reporting. This is not permission to defeat platform usage limits. Stop earlier when complete or at a real authorization boundary.
- Use bounded command timeouts. If a command hangs, inspect output/process ownership once, then stop only the process you started. Never kill all node/browser processes or a server owned by the user.
- For a concrete defect, make at most two focused fix attempts before recording the repeated failure. Identify the root cause; do not repeat the same failing command indefinitely. Continue only independent tasks whose correctness does not depend on the blocker.
- If core compile/data-integrity/compatibility checks remain broken, stop dependent expansion and spend remaining permitted effort on a precise repair diagnosis and report. Do not build more features on a failing base.
- Permission/authentication failures: do not retry through another mechanism, change permissions, disable policies or infer missing credentials. Record the blocked action and exact owner step; pause the affected work. Continue independent authorised tasks only. A quota exhaustion ends work with a checkpoint if possible.
- Missing cloud credentials: test against existing mocks/synthetic adapters and implement actual authenticated endpoints, but label live persistence/guidance unverified. Do not request or fabricate secrets.
- Missing browser tooling: perform allowed unit/integration/build checks, document browser acceptance as pending, and continue independent work. No fabricated screenshots or claim that source tests prove UI behavior.
- Port occupied: identify ownership. Reuse a compatible existing preview or choose a free loopback port and report it. Do not kill another process. On Windows, launch persistent preview processes hidden. Poll readiness with a bounded deadline; verify the expected page rather than merely checking for a process.
- Source unavailable or licence unclear: omit that material from published content, use original material where valid, document the shortfall and proceed. No filler to reach targets.
- If context compacts or execution restarts, read the progress file and actual diffs, resume the active stage and do not repeat completed work.
- Do not leave silent TODOs, dead buttons, placeholder scores, swallowed exceptions or a fake fallback as completed behavior.

## Finish and handoff

Create `docs/ATLAS-PROOF-RESULT.md` containing:
1. What works and the user journey.
2. Stage counts and whether the first release and expansion targets were actually achieved.
3. Files changed, endpoint/schema decisions and preservation of pre-existing work.
4. Actual published counts: topics, lessons, exercises and distinct practice references; separate drafts and omitted items.
5. Source/attribution ledger location and review limitations.
6. Exact executed commands, exit results, test counts and screenshot locations; separate blocked/skipped/manual/live checks.
7. Remaining defects and the exact next action, without declaring partial work release-ready.
8. Local preview URL, synthetic-only sign-in instructions, process IDs you started and how to stop those processes.
9. A five-minute owner exercise covering Atlas -> Proof -> practice -> refresh -> review -> plan preview.
10. Explicit statement that no commit, push, deployment, production account mutation or database migration was performed.

Leave a working local preview when permitted. If unavailable, provide a tested startup command and the precise blocker. Update `handoffs/DARSHIT.md` with a concise checkpoint without overwriting history. Finish with a short human-readable report and stop. The owner will test locally before GitHub publication.
