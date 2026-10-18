import { z } from 'zod';
import { getTodayKolkata, addDays } from '../services/scheduler.js';

const availabilityDaySchema = z.union([
  z.literal(0),
  z.literal(30),
  z.literal(60),
  z.literal(90)
]);

export const availabilitySchema = z.object({
  mon: availabilityDaySchema,
  tue: availabilityDaySchema,
  wed: availabilityDaySchema,
  thu: availabilityDaySchema,
  fri: availabilityDaySchema,
  sat: availabilityDaySchema,
  sun: availabilityDaySchema
}).strict().refine(val => {
  const sum = Object.values(val).reduce((acc, curr) => acc + curr, 0);
  return sum > 0;
}, {
  message: 'At least one day must have nonzero availability (min 30 minutes).'
});

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const goalNameSchema = z.string().trim().min(1).max(80);
export const renameGoalSchema = z.object({ goalName: goalNameSchema, expectedVersion: z.number().int().positive() }).strict();

export const createGoalSchema = z.object({
  creationRequestId: z.string().uuid(),
  goalName: goalNameSchema.optional(),
  trackId: z.literal('dsa-starter-v1'),
  planStartDate: z.string().regex(isoDateRegex, 'Must be valid YYYY-MM-DD date'),
  targetDate: z.string().regex(isoDateRegex, 'Must be valid YYYY-MM-DD date'),
  deadlineMode: z.enum(['fixed', 'flexible']),
  timezone: z.literal('Asia/Kolkata'),
  availability: availabilitySchema
}).strict().superRefine((val, ctx) => {
  const today = getTodayKolkata();
  const minDate = addDays(today, -30);
  const maxDate = addDays(today, 365);

  if (val.targetDate < val.planStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetDate'],
      message: 'targetDate cannot be before planStartDate'
    });
  }

  if (val.targetDate < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetDate'],
      message: 'targetDate cannot be in the past'
    });
  }

  if (val.planStartDate < minDate || val.planStartDate > maxDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['planStartDate'],
      message: 'planStartDate must be within 30 days before today and 365 days after today'
    });
  }

  if (val.targetDate > maxDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetDate'],
      message: 'targetDate cannot exceed 365 days from today'
    });
  }
});

export const completeMissionSchema = z.object({
  missionId: z.string().min(1),
  expectedVersion: z.number().int().positive(),
  outcome: z.enum(['independent', 'with_hint']),
  reflection: z.string().max(280).nullable().optional()
}).strict();

export const recoveryPreviewSchema = z.object({
  expectedVersion: z.number().int().positive(),
  availability: availabilitySchema
}).strict();

export const recoveryApplySchema = z.object({
  expectedVersion: z.number().int().positive(),
  previewForDate: z.string().regex(isoDateRegex),
  availability: availabilitySchema
}).strict();

export const guidanceSchema = z.object({
  expectedVersion: z.number().int().positive(),
  missionId: z.string().min(1),
  category: z.enum(['too_difficult', 'need_revision', 'ready_to_continue']),
  feedback: z.string().max(280).nullable().optional(),
  whatTried: z.string().max(280).nullable().optional(),
  whereStuck: z.string().max(280).nullable().optional()
}).strict();

export const saveLearningContextSchema = z.object({
  expectedVersion: z.number().int().positive(),
  missionId: z.string().min(1),
  category: z.enum(['too_difficult', 'need_revision', 'ready_to_continue']).optional(),
  whatTried: z.string().max(280).nullable().optional(),
  whereStuck: z.string().max(280).nullable().optional(),
  selfReportedStatus: z.enum(['still_unsure', 'ready_to_continue']).optional(),
  dismissed: z.boolean().optional(),
  guidance: z.object({
    questionId: z.string().nullable().optional(),
    questionText: z.string().max(300).optional(),
    checkQuestion: z.string().max(300).optional(),
    mode: z.string().optional(),
    explanation: z.string().max(500).optional(),
    steps: z.array(z.string().max(250)).optional(),
    source: z.string().optional()
  }).nullable().optional()
}).strict();

export const submitLearningCheckSchema = z.object({
  expectedVersion: z.number().int().positive(),
  missionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.string().min(1, 'Answer cannot be empty').max(1000, 'Answer cannot exceed 1000 characters'),
  selfReportedStatus: z.enum(['still_unsure', 'ready_to_continue']).optional()
}).strict();

export const recallAttemptSchema = z.object({
  expectedVersion: z.number().int().positive(),
  missionId: z.string().min(1),
  attemptId: z.string().uuid(),
  attemptText: z.string().trim().min(1, 'Attempt text cannot be empty').max(2000, 'Attempt text cannot exceed 2000 characters'),
  confidence: z.number().int().min(1).max(5)
}).strict();

export const CONFIDENCE_INTERVALS = {
  1: 1,
  2: 2,
  3: 3,
  4: 7,
  5: 14
};

export function calculateNextReviewDate(dateOrIso = new Date().toISOString(), confidence = 1) {
  const dateKolkata = new Date(dateOrIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const daysToAdd = CONFIDENCE_INTERVALS[confidence] || 1;
  return addDays(dateKolkata, daysToAdd);
}

export const saveLessonProgressSchema = z.object({
  expectedVersion: z.number().int().positive(),
  requestId: z.string().uuid(),
  lessonId: z.string().regex(/^les_[a-z0-9_]+$/),
  topicId: z.string().regex(/^topic_[a-z0-9_]+$/).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  completedSections: z.array(z.string().max(60)).max(12).optional(),
  reflection: z.string().trim().max(500).nullable().optional(),
  knowledgeCheckOptionId: z.string().optional(),
  knowledgeCheckPassed: z.boolean().optional()
}).strict();

export const saveExerciseAttemptSchema = z.object({
  expectedVersion: z.number().int().positive(),
  attemptId: z.string().uuid(),
  exerciseId: z.string().regex(/^ex_[a-z0-9_]+$/),
  variantKey: z.enum(['primary', 'alternate']).default('primary'),
  stepAnswers: z.array(z.object({
    stepIndex: z.number().int().min(0).max(50),
    choiceId: z.string().min(1)
  })).min(1, 'All trace steps must be completed with choice IDs'),
  edgeChoiceId: z.string().min(1, 'Edge case boundary check choice is required'),
  outcome: z.enum(['independent', 'with_hint', 'needed_reference']).optional(),
  mistakeCount: z.number().int().min(0).max(50).default(0),
  hintRevealed: z.boolean().default(false),
  referenceRevealed: z.boolean().default(false),
  reflection: z.string().trim().max(500).nullable().optional()
}).strict();

export const savePracticeAttemptSchema = z.object({
  expectedVersion: z.number().int().positive(),
  attemptId: z.string().uuid(),
  problemId: z.string().regex(/^prac_[a-z0-9_]+$/),
  outcome: z.enum(['solved_independently', 'with_hint', 'reviewed_editorial', 'bookmarked']),
  note: z.string().trim().max(500).nullable().optional(),
  needsReview: z.boolean().optional()
}).strict();

export const workspacePlanPreviewSchema = z.object({
  expectedVersion: z.number().int().positive(),
  availability: availabilitySchema,
  selectedItemIds: z.array(z.string().min(3).max(80)).min(1).max(40),
  targetDate: z.string().regex(isoDateRegex).optional()
}).strict();

export const workspacePlanApplySchema = z.object({
  expectedVersion: z.number().int().positive(),
  previewForDate: z.string().regex(isoDateRegex),
  curriculumVersion: z.string().min(3).max(40),
  availability: availabilitySchema,
  selectedItemIds: z.array(z.string().min(3).max(80)).min(1).max(40),
  targetDate: z.string().regex(isoDateRegex).optional()
}).strict();

export function calculateExerciseReviewDate(dateOrIso, outcome, mistakeCount = 0) {
  const dateKolkata = new Date(dateOrIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (outcome === 'needed_reference') return addDays(dateKolkata, 1);
  if (outcome === 'with_hint') return addDays(dateKolkata, 2);
  if (mistakeCount > 0) return addDays(dateKolkata, 3);
  return addDays(dateKolkata, 7);
}

export function calculatePracticeReviewDate(dateOrIso, outcome, needsReview = false) {
  const dateKolkata = new Date(dateOrIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (needsReview || outcome === 'reviewed_editorial' || outcome === 'bookmarked') {
    return addDays(dateKolkata, 1);
  }
  if (outcome === 'with_hint') return addDays(dateKolkata, 2);
  return addDays(dateKolkata, 7);
}

export const checkpointDraftSchema = z.object({
  expectedVersion: z.number().int().positive(),
  checkpointId: z.string().min(3).max(80),
  draftAnswers: z.record(z.string().min(1).max(80), z.string().min(1).max(80))
}).strict();

export const checkpointEvaluateSchema = z.object({
  expectedVersion: z.number().int().positive(),
  attemptId: z.string().uuid(),
  checkpointId: z.string().min(3).max(80),
  answers: z.record(z.string().min(1).max(80), z.string().min(1).max(80)),
  selfReportedAssistance: z.record(
    z.string().min(1).max(80),
    z.object({ usedHint: z.boolean().optional() }).strict()
  ).optional(),
  reflection: z.string().max(500).optional()
}).strict();

export const checkpointSkipSchema = z.object({
  expectedVersion: z.number().int().positive(),
  checkpointId: z.string().min(3).max(80)
}).strict();

export const checkpointResetSchema = z.object({
  expectedVersion: z.number().int().positive(),
  checkpointId: z.string().min(3).max(80)
}).strict();

export const continuationPlanPreviewSchema = z.object({
  expectedVersion: z.number().int().positive(),
  availability: availabilitySchema,
  selectedItemIds: z.array(z.string().min(3).max(80)).min(1).max(40).optional(),
  targetDate: z.string().regex(isoDateRegex).optional()
}).strict();

export const continuationPlanApplySchema = z.object({
  expectedVersion: z.number().int().positive(),
  previewForDate: z.string().regex(isoDateRegex),
  curriculumVersion: z.string().min(3).max(40),
  availability: availabilitySchema,
  selectedItemIds: z.array(z.string().min(3).max(80)).min(1).max(40),
  targetDate: z.string().regex(isoDateRegex).optional()
}).strict();
