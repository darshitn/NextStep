# NextStep — Architecture & Technical Specifications

## 1. System Architecture
NextStep follows a clean decoupled client-server architecture:
- **Client Tier (Vercel):** Single Page Application built with React, Vite, and Tailwind CSS. Communicates with Supabase Auth for identity and Render Express for domain logic.
- **Server Tier (Render):** Express REST API in Node 24.x enforcing authentication, scheduling determinism, validation, and Gemini AI proxying.
- **Data & Auth Tier (Supabase):** PostgreSQL with Row-Level Security (RLS) guaranteeing tenant isolation, and Supabase GoTrue for email/password authentication.
- **AI Service (Google Gemini):** Accessed exclusively server-side via `@google/genai` with strict structured JSON schema enforcement.

```text
[ Vercel Client (React + Vite) ]
       |                  |
       | Auth (JWT)       | API Requests (Bearer Token)
       v                  v
[ Supabase Auth ]    [ Render Express Web Service ]
                           |                  |
                           | Per-request      | Gemini API
                           | Publishable RLS  | Structured JSON
                           v                  v
                    [ Supabase Postgres ]  [ Google Gemini 2.5 Flash ]
```

## 2. Frontend Architecture
- **Framework & Build:** Vite with React 19, React Router 7.
- **Styling System:** Vanilla Tailwind CSS with custom theme variables supporting dark mode, glassmorphism (`backdrop-blur`), subtle animations, and accessible focus states.
- **State Management:** Reactive React hooks (`useState`, `useContext`, `useEffect`), custom API service layer with clear error and loading boundaries.
- **Component Hierarchy:**
  - `AppShell`: Global header, auth status, session expiration notice, active track indicator, and fixture banner when running locally.
  - `Pages`:
    - `Login`: Authentication form with demo account helpers.
    - `Onboarding`: Goal parameters setup (dates, deadline mode, 7-day availability).
    - `Dashboard`: Core cockpit with ProgressSummary, NextMissionCard, CompletionModal, and GuidancePanel.
    - `Recovery`: Availability re-allocation, before/after comparison table, explicit Apply/Cancel.
    - `NotFound`: 404 fallback with return-to-dashboard navigation.
  - `Components`: UI primitives including `AvailabilityPicker`, `ProgressSummary`, `MissionCard`, `CompletionForm`, `GuidancePanel`, `RecoveryComparison`, `ErrorNotice`, `LoadingState`.

## 3. Backend Architecture
- **Runtime:** Node 24.x running Express 4.x.
- **Modules:**
  - `routes/`: Express route handlers for `/api/health`, `/api/catalog`, `/api/goal`, `/api/goal/complete`, `/api/goal/recovery/preview`, `/api/goal/recovery/apply`, `/api/goal/guidance`.
  - `middleware/`: Authentication JWT parser, rate limiter, request logger, error handler.
  - `services/planner.js`: Pure deterministic scheduler computing 12-mission slots across Asia/Kolkata dates and recovery re-allocations.
  - `services/guidance.js`: Gemini AI integration enforcing system prompts and structured output schemas.
  - `lib/supabase.js`: Factory creating per-request Supabase clients using the incoming user Bearer token.
  - `schemas/`: Zod schemas validating requests, database state, and AI outputs.

## 4. Database Schema
Single table `public.nextstep_goals` holding tenant goals as versioned JSONB objects:
```sql
create table public.nextstep_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creation_request_id uuid not null,
  version integer not null default 1 check (version >= 1),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nextstep_one_goal_per_owner unique (owner_id)
);
```

### JSONB State Structure
```json
{
  "trackId": "dsa-starter-v1",
  "planStartDate": "2026-10-07",
  "targetDate": "2026-11-06",
  "deadlineMode": "flexible",
  "timezone": "Asia/Kolkata",
  "availability": { "mon": 60, "tue": 0, "wed": 60, "thu": 0, "fri": 60, "sat": 0, "sun": 0 },
  "schedule": [{ "missionId": "m01", "date": "2026-10-07" }],
  "completions": {
    "m01": {
      "completedAt": "2026-10-07T04:00:00.000Z",
      "outcome": "independent",
      "reflection": "Understood two-pointer technique."
    }
  }
}
```

## 5. API Endpoints
All private endpoints require `Authorization: Bearer <token>`.
- `GET /api/health` — Public health check (`{ ok: true, service: "nextstep-api", apiVersion: 1 }`).
- `GET /api/catalog` — Public DSA starter mission list (12 missions, 360 min total).
- `GET /api/goal` — Authenticated retrieval of student's goal (or null if not onboarded).
- `POST /api/goal` — Idempotent goal initialization using `creationRequestId`.
- `POST /api/goal/complete` — Idempotent mission completion with version check.
- `POST /api/goal/recovery/preview` — Read-only calculation of proposed schedule on availability change.
- `POST /api/goal/recovery/apply` — Atomic compare-and-set update applying accepted recovery schedule.
- `POST /api/goal/guidance` — Ephemeral Gemini AI suggestion for current mission given difficulty category.

## 6. Authentication & Row-Level Security
- Managed Supabase Auth using email/password.
- RLS enabled on `public.nextstep_goals` with policies:
  - `nextstep_read_own`: `auth.uid() = owner_id`
  - `nextstep_insert_own`: `auth.uid() = owner_id`
  - `nextstep_update_own`: `auth.uid() = owner_id`
- Render validates bearer token via `supabase.auth.getUser(token)`, creating a scoped Supabase client with the user's JWT. No service role key is used.

## 7. AI Components
- **Engine:** Google Gemini 2.5 Flash via `@google/genai`.
- **System Instruction:** Role-locked prompt strictly prohibiting schedule mutation, fake completion, or XP alteration.
- **Input Data Contract:** Mission title, why, steps, completed prerequisites, daily availability, and student context (`category`, `feedback`).
- **Output Schema:**
  - `mode`: enum `["standard_practice", "guided_practice", "revision_first"]`
  - `explanation`: string (1–400 chars)
  - `steps`: string array (2–4 items, each 1–180 chars)
  - `checkQuestion`: string (1–180 chars)
- **Validation:** Independent Zod parser validates Gemini responses. On failure/timeout, system returns sanitized error code without mutating goal state.

## 8. Data Flow
1. **Creation:** User submits onboarding params -> Express calculates 12-mission schedule -> inserts row with `version: 1` -> returns goal object.
2. **Completion:** User completes mission -> Express verifies prerequisite and `expectedVersion` -> appends completion entry to JSONB -> increments version -> returns updated goal.
3. **Guidance:** User reports difficulty on next mission -> Express verifies version & active mission -> queries Gemini with sanitized context -> returns ephemeral guidance payload.
4. **Recovery:** User inputs new weekly availability -> Express calculates new schedule for incomplete missions starting from today without modifying DB -> returns preview. User accepts -> Express validates version and atomically updates row.

## 9. Folder Structure
```text
nextstep-hackathon-2026-10-07/
├── client/
│   ├── src/
│   │   ├── components/      # UI components (Darshit)
│   │   ├── pages/           # Route views (Darshit)
│   │   ├── fixtures/        # Development fixture adapter (Darshit)
│   │   ├── lib/
│   │   │   ├── api.js       # Live API adapter (Sankirth)
│   │   │   └── supabase.js  # Supabase client (Sankirth)
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── middleware/      # Auth, rate-limiting, error handler
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # planner.js, guidance.js
│   │   ├── schemas/         # Zod schemas
│   │   ├── app.js
│   │   └── index.js
│   ├── data/
│   │   └── dsa-starter.json
│   ├── tests/
│   └── package.json
├── database/
│   └── migrations/
│       └── 001-nextstep-goals.sql
├── contracts/               # API-V1.md, ARCHITECTURE.md, SCHEDULER.md
├── fixtures/                # dsa-starter.json, request/response examples
├── handoffs/                # DARSHIT.md, SANKIRTH.md, HARSHITA.md
└── scripts/                 # preflight.mjs, validate-kit.mjs
```

## 10. Deployment Strategy
- **Frontend:** Vercel SPA hosting `client/` build output (`dist`). Rewrites handle client-side routing.
- **Backend:** Render Web Service hosting `server/`, listening on `0.0.0.0:$PORT`.
- **Environment Variables:**
  - Client: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - Server: `PORT`, `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`.

## 11. Security Model
- No secret keys in client bundle (`AI_API_KEY` is server-only).
- Strict CORS checking on Render API against `ALLOWED_ORIGINS`.
- RLS ensures no student can view or mutate another student's goal.
- Optimistic locking (`expectedVersion`) prevents lost updates across tabs or stale recovery submissions.
- Rate-limiting protects AI endpoints from abuse.

## 12. Important Technical Decisions
- **Single-row JSONB vs Normalized Tables:** For this hackathon MVP, a single row with CAS version checks eliminates multi-table transaction overhead while guaranteeing atomic schedule updates.
- **Deterministic Scheduling vs LLM Scheduling:** LLMs frequently hallucinate dates, drop missions, or violate prerequisites. Deterministic arithmetic handles scheduling; LLMs handle educational coaching.
- **Separation of Integration Adapters:** Darshit develops client views using a mock/fixture adapter, unblocking rich UI work while Sankirth finalizes Supabase and Render infrastructure.
