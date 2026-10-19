import { localDay, shiftDay } from './activity.js';
import { deriveActiveStudyPlanSession } from './workspace.js';

export function deriveWeeklyExecution(goal, now = new Date(), offset = 0) {
  const today = localDay(now);
  const start = shiftDay(today, Math.max(-52, Math.min(52, offset)) * 7);
  const end = shiftDay(start, 6);
  const workspace = goal?.studyWorkspace || {};
  const plan = workspace.studyPlan;
  const availability = plan?.availability || goal?.availability || {};
  const completion = new Map();
  const sessions = (plan?.sessions || []).map((session, index) => {
    const key = `${session.itemType}:${session.itemId}:${Boolean(session.isRevisit)}`;
    if (!completion.has(key)) {
      completion.set(key, deriveActiveStudyPlanSession({ ...workspace, studyPlan: { ...plan, sessions: [session] } }).allCompleted);
    }
    return { ...session, key: `${key}:${index}`, completed: completion.get(key), missed: !completion.get(key) && session.date < today };
  });
  const pending = sessions.filter(session => !session.completed);
  const unscheduled = plan?.unscheduledItemIds || [];
  const pendingItemIds = [...new Set([...pending.map(session => session.itemId), ...unscheduled])];
  const unscheduledReviews = unscheduled.filter(itemId => {
    const itemType = itemId.startsWith('les_') ? 'lesson' : itemId.startsWith('ex_') ? 'exercise' : 'practice';
    return plan?.revisitItemIds?.includes(itemId) || deriveActiveStudyPlanSession({ ...workspace, studyPlan: { ...plan, sessions: [{ itemId, itemType }] } }).allCompleted;
  });
  const revisitItemIds = [...new Set([...pending.filter(session => session.isRevisit).map(session => session.itemId), ...unscheduledReviews])];
  const missed = pending.filter(session => session.missed);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDay(start, index);
    const weekday = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toLowerCase();
    const items = sessions.filter(session => session.date === date);
    return { date, isToday: date === today, sessions: items, capacity: Number(availability[weekday]) || 0, allocated: items.reduce((sum, session) => sum + (Number(session.allocatedMinutes) || 0), 0) };
  });
  return {
    today, start, end, days, sessions, missed, pendingItemIds, revisitItemIds, availability,
    hasPlan: Boolean(plan),
    allCompleted: sessions.length > 0 && pendingItemIds.length === 0,
    pendingActivities: pendingItemIds.length,
    completedActivities: new Set(sessions.filter(session => session.completed).map(session => session.itemId)).size,
    weekMinutes: days.reduce((sum, day) => sum + day.allocated, 0),
    spillover: sessions.filter(session => session.date > end && !session.completed),
    unscheduled
  };
}
