import test from 'node:test';
import assert from 'node:assert/strict';
import {
  derivePracticeSessionProposal,
  deriveAdaptiveReinforcement
} from '../services/workspace.js';
import { apiFixture } from './apiFixture.js';
import curriculumData from './curriculum.json' with { type: 'json' };

const MOCK_CATALOG = {
  curriculum: curriculumData
};

test('PSP01: derivePracticeSessionProposal respects 10-minute budget with at most 1 task', () => {
  const goal = {
    id: 'goal_budget_10',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-18T10:00:00Z',
          checkIn: { version: 1, confidence: 'needs_example' }
        }
      }
    }
  };

  const proposal = derivePracticeSessionProposal(goal, MOCK_CATALOG, { timeBudgetMinutes: 10 });
  assert.equal(proposal.timeBudgetMinutes, 10);
  assert.equal(proposal.tasks.length, 1);
  assert.ok(proposal.tasks[0].estimatedMinutes <= 10);
  assert.equal(proposal.tasks[0].activityType, 'worked_example');
  assert.ok(proposal.reason.includes('Worked Example Needed') || proposal.reason.includes('reinforce'));
});

test('PSP02: derivePracticeSessionProposal respects 20-minute budget with 1-2 tasks', () => {
  const goal = {
    id: 'goal_budget_20',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-18T10:00:00Z',
          checkIn: { version: 1, confidence: 'needs_example' }
        }
      },
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_1',
            outcome: 'with_hint',
            mistakeCount: 1,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-25'
          }
        ]
      }
    }
  };

  const proposal = derivePracticeSessionProposal(goal, MOCK_CATALOG, { timeBudgetMinutes: 20 });
  assert.equal(proposal.timeBudgetMinutes, 20);
  assert.ok(proposal.tasks.length >= 1 && proposal.tasks.length <= 2);
  assert.ok(proposal.totalEstimatedMinutes <= 22);
});

test('PSP03: derivePracticeSessionProposal respects 30-minute budget with up to 3 tasks', () => {
  const goal = {
    id: 'goal_budget_30',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-18T10:00:00Z',
          checkIn: { version: 1, confidence: 'needs_example' }
        }
      },
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_1',
            outcome: 'with_hint',
            mistakeCount: 1,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-25'
          }
        ]
      },
      practiceAttempts: {
        prac_arrays_01: [
          {
            attemptId: 'p1',
            outcome: 'with_hint',
            needsReview: true,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-28'
          }
        ]
      }
    }
  };

  const proposal = derivePracticeSessionProposal(goal, MOCK_CATALOG, { timeBudgetMinutes: 30 });
  assert.equal(proposal.timeBudgetMinutes, 30);
  assert.ok(proposal.tasks.length >= 2 && proposal.tasks.length <= 3);
  assert.ok(proposal.totalEstimatedMinutes <= 32);
});

test('PSP04: derivePracticeSessionProposal filters excludedActivityIds', () => {
  const goal = {
    id: 'goal_excluded',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-18T10:00:00Z',
          checkIn: { version: 1, confidence: 'needs_example' }
        }
      }
    }
  };

  const proposal = derivePracticeSessionProposal(goal, MOCK_CATALOG, {
    timeBudgetMinutes: 20,
    excludedActivityIds: ['les_arrays_01']
  });

  // les_arrays_01 was excluded, so tasks must not contain les_arrays_01 as a struggle
  const containsExcluded = proposal.tasks.some((t) => t.targetId === 'les_arrays_01' && t.taskId.includes('struggle'));
  assert.equal(containsExcluded, false);
});

test('PSP05: apiFixture practice session lifecycle (start, complete tasks, finalize with summary)', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const initialVersion = goalRes.data.goal.version;

  const sessionId = '77777777-8888-9999-aaaa-bbbbbbbbbbbb';
  const tasks = [
    {
      taskId: 'task_1',
      activityType: 'worked_example',
      targetId: 'les_arrays_01',
      lessonId: 'les_arrays_01',
      exerciseId: 'ex_arrays_01',
      title: 'Review Worked Example: Prefix Invariants',
      topicId: 'topic_arrays',
      topicTitle: 'Arrays & Memory',
      estimatedMinutes: 8,
      reason: 'Requested example.'
    },
    {
      taskId: 'task_2',
      activityType: 'trace_retry',
      targetId: 'ex_arrays_01',
      lessonId: 'les_arrays_01',
      exerciseId: 'ex_arrays_01',
      variantKey: 'primary',
      title: 'Proof Trace: Best Time to Buy and Sell Stock',
      topicId: 'topic_arrays',
      topicTitle: 'Arrays & Memory',
      estimatedMinutes: 10,
      reason: 'Unassisted verification.'
    }
  ];

  // 1. Start session
  const startRes = await apiFixture.startPracticeSession({
    expectedVersion: initialVersion,
    sessionId,
    timeBudgetMinutes: 20,
    title: 'Reinforcement Session',
    reason: 'Reviewing arrays invariants',
    tasks
  });

  assert.ok(startRes.data.activePracticeSession);
  assert.equal(startRes.data.activePracticeSession.sessionId, sessionId);
  assert.equal(startRes.data.activePracticeSession.status, 'in_progress');
  assert.equal(startRes.data.activePracticeSession.tasks[0].status, 'pending');
  assert.ok(startRes.data.activePracticeSession.tasks[0].baselineTimestamp);
  assert.equal(startRes.data.goal.version, initialVersion + 1);

  // 2. Complete task 1 (viewed)
  const updateRes1 = await apiFixture.updatePracticeSession({
    expectedVersion: startRes.data.goal.version,
    sessionId,
    updateId: '88888888-9999-aaaa-bbbb-cccccccccccc',
    status: 'in_progress',
    currentTaskIndex: 1,
    completedTask: {
      taskId: 'task_1',
      evidenceType: 'viewed',
      notes: 'Reviewed invariant steps.'
    }
  });

  assert.equal(updateRes1.data.activePracticeSession.tasks[0].status, 'completed');
  assert.equal(updateRes1.data.activePracticeSession.tasks[0].result.evidenceType, 'viewed');
  assert.equal(updateRes1.data.activePracticeSession.currentTaskIndex, 1);
  assert.equal(updateRes1.data.goal.version, initialVersion + 2);

  // Save evaluated exercise attempt for task 2
  const attemptRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: updateRes1.data.goal.version,
    exerciseId: 'ex_arrays_01',
    attemptId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    variantKey: 'primary',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'c1_correct' },
      { stepIndex: 1, choiceId: 'c2_correct' },
      { stepIndex: 2, choiceId: 'c3_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    mistakeCount: 0,
    reflection: 'Traced steps independently.'
  });

  // 3. Complete task 2 and finalize session (completed)
  const finalizeRes = await apiFixture.updatePracticeSession({
    expectedVersion: attemptRes.data.goal.version,
    sessionId,
    updateId: '99999999-aaaa-bbbb-cccc-dddddddddddd',
    status: 'completed',
    completedTask: {
      taskId: 'task_2',
      attemptId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      notes: 'Traced steps independently.'
    }
  });

  assert.equal(finalizeRes.data.activePracticeSession, null, 'Active session must be cleared');
  assert.ok(finalizeRes.data.sessionSummary, 'Summary must be returned');
  assert.equal(finalizeRes.data.sessionSummary.sessionId, sessionId);
  assert.equal(finalizeRes.data.sessionSummary.status, 'completed');
  assert.equal(finalizeRes.data.sessionSummary.tasksCount, 2);
  assert.equal(finalizeRes.data.sessionSummary.completedTasksCount, 2);
  assert.equal(finalizeRes.data.sessionSummary.viewedCount, 1);
  assert.equal(finalizeRes.data.sessionSummary.verifiedCount, 1);
  assert.equal(finalizeRes.data.sessionSummary.selfReportedCount, 0);

  // Check history in goal
  const history = finalizeRes.data.goal.studyWorkspace.practiceSessionHistory;
  assert.ok(history.length >= 1);
  assert.equal(history[history.length - 1].sessionId, sessionId);
});

test('PSP06: Reject historical or mismatched-variant attempt ID with 422 UNVERIFIED_ATTEMPT', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const initialVersion = goalRes.data.goal.version;

  const sessionId = '88888888-1111-2222-3333-444444444444';
  const startRes = await apiFixture.startPracticeSession({
    expectedVersion: initialVersion,
    sessionId,
    timeBudgetMinutes: 20,
    title: 'Reinforcement Session',
    reason: 'Testing attempt resolution',
    tasks: [
      {
        taskId: 'task_trace_1',
        activityType: 'trace_retry',
        targetId: 'ex_arrays_01',
        lessonId: 'les_arrays_01',
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        title: 'Proof Trace: Best Time to Buy and Sell Stock',
        topicId: 'topic_arrays',
        topicTitle: 'Arrays & Memory',
        estimatedMinutes: 10,
        reason: 'Unassisted verification.'
      }
    ]
  });

  // 1. Attempt to resolve with historical attempt from earlier session (saved before task baseline)
  const historicalAttemptId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  await assert.rejects(
    async () => {
      await apiFixture.updatePracticeSession({
        expectedVersion: startRes.data.goal.version,
        sessionId,
        updateId: 'upd_hist_01',
        status: 'completed',
        completedTask: {
          taskId: 'task_trace_1',
          attemptId: historicalAttemptId,
          notes: 'Attempting to reuse historical attempt'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, 'UNVERIFIED_ATTEMPT');
      return true;
    }
  );

  // 2. Save a fresh attempt with wrong variant ('alternate')
  const altAttemptRes = await apiFixture.saveExerciseAttempt({
    expectedVersion: startRes.data.goal.version,
    exerciseId: 'ex_arrays_01',
    attemptId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
    variantKey: 'alternate',
    stepAnswers: [
      { stepIndex: 0, choiceId: 'alt1_correct' },
      { stepIndex: 1, choiceId: 'alt2_correct' }
    ],
    edgeChoiceId: 'ec_arr1_correct',
    mistakeCount: 0,
    reflection: 'Traced alternate variant'
  });

  // 3. Attempt to resolve task_trace_1 (variant: primary) with fresh attempt of wrong variant ('alternate')
  await assert.rejects(
    async () => {
      await apiFixture.updatePracticeSession({
        expectedVersion: altAttemptRes.data.goal.version,
        sessionId,
        updateId: 'upd_wrong_variant_01',
        status: 'completed',
        completedTask: {
          taskId: 'task_trace_1',
          attemptId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
          notes: 'Attempting to use wrong variant'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 422);
      assert.equal(err.code, 'UNVERIFIED_ATTEMPT');
      return true;
    }
  );

  // Clean up: abandon the session so future tests have no active session collision
  await apiFixture.updatePracticeSession({
    expectedVersion: altAttemptRes.data.goal.version,
    sessionId,
    updateId: 'upd_cleanup_01',
    status: 'abandoned'
  });
});

test('PSP07: Replay receipts compare canonical normalized payloads including notes and attemptId', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const goalRes = await apiFixture.getGoal();
  const initialVersion = goalRes.data.goal.version;

  const sessionId = '99999999-1111-2222-3333-555555555555';
  const startRes = await apiFixture.startPracticeSession({
    expectedVersion: initialVersion,
    sessionId,
    timeBudgetMinutes: 10,
    title: 'Reinforcement Session for Replay',
    reason: 'Testing replay receipts',
    tasks: [
      {
        taskId: 'task_ex_1',
        activityType: 'worked_example',
        targetId: 'les_arrays_01',
        lessonId: 'les_arrays_01',
        title: 'Review Worked Example',
        topicId: 'topic_arrays',
        topicTitle: 'Arrays & Memory',
        estimatedMinutes: 8,
        reason: 'Requested example.'
      }
    ]
  });

  const updateId = 'upd_replay_canonical_01';
  // 1. Initial update
  const res1 = await apiFixture.updatePracticeSession({
    expectedVersion: startRes.data.goal.version,
    sessionId,
    updateId,
    status: 'in_progress',
    currentTaskIndex: 0,
    completedTask: {
      taskId: 'task_ex_1',
      notes: 'Notes A',
      attemptId: 'att_001'
    }
  });

  const updatedVersion = res1.data.goal.version;
  assert.equal(updatedVersion, startRes.data.goal.version + 1);

  // 2. Identical retry: same updateId, expectedVersion, notes, attemptId
  const resIdentical = await apiFixture.updatePracticeSession({
    expectedVersion: startRes.data.goal.version, // original expectedVersion
    sessionId,
    updateId,
    status: 'in_progress',
    currentTaskIndex: 0,
    completedTask: {
      taskId: 'task_ex_1',
      notes: 'Notes A',
      attemptId: 'att_001'
    }
  });

  assert.equal(resIdentical.data.goal.version, updatedVersion, 'Version must not bump on identical retry');

  // 3. Altered notes with same updateId -> throws 409 UPDATE_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.updatePracticeSession({
        expectedVersion: updatedVersion,
        sessionId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 0,
        completedTask: {
          taskId: 'task_ex_1',
          notes: 'Notes B (Altered)',
          attemptId: 'att_001'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'UPDATE_CONFLICT');
      return true;
    }
  );

  // 4. Altered attemptId with same updateId -> throws 409 UPDATE_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.updatePracticeSession({
        expectedVersion: updatedVersion,
        sessionId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 0,
        completedTask: {
          taskId: 'task_ex_1',
          notes: 'Notes A',
          attemptId: 'att_002_ALTERED'
        }
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'UPDATE_CONFLICT');
      return true;
    }
  );
});
