import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDayRows } from '../services/calendarPresentation.js';

const missions = [{ id: 'm01', title: 'First', minutes: 30 }, { id: 'm02', title: 'Second', minutes: 30 }];
test('calendar shows a mission once when completed on its planned date', () => {
  const goal = { schedule: [{ missionId: 'm01', date: '2026-10-07' }], completions: { m01: { completedAt: '2026-10-07T06:00:00Z' } } };
  const rows = calendarDayRows(goal, missions, '2026-10-07');
  assert.deepEqual(rows.scheduled, []);
  assert.deepEqual(rows.completed.map(m => m.id), ['m01']);
});
test('calendar preserves the distinct scheduled date and actual local completion date', () => {
  const goal = { schedule: [{ missionId: 'm01', date: '2026-10-08' }, { missionId: 'm02', date: '2026-10-08' }], completions: { m01: { completedAt: '2026-10-06T20:00:00Z' } } };
  const original = JSON.stringify(goal);
  const planned = calendarDayRows(goal, missions, '2026-10-08');
  assert.equal(planned.scheduled[0].completedOn, '2026-10-07');
  assert.equal(planned.scheduled[1].completedOn, null);
  assert.deepEqual(planned.completed, []);
  assert.deepEqual(calendarDayRows(goal, missions, '2026-10-07').completed.map(m => m.id), ['m01']);
  assert.equal(JSON.stringify(goal), original);
});
