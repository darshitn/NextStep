# Tasks Breakdown

## Milestone 1: Core Connectivity Checkpoint (Completed)

- [x] **M1.1 Backend Foundation**
  - [x] Initialize `server/package.json` with dependencies (`express`, `cors`).
  - [x] Create `server/index.js` listening on port `3001`.
  - [x] Implement `GET /api/health` returning `{"ok": true}`.
  - [x] Validate endpoint directly via `curl.exe http://localhost:3001/api/health`.

- [x] **M1.2 Frontend Foundation**
  - [x] Initialize `client/package.json` with `react`, `react-dom`, and `vite`.
  - [x] Configure `client/vite.config.js` with proxy pointing `/api` -> `http://localhost:3001`.
  - [x] Create `client/index.html` and `client/src/main.jsx`.
  - [x] Create `client/src/index.css` with modern design system and palette tokens.

- [x] **M1.3 Health Check UI Component**
  - [x] Implement `client/src/App.jsx` with "Check backend" action button.
  - [x] Implement distinct UI state for `idle`.
  - [x] Implement distinct UI state for `loading` (spinner and disabled action).
  - [x] Implement distinct UI state for `success` (status badge, timestamp, server payload).
  - [x] Implement distinct UI state for `error` (error message, diagnostic suggestions, retry action).
  - [x] Add proxy verification toggle / status display.

- [x] **M1.4 Orchestration & Verification**
  - [x] Create root `package.json` with helper scripts (`dev:client`, `dev:server`).
  - [x] Start backend and verify port `3001` responds (`curl` returned HTTP 200).
  - [x] Start frontend and verify port `5173` responds and proxies requests to backend.
  - [x] Test success path through frontend proxy in browser (`HTTP 200 OK — Backend Connected`).
  - [x] Test failure path (simulated 404 test endpoint) to verify error state.
  - [x] Push verified Milestone 1 to GitHub repository `darshitn/build-to-ship`.

## Milestone 2: Single-Port Production Hosting & Replit Preparation (Active)

- [x] **M2.1 Two-Terminal Workflow Preservation**
  - [x] Maintain root `dev:client` and `dev:server` scripts for concurrent development.
  - [x] Preserve `client/vite.config.js` proxy forwarding `/api` to port 3001 during local dev.

- [x] **M2.2 Root Scripts & Build Pipeline**
  - [x] Add root `"build": "npm --prefix client run build"` to compile React to `client/dist`.
  - [x] Add root `"start": "npm --prefix server start"` to execute production server.
  - [x] Execute production build and verify bundle generation in `client/dist`.

- [x] **M2.3 Express Single-Port Static & Fallback Routing**
  - [x] Resolve `client/dist` path relative to `server/index.js` (`import.meta.url`) to prevent CWD dependency.
  - [x] Configure `express.static` pointing to the resolved `clientDistPath`.
  - [x] Ensure `GET /api/health` continues returning HTTP 200 JSON.
  - [x] Maintain strict JSON 404 response for unknown `/api/*` requests before static/fallback layers.
  - [x] Implement SPA wildcard fallback (`app.get('*')`) compatible with Express 4.x.
  - [x] Bind listener to `process.env.PORT || 3001` on host `0.0.0.0` for Replit single-port web access.

- [x] **M2.4 Environment & Secret Security Audit**
  - [x] Update `.gitignore` to block all secret `.env` variants while explicitly allowing `.env.example`.
  - [x] Provide root `.env.example` documenting `PORT=3001`.
  - [x] Verify `.gitignore` rules with `git check-ignore`.

- [ ] **M2.5 Runtime Verification & Documentation**
  - [x] Verify `GET /api/health` returns HTTP 200 JSON on single-port Express server.
  - [x] Verify unknown `/api/non-existent-route` returns HTTP 404 JSON.
  - [x] Verify root `/` and non-API paths serve compiled React HTML from Express.
  - [x] Document dependency installation, build, start commands, and Replit hosting procedures in `README.md`.

## Milestone 3: Persistence & Authentication (Planned)
- [ ] Connect Replit PostgreSQL database (or local PostgreSQL fallback) using `pg`.
- [ ] Create database migration schema (`users`, `farms`, `fields`, `crops`, `advisories`).
- [ ] Implement JWT authentication endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- [ ] Add client-side login/registration forms with token storage and session management.

## Milestone 4: Domain Entities & CRUD Operations (Planned)
- [ ] Build Farm and Field registration endpoints (`/api/farms`, `/api/fields`).
- [ ] Enforce user tenancy isolation.
- [ ] Add interactive UI for adding and viewing farm records.

## Milestone 5: Gemini AI Integration (Planned)
- [ ] Integrate `@google/genai` on Express backend.
- [ ] Configure `GEMINI_API_KEY` via server environment.
- [ ] Implement `POST /api/advisory` with Zod validation.
- [ ] Implement interactive AI Advisory form and history UI.
