# NIAT mentor event quick reference

Prepared 5 October 2026. Full steps, prompts and sources are in `NIAT_MENTOR_PREPARATION.md` in this folder.

## Document's main path

Gemini specification → Replit Agent → Replit PostgreSQL → GitHub → Replit Publish.

Supabase, Antigravity and Vercel are extra practice paths. Check event rules before replacing required tools.

## Start each incident

1. What should happen, and what happens instead?
2. Which URL and environment? What was the last change?
3. Reproduce once; open Console and Network.
4. Select the failing request: method, URL, payload, status, content type, response.
5. Match its timestamp/request ID to server, provider or build logs.
6. Test one hypothesis, make one small change, rerun normal and negative cases.
7. Confirm the intended commit and retest after deployment.

## Fast routing of symptoms

| Symptom | Check first |
|---|---|
| No HTTP request | UI handler, validation, JavaScript exception |
| No HTTP response | Exact host, DNS/TLS, process, browser block |
| 404 | Method/path/prefix; correct deployed project |
| 200 containing HTML | SPA fallback or wrong API URL |
| 400/422 | Request keys/types and Zod issue path |
| 401 | Session cookie/header, expiry, verification |
| 403 | Ownership, grants/RLS, provider permissions |
| 429 | Brief rate limit versus daily quota |
| 500 | Underlying server exception |
| 502/503/504 | Runtime/upstream/deadline logs |
| Works before reload | Database write/read and session persistence |
| Works in preview only | Secrets, DB, build, URLs, auth, deployment version |

## Connection facts

- GitHub stores code; secrets, database rows and service settings do not follow a clone.
- `VITE_*` becomes public browser code. Never prefix Gemini/JWT/DB secrets that way.
- Replit's current development DB is app-scoped. Do not assume its URL works in local IDEs or Vercel.
- Replit development and production databases are separate.
- Replit updates need republishing; Git branch pushes only deploy when hosting is configured to do so.
- Vite's development proxy is not a production proxy.
- A static frontend deployment does not run an Express backend.
- Vercel currently supports Express, but its static serving/runtime conventions differ.
- Supabase publishable key is public; secret or legacy service-role key stays server-side.
- RLS select denial may look like an empty array. Inspect grants, policies and actual session.
- CORS is enforced by browsers and is not API authorization.
- CLI success does not prove browser CORS or cookies work.

## Commands to inspect a local practice project

```powershell
node --version
npm.cmd --version
git --version
git status
git branch --show-current
git log -1 --oneline
npm.cmd run
curl.exe -i http://localhost:3001/api/health
```

Run the project's declared build and check scripts, not guessed script names. Keep credential-bearing output off shared screens.

## Stop mistakes that make incidents worse

- No blind database reset or destructive migration.
- No shared API keys pasted into chat, logs, screenshots or commits.
- No disabling auth or RLS to make a demo pass.
- No force-push to overwrite teammates' work.
- No stack rewrite for a missing environment variable.
- No unlimited retries or duplicate AI/database submissions.
- No claiming sample responses are live AI results.

## Two-minute handoff

```text
Failure and environment:
Evidence:
Cause or current hypothesis:
Minimal change:
Checks actually run:
Branch/commit/public URL:
Remaining task:
```

## Final public demo check

Fresh browser → register/login → create data → real AI request → reload history → logout/login → second-user isolation → nested-route refresh → phone access.
