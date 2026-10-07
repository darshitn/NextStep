> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Architecture and implementation choices

## Deliberately small stack

React + Vite + JavaScript client, Express + JavaScript server, Supabase Auth and Postgres, Render Web Service, Vercel frontend. Use npm and separate client/server lockfiles. Darshit's machine was checked: Node 24.21.0 and npm 11.19.0. Align on Node 24.x, supported by the reviewed hosting docs; set engines.node to 24.x in both packages. Confirm Sankirth's version before scaffold. Do not downgrade an already compatible runtime during the event.

```text
Vercel browser
  |-- email/password sign-in --> Supabase Auth
  |-- Bearer JWT + /api/... --> Render Express
                                   |-- verify user with Supabase Auth
                                   |-- per-request publishable-key client + user JWT
                                   `-- owner-filtered Postgres request under RLS
```

Supabase's HTTP client avoids introducing a direct Postgres connection string, pooler, database password, or TLS configuration during the event. There is no DATABASE_URL in this design. That is an intentional difference from the old workshop notes.

## Minimal database design

Use one `public.nextstep_goals` row per user:

| Column | Purpose |
|---|---|
| id UUID primary key | Internal goal identity |
| owner_id UUID unique, references auth.users | One pilot goal per student |
| creation_request_id UUID | Safe retry of initial creation |
| version integer >= 1 | Stale-write detection |
| state JSONB object | Track, dates, availability, schedule, completion map |
| created_at / updated_at timestamptz | Saved history metadata |

JSONB keeps the small goal state together, allowing one atomic compare-and-set update. This is a pilot tradeoff: reporting across many courses and full audit history would benefit from normalized tables later. The catalogue is versioned server data. No need for Storage, Realtime, Edge Functions, or SQL migrations from the browser.

See `templates/001-nextstep-goals.sql` for the draft migration. Sankirth reviews and copies it into database/ before applying to a dedicated project. SQL file creation is not evidence of remote execution.

## Auth and access

- Sankirth creates two or three email/password accounts through the Supabase dashboard, with email confirmed for the demonstration. Share their credentials privately with the team.
- Browser uses the publishable key and `signInWithPassword`; password is entered in the form, never compiled into the frontend or logged.
- Render validates each token with `auth.getUser(token)`. A network failure is 503, an invalid token is 401.
- Build a new Supabase client per request with the incoming Authorization header, persistSession=false and autoRefreshToken=false. Never share mutable user sessions across requests.
- Use only the publishable key. Service-role/secret keys are not needed for the app.
- RLS SELECT/INSERT/UPDATE policies require `(select auth.uid()) = owner_id`; owner is derived from the authenticated session. Public users have no table access. No delete grant in the app.
- Owners can access their own data through Supabase's Data API. This pilot is not a tamper-proof scoring system, and XP is not a certification.

## Concurrency and completion

Read current row; verify expectedVersion; create next state; update where id, owner_id, and version match. Increment version in that same update. Zero updated rows means 409, never a success. Use the query's returned row as the saved result.

For completion, check the existing completion map before the version comparison. A completed mission returns alreadyCompleted without a write. Two concurrent first completions: one save wins; the other rereads once. If the mission is now completed, return idempotent success; otherwise return 409. Do not loop indefinitely.

XP = 20 × count(distinct completed catalogue missions); never increment an independent mutable XP counter. A stale recovery update cannot overwrite a newer completion because version matching fails.

## Planned file ownership

```text
client/                         Darshit
  src/lib/api.js                single API adapter
  src/lib/supabase.js           browser Auth client
  src/components/              UI components
  src/App.jsx                   state/navigation
  vite.config.js                strict localhost port 5173
server/                         Sankirth
  src/app.js                    Express setup, routes, error handler
  src/index.js                  load env, bind PORT on 0.0.0.0
  src/planner.js                pure scheduling and recovery
  src/repository.js             per-user Supabase and CAS persistence
  src/auth.js                   JWT validation
  data/dsa-starter.json         reviewed copy of the catalogue
  test/                        Node test runner + HTTP tests
database/                       Sankirth
  001-nextstep-goals.sql
```

## Required package scripts — agents create these

Server: `dev` starts Node watch mode, `start` runs src/index.js, `test` runs the Node test suite (for example `node --test`). Express routes can use supertest for focused HTTP checks. Client: Vite `dev`, `build`, `preview`; no client unit framework is mandatory for a presentation-only component. The browser acceptance checklist is mandatory for real flows.

No root package scripts. No dependency on parent-folder old packages. Each provider builds its own folder using the committed matching package-lock.json.

## Origin / routing rules

The client uses an explicit API base locally and in production; there is no required Vite proxy. Render CORS permits exact origins from ALLOWED_ORIGINS, including http://localhost:5173 and the stable Vercel origin. Permit GET/POST/OPTIONS and Authorization/Content-Type. Handle preflight before auth. Cookies and credentials:true are unnecessary because user JWTs travel in headers.

Health can be opened directly without an Origin header. CORS is browser policy, not authentication. A rejected browser origin never justifies weakening table ownership.

## Scope of a passing check

Health: API running. Catalog: app can return data. Authenticated goal GET: session and DB path responding. Create + refresh: persistence. Two-account test: ownership. Deployed browser test: cross-platform integration. These claims are separate.
