# Scheduler specification and expected behaviour

## Inputs

Catalogue order is authoritative; each of the twelve missions is 30 minutes and depends on the previous mission except m01. Weekly availability keys mon...sun use 0/30/60/90 minutes. All date-only calculations use the calendar in Asia/Kolkata; do not round-trip date-only strings through the computer's local timezone. Store event timestamps as UTC ISO strings. Pure functions accept an injected `today` for tests; public endpoints derive today server-side.

## Initial schedule

1. Validate dates, track, and availability per API v1.
2. Iterate calendar dates starting at planStartDate.
3. For that weekday, available slots = floor(minutes / 30).
4. Place the next missions in catalogue order up to that capacity. Multiple missions on a date retain catalogue order.
5. Continue until all missions are scheduled, with a maximum horizon of 366 days. Reject an unschedulable input instead of hanging.
6. Estimated finish is the last scheduled mission date. `status=over_capacity` when it exceeds targetDate, otherwise on_track.
7. Flexible creation still retains the user's requested target and displays a warning if necessary. Only an explicitly accepted recovery may extend the target.

For this pilot all mission durations are estimates, all sessions are whole missions, and there is no automatic shortening or skipping to hit a deadline.

## Today and completion

The next incomplete mission is eligible only if its prerequisite is completed. Display its scheduled date. If it is overdue, say so calmly and offer recovery. If it is scheduled later or on a rest day, the user may voluntarily start early; do not require extra work on rest days. A “still working” action can leave the mission incomplete locally; only submitted completed practice creates an event. Missing/refused completion does not award XP.

## Recovery

1. Read current saved goal and expectedVersion.
2. Keep all completion objects unchanged, including their timestamps and reflections.
3. Keep schedule entries for completed missions unchanged.
4. Reschedule only incomplete missions in their original order from max(today, planStartDate), using the proposed availability. For today's date, subtract time already completed today (count actual completedAt local dates, not old schedule dates); remaining capacity = max(0, new daily minutes - completed-today minutes). Do not schedule extra work today when the new limit is already consumed. Completed work on earlier days does not consume future capacity.
5. Remaining minutes = 30 × incomplete count. Count moved missions by comparing each incomplete mission's old and new dates.
6. Fixed deadline: retain target and show overflow work/late finish. Flexible: propose max(current target, new finish). Never bring the requested deadline earlier automatically.
7. Preview writes nothing. Apply recomputes, validates version and previewForDate, saves atomically, and returns the saved result.
8. When all missions are complete: return completed status, zero remaining minutes, no next mission. Recovery need not be offered by the UI; backend may return an unchanged meaningful preview with zero moved missions.

## Deterministic examples for tests

Use the synthetic date **Wednesday 2026-10-07**. These are fixtures, not a live time override.

| Input | Expected result |
|---|---|
| Start Oct 7; Mon/Wed/Fri 60; 12 missions | m01/m02 Oct 7, m03/m04 Oct 9, m05/m06 Oct 12, m07/m08 Oct 14, m09/m10 Oct 16, m11/m12 Oct 19 |
| Same start; Mon/Wed/Fri 30; 12 missions | Last mission Nov 2 |
| m01/m02 completed on Oct 7; recover Oct 7; Mon/Wed/Fri 30 | Keep their schedule/events; today's 30-minute capacity is already consumed; ten pending missions finish Oct 30 |
| Same recovery, fixed target Oct 19 | Target remains Oct 19; status over_capacity; pending missions are retained |
| Same recovery, flexible target Oct 19 | Proposed target Oct 30; Apply changes it only after approval |
| All weekdays zero | 422; no infinite loop |
| Minutes 15, -30, 120, or string '30' | 422 under this deliberately restricted UI contract |
| Complete m03 while m02 incomplete | 422 prerequisite error |
| Complete m01 twice | One event, 20 XP total, no second version increment |
| Preview after version changed | 409; reload before retry |
| Apply after crossing local midnight since preview | 409; fresh preview required |

## Display precision

Say “estimated finish of this starter track”, not “you will be placement ready”. Say “completed practice, self-reported”, not “verified mastery”. A heatmap shows actual event dates, not future plan dates or login dates. Rest days stay neutral. Defer streak arithmetic until core release passes; a heatmap and count are sufficient.
