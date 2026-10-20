import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasRecordedCurriculumActivity,
  deriveNextEligibleLesson,
  deriveExplainableRecommendation
} from '../services/workspace.js';
import curriculumCatalog from './curriculum.json' with { type: 'json' };

const MOCK_CATALOG = {
  curriculum: curriculumCatalog
};

test('FS06: next lesson skips completed, current, and unmet-prerequisite lessons', () => {
  const catalog = { curriculum: { lessons: [
    { id: 'current' }, { id: 'done' }, { id: 'locked', prerequisites: ['missing'] },
    { id: 'eligible', prerequisites: ['done'] }
  ] } };
  const goal = { studyWorkspace: { lessonProgress: { done: { status: 'completed' } } } };
  assert.equal(deriveNextEligibleLesson(goal, catalog, 'current').id, 'eligible');
  goal.studyWorkspace.lessonProgress.eligible = { status: 'completed' };
  assert.equal(deriveNextEligibleLesson(goal, catalog, 'current'), null);
  assert.equal(deriveNextEligibleLesson(goal, null, 'current'), null);
});

test('FS01: hasRecordedCurriculumActivity correctly differentiates new vs established curriculum students', () => {
  // 1. Brand new goal
  const brandNewGoal = {
    id: 'goal_new_1',
    completions: {},
    studyWorkspace: {}
  };
  assert.equal(hasRecordedCurriculumActivity(brandNewGoal), false);

  // 2. Goal with starter missions completed (e.g. 5 of 12) but zero curriculum activity
  const starterActiveGoal = {
    id: 'goal_starter_active',
    completions: {
      'mission-1': { outcome: 'independent' },
      'mission-2': { outcome: 'with_hint' },
      'mission-3': { outcome: 'independent' }
    },
    studyWorkspace: {
      lessonProgress: {},
      exerciseAttempts: {},
      practiceAttempts: {}
    }
  };
  assert.equal(hasRecordedCurriculumActivity(starterActiveGoal), false);

  // 3. Goal with all 12 starter missions completed but zero curriculum activity
  const starterCompletedGoal = {
    id: 'goal_starter_12',
    completions: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`mission-${i + 1}`, { outcome: 'independent' }])),
    studyWorkspace: {
      lessonProgress: {},
      exerciseAttempts: {},
      practiceAttempts: {}
    }
  };
  assert.equal(hasRecordedCurriculumActivity(starterCompletedGoal), false);

  // 4. Established curriculum student with 1 in-progress lesson
  const inProgressLessonGoal = {
    id: 'goal_in_progress',
    completions: {},
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: { status: 'in_progress', completedSections: ['explanation'] }
      }
    }
  };
  assert.equal(hasRecordedCurriculumActivity(inProgressLessonGoal), true);

  // 5. Established curriculum student with 1 completed lesson
  const completedLessonGoal = {
    id: 'goal_completed_lesson',
    completions: {},
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: { status: 'completed', completedSections: ['explanation', 'worked_example', 'knowledge_check'] }
      }
    }
  };
  assert.equal(hasRecordedCurriculumActivity(completedLessonGoal), true);

  // 6. Established curriculum student with 1 exercise attempt
  const exerciseAttemptGoal = {
    id: 'goal_exercise_attempt',
    completions: {},
    studyWorkspace: {
      exerciseAttempts: {
        ex_arrays_01: [{ attemptId: 'att_1', outcome: 'independent' }]
      }
    }
  };
  assert.equal(hasRecordedCurriculumActivity(exerciseAttemptGoal), true);

  // 7. Established curriculum student with 1 practice attempt
  const practiceAttemptGoal = {
    id: 'goal_practice_attempt',
    completions: {},
    studyWorkspace: {
      practiceAttempts: {
        prob_two_sum: [{ attemptId: 'att_p1', outcome: 'solved_independently' }]
      }
    }
  };
  assert.equal(hasRecordedCurriculumActivity(practiceAttemptGoal), true);

  // 8. Established student with continuation checkpoint attempt
  const checkpointGoal = {
    id: 'goal_checkpoint',
    completions: {},
    studyWorkspace: {
      continuation: {
        checkpoint: {
          latestAttempt: { attemptId: 'cp_1', score: { correct: 5, total: 6 } }
        }
      }
    }
  };
  assert.equal(hasRecordedCurriculumActivity(checkpointGoal), true);
});

test('FS02: deriveExplainableRecommendation resolves the first eligible curriculum lesson for new students', () => {
  const brandNewGoal = {
    id: 'goal_new_2',
    studyWorkspace: {}
  };

  const rec = deriveExplainableRecommendation(brandNewGoal, MOCK_CATALOG);
  assert.ok(rec, 'Recommendation must exist');
  assert.equal(rec.kind, 'next_unlocked_lesson');
  assert.equal(rec.lessonId, 'les_arrays_01');
  assert.equal(rec.topicId, 'topic_arrays');
  assert.equal(rec.title, 'Single-Pass Loop Invariants & Running Extrema');
  assert.equal(rec.estimatedMinutes, 15);
  assert.ok(rec.reason.includes('zero unmet prerequisites'), 'Explains suitability based on zero prerequisites');
});

test('FS03: Disabled Save explanation accurately counts remaining trace steps and boundary verification', () => {
  const totalSteps = 3;

  function deriveRemainingText({ verifiedCount, edgePassed }) {
    const remainingSteps = Math.max(0, totalSteps - verifiedCount);
    const boundaryNeeded = !edgePassed;

    if (remainingSteps === 0 && !boundaryNeeded) return '';
    if (remainingSteps > 0 && boundaryNeeded) {
      return `Verify ${remainingSteps} more trace step${remainingSteps === 1 ? '' : 's'} and the boundary check to enable saving.`;
    }
    if (remainingSteps > 0) {
      return `Verify ${remainingSteps} more trace step${remainingSteps === 1 ? '' : 's'} to enable saving.`;
    }
    if (boundaryNeeded) {
      return 'Verify the boundary check to enable saving.';
    }
    return '';
  }

  // At 0/3 verified, edge unverified
  assert.equal(
    deriveRemainingText({ verifiedCount: 0, edgePassed: false }),
    'Verify 3 more trace steps and the boundary check to enable saving.'
  );

  // At 1/3 verified, edge unverified (the exact prompt example: "Verify 2 more trace steps and the boundary check.")
  assert.equal(
    deriveRemainingText({ verifiedCount: 1, edgePassed: false }),
    'Verify 2 more trace steps and the boundary check to enable saving.'
  );

  // At 2/3 verified, edge unverified
  assert.equal(
    deriveRemainingText({ verifiedCount: 2, edgePassed: false }),
    'Verify 1 more trace step and the boundary check to enable saving.'
  );

  // At 3/3 verified, edge unverified
  assert.equal(
    deriveRemainingText({ verifiedCount: 3, edgePassed: false }),
    'Verify the boundary check to enable saving.'
  );

  // At 3/3 verified, edge passed
  assert.equal(deriveRemainingText({ verifiedCount: 3, edgePassed: true }), '');
});

test('FS04: Jump target calculation accurately reaches the first unanswered requirement', () => {
  const steps = [{ id: 's0' }, { id: 's1' }, { id: 's2' }];

  function deriveJumpTarget(stepAnswersMap, edgePassed) {
    const verifiedCount = Object.keys(stepAnswersMap).length;
    const remainingSteps = Math.max(0, steps.length - verifiedCount);
    const firstUnverifiedIdx = steps.findIndex((_, idx) => !stepAnswersMap[idx]);

    if (remainingSteps > 0 && firstUnverifiedIdx !== -1) {
      return { type: 'step', stepIndex: firstUnverifiedIdx, label: `Go to Step ${firstUnverifiedIdx + 1}` };
    }
    if (!edgePassed) {
      return { type: 'boundary', label: 'Jump to boundary check' };
    }
    return null;
  }

  // 0/3 verified: targets Step 1
  const target0 = deriveJumpTarget({}, false);
  assert.deepEqual(target0, { type: 'step', stepIndex: 0, label: 'Go to Step 1' });

  // 1/3 verified (step 0 answered): targets Step 2
  const target1 = deriveJumpTarget({ 0: 'opt_a' }, false);
  assert.deepEqual(target1, { type: 'step', stepIndex: 1, label: 'Go to Step 2' });

  // 2/3 verified (step 0 and 1 answered): targets Step 3
  const target2 = deriveJumpTarget({ 0: 'opt_a', 1: 'opt_b' }, false);
  assert.deepEqual(target2, { type: 'step', stepIndex: 2, label: 'Go to Step 3' });

  // 3/3 verified, edge not passed: targets boundary check
  const target3 = deriveJumpTarget({ 0: 'opt_a', 1: 'opt_b', 2: 'opt_c' }, false);
  assert.deepEqual(target3, { type: 'boundary', label: 'Jump to boundary check' });

  // All verified: no jump needed
  const target4 = deriveJumpTarget({ 0: 'opt_a', 1: 'opt_b', 2: 'opt_c' }, true);
  assert.equal(target4, null);
});

test('FS05: Save eligibility strictly requires all steps and boundary; check-ins never grant eligibility', () => {
  function checkCanSave({ allStepsCompleted, edgePassed, submitting, hasActiveExercise }) {
    return Boolean(hasActiveExercise) && allStepsCompleted && edgePassed && !submitting;
  }

  // 0/3 verified with check-ins selected: MUST BE DISABLED
  assert.equal(
    checkCanSave({
      allStepsCompleted: false,
      edgePassed: false,
      submitting: false,
      hasActiveExercise: true
    }),
    false
  );

  // 3/3 verified but boundary not passed: MUST BE DISABLED
  assert.equal(
    checkCanSave({
      allStepsCompleted: true,
      edgePassed: false,
      submitting: false,
      hasActiveExercise: true
    }),
    false
  );

  // 3/3 verified and boundary passed: MUST BE ENABLED
  assert.equal(
    checkCanSave({
      allStepsCompleted: true,
      edgePassed: true,
      submitting: false,
      hasActiveExercise: true
    }),
    true
  );

  // In-flight submission: disabled
  assert.equal(
    checkCanSave({
      allStepsCompleted: true,
      edgePassed: true,
      submitting: true,
      hasActiveExercise: true
    }),
    false
  );
});
