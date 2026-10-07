import { Router } from 'express';
import { catalogData } from './catalog.js';
import {
  createGoalSchema,
  completeMissionSchema,
  recoveryPreviewSchema,
  recoveryApplySchema,
  guidanceSchema
} from '../schemas/goalSchemas.js';
import {
  getTodayKolkata,
  calculateSchedule,
  deriveGoalStats
} from '../services/scheduler.js';

const router = Router();

// GET /api/goal
router.get('/', async (req, res, next) => {
  try {
    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      const err = new Error(error.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    if (!row) {
      return res.status(200).json({ data: { goal: null } });
    }

    return res.status(200).json({
      data: { goal: deriveGoalStats(row.state, catalogData) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal - Idempotent goal creation
router.post('/', async (req, res, next) => {
  try {
    const parseResult = createGoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid goal creation payload.',
          fields
        }
      });
    }

    const payload = parseResult.data;

    // Check existing goal for this owner
    const { data: existing, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      const err = new Error(findError.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    if (existing) {
      if (existing.creation_request_id === payload.creationRequestId) {
        return res.status(200).json({
          data: { goal: deriveGoalStats(existing.state, catalogData) }
        });
      }
      return res.status(409).json({
        error: {
          code: 'GOAL_EXISTS',
          message: 'A goal already exists for this student account. Please load your active goal.'
        }
      });
    }

    // Schedule missions
    const missionIds = catalogData.missions.map(m => m.id);
    const schedule = calculateSchedule(payload.planStartDate, payload.availability, missionIds);

    const goalId = crypto.randomUUID();
    const rawGoal = {
      id: goalId,
      version: 1,
      creationRequestId: payload.creationRequestId,
      trackId: payload.trackId,
      planStartDate: payload.planStartDate,
      targetDate: payload.targetDate,
      deadlineMode: payload.deadlineMode,
      timezone: payload.timezone,
      availability: payload.availability,
      schedule: schedule,
      completions: {},
      updatedAt: new Date().toISOString()
    };

    const { error: insertError } = await req.supabase
      .from('nextstep_goals')
      .insert({
        id: goalId,
        creation_request_id: payload.creationRequestId,
        version: 1,
        state: rawGoal,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: {
            code: 'GOAL_EXISTS',
            message: 'A goal already exists for this student account.'
          }
        });
      }
      const err = new Error(insertError.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    return res.status(201).json({
      data: { goal: deriveGoalStats(rawGoal, catalogData) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/complete - Complete mission with version and prerequisite checks
router.post('/complete', async (req, res, next) => {
  try {
    const parseResult = completeMissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid mission completion payload.',
          fields
        }
      });
    }

    const { missionId, expectedVersion, outcome, reflection } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      const err = new Error(findError.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    if (!row) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'No active goal found for this student account.'
        }
      });
    }

    const goalState = row.state;

    // Idempotent completion check
    if (goalState.completions && goalState.completions[missionId]) {
      return res.status(200).json({
        data: {
          goal: deriveGoalStats(goalState, catalogData),
          alreadyCompleted: true
        }
      });
    }

    // Version conflict check
    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest plan.'
        }
      });
    }

    // Prerequisite check
    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({
        error: {
          code: 'MISSION_NOT_FOUND',
          message: `Mission with ID "${missionId}" does not exist in track.`
        }
      });
    }

    for (const prereqId of mission.prerequisites) {
      if (!goalState.completions || !goalState.completions[prereqId]) {
        return res.status(422).json({
          error: {
            code: 'PREREQUISITE_REQUIRED',
            message: `Mission ${prereqId} must be completed before ${missionId}.`
          }
        });
      }
    }

    // Mutate state atomically
    const newVersion = row.version + 1;
    const nowIso = new Date().toISOString();
    const updatedState = {
      ...goalState,
      version: newVersion,
      completions: {
        ...(goalState.completions || {}),
        [missionId]: {
          completedAt: nowIso,
          outcome: outcome,
          reflection: reflection ? reflection.slice(0, 280) : null
        }
      },
      updatedAt: nowIso
    };

    const { data: updatedRows, error: updateError } = await req.supabase
      .from('nextstep_goals')
      .update({
        version: newVersion,
        state: updatedState,
        updated_at: nowIso
      })
      .eq('id', row.id)
      .eq('version', row.version)
      .select();

    if (updateError || !updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest plan.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        alreadyCompleted: false
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/recovery/preview
router.post('/recovery/preview', async (req, res, next) => {
  try {
    const parseResult = recoveryPreviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recovery preview payload.'
        }
      });
    }

    const { expectedVersion, availability } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError || !row) {
      return res.status(row ? 503 : 404).json({
        error: {
          code: row ? 'DATABASE_ERROR' : 'GOAL_NOT_FOUND',
          message: row ? findError.message : 'No active goal found.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified in another session. Please reload.'
        }
      });
    }

    const goal = row.state;
    const today = getTodayKolkata();
    const effectiveStart = today > goal.planStartDate ? today : goal.planStartDate;

    const completions = goal.completions || {};
    let completedTodayMinutes = 0;
    Object.values(completions).forEach(c => {
      if (c.completedAt && c.completedAt.slice(0, 10) === today) {
        completedTodayMinutes += 30;
      }
    });

    const incompleteMissionIds = catalogData.missions
      .filter(m => !completions[m.id])
      .map(m => m.id);

    const proposedSchedule = calculateSchedule(
      effectiveStart,
      availability,
      incompleteMissionIds,
      completedTodayMinutes
    );

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

    let movedMissionCount = 0;
    incompleteMissionIds.forEach(mId => {
      const oldDate = goal.schedule.find(s => s.missionId === mId)?.date;
      const newDate = fullProposedSchedule.find(s => s.missionId === mId)?.date;
      if (oldDate !== newDate) movedMissionCount++;
    });

    const isOverCapacity = newEstimatedFinish > proposedTargetDate;
    const status = incompleteMissionIds.length === 0 ? 'completed' : (isOverCapacity ? 'over_capacity' : 'on_track');

    return res.status(200).json({
      data: {
        preview: {
          baseVersion: row.version,
          previewForDate: today,
          availability,
          schedule: fullProposedSchedule,
          estimatedFinishDate: newEstimatedFinish,
          proposedTargetDate: proposedTargetDate,
          status,
          remainingMinutes: 30 * incompleteMissionIds.length,
          movedMissionCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/recovery/apply
router.post('/recovery/apply', async (req, res, next) => {
  try {
    const parseResult = recoveryApplySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recovery apply payload.'
        }
      });
    }

    const { expectedVersion, previewForDate, availability } = parseResult.data;
    const today = getTodayKolkata();

    if (previewForDate !== today) {
      return res.status(409).json({
        error: {
          code: 'STALE_PREVIEW',
          message: 'Preview is from a different calendar day. Generate a fresh preview.'
        }
      });
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError || !row) {
      return res.status(row ? 503 : 404).json({
        error: {
          code: row ? 'DATABASE_ERROR' : 'GOAL_NOT_FOUND',
          message: row ? findError.message : 'No active goal found.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Generate a fresh preview.'
        }
      });
    }

    const goal = row.state;
    const effectiveStart = today > goal.planStartDate ? today : goal.planStartDate;
    const completions = goal.completions || {};
    let completedTodayMinutes = 0;
    Object.values(completions).forEach(c => {
      if (c.completedAt && c.completedAt.slice(0, 10) === today) {
        completedTodayMinutes += 30;
      }
    });

    const incompleteMissionIds = catalogData.missions
      .filter(m => !completions[m.id])
      .map(m => m.id);

    const proposedSchedule = calculateSchedule(
      effectiveStart,
      availability,
      incompleteMissionIds,
      completedTodayMinutes
    );

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

    const newVersion = row.version + 1;
    const nowIso = new Date().toISOString();
    const updatedState = {
      ...goal,
      version: newVersion,
      availability,
      schedule: fullProposedSchedule,
      targetDate: proposedTargetDate,
      updatedAt: nowIso
    };

    const { data: updatedRows, error: updateError } = await req.supabase
      .from('nextstep_goals')
      .update({
        version: newVersion,
        state: updatedState,
        updated_at: nowIso
      })
      .eq('id', row.id)
      .eq('version', row.version)
      .select();

    if (updateError || !updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest plan.'
        }
      });
    }

    return res.status(200).json({
      data: { goal: deriveGoalStats(updatedState, catalogData) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/guidance - AI guidance endpoint (read-only)
router.post('/guidance', async (req, res, next) => {
  try {
    const parseResult = guidanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid guidance request payload.'
        }
      });
    }

    const { expectedVersion, missionId, category, feedback } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError || !row) {
      return res.status(row ? 503 : 404).json({
        error: {
          code: row ? 'DATABASE_ERROR' : 'GOAL_NOT_FOUND',
          message: row ? findError.message : 'No active goal found.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest plan.'
        }
      });
    }

    const goal = deriveGoalStats(row.state, catalogData);
    if (!goal.nextMissionId) {
      return res.status(422).json({
        error: {
          code: 'NO_PENDING_MISSION',
          message: 'All missions are already completed.'
        }
      });
    }

    if (goal.nextMissionId !== missionId) {
      return res.status(422).json({
        error: {
          code: 'INVALID_MISSION',
          message: `Guidance is only applicable to the active mission (${goal.nextMissionId}).`
        }
      });
    }

    const mission = catalogData.missions.find(m => m.id === missionId);

    // AI guidance generator
    let mode = 'standard_practice';
    let explanation = `You are ready to continue with "${mission.title}". Focus on writing clean code and validating boundary cases.`;
    let steps = [
      'Implement the solution within a 20-minute timed sprint.',
      'Test with edge inputs (empty array, single element, negative numbers).',
      'Record your outcome and any observations in the reflection box.'
    ];
    let checkQuestion = 'What is the worst-case time complexity of your implemented approach?';

    if (category === 'too_difficult') {
      mode = 'guided_practice';
      explanation = `Because you reported difficulty with "${mission.title}" (${feedback ? `"${feedback}"` : 'concept block'}), we will isolate the core pattern with an explicit miniature example before tackling code.`;
      steps = [
        'Write down a tiny 3-element test input on physical paper.',
        'Trace the algorithm step-by-step without writing full code, observing pointer/index changes.',
        'Identify the exact condition where the operation terminates.',
        'Revisit the problem description and solve only for your tiny example.'
      ];
      checkQuestion = 'In your mini example, what exact value changes during the first pass?';
    } else if (category === 'need_revision') {
      mode = 'revision_first';
      const prereq = mission.prerequisites[0];
      const prereqMission = prereq ? catalogData.missions.find(m => m.id === prereq) : null;
      explanation = `To reinforce your foundation before continuing, spend the first 10 minutes recalling ${prereqMission ? prereqMission.title : 'prerequisite concepts'}, then complete the core exercise in the remaining 20 minutes.`;
      steps = [
        'Spend 5 minutes recalling the core lookup or pointer mechanism without checking previous notes.',
        'Write down the time and space complexity tradeoffs for this pattern.',
        'Apply this recalled mechanism to the current mission requirements.'
      ];
      checkQuestion = 'Why is this approach preferred over brute-force comparison?';
    }

    return res.status(200).json({
      data: {
        guidance: {
          baseVersion: expectedVersion,
          missionId: missionId,
          mode,
          explanation,
          steps,
          checkQuestion,
          source: 'gemini'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
