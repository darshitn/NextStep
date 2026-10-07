# Troubleshooting: one failed request at a time

## The five-minute diagnostic loop

1. Reproduce once and record what you clicked.
2. Browser F12 → Network → Fetch/XHR → select the request.
3. Record **method, full URL without secrets, status, response Content-Type, response body, and time**. Do not share cookies/JWTs/passwords.
4. Sankirth finds the corresponding server/Render log.
5. State one hypothesis, make one small change, retry normal and failing cases.
6. Append the cause and evidence to your handoff. After two failed hypotheses or ten minutes, pair on it instead of asking an agent to rewrite the app.

Copyable incident note:

```text
Action:
Expected:
Actual:
Request method + URL:
HTTP status + content type:
Sanitized response / log:
Hypothesis:
Single change:
Retest result:
```

## Laptop and terminal problems

| Symptom | Check / fix | Pass condition |
|---|---|---|
| npm.ps1 cannot run / scripts disabled | Use npm.cmd rather than npm. Do not change machine-wide policy. | npm.cmd --version works |
| Preflight .ps1 gives AuthorizationManager check failed | Use the default `node scripts/preflight.mjs`; the optional PowerShell file is not required. | Node preflight completes without a policy change |
| node/npm not recognised | Confirm installation and reopen terminal/Antigravity so PATH refreshes. | node --version and npm.cmd --version succeed |
| Vite reports unsupported Node | Read its installed engine requirement; align both developers/hosts to the agreed Node 24.x. | clean install + build pass |
| ENOENT package.json | Get-Location; check client/package.json or server/package.json exists. Root has none by design. | command runs in the correct app directory |
| Missing script dev/test | Agent did not meet scaffold contract. Inspect package.json scripts, have owner add/verify missing script. | agreed command succeeds |
| npm ci says lockfile missing/out of sync | Owner runs npm.cmd install intentionally, reviews package/lock changes; subsequent clean install uses ci. | package and lock agree |
| EADDRINUSE / port already used | Identify the exact port/process using commands below. Stop only your own known process, preferably Ctrl+C in its terminal. | one listener on the intended port |
| Vite starts on 5174 | Turn on strictPort, resolve 5173 conflict, or agree/update every matching origin. | printed origin matches ALLOWED_ORIGINS |
| Module not found | Correct cwd, install from the right package lock; check file-name casing. | module resolves locally and on Linux hosting |
| PowerShell behaves differently from tutorial | Use the PowerShell commands in this kit, not Linux export/rm commands. | same documented output |

Read-only port diagnosis:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3001,5173 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
```

Then replace the numeric example with the actual observed PID:

```powershell
Get-Process -Id 12345
```

Only after identifying it as your app, use Ctrl+C in its terminal. If that terminal is unavailable and you intentionally stop your known app: `Stop-Process -Id 12345`. Never kill every node.exe process; mentors may have other students' apps running.

## Browser/API diagnosis

| Symptom | Likely checks in order | Fix / verification |
|---|---|---|
| ERR_CONNECTION_REFUSED | Is server terminal alive? Is URL/port correct? Can health open directly? | Start correct service; direct health then browser fetch |
| Failed to fetch | Inspect URL, protocol, DNS, server reachability, then CORS. It is not always a CORS issue. | capture the actual Network failure |
| /api/api/goal 404 | API base includes /api twice | base must be origin only |
| Browser calls localhost after deployment | Built VITE_API_BASE_URL is wrong | set Render origin in correct Vercel environment and redeploy |
| Request goes to Vercel /api/goal | Missing explicit API base | set base to Render; this plan does not use Vercel API rewrites |
| Unexpected token '<' / HTML response | Wrong host/path returned an index.html or provider loading page | inspect Content-Type and URL before JSON parsing |
| CORS error / OPTIONS 401 | Exact Origin absent from allowlist, trailing slash, or auth applied before preflight | handle OPTIONS before auth; allow exact origin + Authorization/Content-Type |
| GET works, POST fails | Preflight, JSON header/body, method allowlist, server JSON middleware | inspect OPTIONS and POST separately |
| 401 | Expired/missing user access token; publishable key mistakenly used as Bearer token | sign in, send session.access_token; verify server getUser |
| Login invalid credentials | Wrong Supabase project, unconfirmed test user, password mismatch | verify project and confirmed user privately |
| 409 VERSION_CONFLICT | Another tab saved or preview is stale | reload current goal; regenerate preview; don't overwrite blindly |
| 409 GOAL_EXISTS | Same user already has a goal | GET existing goal; don't keep creating or delete the table |
| 422 | Read fields/error code; wrong date/availability/prerequisite | show actionable error; fix input, not validation |
| Saved toast but refresh loses data | UI used fixtures or acknowledged before database save | check actual POST response, authenticated GET, database row |
| Duplicate XP | Completion handler increments mutable XP or handles retries twice | derive XP from distinct completions; idempotency test |
| Completion vanishes after recovery | Stale update accepted / recovery rebuilt from empty state | version CAS + preserve completion map; add regression test |
| Rest-day/date shifted by one | Date-only parsing used machine local timezone | follow Asia/Kolkata date rules; test UTC-boundary case |

Manual CORS preflight probe (only after server starts):

```powershell
curl.exe -i -X OPTIONS 'http://localhost:3001/api/goal' -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: authorization,content-type'
```

Expect a successful OPTIONS response with the exact Access-Control-Allow-Origin and permitted method/headers. A curl success alone does not prove browser CORS: verify in the browser too.

## Supabase problems

| Symptom | Check / fix |
|---|---|
| Relation/table not found / PGRST205 | Correct project? Reviewed migration applied? Exact public.nextstep_goals name? Confirm table/schema; reload schema cache via supported dashboard guidance if necessary. |
| 401 invalid API key | Project URL and publishable key belong to the same project; no whitespace or placeholder text. Never print the key. |
| Row-level security policy error | Per-request client must carry actual user JWT; auth.uid must match owner_id. Check grants AND policies. |
| Goal unexpectedly null | Wrong user/project or missing SELECT policy. Compare account identities without logging tokens. |
| User B sees A's goal | Shared mutable server session or missing owner/RLS filter. Stop demo; fix isolation before more features. |
| Database paused/unavailable | Inspect project status, wait for recovery, verify authenticated read. Never show fake saved success. |
| Agent asks for DATABASE_URL or pooler | This kit uses Supabase HTTP client. Return to architecture rather than adding a second database access method. |

## Hosting problems

| Symptom | Check / fix |
|---|---|
| Render can't find package.json | Root Directory must include the hackathon folder prefix if repo root is its parent. |
| Render no open port detected | Bind process.env.PORT on 0.0.0.0; start script must run server, not a build/watch-only command. |
| Render deploy fails | Read first meaningful build error; Node version, lockfile, casing, missing env. Existing successful deploy may still serve old code. |
| Slow first request after inactivity | Free service may be waking; wait, verify health. Avoid repeated blind POSTs. |
| Vercel build succeeds but wrong app appears | Wrong root/project/branch or stale deployment URL. Check current deployment commit. |
| Env fixed but browser unchanged | Vite embeds env at build time. Redeploy the correct Production/Preview environment. |
| Preview URL blocked by CORS | Allow the exact reviewed preview origin, or use the stable production domain. Do not allow arbitrary wildcard origins. |
| HTTPS page requests HTTP API | Mixed content is blocked. Production API must use Render HTTPS. |
| Deep link refresh 404 | Essential app uses a single route. If routers were added, owner must configure and verify SPA rewrites. |
| Works locally, fails in production | Compare exact URLs/origins, provider env names, root directories, build/start commands, Node versions, and case-sensitive imports. |

## When the network fails during judging

Harshita says: “The hosted request is unavailable right now. Here is the recording of the same deployed workflow captured at [actual time].” Label the video as recorded evidence. A local fixture mode can explain the UI but is not proof of hosted persistence. Do not switch silently to a fake backend.
