# Initial setup: laptop → Supabase → local app → hosting

**Owner:** Sankirth leads; Darshit handles client setup. Follow in order. App commands below become runnable only after the matching Antigravity scaffold prompt creates the packages. Use PowerShell, two terminals, and one known port per service.

## 0. Confirm access before coding

- Both developers: Antigravity, Git, a compatible Node/npm installation, and access to the agreed GitHub repository.
- Sankirth: Supabase project creation/SQL editor/Auth access, Render service creation, and Vercel project settings access.
- Harshita: a presentation tool she already knows, screen recording, and a place to store screenshots privately.
- Check event rules on AI use and starter code; describe this kit as preparation material. Do not claim prewritten code was built during the event.
- Choose one actual repository. Verify its owner/name in the GitHub browser. Do not invent a remote or replace the old remote without checking it.

## 1. Verify the correct folder and runtime

```powershell
Set-Location 'D:/Projects/BuildToShip/nextstep-hackathon-2026-10-07'
Get-Location
git status --short
node --version
npm.cmd --version
git --version
node scripts/preflight.mjs
```

On Sankirth's laptop, substitute his checkout path. `npm.cmd` avoids a common PowerShell npm.ps1 execution-policy issue. Darshit's current runtime is Node 24.21.0 with npm 11.19.0; use Node 24.x on both laptops and Render/Vercel. Confirm dependency compatibility at scaffold. Install through the official Node site only if needed, then restart Antigravity's terminal. Do not use an OS-wide execution-policy bypass to fix npm.

No app package.json exists yet. The agents create separate client/ and server/ packages, with separate lockfiles. Avoid a third root package or nested Git repository.

### Share the kit before splitting work

These are human-operated Git steps, not commands an agent should execute automatically. First verify repository ownership/access in GitHub and agree which existing or new repository will host the project. Publishing this folder in the current repository does not remove old files from its history. If that repository is unsuitable, choose a clean repository deliberately and document its actual root layout before using the provider paths below.

For the current parent repository layout, the human can stage only this kit after reviewing it:

```powershell
Set-Location 'D:/Projects/BuildToShip'
git status --short
git add -- nextstep-hackathon-2026-10-07
git diff --cached --stat
git diff --cached --name-only
```

Confirm no old deletions, secrets, or unrelated files are staged. Then choose to commit and push to the verified remote/branch using your normal Git workflow. Do not publish accidentally staged old changes. No remote URL is supplied by this kit because the team must select the real repository.

Sankirth clones that agreed repository into his own directory. Verify the new folder appears before starting S1. Use feature branches from the same agreed base (`codex/nextstep-client`, `codex/nextstep-server`) and nominate the release branch. At each accepted gate, the author publishes a reviewed owned-path commit; Sankirth merges it into the release branch in a clean integration checkout. Both record the resulting commit ID. If the current checkout has unrelated deletions, preserve it and use a clean separate clone for integration rather than resetting or stashing it.

Agents must not run an unqualified `git add .`, force-push, or auto-merge. If a branch or remote already exists, inspect it and use the agreed value rather than rerunning a creation command blindly. See [team sync](02-team-sync.md) for the READY/WAITING messages accompanying each handoff.

## 2. Supabase project — Sankirth

1. Open Supabase and create a dedicated NextStep hackathon project in an appropriate nearby region.
2. Wait for the project to become ready.
3. Copy the project URL and **publishable key** from the project's API/connect settings into local environment files/provider settings. The legacy anon key may be used where that is what the project exposes; use the same documented variable name below. Do not choose a service-role/secret key.
4. Have the S1 agent review `templates/001-nextstep-goals.sql` and copy it to `database/001-nextstep-goals.sql`.
5. Check that the target project/table is new. Run the reviewed migration in the SQL editor. It creates only `public.nextstep_goals` and policies. It must not drop existing tables or disable RLS.
6. In Authentication, keep email/password enabled. Two confirmed demo accounts can be pre-created, but public judge registration is now fully supported via the in-app "Create Account" tab.
7. For public judge/user onboarding configuration, Site URL, allowed redirect URLs, and email template setup, refer to [09-supabase-auth-config.md](09-supabase-auth-config.md).
8. RLS ownership must be verified using user sessions, not a SQL-editor query as the administrative role. The editor bypasses ordinary user restrictions and cannot prove isolation.

**Pass:** table exists, RLS enabled, accounts can sign in or register via "Create Account", and the server isolates user goals.

## 3. Environment files — names must match exactly

After the agents create the app folders, copy the examples only if the local files do not exist:

```powershell
if (!(Test-Path 'client/.env.local')) { Copy-Item 'templates/client.env.example' 'client/.env.local' }
if (!(Test-Path 'server/.env')) { Copy-Item 'templates/server.env.example' 'server/.env' }
```

Fill placeholders in an editor. Do not paste real values into agent chat or print whole files in the terminal.

| Variable | Where | Local value / meaning |
|---|---|---|
| VITE_API_BASE_URL | client/.env.local | http://localhost:3001 |
| VITE_SUPABASE_URL | client/.env.local | exact Supabase project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | client/.env.local | publishable/legacy anon key, never privileged secret |
| SUPABASE_URL | server/.env | same project URL |
| SUPABASE_PUBLISHABLE_KEY | server/.env | same public project key |
| ALLOWED_ORIGINS | server/.env | http://localhost:5173 |
| PORT | server/.env | 3001 locally; let Render provide production port |
| NODE_ENV | server/.env | development locally |

Every VITE_ value is public in the compiled browser bundle. Database passwords, service keys, test-user passwords, and private API keys must never be placed there. This design intentionally needs no database password or LLM key.

Restart the local server after server env changes. Restart Vite after client env changes. Production Vite values require a rebuild/redeploy.

## 4. Start the server — terminal A

Only after S1 creates and verifies package scripts:

```powershell
Set-Location 'D:/Projects/BuildToShip/nextstep-hackathon-2026-10-07/server'
npm.cmd install
npm.cmd run dev
```

For later clean installs with a matching existing package-lock.json use `npm.cmd ci`. Keep this terminal open. Expected log: NextStep listening on port 3001, without env contents. The server must bind `0.0.0.0` and read process.env.PORT.

In a separate terminal:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/api/health'
Invoke-RestMethod -Uri 'http://localhost:3001/api/catalog'
```

Expected health: ok true, service nextstep-api, apiVersion 1. This is not yet a database test.

## 5. Start the frontend — terminal B

Only after D1 creates package scripts:

```powershell
Set-Location 'D:/Projects/BuildToShip/nextstep-hackathon-2026-10-07/client'
npm.cmd install
npm.cmd run dev
```

Expected URL: `http://localhost:5173`. Configure Vite strictPort=true. If occupied, resolve the exact process rather than letting Vite silently switch to 5174 and break CORS.

Open the printed URL. Sign in with a provisioned demo account. Open F12 → Network → Fetch/XHR, preserve the log, and perform the first request. Inspect responses without copying Authorization headers. Expected authenticated GET /api/goal: 200 with data.goal=null for a new account.

## 6. Prove the full chain

1. Create the starter goal in the client. Expected POST /api/goal: 201.
2. Confirm all twelve missions have dates and the workload message is sensible.
3. Refresh the browser. Expected GET /api/goal: 200 with the same goal ID/version.
4. Sankirth checks the synthetic row in Supabase.
5. A second account must see its own empty/different goal. Never accept user A's result in user B's session.
6. Record the result in both handoffs. G2 can pass only now.

## 7. Provider configuration

Use [the release runbook](06-deployment-and-release.md). If this folder stays inside the current parent Git repository, Render Root Directory is `nextstep-hackathon-2026-10-07/server` and Vercel Root Directory is `nextstep-hackathon-2026-10-07/client`. A wrong root is a common package.json/build failure.

## Connection ownership

Darshit diagnoses browser request URL/payload/rendering. Sankirth diagnoses Express route/auth/CORS/database/provider logs. They compare the same request timestamp and status before changing anything. Harshita records user-visible failures and expected behaviour, without touching provider configuration.
