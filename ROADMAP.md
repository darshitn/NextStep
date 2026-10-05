# Project Roadmap: NIAT Hackathon Practice

## Phase 1: Connectivity & Foundation (Current Milestone)
- [x] Scaffold decoupled client and server workspaces with root orchestration.
- [x] Implement Express backend on port `3001` with `GET /api/health` returning `{"ok": true}`.
- [x] Implement Vite React client on port `5173` with reverse proxy routing `/api` to port `3001`.
- [x] Implement interactive "Check backend" UI with Loading, Success, and Error states.
- [x] Verify end-to-end communication via terminal inspection, direct curl, and browser proxy.

## Phase 2: Persistence & Authentication (Next Milestone)
- [ ] Connect Replit PostgreSQL database (or local PostgreSQL fallback) using `pg`.
- [ ] Create database migration schema (`users`, `farms`, `fields`, `crops`, `advisories`).
- [ ] Implement JWT authentication endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] Add client-side login/registration forms with token storage and session management.

## Phase 3: Domain Entities & CRUD Operations
- [ ] Build Farm and Field registration endpoints (`/api/farms`, `/api/fields`).
- [ ] Enforce user tenancy isolation (users cannot access another tenant's farms).
- [ ] Add interactive UI for adding and viewing farm records.

## Phase 4: Gemini AI Integration
- [ ] Integrate `@google/genai` on the Express backend.
- [ ] Configure `GEMINI_API_KEY` and model selection via backend environment variables.
- [ ] Implement `POST /api/advisory` with Zod request/response validation.
- [ ] Add AI Crop Advisory form in React with real-time streaming/result rendering and history persistence.

## Phase 5: Deployment Preparation & Replit Migration
- [ ] Configure production build pipeline (`client/dist` static serving via Express).
- [ ] Verify single-port unified serving for Replit environment.
- [ ] Perform audit of environment variables and secrets.
