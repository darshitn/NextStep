import {
  curriculumPackMetadataSchema,
  sourceAttributionSchema,
  topicSchema,
  prerequisiteEdgeSchema,
  lessonSchema,
  exerciseSchema,
  externalPracticeSchema
} from '../schemas/curriculumSchemas.js';
import { RAW_CURRICULUM_DATA } from '../../data/curriculum/index.js';

const STARTER_MISSION_ID_REGEX = /^m\d{2}$/i;
const REQUIRED_PUBLISHED_PIPELINE = [
  'draft',
  'source_check',
  'technical_validation',
  'editorial_review',
  'published'
];

function checkPublishedReviewRecord(item, label, errors) {
  if (item.reviewStatus !== 'published') return;
  const completed = item.reviewRecord?.pipelineStagesCompleted || [];
  for (const stage of REQUIRED_PUBLISHED_PIPELINE) {
    if (!completed.includes(stage)) {
      errors.push(`${label} "${item.id}" is marked 'published' but missing review pipeline stage "${stage}".`);
    }
  }
}

function detectTopicCycle(topics, edges) {
  const adj = new Map();
  for (const t of topics) {
    adj.set(t.id, new Set(t.prerequisites || []));
  }
  for (const edge of edges) {
    if (!adj.has(edge.toTopicId)) adj.set(edge.toTopicId, new Set());
    adj.get(edge.toTopicId).add(edge.fromTopicId);
  }

  const state = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
  const cycleNodes = [];

  function dfs(nodeId) {
    state.set(nodeId, 1);
    const deps = adj.get(nodeId) || new Set();
    for (const depId of deps) {
      const depState = state.get(depId) || 0;
      if (depState === 1) {
        cycleNodes.push(`${depId} -> ${nodeId}`);
        return true;
      }
      if (depState === 0 && dfs(depId)) {
        return true;
      }
    }
    state.set(nodeId, 2);
    return false;
  }

  for (const t of topics) {
    if ((state.get(t.id) || 0) === 0) {
      if (dfs(t.id)) {
        return cycleNodes;
      }
    }
  }
  return [];
}

function detectLessonCycle(lessons) {
  const adj = new Map();
  for (const l of lessons) {
    adj.set(l.id, new Set(l.prerequisites || []));
  }
  const state = new Map();
  for (const l of lessons) {
    if ((state.get(l.id) || 0) === 0) {
      const stack = new Set();
      const visit = (id) => {
        state.set(id, 1);
        stack.add(id);
        for (const dep of adj.get(id) || []) {
          if (stack.has(dep)) return true;
          if ((state.get(dep) || 0) === 0 && visit(dep)) return true;
        }
        stack.delete(id);
        state.set(id, 2);
        return false;
      };
      if (visit(l.id)) return true;
    }
  }
  return false;
}

export function validateCurriculumDataset(dataset = RAW_CURRICULUM_DATA) {
  const errors = [];
  const allIds = new Set();

  const registerId = (id, kind) => {
    if (STARTER_MISSION_ID_REGEX.test(id)) {
      errors.push(`${kind} ID "${id}" collides with starter mission IDs m01-m12.`);
    }
    if (allIds.has(id)) {
      errors.push(`Duplicate curriculum ID "${id}" found in ${kind}.`);
    }
    allIds.add(id);
  };

  const packIds = new Set();
  for (const pack of dataset.packs || []) {
    const parsed = curriculumPackMetadataSchema.safeParse(pack);
    if (!parsed.success) {
      errors.push(`Invalid pack "${pack?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(pack.id, 'Pack');
    packIds.add(pack.id);
  }

  const sourceIds = new Set();
  for (const src of dataset.sources || []) {
    const parsed = sourceAttributionSchema.safeParse(src);
    if (!parsed.success) {
      errors.push(`Invalid source "${src?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(src.id, 'Source');
    sourceIds.add(src.id);
  }

  const topicMap = new Map();
  for (const topic of dataset.topics || []) {
    const parsed = topicSchema.safeParse(topic);
    if (!parsed.success) {
      errors.push(`Invalid topic "${topic?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(topic.id, 'Topic');
    if (!packIds.has(topic.packId)) {
      errors.push(`Topic "${topic.id}" references missing packId "${topic.packId}".`);
    }
    checkPublishedReviewRecord(topic, 'Topic', errors);
    topicMap.set(topic.id, topic);
  }

  for (const topic of topicMap.values()) {
    for (const prereqId of topic.prerequisites) {
      if (!topicMap.has(prereqId)) {
        errors.push(`Topic "${topic.id}" references unknown prerequisite topic "${prereqId}".`);
      }
    }
  }

  for (const edge of dataset.prerequisiteEdges || []) {
    const parsed = prerequisiteEdgeSchema.safeParse(edge);
    if (!parsed.success) {
      errors.push(`Invalid prerequisite edge: ${parsed.error.message}`);
      continue;
    }
    if (!topicMap.has(edge.fromTopicId)) {
      errors.push(`Prerequisite edge from unknown topic "${edge.fromTopicId}".`);
    }
    if (!topicMap.has(edge.toTopicId)) {
      errors.push(`Prerequisite edge to unknown topic "${edge.toTopicId}".`);
    }
  }

  const topicCycles = detectTopicCycle([...topicMap.values()], dataset.prerequisiteEdges || []);
  if (topicCycles.length > 0) {
    errors.push(`Topic prerequisite cycle detected: ${topicCycles.join(', ')}`);
  }

  const lessonMap = new Map();
  for (const lesson of dataset.lessons || []) {
    const parsed = lessonSchema.safeParse(lesson);
    if (!parsed.success) {
      errors.push(`Invalid lesson "${lesson?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(lesson.id, 'Lesson');
    if (!topicMap.has(lesson.topicId)) {
      errors.push(`Lesson "${lesson.id}" references unknown topic "${lesson.topicId}".`);
    }
    if (!sourceIds.has(lesson.sourceId)) {
      errors.push(`Lesson "${lesson.id}" references unknown source "${lesson.sourceId}".`);
    }
    if (!packIds.has(lesson.packId)) {
      errors.push(`Lesson "${lesson.id}" references unknown pack "${lesson.packId}".`);
    }
    const kcIds = new Set(lesson.knowledgeCheck.options.map((o) => o.id));
    if (!kcIds.has(lesson.knowledgeCheck.correctOptionId)) {
      errors.push(`Lesson "${lesson.id}" knowledgeCheck.correctOptionId "${lesson.knowledgeCheck.correctOptionId}" not found in options.`);
    }
    checkPublishedReviewRecord(lesson, 'Lesson', errors);
    lessonMap.set(lesson.id, lesson);
  }

  for (const lesson of lessonMap.values()) {
    for (const prereqId of lesson.prerequisites) {
      if (!lessonMap.has(prereqId)) {
        errors.push(`Lesson "${lesson.id}" references unknown prerequisite lesson "${prereqId}".`);
      }
    }
  }

  if (detectLessonCycle([...lessonMap.values()])) {
    errors.push('Lesson prerequisite cycle detected.');
  }

  const exerciseMap = new Map();
  for (const ex of dataset.exercises || []) {
    const parsed = exerciseSchema.safeParse(ex);
    if (!parsed.success) {
      errors.push(`Invalid exercise "${ex?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(ex.id, 'Exercise');
    if (!topicMap.has(ex.topicId)) {
      errors.push(`Exercise "${ex.id}" references unknown topic "${ex.topicId}".`);
    }
    if (!lessonMap.has(ex.lessonId)) {
      errors.push(`Exercise "${ex.id}" references unknown lesson "${ex.lessonId}".`);
    } else if (lessonMap.get(ex.lessonId).topicId !== ex.topicId) {
      errors.push(`Exercise "${ex.id}" topicId "${ex.topicId}" does not match lesson "${ex.lessonId}" topicId.`);
    }
    if (!sourceIds.has(ex.sourceId)) {
      errors.push(`Exercise "${ex.id}" references unknown source "${ex.sourceId}".`);
    }
    if (!packIds.has(ex.packId)) {
      errors.push(`Exercise "${ex.id}" references unknown pack "${ex.packId}".`);
    }

    for (const variant of [ex.primaryVariant, ex.alternateVariant]) {
      variant.steps.forEach((step, idx) => {
        if (step.stepIndex !== idx) {
          errors.push(`Exercise "${ex.id}" variant "${variant.variantId}" step ${idx} has mismatched stepIndex ${step.stepIndex}.`);
        }
        if (step.activeCodeLine < 1 || step.activeCodeLine > ex.codeLines.length) {
          errors.push(`Exercise "${ex.id}" variant "${variant.variantId}" step ${idx} activeCodeLine ${step.activeCodeLine} out of range 1..${ex.codeLines.length}.`);
        }
        const correctChoices = step.choices.filter((c) => c.isCorrect);
        if (correctChoices.length !== 1) {
          errors.push(`Exercise "${ex.id}" variant "${variant.variantId}" step ${idx} must have exactly 1 correct choice (found ${correctChoices.length}).`);
        }
      });
    }

    const ecCorrect = ex.edgeCaseCheck.choices.filter((c) => c.isCorrect);
    if (ecCorrect.length !== 1) {
      errors.push(`Exercise "${ex.id}" edgeCaseCheck must have exactly 1 correct choice (found ${ecCorrect.length}).`);
    }

    checkPublishedReviewRecord(ex, 'Exercise', errors);
    exerciseMap.set(ex.id, ex);
  }

  const practiceMap = new Map();
  const publishedPracticeUrls = new Set();
  const publishedPracticeSlugs = new Set();

  for (const prac of dataset.practiceProblems || []) {
    const parsed = externalPracticeSchema.safeParse(prac);
    if (!parsed.success) {
      errors.push(`Invalid practice problem "${prac?.id}": ${parsed.error.message}`);
      continue;
    }
    registerId(prac.id, 'PracticeProblem');
    if (!topicMap.has(prac.topicId)) {
      errors.push(`Practice "${prac.id}" references unknown topic "${prac.topicId}".`);
    }
    for (const lid of prac.lessonIds) {
      if (!lessonMap.has(lid)) {
        errors.push(`Practice "${prac.id}" references unknown lesson "${lid}".`);
      }
    }
    if (!sourceIds.has(prac.sourceId)) {
      errors.push(`Practice "${prac.id}" references unknown source "${prac.sourceId}".`);
    }
    if (!packIds.has(prac.packId)) {
      errors.push(`Practice "${prac.id}" references unknown pack "${prac.packId}".`);
    }

    if (prac.reviewStatus === 'published') {
      checkPublishedReviewRecord(prac, 'PracticeProblem', errors);
      if (publishedPracticeUrls.has(prac.url)) {
        errors.push(`Duplicate published practice problem URL "${prac.url}" on "${prac.id}".`);
      }
      publishedPracticeUrls.add(prac.url);

      const providerSlugKey = `${prac.provider}:${prac.externalSlug}`;
      if (publishedPracticeSlugs.has(providerSlugKey)) {
        errors.push(`Duplicate published practice problem slug "${providerSlugKey}" on "${prac.id}".`);
      }
      publishedPracticeSlugs.add(providerSlugKey);
    }

    practiceMap.set(prac.id, prac);
  }

  for (const lesson of lessonMap.values()) {
    if (lesson.exerciseId && !exerciseMap.has(lesson.exerciseId)) {
      errors.push(`Lesson "${lesson.id}" references missing exerciseId "${lesson.exerciseId}".`);
    }
    for (const pid of lesson.recommendedPracticeIds) {
      if (!practiceMap.has(pid)) {
        errors.push(`Lesson "${lesson.id}" references missing recommendedPracticeId "${pid}".`);
      } else if (lesson.reviewStatus === 'published' && practiceMap.get(pid).reviewStatus !== 'published') {
        errors.push(`Published lesson "${lesson.id}" cannot recommend non-published practice item "${pid}".`);
      }
    }
  }

  const publishedTopics = [...topicMap.values()].filter((t) => t.reviewStatus === 'published');
  const publishedLessons = [...lessonMap.values()].filter((l) => l.reviewStatus === 'published');
  const publishedExercises = [...exerciseMap.values()].filter((e) => e.reviewStatus === 'published');
  const publishedPractice = [...practiceMap.values()].filter((p) => p.reviewStatus === 'published');
  const draftItems = [
    ...[...topicMap.values()].filter((t) => t.reviewStatus !== 'published'),
    ...[...lessonMap.values()].filter((l) => l.reviewStatus !== 'published'),
    ...[...exerciseMap.values()].filter((e) => e.reviewStatus !== 'published'),
    ...[...practiceMap.values()].filter((p) => p.reviewStatus !== 'published')
  ];

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      packs: packIds.size,
      sources: sourceIds.size,
      publishedTopics: publishedTopics.length,
      publishedLessons: publishedLessons.length,
      publishedExercises: publishedExercises.length,
      publishedPracticeProblems: publishedPractice.length,
      excludedDraftOrUnreviewedCount: draftItems.length
    }
  };
}

function stripInternalReviewRecord(item) {
  const { reviewRecord, ...publicItem } = item;
  return publicItem;
}

function makeStudentSafeLesson(lesson) {
  const safe = { ...lesson };
  if (safe.knowledgeCheck) {
    const { correctOptionId, ...safeKc } = safe.knowledgeCheck;
    safe.knowledgeCheck = safeKc;
  }
  return safe;
}

function sanitizeSteps(steps = []) {
  return steps.map((s) => ({
    ...s,
    choices: (s.choices || []).map(({ isCorrect, ...choiceRest }) => choiceRest)
  }));
}

function makeStudentSafeExercise(exercise) {
  const safe = { ...exercise };
  delete safe.referenceImplementation;
  if (safe.primaryVariant) {
    safe.primaryVariant = {
      ...safe.primaryVariant,
      steps: sanitizeSteps(safe.primaryVariant.steps)
    };
  }
  if (safe.alternateVariant) {
    safe.alternateVariant = {
      ...safe.alternateVariant,
      steps: sanitizeSteps(safe.alternateVariant.steps)
    };
  }
  if (safe.edgeCaseCheck) {
    safe.edgeCaseCheck = {
      ...safe.edgeCaseCheck,
      choices: (safe.edgeCaseCheck.choices || []).map(({ isCorrect, ...choiceRest }) => choiceRest)
    };
  }
  return safe;
}

export function getAuthoritativeCurriculum(dataset = RAW_CURRICULUM_DATA) {
  return getPublishedCurriculum(dataset, { studentSafe: false });
}

export function getAuthoritativeExercise(exerciseId, dataset = RAW_CURRICULUM_DATA) {
  const publishedExercises = dataset.exercises.filter((e) => e.reviewStatus === 'published');
  return publishedExercises.find((e) => e.id === exerciseId) || null;
}

export function getAuthoritativeLesson(lessonId, dataset = RAW_CURRICULUM_DATA) {
  const publishedLessons = dataset.lessons.filter((l) => l.reviewStatus === 'published');
  return publishedLessons.find((l) => l.id === lessonId) || null;
}

export function gradeExerciseAttempt({
  exerciseId,
  variantKey = 'primary',
  stepAnswers = [],
  edgeChoiceId,
  dataset = RAW_CURRICULUM_DATA
}) {
  const exercise = getAuthoritativeExercise(exerciseId, dataset);
  if (!exercise) {
    return { valid: false, code: 'ITEM_NOT_FOUND', message: `Published exercise "${exerciseId}" not found.` };
  }

  const variant = variantKey === 'alternate' ? exercise.alternateVariant : exercise.primaryVariant;
  if (!variant || !Array.isArray(variant.steps)) {
    return { valid: false, code: 'INVALID_VARIANT', message: `Invalid variant key "${variantKey}".` };
  }

  if (!Array.isArray(stepAnswers) || stepAnswers.length === 0) {
    return { valid: false, code: 'INCOMPLETE_TRACE', message: 'Trace steps must be completed.' };
  }

  if (stepAnswers.length !== variant.steps.length) {
    return {
      valid: false,
      code: 'INCOMPLETE_TRACE',
      message: `Trace has ${variant.steps.length} steps but received ${stepAnswers.length} answers.`
    };
  }

  for (let idx = 0; idx < variant.steps.length; idx += 1) {
    const step = variant.steps[idx];
    const answer = stepAnswers.find((a) => a.stepIndex === step.stepIndex || a.stepIndex === idx);
    if (!answer) {
      return {
        valid: false,
        code: 'INCOMPLETE_TRACE',
        message: `Missing answer for step ${step.stepIndex + 1}.`
      };
    }
    const choice = (step.choices || []).find((c) => c.id === answer.choiceId);
    if (!choice) {
      return {
        valid: false,
        code: 'INVALID_CHOICE',
        message: `Invalid choice "${answer.choiceId}" for step ${step.stepIndex + 1}.`
      };
    }
    if (!choice.isCorrect) {
      return {
        valid: false,
        code: 'INCORRECT_TRACE_STEP',
        message: `Step ${step.stepIndex + 1} choice is incorrect.`
      };
    }
  }

  if (exercise.edgeCaseCheck) {
    if (!edgeChoiceId) {
      return {
        valid: false,
        code: 'INCOMPLETE_TRACE',
        message: 'Edge-case boundary verification answer is required.'
      };
    }
    const edgeChoice = (exercise.edgeCaseCheck.choices || []).find((c) => c.id === edgeChoiceId);
    if (!edgeChoice) {
      return {
        valid: false,
        code: 'INVALID_EDGE_CHOICE',
        message: `Invalid edge-case choice "${edgeChoiceId}".`
      };
    }
    if (!edgeChoice.isCorrect) {
      return {
        valid: false,
        code: 'INCORRECT_EDGE_CHOICE',
        message: 'Edge-case boundary verification failed. Please check boundary conditions.'
      };
    }
  }

  return { valid: true };
}

export function getPublishedCurriculum(dataset = RAW_CURRICULUM_DATA, { studentSafe = true } = {}) {
  const validation = validateCurriculumDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Curriculum registry validation failed:\n${validation.errors.join('\n')}`);
  }

  const publishedTopics = dataset.topics
    .filter((t) => t.reviewStatus === 'published')
    .sort((a, b) => a.order - b.order)
    .map(stripInternalReviewRecord);

  const publishedTopicIds = new Set(publishedTopics.map((t) => t.id));

  let publishedLessons = dataset.lessons
    .filter((l) => l.reviewStatus === 'published' && publishedTopicIds.has(l.topicId))
    .sort((a, b) => a.order - b.order)
    .map(stripInternalReviewRecord);

  let publishedExercises = dataset.exercises
    .filter((e) => e.reviewStatus === 'published' && publishedTopicIds.has(e.topicId))
    .map(stripInternalReviewRecord);

  if (studentSafe) {
    publishedLessons = publishedLessons.map(makeStudentSafeLesson);
    publishedExercises = publishedExercises.map(makeStudentSafeExercise);
  }

  const publishedPractice = dataset.practiceProblems
    .filter((p) => p.reviewStatus === 'published' && publishedTopicIds.has(p.topicId))
    .map(stripInternalReviewRecord);

  const publishedEdges = (dataset.prerequisiteEdges || []).filter(
    (edge) => publishedTopicIds.has(edge.fromTopicId) && publishedTopicIds.has(edge.toTopicId)
  );

  const publishedPacks = (dataset.packs || []).filter((p) => p.reviewStatus === 'published');

  return {
    packs: publishedPacks,
    sources: dataset.sources,
    topics: publishedTopics,
    prerequisiteEdges: publishedEdges,
    lessons: publishedLessons,
    exercises: publishedExercises,
    practiceProblems: publishedPractice,
    counts: {
      topics: publishedTopics.length,
      lessons: publishedLessons.length,
      exercises: publishedExercises.length,
      practiceProblems: publishedPractice.length
    }
  };
}
