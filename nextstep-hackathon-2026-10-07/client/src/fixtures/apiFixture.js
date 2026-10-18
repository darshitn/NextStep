// NextStep Development Fixture Adapter
// Conforms to API-V1.md and AI Guidance extension contracts.
// Used for unblocked UI development and fixture demonstration.

import catalogData from './dsa-starter.json' with { type: 'json' };
import curriculumData from './curriculum.json' with { type: 'json' };
import {
  getAuthoritativeExercise,
  getAuthoritativeLesson,
  gradeExerciseAttempt
} from '../../../server/src/services/curriculumRegistry.js';

const STORAGE_KEY_PREFIX = 'nextstep_fixture_goal_';
const AUTH_KEY = 'nextstep_fixture_user';
export const DEFAULT_CURRICULUM_VERSION = 'atlas-proof-v1';

// Safe in-memory storage fallback for Node.js test runner and SSR
const memoryStore = new Map();
const safeStorage = {
  getItem(key) {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch {}
    return memoryStore.get(key) || null;
  },
  setItem(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
        return;
      }
    } catch {}
    memoryStore.set(key, String(val));
  },
  removeItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStore.delete(key);
  }
};

export const DEMO_ACCOUNTS = [
  {
    email: 'student.ready@nextstep.local',
    name: 'Aarav Sharma (Fresh Student)',
    description: 'Fresh account with no goal created yet.',
    initialState: null
  },
  {
    email: 'student.active@nextstep.local',
    name: 'Priya Patel (Active Practice)',
    description: 'Active student who completed Mission 1.',
    initialState: 'active'
  },
  {
    email: 'student.interrupted@nextstep.local',
    name: 'Rahul Verma (Needs Recovery)',
    description: 'Completed 2 missions; exam week reduced available time.',
    initialState: 'interrupted'
  }
];

// Helper: Get Asia/Kolkata date YYYY-MM-DD
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

// Format date helper: add days
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getDayOfWeek(dateStr) {
  const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const d = new Date(dateStr + 'T12:00:00Z');
  return names[d.getUTCDay()];
}

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

export function calculateWorkspaceStudyPlan({
  startDate,
  targetDate,
  availability,
  selectedItemIds,
  curriculum = curriculumData,
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

// Pure deterministic scheduler
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
    throw new Error('Workload cannot fit within the 366-day planning horizon.');
  }

  return schedule;
}

// Helper to derive goal stats
export function deriveGoalStats(goal) {
  const missions = catalogData.missions;
  const completions = goal.completions || {};
  const completedIds = Object.keys(completions);
  const xp = 20 * completedIds.length;
  const level = Math.floor(xp / 100) + 1;
  const remainingMinutes = 30 * (missions.length - completedIds.length);
  const nextMission = missions.find(m => !completions[m.id]);
  const nextMissionId = nextMission ? nextMission.id : null;

  let estimatedFinishDate = goal.schedule.length > 0 ? goal.schedule[goal.schedule.length - 1].date : goal.targetDate;
  if (completedIds.length === missions.length) {
    estimatedFinishDate = Object.values(completions).sort((a,b) => b.completedAt.localeCompare(a.completedAt))[0]?.completedAt.slice(0, 10) || goal.planStartDate;
  }

  const isOverCapacity = estimatedFinishDate > goal.targetDate;
  const status = completedIds.length === missions.length ? 'completed' : (isOverCapacity ? 'over_capacity' : 'on_track');

  return {
    ...goal,
    learning: goal.learning || {},
    studyWorkspace: normalizeStudyWorkspace(goal.studyWorkspace),
    xp,
    level,
    remainingMinutes,
    nextMissionId,
    estimatedFinishDate,
    status
  };
}

// Create initial seed state
function createInitialSeedGoal(stateType, userEmail) {
  const today = getTodayKolkata();
  const missionIds = catalogData.missions.map(m => m.id);
  const defaultAvailability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
  const schedule = calculateSchedule(today, defaultAvailability, missionIds);
  const targetDate = addDays(today, 30);
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

  let completions = {};
  let studyWorkspace = normalizeStudyWorkspace({});

  if (stateType === 'active') {
    completions['m01'] = {
      completedAt: yesterdayIso,
      outcome: 'independent',
      reflection: 'Reviewed basic array indexing and linear scans.'
    };
    studyWorkspace = normalizeStudyWorkspace({
      selectedTopicId: 'topic_arrays',
      lessonProgress: {
        les_arrays_01: {
          lessonId: 'les_arrays_01',
          topicId: 'topic_arrays',
          status: 'completed',
          startedAt: yesterdayIso,
          lastVisitedAt: yesterdayIso,
          completedSections: ['explanation', 'worked_example', 'knowledge_check'],
          reflection: 'Evaluate candidateGain strictly before updating minPrice so index i never pairs with itself.',
          knowledgeCheckPassed: true,
          updatedAt: yesterdayIso
        },
        les_arrays_02: {
          lessonId: 'les_arrays_02',
          topicId: 'topic_arrays',
          status: 'in_progress',
          startedAt: yesterdayIso,
          lastVisitedAt: yesterdayIso,
          completedSections: ['explanation'],
          reflection: null,
          knowledgeCheckPassed: false,
          updatedAt: yesterdayIso
        }
      },
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: '30000000-0000-4000-8000-000000000001',
            exerciseId: 'ex_arrays_01',
            lessonId: 'les_arrays_01',
            topicId: 'topic_arrays',
            outcome: 'independent',
            mistakeCount: 0,
            hintRevealed: false,
            referenceRevealed: false,
            reflection: 'Confirmed minPrice drops to 1 at i = 3 while bestGain stays 4.',
            savedAt: yesterdayIso,
            nextReviewDate: addDays(today, 6)
          }
        ]
      },
      practiceAttempts: {
        prac_arrays_01: [
          {
            attemptId: '40000000-0000-4000-8000-000000000001',
            problemId: 'prac_arrays_01',
            topicId: 'topic_arrays',
            outcome: 'solved_independently',
            note: 'Single-pass running minimum handled decreasing test cases cleanly.',
            needsReview: false,
            selfReported: true,
            savedAt: yesterdayIso,
            nextReviewDate: addDays(today, 6)
          }
        ]
      },
      updatedAt: yesterdayIso
    });
  } else if (stateType === 'interrupted') {
    completions['m01'] = {
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      outcome: 'independent',
      reflection: 'Built mental model for array indexing.'
    };
    completions['m02'] = {
      completedAt: yesterdayIso,
      outcome: 'with_hint',
      reflection: 'Trace lookups took extra time on boundary conditions.'
    };
    studyWorkspace = normalizeStudyWorkspace({
      selectedTopicId: 'topic_hashing',
      lessonProgress: {
        les_arrays_01: {
          lessonId: 'les_arrays_01',
          topicId: 'topic_arrays',
          status: 'completed',
          startedAt: yesterdayIso,
          lastVisitedAt: yesterdayIso,
          completedSections: ['explanation', 'worked_example', 'knowledge_check'],
          reflection: 'Completed prefix invariant check.',
          knowledgeCheckPassed: true,
          updatedAt: yesterdayIso
        },
        les_hashing_01: {
          lessonId: 'les_hashing_01',
          topicId: 'topic_hashing',
          status: 'in_progress',
          startedAt: yesterdayIso,
          lastVisitedAt: yesterdayIso,
          completedSections: ['explanation', 'worked_example'],
          reflection: 'Need to remember map.has(need) instead of truthiness check on index 0.',
          knowledgeCheckPassed: true,
          updatedAt: yesterdayIso
        }
      },
      exerciseAttempts: {
        ex_hashing_01: [
          {
            attemptId: '30000000-0000-4000-8000-000000000002',
            exerciseId: 'ex_hashing_01',
            lessonId: 'les_hashing_01',
            topicId: 'topic_hashing',
            outcome: 'with_hint',
            mistakeCount: 1,
            hintRevealed: true,
            referenceRevealed: false,
            reflection: 'Caught the self-complement trap on target = 6 with nums[0] = 3.',
            savedAt: yesterdayIso,
            nextReviewDate: today
          }
        ]
      },
      practiceAttempts: {
        prac_hashing_01: [
          {
            attemptId: '40000000-0000-4000-8000-000000000002',
            problemId: 'prac_hashing_01',
            topicId: 'topic_hashing',
            outcome: 'with_hint',
            note: 'Had to fix `if (map.get(need))` failing when partner was at index 0.',
            needsReview: true,
            selfReported: true,
            savedAt: yesterdayIso,
            nextReviewDate: today
          }
        ]
      },
      updatedAt: yesterdayIso
    });
  }

  const rawGoal = {
    id: 'goal-' + Math.random().toString(36).substring(2, 9),
    version: 1,
    owner_id: userEmail,
    trackId: 'dsa-starter-v1',
    planStartDate: today,
    targetDate: targetDate,
    deadlineMode: 'flexible',
    timezone: 'Asia/Kolkata',
    availability: defaultAvailability,
    schedule: schedule,
    completions: completions,
    studyWorkspace,
    updatedAt: new Date().toISOString()
  };

  return deriveGoalStats(rawGoal);
}

// Current User State in Fixture
let currentUser = null;
try {
  const saved = safeStorage.getItem(AUTH_KEY);
  if (saved) currentUser = JSON.parse(saved);
} catch (e) {
  // SSR or Storage disabled
}

export const apiFixture = {
  isFixture: true,

  // Auth methods
  async getCurrentUser() {
    return currentUser;
  },

  async signIn(email, password = 'password123') {
    const demo = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase()) || {
      email,
      name: email.split('@')[0],
      initialState: null
    };

    currentUser = {
      id: 'usr_' + btoa(demo.email).replace(/=/g, '').slice(0, 12),
      email: demo.email,
      name: demo.name
    };
    safeStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));

    // Check if goal exists in storage; if not and initial state prescribed, initialize
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    if (!safeStorage.getItem(storageKey) && demo.initialState) {
      const seed = createInitialSeedGoal(demo.initialState, currentUser.id);
      safeStorage.setItem(storageKey, JSON.stringify(seed));
    }

    return { user: currentUser, token: 'fixture-jwt-' + currentUser.id };
  },

  async signUp(email, password = 'password123', { fullName, simulateConfirmation = false } = {}) {
    if (!email || !email.includes('@')) {
      const err = new Error('Please enter a valid student email address.');
      err.status = 400;
      err.code = 'INVALID_EMAIL';
      throw err;
    }
    if (!password || password.length < 6) {
      const err = new Error('Password must be at least 6 characters.');
      err.status = 400;
      err.code = 'WEAK_PASSWORD';
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      const err = new Error('An account with this email already exists. Please sign in instead.');
      err.status = 400;
      err.code = 'USER_ALREADY_EXISTS';
      throw err;
    }

    const userObj = {
      id: 'usr_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 12),
      email: cleanEmail,
      name: fullName || cleanEmail.split('@')[0]
    };

    if (simulateConfirmation) {
      return {
        user: userObj,
        token: null,
        session: null,
        confirmationRequired: true
      };
    }

    currentUser = userObj;
    safeStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    return {
      user: currentUser,
      token: 'fixture-jwt-' + currentUser.id,
      session: { access_token: 'fixture-jwt-' + currentUser.id, user: currentUser },
      confirmationRequired: false
    };
  },

  async signOut() {
    currentUser = null;
    safeStorage.removeItem(AUTH_KEY);
    return { ok: true };
  },

  // Health
  async getHealth() {
    return { ok: true, service: 'nextstep-api-fixture', apiVersion: 1 };
  },

  // Catalog
  async getCatalog() {
    return {
      data: {
        trackId: catalogData.trackId,
        title: catalogData.title,
        estimatedMinutes: catalogData.estimatedMinutes,
        notice: catalogData.notice,
        missions: catalogData.missions,
        curriculum: curriculumData
      }
    };
  },

  // Goal
  async getGoal() {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in to access your goal.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) return { data: { goal: null } };
    const goal = JSON.parse(raw);
    return { data: { goal: deriveGoalStats(goal) } };
  },

  // Create Goal
  async createGoal(body) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in to create a goal.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const existingRaw = safeStorage.getItem(storageKey);

    if (existingRaw) {
      const existing = JSON.parse(existingRaw);
      if (existing.creationRequestId === body.creationRequestId) {
        return { data: { goal: deriveGoalStats(existing) } };
      }
      throw { status: 409, code: 'GOAL_EXISTS', message: 'A goal already exists for this student account.' };
    }

    const missionIds = catalogData.missions.map(m => m.id);
    const schedule = calculateSchedule(body.planStartDate, body.availability, missionIds);

    const newGoal = {
      id: 'goal_' + Math.random().toString(36).substring(2, 10),
      version: 1,
      creationRequestId: body.creationRequestId,
      trackId: body.trackId,
      planStartDate: body.planStartDate,
      targetDate: body.targetDate,
      deadlineMode: body.deadlineMode,
      timezone: body.timezone || 'Asia/Kolkata',
      availability: body.availability,
      schedule: schedule,
      completions: {},
      updatedAt: new Date().toISOString()
    };

    safeStorage.setItem(storageKey, JSON.stringify(newGoal));
    return { data: { goal: deriveGoalStats(newGoal) } };
  },

  // Complete Mission
  async completeMission({ missionId, expectedVersion, outcome, reflection }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No goal found.' };

    const goal = JSON.parse(raw);

    // Idempotent check
    if (goal.completions && goal.completions[missionId]) {
      return { data: { goal: deriveGoalStats(goal), alreadyCompleted: true } };
    }

    // Version conflict check
    if (goal.version !== expectedVersion) {
      throw { status: 409, code: 'VERSION_CONFLICT', message: 'Goal version changed. Refresh to view latest plan.' };
    }

    // Prerequisite check
    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) throw { status: 404, code: 'MISSION_NOT_FOUND', message: 'Unknown mission ID.' };

    for (const prereqId of mission.prerequisites) {
      if (!goal.completions || !goal.completions[prereqId]) {
        throw { status: 422, code: 'PREREQUISITE_REQUIRED', message: `Mission ${prereqId} must be completed before ${missionId}.` };
      }
    }

    // Mutate state atomically
    goal.completions = goal.completions || {};
    goal.completions[missionId] = {
      completedAt: new Date().toISOString(),
      outcome: outcome || 'independent',
      reflection: reflection ? reflection.slice(0, 280) : null
    };
    goal.version += 1;
    goal.updatedAt = new Date().toISOString();

    safeStorage.setItem(storageKey, JSON.stringify(goal));
    return { data: { goal: deriveGoalStats(goal), alreadyCompleted: false } };
  },

  // Recovery Preview
  async previewRecovery({ expectedVersion, availability }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No goal found.' };

    const goal = JSON.parse(raw);
    if (goal.version !== expectedVersion) {
      throw { status: 409, code: 'VERSION_CONFLICT', message: 'Goal was modified in another session. Please reload.' };
    }

    const today = getTodayKolkata();
    const effectiveStart = today > goal.planStartDate ? today : goal.planStartDate;

    // Completed today minutes
    const completions = goal.completions || {};
    let completedTodayMinutes = 0;
    Object.values(completions).forEach(c => {
      if (c.completedAt && c.completedAt.slice(0, 10) === today) {
        completedTodayMinutes += 30;
      }
    });

    // Incomplete missions
    const incompleteMissionIds = catalogData.missions
      .filter(m => !completions[m.id])
      .map(m => m.id);

    const proposedSchedule = calculateSchedule(effectiveStart, availability, incompleteMissionIds, completedTodayMinutes);

    // Merge completed schedule entries
    const fullProposedSchedule = [];
    catalogData.missions.forEach(m => {
      if (completions[m.id]) {
        const oldEntry = goal.schedule.find(s => s.missionId === m.id);
        fullProposedSchedule.push(oldEntry || { missionId: m.id, date: goal.planStartDate });
      } else {
        const newEntry = proposedSchedule.find(s => s.missionId === m.id);
        if (newEntry) fullProposedSchedule.push(newEntry);
      }
    });

    const newEstimatedFinish = fullProposedSchedule[fullProposedSchedule.length - 1]?.date || goal.targetDate;
    const proposedTargetDate = goal.deadlineMode === 'flexible'
      ? (newEstimatedFinish > goal.targetDate ? newEstimatedFinish : goal.targetDate)
      : goal.targetDate;

    // Count moved missions
    let movedMissionCount = 0;
    incompleteMissionIds.forEach(mId => {
      const oldDate = goal.schedule.find(s => s.missionId === mId)?.date;
      const newDate = fullProposedSchedule.find(s => s.missionId === mId)?.date;
      if (oldDate !== newDate) movedMissionCount++;
    });

    const isOverCapacity = newEstimatedFinish > proposedTargetDate;
    const status = incompleteMissionIds.length === 0 ? 'completed' : (isOverCapacity ? 'over_capacity' : 'on_track');

    return {
      data: {
        preview: {
          baseVersion: goal.version,
          previewForDate: today,
          availability,
          schedule: fullProposedSchedule,
          estimatedFinishDate: newEstimatedFinish,
          proposedTargetDate: proposedTargetDate,
          status: status,
          remainingMinutes: 30 * incompleteMissionIds.length,
          movedMissionCount
        }
      }
    };
  },

  // Recovery Apply
  async applyRecovery({ expectedVersion, previewForDate, availability }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const today = getTodayKolkata();
    if (previewForDate !== today) {
      throw { status: 409, code: 'STALE_PREVIEW', message: 'Preview is from a different calendar day. Generate a fresh preview.' };
    }

    const { data: { preview } } = await this.previewRecovery({ expectedVersion, availability });

    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    const goal = JSON.parse(raw);

    goal.availability = availability;
    goal.schedule = preview.schedule;
    goal.targetDate = preview.proposedTargetDate;
    goal.version += 1;
    goal.updatedAt = new Date().toISOString();

    safeStorage.setItem(storageKey, JSON.stringify(goal));
    return { data: { goal: deriveGoalStats(goal) } };
  },

  // Ephemeral AI Guidance (Gemini Structured Mock)
  async getGuidance({ expectedVersion, missionId, category, feedback }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No goal found.' };

    const goal = deriveGoalStats(JSON.parse(raw));
    if (goal.version !== expectedVersion) {
      throw { status: 409, code: 'VERSION_CONFLICT', message: 'Goal version changed. Refresh to view latest plan.' };
    }
    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) throw { status: 404, code: 'MISSION_NOT_FOUND', message: 'Mission not found.' };
    if (goal.nextMissionId !== missionId && !goal.completions?.[missionId]) {
      throw { status: 422, code: 'INVALID_MISSION', message: 'Guidance is available for your current mission or previously completed missions.' };
    }

    // Simulate real network delay (500ms)
    await new Promise(r => setTimeout(r, 600));

    let mode = 'standard_practice';
    let explanation = '';
    let steps = [];
    let checkQuestion = '';

    if (category === 'too_difficult') {
      mode = 'guided_practice';
      explanation = `Because you reported difficulty with "${mission.title}" (${feedback ? `"${feedback}"` : 'concept block'}), we will isolate the core pattern with an explicit miniature example before tackling code.`;
      steps = [
        `Write down a tiny 3-element test input on physical paper.`,
        `Trace the algorithm step-by-step without writing full code, observing pointer/index changes.`,
        `Identify the exact condition where the operation terminates.`,
        `Revisit the problem description and solve only for your tiny example.`
      ];
      checkQuestion = `In your mini example, what exact value changes during the first pass?`;
    } else if (category === 'need_revision') {
      mode = 'revision_first';
      const prereq = mission.prerequisites[0];
      const prereqMission = prereq ? catalogData.missions.find(m => m.id === prereq) : null;
      explanation = `To reinforce your foundation before continuing, spend the first 10 minutes recalling ${prereqMission ? prereqMission.title : 'prerequisite concepts'}, then complete the core exercise in the remaining 20 minutes.`;
      steps = [
        `Spend 5 minutes recalling the core lookup or pointer mechanism without checking previous notes.`,
        `Write down the time and space complexity tradeoffs for this pattern.`,
        `Apply this recalled mechanism to the current mission requirements.`
      ];
      checkQuestion = `Why is this approach preferred over brute-force comparison?`;
    } else {
      mode = 'standard_practice';
      explanation = `You are ready to continue with "${mission.title}". Focus on writing clean code and validating boundary cases.`;
      steps = [
        `Implement the solution within a 20-minute timed sprint.`,
        `Test with edge inputs (empty array, single element, negative numbers).`,
        `Record your outcome and any observations in the reflection box.`
      ];
      checkQuestion = `What is the worst-case time complexity of your implemented approach?`;
    }

    return {
      data: {
        guidance: {
          baseVersion: expectedVersion,
          missionId: missionId,
          mode: mode,
          explanation: explanation,
          steps: steps,
          checkQuestion: checkQuestion,
          questionText: checkQuestion,
          questionId: (missionId === 'm02' ? 'q_m02_trace_search' : (missionId === 'm04' ? 'q_m04_duplicate_set' : (missionId === 'm06' ? 'q_m06_hash_map_twosum' : null))),
          source: 'fixture'
        }
      }
    };
  },

  async saveLearningContext({ expectedVersion, missionId, category, whatTried, whereStuck, selfReportedStatus, dismissed, guidance }) {
    await new Promise(r => setTimeout(r, 50));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const goal = JSON.parse(raw);
    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }
    const existingLearning = goal.learning || {};
    const currentRecord = existingLearning[missionId] || {};

    let normalizedGuidance = currentRecord.guidance || null;
    if (guidance !== undefined) {
      if (guidance === null) {
        normalizedGuidance = null;
      } else {
        const qText = guidance.questionText || guidance.checkQuestion || undefined;
        normalizedGuidance = {
          ...guidance,
          questionText: qText,
          checkQuestion: qText
        };
      }
    }

    const updatedRecord = {
      ...currentRecord,
      missionId,
      category: category || currentRecord.category || 'too_difficult',
      whatTried: whatTried !== undefined ? whatTried : (currentRecord.whatTried || ''),
      whereStuck: whereStuck !== undefined ? whereStuck : (currentRecord.whereStuck || ''),
      selfReportedStatus: selfReportedStatus || currentRecord.selfReportedStatus || 'still_unsure',
      dismissed: dismissed !== undefined ? dismissed : (currentRecord.dismissed || false),
      guidance: normalizedGuidance,
      updatedAt: new Date().toISOString()
    };
    goal.version += 1;
    goal.learning = {
      ...existingLearning,
      [missionId]: updatedRecord
    };
    goal.updatedAt = new Date().toISOString();
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        learningRecord: updatedRecord
      }
    };
  },

  async submitLearningCheck({ expectedVersion, missionId, questionId, answer, selfReportedStatus }) {
    await new Promise(r => setTimeout(r, 50));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const goal = JSON.parse(raw);
    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }
    const existingLearning = goal.learning || {};
    const currentRecord = existingLearning[missionId] || {};
    const assessment = {
      questionId,
      answer,
      status: 'on_track',
      explanation: 'Your explanation shows you understand the core mechanics and boundary behaviour.',
      nextStep: 'Continue practising the implementation in your session.',
      assessedAt: new Date().toISOString(),
      source: 'fixture'
    };
    const updatedRecord = {
      ...currentRecord,
      missionId,
      selfReportedStatus: selfReportedStatus || 'ready_to_continue',
      assessment,
      updatedAt: new Date().toISOString()
    };
    goal.version += 1;
    goal.learning = {
      ...existingLearning,
      [missionId]: updatedRecord
    };
    goal.updatedAt = new Date().toISOString();
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        assessment: {
          missionId,
          questionId,
          ...assessment
        }
      }
    };
  },

  async saveRecallAttempt({ expectedVersion, missionId, attemptId, attemptText, confidence }) {
    await new Promise(r => setTimeout(r, 50));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const goal = JSON.parse(raw);
    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) throw { status: 404, code: 'MISSION_NOT_FOUND', message: 'Mission not found.' };

    const derivedGoal = deriveGoalStats(goal);
    if (derivedGoal.nextMissionId !== missionId && !goal.completions?.[missionId]) {
      throw { status: 422, code: 'MISSION_NOT_ELIGIBLE', message: 'Recall reviews are available for your current mission or previously completed missions.' };
    }

    const trimmedText = typeof attemptText === 'string' ? attemptText.trim() : '';
    if (!trimmedText || trimmedText.length > 2000) {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'Attempt text must be between 1 and 2000 characters.' };
    }
    const confInt = Number(confidence);
    if (!Number.isInteger(confInt) || confInt < 1 || confInt > 5) {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'Confidence must be an integer between 1 and 5.' };
    }
    if (!attemptId || typeof attemptId !== 'string') {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'A valid attemptId UUID is required.' };
    }

    const existingLearning = goal.learning || {};
    const currentRecord = existingLearning[missionId] || {};
    const existingHistory = Array.isArray(currentRecord.recallHistory) ? currentRecord.recallHistory : [];

    // Duplicate retry check
    const existingAttempt = existingHistory.find(a => a.attemptId === attemptId);
    if (existingAttempt) {
      if (existingAttempt.attemptText === trimmedText && existingAttempt.confidence === confInt) {
        return {
          data: {
            goal: deriveGoalStats(goal),
            recallAttempt: existingAttempt
          }
        };
      }
      throw { status: 409, code: 'ATTEMPT_CONFLICT', message: 'An attempt with this ID was already recorded with different content.' };
    }

    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const intervals = { 1: 1, 2: 2, 3: 3, 4: 7, 5: 14 };
    const today = getTodayKolkata();
    const nextReviewDate = addDays(today, intervals[confInt] || 1);
    const nowIso = new Date().toISOString();

    const newAttempt = {
      attemptId,
      attemptText: trimmedText,
      confidence: confInt,
      savedAt: nowIso,
      nextReviewDate
    };

    const updatedHistory = [...existingHistory, newAttempt].slice(-20);
    const updatedRecord = {
      ...currentRecord,
      missionId,
      recallHistory: updatedHistory,
      updatedAt: nowIso
    };

    goal.version += 1;
    goal.learning = {
      ...existingLearning,
      [missionId]: updatedRecord
    };
    goal.updatedAt = nowIso;
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        recallAttempt: newAttempt
      }
    };
  },

  async saveLessonProgress({
    expectedVersion,
    requestId,
    lessonId,
    topicId,
    status,
    completedSections,
    reflection,
    knowledgeCheckPassed
  }) {
    await new Promise((r) => setTimeout(r, 30));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const lesson = (curriculumData.lessons || []).find((l) => l.id === lessonId);
    if (!lesson) {
      throw { status: 404, code: 'ITEM_NOT_FOUND', message: `Published lesson "${lessonId}" does not exist.` };
    }
    if (!requestId || typeof requestId !== 'string') {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'A valid requestId UUID is required.' };
    }
    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'Invalid lesson status.' };
    }

    const goal = JSON.parse(raw);
    const workspace = normalizeStudyWorkspace(goal.studyWorkspace);
    const existingRecord = workspace.lessonProgress[lessonId];

    if (existingRecord && existingRecord.lastRequestId === requestId) {
      return {
        data: {
          goal: deriveGoalStats(goal),
          lessonProgress: existingRecord
        }
      };
    }

    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const trimmedReflection =
      typeof reflection === 'string' ? reflection.trim().slice(0, 500) : (reflection ?? existingRecord?.reflection ?? null);

    const updatedRecord = {
      lessonId,
      topicId: topicId || lesson.topicId,
      status,
      startedAt: existingRecord?.startedAt || nowIso,
      lastVisitedAt: nowIso,
      completedSections: completedSections ?? existingRecord?.completedSections ?? [],
      reflection: trimmedReflection,
      knowledgeCheckPassed:
        knowledgeCheckPassed !== undefined ? Boolean(knowledgeCheckPassed) : Boolean(existingRecord?.knowledgeCheckPassed),
      lastRequestId: requestId,
      updatedAt: nowIso
    };

    goal.version += 1;
    goal.studyWorkspace = {
      ...workspace,
      selectedTopicId: topicId || lesson.topicId,
      lessonProgress: {
        ...workspace.lessonProgress,
        [lessonId]: updatedRecord
      },
      updatedAt: nowIso
    };
    goal.updatedAt = nowIso;
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        lessonProgress: updatedRecord
      }
    };
  },

  async saveExerciseAttempt({
    expectedVersion,
    attemptId,
    exerciseId,
    variantKey = 'primary',
    stepAnswers = [],
    edgeChoiceId,
    mistakeCount = 0,
    hintRevealed = false,
    referenceRevealed = false,
    reflection = null,
    outcome
  }) {
    await new Promise((r) => setTimeout(r, 30));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const exercise = getAuthoritativeExercise(exerciseId);
    if (!exercise) {
      throw { status: 404, code: 'ITEM_NOT_FOUND', message: `Published exercise "${exerciseId}" does not exist.` };
    }
    if (!attemptId || typeof attemptId !== 'string') {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'A valid attemptId UUID is required.' };
    }

    if (!Array.isArray(stepAnswers) || stepAnswers.length === 0 || !edgeChoiceId) {
      throw { status: 422, code: 'INCOMPLETE_TRACE', message: 'Trace steps and edge case verification must be completed.' };
    }

    const grading = gradeExerciseAttempt({ exerciseId, variantKey, stepAnswers, edgeChoiceId });
    if (!grading.valid) {
      throw { status: 422, code: grading.code || 'VALIDATION_ERROR', message: grading.message };
    }

    let authoritativeOutcome = 'independent';
    if (referenceRevealed) authoritativeOutcome = 'needed_reference';
    else if (hintRevealed || mistakeCount > 0) authoritativeOutcome = 'with_hint';

    const goal = JSON.parse(raw);
    const workspace = normalizeStudyWorkspace(goal.studyWorkspace);
    const existingList = Array.isArray(workspace.exerciseAttempts[exerciseId])
      ? workspace.exerciseAttempts[exerciseId]
      : [];
    const normalizedReflection = typeof reflection === 'string' ? reflection.trim().slice(0, 500) : null;

    const existingAttempt = existingList.find((a) => a.attemptId === attemptId);
    if (existingAttempt) {
      if (
        existingAttempt.outcome === authoritativeOutcome &&
        (existingAttempt.variantKey || 'primary') === variantKey &&
        existingAttempt.mistakeCount === mistakeCount &&
        existingAttempt.hintRevealed === Boolean(hintRevealed) &&
        existingAttempt.referenceRevealed === Boolean(referenceRevealed) &&
        (existingAttempt.reflection ?? null) === normalizedReflection
      ) {
        return {
          data: {
            goal: deriveGoalStats(goal),
            exerciseAttempt: existingAttempt
          }
        };
      }
      throw {
        status: 409,
        code: 'ATTEMPT_CONFLICT',
        message: 'An exercise attempt with this ID was already recorded with different content.'
      };
    }

    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const today = getTodayKolkata();
    let daysToAdd = 7;
    if (authoritativeOutcome === 'needed_reference') daysToAdd = 1;
    else if (authoritativeOutcome === 'with_hint') daysToAdd = 2;
    else if (mistakeCount > 0) daysToAdd = 3;

    const nowIso = new Date().toISOString();
    const newAttempt = {
      attemptId,
      exerciseId,
      lessonId: exercise.lessonId,
      topicId: exercise.topicId,
      variantKey,
      outcome: authoritativeOutcome,
      mistakeCount: Number(mistakeCount) || 0,
      hintRevealed: Boolean(hintRevealed),
      referenceRevealed: Boolean(referenceRevealed),
      reflection: normalizedReflection,
      savedAt: nowIso,
      nextReviewDate: addDays(today, daysToAdd)
    };

    const updatedHistory = [...existingList, newAttempt].slice(-20);
    goal.version += 1;
    goal.studyWorkspace = {
      ...workspace,
      selectedTopicId: exercise.topicId,
      exerciseAttempts: {
        ...workspace.exerciseAttempts,
        [exerciseId]: updatedHistory
      },
      updatedAt: nowIso
    };
    goal.updatedAt = nowIso;
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        exerciseAttempt: newAttempt
      }
    };
  },

  async evaluateTraceStep({ exerciseId, variantKey = 'primary', stepIndex, choiceId }) {
    await new Promise((r) => setTimeout(r, 10));
    const exercise = getAuthoritativeExercise(exerciseId);
    if (!exercise) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Exercise not found.' };
    const variant = variantKey === 'alternate' ? exercise.alternateVariant : exercise.primaryVariant;
    const step = (variant?.steps || []).find((s) => s.stepIndex === Number(stepIndex));
    if (!step) throw { status: 404, code: 'STEP_NOT_FOUND', message: 'Step not found.' };
    const choice = (step.choices || []).find((c) => c.id === choiceId);
    if (!choice) throw { status: 404, code: 'CHOICE_NOT_FOUND', message: 'Choice not found.' };
    return {
      data: {
        isCorrect: Boolean(choice.isCorrect),
        feedback: choice.misconceptionFeedback || '',
        explanation: choice.isCorrect ? step.correctExplanation || null : null
      }
    };
  },

  async evaluateEdgeCheck({ exerciseId, choiceId }) {
    await new Promise((r) => setTimeout(r, 10));
    const exercise = getAuthoritativeExercise(exerciseId);
    if (!exercise || !exercise.edgeCaseCheck) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Exercise not found.' };
    const choice = (exercise.edgeCaseCheck.choices || []).find((c) => c.id === choiceId);
    if (!choice) throw { status: 404, code: 'CHOICE_NOT_FOUND', message: 'Edge check choice not found.' };
    return {
      data: {
        isCorrect: Boolean(choice.isCorrect),
        feedback: choice.misconceptionFeedback || '',
        explanation: choice.isCorrect ? exercise.edgeCaseCheck.explanation || null : null
      }
    };
  },

  async evaluateLessonCheck({ lessonId, optionId }) {
    await new Promise((r) => setTimeout(r, 10));
    const lesson = getAuthoritativeLesson(lessonId);
    if (!lesson || !lesson.knowledgeCheck) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Lesson not found.' };
    const opt = (lesson.knowledgeCheck.options || []).find((o) => o.id === optionId);
    if (!opt) throw { status: 404, code: 'OPTION_NOT_FOUND', message: 'Option not found.' };
    const isCorrect = optionId === lesson.knowledgeCheck.correctOptionId;
    return {
      data: {
        isCorrect,
        feedback: opt.feedback || '',
        explanation: isCorrect ? lesson.knowledgeCheck.explanation || null : null
      }
    };
  },

  async getExerciseReference(exerciseId) {
    await new Promise((r) => setTimeout(r, 10));
    const exercise = getAuthoritativeExercise(exerciseId);
    if (!exercise) throw { status: 404, code: 'ITEM_NOT_FOUND', message: 'Exercise not found.' };
    return {
      data: {
        exerciseId,
        referenceInvariant: exercise.referenceInvariant || null,
        edgeCaseNote: exercise.primaryVariant?.edgeCaseNote || null,
        referenceImplementation: exercise.referenceImplementation || null
      }
    };
  },

  async savePracticeAttempt({
    expectedVersion,
    attemptId,
    problemId,
    outcome,
    note = null,
    needsReview
  }) {
    await new Promise((r) => setTimeout(r, 30));
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const problem = (curriculumData.practiceProblems || []).find((p) => p.id === problemId);
    if (!problem) {
      throw { status: 404, code: 'ITEM_NOT_FOUND', message: `Published practice problem "${problemId}" does not exist.` };
    }
    if (!attemptId || typeof attemptId !== 'string') {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'A valid attemptId UUID is required.' };
    }

    const goal = JSON.parse(raw);
    const workspace = normalizeStudyWorkspace(goal.studyWorkspace);
    const existingList = Array.isArray(workspace.practiceAttempts[problemId])
      ? workspace.practiceAttempts[problemId]
      : [];
    const normalizedNote = typeof note === 'string' ? note.trim().slice(0, 500) : null;
    const normalizedNeedsReview = Boolean(
      needsReview !== undefined
        ? needsReview
        : outcome === 'with_hint' || outcome === 'reviewed_editorial' || outcome === 'bookmarked'
    );

    const existingAttempt = existingList.find((a) => a.attemptId === attemptId);
    if (existingAttempt) {
      if (
        existingAttempt.outcome === outcome &&
        (existingAttempt.note ?? null) === normalizedNote &&
        Boolean(existingAttempt.needsReview) === normalizedNeedsReview
      ) {
        return {
          data: {
            goal: deriveGoalStats(goal),
            practiceAttempt: existingAttempt
          }
        };
      }
      throw {
        status: 409,
        code: 'ATTEMPT_CONFLICT',
        message: 'A practice attempt with this ID was already recorded with different content.'
      };
    }

    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const today = getTodayKolkata();
    let daysToAdd = 7;
    if (normalizedNeedsReview || outcome === 'reviewed_editorial' || outcome === 'bookmarked') daysToAdd = 1;
    else if (outcome === 'with_hint') daysToAdd = 2;

    const nowIso = new Date().toISOString();
    const newAttempt = {
      attemptId,
      problemId,
      topicId: problem.topicId,
      outcome,
      note: normalizedNote,
      needsReview: normalizedNeedsReview,
      selfReported: true,
      savedAt: nowIso,
      nextReviewDate: addDays(today, daysToAdd)
    };

    const updatedHistory = [...existingList, newAttempt].slice(-20);
    goal.version += 1;
    goal.studyWorkspace = {
      ...workspace,
      selectedTopicId: problem.topicId,
      practiceAttempts: {
        ...workspace.practiceAttempts,
        [problemId]: updatedHistory
      },
      updatedAt: nowIso
    };
    goal.updatedAt = nowIso;
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        practiceAttempt: newAttempt
      }
    };
  },

  async previewWorkspacePlan({ expectedVersion, availability, selectedItemIds, targetDate }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const goal = JSON.parse(raw);
    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const sumAvail = Object.values(availability || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    if (sumAvail <= 0) {
      throw { status: 422, code: 'VALIDATION_ERROR', message: 'At least one day must have nonzero availability.' };
    }

    const today = getTodayKolkata();
    const workspace = normalizeStudyWorkspace(goal.studyWorkspace);
    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: targetDate || goal.targetDate,
      availability,
      selectedItemIds,
      curriculum: curriculumData,
      studyWorkspace: workspace
    });

    return {
      data: {
        previewForDate: today,
        baseVersion: goal.version,
        curriculumVersion: workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION,
        ...plan
      }
    };
  },

  async applyWorkspacePlan({
    expectedVersion,
    previewForDate,
    curriculumVersion,
    availability,
    selectedItemIds,
    targetDate
  }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = safeStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No active goal found.' };

    const today = getTodayKolkata();
    if (previewForDate !== today) {
      const err = new Error('This study plan preview was generated for a different day.');
      err.code = 'STALE_PREVIEW';
      err.status = 409;
      throw err;
    }

    const goal = JSON.parse(raw);
    if (goal.version !== expectedVersion) {
      const err = new Error('Goal version changed.');
      err.code = 'VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const workspace = normalizeStudyWorkspace(goal.studyWorkspace);
    const activeCurriculumVersion = workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION;
    if (curriculumVersion && curriculumVersion !== activeCurriculumVersion) {
      const err = new Error('Curriculum version changed since preview.');
      err.code = 'CURRICULUM_VERSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: targetDate || goal.targetDate,
      availability,
      selectedItemIds,
      curriculum: curriculumData,
      studyWorkspace: workspace
    });

    const nowIso = new Date().toISOString();
    const savedStudyPlan = {
      planId: 'plan-' + Math.random().toString(36).slice(2, 10),
      createdAt: nowIso,
      baseVersion: goal.version + 1,
      curriculumVersion: activeCurriculumVersion,
      ...plan
    };

    goal.version += 1;
    goal.studyWorkspace = {
      ...workspace,
      studyPlan: savedStudyPlan,
      updatedAt: nowIso
    };
    goal.updatedAt = nowIso;
    safeStorage.setItem(storageKey, JSON.stringify(goal));

    return {
      data: {
        goal: deriveGoalStats(goal),
        studyPlan: savedStudyPlan
      }
    };
  }
};
