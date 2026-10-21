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

  let adaptiveReinforcements = [];
  try {
    const res = deriveAdaptiveReinforcement(goal, catalog, now);
    adaptiveReinforcements = Array.isArray(res?.items) ? res.items : [];
  } catch (err) {
    adaptiveReinforcements = [];
  }

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

    // Distinct verified traces and split outcomes
    const verifiedExercises = topicExercises.filter(
      (ex) => Array.isArray(exerciseAttempts[ex.id]) && exerciseAttempts[ex.id].length > 0
    );
    const distinctTracesVerifiedCount = verifiedExercises.length;
    const independentTracesCount = verifiedExercises.filter((ex) =>
      exerciseAttempts[ex.id].some((a) => a.outcome === 'independent')
    ).length;
    const supportedTracesCount = verifiedExercises.filter(
      (ex) => !exerciseAttempts[ex.id].some((a) => a.outcome === 'independent')
    ).length;
    totalCompletedExercises += distinctTracesVerifiedCount;

    // External practice problems logged (self-reported)
    const externalPracticeLogged = topicPractice.filter(
      (p) => Array.isArray(practiceAttempts[p.id]) && practiceAttempts[p.id].length > 0
    );
    const externalPracticeCount = externalPracticeLogged.length;

    const solvedPractice = topicPractice.filter((p) => {
      const list = practiceAttempts[p.id];
      return Array.isArray(list) && list.some((a) => a.outcome === 'solved_independently' || a.outcome === 'with_hint');
    });
    totalSolvedPractice += solvedPractice.length;

    // Due reviews
    const dueReviews = [];
    for (const ex of topicExercises) {
      const list = exerciseAttempts[ex.id];
      const latest = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
      if (latest && (latest.nextReviewDate <= todayIST || latest.outcome !== 'independent')) {
        dueReviews.push({
          id: ex.id,
          title: ex.title,
          type: 'exercise',
          reason: latest.nextReviewDate <= todayIST
            ? `Recall review due (${latest.nextReviewDate})`
            : 'Completed with assistance — unassisted retry recommended',
          exerciseId: ex.id,
          lessonId: ex.lessonId
        });
      }
    }
    for (const p of topicPractice) {
      const list = practiceAttempts[p.id];
      const latest = Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null;
      if (latest && (latest.needsReview || (latest.nextReviewDate && latest.nextReviewDate <= todayIST))) {
        dueReviews.push({
          id: p.id,
          title: p.title,
          type: 'practice',
          reason: latest.needsReview ? 'Self-reported review flag' : `Recall review due (${latest.nextReviewDate})`,
          practiceId: p.id
        });
      }
    }

    // Unresolved reinforcement signals
    const topicReinforcements = adaptiveReinforcements.filter((r) => r.topicId === topic.id);
    const unresolvedSignalCount = topicReinforcements.length;
    const dueReviewCount = dueReviews.length;

    const missingPrerequisites = (topic.prerequisites || [])
      .filter((prereqId) => !topicCompletionMap.get(prereqId))
      .map((prereqId) => ({
        id: prereqId,
        title: topicTitleMap.get(prereqId) || prereqId
      }));

    const prerequisitesMet = missingPrerequisites.length === 0;

    // Descriptive states (Not started, Learning, Practise again, Recent evidence)
    let status = 'not_started';
    let statusLabel = 'Not started';
    let statusExplanation = '';

    if (dueReviewCount > 0 || unresolvedSignalCount > 0) {
      status = 'practise_again';
      statusLabel = 'Practise again';
      const parts = [];
      if (dueReviewCount > 0) {
        parts.push(`${dueReviewCount} due recall ${dueReviewCount === 1 ? 'review' : 'reviews'}`);
      }
      if (unresolvedSignalCount > 0) {
        parts.push(`${unresolvedSignalCount} unresolved reinforcement ${unresolvedSignalCount === 1 ? 'signal' : 'signals'}`);
      }
      statusExplanation = `${parts.join(' and ')} require unassisted practice.`;
    } else if (topicLessons.length > 0 && completedLessons.length === topicLessons.length) {
      status = 'recent_evidence';
      statusLabel = 'Recent evidence';
      statusExplanation = 'All published lessons completed with no pending reviews or unresolved blockers.';
    } else if (
      completedLessons.length > 0 ||
      inProgressLessons.length > 0 ||
      distinctTracesVerifiedCount > 0 ||
      externalPracticeCount > 0
    ) {
      status = 'learning';
      statusLabel = 'Learning';
      statusExplanation = 'Lessons in progress; prerequisites active.';
    } else {
      status = 'not_started';
      statusLabel = 'Not started';
      statusExplanation = prerequisitesMet
        ? 'Prerequisites met — ready to start first lesson.'
        : `Waiting on prerequisite topic: ${missingPrerequisites.map((p) => p.title).join(', ')}.`;
    }

    const nextLesson =
      inProgressLessons[0] ||
      topicLessons.find((l) => lessonProgress[l.id]?.status !== 'completed') ||
      topicLessons[0] ||
      null;

    let actionableTarget = null;
    if (topicReinforcements.length > 0) {
      const r = topicReinforcements[0];
      actionableTarget = {
        type: 'reinforcement',
        title: r.title || r.targetTitle || r.sourceTitle,
        reason: r.reason,
        lessonId: r.lessonId || r.sourceLessonId || r.sourceItem?.id,
        exerciseId: r.exerciseId || r.sourceExerciseId,
        practiceId: r.problemId,
        actionableRoute: r.targetType === 'exercise' ? 'proof_exercise' : r.targetType === 'practice' ? 'practice_problem' : 'proof_lesson'
      };
    } else if (dueReviews.length > 0) {
      const dr = dueReviews[0];
      actionableTarget = {
        type: dr.type,
        title: dr.title,
        reason: dr.reason,
        lessonId: dr.lessonId,
        exerciseId: dr.exerciseId,
        practiceId: dr.practiceId,
        actionableRoute: dr.type === 'practice' ? 'practice_problem' : 'proof_exercise'
      };
    } else if (nextLesson) {
      actionableTarget = {
        type: 'lesson',
        title: nextLesson.title,
        reason: 'Next lesson in topic progression',
        lessonId: nextLesson.id,
        exerciseId: nextLesson.exerciseId,
        actionableRoute: 'proof_lesson'
      };
    }

    return {
      ...topic,
      status,
      statusLabel,
      statusExplanation,
      isCompleted: status === 'recent_evidence',
      isNeedsReview: status === 'practise_again',
      isInProgress: status === 'learning',
      isNotStarted: status === 'not_started',
      prerequisitesMet,
      missingPrerequisites,
      lessons: topicLessons,
      exercises: topicExercises,
      practiceProblems: topicPractice,
      completedLessonsCount: completedLessons.length,
      totalLessonsCount: topicLessons.length,
      completedExercisesCount: distinctTracesVerifiedCount,
      totalExercisesCount: topicExercises.length,
      hasTraces: topicExercises.length > 0,
      distinctTracesVerifiedCount,
      independentTracesCount,
      supportedTracesCount,
      externalPracticeCount,
      solvedPracticeCount: solvedPractice.length,
      totalPracticeCount: topicPractice.length,
      isPracticeSelfReported: true,
      dueReviews,
      dueReviewCount,
      unresolvedReinforcements: topicReinforcements,
      unresolvedSignalCount,
      actionableTarget,
      nextLesson
    };
  });

  return {
    topics: enrichedTopics,
    topicMap: Object.fromEntries(enrichedTopics.map((t) => [t.id, t])),
    prerequisiteEdges: curriculum.prerequisiteEdges || [],
    sources: curriculum.sources || [],
    completedTopicsCount: enrichedTopics.filter((t) => t.status === 'recent_evidence' || t.status === 'completed').length,
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

  // 4. Check unresolved adaptive reinforcement struggles (e.g. needs_example, unsure, focus areas)
  const adaptive = deriveAdaptiveReinforcement(goal, catalog, now);
  const struggle = adaptive.unresolvedStruggles?.[0];
  if (struggle) {
    const topic = topicById.get(struggle.topicId);
    return {
      kind: 'adaptive_reinforcement',
      title: struggle.title,
      topicId: struggle.topicId,
      topicTitle: topic?.title || struggle.topicTitle,
      lessonId: struggle.lessonId,
      exerciseId: struggle.exerciseId,
      problemId: struggle.problemId,
      estimatedMinutes: struggle.estimatedMinutes,
      badge: struggle.badge,
      reason: struggle.reason,
      evidenceType: struggle.evidenceType,
      focusArea: struggle.focusArea,
      variantKey: struggle.variantKey,
      section: struggle.section
    };
  }

  // 5. First uncompleted lesson in topic order whose prerequisites are met
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

/**
 * Detects whether the student has recorded any formal curriculum learning activity
 * (lesson progress, exercise attempt, practice attempt, or continuation checkpoint).
 * Returns false for brand-new students or students who have only worked on the 12-mission Starter Track.
 */
export function hasRecordedCurriculumActivity(goal) {
  const ws = goal?.studyWorkspace;
  if (!ws) return false;

  const hasLessons = Object.values(ws.lessonProgress || {}).some(
    (lp) => lp && (lp.status === 'completed' || lp.status === 'in_progress' || Boolean(lp.completedAt))
  );
  if (hasLessons) return true;

  const hasExercises = Object.values(ws.exerciseAttempts || {}).some(
    (attempts) => Array.isArray(attempts) && attempts.length > 0
  );
  if (hasExercises) return true;

  const hasPractice = Object.values(ws.practiceAttempts || {}).some(
    (attempts) => Array.isArray(attempts) && attempts.length > 0
  );
  if (hasPractice) return true;

  if (
    ws.continuation?.checkpoint?.latestAttempt ||
    (Array.isArray(ws.continuation?.checkpoint?.attempts) && ws.continuation.checkpoint.attempts.length > 0)
  ) {
    return true;
  }

  return false;
}

// Match the prerequisite and completion rules used by the normal next-lesson recommendation.
export function deriveNextEligibleLesson(goal, catalog, currentLessonId) {
  const progress = goal?.studyWorkspace?.lessonProgress || {};
  return (catalog?.curriculum?.lessons || []).find((lesson) =>
    lesson.id !== currentLessonId && progress[lesson.id]?.status !== 'completed' &&
    (lesson.prerequisites || []).every((id) => progress[id]?.status === 'completed')
  ) || null;
}


export function deriveCandidateActivities(goal, catalog, initialPlan) {
  const candidates = [];
  const addedIds = new Set();
  const curriculum = catalog?.curriculum || (catalog?.lessons ? catalog : null);
  const lessons = curriculum?.lessons || [];
  const topics = curriculum?.topics || [];
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  const continuation = goal?.studyWorkspace?.continuation;
  const checkpoint = continuation?.checkpoint;
  const latestAttempt = checkpoint?.latestAttempt;

  // Replanning starts with the actual unfinished activities, not a fresh
  // recommendation that might silently replace the student's chosen work.
  for (const id of initialPlan?.itemIds || []) {
    const item = lessonById.get(id) || curriculum?.exercises?.find(item => item.id === id) || curriculum?.practiceProblems?.find(item => item.id === id);
    if (!item || addedIds.has(id)) continue;
    addedIds.add(id);
    const revisit = initialPlan.revisitItemIds?.includes(id);
    candidates.push({ id, title: item.title, topicId: item.topicId, topicTitle: topicById.get(item.topicId)?.title || item.topicId,
      type: revisit ? 'revisit' : 'planned', badge: revisit ? 'Planned Review' : 'Remaining Activity',
      reason: 'Carried forward from your current study plan; no completion has been recorded.', estimatedMinutes: item.estimatedMinutes || 20 });
  }

  // 1. Checkpoint revisits
  try {
    const res = deriveAdaptiveReinforcement(goal, catalog, new Date());
    const reinforcements = Array.isArray(res?.items) ? res.items : [];
    for (const r of reinforcements) {
      if (candidates.length >= 3) break;
      const targetId = r.targetId || r.exerciseId || r.lessonId || r.sourceLessonId || r.sourceItem?.id;
      if (targetId && !addedIds.has(targetId)) {
        addedIds.add(targetId);
        const item = lessonById.get(targetId) || curriculum?.exercises?.find((e) => e.id === targetId);
        const topic = topicById.get(r.topicId);
        candidates.push({
          id: targetId,
          title: r.title || r.targetTitle || item?.title || targetId,
          topicId: r.topicId,
          topicTitle: topic ? topic.title : r.topicId,
          type: 'revisit',
          badge: (r.activityType === 'exercise' || (targetId && targetId.startsWith('ex_')))
            ? 'Due Proof Review'
            : (targetId && targetId.startsWith('prac_'))
            ? 'Due Practice Review'
            : 'Targeted Reinforcement',
          reason: r.reason,
          estimatedMinutes: item?.estimatedMinutes || ((targetId && targetId.startsWith('ex_')) ? 15 : 20)
        });
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  if (latestAttempt?.topicResults) {
    for (const [topicId, tr] of Object.entries(latestAttempt.topicResults)) {
      if (tr.revisitRecommended && tr.recommendedAction?.lessonId && !addedIds.has(tr.recommendedAction.lessonId)) {
        const lid = tr.recommendedAction.lessonId;
        const lesson = lessonById.get(lid);
        const topic = topicById.get(topicId);
        addedIds.add(lid);
        candidates.push({
          id: lid,
          title: lesson ? lesson.title : lid,
          topicId,
          topicTitle: topic ? topic.title : topicId.replace('topic_', '').replace(/_/g, ' '),
          type: 'revisit',
          badge: 'Targeted Revisit',
          reason: `Foundations Checkpoint recommended revisit for ${topic ? topic.title : topicId}`,
          estimatedMinutes: lesson?.estimatedMinutes || 20
        });
      }
    }
  }

  // 2. Due reviews from workspace review queue (exercises and practice)
  if (curriculum) {
    try {
      const reviewQueue = deriveWorkspaceReviewQueue(goal, catalog?.curriculum ? catalog : { curriculum }, new Date());
      for (const item of reviewQueue) {
        if (!item.isDue) continue;
        if (candidates.length >= 3) break;
        if (!addedIds.has(item.itemId)) {
          addedIds.add(item.itemId);
          candidates.push({
            id: item.itemId,
            title: item.title,
            topicId: item.topicId,
            topicTitle: item.topicTitle,
            type: 'revisit',
            badge: item.kind === 'exercise' ? 'Due Proof Review' : 'Due Practice Review',
            reason: item.reason,
            estimatedMinutes: item.kind === 'exercise' ? 15 : 20
          });
        }
      }
    } catch (err) {
      console.warn('Could not derive review queue for continuation plan:', err);
    }
  }

  // 3. Next uncompleted curriculum lessons in prerequisite order
  const completedLessons = new Set(
    Object.entries(goal?.studyWorkspace?.lessonProgress || {})
      .filter(([k, lp]) => lp && (lp.status === 'completed' || lp.completedAt))
      .map(([k, lp]) => lp.lessonId || k)
  );

  const topicOrderMap = new Map(topics.map((t) => [t.id, t.order]));
  const sortedLessons = [...lessons].sort((a, b) => {
    const tA = topicOrderMap.get(a.topicId) ?? 99;
    const tB = topicOrderMap.get(b.topicId) ?? 99;
    if (tA !== tB) return tA - tB;
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });

  for (const lesson of sortedLessons) {
    if (!completedLessons.has(lesson.id) && !addedIds.has(lesson.id)) {
      const prereqsMet = (lesson.prerequisites || []).every(
        (p) => completedLessons.has(p) || addedIds.has(p)
      );
      if (prereqsMet) {
        addedIds.add(lesson.id);
        const topic = topicById.get(lesson.topicId);
        candidates.push({
          id: lesson.id,
          title: lesson.title,
          topicId: lesson.topicId,
          topicTitle: topic ? topic.title : lesson.topicId.replace('topic_', '').replace(/_/g, ' '),
          type: 'new_lesson',
          badge: 'Frontier Lesson',
          reason: `Eligible progression into ${topic ? topic.title : lesson.topicId}`,
          estimatedMinutes: lesson.estimatedMinutes || 20
        });
        const frontierCount = candidates.filter((c) => c.type === 'new_lesson').length;
        if (frontierCount >= 2 || candidates.length >= 5) break;
      }
    }
  }

  // 4. End-of-library / deliberate review: if all curriculum lessons completed, offer foundational mastery revisit
  if (candidates.length === 0) {
    if (lessons.length > 0) {
      const first = lessons[0];
      candidates.push({
        id: first.id,
        title: first.title,
        topicId: first.topicId,
        topicTitle: topicById.get(first.topicId)?.title || 'Arrays & Hashing',
        type: 'revisit',
        badge: 'Mastery Review',
        reason: 'Library complete: deliberate foundational invariant revisit to maintain mastery',
        estimatedMinutes: first.estimatedMinutes || 20
      });
    } else {
      candidates.push({
        id: 'les_arrays_01',
        title: 'Dynamic Array Allocation & Geometry',
        topicId: 'topic_arrays',
        topicTitle: 'Arrays & Hashing',
        type: 'revisit',
        badge: 'Mastery Review',
        reason: 'Library complete: deliberate foundational invariant revisit to maintain mastery',
        estimatedMinutes: 20
      });
    }
  }

  return candidates;
}

/**
 * Derives the single dominant primary activity for Today according to deterministic precedence:
 * 1. Explicit resumable activity, when actually recorded.
 * 2. Pending activity from an accepted weekly plan.
 * 3. Existing recommendation appropriate to the account state.
 */
export function deriveTodayPrimaryAction({
  goal,
  catalog,
  resumeContext = null,
  currentMission = null,
  scheduleMap = {},
  now = new Date()
}) {
  const curriculum = catalog?.curriculum;
  const lessons = curriculum?.lessons || [];
  const topics = curriculum?.topics || [];
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const ws = goal?.studyWorkspace || {};
  const lessonProgress = ws.lessonProgress || {};

  const missions = catalog?.missions || [];
  const completedMissionsCount = Object.keys(goal?.completions || {}).filter((id) =>
    missions.some((m) => m.id === id)
  ).length;
  const isStarterCompleted = missions.length > 0 && completedMissionsCount >= missions.length;

  // 1. Explicit Resumable Activity (when actually recorded)
  // Check curriculum in-progress lesson
  const inProgressLesson = lessons.find((l) => lessonProgress[l.id]?.status === 'in_progress');
  if (inProgressLesson) {
    const topic = topicById.get(inProgressLesson.topicId);
    return {
      type: 'resumable',
      heading: 'Continue learning',
      badge: 'In-Progress Lesson',
      title: inProgressLesson.title,
      subtitle: topic?.title || 'Learning path',
      estimatedMinutes: inProgressLesson.estimatedMinutes || 20,
      reason: 'Pick up where you left off. Finish its worked example and interactive trace to complete the lesson.',
      actionLabel: 'Continue lesson',
      actionTarget: {
        type: 'proof',
        topicId: inProgressLesson.topicId,
        lessonId: inProgressLesson.id,
        exerciseId: inProgressLesson.exerciseId,
        mode: 'trace'
      },
      source: 'curriculum'
    };
  }

  // Check starter mission with recorded resumeContext
  if (resumeContext && resumeContext.mission) {
    const m = resumeContext.mission;
    const isReady = resumeContext.record?.selfReportedStatus === 'ready_to_continue';
    return {
      type: 'resumable',
      heading: 'Continue learning',
      badge: 'In-Progress Practice',
      title: `${m.id.toUpperCase()} · ${m.title}`,
      subtitle: 'Starter track',
      estimatedMinutes: m.minutes || 30,
      reason: isReady
        ? 'You marked yourself ready to continue. Return to practice and record your completion.'
        : 'Pick up where you left off with your saved practice notes and guidance.',
      actionLabel: 'Resume practice',
      actionTarget: {
        type: 'mission',
        mission: m
      },
      source: 'starter'
    };
  }

  // 2. Pending Activity from an Accepted Weekly Plan
  const planState = deriveActiveStudyPlanSession(ws);
  if (planState.activeSession && !planState.allCompleted) {
    const s = planState.activeSession;
    const topic = topicById.get(s.topicId);
    const isExerciseOrLesson = s.itemType === 'exercise' || s.itemType === 'lesson';
    return {
      type: 'weekly_plan',
      heading: 'Start today’s activity',
      badge: s.isRevisit
        ? 'My week · Review'
        : (s.totalParts > 1 ? `My week · Part ${s.partIndex}/${s.totalParts}` : 'My week'),
      title: s.title,
      subtitle: topic?.title || (s.itemType === 'practice' ? 'Practice problem' : 'Curriculum session'),
      estimatedMinutes: s.allocatedMinutes,
      reason: `Scheduled for ${s.date} in your weekly study plan (${s.allocatedMinutes}m allocated).`,
      actionLabel: 'Start planned session',
      actionTarget: isExerciseOrLesson
        ? {
            type: 'proof',
            topicId: s.topicId,
            lessonId: s.itemId.startsWith('les_') ? s.itemId : undefined,
            exerciseId: s.itemId.startsWith('ex_') ? s.itemId : undefined
          }
        : {
            type: 'practice',
            problemId: s.itemId
          },
      source: 'plan',
      alternativeAction: currentMission ? {
        type: 'starter_mission',
        title: `${currentMission.id.toUpperCase()} · ${currentMission.title}`,
        subtitle: 'Starter track',
        estimatedMinutes: currentMission.minutes || 30,
        actionLabel: 'Switch to starter mission',
        actionTarget: { type: 'mission', mission: currentMission }
      } : undefined
    };
  }

  // If weekly plan exists and ALL completed
  if (planState.allCompleted && planState.totalSessions > 0) {
    return {
      type: 'weekly_plan_completed',
      heading: 'All planned sessions completed',
      badge: 'My week · Complete',
      title: 'Weekly Study Plan Finished',
      subtitle: `${planState.totalSessions} sessions completed`,
      estimatedMinutes: 0,
      reason: `You finished all ${planState.totalSessions} scheduled study sessions for this week. Plan your next progression or explore the curriculum.`,
      actionLabel: 'Plan next sessions',
      actionTarget: {
        type: 'continuation_plan'
      },
      source: 'plan',
      alternativeAction: {
        type: 'explore_atlas',
        title: 'Explore Learning path',
        subtitle: 'Curriculum map',
        actionLabel: 'Explore Learning path',
        actionTarget: { type: 'atlas' }
      }
    };
  }

  // 3. Existing Recommendation Appropriate to the Account State
  // Case A: Catalog unavailable
  if (!curriculum || !Array.isArray(lessons) || lessons.length === 0) {
    if (currentMission) {
      return {
        type: 'starter_mission',
        heading: 'Start today’s activity',
        badge: 'Starter track',
        title: `${currentMission.id.toUpperCase()} · ${currentMission.title}`,
        subtitle: 'DSA Foundations',
        estimatedMinutes: currentMission.minutes || 30,
        reason: 'Curriculum catalog is currently unavailable. Continue your daily starter mission.',
        actionLabel: 'Start daily mission',
        actionTarget: { type: 'mission', mission: currentMission },
        source: 'starter'
      };
    }
    return {
      type: 'catalog_unavailable',
      heading: 'Catalog unavailable',
      badge: 'Offline',
      title: 'Curriculum Not Available',
      subtitle: 'System',
      estimatedMinutes: 0,
      reason: 'Curriculum topics and lessons could not be loaded. Please refresh the page.',
      actionLabel: 'Refresh saved goal',
      actionTarget: { type: 'refresh' },
      source: 'none'
    };
  }

  // Case B: Completed 12/12 Starter Missions
  if (isStarterCompleted) {
    const checkpointAttempt = ws.continuation?.checkpoint?.latestAttempt;
    if (!checkpointAttempt) {
      return {
        type: 'checkpoint',
        heading: 'Start today’s activity',
        badge: 'Foundations Checkpoint',
        title: 'Check My Foundations',
        subtitle: '10-minute conceptual check',
        estimatedMinutes: 10,
        reason: 'Review the 12 starter foundations with 6 short questions to personalize your curriculum study plan.',
        actionLabel: 'Check My Foundations (10 min)',
        actionTarget: { type: 'checkpoint' },
        source: 'curriculum',
        alternativeAction: {
          type: 'explore_atlas',
          title: 'Explore Learning path',
          subtitle: 'Curriculum map',
          actionLabel: 'Explore Learning path',
          actionTarget: { type: 'atlas' }
        }
      };
    } else if (!ws.continuation?.suggestedPlan?.acceptedAt && !planState.hasPlan) {
      return {
        type: 'continuation_checkpoint_complete',
        heading: 'Continue learning',
        badge: 'Foundations Checkpoint Complete',
        title: 'Review Foundations Checkpoint & Plan Next Step',
        subtitle: 'Personalized curriculum roadmap',
        estimatedMinutes: 5,
        reason: 'Your checkpoint evaluation is recorded. Review your foundations checkpoint or build your weekly curriculum plan.',
        actionLabel: 'Review Foundations Checkpoint',
        actionTarget: { type: 'checkpoint' },
        source: 'curriculum',
        alternativeAction: {
          type: 'explore_atlas',
          title: 'Explore Learning path',
          subtitle: 'Curriculum map',
          actionLabel: 'Explore Learning path',
          actionTarget: { type: 'atlas' }
        }
      };
    }
  }

  // Case C: Standard Explainable Recommendation
  const rec = deriveExplainableRecommendation(goal, catalog, now);

  // Check if all curriculum lessons completed
  const allCurriculumCompleted = lessons.length > 0 && lessons.every((l) => lessonProgress[l.id]?.status === 'completed');
  if (allCurriculumCompleted) {
    return {
      type: 'all_completed',
      heading: 'All curriculum lessons completed',
      badge: 'Curriculum Complete · Revision',
      title: rec?.title || lessons[0]?.title || 'Revision & Mastery',
      subtitle: rec?.topicTitle || 'All Topics Completed',
      estimatedMinutes: rec?.estimatedMinutes || 20,
      reason: 'You have completed every published lesson! Revisit interactive Proof traces with alternate inputs.',
      actionLabel: 'Practice alternate trace',
      actionTarget: {
        type: 'proof',
        topicId: rec?.topicId || lessons[0]?.topicId,
        lessonId: rec?.lessonId || lessons[0]?.id,
        exerciseId: rec?.exerciseId || lessons[0]?.exerciseId
      },
      source: 'curriculum'
    };
  }

  if (rec) {
    const isFirstTime = !hasRecordedCurriculumActivity(goal);
    const plainReason = rec.reason || (isFirstTime
      ? 'Starting lesson for Arrays & Memory with zero unmet prerequisites to learn interactive proof tracing and array invariants.'
      : 'Recommended next step in your curriculum path.');

    const primaryAction = {
      type: 'recommendation',
      heading: 'Start today’s activity',
      badge: rec.badge || (isFirstTime ? 'First Lesson · Getting Started' : 'Recommended Today'),
      title: rec.title,
      subtitle: rec.topicTitle,
      estimatedMinutes: rec.estimatedMinutes || 20,
      reason: plainReason,
      actionLabel: isFirstTime ? 'Start your first lesson' : (rec.lessonId ? 'Start lesson' : 'Start practice'),
      actionTarget: rec.lessonId ? {
        type: 'proof',
        topicId: rec.topicId,
        lessonId: rec.lessonId,
        exerciseId: rec.exerciseId,
        mode: isFirstTime ? 'learn' : 'trace'
      } : {
        type: 'practice',
        problemId: rec.problemId
      },
      source: 'curriculum'
    };

    if (currentMission && !isStarterCompleted) {
      primaryAction.alternativeAction = {
        type: 'starter_mission',
        title: `${currentMission.id.toUpperCase()} · ${currentMission.title}`,
        subtitle: 'Starter track',
        estimatedMinutes: currentMission.minutes || 30,
        actionLabel: 'Switch to starter mission',
        actionTarget: { type: 'mission', mission: currentMission }
      };
    }

    return primaryAction;
  }

  if (currentMission) {
    return {
      type: 'starter_mission',
      heading: 'Start today’s activity',
      badge: 'Starter track',
      title: `${currentMission.id.toUpperCase()} · ${currentMission.title}`,
      subtitle: 'DSA Foundations',
      estimatedMinutes: currentMission.minutes || 30,
      reason: 'Your daily starter mission to build regular study pacing.',
      actionLabel: 'Start daily mission',
      actionTarget: { type: 'mission', mission: currentMission },
      source: 'starter'
    };
  }

  return null;
}

/**
 * Builds a small, derived searchable index over published curriculum entities:
 * lessons, topics, exercises, and practice problems.
 * Enables fast lookup and token-based search over patterns, boundary conditions, and titles.
 */
export function buildCurriculumSearchIndex(catalog) {
  const curriculum = catalog?.curriculum || {};
  const topics = Array.isArray(curriculum.topics) ? curriculum.topics : [];
  const lessons = Array.isArray(curriculum.lessons) ? curriculum.lessons : [];
  const exercises = Array.isArray(curriculum.exercises) ? curriculum.exercises : [];
  const practiceProblems = Array.isArray(curriculum.practiceProblems) ? curriculum.practiceProblems : [];

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const practiceById = new Map(practiceProblems.map((p) => [p.id, p]));

  const exercisesByLessonId = new Map();
  for (const ex of exercises) {
    if (ex.lessonId) {
      exercisesByLessonId.set(ex.lessonId, ex);
    }
  }

  const practiceByLessonId = new Map();
  for (const prac of practiceProblems) {
    for (const lid of prac.lessonIds || []) {
      if (!practiceByLessonId.has(lid)) {
        practiceByLessonId.set(lid, []);
      }
      practiceByLessonId.get(lid).push(prac);
    }
  }

  const lessonsByTopicId = new Map();
  for (const lesson of lessons) {
    if (!lessonsByTopicId.has(lesson.topicId)) {
      lessonsByTopicId.set(lesson.topicId, []);
    }
    lessonsByTopicId.get(lesson.topicId).push(lesson);
  }

  function search(query, limit = 10) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const results = [];

    for (const lesson of lessons) {
      const topic = topicById.get(lesson.topicId);
      const text = `${lesson.title} ${lesson.keyTakeaway || ''} ${lesson.explanation || ''} ${lesson.edgeCase?.scenario || ''} ${topic?.title || ''}`.toLowerCase();
      const matchScore = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
      if (matchScore > 0) {
        results.push({
          type: 'lesson',
          id: lesson.id,
          title: lesson.title,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          score: matchScore,
          lesson
        });
      }
    }

    for (const ex of exercises) {
      const topic = topicById.get(ex.topicId);
      const text = `${ex.title} ${ex.objective || ''} ${ex.instructions || ''} ${ex.edgeCaseCheck?.question || ''} ${topic?.title || ''}`.toLowerCase();
      const matchScore = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
      if (matchScore > 0) {
        results.push({
          type: 'exercise',
          id: ex.id,
          title: ex.title,
          topicId: ex.topicId,
          topicTitle: topic?.title || ex.topicId,
          score: matchScore,
          exercise: ex
        });
      }
    }

    for (const p of practiceProblems) {
      const topic = topicById.get(p.topicId);
      const text = `${p.title} ${p.pattern || ''} ${p.keyEdgeCase || ''} ${p.whyRecommended || ''} ${p.provider || ''} ${topic?.title || ''}`.toLowerCase();
      const matchScore = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
      if (matchScore > 0) {
        results.push({
          type: 'practice',
          id: p.id,
          title: p.title,
          topicId: p.topicId,
          topicTitle: topic?.title || p.topicId,
          score: matchScore,
          problem: p
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  return {
    curriculum,
    topics,
    lessons,
    exercises,
    practiceProblems,
    topicById,
    lessonById,
    exerciseById,
    practiceById,
    exercisesByLessonId,
    practiceByLessonId,
    lessonsByTopicId,
    search
  };
}

/**
 * Pure, deterministic adaptive reinforcement derivation.
 * Consumes:
 * - Authoritative trace outcomes, mistakes, hints, and reference usage
 * - Existing review dates and latest successful attempts
 * - Lesson completion and student checkIn (confidence: ready / needs_example / unsure; focus: invariant / update_order / edge_cases)
 * - Self-reported external practice logs
 * - Prerequisite DAG and topic structure
 *
 * Conflict / stale resolution policy:
 * 1. A newer relevant evaluated attempt (independent, zero mistakes) postdating an older uncertainty/struggle resolves it.
 * 2. Self-report alone ('ready') cannot erase an evaluated difficulty without an unassisted retry.
 * 3. Unknown check-in or focus values are safely ignored without throwing.
 * 4. Exercise-free lessons route to their own worked example / knowledge check, never an unrelated fallback exercise.
 */
export function deriveAdaptiveReinforcement(goal, catalog, now = new Date()) {
  const index = buildCurriculumSearchIndex(catalog);
  const {
    topics,
    lessons,
    exercises,
    practiceProblems,
    topicById,
    lessonById,
    exerciseById,
    practiceById,
    exercisesByLessonId,
    practiceByLessonId
  } = index;

  if (lessons.length === 0) {
    return {
      items: [],
      dueReviews: [],
      unresolvedStruggles: [],
      supportedTraces: [],
      practiceReviews: [],
      recommendedNextStep: null
    };
  }

  const ws = goal?.studyWorkspace || {};
  const lessonProgress = ws.lessonProgress || {};
  const exerciseAttempts = ws.exerciseAttempts || {};
  const practiceAttempts = ws.practiceAttempts || {};
  const todayIST = localDay(now);

  const parseTime = (ts) => {
    if (!ts) return 0;
    const ms = Date.parse(ts);
    return isNaN(ms) ? 0 : ms;
  };

  // Map of latest independent, zero-mistake successful attempt timestamp per exercise
  const latestIndependentSuccessTimeByExercise = new Map();
  for (const [exId, attempts] of Object.entries(exerciseAttempts)) {
    if (!Array.isArray(attempts)) continue;
    for (const att of attempts) {
      if (att && att.outcome === 'independent' && (!att.mistakeCount || att.mistakeCount === 0)) {
        const t = parseTime(att.savedAt);
        const curr = latestIndependentSuccessTimeByExercise.get(exId) || 0;
        if (t > curr) {
          latestIndependentSuccessTimeByExercise.set(exId, t);
        }
      }
    }
  }

  const items = [];
  const dueReviews = [];
  const unresolvedStruggles = [];
  const supportedTraces = [];
  const practiceReviews = [];

  // Valid checkIn enums
  const VALID_CONFIDENCES = new Set(['ready', 'needs_example', 'unsure']);
  const VALID_FOCUSES = new Set(['invariant', 'update_order', 'edge_cases', 'none']);

  // 1. Process Lesson Progress (check-ins and reflections)
  for (const [lessonId, prog] of Object.entries(lessonProgress)) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) continue;
    const topic = topicById.get(lesson.topicId);
    const checkIn = prog?.checkIn;
    const completedAtTime = parseTime(prog?.completedAt || prog?.updatedAt);

    const attachedExercise = lesson.exerciseId ? exerciseById.get(lesson.exerciseId) : exercisesByLessonId.get(lessonId);
    const exId = attachedExercise?.id;
    const latestSuccessTime = exId ? (latestIndependentSuccessTimeByExercise.get(exId) || 0) : 0;
    const isSupersededByNewerSuccess = latestSuccessTime > completedAtTime && completedAtTime > 0;

    if (checkIn && typeof checkIn === 'object') {
      const conf = VALID_CONFIDENCES.has(checkIn.confidence) ? checkIn.confidence : null;
      const focus = VALID_FOCUSES.has(checkIn.focus) ? checkIn.focus : null;

      if (conf === 'needs_example' && !isSupersededByNewerSuccess) {
        unresolvedStruggles.push({
          id: `struggle-ne-${lessonId}`,
          targetType: attachedExercise ? 'exercise' : 'lesson',
          targetId: attachedExercise ? attachedExercise.id : lessonId,
          lessonId,
          exerciseId: attachedExercise ? attachedExercise.id : null,
          problemId: lesson.recommendedPracticeIds?.[0] || null,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          title: lesson.title,
          badge: 'Worked Example Needed',
          evidenceType: 'check_in_needs_example',
          focusArea: focus && focus !== 'none' ? focus : null,
          variantKey: 'primary',
          section: 'example',
          reason: `You indicated needing another example on "${lesson.title}". Revisit the step-by-step worked example before attempting interactive proof verification.`,
          explanation: `Study the step-by-step invariant trace in "${lesson.title}" to clarify the algorithm's mechanics.`,
          sourceItem: { id: lessonId, type: 'lesson', title: lesson.title },
          estimatedMinutes: 10,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: completedAtTime
        });
      }

      if (conf === 'unsure' && !isSupersededByNewerSuccess) {
        unresolvedStruggles.push({
          id: `struggle-unsure-${lessonId}`,
          targetType: 'lesson',
          targetId: lessonId,
          lessonId,
          exerciseId: attachedExercise ? attachedExercise.id : null,
          problemId: lesson.recommendedPracticeIds?.[0] || null,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          title: lesson.title,
          badge: 'Concept Review',
          evidenceType: 'check_in_unsure',
          focusArea: focus && focus !== 'none' ? focus : null,
          variantKey: 'primary',
          section: 'check',
          reason: `You noted feeling unsure on "${lesson.title}". Review the core invariant explanation and knowledge check to build confidence.`,
          explanation: `A quick self-check on "${lesson.title}" will build confidence on the core concept without pressure.`,
          sourceItem: { id: lessonId, type: 'lesson', title: lesson.title },
          estimatedMinutes: 8,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: completedAtTime
        });
      }

      if (focus === 'invariant' && !isSupersededByNewerSuccess) {
        unresolvedStruggles.push({
          id: `struggle-foc-inv-${lessonId}`,
          targetType: attachedExercise ? 'exercise' : 'lesson',
          targetId: attachedExercise ? attachedExercise.id : lessonId,
          lessonId,
          exerciseId: attachedExercise ? attachedExercise.id : null,
          problemId: lesson.recommendedPracticeIds?.[0] || null,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          title: lesson.title,
          badge: 'Invariant Focus',
          evidenceType: 'check_in_focus_invariant',
          focusArea: 'invariant',
          variantKey: 'primary',
          section: 'explanation',
          reason: `You flagged the loop invariant as your primary focus area on "${lesson.title}". Inspect how the invariant maintains correctness across iterations.`,
          explanation: `Review the formal invariant definition and state snapshot for "${lesson.title}".`,
          sourceItem: { id: lessonId, type: 'lesson', title: lesson.title },
          estimatedMinutes: 10,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: completedAtTime
        });
      }

      if (focus === 'update_order' && !isSupersededByNewerSuccess) {
        unresolvedStruggles.push({
          id: `struggle-foc-ord-${lessonId}`,
          targetType: attachedExercise ? 'exercise' : 'lesson',
          targetId: attachedExercise ? attachedExercise.id : lessonId,
          lessonId,
          exerciseId: attachedExercise ? attachedExercise.id : null,
          problemId: lesson.recommendedPracticeIds?.[0] || null,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          title: attachedExercise ? attachedExercise.title : lesson.title,
          badge: 'Update Order Focus',
          evidenceType: 'check_in_focus_update_order',
          focusArea: 'update_order',
          variantKey: 'primary',
          section: attachedExercise ? 'trace' : 'explanation',
          reason: `You highlighted pointer or update order as tricky on "${lesson.title}". Step through the execution trace where candidate evaluation precedes state update.`,
          explanation: `Carefully observe evaluation order vs update order in "${lesson.title}".`,
          sourceItem: { id: lessonId, type: 'lesson', title: lesson.title },
          estimatedMinutes: attachedExercise ? 12 : 8,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: completedAtTime
        });
      }

      if (focus === 'edge_cases' && !isSupersededByNewerSuccess) {
        unresolvedStruggles.push({
          id: `struggle-foc-edge-${lessonId}`,
          targetType: attachedExercise ? 'exercise' : 'lesson',
          targetId: attachedExercise ? attachedExercise.id : lessonId,
          lessonId,
          exerciseId: attachedExercise ? attachedExercise.id : null,
          problemId: lesson.recommendedPracticeIds?.[0] || null,
          topicId: lesson.topicId,
          topicTitle: topic?.title || lesson.topicId,
          title: attachedExercise ? attachedExercise.title : lesson.title,
          badge: 'Boundary & Edge Focus',
          evidenceType: 'check_in_focus_edge_cases',
          focusArea: 'edge_cases',
          variantKey: attachedExercise?.alternateVariant ? 'alternate' : 'primary',
          section: attachedExercise ? 'edge' : 'explanation',
          reason: `You flagged boundary conditions and edge cases on "${lesson.title}". Tackle the boundary check and alternate input variant to test extreme inputs.`,
          explanation: `Inspect the boundary scenarios and non-trivial edge cases for "${lesson.title}".`,
          sourceItem: { id: lessonId, type: 'lesson', title: lesson.title },
          estimatedMinutes: attachedExercise ? 12 : 8,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: completedAtTime
        });
      }
    }
  }

  // 2. Process Exercise Attempts (Authoritative evaluation outcomes, check-ins, mistakes, support, due recall)
  for (const [exerciseId, attempts] of Object.entries(exerciseAttempts)) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise || !Array.isArray(attempts) || attempts.length === 0) continue;
    const latest = attempts[attempts.length - 1];
    if (!latest) continue;

    const topic = topicById.get(exercise.topicId);
    const lesson = lessonById.get(exercise.lessonId);
    const attemptTime = parseTime(latest.savedAt);
    const isDue = Boolean(latest.nextReviewDate && latest.nextReviewDate <= todayIST);
    const usedSupport = latest.outcome !== 'independent' || (latest.mistakeCount && latest.mistakeCount > 0);

    // Check-in on exercise attempt itself
    if (latest.checkIn && typeof latest.checkIn === 'object') {
      const conf = VALID_CONFIDENCES.has(latest.checkIn.confidence) ? latest.checkIn.confidence : null;
      const focus = VALID_FOCUSES.has(latest.checkIn.focus) ? latest.checkIn.focus : null;

      if (conf === 'needs_example') {
        unresolvedStruggles.push({
          id: `struggle-ex-ne-${exerciseId}`,
          targetType: 'exercise',
          targetId: exerciseId,
          lessonId: exercise.lessonId,
          exerciseId,
          topicId: exercise.topicId,
          topicTitle: topic?.title || exercise.topicId,
          title: exercise.title,
          badge: 'Worked Example Needed',
          evidenceType: 'check_in_needs_example',
          focusArea: focus && focus !== 'none' ? focus : null,
          variantKey: 'primary',
          section: 'example',
          reason: `You requested another worked example while working on "${exercise.title}". Review the primary trace steps before attempting a fresh run.`,
          explanation: `Revisit the step-by-step example in "${lesson?.title || exercise.title}" to clarify the invariant.`,
          sourceItem: { id: exerciseId, type: 'exercise', title: exercise.title },
          estimatedMinutes: 10,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: attemptTime
        });
      }

      if (conf === 'unsure') {
        unresolvedStruggles.push({
          id: `struggle-ex-unsure-${exerciseId}`,
          targetType: 'exercise',
          targetId: exerciseId,
          lessonId: exercise.lessonId,
          exerciseId,
          topicId: exercise.topicId,
          topicTitle: topic?.title || exercise.topicId,
          title: exercise.title,
          badge: 'Concept Check',
          evidenceType: 'check_in_unsure',
          focusArea: focus && focus !== 'none' ? focus : null,
          variantKey: 'primary',
          section: 'check',
          reason: `You noted uncertainty on "${exercise.title}". Practice the step choices again to reinforce the correct transitions.`,
          explanation: `Try the interactive trace on "${exercise.title}" again to clarify key invariants.`,
          sourceItem: { id: exerciseId, type: 'exercise', title: exercise.title },
          estimatedMinutes: 10,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: attemptTime
        });
      }

      if (focus === 'edge_cases') {
        unresolvedStruggles.push({
          id: `struggle-ex-edge-${exerciseId}`,
          targetType: 'exercise',
          targetId: exerciseId,
          lessonId: exercise.lessonId,
          exerciseId,
          topicId: exercise.topicId,
          topicTitle: topic?.title || exercise.topicId,
          title: `${exercise.title} (Alternate Input)`,
          badge: 'Boundary & Alternate Variant',
          evidenceType: 'check_in_focus_edge_cases',
          focusArea: 'edge_cases',
          variantKey: 'alternate',
          section: 'edge',
          reason: `You selected edge cases as your focus area on "${exercise.title}". Try the alternate input variant to test boundary reasoning.`,
          explanation: `Work through the alternate trace on "${exercise.title}" to master boundary handling.`,
          sourceItem: { id: exerciseId, type: 'exercise', title: exercise.title },
          estimatedMinutes: 12,
          isSelfReported: true,
          isVerified: false,
          savedAtTime: attemptTime
        });
      }
    }

    // Due recall review
    if (isDue) {
      dueReviews.push({
        id: `due-ex-${exerciseId}`,
        targetType: 'exercise',
        targetId: exerciseId,
        lessonId: exercise.lessonId,
        exerciseId,
        topicId: exercise.topicId,
        topicTitle: topic?.title || exercise.topicId,
        title: exercise.title,
        badge: 'Spaced Recall Due',
        evidenceType: 'due_recall',
        variantKey: 'primary',
        section: 'trace',
        reason: `Spaced recall review is due (${latest.nextReviewDate}) for "${exercise.title}". Complete an active retrieval trace to consolidate your memory.`,
        explanation: `Scheduled spaced repetition review for "${exercise.title}".`,
        sourceItem: { id: exerciseId, type: 'exercise', title: exercise.title },
        estimatedMinutes: 12,
        isSelfReported: false,
        isVerified: true,
        nextReviewDate: latest.nextReviewDate,
        savedAtTime: attemptTime
      });
    }

    // Supported trace needing unassisted retry
    if (usedSupport) {
      supportedTraces.push({
        id: `supp-ex-${exerciseId}`,
        targetType: 'exercise',
        targetId: exerciseId,
        lessonId: exercise.lessonId,
        exerciseId,
        topicId: exercise.topicId,
        topicTitle: topic?.title || exercise.topicId,
        title: exercise.title,
        badge: 'Unassisted Verification Needed',
        evidenceType: 'supported_trace',
        variantKey: 'primary',
        section: 'trace',
        reason: `Previous trace completed with ${
          latest.outcome === 'needed_reference'
            ? 'reference revealed'
            : latest.outcome === 'with_hint'
            ? 'a hint'
            : `${latest.mistakeCount} step retry`
        }. Complete an unassisted run to prove independent mastery.`,
        explanation: `An unassisted run on "${exercise.title}" verifies you can navigate state invariants without hints.`,
        sourceItem: { id: exerciseId, type: 'exercise', title: exercise.title },
        estimatedMinutes: 10,
        isSelfReported: false,
        isVerified: true,
        savedAtTime: attemptTime
      });
    }
  }

  // 3. Process Practice Attempts (External problems self-reported)
  for (const [problemId, attempts] of Object.entries(practiceAttempts)) {
    const problem = practiceById.get(problemId);
    if (!problem || !Array.isArray(attempts) || attempts.length === 0) continue;
    const latest = attempts[attempts.length - 1];
    if (!latest) continue;

    const topic = topicById.get(problem.topicId);
    const linkedLessonId = problem.lessonIds?.[0] || null;
    const isDue = Boolean(latest.nextReviewDate && latest.nextReviewDate <= todayIST);
    const flagged = Boolean(
      latest.needsReview || latest.outcome === 'with_hint' || latest.outcome === 'reviewed_editorial'
    );
    const attemptTime = parseTime(latest.savedAt);

    if (isDue) {
      dueReviews.push({
        id: `due-prac-${problemId}`,
        targetType: 'practice',
        targetId: problemId,
        lessonId: linkedLessonId,
        problemId,
        topicId: problem.topicId,
        topicTitle: topic?.title || problem.topicId,
        title: problem.title,
        badge: 'Practice Spaced Recall',
        evidenceType: 'due_recall',
        section: 'practice',
        reason: `External practice spaced recall due (${latest.nextReviewDate}) for "${problem.title}". Try solving it on ${problem.provider || 'the host site'} without notes.`,
        explanation: `Scheduled retrieval practice on external problem "${problem.title}".`,
        sourceItem: { id: problemId, type: 'practice', title: problem.title },
        estimatedMinutes: problem.estimatedMinutes || 15,
        isSelfReported: true,
        isVerified: false,
        nextReviewDate: latest.nextReviewDate,
        savedAtTime: attemptTime
      });
    } else if (flagged) {
      practiceReviews.push({
        id: `flag-prac-${problemId}`,
        targetType: 'practice',
        targetId: problemId,
        lessonId: linkedLessonId,
        problemId,
        topicId: problem.topicId,
        topicTitle: topic?.title || problem.topicId,
        title: problem.title,
        badge: 'Practice Revisit Flagged',
        evidenceType: 'self_reported_practice',
        section: 'practice',
        reason: `Self-reported as "${(latest.outcome || '').replace(/_/g, ' ')}" on ${problem.provider || 'external platform'}. Revisit to attempt an independent solution.`,
        explanation: `Self-reported difficulty on "${problem.title}" flagged for reinforcement.`,
        sourceItem: { id: problemId, type: 'practice', title: problem.title },
        estimatedMinutes: problem.estimatedMinutes || 15,
        isSelfReported: true,
        isVerified: false,
        savedAtTime: attemptTime
      });
    }
  }

  // Deduplicate and prioritize into master `items` array
  const allCandidates = [
    ...unresolvedStruggles,
    ...dueReviews,
    ...supportedTraces,
    ...practiceReviews
  ];

  const seenTargets = new Set();
  const deduplicatedItems = [];

  for (const cand of allCandidates) {
    const key = `${cand.targetType}-${cand.targetId}-${cand.variantKey || 'primary'}`;
    if (!seenTargets.has(key)) {
      seenTargets.add(key);
      deduplicatedItems.push(cand);
    }
  }

  deduplicatedItems.sort((a, b) => {
    const priorityOrder = {
      check_in_needs_example: 1,
      check_in_unsure: 2,
      check_in_focus_edge_cases: 3,
      check_in_focus_invariant: 4,
      check_in_focus_update_order: 5,
      due_recall: 6,
      supported_trace: 7,
      self_reported_practice: 8
    };
    const pA = priorityOrder[a.evidenceType] || 99;
    const pB = priorityOrder[b.evidenceType] || 99;
    if (pA !== pB) return pA - pB;

    const tA = a.savedAtTime || 0;
    const tB = b.savedAtTime || 0;
    if (tA !== tB) return tB - tA;

    return (a.title || '').localeCompare(b.title || '');
  });

  let recommendedNextStep = null;
  for (const lesson of lessons) {
    const prog = lessonProgress[lesson.id];
    if (prog?.status === 'completed') continue;
    const prereqsMet = (lesson.prerequisites || []).every((pid) => lessonProgress[pid]?.status === 'completed');
    if (prereqsMet) {
      const topic = topicById.get(lesson.topicId);
      recommendedNextStep = {
        kind: 'next_unlocked_lesson',
        title: lesson.title,
        topicId: lesson.topicId,
        topicTitle: topic?.title || lesson.topicId,
        lessonId: lesson.id,
        exerciseId: lesson.exerciseId || null,
        problemId: lesson.recommendedPracticeIds?.[0] || null,
        estimatedMinutes: lesson.estimatedMinutes || 15,
        badge: 'Next Unlocked Lesson',
        reason:
          lesson.prerequisites && lesson.prerequisites.length > 0
            ? `Unlocked because you completed prerequisite lesson ${lesson.prerequisites.join(', ')}.`
            : `Recommended starting point in ${topic?.title || 'your topic path'} with zero unmet prerequisites.`
      };
      break;
    }
  }

  if (!recommendedNextStep) {
    const fallback = lessons[0];
    recommendedNextStep = {
      kind: 'revision_lesson',
      title: fallback.title,
      topicId: fallback.topicId,
      topicTitle: topicById.get(fallback.topicId)?.title || fallback.topicId,
      lessonId: fallback.id,
      exerciseId: fallback.exerciseId || null,
      problemId: fallback.recommendedPracticeIds?.[0] || null,
      estimatedMinutes: fallback.estimatedMinutes || 15,
      badge: 'Revision & Alternate Traces',
      reason: 'All published lessons completed! Revisit interactive traces with alternate inputs.'
    };
  }

  return {
    items: deduplicatedItems,
    dueReviews,
    unresolvedStruggles,
    supportedTraces,
    practiceReviews,
    recommendedNextStep
  };
}

/**
 * Derives a targeted practice session proposal ("Practise what needs work").
 * Generates up to three linked activities strictly fitting the student's chosen
 * time budget (10 / 20 / 30 minutes).
 * Combines worked examples, trace/boundary retries, and relevant practice problems.
 * Prioritizes studied or prerequisite-eligible material based on explainable reinforcement.
 * Pure derivation without mutating workspace state.
 */
export function derivePracticeSessionProposal(
  goal,
  catalog,
  { timeBudgetMinutes = 20, excludedActivityIds = [] } = {},
  now = new Date()
) {
  const allowedBudgets = [10, 20, 30];
  const budget = allowedBudgets.includes(timeBudgetMinutes) ? timeBudgetMinutes : 20;

  const reinforcement = deriveAdaptiveReinforcement(goal, catalog, now);
  const {
    unresolvedStruggles = [],
    dueReviews = [],
    supportedTraces = [],
    practiceReviews = [],
    recommendedNextStep
  } = reinforcement;

  const excludedSet = new Set(excludedActivityIds || []);
  const index = buildCurriculumSearchIndex(catalog);
  const { lessonById, exerciseById, practiceById } = index;

  const candidates = [];

  // 1. Unresolved struggles (worked examples / checks / boundary cases)
  for (const s of unresolvedStruggles) {
    if (excludedSet.has(s.targetId) || excludedSet.has(s.id)) continue;
    candidates.push({
      taskId: `task_struggle_${s.targetId}_${s.variantKey || 'primary'}`,
      activityType: s.section === 'example' ? 'worked_example' : (s.section === 'check' ? 'lesson_check' : (s.variantKey === 'alternate' ? 'boundary_retry' : 'trace_retry')),
      targetId: s.targetId,
      lessonId: s.lessonId,
      exerciseId: s.exerciseId || null,
      problemId: s.problemId || null,
      variantKey: s.variantKey || 'primary',
      title: s.section === 'example' ? `Review Worked Example: ${s.title}` : (s.section === 'check' ? `Knowledge Check: ${s.title}` : s.title),
      topicId: s.topicId,
      topicTitle: s.topicTitle,
      estimatedMinutes: s.section === 'example' ? 8 : (s.section === 'check' ? 6 : s.estimatedMinutes || 10),
      reason: s.reason,
      evidenceType: s.evidenceType,
      section: s.section
    });
  }

  // 2. Supported traces needing unassisted retry
  for (const st of supportedTraces) {
    if (excludedSet.has(st.exerciseId) || excludedSet.has(st.id)) continue;
    candidates.push({
      taskId: `task_supp_${st.exerciseId}`,
      activityType: 'trace_retry',
      targetId: st.exerciseId,
      lessonId: st.lessonId,
      exerciseId: st.exerciseId,
      variantKey: 'primary',
      title: `Unassisted Proof: ${st.title}`,
      topicId: st.topicId,
      topicTitle: st.topicTitle,
      estimatedMinutes: 10,
      reason: st.reason,
      evidenceType: 'supported_trace',
      section: 'trace'
    });
  }

  // 3. Due recall reviews
  for (const d of dueReviews) {
    if (excludedSet.has(d.targetId) || excludedSet.has(d.id)) continue;
    candidates.push({
      taskId: `task_due_${d.targetId}`,
      activityType: d.targetType === 'exercise' ? 'trace_retry' : 'practice_problem',
      targetId: d.targetId,
      lessonId: d.lessonId,
      exerciseId: d.exerciseId || null,
      problemId: d.problemId || null,
      variantKey: d.variantKey || 'primary',
      title: `Retrieval Practice: ${d.title}`,
      topicId: d.topicId,
      topicTitle: d.topicTitle,
      estimatedMinutes: d.estimatedMinutes || 12,
      reason: d.reason,
      evidenceType: 'due_recall',
      section: d.section
    });
  }

  // 4. Practice reviews
  for (const pr of practiceReviews) {
    if (excludedSet.has(pr.targetId) || excludedSet.has(pr.id)) continue;
    candidates.push({
      taskId: `task_prac_${pr.targetId}`,
      activityType: 'practice_problem',
      targetId: pr.targetId,
      lessonId: pr.lessonId,
      problemId: pr.problemId,
      title: `External Practice: ${pr.title}`,
      topicId: pr.topicId,
      topicTitle: pr.topicTitle,
      estimatedMinutes: pr.estimatedMinutes || 15,
      reason: pr.reason,
      evidenceType: 'self_reported_practice',
      section: 'practice'
    });
  }

  // 5. If candidates are sparse, add from recommendedNextStep
  if (candidates.length < 3 && recommendedNextStep && !excludedSet.has(recommendedNextStep.lessonId)) {
    const lesson = lessonById.get(recommendedNextStep.lessonId);
    if (lesson) {
      if (lesson.workedExample) {
        candidates.push({
          taskId: `task_next_ex_${lesson.id}`,
          activityType: 'worked_example',
          targetId: lesson.id,
          lessonId: lesson.id,
          exerciseId: lesson.exerciseId || null,
          title: `Study Invariant: ${lesson.title}`,
          topicId: lesson.topicId,
          topicTitle: recommendedNextStep.topicTitle,
          estimatedMinutes: 8,
          reason: `Study the worked example for "${lesson.title}" (${recommendedNextStep.reason}).`,
          evidenceType: 'next_lesson',
          section: 'example'
        });
      }
      if (lesson.exerciseId) {
        const ex = exerciseById.get(lesson.exerciseId);
        if (ex) {
          candidates.push({
            taskId: `task_next_trace_${ex.id}`,
            activityType: 'trace_retry',
            targetId: ex.id,
            lessonId: lesson.id,
            exerciseId: ex.id,
            variantKey: 'primary',
            title: `Interactive Proof: ${ex.title}`,
            topicId: lesson.topicId,
            topicTitle: recommendedNextStep.topicTitle,
            estimatedMinutes: 10,
            reason: `Practice the proof trace for ${lesson.title}.`,
            evidenceType: 'next_exercise',
            section: 'trace'
          });
        }
      } else if (lesson.recommendedPracticeIds?.[0]) {
        const p = practiceById.get(lesson.recommendedPracticeIds[0]);
        if (p) {
          candidates.push({
            taskId: `task_next_prac_${p.id}`,
            activityType: 'practice_problem',
            targetId: p.id,
            lessonId: lesson.id,
            problemId: p.id,
            title: `Practice: ${p.title}`,
            topicId: p.topicId,
            topicTitle: recommendedNextStep.topicTitle,
            estimatedMinutes: 12,
            reason: `External practice application for ${lesson.title}.`,
            evidenceType: 'next_practice',
            section: 'practice'
          });
        }
      }
    }
  }

  // Deduplicate candidates
  const uniqueCandidates = [];
  const seenCandKeys = new Set();
  for (const c of candidates) {
    const k = `${c.targetId}-${c.variantKey || 'primary'}`;
    if (!seenCandKeys.has(k)) {
      seenCandKeys.add(k);
      uniqueCandidates.push(c);
    }
  }

  // Strict budget constraint:
  // 10m -> 1 task (max 10m)
  // 20m -> up to 2 tasks (max 20m)
  // 30m -> up to 3 tasks (max 30m)
  const maxTasks = budget === 10 ? 1 : (budget === 20 ? 2 : 3);
  const selectedTasks = [];
  let allocatedMinutes = 0;

  for (const cand of uniqueCandidates) {
    if (selectedTasks.length >= maxTasks) break;
    if (allocatedMinutes + cand.estimatedMinutes <= budget + 2 || selectedTasks.length === 0) {
      selectedTasks.push({
        ...cand,
        taskId: `task_${selectedTasks.length + 1}`
      });
      allocatedMinutes += cand.estimatedMinutes;
    }
  }

  let reason = '';
  if (unresolvedStruggles.length > 0) {
    reason = `Addresses your recent check-in feedback (${unresolvedStruggles[0].badge}) to reinforce core invariants.`;
  } else if (dueReviews.length > 0) {
    reason = `Includes ${dueReviews.length} due spaced-repetition review(s) to solidify memory retention.`;
  } else if (supportedTraces.length > 0) {
    reason = `Features unassisted verification retries for traces previously solved with hints.`;
  } else {
    reason = `Personalized progression with worked example and proof practice tailored to your curriculum pace.`;
  }

  return {
    timeBudgetMinutes: budget,
    totalEstimatedMinutes: allocatedMinutes,
    reason,
    tasks: selectedTasks,
    candidateCount: uniqueCandidates.length,
    canRegenerate: uniqueCandidates.length > selectedTasks.length
  };
}
