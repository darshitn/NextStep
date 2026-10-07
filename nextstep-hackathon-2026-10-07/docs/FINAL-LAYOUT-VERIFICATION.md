# Final dashboard layout correction — 2026-10-07

Branch: `codex/dashboard-layout`, created from `origin/codex/ui-handoff` at `3d1ac3411430d8235e5c1e63d5f00fb9ac4e3dd8`. The existing untracked root audit report was preserved and excluded from this correction. No main merge, deployment, dependencies, provider configuration or environment files were changed.

## Result

- One keyboard-accessible Appearance popover contains the three styles and independent light/dark choice. Preferences persist without remounting practice or losing drafts; opening, switching and Escape preserve scroll and return focus.
- A compact full-width progress strip replaces the sidebar. One full-width current mission presents three readable steps, completion criteria, primary practice and secondary completion actions.
- Saved context is a compact disclosure inside the mission. It identifies the exact owning mission and preserves readiness, dismissal, earlier notes and resume.
- Practice uses the full content width with exercise/check and notes/guidance columns on desktop, then a single column on mobile. Its heading is focused below the measured sticky header. Both close controls and switching to an earlier mission protect unsaved notes; save failures retain drafts.
- Typography, semantic success/attention colors and control borders are readable across all six appearances. Study Journal uses serif only for selected headings. Motion honors reduced-motion preferences.
- Calendar separates planned work from actual completion dates and lists a same-day completion once. The eight-week activity graph has square 28px desktop / 26px mobile / 24px narrow-mobile cells, real fixture completion data and preserved keyboard navigation. Roadmap stays collapsed by default.
- Availability choices have room to wrap. Completion dialog has labels, focus containment, Escape and focus return; failed persistence stays visible with the reflection intact.

The API/auth adapters, Gemini logic, persisted goal structure, scheduling and duplicate-trace correctness engine are unchanged. The only new service is a pure calendar presentation helper, covered by two focused tests.

## Verification actually performed

| Check | Outcome |
| --- | --- |
| `npm.cmd --prefix client test` | PASS: 33 tests, 0 failures |
| `npm.cmd --prefix client run build` | PASS: Vite production build, 13.94s |
| `git diff --check` | PASS |
| Chrome browser: 1440px desktop and 390px mobile, 3 styles × 2 modes | PASS: 12 combinations; screenshots reviewed |
| 320px, all six appearances | PASS: no horizontal page overflow; keyboard completion dialog and reduced motion |
| Expanded roadmap, all six appearances | PASS: visible text contrast and overflow |
| Practice opening / resume | PASS: heading focused below sticky header; mission/practice widths match |
| Appearance changes and reload | PASS: independent style/mode persistence, scroll, exercise/answer/notes drafts retained |
| M04 duplicate trace | PASS: incorrect prediction cannot advance, correct trace works, alternate array works |
| Guidance and reasoning checks | PASS: fixture success and injected failure render honestly; inputs retained; no completion/XP/schedule mutation from feedback |
| Saved notes | PASS: save failure, both close controls, save-and-close, readiness, dismiss, exact earlier-mission resume and mission-switch draft protection |
| Calendar / activity | PASS: previous/next/today, date selection, ArrowUp/Enter activity selection; planned/actual date unit tests |
| Completion / recovery | PASS: failed completion preserves reflection, confirmed fixture completion updates progress; preview preserves completed work and requires explicit Apply |
| Browser JavaScript exceptions | 0 |

Visible rendered text was checked against computed foreground and composed background colors: 4.5:1 normal text and 3:1 large text, including expanded saved notes, exercise feedback and roadmap. Disabled controls and closed disclosure contents were excluded. This is a targeted regression check, not a claim of a complete accessibility audit.

Before editing, the dashboard and expanded practice were inspected in Chrome. The original practice heading measured approximately -4px from the viewport top; the corrected desktop heading measured approximately 97px beneath the 76px header. Final desktop/mobile dashboard and practice captures were visually reviewed for all styles and modes, alongside the 320px recovery preview.

## Evidence and limits

**All screenshots and browser mutations use synthetic local fixture state.** A browser-only request intercept loads the repository's existing fixture implementation and displays the Fixture Mode badge. The shipped API/auth service is untouched. External network requests were blocked during browser verification; no real student data or credentials were used. Successful fixture reasoning feedback does not prove live Gemini correctness.

The native browser automation tools could not initialize on this host. Verification used installed Chrome through Playwright instead. The reproducible browser script is [client/scripts/verify-layout.cjs](../client/scripts/verify-layout.cjs). Start Vite, then from `client` run:

```text
node scripts/verify-layout.cjs <installed-playwright-module-path> http://127.0.0.1:5187
```

It requires an available Playwright installation and Chrome; no dependency was added to the application. The complete successful check results and computed status-color samples are in [layout-evidence/results.json](layout-evidence/results.json).

| Appearance | Desktop dashboard | Desktop practice | Mobile dashboard | Mobile practice |
| --- | --- | --- | --- | --- |
| Frosted Sage light | [Screenshot](layout-evidence/frosted-sage-light-1440-dashboard.png) | [Screenshot](layout-evidence/frosted-sage-light-1440-practice.png) | [Screenshot](layout-evidence/frosted-sage-light-390-dashboard.png) | [Screenshot](layout-evidence/frosted-sage-light-390-practice.png) |
| Frosted Sage dark | [Screenshot](layout-evidence/frosted-sage-dark-1440-dashboard.png) | [Screenshot](layout-evidence/frosted-sage-dark-1440-practice.png) | [Screenshot](layout-evidence/frosted-sage-dark-390-dashboard.png) | [Screenshot](layout-evidence/frosted-sage-dark-390-practice.png) |
| Study Journal light | [Screenshot](layout-evidence/study-journal-light-1440-dashboard.png) | [Screenshot](layout-evidence/study-journal-light-1440-practice.png) | [Screenshot](layout-evidence/study-journal-light-390-dashboard.png) | [Screenshot](layout-evidence/study-journal-light-390-practice.png) |
| Study Journal dark | [Screenshot](layout-evidence/study-journal-dark-1440-dashboard.png) | [Screenshot](layout-evidence/study-journal-dark-1440-practice.png) | [Screenshot](layout-evidence/study-journal-dark-390-dashboard.png) | [Screenshot](layout-evidence/study-journal-dark-390-practice.png) |
| Quiet Focus light | [Screenshot](layout-evidence/quiet-focus-light-1440-dashboard.png) | [Screenshot](layout-evidence/quiet-focus-light-1440-practice.png) | [Screenshot](layout-evidence/quiet-focus-light-390-dashboard.png) | [Screenshot](layout-evidence/quiet-focus-light-390-practice.png) |
| Quiet Focus dark | [Screenshot](layout-evidence/quiet-focus-dark-1440-dashboard.png) | [Screenshot](layout-evidence/quiet-focus-dark-1440-practice.png) | [Screenshot](layout-evidence/quiet-focus-dark-390-dashboard.png) | [Screenshot](layout-evidence/quiet-focus-dark-390-practice.png) |

Baseline evidence: [dashboard before](layout-evidence/before-dashboard.png), [practice before](layout-evidence/before-practice.png).

No repair blocker was found. Live Supabase authentication/signup, live Gemini responses, remote database persistence and deployed behavior were not reverified. Backend tests were not rerun because no backend, shared adapter or contract changed. This branch is ready for review of the bounded correction; it is not a new deployment or evidence of a live integration release.
