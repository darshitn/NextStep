# NextStep

**A doable next step for DSA practice, with guidance that uses your difficulty and a plan that fits your week.**

[Open the deployed application](https://next-step-six-theta.vercel.app/) · [Setup guide](nextstep-hackathon-2026-10-07/START-HERE.md) · [API contract](nextstep-hackathon-2026-10-07/contracts/API-V1.md)

Built by Team TriForge for the **Personalized AI Experiences** challenge.

Students lose momentum when a large roadmap does not tell them what to practise next, a difficult concept blocks them, or their available time changes. NextStep connects these moments in one learning flow:

1. Sign in and create a DSA Foundations goal with dates and weekly availability.
2. Work through twelve curated 30-minute missions with clear steps and completion criteria.
3. Explain what you tried and where you are stuck. Server-side Gemini suggests an approach using that context and the actual mission instructions.
4. Save notes and resume them later. Selected missions include rubric-based AI reasoning checks; M04 includes an interactive duplicate trace with immediate feedback.
5. Record self-reported practice, view its actual calendar history, and preview schedule changes before applying them.

Three visual styles, light/dark modes, and responsive layouts support the same workflow.

## Run locally

Use Node.js 24 LTS and npm. Each application has its own package file and lockfile.

```sh
cd nextstep-hackathon-2026-10-07/server
npm ci
# Configure server/.env using ../templates/server.env.example
npm test
npm run dev
```

In a second terminal:

```sh
cd nextstep-hackathon-2026-10-07/client
npm ci
# Configure client/.env.local using ../templates/client.env.example
npm test
npm run dev
```

Open `http://localhost:5173`; the API runs at `http://localhost:3001`. Apply the SQL migrations in `nextstep-hackathon-2026-10-07/database/migrations` to your own Supabase project. See the setup guide for configuration and email confirmation settings. Preserve existing environment files.

## Architecture

- **Frontend:** React, Vite, React Router, Tailwind CSS; Vercel hosting.
- **Backend:** Express, Zod and Google GenAI SDK; Render hosting.
- **Identity and persistence:** Supabase Auth and PostgreSQL with per-user row-level security. The backend validates the user's JWT and accesses records under that identity.
- **AI:** Gemini receives the current mission, relevant progress, availability and short learner feedback. Responses are validated. Coaching cannot complete a mission, award progress or change the schedule.
- **Scheduling:** deterministic 30-minute capacity calculations using IST dates. Recovery requires explicit preview and acceptance; version checks prevent stale updates from overwriting progress.

Only publishable Supabase configuration belongs in the frontend. The AI key stays in backend environment variables. No service-role key is required. Production never silently falls back to fixtures.

## Verification and deployment

Run `npm test` in both application directories and `npm run build` in `client/`. [Final audit evidence](nextstep-hackathon-2026-10-07/docs/FINAL-PRODUCTION-AUDIT.md) distinguishes automated tests, local browser fixtures and observed live checks. [Deployment runbook](nextstep-hackathon-2026-10-07/docs/06-deployment-and-release.md) covers Render and Vercel.

## Scope and limitations

This is a twelve-mission DSA starter, not an arbitrary curriculum generator. Completion and readiness are self-reported. AI can be unavailable or incorrect and does not certify mastery. Long-term learning gains and placement outcomes have not been measured. Supabase-managed authentication is used; organizer acceptance against the assignment's explicit JWT/bcrypt wording has not been independently confirmed.
