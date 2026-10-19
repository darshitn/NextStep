# Companion overnight goal for the curriculum collaborator

Use this ONLY in the friend's separate repository checkout and Antigravity session. Do not run another writer in Darshit's checkout. Start from `handoffs/COLLABORATOR-CURRICULUM-GOAL.md`; this document adds overnight timing and coordination, not broader ownership.

## Goal

Make the existing DSA curriculum more trustworthy through content-linked executable reference checks and evidence-based corrections. Darshit's parallel branch implements the post-starter checkpoint/next-week plan and its frontend/backend flow. You must not modify that product work.

Use Gemini 3.8 Flash Medium if available for bounded reference/content implementation. Use your own Codex for planning and review. Do not assume access to Darshit's Argon/Opus models, local paths or credentials; choose an available model explicitly with your owner before leaving the run unattended. No silent paid upgrades/model switching.

Read the current collaborator handoff, project instructions, checkpoint and actual source. The released main baseline is merge commit `ce6405d694009827673e90558ddf8b1ec0cb3d33`; the older handoff names `codex/atlas-proof-baseline` as the original starting point. For a NEW clean checkout, fetch and branch from released main (`codex/curriculum-validation` or a unique suffix). If work has already started on the older branch, preserve it and report its base; don't reset, merge or rebase through conflicts unattended merely to match the new baseline.

## Scope and coordination

Allowed: `server/data/curriculum/**`; NEW `server/tests/curriculumReference*.test.js` and helpers under `server/tests/helpers/curriculum-reference/**`; generated `client/src/fixtures/curriculum.json` only via the validator; your new coverage/corrections/result documents. Preserve stable published IDs and schemas.

Do not edit `server/data/continuation*`, continuation/checkpoint routes/services/schemas, UI components, API adapters, scheduling, normalization, auth, preview tooling, existing algorithm tests or Darshit's documentation. Report a shared-contract need instead of changing it unilaterally. No edits in the other person's checkout, remote merges or deployments.

## Six-hour execution

Record actual start UTC, Asia/Kolkata time and a six-hour deadline in `docs/CURRICULUM-OVERNIGHT-PROGRESS.md`. Update at least every 30 minutes. Reserve the final hour for validation/reporting. Finish early when done; no artificial waiting or filler.

1. First 30 min: inspect baseline, inventory all 18 exercises and both variants, record existing failures and plan independent expected-state comparisons.
2. Next 3 hours: implement reference algorithms consuming/binding to the authored inputs; compare actual state snapshots and expected transitions for primary AND alternate variants, including relevant boundaries. Verify one renderer family fully before multiplying a flawed template. Correct only demonstrated content inaccuracies in your allowed paths.
3. Next 90 min: expand meaningful comparison coverage and mutation sensitivity. Include the known alternate graph queue mutation. Document unchecked fields/variants honestly. No fake “100% verified” based on choice IDs, nonempty labels, or calculations disconnected from the authored inputs.
4. Final hour: full relevant suites, validator, client build and diff inspection; source/attribution check for changed content; exact result report and local checkpoint.

Follow the detailed acceptance criteria and commands in the collaborator handoff. Every correction needs an independent counterexample/reference calculation and a failing-before/passing-after regression. Don't scrape external problem statements, invent licences or weaken assertions.

Routine local scoped edits, installed tools and synthetic tests may proceed without asking for minor decisions. At most two focused retries per repeated failure; checkpoint real auth/permission/quota blockers and continue independent authorized work. Never bypass host confirmations, change global permissions, inspect secrets, add dependencies, run migrations or mutate production data. No automatic remote push/merge/deployment. Make local scoped commits only when your own owner has authorized them; otherwise preserve the diff for review.

Finish with `handoffs/COLLABORATOR-RESULT.md`, `docs/CURRICULUM-COVERAGE.md` and `docs/CURRICULUM-CORRECTIONS.md`: actual start/end/elapsed time, coverage by exercise and variant, files, executed checks, corrected examples, remaining gaps, branch/SHA and exact next action. Do not claim access to a preview/test tool that isn't installed on your machine. Provide the result to the owner for coordinated morning integration.
