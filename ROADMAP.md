# Project Roadmap: NIAT Hackathon Practice

## Phase 1: Core Connectivity & Foundation (Checkpoint 1 — Completed)
- [x] Scaffold decoupled client and server workspaces with root orchestration.
- [x] Implement Express backend on port `3001` with `GET /api/health` returning `{"ok": true}`.
- [x] Implement Vite React client on port `5173` with reverse proxy routing `/api` to port `3001`.
- [x] Implement interactive "Check backend" UI with Loading, Success, and Error states.
- [x] Verify end-to-end communication via terminal inspection, direct curl, and browser proxy.
- [x] Push verified Milestone 1 foundation to GitHub repository `darshitn/build-to-ship`.

## Phase 2: Single-Port Production Hosting & Replit Preparation (Checkpoint 2 — Completed)
- [x] Preserve current two-terminal local development workflow (`npm run dev:client` + `npm run dev:server`).
- [x] Compile React frontend into `client/dist` via root script `npm run build`.
- [x] Configure Express to serve `client/dist` static assets via path resolution relative to `server/index.js` file location.
- [x] Guarantee `GET /api/health` continues responding with HTTP 200 JSON.
- [x] Maintain strict JSON 404 handler for unknown `/api/*` routes prior to static and SPA fallback routing.
- [x] Configure Express SPA wildcard fallback (`app.get('*')`) compatible with Express 4.x.
- [x] Bind Express server to host `0.0.0.0` and port `process.env.PORT || 3001` for Replit single-port web hosting.
- [x] Add root scripts (`build` and `start`) in `package.json`.
- [x] Audit `.gitignore` to block all secret `.env` variants while permitting `.env.example`.
- [x] Deploy and verify application execution in Replit.

## Phase 3: PostgreSQL Note Persistence (Checkpoint 3 — Implemented, Replit DB Verification Pending)
- [x] Add `pg` library to Express backend.
- [x] Create connection pool module (`server/db.js`) reusing a single `pg.Pool` instance and reading `DATABASE_URL` strictly from backend environment.
- [x] Create non-destructive migration script (`server/migrate.js`) for `notes` table (`id SERIAL PRIMARY KEY, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`).
- [x] Provide migration scripts (`npm run migrate`, `npm run db:migrate`).
- [x] Implement `POST /api/notes` with body validation, parameterized INSERT, and HTTP 201 response.
- [x] Implement `GET /api/notes` returning notes newest first.
- [x] Add React Note input form, character counter, Save button, and Persisted Notes list.
- [x] Implement robust error and loading states (database failures never reported as success).
- [ ] Run migration and verify live persistence with PostgreSQL inside Replit.

## Phase 4: Authentication & Domain Entities (Next Milestone)
- [ ] Connect Replit PostgreSQL database for User entity (`users` table).
- [ ] Implement JWT authentication endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] Add client-side login/registration forms with token storage and session management.
- [ ] Build Farm and Field registration endpoints (`/api/farms`, `/api/fields`).
- [ ] Enforce tenant data isolation across farm records.

## Phase 5: Gemini AI Integration
- [ ] Integrate `@google/genai` on Express backend.
- [ ] Configure `GEMINI_API_KEY` via server environment.
- [ ] Implement `POST /api/advisory` with Zod validation.
- [ ] Add AI Crop Advisory form in React with real-time streaming/result rendering and history persistence.
