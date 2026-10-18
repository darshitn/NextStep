import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, getTodayKolkata, addDays } from '../src/services/scheduler.js';

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
});

