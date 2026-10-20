# First-use experience: simplify first, guide second

Date: 2026-10-20
Status: analysis complete; implementation not started.

## Evidence and limits

Inspected the live public login in an isolated browser and local labelled synthetic Today, Proof, Atlas, Week and Review using student.firsttime. Captured desktop and mobile screenshots under ignored client/.local/usability-audit/. Read current Today and navigation implementation. No production login, student record writes or actual novice usability study was performed. Findings below are interface observations; task-time targets are acceptance goals, not measured user outcomes.

Observed:
- Eight peer navigation destinations include unexplained Atlas, Proof and Roadmap labels.
- Today simultaneously offers a first curriculum lesson, starter mission M02 and a repeated Atlas & Proof recommendation for the same lesson.
- At 390px, schedule statistics occupy much of the first screen before the learning action. The More label is visually truncated.
- First-time curriculum invitation explains two tracks using "formal invariants" and "zero unmet prerequisites" before a newcomer has learned the workflow.
- Week says no curriculum plan exists while Today shows scheduled starter missions. The scopes are technically distinct but insufficiently clear.
- Direct Proof entry opens Trace while its learning strip starts with Understand. Topic selectors, mode tabs, learning steps, exercise selectors and trace steps compete for attention.
- Trace save and lesson completion are separate records with repeated check-ins; users need explicit distinction.
- Atlas currently displays fallback stage labels "STAGE 5 · STAGE 5" and "STAGE 6 · STAGE 6". Avoid stale hardcoded names; derive neutral stage numbering when no authoritative title exists.
- Public login explains Supabase infrastructure but does not demonstrate the product's learning experience.

## Product decision

Make the default journey:

Today -> one recommended activity -> understand -> try -> see feedback -> save -> next activity.

Retain existing starter and curriculum records. Present them through one coherent entry point, without pretending they share completion semantics. A walkthrough supports this journey; it must not become a prerequisite for using it.

## Stage 1 — One clear starting point

Scope:
- Give Today one primary "Start today's activity" or "Continue learning" card with title, estimated time and a short reason.
- Selection order: an explicit resumable current activity; otherwise the existing pending accepted weekly-plan activity; otherwise the existing recommendation appropriate to account state. Define and test precedence using current derivations before implementation; do not create a second scheduling algorithm.
- When starter and curriculum both qualify, identify the recommended source and offer "Choose a different activity" as a secondary action. Keep starter missions accessible and preserve current progress.
- Remove the duplicate recommendation for the same activity. Move detailed dates, history, timer and secondary statistics below the main action; keep essential overdue/conflict notices visible.
- Rename visible navigation while preserving route IDs: Atlas -> Learning path, Proof -> Learn & practise, Roadmap -> Starter track, Insights -> Progress, Week -> My week.
- Desktop groups: Study (Today, My week, Learning path, Practice, Review); secondary Progress and Starter track. Learn & practise is the current lesson workspace, accessible through activity links and an explicit resume entry. Preserve direct navigation for existing users.
- Mobile: Today, Learn, My week and More; menu contains all remaining destinations with full visible labels and correct current-page state.
- In Week, explicitly state whether a curriculum plan exists and link to already scheduled starter work. Do not show an unqualified "no plan" when another schedule exists.
- Replace unexplained operational copy with plain language; retain precise algorithm terms in lesson content with short explanations.

Acceptance:
- A newcomer can identify what to do next without learning the two-track architecture.
- Primary activity appears in the initial 390x844 viewport under normal text sizing; at 320px and enlarged text it remains reachable without clipped content.
- One obvious primary action; all existing destinations still reachable by keyboard and mobile.
- Empty, partially completed, 12/12 completed, active-plan and all-curriculum-complete states have truthful next actions.

## Stage 2 — Contextual interactive guide

Build a small optional "Show me how" guide rather than an automatic eight-page tour.

Entry:
- First visit: dismissible invitation, "Want a quick walkthrough?" with Start / Not now.
- Persistent Help -> Getting started -> Replay guide.
- Three short manual chapters: Start learning, Plan my week, Understand my progress.
- Store only guide version and dismissal/completion preference, scoped to the signed-in account. Never store learning answers in the guide state. Storage denial must not prevent use.

Start learning chapter (up to five steps):
1. Highlight the recommended Today activity: what it is and why.
2. Let the user open the real lesson. Begin new lessons in Learn; resume an existing mode where valid.
3. Highlight the explanation/worked example, then offer Try the question.
4. Explain selecting an answer and feedback. Advance only from the actual interaction/result; no auto-answering or fabricated completion.
5. Explain saving, optional check-ins and what happens next. A tour can end without saving. Saving requires the student's explicit normal action and existing validation.

Interaction:
- Desktop anchored callout with a soft spotlight; mobile compact bottom sheet that never covers the target or keyboard.
- Back, Skip, Close, step count and Replay; Escape closes and restores focus.
- 150–220 ms opacity/position transitions, smooth scroll only when necessary; respect reduced motion.
- No endless pulse, confetti, cursor automation or forced waiting.
- Stable data-guide attributes, route-aware anchor discovery and cleanup. Wait for lazy content; if absent, offer a useful fallback rather than a stuck overlay.
- Manage focus according to one consistent accessible pattern. If a step requires interacting with the highlighted target, the overlay must not make that target inert or trap focus away from it.
- Dismiss on account change/logout. Route changes, errors and unavailable catalog states must be recoverable.
- No new heavy animation dependency.

Acceptance:
- Every guide can be skipped, closed and replayed.
- No answer, completion, schedule or assistance flag changes just from opening/advancing the guide.
- Keyboard-only, touch, reduced-motion, slow-loading and unavailable-target journeys work.
- Guide does not cover the selected answer, error, save action or mobile navigation.

## Stage 3 — Make the lesson finish unambiguous

- Reuse the current learning strip; avoid introducing a competing second stepper.
- Label stages Learn -> Try -> Check -> Finish; preserve underlying authoritative grading.
- Collapse topic/lesson switching behind a clear change-lesson control on small screens.
- Show one current task prominently; keep earlier steps revisitable without clearing answers.
- Explain "Trace saved" versus "Lesson completed" adjacent to their actions. Never silently combine API writes or claim both succeeded when only one did.
- Once trace requirements are satisfied, guide to its save action; after save, show the remaining lesson requirement and an explicit next action.
- Keep self-report check-ins optional and visibly distinct from evaluated answers.
- Use descriptive errors with Retry; preserve answers and current focus.
- Correct Atlas fallback stage labels without editing curriculum algorithms or inventing grouping names.

Acceptance:
- User can explain what was saved and what remains.
- Answer drafts, assistance tracking, server grading, retries, CAS and idempotency remain intact.
- No forced written reflection reintroduced.

## Stage 4 — Judge exploration and focused release

- Add a public "See how NextStep works" entry beside sign-in, plus a concise product explanation.
- Prefer a dedicated isolated interactive sample route: one real example and clearly labelled sample progress; no signup required to explore.
- Keep production auth unchanged. Do not expose the existing general fixture adapter/accounts as production demo mode.
- Sample answers must be evaluated through an appropriate public evaluation contract or explicitly framed as a non-assessed walkthrough; never ship private answer keys or report sample completion as verified learning.
- No production goal writes, external email or AI spend from the demo.
- End sample with "Create my study plan"; do not silently copy sample progress into an account.
- If a safe isolated demo exceeds this release's scope, ship the authenticated contextual guide first and report public demo as pending.

Validation and stop rule:
- Test first-use, returning, completed-starter, empty-plan and active-plan accounts.
- Browser journeys: primary action -> lesson -> answer -> retry -> save -> reload; guide skip/replay; mobile menu; missing lazy anchor; account switch.
- Check 1440/1024/390/320 widths, all six theme variants and reduced motion for changed surfaces.
- Run existing relevant client/server suites and production build once integration is stable; run the release gate before publication.
- Ask 2–3 people unfamiliar with NextStep to start an activity, locate next week's plan and explain saved progress without coaching. Target: identify first action within 10 seconds and reach an activity within 30 seconds. Report actual observations, not assumed results.
- Fix blockers and regressions in this scope. Record cosmetic follow-ups rather than reopening broad redesign.
- Commit/push/deploy only under the user's current publication instructions.

## Delivery sequence

1. Today hierarchy and navigation.
2. Interactive guide and clearer lesson finish.
3. Isolated public sample if feasible, acceptance and release.

No database migration, new course content or recommendation algorithm is required for the core usability work.
