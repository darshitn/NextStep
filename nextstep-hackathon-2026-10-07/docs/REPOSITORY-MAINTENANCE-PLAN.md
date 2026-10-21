# NextStep Repository Maintenance & Organization Plan

- **Author**: Repository Maintainer
- **Date**: 2026-10-21
- **Repository Root**: `D:\Projects\BuildToShip`
- **Application Root**: `D:\Projects\BuildToShip\nextstep-hackathon-2026-10-07`
- **Current Branch**: `codex/adaptive-practice`
- **HEAD Commit**: `6453358455cb21ac3806afa9f21870ea6beb3e65` (`feat(onboarding): simplify first-use navigation and guided learning`)
- **Remote Origin**: `https://github.com/darshitn/NextStep.git` (`origin/main` at `20f8b01`, merging PR #7)
- **Status**: **PLAN PROPOSED — PHYSICAL MOVES/DELETIONS DEFERRED UNDER CURRENT-STATE RULE**

---

## 1. Executive Summary & Working Rules

NextStep has progressed through multiple rapid engineering milestones from hackathon scaffold (October 7) to full adaptive practice, spaced review, Foundations Checkpoint continuation, and exhaustive local QA (October 21).

Over this lifecycle, 76+ markdown documents, 21 client verification scripts, 13 server test suites, and multiple presentation guides were created. While all milestones are rigorously evidenced, the repository layout requires clear navigation so contributors, judges, and evaluators can immediately locate operational instructions, system architecture, test harnesses, and release history without confusion.

### The Current-State Rule & Deferral Policy
The working tree currently contains uncommitted feature code and test suites for the **Adaptive Practice & Session Integrity** milestone and the **Full Local QA** pass.

Under the repository maintainer instructions:
1. **Preservation**: Uncommitted feature changes are preserved completely. No reset, clean, stash, or mixing into cleanup commits.
2. **Deferral**: Physical file moves and file deletions are **DEFERRED** until the current feature changes on `codex/adaptive-practice` are reviewed, committed, and published by the implementation owner.
3. **Immediate Navigation**: To immediately solve navigation without risk of breaking relative paths or uncommitted code, an authoritative documentation hub is provided at `docs/README.md`, and both root and nested `README.md` files are updated with accurate links.

---

## 2. Starting Dirty Paths Manifest

The following 17 modified files and 24 untracked files belong to the active, uncommitted `codex/adaptive-practice` milestone and must be preserved:

### Modified Files (17)
1. `nextstep-hackathon-2026-10-07/client/scripts/verify-continuation.cjs`
2. `nextstep-hackathon-2026-10-07/client/src/components/GoalForm.jsx`
3. `nextstep-hackathon-2026-10-07/client/src/components/workspace/AtlasView.jsx`
4. `nextstep-hackathon-2026-10-07/client/src/components/workspace/ProofStudio.jsx`
5. `nextstep-hackathon-2026-10-07/client/src/components/workspace/ReviewView.jsx`
6. `nextstep-hackathon-2026-10-07/client/src/components/workspace/TodayView.jsx`
7. `nextstep-hackathon-2026-10-07/client/src/fixtures/apiFixture.js`
8. `nextstep-hackathon-2026-10-07/client/src/lib/api.js`
9. `nextstep-hackathon-2026-10-07/client/src/pages/DashboardPage.jsx`
10. `nextstep-hackathon-2026-10-07/client/src/services/apiService.js`
11. `nextstep-hackathon-2026-10-07/client/src/services/workspace.js`
12. `nextstep-hackathon-2026-10-07/contracts/API-V1.md`
13. `nextstep-hackathon-2026-10-07/handoffs/DARSHIT.md`
14. `nextstep-hackathon-2026-10-07/scripts/verify-continuation-release.ps1`
15. `nextstep-hackathon-2026-10-07/server/src/routes/goal.js`
16. `nextstep-hackathon-2026-10-07/server/src/schemas/goalSchemas.js`
17. `nextstep-hackathon-2026-10-07/server/src/services/scheduler.js`

### Untracked Files (24)
1. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage0-sanity.cjs`
2. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage2-onboarding-navigation.cjs`
3. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage3-starter-journey.cjs`
4. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage4-curriculum-traces.cjs`
5. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage5-practice-review-week.cjs`
6. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage6-adaptive-practice.cjs`
7. `nextstep-hackathon-2026-10-07/client/scripts/qa-stage7-failure-responsive.cjs`
8. `nextstep-hackathon-2026-10-07/client/scripts/verify-adaptive-practice.cjs`
9. `nextstep-hackathon-2026-10-07/client/src/components/workspace/PracticeSessionModal.jsx`
10. `nextstep-hackathon-2026-10-07/client/src/components/workspace/PracticeSessionProposalModal.jsx`
11. `nextstep-hackathon-2026-10-07/client/src/fixtures/adaptiveReinforcement.test.js`
12. `nextstep-hackathon-2026-10-07/client/src/fixtures/practiceSession.test.js`
13. `nextstep-hackathon-2026-10-07/client/src/fixtures/topicEvidence.test.js`
14. `nextstep-hackathon-2026-10-07/docs/ADAPTIVE-PRACTICE-INDEPENDENT-REVIEW.md`
15. `nextstep-hackathon-2026-10-07/docs/ADAPTIVE-PRACTICE-PROGRESS.md`
16. `nextstep-hackathon-2026-10-07/docs/ADAPTIVE-PRACTICE-REPAIR-RESULT.md`
17. `nextstep-hackathon-2026-10-07/docs/ADAPTIVE-PRACTICE-RESULT.md`
18. `nextstep-hackathon-2026-10-07/docs/ANTIGRAVITY-ADAPTIVE-PRACTICE-OVERNIGHT.md`
19. `nextstep-hackathon-2026-10-07/docs/FULL-LOCAL-QA-FINDINGS.md`
20. `nextstep-hackathon-2026-10-07/docs/FULL-LOCAL-QA-INDEPENDENT-REVIEW.md`
21. `nextstep-hackathon-2026-10-07/docs/FULL-LOCAL-QA-INVENTORY.md`
22. `nextstep-hackathon-2026-10-07/docs/FULL-LOCAL-QA-PROGRESS.md`
23. `nextstep-hackathon-2026-10-07/docs/FULL-LOCAL-QA-RESULT.md`
24. `nextstep-hackathon-2026-10-07/server/tests/practiceSessionRoutes.test.js`

---

## 3. Comprehensive Repository Inventory

```text
D:\Projects\BuildToShip/
├── .gitignore                          [Root ignore rules]
├── README.md                           [Root GitHub entry point]
├── handoffs/                           [Root ignored diagnostic handoffs]
│   ├── atlas-proof-doctor/
│   └── continuation-doctor/
└── nextstep-hackathon-2026-10-07/      [Primary application directory]
    ├── .gitignore                      [Application ignore rules]
    ├── AGENTS.md                       [Operational boundaries & single-owner notice]
    ├── AI_INSTRUCTIONS.md              [AI behavior & guidelines]
    ├── ARCHITECTURE.md                 [Initial architecture document]
    ├── PROJECT.md                      [Initial project vision & MVP scope]
    ├── README.md                       [Nested application README]
    ├── ROADMAP.md                      [Initial phase roadmap]
    ├── START-HERE.md                   [Authoritative setup guide & current ownership]
    ├── TASKS.md                        [Initial task list]
    ├── client/                         [Vite + React frontend]
    │   ├── package.json                [Frontend manifest & scripts]
    │   ├── vite.config.js              [Vite bundler configuration]
    │   ├── tailwind.config.js          [Tailwind styling tokens]
    │   ├── vercel.json                 [Vercel SPA rewrite configuration]
    │   ├── scripts/                    [21 Playwright & browser test scripts]
    │   └── src/                        [Components, pages, lib, services, fixtures]
    ├── server/                         [Express + Node.js backend]
    │   ├── package.json                [Backend manifest & scripts]
    │   ├── scripts/                    [validate-curriculum.mjs]
    │   ├── src/                        [Routes, schemas, services, config, data]
    │   └── tests/                      [13 node:test suites]
    ├── contracts/                      [Authoritative interface contracts]
    │   ├── API-V1.md                   [REST API v1 specification & schemas]
    │   ├── ARCHITECTURE.md             [Stack & per-request client architecture]
    │   └── SCHEDULER.md                [Capacity & recovery rules]
    ├── database/                       [PostgreSQL migrations]
    │   └── migrations/
    │       ├── 001-nextstep-goals.sql  [Goals table with RLS policies]
    │       └── 002-learning-records.sql[Learning records table with RLS]
    ├── fixtures/                       [Starter catalog & sample payloads]
    │   ├── dsa-starter.json            [12 starter missions dataset]
    │   ├── create-goal.request.json
    │   └── initial-goal.response.json
    ├── handoffs/                       [Tracked contributor work logs]
    │   ├── DARSHIT.md                  [Continuous work ledger]
    │   ├── SANKIRTH.md                 [Backend handoff notes]
    │   ├── HARSHITA.md                 [Presentation handoff notes]
    │   └── COLLABORATOR-CURRICULUM-GOAL.md
    ├── presentation/                   [Demo scripts & slide guides]
    │   ├── PITCH-AND-DEMO.md
    │   ├── DASHBOARD-WALKTHROUGH.md
    │   ├── LEARNING-LOOP-DEMO.md
    │   ├── HARSHITHA-DEMO-GUIDE.md
    │   ├── HARSHITHA-DEMO-GUIDE.docx
    │   └── build_harshitha_guide.py
    ├── prompts/                        [Historical implementation specifications]
    │   ├── NEXTSTEP-MASTER-PROMPT.md
    │   ├── ANTIGRAVITY-DSA-LEARNING-LOOP.md
    │   ├── ANTIGRAVITY-FINAL-MVP-PASS.md
    │   ├── CODEX-FINAL-LAYOUT-REPAIR.md
    │   ├── AUDIT-AND-RESUME.md
    │   ├── DARSHIT-ANTIGRAVITY.md
    │   └── SANKIRTH-ANTIGRAVITY.md
    ├── roles/                          [Historical role definition cards]
    │   ├── DARSHIT.md
    │   ├── SANKIRTH.md
    │   └── HARSHITA.md
    ├── scripts/                        [Global verification & preflight scripts]
    │   ├── preflight.mjs
    │   ├── validate-kit.mjs
    │   ├── Test-WorkshopSetup.ps1
    │   └── verify-continuation-release.ps1
    ├── templates/                      [Environment configuration templates]
    │   ├── client.env.example
    │   ├── server.env.example
    │   └── 001-nextstep-goals.sql      [Pre-migration draft]
    └── docs/                           [76 technical reports, reviews & guides]
```

---

## 4. Documentation Classification Matrix

All documentation across `docs/` and root folders is classified into five standard categories:

| Category | Description | Included Files |
| :--- | :--- | :--- |
| **Category 1: Current Entry Points & Operational Instructions** | Authoritative setup, runbooks, operational guides, and testing protocols. | `README.md` (root), `nextstep-hackathon-2026-10-07/README.md`, `START-HERE.md`, `AGENTS.md`, `docs/03-platform-setup.md`, `docs/04-troubleshooting.md`, `docs/05-audit-and-tests.md`, `docs/06-deployment-and-release.md`, `docs/09-supabase-auth-config.md`, `docs/FULL-LOCAL-QA-INVENTORY.md`, `docs/FULL-LOCAL-QA-PROGRESS.md`, `docs/FULL-LOCAL-QA-RESULT.md`. |
| **Category 2: Current Contracts & Architecture** | Canonical API contracts, scheduler math, stack architecture, and ADRs. | `contracts/API-V1.md`, `contracts/ARCHITECTURE.md`, `contracts/SCHEDULER.md`, `docs/adr/0002-foundations-checkpoint-and-continuation.md`. |
| **Category 3: Useful Historical Evidence** | Milestone specifications, repair reports, independent reviews, and production audit evidence. | `docs/FINAL-PRODUCTION-AUDIT.md`, `docs/FINAL-LAYOUT-VERIFICATION.md`, `docs/INTEGRATION-AUDIT.md`, `docs/JUDGE-READINESS-AND-STANDOUT-REPORT.md`, `docs/LIVE-AUDIT-2026-10-16.md`, `docs/PRODUCT-UPGRADE.md`, `docs/PRODUCT-UPGRADE-VERIFICATION.md`, `docs/FEATURE-SHORTLIST-2026-10-17.md`, `docs/PERSISTENT-REVIEW-*.md`, `docs/ANTIGRAVITY-RELEASE-*.md`, `docs/ATLAS-PROOF-*.md`, `docs/UI-REBUILD-*.md`, `docs/UI-PLUMBING-*.md`, `docs/OVERNIGHT-CONTINUATION-*.md`, `docs/CONTINUATION-REPAIR-*.md`, `docs/WEEKLY-EXECUTION-*.md`, `docs/QUICK-CHECKINS-*.md`, `docs/FIRST-SESSION-*.md`, `docs/FIRST-USE-*.md`, `docs/ADAPTIVE-PRACTICE-*.md`, `docs/01-product-scope.md`, `docs/02-team-sync.md`, `docs/07-sources.md`, `docs/08-kit-verification.md`. |
| **Category 4: Duplicate or Superseded Material** | Historical files superseded by authoritative contracts or active single-owner guides. | `templates/001-nextstep-goals.sql` (superseded by `database/migrations/001-nextstep-goals.sql`), `roles/*.md` (superseded by `START-HERE.md` single-owner notice), `prompts/DARSHIT-ANTIGRAVITY.md`, `prompts/SANKIRTH-ANTIGRAVITY.md`, `prompts/AUDIT-AND-RESUME.md` (superseded by `NEXTSTEP-MASTER-PROMPT.md`), root planning files `PROJECT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TASKS.md`, `AI_INSTRUCTIONS.md` (superseded by contracts and living docs). |
| **Category 5: Uncertain / Preserve Pending Review** | Specialized presentation scripts or auxiliary files requiring owner confirmation before disposal. | `presentation/build_harshitha_guide.py`, `presentation/HARSHITHA-DEMO-GUIDE.docx`. |

---

## 5. Target Documentation Reorganization (Proposed Structure)

When a clean feature baseline is committed, the following directory structure is proposed for execution on a dedicated maintenance branch:

```text
docs/
├── README.md                           [Master documentation index & guide]
├── setup/                              [Setup, runbooks, and platform config]
│   ├── 01-local-setup.md              [Consolidated from START-HERE.md]
│   ├── 02-platform-setup.md           [From 03-platform-setup.md]
│   ├── 03-supabase-auth-config.md     [From 09-supabase-auth-config.md]
│   ├── 04-deployment-and-release.md   [From 06-deployment-and-release.md]
│   └── 05-troubleshooting.md          [From 04-troubleshooting.md]
├── architecture/                       [System architecture & ADRs]
│   ├── adr/                           [Architectural Decision Records]
│   │   └── 0002-continuation.md
│   ├── contracts-api-v1.md            [Symlink or pointer to contracts/API-V1.md]
│   └── scheduler-rules.md             [Symlink or pointer to contracts/SCHEDULER.md]
├── testing/                            [Test plans, QA matrices & failure injection]
│   ├── full-local-qa-inventory.md     [From FULL-LOCAL-QA-INVENTORY.md]
│   ├── full-local-qa-result.md        [From FULL-LOCAL-QA-RESULT.md]
│   ├── full-local-qa-findings.md      [From FULL-LOCAL-QA-FINDINGS.md]
│   ├── audit-and-tests-guide.md       [From 05-audit-and-tests.md]
│   └── layout-and-isolation-tests.md
├── releases/                           [Production release audits & milestones]
│   ├── 2026-10-08-final-production-audit.md
│   ├── 2026-10-16-live-audit.md
│   ├── 2026-10-18-ui-rebuild-result.md
│   ├── 2026-10-19-continuation-result.md
│   ├── 2026-10-20-first-use-result.md
│   └── 2026-10-21-adaptive-practice-result.md
└── archive/                            [Archived milestone prompts & reviews]
    ├── README.md                      [Archive index explaining retained provenance]
    ├── prompts/                       [Prompts from master, MVP, and repair passes]
    ├── reviews/                       [Independent review reports across milestones]
    └── legacy-planning/               [Hackathon planning kit files]
```

---

## 6. Proposed Tracked File Deletions & Deprecations

| File Path | Classification | Reason for Proposed Action | References Checked | Replacement / Destination | Risk & Execution Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `templates/001-nextstep-goals.sql` | Category 4 (Duplicate) | Pre-migration draft table definition. Does not include idempotent drop policies or RLS policies found in actual migration. | Referenced in older `contracts/ARCHITECTURE.md` prose only. | `database/migrations/001-nextstep-goals.sql` | **Low risk**. Safe to delete once feature baseline is clean. **DEFERRED**. |
| `prompts/DARSHIT-ANTIGRAVITY.md` | Category 4 (Superseded) | 1-line stub file (`# Darshit Antigravity\n\nPrompt: prompts/NEXTSTEP-MASTER-PROMPT.md`). | `scripts/validate-kit.mjs` checks presence during initial kit validation. | Move to `docs/archive/prompts/` | **Medium risk** (breaks `validate-kit.mjs` if deleted). Safe to archive. **DEFERRED**. |
| `prompts/SANKIRTH-ANTIGRAVITY.md` | Category 4 (Superseded) | 1-line stub file (`# Sankirth Antigravity\n\nPrompt: prompts/NEXTSTEP-MASTER-PROMPT.md`). | `scripts/validate-kit.mjs` checks presence. | Move to `docs/archive/prompts/` | **Medium risk**. Safe to archive. **DEFERRED**. |
| `prompts/AUDIT-AND-RESUME.md` | Category 4 (Superseded) | Short pointer to `docs/05-audit-and-tests.md`. | `scripts/validate-kit.mjs`. | Move to `docs/archive/prompts/` | **Medium risk**. Safe to archive. **DEFERRED**. |
| `roles/DARSHIT.md`, `SANKIRTH.md`, `HARSHITA.md` | Category 4 (Superseded) | Initial 3-person role definitions superseded by `START-HERE.md` single-owner model. | Checked in `validate-kit.mjs`. | Move to `docs/archive/legacy-planning/` | **Medium risk**. Safe to archive. **DEFERRED**. |

---

## 7. Immediate Non-Breaking Actions Taken

To improve clarity, accessibility, and navigation without moving or deleting files:
1. **Created `docs/README.md`**: Master documentation index and navigation directory grouping all 76+ documents by role, phase, and topic.
2. **Updated Root `README.md`**: Improved GitHub landing page clearly stating the nested application directory (`nextstep-hackathon-2026-10-07`), full product description, live links, curriculum inventory (12 topics, 48 lessons, 18 trace exercises, 120 practice problems), exact run/build commands, and truthful verification boundaries.
3. **Synchronized Nested `README.md` & `START-HERE.md`**: Aligned commands and clarified that `START-HERE.md` is the authoritative operational guide.
4. **Produced `docs/BRANCH-AUDIT.md`**: Comprehensive branch audit across all 11 local and 13 remote branches, documenting PR status (#1 through #7 all merged), merge base, and safe deletion candidates.
