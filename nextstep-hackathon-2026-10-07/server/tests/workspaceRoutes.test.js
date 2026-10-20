import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, getTodayKolkata, addDays } from '../src/services/scheduler.js';

describe('Stages 2 & 3 — Atlas + Proof Workspace Routes & Study Planner', () => {
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
                  if (row.owner_id === currentUserId) {
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
                  owner_id: currentUserId,
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
                        if (!row || row.owner_id !== currentUserId || row.version !== val2) {
                          return { data: [], error: null };
                        }
                        const updated = {
                          ...row,
                          ...structuredClone(updates),
                          owner_id: row.owner_id
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

    const goalId = '11111111-1111-4111-8111-111111111111';
    const initialState = {
      id: goalId,
      version: 1,
      creationRequestId: '22222222-2222-4222-8222-222222222222',
      trackId: 'dsa-starter-v1',
      goalName: 'Atlas + Proof Test Goal',
      planStartDate: today,
      targetDate,
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions: {
        m01: { completedAt: new Date().toISOString(), outcome: 'independent', reflection: 'Done m01' }
      },
      learning: {
        m01: {
          missionId: 'm01',
          recallHistory: [
            {
              attemptId: '33333333-3333-4333-8333-333333333333',
              attemptText: 'Loop invariant check',
              confidence: 4,
              savedAt: new Date().toISOString(),
              nextReviewDate: addDays(today, 7)
            }
          ]
        }
      },
      updatedAt: new Date().toISOString()
    };

    dbRows.set(goalId, {
      id: goalId,
      owner_id: 'ws-user-1',
      creation_request_id: initialState.creationRequestId,
      version: 1,
      state: initialState,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('GET /api/catalog returns 12 starter missions plus published curriculum without drafts', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.missions.length, 12);
    assert.ok(body.data.curriculum);
    assert.ok(body.data.curriculum.topics.length >= 3);
    assert.ok(body.data.curriculum.lessons.length >= 12);
    assert.ok(body.data.curriculum.exercises.length >= 6);
    assert.ok(body.data.curriculum.practiceProblems.length >= 30);
    assert.equal(
      body.data.curriculum.practiceProblems.some((p) => p.id === 'prac_arrays_draft_99'),
      false
    );
  });

  it('POST /api/goal/workspace/lesson persists lesson progress, supports idempotent retry, and preserves starter state', async () => {
    const reqId = '44444444-4444-4444-8444-444444444444';
    const payload = {
      expectedVersion: 1,
      requestId: reqId,
      lessonId: 'les_arrays_01',
      topicId: 'topic_arrays',
      status: 'completed',
      completedSections: ['explanation', 'worked_example', 'knowledge_check'],
      reflection: 'Evaluate candidateGain before updating minPrice.',
      knowledgeCheckPassed: true
    };

    const res1 = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.goal.version, 2);
    assert.equal(body1.data.lessonProgress.status, 'completed');
    assert.equal(body1.data.lessonProgress.knowledgeCheckPassed, true);
    assert.ok(body1.data.goal.completions.m01, 'Starter mission completion m01 must remain intact');
    assert.equal(body1.data.goal.learning.m01.recallHistory.length, 1, 'Recall history must remain intact');

    // Duplicate retry with same requestId should return 200 without incrementing version
    const resDup = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(resDup.status, 200);
    const bodyDup = await resDup.json();
    assert.equal(bodyDup.data.goal.version, 2);
  });

  it('POST /api/goal/workspace/exercise persists Proof attempt, enforces attemptId idempotency/conflict, and computes nextReviewDate', async () => {
    const attemptId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      expectedVersion: 2,
      attemptId,
      exerciseId: 'ex_arrays_01',
      variantKey: 'primary',
      stepAnswers: [
        { stepIndex: 0, choiceId: 'c1_correct' },
        { stepIndex: 1, choiceId: 'c2_correct' },
        { stepIndex: 2, choiceId: 'c3_correct' }
      ],
      edgeChoiceId: 'ec_arr1_correct',
      outcome: 'with_hint',
      mistakeCount: 1,
      hintRevealed: true,
      referenceRevealed: false,
      reflection: 'Checked line 5 before line 7.'
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 3);
    assert.equal(body.data.exerciseAttempt.outcome, 'with_hint');
    assert.equal(body.data.exerciseAttempt.nextReviewDate, addDays(getTodayKolkata(), 2));

    // Reusing attemptId with different content must return 409 ATTEMPT_CONFLICT
    const resConflict = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({ ...payload, reflection: 'Changed reflection text' })
    });
    assert.equal(resConflict.status, 409);
    const conflictBody = await resConflict.json();
    assert.equal(conflictBody.error.code, 'ATTEMPT_CONFLICT');
  });

  it('POST /api/goal/workspace/practice persists self-reported attempt and rejects draft practice problems', async () => {
    const draftRes = await fetch(`${baseUrl}/api/goal/workspace/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        expectedVersion: 3,
        attemptId: '66666666-6666-4666-8666-666666666660',
        problemId: 'prac_arrays_draft_99',
        outcome: 'solved_independently'
      })
    });
    assert.equal(draftRes.status, 404);

    const attemptId = '66666666-6666-4666-8666-666666666666';
    const res = await fetch(`${baseUrl}/api/goal/workspace/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        expectedVersion: 3,
        attemptId,
        problemId: 'prac_arrays_01',
        outcome: 'solved_independently',
        note: 'Single pass with minPrice initialized to prices[0].',
        needsReview: false
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 4);
    assert.equal(body.data.practiceAttempt.selfReported, true);
    assert.equal(body.data.practiceAttempt.nextReviewDate, addDays(getTodayKolkata(), 7));
  });

  it('POST /api/goal/workspace/plan/preview and /apply schedule multi-session items, skip completed lessons, and preserve starter schedule', async () => {
    const availability = { mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 30, sun: 30 };
    // Select les_arrays_02 (which requires les_arrays_01, already completed!) and prac_arrays_06 (25 mins)
    const previewRes = await fetch(`${baseUrl}/api/goal/workspace/plan/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        availability,
        selectedItemIds: ['les_arrays_01', 'les_arrays_02', 'prac_arrays_06']
      })
    });
    assert.equal(previewRes.status, 200);
    const previewBody = await previewRes.json();
    // les_arrays_01 was already completed in test 2, so it should be skipped!
    assert.equal(previewBody.data.selectedItemIds.includes('les_arrays_01'), false);
    assert.deepEqual(previewBody.data.selectedItemIds, ['les_arrays_02', 'prac_arrays_06']);
    // les_arrays_02 is 20m (fits on day 1 with 10m left), prac_arrays_06 is 25m (10m on day 1 part 1/2, 15m on day 2 part 2/2)
    const pracSessions = previewBody.data.sessions.filter((s) => s.itemId === 'prac_arrays_06');
    assert.equal(pracSessions.length, 2, '25m item should span 2 sessions when 10m remains on day 1');
    assert.equal(pracSessions[0].partIndex, 1);
    assert.equal(pracSessions[0].totalParts, 2);
    assert.equal(pracSessions[1].partIndex, 2);

    // Apply with stale previewForDate must return 409 STALE_PREVIEW
    const staleRes = await fetch(`${baseUrl}/api/goal/workspace/plan/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        previewForDate: '2020-01-01',
        curriculumVersion: previewBody.data.curriculumVersion,
        availability,
        selectedItemIds: ['les_arrays_02', 'prac_arrays_06']
      })
    });
    assert.equal(staleRes.status, 409);

    // Apply with valid previewForDate and expectedVersion
    const applyRes = await fetch(`${baseUrl}/api/goal/workspace/plan/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        previewForDate: previewBody.data.previewForDate,
        curriculumVersion: previewBody.data.curriculumVersion,
        availability,
        selectedItemIds: ['les_arrays_02', 'prac_arrays_06']
      })
    });
    assert.equal(applyRes.status, 200);
    const applyBody = await applyRes.json();
    assert.equal(applyBody.data.goal.version, 5);
    assert.ok(applyBody.data.goal.studyWorkspace.studyPlan);
    assert.equal(applyBody.data.goal.schedule.length, 12, 'Starter mission schedule must remain untouched');
  });

  it('POST /api/goal/workspace/lesson validates, persists, and enforces idempotency on checkIn', async () => {
    const reqId = 'aaaaaaaa-1111-4111-8111-111111111111';
    const payload = {
      expectedVersion: 5,
      requestId: reqId,
      lessonId: 'les_arrays_02',
      topicId: 'topic_arrays',
      status: 'in_progress',
      completedSections: ['explanation'],
      reflection: 'Takeaway on prefix/suffix',
      checkIn: {
        version: 1,
        confidence: 'ready',
        focus: 'invariant'
      }
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 6);
    assert.deepEqual(body.data.lessonProgress.checkIn, {
      version: 1,
      confidence: 'ready',
      focus: 'invariant'
    });

    // Identical retry returns 200 without version bump
    const dupRes = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(dupRes.status, 200);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.data.goal.version, 6);

    // Altered checkIn under same requestId triggers 409 REQUEST_CONFLICT
    const conflictRes = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        ...payload,
        checkIn: {
          version: 1,
          confidence: 'unsure',
          focus: 'edge_cases'
        }
      })
    });
    assert.equal(conflictRes.status, 409);
    const conflictBody = await conflictRes.json();
    assert.equal(conflictBody.error.code, 'REQUEST_CONFLICT');

    // Invalid checkIn version rejected with 422
    const invalidVerRes = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        ...payload,
        requestId: 'aaaaaaaa-2222-4222-8222-222222222222',
        checkIn: {
          version: 2,
          confidence: 'ready'
        }
      })
    });
    assert.equal(invalidVerRes.status, 422);

    // Unknown extra field rejected with 422
    const extraFieldRes = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        ...payload,
        requestId: 'aaaaaaaa-3333-4333-8333-333333333333',
        checkIn: {
          version: 1,
          confidence: 'ready',
          unexpected: true
        }
      })
    });
    assert.equal(extraFieldRes.status, 422);
  });

  it('POST /api/goal/workspace/exercise validates, persists, and enforces idempotency on checkIn', async () => {
    const attemptId = 'bbbbbbbb-1111-4111-8111-111111111111';
    const payload = {
      expectedVersion: 6,
      attemptId,
      exerciseId: 'ex_arrays_01',
      variantKey: 'primary',
      stepAnswers: [
        { stepIndex: 0, choiceId: 'c1_correct' },
        { stepIndex: 1, choiceId: 'c2_correct' },
        { stepIndex: 2, choiceId: 'c3_correct' }
      ],
      edgeChoiceId: 'ec_arr1_correct',
      outcome: 'independent',
      mistakeCount: 0,
      hintRevealed: false,
      referenceRevealed: false,
      reflection: 'Clear takeaway on profit scan.',
      checkIn: {
        version: 1,
        confidence: 'ready',
        focus: 'update_order'
      }
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 7);
    assert.deepEqual(body.data.exerciseAttempt.checkIn, {
      version: 1,
      confidence: 'ready',
      focus: 'update_order'
    });

    // Identical retry returns 200 without version bump
    const dupRes = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(dupRes.status, 200);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.data.goal.version, 7);

    // Altered checkIn under same attemptId triggers 409 ATTEMPT_CONFLICT
    const conflictRes = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
      body: JSON.stringify({
        ...payload,
        checkIn: {
          version: 1,
          confidence: 'unsure',
          focus: 'none'
        }
      })
    });
    assert.equal(conflictRes.status, 409);
    const conflictBody = await conflictRes.json();
    assert.equal(conflictBody.error.code, 'ATTEMPT_CONFLICT');
  });
  it('preserves omitted lesson check-ins, clears explicit null, and retries each without version bumps', async () => {
    const row = [...dbRows.values()].find((entry) => entry.owner_id === 'ws-user-1');
    const post = async (payload) => {
      const response = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ws-user-1-token' },
        body: JSON.stringify(payload)
      });
      return { status: response.status, body: await response.json() };
    };
    const base = { lessonId: 'les_arrays_02', status: 'in_progress' };
    const set = await post({ ...base, expectedVersion: row.version, requestId: 'cccccccc-1111-4111-8111-111111111111', checkIn: { version: 1, confidence: 'ready' } });
    assert.equal(set.status, 200);
    const omitted = { ...base, expectedVersion: set.body.data.goal.version, requestId: 'cccccccc-2222-4222-8222-222222222222' };
    const preserved = await post(omitted);
    assert.equal(preserved.status, 200);
    assert.equal(preserved.body.data.lessonProgress.checkIn.confidence, 'ready');
    const retry = await post(omitted);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.data.goal.version, preserved.body.data.goal.version);
    assert.equal((await post({ ...omitted, checkIn: null })).status, 409);
    const clear = { ...base, expectedVersion: preserved.body.data.goal.version, requestId: 'cccccccc-3333-4333-8333-333333333333', checkIn: null };
    const cleared = await post(clear);
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.data.lessonProgress.checkIn, null);
    const clearRetry = await post(clear);
    assert.equal(clearRetry.status, 200);
    assert.equal(clearRetry.body.data.goal.version, cleared.body.data.goal.version);
  });
});
