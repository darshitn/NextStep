# ADR 0002: Foundations Checkpoint and Post-Starter Continuation Journey

- **Status**: Accepted
- **Date**: 2026-10-18 (Asia/Kolkata)
- **Deciders**: Darshit (Integration Owner / Tracks A & B)
- **Consulted**: Contracts (API-V1, SCHEDULER, ARCHITECTURE), Collaborator Curriculum Goal

---

## 1. Context and Problem Statement

NextStep users who complete the initial 12-mission DSA Foundations Starter (`m01`–`m12`) previously reached a terminal congratulations screen without a coherent transition into broader curriculum study in Atlas and Proof.
While an Atlas curriculum (12 topics, 48 lessons, 18 exercises, 120 practice problems) and a workspace scheduler exist, students completing the starter need:
1. Meaningful celebration of their starter achievement with actual evidence (checks, hints, notes, reflections) without misleading claims of mastery or interview readiness.
2. An optional, low-stakes Foundations Checkpoint covering the three core starter pillars: Arrays & Scanning, Hash Sets & Maps, and Binary Search Boundaries.
3. Authoritative server-side grading that keeps answer keys private, prevents cheating via client score fabrication, and allows clean retry and draft persistence.
4. An explainable, evidence-based next-week plan offering targeted revisits for difficult concepts, one eligible new lesson/practice, and due reviews, scheduled with user-editable capacity.

We must implement this without modifying the friend's curriculum data (`server/data/curriculum/**`), without schema migrations, and without breaking backward compatibility for active or legacy goals.

---

## 2. Decision Drivers

- **Ownership Separation**: The collaborator owns `server/data/curriculum/**`. The checkpoint definitions, evaluation schemas, and continuation state must live in server-owned integration paths (`server/src/data/foundationsCheckpoint.js`).
- **Data Privacy & Integrity**: Client UI must never receive answer keys or correct option flags before or during evaluation. Grading is performed exclusively on the server.
- **Additive Schema & CAS**: The continuation data must reside additively under `goal.state.studyWorkspace.continuation` and survive all legacy mutations (e.g. mission completion, recovery, recall). CAS version checks (`expectedVersion`) must prevent lost updates.
- **Idempotency**: Submitting identical attempts must be idempotent and return existing results without double-bumping versions. Conflicting attempts with the same `attemptId` must return HTTP 409.
- **Deterministic Scheduling**: Weekly plan recommendations must use documented, deterministic rules (revisit failed topics, advance prerequisite order, schedule due reviews) with Asia/Kolkata calendar dates.
- **Optionality**: Taking the checkpoint must be entirely optional. Students may bypass to Atlas or revisit the starter at any time.

---

## 3. Considered Options

- **Option A (Monolithic Course Gate)**: Force all students who complete mission 12 into a mandatory multi-step exam before unlocking Atlas.
  - *Rejected*: Violates low-stress learning philosophy and breaks existing Atlas direct navigation.
- **Option B (Client-Graded Quiz)**: Embed questions and answers in React fixtures with client-computed scores.
  - *Rejected*: Insecure; leaks answer keys in JavaScript bundles; cannot record authoritative attempt history.
- **Option C (Additive Server-Evaluated Foundations Checkpoint & Continuation Plan)**:
  - Bounded server definition in `server/src/data/foundationsCheckpoint.js`.
  - Student-safe endpoint `GET /api/goal/workspace/checkpoint/:checkpointId`.
  - Draft persistence via `POST /api/goal/workspace/checkpoint/draft`.
  - Server evaluation via `POST /api/goal/workspace/checkpoint/evaluate` with bounded history (max 5).
  - Evidence-based plan suggestion reusing `calculateWorkspaceStudyPlan`.
  - *Selected*: Clean, isolated, authoritative, and strictly within Darshit's ownership boundary.

---

## 4. Decision Details

### 4.1 Data Model (`goal.state.studyWorkspace.continuation`)
```json
{
  "schemaVersion": 1,
  "status": "not_started | in_progress | completed | skipped",
  "checkpoint": {
    "checkpointId": "chk_foundations_v1",
    "status": "not_started | in_progress | completed | skipped",
    "draftAnswers": {},
    "draftSavedAt": null,
    "latestAttempt": null,
    "history": []
  },
  "suggestedPlan": {
    "previewId": null,
    "generatedAt": null,
    "sourceEvidence": null,
    "items": [],
    "weeklyCommitmentHours": 0,
    "accepted": false,
    "acceptedAt": null
  }
}
```

### 4.2 Checkpoint Definition (`chk_foundations_v1`)
Three bounded questions corresponding to foundational concepts:
1. `chk_q_arrays_01` (Topic: `topic_arrays`): Running profit candidate evaluation before minimum update.
2. `chk_q_hashing_01` (Topic: `topic_hashing`): Two Sum complement lookup before insertion.
3. `chk_q_bs_01` (Topic: `topic_binary_search`): Inclusive boundary shrinkage (`low = mid + 1`, `high = mid - 1`).

### 4.3 Evidence Categorization
- `ready_to_continue`: 3/3 correct answers without reference reveals.
- `revisit_recommended`: 1 or more questions incorrect or hint-assisted. Recommends specific lessons.
- `insufficient_evidence`: Fewer than 2 questions attempted.

### 4.4 Suggestion Generation Logic
When generating next-week suggestions:
1. **Revisits**: If any checkpoint topic has `revisitRecommended`, schedule its primary lesson (e.g. `les_binary_search_01`).
2. **Next Frontier**: Find the first uncompleted lesson in topological curriculum order whose prerequisites are met (e.g. `les_two_pointers_01`).
3. **Due Reviews**: Include any items due for spaced review today.
4. **Capacity Fitting**: Fit within user's weekly availability using `calculateWorkspaceStudyPlan`.

---

## 5. Consequences & Compliance

- **Positive**: Complete post-starter journey from celebration to checkpoint to next-week schedule.
- **Positive**: 100% friend-owned curriculum boundary preserved; zero edits to `server/data/curriculum/**`.
- **Positive**: Strict CAS and idempotency protections prevent race conditions and lost work.
- **Compliance**: Adheres to API-V1, SCHEDULER, and ARCHITECTURE specifications.
