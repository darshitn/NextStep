import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, getTodayKolkata, addDays } from '../src/services/scheduler.js';
import { getPublishedCurriculum } from '../src/services/curriculumRegistry.js';

describe('Stage 1 & 2 — Foundations Checkpoint & Continuation Integration', () => {
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

    // Seed completed 12/12 goal for user1
    const today = getTodayKolkata();
    const targetDate = addDays(today, 21);
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const schedule = calculateSchedule(today, availability, catalogData.missions.map((m) => m.id));

    const completions = {};
    for (let i = 1; i <= 12; i++) {
      const mid = `m${String(i).padStart(2, '0')}`;
      completions[mid] = {
        completedAt: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
        outcome: i % 3 === 0 ? 'with_hint' : 'independent',
        reflection: `Completed starter mission ${mid} reflection.`
      };
    }

    const user1Goal = {
      id: 'goal-user1',
      version: 1,
      owner_id: 'user1',
      trackId: 'dsa-starter-v1',
      planStartDate: today,
      targetDate,
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions,
      learning: {},
      studyWorkspace: {
        schemaVersion: 1,
        curriculumVersion: 'atlas-proof-v1',
        selectedTopicId: 'topic_arrays',
        lessonProgress: {},
        exerciseAttempts: {},
        practiceAttempts: {},
        studyPlan: null,
        continuation: {
          schemaVersion: 1,
          status: 'not_started',
          checkpoint: {
            checkpointId: 'chk_foundations_v1',
            status: 'not_started',
            draftAnswers: {},
            draftSavedAt: null,
            latestAttempt: null,
            history: []
          },
          suggestedPlan: {
            previewId: null,
            generatedAt: null,
            sourceEvidence: null,
            items: [],
            weeklyCommitmentHours: 0,
            accepted: false,
            acceptedAt: null
          }
        }
      },
      updatedAt: new Date().toISOString()
    };

    dbRows.set('goal-user1', {
      id: 'goal-user1',
      owner_id: 'user1',
      version: 1,
      state: user1Goal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Seed incomplete goal for user2
    const user2Goal = {
      id: 'goal-user2',
      version: 1,
      owner_id: 'user2',
      trackId: 'dsa-starter-v1',
      planStartDate: today,
      targetDate,
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability,
      schedule,
      completions: {
        m01: {
          completedAt: new Date().toISOString(),
          outcome: 'independent',
          reflection: 'First step.'
        }
      },
      learning: {},
      studyWorkspace: {
        schemaVersion: 1,
        curriculumVersion: 'atlas-proof-v1',
        selectedTopicId: 'topic_arrays',
        lessonProgress: {},
        exerciseAttempts: {},
        practiceAttempts: {},
        studyPlan: null
      },
      updatedAt: new Date().toISOString()
    };

    dbRows.set('goal-user2', {
      id: 'goal-user2',
      owner_id: 'user2',
      version: 1,
      state: user2Goal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('CP01: GET /api/goal/workspace/checkpoint/:checkpointId returns student-safe questions without answer keys', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/chk_foundations_v1`, {
      headers: { Authorization: 'Bearer user1-token' }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data?.checkpoint);
    const cp = body.data.checkpoint;
    assert.equal(cp.id, 'chk_foundations_v1');
    assert.equal(cp.topics.length, 3);
    assert.equal(cp.questions.length, 3);

    // Verify student-safe: NO answer keys leaked
    for (const q of cp.questions) {
      assert.ok(q.id);
      assert.ok(q.prompt);
      assert.ok(Array.isArray(q.options));
      assert.ok(q.options.length >= 2);
      assert.equal(q.correctOptionId, undefined, `Leaked correctOptionId on ${q.id}`);
      assert.equal(q.correctAnswer, undefined, `Leaked correctAnswer on ${q.id}`);
      for (const opt of q.options) {
        assert.equal(opt.isCorrect, undefined, `Leaked isCorrect on option ${opt.id}`);
      }
    }
  });

  it('CP02: GET /api/goal/workspace/checkpoint/unknown returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/chk_nonexistent`, {
      headers: { Authorization: 'Bearer user1-token' }
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'CHECKPOINT_NOT_FOUND');
  });

  it('CP03: POST /api/goal/workspace/checkpoint/draft persists student draft answers and timestamp', async () => {
    const draftPayload = {
      expectedVersion: 1,
      checkpointId: 'chk_foundations_v1',
      draftAnswers: {
        chk_q_arrays_01: 'opt_arr_1'
      }
    };
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/draft`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftPayload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data?.goal);
    assert.equal(body.data.goal.version, 2);
    const continuation = body.data.goal.studyWorkspace.continuation;
    assert.equal(continuation.checkpoint.draftAnswers.chk_q_arrays_01, 'opt_arr_1');
    assert.ok(continuation.checkpoint.draftSavedAt);

    // Verify draft is returned on GET
    const getRes = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/chk_foundations_v1`, {
      headers: { Authorization: 'Bearer user1-token' }
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.draft.answers.chk_q_arrays_01, 'opt_arr_1');
  });

  it('CP04: POST /api/goal/workspace/checkpoint/draft rejects stale expectedVersion with 409', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/draft`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expectedVersion: 1, // Current is 2
        checkpointId: 'chk_foundations_v1',
        draftAnswers: { chk_q_arrays_01: 'opt_arr_2' }
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error?.code, 'VERSION_CONFLICT');
  });

  it('CP05: POST /api/goal/workspace/checkpoint/evaluate authoritative server evaluation with category and feedback', async () => {
    const attemptId = '50000000-0000-4000-8000-000000000001';
    const evaluatePayload = {
      expectedVersion: 2,
      attemptId,
      checkpointId: 'chk_foundations_v1',
      answers: {
        chk_q_arrays_01: 'opt_arr_1', // correct
        chk_q_hashing_01: 'opt_hash_1', // correct
        chk_q_bs_01: 'opt_bs_2' // incorrect
      },
      selfReportedAssistance: {
        chk_q_arrays_01: { usedHint: false },
        chk_q_hashing_01: { usedHint: true },
        chk_q_bs_01: { usedHint: false }
      },
      reflection: 'Tricky binary search bounds.'
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evaluatePayload)
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data?.goal);
    assert.equal(body.data.goal.version, 3);
    const evalResult = body.data.evaluation;
    assert.ok(evalResult);
    assert.equal(evalResult.attemptId, attemptId);
    assert.equal(evalResult.score.correct, 2);
    assert.equal(evalResult.score.total, 3);
    assert.equal(evalResult.category, 'revisit_recommended');
    assert.ok(evalResult.topicResults.topic_binary_search.revisitRecommended);
    assert.ok(evalResult.topicResults.topic_binary_search.recommendedAction);

    // Starter completions must be preserved!
    assert.equal(Object.keys(body.data.goal.completions).length, 12);
  });

  it('CP06: POST /api/goal/workspace/checkpoint/evaluate idempotency — duplicate attemptId returns 200 without version bump', async () => {
    const attemptId = '50000000-0000-4000-8000-000000000001';
    const evaluatePayload = {
      expectedVersion: 2, // Even if caller sent old expectedVersion
      attemptId,
      checkpointId: 'chk_foundations_v1',
      answers: {
        chk_q_arrays_01: 'opt_arr_1',
        chk_q_hashing_01: 'opt_hash_1',
        chk_q_bs_01: 'opt_bs_2'
      },
      selfReportedAssistance: {
        chk_q_arrays_01: { usedHint: false },
        chk_q_hashing_01: { usedHint: true },
        chk_q_bs_01: { usedHint: false }
      },
      reflection: 'Tricky binary search bounds.'
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evaluatePayload)
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 3); // Unchanged!
    assert.equal(body.data.evaluation.attemptId, attemptId);
  });

  it('CP07: POST /api/goal/workspace/checkpoint/evaluate conflict — same attemptId with different payload returns 409', async () => {
    const attemptId = '50000000-0000-4000-8000-000000000001';
    const conflictingPayload = {
      expectedVersion: 3,
      attemptId,
      checkpointId: 'chk_foundations_v1',
      answers: {
        chk_q_arrays_01: 'opt_arr_2', // Changed!
        chk_q_hashing_01: 'opt_hash_1',
        chk_q_bs_01: 'opt_bs_1'
      }
    };

    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conflictingPayload)
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error?.code, 'ATTEMPT_CONFLICT');
  });

  it('CP08: POST /api/goal/workspace/checkpoint/skip marks continuation as skipped', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/skip`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        checkpointId: 'chk_foundations_v1'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 4);
    assert.equal(body.data.goal.studyWorkspace.continuation.status, 'skipped');
  });

  it('CP09: User isolation — User 2 cannot access or mutate User 1 checkpoint', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/chk_foundations_v1`, {
      headers: { Authorization: 'Bearer user2-token' }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    // User 2 has not started checkpoint, draft is empty
    assert.deepEqual(body.data.draft.answers, {});
    assert.equal(body.data.latestAttempt, null);
  });

  it('CP10: POST /api/goal/workspace/checkpoint/reset resets status to in_progress', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/reset`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expectedVersion: 4,
        checkpointId: 'chk_foundations_v1'
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 5);
    assert.equal(body.data.goal.studyWorkspace.continuation.status, 'in_progress');
  });

  it('CP11: POST /api/goal/workspace/continuation/plan/preview derives evidence-based plan', async () => {
    const res = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data?.previewId);
    assert.ok(body.data.sessions.length > 0);
    assert.equal(body.data.baseVersion, 5);
  });

  it('CP12: POST /api/goal/workspace/continuation/plan/apply persists accepted plan into studyWorkspace', async () => {
    const today = getTodayKolkata();
    const res = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/apply`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expectedVersion: 5,
        previewForDate: today,
        curriculumVersion: 'atlas-proof-v1',
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
        selectedItemIds: ['les_arrays_01', 'les_arrays_02']
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data?.goal);
    assert.equal(body.data.goal.version, 6);
    assert.ok(body.data.studyPlan);
    assert.equal(body.data.goal.studyWorkspace.continuation.suggestedPlan.accepted, true);
  });

  it('CP13: same attempt ID with changed reflection must conflict (409 ATTEMPT_CONFLICT)', async () => {
    const row = dbRows.get('goal-user1');
    const attemptId = crypto.randomUUID();
    const payload = {
      expectedVersion: row.version,
      checkpointId: 'chk_foundations_v1',
      attemptId,
      answers: { chk_q_arrays_01: 'opt_arr_1' },
      reflection: 'Initial student reflection.'
    };
    const post = (data) =>
      fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
        method: 'POST',
        headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

    const res1 = await post(payload);
    assert.equal(res1.status, 200);

    const resChanged = await post({ ...payload, reflection: 'Changed student reflection.' });
    assert.equal(resChanged.status, 409, 'Changed reflection must not be accepted under duplicate attemptId');
    const errBody = await resChanged.json();
    assert.equal(errBody.error?.code, 'ATTEMPT_CONFLICT');
  });

  it('CP14: invalid question and option IDs must fail validation with 422', async () => {
    const row = dbRows.get('goal-user1');
    const response = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        checkpointId: 'chk_foundations_v1',
        attemptId: crypto.randomUUID(),
        answers: { unknown_question: 'unknown_option' }
      })
    });
    assert.equal(response.status, 422, 'Unknown question and option IDs must return 422');
  });

  it('CP15: plan acceptance must reject a changed selection from preview (409 PREVIEW_MISMATCH)', async () => {
    const row = dbRows.get('goal-user1');
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const post = (route, data) =>
      fetch(`${baseUrl}/api/goal/workspace/continuation/plan/${route}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

    const preview = await (
      await post('preview', { expectedVersion: row.version, availability, selectedItemIds: ['les_arrays_01'] })
    ).json();

    const response = await post('apply', {
      expectedVersion: preview.data.baseVersion,
      previewForDate: preview.data.previewForDate,
      curriculumVersion: preview.data.curriculumVersion,
      availability,
      selectedItemIds: ['les_arrays_02']
    });
    assert.equal(response.status, 409, 'Changed activities require a new preview');
    const errBody = await response.json();
    assert.equal(errBody.error?.code, 'PREVIEW_MISMATCH');
  });

  it('CP16: failed checkpoint concept must schedule a revisit even for an already completed lesson', async () => {
    const row = dbRows.get('goal-user1');
    row.state.studyWorkspace.lessonProgress.les_binary_search_01 = {
      lessonId: 'les_binary_search_01',
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    row.state.studyWorkspace.continuation.checkpoint.latestAttempt = {
      topicResults: {
        topic_binary_search: {
          revisitRecommended: true,
          recommendedAction: { lessonId: 'les_binary_search_01' }
        }
      }
    };

    const response = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        availability: { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 60, sun: 60 }
      })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(
      body.data.sessions.some((s) => s.itemId === 'les_binary_search_01'),
      'Failed completed concept must appear as intentional revisit in sessions'
    );
  });

  it('CP17: plan preview returns 7-day horizon fields and stateless signed previewToken', async () => {
    const row = dbRows.get('goal-user1');
    const response = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
      })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.data.previewToken, 'Stateless signed previewToken must be returned');
    assert.ok(body.data.horizonEndDate, '7-day horizonEndDate must be returned');
    assert.ok(typeof body.data.weeklyCapacityMinutes === 'number', 'weeklyCapacityMinutes must be returned');
    assert.ok(Array.isArray(body.data.weekSessions), 'weekSessions must be returned');
    assert.ok(Array.isArray(body.data.spilloverSessions), 'spilloverSessions must be returned');
  });

  it('CP18: previewToken for different user is rejected with 403 FORBIDDEN', async () => {
    const row = dbRows.get('goal-user1');
    const prevRes = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
        selectedItemIds: ['les_arrays_01']
      })
    });
    const prevBody = await prevRes.json();
    const token = prevBody.data.previewToken;

    // User 2 tries to use User 1's preview token
    const applyRes = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/apply`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user2-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: 1,
        previewForDate: prevBody.data.previewForDate,
        curriculumVersion: prevBody.data.curriculumVersion,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
        selectedItemIds: ['les_arrays_01'],
        previewToken: token
      })
    });
    assert.equal(applyRes.status, 403, 'Cross-user preview token must return 403 FORBIDDEN');
  });

  it('CP19: accepting a preview cannot change its target date', async () => {
    const row = dbRows.get('goal-user1');
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const post = (route, data) => fetch(`${baseUrl}/api/goal/workspace/continuation/plan/${route}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const previewResponse = await post('preview', {
      expectedVersion: row.version,
      availability,
      selectedItemIds: ['les_arrays_01']
    });
    assert.equal(previewResponse.status, 200);
    const preview = (await previewResponse.json()).data;
    const applyResponse = await post('apply', {
      expectedVersion: preview.baseVersion,
      previewForDate: preview.previewForDate,
      curriculumVersion: preview.curriculumVersion,
      availability,
      selectedItemIds: preview.selectedItemIds,
      targetDate: addDays(preview.targetDate, 1),
      previewToken: preview.previewToken
    });
    assert.equal(applyResponse.status, 409);
    assert.equal((await applyResponse.json()).error?.code, 'PREVIEW_MISMATCH');
    assert.equal(dbRows.get('goal-user1').version, row.version);
  });

  it('CP20: a publishable-key signature cannot forge a preview token', async () => {
    const row = dbRows.get('goal-user1');
    const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
    const post = (route, data) => fetch(`${baseUrl}/api/goal/workspace/continuation/plan/${route}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const previewResponse = await post('preview', {
      expectedVersion: row.version,
      availability,
      selectedItemIds: ['les_arrays_01']
    });
    assert.equal(previewResponse.status, 200);
    const preview = (await previewResponse.json()).data;
    const encoded = preview.previewToken.split('.')[0];
    const oldPublicKey = nodeCrypto.createHash('sha256').update('nextstep-preview-signing-key').digest();
    const forgedSignature = nodeCrypto.createHmac('sha256', oldPublicKey).update(encoded).digest('base64url');
    const applyResponse = await post('apply', {
      expectedVersion: preview.baseVersion,
      previewForDate: preview.previewForDate,
      curriculumVersion: preview.curriculumVersion,
      availability,
      selectedItemIds: preview.selectedItemIds,
      targetDate: preview.targetDate,
      previewToken: `${encoded}.${forgedSignature}`
    });
    assert.equal(applyResponse.status, 409);
    assert.equal((await applyResponse.json()).error?.code, 'INVALID_PREVIEW_TOKEN');
    assert.equal(dbRows.get('goal-user1').version, row.version);
  });

  it('CP21: POST /api/goal/workspace/checkpoint/draft persists and restores draftCurrentIndex', async () => {
    const row = dbRows.get('goal-user1');
    const draftPayload = {
      expectedVersion: row.version,
      checkpointId: 'chk_foundations_v1',
      draftAnswers: {
        chk_q_arrays_01: 'opt_arr_1'
      },
      draftCurrentIndex: 2
    };
    const res = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/draft`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user1-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftPayload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.studyWorkspace.continuation.checkpoint.draftCurrentIndex, 2);

    // Verify draft position is returned on GET
    const getRes = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/chk_foundations_v1`, {
      headers: { Authorization: 'Bearer user1-token' }
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.draft.currentIndex, 2);
  });

  it('CP22: End-of-library continuation preview derives deliberate mastery revisit with isRevisit: true', async () => {
    const row = dbRows.get('goal-user1');
    const cur = getPublishedCurriculum();

    // Mark all published curriculum lessons completed in goal-user1
    const allCompletedLessons = {};
    for (const les of cur.lessons) {
      allCompletedLessons[les.id] = {
        lessonId: les.id,
        topicId: les.topicId,
        status: 'completed',
        completedAt: '2026-10-18T00:00:00Z',
        updatedAt: '2026-10-18T00:00:00Z'
      };
    }
    row.state.studyWorkspace.lessonProgress = allCompletedLessons;
    // Clear any pending due reviews so end-of-library fallback is reached
    row.state.studyWorkspace.exerciseAttempts = {};
    row.state.studyWorkspace.practiceAttempts = {};

    const prevRes = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
        selectedItemIds: []
      })
    });
    assert.equal(prevRes.status, 200);
    const prevBody = await prevRes.json();
    assert.ok(prevBody.data.sessions.length > 0, 'Must produce scheduled sessions in end-of-library state');
    assert.ok(
      prevBody.data.sessions.some((s) => s.isRevisit === true),
      'End-of-library sessions must flag completed items as deliberate revisits'
    );
  });

  it('CP23: evaluateCheckpoint idempotent retry across simulated definition update returns historical evaluation without regrading', async () => {
    const row = dbRows.get('goal-user1');
    const attemptId = '80000000-0000-4000-8000-000000000001';

    // 1. Initial successful evaluation under definition version 1
    const evalRes1 = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        attemptId,
        checkpointId: 'chk_foundations_v1',
        definitionVersion: 1,
        answers: {
          chk_q_arrays_01: 'opt_arr_1',
          chk_q_hashing_01: 'opt_hash_1',
          chk_q_bs_01: 'opt_bs_1'
        },
        selfReportedAssistance: {
          chk_q_arrays_01: { usedHint: false },
          chk_q_hashing_01: { usedHint: false },
          chk_q_bs_01: { usedHint: false }
        },
        reflection: 'Initial clean evaluation'
      })
    });
    assert.equal(evalRes1.status, 200);
    const body1 = await evalRes1.json();
    assert.equal(body1.data.evaluation.score.correct, 3);
    const versionAfterEval = body1.data.goal.version;

    // 2. Identical retry returns 200 without version bump or regrading
    const retryRes = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: versionAfterEval,
        attemptId,
        checkpointId: 'chk_foundations_v1',
        definitionVersion: 1,
        answers: {
          chk_q_arrays_01: 'opt_arr_1',
          chk_q_hashing_01: 'opt_hash_1',
          chk_q_bs_01: 'opt_bs_1'
        },
        selfReportedAssistance: {
          chk_q_arrays_01: { usedHint: false },
          chk_q_hashing_01: { usedHint: false },
          chk_q_bs_01: { usedHint: false }
        },
        reflection: 'Initial clean evaluation'
      })
    });
    assert.equal(retryRes.status, 200);
    const retryBody = await retryRes.json();
    assert.equal(retryBody.data.evaluation.attemptId, attemptId);
    assert.equal(retryBody.data.evaluation.score.correct, 3);
    assert.equal(retryBody.data.goal.version, versionAfterEval, 'Idempotent retry must not bump version');

    // 3. Mutated retry under same attemptId returns 409 ATTEMPT_CONFLICT
    const conflictRes = await fetch(`${baseUrl}/api/goal/workspace/checkpoint/evaluate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: versionAfterEval,
        attemptId,
        checkpointId: 'chk_foundations_v1',
        definitionVersion: 1,
        answers: {
          chk_q_arrays_01: 'opt_arr_1',
          chk_q_hashing_01: 'opt_hash_1',
          chk_q_bs_01: 'opt_bs_1'
        },
        selfReportedAssistance: {
          chk_q_arrays_01: { usedHint: false },
          chk_q_hashing_01: { usedHint: false },
          chk_q_bs_01: { usedHint: false }
        },
        reflection: 'Mutated reflection under same attemptId'
      })
    });
    assert.equal(conflictRes.status, 409);
    const conflictBody = await conflictRes.json();
    assert.equal(conflictBody.error?.code, 'ATTEMPT_CONFLICT');
  });

  it('CP24: Continuation preview automatically schedules due reviews from exercise and practice attempts as revisits', async () => {
    const row = dbRows.get('goal-user1');
    const today = getTodayKolkata();

    // Add a due exercise attempt (nextReviewDate <= today)
    row.state.studyWorkspace.exerciseAttempts = {
      ex_arrays_01: [
        {
          attemptId: '90000000-0000-4000-8000-000000000002',
          exerciseId: 'ex_arrays_01',
          outcome: 'with_hint',
          savedAt: `${today}T08:00:00Z`,
          nextReviewDate: today
        }
      ]
    };

    const prevRes = await fetch(`${baseUrl}/api/goal/workspace/continuation/plan/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: row.version,
        availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 },
        selectedItemIds: []
      })
    });
    assert.equal(prevRes.status, 200);
    const prevBody = await prevRes.json();
    assert.ok(prevBody.data.selectedItemIds.includes('ex_arrays_01'), 'Due exercise must be derived into continuation plan');
    const exSession = prevBody.data.sessions.find((s) => s.itemId === 'ex_arrays_01');
    assert.ok(exSession, 'Session for due exercise must be scheduled');
    assert.equal(exSession.isRevisit, true, 'Due exercise session must have isRevisit: true');
  });

  it('CP25: signed review semantics reject changes and survive omitted or matching apply flags', async () => {
    const availability = { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 60, sun: 60 };
    const post = (route, data) => fetch(`${baseUrl}/api/goal/workspace/continuation/plan/${route}`, {
      method: 'POST', headers: { Authorization: 'Bearer user1-token', 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    for (const explicit of [false, true]) {
      const version = dbRows.get('goal-user1').version;
      const previewResponse = await post('preview', { expectedVersion: version, availability, selectedItemIds: ['ex_arrays_01'], revisitItemIds: ['ex_arrays_01'] });
      assert.equal(previewResponse.status, 200);
      const preview = (await previewResponse.json()).data;
      assert.ok(preview.revisitItemIds.includes('ex_arrays_01'));
      const apply = { expectedVersion: version, availability, selectedItemIds: preview.selectedItemIds, previewToken: preview.previewToken, previewForDate: preview.previewForDate, curriculumVersion: preview.curriculumVersion };
      const changed = await post('apply', { ...apply, revisitItemIds: [] });
      assert.equal(changed.status, 409);
      assert.equal((await changed.json()).error.code, 'PREVIEW_MISMATCH');
      assert.equal(dbRows.get('goal-user1').version, version);
      const accepted = await post('apply', explicit ? { ...apply, revisitItemIds: preview.revisitItemIds } : apply);
      assert.equal(accepted.status, 200);
      const saved = (await accepted.json()).data;
      assert.equal(saved.studyPlan.sessions.find((session) => session.itemId === 'ex_arrays_01').isRevisit, true);
      assert.equal(saved.goal.version, version + 1);
    }
  });
});

