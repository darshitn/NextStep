# Project Specification: NIAT Hackathon AgroPulse Practice App

## Problem
Hackathon participants and mentors need a reliable, modular, and demonstrable full-stack application template matching the NIAT hackathon stack. In hackathon environments, teams frequently encounter failure boundaries in API proxying, environment variable leakage, cross-origin mismatches, state synchronization, and deployment discrepancies between local development (Antigravity IDE) and target hosting (Replit PostgreSQL / Replit Deployments).

## Target Users
- **Hackathon Mentors & Participants**: Preparing for and competing in the NIAT Hackathon.
- **Agricultural Users / Smallholder Farmers (Domain Persona)**: Needing targeted crop advisory, field tracking, and AI-assisted agricultural guidance.

## Project Goals
- Master the NIAT hackathon stack: React (Vite), Node/Express, PostgreSQL, and Google Gemini SDK (`@google/genai`).
- Establish robust verification practices (strict network observability, error states, and health monitoring).
- Provide an incremental, milestone-driven architecture that transitions smoothly from local Antigravity pair-programming to Replit deployment without architecture rewrites.

## Core Features
1. **System Health & Connectivity Verification (Milestone 1)**:
   - Dedicated backend health endpoint (`GET /api/health`).
   - Vite development proxy redirecting `/api/*` requests to the Express server.
   - Interactive diagnostic UI with clear Loading, Success, and Error states.
2. **User Authentication & Tenant Isolation (Milestone 2)**:
   - Registration, login, and session validation using secure JWT and password hashing.
   - User-scoped access control ensuring data isolation across farm records.
3. **Farm & Crop Management (Milestone 3)**:
   - Farm entity creation (location, size, soil type).
   - Crop tracking and lifecycle status.
4. **AI Crop Advisory Engine (Milestone 4)**:
   - Server-side Gemini API integration via `@google/genai`.
   - Structured crop health recommendations and weather/pest mitigation advice.
   - Persistent advisory history.

## MVP (Minimum Viable Product)
- **Checkpoint 1 (Current Focus)**:
  - React (Vite) single-page application.
  - Express HTTP server running on port 3001.
  - `GET /api/health` returning `{"ok": true}`.
  - Interactive "Check backend" UI with visual feedback for loading, success, and error states.
  - Development proxy in `vite.config.js` routing `/api` calls seamlessly.
- **MVP Expansion**:
  - Replit PostgreSQL database connection.
  - Secure auth & single farm/crop CRUD.
  - Single-prompt Gemini crop advisory.

## Advanced Features
- Multi-field soil moisture analytics and harvest prediction.
- Offline-first cache with service workers for low-connectivity rural deployment.
- Multilingual voice/text advisory inputs.

## Constraints
- **Zero Premature Complexity**: Do not add auth, database, or Gemini until the base communication pipeline is verified.
- **Security Boundaries**: `VITE_*` environment variables are client-exposed; all secrets (JWT, Gemini keys, DB connection strings) remain strictly backend-only.
- **Preservation Policy**: Preserve existing files (`NIAT_MENTOR_PREPARATION.md`, `NIAT_EVENT_QUICK_REFERENCE.md`). No automatic Git commit, push, or cloud deployment until explicitly authorized.

## Technical Challenges
- Proper reverse proxy configuration in Vite dev mode preventing CORS errors or HTML SPA fallbacks.
- Graceful handling of server downtime, network timeout, or connection drops in the frontend UI.
- Strict type/shape validation between client requests and Express responses.

## Chosen Technology Stack
- **Frontend**: React 18/19, Vite, Vanilla CSS / Modern Glassmorphic Design System.
- **Backend**: Node.js (v24), Express 4.
- **Tooling & Build**: npm, Vite Dev Server (`localhost:5173`), Express Server (`localhost:3001`).
- **Upcoming Phases**: PostgreSQL (via `pg`), `@google/genai`, Zod validation.
