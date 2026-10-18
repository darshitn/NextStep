import { z } from 'zod';

// Ensure no curriculum ID ever collides with starter mission IDs m01-m12
const notMissionId = (val) => !/^m\d{2}$/i.test(val);

export const topicIdSchema = z.string().regex(/^topic_[a-z0-9_]+$/).refine(notMissionId);
export const lessonIdSchema = z.string().regex(/^les_[a-z0-9_]+$/).refine(notMissionId);
export const exerciseIdSchema = z.string().regex(/^ex_[a-z0-9_]+$/).refine(notMissionId);
export const practiceIdSchema = z.string().regex(/^prac_[a-z0-9_]+$/).refine(notMissionId);
export const sourceIdSchema = z.string().regex(/^src_[a-z0-9_]+$/).refine(notMissionId);
export const packIdSchema = z.string().regex(/^pack_[a-z0-9_]+$/).refine(notMissionId);

export const reviewStatusSchema = z.enum([
  'draft',
  'source_checked',
  'technically_validated',
  'editorially_reviewed',
  'published'
]);

export const reviewRecordSchema = z.object({
  pipelineStagesCompleted: z.array(z.enum(['draft', 'source_check', 'technical_validation', 'editorial_review', 'published'])).min(1),
  reviewerType: z.literal('same_agent_automated_and_editorial_review'),
  independentlyReviewed: z.literal(false),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewNotes: z.string().min(10).max(500)
}).strict();

export const sourceAttributionSchema = z.object({
  id: sourceIdSchema,
  title: z.string().min(3).max(160),
  url: z.string().url().refine(u => u.startsWith('https://'), 'Must be HTTPS URL'),
  creator: z.string().min(2).max(160),
  license: z.string().min(2).max(120),
  requiredNotice: z.string().min(5).max(400),
  changesMade: z.string().min(5).max(400),
  verificationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usageType: z.enum(['original_authored', 'open_license_reference', 'external_link_only'])
}).strict();

export const prerequisiteEdgeSchema = z.object({
  fromTopicId: topicIdSchema,
  toTopicId: topicIdSchema,
  rationale: z.string().min(10).max(280)
}).strict();

export const topicSchema = z.object({
  id: topicIdSchema,
  slug: z.string().min(2).max(50),
  title: z.string().min(3).max(100),
  shortDescription: z.string().min(15).max(280),
  whyItMatters: z.string().min(15).max(320),
  order: z.number().int().min(1).max(30),
  lane: z.number().int().min(1).max(6),
  estimatedMinutes: z.number().int().min(15).max(600),
  prerequisites: z.array(topicIdSchema),
  starterMissionIds: z.array(z.string().regex(/^m\d{2}$/)).optional(),
  keyPatterns: z.array(z.string().min(2).max(80)).min(2).max(6),
  packId: packIdSchema,
  reviewStatus: reviewStatusSchema,
  reviewRecord: reviewRecordSchema
}).strict();

export const knowledgeCheckOptionSchema = z.object({
  id: z.string().min(3).max(80),
  label: z.string().min(2).max(240),
  feedback: z.string().min(10).max(360)
}).strict();

export const lessonSchema = z.object({
  id: lessonIdSchema,
  topicId: topicIdSchema,
  order: z.number().int().min(1).max(20),
  title: z.string().min(5).max(140),
  estimatedMinutes: z.number().int().min(10).max(45),
  prerequisites: z.array(lessonIdSchema),
  measurableObjective: z.string().min(20).max(280),
  explanation: z.string().min(80).max(1800),
  codeSnippet: z.object({
    language: z.string().min(2).max(30),
    filename: z.string().min(3).max(80),
    lines: z.array(z.string().max(140)).min(3).max(25)
  }).strict(),
  workedExample: z.object({
    inputDescription: z.string().min(5).max(240),
    stepByStep: z.array(z.string().min(10).max(280)).min(2).max(8),
    outputDescription: z.string().min(5).max(240),
    invariantSummary: z.string().min(15).max(300)
  }).strict(),
  pitfalls: z.array(z.string().min(15).max(280)).min(2).max(5),
  edgeCase: z.object({
    scenario: z.string().min(10).max(200),
    whyItBreaksNaiveCode: z.string().min(15).max(280),
    howToHandle: z.string().min(15).max(280)
  }).strict(),
  exerciseId: exerciseIdSchema.nullable(),
  recommendedPracticeIds: z.array(practiceIdSchema).min(1).max(6),
  knowledgeCheck: z.object({
    question: z.string().min(15).max(300),
    options: z.array(knowledgeCheckOptionSchema).min(3).max(4),
    correctOptionId: z.string().min(3).max(80),
    explanation: z.string().min(15).max(400)
  }).strict(),
  reflectionPrompt: z.string().min(15).max(280),
  sourceId: sourceIdSchema,
  provenance: z.string().min(10).max(300),
  packId: packIdSchema,
  reviewStatus: reviewStatusSchema,
  reviewRecord: reviewRecordSchema
}).strict();

export const traceStepChoiceSchema = z.object({
  id: z.string().min(2).max(60),
  label: z.string().min(2).max(260),
  codeHint: z.string().max(120).optional(),
  isCorrect: z.boolean(),
  misconceptionFeedback: z.string().min(15).max(400)
}).strict();

export const traceStepSchema = z.object({
  stepIndex: z.number().int().min(0).max(20),
  activeCodeLine: z.number().int().min(1).max(25),
  prompt: z.string().min(10).max(280),
  stateSnapshot: z.object({
    array: z.array(z.union([z.number(), z.string()])).optional(),
    pointers: z.record(z.string(), z.union([z.number(), z.string(), z.null()])).optional(),
    activeRange: z.tuple([z.number().int(), z.number().int()]).nullable().optional(),
    highlightedIndices: z.array(z.number().int()).optional(),
    setItems: z.array(z.union([z.number(), z.string()])).optional(),
    mapEntries: z.array(z.object({ key: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
    windowMetric: z.string().optional(),
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      next: z.string().optional(),
      highlight: z.boolean().optional()
    })).optional(),
    stackOrQueue: z.array(z.union([z.number(), z.string()])).optional(),
    callStack: z.array(z.string()).optional(),
    dpTable: z.array(z.union([z.number(), z.string()])).optional(),
    treeNodes: z.array(z.object({ id: z.string(), label: z.string(), state: z.string() })).optional(),
    graphNodes: z.array(z.object({ id: z.string(), label: z.string(), state: z.string() })).optional(),
    annotation: z.string().min(5).max(280)
  }).strict(),
  choices: z.array(traceStepChoiceSchema).min(2).max(4),
  correctExplanation: z.string().min(15).max(360)
}).strict();

export const exerciseVariantSchema = z.object({
  variantId: z.string().min(2).max(40),
  label: z.string().min(3).max(80),
  inputLabel: z.string().min(3).max(160),
  steps: z.array(traceStepSchema).min(2).max(10),
  edgeCaseNote: z.string().min(10).max(280)
}).strict();

export const exerciseSchema = z.object({
  id: exerciseIdSchema,
  topicId: topicIdSchema,
  lessonId: lessonIdSchema,
  title: z.string().min(5).max(140),
  rendererType: z.enum([
    'array_pointers',
    'set_map_lookup',
    'binary_search_bounds',
    'sliding_window_state',
    'linked_list_links',
    'stack_queue_frames',
    'tree_traversal_state',
    'graph_frontier_state',
    'recursion_call_tree',
    'dp_state_table'
  ]),
  objective: z.string().min(15).max(260),
  instructions: z.string().min(15).max(340),
  codeLines: z.array(z.string().max(140)).min(3).max(25),
  primaryVariant: exerciseVariantSchema,
  alternateVariant: exerciseVariantSchema,
  edgeCaseCheck: z.object({
    question: z.string().min(15).max(280),
    choices: z.array(traceStepChoiceSchema).min(2).max(4),
    explanation: z.string().min(15).max(360)
  }).strict(),
  referenceInvariant: z.string().min(20).max(400),
  hintText: z.string().min(15).max(300),
  reflectionPrompt: z.string().min(15).max(280),
  sourceId: sourceIdSchema,
  packId: packIdSchema,
  reviewStatus: reviewStatusSchema,
  reviewRecord: reviewRecordSchema
}).strict();

export const externalPracticeSchema = z.object({
  id: practiceIdSchema,
  topicId: topicIdSchema,
  lessonIds: z.array(lessonIdSchema).min(1).max(4),
  title: z.string().min(3).max(140),
  provider: z.enum(['LeetCode', 'OpenDSA', 'OpenDataStructures']),
  externalSlug: z.string().min(2).max(120),
  url: z.string().url().refine(u => u.startsWith('https://'), 'External URL must use HTTPS'),
  pattern: z.string().min(3).max(80),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'unknown']),
  difficultySource: z.enum(['provider_verified', 'unknown']),
  estimatedMinutes: z.number().int().min(15).max(60),
  whyRecommended: z.string().min(15).max(280),
  keyEdgeCase: z.string().min(10).max(240),
  verificationMode: z.literal('self_reported'),
  sourceId: sourceIdSchema,
  packId: packIdSchema,
  reviewStatus: reviewStatusSchema,
  reviewRecord: reviewRecordSchema
}).strict();

export const curriculumPackMetadataSchema = z.object({
  id: packIdSchema,
  version: z.string().min(3).max(40),
  title: z.string().min(5).max(120),
  releaseStage: z.enum(['first_release', 'expansion']),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topicIds: z.array(topicIdSchema).min(1),
  reviewStatus: reviewStatusSchema
}).strict();
