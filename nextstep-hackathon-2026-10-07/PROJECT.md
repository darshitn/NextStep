# NextStep — Project Discovery & Specification

## 1. Problem Statement
Students preparing for campus placements often abandon generic, rigid data structures and algorithms (DSA) roadmaps. When college exams, assignment deadlines, or interruptions disrupt their study rhythm, existing tools fail to recalibrate. Students do not know:
1. "What exact 30-minute mission can I accomplish today?"
2. "How do I resume and restructure my plan after missing several days without losing prior progress or feeling overwhelmed?"

NextStep bridges this gap: it translates DSA placement preparation into bite-sized 30-minute daily missions, adapts real-time guidance to student feedback, and provides a deterministic recovery scheduler that safely reallocates pending work against new availability while keeping all completed milestones intact.

## 2. Target Users
- **Primary Audience:** B.Tech Computer Science and Engineering (CSE) students in years 2–4 beginning campus placement preparation.
- **User Personas:**
  - *Interrupted Learner:* Has fluctuating weekly availability due to lab exams and projects; needs quick plan adjustments rather than abandoning the entire course.
  - *Stuck Learner:* Finds a specific algorithm concept (e.g., sliding window, two-pointer) difficult; needs targeted AI breakdown of the next mission into manageable micro-steps rather than generic video dumps.

## 3. Project Goals
1. **Clarity of Action:** Answer "What can I do today?" in under 5 seconds upon opening the app.
2. **Deterministic Rescheduling:** Calculate mathematically sound schedule recoveries without dropping overflow workload.
3. **Personalized Contextual Guidance:** Leverage server-side Gemini AI to adapt how the next mission is tackled based on student feedback (`too_difficult`, `need_revision`, `ready_to_continue`) without mutating schedule or falsifying progress.
4. **Trustworthy State:** Guarantee that completed practice is self-reported, idempotent, and persists across reloads and multi-tab sessions with versioned concurrency checks.

## 4. Core Features
1. **Auth & Session Management:** Supabase email/password authentication with demo account quick-login.
2. **Curated DSA Starter Track:** 12 ordered, 30-minute foundational missions (`dsa-starter-v1`, total 360 minutes / 6 hours).
3. **Goal Onboarding:** Set start date, target date, flexible/fixed deadline mode, and weekly availability (Mon–Sun in 0, 30, 60, 90 minute slots).
4. **Dashboard & Next Mission:** High-visibility dashboard showing today's eligible mission, remaining workload, completed count, and progress bar.
5. **Self-Reported Completion:** Idempotent mission completion with outcome (`independent` vs `with_hint`) and reflection (max 280 chars), granting 20 XP per completed mission.
6. **Server-Side AI Guidance:** Real-time Gemini 2.5/Flash guidance providing customized micro-steps and a check question without modifying the core plan.
7. **Recovery Preview & Apply:** Side-by-side comparison of current vs proposed schedule upon availability change; explicit atomic acceptance.

## 5. MVP Scope vs Advanced Features

### MVP (Hackathon Deliverable)
- Single active DSA starter goal per student.
- Complete deterministic scheduler with Asia/Kolkata timezone support.
- 12 curated missions in fixed prerequisite order.
- Gemini-powered structured JSON guidance for the active mission.
- Availability recalibration with explicit before/after preview.
- Supabase PostgreSQL persistence with Row-Level Security (RLS) and Compare-And-Set (CAS) version checks.

### Advanced Features (Post-Hackathon)
- Multi-track catalog (System Design, SQL, Core CS).
- External sync with LeetCode/GitHub submission webhooks.
- Study group cohort analytics and peer mentorship.
- Smart notification reminders for planned study slots.
- Deep interview simulation modules.

## 6. Constraints & Boundaries
- **Ownership Partition:** Darshit owns `client/**` (UI, components, state, fixture adapter); Sankirth owns `server/**`, `database/**`, and client integration adapters (`client/src/lib/api.js`, `client/src/lib/supabase.js`).
- **No Scope Creep:** Exclude GSoC tracks, arbitrary 10/20-minute mission intervals (all slots are multiples of 30 mins), and complex gamification leaderboards.
- **Deterministic Scheduling:** AI never modifies the schedule, capacity, or database records directly. AI only guides the cognitive approach within the current 30-minute mission.
- **Environment Isolation:** Secrets and server keys (`AI_API_KEY`) reside only in Render server environment; client uses public Supabase publishable key.

## 7. Technical Challenges
1. **Concurrency & Stale Overwrites:** Handling concurrent tabs and outdated client state through optimistic concurrency control (`expectedVersion` compare-and-set).
2. **Deterministic Horizon Scheduling:** Accurate multi-week scheduling handling partial day consumption (e.g. missions already finished today) without time-zone shifting bugs.
3. **Structured AI Reliability:** Enforcing rigid JSON schema validation on Gemini responses using Zod with graceful retryable failure modes.

## 8. Chosen Technology Stack
- **Frontend:** React 19 / Vite, React Router 7, Tailwind CSS, Lucide React.
- **Backend:** Node 24.x, Express 4.x, Zod, `@supabase/supabase-js`, `@google/genai`, CORS, Express Rate Limit.
- **Database & Auth:** Supabase PostgreSQL with RLS, Supabase Auth.
- **AI Engine:** Google Gemini 2.5 Flash via `@google/genai` (backend-only).
- **Hosting Targets:** Vercel (Client SPA) + Render (Express Web Service).
