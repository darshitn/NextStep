import { localDay } from './activity.js';

/**
 * Calculates day difference in Asia/Kolkata (IST) calendar days.
 */
export function dayDifferenceIST(dateA, dateB = new Date()) {
  const dayStrA = typeof dateA === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateA) ? dateA : localDay(dateA);
  const dayStrB = typeof dateB === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateB) ? dateB : localDay(dateB);
  if (!dayStrA || !dayStrB) return 0;
  const tA = Date.UTC(parseInt(dayStrA.slice(0, 4), 10), parseInt(dayStrA.slice(5, 7), 10) - 1, parseInt(dayStrA.slice(8, 10), 10));
  const tB = Date.UTC(parseInt(dayStrB.slice(0, 4), 10), parseInt(dayStrB.slice(5, 7), 10) - 1, parseInt(dayStrB.slice(8, 10), 10));
  return Math.round((tB - tA) / (24 * 60 * 60 * 1000));
}

/**
 * Focus session timer pure calculations.
 * Uses real end timestamps rather than decrementing ticks to survive background tab throttling.
 */
export function calculateRemainingSeconds(endTime, now = Date.now()) {
  if (!endTime) return 0;
  const remainingMs = endTime - now;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function startTimer({ durationMinutes, now = Date.now() }) {
  const mins = Math.max(1, durationMinutes || 25);
  const durationMs = mins * 60 * 1000;
  return {
    presetMinutes: mins,
    totalSeconds: mins * 60,
    endTime: now + durationMs,
    pausedRemainingSeconds: null,
    isRunning: true,
    isCompleted: false
  };
}

export function pauseTimer(timerState, now = Date.now()) {
  if (!timerState?.isRunning || !timerState.endTime) return timerState;
  const remaining = calculateRemainingSeconds(timerState.endTime, now);
  return {
    ...timerState,
    isRunning: false,
    endTime: null,
    pausedRemainingSeconds: remaining,
    isCompleted: remaining === 0
  };
}

export function resumeTimer(timerState, now = Date.now()) {
  if (!timerState || timerState.isRunning || timerState.pausedRemainingSeconds === null) {
    return timerState;
  }
  const remainingSeconds = timerState.pausedRemainingSeconds;
  if (remainingSeconds <= 0) {
    return {
      ...timerState,
      isRunning: false,
      endTime: null,
      pausedRemainingSeconds: 0,
      isCompleted: true
    };
  }
  return {
    ...timerState,
    isRunning: true,
    endTime: now + remainingSeconds * 1000,
    pausedRemainingSeconds: null,
    isCompleted: false
  };
}

export function resetTimer(presetMinutes = 25) {
  const mins = Math.max(1, presetMinutes);
  return {
    presetMinutes: mins,
    totalSeconds: mins * 60,
    endTime: null,
    pausedRemainingSeconds: mins * 60,
    isRunning: false,
    isCompleted: false
  };
}

export function formatTimerDisplay(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Derives aggregate stats for the workspace Insights view and Today summary.
 * Strictly ignores unknown mission IDs not present in the catalog.
 * Distinguishes recorded completions from estimated practice durations.
 */
export function deriveWorkspaceStats(goal, catalog) {
  if (!goal || !catalog || !Array.isArray(catalog.missions)) {
    return {
      totalCatalogMissions: 0,
      completedCount: 0,
      independentCount: 0,
      withHintCount: 0,
      activeDaysCount: 0,
      activeDays: [],
      estimatedRemainingMinutes: 0,
      latestReflections: []
    };
  }

  const catalogMissions = catalog.missions;
  const catalogMissionMap = new Map(catalogMissions.map(m => [m.id, m]));
  const completions = goal.completions || {};

  const validCompletedMissions = [];
  let independentCount = 0;
  let withHintCount = 0;
  const activeDaySet = new Set();
  const reflections = [];

  for (const [missionId, record] of Object.entries(completions)) {
    const catalogMission = catalogMissionMap.get(missionId);
    if (!catalogMission || !record) continue;

    validCompletedMissions.push(missionId);

    if (record.outcome === 'independent') {
      independentCount++;
    } else if (record.outcome === 'with_hint') {
      withHintCount++;
    }

    if (record.completedAt) {
      const day = localDay(record.completedAt);
      if (day) {
        activeDaySet.add(day);
      }
      if (typeof record.reflection === 'string' && record.reflection.trim()) {
        reflections.push({
          missionId,
          missionTitle: catalogMission.title,
          reflection: record.reflection.trim(),
          outcome: record.outcome,
          completedAt: record.completedAt,
          localDate: day
        });
      }
    }
  }

  // Sort reflections chronologically descending (most recent first)
  reflections.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const completedCount = validCompletedMissions.length;
  const remainingMissions = catalogMissions.filter(m => !completions[m.id]);
  const estimatedRemainingMinutes = remainingMissions.reduce((acc, m) => acc + (m.minutes || 30), 0);
  const activeDays = Array.from(activeDaySet).sort();

  return {
    totalCatalogMissions: catalogMissions.length,
    completedCount,
    independentCount,
    withHintCount,
    activeDaysCount: activeDays.length,
    activeDays,
    estimatedRemainingMinutes,
    latestReflections: reflections
  };
}

/**
 * Derives items for the Review Queue:
 * Priority order:
 * 1. Unresolved saved blockers on active/current mission
 * 2. Hint-assisted completed work (unassisted retry recommendation)
 * 3. Older completed work eligible for recall after >=3 IST calendar days
 * 4. Completed work with unresolved blockers
 * 5. Other resolved notes
 *
 * Rules:
 * - Excludes unknown catalog IDs
 * - Future missions not offered for review simply because of notes (only completed or current mission)
 * - Three days is a starter heuristic, not a validated mastery model
 * - Explains reason per item
 */
export function deriveReviewItems(goal, catalog, now = new Date()) {
  if (!goal || !catalog || !Array.isArray(catalog.missions)) {
    return { items: [], unresolvedCount: 0, totalCount: 0 };
  }

  const catalogMissionMap = new Map(catalog.missions.map(m => [m.id, m]));
  const learningRecords = goal.learning || {};
  const completions = goal.completions || {};
  const nextMissionId = goal.nextMissionId;
  const items = [];
  let unresolvedCount = 0;

  const processedMissionIds = new Set();

  // 1. Process learning records for eligible missions (current or completed only)
  for (const [missionId, rec] of Object.entries(learningRecords)) {
    const mission = catalogMissionMap.get(missionId);
    if (!mission || !rec) continue;

    const isCompleted = Boolean(completions[missionId]);
    const isCurrent = missionId === nextMissionId;

    // Future missions are NOT offered for review simply because of notes
    if (!isCompleted && !isCurrent) continue;

    const hasContent = Boolean(
      (rec.whereStuck && rec.whereStuck.trim()) ||
      (rec.whatTried && rec.whatTried.trim()) ||
      rec.assessment ||
      rec.category
    );

    if (!hasContent) continue;

    processedMissionIds.add(missionId);
    // Dismissal removes the suggestion; the notes library retains the record.
    if (rec.dismissed) continue;
    const isUnresolved = rec.selfReportedStatus !== 'ready_to_continue' && !rec.dismissed;
    if (isUnresolved) {
      unresolvedCount++;
    }

    const completion = completions[missionId] || null;
    const daysSince = completion?.completedAt ? dayDifferenceIST(completion.completedAt, now) : 0;

    let reason = '';
    if (!isCompleted && isUnresolved) {
      reason = 'Unresolved difficulty recorded on your current mission.';
    } else if (isCompleted && isUnresolved) {
      reason = 'Saved blocker still marked unsure from earlier practice.';
    } else if (isCompleted && completion?.outcome === 'with_hint') {
      reason = 'Completed with a hint — suggested for unassisted retrieval practice.';
    } else if (isCompleted && daysSince >= 3) {
      reason = `Completed ${daysSince} days ago — suggested for recall practice (3-day starter interval heuristic).`;
    } else {
      reason = 'Saved practice notes available to revisit.';
    }

    items.push({
      id: `learning-${missionId}`,
      type: 'blocker',
      missionId,
      mission,
      category: rec.category || 'too_difficult',
      whatTried: rec.whatTried || null,
      whereStuck: rec.whereStuck || null,
      selfReportedStatus: rec.selfReportedStatus || 'still_unsure',
      dismissed: Boolean(rec.dismissed),
      assessment: rec.assessment || null,
      guidance: rec.guidance || null,
      isCompleted,
      isCurrent,
      outcome: completion?.outcome || null,
      reflection: completion?.reflection || null,
      completedAt: completion?.completedAt || null,
      daysSinceIST: daysSince,
      reason,
      scheduledDate: goal.schedule?.find(s => s.missionId === missionId)?.date || null
    });
  }

  // 2. Process completed missions without learning records:
  // - Hint-assisted completions
  // - Older completions (>= 3 IST days)
  for (const [missionId, comp] of Object.entries(completions)) {
    const mission = catalogMissionMap.get(missionId);
    if (!mission || !comp || processedMissionIds.has(missionId)) continue;

    const daysSince = comp.completedAt ? dayDifferenceIST(comp.completedAt, now) : 0;
    const isHint = comp.outcome === 'with_hint';
    const isSpaced = daysSince >= 3;

    if (isHint) {
      items.push({
        id: `hint-${missionId}`,
        type: 'hint_review',
        missionId,
        mission,
        category: 'completed_with_hint',
        whatTried: null,
        whereStuck: null,
        selfReportedStatus: 'completed_with_hint',
        dismissed: false,
        assessment: null,
        guidance: null,
        outcome: comp.outcome,
        reflection: comp.reflection || null,
        completedAt: comp.completedAt,
        daysSinceIST: daysSince,
        isCompleted: true,
        isCurrent: false,
        reason: 'Completed with a hint — suggested for unassisted retrieval practice.',
        scheduledDate: null
      });
    } else if (isSpaced) {
      items.push({
        id: `recall-${missionId}`,
        type: 'recall',
        missionId,
        mission,
        category: 'spaced_recall',
        whatTried: null,
        whereStuck: null,
        selfReportedStatus: 'ready_to_continue',
        dismissed: false,
        assessment: null,
        guidance: null,
        outcome: comp.outcome,
        reflection: comp.reflection || null,
        completedAt: comp.completedAt,
        daysSinceIST: daysSince,
        isCompleted: true,
        isCurrent: false,
        reason: `Completed ${daysSince} days ago — suggested for recall practice (3-day starter interval heuristic).`,
        scheduledDate: null
      });
    }
  }

  // Sort queue by priority:
  items.sort((a, b) => {
    const scoreA = getReviewPriorityScore(a);
    const scoreB = getReviewPriorityScore(b);
    return scoreA - scoreB;
  });

  return {
    items,
    unresolvedCount,
    totalCount: items.length
  };
}

function getReviewPriorityScore(item) {
  if (item.dismissed) return 60;
  // 1. Unresolved uncompleted blocker on current mission
  if (!item.isCompleted && item.selfReportedStatus !== 'ready_to_continue') return 10;
  // 2. Hint-assisted completed mission
  if (item.outcome === 'with_hint' || item.type === 'hint_review') return 20;
  // 3. Older completed mission (>=3 days)
  if (item.type === 'recall' || (item.isCompleted && item.daysSinceIST >= 3)) return 30;
  // 4. Completed mission with unresolved blocker
  if (item.isCompleted && item.selfReportedStatus !== 'ready_to_continue') return 40;
  // 5. Other uncompleted notes
  if (!item.isCompleted) return 45;
  // 6. Other resolved
  return 50;
}

/**
 * Derives all saved practice notes and reflections for the Notes Library.
 */
export function deriveNotesLibrary(goal, catalog) {
  if (!goal || !catalog || !Array.isArray(catalog.missions)) return [];

  const catalogMissionMap = new Map(catalog.missions.map(m => [m.id, m]));
  const learningRecords = goal.learning || {};
  const completions = goal.completions || {};
  const nextMissionId = goal.nextMissionId;
  const notes = [];

  for (const mission of catalog.missions) {
    const rec = learningRecords[mission.id];
    const comp = completions[mission.id];

    const hasLearning = Boolean(
      rec && ((rec.whereStuck && rec.whereStuck.trim()) ||
        (rec.whatTried && rec.whatTried.trim()) ||
        rec.assessment ||
        rec.category)
    );
    const hasReflection = Boolean(comp && comp.reflection && comp.reflection.trim());

    if (!hasLearning && !hasReflection) continue;

    const isCompleted = Boolean(comp);
    const isCurrent = mission.id === nextMissionId;

    notes.push({
      id: `note-${mission.id}`,
      missionId: mission.id,
      missionTitle: mission.title,
      mission,
      isCompleted,
      isCurrent,
      status: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming',
      category: rec?.category || (comp?.outcome === 'with_hint' ? 'with_hint' : 'general'),
      whatTried: rec?.whatTried || null,
      whereStuck: rec?.whereStuck || null,
      selfReportedStatus: rec?.selfReportedStatus || null,
      assessment: rec?.assessment || null,
      outcome: comp?.outcome || null,
      reflection: comp?.reflection || null,
      completedAt: comp?.completedAt || null,
      localDate: comp?.completedAt ? localDay(comp.completedAt) : null
    });
  }

  // Sort notes: current first, then completed by most recent date, then others
  notes.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    if (a.completedAt && b.completedAt) {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    }
    return a.missionId.localeCompare(b.missionId);
  });

  return notes;
}

/**
 * Searches the notes library by keyword across mission title, ID, whatTried, whereStuck, reflection.
 */
export function filterNotesLibrary(notes = [], query = '') {
  const q = (query || '').trim().toLowerCase();
  if (!q) return notes;

  return notes.filter(n => {
    const matchId = n.missionId.toLowerCase().includes(q);
    const matchTitle = (n.missionTitle || '').toLowerCase().includes(q);
    const matchTried = (n.whatTried || '').toLowerCase().includes(q);
    const matchStuck = (n.whereStuck || '').toLowerCase().includes(q);
    const matchReflection = (n.reflection || '').toLowerCase().includes(q);
    const matchCategory = (n.category || '').toLowerCase().includes(q);

    return matchId || matchTitle || matchTried || matchStuck || matchReflection || matchCategory;
  });
}

/**
 * Filter and search missions for Roadmap view.
 */
export function filterMissions(missions = [], { query = '', filter = 'all', nextMissionId = null, completions = {} } = {}) {
  const normalizedQuery = (query || '').trim().toLowerCase();

  return missions.filter(mission => {
    const isCompleted = Boolean(completions[mission.id]);
    const isNext = mission.id === nextMissionId;

    if (filter === 'completed' && !isCompleted) return false;
    if (filter === 'next' && !isNext) return false;
    if (filter === 'upcoming' && (isCompleted || isNext)) return false;

    if (normalizedQuery) {
      const matchId = mission.id.toLowerCase().includes(normalizedQuery);
      const matchTitle = (mission.title || '').toLowerCase().includes(normalizedQuery);
      const matchWhy = (mission.why || '').toLowerCase().includes(normalizedQuery);
      const matchDoneWhen = (mission.doneWhen || '').toLowerCase().includes(normalizedQuery);
      const matchSteps = Array.isArray(mission.steps) && mission.steps.some(step =>
        (step || '').toLowerCase().includes(normalizedQuery)
      );

      if (!matchId && !matchTitle && !matchWhy && !matchDoneWhen && !matchSteps) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Derives small upcoming missions list for Today context rail.
 */
export function deriveUpcomingMissions(goal, catalog, limit = 3) {
  if (!goal || !catalog || !Array.isArray(catalog.missions)) return [];
  const completions = goal.completions || {};
  const nextMissionId = goal.nextMissionId;
  const scheduleMap = new Map((goal.schedule || []).map(s => [s.missionId, s.date]));

  const upcoming = [];
  for (const mission of catalog.missions) {
    if (completions[mission.id]) continue;
    if (mission.id === nextMissionId) continue;

    upcoming.push({
      ...mission,
      scheduledDate: scheduleMap.get(mission.id) || null
    });

    if (upcoming.length >= limit) break;
  }

  return upcoming;
}

/**
 * Builds a clean, sanitized JSON export of the user's current goal and catalogue track identity.
 * Contains NO session tokens, secrets, other users, or global storage data.
 */
export function buildGoalExportData(goal, catalog, now = new Date()) {
  if (!goal) return null;

  const exportTimestamp = now instanceof Date ? now.toISOString() : new Date(now).toISOString();

  return {
    exportNotice: 'NextStep self-reported practice snapshot. Curriculum durations are estimates; completion outcomes are self-reported.',
    exportedAt: exportTimestamp,
    track: {
      trackId: catalog?.trackId || goal.trackId || 'dsa-starter-v1',
      title: catalog?.title || 'DSA foundations starter',
      notice: catalog?.notice || 'Synthetic pilot catalogue. Durations are estimates; completion is self-reported practice.'
    },
    goal: {
      id: goal.id,
      goalName: goal.goalName || 'Build my DSA foundations',
      trackId: goal.trackId,
      status: goal.status,
      version: goal.version,
      targetDate: goal.targetDate,
      planStartDate: goal.planStartDate,
      availability: goal.availability,
      schedule: goal.schedule,
      completions: goal.completions,
      learning: goal.learning,
      xp: goal.xp,
      level: goal.level,
      remainingMinutes: goal.remainingMinutes,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    }
  };
}
