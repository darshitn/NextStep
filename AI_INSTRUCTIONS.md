# AI Instructions & Operational Guidelines

## Purpose
This document provides explicit guidelines for AI coding agents operating on this repository.

## Non-Negotiable Rules
1. **Incremental Milestone Execution**:
   - Only implement the active, incomplete milestone designated in `ROADMAP.md` and `TASKS.md`.
   - Never prematurely introduce database configurations, authentication layers, or third-party APIs (such as Gemini) before the foundational milestone is tested and verified.

2. **File Preservation**:
   - Never overwrite or delete documentation files (`NIAT_MENTOR_PREPARATION.md`, `NIAT_EVENT_QUICK_REFERENCE.md`).
   - Preserve existing code comments and architectural conventions.

3. **No Automatic Commits or Deployments**:
   - Do not commit changes to Git, push to remote repositories, or trigger cloud deployments unless explicitly instructed by the user.

4. **Security Safeguards**:
   - Never embed secret keys, credentials, or JWT signing secrets into client-side code (`client/src/`).
   - `VITE_*` environment variables are exposed in browser bundles; backend secrets must strictly stay in backend environment variables.

5. **Evidence-Based Verification**:
   - Always verify functionality by running terminal commands or browser interactions before reporting a milestone complete.
   - Report actual HTTP statuses, ports, and console findings.
