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

