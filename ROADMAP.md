# Project Roadmap: NIAT Hackathon Practice

## Phase 1: Core Connectivity & Foundation (Checkpoint 1 — Completed)
- [x] Scaffold decoupled client and server workspaces with root orchestration.
- [x] Implement Express backend on port `3001` with `GET /api/health` returning `{"ok": true}`.
- [x] Implement Vite React client on port `5173` with reverse proxy routing `/api` to port `3001`.
- [x] Implement interactive "Check backend" UI with Loading, Success, and Error states.
- [x] Verify end-to-end communication via terminal inspection, direct curl, and browser proxy.
- [x] Push verified Milestone 1 foundation to GitHub repository `darshitn/build-to-ship`.

## Phase 2: Single-Port Production Hosting & Replit Preparation (Checkpoint 2 — Active)
- [x] Preserve current two-terminal local development workflow (`npm run dev:client` + `npm run dev:server`).
- [x] Compile React frontend into `client/dist` via root script `npm run build`.
- [x] Configure Express to serve `client/dist` static assets via path resolution relative to `server/index.js` file location.
- [x] Guarantee `GET /api/health` continues responding with HTTP 200 JSON.
- [x] Maintain strict JSON 404 handler for unknown `/api/*` routes prior to static and SPA fallback routing.
- [x] Configure Express SPA wildcard fallback (`app.get('*')`) compatible with Express 4.x.
- [x] Bind Express server to host `0.0.0.0` and port `process.env.PORT || 3001` for Replit single-port web hosting.
- [x] Add root scripts (`build` and `start`) in `package.json`.
- [x] Audit `.gitignore` to block all secret `.env` variants while permitting `.env.example`.
- [x] Test and verify all endpoints and single-port static serving locally.
- [ ] Import repository from GitHub into Replit and verify Replit deployment.

## Phase 3: Persistence & Authentication (Next Milestone)
- [ ] Connect Replit PostgreSQL database (or local PostgreSQL fallback) using `pg`.
- [ ] Create database migration schema (`users`, `farms`, `fields`, `crops`, `advisories`).
- [ ] Implement JWT authentication endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] Add client-side login/registration forms with token storage and session management.

## Phase 4: Domain Entities & CRUD Operations
- [ ] Build Farm and Field registration endpoints (`/api/farms`, `/api/fields`).
- [ ] Enforce user tenancy isolation (users cannot access another tenant's farms).
- [ ] Add interactive UI for adding and viewing farm records.

## Phase 5: Gemini AI Integration
- [ ] Integrate `@google/genai` on the Express backend.
- [ ] Configure `GEMINI_API_KEY` and model selection via backend environment variables.
- [ ] Implement `POST /api/advisory` with Zod request/response validation.
- [ ] Add AI Crop Advisory form in React with real-time streaming/result rendering and history persistence.
