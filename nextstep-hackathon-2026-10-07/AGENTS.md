> **Current ownership decision:** Darshit now owns the complete implementation: frontend, backend, database, auth/API adapters, AI integration and deployment configuration. This supersedes all split-role ownership and two-person acknowledgment requirements below. Sankirth supplies access/configuration and any existing work; Harshitha owns demo/presentation. Use one active editing session. Continue through verified local milestones without waiting for Sankirth; preserve existing work and report external blockers.

# NextStep implementation boundaries

Read START-HERE.md first for scope and ownership, then prompts/NEXTSTEP-MASTER-PROMPT.md, contracts/API-V1.md and your latest handoff. The master prompt uses Darshit's supplied format and supersedes older role-prompt sequences.

## Scope and ownership

- Work only inside this folder. Preserve unrelated files and the parent repository's existing deletions.
- Darshit owns `client/**` except the two integration adapters, and `handoffs/DARSHIT.md`.
- Sankirth owns `server/**`, `database/**`, `client/src/lib/api.js`, `client/src/lib/supabase.js`, deployment settings, and `handoffs/SANKIRTH.md`. Coordinate shared package/config changes.
- Harshitha owns presentation material and `handoffs/HARSHITA.md`; she is not an implementation dependency.
- Contract changes require Darshit and Sankirth to acknowledge the exact change. Then update the contract before dependent code.
- One editing agent per checkout. Separate laptops/checkouts can work concurrently on their owned paths.
- Implement only the active prompt milestone. Stop after its report; resume the next milestone when the documented gate is satisfied.

## Preservation and operations

- Do not reset, clean, stash, delete, or restore old work. Do not create a nested `.git` repository.
- Do not read or print `.env` contents, credentials, or authorization headers into logs or handoffs.
- Preserve existing environment files and locks. Copy an example only when the destination does not exist.
- Do not automatically commit, push, merge, create provider accounts, or publish from these prompts. A human performs the runbook steps, or explicitly authorizes that action in the session.
- Use only synthetic fixture accounts and goals for tests. No production student data.

## Implementation rules

- API v1 is the draft baseline. Agree and document the AI extension and authentication compliance before freezing it; no response-field renaming during parallel development.
- A real server-side AI call is required for personalized guidance. Validate its output; no automatic schedule mutation or fabricated AI success. No email delivery or OAuth is required.
- Supabase email/password demo accounts are the planned default, pending organizer acceptance of managed Auth for the listed JWT/bcrypt requirement. Do not implement a second password system without an agreed architecture update.
- Render validates the user's Supabase access token, then uses a per-request client with that user's JWT and publishable key. RLS enforces ownership. No service-role key is required.
- Completion is idempotent; XP is derived from distinct completed missions. Save a revised state with a version compare-and-set to prevent stale overwrites.
- Distinguish local fixture mode, live API behaviour, and deployed evidence. Production must fail visibly if configuration is missing, not silently fall back to mocks.
- Follow docs/05-audit-and-tests.md. Report commands, actual outcomes, skipped checks, and limitations.
- Never replace a real failure with a hardcoded success message or chart.

## Resume report

Append to your handoff: milestone, files changed, commands and outcomes, live checks, what remains unverified, blocker, next exact action, and whether the next gate is READY or WAITING.
