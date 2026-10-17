# NextStep feasible feature shortlist — 17 October 2026

Decision proposal only. No feature is selected or authorized for implementation by this document. Existing persistent-review source changes are preserved and remain separate from this research.

## Current source findings

NextStep has Today/Roadmap/Review/Insights, mission notes, completion outcomes, schedule recovery preview/apply, a session-only focus timer, JSON export and three authored understanding-check missions. Persistent recall saving, confidence and next-review dates are present locally; their execution report is agent-reported evidence, not a fresh independent audit here.

`createGoalSchema` allows only `dsa-starter-v1`. Migration 001 enforces one goal per owner. The scheduler allocates ordered 30-minute missions from recurring weekday availability. Recovery already computes finish dates and respects fixed/flexible deadline behavior. It does not accept date-specific availability overrides. The current catalogue and single-goal assumptions make multiple goals/custom durations a genuine architecture change, not an extra form.

## Ranked options

Effort is relative: small = roughly one bounded milestone, medium = two or three, large = four to six. These are planning estimates for implementation plus verification, not calendar-day guarantees.

| ID | Feature | Bounded first release | Effort | Main acceptance criterion |
| --- | --- | --- | --- | --- |
| 1 | Exam-week and what-if planner — recommended next | Date-specific capacity exceptions/zero-time days; compare proposed finish to target; explain capacity shortfall; preview/cancel/accept; normal weekly availability resumes afterward | Medium | A temporary exception changes only affected capacity, reschedules pending work, preserves completions/reviews and cannot apply a stale preview |
| 2 | Personal goals and milestones — largest product expansion | Multiple manual goals, goal switcher, ordered tasks with estimated durations and completion criteria; existing DSA goal preserved; later simple exam/project templates | Large | Old goal migrates intact; switching cannot mix tasks/notes/reviews; shared capacity is explicit rather than independently double-booked |
| 3 | Structured mistake bank | Add a small set of mistake tags to existing practice notes; filter recurring mistakes; link back to source mission and relevant authored drills | Small–medium | A saved mistake remains searchable after reload; counts reflect recorded tags and never imply verified mastery |
| 4 | More interactive understanding checks | Author four more small predict/trace/explain exercises, with deterministic prediction feedback and accessible controls | Medium | Incorrect predictions receive accurate authored feedback; no code runner, remote execution or fabricated AI success |
| 5 | Mixed-practice sessions | Select a short session from due reviews and previously completed topics; show why each was chosen and record recall attempts | Small–medium | No future mission is unlocked; saving reviews does not award completion XP; selection is reproducible and honest |
| 6 | Calendar export | Download the next week's scheduled missions as an ICS file; all-day events initially because the app stores dates rather than start times | Small | Import dates correctly; escape content; clearly disclose static export and re-import/duplicate limits |

## Recommendation and examples

Select 1 for the strongest next bounded improvement to the existing promise: make progress when a student's week changes. Example: mark exam week as unavailable, preview a later finish and see how much additional weekly capacity would be needed to keep the existing target. Suggestions are estimates; only explicit acceptance changes the schedule. This extends recovery rather than duplicating it.

Select 2 if the priority is restoring the original universal-goal vision. Stage it as owner-scoped multi-goal API/storage, task-duration scheduling and shared weekly capacity, goal/task UI, then migration and regression acceptance. Avoid simultaneous AI curriculum generation, external synchronization and complex dependency graphs. Existing owner_id uniqueness and single-goal reads must be addressed deliberately.

Select 3 for a smaller learning-focused improvement. Existing free-text notes already capture difficulties; the new value is structured retrieval and repeated mistake patterns, not another notes screen.

Suggested sequence: 1 → 2 → 3, adding 6 as an optional small standalone release. Choose 4 or 5 earlier if the product should remain specifically focused on DSA learning.

## Research and interpretation

- Todoist distinguishes when work is planned from a deadline, and supports estimated task durations. These support making capacity visible; they do not establish student outcomes for NextStep. https://www.todoist.com/help/todoist/features/introduction-to-deadlines-in-todoist-uMqbSLM6U and https://www.todoist.com/help/todoist/features/set-a-task-duration-L1kYkZv8d
- The Learning Scientists describe recall followed by checking/feedback, and interleaving previously studied problem types. This motivates authored understanding checks and mixed review sessions. Their general learning guidance is not evidence that NextStep's confidence intervals or proposed selection rules improve retention. https://www.learningscientists.org/blog/2016/6/23-1 and https://www.learningscientists.org/blog/2016/8/11-1
- Google Calendar supports importing ICS/CSV; imported events do not stay synchronized. Calendar export should therefore be presented as a snapshot, with no promise of automatic updates. https://support.google.com/calendar/answer/37118?hl=en

These rankings are product/engineering judgments informed by current code and primary product/educational sources. Student demand and outcome improvement have not been measured.

## Defer

Automatic LeetCode synchronization until an authorized supported integration is established; cloud code execution; social leaderboards without real cohorts; unbounded AI curricula; native mobile apps; browser-push reminders with no reliable delivery design; invented mastery/retention metrics. None is needed for the selected bounded next feature.
