# Deployment and release runbook

**Darshit owns integration and deployment.** This is the operational runbook for the implemented application. See FINAL-PRODUCTION-AUDIT.md for observed release evidence. Deployment requires user authorization; credentials remain in local/provider settings.

## A. Prepare a known release

1. Integrate the agreed client/server milestone commits in the chosen branch, using clean checkouts.
2. Review `git status --short`. Do not include parent-folder deleted files accidentally. Confirm .env files are ignored and no credentials were committed.
3. Server: `npm.cmd ci` then `npm.cmd test`.
4. Client: `npm.cmd ci` then `npm.cmd run build`.
5. Record commit ID using `git rev-parse HEAD` when a reviewed commit exists. If work remains uncommitted, say so; do not describe that commit as containing it.
6. Human publishes the reviewed branch to the agreed GitHub repository. Providers require the actual repo/branch, not only a local folder.

## B. Deploy Render first

1. Dashboard → New Web Service → connect the agreed GitHub repo and release branch.
2. Root Directory: `nextstep-hackathon-2026-10-07/server` for this repository layout.
3. Runtime Node; Build Command `npm ci`; Start Command `npm start`.
4. Health Check Path `/api/health`.
5. Use a supported Node 24 LTS runtime in both providers. The final audit used Node 24.19.0; do not assume a particular local patch version is available on the provider. Server reads Render's PORT and binds 0.0.0.0.
6. Add server variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AI_API_KEY, AI_PROVIDER=gemini, AI_MODEL=gemini-2.5-flash, NODE_ENV=production, and ALLOWED_ORIGINS containing the actual frontend origin (plus localhost only when needed for local verification). Do not paste server/.env into the repository.
7. Deploy and inspect logs. Copy the exact HTTPS service origin into the team handoff.
8. Open `/api/health` and `/api/catalog`. Health is not a DB test.

The service directory must contain its own package.json, package-lock.json, and data catalogue. Files outside the selected root should not be runtime dependencies.

## C. Deploy Vercel

1. New Project → import the same repo/branch.
2. Root Directory: `nextstep-hackathon-2026-10-07/client`.
3. Framework Vite; Install Command `npm ci`; Build Command `npm run build`; Output Directory `dist`.
4. Environment variables for the actual deployment environment:
   - VITE_API_BASE_URL = exact Render HTTPS origin, no trailing /api.
   - VITE_SUPABASE_URL = exact project URL.
   - VITE_SUPABASE_PUBLISHABLE_KEY = publishable key.
5. Deploy. Copy the stable Vercel project origin.
6. Add that exact origin to Render ALLOWED_ORIGINS and restart/redeploy Render as required. Example format: `http://localhost:5173,https://your-project.vercel.app` using the actual chosen host.
7. Test the Vercel site now. Do not accept “build passed” as the final result.

Environment changes in Vercel require a new build; values are embedded by Vite. Preview and Production are separate settings. If testing a unique preview URL, deliberately allow that exact origin or use the stable production URL. Avoid wildcard CORS.

## D. Production smoke test — 10 minutes

Darshit operates the browser; Sankirth watches logs; Harshita watches the user journey.

1. Open the Vercel URL in a clean browser profile and sign in privately.
2. Confirm Fetch/XHR requests go to the Render origin.
3. Create a plan with available days that include today, or explain the next future session correctly.
4. Complete the next mission and refresh. State and XP must persist.
5. Preview reduced availability. Cancel once; verify unchanged state.
6. Preview again and Apply. Refresh; completed work remains and pending dates are changed.
7. Sign in as account B in a separate context; verify account separation.
8. Check one failure: stale preview or network unavailability should produce an honest error.
9. Record DEPLOYED LIVE PASS only for observed checks.

## E. Demo data without falsifying history

Provision separate accounts: one fresh for onboarding and one rehearsed for showing progress. Rehearsal actions are real saved synthetic practice events. Do not backdate them to fabricate a month-long streak. If showing a historical heatmap fixture, visibly label it SAMPLE HISTORY and keep it separate from live progress.

For recovery, reducing availability is enough; no fast-forward endpoint is necessary. If using an old planStartDate to demonstrate overdue tasks, state that this is a synthetic scenario. Do not reset all accounts or truncate the table to rehearse.

## F. Freeze and rehearse

- Freeze features at 2:15 p.m. or earlier if mentoring leaves little capacity.
- Harshita runs a 3-minute rehearsal twice; Darshit is the screen operator; Sankirth handles technical questions.
- Capture a backup recording of the actual deployed workflow. Include recording time in notes.
- Just before judging, open Render health and then the UI. Render free services can sleep after inactivity and take about a minute to wake.
- Verify the submitted URL and QR code point to the correct production app, not localhost or an access-protected preview.
- Submit before the organiser's actual deadline; leave margin for upload delays.

## Failure during judging

Show a factual loading/error state, then the labelled recording if needed. Say whether the recording is hosted or local. If reverting a bad deployment, use the provider's known prior successful deployment through its dashboard and retest; do not improvise destructive Git resets.

## Final claim checklist

Working today: [fill from evidence].
Synthetic data: [state explicitly].
Self-reported learning: yes.
Runtime AI: server-side Gemini guidance and selected rubric-based understanding checks; verify the actual provider response after each deployment.
Not yet validated: long-term retention, learning gains, placement outcomes.
Known limits: twelve-mission starter, pilot accounts, no external completion verification.

## Existing linked deployments

The submitted frontend is https://next-step-six-theta.vercel.app and its API is https://nextstep-j78x.onrender.com. A GitHub push is not deployment proof. Confirm Vercel production status and the served bundle. On Render, compare the health response X-NextStep-Revision header with the released commit; health alone does not verify the database or Gemini. If automatic deployment is disabled or fails, use the authenticated provider dashboard to deploy the reviewed commit, then repeat the smoke tests. Preserve the current submitted URLs.
