# Shared development checkpoint — 18 October 2026

Branch: `codex/atlas-proof-baseline`. This is a collaboration checkpoint, not a production release certification. Darshit explicitly authorized committing and pushing the current work so a collaborator can start from a shared baseline. Production/main publication remains separate.

## Implemented in this checkout

- Preserved 12-mission DSA starter track, authentication, recovery preview/accept, recall reviews and exports.
- Atlas topic navigation/prerequisites, Proof interactive reasoning studio, external Practice library and curriculum review suggestions.
- Catalog contains 12 topics, 48 lessons, 18 authored exercises and 120 external problem references. Published counts describe available content, not independent teaching-quality certification.
- Additive owner-scoped `studyWorkspace` JSON persistence, authenticated writes, CAS/version checks and retry-safe attempt IDs.
- Server-side exercise answer validation; student-safe answer-key filtering; formative evaluation and explicit reference endpoints.
- Dependency-respecting curriculum study-plan ordering, capacity splitting and separate starter-plan preservation.
- Keyed Proof drafts, visible evaluation errors/retry and asynchronous response guards.
- Dedicated synthetic preview script. Normal `npm run dev` uses live authentication. Read the actual preview URL printed on startup.

## Verification and limitations

At this checkpoint, independent execution confirmed 107/107 server tests, 75/75 client tests and a passing client production build. Existing reports contain historical same-agent claims: they are not a substitute for independent verification. Browser suites have not been independently rerun for this checkpoint; live Supabase, provider guidance and deployment are not certified here.

Two known follow-ups remain:

1. **Curriculum verification coverage:** the final-fix report claims every primary/alternate snapshot is deeply verified. Independent in-memory mutation of `ex_graphs_01.alternateVariant.steps[0].stateSnapshot.stackOrQueue` to an impossible vertex still allowed all 24 algorithm/mutation tests to pass. Some tests assert hard-coded primary values or label fragments without verifying every alternate state. Treat the report's universal coverage claim as superseded by this limitation. The collaborator's scope addresses it with content-linked reference comparisons and an honest coverage manifest.
2. **Synthetic preview interface:** `client/scripts/start-synthetic-preview.mjs` currently uses `host: true`; bind it to `127.0.0.1` before presenting it as a loopback-only tool. Port fallback means 5173 is not guaranteed. Do not run it on an untrusted network.

No schema migration, production account mutation or deployment is part of this checkpoint. Ignored environments, node_modules, builds, local browser profiles, logs and screenshots are excluded from the commit. Credential-pattern scanning is a bounded check, not an exhaustive security certification.

## Parallel ownership

- Darshit: client UI, preview tooling, API/auth, scheduling/persistence, integration and publication.
- Collaborator: curriculum source accuracy, NEW dedicated reference tests and coverage documentation. Exact allowed paths and acceptance criteria: `handoffs/COLLABORATOR-CURRICULUM-GOAL.md`.
- Each person uses a separate checkout and branch. Do not edit shared schemas/contracts or reformat unrelated files. Propose shared contract changes before implementing them.
- Start from `origin/codex/atlas-proof-baseline`; record the resolved starting SHA. Do not merge either workstream into main without review. New features come after the content-quality milestone, avoiding simultaneous architecture expansion.
