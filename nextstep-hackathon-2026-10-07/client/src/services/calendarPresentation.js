import { activityByDay, dayPlan, localDay } from './activity.js';

// A completion on its scheduled date appears once. Different planned/actual dates
// remain visible on their respective days, without altering the saved schedule.
export function calendarDayRows(goal, missions, day) {
  const completed = activityByDay(goal, missions)[day] || [];
  const completedHere = new Set(completed.map(mission => mission.id));
  const scheduled = dayPlan(goal, missions, day).filter(mission => !completedHere.has(mission.id)).map(mission => ({
    ...mission,
    completedOn: goal.completions?.[mission.id] ? localDay(goal.completions[mission.id].completedAt) : null
  }));
  return { scheduled, completed };
}
