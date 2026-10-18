import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getPublishedCurriculum,
  getAuthoritativeExercise,
  getAuthoritativeLesson
} from '../services/curriculumRegistry.js';

const router = Router();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(dirname, '../../data/dsa-starter.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

export { catalogData };

router.get('/', (req, res) => {
  const curriculum = getPublishedCurriculum();
  res.status(200).json({
    data: {
      ...catalogData,
      curriculum
    }
  });
});

router.get('/curriculum', (req, res) => {
  res.status(200).json({
    data: getPublishedCurriculum()
  });
});

// Interactive step evaluation (student-safe real-time checking without public answer keys)
router.post('/exercise/evaluate-step', (req, res) => {
  const { exerciseId, variantKey = 'primary', stepIndex, choiceId } = req.body || {};
  const exercise = getAuthoritativeExercise(exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Exercise not found.' } });
  }
  const variant = variantKey === 'alternate' ? exercise.alternateVariant : exercise.primaryVariant;
  const step = (variant?.steps || []).find((s) => s.stepIndex === Number(stepIndex));
  if (!step) {
    return res.status(404).json({ error: { code: 'STEP_NOT_FOUND', message: 'Step not found.' } });
  }
  const choice = (step.choices || []).find((c) => c.id === choiceId);
  if (!choice) {
    return res.status(404).json({ error: { code: 'CHOICE_NOT_FOUND', message: 'Choice not found.' } });
  }
  return res.status(200).json({
    data: {
      isCorrect: Boolean(choice.isCorrect),
      feedback: choice.misconceptionFeedback || '',
      explanation: choice.isCorrect ? step.correctExplanation || null : null
    }
  });
});

router.post('/exercise/evaluate-edge', (req, res) => {
  const { exerciseId, choiceId } = req.body || {};
  const exercise = getAuthoritativeExercise(exerciseId);
  if (!exercise || !exercise.edgeCaseCheck) {
    return res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Exercise or edge check not found.' } });
  }
  const choice = (exercise.edgeCaseCheck.choices || []).find((c) => c.id === choiceId);
  if (!choice) {
    return res.status(404).json({ error: { code: 'CHOICE_NOT_FOUND', message: 'Edge check choice not found.' } });
  }
  return res.status(200).json({
    data: {
      isCorrect: Boolean(choice.isCorrect),
      feedback: choice.misconceptionFeedback || '',
      explanation: choice.isCorrect ? exercise.edgeCaseCheck.explanation || null : null
    }
  });
});

router.post('/lesson/evaluate-check', (req, res) => {
  const { lessonId, optionId } = req.body || {};
  const lesson = getAuthoritativeLesson(lessonId);
  if (!lesson || !lesson.knowledgeCheck) {
    return res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Lesson or knowledge check not found.' } });
  }
  const option = (lesson.knowledgeCheck.options || []).find((o) => o.id === optionId);
  if (!option) {
    return res.status(404).json({ error: { code: 'OPTION_NOT_FOUND', message: 'Option not found.' } });
  }
  const isCorrect = optionId === lesson.knowledgeCheck.correctOptionId;
  return res.status(200).json({
    data: {
      isCorrect,
      feedback: option.feedback || '',
      explanation: isCorrect ? lesson.knowledgeCheck.explanation || null : null
    }
  });
});

// Explicit reference solution reveal endpoint (only when requested by student)
router.get('/exercise/:exerciseId/reference', (req, res) => {
  const { exerciseId } = req.params;
  const exercise = getAuthoritativeExercise(exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Exercise not found.' } });
  }
  return res.status(200).json({
    data: {
      exerciseId,
      referenceInvariant: exercise.referenceInvariant || null,
      edgeCaseNote: exercise.primaryVariant?.edgeCaseNote || null,
      referenceImplementation: exercise.referenceImplementation || null
    }
  });
});

export default router;
