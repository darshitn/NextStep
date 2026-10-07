import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { catalogData } from '../src/routes/catalog.js';
import { calculateSchedule, deriveGoalStats, getTodayKolkata, addDays } from '../src/services/scheduler.js';

describe('NextStep API & Integration Test Suite', () => {
  let app;
  let server;
  let baseUrl;

  // Synthetic in-memory database simulating PostgreSQL table public.nextstep_goals with RLS
  const dbRows = new Map(); // id -> { id, owner_id, creation_request_id, version, state, created_at, updated_at }

  function createMockSupabaseClient(currentUserId) {
    return {
      from(tableName) {
        if (tableName !== 'nextstep_goals') throw new Error(`Unknown table ${tableName}`);
        return {
          select(fields = '*') {
            return {
              maybeSingle: async () => {
                // RLS: only return rows where owner_id === currentUserId
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
                  if (!currentUserId) return { data: null, error: { message: 'RLS check failed: anon cannot insert' } };
                  // Check unique constraint on owner_id
                  for (const row of dbRows.values()) {
                    if (row.owner_id === currentUserId) {
                      return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint nextstep_one_goal_per_owner' } };
                    }
                  }
                  const fullRecord = {
                    ...record,
                    owner_id: currentUserId,
                    created_at: new Date().toISOString(),
                    updated_at: record.updated_at || new Date().toISOString()
                  };
                  dbRows.set(record.id, fullRecord);
                  return { data: fullRecord, error: null };
                }
              }),
              then: async (resolve) => {
                if (!currentUserId) {
                  return resolve({ data: null, error: { message: 'RLS check failed: anon cannot insert' } });
                }
                for (const row of dbRows.values()) {
                  if (row.owner_id === currentUserId) {
                    return resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
                  }
                }
                const fullRecord = {
                  ...record,
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
                        if (!currentUserId) return { data: null, error: { message: 'Anonymous update denied' } };
                        // RLS & Version compare-and-set: col1='id', col2='version'
                        const row = dbRows.get(val1);
                        if (!row || row.owner_id !== currentUserId || row.version !== val2) {
                          return { data: [], error: null }; // 0 rows updated
                        }
                        const updated = {
                          ...row,
                          ...updates,
                          owner_id: row.owner_id // owner cannot change
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

    // Hook mock auth handler for deterministic synthetic unit testing
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

      // Synthetic users: 'user-1-token' -> user 'usr_001', 'user-2-token' -> user 'usr_002'
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
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('GET /api/health returns 200 and proves Express liveness', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, 'nextstep-api');
    assert.equal(body.apiVersion, 1);
  });

  test('GET /api/catalog returns 12 missions with total 360 minutes', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.trackId, 'dsa-starter-v1');
    assert.equal(body.data.missions.length, 12);
    assert.equal(body.data.estimatedMinutes, 360);
  });

  test('Authentication: Missing or invalid token returns 401 UNAUTHORIZED', async () => {
    // Missing token
    const resNoToken = await fetch(`${baseUrl}/api/goal`);
    assert.equal(resNoToken.status, 401);
    const errNoToken = await resNoToken.json();
    assert.equal(errNoToken.error.code, 'UNAUTHORIZED');

    // Invalid token
    const resBadToken = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.equal(resBadToken.status, 401);
    const errBadToken = await resBadToken.json();
    assert.equal(errBadToken.error.code, 'UNAUTHORIZED');
  });

  test('Goal Lifecycle: Create, Reload, Complete, Reload for User 1', async () => {
    const today = getTodayKolkata();
    const targetDate = addDays(today, 30);
    const creationRequestId = '10000000-0000-4000-8000-000000000001';

    // 1. Initial state: GET /api/goal returns null
    const resInitial = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    assert.equal(resInitial.status, 200);
    const initialBody = await resInitial.json();
    assert.equal(initialBody.data.goal, null);

    // 2. Create goal: POST /api/goal returns 201
    const createPayload = {
      creationRequestId,
      trackId: 'dsa-starter-v1',
      planStartDate: today,
      targetDate: targetDate,
      deadlineMode: 'flexible',
      timezone: 'Asia/Kolkata',
      availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
    };

    const resCreate = await fetch(`${baseUrl}/api/goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify(createPayload)
    });
    assert.equal(resCreate.status, 201);
    const createBody = await resCreate.json();
    const goal = createBody.data.goal;
    assert.ok(goal);
    assert.equal(goal.version, 1);
    assert.equal(goal.xp, 0);
    assert.equal(goal.level, 1);
    assert.equal(goal.remainingMinutes, 360);
    assert.equal(goal.nextMissionId, 'm01');
    assert.equal(goal.schedule.length, 12);
    assert.equal(goal.status, 'on_track');

    // 3. Idempotent Retry: Same creationRequestId returns 200 with the exact existing goal
    const resRetry = await fetch(`${baseUrl}/api/goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify(createPayload)
    });
    assert.equal(resRetry.status, 200);
    const retryBody = await resRetry.json();
    assert.equal(retryBody.data.goal.id, goal.id);

    // 4. Conflicting creation: Different creationRequestId returns 409 GOAL_EXISTS
    const resConflict = await fetch(`${baseUrl}/api/goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        ...createPayload,
        creationRequestId: '20000000-0000-4000-8000-000000000002'
      })
    });
    assert.equal(resConflict.status, 409);
    const conflictBody = await resConflict.json();
    assert.equal(conflictBody.error.code, 'GOAL_EXISTS');

    // 5. Reload goal: GET /api/goal returns created goal
    const resLoad = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    assert.equal(resLoad.status, 200);
    const loadBody = await resLoad.json();
    assert.equal(loadBody.data.goal.id, goal.id);

    // 6. Complete Mission m01: POST /api/goal/complete
    const completePayload = {
      missionId: 'm01',
      expectedVersion: 1,
      outcome: 'independent',
      reflection: 'Tested initial array concepts.'
    };
    const resComplete = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify(completePayload)
    });
    assert.equal(resComplete.status, 200);
    const completeBody = await resComplete.json();
    assert.equal(completeBody.data.alreadyCompleted, false);
    assert.equal(completeBody.data.goal.version, 2);
    assert.equal(completeBody.data.goal.xp, 20);
    assert.equal(completeBody.data.goal.remainingMinutes, 330);
    assert.equal(completeBody.data.goal.nextMissionId, 'm02');

    // 7. Duplicate completion of m01: Returns 200 with alreadyCompleted: true, no duplicate XP
    const resDupComplete = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify(completePayload)
    });
    assert.equal(resDupComplete.status, 200);
    const dupBody = await resDupComplete.json();
    assert.equal(dupBody.data.alreadyCompleted, true);
    assert.equal(dupBody.data.goal.xp, 20); // Not 40!
    assert.equal(dupBody.data.goal.version, 2); // Version not incremented

    // 8. Stale version rejected: Attempting m02 with expectedVersion 1 (now 2) returns 409 VERSION_CONFLICT
    const resStale = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        missionId: 'm02',
        expectedVersion: 1, // Stale!
        outcome: 'independent'
      })
    });
    assert.equal(resStale.status, 409);
    const staleBody = await resStale.json();
    assert.equal(staleBody.error.code, 'VERSION_CONFLICT');

    // 9. Unmet prerequisite rejected: Attempting m03 while m02 is incomplete returns 422 PREREQUISITE_REQUIRED
    const resPrereq = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        missionId: 'm03',
        expectedVersion: 2,
        outcome: 'independent'
      })
    });
    assert.equal(resPrereq.status, 422);
    const prereqBody = await resPrereq.json();
    assert.equal(prereqBody.error.code, 'PREREQUISITE_REQUIRED');

    // 10. Reload again: Confirms persistent progress survives
    const resFinalLoad = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    assert.equal(resFinalLoad.status, 200);
    const finalBody = await resFinalLoad.json();
    assert.equal(finalBody.data.goal.xp, 20);
    assert.equal(finalBody.data.goal.version, 2);
    assert.equal(finalBody.data.goal.nextMissionId, 'm02');
  });

  test('Data Isolation: User 2 cannot access or modify User 1 goal', async () => {
    // User 2 reads goal -> must be null
    const resU2 = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-2-token' }
    });
    assert.equal(resU2.status, 200);
    const u2Body = await resU2.json();
    assert.equal(u2Body.data.goal, null);

    // User 2 attempting to complete User 1's mission returns 404 GOAL_NOT_FOUND
    const resU2Complete = await fetch(`${baseUrl}/api/goal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-2-token'
      },
      body: JSON.stringify({
        missionId: 'm01',
        expectedVersion: 1,
        outcome: 'independent'
      })
    });
    assert.equal(resU2Complete.status, 404);
  });

  test('Scheduler boundary: deterministic recovery preview and apply', async () => {
    // Get current User 1 goal (version 2)
    const resGoal = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    const currentGoal = (await resGoal.json()).data.goal;
    assert.equal(currentGoal.version, 2);

    const newAvailability = { mon: 30, tue: 0, wed: 30, thu: 0, fri: 30, sat: 0, sun: 0 };

    // Recovery Preview (read-only)
    const resPreview = await fetch(`${baseUrl}/api/goal/recovery/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        availability: newAvailability
      })
    });
    assert.equal(resPreview.status, 200);
    const previewBody = await resPreview.json();
    const preview = previewBody.data.preview;
    assert.equal(preview.baseVersion, 2);
    assert.ok(preview.schedule.length > 0);
    assert.equal(preview.remainingMinutes, 330);

    // Goal version remains 2 after preview
    const resGoalAfterPreview = await fetch(`${baseUrl}/api/goal`, {
      headers: { Authorization: 'Bearer user-1-token' }
    });
    assert.equal((await resGoalAfterPreview.json()).data.goal.version, 2);

    // Stale previewForDate is rejected with 409
    const resStaleDate = await fetch(`${baseUrl}/api/goal/recovery/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        previewForDate: '2025-01-01', // Stale date!
        availability: newAvailability
      })
    });
    assert.equal(resStaleDate.status, 409);
    assert.equal((await resStaleDate.json()).error.code, 'STALE_PREVIEW');

    // Recovery Apply with valid today date
    const resApply = await fetch(`${baseUrl}/api/goal/recovery/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 2,
        previewForDate: preview.previewForDate,
        availability: newAvailability
      })
    });
    assert.equal(resApply.status, 200);
    const appliedGoal = (await resApply.json()).data.goal;
    assert.equal(appliedGoal.version, 3);
    assert.deepEqual(appliedGoal.availability, newAvailability);
  });

  test('Guidance endpoint validates version, mission, and returns structured advice', async () => {
    // Current nextMissionId for User 1 is 'm02', version 3
    const resGuidance = await fetch(`${baseUrl}/api/goal/guidance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        missionId: 'm02',
        category: 'too_difficult',
        feedback: 'Need help with pointer arithmetic.'
      })
    });
    assert.equal(resGuidance.status, 200);
    const body = await resGuidance.json();
    assert.ok(body.data.guidance);
    assert.equal(body.data.guidance.missionId, 'm02');
    assert.equal(body.data.guidance.mode, 'guided_practice');
    assert.ok(body.data.guidance.steps.length >= 2);
    assert.ok(body.data.guidance.checkQuestion);

    // Mismatched mission returns 422 INVALID_MISSION
    const resBadMission = await fetch(`${baseUrl}/api/goal/guidance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-1-token'
      },
      body: JSON.stringify({
        expectedVersion: 3,
        missionId: 'm03', // Next mission is m02, not m03
        category: 'ready_to_continue'
      })
    });
    assert.equal(resBadMission.status, 422);
  });
});
