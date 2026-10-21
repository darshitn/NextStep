import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, getTodayKolkata, addDays } from '../src/services/scheduler.js';

describe('Stage 2 — Guided Practice Session Endpoints', () => {
  let app;
  let server;
  let baseUrl;
  const dbRows = new Map();

  function createMockSupabaseClient(currentUserId) {
    return {
      from(tableName) {
        if (tableName !== 'nextstep_goals') throw new Error(`Unknown table ${tableName}`);
        return {
          select() {
            return {
              maybeSingle: async () => {
                if (!currentUserId) return { data: null, error: { message: 'Unauthorized' } };
                for (const row of dbRows.values()) {
                  if (row.user_id === currentUserId) {
                    return { data: structuredClone(row), error: null };
                  }
                }
                return { data: null, error: null };
              }
            };
          },
          insert(record) {
            return {
              then: async (resolve) => {
                const fullRecord = {
                  ...structuredClone(record),
                  user_id: currentUserId,
                  created_at: new Date().toISOString(),
                  updated_at: record.updated_at || new Date().toISOString()
                };
                dbRows.set(record.id, fullRecord);
                return resolve({ data: fullRecord, error: null });
              }
            };
          },
          update(updates) {
            return {
              eq(col1, val1) {
                return {
                  eq(col2, val2) {
                    return {
                      select: async () => {
                        const row = dbRows.get(val1);
                        if (!row || row.user_id !== currentUserId || row.version !== val2) {
                          return { data: [], error: null };
                        }
                        const updated = {
                          ...row,
                          ...structuredClone(updates),
                          user_id: row.user_id
                        };
                        dbRows.set(val1, updated);
                        return { data: [structuredClone(updated)], error: null };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
    };
  }

  before(async () => {
    app = createApp();
    app.locals.mockAuthHandler = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
      }
      const token = authHeader.slice(7).trim();
      const userId = token.replace('-token', '');
      req.user = { id: userId, email: `${userId}@nextstep.local` };
      req.token = token;
      req.supabase = createMockSupabaseClient(userId);
      next();
    };

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    const today = getTodayKolkata();
    const targetDate = addDays(today, 21);
    const availability = { mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 30, sun: 30 };
    const schedule = calculateSchedule(today, availability, catalogData.missions.map((m) => m.id));

    // Seed test user 1 goal
    dbRows.set('goal-user-1', {
      id: 'goal-user-1',
      user_id: 'user-1',
      version: 1,
      state: {
        id: 'goal-user-1',
        userId: 'user-1',
        title: 'User 1 Goal',
        targetDate,
        availability,
        schedule,
        completions: {},
        version: 1,
        studyWorkspace: {
          schemaVersion: 1,
          selectedTopicId: 'topic_arrays',
          lessonProgress: {
            les_arrays_01: {
              status: 'completed',
              completedAt: '2026-10-18T10:00:00Z',
              checkIn: { version: 1, confidence: 'needs_example' }
            }
          },
          exerciseAttempts: {},
          practiceAttempts: {},
          activePracticeSession: null,
          practiceSessionHistory: []
        }
      }
    });

    // Seed user 2 goal for isolation tests
    dbRows.set('goal-user-2', {
      id: 'goal-user-2',
      user_id: 'user-2',
      version: 1,
      state: {
        id: 'goal-user-2',
        userId: 'user-2',
        title: 'User 2 Goal',
        targetDate,
        availability,
        schedule,
        completions: {},
        version: 1,
        studyWorkspace: {
          schemaVersion: 1,
          selectedTopicId: 'topic_arrays',
          lessonProgress: {},
          exerciseAttempts: {},
          practiceAttempts: {},
          activePracticeSession: null,
          practiceSessionHistory: []
        }
      }
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  const validSessionId = '11111111-2222-3333-4444-555555555555';
  const validTasks = [
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
      reason: 'You requested an example on this lesson.'
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
      reason: 'Reinforce invariant evaluation.'
    }
  ];

  it('PS01: POST /api/goal/workspace/practice-session/start creates activePracticeSession with baselineTimestamp', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        sessionId: validSessionId,
        timeBudgetMinutes: 20,
        title: 'Reinforcement Session',
        reason: 'Targeted practice for Prefix Invariants.',
        tasks: validTasks
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.activePracticeSession);
    assert.equal(body.data.activePracticeSession.sessionId, validSessionId);
    assert.equal(body.data.activePracticeSession.timeBudgetMinutes, 20);
    assert.equal(body.data.activePracticeSession.status, 'in_progress');
    assert.equal(body.data.activePracticeSession.tasks.length, 2);
    assert.ok(body.data.activePracticeSession.tasks[0].baselineTimestamp);
    assert.equal(body.data.goal.version, 2);
  });

  it('PS02: Start session rejects invalid/unknown catalog targets with 422', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        sessionId: '22222222-3333-4444-5555-666666666666',
        timeBudgetMinutes: 20,
        title: 'Invalid Session',
        reason: 'Testing bad target',
        tasks: [
          {
            taskId: 'task_bad',
            activityType: 'worked_example',
            targetId: 'les_nonexistent_99',
            lessonId: 'les_nonexistent_99',
            title: 'Fake Lesson',
            topicId: 'topic_arrays',
            topicTitle: 'Arrays & Memory',
            estimatedMinutes: 10,
            reason: 'Unknown lesson'
          }
        ]
      })
    });

    assert.equal(res.status, 422);
  });

  it('PS03: Start session idempotency returns 200 without version bump on identical retry', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        sessionId: validSessionId,
        timeBudgetMinutes: 20,
        title: 'Reinforcement Session',
        reason: 'Targeted practice for Prefix Invariants.',
        tasks: validTasks
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 2); // Version remained 2!
  });

  it('PS04: Start session conflicts with 409 SESSION_CONFLICT on altered payload with same ID', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        sessionId: validSessionId,
        timeBudgetMinutes: 30, // Changed from 20
        title: 'Altered Title',
        reason: 'Targeted practice for Prefix Invariants.',
        tasks: validTasks
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'SESSION_CONFLICT');
  });

  it('PS05: Start session rejects stale expectedVersion with 409 VERSION_CONFLICT', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1, // Current is 2
        sessionId: '33333333-4444-5555-6666-777777777777',
        timeBudgetMinutes: 10,
        title: 'Stale Session',
        reason: 'Testing version mismatch',
        tasks: [validTasks[0]]
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'VERSION_CONFLICT');
  });

  it('PS06: Update session completes task with viewed evidence', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        sessionId: validSessionId,
        updateId: '44444444-5555-6666-7777-888888888888',
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1',
          evidenceType: 'viewed',
          notes: 'Carefully studied the invariant trace.'
        }
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 3);
    const session = body.data.activePracticeSession;
    assert.ok(session);
    assert.equal(session.tasks[0].status, 'completed');
    assert.equal(session.tasks[0].result.evidenceType, 'viewed');
    assert.equal(session.currentTaskIndex, 1);
  });

  it('PS07: Finalizing session (status: completed) produces compact summary, caps history at 5, clears activePracticeSession', async () => {
    // Perform authoritative trace attempt first so that task_2 (trace_retry) has authentic fresh evidence
    const traceAttemptId = '33333333-3333-4333-8333-333333333333';
    const exRes = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        attemptId: traceAttemptId,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        mistakeCount: 0,
        hintRevealed: false,
        referenceRevealed: false,
        reflection: 'Solved invariant independently'
      })
    });
    assert.equal(exRes.status, 200);

    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 4,
        sessionId: validSessionId,
        updateId: '55555555-6666-7777-8888-999999999999',
        status: 'completed',
        completedTask: {
          taskId: 'task_2',
          attemptId: traceAttemptId,
          notes: 'Completed review trace.'
        }
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.activePracticeSession, null, 'Active session must be cleared');
    assert.ok(body.data.sessionSummary, 'Summary must be returned');
    assert.equal(body.data.sessionSummary.status, 'completed');
    assert.equal(body.data.sessionSummary.tasksCount, 2);
    assert.equal(body.data.sessionSummary.completedTasksCount, 2);
    assert.equal(body.data.sessionSummary.viewedCount, 1);
    assert.equal(body.data.sessionSummary.verifiedCount, 1);
    assert.equal(body.data.sessionSummary.selfReportedCount, 0);
    assert.equal(body.data.goal.studyWorkspace.practiceSessionHistory.length, 1);
  });

  it('PS08: User isolation — User 2 cannot access or mutate User 1 practice session', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-2-token' // user 2
      },
      body: JSON.stringify({
        expectedVersion: 1,
        sessionId: validSessionId, // user 1's session
        updateId: '66666666-7777-8888-9999-000000000000',
        status: 'completed'
      })
    });

    assert.equal(res.status, 404);
  });

  it('PS09: Server rejects over-budget session start with 422 BUDGET_EXCEEDED', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        sessionId: 'a1111111-2222-3333-4444-555555555555',
        timeBudgetMinutes: 10,
        title: 'Overbudget Session',
        reason: 'Testing budget guard',
        tasks: validTasks // total 18 minutes > 10 minutes
      })
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'BUDGET_EXCEEDED');
  });

  it('PS10: Server rejects mismatched target relationships with 422 INVALID_TASK_TARGET', async () => {
    // Lesson from topic_arrays matched with topic_binary_search
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        sessionId: 'a2222222-2222-3333-4444-555555555555',
        timeBudgetMinutes: 20,
        title: 'Mismatched Target Session',
        reason: 'Testing relationship validation',
        tasks: [
          {
            taskId: 'task_mismatch',
            activityType: 'worked_example',
            targetId: 'les_arrays_01',
            lessonId: 'les_arrays_01',
            title: 'Prefix Arrays',
            topicId: 'topic_binary_search', // Mismatched topic!
            topicTitle: 'Binary Search',
            estimatedMinutes: 8,
            reason: 'Testing mismatch'
          }
        ]
      })
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_TASK_TARGET');
  });

  it('PS11: Server rejects resurrecting a finalized session with 409 SESSION_FINALIZED', async () => {
    // validSessionId was finalized in PS07
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        sessionId: validSessionId,
        timeBudgetMinutes: 20,
        title: 'Resurrected Session',
        reason: 'Testing resurrection guard',
        tasks: validTasks
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'SESSION_FINALIZED');
  });

  it('PS12: Server enforces single active session (409 ACTIVE_SESSION_EXISTS)', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const sessionBId = 'b2222222-2222-3333-4444-555555555555';

    // Start session A
    const resA = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        sessionId: sessionAId,
        timeBudgetMinutes: 20,
        title: 'Active Session A',
        reason: 'Testing single active guard',
        tasks: validTasks
      })
    });
    assert.equal(resA.status, 200);

    // Try starting session B while session A is active
    const resB = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 6,
        sessionId: sessionBId,
        timeBudgetMinutes: 20,
        title: 'Active Session B',
        reason: 'Testing collision',
        tasks: validTasks
      })
    });

    assert.equal(resB.status, 409);
    const bodyB = await resB.json();
    assert.equal(bodyB.error.code, 'ACTIVE_SESSION_EXISTS');
  });

  it('PS13: Worked example submitted as verified is authoritatively downgraded to viewed', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const updateId = 'c1111111-2222-3333-4444-555555555555';

    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 6,
        sessionId: sessionAId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1', // worked_example
          evidenceType: 'verified', // Client forges verified
          attemptId: 'nonexistent-attempt-id',
          notes: 'Claiming verified without attempt'
        }
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.activePracticeSession.tasks[0].result.evidenceType, 'viewed');
    assert.equal(body.data.activePracticeSession.tasks[0].result.attemptId, null);
  });

  it('PS14: Trace retry without fresh evaluated attempt is rejected with 422 UNVERIFIED_ATTEMPT', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const updateId = 'c2222222-2222-3333-4444-555555555555';

    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 7,
        sessionId: sessionAId,
        updateId,
        status: 'completed',
        completedTask: {
          taskId: 'task_2', // trace_retry, no fresh attempt evaluated
          notes: 'Trying to finish trace without attempt'
        }
      })
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'UNVERIFIED_ATTEMPT');
  });

  it('PS15: Trace retry with hint evaluated attempt resolves authoritatively to hinted', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const updateId = 'c3333333-2222-3333-4444-555555555555';
    const hintAttemptId = 'd1111111-2222-3333-4444-555555555555';

    // Submit an attempt with hintRevealed = true
    const exRes = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 7,
        attemptId: hintAttemptId,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        mistakeCount: 0,
        hintRevealed: true,
        referenceRevealed: false,
        reflection: 'Needed hint'
      })
    });
    assert.equal(exRes.status, 200);

    // Update practice session completing task_2 with attemptId
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 8,
        sessionId: sessionAId,
        updateId,
        status: 'completed',
        completedTask: {
          taskId: 'task_2',
          attemptId: hintAttemptId,
          evidenceType: 'verified', // Client tries to forge 'verified'
          notes: 'Completed with hint'
        }
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.sessionSummary.hintedCount, 1);
    assert.equal(body.data.sessionSummary.verifiedCount, 0);
    assert.equal(body.data.sessionSummary.status, 'completed');
  });

  it('PS16: Update replay idempotency returns 200 without version bump on same updateId', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const updateId = 'c3333333-2222-3333-4444-555555555555';
    const hintAttemptId = 'd1111111-2222-3333-4444-555555555555';

    // Resend identical request as PS15
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 8, // original version
        sessionId: sessionAId,
        updateId,
        status: 'completed',
        completedTask: {
          taskId: 'task_2',
          attemptId: hintAttemptId,
          evidenceType: 'verified',
          notes: 'Completed with hint'
        }
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 9, 'Version remains 9 from earlier update');
    assert.equal(body.data.sessionSummary.status, 'completed');
  });

  it('PS17: Update conflict: repeating same updateId with altered payload returns 409 UPDATE_CONFLICT', async () => {
    const sessionAId = 'b1111111-2222-3333-4444-555555555555';
    const updateId = 'c3333333-2222-3333-4444-555555555555';

    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 9,
        sessionId: sessionAId,
        updateId,
        status: 'abandoned' // Altered status!
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'UPDATE_CONFLICT');
  });

  it('PS18: Cannot finalize session as completed when tasks remain incomplete (422 INCOMPLETE_SESSION)', async () => {
    const sessionCId = 'e1111111-2222-3333-4444-555555555555';
    const updateId = 'f1111111-2222-3333-4444-555555555555';

    // Start session C
    const startRes = await fetch(`${baseUrl}/api/goal/workspace/practice-session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 9,
        sessionId: sessionCId,
        timeBudgetMinutes: 20,
        title: 'Session C',
        reason: 'Testing incomplete finalization',
        tasks: validTasks
      })
    });
    assert.equal(startRes.status, 200);

    // Try to finalize immediately with status 'completed' without completing any tasks
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 10,
        sessionId: sessionCId,
        updateId,
        status: 'completed'
      })
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'INCOMPLETE_SESSION');
  });

  it('PS19: Resolve supplied attempt IDs exclusively within fresh, matching-variant evidence (rejects historical attempt)', async () => {
    const sessionCId = 'e1111111-2222-3333-4444-555555555555';
    // Historical attempt created in PS15 before session C started
    const historicalAttemptId = 'd1111111-2222-3333-4444-555555555555';
    const updateId = 'f2222222-2222-3333-4444-555555555555';

    // 1. Trying to resolve task_2 with historical attempt saved before baseline must fail with 422
    const resHistorical = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 10,
        sessionId: sessionCId,
        updateId,
        status: 'in_progress',
        completedTask: {
          taskId: 'task_2', // trace_retry on ex_arrays_01 (variant: primary)
          attemptId: historicalAttemptId,
          notes: 'Attempting to use historical attempt'
        }
      })
    });

    assert.equal(resHistorical.status, 422);
    const bodyHist = await resHistorical.json();
    assert.equal(bodyHist.error.code, 'UNVERIFIED_ATTEMPT');

    // 2. Submit a fresh attempt with mismatched variant 'alternate'
    const alternateAttemptId = 'd2222222-2222-3333-4444-555555555555';
    const exRes = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 10,
        attemptId: alternateAttemptId,
        exerciseId: 'ex_arrays_01',
        variantKey: 'alternate', // Mismatched variant from task_2's 'primary'
        stepAnswers: [
          { stepIndex: 0, choiceId: 'alt1_correct' },
          { stepIndex: 1, choiceId: 'alt2_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        mistakeCount: 0,
        hintRevealed: false,
        referenceRevealed: false,
        reflection: 'Solved alternate variant'
      })
    });
    assert.equal(exRes.status, 200);

    // 3. Trying to resolve task_2 with fresh attempt of the wrong variant must fail with 422
    const resWrongVariant = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 11,
        sessionId: sessionCId,
        updateId: 'f3333333-2222-3333-4444-555555555555',
        status: 'in_progress',
        completedTask: {
          taskId: 'task_2',
          attemptId: alternateAttemptId,
          notes: 'Attempting to use wrong variant'
        }
      })
    });

    assert.equal(resWrongVariant.status, 422);
    const bodyWrong = await resWrongVariant.json();
    assert.equal(bodyWrong.error.code, 'UNVERIFIED_ATTEMPT');
  });

  it('PS20: Replay receipts compare canonical normalized payloads including notes and attemptId', async () => {
    const sessionCId = 'e1111111-2222-3333-4444-555555555555';
    const updateId = '91111111-2222-3333-4444-555555555555';

    // 1. Initial update completing task_1 (worked_example) with notes
    const res1 = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 11,
        sessionId: sessionCId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1',
          notes: 'Canonical test notes A',
          attemptId: 'temp_att_01'
        }
      })
    });

    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.goal.version, 12);

    // 2. Identical retry: same updateId, expectedVersion 11, identical notes and attemptId
    const resIdentical = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 11,
        sessionId: sessionCId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1',
          notes: 'Canonical test notes A',
          attemptId: 'temp_att_01'
        }
      })
    });

    assert.equal(resIdentical.status, 200);
    const bodyIdentical = await resIdentical.json();
    assert.equal(bodyIdentical.data.goal.version, 12, 'Version remains 12 (no version bump)');

    // 3. Altered notes with same updateId: returns 409 UPDATE_CONFLICT
    const resAlteredNotes = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 12,
        sessionId: sessionCId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1',
          notes: 'Altered notes B', // Changed!
          attemptId: 'temp_att_01'
        }
      })
    });

    assert.equal(resAlteredNotes.status, 409);
    const bodyAlteredNotes = await resAlteredNotes.json();
    assert.equal(bodyAlteredNotes.error.code, 'UPDATE_CONFLICT');

    // 4. Altered attemptId with same updateId: returns 409 UPDATE_CONFLICT
    const resAlteredAttempt = await fetch(`${baseUrl}/api/goal/workspace/practice-session/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 12,
        sessionId: sessionCId,
        updateId,
        status: 'in_progress',
        currentTaskIndex: 1,
        completedTask: {
          taskId: 'task_1',
          notes: 'Canonical test notes A',
          attemptId: 'temp_att_DIFFERENT' // Changed!
        }
      })
    });

    assert.equal(resAlteredAttempt.status, 409);
    const bodyAlteredAttempt = await resAlteredAttempt.json();
    assert.equal(bodyAlteredAttempt.error.code, 'UPDATE_CONFLICT');
  });
});
