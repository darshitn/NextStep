# NextStep: final layout repair

Use GPT-6.1 Sol with High reasoning. Implement and visually verify this bounded correction; do not merely propose a design. No further product features are requested.

## Start from the handoff

Repository: https://github.com/darshitn/NextStep
Baseline branch: codex/ui-handoff
App directory: nextstep-hackathon-2026-10-07 inside the repository (your machine's path may differ).

Fetch the baseline and create codex/dashboard-layout from it. Inspect git status first; preserve all existing work. Never reset, clean, force-push or overwrite another person's edits. Read AGENTS.md, START-HERE.md, contracts/API-V1.md and the latest handoff. The baseline includes learning-loop persistence, curated AI reasoning checks, M04 duplicate tracing, signup handling and three appearance styles. Preserve them. Do not start from an older main branch.

## Outcome

The student must immediately understand their next action. Make the layout readable, balanced and professional on desktop and mobile. This is a structural UI repair, not another color swap. Keep Frosted Sage, Study Journal and Quiet Focus plus independent light/dark preferences, all sharing the same functional components.

## Observed defects to resolve

- Desktop header exposes three styles, two modes, track badge and account, competing for attention.
- Saved-context card repeats the mission title and primary action. Schedule adjustment is duplicated.
- Mission and practice stay in a narrow left column; a small progress box leaves a large empty right column.
- Opening practice scrolls its heading beneath the sticky header.
- Status text has extremely poor contrast, including active-mission and readiness badges in light and dark styles.
- Small body text, many uppercase labels, nested bordered boxes and dense technical copy make practice tiring.
- The activity grid is disproportionately large, with stretched rectangular cells.
- The weekly view repeats completions in two lists without clearly explaining planned versus actual dates.
- Availability choices are cramped; technical developer copy appears in the student flow.

## Target composition

1. Header: logo, one Appearance popover, compact account/sign-out. Put style and light/dark choices inside the same accessible popover. Preserve preferences, drafts and scroll position when changing them.
2. Goal heading with modest edit/adjust actions. Under it, a compact full-width progress strip: completed/total, estimated remaining time, finish and target. Eliminate the mostly empty progress sidebar.
3. One prominent current-mission card spanning the useful content width. Use a clear title, readable purpose and three steps, completion criteria and one primary Start/Continue practising action. Record completion remains a visible secondary action.
4. Place saved context inside a compact disclosure near that action. Preserve access to earlier-mission notes, readiness, dismiss and resume; show exact mission ownership. Avoid repeating the same title and button in two large cards.
5. Opening practice reveals a full-width workspace below the mission. On desktop, use a balanced exercise/understanding area and a guidance/notes area where that helps; on mobile use one column. Keep useful content visible, avoid nested scrolling, and preserve all draft-protection and error-handling behavior. Correct focus and scroll-margin for the sticky header. Do not replace this with a new route or remount form state unnecessarily.
6. Weekly calendar below practice. Clearly separate scheduled versus actually completed work when dates differ; avoid redundant listings when they match. Keep every existing date-selection and navigation action.
7. Compact eight-week activity grid with square cells and accessible hit areas. Preserve real data, date labels, keyboard navigation, selection and legend. Do not fabricate more activity to fill space.
8. Collapsed roadmap at the bottom. Minimal footer with useful student-facing text.

Use a responsive content width around 1180-1280px rather than stretching text across the whole monitor. Use readable body text around 15-16px, restrained heading sizes, consistent spacing, subtle separators and fewer nested surfaces. Serif only in selected Study Journal headings; keep forms and instructional body text sans-serif. Check actual computed colors, not just token names. Aim for WCAG AA contrast: 4.5:1 normal text and 3:1 large text/non-text controls as applicable. Do not use arbitrary global opacity to mute status text.

Motion: 150-220ms feedback for buttons, panels and calendar; about 300ms for successful completion. Honor reduced motion. No fake typing, confetti, looping glow, parallax or broad transition-all. Completion animation runs only after confirmed persistence. A missed day must not look like failure.

## Scope and safety

Edit client presentation/components/styles and focused UI tests. Do not alter API contracts, scheduling, auth, database, Gemini logic, persisted goal structure or correctness rules. Do not remove the learning loop or duplicate-trace exercise. Keep mocks visibly separate from live behavior. Never print, commit or request secrets in chat. Use existing local environment configuration or documented examples; do not copy another user's credentials. Do not submit changes to real student progress while exploring.

Inspect the running app before editing. If live credentials are unavailable, use the existing documented fixture mode for local UI verification and label the evidence accordingly. No fake login bypass or production fallback. Make independent design choices within this brief; do not ask for approval of routine colors and spacing.

## Verification and finish

Run client tests and production build. Run backend tests if shared files are touched. Add meaningful checks for changed interactive behavior, not snapshots of every CSS class.

Use a real browser to inspect all three styles in both modes at desktop 1440px and mobile 390px; check 320px for overflow. Verify: appearance persistence; draft preservation; focus/scroll offset; start/resume/close practice; duplicate-trace wrong/correct answers; saved-context controls; calendar navigation; completion form; recovery preview. Use synthetic/fixture state for mutations. Verify reduced motion and keyboard operation. Screenshots must include the dashboard and expanded practice at desktop/mobile, plus any theme-specific contrast repair. If browser tooling is blocked, clearly report the missing visual verification rather than claiming completion from a build.

Commit only this correction and its documentation to codex/dashboard-layout and push that branch to origin (authorized for this handoff). No main merge, force-push, provider configuration changes or deployment. If permission to push is unavailable, preserve commits and report the exact blocker.

Return: branch and commit hash; concise changes; test outcomes; actual screenshots; what was not verified; any release blocker. Do not propose more features or another redesign milestone. Stop when this bounded repair is complete.
