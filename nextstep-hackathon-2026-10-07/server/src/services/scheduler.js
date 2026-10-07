/**
 * NextStep Deterministic Scheduler Service
 * Conforms to contracts/SCHEDULER.md and contracts/API-V1.md.
 * Pure scheduling logic uses Asia/Kolkata timezone calculations.
 */

export function getTodayKolkata() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDayOfWeek(dateStr) {
  const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const d = new Date(dateStr + 'T12:00:00Z');
  return names[d.getUTCDay()];
}

/**
 * Calculates schedule for a list of missions starting from startDate.
 * Injected startDate and completedTodayMinutes allow deterministic test fixtures.
 */
export function calculateSchedule(startDate, availability, missionIds, completedTodayMinutes = 0) {
  const schedule = [];
  let cursor = startDate;
  let missionIdx = 0;
  let loopGuard = 0;

  while (missionIdx < missionIds.length && loopGuard < 366) {
    const weekday = getDayOfWeek(cursor);
    let dailyMinutes = availability[weekday] || 0;
    if (cursor === startDate && completedTodayMinutes > 0) {
      dailyMinutes = Math.max(0, dailyMinutes - completedTodayMinutes);
    }
    const slots = Math.floor(dailyMinutes / 30);

    for (let s = 0; s < slots && missionIdx < missionIds.length; s++) {
      schedule.push({
        missionId: missionIds[missionIdx],
        date: cursor
      });
      missionIdx++;
    }

    cursor = addDays(cursor, 1);
    loopGuard++;
  }

  if (missionIdx < missionIds.length) {
    const err = new Error('Workload cannot fit within the 366-day planning horizon.');
    err.status = 422;
    err.code = 'UNSCHEDULABLE';
    throw err;
  }

  return schedule;
}

/**
 * Derives dynamic stats (XP, level, remainingMinutes, status, nextMissionId, estimatedFinishDate)
 * from saved completion state and catalog.
 */
export function deriveGoalStats(rawGoal, catalog) {
  const missions = catalog.missions;
  const completions = rawGoal.completions || {};
  const completedIds = Object.keys(completions);
  const xp = 20 * completedIds.length;
  const level = Math.floor(xp / 100) + 1;
  const remainingMinutes = 30 * (missions.length - completedIds.length);
  const nextMission = missions.find(m => !completions[m.id]);
  const nextMissionId = nextMission ? nextMission.id : null;

  let estimatedFinishDate = rawGoal.schedule.length > 0 ? rawGoal.schedule[rawGoal.schedule.length - 1].date : rawGoal.targetDate;
  if (completedIds.length === missions.length) {
    const sorted = Object.values(completions).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    estimatedFinishDate = sorted[0]?.completedAt.slice(0, 10) || rawGoal.planStartDate;
  }

  const isOverCapacity = estimatedFinishDate > rawGoal.targetDate;
  const status = completedIds.length === missions.length
    ? 'completed'
    : (isOverCapacity ? 'over_capacity' : 'on_track');

  return {
    ...rawGoal,
    xp,
    level,
    remainingMinutes,
    nextMissionId,
    estimatedFinishDate,
    status
  };
}
