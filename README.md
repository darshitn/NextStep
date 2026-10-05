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
- **Unified Routing**: 
  - `GET /api/health` ➔ Returns HTTP 200 health payload.
  - Unknown `/api/*` ➔ Returns strict JSON 404 (`{"ok": false, "error": "API route not found"}`).
  - Non-API routes ➔ Serves `client/dist/index.html` as SPA fallback.

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20+ (Node v24 tested)
- **npm**: v9+

### 1. Dependency Installation
Install dependencies across both client and server from the root directory:
```powershell
npm run install:all
```
*Alternatively, install independently in each folder:*
```powershell
cd server && npm install
cd ../client && npm install
```

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

## 🧪 Verification & Health Checks

### 1. Browser Verification
- **Local Dev**: Open `http://localhost:5173`
- **Single-Port Production**: Open `http://localhost:3001`
- Click **"Check backend"** to verify the `GET /api/health` pipeline (`HTTP 200 OK`).
- Click **"Test 404 Error State"** to verify that unknown `/api` routes yield structured error handling.

### 2. Direct Terminal Checks
- **Health Check Endpoint**:
  ```powershell
  curl.exe -i http://localhost:3001/api/health
  ```
  Response:
  ```json
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

  {"ok":true,"status":"healthy","timestamp":"...","uptimeSeconds":42,"service":"niat-backend"}
  ```

- **Unknown API Route (404 Fallback)**:
  ```powershell
  curl.exe -i http://localhost:3001/api/non-existent-route
  ```
  Response:
  ```json
  HTTP/1.1 404 Not Found
  Content-Type: application/json; charset=utf-8

  {"ok":false,"error":"API route not found"}
  ```

- **Frontend SPA Fallback (HTML)**:
  ```powershell
  curl.exe -i http://localhost:3001/
  ```
  Response:
  ```html
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=UTF-8

  <!doctype html>...
  ```

---

## 🔒 Environment & Secret Management

- Copy `.env.example` to create local environment files when needed:
  ```powershell
  cp .env.example .env
  ```
- `.gitignore` is configured to exclude all `.env`, `.env.local`, and secret variants while tracking `.env.example`.
- All `VITE_*` variables are client-exposed; database connection strings and AI keys are strictly isolated to the server.

---

## 📂 Repository Layout

```text
build-to-ship/
├── .env.example                  # Documented environment template (PORT=3001)
├── .gitignore                    # Excludes node_modules, build outputs, and secret .env files
├── package.json                  # Root scripts: build, start, dev:client, dev:server, install:all
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
│       ├── App.jsx               # Interactive diagnostics UI
│       ├── index.css             # Theme design tokens
│       └── App.css               # Component styling
└── server/                       # Express backend
    ├── package.json              # Server dependencies
    └── index.js                  # Express server (serves API and client/dist)
```
