# NextStep dashboard presentation walkthrough

Use this as Harshitha's speaking guide. Darshit operates the app; Sankirth answers integration questions. The signed-in deployed dashboard, AI guidance form and recovery page were reviewed on 7 October 2026 alongside current local source. No completions or schedule changes were submitted during this review. Examples are illustrative students, not testimonials or measured research.

## Your actual live demo state

- Goal: Build my DSA foundations.
- Progress: 3 of 12 missions completed; 9 remain, representing 4.5 estimated hours.
- Estimated finish: 16 October. Target: 6 November. The displayed schedule is within target.
- Next mission: M04, Explain the duplicate check, scheduled 9 October. It can be started early.
- Explain its actual steps: trace a duplicate appearing at the end, explain time and space estimates, and note one uncertainty. Completion criterion: explain a set-based solution, its space use and an empty-input case in your own words.
- Today shows no pending sessions, but three actual completions. This is consistent with offering a future mission as an optional early start.
- Activity shows one active day with three completions. Three missions on one day does not mean a three-day streak.
- Recovery currently shows Monday/Wednesday/Friday at 60 minutes and Sunday at 90: 4.5 hours per week, with three completed missions preserved.

Use these figures only while they match the screen. For this existing account, losing Friday changes weekly capacity from 4.5 to 3.5 hours. The Ananya example below uses a separate, simpler three-hour week; do not mix its figures with this account.

For M04 AI feedback, try: "I understand checking whether a value is already in a set, but I do not understand why this needs extra memory or what happens for an empty array." Select Too Difficult or Need Revision to match the explanation. The visible form also supports Ready to Continue. Show the actual generated answer during rehearsal before using it in the pitch.

## Opening story

“Our teammate Darshit researched how to start preparing for GSoC, but did not continue after that initial research. We recognized the gap between having an ambition and knowing what to do next. For this hackathon, we focused on DSA preparation: a small, structured track that fits a student's available time and helps them resume when college life interrupts.”

GSoC is the inspiration, not a supported preparation track. Keep that distinction explicit.

## One student throughout the demo

Ananya is an illustrative CSE student. She has classes, lab submissions and a commute. She initially reserves 60 minutes on Monday, Wednesday and Friday for DSA. She completes one mission, gets stuck on another, and loses Friday's study slot because a lab submission is due. Follow that same story through the whole dashboard.

## Explain each part

### Sign in and student identity

Purpose: associate a saved plan with the signed-in student. Example: Ananya closes her laptop after class and returns later to the same progress.

Say: “This goal belongs to this account. We can return to the saved state after refreshing or signing in again.” Do not call the header alone proof of data isolation; authenticated access and RLS require separate checks.

### Goal name and selected track

The current interface lets a student name their goal. “Build my DSA foundations before placement practice” gives the plan personal context. Naming it “GSoC preparation” does not generate a GSoC curriculum: the selected content remains the twelve-mission DSA Foundations starter.

Say: “The goal name is personal. The curriculum is deliberately bounded and curated for this MVP.”

### Availability and deadline

Availability supports 0, 30, 60 or 90 minutes per weekday. Zero is a planned rest day. The target date is the student's desired date; estimated finish is calculated from the scheduled work and available slots.

Example: three 60-minute days provide 180 minutes per week. Twelve 30-minute missions represent 360 estimated practice minutes. Real calendar dates and completed work determine the displayed finish.

Say: “We begin with the student's actual week. Tuesday can be a rest day because of labs; the plan does not assume identical availability every day.”

### Progress summary

Explain completed missions, estimated remaining practice, estimated finish and target date separately. One completed mission means 1 of 12 marked complete and 330 estimated minutes remaining. The display may round hours to one decimal place.

“Within target date” means the remaining schedule fits the target. It does not predict interview success. A completed starter means these activities are recorded complete, not that all of DSA has been mastered.

### Your next step

Point to the mission ID/title, scheduled date, 30-minute estimate, purpose, steps and completion criteria. Read one actual mission rather than inventing a topic not on screen.

Example: a student opens LeetCode, sees a large list and spends the session choosing a question. NextStep offers the next eligible activity in a small sequence.

Say: “The student can see what to attempt, why it matters and what finishing this activity means.” Prerequisite order is enforced by code. A resource link points to practice material; it does not verify a LeetCode submission.

Mission badges distinguish today's work, overdue work ready to resume, and an eligible future mission that can be started early. Do not call all of them today's assignment.

### Get AI Guidance

Demonstrate one relevant difficulty: “I can follow the array example, but I lose track of which index changes.” Adapt the example to the actual mission.

Show the difficulty category, short feedback, explanation, practice steps and check question. Explain one visible connection between input and output rather than reading the whole response.

Say: “Gemini receives this mission and the student's feedback through our backend. It suggests a way to approach the same session. The calendar still comes from scheduling rules.”

The AI does not mark work complete, add arbitrary missions or guarantee a correct solution. The check question encourages reflection; it is not an automatically graded assessment. Guidance is temporary and invalidated when relevant goal state changes.

### Record Completion

Show Independent versus With Hint and the optional reflection. Example reflection: “I understood the example after tracing the indices on paper.”

Say: “We allow an honest record of practice, including practice that needed help.” During a demo say you are simulating the completion action, not completing thirty minutes of study live. Completion is self-reported, not automatically verified mastery or a stopwatch measurement.

### Your week

Use Previous week, Today and Next week. Select a day and explain its pending tasks and actual completion log. The calendar uses IST.

Example: Ananya planned a mission for Monday but completed it Wednesday. Scheduled work and the actual completion day are different facts; the calendar lets her inspect both. Old pending work may say it needs rescheduling.

Say: “This helps a student see where study fits around the rest of their week.” Selecting a calendar day does not automatically reschedule tasks.

### Practice activity

The graph shows the last eight weeks. Each filled square represents a day with recorded completions. Its intensity distinguishes 1, 2 or 3-plus missions. Teal indicates completed activity and violet indicates planned work in the calendar. Click a square to inspect that day.

Say: “A missed day does not erase earlier work. This view shows the practice the student has recorded.” Do not call it a streak counter. The active-day total is for the goal and may exceed the days visible in the eight-week graph.

### Adjust my week and recovery

Example: remove Friday's 60 minutes. Weekly capacity drops from three hours to two. Preview first; compare estimated finish and target dates, moved missions and preserved completions. Apply explicitly, then refresh.

Say: “A lab deadline changes Ananya's week. Before changing her plan, NextStep shows the consequence. Her completed work remains; the pending work is rescheduled.”

A fixed deadline stays fixed and may show overflow. A flexible deadline extends only if needed after accepting recovery; it does not necessarily change with every adjustment. The rescheduled count means missions whose dates moved, not total unfinished missions. Recovery is user-triggered, not autonomous calendar monitoring.

### Expand the roadmap

Show the twelve missions and their completed/current/upcoming states. Explain that the next-action view reduces the amount to process at once while the full roadmap remains available for context.

Say: “The student can focus on one next action without losing sight of the rest of the sequence.”

### Refresh and saved state

After a successful write, refresh and point to the same goal/completion/recovery result. This is stronger evidence than saying “we use a database.” The developer can separately inspect state.completions and the row version in Supabase; do not spend the main pitch scrolling through database JSON.

## Four minute demonstration order

1. 0:00–0:30: Darshit's starting story and Ananya's example.
2. 0:30–1:05: availability, progress summary and the next mission.
3. 1:05–1:45: difficulty feedback and one real Gemini response.
4. 1:45–2:15: simulate completion, add a reflection, show calendar/activity change.
5. 2:15–3:05: remove Friday availability, preview, apply and refresh.
6. 3:05–3:35: explain the four platforms and the official theme.
7. 3:35–4:00: limitations, next student pilot and close.

Do not explain every control aloud in the main pitch. The feature notes above are for preparation and judge questions. Rehearse with real response latency and leave a recorded fallback.

## Explain the technology in thirty seconds

“We implement using Antigravity. Vercel serves the frontend. Render runs our API, validates changes, calculates schedules and calls Gemini. Supabase handles authentication and stores each student's goal and progress. Gemini personalizes the practice guidance, while ordinary code controls the workload and saves. Our theme is Personalized AI Experiences because the guidance responds to the student's current mission and feedback.”

If asked about the short migration: one goal row per student stores schedule and completion data in JSONB. RLS isolates row ownership. Keep the API key on the backend. A health endpoint only proves the server responds; it does not verify every integration.

## Likely judge questions

**Why not a chatbot?** A chatbot can suggest actions. This MVP connects contextual guidance to a persistent preparation sequence, recorded progress and an explicit recovery workflow.

**Is the idea unique?** We do not claim to have invented study planners or activity graphs. Our focus is the combination of an achievable next step and recovery when the student's week changes.

**Does this solve procrastination?** That is a hypothesis, not a measured outcome. We can demonstrate the workflow and propose a pilot measuring return after interruptions.

**Is it a coding judge?** No. External practice and completion are self-reported. No LeetCode account integration or automated correctness scoring is claimed.

**Why only DSA?** A small reviewed track lets us demonstrate the full product within the event. Expanding curricula requires content validation.

**What if AI fails?** Explain that guidance can be retried and saved progress remains unchanged. Do not portray recorded or fixture output as a live result.

## Closing line

“College life changes every week. NextStep helps a student keep a clear next action, see the progress they have made, and return with a realistic plan.”

Before recording, verify the deployed version, test sign-in and AI, use a synthetic demo account, hide credentials, and prepare a labeled backup video. No invented retention percentages, user counts, testimonials or placement guarantees.
