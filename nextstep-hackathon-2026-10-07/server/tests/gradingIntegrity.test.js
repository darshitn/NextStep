import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, getTodayKolkata, addDays } from '../src/services/scheduler.js';

describe('R1 Regression & Verification — Grading Integrity & Student-Safe Catalog', () => {
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

    const goalId = '22222222-2222-4222-8222-222222222222';
    const initialState = {
      id: goalId,
      version: 1,
      creationRequestId: '33333333-3333-4333-8333-333333333333',
      trackId: 'dsa-starter-v1',
      goalName: 'Grading Integrity Goal',
      planStartDate: today,
      targetDate,
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions: {},
      learning: {},
      studyWorkspace: {
        schemaVersion: 1,
        curriculumVersion: 'atlas-proof-v1',
        selectedTopicId: 'topic_arrays',
        lessonProgress: {},
        exerciseAttempts: {},
        practiceAttempts: {},
        studyPlan: null,
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    dbRows.set(goalId, {
      id: goalId,
      owner_id: 'grading-user',
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

  it('GET /api/catalog strictly strips isCorrect, correctOptionId, and referenceImplementation', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const raw = JSON.stringify(body);

    assert.equal(raw.includes('"isCorrect"'), false, 'Catalog must not leak "isCorrect"');
    assert.equal(raw.includes('"correctOptionId"'), false, 'Catalog must not leak "correctOptionId"');
    assert.equal(raw.includes('"referenceImplementation"'), false, 'Catalog must not leak "referenceImplementation"');

    const curriculum = body.data.curriculum;
    assert.ok(curriculum.exercises.length >= 18);
    for (const ex of curriculum.exercises) {
      assert.equal(ex.referenceImplementation, undefined);
      for (const step of ex.primaryVariant.steps) {
        for (const choice of step.choices) {
          assert.equal(choice.isCorrect, undefined);
        }
      }
      if (ex.edgeCaseCheck) {
        for (const choice of ex.edgeCaseCheck.choices) {
          assert.equal(choice.isCorrect, undefined);
        }
      }
    }
    for (const les of curriculum.lessons) {
      if (les.knowledgeCheck) {
        assert.equal(les.knowledgeCheck.correctOptionId, undefined);
      }
    }
  });

  it('POST /api/catalog/exercise/evaluate-step evaluates choices correctly without leaking answers', async () => {
    // Correct choice
    const resCorrect = await fetch(`${baseUrl}/api/catalog/exercise/evaluate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepIndex: 0,
        choiceId: 'c1_correct'
      })
    });
    assert.equal(resCorrect.status, 200);
    const bodyCorrect = await resCorrect.json();
    assert.equal(bodyCorrect.data.isCorrect, true);
    assert.ok(bodyCorrect.data.explanation, 'Correct choice gets an explanation');

    // Incorrect choice
    const resWrong = await fetch(`${baseUrl}/api/catalog/exercise/evaluate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepIndex: 0,
        choiceId: 'c1_wrong_order'
      })
    });
    assert.equal(resWrong.status, 200);
    const bodyWrong = await resWrong.json();
    assert.equal(bodyWrong.data.isCorrect, false);
    assert.equal(bodyWrong.data.explanation, null, 'Incorrect choice must not leak explanation');
    assert.ok(bodyWrong.data.feedback, 'Incorrect choice gets misconception feedback');
  });

  it('POST /api/catalog/exercise/evaluate-edge evaluates edge case check correctly', async () => {
    const resCorrect = await fetch(`${baseUrl}/api/catalog/exercise/evaluate-edge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: 'ex_arrays_01',
        choiceId: 'ec_arr1_correct'
      })
    });
    assert.equal(resCorrect.status, 200);
    const bodyCorrect = await resCorrect.json();
    assert.equal(bodyCorrect.data.isCorrect, true);
    assert.ok(bodyCorrect.data.explanation);

    const resWrong = await fetch(`${baseUrl}/api/catalog/exercise/evaluate-edge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: 'ex_arrays_01',
        choiceId: 'ec_arr1_wrong'
      })
    });
    assert.equal(resWrong.status, 200);
    const bodyWrong = await resWrong.json();
    assert.equal(bodyWrong.data.isCorrect, false);
    assert.equal(bodyWrong.data.explanation, null);
    assert.ok(bodyWrong.data.feedback);
  });

  it('POST /api/catalog/lesson/evaluate-check evaluates knowledge checks correctly', async () => {
    const resCorrect = await fetch(`${baseUrl}/api/catalog/lesson/evaluate-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'les_arrays_01',
        optionId: 'opt_order_strict'
      })
    });
    assert.equal(resCorrect.status, 200);
    const bodyCorrect = await resCorrect.json();
    assert.equal(bodyCorrect.data.isCorrect, true);
    assert.ok(bodyCorrect.data.explanation);

    const resWrong = await fetch(`${baseUrl}/api/catalog/lesson/evaluate-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: 'les_arrays_01',
        optionId: 'opt_order_speed'
      })
    });
    assert.equal(resWrong.status, 200);
    const bodyWrong = await resWrong.json();
    assert.equal(bodyWrong.data.isCorrect, false);
    assert.equal(bodyWrong.data.explanation, null);
  });

  it('GET /api/catalog/exercise/:exerciseId/reference returns reference details on explicit demand', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/exercise/ex_arrays_01/reference`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.exerciseId, 'ex_arrays_01');
    assert.ok(body.data.referenceInvariant);
  });

  it('POST /api/goal/workspace/exercise rejects incomplete traces or wrong answers with 422', async () => {
    // Missing stepAnswers
    const resMissing = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 1,
        attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary'
      })
    });
    assert.equal(resMissing.status, 422);

    // Incomplete stepAnswers (only 2 of 3 steps)
    const resIncomplete = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 1,
        attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct'
      })
    });
    assert.equal(resIncomplete.status, 422);

    // Wrong step choice
    const resWrongStep = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 1,
        attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_wrong_min' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct'
      })
    });
    assert.equal(resWrongStep.status, 422);

    // Wrong edge choice
    const resWrongEdge = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 1,
        attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_wrong'
      })
    });
    assert.equal(resWrongEdge.status, 422);
  });

  it('POST /api/goal/workspace/exercise normalizes forged outcomes authoritatively', async () => {
    // Attempt 1: Client claims 'independent', but referenceRevealed is true -> normalized to 'needed_reference'
    const attempt1 = '11111111-1111-4111-8111-111111111111';
    const res1 = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 1,
        attemptId: attempt1,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        outcome: 'independent', // Forged by client
        mistakeCount: 0,
        hintRevealed: false,
        referenceRevealed: true,
        reflection: 'Needed reference invariant'
      })
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.exerciseAttempt.outcome, 'needed_reference', 'Outcome must normalize to needed_reference');
    assert.equal(body1.data.goal.version, 2);

    // Attempt 2: Client claims 'independent', but hintRevealed is true -> normalized to 'with_hint'
    const attempt2 = '22222222-2222-4222-8222-222222222222';
    const res2 = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 2,
        attemptId: attempt2,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        outcome: 'independent', // Forged by client
        mistakeCount: 0,
        hintRevealed: true,
        referenceRevealed: false
      })
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.exerciseAttempt.outcome, 'with_hint', 'Outcome must normalize to with_hint');
    assert.equal(body2.data.goal.version, 3);

    // Attempt 3: Client claims 'with_hint', but 0 mistakes and no reveals -> normalized to 'independent'
    const attempt3 = '33333333-3333-4333-8333-333333333333';
    const res3 = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 3,
        attemptId: attempt3,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        outcome: 'with_hint',
        mistakeCount: 0,
        hintRevealed: false,
        referenceRevealed: false
      })
    });
    assert.equal(res3.status, 200);
    const body3 = await res3.json();
    assert.equal(body3.data.exerciseAttempt.outcome, 'independent', 'Zero mistakes and no reveals must be independent');
    assert.equal(body3.data.goal.version, 4);

    // Idempotent retry of attempt 3 returns 200 without version bump
    const res3Retry = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        attemptId: attempt3,
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
        referenceRevealed: false
      })
    });
    assert.equal(res3Retry.status, 200);
    const body3Retry = await res3Retry.json();
    assert.equal(body3Retry.data.goal.version, 4);

    // Conflict retry with different content returns 409 ATTEMPT_CONFLICT
    const res3Conflict = await fetch(`${baseUrl}/api/goal/workspace/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        attemptId: attempt3,
        exerciseId: 'ex_arrays_01',
        variantKey: 'primary',
        stepAnswers: [
          { stepIndex: 0, choiceId: 'c1_correct' },
          { stepIndex: 1, choiceId: 'c2_correct' },
          { stepIndex: 2, choiceId: 'c3_correct' }
        ],
        edgeChoiceId: 'ec_arr1_correct',
        mistakeCount: 2, // Modified
        hintRevealed: false,
        referenceRevealed: false
      })
    });
    assert.equal(res3Conflict.status, 409);
  });

  it('POST /api/goal/workspace/lesson evaluates knowledgeCheckOptionId against authoritative curriculum', async () => {
    // Correct option
    const resCorrect = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 4,
        requestId: '44444444-4444-4444-8444-444444444444',
        lessonId: 'les_arrays_01',
        topicId: 'topic_arrays',
        status: 'completed',
        completedSections: ['knowledge_check'],
        knowledgeCheckOptionId: 'opt_order_strict'
      })
    });
    assert.equal(resCorrect.status, 200);
    const bodyCorrect = await resCorrect.json();
    assert.equal(bodyCorrect.data.lessonProgress.knowledgeCheckPassed, true);
    assert.equal(bodyCorrect.data.goal.version, 5);

    // Incorrect option
    const resWrong = await fetch(`${baseUrl}/api/goal/workspace/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer grading-user-token' },
      body: JSON.stringify({
        expectedVersion: 5,
        requestId: '55555555-5555-4555-8555-555555555555',
        lessonId: 'les_arrays_02',
        topicId: 'topic_arrays',
        status: 'in_progress',
        completedSections: ['knowledge_check'],
        knowledgeCheckOptionId: 'opt_pref_2' // wrong option
      })
    });
    assert.equal(resWrong.status, 200);
    const bodyWrong = await resWrong.json();
    assert.equal(bodyWrong.data.lessonProgress.knowledgeCheckPassed, false);
    assert.equal(bodyWrong.data.goal.version, 6);
  });
});
