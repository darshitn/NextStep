# Weekly execution milestone

Scope: a navigable seven-day curriculum execution view, missed allocations, start actions and explicit preview/accept replanning of remaining work. Reuse the existing authenticated continuation planner, CAS/token binding and completion derivation. No new server endpoints, schema, dependencies, AI generation or production-data operations.

Acceptance:
1. Week is reachable via desktop navigation, mobile More and Today; direct URL and reload work.
2. Rolling seven-day view uses Asia/Kolkata dates. Show overdue allocations and later spillover separately; count unique pending activities and scheduled minutes honestly. Existing completion/revisit evidence determines status. No invented time tracking or auto-completion.
3. Lesson/exercise/practice actions open the correct existing workspace. Starting only navigates.
4. Replan remaining opens existing capacity editor seeded with pending activities/revisit flags and accepted availability. Cancel and preview leave goal/history unchanged; acceptance alone persists a replacement curriculum plan. Starter schedule/completions remain unchanged. Explain that unfinished split activities are scheduled at full estimated effort, since per-part time is not tracked.
5. Empty/all-done/zero-capacity states are useful. All views fit 320/390/1024/1440 widths, including a large review badge. Existing themes/reduced-motion behavior is preserved.

Stages: 1 contract/data inspection; 2 bounded UI implementation; 3 integrated browser and release gate. Stop after a tested local deliverable. No commit/push/deploy in this milestone. Non-blocking new ideas stay in the backlog.

Final status: **3 complete, 0 active, 0 remaining** for this local milestone. See `docs/WEEKLY-EXECUTION-RESULT.md` for actual verification and limitations.
