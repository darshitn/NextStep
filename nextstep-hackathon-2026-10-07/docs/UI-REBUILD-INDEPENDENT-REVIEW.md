# Independent UI rebuild review — 18 October 2026

Reviewed the actual working tree on `codex/ui-workbench` and running synthetic preview at http://127.0.0.1:5173. Owner-provided implementation report was treated as a claim to verify. No product source was edited in this review.

## Confirmed

- Preview styling harness passed from project root and client cwd: served CSS 45,203 bytes in each case, grid display, 20px padding, 14px text and 24px gap. Existing production CSS artifact check also passed. That artifact check is not a production-browser visual test.
- Atlas/Proof harness: 9/9 checks passed, seven views, four viewport sizes and six appearance combinations.
- Starter workspace harness: 14/14 passed.
- Playwright isolation suite passed: drafts, variants, no-exercise state, failure/retry, delayed response isolation, fresh/interrupted accounts, direct route/reload/back and filter/reset.
- Additional independent browser scenarios passed: 20 visible practice rows, next/previous page, an unsaved note retained across pagination, no-result/reset, Learn/Reflect/Trace switching and retained lesson text.
- Inspected newly generated desktop/mobile Proof screenshots. The mobile navigation is materially smaller and Trace opens before the full lesson; the redesign is real.
- Client tests: 75/75 passed. Production build run separately in this review; its completion is recorded in the chat result.
- git diff --check passed with Windows line-ending notices.

Server source was unchanged by this UI task; server test numbers in the implementation report were not rerun during this review. Browser checks use synthetic adapters, not live Supabase/Gemini certification. No deployment/publication was performed.

## Remaining findings

### P2 — More menu Escape loses keyboard focus

Reproduction at 390x844: open More, focus its Review menu item, press Escape. Menu closes, but `document.activeElement` becomes BODY instead of `#nav-more-trigger` because the focused item was unmounted. `WorkspaceNav.jsx` needs a trigger ref/focus restoration for keyboard dismissal and coherent menu keyboard behavior. Selecting a destination should focus its main heading or another deliberate location, not strand focus in the body. Preserve visible focus indicators.

Acceptance: keyboard-only open, first-item focus, menu navigation, Escape focus return, outside click and selecting each secondary route. Assert the focused element, not only that the menu disappeared. Avoid blanket focus changes for ordinary pointer outside clicks.

### P2 — Mobile Trace first-action access still falls short of the reported measure

Independent geometry at 390x844, arrays lesson 1, Trace mode, scrollY=0: the first answer button starts at document Y=1,654 and is 78px high. Total Proof height in the latest broad audit was 3,448px at this width (3,761px at 320). Practice was 6,932px at 390, consistent with the report.

The 1,077px/65% statement in the result report does not accurately describe this measured button position or total height. Trace is substantially improved over the old ~7,174px page, but metadata, selectors, duplicate headings, help controls and state boxes still precede the first answer. Make lesson pickers/long objective/help controls expandable on mobile, keep input/state succinct and prioritize the actual question. Preserve all content and assistance behavior. Measure the first answer's document Y and required scroll separately from total document height. Do not meet a target by shrinking teaching text.

### Nonblocking report correction

The isolation JSON lists nine named scenario groups while the implementation summary says ten; describe the actual assertions rather than treating labels as a coverage score. The styling production check inspects existing CSS text, not computed styles in a built app. Keep that distinction explicit.

## Recommended next action

Use Gemini 3.8 Flash Medium for the bounded keyboard-focus correction, mobile header/Trace compaction and report corrections; no architecture or backend changes. Then reserve one Opus 5.5 review session for Prompt C if desired. Do not restart Prompt B or add features. Preserve collaborator curriculum ownership and all uncommitted changes.

Evidence: current `client/.local/atlas-proof-evidence/2026-10-18T15-08-52-848Z/`, `client/.local/atlas-proof-evidence/browser-isolation/`, and `.local/workspace-evidence/2026-10-18T15-08-34-082Z/`. Extra independent probe: ignored `client/.local/check-ui-b.cjs`.
