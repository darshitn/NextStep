# Antigravity implementation prompt: NextStep DSA learning loop

Act as the implementation engineer for the existing NextStep application. Implement the complete milestone below, including frontend, backend, persistence, integration, and tests. Do not stop at a plan or UI mockup. Work in `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.

## Objective and boundaries

Make NextStep a DSA preparation companion that helps a student explain a blocker, practise with a small hint, check their understanding, and return after a break with their context preserved. Deliver one cohesive learning loop on the existing 12-mission DSA track.

Keep the current working onboarding, completion, progress, calendar, recovery and monochrome Light/Dark UI. No universal goals, additional tracks, leaderboard, code runner, LeetCode scraping/sync, new auth system, or redesign. Do not claim mastery, interview readiness, or guaranteed placement from a short answer.

Darshit owns implementation across the stack. Sankirth supplies configuration/access as needed. Harshitha handles presentation. Use one editing session; do not wait for old split-role acknowledgments. This prompt authorizes all local stages of this milestone, with tests between stages. Stop after its final report, not after each stage.

Preserve dirty work, `.env`, credentials, locks and unrelated documents. Inspect Git root/status first: this application lives inside a parent repository. Do not reset, clean, stash, delete old work, initialize nested Git, commit, push or deploy. Never print secret values. Use synthetic test accounts/data only. Do not modify a shared/production database without authorization; prepare an additive migration and report if applying it is blocked.

## 1. Inspect and establish a baseline

Read AGENTS.md, START-HERE.md, contracts/API-V1.md, contracts/SCHEDULER.md and the latest handoff. Some setup prose is historical; inspect source before treating it as current.

Inspect these existing implementation points:
- `client/src/pages/DashboardPage.jsx`, `RecoveryPage.jsx`
- `client/src/components/GuidancePanel.jsx`, `CompletionForm.jsx`, `MissionCard.jsx`
- `client/src/services/apiService.js`, `client/src/lib/api.js`
- `server/src/routes/goal.js`, `server/src/services/guidance.js`
- `server/src/schemas/goalSchemas.js`, existing authentication, database and rate-limiter code
- server and client DSA catalogues, database migrations, and test scripts.

The current guidance service already returns a checkQuestion. Completion already accepts a reflection. Extend these capabilities; do not create a second parallel guidance system. Verify whether guidance and reflections currently persist and how goal versions are enforced.

Run baseline commands from the application directory using PowerShell:
```powershell
npm.cmd --prefix server test
npm.cmd --prefix client test
npm.cmd --prefix client run build
```
Record pre-existing failures separately. Inspect package locks before installing; use npm ci only if dependencies are missing. Never replace an environment file.

## 2. Define the contract and storage first

Update contracts/API-V1.md with request/response examples, validation, persistence and error cases before dependent implementation. Reuse existing endpoint/error conventions. Choose the smallest additive data model compatible with existing Supabase RLS and optimistic concurrency.

Persist, per authenticated user, goal and mission:
- What the student tried and where they are stuck, bounded to 280 characters each.
- Their latest guidance context, including the actual presented question and its stable question ID/version.
- Submitted answer, bounded to 1000 characters, feedback status and timestamp.
- Their self-reported state: still unsure or ready to continue.

Existing completion reflections remain intact. Distinguish self-report, AI feedback and mission completion. Check answers must never automatically complete a mission or award XP.

Use server-authoritative mission IDs, question content and reference rubrics. Never trust a client-supplied reference answer, user ID or ownership claim. Bind submissions to the question actually shown; reject stale/mismatched question IDs. Read and write through authenticated ownership enforcement. Include goal version handling where goal state is mutated, without silently overwriting another tab's work. Provide safe defaults for existing goals and non-destructive additive migrations if needed.

## 3. Implement the student learning loop

### A. Explain my blocker

Extend the current guidance panel with two short fields:
1. What have you tried?
2. Where are you stuck?

Retain the useful existing difficulty categories. Save context explicitly and show whether it saved. Avoid saving on every keystroke. Generate guidance from the current mission, completed prerequisites, availability and relevant saved difficulty context. Use a small hint and a concrete tracing exercise; do not immediately dump a full solution. Keep guidance within the existing 30-minute session.

Provide a single primary action and clear loading/error/retry states. If generation fails, preserve the student's input and any saved context. Do not label hardcoded fallback text as successful AI guidance.

### B. Check my understanding

Curate one small question and a server-side reference rubric for THREE representative missions selected from the actual catalogue. Do not assume new topics exist in the current track. One appropriate example, if the catalogue supports it: trace `[2, 5, 2]`, explain when the duplicate is detected and what was in the set immediately before it.

For these missions, ensure the displayed question matches the curated question used for assessment; do not assess a free-generated question using an unrelated rubric. Leave the remaining missions usable with their existing guidance. Make the limited check coverage clear, without dead buttons or fabricated assessments.

Add an answer input, Submit answer, feedback and Try again. AI assesses the answer against the trusted reference rubric and returns validated JSON with:
- status: `on_track`, `needs_another_try`, or `uncertain`
- a short explanation tied to the student's answer
- one actionable next step

These are coaching signals, not proof of mastery. Allow Still unsure and Continue practising regardless of the assessment. Do not force an AI pass before an otherwise valid self-reported completion. Reject empty/oversized submissions server-side and client-side. Preserve the answer on network/AI errors. Prevent accidental duplicate requests; make persistence/retries safe.

### C. Remember my difficulty

After refresh or sign-out/sign-in, show a compact resume card for relevant saved context: the mission, last blocker, latest answer/feedback where available, and a clear Resume practice action.

Prefer the active mission's unresolved context. Label older context with its mission; never imply the next mission has the previous mission's blocker. Support editing the saved blocker and updating self-reported state. Use saved context in subsequent guidance only when relevant. Keep the view concise and dismissible without silently deleting its data.

### D. Help me restart

Integrate the existing recovery preview/apply flow into the story with a clear Adjust my study time action. Reuse the deterministic scheduler. Preserve completed missions, prerequisite order, timezone behavior and already-consumed daily minutes. Do not add extra revision sessions or let AI rewrite dates.

Preview before applying changes. Show a meaningful old/new finish comparison and explain when a fixed target cannot be met. Applying and refreshing must preserve both the new schedule and learning context. Handle a stale version by fetching current state and asking the student to review again, not silently retrying an outdated mutation.

## 4. Platform integration and failure handling

- Antigravity: implement and run the application; IDE model access is not a runtime API credential.
- Supabase: existing authentication and per-user persistence/RLS, including any new learning records. No service-role credential in the client. Preserve the current auth architecture.
- Render: existing Express API validates auth/requests, calls Gemini server-side, validates output, enforces limits and persists records.
- Vercel: existing React/Vite client calls the configured Render API and supports route refresh.

Reuse the configured AI provider/model, timeout, sanitization and rate limiting. Treat student text as untrusted data. Do not expose raw provider errors or keys. Bound AI usage to explicit user actions; never call on page render or every keystroke. Malformed JSON, rate limits and timeouts must produce honest retryable feedback while preserving user work. Static reference explanations may be available with a clear label; they are not AI evaluation.

Update example environment files only if required. Document variable NAMES, configuration locations and restart/redeploy requirements, never values. Validate the actual API base URL/CORS contract in source. Check missing config, expired auth and backend unavailability explicitly. Do not silently switch to fixtures in production.

For terminal problems: use the correct client/server directory or --prefix; on PowerShell use npm.cmd. Check the actual listener before diagnosing EADDRINUSE; do not kill unrelated Node processes. Use an available local port and align local API/CORS settings. A health response alone does not verify authenticated writes, AI or persistence.

## 5. Test at each stage and repair failures

After contract/backend work, run focused backend tests. After UI wiring, run client tests/build. At the end rerun all three baseline commands. Ensure added tests are discovered by the package scripts; add a narrowly scoped script adjustment if necessary.

Add meaningful tests for:
1. Saved blockers/answers/feedback round-trip through the storage boundary.
2. Missing auth and a second user cannot read/write the first user's learning context; separately document what mocks cannot prove about deployed RLS.
3. Unknown mission, mismatched/stale question and invalid/oversized answer rejection.
4. Correct, partially correct and irrelevant answers exercise assessment handling with controlled provider outputs. Unit mocks do not establish actual AI quality.
5. Timeout, malformed AI output and rate limits preserve input and do not create false-success records.
6. Guidance uses relevant saved context and does not leak another user's or unrelated mission's context.
7. Assessment never changes completion count, XP or schedule.
8. Duplicate completion remains idempotent; recovery preserves completion/context and rejects stale updates.

Use isolated config and mocked providers in automated tests. Never accidentally load real credentials or spend API credits in unit tests.

Manually test in the browser with synthetic data when configuration permits:
- Sign in, create/use a DSA goal and request real guidance for a curated mission.
- Enter an incomplete answer; review whether real feedback is useful; revise it.
- Mark Still unsure, refresh, sign in again and verify saved context.
- Reduce availability, preview/apply recovery, refresh and verify persisted schedule and completion count.
- Check desktop/mobile layout, keyboard operation and both Light/Dark themes. Use existing semantic theme classes and variables so dark text contrast does not regress.
- Exercise an unavailable backend/AI response without losing the user's answer.

Do not fabricate dates or completions in the app to simulate a missed week. Use an isolated synthetic fixture/test or explain a prospective availability change for the demo. Clearly separate mocked tests, local live browser evidence and deployed evidence. If configuration/access blocks live checks, finish all independent work and state the exact remaining check.

## 6. Demo and final report

Write `presentation/LEARNING-LOOP-DEMO.md` for Harshitha with the implemented clicks and a 3-minute story: Ananya understands arrays but struggles with a duplicate check; she receives a small hint, answers a check, returns with saved context, and adapts her schedule when labs reduce her study time. Use only supported missions/features. Include real-AI failure contingency; do not pretend an offline example is live.

Update START-HERE.md and handoffs/DARSHIT.md with the current entry point, completed milestone and remaining integration gates. Avoid broad documentation rewrites.

Final report must include:
- Implemented behavior and changed files.
- Exact test commands and results; distinguish baseline failures.
- Migration/configuration steps still required, if any.
- Local browser, real AI and deployed verification status separately.
- Current Git status, limitations and remaining risks.
- Exact next manual action if a provider/configuration gate remains.

Acceptance: a student can save their blocker, receive contextual guidance, submit a supported understanding check, retain context after reload, and adjust their schedule without losing progress. The existing app remains functional in both themes. Do not claim the feature is fully integrated if persistence or real AI checks remain unverified. Stop after reporting this milestone; no unrelated features or automatic publication.
