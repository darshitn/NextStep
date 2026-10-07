# Harshita's pitch and demo runbook

> **Current guide:** [Harshitha's demo and presentation guide](HARSHITHA-DEMO-GUIDE.md) replaces this earlier script. It includes runtime AI, the four-minute walkthrough, realistic student examples, judge Q&A and readiness checks. Use verified app behavior when presenting.

## Core narrative

**Problem:** a student knows the ambition but cannot sustain a workable sequence of actions.
**Product:** a small next mission, visible progress, and an honest recovery plan when available time changes.
**Working example:** a six-hour estimated DSA starter module. GSoC is Darshit's motivating anecdote and a future track, not a shipped feature.

## Five slides and speaker notes

### Slide 1 — “I researched the goal. Then I stopped.” (20 seconds)

Harshita: “Darshit wanted to prepare for GSoC. He researched it on day one, then stopped. The gap was between knowing the ambition and knowing the next manageable action.”

Darshit can add one sentence in his own words. Avoid invented percentages about student dropout.

Visual: one short quote, with consent, and a simple goal-to-first-action gap. No crowded feature collage.

### Slide 2 — “A plan has to fit the student's week.” (20 seconds)

Harshita: “NextStep starts with available days and minutes. It gives a sequenced starter track and shows when the selected workload exceeds the target date.”

Visual: actual setup screenshot after G2. Label durations estimates. Cite anonymous interview observations only if collected, with actual sample count.

### Slide 3 — live demo (90 seconds)

Harshita narrates, Darshit operates:

1. “Here is the next mission, its purpose, and its resource.”
2. Complete it. “The progress is saved.” Refresh to prove it.
3. Open recovery. “Now exams reduce the student's available time.” Change 60-minute study days to 30.
4. “The app shows the consequence before changing the plan.” Point to actual moved work/finish date.
5. Apply and refresh. “Completed work remains. The remaining plan changes.”

Do not spend the demo typing passwords or long forms. Sign in before starting; use a separate fresh account if onboarding is part of the available time. A second device is optional, not a dependency.

### Slide 4 — “The rules are real; the experience is simple.” (25 seconds)

Sankirth: “Vercel serves React, Render schedules and validates changes, and Supabase stores user-owned goals. Versioned writes stop an old tab from overwriting newer progress. Antigravity helped implement the scoped features; we checked the resulting behaviour.”

Visual: three-box architecture plus an Antigravity development-tool label. Do not show private keys or provider dashboards with credentials visible.

### Slide 5 — “Next: test whether students return.” (25 seconds)

Harshita: “Today we demonstrate a working starter track and recovery flow. Our next step is a small student pilot measuring whether users start, return, and complete practice. Long-term improvement has not yet been measured.”

Visual: working today / next pilot, with only confirmed claims. Close with the production URL or QR code.

Total approximately three minutes. Adjust to the organiser's actual limit and rehearse with a timer.

## Why this could be compelling

The demo shows a practical decision, not just a generated roadmap: less available time causes a visible, explained change. The student gets a clear next action without losing completed work. The story is easy to relate to, and the implementation has meaningful scheduling, persistence, and consistency rules.

## Judge Q&A

**“Isn't this Habitica / a task manager / a LeetCode plan?”**
“Those already offer important parts. Our pilot focuses on a student preparation sequence, available-time constraints, and an explicit recovery experience. We still need user testing to establish whether this combination is easier to stick with.”

**“Where is the AI?”**
“Our planned runtime AI feature uses Gemini through Render to adapt guidance to the student's next mission and feedback. Scheduling stays deterministic. Demonstrate this only after a real API request has been verified; Antigravity is the implementation tool, not the app's runtime AI.”

**“What if I give it an impossible deadline?”**
“It retains the workload and shows the shortfall. A fixed deadline stays fixed. With a flexible deadline, the student previews and accepts an extension.”

**“How do you know a student actually learned?”**
“Completion is self-reported practice. XP is activity feedback, not proof of mastery. A future learning-evaluation pilot would need appropriate assessments.”

**“Why only a DSA starter?”**
“We chose one reviewed sequence to prove the complete experience within the event. Broad career tracks require more content validation.”

**“Can this improve consistency?”**
“That is our hypothesis. Today we can demonstrate the workflow, not a long-term effect. We propose testing return after a missed session with consenting students.”

**“Does 100% mean I am placement ready?”**
“It means this starter module's activities are marked complete. It is not an interview-readiness guarantee.”

**“How did the required tools contribute?”**
Use the architecture answer and point to the actual save/reload/recovery demonstration. Do not list unused Supabase features for effect.

## Recording / network contingency

Before judging, record the deployed flow with date/time and release identity in handoff. Hide credentials. If the service fails live, say so and identify the video as previously recorded. If only a local recording exists, say local. Do not pretend footage is live or label fixtures as production evidence.

## Final assets checklist

- [ ] Five concise slides in Harshita's chosen tool.
- [ ] Actual Today and recovery screenshots.
- [ ] Tested production URL / QR code.
- [ ] Backup recording with evidence context.
- [ ] One-page working-features and limitations list from developers.
- [ ] Submission deadline and receipt.

This kit supplies the script and plan, not an already rendered slide deck or recording.
