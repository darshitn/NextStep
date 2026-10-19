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

  const todayIST = localDay(now);
  const processedMissionIds = new Set();

  // 1. Process learning records for eligible missions (current or completed only)
  for (const [missionId, rec] of Object.entries(learningRecords)) {
    const mission = catalogMissionMap.get(missionId);
    if (!mission || !rec) continue;

    const isCompleted = Boolean(completions[missionId]);
    const isCurrent = missionId === nextMissionId;

    // Future missions are NOT offered for review simply because of notes
    if (!isCompleted && !isCurrent) continue;

    const recallHistory = Array.isArray(rec.recallHistory) ? rec.recallHistory : [];
    const latestRecall = recallHistory.length > 0 ? recallHistory[recallHistory.length - 1] : null;

    const hasBlocker = Boolean(
      (rec.whereStuck && rec.whereStuck.trim()) ||
      (rec.whatTried && rec.whatTried.trim()) ||
      rec.assessment ||
      rec.category
    );

    const isUnresolved = rec.selfReportedStatus !== 'ready_to_continue' && !rec.dismissed && hasBlocker;
    if (isUnresolved) {
      unresolvedCount++;
    }

    // Dismissal removes the suggestion; the notes library retains the record.
    if (rec.dismissed) {
      processedMissionIds.add(missionId);
      continue;
    }

    const completion = completions[missionId] || null;
    const daysSince = completion?.completedAt ? dayDifferenceIST(completion.completedAt, now) : 0;

    let isRecallDue = false;
    let isRecallFuture = false;
    if (latestRecall?.nextReviewDate) {
      if (latestRecall.nextReviewDate <= todayIST) {
        isRecallDue = true;
      } else {
        isRecallFuture = true;
      }
    }

    // A future due date suppresses the old hint/age-only repeated suggestion.
    // However, never hide an unresolved blocker just because its next review is later.
    if (isRecallFuture && !isUnresolved) {
      processedMissionIds.add(missionId);
      continue;
    }

    let reason = '';
    let itemType = 'blocker';

    if (isRecallDue) {
      itemType = 'recall_due';
      reason = `Recall review scheduled for ${latestRecall.nextReviewDate} is due (based on your confidence rating).`;
    } else if (!isCompleted && isUnresolved) {
      itemType = 'blocker';
      reason = 'Unresolved difficulty recorded on your current mission.';
    } else if (isCompleted && isUnresolved) {
      itemType = 'blocker';
      reason = 'Saved blocker still marked unsure from earlier practice.';
    } else if (isCompleted && completion?.outcome === 'with_hint') {
      itemType = 'hint_review';
      reason = 'Completed with a hint — suggested for unassisted retrieval practice.';
    } else if (isCompleted && daysSince >= 3) {
      itemType = 'recall';
      reason = `Completed ${daysSince} days ago — suggested for recall practice (3-day starter interval heuristic).`;
    } else if (hasBlocker) {
      itemType = 'blocker';
      reason = 'Saved practice notes available to revisit.';
    } else {
      processedMissionIds.add(missionId);
      continue;
    }

    processedMissionIds.add(missionId);

    items.push({
      id: `learning-${missionId}`,
      type: itemType,
      missionId,
      mission,
      category: rec.category || (isRecallDue ? 'recall_due' : 'too_difficult'),
      whatTried: rec.whatTried || null,
      whereStuck: rec.whereStuck || null,
      selfReportedStatus: rec.selfReportedStatus || 'still_unsure',
      dismissed: Boolean(rec.dismissed),
      assessment: rec.assessment || null,
      guidance: rec.guidance || null,
      recallHistory,
      latestRecall,
      nextReviewDate: latestRecall?.nextReviewDate || null,
      isRecallDue,
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
        recallHistory: [],
        latestRecall: null,
        nextReviewDate: null,
        isRecallDue: false,
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
        recallHistory: [],
        latestRecall: null,
        nextReviewDate: null,
        isRecallDue: false,
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
  if (item.dismissed) return 70;
  // 1. Unresolved uncompleted blocker on current mission
  if (!item.isCompleted && item.selfReportedStatus !== 'ready_to_continue') return 10;
  // 2. Recall due today or overdue
  if (item.type === 'recall_due' || item.isRecallDue) return 15;
  // 3. Hint-assisted completed mission
  if (item.outcome === 'with_hint' || item.type === 'hint_review') return 20;
  // 4. Completed mission with unresolved blocker
  if (item.isCompleted && item.selfReportedStatus !== 'ready_to_continue') return 30;
  // 5. Older completed mission (>=3 days)
  if (item.type === 'recall' || (item.isCompleted && item.daysSinceIST >= 3)) return 40;
  // 6. Other notes
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
    const hasRecall = Boolean(rec && Array.isArray(rec.recallHistory) && rec.recallHistory.length > 0);

    if (!hasLearning && !hasReflection && !hasRecall) continue;

    const isCompleted = Boolean(comp);
    const isCurrent = mission.id === nextMissionId;
    const recallHistory = Array.isArray(rec?.recallHistory) ? rec.recallHistory : [];
    const latestRecall = recallHistory.length > 0 ? recallHistory[recallHistory.length - 1] : null;

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
      recallHistory,
      latestRecall,
      nextReviewDate: latestRecall?.nextReviewDate || null,
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
 * Searches the notes library by keyword across mission title, ID, whatTried, whereStuck, reflection, and recall attempts.
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
    const matchRecall = Array.isArray(n.recallHistory) && n.recallHistory.some(a =>
      (a.attemptText || '').toLowerCase().includes(q)
    );

    return matchId || matchTitle || matchTried || matchStuck || matchReflection || matchCategory || matchRecall;
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
      studyWorkspace: goal.studyWorkspace || null,
      xp: goal.xp,
      level: goal.level,
      remainingMinutes: goal.remainingMinutes,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    }
  };
}

/**
 * Derives topic-level progress, prerequisite readiness, and evidence summary for Atlas.
 */
export function deriveTopicAtlasModel(goal, catalog, now = new Date()) {
  const curriculum = catalog?.curriculum;
  if (!curriculum || !Array.isArray(curriculum.topics)) {
    return {
      topics: [],
      prerequisiteEdges: [],
      completedTopicsCount: 0,
      completedLessonsCount: 0,
      totalLessonsCount: 0,
      completedExercisesCount: 0,
      totalExercisesCount: 0,
      solvedPracticeCount: 0,
      totalPracticeCount: 0
    };
  }

  const ws = goal?.studyWorkspace || {};
  const lessonProgress = ws.lessonProgress || {};
  const exerciseAttempts = ws.exerciseAttempts || {};
  const practiceAttempts = ws.practiceAttempts || {};
  const todayIST = localDay(now);

  const lessonsByTopic = new Map();
  for (const lesson of curriculum.lessons || []) {
    if (!lessonsByTopic.has(lesson.topicId)) lessonsByTopic.set(lesson.topicId, []);
    lessonsByTopic.get(lesson.topicId).push(lesson);
  }

  const exercisesByTopic = new Map();
  for (const ex of curriculum.exercises || []) {
    if (!exercisesByTopic.has(ex.topicId)) exercisesByTopic.set(ex.topicId, []);
    exercisesByTopic.get(ex.topicId).push(ex);
  }

  const practiceByTopic = new Map();
  for (const prac of curriculum.practiceProblems || []) {
    if (!practiceByTopic.has(prac.topicId)) practiceByTopic.set(prac.topicId, []);
    practiceByTopic.get(prac.topicId).push(prac);
  }

  const topicCompletionMap = new Map();
  for (const topic of curriculum.topics) {
    const topicLessons = lessonsByTopic.get(topic.id) || [];
    const completedLessons = topicLessons.filter((l) => lessonProgress[l.id]?.status === 'completed');
    topicCompletionMap.set(topic.id, topicLessons.length > 0 && completedLessons.length === topicLessons.length);
  }

  const topicTitleMap = new Map(curriculum.topics.map((t) => [t.id, t.title]));

  let totalCompletedLessons = 0;
  let totalCompletedExercises = 0;
  let totalSolvedPractice = 0;

  const enrichedTopics = curriculum.topics.map((topic) => {
    const topicLessons = (lessonsByTopic.get(topic.id) || []).sort((a, b) => a.order - b.order);
    const topicExercises = exercisesByTopic.get(topic.id) || [];
    const topicPractice = practiceByTopic.get(topic.id) || [];

    const completedLessons = topicLessons.filter((l) => lessonProgress[l.id]?.status === 'completed');
    const inProgressLessons = topicLessons.filter((l) => lessonProgress[l.id]?.status === 'in_progress');
    totalCompletedLessons += completedLessons.length;

    const completedExercises = topicExercises.filter(
      (ex) => Array.isArray(exerciseAttempts[ex.id]) && exerciseAttempts[ex.id].length > 0
    );
    totalCompletedExercises += completedExercises.length;

    const solvedPractice = topicPractice.filter((p) => {
      const list = practiceAttempts[p.id];
      return Array.isArray(list) && list.some((a) => a.outcome === 'solved_independently' || a.outcome === 'with_hint');
    });
    totalSolvedPractice += solvedPractice.length;

    let dueReviewCount = 0;
    for (const ex of topicExercises) {
      const list = exerciseAttempts[ex.id];
      const latest = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
      if (latest && (latest.nextReviewDate <= todayIST || latest.outcome !== 'independent')) {
        dueReviewCount += 1;
      }
    }
    for (const p of topicPractice) {
      const list = practiceAttempts[p.id];
      const latest = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
      if (latest && (latest.needsReview || latest.nextReviewDate <= todayIST)) {
        dueReviewCount += 1;
      }
    }

    const missingPrerequisites = (topic.prerequisites || [])
      .filter((prereqId) => !topicCompletionMap.get(prereqId))
      .map((prereqId) => ({
        id: prereqId,
        title: topicTitleMap.get(prereqId) || prereqId
      }));

    const prerequisitesMet = missingPrerequisites.length === 0;

    let status = 'not_started';
    if (topicLessons.length > 0 && completedLessons.length === topicLessons.length) {
      status = dueReviewCount > 0 ? 'needs_review' : 'completed';
    } else if (
      completedLessons.length > 0 ||
      inProgressLessons.length > 0 ||
      completedExercises.length > 0 ||
      solvedPractice.length > 0
    ) {
      status = dueReviewCount > 0 ? 'needs_review' : 'in_progress';
    }

    const nextLesson =
      inProgressLessons[0] ||
      topicLessons.find((l) => lessonProgress[l.id]?.status !== 'completed') ||
      topicLessons[0] ||
      null;

    return {
      ...topic,
      status,
      prerequisitesMet,
      missingPrerequisites,
      lessons: topicLessons,
      exercises: topicExercises,
      practiceProblems: topicPractice,
      completedLessonsCount: completedLessons.length,
      totalLessonsCount: topicLessons.length,
      completedExercisesCount: completedExercises.length,
      totalExercisesCount: topicExercises.length,
      solvedPracticeCount: solvedPractice.length,
      totalPracticeCount: topicPractice.length,
      dueReviewCount,
      nextLesson
    };
  });

  return {
    topics: enrichedTopics,
    topicMap: Object.fromEntries(enrichedTopics.map((t) => [t.id, t])),
    prerequisiteEdges: curriculum.prerequisiteEdges || [],
    sources: curriculum.sources || [],
    completedTopicsCount: enrichedTopics.filter((t) => t.status === 'completed').length,
    completedLessonsCount: totalCompletedLessons,
    totalLessonsCount: (curriculum.lessons || []).length,
    completedExercisesCount: totalCompletedExercises,
    totalExercisesCount: (curriculum.exercises || []).length,
    solvedPracticeCount: totalSolvedPractice,
    totalPracticeCount: (curriculum.practiceProblems || []).length
  };
}

/**
 * Derives workspace review items from Proof exercise attempts, external practice logs,
 * and lesson reflections so Review connects directly with Atlas + Proof evidence.
 */
export function deriveWorkspaceReviewQueue(goal, catalog, now = new Date()) {
  const curriculum = catalog?.curriculum;
  if (!curriculum) return [];

  const ws = goal?.studyWorkspace || {};
  const exerciseAttempts = ws.exerciseAttempts || {};
  const practiceAttempts = ws.practiceAttempts || {};
  const todayIST = localDay(now);

  const exerciseById = new Map((curriculum.exercises || []).map((e) => [e.id, e]));
  const lessonById = new Map((curriculum.lessons || []).map((l) => [l.id, l]));
  const practiceById = new Map((curriculum.practiceProblems || []).map((p) => [p.id, p]));
  const topicById = new Map((curriculum.topics || []).map((t) => [t.id, t]));

  const queue = [];

  for (const [exerciseId, attempts] of Object.entries(exerciseAttempts)) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || !Array.isArray(attempts) || attempts.length === 0) continue;
    const latest = attempts[attempts.length - 1];
    const isDue = Boolean(latest.nextReviewDate && latest.nextReviewDate <= todayIST);
    const usedSupport = latest.outcome !== 'independent' || latest.mistakeCount > 0;
    if (!isDue && !usedSupport) continue;

    const topic = topicById.get(exercise.topicId);
    const lesson = lessonById.get(exercise.lessonId);
    let reason = '';
    if (isDue) {
      reason = `Proof trace review due (${latest.nextReviewDate}) after ${
        latest.outcome === 'needed_reference'
          ? 'revealing the reference invariant'
          : latest.outcome === 'with_hint'
          ? 'using a trace hint'
          : 'completing the trace'
      }.`;
    } else {
      reason = `Completed Proof trace with ${
        latest.outcome === 'needed_reference'
          ? 'reference reveal'
          : latest.outcome === 'with_hint'
          ? 'a hint'
          : `${latest.mistakeCount} step retry`
      } — recommended for unassisted trace verification.`;
    }

    queue.push({
      id: `ws-ex-${exerciseId}`,
      kind: 'exercise',
      itemType: 'exercise',
      itemId: exerciseId,
      exerciseId,
      lessonId: exercise.lessonId,
      topicId: exercise.topicId,
      topicTitle: topic?.title || exercise.topicId,
      title: exercise.title,
      lessonTitle: lesson?.title || exercise.lessonId,
      outcome: latest.outcome,
      mistakeCount: latest.mistakeCount,
      reflection: latest.reflection,
      savedAt: latest.savedAt,
      nextReviewDate: latest.nextReviewDate,
      isDue,
      attemptCount: attempts.length,
      attemptsCount: attempts.length,
      reason
    });
  }

  for (const [problemId, attempts] of Object.entries(practiceAttempts)) {
    const problem = practiceById.get(problemId);
    if (!problem || !Array.isArray(attempts) || attempts.length === 0) continue;
    const latest = attempts[attempts.length - 1];
    const isDue = Boolean(latest.nextReviewDate && latest.nextReviewDate <= todayIST);
    const flagged = Boolean(
      latest.needsReview || latest.outcome === 'with_hint' || latest.outcome === 'reviewed_editorial'
    );
    if (!isDue && !flagged) continue;

    const topic = topicById.get(problem.topicId);
    const linkedLessonId = problem.lessonIds?.[0] || null;
    let reason = '';
    if (latest.needsReview) {
      reason = `Flagged for review in your external practice log${isDue ? ` (due ${latest.nextReviewDate})` : ''}.`;
    } else if (isDue) {
      reason = `External practice review scheduled for ${latest.nextReviewDate} is due.`;
    } else {
      reason = `Self-reported as "${latest.outcome.replace(/_/g, ' ')}" — suggested for independent retry.`;
    }

    queue.push({
      id: `ws-prac-${problemId}`,
      kind: 'practice',
      itemType: 'practice',
      itemId: problemId,
      problemId,
      lessonId: linkedLessonId,
      topicId: problem.topicId,
      topicTitle: topic?.title || problem.topicId,
      title: problem.title,
      provider: problem.provider,
      url: problem.url,
      difficulty: problem.difficulty,
      outcome: latest.outcome,
      note: latest.note,
      needsReview: latest.needsReview,
      savedAt: latest.savedAt,
      nextReviewDate: latest.nextReviewDate,
      isDue,
      attemptCount: attempts.length,
      attemptsCount: attempts.length,
      reason
    });
  }

  queue.sort((a, b) => {
    if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
    return (a.nextReviewDate || '').localeCompare(b.nextReviewDate || '');
  });

  return queue;
}

/**
 * Produces an explainable next-action recommendation for Today and Atlas.
 */
export function deriveExplainableRecommendation(goal, catalog, now = new Date()) {
  const curriculum = catalog?.curriculum;
  if (!curriculum || !Array.isArray(curriculum.lessons) || curriculum.lessons.length === 0) {
    return null;
  }

  const ws = goal?.studyWorkspace || {};
  const lessonProgress = ws.lessonProgress || {};
  const todayIST = localDay(now);
  const topicById = new Map((curriculum.topics || []).map((t) => [t.id, t]));
  const lessonById = new Map((curriculum.lessons || []).map((l) => [l.id, l]));

  // 1. Check due workspace review items first
  const reviewQueue = deriveWorkspaceReviewQueue(goal, catalog, now);
  const dueReview = reviewQueue.find((r) => r.isDue);
  if (dueReview) {
    const lesson = lessonById.get(dueReview.lessonId) || curriculum.lessons[0];
    return {
      kind: dueReview.itemType === 'exercise' ? 'review_exercise' : 'review_practice',
      title: dueReview.title,
      topicId: dueReview.topicId,
      topicTitle: dueReview.topicTitle,
      lessonId: lesson?.id || 'les_arrays_01',
      exerciseId: dueReview.itemType === 'exercise' ? dueReview.itemId : lesson?.exerciseId || null,
      problemId: dueReview.itemType === 'practice' ? dueReview.itemId : null,
      estimatedMinutes: 15,
      badge: 'Review Due Today',
      reason: dueReview.reason
    };
  }

  // 2. Check active study plan sessions for today
  const studyPlan = ws.studyPlan;
  if (studyPlan && Array.isArray(studyPlan.sessions)) {
    const todaySession = studyPlan.sessions.find((s) => {
      if (s.date > todayIST) return false;
      if (s.itemType === 'lesson') {
        return lessonProgress[s.itemId]?.status !== 'completed';
      }
      return true;
    });
    if (todaySession) {
      const topic = topicById.get(todaySession.topicId);
      const lesson =
        todaySession.itemType === 'lesson'
          ? lessonById.get(todaySession.itemId)
          : curriculum.lessons.find((l) => l.topicId === todaySession.topicId) || curriculum.lessons[0];
      return {
        kind: 'planned_session',
        title: todaySession.title,
        topicId: todaySession.topicId,
        topicTitle: topic?.title || 'Curriculum Plan',
        lessonId: lesson?.id || 'les_arrays_01',
        exerciseId: todaySession.itemType === 'exercise' ? todaySession.itemId : lesson?.exerciseId || null,
        problemId: todaySession.itemType === 'practice' ? todaySession.itemId : null,
        estimatedMinutes: todaySession.allocatedMinutes,
        badge:
          todaySession.totalParts > 1
            ? `Planned Today (Part ${todaySession.partIndex}/${todaySession.totalParts})`
            : 'Planned Today',
        reason: `Scheduled for ${todaySession.date} in your capacity-aware study plan (${todaySession.allocatedMinutes}m allocated).`
      };
    }
  }

  // 3. Check in-progress lesson
  for (const lesson of curriculum.lessons) {
    const prog = lessonProgress[lesson.id];
    if (prog && prog.status === 'in_progress') {
      const topic = topicById.get(lesson.topicId);
      return {
        kind: 'in_progress_lesson',
        title: lesson.title,
        topicId: lesson.topicId,
        topicTitle: topic?.title || lesson.topicId,
        lessonId: lesson.id,
        exerciseId: lesson.exerciseId,
        problemId: lesson.recommendedPracticeIds?.[0] || null,
        estimatedMinutes: lesson.estimatedMinutes,
        badge: 'Resume In-Progress Lesson',
        reason: `You started "${lesson.title}" recently — finish its worked trace and knowledge check to lock in the invariant.`
      };
    }
  }

  // 4. First uncompleted lesson in topic order whose prerequisites are met
  for (const lesson of curriculum.lessons) {
    const prog = lessonProgress[lesson.id];
    if (prog?.status === 'completed') continue;
    const prereqsMet = (lesson.prerequisites || []).every((pid) => lessonProgress[pid]?.status === 'completed');
    if (prereqsMet) {
      const topic = topicById.get(lesson.topicId);
      return {
        kind: 'next_unlocked_lesson',
        title: lesson.title,
        topicId: lesson.topicId,
        topicTitle: topic?.title || lesson.topicId,
        lessonId: lesson.id,
        exerciseId: lesson.exerciseId,
        problemId: lesson.recommendedPracticeIds?.[0] || null,
        estimatedMinutes: lesson.estimatedMinutes,
        badge: 'Next Unlocked Lesson',
        reason:
          lesson.prerequisites.length > 0
            ? `Unlocked because you completed prerequisite lesson ${lesson.prerequisites.join(', ')}.`
            : `Recommended starting point in ${topic?.title || 'your topic path'} with zero unmet prerequisites.`
      };
    }
  }

  const fallback = curriculum.lessons[0];
  return {
    kind: 'revision_lesson',
    title: fallback.title,
    topicId: fallback.topicId,
    topicTitle: topicById.get(fallback.topicId)?.title || fallback.topicId,
    lessonId: fallback.id,
    exerciseId: fallback.exerciseId,
    problemId: fallback.recommendedPracticeIds?.[0] || null,
    estimatedMinutes: fallback.estimatedMinutes,
    badge: 'All Lessons Completed · Revision',
    reason: 'You have completed every published lesson! Revisit interactive Proof traces with alternate inputs.'
  };
}

/**
 * Filter external practice problems by search query, topic, difficulty, and attempt status.
 */
export function filterPracticeProblems(
  problems = [],
  { query = '', topicId = 'all', difficulty = 'all', statusFilter = 'all', practiceAttempts = {} } = {}
) {
  const q = (query || '').trim().toLowerCase();

  return problems.filter((p) => {
    if (topicId !== 'all' && p.topicId !== topicId) return false;
    if (difficulty !== 'all' && (p.difficulty || '').toLowerCase() !== String(difficulty).toLowerCase()) return false;

    const attempts = Array.isArray(practiceAttempts[p.id]) ? practiceAttempts[p.id] : [];
    const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    if (statusFilter === 'solved' && (!latest || (latest.outcome !== 'solved_independently' && latest.outcome !== 'with_hint'))) {
      return false;
    }
    if (statusFilter === 'needs_review' && (!latest || !latest.needsReview)) {
      return false;
    }
    if (statusFilter === 'unattempted' && latest) {
      return false;
    }

    if (q) {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchPattern = (p.pattern || '').toLowerCase().includes(q);
      const matchWhy = (p.whyRecommended || '').toLowerCase().includes(q);
      const matchEdge = (p.keyEdgeCase || '').toLowerCase().includes(q);
      const matchId = (p.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchPattern && !matchWhy && !matchEdge && !matchId) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Derives the active/pending study plan session from actual workspace progress.
 * Does not merely return sessions[0] - inspects lessonProgress, exerciseAttempts,
 * and practiceAttempts to find the next incomplete session, respecting multi-part
 * sessions and intentional revisits.
 */
export function deriveActiveStudyPlanSession(studyWorkspace) {
  const studyPlan = studyWorkspace?.studyPlan;
  if (!studyPlan || !Array.isArray(studyPlan.sessions) || studyPlan.sessions.length === 0) {
    return {
      activeSession: null,
      activeSessionIndex: -1,
      allCompleted: false,
      totalSessions: 0,
      completedSessions: 0
    };
  }

  const lessonProgress = studyWorkspace.lessonProgress || {};
  const exerciseAttempts = studyWorkspace.exerciseAttempts || {};
  const practiceAttempts = studyWorkspace.practiceAttempts || {};
  const acceptedAt = studyWorkspace.continuation?.suggestedPlan?.acceptedAt
    ? new Date(studyWorkspace.continuation.suggestedPlan.acceptedAt).getTime()
    : null;

  let activeSession = null;
  let activeSessionIndex = -1;
  let completedSessions = 0;

  for (let idx = 0; idx < studyPlan.sessions.length; idx++) {
    const session = studyPlan.sessions[idx];
    let isSessionCompleted = false;

    if (session.isRevisit) {
      if (session.itemType === 'lesson') {
        const lp = lessonProgress[session.itemId];
        if (lp && lp.status === 'completed') {
          const completedTimestamp = lp.updatedAt || lp.lastVisitedAt || lp.completedAt;
          if (!acceptedAt || (completedTimestamp && new Date(completedTimestamp).getTime() >= acceptedAt)) {
            isSessionCompleted = true;
          }
        }
      } else if (session.itemType === 'exercise') {
        const raw = exerciseAttempts[session.itemId];
        const attempts = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const successfulRevisit = attempts.find((a) => {
          const isSuccess =
            (a.outcome === 'independent' ||
              a.outcome === 'with_hint' ||
              a.outcome === 'needed_reference' ||
              a.outcome === 'correct' ||
              a.status === 'passed' ||
              a.passed === true) &&
            a.status !== 'failed' &&
            a.passed !== false;
          if (!isSuccess) return false;
          const attemptTime = a.savedAt || a.completedAt || a.updatedAt;
          return !acceptedAt || (attemptTime && new Date(attemptTime).getTime() >= acceptedAt);
        });
        if (successfulRevisit) {
          isSessionCompleted = true;
        }
      } else if (session.itemType === 'practice') {
        const raw = practiceAttempts[session.itemId];
        const attempts = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const successfulRevisit = attempts.find((a) => {
          const isSolved =
            (a.outcome === 'solved_independently' ||
              a.outcome === 'with_hint' ||
              a.status === 'passed') &&
            a.status !== 'failed' &&
            a.outcome !== 'bookmarked' &&
            a.outcome !== 'reviewed_editorial';
          if (!isSolved) return false;
          const attemptTime = a.savedAt || a.completedAt || a.updatedAt;
          return !acceptedAt || (attemptTime && new Date(attemptTime).getTime() >= acceptedAt);
        });
        if (successfulRevisit) {
          isSessionCompleted = true;
        }
      }
    } else {
      if (session.itemType === 'lesson') {
        const lp = lessonProgress[session.itemId];
        if (lp && (lp.status === 'completed' || Boolean(lp.completedAt))) {
          isSessionCompleted = true;
        }
      } else if (session.itemType === 'exercise') {
        const raw = exerciseAttempts[session.itemId];
        const attempts = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const isSuccess = attempts.some(
          (a) =>
            (a.outcome === 'independent' ||
              a.outcome === 'with_hint' ||
              a.outcome === 'needed_reference' ||
              a.outcome === 'correct' ||
              a.status === 'passed' ||
              a.passed === true ||
              Boolean(a.completedAt)) &&
            a.status !== 'failed' &&
            a.passed !== false
        );
        if (isSuccess) {
          isSessionCompleted = true;
        }
      } else if (session.itemType === 'practice') {
        const raw = practiceAttempts[session.itemId];
        const attempts = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const isSolved = attempts.some(
          (a) =>
            (a.outcome === 'solved_independently' ||
              a.outcome === 'with_hint' ||
              a.status === 'passed' ||
              Boolean(a.completedAt)) &&
            a.status !== 'failed' &&
            a.outcome !== 'bookmarked' &&
            a.outcome !== 'reviewed_editorial'
        );
        if (isSolved) {
          isSessionCompleted = true;
        }
      }
    }

    if (isSessionCompleted) {
      completedSessions++;
    } else if (!activeSession) {
      activeSession = session;
      activeSessionIndex = idx;
    }
  }

  const allCompleted = completedSessions === studyPlan.sessions.length && studyPlan.sessions.length > 0;

  return {
    activeSession,
    activeSessionIndex,
    allCompleted,
    totalSessions: studyPlan.sessions.length,
    completedSessions
  };
}
