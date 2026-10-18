/**
 * NextStep Deterministic Scheduler Service
 * Conforms to contracts/SCHEDULER.md and contracts/API-V1.md.
 * Pure scheduling logic uses Asia/Kolkata timezone calculations.
 */

export function getTodayKolkata() {
  return getDateKolkata(new Date());
}

export function getDateKolkata(value) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(value));
}

export function completedMinutesOnDate(completions, date) {
  return Object.values(completions).filter(c => c.completedAt && getDateKolkata(c.completedAt) === date).length * 30;
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

export const DEFAULT_CURRICULUM_VERSION = 'atlas-proof-v1';

export function normalizeStudyWorkspace(rawWorkspace) {
  const base = rawWorkspace && typeof rawWorkspace === 'object' ? rawWorkspace : {};
  return {
    schemaVersion: 1,
    curriculumVersion: base.curriculumVersion || DEFAULT_CURRICULUM_VERSION,
    selectedTopicId: typeof base.selectedTopicId === 'string' ? base.selectedTopicId : 'topic_arrays',
    lessonProgress: base.lessonProgress && typeof base.lessonProgress === 'object' ? base.lessonProgress : {},
    exerciseAttempts: base.exerciseAttempts && typeof base.exerciseAttempts === 'object' ? base.exerciseAttempts : {},
    practiceAttempts: base.practiceAttempts && typeof base.practiceAttempts === 'object' ? base.practiceAttempts : {},
    studyPlan: base.studyPlan && typeof base.studyPlan === 'object' ? base.studyPlan : null,
    updatedAt: base.updatedAt || null
  };
}

/**
 * Calculates a capacity-aware multi-session study plan for selected curriculum items
 * (lessons, exercises, or practice problems) without mutating starter mission schedule.
 */
export function calculateWorkspaceStudyPlan({
  startDate,
  targetDate,
  availability,
  selectedItemIds,
  curriculum,
  studyWorkspace
}) {
  const normalizedWorkspace = normalizeStudyWorkspace(studyWorkspace);
  const completedLessons = new Set(
    Object.entries(normalizedWorkspace.lessonProgress)
      .filter(([k, lp]) => lp && (lp.status === 'completed' || lp.completedAt))
      .map(([k, lp]) => lp.lessonId || k)
  );

  const topicById = new Map((curriculum.topics || []).map((t) => [t.id, t]));
  const lessonById = new Map((curriculum.lessons || []).map((l) => [l.id, l]));
  const exerciseById = new Map((curriculum.exercises || []).map((e) => [e.id, e]));
  const practiceById = new Map((curriculum.practiceProblems || []).map((p) => [p.id, p]));

  // 1. Collect all required work items and uncompleted prerequisites
  const requiredItems = new Map();

  function collectLessonAndPrereqs(lessonId) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) return;
    for (const prereqLessonId of lesson.prerequisites || []) {
      if (!completedLessons.has(prereqLessonId)) {
        collectLessonAndPrereqs(prereqLessonId);
      }
    }
    if (completedLessons.has(lesson.id) || requiredItems.has(lesson.id)) return;
    const topic = topicById.get(lesson.topicId);
    requiredItems.set(lesson.id, {
      itemId: lesson.id,
      itemType: 'lesson',
      topicId: lesson.topicId,
      topicOrder: topic ? topic.order : 99,
      itemOrder: lesson.order * 10,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes || 20,
      lessonObj: lesson
    });
  }

  for (const rawId of selectedItemIds || []) {
    if (lessonById.has(rawId)) {
      if (!completedLessons.has(rawId)) {
        collectLessonAndPrereqs(rawId);
      }
    } else if (exerciseById.has(rawId)) {
      const ex = exerciseById.get(rawId);
      if (!completedLessons.has(ex.lessonId)) {
        collectLessonAndPrereqs(ex.lessonId);
      }
      if (!requiredItems.has(ex.id)) {
        const topic = topicById.get(ex.topicId);
        const lesson = lessonById.get(ex.lessonId);
        requiredItems.set(ex.id, {
          itemId: ex.id,
          itemType: 'exercise',
          topicId: ex.topicId,
          topicOrder: topic ? topic.order : 99,
          itemOrder: (lesson ? lesson.order * 10 : 50) + 2,
          title: ex.title,
          estimatedMinutes: 15,
          exerciseObj: ex
        });
      }
    } else if (practiceById.has(rawId)) {
      const prac = practiceById.get(rawId);
      for (const lid of prac.lessonIds || []) {
        if (!completedLessons.has(lid)) {
          collectLessonAndPrereqs(lid);
        }
      }
      if (!requiredItems.has(prac.id)) {
        const topic = topicById.get(prac.topicId);
        const linkedLessons = (prac.lessonIds || []).map((lid) => lessonById.get(lid)).filter(Boolean);
        const maxLessonOrder = linkedLessons.length > 0 ? Math.max(...linkedLessons.map((l) => l.order)) : 5;
        requiredItems.set(prac.id, {
          itemId: prac.id,
          itemType: 'practice',
          topicId: prac.topicId,
          topicOrder: topic ? topic.order : 99,
          itemOrder: maxLessonOrder * 10 + 5,
          title: prac.title,
          estimatedMinutes: prac.estimatedMinutes || 20,
          practiceObj: prac
        });
      }
    }
  }

  // 2. Build dependency graph
  const itemIds = Array.from(requiredItems.keys());
  const inDegree = new Map();
  const outgoing = new Map();

  for (const id of itemIds) {
    inDegree.set(id, 0);
    outgoing.set(id, new Set());
  }

  for (const [id, item] of requiredItems.entries()) {
    const directPrereqs = new Set();
    if (item.itemType === 'lesson') {
      for (const p of item.lessonObj.prerequisites || []) {
        if (requiredItems.has(p)) {
          directPrereqs.add(p);
        }
      }
      for (const [otherId, otherItem] of requiredItems.entries()) {
        if (
          otherItem.itemType === 'lesson' &&
          otherItem.topicId === item.topicId &&
          otherItem.lessonObj.order < item.lessonObj.order
        ) {
          directPrereqs.add(otherId);
        }
      }
    } else if (item.itemType === 'exercise') {
      if (requiredItems.has(item.exerciseObj.lessonId)) {
        directPrereqs.add(item.exerciseObj.lessonId);
      }
    } else if (item.itemType === 'practice') {
      for (const lid of item.practiceObj.lessonIds || []) {
        if (requiredItems.has(lid)) {
          directPrereqs.add(lid);
        }
      }
    }

    inDegree.set(id, directPrereqs.size);
    for (const prereqId of directPrereqs) {
      outgoing.get(prereqId).add(id);
    }
  }

  // 3. Stable tie-breaking comparator based on display ordering
  function compareWorkItems(aId, bId) {
    const a = requiredItems.get(aId);
    const b = requiredItems.get(bId);
    if (a.topicOrder !== b.topicOrder) return a.topicOrder - b.topicOrder;
    if (a.itemOrder !== b.itemOrder) return a.itemOrder - b.itemOrder;
    return a.itemId.localeCompare(b.itemId);
  }

  // 4. Stable Kahn's algorithm
  const available = itemIds.filter((id) => inDegree.get(id) === 0);
  available.sort(compareWorkItems);

  const orderedWorkItems = [];

  while (available.length > 0) {
    const currentId = available.shift();
    const item = requiredItems.get(currentId);
    orderedWorkItems.push({
      itemId: item.itemId,
      itemType: item.itemType,
      topicId: item.topicId,
      topicOrder: item.topicOrder,
      itemOrder: item.itemOrder,
      title: item.title,
      estimatedMinutes: item.estimatedMinutes
    });

    for (const depId of outgoing.get(currentId) || []) {
      const nextDeg = inDegree.get(depId) - 1;
      inDegree.set(depId, nextDeg);
      if (nextDeg === 0) {
        available.push(depId);
        available.sort(compareWorkItems);
      }
    }
  }

  if (orderedWorkItems.length < requiredItems.size) {
    const scheduledSet = new Set(orderedWorkItems.map((w) => w.itemId));
    const remaining = itemIds.filter((id) => !scheduledSet.has(id));
    remaining.sort(compareWorkItems);
    for (const remId of remaining) {
      const item = requiredItems.get(remId);
      orderedWorkItems.push({
        itemId: item.itemId,
        itemType: item.itemType,
        topicId: item.topicId,
        topicOrder: item.topicOrder,
        itemOrder: item.itemOrder,
        title: item.title,
        estimatedMinutes: item.estimatedMinutes
      });
    }
  }

  const sessions = [];
  const unscheduledItemIds = [];
  let cursor = startDate;
  let loopGuard = 0;

  // Build mutable remaining time tracker for each item
  const queue = orderedWorkItems.map((item) => ({
    ...item,
    remainingMinutes: item.estimatedMinutes,
    parts: []
  }));
  let qIdx = 0;

  while (qIdx < queue.length && loopGuard < 366) {
    const weekday = getDayOfWeek(cursor);
    let availableToday = availability[weekday] || 0;

    while (availableToday > 0 && qIdx < queue.length) {
      const current = queue[qIdx];
      const alloc = Math.min(availableToday, current.remainingMinutes);
      current.parts.push({
        date: cursor,
        allocatedMinutes: alloc
      });
      current.remainingMinutes -= alloc;
      availableToday -= alloc;
      if (current.remainingMinutes <= 0) {
        qIdx += 1;
      }
    }

    cursor = addDays(cursor, 1);
    loopGuard += 1;
  }

  for (let i = 0; i < queue.length; i += 1) {
    const item = queue[i];
    if (item.remainingMinutes > 0) {
      unscheduledItemIds.push(item.itemId);
    } else {
      const totalParts = item.parts.length;
      item.parts.forEach((p, idx) => {
        sessions.push({
          date: p.date,
          itemId: item.itemId,
          itemType: item.itemType,
          topicId: item.topicId,
          title: item.title,
          allocatedMinutes: p.allocatedMinutes,
          totalEstimatedMinutes: item.estimatedMinutes,
          partIndex: idx + 1,
          totalParts
        });
      });
    }
  }

  const estimatedFinishDate = sessions.length > 0 ? sessions[sessions.length - 1].date : startDate;
  const deadlineConflict = Boolean(
    unscheduledItemIds.length > 0 || (targetDate && estimatedFinishDate > targetDate)
  );
  const status = deadlineConflict ? 'over_capacity' : 'on_track';

  return {
    planStartDate: startDate,
    targetDate,
    availability,
    selectedItemIds: orderedWorkItems.map((w) => w.itemId),
    sessions,
    unscheduledItemIds,
    estimatedFinishDate,
    deadlineConflict,
    status
  };
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
    estimatedFinishDate = sorted[0]?.completedAt ? getDateKolkata(sorted[0].completedAt) : rawGoal.planStartDate;
  }

  const isOverCapacity = estimatedFinishDate > rawGoal.targetDate;
  const status = completedIds.length === missions.length
    ? 'completed'
    : (isOverCapacity ? 'over_capacity' : 'on_track');

  return {
    ...rawGoal,
    learning: rawGoal.learning || {},
    studyWorkspace: normalizeStudyWorkspace(rawGoal.studyWorkspace),
    xp,
    level,
    remainingMinutes,
    nextMissionId,
    estimatedFinishDate,
    status
  };
}
