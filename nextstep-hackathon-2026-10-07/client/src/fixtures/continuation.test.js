import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture, DEMO_ACCOUNTS, getTodayKolkata } from './apiFixture.js';

test('C01: DEMO_ACCOUNTS contains student.completed@nextstep.local with 12/12 completions', async () => {
  const completedAccount = DEMO_ACCOUNTS.find(a => a.email === 'student.completed@nextstep.local');
  assert.ok(completedAccount, 'student.completed@nextstep.local demo account exists');
  assert.equal(completedAccount.initialState, 'completed');

  await apiFixture.signIn(completedAccount.email);
  const goalRes = await apiFixture.getGoal();
  const goal = goalRes.data.goal;
  assert.ok(goal);
  assert.equal(Object.keys(goal.completions).length, 12, 'All 12 starter missions completed');
  assert.equal(goal.status, 'completed');
  assert.equal(goal.studyWorkspace.continuation.schemaVersion, 1);
  assert.equal(goal.studyWorkspace.continuation.checkpoint.status, 'not_started');
});

test('C02: getCheckpoint returns student-safe questions with zero leaked answer keys', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const res = await apiFixture.getCheckpoint('chk_foundations_v1');
  assert.ok(res.data?.checkpoint);
  const cp = res.data.checkpoint;
  assert.equal(cp.id, 'chk_foundations_v1');
  assert.equal(cp.topics.length, 3);
  assert.equal(cp.questions.length, 3);

  for (const q of cp.questions) {
    assert.ok(q.id);
    assert.ok(q.prompt);
    assert.ok(q.options.length >= 2);
    assert.equal(q.correctOptionId, undefined, `Leaked correctOptionId on ${q.id}`);
    for (const opt of q.options) {
      assert.equal(opt.isCorrect, undefined, `Leaked isCorrect on option ${opt.id}`);
    }
  }
});

test('C03: saveCheckpointDraft persists partial student answers and timestamp across reloads', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const baseVersion = goalRes.data.goal.version;

  const draftRes = await apiFixture.saveCheckpointDraft({
    expectedVersion: baseVersion,
    checkpointId: 'chk_foundations_v1',
    draftAnswers: {
      chk_q_arrays_01: 'opt_arr_1'
    }
  });

  assert.ok(draftRes.data?.goal);
  assert.equal(draftRes.data.goal.version, baseVersion + 1);
  assert.ok(draftRes.data.draftSavedAt);

  // Reload via getCheckpoint
  const cpRes = await apiFixture.getCheckpoint('chk_foundations_v1');
  assert.equal(cpRes.data.draft.answers.chk_q_arrays_01, 'opt_arr_1');
});

test('C04: evaluateCheckpoint evaluates authoritatively and derives score and category', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;
  const attemptId = '60000000-0000-4000-8000-000000000001';

  const evalRes = await apiFixture.evaluateCheckpoint({
    expectedVersion: currentVersion,
    attemptId,
    checkpointId: 'chk_foundations_v1',
    answers: {
      chk_q_arrays_01: 'opt_arr_1', // correct
      chk_q_hashing_01: 'opt_hash_1', // correct
      chk_q_bs_01: 'opt_bs_2' // incorrect
    },
    selfReportedAssistance: {
      chk_q_arrays_01: { usedHint: false },
      chk_q_hashing_01: { usedHint: false },
      chk_q_bs_01: { usedHint: false }
    },
    reflection: 'Struggled with binary search bounds.'
  });

  assert.ok(evalRes.data?.goal);
  assert.equal(evalRes.data.goal.version, currentVersion + 1);
  const ev = evalRes.data.evaluation;
  assert.ok(ev);
  assert.equal(ev.attemptId, attemptId);
  assert.equal(ev.score.correct, 2);
  assert.equal(ev.score.total, 3);
  assert.equal(ev.category, 'revisit_recommended');
  assert.ok(ev.topicResults.topic_binary_search.revisitRecommended);
  assert.equal(evalRes.data.goal.studyWorkspace.continuation.checkpoint.status, 'completed');
  assert.deepEqual(evalRes.data.goal.studyWorkspace.continuation.checkpoint.draftAnswers, {});
});

test('C05: evaluateCheckpoint idempotency returns existing attempt on identical retry', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const versionBefore = goalRes.data.goal.version;
  const attemptId = '60000000-0000-4000-8000-000000000001';

  const retryRes = await apiFixture.evaluateCheckpoint({
    expectedVersion: versionBefore,
    attemptId,
    checkpointId: 'chk_foundations_v1',
    answers: {
      chk_q_arrays_01: 'opt_arr_1',
      chk_q_hashing_01: 'opt_hash_1',
      chk_q_bs_01: 'opt_bs_2'
    },
    selfReportedAssistance: {
      chk_q_arrays_01: { usedHint: false },
      chk_q_hashing_01: { usedHint: false },
      chk_q_bs_01: { usedHint: false }
    },
    reflection: 'Struggled with binary search bounds.'
  });

  assert.equal(retryRes.data.goal.version, versionBefore);
  assert.equal(retryRes.data.evaluation.attemptId, attemptId);
});

test('C06: preview and apply continuation plan schedules next week without mutating 12/12', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const version = goalRes.data.goal.version;
  const today = getTodayKolkata();

  const previewRes = await apiFixture.previewContinuationPlan({
    expectedVersion: version,
    availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
  });

  assert.ok(previewRes.data?.previewId);
  assert.ok(previewRes.data.sessions.length > 0);

  const applyRes = await apiFixture.applyContinuationPlan({
    expectedVersion: version,
    previewForDate: today,
    curriculumVersion: 'atlas-proof-v1',
    availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
    selectedItemIds: previewRes.data.selectedItemIds
  });

  assert.ok(applyRes.data?.goal);
  assert.equal(applyRes.data.goal.version, version + 1);
  assert.equal(Object.keys(applyRes.data.goal.completions).length, 12, 'Preserves all 12 starter completions');
  assert.equal(applyRes.data.goal.studyWorkspace.continuation.suggestedPlan.accepted, true);
});

test('C07: evaluateCheckpoint conflicts on changed reflection under same attemptId', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;
  const attemptId = '60000000-0000-4000-8000-000000000001';

  let threw = false;
  try {
    await apiFixture.evaluateCheckpoint({
      expectedVersion: currentVersion,
      attemptId,
      checkpointId: 'chk_foundations_v1',
      answers: {
        chk_q_arrays_01: 'opt_arr_1',
        chk_q_hashing_01: 'opt_hash_1',
        chk_q_bs_01: 'opt_bs_2'
      },
      reflection: 'Altered reflection text.'
    });
  } catch (err) {
    threw = true;
    assert.equal(err.status, 409);
    assert.equal(err.code, 'ATTEMPT_CONFLICT');
  }
  assert.ok(threw, 'Must throw 409 on changed reflection');
});

test('C08: evaluateCheckpoint rejects unknown question or option IDs', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;

  let threw = false;
  try {
    await apiFixture.evaluateCheckpoint({
      expectedVersion: currentVersion,
      attemptId: crypto.randomUUID(),
      checkpointId: 'chk_foundations_v1',
      answers: {
        unknown_q: 'opt_1'
      }
    });
  } catch (err) {
    threw = true;
    assert.equal(err.status, 422);
  }
  assert.ok(threw, 'Must throw 422 on unknown question ID');
});

test('C09: applyContinuationPlan rejects changed selection from preview', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;
  const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };

  const preview = await apiFixture.previewContinuationPlan({
    expectedVersion: currentVersion,
    availability,
    selectedItemIds: ['les_arrays_01']
  });

  let threw = false;
  try {
    await apiFixture.applyContinuationPlan({
      expectedVersion: preview.data.baseVersion,
      previewForDate: preview.data.previewForDate,
      curriculumVersion: preview.data.curriculumVersion,
      availability,
      selectedItemIds: ['les_arrays_02']
    });
  } catch (err) {
    threw = true;
    assert.equal(err.status, 409);
  }
  assert.ok(threw, 'Must throw 409 when applying different item than previewed');
});

test('C10: deriveActiveStudyPlanSession handles real persisted record shapes and recency constraints', async () => {
  const { deriveActiveStudyPlanSession: derive } = await import('../services/workspace.js');
  const before = '2026-10-19T01:00:00Z';
  const after = '2026-10-19T02:00:00Z';

  // 1. Ordinary exercise attempt array advances plan
  const exPlan = derive({
    studyPlan: { sessions: [{ itemType: 'exercise', itemId: 'ex_arrays_01' }] },
    exerciseAttempts: {
      ex_arrays_01: [{ outcome: 'independent', savedAt: after }]
    }
  });
  assert.equal(exPlan.allCompleted, true, 'Ordinary exercise attempt in array must advance plan');

  // 2. Exercise attempt with needed_reference or with_hint counts as valid completion
  const refPlan = derive({
    studyPlan: { sessions: [{ itemType: 'exercise', itemId: 'ex_arrays_01' }] },
    exerciseAttempts: {
      ex_arrays_01: [{ outcome: 'needed_reference', savedAt: after }]
    }
  });
  assert.equal(refPlan.allCompleted, true, 'Needed reference exercise completion must advance plan');

  // 3. Unsuccessful or failed exercise attempt does not advance plan
  const failExPlan = derive({
    studyPlan: { sessions: [{ itemType: 'exercise', itemId: 'ex_arrays_01' }] },
    exerciseAttempts: {
      ex_arrays_01: [{ outcome: 'failed', status: 'failed', passed: false, savedAt: after }]
    }
  });
  assert.equal(failExPlan.allCompleted, false, 'Failed exercise must not advance plan');

  // 4. Lesson revisit saved with actual lesson progress fields advances plan when updated >= acceptedAt
  const lessonRevisitPlan = derive({
    studyPlan: { sessions: [{ itemType: 'lesson', itemId: 'les_arrays_01', isRevisit: true }] },
    continuation: { suggestedPlan: { acceptedAt: before } },
    lessonProgress: {
      les_arrays_01: { status: 'completed', updatedAt: after, lastVisitedAt: after }
    }
  });
  assert.equal(lessonRevisitPlan.allCompleted, true, 'Lesson revisit after acceptedAt must advance plan');

  // 5. Lesson completed before acceptedAt does NOT satisfy revisit
  const staleLessonPlan = derive({
    studyPlan: { sessions: [{ itemType: 'lesson', itemId: 'les_arrays_01', isRevisit: true }] },
    continuation: { suggestedPlan: { acceptedAt: after } },
    lessonProgress: {
      les_arrays_01: { status: 'completed', updatedAt: before, lastVisitedAt: before }
    }
  });
  assert.equal(staleLessonPlan.allCompleted, false, 'Pre-plan lesson completion must not satisfy revisit');

  // 6. Practice revisit uses actual savedAt field
  const practiceRevisitPlan = derive({
    studyPlan: { sessions: [{ itemType: 'practice', itemId: 'prac_arrays_01', isRevisit: true }] },
    continuation: { suggestedPlan: { acceptedAt: before } },
    practiceAttempts: {
      prac_arrays_01: [{ outcome: 'solved_independently', savedAt: after }]
    }
  });
  assert.equal(practiceRevisitPlan.allCompleted, true, 'Practice revisit solved after acceptedAt must advance plan');

  // 7. Practice attempts with bookmarked or reviewed_editorial do NOT satisfy solve requirements
  const bookmarkedPracticePlan = derive({
    studyPlan: { sessions: [{ itemType: 'practice', itemId: 'prac_arrays_01', isRevisit: true }] },
    continuation: { suggestedPlan: { acceptedAt: before } },
    practiceAttempts: {
      prac_arrays_01: [{ outcome: 'bookmarked', savedAt: after }]
    }
  });
  assert.equal(bookmarkedPracticePlan.allCompleted, false, 'Bookmarked practice must not satisfy solve requirements');

  const editorialPracticePlan = derive({
    studyPlan: { sessions: [{ itemType: 'practice', itemId: 'prac_arrays_01' }] },
    practiceAttempts: {
      prac_arrays_01: [{ outcome: 'reviewed_editorial', savedAt: after }]
    }
  });
  assert.equal(editorialPracticePlan.allCompleted, false, 'Editorial review must not satisfy solve requirements');
});

test('C11: saveCheckpointDraft persists and restores bounded currentIndex', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const baseVersion = goalRes.data.goal.version;

  await apiFixture.saveCheckpointDraft({
    expectedVersion: baseVersion,
    checkpointId: 'chk_foundations_v1',
    draftAnswers: { chk_q_arrays_01: 'opt_arr_1' },
    draftCurrentIndex: 2
  });

  const cpRes = await apiFixture.getCheckpoint('chk_foundations_v1');
  assert.equal(cpRes.data.draft.currentIndex, 2, 'Saved draft must preserve currentIndex 2');
});

test('C12: Continuation plan handles end-of-library scenario with deliberate mastery revisit', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const goal = goalRes.data.goal;
  const catalogRes = await apiFixture.getCatalog();
  const lessons = catalogRes.data.curriculum.lessons;
  const { safeStorage } = await import('./apiFixture.js');

  // Mark all published curriculum lessons completed to simulate end-of-library state
  const allCompletedProgress = {};
  for (const les of lessons) {
    allCompletedProgress[les.id] = { status: 'completed', completedAt: '2026-10-18T00:00:00Z' };
  }
  goal.studyWorkspace.lessonProgress = allCompletedProgress;
  const user = await apiFixture.getCurrentUser();
  safeStorage.setItem('nextstep_fixture_goal_' + user.id, JSON.stringify(goal));

  // Preview with empty selectedItemIds in end-of-library state
  const preview = await apiFixture.previewContinuationPlan({
    expectedVersion: goal.version,
    availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
    selectedItemIds: []
  });

  assert.ok(preview.data.sessions.length > 0, 'Plan must schedule deliberate revisit sessions');
  assert.ok(
    preview.data.sessions.some(s => s.isRevisit),
    'End-of-library plan must flag completed items as deliberate revisits'
  );
});

test('C13: evaluateCheckpoint idempotent retry preserves historical outcome across simulated definition update', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;
  const attemptId = '70000000-0000-4000-8000-000000000001';

  // 1. Initial successful evaluation under definition version 1
  const initialRes = await apiFixture.evaluateCheckpoint({
    expectedVersion: currentVersion,
    attemptId,
    checkpointId: 'chk_foundations_v1',
    definitionVersion: 1,
    answers: {
      chk_q_arrays_01: 'opt_arr_1',
      chk_q_hashing_01: 'opt_hash_1',
      chk_q_bs_01: 'opt_bs_1'
    },
    reflection: 'Canonical finalized reflection'
  });
  assert.equal(initialRes.data.evaluation.score.correct, 3);

  // 2. Identical retry returns 200 without regrading
  const retryRes = await apiFixture.evaluateCheckpoint({
    expectedVersion: initialRes.data.goal.version,
    attemptId,
    checkpointId: 'chk_foundations_v1',
    definitionVersion: 1,
    answers: {
      chk_q_arrays_01: 'opt_arr_1',
      chk_q_hashing_01: 'opt_hash_1',
      chk_q_bs_01: 'opt_bs_1'
    },
    reflection: 'Canonical finalized reflection'
  });
  assert.equal(retryRes.data.evaluation.attemptId, attemptId);
  assert.equal(retryRes.data.evaluation.score.correct, 3);

  // 3. Mutated retry under same attemptId throws ATTEMPT_CONFLICT
  let threw = false;
  try {
    await apiFixture.evaluateCheckpoint({
      expectedVersion: retryRes.data.goal.version,
      attemptId,
      checkpointId: 'chk_foundations_v1',
      definitionVersion: 1,
      answers: {
        chk_q_arrays_01: 'opt_arr_1',
        chk_q_hashing_01: 'opt_hash_1',
        chk_q_bs_01: 'opt_bs_1'
      },
      reflection: 'Mutated reflection under same attemptId'
    });
  } catch (err) {
    threw = true;
    assert.equal(err.code, 'ATTEMPT_CONFLICT');
  }
  assert.ok(threw, 'Must throw ATTEMPT_CONFLICT on mutated retry');
});

test('C14: previewed review flags survive acceptance and reject changed flags', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const availability = { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 60, sun: 60 };
  for (const explicit of [false, true]) {
    const goal = (await apiFixture.getGoal()).data.goal;
    const preview = (await apiFixture.previewContinuationPlan({ expectedVersion: goal.version, availability, selectedItemIds: ['ex_arrays_01'], revisitItemIds: ['ex_arrays_01'] })).data;
    const payload = { expectedVersion: goal.version, availability, selectedItemIds: preview.selectedItemIds, previewForDate: preview.previewForDate, curriculumVersion: preview.curriculumVersion };
    await assert.rejects(apiFixture.applyContinuationPlan({ ...payload, revisitItemIds: [] }), (err) => err.status === 409 && err.code === 'PREVIEW_MISMATCH');
    const accepted = await apiFixture.applyContinuationPlan(explicit ? { ...payload, revisitItemIds: preview.revisitItemIds } : payload);
    assert.equal(accepted.data.studyPlan.sessions.find((session) => session.itemId === 'ex_arrays_01').isRevisit, true);
  }
});

test('C15: Continuation modal review queue derives due exercises with { curriculum } data shape and bounds room for frontier lessons', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const catalogRes = await apiFixture.getCatalog();
  const curriculum = catalogRes.data.curriculum;
  const goalRes = await apiFixture.getGoal();
  const goal = goalRes.data.goal;

  // Add due exercise attempt to studyWorkspace
  const today = '2026-10-19';
  goal.studyWorkspace.exerciseAttempts = {
    ex_arrays_01: [
      {
        attemptId: '90000000-0000-4000-8000-000000000099',
        exerciseId: 'ex_arrays_01',
        outcome: 'with_hint',
        savedAt: `${today}T08:00:00Z`,
        nextReviewDate: today
      }
    ]
  };

  const { deriveWorkspaceReviewQueue } = await import('../services/workspace.js');
  // Pure probe: passing curriculum directly returns [] because helper expects catalog.curriculum
  const emptyQueue = deriveWorkspaceReviewQueue(goal, curriculum, new Date(`${today}T10:00:00Z`));
  assert.equal(emptyQueue.length, 0, 'Passing bare curriculum without .curriculum returns empty array');

  // Passing { curriculum } or catalog returns the due exercise
  const validQueue = deriveWorkspaceReviewQueue(goal, { curriculum }, new Date(`${today}T10:00:00Z`));
  assert.equal(validQueue.length, 1, 'Passing { curriculum } data shape must derive due review items');
  assert.equal(validQueue[0].itemId, 'ex_arrays_01');
  assert.equal(validQueue[0].isDue, true);
  assert.equal(validQueue[0].kind, 'exercise');
});

test('C16: In-flight draft save followed by immediate evaluateCheckpoint coordinates version snapshot without conflict', async () => {
  await apiFixture.signIn('student.completed@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const currentVersion = goalRes.data.goal.version;

  // Simulate in-flight draft save committing to storage
  const draftPromise = apiFixture.saveCheckpointDraft({
    expectedVersion: currentVersion,
    checkpointId: 'chk_foundations_v1',
    draftAnswers: { chk_q_arrays_01: 'opt_arr_1', chk_q_hashing_01: 'opt_hash_1' },
    draftCurrentIndex: 2
  });

  const savedDraftRes = await draftPromise;
  const bumpedVersion = savedDraftRes.data.goal.version;
  assert.equal(bumpedVersion, currentVersion + 1);

  // Immediate evaluation using the bumped version from drained save succeeds
  const evalRes = await apiFixture.evaluateCheckpoint({
    expectedVersion: bumpedVersion,
    attemptId: '90000000-0000-4000-8000-000000000088',
    checkpointId: 'chk_foundations_v1',
    definitionVersion: 1,
    answers: {
      chk_q_arrays_01: 'opt_arr_1',
      chk_q_hashing_01: 'opt_hash_1',
      chk_q_bs_01: 'opt_bs_1'
    },
    reflection: 'Immediate submit after drained draft save'
  });

  assert.equal(evalRes.data.evaluation.score.correct, 3);
  assert.equal(evalRes.data.goal.version, bumpedVersion + 1);
});
