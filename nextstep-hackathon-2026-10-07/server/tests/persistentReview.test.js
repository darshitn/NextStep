import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { clearRateLimits } from '../src/services/rateLimiter.js';
import { calculateNextReviewDate, CONFIDENCE_INTERVALS } from '../src/schemas/goalSchemas.js';

describe('Persistent Recall Reviews — Backend Route, Idempotency & IST Date Math', () => {
  let app;
  let server;
  let baseUrl;

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
          error: { code: 'UNAUTHORIZED', message: 'Invalid token.' }
        });
      }
      req.user = { id: token === 'user-b-token' ? 'user-b-id' : 'user-a-id' };
      req.supabase = createMockSupabaseClient(req.user.id);
      next();
    };

    app.locals.mockSupabaseFactory = (userId) => createMockSupabaseClient(userId);

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    dbRows.clear();
    dbFailureMode = null;
    clearRateLimits();

    // Populate initial goal for user-a
    const goalStateA = {
      id: 'goal-user-a',
      goalName: 'Build my DSA foundations',
      trackId: 'dsa-starter-v1',
      status: 'on_track',
      version: 1,
      targetDate: '2026-11-15',
      planStartDate: '2026-10-07',
      availability: { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 90, sun: 90 },
      schedule: [
        { missionId: 'm01', date: '2026-10-07', minutes: 30 },
        { missionId: 'm02', date: '2026-10-08', minutes: 30 },
        { missionId: 'm03', date: '2026-10-09', minutes: 30 }
      ],
      completions: {
        m01: {
          completedAt: '2026-10-07T12:00:00.000Z',
          outcome: 'with_hint',
          reflection: 'Used hint for array bounds'
        }
      },
      learning: {
        m01: {
          category: 'too_difficult',
          whereStuck: 'Boundary condition',
          whatTried: 'Looked at hints',
          selfReportedStatus: 'ready_to_continue'
        }
      },
      xp: 40,
      level: 1,
      remainingMinutes: 360,
      createdAt: '2026-10-07T10:00:00.000Z',
      updatedAt: '2026-10-07T12:00:00.000Z'
    };

    dbRows.set('goal-user-a', {
      id: 'goal-user-a',
      owner_id: 'user-a-id',
      version: 1,
      state: goalStateA,
      created_at: '2026-10-07T10:00:00.000Z',
      updated_at: '2026-10-07T12:00:00.000Z'
    });
  });

  test('POST /api/goal/learning/recall - persists recall on completed mission with calculated IST due date', async () => {
    const attemptId = 'a1111111-1111-4111-8111-111111111111';
    const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm01',
        attemptId,
        attemptText: 'Retrieved two pointers approach from memory. Time complexity O(N).',
        confidence: 4
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.goal.version, 2);

    const att = body.data.recallAttempt;
    assert.equal(att.attemptId, attemptId);
    assert.equal(att.attemptText, 'Retrieved two pointers approach from memory. Time complexity O(N).');
    assert.equal(att.confidence, 4);
    assert.ok(att.savedAt);
    assert.ok(att.nextReviewDate);

    // Confidence 4 maps to +7 days
    const expectedDue = calculateNextReviewDate(att.savedAt, 4);
    assert.equal(att.nextReviewDate, expectedDue);

    // Goal learning state updated with latest attempt
    const history = body.data.goal.learning.m01.recallHistory;
    assert.equal(history.length, 1);
    assert.equal(history[0].attemptId, attemptId);

    // Unrelated fields preserved
    assert.equal(body.data.goal.learning.m01.whereStuck, 'Boundary condition');
    assert.equal(body.data.goal.completions.m01.outcome, 'with_hint');
    assert.equal(body.data.goal.xp, 20);
  });

  test('POST /api/goal/learning/recall - persists recall on current incomplete mission (nextMissionId)', async () => {
    const attemptId = 'a2222222-2222-4222-8222-222222222222';
    const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm02', // nextMissionId
        attemptId,
        attemptText: 'Drafting notes on duplicate tracing.',
        confidence: 3
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.goal.version, 2);
    assert.equal(body.data.recallAttempt.confidence, 3);
    assert.equal(body.data.goal.learning.m02.recallHistory.length, 1);
  });

  test('POST /api/goal/learning/recall - rejects future incomplete mission with 422', async () => {
    const attemptId = 'a3333333-3333-4333-8333-333333333333';
    const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm03', // m03 is future incomplete (m02 is current)
        attemptId,
        attemptText: 'Attempting future mission.',
        confidence: 3
      })
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'MISSION_NOT_ELIGIBLE');
  });

  test('POST /api/goal/learning/recall - rejects unknown mission ID with 404', async () => {
    const attemptId = 'a4444444-4444-4444-8444-444444444444';
    const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm999_nonexistent',
        attemptId,
        attemptText: 'Unknown mission.',
        confidence: 2
      })
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'MISSION_NOT_FOUND');
  });

  test('POST /api/goal/learning/recall - validates confidence boundaries (1 to 5) and trimmed text', async () => {
    const testCases = [
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'a1111111-1111-4111-8111-111111111111', attemptText: '  ', confidence: 3 }, field: 'attemptText' },
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'a1111111-1111-4111-8111-111111111111', attemptText: 'Valid', confidence: 0 }, field: 'confidence' },
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'a1111111-1111-4111-8111-111111111111', attemptText: 'Valid', confidence: 6 }, field: 'confidence' },
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'a1111111-1111-4111-8111-111111111111', attemptText: 'Valid', confidence: 3.5 }, field: 'confidence' },
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'not-a-uuid', attemptText: 'Valid', confidence: 3 }, field: 'attemptId' },
      { payload: { expectedVersion: 1, missionId: 'm01', attemptId: 'a1111111-1111-4111-8111-111111111111', attemptText: 'a'.repeat(2001), confidence: 3 }, field: 'attemptText' }
    ];

    for (const { payload } of testCases) {
      const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-a-token'
        },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 422, `Expected 422 for payload: ${JSON.stringify(payload)}`);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    }
  });

  test('POST /api/goal/learning/recall - duplicate retry with identical payload returns 200 without version increment', async () => {
    const attemptId = 'b1111111-1111-4111-8111-111111111111';
    const payload = {
      expectedVersion: 1,
      missionId: 'm01',
      attemptId,
      attemptText: 'Identical attempt text to test idempotency.',
      confidence: 5
    };

    // First save
    const res1 = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.goal.version, 2);
    assert.equal(body1.data.goal.learning.m01.recallHistory.length, 1);
    const savedTimestamp = body1.data.recallAttempt.savedAt;

    // Retry identical request with stale expectedVersion (1 instead of 2)
    const res2 = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(res2.status, 200, 'Duplicate retry must return 200');
    const body2 = await res2.json();
    assert.equal(body2.data.goal.version, 2, 'Version must not increment on duplicate retry');
    assert.equal(body2.data.goal.learning.m01.recallHistory.length, 1, 'History count must remain 1');
    assert.equal(body2.data.recallAttempt.savedAt, savedTimestamp, 'Original savedAt timestamp must be preserved');
  });

  test('POST /api/goal/learning/recall - reused attemptId with different payload returns 409 ATTEMPT_CONFLICT', async () => {
    const attemptId = 'c1111111-1111-4111-8111-111111111111';

    // First save
    const res1 = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 1,
        missionId: 'm01',
        attemptId,
        attemptText: 'Original text version A',
        confidence: 3
      })
    });
    assert.equal(res1.status, 200);

    // Reuse attemptId with different text
    const resConflict = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        missionId: 'm01',
        attemptId,
        attemptText: 'Modified text version B',
        confidence: 3
      })
    });

    assert.equal(resConflict.status, 409);
    const bodyConflict = await resConflict.json();
    assert.equal(bodyConflict.error.code, 'ATTEMPT_CONFLICT');
  });

  test('POST /api/goal/learning/recall - version conflict on new attemptId returns 409 VERSION_CONFLICT', async () => {
    const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-a-token'
      },
      body: JSON.stringify({
        expectedVersion: 99, // Stale version
        missionId: 'm01',
        attemptId: 'd1111111-1111-4111-8111-111111111111',
        attemptText: 'New attempt with wrong version',
        confidence: 4
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'VERSION_CONFLICT');
  });

  test('POST /api/goal/learning/recall - caps history retention at 20 latest entries', async () => {
    let currentVersion = 1;

    // Save 25 sequential attempts
    for (let i = 1; i <= 25; i++) {
      const padded = String(i).padStart(2, '0');
      const attemptId = `e0000000-0000-4000-8000-${padded}0000000000`;
      const res = await fetch(`${baseUrl}/api/goal/learning/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-a-token'
        },
        body: JSON.stringify({
          expectedVersion: currentVersion,
          missionId: 'm01',
          attemptId,
          attemptText: `Attempt number ${i}`,
          confidence: (i % 5) + 1
        })
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      currentVersion = body.data.goal.version;
    }

    const row = dbRows.get('goal-user-a');
    const history = row.state.learning.m01.recallHistory;

    assert.equal(history.length, 20, 'Recall history must be capped at 20 entries');
    // Oldest remaining should be attempt 6, newest attempt 25
    assert.equal(history[0].attemptText, 'Attempt number 6');
    assert.equal(history[19].attemptText, 'Attempt number 25');
  });

  test('calculateNextReviewDate - computes IST date correctly across UTC/IST midnight', () => {
    // 2026-10-16T18:45:00.000Z is 2026-10-17 00:15:00 IST (UTC + 5:30)
    const lateUtc = '2026-10-16T18:45:00.000Z';

    // In IST, date is already 2026-10-17
    // Confidence 1: +1 day -> 2026-10-18
    assert.equal(calculateNextReviewDate(lateUtc, 1), '2026-10-18');
    // Confidence 2: +2 days -> 2026-10-19
    assert.equal(calculateNextReviewDate(lateUtc, 2), '2026-10-19');
    // Confidence 3: +3 days -> 2026-10-20
    assert.equal(calculateNextReviewDate(lateUtc, 3), '2026-10-20');
    // Confidence 4: +7 days -> 2026-10-24
    assert.equal(calculateNextReviewDate(lateUtc, 4), '2026-10-24');
    // Confidence 5: +14 days -> 2026-10-31
    assert.equal(calculateNextReviewDate(lateUtc, 5), '2026-10-31');

    // Month boundary: 2026-10-31 10:00:00 IST + 1 day -> 2026-11-01
    const endOfMonth = '2026-10-31T04:30:00.000Z';
    assert.equal(calculateNextReviewDate(endOfMonth, 1), '2026-11-01');

    // Year boundary: 2026-12-31 10:00:00 IST + 2 days -> 2027-01-02
    const endOfYear = '2026-12-31T04:30:00.000Z';
    assert.equal(calculateNextReviewDate(endOfYear, 2), '2027-01-02');
  });
});
