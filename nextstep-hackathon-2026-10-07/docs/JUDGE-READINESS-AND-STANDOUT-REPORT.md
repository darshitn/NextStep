# NextStep: judge readiness and standout product report

Date: 7 October 2026. Audience: Darshit, Sankirth and Harshitha.

## 1. Decision

Build the submission around **a student recovering from a specific DSA misconception**, then returning to practise with their context intact. Prioritise a reliable, self-guided experience that online evaluators can understand without your team narrating every click.

Recommended positioning:

> NextStep helps students turn a DSA blocker into a small practice action, check their reasoning, and resume preparation when college work interrupts their plan.

Recommended flagship addition: **Predict → Explain → Retry**. The student operates a tiny algorithm trace, makes a choice, sees the resulting state, explains it, and retries a different example. Deterministic code checks the trace; AI offers bounded, personalised explanation. This provides a visible learning interaction rather than another generated plan.

A prize cannot be secured by a feature list. Make the problem, benefit, working implementation and evidence unmistakable. Do not represent synthetic examples as user research, mocks as live integrations, or an AI judgement as proof of mastery.

## 2. What this audit actually verified

The working tree now contains learning-loop implementation, beyond the earlier prompt. Source inspected includes DashboardPage, GuidancePanel, ResumePracticeCard, API adapters, curatedChecks, schemas, learning tests, migration and presentation notes.

| Evidence | Result | Limit |
|---|---|---|
| `npm.cmd --prefix server test` | 37 passed | Tests use mocked providers/storage; they do not establish production RLS or real AI quality |
| `npm.cmd --prefix client test` | Latest run: 14 passed | Fixture tests, not rendered browser interaction tests |
| `npm.cmd --prefix client run build` | Passed; 1609 modules | Build success does not establish deployment success |
| New learning functionality | Present in source | Live authenticated journey not independently tested in this audit |
| Fresh browser preview | Attempted; connection timed out | No fresh visual, mobile or accessibility certification |
| Deployment / actual Gemini responses | Not verified here | Required before claiming a complete live MVP |

The first backend/build attempts encountered sandbox EACCES/EPERM; approved retries passed. The first client run had two failures, then files changed during the audit and a new run passed all 14. This report did not fix those files. Treat results as a snapshot of an actively edited checkout.

The selected theme is recorded in the project as Personalized AI Experiences. The linked official Google Doc could not be retrieved during this audit. Exact scoring weights, current submission conditions and mentor eligibility were not independently reverified. The strategy below is our recommendation, not an invented official rubric. Check the current organizer notice for the online format, deadline, allowed prior work and mentor participation before final submission.

## 3. Student problems and the solution we can demonstrate

These are product hypotheses informed by Darshit's own experience, not survey findings.

| Student problem | NextStep response | Evidence to show | Current boundary |
|---|---|---|---|
| “I collect roadmaps but don't start.” | One sequenced mission and a concrete first action | Enter a goal and immediately reach a practice step | Existing 12-mission pilot; not a complete placement syllabus |
| “I read an explanation but cannot trace the algorithm.” | Curated check; proposed interactive trace | Student predicts state, receives feedback, retries | Three curated textual checks exist; visual trace is proposed |
| “I am stuck but cannot ask a useful question.” | What I tried / where I got stuck, then contextual guidance | Guidance addresses the supplied blocker | Real provider relevance still needs verification |
| “After a break, I forget where I stopped.” | Saved blocker, answer and resume card | Refresh/re-login and resume the same mission | Persistence path exists; verify deployed round trip |
| “Labs disrupt my study schedule.” | Preview and apply revised availability | Finish estimate changes while completions remain | Deterministic scheduling; not AI-generated dates |
| “A green checkbox doesn't mean I understood.” | Separate activity, self-report and coaching feedback | Show completion count separately from unresolved checks | No validated mastery score |
| “Studying alone is hard to sustain.” | Optional private two-person study room | Second device changes its study status live | Proposed stretch feature; no retention evidence |

Avoid a broad unsupported pitch that all other platforms abandon students or only dump solutions. LeetCode already offers a curated 75-question study plan for roughly 1–3 months. A problem list and streak alone are weak differentiation. Our proposed advantage is the integrated blocker → practice → feedback → resume → recovery flow. This is positioning, not a claim that no competitor offers similar features. [LeetCode 75](https://leetcode.com/studyplan/leetcode-75/)

## 4. UI verdict: modern styling, but the interaction still needs focus

**Minimal palette: yes. Minimal interaction: not yet. User-friendliness: promising, but unproven with students.** This judgement uses current source and the earlier user screenshots; fresh current rendering could not be checked.

Positive foundations:
- Neutral Light/Dark tokens, consistent rounded surfaces and restrained shadows.
- A clear current mission, useful completion criteria and a collapsed full roadmap.
- Loading, error, saving and version-conflict handling paths.
- Completion explicitly described as self-reported practice.

Specific issues to address:

| Source observation | Why it matters | Change |
|---|---|---|
| ProgressSummary precedes the practice action; resume, mission, guidance, activity and roadmap stack vertically | The student scans several sections before understanding what to do | Lead with one Start/Resume practice action; move calendar and charts to Progress |
| Mission actions emphasise Get AI Guidance and Record Completion | The interface foregrounds asking and reporting, rather than practising | Primary action: Start practising; hints and completion become steps within the session |
| Labels include Save Blocker Context, Personalized AI Mission Guidance and Curated Check | They describe implementation rather than a student's task | Use Save my notes, Help me get unstuck and Try a quick check |
| Guidance form uses small text and many simultaneous controls | Dense screens are harder to read during screen sharing and on phones | Show one stage at a time; use readable main text, clear hierarchy and fewer badges |
| Answer placeholder contains the linear-search answer: “3 comparisons ... 4 comparisons” | It leaks the answer to a supported check and contaminates the demo | Replace with neutral scaffolding: “Explain each comparison and your stopping condition” |
| Blocker/answer labels lack explicit htmlFor/id association in inspected JSX | Form accessibility needs correction | Associate labels; expose selected states; check keyboard focus and error announcements |
| ResumePracticeCard mixes semantic classes with `dark:` variants and unsupported-looking `ui-bg-soft/50` / `ui-border-border/60` suffixes | Styling conventions can diverge from the data-theme switch | Use the established runtime theme classes; inspect generated CSS and test both theme choices against OS theme |
| AppShell header combines logo, toggle, track, username and sign-out | Narrow screens may crowd or overflow | Test 360/390px widths, collapse secondary details and keep sign-out accessible |
| Footer foregrounds Deterministic Scheduler and timezone | Technical detail takes attention from studying | Move architecture explanations to About/submission materials; retain relevant timezone near dates |

Do not spend the remaining time on another complete visual redesign. Keep monochrome styling and improve hierarchy, copy, focus and transitions. Modernity comes from predictable feedback and saved state as much as appearance.

Recommended navigation: **Practice · Review · Progress**. If time is short, implement Practice and Progress, with review inside Practice. A full sidebar is unnecessary.

Suggested first viewport:

```text
NextStep                          Practice   Progress   Theme

Explain the duplicate check
30-minute mission · Arrays and hashing

Last time: you were unsure why checking comes before insertion.

[Resume practice]                       Adjust my week

3 of 12 missions completed · 1 check to revisit
```

## 5. The flagship: Predict → Explain → Retry

Use mission m04 first. One fully tested exercise is a better initial scope than three partial implementations.

1. Show `[2, 5, 2]`, the highlighted index and an empty seen-set.
2. Student selects the next valid operation: check membership, insert or stop.
3. Deterministic transitions reveal the resulting array/set state.
4. An incorrect choice triggers a question about the misconception, not just a red cross.
5. AI explains that observed mistake using a trusted exercise definition and the student's explanation.
6. Offer a different curated input, such as `[4, 1, 4]`, to check whether the student can repeat the reasoning.
7. Save the attempt, hints used and student takeaway. Offer it on return.

For “insert before check,” show a counterexample with a single new value: insertion followed by membership checking would incorrectly treat it as already present. This makes the failure visible and keeps the correctness explanation precise.

MVP implementation: React cells/buttons, a small finite-state transition function, curated exercise definitions, Supabase attempt persistence and the existing Render guidance service. No code runner, arbitrary code execution or AI-generated animation required. Serve public exercise metadata through the API; retain assessment rubrics server-side. Give text descriptions and keyboard controls alongside visual changes.

Acceptance: the same action/input has the same algorithm outcome; hints never mutate completion; reload restores the correct mission/attempt; a different example works; wrong answers do not unlock fake mastery; failure of AI does not prevent deterministic practice.

Research rationale: asking a student to retrieve and explain prior knowledge aligns with retrieval practice. That supports the design direction; it does not prove NextStep improves retention or placement outcomes. [The Learning Scientists](https://www.learningscientists.org/blog/2016/6/23-1)

## 6. Prioritised implementation choices

Effort bands are planning estimates for this existing app with an AI coding assistant, including basic testing. They are not guarantees; integration gates can exceed them. Do not add the estimates together and assume everything fits.

| Priority | Addition | Why it helps online judging | Estimated focused effort | Ship condition |
|---|---|---|---|---|
| P0 | Verify deployed core; fix demo/script inconsistencies | Evaluators can actually reproduce the promise | 1–3 hours; external blockers uncertain | New-user flow, saved reload, real AI, second-user isolation verified |
| P0 | Neutral answer placeholders; labels, copy and theme consistency | Removes visible credibility/usability defects | 30–90 minutes | No leaked answer; readable keyboard-accessible forms |
| P1 | Dedicated Practice view | Product feels actionable | 2–4 hours | Main task reachable immediately; drafts safe on exit |
| P1 | One interactive trace + alternate example | Strongest memorable product demonstration | 2–5 hours | Deterministic exercise, save/reload, wrong-answer path |
| P1 | Why this next? explanation | Makes personalisation visible | 30–90 minutes | Every explanation derives from real state, not invented profiling |
| P2 | Personal review queue | Connects today's difficulty to tomorrow's action | 1–3 hours | Unresolved checks available, ready states handled, no extra hidden workload |
| P2 | Guided judge example | Removes onboarding friction for remote evaluation | 1–3 hours, depending on isolation | Clearly synthetic, isolated per visitor, normal signup also works |
| P3 | Private two-person study room | Adds social usefulness and visible Supabase capability | 3–6 hours | Membership authorization, reconnect and two-device test pass |
| P3 | Calendar export | Fits study sessions into student routines | 1–2 hours | Asks for actual start time, correct timezone, export labelled honestly |
| Defer | Code runner, voice interviewer, full Google Calendar sync, automatic GitHub publishing | Broader scope but higher operational cost | Separate milestones | Consider after core is stable |

**Small standout feature: Why this next?** Example: “This is next because array tracing is complete and your last check showed uncertainty about set membership.” If only self-report supports the choice, say that. With fixed curriculum order, explain the actual next prerequisite and tailored coaching; do not claim an adaptive curriculum engine you have not built.

**Useful surprise: confidence versus evidence.** Optionally ask “Confident / Unsure” before a check and show a neutral revisit suggestion when a confident answer contains a misconception. Store the two signals separately. This needs no new provider integration and is more meaningful than invented readiness percentages.

**Realtime study room:** Supabase Presence supports low-frequency shared status. Use membership-protected private channels. Share Starting / Stuck / Finished status, not private notes or answers; store durable history separately. Do not send timer ticks every second through Presence. Prefer this only when there is enough time after the solo experience works. [Presence](https://supabase.com/docs/guides/realtime/presence), [Authorization](https://supabase.com/docs/guides/realtime/authorization)

For central online evaluation, the interactive trace outranks the study room: a single evaluator can experience it immediately without recruiting a second participant.

## 7. Online evaluation: make the product explain itself

Treat the first visit as part of the submission, not just a login screen.

- State the problem in one sentence, show the actual practice screen and provide Start preparing plus Try a sample session if implemented.
- A sample session must be labelled synthetic and isolated per visitor. Prefer separate temporary/demo state; never let all judges overwrite one shared account. If preview mode uses fixtures, say so and provide the actual live flow separately.
- Provide a short “Try these three actions” guide: make a trace prediction, save a blocker and reload, change availability and preview the consequence.
- Give the evaluator the live URL, exact supported scope, a short captioned demo and concise setup README in one place.
- Verify direct route refresh, a fresh browser login, actual Render responses and Supabase persistence. Check the app after idle time on the actual hosting plan; do not assume a successful warm request establishes startup reliability.
- Capture the deployed release identity when recording. Rehearse on ordinary laptop resolution with readable text and slow enough cursor movement.
- Use a labelled recorded fallback if live service fails. Do not edit footage to imply an AI response or database write happened when it did not.

The exact video length and judging format must follow the current organizer instruction. The sequence below fits roughly 3–4 minutes and can be shortened.

| Time | Harshitha's story | Visible proof |
|---|---|---|
| 0:00–0:20 | “The hardest part of my plan was returning after I got stuck.” Use Darshit's real origin experience | The problem and intended student |
| 0:20–0:45 | Introduce illustrative student Ananya and one blocker | Actual mission, prior note and one primary action |
| 0:45–1:35 | Student makes a trace prediction and receives specific feedback | The flagship interaction, if implemented |
| 1:35–2:05 | Student explains a different example | Reasoning/check feedback; no mastery claim |
| 2:05–2:35 | Save, reload, resume | Durable context and clear next step |
| 2:35–3:05 | Labs reduce study time | Recovery preview and unchanged completed work |
| 3:05–3:30 | Explain the four tools and tested boundary | Vercel UI, Render rules/AI, Supabase data, Antigravity development |
| 3:30–3:50 | Close with actual student observations if collected | Evidence and a clear invitation to try the app |

Until interactive tracing exists, demonstrate the current curated textual check and do not narrate the proposed animation as shipped.

## 8. Fix the current presentation before recording

The inspected LEARNING-LOOP-DEMO.md names buttons such as Ask AI Coach and Save Blocker Notes, while inspected components show Get AI Guidance and Save Blocker Context. Rehearse from the running app and update the script to exact labels after final UI changes.

Its persona says Missions 1 and 2 are completed while Mission 4 is active. Prepare a synthetic account with all required preceding missions, including m03, actually completed. It also describes m01 as array indexing although the catalogue title is Map your starting point. Correct these details. Never bypass prerequisites just for the video.

Replace the unsupported claim that traditional platforms either dump solutions or leave learners stranded with a precise statement: “Our target student struggles to translate a study plan into consistent practice and to resume after getting stuck.”

Suggested Q&A:
- **Why not just use ChatGPT?** NextStep combines mission-specific state, trusted exercise definitions, saved attempts and a schedule that preserves progress. AI explains; deterministic code owns algorithm transitions and scheduling.
- **Why not just use LeetCode?** NextStep's pilot concentrates on the student's preparation and recovery workflow around a small DSA sequence; it does not replace LeetCode's catalogue or judge.
- **What is personalised?** Guidance uses the current mission and student context. Demonstrate two different blockers producing relevant differences. Explain fixed versus adapted parts explicitly.
- **How do you know it works?** Show tested persistence and actual observed usability results. Do not infer long-term learning from a short demo.
- **What happens when AI fails?** Student work remains saved; curated exercise behavior remains available; AI feedback has a visible retry path.

## 9. Collect small, credible evidence

Ask 3–5 willing students to try an isolated synthetic scenario without coaching. This is a formative usability check, not an efficacy study.

Tasks: find the next action; attempt a supported check; save and return to a blocker; reduce availability and explain what changed.

Record: time to first meaningful action, unassisted completion of each task, confusion points, whether they can explain the next step, and one optional anonymous quote with permission. Report raw counts and actual observations, including failures. If two students misunderstand a label, fix it before adding a feature.

Do not claim “improves retention by X%” or placement impact without appropriate evidence. A real observation such as “4 of 5 participants resumed their saved attempt without help” is usable only if those are the actual results.

## 10. Team execution and stop rule

Darshit: implementation and targeted fixes, one editing session. Sankirth: provider configuration, deployed API/auth/CORS checks, two-user persistence checks and release evidence. Harshitha: independent first-visit test, exact-click script, clear captions and recording. The repository's current ownership decision keeps implementation with Darshit; do not run competing agents editing the same checkout.

If fewer than two focused hours remain: ship no large feature. Verify the live core, fix answer leakage/copy, prepare the exact demo and record it.

With roughly half a focused day: add Practice navigation and one reliable interactive exercise, then stop for deployment and rehearsal. Add a review queue only if the core gates pass comfortably. Do not attempt every integration in this report.

Freeze new features with enough time for one complete deployed rehearsal and a fallback recording. Minimum release gate: tests/build pass, live guidance checked, save/reload works, account isolation checked, mobile/keyboard/theme review done, submission links open outside your signed-in session, script matches the app.

**Recommended final submission package:** the current verified learning loop + a focused Practice screen + one excellent Predict/Explain/Retry exercise + a self-guided online demo. This is a coherent, demonstrable MVP; the study room and larger integrations are optional extensions.

## Sources and audit scope

- Current local NextStep source and tests inspected on 7 October 2026; uncommitted work preserved. No app source fixes, Git publication or deployment performed by this audit.
- [LeetCode 75](https://leetcode.com/studyplan/leetcode-75/): existing curated study-plan offering.
- [The Learning Scientists: retrieval practice](https://www.learningscientists.org/blog/2016/6/23-1): pedagogical rationale, not evidence of NextStep efficacy.
- [Supabase Presence](https://supabase.com/docs/guides/realtime/presence) and [authorization](https://supabase.com/docs/guides/realtime/authorization): proposed realtime integration capabilities and access boundaries.
- [Official selected-theme document](https://docs.google.com/document/d/1Ar7y--2HiAOCPAjeRJskQ8DcNInF65tPB9lcjwO9RAI/edit): previously selected project reference; not retrievable during this audit, so no official weights are asserted.
