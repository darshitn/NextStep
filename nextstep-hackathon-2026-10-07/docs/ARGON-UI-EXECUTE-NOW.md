# Execute the actual NextStep UI redesign

Select Gemini 4 Argon in Antigravity. Paste the following into the existing project chat.

---

Prompt A is complete; the owner is dissatisfied because the application still looks unchanged and the active preview has lost utility styles. Start the ACTUAL frontend redesign now. Do not run another planning-only/infrastructure-only cycle and report it as the visual deliverable.

Project: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`.
Read `AGENTS.md`, `docs/UI-AUDIT-2026-10-18.md`, `docs/UI-PLUMBING-RESULT.md`, and the shared instructions + full Prompt B in `docs/ANTIGRAVITY-UI-REBUILD-2026-10-18.md`. Execute Prompt B stages B1, B2 and B3 sequentially, including relevant checks between stages. Do not stop after B1 merely because it is a stage; stop for an actual blocker or after all authorized UI stages and final report are complete.

## First: repair the proven styling regression

Independent inspection of the running previews on 18 October 2026 found:
- Port 5173, launched as `node client/scripts/start-synthetic-preview.mjs --port 5173` from the project root: served index.css ~19,219 bytes and missing `.grid`, `.p-5`, `.gap-6`, `.text-xl`.
- Port 5195, launched from client/: served index.css ~44,032 bytes with those utilities present.
- `client/tailwind.config.js` currently uses working-directory-relative content globs; preview script sets Vite root but does not make all Tailwind/PostCSS config resolution independent of process.cwd(). Confirm the exact cause before editing.
- Codex restarted the 5173 preview from client/ to restore current styling. This is only an operational workaround, not the permanent source fix or the visual redesign.

Make configuration/content scanning reliable when the documented preview is started from project root or client/. Prefer explicit configuration paths and config-relative/absolute content paths appropriate to the installed Tailwind version. Do not suppress missing-style symptoms with hundreds of ad hoc CSS rules or safelist every possible class. Keep normal dev and production styling correct. Small edits to Tailwind/PostCSS/preview configuration are authorized for this proven defect, in addition to Prompt B's frontend scope. No new dependencies or upgrades.

Add a regression that runs the preview through both working directories and asserts representative utility-styled DOM elements have expected computed display, spacing and typography. Merely asserting a stylesheet loaded or the page has no horizontal overflow is insufficient. Check the built production UI too. Preserve fixture isolation and live API settings.

## Then: visibly rebuild the product

Implement the full Prompt B direction, not a color-only patch:
1. Compact usable mobile navigation and coherent desktop shell.
2. Proof Learn / Trace / Reflect modes, with the actual interactive state/question immediately accessible. Preserve server evaluation, explicit references, keyed drafts, retry and response isolation.
3. Atlas as a meaningful compact prerequisite path/grouped stages, with immediate mobile topic details and an accessible list. Don't retain the 12 expanded cards followed by the inspector.
4. Practice as compact selectable entries with 15–20 results per page, persistent search/filter semantics, useful detail/log interaction and working highlighted deep links. Don't retain 120 expanded cards.
5. Today with one primary next activity; clear legacy starter vs larger curriculum scope; coherent onboarding, Review and Insights.

Use one visual system, readable type, intentional spacing and restrained borders. Keep interactions smooth with reduced-motion support. No raw Markdown backticks in polished teaching presentation. No fake metrics or unsupported mastery. Inspect the attached owner screenshots as examples of broken styling/current composition, not as a design target.

Preserve all existing dirty changes and the collaborator's curriculum ownership. Do not edit server/data/curriculum, reference tests, API schemas, authentication, database schema or published IDs. No automatic commit, push, deployment, production account use, environment edits or dependency changes.

Acceptance requires an OBVIOUS before/after improvement in actual screenshots at 1440/1024/390/320px; correct computed styling from both startup directories; all six appearance modes; working keyboard/focus; lesson/exercise-free states; draft switching; delayed/failed evaluation + retry; Practice pagination/filter/reset/deep link; planner preview/accept; old 12-mission behavior. Run relevant existing tests and update browser selectors for legitimate new behavior without weakening assertions.

Leave the actual redesigned synthetic app running, report the verified URL, save before/after screenshots and write `docs/UI-REBUILD-RESULT.md` with implemented changes, exact checks and unresolved issues. Do not present test plumbing alone as completion. On a repeated failure, make at most two focused repair attempts, report the precise blocker, and continue only independent authorized work. Reserve Opus review for after the visual implementation.
