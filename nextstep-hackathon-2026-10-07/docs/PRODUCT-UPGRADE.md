# NextStep post-submission upgrade

The owner reopened the submitted MVP scope on 16 October 2026. Preserve the student goal-completion problem and existing saved data. Build a student execution workspace, with DSA Foundations as its first supported track. A universal goal engine is a later architecture decision; do not label unsupported tracks as working.

## Stages and acceptance

1. Research and baseline: complete. Checkout was clean; original client baseline 39 tests passed. Server baseline passed all 46 tests after rerunning with permitted localhost access.
2. Workspace: complete. Today, Roadmap, Review and Insights navigation; searchable/filterable roadmap; weekly overview; responsive navigation and semantic themes.
3. Learning tools: complete. Session-only focus timer; review suggestions from existing records; recall-before-reveal practice; searchable notes; recorded-outcome insights; goal JSON export. Existing persistence APIs reused without a database migration.
4. Local verification: complete. 50 client tests, 46 server tests, production build, and 13 synthetic browser journeys passed. Inspected desktop/mobile screenshots and corrected visual issues. See [verification report](PRODUCT-UPGRADE-VERIFICATION.md). GitHub publication, live integration acceptance and deployment remain separate actions.

Progress for this local upgrade: 4 complete, 0 active, 0 remaining. The universal-goal expansion below is a proposed later milestone, not an implemented feature.

## Research and decisions

These are product hypotheses informed by sources, not evidence of improved outcomes for NextStep users.

| Source | Observed pattern | NextStep decision |
| --- | --- | --- |
| [Todoist task duration](https://www.todoist.com/help/todoist/features/set-a-task-duration-L1kYkZv8d) | Tasks can have durations and calendar slots | Show planned work in minutes and retain weekly schedule controls |
| [roadmap.sh about](https://roadmap.sh/about) | Interactive learning paths connect resources and progress | Make the existing curriculum searchable with meaningful statuses and details; author our own UI/content |
| [NeetCode preparation guide](https://blog.neetcode.io/p/prepare-coding-interviews) | Structured interview preparation guidance | Keep a coherent DSA sequence rather than an unbounded problem feed |
| [Retrieval practice](https://www.learningscientists.org/blog/2016/6/23-1) | Recall first, then check and correct | Put explain-from-memory prompts before saved reflections in review |
| [Spaced practice](https://www.learningscientists.org/blog/2016/7/21-1) | Revisit older material across days | Suggest revisiting earlier work; disclose any interval as a simple product heuristic, not a validated mastery model |
| [Linear design refresh](https://linear.app/now/behind-the-latest-design-refresh) | Quiet navigation, clear hierarchy, predictable actions | Persistent workspace navigation, compact rows, restrained accent, distinct primary task |

## Feature priorities and deferred work

Now: actionable Today, searchable Roadmap, reusable practice panel, Review queue, blocker/notes library, recorded-outcome Insights, focus timer, export, responsive navigation. Preserve recovery preview and explicit acceptance.

Later: multiple custom goals with their own authored tasks, configurable tracks, deadline/capacity scenarios, persistent review history, calendar export. These require contract and potentially schema design before implementation.

Defer: social leaderboards without real cohorts, fake mastery percentages, automatic LeetCode sync without an authorized supported integration, arbitrary AI-generated curricula marketed as verified, auto-completion, and decorative statistics. Do not count estimated mission duration as measured focus time.

## Visual direction

A calm learning workbench with a narrow desktop navigation rail, clear page heading, compact progress strip, main next-action panel and contextual side panel. Use the existing semantic themes, intentional spacing, readable type, thin separators and purposeful icons. Mobile navigation must remain usable without horizontal page overflow. Avoid gradients, gratuitous animation, fake trend charts and repetitive oversized cards.

## What makes this product useful

The working proposition is: "Make progress on an important learning goal, even when your week changes." The supported student loop is plan -> practise -> capture difficulty -> recover -> revisit. DSA is the first concrete curriculum. A beautiful dashboard alone cannot establish that students learn better; that needs actual student use and feedback.

Three scenarios should drive the interface:

- **I have 25 minutes between classes:** Today exposes one eligible mission, its completion criteria, a focus timer and the next working action. The timer never pretends to verify work.
- **I solved it with help but cannot explain it:** Review explains why it suggested the mission, asks for recall before revealing the student's earlier reflection, and links to the existing practice and saved-note flow.
- **Exams disrupted my plan:** Adjust my week previews how remaining missions move while keeping completed work. Only accepting the preview applies the new schedule.

Feature density should mean fewer trips to find relevant information, not more menus. Every panel should answer a student question or offer an actual action. Defer leaderboards and arbitrary badges until real users ask for accountability and there is an honest cohort/data model.

## Universal-goal expansion proposal

Current source inspection confirms that GoalForm hardcodes dsa-starter-v1, API scheduling assumes ordered 30-minute missions, and migration 001 enforces one goal per owner. Renaming a goal cannot make this a universal tracker.

A real expansion needs: multiple owner-scoped goals, user-authored milestones/tasks with durations and dependencies, goal-specific schedules and completions, editing/version-conflict rules, and a safe migration of existing DSA progress. A useful first template set would be DSA, exam revision and a project deliverable; each needs completion evidence appropriate to the goal. Keep automatic AI task generation optional and editable. Do not silently apply this database migration or claim these templates work in this release.

Before that larger expansion, test the current workflow with several students using their own goals: can they identify the next action without explanation, save/recover a blocker, understand the schedule preview, and find their reflection later? Record observed difficulties and time-to-first-practice; do not fill a product analytics screen with invented adoption or learning metrics.

## Owner exercise

Using a synthetic account: open Today, start/pause/reset focus, find a mission in Roadmap, inspect its prerequisites, return to current practice, save a blocker, refresh, find it in Review, revisit completed work, inspect the recorded outcomes in Insights, and export the current goal. Verify live sign-in and cloud persistence separately before publication.
