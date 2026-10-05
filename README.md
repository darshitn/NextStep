# NIAT Hackathon Practice App: AgroPulse (`build-to-ship`)

A production-grade, milestone-driven reference implementation for the **NIAT Hackathon Stack** (React 18 + Vite, Node.js + Express, Replit PostgreSQL, and Google Gemini AI SDK).

---

## 🎯 Architecture & Operating Modes

This application is designed to operate seamlessly in two distinct modes without code changes:

### Mode A: Two-Terminal Concurrent Development (Local)
- **Frontend (Vite Dev Server)**: Runs on `http://localhost:5173` with Hot Module Replacement (HMR).
- **Backend (Express API Server)**: Runs on `http://localhost:3001`.
- **Proxy**: `client/vite.config.js` transparently forwards `/api/*` requests to port `3001`.

### Mode B: Single-Port Production Hosting (Replit / Deployment)
- **Express Server**: Listens on `process.env.PORT` (defaults locally to `3001`) and binds to host `0.0.0.0`.
- **Static Assets**: Express serves pre-compiled production assets from `client/dist` (path resolved relative to `server/index.js`).
- **Database Layer**: Express connects to PostgreSQL via a reusable `pg.Pool` reading `DATABASE_URL` strictly from the server environment.
- **Unified Routing**: 
  - `GET /api/health` ➔ Returns HTTP 200 health payload.
  - `GET /api/notes` ➔ Returns saved notes, newest first.
  - `POST /api/notes` ➔ Validates body and inserts row, returning HTTP 201 with saved row.
  - Unknown `/api/*` ➔ Returns strict JSON 404 (`{"ok": false, "error": "API route not found"}`).
  - Non-API routes ➔ Serves `client/dist/index.html` as SPA fallback.

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20+ (Node v24 tested)
- **npm**: v9+
- **PostgreSQL**: Replit PostgreSQL (or local PostgreSQL connection via `DATABASE_URL`)

### 1. Dependency Installation
Install dependencies across both client and server from the root directory:
```powershell
npm run install:all
```
*Or install independently in each folder:*
```powershell
cd server && npm install
cd ../client && npm install
```

### 2. Database Migration
To create or verify the `notes` table without resetting or modifying existing data, run the non-destructive migration:
```powershell
npm run migrate
```
*(Or alias: `npm run db:migrate`)*

> [!NOTE]
> `DATABASE_URL` must be configured in your environment (or Replit Secrets) before running migrations. The migration script executes:
> ```sql
> CREATE TABLE IF NOT EXISTS notes (
>   id SERIAL PRIMARY KEY,
>   body TEXT NOT NULL,
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```

---

## 🚀 Running the Application

### Option 1: Two-Terminal Development Workflow (HMR)
Use this during active feature development.

**Terminal 1 (Backend API):**
```powershell
npm run dev:server
```
Runs Express on `http://localhost:3001`.

**Terminal 2 (Frontend with Vite Proxy):**
```powershell
npm run dev:client
```
Runs Vite on `http://localhost:5173`. Open your browser to `http://localhost:5173`.

---

### Option 2: Single-Port Production Mode (Replit Compatible)
Use this to build and run the unified single-port application.

**Step 1: Build the Frontend**
```powershell
npm run build
```
Compiles the React application into `client/dist/`.

**Step 2: Start the Express Server**
```powershell
npm start
```
Starts Express on host `0.0.0.0` and port `3001` (or `process.env.PORT` if defined).  
Open your browser to `http://localhost:3001`. Both the frontend UI and the `/api` routes are served from this single port.

---

## 🧪 Verification & API Endpoints

### 1. Browser Verification
- **Local Dev**: Open `http://localhost:5173`
- **Single-Port Production**: Open `http://localhost:3001`
- **Health Check**: Click **"Check backend"** to verify the `GET /api/health` pipeline (`HTTP 200 OK`).
- **404 Check**: Click **"Test 404 Error State"** to verify unknown `/api` route handling.
- **Notes Persistence**: Type a practice note into the note input, view character count, and click **"Save Note"**. If `DATABASE_URL` is configured, the note persists and renders at the top of the list. If `DATABASE_URL` is missing, an explicit error state is shown without reporting success.

### 2. Direct Terminal Checks
- **Health Check Endpoint**:
  ```powershell
  curl.exe -i http://localhost:3001/api/health
  ```

- **Fetch Saved Notes (`GET /api/notes`)**:
  ```powershell
  curl.exe -i http://localhost:3001/api/notes
  ```
  Returns:
  ```json
  HTTP/1.1 200 OK
  [
    {
      "id": 1,
      "body": "Sample practice note",
      "created_at": "2026-10-05T19:00:00.000Z"
    }
  ]
  ```

- **Save Note (`POST /api/notes`)**:
  ```powershell
  curl.exe -i -X POST http://localhost:3001/api/notes -H "Content-Type: application/json" -d "{\"body\":\"Practice note content\"}"
  ```
  Returns:
  ```json
  HTTP/1.1 201 Created
  {
    "id": 2,
    "body": "Practice note content",
    "created_at": "2026-10-05T19:05:00.000Z"
  }
  ```

- **Unknown API Route (404 Fallback)**:
  ```powershell
  curl.exe -i http://localhost:3001/api/non-existent-route
  ```
  Returns:
  ```json
  HTTP/1.1 404 Not Found
  {"ok":false,"error":"API route not found"}
  ```

---

## 🔒 Environment & Secret Management

- Copy `.env.example` to create local environment files when needed:
  ```powershell
  cp .env.example .env
  ```
- `.gitignore` excludes `.env` and all `.env.*` variants while explicitly tracking `.env.example`.
- All `VITE_*` variables are client-exposed; `DATABASE_URL` and backend secrets are strictly backend-only.

---

## 📂 Repository Layout

```text
build-to-ship/
├── .env.example                  # Documented environment template (PORT=3001, DATABASE_URL)
├── .gitignore                    # Excludes node_modules, build outputs, and secret .env files
├── package.json                  # Root scripts: build, start, migrate, db:migrate, dev:client, dev:server, install:all
├── README.md                     # Operational documentation and setup
├── PROJECT.md                    # Project requirements and MVP definition
├── ARCHITECTURE.md               # Technical architecture and data flows
├── ROADMAP.md                    # Phased roadmap (Milestones 1-5)
├── TASKS.md                      # Detailed task status tracker
├── AI_INSTRUCTIONS.md            # Guidelines for coding agents
├── NIAT_MENTOR_PREPARATION.md    # Comprehensive mentor guidance & cheat-sheets
├── NIAT_EVENT_QUICK_REFERENCE.md # Quick event reference sheet
├── client/                       # React 18 + Vite frontend
│   ├── dist/                     # Production build output (gitignored)
│   ├── index.html                # Entry HTML
│   ├── package.json              # Client dependencies
│   ├── vite.config.js            # Reverse proxy configuration
│   └── src/
│       ├── main.jsx              # React mount
│       ├── App.jsx               # Interactive diagnostics & notes persistence UI
│       ├── index.css             # Theme design tokens
│       └── App.css               # Component & note styling
└── server/                       # Express backend
    ├── package.json              # Server dependencies (express, cors, pg)
    ├── index.js                  # Express server (API, static assets, SPA fallback)
    ├── db.js                     # Shared pg.Pool connection module
    └── migrate.js                # Non-destructive notes table migration script
```
