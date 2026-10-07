export function localDay(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shiftDay(day, amount) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function mondayOf(day) {
  return shiftDay(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function readableDay(day, options = {}) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC', ...options }).format(new Date(`${day}T12:00:00Z`));
}
export function activityByDay(goal, missions) {
  const days = {};
  for (const mission of missions) {
    const completion = goal.completions?.[mission.id];
    if (!completion?.completedAt) continue;
    const day = localDay(completion.completedAt);
    if (day) (days[day] ||= []).push({ ...mission, completion });
  }
  return days;
}
export function dayPlan(goal, missions, day) {
  const ids = new Set((goal.schedule || []).filter(s => s.date === day).map(s => s.missionId));
  return missions.filter(m => ids.has(m.id));
}
