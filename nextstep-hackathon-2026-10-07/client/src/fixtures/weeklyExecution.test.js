import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveWeeklyExecution } from '../services/weeklyExecution.js';
const now = new Date('2026-12-31T19:00:00Z'); // 1 January in India.
const session = (id, date, other = {}) => ({ itemId: id, itemType: 'lesson', date, allocatedMinutes: 15, ...other });
const makeGoal = (sessions, extra = {}) => ({ availability: { fri: 60 }, studyWorkspace: { studyPlan: { sessions, availability: { fri: 30 } }, ...extra } });

test('week uses IST midnight/year boundaries, includes seven days and accepted capacity', () => {
  const model = deriveWeeklyExecution(makeGoal([session('a', '2027-01-01')]), now);
  assert.equal(model.today, '2027-01-01'); assert.equal(model.end, '2027-01-07'); assert.equal(model.days.length, 7);
  assert.equal(model.days[0].capacity, 30); assert.equal(model.weekMinutes, 15);
  assert.equal(deriveWeeklyExecution(makeGoal([]), now, -1).start, '2026-12-25');
});
test('week separates missed pending allocations, future spillover and recorded work', () => {
  const goal = makeGoal([session('missed', '2026-12-30'), session('finished', '2026-12-31'), session('next', '2027-01-02'), session('later', '2027-01-09')], { lessonProgress: { finished: { status: 'completed' } } });
  const before = JSON.stringify(goal); const model = deriveWeeklyExecution(goal, now);
  assert.deepEqual(model.missed.map(s => s.itemId), ['missed']);
  assert.deepEqual(model.spillover.map(s => s.itemId), ['later']);
  assert.equal(model.completedActivities, 1); assert.equal(model.pendingActivities, 3); assert.equal(JSON.stringify(goal), before);
});
test('split allocations share completion evidence and deduplicate replan selections', () => {
  const model = deriveWeeklyExecution(makeGoal([session('split', '2027-01-01', { partIndex: 1, totalParts: 2 }), session('split', '2027-01-02', { partIndex: 2, totalParts: 2 })]), now);
  assert.deepEqual(model.pendingItemIds, ['split']); assert.equal(model.weekMinutes, 30);
  const complete = deriveWeeklyExecution(makeGoal(model.sessions, { lessonProgress: { split: { status: 'completed' } } }), now);
  assert.equal(complete.allCompleted, true); assert.equal(complete.completedActivities, 1); assert.equal(complete.pendingActivities, 0);
});
test('intentional reviews require fresh evidence and preserve review intent for replanning', () => {
  const goal = makeGoal([session('ex_arrays_01', '2026-12-30', { itemType: 'exercise', isRevisit: true })], { continuation: { suggestedPlan: { acceptedAt: '2026-12-31T18:00:00Z' } }, exerciseAttempts: { ex_arrays_01: [{ outcome: 'independent', savedAt: '2026-12-30T00:00:00Z' }] } });
  assert.deepEqual(deriveWeeklyExecution(goal, now).revisitItemIds, ['ex_arrays_01']);
  goal.studyWorkspace.exerciseAttempts.ex_arrays_01.push({ outcome: 'independent', savedAt: '2026-12-31T19:00:00Z' });
  assert.equal(deriveWeeklyExecution(goal, now).allCompleted, true);
});
test('empty plan, no plan and unscheduled work are distinct', () => {
  assert.equal(deriveWeeklyExecution({}, now).hasPlan, false);
  const goal = makeGoal([]); goal.studyWorkspace.studyPlan.unscheduledItemIds = ['les_arrays_01'];
  const model = deriveWeeklyExecution(goal, now);
  assert.equal(model.hasPlan, true); assert.equal(model.allCompleted, false); assert.deepEqual(model.unscheduled, ['les_arrays_01']);
  assert.deepEqual(model.pendingItemIds, ['les_arrays_01']);
});

test('unscheduled work survives replanning, including reviews with old completion evidence', () => {
  const goal = makeGoal([session('done', '2027-01-01')], { lessonProgress: { done: { status: 'completed' }, les_arrays_01: { status: 'completed' } } });
  goal.studyWorkspace.studyPlan.unscheduledItemIds = ['les_arrays_01', 'les_arrays_02'];
  const model = deriveWeeklyExecution(goal, now);
  assert.deepEqual(model.pendingItemIds, ['les_arrays_01', 'les_arrays_02']);
  assert.deepEqual(model.revisitItemIds, ['les_arrays_01']);
  assert.equal(model.allCompleted, false);
});
