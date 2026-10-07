> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Darshit — product and frontend owner

## Your responsibility

Make the next action obvious and the saved state trustworthy. Own client/** only, plus your handoff. Sankirth owns integration/backend/provider settings. Harshita owns the pitch; supply evidence and answer product questions, not presentation assets during core coding time.

## Before starting — 10 minutes together

1. Read README, scope, team-sync, and API v1.
2. Confirm your available focused blocks around mentoring. If below 150 minutes, tell Sankirth and cut polish now.
3. Open your own checkout in Antigravity. Select the available Gemini Flash model you normally use. Use planning/review for a new milestone, and short targeted repair prompts for fixes.
4. Copy Common Start from your prompt file, then D1 only.
5. Record G0 acceptance in handoffs/DARSHIT.md.

## D1 — shell and connection

Create client package, strict 5173 dev server, one Supabase Auth client, one API adapter, login view, and health/catalog status. Use plain labelled fixture data only for UI states while waiting for S1. An unready backend must show WAITING/error, not fake live success.

Acceptance: build passes; login form is labelled; missing config gives a useful message; local health reaches port 3001 once S1 is ready. Report D1 READY or WAITING. Do not wire unfinished goal routes by guessing their shape.

## D2 — first live goal

Start after S1's API/auth readiness and your D1 pass. Implement GET goal, empty-state setup, POST create with stable creationRequestId, Journey list, and Today card. Reuse the exact API fields. Include current weekday availability so the demo can start promptly. Use returned schedule dates; do not reproduce scheduling logic in React.

Acceptance: new goal saves, reload returns same ID, existing goal loads without recreation, loading/failure states are visible. Ask Sankirth to verify the row and second-user isolation. Wait for G2 acceptance before D3.

## D3 — meaningful progress and recovery

Wire next-mission completion, returned XP/count, recovery preview, Cancel, Apply, and stale-preview handling. Show previous/new finish date, any changed target, and moved mission count. Explain that the track is a six-hour estimated starter module.

Acceptance: duplicate click cannot inflate XP; refresh keeps progress; preview Cancel does not save; Apply moves pending work and preserves completions. Build passes; API failures remain visible. Send Sankirth the exact browser evidence, not merely a screenshot of a dashboard.

## D4 — release and visual polish

After G3, test the actual Vercel app with Sankirth. Fix blocked actions, cramped layout, and contrast before adding a heatmap. If time remains, add a heatmap from completion dates, a level label, and one subtle animation. Never seed fake history into the real progress display.

## Your handoff to Sankirth

```text
D[n] READY / WAITING
Build command/result:
Browser request URL and statuses (no secrets):
What is using fixtures:
What has been verified live:
Contract changes requested: none / exact proposal
Blocker / next action:
```

## Your handoff to Harshita

Send the actual deployed URL, one screenshot of Today, one of recovery before/after, and the concise list of observed working features. Tell her which numbers are estimates and which events are self-reported. Give her the screen control during rehearsal only after the path is stable.

## During presentation

You operate the demo. Harshita narrates. Sankirth answers architecture questions. Your strongest line: “I knew the goal, but did not know the next manageable action. This is the experience I wanted.” Keep it personal; do not generalise into unmeasured dropout statistics.
