> **Current ownership decision:** Darshit now owns the complete implementation: frontend, backend, database, auth/API adapters, AI integration and deployment configuration. This supersedes all split-role ownership and two-person acknowledgment requirements below. Sankirth supplies access/configuration and any existing work; Harshitha owns demo/presentation. Use one active editing session. Continue through verified local milestones without waiting for Sankirth; preserve existing work and report external blockers.

# NextStep — initial setup

**Active milestone:** Public User Onboarding & Create Account — Complete. All 3 visual styles (Frosted Sage, Study Journal, Quiet Focus) verified across Light/Dark modes, shared responsive dashboard layout verified on desktop and mobile (375px), student-friendly language updated, and 62 automated tests passing.

**Current implementation status:** Final UI Polish completed and visually verified: (1) Three visual styles (Frosted Sage default, Study Journal with editorial serif, Quiet Focus with lavender accent) working across Light and Dark modes; (2) Shared desktop layout with current mission on left, progress summary on right, compact saved blocker with expandable details, weekly calendar below, activity heatmap, and expandable roadmap; (3) Clean single-column mobile view verified at 375px with zero horizontal overflow; (4) Student-friendly language throughout ("I'm stuck", "Help me revise", "Ready to practise", "Preparing your guidance...", "Practice recorded. One more step forward.", "Your week changed? Let's make room."); (5) 62 automated tests passing (37 server, 25 client) and Vite production build verified.

**Locked theme:** Personalized AI Experiences. **Status:** setup and planning only; the [master prompt](prompts/NEXTSTEP-MASTER-PROMPT.md) now follows Darshit's supplied 23-section document structure. Paste it into Antigravity to start the active developer's scoped implementation.

This is the current starting point. It replaces the older scope, role sequence and prompt instructions where they differ. Existing contracts and SQL remain drafts until the two developers agree to the AI addition and authentication approach.

## What we are building

A student chooses a DSA goal and available study time. NextStep shows a manageable mission, records progress, and helps them resume when their time or understanding changes.

**MVP:** sign in → choose one DSA starter track → set weekly availability → view mission → record completion/feedback → get an AI-assisted recovery suggestion → preview and accept a revised schedule → refresh and see saved progress.

Keep the existing 12 × 30-minute mission catalogue. Available daily slots remain 0, 30, 60 or 90 minutes for this MVP. AI explains or adjusts guidance within the selected mission; code owns the schedule, prerequisites and completion records. Do not introduce new task durations or extra revision workload until the contract supports them.

Leave GSoC, LeetCode integrations, reminders, leaderboards, multiple tracks and elaborate streak/XP animations for later. Basic progress is enough initially.

## Ownership

| Person | Owns | Handoff |
|---|---|---|
| Darshit | React/Vite interface, onboarding, dashboard, feedback/recovery screens, client-side states and frontend tests | Working screens using agreed sample JSON; then connect through Sankirth's API adapter |
| Sankirth | Express API, AI provider, Supabase/auth/database, client API/auth adapter, environment setup, CORS, Render and Vercel deployment | Request/response examples, working endpoints, configured integration and test evidence |
| Harshitha | Demo story, presentation, 3–5 minute video and submission checklist | Rehearsed demonstration of the actual working app |

File boundaries: Darshit owns `client/**` **except** `client/src/lib/api.js` and `client/src/lib/supabase.js`, which Sankirth owns. Sankirth also owns `server/**`, database migrations and deployment files. Coordinate shared package/config changes before editing. Old files named HARSHITA refer to Harshitha; filenames are retained for existing links.

## Use the four platforms

- **Antigravity:** each developer implements their owned files in a separate checkout, using the upcoming prompt format.
- **Supabase:** store users, goals, schedules and completion history. Planned default is Supabase Auth with per-user row access.
- **Render:** run Express, validate requests, enforce scheduling rules and call the AI provider. AI credentials stay here.
- **Vercel:** serve the React/Vite frontend, which calls Render for app data and AI actions.

Flow: **Vercel frontend → Render API → Supabase / AI provider**. Browser sign-in can use Supabase Auth directly under the draft auth design.

## First steps

1. **Both:** open this folder in Antigravity. Use Node 24.x consistently. Run the existing preflight below. Do not run `npm install` or `npm run dev` here yet: this is a kit without an app package.json.
2. **Sankirth:** check access to Supabase, Render, Vercel, GitHub and one supported AI API account. Select an available API model and verify a small backend request before UI integration. IDE access does not establish runtime API access.
3. **Sankirth:** confirm with organizers whether Supabase Auth satisfies the listed JWT/bcrypt requirement. Keep it as the planned default, but do not freeze auth-dependent code or SQL until clarified. Darshit can build fixture screens meanwhile.
4. **Both:** agree on the existing goal/completion/recovery JSON plus the new AI suggestion response. Sankirth updates the contract before either implements the new endpoint. The old API v1 does not yet describe AI.
5. **Darshit:** after the new prompt format arrives, scaffold the UI with sample data clearly labeled as fixture mode. **Sankirth:** scaffold Express and integrations using the same agreed contract.
6. **Together:** connect one real flow first: sign in → save goal → reload. Then add feedback, the AI suggestion and recovery preview/apply. Production must not silently use fixtures.
7. **Harshitha:** record after the deployed flow passes. Prepare the story in parallel; promise only demonstrated features.

```powershell
Set-Location 'D:/Projects/BuildToShip/nextstep-hackathon-2026-10-07'
node scripts/preflight.mjs
node scripts/validate-kit.mjs
```

## Integration agreement

“Darshit: my screens match the sample response.” → “Sankirth: the API matches that response and saves successfully.” → connect the adapter → test together.

If either side is unfinished, the other continues on owned files without inventing new API fields. Update the relevant file under `handoffs/` before leaving to mentor.

For the AI call, send only the selected mission, relevant progress, availability and short student feedback. Require structured output, validate it server-side, and treat student text as data. Suggestions cannot mark tasks complete or change schedules automatically. Show an explanation; only a confirmed recovery action writes the new schedule. On timeout or invalid output retain the saved plan and show a retry option.

## Environment and deployment checklist — Sankirth

- Use `templates/client.env.example` and `templates/server.env.example`; copy only when the destination does not exist. Never commit actual credentials.
- Client: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. All `VITE_` values are browser-visible.
- Server: `PORT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`, plus the selected AI provider's server-only key and model name.
- Local ports: frontend 5173, API 3001. The API base is an origin only; append `/api/...` once.
- After scaffold: Render runs `server/` with its verified install/start commands and listens on `process.env.PORT` at `0.0.0.0`. Vercel builds `client/` with `npm run build`, output `dist`. These directories are relative to the app folder; include the app-folder prefix if deploying from the parent repository.
- Set Vercel's API base to the real Render HTTPS origin. Add the actual Vercel origin to Render's CORS allowlist. Rebuild the frontend after changing its environment. Check React Router deep-link refresh.
- Before demo: test an actual authenticated save and reload, not only `/api/health`.

## Minimum checks

- Saved goal and completed work survive refresh.
- Different users cannot access each other's goals.
- Duplicate completion does not duplicate progress; stale recovery cannot overwrite newer progress.
- Changed availability produces a feasible recovery preview without erasing completions.
- AI guidance visibly responds to feedback; malformed output/timeouts show an honest error.
- Deployed frontend → backend → database and AI flow works.

Quick fixes: wrong folder/package.json missing → open the intended app subfolder after scaffold; port busy → identify the owning process before stopping it; CORS → check exact frontend origin; 401 → check user session/token; 503 → check provider health/configuration; browser API failure → inspect Network URL/status first. More detail: [troubleshooting](docs/04-troubleshooting.md).

Official references: [Render Express](https://render.com/docs/deploy-node-express-app), [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite), [Supabase Auth](https://supabase.com/docs/guides/auth), [selected challenge](https://docs.google.com/document/d/1Ar7y--2HiAOCPAjeRJskQ8DcNInF65tPB9lcjwO9RAI/edit).

**Next handoff:** use [NEXTSTEP-MASTER-PROMPT.md](prompts/NEXTSTEP-MASTER-PROMPT.md). Keep ACTIVE_DEVELOPER as DARSHIT for Darshit's session; change it to SANKIRTH in Sankirth's separate checkout. This replaces the older role-prompt sequences. No cloud resources have been configured by this setup update.
