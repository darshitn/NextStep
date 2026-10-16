# Product upgrade verification — 16 October 2026

## Delivered behavior

NextStep now has four workspace views: Today, Roadmap, Review and Insights. Desktop uses a navigation rail; mobile uses a two-by-two navigation grid. The URL retains the selected view across refresh/back navigation.

- Today: current mission, progress/target summary, upcoming work, review context, weekly calendar and activity history.
- Focus: 15/25/30-minute presets, pause/resume/reset and timestamp-based background catch-up. Timer state survives workspace view changes. It resets on reload and never automatically records mission completion or awards XP.
- Roadmap: search across mission IDs, titles and steps; completion-status filters; expandable prerequisites, criteria, steps and resources; practice actions for eligible missions. Future missions can be inspected without skipping completion order.
- Review: suggestions from saved blockers, hint-assisted completions and older practice. The three-day recall interval is a starter heuristic, not a validated mastery model. Recall prompts precede an explicit reflection reveal. Drafts are separate per mission and survive workspace view changes; closing a nonempty attempt requires confirmation. Leaving the dashboard/reloading discards these session drafts, as disclosed.
- Notes: searchable saved blockers, attempts and completion reflections. Dismissing a queue suggestion preserves its saved notes.
- Insights: known-curriculum completion counts, recorded outcomes, IST active days, estimated remaining practice and reflections. JSON export includes this goal's progress and notes; auth/session storage is excluded.

Existing authentication, API contracts, database schema and curated DSA curriculum remain unchanged. This release still supports one DSA starter goal. It does not implement arbitrary custom goals, automatic LeetCode sync, persistent review scheduling, or focus-time analytics.

## Implementation and independent review

Gemini 3.8 Flash Medium in Antigravity implemented the workspace, learning tools and initial review corrections. The transport reported `needs_review`: its effective mode was `proceed-in-sandbox` rather than the helper's expected `request-review`, and sandboxed Vite builds encountered realpath EPERM. No permission settings were changed. Reviewed the reports and actual scoped files, and independently built outside that filesystem restriction.

Codex directly corrected remaining recall draft loss, dismissal semantics, mobile navigation clipping and practice-panel visibility under the owner's explicit implementation fallback. Codex also added the reusable browser harness and product/verification documentation. No packages, lockfiles, backend, auth adapters, production fixture-mode setting or database migrations were changed. No commit, push or deployment was performed.

## Executed verification

| Check | Result | Scope |
| --- | --- | --- |
| `client/`: `npm test` | 50/50 passed | Existing auth/scheduling/learning tests plus workspace stats, review, timer, export, notes, dismissal and search/filter checks |
| `server/`: `npm test` | 46/46 passed | Existing synthetic local API/provider/database tests; required permitted localhost access after sandbox EACCES |
| `client/`: `npm run build` | Passed | Final production bundle; rerun outside sandbox realpath EPERM |
| `node --check client/scripts/verify-workspace.cjs` | Passed | Browser harness syntax |
| `git diff --check` | Passed | No whitespace errors; Git reports normal LF/CRLF conversion notices |
| New Edge browser harness | 13/13 journeys passed | Synthetic fixtures only; external requests blocked |

The 13 browser journeys cover current mission/progress; focus timer pause/resume/catch-up/view changes/no automatic completion; roadmap search/filter/details/URL restoration; practice-draft preservation; empty and recorded views; saved blocker reload; hint completion/reflection; actual downloaded JSON contents; notes search/recall reveal/per-mission draft isolation/close protection; dismissal retaining notes; recovery preview/acceptance preserving completions; responsive/theme/contrast matrix; and invalid-markup/application-error checks.

All four views were checked at 1440, 390 and 320 pixels in all three styles and both light/dark modes: 72 view/width/appearance combinations. No horizontal page overflow or computed visible-text contrast failures were found. This is targeted browser verification, not a complete accessibility certification. Desktop and mobile screenshots were visually inspected. Expected font-request failures caused by deliberately blocking Google Fonts were recorded separately; no local request failures, page exceptions or other console errors remained.

Final evidence is ignored locally at `client/.local/workspace-evidence/2026-10-16T05-48-11-492Z/`, including `results.json`, Today screenshots at desktop/mobile widths, Roadmap, Review and Insights screenshots. These are labelled synthetic accounts, not live student records.

## Repeat the browser checks

Start the client on loopback:

```powershell
cd client
npm run dev -- --host 127.0.0.1 --port 5187 --strictPort
```

In another terminal, from `client/`, use your installed Playwright module path:

```powershell
node scripts/verify-workspace.cjs '<absolute path to playwright>' http://127.0.0.1:5187
```

The harness uses an isolated headless Edge context, intercepts the service module only inside that context, blocks external network calls and writes timestamped ignored evidence. Production source continues to use the live adapter. It requires Edge and Playwright already installed; no browser/packages are downloaded automatically.

## Limits and next acceptance

Live Supabase sign-in/persistence and Gemini generation were not exercised in this upgrade. No real student account or production data was used. Existing automated provider/database tests are mocked. Verify those live integrations and the intended deployed commit before publication.

The older `verify-layout.cjs` baseline stopped at a pre-existing appearance-switch scroll-position assertion. It was not represented as a passing full suite. The new harness covers the redesigned navigation and workflows; it does not prove the older appearance-popover scroll assertion is fixed. External Google Fonts were blocked in screenshots, so final hosted typography should also be reviewed with fonts loaded.

For an owner check: sign in, open Today, start/pause focus, search Roadmap, save a blocker and refresh, find it in Review, try recall and reveal, export the goal, then preview/accept a changed week. Completion/notes/recovery should persist through the real API; timer and unsaved recall drafts are session-only.
