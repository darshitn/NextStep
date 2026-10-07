# NextStep — Personalized AI Experiences Hackathon

NextStep is an adaptive placement preparation copilot built for the **Personalized AI Experiences** hackathon challenge.

> Students abandon placement preparation when generic roadmaps stop matching their available time and current understanding. NextStep converts a preparation goal into manageable daily 30-minute missions, adapts guidance to student feedback using Google Gemini, and helps students resume after interruptions without losing completed progress.

## Repository Layout

The current project and implementation files live in the [`nextstep-hackathon-2026-10-07`](./nextstep-hackathon-2026-10-07) directory:

- [**Quick Start & Setup**](./nextstep-hackathon-2026-10-07/START-HERE.md): Getting started guide and team workflow.
- [**Project Overview**](./nextstep-hackathon-2026-10-07/PROJECT.md): Problem statement, target personas, MVP scope, and core features.
- [**System Architecture**](./nextstep-hackathon-2026-10-07/ARCHITECTURE.md): Frontend, backend, database schema, and Gemini AI flow.
- [**Task Tracker**](./nextstep-hackathon-2026-10-07/TASKS.md): Detailed progress tracker.
- [**Client Application**](./nextstep-hackathon-2026-10-07/client): React 18, Vite 5, Tailwind CSS, and Lucide React application.
- [**API Specifications**](./nextstep-hackathon-2026-10-07/contracts/API-V1.md): Frozen API v1 endpoints and contracts.
- [**Deterministic Scheduler**](./nextstep-hackathon-2026-10-07/contracts/SCHEDULER.md): Pure mathematical scheduling and recovery rules.

## Local Development (Client)

```bash
cd nextstep-hackathon-2026-10-07/client
npm install
npm test
npm run dev
```

Visit `http://localhost:5173` to explore the app with built-in test personas in fixture mode.
