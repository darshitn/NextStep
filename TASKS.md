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
  - [x] Document verified findings and browser subagent recording.

- [x] **M1.5 Repository Review & GitHub Publishing**
  - [x] Create comprehensive `.gitignore` for node_modules, build outputs, and environment variables.
  - [x] Verify client production build with `npm --prefix client run build`.
  - [x] Add root build script (`build:client`) to `package.json`.
  - [x] Audit codebase for leaked secrets, credentials, and tokens.
  - [x] Update `README.md` with complete setup, verification, and architecture details.
  - [x] Initialize Git repository, configure remote `build-to-ship`, and push to GitHub.
