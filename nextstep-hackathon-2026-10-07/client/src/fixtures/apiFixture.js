// NextStep Development Fixture Adapter
// Conforms to API-V1.md and AI Guidance extension contracts.
// Used for unblocked UI development and fixture demonstration.

import catalogData from './dsa-starter.json' with { type: 'json' };

const STORAGE_KEY_PREFIX = 'nextstep_fixture_goal_';
const AUTH_KEY = 'nextstep_fixture_user';

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
  const estimatedFinish = schedule[schedule.length - 1].date;
  const targetDate = addDays(today, 30);

  let completions = {};
  if (stateType === 'active') {
    completions['m01'] = {
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      outcome: 'independent',
      reflection: 'Reviewed basic array indexing and linear scans.'
    };
  } else if (stateType === 'interrupted') {
    completions['m01'] = {
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      outcome: 'independent',
      reflection: 'Built mental model for array indexing.'
    };
    completions['m02'] = {
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      outcome: 'with_hint',
      reflection: 'Trace lookups took extra time on boundary conditions.'
    };
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
    updatedAt: new Date().toISOString()
  };

  return deriveGoalStats(rawGoal);
}

// Current User State in Fixture
let currentUser = null;
try {
  const saved = localStorage.getItem(AUTH_KEY);
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
    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));

    // Check if goal exists in storage; if not and initial state prescribed, initialize
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    if (!localStorage.getItem(storageKey) && demo.initialState) {
      const seed = createInitialSeedGoal(demo.initialState, currentUser.id);
      localStorage.setItem(storageKey, JSON.stringify(seed));
    }

    return { user: currentUser, token: 'fixture-jwt-' + currentUser.id };
  },

  async signOut() {
    currentUser = null;
    localStorage.removeItem(AUTH_KEY);
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
        missions: catalogData.missions
      }
    };
  },

  // Goal
  async getGoal() {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in to access your goal.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { data: { goal: null } };
    const goal = JSON.parse(raw);
    return { data: { goal: deriveGoalStats(goal) } };
  },

  // Create Goal
  async createGoal(body) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in to create a goal.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const existingRaw = localStorage.getItem(storageKey);

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

    localStorage.setItem(storageKey, JSON.stringify(newGoal));
    return { data: { goal: deriveGoalStats(newGoal) } };
  },

  // Complete Mission
  async completeMission({ missionId, expectedVersion, outcome, reflection }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = localStorage.getItem(storageKey);
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

    localStorage.setItem(storageKey, JSON.stringify(goal));
    return { data: { goal: deriveGoalStats(goal), alreadyCompleted: false } };
  },

  // Recovery Preview
  async previewRecovery({ expectedVersion, availability }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = localStorage.getItem(storageKey);
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
    const raw = localStorage.getItem(storageKey);
    const goal = JSON.parse(raw);

    goal.availability = availability;
    goal.schedule = preview.schedule;
    goal.targetDate = preview.proposedTargetDate;
    goal.version += 1;
    goal.updatedAt = new Date().toISOString();

    localStorage.setItem(storageKey, JSON.stringify(goal));
    return { data: { goal: deriveGoalStats(goal) } };
  },

  // Ephemeral AI Guidance (Gemini Structured Mock)
  async getGuidance({ expectedVersion, missionId, category, feedback }) {
    if (!currentUser) throw { status: 401, code: 'UNAUTHORIZED', message: 'Sign in required.' };
    const storageKey = STORAGE_KEY_PREFIX + currentUser.id;
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw { status: 404, code: 'GOAL_NOT_FOUND', message: 'No goal found.' };

    const goal = deriveGoalStats(JSON.parse(raw));
    if (goal.version !== expectedVersion) {
      throw { status: 409, code: 'VERSION_CONFLICT', message: 'Goal version changed. Refresh to view latest plan.' };
    }
    if (goal.nextMissionId !== missionId) {
      throw { status: 422, code: 'INVALID_MISSION', message: `Guidance is only applicable to the active mission (${goal.nextMissionId}).` };
    }

    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) throw { status: 404, code: 'MISSION_NOT_FOUND', message: 'Mission not found.' };

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
          source: 'gemini'
        }
      }
    };
  }
};
