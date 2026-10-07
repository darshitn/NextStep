import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, activityByDay, dayPlan, mondayOf, shiftDay } from '../services/activity.js';
test('activity respects IST midnight rather than UTC or scheduled date', () => {
  assert.equal(localDay('2026-10-07T18:29:59Z'), '2026-10-07');
  assert.equal(localDay('2026-10-07T18:30:00Z'), '2026-10-08');
  const missions = [{ id:'m01' },{ id:'m02' }];
  const goal = { schedule:[{missionId:'m01',date:'2026-10-05'}], completions:{m01:{completedAt:'2026-10-07T18:30:00Z'},m02:{completedAt:'2026-10-08T01:00:00Z'},unknown:{completedAt:'2026-10-08T01:00:00Z'}} };
  assert.equal(activityByDay(goal,missions)['2026-10-08'].length,2);
  assert.equal(Object.keys(activityByDay(goal,missions)).length,1);
  assert.equal(dayPlan(goal,missions,'2026-10-05').length,1);
  const recovered = { ...goal, schedule:[{missionId:'m01',date:'2026-10-12'}] };
  assert.deepEqual(activityByDay(goal,missions),activityByDay(recovered,missions));
});
test('calendar handles week and year boundaries and empty history', () => {
  assert.equal(mondayOf('2026-10-11'),'2026-10-05');
  assert.equal(shiftDay('2026-12-31',1),'2027-01-01');
  assert.deepEqual(activityByDay({},[{id:'m01'}]),{});
  assert.equal(localDay('not-a-date'),null);
});
