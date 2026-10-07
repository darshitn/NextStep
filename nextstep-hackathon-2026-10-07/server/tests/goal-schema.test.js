import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createGoalSchema } from '../src/schemas/goalSchemas.js';
import { getTodayKolkata, addDays } from '../src/services/scheduler.js';

test('goal creation accepts browser UUID format and rejects legacy req_ IDs', () => {
  const today = getTodayKolkata();
  const payload = {
    creationRequestId: randomUUID(),
    trackId: 'dsa-starter-v1',
    planStartDate: today,
    targetDate: addDays(today, 30),
    deadlineMode: 'fixed',
    timezone: 'Asia/Kolkata',
    availability: { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
  };
  assert.equal(createGoalSchema.safeParse(payload).success, true);
  const legacy = createGoalSchema.safeParse({ ...payload, creationRequestId: 'req_ab123' });
  assert.equal(legacy.success, false);
  assert.ok(legacy.error.issues.some(issue => issue.path[0] === 'creationRequestId'));
});
