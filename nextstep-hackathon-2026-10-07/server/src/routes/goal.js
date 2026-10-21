import { Router } from 'express';
import crypto from 'node:crypto';
import { catalogData } from './catalog.js';
import {
  createGoalSchema,
  renameGoalSchema,
  completeMissionSchema,
  recoveryPreviewSchema,
  recoveryApplySchema,
  guidanceSchema,
  saveLearningContextSchema,
  submitLearningCheckSchema,
  recallAttemptSchema,
  CONFIDENCE_INTERVALS,
  calculateNextReviewDate,
  saveLessonProgressSchema,
  saveExerciseAttemptSchema,
  savePracticeAttemptSchema,
  workspacePlanPreviewSchema,
  workspacePlanApplySchema,
  calculateExerciseReviewDate,
  calculatePracticeReviewDate,
  checkpointDraftSchema,
  checkpointEvaluateSchema,
  checkpointSkipSchema,
  checkpointResetSchema,
  continuationPlanPreviewSchema,
  continuationPlanApplySchema,
  practiceSessionStartSchema,
  practiceSessionUpdateSchema
} from '../schemas/goalSchemas.js';
import {
  getTodayKolkata,
  getDateKolkata,
  addDays,
  completedMinutesOnDate,
  calculateSchedule,
  deriveGoalStats,
  normalizeStudyWorkspace,
  calculateWorkspaceStudyPlan,
  DEFAULT_CURRICULUM_VERSION
} from '../services/scheduler.js';
import {
  getPublishedCurriculum,
  getAuthoritativeLesson,
  getAuthoritativeExercise,
  gradeExerciseAttempt
} from '../services/curriculumRegistry.js';
import {
  FOUNDATIONS_CHECKPOINTS,
  getStudentSafeCheckpoint,
  gradeCheckpointAttempt,
  validateCheckpointData,
  isIdenticalCheckpointAttempt
} from '../data/foundationsCheckpoint.js';
import { config, isAiConfigured, getMissingAiConfig } from '../config.js';
import { generateGeminiGuidance, assessUnderstandingAnswer } from '../services/guidance.js';
import { checkRateLimit } from '../services/rateLimiter.js';
import { getCuratedCheckForMission } from '../services/curatedChecks.js';

const router = Router();

// The publishable key is public. A deployment may supply a stable private key;
// otherwise a process-local key keeps preview tokens unforgeable.
const PREVIEW_SIGNING_SECRET = config.PREVIEW_SIGNING_SECRET
  ? Buffer.from(config.PREVIEW_SIGNING_SECRET)
  : crypto.randomBytes(32);

const recentPlanPreviews = new Map();

function generatePreviewToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const encoded = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', PREVIEW_SIGNING_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyPreviewToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', PREVIEW_SIGNING_SECRET).update(encoded).digest('base64url');
  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

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

// PATCH /api/goal - Rename without changing schedule or completion history.
router.patch('/', async (req, res, next) => {
  try {
    const parsed = renameGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter a goal name of 1 to 80 characters and a valid version.' } });
    const { data: row, error } = await req.supabase.from('nextstep_goals').select('*').maybeSingle();
    if (error) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not load your goal. Please retry.' } });
    if (!row) return res.status(404).json({ error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' } });
    if (row.version !== parsed.data.expectedVersion) return res.status(409).json({ error: { code: 'VERSION_CONFLICT', message: 'Your goal changed. Refresh and try again.' } });
    const now = new Date().toISOString();
    const state = { ...row.state, goalName: parsed.data.goalName, version: row.version + 1, updatedAt: now };
    const { data: saved, error: saveError } = await req.supabase.from('nextstep_goals')
      .update({ state, version: state.version, updated_at: now }).eq('id', row.id).eq('version', row.version).select();
    if (saveError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not save your goal name. Please retry.' } });
    if (!saved?.length) return res.status(409).json({ error: { code: 'VERSION_CONFLICT', message: 'Your goal changed. Refresh and try again.' } });
    return res.json({ data: { goal: deriveGoalStats(state, catalogData) } });
  } catch (err) { next(err); }
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
      goalName: payload.goalName || 'Build my DSA foundations',
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

    if (updateError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not save your plan. Please try again.' } });
    if (!updatedRows || updatedRows.length === 0) {
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

    if (findError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not load your plan. Please try again.' } });
    if (!row) return res.status(404).json({ error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' } });

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
    const completedTodayMinutes = completedMinutesOnDate(completions, today);

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

    if (findError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not load your plan. Please try again.' } });
    if (!row) return res.status(404).json({ error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' } });

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
    const completedTodayMinutes = completedMinutesOnDate(completions, today);

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

    if (updateError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not save your plan. Please try again.' } });
    if (!updatedRows || updatedRows.length === 0) {
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
    // 1. Validate request body
    const parseResult = guidanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid guidance request payload.',
          fields
        }
      });
    }

    const { expectedVersion, missionId, category, feedback, whatTried, whereStuck } = parseResult.data;

    // 2. Per-user rate limiting (sliding window: 5 requests per 60s)
    const rateLimitKey = req.user?.id || req.ip;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      res.set('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many guidance requests. Please wait ${rateLimit.retryAfterSeconds}s before requesting guidance again.`
        }
      });
    }

    // 3. Load user's goal
    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) return res.status(503).json({ error: { code: 'DATABASE_ERROR', message: 'Could not load your plan. Please try again.' } });
    if (!row) return res.status(404).json({ error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' } });

    // 4. Validate goal version
    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest plan.'
        }
      });
    }

    // 5. Allow revision of completed work, while keeping future missions gated.
    const goal = deriveGoalStats(row.state, catalogData);
    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) return res.status(404).json({ error: { code: 'MISSION_NOT_FOUND', message: 'Mission not found in this track.' } });
    if (goal.nextMissionId !== missionId && !goal.completions?.[missionId]) {
      return res.status(422).json({
        error: {
          code: 'INVALID_MISSION',
          message: 'Guidance is available for your current mission or previously completed missions.'
        }
      });
    }

    // 6. Check provider configuration (unless custom mock is injected for test)
    if (!req.app.locals.mockGuidanceGenerator && !isAiConfigured()) {
      const missing = getMissingAiConfig();
      return res.status(503).json({
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: `AI guidance is not available yet. Populate ${missing.join(' and ')} in server/.env.`
        }
      });
    }

    const completedPrerequisites = (mission.prerequisites || []).filter(
      prereqId => Boolean(goal.completions?.[prereqId])
    );

    const curatedCheck = getCuratedCheckForMission(missionId);

    // 7. Generate guidance with bounded timeout
    let guidanceResult;
    try {
      if (req.app.locals.mockGuidanceGenerator) {
        guidanceResult = await req.app.locals.mockGuidanceGenerator({
          mission,
          completedPrerequisites,
          availability: goal.availability,
          remainingMinutes: goal.remainingMinutes,
          category,
          feedback,
          whatTried,
          whereStuck,
          curatedCheck
        });
      } else {
        guidanceResult = await generateGeminiGuidance({
          mission,
          completedPrerequisites,
          availability: goal.availability,
          remainingMinutes: goal.remainingMinutes,
          category,
          feedback,
          whatTried,
          whereStuck,
          curatedCheck,
          clientOverride: req.app.locals.mockGoogleGenAIClient || null
        });
      }
    } catch (genErr) {
      if (genErr.code === 'AI_TIMEOUT' || genErr.status === 504) {
        return res.status(504).json({
          error: {
            code: 'AI_TIMEOUT',
            message: 'AI guidance request timed out. Your saved plan is unchanged.'
          }
        });
      }
      if (genErr.code === 'INVALID_AI_OUTPUT' || genErr.status === 502) {
        return res.status(502).json({
          error: {
            code: 'INVALID_AI_OUTPUT',
            message: 'AI service returned an unparseable response. Please try again.'
          }
        });
      }
      if (genErr.code === 'AI_SERVICE_UNAVAILABLE' || genErr.status === 503) {
        return res.status(503).json({
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI guidance provider is temporarily unavailable. Please try again later.'
          }
        });
      }
      throw genErr;
    }

    // 8. Concurrency guard: Re-check goal version after AI generation completes
    const { data: freshRow, error: recheckError } = await req.supabase
      .from('nextstep_goals')
      .select('version')
      .maybeSingle();

    if (recheckError) {
      const err = new Error(recheckError.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    if (!freshRow || freshRow.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed while generating guidance. Refresh to view latest plan.'
        }
      });
    }

    // 9. Return success envelope - source set to "gemini" only after successful provider response
    return res.status(200).json({
      data: {
        guidance: {
          baseVersion: expectedVersion,
          missionId: mission.id,
          mode: guidanceResult.mode,
          explanation: guidanceResult.explanation,
          steps: guidanceResult.steps,
          checkQuestion: guidanceResult.checkQuestion,
          questionText: guidanceResult.checkQuestion,
          questionId: curatedCheck ? curatedCheck.questionId : null,
          source: 'gemini'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/learning/context - Save or update blocker context
router.post('/learning/context', async (req, res, next) => {
  try {
    const parseResult = saveLearningContextSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid learning context payload.',
          fields
        }
      });
    }

    const { expectedVersion, missionId, category, whatTried, whereStuck, selfReportedStatus, dismissed, guidance } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: findError.message || 'Database service unavailable.'
        }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'No active goal found.'
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

    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({
        error: {
          code: 'MISSION_NOT_FOUND',
          message: `Mission with ID "${missionId}" does not exist in track.`
        }
      });
    }

    const existingLearning = row.state.learning || {};
    const currentMissionRecord = existingLearning[missionId] || {};
    const nowIso = new Date().toISOString();

    let normalizedGuidance = currentMissionRecord.guidance || null;
    if (guidance !== undefined) {
      if (guidance === null) {
        normalizedGuidance = null;
      } else {
        const qText = guidance.questionText || guidance.checkQuestion || null;
        normalizedGuidance = {
          ...guidance,
          questionText: qText,
          checkQuestion: qText
        };
      }
    }

    const updatedMissionRecord = {
      ...currentMissionRecord,
      missionId,
      category: category || currentMissionRecord.category || 'too_difficult',
      whatTried: whatTried !== undefined ? (whatTried ? whatTried.slice(0, 280) : null) : (currentMissionRecord.whatTried || null),
      whereStuck: whereStuck !== undefined ? (whereStuck ? whereStuck.slice(0, 280) : null) : (currentMissionRecord.whereStuck || null),
      selfReportedStatus: selfReportedStatus || currentMissionRecord.selfReportedStatus || 'still_unsure',
      dismissed: dismissed !== undefined ? dismissed : (currentMissionRecord.dismissed || false),
      guidance: normalizedGuidance,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      learning: {
        ...existingLearning,
        [missionId]: updatedMissionRecord
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

    if (updateError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: updateError.message || 'Database update failed.'
        }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
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
        learningRecord: updatedMissionRecord
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/learning/check - Submit student understanding check answer for AI assessment
router.post('/learning/check', async (req, res, next) => {
  try {
    const parseResult = submitLearningCheckSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid understanding check submission.',
          fields
        }
      });
    }

    const { expectedVersion, missionId, questionId, answer, selfReportedStatus } = parseResult.data;

    // Per-user rate limiting (sliding window: 5 requests per 60s)
    const rateLimitKey = req.user?.id || req.ip;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      res.set('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many check submissions. Please wait ${rateLimit.retryAfterSeconds}s before trying again.`
        }
      });
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: findError.message || 'Database service unavailable.'
        }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'No active goal found.'
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

    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({
        error: {
          code: 'MISSION_NOT_FOUND',
          message: `Mission with ID "${missionId}" does not exist in track.`
        }
      });
    }

    // Verify curated check question matches
    const curatedCheck = getCuratedCheckForMission(missionId);
    if (!curatedCheck || curatedCheck.questionId !== questionId) {
      return res.status(422).json({
        error: {
          code: 'INVALID_QUESTION_ID',
          message: `Mission "${missionId}" does not have curated check question "${questionId}".`
        }
      });
    }

    // Check provider configuration (unless custom mock is injected)
    if (!req.app.locals.mockAssessmentService && !isAiConfigured()) {
      const missing = getMissingAiConfig();
      return res.status(503).json({
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: `AI guidance is not available yet. Populate ${missing.join(' and ')} in server/.env.`
        }
      });
    }

    let assessmentResult;
    try {
      if (req.app.locals.mockAssessmentService) {
        assessmentResult = await req.app.locals.mockAssessmentService({
          mission,
          questionId,
          questionText: curatedCheck.questionText,
          rubric: curatedCheck.rubric,
          answer
        });
      } else {
        assessmentResult = await assessUnderstandingAnswer({
          mission,
          questionId,
          questionText: curatedCheck.questionText,
          rubric: curatedCheck.rubric,
          answer,
          clientOverride: req.app.locals.mockGoogleGenAIClient || null
        });
      }
    } catch (genErr) {
      if (genErr.code === 'AI_TIMEOUT' || genErr.status === 504) {
        return res.status(504).json({
          error: {
            code: 'AI_TIMEOUT',
            message: 'AI assessment request timed out. Your saved plan is unchanged.'
          }
        });
      }
      if (genErr.code === 'INVALID_AI_OUTPUT' || genErr.status === 502) {
        return res.status(502).json({
          error: {
            code: 'INVALID_AI_OUTPUT',
            message: 'AI service returned an unparseable response. Please try again.'
          }
        });
      }
      if (genErr.code === 'AI_SERVICE_UNAVAILABLE' || genErr.status === 503) {
        return res.status(503).json({
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI assessment service is temporarily unavailable. Please try again later.'
          }
        });
      }
      throw genErr;
    }

    // Concurrency check before mutation
    const { data: freshRow, error: recheckError } = await req.supabase
      .from('nextstep_goals')
      .select('version')
      .maybeSingle();

    if (recheckError) {
      const err = new Error(recheckError.message);
      err.status = 503;
      err.code = 'DATABASE_ERROR';
      throw err;
    }

    if (!freshRow || freshRow.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed while assessing answer. Refresh to view latest plan.'
        }
      });
    }

    const existingLearning = row.state.learning || {};
    const currentMissionRecord = existingLearning[missionId] || {};
    const nowIso = new Date().toISOString();

    const updatedAssessment = {
      questionId,
      answer: String(answer).slice(0, 1000),
      status: assessmentResult.status,
      explanation: assessmentResult.explanation,
      nextStep: assessmentResult.nextStep,
      assessedAt: nowIso,
      source: 'gemini'
    };

    const updatedMissionRecord = {
      ...currentMissionRecord,
      missionId,
      selfReportedStatus: selfReportedStatus || currentMissionRecord.selfReportedStatus || 'still_unsure',
      assessment: updatedAssessment,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      learning: {
        ...existingLearning,
        [missionId]: updatedMissionRecord
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

    if (updateError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: updateError.message || 'Database update failed.'
        }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
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
        assessment: {
          missionId,
          questionId,
          status: assessmentResult.status,
          explanation: assessmentResult.explanation,
          nextStep: assessmentResult.nextStep,
          source: 'gemini'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/learning/recall - Record persistent retrieval practice attempt
router.post('/learning/recall', async (req, res, next) => {
  try {
    const parseResult = recallAttemptSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach(i => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recall attempt payload.',
          fields
        }
      });
    }

    const { expectedVersion, missionId, attemptId, attemptText, confidence } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: findError.message || 'Database service unavailable.'
        }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'No active goal found.'
        }
      });
    }

    const mission = catalogData.missions.find(m => m.id === missionId);
    if (!mission) {
      return res.status(404).json({
        error: {
          code: 'MISSION_NOT_FOUND',
          message: `Mission with ID "${missionId}" does not exist in track.`
        }
      });
    }

    const goal = deriveGoalStats(row.state, catalogData);
    if (goal.nextMissionId !== missionId && !goal.completions?.[missionId]) {
      return res.status(422).json({
        error: {
          code: 'MISSION_NOT_ELIGIBLE',
          message: 'Recall reviews are available for your current mission or previously completed missions.'
        }
      });
    }

    const existingLearning = row.state.learning || {};
    const currentMissionRecord = existingLearning[missionId] || {};
    const existingHistory = Array.isArray(currentMissionRecord.recallHistory) ? currentMissionRecord.recallHistory : [];

    // Duplicate retry: if same attemptId exists
    const existingAttempt = existingHistory.find(a => a.attemptId === attemptId);
    if (existingAttempt) {
      if (existingAttempt.attemptText === attemptText && existingAttempt.confidence === confidence) {
        return res.status(200).json({
          data: {
            goal,
            recallAttempt: existingAttempt
          }
        });
      } else {
        return res.status(409).json({
          error: {
            code: 'ATTEMPT_CONFLICT',
            message: 'An attempt with this ID was already recorded with different content.'
          }
        });
      }
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest plan.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const nextReviewDate = calculateNextReviewDate(nowIso, confidence);

    const newRecallAttempt = {
      attemptId,
      attemptText,
      confidence,
      savedAt: nowIso,
      nextReviewDate
    };

    const updatedHistory = [...existingHistory, newRecallAttempt].slice(-20);

    const updatedMissionRecord = {
      ...currentMissionRecord,
      missionId,
      recallHistory: updatedHistory,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      learning: {
        ...existingLearning,
        [missionId]: updatedMissionRecord
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

    if (updateError) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: updateError.message || 'Database update failed.'
        }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { data: freshRow } = await req.supabase
        .from('nextstep_goals')
        .select('*')
        .maybeSingle();

      if (freshRow) {
        const freshHistory = freshRow.state?.learning?.[missionId]?.recallHistory || [];
        const savedMatch = freshHistory.find(a => a.attemptId === attemptId);
        if (savedMatch && savedMatch.attemptText === attemptText && savedMatch.confidence === confidence) {
          return res.status(200).json({
            data: {
              goal: deriveGoalStats(freshRow.state, catalogData),
              recallAttempt: savedMatch
            }
          });
        }
      }

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
        recallAttempt: newRecallAttempt
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/lesson - Record lesson progress, knowledge check, or reflection
router.post('/workspace/lesson', async (req, res, next) => {
  try {
    const parseResult = saveLessonProgressSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid lesson progress payload.',
          fields
        }
      });
    }

    const {
      expectedVersion,
      requestId,
      lessonId,
      topicId,
      status,
      completedSections,
      reflection,
      knowledgeCheckOptionId,
      knowledgeCheckPassed,
      checkIn
    } = parseResult.data;

    const normalizedCheckIn = checkIn && typeof checkIn === 'object' ? {
      version: 1,
      ...(checkIn.confidence ? { confidence: checkIn.confidence } : {}),
      ...(checkIn.focus ? { focus: checkIn.focus } : {})
    } : null;

    const lesson = getAuthoritativeLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Published lesson "${lessonId}" does not exist.`
        }
      });
    }

    let finalKcPassed = knowledgeCheckPassed;
    if (knowledgeCheckOptionId && lesson.knowledgeCheck) {
      finalKcPassed = knowledgeCheckOptionId === lesson.knowledgeCheck.correctOptionId;
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const existingLessonRecord = workspace.lessonProgress[lessonId];

    // Idempotent retry check on requestId
    if (existingLessonRecord && existingLessonRecord.lastRequestId === requestId) {
      const normalizedReflection = reflection === undefined ? (existingLessonRecord.reflection ?? null) : reflection;
      const existingCheckIn = existingLessonRecord.checkIn ? {
        version: existingLessonRecord.checkIn.version || 1,
        ...(existingLessonRecord.checkIn.confidence ? { confidence: existingLessonRecord.checkIn.confidence } : {}),
        ...(existingLessonRecord.checkIn.focus ? { focus: existingLessonRecord.checkIn.focus } : {})
      } : null;
      const checkInMatches =
        (existingLessonRecord.lastRequestCheckInProvided ?? Boolean(existingCheckIn)) === (checkIn !== undefined) &&
        (checkIn === undefined || JSON.stringify(normalizedCheckIn) === JSON.stringify(existingCheckIn));
      const isIdentical =
        existingLessonRecord.status === status &&
        (existingLessonRecord.reflection ?? null) === normalizedReflection &&
        checkInMatches;

      if (isIdentical) {
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            lessonProgress: existingLessonRecord
          }
        });
      }
      return res.status(409).json({
        error: {
          code: 'REQUEST_CONFLICT',
          message: 'A lesson progress update with this requestId was already recorded with different content.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const updatedLessonRecord = {
      lessonId,
      topicId: topicId || lesson.topicId,
      status,
      startedAt: existingLessonRecord?.startedAt || nowIso,
      lastVisitedAt: nowIso,
      completedSections: completedSections ?? existingLessonRecord?.completedSections ?? [],
      reflection: reflection !== undefined ? reflection : (existingLessonRecord?.reflection ?? null),
      knowledgeCheckPassed:
        finalKcPassed !== undefined
          ? finalKcPassed
          : Boolean(existingLessonRecord?.knowledgeCheckPassed),
      checkIn: checkIn === undefined ? (existingLessonRecord?.checkIn ?? null) : normalizedCheckIn,
      lastRequestCheckInProvided: checkIn !== undefined,
      lastRequestId: requestId,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      selectedTopicId: topicId || lesson.topicId,
      lessonProgress: {
        ...workspace.lessonProgress,
        [lessonId]: updatedLessonRecord
      },
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        lessonProgress: updatedLessonRecord
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/exercise - Record an interactive Proof exercise attempt
router.post('/workspace/exercise', async (req, res, next) => {
  try {
    const parseResult = saveExerciseAttemptSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid exercise attempt payload.',
          fields
        }
      });
    }

    const {
      expectedVersion,
      attemptId,
      exerciseId,
      variantKey = 'primary',
      stepAnswers,
      edgeChoiceId,
      mistakeCount = 0,
      hintRevealed = false,
      referenceRevealed = false,
      reflection,
      checkIn
    } = parseResult.data;

    const normalizedCheckIn = checkIn && typeof checkIn === 'object' ? {
      version: 1,
      ...(checkIn.confidence ? { confidence: checkIn.confidence } : {}),
      ...(checkIn.focus ? { focus: checkIn.focus } : {})
    } : null;

    const exercise = getAuthoritativeExercise(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Published exercise "${exerciseId}" does not exist.`
        }
      });
    }

    const grading = gradeExerciseAttempt({
      exerciseId,
      variantKey,
      stepAnswers,
      edgeChoiceId
    });
    if (!grading.valid) {
      return res.status(422).json({
        error: {
          code: grading.code || 'VALIDATION_ERROR',
          message: grading.message
        }
      });
    }

    // Authoritative outcome derivation: ignore/normalize any forged client outcome
    let authoritativeOutcome = 'independent';
    if (referenceRevealed) {
      authoritativeOutcome = 'needed_reference';
    } else if (hintRevealed || mistakeCount > 0) {
      authoritativeOutcome = 'with_hint';
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const existingList = Array.isArray(workspace.exerciseAttempts[exerciseId])
      ? workspace.exerciseAttempts[exerciseId]
      : [];

    const existingAttempt = existingList.find((a) => a.attemptId === attemptId);
    if (existingAttempt) {
      const normalizedReflection = reflection ?? null;
      const existingCheckIn = existingAttempt.checkIn ? {
        version: existingAttempt.checkIn.version || 1,
        ...(existingAttempt.checkIn.confidence ? { confidence: existingAttempt.checkIn.confidence } : {}),
        ...(existingAttempt.checkIn.focus ? { focus: existingAttempt.checkIn.focus } : {})
      } : null;
      const checkInMatches = JSON.stringify(normalizedCheckIn) === JSON.stringify(existingCheckIn);

      if (
        existingAttempt.outcome === authoritativeOutcome &&
        (existingAttempt.variantKey || 'primary') === variantKey &&
        existingAttempt.mistakeCount === mistakeCount &&
        existingAttempt.hintRevealed === hintRevealed &&
        existingAttempt.referenceRevealed === referenceRevealed &&
        (existingAttempt.reflection ?? null) === normalizedReflection &&
        checkInMatches
      ) {
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            exerciseAttempt: existingAttempt
          }
        });
      }
      return res.status(409).json({
        error: {
          code: 'ATTEMPT_CONFLICT',
          message: 'An exercise attempt with this ID was already recorded with different content.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const nextReviewDate = calculateExerciseReviewDate(nowIso, authoritativeOutcome, mistakeCount);

    const newExerciseAttempt = {
      attemptId,
      exerciseId,
      lessonId: exercise.lessonId,
      topicId: exercise.topicId,
      variantKey,
      outcome: authoritativeOutcome,
      mistakeCount,
      hintRevealed,
      referenceRevealed,
      reflection: reflection ?? null,
      ...(normalizedCheckIn ? { checkIn: normalizedCheckIn } : {}),
      savedAt: nowIso,
      nextReviewDate
    };

    const updatedHistory = [...existingList, newExerciseAttempt].slice(-20);
    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      selectedTopicId: exercise.topicId,
      exerciseAttempts: {
        ...workspace.exerciseAttempts,
        [exerciseId]: updatedHistory
      },
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        exerciseAttempt: newExerciseAttempt
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/practice - Record a self-reported external practice attempt
router.post('/workspace/practice', async (req, res, next) => {
  try {
    const parseResult = savePracticeAttemptSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid practice attempt payload.',
          fields
        }
      });
    }

    const { expectedVersion, attemptId, problemId, outcome, note, needsReview } = parseResult.data;

    const curriculum = getPublishedCurriculum();
    const problem = curriculum.practiceProblems.find((p) => p.id === problemId);
    if (!problem) {
      return res.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Published practice problem "${problemId}" does not exist.`
        }
      });
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const existingList = Array.isArray(workspace.practiceAttempts[problemId])
      ? workspace.practiceAttempts[problemId]
      : [];

    const normalizedNote = note ?? null;
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
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            practiceAttempt: existingAttempt
          }
        });
      }
      return res.status(409).json({
        error: {
          code: 'ATTEMPT_CONFLICT',
          message: 'A practice attempt with this ID was already recorded with different content.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const nextReviewDate = calculatePracticeReviewDate(nowIso, outcome, normalizedNeedsReview);

    const newPracticeAttempt = {
      attemptId,
      problemId,
      topicId: problem.topicId,
      outcome,
      note: normalizedNote,
      needsReview: normalizedNeedsReview,
      selfReported: true,
      savedAt: nowIso,
      nextReviewDate
    };

    const updatedHistory = [...existingList, newPracticeAttempt].slice(-20);
    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      selectedTopicId: problem.topicId,
      practiceAttempts: {
        ...workspace.practiceAttempts,
        [problemId]: updatedHistory
      },
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        practiceAttempt: newPracticeAttempt
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/plan/preview - Read-only capacity-aware study plan preview
router.post('/workspace/plan/preview', async (req, res, next) => {
  try {
    const parseResult = workspacePlanPreviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace plan preview payload.',
          fields
        }
      });
    }

    const { expectedVersion, availability, selectedItemIds, targetDate } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to preview against latest state.'
        }
      });
    }

    const curriculum = getPublishedCurriculum();
    const validIds = new Set([
      ...curriculum.lessons.map((l) => l.id),
      ...curriculum.exercises.map((e) => e.id),
      ...curriculum.practiceProblems.map((p) => p.id)
    ]);

    for (const itemId of selectedItemIds) {
      if (!validIds.has(itemId)) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: `Curriculum item "${itemId}" is not a published lesson, exercise, or practice problem.`
          }
        });
      }
    }

    const today = getTodayKolkata();
    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: targetDate || row.state.targetDate,
      availability,
      selectedItemIds,
      curriculum,
      studyWorkspace: workspace
    });

    return res.status(200).json({
      data: {
        previewForDate: today,
        baseVersion: row.version,
        curriculumVersion: workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION,
        ...plan
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/plan/apply - Persist accepted workspace study plan without mutating starter schedule
router.post('/workspace/plan/apply', async (req, res, next) => {
  try {
    const parseResult = workspacePlanApplySchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace plan apply payload.',
          fields
        }
      });
    }

    const {
      expectedVersion,
      previewForDate,
      curriculumVersion,
      availability,
      selectedItemIds,
      targetDate
    } = parseResult.data;

    const today = getTodayKolkata();
    if (previewForDate !== today) {
      return res.status(409).json({
        error: {
          code: 'STALE_PREVIEW',
          message: 'This study plan preview was generated for a different day. Please preview again.'
        }
      });
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed since preview. Please preview and apply again.'
        }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const activeCurriculumVersion = workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION;
    if (curriculumVersion !== activeCurriculumVersion) {
      return res.status(409).json({
        error: {
          code: 'CURRICULUM_VERSION_CONFLICT',
          message: 'Curriculum version changed since preview. Please preview again.'
        }
      });
    }

    const curriculum = getPublishedCurriculum();
    const validIds = new Set([
      ...curriculum.lessons.map((l) => l.id),
      ...curriculum.exercises.map((e) => e.id),
      ...curriculum.practiceProblems.map((p) => p.id)
    ]);

    for (const itemId of selectedItemIds) {
      if (!validIds.has(itemId)) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: `Curriculum item "${itemId}" is not a published lesson, exercise, or practice problem.`
          }
        });
      }
    }

    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: targetDate || row.state.targetDate,
      availability,
      selectedItemIds,
      curriculum,
      studyWorkspace: workspace
    });

    const nowIso = new Date().toISOString();
    const savedStudyPlan = {
      planId: crypto.randomUUID(),
      createdAt: nowIso,
      baseVersion: row.version + 1,
      curriculumVersion: activeCurriculumVersion,
      ...plan
    };

    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      studyPlan: savedStudyPlan,
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        studyPlan: savedStudyPlan
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/goal/workspace/checkpoint/:checkpointId — authenticated
router.get('/workspace/checkpoint/:checkpointId', async (req, res, next) => {
  try {
    const { checkpointId } = req.params;
    const safeCheckpoint = getStudentSafeCheckpoint(checkpointId);
    if (!safeCheckpoint) {
      return res.status(404).json({
        error: {
          code: 'CHECKPOINT_NOT_FOUND',
          message: `Checkpoint "${checkpointId}" not found.`
        }
      });
    }

    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const continuation = workspace.continuation;
    const checkpointData = continuation.checkpoint;

    return res.status(200).json({
      data: {
        checkpoint: safeCheckpoint,
        draft: {
          answers: checkpointData.draftAnswers || {},
          reflection: checkpointData.draftReflection || '',
          assistance: checkpointData.draftAssistance || {},
          currentIndex: checkpointData.draftCurrentIndex || 0,
          definitionVersion: checkpointData.definitionVersion || 1,
          savedAt: checkpointData.draftSavedAt || null
        },
        latestAttempt: checkpointData.latestAttempt || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/checkpoint/draft — authenticated
router.post('/workspace/checkpoint/draft', async (req, res, next) => {
  try {
    const parsed = checkpointDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid checkpoint draft payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const {
      expectedVersion,
      checkpointId,
      draftAnswers = {},
      draftReflection = '',
      draftAssistance = {},
      draftCurrentIndex = 0,
      definitionVersion = 1
    } = parsed.data;

    // Validate checkpoint data against schema/definition
    try {
      validateCheckpointData({
        checkpointId,
        answers: draftAnswers,
        selfReportedAssistance: draftAssistance,
        definitionVersion,
        reflection: draftReflection
      });
    } catch (valErr) {
      return res.status(valErr.status || 422).json({
        error: {
          code: valErr.code || 'INVALID_CHECKPOINT_DATA',
          message: valErr.message
        }
      });
    }

    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const updatedContinuation = {
      ...workspace.continuation,
      status: workspace.continuation.status === 'completed' ? 'completed' : 'in_progress',
      checkpoint: {
        ...workspace.continuation.checkpoint,
        checkpointId,
        definitionVersion,
        status: workspace.continuation.checkpoint.status === 'completed' ? 'completed' : 'in_progress',
        draftAnswers,
        draftReflection,
        draftAssistance,
        draftCurrentIndex,
        draftSavedAt: nowIso
      }
    };

    const updatedWorkspace = {
      ...workspace,
      continuation: updatedContinuation,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        draftSavedAt: nowIso
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/checkpoint/evaluate — authenticated
router.post('/workspace/checkpoint/evaluate', async (req, res, next) => {
  try {
    const parsed = checkpointEvaluateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid checkpoint evaluation payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const { expectedVersion, attemptId, checkpointId, answers, selfReportedAssistance, reflection, definitionVersion } = parsed.data;

    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const continuation = workspace.continuation;
    const checkpointData = continuation.checkpoint;

    // Idempotency check: inspect latestAttempt and history before definition validation
    const allAttempts = [
      ...(checkpointData.latestAttempt ? [checkpointData.latestAttempt] : []),
      ...(checkpointData.history || [])
    ];
    const existing = allAttempts.find((a) => a.attemptId === attemptId);
    if (existing) {
      const isIdentical = isIdenticalCheckpointAttempt(existing, {
        checkpointId,
        answers,
        selfReportedAssistance,
        reflection,
        definitionVersion
      });

      if (isIdentical) {
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            evaluation: existing
          }
        });
      }

      return res.status(409).json({
        error: {
          code: 'ATTEMPT_CONFLICT',
          message: 'An evaluation attempt with this attemptId already exists with different data.'
        }
      });
    }

    // New attempt: validate payload against active checkpoint definition
    try {
      validateCheckpointData({
        checkpointId,
        answers,
        selfReportedAssistance,
        definitionVersion,
        reflection
      });
    } catch (valErr) {
      return res.status(valErr.status || 422).json({
        error: {
          code: valErr.code || 'INVALID_CHECKPOINT_DATA',
          message: valErr.message
        }
      });
    }

    // Version CAS check
    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    // Authoritative server-side grading
    const evaluation = gradeCheckpointAttempt({
      checkpointId,
      attemptId,
      answers,
      selfReportedAssistance,
      reflection,
      definitionVersion
    });

    const nowIso = new Date().toISOString();
    const history = [...(checkpointData.history || []), evaluation].slice(-5);

    const updatedContinuation = {
      ...continuation,
      status: 'completed',
      checkpoint: {
        ...checkpointData,
        checkpointId,
        status: 'completed',
        draftAnswers: {},
        draftReflection: '',
        draftAssistance: {},
        draftCurrentIndex: 0,
        draftSavedAt: null,
        latestAttempt: evaluation,
        history
      }
    };

    const updatedWorkspace = {
      ...workspace,
      continuation: updatedContinuation,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        evaluation
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/checkpoint/skip — authenticated
router.post('/workspace/checkpoint/skip', async (req, res, next) => {
  try {
    const parsed = checkpointSkipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid checkpoint skip payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const { expectedVersion, checkpointId } = parsed.data;
    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const updatedContinuation = {
      ...workspace.continuation,
      status: 'skipped',
      checkpoint: {
        ...workspace.continuation.checkpoint,
        checkpointId,
        status: 'skipped'
      }
    };

    const updatedWorkspace = {
      ...workspace,
      continuation: updatedContinuation,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/checkpoint/reset — authenticated
router.post('/workspace/checkpoint/reset', async (req, res, next) => {
  try {
    const parsed = checkpointResetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid checkpoint reset payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const { expectedVersion, checkpointId } = parsed.data;
    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const updatedContinuation = {
      ...workspace.continuation,
      status: 'in_progress',
      checkpoint: {
        ...workspace.continuation.checkpoint,
        checkpointId,
        status: 'in_progress',
        draftAnswers: {},
        draftReflection: '',
        draftAssistance: {},
        draftCurrentIndex: 0,
        draftSavedAt: null,
        latestAttempt: null
      }
    };

    const updatedWorkspace = {
      ...workspace,
      continuation: updatedContinuation,
      updatedAt: nowIso
    };

    const newVersion = row.version + 1;
    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/continuation/plan/preview — authenticated (read-only)
router.post('/workspace/continuation/plan/preview', async (req, res, next) => {
  try {
    const parsed = continuationPlanPreviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid plan preview payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const { expectedVersion, availability, targetDate, revisitItemIds: reqRevisitItemIds } = parsed.data;
    let selectedItemIds = parsed.data.selectedItemIds;

    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const curriculum = getPublishedCurriculum();
    const today = getTodayKolkata();

    const completedLessons = new Set(
      Object.entries(workspace.lessonProgress || {})
        .filter(([k, lp]) => lp && (lp.status === 'completed' || lp.completedAt))
        .map(([k, lp]) => lp.lessonId || k)
    );

    let effectiveRevisitIds = Array.isArray(reqRevisitItemIds) ? [...reqRevisitItemIds] : [];

    // If no explicit items, derive evidence-based recommendations
    if (!selectedItemIds || selectedItemIds.length === 0) {
      const derived = [];
      const continuation = workspace.continuation;
      const latestAttempt = continuation.checkpoint?.latestAttempt;

      // 1. Revisit any failed checkpoint topics
      if (latestAttempt?.topicResults) {
        for (const tr of Object.values(latestAttempt.topicResults)) {
          if (tr.revisitRecommended && tr.recommendedAction?.lessonId) {
            derived.push(tr.recommendedAction.lessonId);
            effectiveRevisitIds.push(tr.recommendedAction.lessonId);
          }
        }
      }

      // 2. Due reviews from workspace exercise and practice attempts
      for (const [exerciseId, attempts] of Object.entries(workspace.exerciseAttempts || {})) {
        if (!Array.isArray(attempts) || attempts.length === 0) continue;
        const latest = attempts[attempts.length - 1];
        if (latest?.nextReviewDate && latest.nextReviewDate <= today) {
          if (!derived.includes(exerciseId)) {
            derived.push(exerciseId);
            effectiveRevisitIds.push(exerciseId);
          }
        }
      }
      for (const [problemId, attempts] of Object.entries(workspace.practiceAttempts || {})) {
        if (!Array.isArray(attempts) || attempts.length === 0) continue;
        const latest = attempts[attempts.length - 1];
        if ((latest?.nextReviewDate && latest.nextReviewDate <= today) || latest?.needsReview) {
          if (!derived.includes(problemId)) {
            derived.push(problemId);
            effectiveRevisitIds.push(problemId);
          }
        }
      }

      // 3. Next uncompleted lesson in topological curriculum order
      const topicOrderMap = new Map((curriculum.topics || []).map((t) => [t.id, t.order]));
      const sortedLessons = [...(curriculum.lessons || [])].sort((a, b) => {
        const tA = topicOrderMap.get(a.topicId) ?? 99;
        const tB = topicOrderMap.get(b.topicId) ?? 99;
        if (tA !== tB) return tA - tB;
        if (a.order !== b.order) return a.order - b.order;
        return a.id.localeCompare(b.id);
      });

      for (const lesson of sortedLessons) {
        if (!completedLessons.has(lesson.id) && !derived.includes(lesson.id)) {
          const prereqsMet = (lesson.prerequisites || []).every((p) => completedLessons.has(p) || derived.includes(p));
          if (prereqsMet) {
            derived.push(lesson.id);
            if (derived.length >= 2) break;
          }
        }
      }

      // 4. End-of-library / deliberate review: if all lessons completed and derived is empty,
      // pick first foundational lesson as a deliberate mastery revisit:
      if (derived.length === 0 && curriculum.lessons?.length > 0) {
        const fallbackId = curriculum.lessons[0].id;
        derived.push(fallbackId);
        effectiveRevisitIds.push(fallbackId);
      }

      selectedItemIds = derived;
    }

    // Auto-mark any explicitly selected items that are already completed as revisits
    for (const id of selectedItemIds) {
      if (completedLessons.has(id) && !effectiveRevisitIds.includes(id)) {
        effectiveRevisitIds.push(id);
      }
    }

    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: targetDate || row.state.targetDate,
      availability,
      selectedItemIds,
      revisitItemIds: effectiveRevisitIds,
      curriculum,
      studyWorkspace: workspace
    });

    const previewId = crypto.randomUUID();
    const activeCurriculumVersion = workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION;

    const previewPayload = {
      previewId,
      ownerId: req.user.id,
      baseVersion: row.version,
      availability,
      selectedItemIds: [...plan.selectedItemIds].sort(),
      revisitItemIds: [...new Set([...effectiveRevisitIds, ...plan.sessions.filter((session) => session.isRevisit).map((session) => session.itemId)])]
        .filter((id) => plan.selectedItemIds.includes(id)).sort(),
      previewForDate: today,
      targetDate: plan.targetDate,
      curriculumVersion: activeCurriculumVersion
    };

    const previewToken = generatePreviewToken(previewPayload);
    recentPlanPreviews.set(`${req.user.id}:${row.version}`, previewPayload);
    if (recentPlanPreviews.size > 200) {
      const oldestKey = recentPlanPreviews.keys().next().value;
      recentPlanPreviews.delete(oldestKey);
    }

    return res.status(200).json({
      data: {
        previewId,
        previewToken,
        revisitItemIds: previewPayload.revisitItemIds,
        previewForDate: today,
        curriculumVersion: activeCurriculumVersion,
        baseVersion: row.version,
        ...plan
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/continuation/plan/apply — authenticated
router.post('/workspace/continuation/plan/apply', async (req, res, next) => {
  try {
    const parsed = continuationPlanApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid plan apply payload.',
          fields: parsed.error.flatten().fieldErrors
        }
      });
    }

    const { expectedVersion, previewForDate, curriculumVersion, availability, selectedItemIds, targetDate, previewToken, revisitItemIds: reqRevisitItemIds } = parsed.data;

    let previewData = null;
    if (previewToken) {
      const decoded = verifyPreviewToken(previewToken);
      if (!decoded) {
        return res.status(409).json({
          error: {
            code: 'INVALID_PREVIEW_TOKEN',
            message: 'Preview token signature is invalid or tampered with.'
          }
        });
      }
      if (decoded.ownerId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Preview token belongs to a different student account.'
          }
        });
      }
      previewData = decoded;
    } else {
      const cached = recentPlanPreviews.get(`${req.user.id}:${expectedVersion}`);
      if (!cached) {
        return res.status(409).json({
          error: {
            code: 'PREVIEW_REQUIRED',
            message: 'You must preview the plan before accepting it.'
          }
        });
      }
      previewData = cached;
    }

    if (previewData.baseVersion !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'PREVIEW_VERSION_MISMATCH',
          message: 'Plan was previewed against a different goal version. Please preview again.'
        }
      });
    }

    if (previewForDate !== previewData.previewForDate ||
        curriculumVersion !== previewData.curriculumVersion ||
        (targetDate && targetDate !== previewData.targetDate)) {
      return res.status(409).json({
        error: {
          code: 'PREVIEW_MISMATCH',
          message: 'Submitted plan details do not match the preview. Please preview again.'
        }
      });
    }

    const appliedSorted = [...selectedItemIds].sort();
    const previewSorted = [...previewData.selectedItemIds].sort();
    const itemsMatch = appliedSorted.length === previewSorted.length &&
      appliedSorted.every((id, idx) => id === previewSorted[idx]);

    if (!itemsMatch) {
      return res.status(409).json({
        error: {
          code: 'PREVIEW_MISMATCH',
          message: 'Submitted activities do not match the previewed plan. Please preview again.'
        }
      });
    }

    if (!Array.isArray(previewData.revisitItemIds)) {
      return res.status(409).json({ error: { code: 'PREVIEW_REQUIRED', message: 'Generate a fresh preview before accepting this plan.' } });
    }
    const signedRevisits = [...previewData.revisitItemIds].sort();
    if (reqRevisitItemIds !== undefined &&
        JSON.stringify([...new Set(reqRevisitItemIds)].sort()) !== JSON.stringify(signedRevisits)) {
      return res.status(409).json({ error: { code: 'PREVIEW_MISMATCH', message: 'Review activities changed since preview. Preview the plan again.' } });
    }

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const availMatch = days.every(d => (availability[d] || 0) === (previewData.availability[d] || 0));
    if (!availMatch) {
      return res.status(409).json({
        error: {
          code: 'PREVIEW_MISMATCH',
          message: 'Submitted availability does not match the previewed plan. Please preview again.'
        }
      });
    }

    const { data: row, error } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: error.message || 'Database error loading goal.' }
      });
    }

    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'Create your goal first.' }
      });
    }

    const today = getTodayKolkata();
    if (previewForDate !== today) {
      return res.status(409).json({
        error: {
          code: 'PREVIEW_EXPIRED',
          message: 'Calendar day changed since preview was generated. Please preview your plan again.'
        }
      });
    }

    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed since preview. Please preview and apply again.'
        }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const activeCurriculumVersion = workspace.curriculumVersion || DEFAULT_CURRICULUM_VERSION;
    if (curriculumVersion !== activeCurriculumVersion) {
      return res.status(409).json({
        error: {
          code: 'CURRICULUM_VERSION_CONFLICT',
          message: 'Curriculum version changed since preview. Please preview again.'
        }
      });
    }

    const effectiveRevisitIds = signedRevisits;

    const curriculum = getPublishedCurriculum();
    const plan = calculateWorkspaceStudyPlan({
      startDate: today,
      targetDate: previewData.targetDate,
      availability,
      selectedItemIds,
      revisitItemIds: effectiveRevisitIds,
      curriculum,
      studyWorkspace: workspace
    });

    const nowIso = new Date().toISOString();
    const planId = crypto.randomUUID();
    const savedStudyPlan = {
      planId,
      createdAt: nowIso,
      baseVersion: row.version + 1,
      curriculumVersion: activeCurriculumVersion,
      ...plan
    };

    const updatedContinuation = {
      ...workspace.continuation,
      suggestedPlan: {
        previewId: planId,
        generatedAt: nowIso,
        items: plan.selectedItemIds,
        weeklyCommitmentHours: Object.values(availability).reduce((a, b) => a + b, 0) / 60,
        accepted: true,
        acceptedAt: nowIso
      }
    };

    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      studyPlan: savedStudyPlan,
      continuation: updatedContinuation,
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        studyPlan: savedStudyPlan
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/goal/workspace/practice-session/start - Start a bounded targeted practice session
router.post('/workspace/practice-session/start', async (req, res, next) => {
  try {
    const parseResult = practiceSessionStartSchema.safeParse(req.body);
    if (!parseResult.success) {
      const budgetIssue = parseResult.error.issues.find((i) => i.message && i.message.includes('exceeds'));
      if (budgetIssue) {
        return res.status(422).json({
          error: {
            code: 'BUDGET_EXCEEDED',
            message: budgetIssue.message
          }
        });
      }
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid practice session start payload.',
          fields
        }
      });
    }

    const { expectedVersion, sessionId, timeBudgetMinutes, title, reason, tasks } = parseResult.data;

    // Enforce total effort <= timeBudgetMinutes on server
    const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
    if (totalEstimatedMinutes > timeBudgetMinutes) {
      return res.status(422).json({
        error: {
          code: 'BUDGET_EXCEEDED',
          message: `Total task estimated duration (${totalEstimatedMinutes} mins) exceeds selected time budget (${timeBudgetMinutes} mins).`
        }
      });
    }

    const published = getPublishedCurriculum();
    const lessonById = new Map((published.lessons || []).map((l) => [l.id, l]));
    const exerciseById = new Map((published.exercises || []).map((e) => [e.id, e]));
    const practiceById = new Map((published.practiceProblems || []).map((p) => [p.id, p]));

    for (const task of tasks) {
      const lesson = lessonById.get(task.lessonId);
      if (!lesson) {
        return res.status(422).json({
          error: {
            code: 'INVALID_TASK_TARGET',
            message: `Task references unknown or unpublished lesson ${task.lessonId}.`
          }
        });
      }
      if (lesson.topicId !== task.topicId) {
        return res.status(422).json({
          error: {
            code: 'INVALID_TASK_TARGET',
            message: `Lesson ${task.lessonId} belongs to topic ${lesson.topicId}, not specified topic ${task.topicId}.`
          }
        });
      }

      if (task.exerciseId) {
        const exercise = exerciseById.get(task.exerciseId);
        if (!exercise) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Task references unknown or unpublished exercise ${task.exerciseId}.`
            }
          });
        }
        if (exercise.topicId !== task.topicId || exercise.lessonId !== task.lessonId) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Exercise ${task.exerciseId} does not belong to lesson ${task.lessonId} and topic ${task.topicId}.`
            }
          });
        }
        if (task.variantKey === 'alternate' && !exercise.alternateVariant) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Alternate variant does not exist for exercise ${task.exerciseId}.`
            }
          });
        }
        if (task.variantKey === 'primary' && !exercise.primaryVariant) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Primary variant does not exist for exercise ${task.exerciseId}.`
            }
          });
        }
      }

      if (task.problemId) {
        const problem = practiceById.get(task.problemId);
        if (!problem) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Task references unknown or unpublished practice problem ${task.problemId}.`
            }
          });
        }
        if (problem.topicId !== task.topicId) {
          return res.status(422).json({
            error: {
              code: 'INVALID_TASK_TARGET',
              message: `Practice problem ${task.problemId} belongs to topic ${problem.topicId}, not specified topic ${task.topicId}.`
            }
          });
        }
      }

      if ((task.activityType === 'trace_retry' || task.activityType === 'boundary_retry') && !task.exerciseId) {
        return res.status(422).json({
          error: {
            code: 'INVALID_TASK_TARGET',
            message: `Task activityType ${task.activityType} requires an exerciseId.`
          }
        });
      }
      if (task.activityType === 'practice_problem' && !task.problemId) {
        return res.status(422).json({
          error: {
            code: 'INVALID_TASK_TARGET',
            message: 'Task activityType practice_problem requires a problemId.'
          }
        });
      }
    }

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);

    // Prevent resurrection of finalized sessions
    const inHistory = (workspace.practiceSessionHistory || []).some((h) => h.sessionId === sessionId);
    if (inHistory) {
      return res.status(409).json({
        error: {
          code: 'SESSION_FINALIZED',
          message: 'A practice session with this ID has already been completed or finalized.'
        }
      });
    }

    const existingSession = workspace.activePracticeSession;

    // Idempotency check: same sessionId
    if (existingSession && existingSession.sessionId === sessionId) {
      const isIdentical =
        existingSession.timeBudgetMinutes === timeBudgetMinutes &&
        existingSession.title === title &&
        existingSession.reason === reason &&
        existingSession.tasks.length === tasks.length &&
        existingSession.tasks.every((t, i) =>
          t.taskId === tasks[i].taskId &&
          t.targetId === tasks[i].targetId &&
          t.activityType === tasks[i].activityType &&
          t.lessonId === tasks[i].lessonId &&
          (t.exerciseId || null) === (tasks[i].exerciseId || null) &&
          (t.problemId || null) === (tasks[i].problemId || null) &&
          (t.variantKey || 'primary') === (tasks[i].variantKey || 'primary') &&
          t.estimatedMinutes === tasks[i].estimatedMinutes
        );

      if (isIdentical) {
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            activePracticeSession: existingSession
          }
        });
      }
      return res.status(409).json({
        error: {
          code: 'SESSION_CONFLICT',
          message: 'A practice session with this ID already exists with different parameters.'
        }
      });
    }

    // Version check (CAS)
    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    // Enforce single active session rule: cannot overwrite an ongoing active session without explicit abandon
    if (existingSession && existingSession.sessionId !== sessionId) {
      return res.status(409).json({
        error: {
          code: 'ACTIVE_SESSION_EXISTS',
          message: `An active practice session (${existingSession.sessionId}) is already in progress. Abandon or complete it before starting a new session.`
        }
      });
    }

    const nowIso = new Date().toISOString();
    const stampedTasks = tasks.map((t, idx) => {
      const exAttempts = (t.exerciseId && workspace.exerciseAttempts[t.exerciseId]) || [];
      return {
        ...t,
        taskId: t.taskId || `task_${idx + 1}`,
        variantKey: t.variantKey || (t.exerciseId ? 'primary' : undefined),
        baselineTimestamp: nowIso,
        baselineAttemptCount: exAttempts.length,
        baselineLatestAttemptId: exAttempts.length > 0 ? exAttempts[exAttempts.length - 1].attemptId : null,
        status: 'pending'
      };
    });

    const newActiveSession = {
      sessionId,
      startedAt: nowIso,
      timeBudgetMinutes,
      title,
      reason,
      status: 'in_progress',
      currentTaskIndex: 0,
      tasks: stampedTasks,
      replayReceipts: []
    };

    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      activePracticeSession: newActiveSession,
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        activePracticeSession: newActiveSession
      }
    });
  } catch (err) {
    next(err);
  }
});

// Helpers for canonical update payload comparison and replay receipts
export function canonicalizeUpdatePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const status = payload.status || 'in_progress';
  const currentTaskIndex =
    payload.currentTaskIndex !== undefined && payload.currentTaskIndex !== null
      ? Number(payload.currentTaskIndex)
      : null;

  let completedTask = null;
  if (payload.completedTask && typeof payload.completedTask === 'object') {
    completedTask = {
      taskId: payload.completedTask.taskId || null,
      notes:
        payload.completedTask.notes !== undefined && payload.completedTask.notes !== null
          ? String(payload.completedTask.notes)
          : null,
      attemptId:
        payload.completedTask.attemptId !== undefined && payload.completedTask.attemptId !== null
          ? String(payload.completedTask.attemptId)
          : null
    };
  }

  return {
    status,
    currentTaskIndex,
    completedTask
  };
}

export function areUpdatePayloadsIdentical(receipt, currentPayload) {
  if (!receipt) return false;
  const currentCanonical = canonicalizeUpdatePayload(currentPayload);
  if (receipt.canonicalPayload) {
    const receiptCanonical = canonicalizeUpdatePayload(receipt.canonicalPayload);
    return JSON.stringify(receiptCanonical) === JSON.stringify(currentCanonical);
  }
  // Fallback for receipts created without canonicalPayload property
  const isStatusSame = (receipt.status || 'in_progress') === (currentPayload.status || 'in_progress');
  const isTaskSame = (receipt.completedTaskId || null) === (currentPayload.completedTask ? currentPayload.completedTask.taskId : null);
  const isIndexSame =
    currentPayload.currentTaskIndex === undefined ||
    receipt.currentTaskIndex === currentPayload.currentTaskIndex;
  const isNotesSame =
    (receipt.notes !== undefined && receipt.notes !== null ? String(receipt.notes) : null) ===
    (currentPayload.completedTask && currentPayload.completedTask.notes !== undefined && currentPayload.completedTask.notes !== null
      ? String(currentPayload.completedTask.notes)
      : null);
  const isAttemptSame =
    (receipt.attemptId !== undefined && receipt.attemptId !== null ? String(receipt.attemptId) : null) ===
    (currentPayload.completedTask && currentPayload.completedTask.attemptId !== undefined && currentPayload.completedTask.attemptId !== null
      ? String(currentPayload.completedTask.attemptId)
      : null);
  return isStatusSame && isTaskSame && isIndexSame && isNotesSame && isAttemptSame;
}

// POST /api/goal/workspace/practice-session/update - Update, pause, complete, or abandon active session
router.post('/workspace/practice-session/update', async (req, res, next) => {
  try {
    const parseResult = practiceSessionUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fields = {};
      parseResult.error.issues.forEach((i) => {
        fields[i.path.join('.')] = i.message;
      });
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid practice session update payload.',
          fields
        }
      });
    }

    const { expectedVersion, sessionId, updateId, status, currentTaskIndex, completedTask } = parseResult.data;

    const { data: row, error: findError } = await req.supabase
      .from('nextstep_goals')
      .select('*')
      .maybeSingle();

    if (findError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: findError.message || 'Database service unavailable.' }
      });
    }
    if (!row) {
      return res.status(404).json({
        error: { code: 'GOAL_NOT_FOUND', message: 'No active goal found.' }
      });
    }

    const workspace = normalizeStudyWorkspace(row.state.studyWorkspace);
    const existingSession = workspace.activePracticeSession;

    // Check if session was already finalized into history
    if (!existingSession || existingSession.sessionId !== sessionId) {
      const inHistory = (workspace.practiceSessionHistory || []).find((h) => h.sessionId === sessionId);
      if (inHistory) {
        const historyReceipts = Array.isArray(inHistory.replayReceipts) ? inHistory.replayReceipts : [];
        const existingReceipt = historyReceipts.find((r) => r.updateId === updateId);
        if (existingReceipt) {
          const isIdentical = areUpdatePayloadsIdentical(existingReceipt, {
            status,
            currentTaskIndex,
            completedTask
          });

          if (isIdentical) {
            return res.status(200).json({
              data: {
                goal: deriveGoalStats(row.state, catalogData),
                activePracticeSession: null,
                sessionSummary: inHistory
              }
            });
          }
          return res.status(409).json({
            error: {
              code: 'UPDATE_CONFLICT',
              message: 'An update with this updateId was already processed with different parameters.'
            }
          });
        }

        if (inHistory.status === status) {
          // Idempotent retry of a finalized session
          return res.status(200).json({
            data: {
              goal: deriveGoalStats(row.state, catalogData),
              activePracticeSession: null,
              sessionSummary: inHistory
            }
          });
        }
        return res.status(409).json({
          error: {
            code: 'SESSION_CONFLICT',
            message: `Session ${sessionId} was already finalized with status '${inHistory.status}'.`
          }
        });
      }
      return res.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Active practice session not found or already finalized.' }
      });
    }

    // Check updateId replay receipts before CAS version check to ensure lost-response retries succeed
    const receipts = Array.isArray(existingSession.replayReceipts) ? existingSession.replayReceipts : [];
    const existingReceipt = receipts.find((r) => r.updateId === updateId);
    if (existingReceipt) {
      const isIdentical = areUpdatePayloadsIdentical(existingReceipt, {
        status,
        currentTaskIndex,
        completedTask
      });

      if (isIdentical) {
        return res.status(200).json({
          data: {
            goal: deriveGoalStats(row.state, catalogData),
            activePracticeSession: existingSession,
            sessionSummary: existingReceipt.sessionSummary || null
          }
        });
      }
      return res.status(409).json({
        error: {
          code: 'UPDATE_CONFLICT',
          message: 'An update with this updateId was already processed with different parameters.'
        }
      });
    }

    // Version check (CAS)
    if (row.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal version changed. Refresh to view latest workspace state.'
        }
      });
    }

    const nowIso = new Date().toISOString();
    let updatedTasks = [...existingSession.tasks];
    let resolvedAuthoritativeEvidence = null;
    let resolvedAttemptId = null;

    if (completedTask) {
      const targetTask = existingSession.tasks.find((t) => t.taskId === completedTask.taskId);
      if (!targetTask) {
        return res.status(422).json({
          error: {
            code: 'INVALID_TASK_ID',
            message: `Task ${completedTask.taskId} not found in active practice session.`
          }
        });
      }

      if (targetTask.activityType === 'worked_example') {
        resolvedAuthoritativeEvidence = 'viewed';
        resolvedAttemptId = null;
      } else if (targetTask.activityType === 'practice_problem') {
        resolvedAuthoritativeEvidence = 'self_reported';
        resolvedAttemptId = null;
      } else if (targetTask.activityType === 'trace_retry' || targetTask.activityType === 'boundary_retry') {
        const exAttempts = workspace.exerciseAttempts[targetTask.exerciseId] || [];
        const targetVariant = targetTask.variantKey || 'primary';

        // Find fresh attempts saved after task baseline
        const freshAttempts = exAttempts.filter((att, idx) => {
          const matchesVariant = (att.variantKey || 'primary') === targetVariant;
          if (!matchesVariant) return false;
          if (targetTask.baselineAttemptCount !== undefined && idx >= targetTask.baselineAttemptCount) {
            return true;
          }
          if (att.savedAt && targetTask.baselineTimestamp && att.savedAt > targetTask.baselineTimestamp) {
            return true;
          }
          return false;
        });

        let matchingAttempt = null;
        if (completedTask.attemptId) {
          matchingAttempt = freshAttempts.find((a) => a.attemptId === completedTask.attemptId) || null;
        } else {
          matchingAttempt = freshAttempts[freshAttempts.length - 1] || null;
        }

        if (!matchingAttempt) {
          return res.status(422).json({
            error: {
              code: 'UNVERIFIED_ATTEMPT',
              message: `No fresh evaluated exercise attempt found for exercise ${targetTask.exerciseId} (variant: ${targetVariant}). Please complete and save the trace in Proof Studio first.`
            }
          });
        }

        if (matchingAttempt.outcome === 'independent' && (!matchingAttempt.mistakeCount || matchingAttempt.mistakeCount === 0)) {
          resolvedAuthoritativeEvidence = 'verified';
        } else {
          resolvedAuthoritativeEvidence = 'hinted';
        }
        resolvedAttemptId = matchingAttempt.attemptId || null;
      } else {
        resolvedAuthoritativeEvidence = 'self_reported';
        resolvedAttemptId = null;
      }

      updatedTasks = updatedTasks.map((t) => {
        if (t.taskId === completedTask.taskId) {
          return {
            ...t,
            status: 'completed',
            result: {
              completedAt: nowIso,
              evidenceType: resolvedAuthoritativeEvidence,
              notes: completedTask.notes || null,
              attemptId: resolvedAttemptId
            }
          };
        }
        return t;
      });
    }

    // Validate completion requirement: cannot mark session completed if tasks remain pending
    if (status === 'completed') {
      const hasPending = updatedTasks.some((t) => t.status !== 'completed' && t.status !== 'skipped');
      if (hasPending) {
        return res.status(422).json({
          error: {
            code: 'INCOMPLETE_SESSION',
            message: 'Cannot mark session as completed while tasks are still pending. Complete all tasks or abandon the session.'
          }
        });
      }
    }

    let nextTaskIndex = currentTaskIndex !== undefined ? currentTaskIndex : existingSession.currentTaskIndex;
    if (completedTask && currentTaskIndex === undefined) {
      const nextPending = updatedTasks.findIndex((t) => t.status === 'pending');
      if (nextPending !== -1) {
        nextTaskIndex = nextPending;
      }
    }

    let finalActiveSession = null;
    let finalHistory = workspace.practiceSessionHistory || [];
    let sessionSummary = null;

    if (status === 'completed' || status === 'abandoned') {
      const viewedCount = updatedTasks.filter((t) => t.result?.evidenceType === 'viewed').length;
      const verifiedCount = updatedTasks.filter((t) => t.result?.evidenceType === 'verified').length;
      const hintedCount = updatedTasks.filter((t) => t.result?.evidenceType === 'hinted').length;
      const selfReportedCount = updatedTasks.filter((t) => t.result?.evidenceType === 'self_reported').length;
      const completedTasksCount = updatedTasks.filter((t) => t.status === 'completed').length;
      const topicsCovered = Array.from(new Set(updatedTasks.map((t) => t.topicId)));

      const canonicalPayload = canonicalizeUpdatePayload({
        status,
        currentTaskIndex,
        completedTask
      });

      const newReceipt = {
        updateId,
        timestamp: nowIso,
        status,
        currentTaskIndex: nextTaskIndex,
        completedTaskId: completedTask ? completedTask.taskId : null,
        notes: completedTask && completedTask.notes !== undefined && completedTask.notes !== null
          ? String(completedTask.notes)
          : null,
        attemptId: completedTask && completedTask.attemptId !== undefined && completedTask.attemptId !== null
          ? String(completedTask.attemptId)
          : null,
        canonicalPayload,
        evidenceType: resolvedAuthoritativeEvidence
      };

      sessionSummary = {
        sessionId,
        startedAt: existingSession.startedAt,
        completedAt: nowIso,
        timeBudgetMinutes: existingSession.timeBudgetMinutes,
        status,
        tasksCount: updatedTasks.length,
        completedTasksCount,
        viewedCount,
        verifiedCount,
        hintedCount,
        selfReportedCount,
        topicsCovered,
        replayReceipts: [...receipts.slice(-9), newReceipt]
      };

      finalHistory = [...finalHistory.slice(-4), sessionSummary];
      finalActiveSession = null;
    } else {
      const canonicalPayload = canonicalizeUpdatePayload({
        status,
        currentTaskIndex,
        completedTask
      });

      const newReceipt = {
        updateId,
        timestamp: nowIso,
        status,
        currentTaskIndex: nextTaskIndex,
        completedTaskId: completedTask ? completedTask.taskId : null,
        notes: completedTask && completedTask.notes !== undefined && completedTask.notes !== null
          ? String(completedTask.notes)
          : null,
        attemptId: completedTask && completedTask.attemptId !== undefined && completedTask.attemptId !== null
          ? String(completedTask.attemptId)
          : null,
        canonicalPayload,
        evidenceType: resolvedAuthoritativeEvidence
      };
      const boundedReceipts = [...receipts.slice(-9), newReceipt];

      finalActiveSession = {
        ...existingSession,
        status,
        currentTaskIndex: Math.min(nextTaskIndex, updatedTasks.length - 1),
        tasks: updatedTasks,
        replayReceipts: boundedReceipts
      };
    }

    const newVersion = row.version + 1;
    const updatedWorkspace = {
      ...workspace,
      activePracticeSession: finalActiveSession,
      practiceSessionHistory: finalHistory,
      updatedAt: nowIso
    };

    const updatedState = {
      ...row.state,
      version: newVersion,
      studyWorkspace: updatedWorkspace,
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

    if (updateError) {
      return res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message || 'Database update failed.' }
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Goal was modified concurrently. Refresh to view latest workspace state.'
        }
      });
    }

    return res.status(200).json({
      data: {
        goal: deriveGoalStats(updatedState, catalogData),
        activePracticeSession: finalActiveSession,
        sessionSummary
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
