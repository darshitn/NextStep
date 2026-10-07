# NextStep — DSA Learning Loop Demo Guide
**Presenter:** Harshitha | **Duration:** ~3 Minutes | **Product:** NextStep DSA Foundations Track (`dsa-starter-v1`)

---

## 1. Executive Summary & Narrative Hook

> **The Problem:** When self-paced engineering students get stuck on DSA problems, they often face two extremes: complete solutions dumped prematurely (eliminating active learning) or getting stuck without targeted mental-model checks. When returning days later, students forget what they already tried and abandon their schedule.
>
> **The NextStep Solution:** A bounded four-stage **DSA Learning Loop**:
> 1. **Explain my blocker:** Explicitly capture what was tried and where the student is stuck (saved deliberately to user storage, not per keystroke).
> 2. **Interactive Tracing & Curated Understanding Check:** Step through concrete array/set operations interactively (`[2, 5, 2]`), then check reasoning against server-authoritative rubrics evaluated with Gemini coaching feedback (coaching answers never complete missions, never award XP, and never alter schedules).
> 3. **Remember my difficulty:** A compact Resume Practice Card on the dashboard keeps context alive after refresh or re-login.
> 4. **Deterministic Schedule Recovery:** When college exams or commitments reduce study hours, students adapt their weekly calendar with pure arithmetic—preserving completed missions and notes without hallucinations.

*Note on demonstration mode:* This demo uses the synthetic student persona "Ananya" on an isolated account. In environments where external AI API configuration is not connected, the app provides honest feedback banners without fabricating mock completions.

---

## 2. Character Persona: Ananya's Journey

- **Student:** Ananya, 2nd-year CS undergraduate preparing for technical interviews.
- **Current Track:** DSA Foundations Starter (`dsa-starter-v1`: 12 missions, 30 minutes each).
- **Current Standing:** Completed prerequisites:
  - `m01`: *"Map your starting point"* (30 min) — Completed
  - `m02`: *"Trace array lookups"* (30 min) — Completed
  - `m03`: *"Attempt Contains Duplicate"* (30 min) — Completed
- **Active Next Step:** **Mission 4: "Explain the duplicate check"** (`m04`).
- **The Hurdle:** She understands hash sets conceptually, but struggles to trace boundary conditions and duplicate detection steps on `[2, 5, 2]`.

---

## 3. Step-by-Step 3-Minute Demo Script

### Minute 1: Active Mission & Interactive Duplicate Trace (60s)

1. **Dashboard Entry:**
   - Harshitha shows the dashboard with `m04` highlighted as the active next step:
     *"Mission 4: Explain the duplicate check"*.
   - Point out the primary action button: click **"Start practising"**. The practice panel opens and auto-scrolls into focus.

2. **Interactive Duplicate Trace (Mission 4 Exclusive):**
   - Direct attention to the **Interactive Exercise: Duplicate Check Trace**:
     *"NextStep guides Ananya to verify set lookups before inserting new elements into the seen set."*
   - Target array: `[2, 5, 2]`. Index 0 (`value = 2`), current seen set is empty (`Ø`).
   - Click **"No, not seen yet"** → Value 2 is added to seen set `{2}`. Index advances to 1 (`value = 5`).
   - **Deliberate Mistake Demo:**
     - Index 1 (`value = 5`). Current seen set has `{2}`.
     - Harshitha deliberately clicks **"Yes, already seen"**.
     - Point out the corrective feedback: *"Value 5 is not in {2}. Try again!"*
     - Emphasize to judges: *"The state does not corrupt or skip forward. Ananya gets immediate corrective feedback and retries."*
   - Click the correct prediction: **"No, not seen yet"** → Value 5 is added to seen set `{2, 5}`. Index advances to 2 (`value = 2`).
   - Index 2 (`value = 2`). Seen set has `{2, 5}`.
   - Click **"Yes, already seen"** → The duplicate is identified: *"Duplicate 2 detected at index 2! Seen set was {2, 5} immediately before this check."*
   - Click **"Proceed to Curated Reasoning Check"** to smoothly transition to the conceptual check.

---

### Minute 2: Explain Blocker & Check Reasoning with Gemini (60s)

1. **Capture Blocker Context:**
   - Select difficulty category: **"Too Difficult"** (*"Stuck on concepts or cannot figure out where to begin"*).
   - In **"What have you tried?"**, enter:
     > `Iterated through the array and inserted elements into a hash set.`
   - In **"Where are you stuck?"**, enter:
     > `I was confused about the exact set contents right before the duplicate is found.`
   - Click **"Save my notes"**.
   - Notice the status announcement: *"Blocker context saved. Retained after refresh."*
   - *(Optional Draft Protection showcase)*: If Ananya types new text and tries to close with the `✕` button, an alert prompts: *"Save and close / Keep editing / Discard changes"* so uncommitted thoughts are never accidentally destroyed.

2. **The Curated Reasoning Check:**
   - Review the question:
     > *"Given the array `[2, 5, 2]`, trace what elements are in the set immediately before index 2 is examined, and explain why index 2 triggers duplicate detection."*
   - Point out the neutral placeholder: *"Explain your reasoning and when the algorithm stops."* (no answers leaked).
   - Enter Ananya's reasoning:
     > `Before index 2, the set contains {2, 5}. When index 2 (value 2) is examined, it is already present in the set, triggering the duplicate condition and returning true immediately.`
   - Click **"Check my reasoning"** (or **"Help me get unstuck"** if requesting Socratic hints).
   - The button shows *"Evaluating with Gemini..."*.

3. **Highlight the Coaching Feedback:**
   - The response badge displays: **`On track`**.
   - Read the coach feedback and recommended next step.
   - **Crucial Distinction for Judges:** *"Notice that submitting this answer did NOT mark the mission complete, did NOT award 20 XP, and did NOT advance the roadmap. AI feedback is a diagnostic coach, not a surrogate for student mastery. Active completion remains in the student's hands via 'Record completion'."*

---

### Minute 3: Resume Card & Schedule Recovery (60s)

1. **Simulate Session Break (Page Refresh):**
   - Hit **Browser Refresh** (`F5` or `Ctrl+R`) to demonstrate session persistence.
   - **Point to the Top of the Dashboard:**
     - The **Resume Practice Card** is prominently displayed above the progress breakdown.
     - Card shows: *Saved blocker notes · Active step: Explain the duplicate check*.
     - Shows saved note snippet: *"Where you got stuck: 'I was confused about the exact set contents...'"*.
     - Shows latest assessment status: *Latest reasoning check: On track*.
     - Shows student-facing action button: **"Continue practising"**.
     - Click **"Continue practising"**: the practice panel immediately opens with Ananya's saved notes and previous assessment restored without triggering duplicate AI billing or API roundtrips!

2. **Deterministic Schedule Recovery:**
   - Scenario: *"Ananya's exam timetable was announced. Her available study time on weekdays drops from 60 minutes to 30 minutes."*
   - Click **"Adjust study time"** on the card (or **"Adjust my week"** in the top navigation).
   - Lower Monday, Wednesday, Friday availability from 60 to 30 minutes.
   - Click **"Preview recovery"**.
   - Show the comparison: estimated finish date adjusts cleanly while preserving completed missions (`m01`–`m03`) and saved blocker notes.
   - Click **"Apply recovery plan"**.
   - Return to the Dashboard: the schedule is updated, progress is intact, and `m04` notes remain preserved.

---

## 4. Live Demo Clicks & Controls Cheatsheet

| Step | Action / Control | Expected Result |
| :--- | :--- | :--- |
| **1. Open Practice** | Click **"Start practising"** on `m04` card | Practice panel opens and receives focus |
| **2. Duplicate Trace** | `[2, 5, 2]`: Click **"No, not seen yet"** | Value 2 enters set `{2}`, index advances to 1 |
| **3. Trace Error** | Click **"Yes, already seen"** on value 5 | Corrective feedback: *"Value 5 is not in {2}. Try again!"* |
| **4. Complete Trace** | Click **"No"** then **"Yes"** at index 2 | Duplicate detected banner; click **"Proceed to Curated Reasoning Check"** |
| **5. Save Blocker** | Fill inputs → Click **"Save my notes"** | Status badge: *"Blocker context saved. Retained after refresh."* |
| **6. Check Reasoning** | Type explanation → Click **"Check my reasoning"** | AI assessment badge (`On track`), coach explanation, next step |
| **7. Draft Safeguard** | Type in textarea → Click `✕` (Close) | Dialog: *"Save and close"*, *"Keep editing"*, *"Discard changes"* |
| **8. Refresh** | Press `F5` / Reload page | **Resume Practice Card** appears at top of dashboard |
| **9. Resume** | Click **"Continue practising"** | Reopens panel with notes and assessment preserved |
| **10. Recovery** | Click **"Adjust study time"** → Preview → Apply | Schedule recalculated deterministically; completion history preserved |

---

## 5. Live AI Failure Contingency Plan

If network latency spikes, the Gemini API key is unconfigured, or rate limits occur during the live presentation:

1. **What NextStep shows:**
   - NextStep does **not** crash or silently fabricate a fake response.
   - A clear banner appears: *"AI service is currently unavailable. Your notes and answers are preserved."*
2. **What to say to the judges:**
   > *"Notice how the application handles external AI unreliability gracefully and honestly. It doesn't fail silently or pretend offline text came from a live model. Ananya's notes and answer were preserved in the form without data loss, allowing an immediate retry once connectivity returns."*
3. **Fallback action:**
   - Ananya can toggle her self-reported status as *"Ready to continue"* or *"Still unsure"*.
   - She can record mission completion via the dedicated **"Record completion"** modal when ready.

---

## 6. Key Differentiation Points for Judges

1. **Active Learning over Solution Dumps:** Guides students through interactive mental-model tracing (`[2, 5, 2]`) instead of regurgitating complete algorithms.
2. **Server-Authoritative Rubrics:** Curated questions (`m02`, `m04`, `m06`) are verified against server rubrics rather than unbounded open-ended prompts.
3. **Strict Separation of Coaching vs Credentialing:** AI feedback never inflates XP, marks missions complete, or alters the user's study schedule.
4. **Persistent Session Memory:** Blocker notes and assessment status survive page refreshes and re-logins without repetitive LLM calls.
5. **Deterministic Schedule Adaptation:** Zero hallucinations in calendar planning; pure deterministic math preserves student trust when life happens.
