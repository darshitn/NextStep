> **Earlier reference:** [START-HERE](../START-HERE.md) is the current scope and ownership authority. Runtime AI is now required; Sankirth owns API/auth adapters and integrations. Auth compliance and the AI contract extension must be settled before dependent implementation. Old prompts await Darshit's new prompt structure.

# Product and scope lock

## Problem statement

Students can research ambitious career goals yet stop before meaningful practice begins. Large roadmaps, uncertain daily actions, and a growing backlog after missed sessions make it difficult to return. NextStep turns a selected preparation track into small missions that fit a student's availability, makes completed work visible, and helps them revise the remaining plan when their available time changes.

## Evidence and honest positioning

Darshit's GSoC experience is the founding anecdote, not a population-level finding. Harshita can ask 3–5 students about their last abandoned preparation attempt and record voluntary, anonymous responses. Do not invent survey numbers. Habit trackers, study plans, and rescheduling products already exist. Our pilot combines a curated student preparation track, workload visibility, and recovery after disruption.

## Essential tier — implement first

1. Email/password sign-in for pre-created Supabase demo accounts.
2. One goal per account: **DSA foundations starter**, twelve 30-minute missions, six estimated hours total.
3. Setup: start date, target date, flexible/fixed deadline, minutes available by weekday.
4. A deterministic plan fitting whole missions into the selected days, with a capacity warning when necessary.
5. Today card: next eligible mission, reason/resource, estimated time, completion/reflection action.
6. Completed-count and XP derived from saved completion events; progress survives refresh.
7. Recovery: edit weekly availability, preview changes and target feasibility, then apply explicitly.
8. Separate loading, empty, error, stale-version, and saving states.

The catalogue is a **starter module**, not a complete DSA or placement syllabus. Six hours is an estimate of activity time, not mastery. The sample can demonstrate two- and four-week planning. A two-/four-month course would require a larger, reviewed catalogue; do not pad the pilot with repeated tasks to imply that it already exists.

## Polish tier — only after the essential tier works on Vercel

- Small activity heatmap from real completion dates.
- Subtle celebration after a successfully saved completion.
- One level per 60 XP: level = 1 + floor(XP / 60); each distinct mission earns 20 XP.
- A short weekly summary derived from saved events.

## Explicit cuts for mentor time

- No GSoC track in this event's essential build. Explain it as future work.
- No generative roadmap, live LLM calls, code runner, scraped LeetCode history, GitHub integration, leaderboard, notifications, calendar sync, or avatar shop.
- No prerequisite remediation engine or automatic task splitting. Missions are 30 minutes; an unusably short availability must be explained.
- No promised cross-device instant updates. Saving plus reload is enough; Realtime is optional after release checks.
- No public registration/password recovery flow. Pilot accounts are provisioned by Sankirth; this is a disclosed deployment limitation.

## Four UI areas, not four separate applications

1. Sign-in + first-use setup.
2. Today: one obvious next mission, its resource, completion state.
3. Journey: dates and ordered missions; completed work stays visible.
4. Progress + recovery modal: history, availability edit, before/after, Apply.

Use tabs on a single `/` route to avoid SPA routing configuration during the event. Use React/Vite with the styling approach Darshit already knows. Limit animation to saved-success feedback, respect reduced-motion preferences, provide keyboard focus and clear labels. Accessible controls are good product quality; do not claim to treat ADHD or other conditions.

## Low-capacity fallback

If each developer has only 90–120 focused minutes: remove heatmap, levels, reflections, decorative timeline, and deadline mode selector from the UI (use flexible mode). Retain create → complete → recovery preview/apply → refresh persistence. Keep the backend contract valid for fixed mode even if its UI is deferred, or explicitly mark that route unimplemented rather than faking it.

If recovery is still broken at the feature freeze, stop additions and repair it. Recovery is the distinctive demo, not an optional animation. If it cannot be made reliable, present the narrower working scope honestly.

## Sample demo narrative

At 60 minutes each Monday/Wednesday/Friday, twelve missions take six study days. Reducing to 30 minutes on those days takes twelve study days before accounting for completed work. The actual dates must be computed, not typed into presentation graphics. Mark the fast-forward sample as synthetic; never backdate real events to manufacture a streak.

## Acceptance statement

An authenticated student can create a real saved plan, finish a mission exactly once, reduce their capacity, inspect the consequences, apply the new plan, and recover the same state after reload. A second account cannot see or change that goal.
