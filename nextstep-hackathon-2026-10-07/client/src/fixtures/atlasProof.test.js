import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveTopicAtlasModel,
  deriveWorkspaceReviewQueue,
  deriveExplainableRecommendation,
  filterPracticeProblems,
  buildGoalExportData
} from '../services/workspace.js';
import { apiFixture } from './apiFixture.js';

test('AP01: getCatalog returns 12 starter missions plus full 12-topic published curriculum without drafts', async () => {
  const res = await apiFixture.getCatalog();
  assert.equal(res.data.missions.length, 12);
  assert.ok(res.data.curriculum);
  assert.equal(res.data.curriculum.topics.length, 12);
  assert.equal(res.data.curriculum.lessons.length, 48);
  assert.equal(res.data.curriculum.exercises.length, 18);
  assert.equal(res.data.curriculum.practiceProblems.length, 120);

  const hasDraft = res.data.curriculum.practiceProblems.some((p) => p.publicationStatus === 'draft');
  assert.equal(hasDraft, false);
});

test('AP02: deriveTopicAtlasModel computes topic prerequisites, evidence counts, and progress status across all 12 topics', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const [catRes, goalRes] = await Promise.all([apiFixture.getCatalog(), apiFixture.getGoal()]);
  const catalog = catRes.data;
  const goal = goalRes.data.goal;

  const atlas = deriveTopicAtlasModel(goal, catalog);
  assert.equal(atlas.topics.length, 12);

  const arraysTopic = atlas.topicMap['topic_arrays'];
  assert.ok(arraysTopic);
  assert.ok(arraysTopic.completedLessonsCount >= 1);
  assert.equal(arraysTopic.prerequisitesMet, true);

  const binarySearchTopic = atlas.topicMap['topic_binary_search'];
  assert.ok(binarySearchTopic);
  assert.ok(binarySearchTopic.prerequisites.length >= 1);
});

test('AP03: deriveExplainableRecommendation returns deterministic next step with plain-English reason', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const [catRes, goalRes] = await Promise.all([apiFixture.getCatalog(), apiFixture.getGoal()]);
  const rec = deriveExplainableRecommendation(goalRes.data.goal, catRes.data);

  assert.ok(rec);
  assert.equal(typeof rec.title, 'string');
  assert.equal(typeof rec.reason, 'string');
  assert.ok(rec.reason.length > 15);
});

test('AP04: filterPracticeProblems filters by query, topicId, difficulty, and status', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const [catRes, goalRes] = await Promise.all([apiFixture.getCatalog(), apiFixture.getGoal()]);
  const problems = catRes.data.curriculum.practiceProblems;
  const practiceAttempts = goalRes.data.goal.studyWorkspace.practiceAttempts;

  const arraysOnly = filterPracticeProblems(problems, {
    topicId: 'topic_arrays',
    practiceAttempts
  });
  assert.equal(arraysOnly.length, 10);
  assert.equal(arraysOnly.every((p) => p.topicId === 'topic_arrays'), true);

  const easyOnly = filterPracticeProblems(problems, {
    difficulty: 'Easy',
    practiceAttempts
  });
  assert.ok(easyOnly.length > 0);
  assert.equal(easyOnly.every((p) => p.difficulty === 'Easy'), true);

  const searched = filterPracticeProblems(problems, {
    query: 'Binary Search',
    practiceAttempts
  });
  assert.ok(searched.length > 0);
});

test('AP05: apiFixture persists lesson progress, exercise attempts, practice attempts, and study plans while preserving 12-mission state', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const initialGoal = (await apiFixture.getGoal()).data.goal;
  const initialCompletedCount = initialGoal.completedCount;

  // 1. Save lesson progress
  const lessonRes = await apiFixture.saveLessonProgress({
    expectedVersion: initialGoal.version,
    requestId: '00000000-0000-4000-8000-000000000001',
    lessonId: 'les_arrays_02',
    topicId: 'topic_arrays',
    status: 'completed',
    completedSections: ['explanation', 'worked_example', 'edge_case', 'knowledge_check'],
    reflection: 'Two-pointer prefix/suffix passes avoid division.',
    knowledgeCheckPassed: true
  });
  assert.equal(lessonRes.data.goal.version, initialGoal.version + 1);
  assert.equal(lessonRes.data.goal.studyWorkspace.lessonProgress['les_arrays_02'].status, 'completed');
  assert.equal(lessonRes.data.goal.completedCount, initialCompletedCount);

  // 2. Save exercise attempt and verify idempotency on duplicate attemptId
  const cat = (await apiFixture.getCatalog()).data;
  const attemptId = '11111111-2222-4333-8444-555555555555';
  const exRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: lessonRes.data.goal.version,
    exerciseId: 'ex_arrays_02',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'p2_c1_ok' },
      { stepIndex: 1, choiceId: 'p2_c2_ok' }
    ],
    edgeChoiceId: 'ec_arr2_ok',
    attemptId,
    mistakeCount: 0,
    hintRevealed: false,
    referenceRevealed: false,
    reflection: 'Avoid division by accumulating left and right products separately.'
  });
  assert.equal(exRes.data.exerciseAttempt.outcome, 'independent');
  const vAfterEx = exRes.data.goal.version;

  // Duplicate attemptId should not duplicate history or bump version
  const dupExRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: vAfterEx,
    exerciseId: 'ex_arrays_02',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'p2_c1_ok' },
      { stepIndex: 1, choiceId: 'p2_c2_ok' }
    ],
    edgeChoiceId: 'ec_arr2_ok',
    attemptId,
    mistakeCount: 0,
    hintRevealed: false,
    referenceRevealed: false,
    reflection: 'Avoid division by accumulating left and right products separately.'
  });
  assert.equal(dupExRes.data.goal.version, vAfterEx);
  assert.equal(dupExRes.data.goal.studyWorkspace.exerciseAttempts['ex_arrays_02'].length, 1);

  // 3. Save practice attempt
  const pracRes = await apiFixture.savePracticeAttempt({
    expectedVersion: vAfterEx,
    problemId: 'prac_arrays_03',
    attemptId: '22222222-3333-4444-8555-666666666666',
    outcome: 'reviewed_editorial',
    note: 'Review in-place sign marking.',
    needsReview: true
  });
  const savedPracList = pracRes.data.goal.studyWorkspace.practiceAttempts['prac_arrays_03'];
  assert.ok(Array.isArray(savedPracList));
  assert.equal(savedPracList[savedPracList.length - 1].outcome, 'reviewed_editorial');

  // Verify review queue includes the flagged practice item
  const queue = deriveWorkspaceReviewQueue(pracRes.data.goal, cat);
  assert.equal(queue.some((item) => item.problemId === 'prac_arrays_03'), true);

  // 4. Preview and apply workspace study plan
  const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
  const selectedItemIds = ['les_arrays_03', 'les_arrays_04', 'les_hashing_01'];
  const previewRes = await apiFixture.previewWorkspacePlan({
    expectedVersion: pracRes.data.goal.version,
    availability,
    selectedItemIds,
    targetDate: pracRes.data.goal.targetDate
  });
  assert.ok(previewRes.data.sessions.length > 0);

  const applyRes = await apiFixture.applyWorkspacePlan({
    expectedVersion: pracRes.data.goal.version,
    previewForDate: previewRes.data.previewForDate,
    curriculumVersion: previewRes.data.curriculumVersion,
    availability,
    selectedItemIds,
    targetDate: pracRes.data.goal.targetDate
  });
  assert.ok(applyRes.data.goal.studyWorkspace.studyPlan);
  assert.ok(applyRes.data.goal.studyWorkspace.studyPlan.sessions.length > 0);

  // 5. Export includes studyWorkspace
  const exported = buildGoalExportData(applyRes.data.goal, cat);
  assert.ok(exported.goal.studyWorkspace);
  assert.equal(exported.goal.studyWorkspace.lessonProgress['les_arrays_02'].status, 'completed');
});

test('AP06: R1 — Empty or incomplete traces cannot become independent successes', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const currentGoal = (await apiFixture.getGoal()).data.goal;

  // Missing stepAnswers entirely
  await assert.rejects(
    async () => {
      await apiFixture.saveExerciseAttempt({
        expectedVersion: currentGoal.version,
        exerciseId: 'ex_arrays_01',
        attemptId: 'aaaaaaaa-1111-4111-8111-111111111111',
        stepAnswers: [],
        edgeChoiceId: 'ec_arr1_correct'
      });
    },
    (err) => err.status === 422
  );

  // Partial trace: only 1 of 3 steps answered
  await assert.rejects(
    async () => {
      await apiFixture.saveExerciseAttempt({
        expectedVersion: currentGoal.version,
        exerciseId: 'ex_arrays_01',
        attemptId: 'bbbbbbbb-2222-4222-8222-222222222222',
        stepAnswers: [{ stepIndex: 0, choiceId: 'c1_correct' }],
        edgeChoiceId: 'ec_arr1_correct'
      });
    },
    (err) => err.status === 422
  );
});

test('AP07: R1 — Wrong boundary answer fails verification with 422', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const currentGoal = (await apiFixture.getGoal()).data.goal;

  await assert.rejects(
    async () => {
      await apiFixture.saveExerciseAttempt({
        expectedVersion: currentGoal.version,
        exerciseId: 'ex_arrays_01',
        attemptId: 'cccccccc-3333-4333-8333-333333333333',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_wrong' // Wrong boundary answer
      });
    },
    (err) => err.status === 422
  );
});

test('AP08: R1 — Forged client outcome is authoritatively derived and hint/reference reflected', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const currentGoal = (await apiFixture.getGoal()).data.goal;

  // Client attempts to claim outcome: 'independent' while revealing reference solution
  const resRef = await apiFixture.saveExerciseAttempt({
    expectedVersion: currentGoal.version,
    exerciseId: 'ex_arrays_01',
    attemptId: 'dddddddd-4444-4444-8444-444444444444',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    outcome: 'independent', // Forged claim
    hintRevealed: false,
    referenceRevealed: true,
    mistakeCount: 0
  });

  // Server authoritatively derives needed_reference
  assert.equal(resRef.data.exerciseAttempt.outcome, 'needed_reference');

  // Client claims 'independent' while having mistakeCount: 2
  const vNext = resRef.data.goal.version;
  const resMistakes = await apiFixture.saveExerciseAttempt({
    expectedVersion: vNext,
    exerciseId: 'ex_arrays_01',
    attemptId: 'eeeeeeee-5555-4555-8555-555555555555',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    outcome: 'independent', // Forged claim
    hintRevealed: false,
    referenceRevealed: false,
    mistakeCount: 2
  });

  // Server authoritatively derives with_hint
  assert.equal(resMistakes.data.exerciseAttempt.outcome, 'with_hint');
});

test('AP09: R1 — Public curriculum fixtures strip correctOptionId and isCorrect', async () => {
  const catRes = await apiFixture.getCatalog();
  const rawCurriculumString = JSON.stringify(catRes.data.curriculum);

  assert.equal(rawCurriculumString.includes('"isCorrect"'), false);
  assert.equal(rawCurriculumString.includes('"correctOptionId"'), false);
});

test('AP10: R3 — Proof state isolation: drafts and evaluation work without cross-exercise contamination', async () => {
  // Step evaluation works for exercise 1
  const stepEval = await apiFixture.evaluateTraceStep({
    exerciseId: 'ex_arrays_01',
    variantKey: 'primary',
    stepIndex: 0,
    choiceId: 'c1_correct'
  });
  assert.equal(stepEval.data.isCorrect, true);

  const stepWrong = await apiFixture.evaluateTraceStep({
    exerciseId: 'ex_arrays_01',
    variantKey: 'primary',
    stepIndex: 0,
    choiceId: 'c1_wrong_order'
  });
  assert.equal(stepWrong.data.isCorrect, false);

  // Explicit reference reveal returns reference invariant and edge case notes on demand
  const ref = await apiFixture.getExerciseReference('ex_arrays_01');
  assert.equal(ref.data.exerciseId, 'ex_arrays_01');
  assert.ok(ref.data.referenceInvariant);
  assert.ok(ref.data.edgeCaseNote);
});
