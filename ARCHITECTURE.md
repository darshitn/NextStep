# System Architecture: NIAT Practice App

## System Architecture Diagram

```mermaid
flowchart LR
    subgraph Client ["Browser / React (Vite)"]
        UI["App.jsx (Check backend UI)"]
        Fetch["fetch('/api/health')"]
        UI --> Fetch
    end

    subgraph DevServer ["Vite Dev Server (Port 5173)"]
        Proxy["Proxy: /api -> http://localhost:3001"]
    end

    subgraph Server ["Express API Server (Port 3001)"]
        Router["Express Router (/api)"]
        HealthHandler["GET /api/health Handler"]
        Router --> HealthHandler
    end

    Fetch -->|HTTP Request| Proxy
    Proxy -->|Forward Request| Router
    HealthHandler -->|{"ok": true}| Proxy
    Proxy -->|HTTP Response| Fetch
```

## Frontend
- **Framework**: React running on Vite.
- **Port**: `5173`.
- **Styling**: Curated modern UI design system with high visual polish, glassmorphism, responsive status indicators, and micro-animations.
- **Proxy Configuration**: Configured in `vite.config.js` to route all `/api/*` requests to `http://localhost:3001`. Eliminates cross-origin resource sharing (CORS) friction during local development.

## Backend
- **Framework**: Node.js with Express.
- **Port**: `3001` (configured via `PORT` environment variable or defaulting to 3001).
- **Middleware**: JSON parser (`express.json()`), CORS middleware (`cors`) for safety, and centralized error handler.
- **Routing**: Clean route separation under `/api`.

## Database (Planned for Phase 2)
- Target: Replit PostgreSQL database (or local PostgreSQL via `DATABASE_URL`).
- Access layer: Parameterized queries with connection pooling via `pg`.

## APIs (Milestone 1)
- `GET /api/health`
  - Response: `200 OK`
  - Body: `{"ok": true, "timestamp": "<ISOString>", "uptime": <seconds>}` (minimal contract guarantees `{"ok": true}`)

## Authentication (Planned for Phase 2)
- Session mechanism: JWT (JSON Web Token) with random secret (`JWT_SECRET`).
- Password security: `bcryptjs` hashing.
- Scoping: Tenant user ID attached to all database queries.

## AI Components (Planned for Phase 3)
- Google Gemini SDK (`@google/genai`).
- Execution scope: Server-side only. `GEMINI_API_KEY` is never exposed to the client bundle.

## Data Flow (Milestone 1 Checkpoint)
1. User clicks the "Check backend" button in React UI (`client/src/App.jsx`).
2. React state transitions to `loading` (`status = 'loading'`).
3. Browser issues `GET /api/health` to origin `http://localhost:5173`.
4. Vite dev server proxies request to `http://localhost:3001/api/health`.
5. Express server receives request, validates, and responds with `{"ok": true}`.
6. React component receives JSON response, checks `data.ok === true`, and updates state to `success` with response details.
7. If network error, offline backend, or non-200 status occurs, state catches error and renders `error` state with diagnostic hints.

## Folder Structure
```text
BuildToShip/
├── client/                     # React Frontend
│   ├── index.html              # HTML entry point
│   ├── package.json            # Frontend dependencies & scripts
│   ├── vite.config.js          # Vite config with /api proxy
│   └── src/
│       ├── main.jsx            # React root mount
│       ├── App.jsx             # Main interactive practice component
│       ├── index.css           # Design tokens, typography, glassmorphism
│       └── App.css             # Component-specific styles & animations
├── server/                     # Node/Express Backend
│   ├── package.json            # Backend dependencies & scripts
│   └── index.js                # Express app, middleware, /api/health
├── package.json                # Root orchestration scripts
├── PROJECT.md                  # Project goals and scope
├── ARCHITECTURE.md             # This document
├── ROADMAP.md                  # Phased progression
├── TASKS.md                    # Granular task tracker
├── AI_INSTRUCTIONS.md          # Guidelines for coding agents
└── README.md                   # Operational commands and onboarding
```

## Deployment
- Local Antigravity: Client on `:5173`, Server on `:3001`.
- Production Replit (Future Milestone): Server serves compiled static frontend assets from `client/dist`, exposing a single unified web port (`PORT=3000` or Replit standard `PORT=5000`).

## Security
- `VITE_*` variable audit: Only non-sensitive public configs can be exposed to Vite client.
- Header hardening: Express incorporates JSON payload size limits and sanitized responses.
- Error sanitation: Server does not leak internal stack traces to client responses.

## Important Technical Decisions
- **Split package structure with unified root scripts**: Allows client and server to have decoupled dependencies while allowing developers to start both from root via `npm run dev:client` and `npm run dev:server`.
- **Vite Proxy over CORS**: Using Vite's proxy mirrors production single-origin behavior where frontend and backend are served from the same host, avoiding common cross-origin cookie/header issues.
