# Independent Prompt A verification — 18 October 2026

Branch inspected: `codex/ui-workbench`. Application source was not changed during this check. Owner screenshots were explicitly ignored; fresh synthetic browser execution and freshly generated screenshots supplied the evidence.

## Executed evidence

- `node client/scripts/verify-atlas-proof.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173`: 9/9 passed. All seven views, four viewport sizes, six appearance combinations. No page errors or failed local requests. Two external Google Fonts request errors were intentionally excluded by the harness's external-network block; this is not literally zero raw console errors. The suite runs with reduced motion, not a full animation-behavior audit.
- `node client/scripts/browser-state-isolation-test.mjs http://127.0.0.1:5173`: passed. Fresh-context active login, exercise A/B reflections, variants/topic changes, no-trace lesson, simulated evaluation failure/retry, delayed cross-exercise response, direct routes/reload/back, new/interrupted accounts, empty/reset practice filters and layout measurements.
- `node client/scripts/verify-workspace.cjs D:/Projects/Deadline-Catcher/node_modules/playwright http://127.0.0.1:5173`: 14/14 passed.
- Preview port validation: 0, 65536 and nonnumeric inputs exit 1 with clear errors. Occupied 5173 with --strictPort exits 1 with a clear conflict error.
- Current 5173 preview: HTTP 200, generated index.css about 44,045 bytes and required utility rules present. Inspected fresh desktop Today and mobile Proof screenshots. The initial 5173 styling is currently present.

## Remaining reproducible configuration defect

Started two temporary loopback previews using the same latest `start-synthetic-preview.mjs`, then stopped only those two child processes:

| Launch cwd | Served index.css | .grid / .p-5 / .gap-6 / .text-xl |
| --- | --- | --- |
| Project root | 19,232 bytes | All missing |
| client/ | 44,045 bytes | All present |

This independently reproduces the cwd-sensitive style-generation defect described in `docs/ARGON-UI-EXECUTE-NOW.md`. The preview script sets Vite root but the Tailwind content globs remain working-directory-relative. Resolve the configuration cause and verify computed DOM styles from both launch locations, plus production output. A successful behavior/contrast harness does not prove utility styles were generated.

The startup banner still names `student.struggling` and `student.fresh`, while the actual built-in fixture identities are `student.interrupted` and `student.ready`. Correct that copy when touching preview tooling.

## Readiness decision

The repaired harnesses and loopback/port behavior are sufficient to proceed to the UI implementation milestone. Prompt A is not evidence that the visual redesign has happened or every preview invocation is reliable. Use Gemini 4 Argon with `docs/ARGON-UI-EXECUTE-NOW.md`: first permanently fix cwd-sensitive styling, then implement Prompt B stages B1–B3. No need for another broad Prompt A cycle.

Fresh mobile Proof inspection still shows the long lesson before the interactive exercise and compressed linked-practice descriptions. These remain the already-authorized Prompt B layout targets. Preserve working evaluation, retries, isolation and server grading through the redesign. Collaborator retains curriculum/reference-test ownership.

Browser evidence from this run:
- `client/.local/atlas-proof-evidence/2026-10-18T13-47-18-236Z/`
- `client/.local/atlas-proof-evidence/browser-isolation/`
- `.local/workspace-evidence/2026-10-18T13-47-16-858Z/`

Unit suites/build were not rerun in this independent check; their numbers in UI-PLUMBING-RESULT remain implementation-agent reports for this task. Live Supabase/Gemini, completed curriculum behavior and exhaustive keyboard/assistive technology acceptance remain separate.
