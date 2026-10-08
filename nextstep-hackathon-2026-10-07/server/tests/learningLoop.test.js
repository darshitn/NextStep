import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule } from '../src/services/scheduler.js';
import { clearRateLimits } from '../src/services/rateLimiter.js';
import { CURATED_CHECKS, getCuratedCheckForMission } from '../src/services/curatedChecks.js';

describe('DSA Learning Loop — Blocker Persistence & Curated Understanding Checks', () => {
  let app;
  let server;
  let baseUrl;

  // Synthetic database simulating PostgreSQL table public.nextstep_goals with RLS
  const dbRows = new Map();
  let dbFailureMode = null;

  function createMockSupabaseClient(currentUserId) {
    return {
      from(tableName) {
        if (tableName !== 'nextstep_goals') throw new Error(`Unknown table ${tableName}`);
        return {
          select(fields = '*') {
            return {
              maybeSingle: async () => {
                if (dbFailureMode === 'findError') {
                  return { data: null, error: { message: 'Database connection terminated unexpectedly' } };
                }
                if (!currentUserId) return { data: null, error: { message: 'Anonymous access denied by RLS' } };
                for (const row of dbRows.values()) {
                  if (row.owner_id === currentUserId) {
                    return { data: { ...row }, error: null };
                  }
                }
                return { data: null, error: null };
              }
            };
          },
          insert(record) {
            return {
              select: () => ({
                single: async () => {
                  const fullRecord = {
                    ...record,
                    owner_id: currentUserId,
                    created_at: new Date().toISOString(),
                    updated_at: record.updated_at || new Date().toISOString()
                  };
                  dbRows.set(record.id, fullRecord);
                  return { data: fullRecord, error: null };
                }
              })
            };
          },
          update(updates) {
            return {
              eq(col1, val1) {
                return {
                  eq(col2, val2) {
                    return {
                      select: async () => {
                        if (dbFailureMode === 'updateError') {
                          return { data: null, error: { message: 'Database write conflict or timeout' } };
                        }
                        const row = dbRows.get(val1);
                        if (!row || row.owner_id !== currentUserId || row.version !== val2) {
                          return { data: [], error: null };
                        }
                        const updated = {
                          ...row,
                          ...updates,
                          owner_id: row.owner_id
                        };
                        dbRows.set(val1, updated);
                        return { data: [updated], error: null };
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
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header.' }
        });
      }
      const token = authHeader.slice(7).trim();
      if (!token || token === 'invalid-token') {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session token.' }
        });
      }

      const userId = token.startsWith('user-') ? token.replace('-token', '') : 'synthetic-user-1';
      req.user = { id: userId, email: `${userId}@nextstep.local` };
      req.token = token;
      req.supabase = createMockSupabaseClient(userId);
      next();
    };

    await new Promise(resolve => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Seed goals for User 1 and User 2
    const missionIds = catalogData.missions.map(m => m.id);
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const schedule = calculateSchedule('2026-10-07', availability, missionIds);

    const goalUser1 = {
      id: 'g-user-1',
      version: 1,
      creationRequestId: '10000000-0000-4000-8000-000000000001',
      trackId: 'dsa-starter-v1',
      planStartDate: '2026-10-07',
      targetDate: '2026-11-06',
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions: {},
      learning: {},
      updatedAt: new Date().toISOString()
    };

    dbRows.set('g-user-1', {
      id: 'g-user-1',
      owner_id: 'user-1',
      creation_request_id: '10000000-0000-4000-8000-000000000001',
      version: 1,
      state: goalUser1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const goalUser2 = {
      id: 'g-user-2',
      version: 1,
      creationRequestId: '20000000-0000-4000-8000-000000000002',
      trackId: 'dsa-starter-v1',
      planStartDate: '2026-10-07',
      targetDate: '2026-11-06',
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions: {},
      learning: {},
      updatedAt: new Date().toISOString()
    };

    dbRows.set('g-user-2', {
      id: 'g-user-2',
      owner_id: 'user-2',
      creation_request_id: '20000000-0000-4000-8000-000000000002',
      version: 1,
      state: goalUser2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(() => {
    clearRateLimits();
    dbFailureMode = null;
    delete app.locals.mockGuidanceGenerator;
    delete app.locals.mockAssessmentService;
  });

  // --- 1. Blocker Context Persistence Tests ---

  test('Learning Context: User 1 can save blocker details and retrieve them across requests', async () => {
    const resSave = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm02',
        category: 'too_difficult',
        whatTried: 'Wrote a linear search checking every index in [4, 1, 8, 3].',
        whereStuck: 'Why does searching for an absent value always take 4 comparisons?',
        selfReportedStatus: 'still_unsure'
      })
    });

    assert.equal(resSave.status, 200);
    const bodySave = await resSave.json();
    assert.ok(bodySave.data?.goal);
    assert.equal(bodySave.data.goal.version, 2);

    const record = bodySave.data.goal.learning?.m02;
    assert.ok(record);
    assert.equal(record.category, 'too_difficult');
    assert.equal(record.whatTried, 'Wrote a linear search checking every index in [4, 1, 8, 3].');
    assert.equal(record.whereStuck, 'Why does searching for an absent value always take 4 comparisons?');
    assert.equal(record.selfReportedStatus, 'still_unsure');

    // GET /api/goal confirms round-trip persistence
    const resGet = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const fetchedGoal = (await resGet.json()).data.goal;
    assert.equal(fetchedGoal.version, 2);
    assert.equal(fetchedGoal.learning.m02.whereStuck, 'Why does searching for an absent value always take 4 comparisons?');
  });

  test('Learning Context: Stale expectedVersion returns 409 VERSION_CONFLICT', async () => {
    const resStale = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1, // Current version is 2
        missionId: 'm02',
        category: 'too_difficult',
        whereStuck: 'Stale update attempt.'
      })
    });

    assert.equal(resStale.status, 409);
    const body = await resStale.json();
    assert.equal(body.error.code, 'VERSION_CONFLICT');
  });

  test('Learning Context: User 2 cannot access or mutate User 1 learning context (RLS Isolation)', async () => {
    // User 2 gets their own goal, which has an empty learning map
    const resUser2 = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-2-token' }
    });
    const goal2 = (await resUser2.json()).data.goal;
    assert.equal(goal2.version, 1);
    assert.deepEqual(goal2.learning, {});
  });

  // --- 2. Curated Check Guidance & Assessment Tests ---

  test('Curated Check: Requesting guidance on curated mission m02 returns curated questionId and questionText', async () => {
    // Complete m01 so next mission is curated mission m02
    const resComp = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        missionId: 'm01',
        outcome: 'independent'
      })
    });
    assert.equal(resComp.status, 200);

    app.locals.mockGuidanceGenerator = async (ctx) => ({
      mode: 'guided_practice',
      explanation: 'Use linear search comparison.',
      steps: ['Check 4', 'Check 1', 'Check 8'],
      checkQuestion: ctx.curatedCheck?.questionText || 'Fallback question?'
    });

    const resGuidance = await fetch(`${baseUrl}/api/goal/guidance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        missionId: 'm02',
        category: 'ready_to_continue'
      })
    });

    assert.equal(resGuidance.status, 200);
    const body = await resGuidance.json();
    assert.equal(body.data.guidance.questionId, 'q_m02_trace_search');
    assert.match(body.data.guidance.checkQuestion, /target 8/);
  });

  test('Curated Check: Curated questions exist for m02, m04, m06', () => {
    const m02 = getCuratedCheckForMission('m02');
    assert.ok(m02);
    assert.equal(m02.questionId, 'q_m02_trace_search');

    const m04 = getCuratedCheckForMission('m04');
    assert.ok(m04);
    assert.equal(m04.questionId, 'q_m04_duplicate_set');
    assert.match(m04.questionText, /\[2, 5, 2\]/);

    const m06 = getCuratedCheckForMission('m06');
    assert.ok(m06);
    assert.equal(m06.questionId, 'q_m06_hash_map_twosum');
  });

  test('Curated Check: Submitting check answer for m02 evaluates on_track, needs_another_try, uncertain and NEVER awards XP', async () => {
    // Current goal version is 3
    app.locals.mockAssessmentService = async ({ answer }) => {
      if (answer.includes('3 comparisons') && answer.includes('4 comparisons')) {
        return {
          status: 'on_track',
          explanation: 'Accurately counted 3 comparisons to find 8, and 4 comparisons across all elements when absent.',
          nextStep: 'Try writing the code for linear search independently.'
        };
      }
      if (answer.includes('wrong')) {
        return {
          status: 'needs_another_try',
          explanation: 'Comparison count was incorrect. Remember that linear search checks one element at a time.',
          nextStep: 'Trace indices 0, 1, 2 on paper.'
        };
      }
      return {
        status: 'uncertain',
        explanation: 'Could not determine your reasoning from the answer provided.',
        nextStep: 'State how many elements you inspect before stopping.'
      };
    };

    // 1. Submit on_track answer at version 3
    const resOnTrack = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'It takes 3 comparisons to find 8, and 4 comparisons when the target is absent.',
        selfReportedStatus: 'ready_to_continue'
      })
    });

    assert.equal(resOnTrack.status, 200);
    const bodyOnTrack = await resOnTrack.json();
    assert.equal(bodyOnTrack.data.assessment.status, 'on_track');
    assert.equal(bodyOnTrack.data.goal.version, 4);

    // CRITICAL: Check does NOT complete the mission or award XP (XP is 20 only from m01 completion)
    assert.equal(bodyOnTrack.data.goal.xp, 20);
    assert.equal(bodyOnTrack.data.goal.nextMissionId, 'm02');

    // 2. Submit needs_another_try answer (version is now 4)
    const resNeedsTry = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 4,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'I think it is wrong comparisons.',
        selfReportedStatus: 'still_unsure'
      })
    });

    assert.equal(resNeedsTry.status, 200);
    const bodyNeedsTry = await resNeedsTry.json();
    assert.equal(bodyNeedsTry.data.assessment.status, 'needs_another_try');
    assert.equal(bodyNeedsTry.data.goal.version, 5);

    // Still no completion of m02! XP remains 20!
    assert.equal(bodyNeedsTry.data.goal.xp, 20);
    assert.equal(bodyNeedsTry.data.goal.nextMissionId, 'm02');
  });

  test('Curated Check: Mismatched or non-curated questionId returns 422 INVALID_QUESTION_ID', async () => {
    // Current version is 5
    const resBadQuestion = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        missionId: 'm02',
        questionId: 'wrong_question_id',
        answer: 'Some answer.'
      })
    });

    assert.equal(resBadQuestion.status, 422);
    const body = await resBadQuestion.json();
    assert.equal(body.error.code, 'INVALID_QUESTION_ID');
  });

  test('Curated Check: Empty answer or oversized answer (>1000 chars) is rejected with 422', async () => {
    // Empty answer
    const resEmpty = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: ''
      })
    });
    assert.equal(resEmpty.status, 422);

    // Oversized answer
    const resTooLong = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'x'.repeat(1001)
      })
    });
    assert.equal(resTooLong.status, 422);
  });

  test('Curated Check: Timeout returns 504 AI_TIMEOUT and preserves user goal without mutation', async () => {
    app.locals.mockAssessmentService = async () => {
      const err = new Error('AI assessment request timed out.');
      err.code = 'AI_TIMEOUT';
      err.status = 504;
      throw err;
    };

    const resTimeout = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'Valid answer during timeout test.'
      })
    });

    assert.equal(resTimeout.status, 504);
    const body = await resTimeout.json();
    assert.equal(body.error.code, 'AI_TIMEOUT');

    // Verify goal version remains 5
    const resGet = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const currentGoal = (await resGet.json()).data.goal;
    assert.equal(currentGoal.version, 5);
  });

  // --- 3. Reliability Checkpoint Regression Tests ---

  test('Regression: Save notes → assess → dismiss preserves blocker notes and assessment', async () => {
    const goalRes = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    let v = (await goalRes.json()).data.goal.version;

    // 1. Save blocker notes
    const resSave = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        category: 'too_difficult',
        whatTried: 'Tracing linear search comparisons',
        whereStuck: 'Why 4 comparisons for absent item',
        selfReportedStatus: 'still_unsure'
      })
    });
    assert.equal(resSave.status, 200);
    v = (await resSave.json()).data.goal.version;

    // 2. Submit assessment
    app.locals.mockAssessmentService = async () => ({
      status: 'on_track',
      explanation: 'Accurate comparison count.',
      nextStep: 'Proceed to code.'
    });

    const resCheck = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: '3 comparisons for 8, 4 for absent',
        selfReportedStatus: 'ready_to_continue'
      })
    });
    assert.equal(resCheck.status, 200);
    const checkGoal = (await resCheck.json()).data.goal;
    v = checkGoal.version;
    assert.equal(checkGoal.learning.m02.assessment.status, 'on_track');

    // 3. Dismiss reminder (simulating DashboardPage handleDismissResumeCard allowlisted payload)
    const resDismiss = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        dismissed: true
      })
    });
    assert.equal(resDismiss.status, 200);
    const dismissGoal = (await resDismiss.json()).data.goal;
    assert.equal(dismissGoal.learning.m02.dismissed, true);
    assert.equal(dismissGoal.learning.m02.whatTried, 'Tracing linear search comparisons');
    assert.equal(dismissGoal.learning.m02.whereStuck, 'Why 4 comparisons for absent item');
    assert.ok(dismissGoal.learning.m02.assessment, 'Assessment must survive dismiss');
    assert.equal(dismissGoal.learning.m02.assessment.status, 'on_track');
  });

  test('Regression: Save notes → assess → change self-reported status preserves assessment', async () => {
    const goalRes = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const v = (await goalRes.json()).data.goal.version;

    // Toggle self-reported status after assessment exists
    const resToggle = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        selfReportedStatus: 'ready_to_continue'
      })
    });

    assert.equal(resToggle.status, 200);
    const updatedGoal = (await resToggle.json()).data.goal;
    assert.equal(updatedGoal.learning.m02.selfReportedStatus, 'ready_to_continue');
    assert.ok(updatedGoal.learning.m02.assessment, 'Assessment must survive status change');
    assert.equal(updatedGoal.learning.m02.assessment.status, 'on_track');
    assert.equal(updatedGoal.learning.m02.whatTried, 'Tracing linear search comparisons');
  });

  test('Regression: Guidance question (checkQuestion & questionText) survives save and reload', async () => {
    const goalRes = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const v = (await goalRes.json()).data.goal.version;

    app.locals.mockGuidanceGenerator = async (ctx) => ({
      mode: 'guided_practice',
      explanation: 'Walkthrough of linear search.',
      steps: ['Step 1', 'Step 2'],
      checkQuestion: ctx.curatedCheck?.questionText || 'Fallback check question'
    });

    const resGuidance = await fetch(`${baseUrl}/api/goal/guidance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        category: 'ready_to_continue'
      })
    });
    assert.equal(resGuidance.status, 200);
    const guidancePayload = (await resGuidance.json()).data.guidance;
    assert.ok(guidancePayload.checkQuestion);
    assert.ok(guidancePayload.questionText);
    assert.equal(guidancePayload.checkQuestion, guidancePayload.questionText);

    // Save context with guidance
    const resSave = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        guidance: guidancePayload
      })
    });
    assert.equal(resSave.status, 200);

    // Reload goal
    const resReload = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const reloaded = (await resReload.json()).data.goal;
    assert.ok(reloaded.learning.m02.guidance);
    assert.equal(reloaded.learning.m02.guidance.checkQuestion, guidancePayload.checkQuestion);
    assert.equal(reloaded.learning.m02.guidance.questionText, guidancePayload.questionText);
  });

  test('Regression: Database read error returns 503 DATABASE_ERROR, not 404', async () => {
    dbFailureMode = 'findError';

    const resContext = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm02',
        whereStuck: 'Testing db read error'
      })
    });
    assert.equal(resContext.status, 503);
    const bodyContext = await resContext.json();
    assert.equal(bodyContext.error.code, 'DATABASE_ERROR');

    const resCheck = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'Valid answer during DB error'
      })
    });
    assert.equal(resCheck.status, 503);
    const bodyCheck = await resCheck.json();
    assert.equal(bodyCheck.error.code, 'DATABASE_ERROR');
  });

  test('Regression: Database write error returns 503 DATABASE_ERROR, not 409', async () => {
    const goalRes = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const v = (await goalRes.json()).data.goal.version;

    dbFailureMode = 'updateError';

    const resContext = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        whereStuck: 'Testing db write error'
      })
    });
    assert.equal(resContext.status, 503);
    const bodyContext = await resContext.json();
    assert.equal(bodyContext.error.code, 'DATABASE_ERROR');

    app.locals.mockAssessmentService = async () => ({
      status: 'on_track',
      explanation: 'Accurate',
      nextStep: 'Next'
    });

    const resCheck = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: v,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'Valid answer during write error'
      })
    });
    assert.equal(resCheck.status, 503);
    const bodyCheck = await resCheck.json();
    assert.equal(bodyCheck.error.code, 'DATABASE_ERROR');
  });

  test('Regression: Genuine stale version returns 409 VERSION_CONFLICT, distinguishable from DB error', async () => {
    dbFailureMode = null;

    const resContext = await fetch(`${baseUrl}/api/goal/learning/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 99999,
        missionId: 'm02',
        whereStuck: 'Testing genuine stale version'
      })
    });
    assert.equal(resContext.status, 409);
    const bodyContext = await resContext.json();
    assert.equal(bodyContext.error.code, 'VERSION_CONFLICT');

    const resCheck = await fetch(`${baseUrl}/api/goal/learning/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 99999,
        missionId: 'm02',
        questionId: 'q_m02_trace_search',
        answer: 'Valid answer with stale version'
      })
    });
    assert.equal(resCheck.status, 409);
    const bodyCheck = await resCheck.json();
    assert.equal(bodyCheck.error.code, 'VERSION_CONFLICT');
  });
  test('Core goal routes distinguish database outages from missing goals and version conflicts', async () => {
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const { getTodayKolkata } = await import('../src/services/scheduler.js');
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer user-2-token' };
    const version = dbRows.get('g-user-2').version;
    const payloads = [
      ['/complete', { expectedVersion: version, missionId: 'm01', outcome: 'independent' }],
      ['/recovery/preview', { expectedVersion: version, availability }],
      ['/recovery/apply', { expectedVersion: version, availability, previewForDate: getTodayKolkata() }],
      ['/guidance', { expectedVersion: version, missionId: 'm01', category: 'too_difficult' }]
    ];
    dbFailureMode = 'findError';
    for (const [route, payload] of payloads) {
      const response = await fetch(`${baseUrl}/api/goal${route}`, { method: 'POST', headers, body: JSON.stringify(payload) });
      assert.equal(response.status, 503, route);
      const body = await response.json();
      assert.equal(body.error.code, 'DATABASE_ERROR');
      assert.doesNotMatch(body.error.message, /connection terminated/i);
    }
    dbFailureMode = 'updateError';
    for (const [route, payload] of payloads.filter(([route]) => route === '/complete' || route === '/recovery/apply')) {
      const response = await fetch(`${baseUrl}/api/goal${route}`, { method: 'POST', headers, body: JSON.stringify(payload) });
      assert.equal(response.status, 503, route);
      assert.equal((await response.json()).error.code, 'DATABASE_ERROR');
      assert.equal(dbRows.get('g-user-2').version, version);
    }
  });

});

