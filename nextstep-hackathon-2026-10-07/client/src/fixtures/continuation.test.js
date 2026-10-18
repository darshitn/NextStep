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
    }
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
