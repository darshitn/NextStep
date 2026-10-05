# NIAT Hackathon Practice App: AgroPulse (`build-to-ship`)

A production-grade, milestone-driven reference implementation for the **NIAT Hackathon Stack** (React 18 + Vite, Node.js + Express, Replit PostgreSQL, and Google Gemini AI SDK).

---

## 🚀 Current Milestone: Core Connectivity Checkpoint (Milestone 1)

- **Frontend**: Single Page Application built with React 18 & Vite, featuring a modern glassmorphic design system and responsive state machine (`idle` | `loading` | `success` | `error`).
- **Backend**: Express REST API running on port `3001` with JSON middleware, request logging, and structured error boundaries.
- **Reverse Proxy**: Vite development proxy transparently forwarding `/api/*` requests to Express on `http://localhost:3001`.
- **Health Contract**: `GET /api/health` responding with `{"ok": true, "status": "healthy", ...}`.
- **Production Ready**: Verified clean Vite production build bundle.

---

## 🛠️ Port Allocation

| Component | Default Port | Description |
|---|---|---|
| **Client UI** | `5173` | Vite Dev Server + React Single-Page Application |
| **Backend API** | `3001` | Express REST API Service |

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20+ (Node v24 supported)
- **npm**: v9+

### 1. Install Dependencies
Install dependencies for both frontend and backend from the root directory:
```powershell
npm run install:all
```
*(Or install separately inside `client/` and `server/` via `npm install`)*

### 2. Start the Backend API Server
```powershell
npm run dev:server
```
Runs Express on `http://localhost:3001`.

### 3. Start the Frontend Dev Server
In a separate terminal:
```powershell
npm run dev:client
```
Runs Vite dev server on `http://localhost:5173`.

### 4. Build for Production
```powershell
npm run build:client
```
Produces optimized static assets in `client/dist/`.

---

## 🧪 Testing & Verification

1. **Browser Test**:
   - Open `http://localhost:5173` in your browser.
   - Click the **"Check backend"** button.
   - Observe the real-time transition from `loading` spinner to `success` with latency calculation and formatted JSON payload.
   - Click **"Test 404 Error State"** to verify robust error boundary and troubleshooting advice.

2. **Direct Backend Health Check**:
   ```powershell
   curl.exe -i http://localhost:3001/api/health
   ```
   Expected response:
   ```json
   {
     "ok": true,
     "status": "healthy",
     "timestamp": "...",
     "uptimeSeconds": 42,
     "service": "niat-backend"
   }
   ```

---

## 📂 Repository Structure

```text
build-to-ship/
├── .gitignore                    # Ignored artifacts (node_modules, dist, .env)
├── package.json                  # Root runner scripts (dev:client, dev:server, build:client)
├── README.md                     # Project overview and setup instructions
├── PROJECT.md                    # Core problem, users, MVP, and goals
├── ARCHITECTURE.md               # Detailed system architecture and data flows
├── ROADMAP.md                    # Multi-phase roadmap (Milestones 1-4)
├── TASKS.md                      # Granular task tracker
├── AI_INSTRUCTIONS.md            # LLM pair-programming guidelines
├── NIAT_MENTOR_PREPARATION.md    # Comprehensive mentor guidance & cheat-sheets
├── NIAT_EVENT_QUICK_REFERENCE.md # Quick event reference sheet
├── client/                       # React 18 + Vite frontend
│   ├── index.html                # Entry HTML with custom fonts
│   ├── package.json              # Client dependencies
│   ├── vite.config.js            # Vite proxy configuration
│   └── src/
│       ├── main.jsx              # React root entrypoint
│       ├── App.jsx               # Diagnostic UI & state handler
│       ├── index.css             # Theme design system & tokens
│       └── App.css               # Card & state-box styling
└── server/                       # Express backend
    ├── package.json              # Server dependencies
    └── index.js                  # Express API with /api/health
```

---

## 🗺️ Architectural Planning Documents

- 📘 [PROJECT.md](PROJECT.md): Scope, problem statements, constraints, and MVP definitions.
- 📐 [ARCHITECTURE.md](ARCHITECTURE.md): Network diagrams, data flows, and security guidelines.
- 🧭 [ROADMAP.md](ROADMAP.md): Next phases (Auth, PostgreSQL database, Gemini AI advisory).
- ✅ [TASKS.md](TASKS.md): Step-by-step milestone checklist.
- 🎓 [NIAT_MENTOR_PREPARATION.md](NIAT_MENTOR_PREPARATION.md): In-depth mentor playbook and technical drills.
