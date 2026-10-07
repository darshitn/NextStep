import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture } from './apiFixture.js';

test('L01: saveLearningContext saves blocker fields and increments version', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const initRes = await apiFixture.getGoal();
  const initialGoal = initRes.data.goal;
  const initialVersion = initialGoal.version;

  const saveRes = await apiFixture.saveLearningContext({
    expectedVersion: initialVersion,
    missionId: 'm04',
    category: 'too_difficult',
    whatTried: 'Created a hash set and iterated with a for loop',
    whereStuck: 'Unsure which index identifies the second occurrence',
    selfReportedStatus: 'still_unsure'
  });

  const updatedGoal = saveRes.data.goal;
  assert.equal(updatedGoal.version, initialVersion + 1);
  assert.ok(updatedGoal.learning);
  assert.ok(updatedGoal.learning.m04);
  assert.equal(updatedGoal.learning.m04.category, 'too_difficult');
  assert.equal(updatedGoal.learning.m04.whatTried, 'Created a hash set and iterated with a for loop');
  assert.equal(updatedGoal.learning.m04.whereStuck, 'Unsure which index identifies the second occurrence');
  assert.equal(updatedGoal.learning.m04.selfReportedStatus, 'still_unsure');
});

test('L02: submitLearningCheck saves assessment without modifying completions, XP or schedule', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;
  const completionsBefore = Object.keys(currentGoal.completions || {}).length;
  const xpBefore = currentGoal.xp;
  const scheduleLengthBefore = currentGoal.schedule.length;

  const checkRes = await apiFixture.submitLearningCheck({
    expectedVersion: currentGoal.version,
    missionId: 'm04',
    questionId: 'q_m04_duplicate_set',
    answer: 'At index 2 the value is 2, and the set already contains {2, 5}.',
    selfReportedStatus: 'ready_to_continue'
  });

  const assessedGoal = checkRes.data.goal;
  assert.equal(assessedGoal.version, currentGoal.version + 1);
  assert.ok(checkRes.data.assessment);
  assert.equal(checkRes.data.assessment.status, 'on_track');
  assert.ok(checkRes.data.assessment.explanation);
  assert.ok(checkRes.data.assessment.nextStep);

  // Invariance check: completions, XP, and schedule must NOT change
  assert.equal(Object.keys(assessedGoal.completions || {}).length, completionsBefore);
  assert.equal(assessedGoal.xp, xpBefore);
  assert.equal(assessedGoal.schedule.length, scheduleLengthBefore);
});

test('L03: dismiss learning context marks dismissed without deleting saved blocker data or assessment', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;

  const dismissRes = await apiFixture.saveLearningContext({
    expectedVersion: currentGoal.version,
    missionId: 'm04',
    dismissed: true
  });

  const goalAfterDismiss = dismissRes.data.goal;
  const m04Record = goalAfterDismiss.learning.m04;
  assert.equal(m04Record.dismissed, true);
  // Blocker data preserved
  assert.equal(m04Record.whatTried, 'Created a hash set and iterated with a for loop');
  assert.equal(m04Record.whereStuck, 'Unsure which index identifies the second occurrence');
  // Assessment data preserved
  assert.ok(m04Record.assessment, 'Assessment must survive dismiss');
  assert.equal(m04Record.assessment.status, 'on_track');
});

test('L04: version conflict on saveLearningContext rejects stale updates', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;
  const staleVersion = currentGoal.version - 1;

  await assert.rejects(
    async () => {
      await apiFixture.saveLearningContext({
        expectedVersion: staleVersion,
        missionId: 'm04',
        whatTried: 'stale update'
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'VERSION_CONFLICT');
      return true;
    }
  );
});

test('L05: save notes → assess → change self-reported status preserves assessment and notes', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;

  const statusRes = await apiFixture.saveLearningContext({
    expectedVersion: currentGoal.version,
    missionId: 'm04',
    selfReportedStatus: 'ready_to_continue'
  });

  const goalAfterStatus = statusRes.data.goal;
  const m04Record = goalAfterStatus.learning.m04;
  assert.equal(m04Record.selfReportedStatus, 'ready_to_continue');
  assert.equal(m04Record.whatTried, 'Created a hash set and iterated with a for loop');
  assert.ok(m04Record.assessment, 'Assessment must survive status change');
  assert.equal(m04Record.assessment.status, 'on_track');
});

test('L06: guidance question survives save and reload with checkQuestion and questionText', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;

  const guidanceRes = await apiFixture.getGuidance({
    expectedVersion: currentGoal.version,
    missionId: 'm02',
    category: 'too_difficult'
  });

  const guidanceData = guidanceRes.data.guidance;
  assert.ok(guidanceData.checkQuestion);
  assert.ok(guidanceData.questionText);
  assert.equal(guidanceData.checkQuestion, guidanceData.questionText);

  // Save context with guidance
  const saveRes = await apiFixture.saveLearningContext({
    expectedVersion: currentGoal.version,
    missionId: 'm02',
    guidance: guidanceData
  });

  const reloadedGoal = (await apiFixture.getGoal()).data.goal;
  assert.ok(reloadedGoal.learning.m02.guidance);
  assert.equal(reloadedGoal.learning.m02.guidance.checkQuestion, guidanceData.checkQuestion);
  assert.equal(reloadedGoal.learning.m02.guidance.questionText, guidanceData.questionText);
});

test('L07: mission switching does not leak previous mission input or assessment', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;

  // m04 has saved learning context and assessment from earlier tests
  assert.ok(currentGoal.learning.m04);
  assert.ok(currentGoal.learning.m04.assessment);

  // m02 has guidance from L06 but no assessment
  assert.equal(currentGoal.learning.m02?.assessment, undefined);

  // Save learning context for m02
  const saveM02 = await apiFixture.saveLearningContext({
    expectedVersion: currentGoal.version,
    missionId: 'm02',
    category: 'need_revision',
    whatTried: 'Attempted linear scan for 8',
    whereStuck: 'Loop boundary index',
    selfReportedStatus: 'still_unsure'
  });

  const updatedGoal = saveM02.data.goal;
  // m02 has its own context
  assert.equal(updatedGoal.learning.m02.category, 'need_revision');
  assert.equal(updatedGoal.learning.m02.whatTried, 'Attempted linear scan for 8');
  assert.equal(updatedGoal.learning.m02.assessment, undefined);

  // m04 remains untouched and isolated
  assert.equal(updatedGoal.learning.m04.category, 'too_difficult');
  assert.equal(updatedGoal.learning.m04.whatTried, 'Created a hash set and iterated with a for loop');
  assert.ok(updatedGoal.learning.m04.assessment);
  assert.equal(updatedGoal.learning.m04.assessment.status, 'on_track');
});

test('L08: draft text preservation after 409 conflict allows explicit retry with updated version', async () => {
  const goalRes = await apiFixture.getGoal();
  const currentGoal = goalRes.data.goal;

  // Student drafts a new blocker note locally
  const studentDraft = {
    missionId: 'm02',
    category: 'need_revision',
    whatTried: 'Revised loop boundary condition to i < length',
    whereStuck: 'Still uncertain on return value when not found',
    selfReportedStatus: 'still_unsure'
  };

  // Attempt save with stale version (simulates concurrent update)
  const staleVersion = currentGoal.version - 1;
  let saveFailed = false;

  try {
    await apiFixture.saveLearningContext({
      expectedVersion: staleVersion,
      ...studentDraft
    });
  } catch (err) {
    saveFailed = true;
    assert.equal(err.status, 409);
    assert.equal(err.code, 'VERSION_CONFLICT');
  }
  assert.equal(saveFailed, true, 'Save should fail with 409');

  // Verify student draft was NOT destroyed and can be retried with fresh version
  const freshGoalRes = await apiFixture.getGoal();
  const freshVersion = freshGoalRes.data.goal.version;

  const retryRes = await apiFixture.saveLearningContext({
    expectedVersion: freshVersion,
    ...studentDraft
  });

  assert.ok(retryRes.data?.goal);
  const finalGoal = retryRes.data.goal;
  assert.equal(finalGoal.learning.m02.whatTried, 'Revised loop boundary condition to i < length');
  assert.equal(finalGoal.learning.m02.whereStuck, 'Still uncertain on return value when not found');
});
