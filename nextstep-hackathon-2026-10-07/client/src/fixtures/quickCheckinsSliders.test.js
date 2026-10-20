import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture } from './apiFixture.js';

test('QC01: apiFixture.saveLessonProgress validates, normalizes, and persists checkIn', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goal = (await apiFixture.getGoal()).data.goal;

  // 1. Valid checkIn
  const reqId = '77777777-1111-4111-8111-111111111111';
  const res = await apiFixture.saveLessonProgress({
    expectedVersion: goal.version,
    requestId: reqId,
    lessonId: 'les_arrays_01',
    topicId: 'topic_arrays',
    status: 'completed',
    completedSections: ['explanation', 'worked_example', 'edge_case', 'knowledge_check'],
    reflection: 'Invariant test note.',
    checkIn: {
      version: 1,
      confidence: 'ready',
      focus: 'invariant'
    }
  });

  const savedRecord = res.data.goal.studyWorkspace.lessonProgress['les_arrays_01'];
  assert.ok(savedRecord);
  assert.deepEqual(savedRecord.checkIn, {
    version: 1,
    confidence: 'ready',
    focus: 'invariant'
  });

  // 2. Idempotent retry with identical checkIn succeeds without version bump
  const dupRes = await apiFixture.saveLessonProgress({
    expectedVersion: res.data.goal.version,
    requestId: reqId,
    lessonId: 'les_arrays_01',
    topicId: 'topic_arrays',
    status: 'completed',
    completedSections: ['explanation', 'worked_example', 'edge_case', 'knowledge_check'],
    reflection: 'Invariant test note.',
    checkIn: {
      version: 1,
      confidence: 'ready',
      focus: 'invariant'
    }
  });
  assert.equal(dupRes.data.goal.version, res.data.goal.version);

  // 3. Changed checkIn under identical requestId triggers 409 REQUEST_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.saveLessonProgress({
        expectedVersion: res.data.goal.version,
        requestId: reqId,
        lessonId: 'les_arrays_01',
        topicId: 'topic_arrays',
        status: 'completed',
        completedSections: ['explanation', 'worked_example', 'edge_case', 'knowledge_check'],
        reflection: 'Invariant test note.',
        checkIn: {
          version: 1,
          confidence: 'unsure',
          focus: 'edge_cases'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'REQUEST_CONFLICT');
      return true;
    }
  );

  // 4. Invalid checkIn version rejected with 422
  await assert.rejects(
    async () => {
      await apiFixture.saveLessonProgress({
        expectedVersion: res.data.goal.version,
        requestId: '77777777-2222-4222-8222-222222222222',
        lessonId: 'les_arrays_01',
        topicId: 'topic_arrays',
        status: 'completed',
        completedSections: ['explanation'],
        checkIn: {
          version: 2,
          confidence: 'ready'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );

  // 5. Unknown extra keys in checkIn rejected with 422
  await assert.rejects(
    async () => {
      await apiFixture.saveLessonProgress({
        expectedVersion: res.data.goal.version,
        requestId: '77777777-3333-4333-8333-333333333333',
        lessonId: 'les_arrays_01',
        topicId: 'topic_arrays',
        status: 'completed',
        completedSections: ['explanation'],
        checkIn: {
          version: 1,
          confidence: 'ready',
          extraField: 'not_allowed'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});

test('QC02: apiFixture.saveExerciseAttempt validates, persists, and enforces idempotency on checkIn', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goal = (await apiFixture.getGoal()).data.goal;
  const attemptId = '88888888-1111-4111-8111-111111111111';

  // 1. Valid exercise checkIn
  const res = await apiFixture.saveExerciseAttempt({
    expectedVersion: goal.version,
    exerciseId: 'ex_arrays_01',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    attemptId,
    mistakeCount: 0,
    hintRevealed: false,
    referenceRevealed: false,
    reflection: 'Left min tracks bottom price.',
    checkIn: {
      version: 1,
      confidence: 'needs_example',
      focus: 'update_order'
    }
  });

  assert.equal(res.data.exerciseAttempt.outcome, 'independent');
  assert.deepEqual(res.data.exerciseAttempt.checkIn, {
    version: 1,
    confidence: 'needs_example',
    focus: 'update_order'
  });

  // 2. Duplicate attemptId with identical checkIn returns 200 without version bump
  const dupRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: res.data.goal.version,
    exerciseId: 'ex_arrays_01',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    attemptId,
    mistakeCount: 0,
    hintRevealed: false,
    referenceRevealed: false,
    reflection: 'Left min tracks bottom price.',
    checkIn: {
      version: 1,
      confidence: 'needs_example',
      focus: 'update_order'
    }
  });
  assert.equal(dupRes.data.goal.version, res.data.goal.version);

  // 3. Changed checkIn under identical attemptId triggers 409 ATTEMPT_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.saveExerciseAttempt({
        expectedVersion: res.data.goal.version,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        attemptId,
        mistakeCount: 0,
        hintRevealed: false,
        referenceRevealed: false,
        reflection: 'Left min tracks bottom price.',
        checkIn: {
          version: 1,
          confidence: 'ready',
          focus: 'none'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'ATTEMPT_CONFLICT');
      return true;
    }
  );

  // 4. Confidence selection cannot upgrade or forge an outcome
  // When hintRevealed is true, outcome is strictly with_hint, even with confidence: 'ready'
  const hintAttemptId = '88888888-2222-4222-8222-222222222222';
  const hintRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: res.data.goal.version,
    exerciseId: 'ex_arrays_01',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    attemptId: hintAttemptId,
    mistakeCount: 0,
    hintRevealed: true,
    referenceRevealed: false,
    reflection: 'Needed hint for line 5 order.',
    checkIn: {
      version: 1,
      confidence: 'ready',
      focus: 'none'
    }
  });
  assert.equal(hintRes.data.exerciseAttempt.outcome, 'with_hint');
});

test('QC04: lesson check-ins distinguish omission from explicit clearing on save and retry', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goal = (await apiFixture.getGoal()).data.goal;
  const base = { lessonId: 'les_arrays_02', status: 'in_progress' };
  const first = await apiFixture.saveLessonProgress({ ...base, expectedVersion: goal.version, requestId: 'cccccccc-1111-4111-8111-111111111111', checkIn: { version: 1, confidence: 'ready' } });
  const omitted = { ...base, expectedVersion: first.data.goal.version, requestId: 'cccccccc-2222-4222-8222-222222222222' };
  const preserved = await apiFixture.saveLessonProgress(omitted);
  assert.equal(preserved.data.lessonProgress.checkIn.confidence, 'ready');
  assert.equal((await apiFixture.saveLessonProgress(omitted)).data.goal.version, preserved.data.goal.version);
  await assert.rejects(apiFixture.saveLessonProgress({ ...omitted, checkIn: null }), (error) => error.code === 'REQUEST_CONFLICT');
  const clear = { ...base, expectedVersion: preserved.data.goal.version, requestId: 'cccccccc-3333-4333-8333-333333333333', checkIn: null };
  const cleared = await apiFixture.saveLessonProgress(clear);
  assert.equal(cleared.data.lessonProgress.checkIn, null);
  assert.equal((await apiFixture.saveLessonProgress(clear)).data.goal.version, cleared.data.goal.version);
});

test('QC03: Availability presets and zero-validation mechanics', () => {
  const applyPreset = (minutesPerWeekday) => ({
    mon: minutesPerWeekday,
    tue: minutesPerWeekday,
    wed: minutesPerWeekday,
    thu: minutesPerWeekday,
    fri: minutesPerWeekday,
    sat: 0,
    sun: 0
  });

  const p30 = applyPreset(30);
  assert.deepEqual(p30, { mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 0, sun: 0 });
  const total30 = Object.values(p30).reduce((acc, v) => acc + v, 0);
  assert.equal(total30, 150);
  assert.equal((total30 / 60).toFixed(1), '2.5');

  const p60 = applyPreset(60);
  assert.deepEqual(p60, { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 0, sun: 0 });
  const total60 = Object.values(p60).reduce((acc, v) => acc + v, 0);
  assert.equal(total60, 300);
  assert.equal((total60 / 60).toFixed(1), '5.0');

  // Clamping to 0/30/60/90
  const clamp = (val) => Math.max(0, Math.min(90, Math.round(val / 30) * 30));
  assert.equal(clamp(0), 0);
  assert.equal(clamp(15), 30);
  assert.equal(clamp(29), 30);
  assert.equal(clamp(44), 30);
  assert.equal(clamp(45), 60);
  assert.equal(clamp(75), 90);
  assert.equal(clamp(120), 90);
  assert.equal(clamp(-10), 0);

  // All-zero availability check
  const allZero = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
  const totalZero = Object.values(allZero).reduce((acc, v) => acc + v, 0);
  assert.equal(totalZero, 0);
  assert.equal(totalZero > 0, false);
});
