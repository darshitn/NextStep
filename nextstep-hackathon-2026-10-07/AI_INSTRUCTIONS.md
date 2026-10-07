> **Current ownership decision:** Darshit now owns the complete implementation: frontend, backend, database, auth/API adapters, AI integration and deployment configuration. This supersedes all split-role ownership and two-person acknowledgment requirements below. Sankirth supplies access/configuration and any existing work; Harshitha owns demo/presentation. Use one active editing session. Continue through verified local milestones without waiting for Sankirth; preserve existing work and report external blockers.

# AI Instructions & Developer Boundaries

This guide instructs AI agents collaborating on NextStep within Antigravity.

## Core Directives
1. **Ownership Boundaries:**
   - **DARSHIT:** Owns `client/**` (excluding `client/src/lib/api.js` and `client/src/lib/supabase.js`), `client/src/fixtures/`, and `handoffs/DARSHIT.md`.
   - **SANKIRTH:** Owns `server/**`, `database/**`, `client/src/lib/api.js`, `client/src/lib/supabase.js`, and `handoffs/SANKIRTH.md`.
   - Never edit files outside your assigned role.
2. **Preserve Repository Integrity:**
   - Do not stage, commit, or clean the parent workspace (`d:\Projects\BuildToShip`). Existing parent git deletions must be preserved.
   - Never create a nested `.git` directory inside `nextstep-hackathon-2026-10-07`.
3. **No Fake Integrations:**
   - When developing UI without a live backend, use the explicit fixture adapter in `client/src/fixtures/apiFixture.js` and display a clear `FIXTURE MODE` banner.
   - Do not claim remote Supabase, Gemini, Render, or Vercel execution without real verified outputs.
4. **Deterministic Scheduling vs AI Guidance:**
   - Scheduling is strictly deterministic based on 30-minute intervals and user availability.
   - AI is strictly advisory: it explains concepts, suggests micro-steps, and offers checks for understanding. It NEVER writes to the database, alters mission order, marks tasks complete, or changes the user's schedule.
5. **Phase Gates & Milestone Reports:**
   - Work milestone by milestone.
   - Conclude every milestone by updating `TASKS.md` and appending an audit entry to `handoffs/DARSHIT.md` (or `handoffs/SANKIRTH.md`) with files changed, commands run, actual test results, unverified integrations, and next action.
