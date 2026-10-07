import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSchedule, deriveGoalStats, apiFixture } from './apiFixture.js';
import catalogData from './dsa-starter.json' with { type: 'json' };

test('S01: Initial schedule matches exact fixture dates from SCHEDULER.md', () => {
  const missionIds = catalogData.missions.map(m => m.id);
  const availability = { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };
  const schedule = calculateSchedule('2026-10-07', availability, missionIds);

  assert.equal(schedule.length, 12);
  assert.equal(schedule[0].missionId, 'm01');
  assert.equal(schedule[0].date, '2026-10-07');
  assert.equal(schedule[1].missionId, 'm02');
  assert.equal(schedule[1].date, '2026-10-07');

  assert.equal(schedule[2].missionId, 'm03');
  assert.equal(schedule[2].date, '2026-10-09');
  assert.equal(schedule[3].missionId, 'm04');
  assert.equal(schedule[3].date, '2026-10-09');

  assert.equal(schedule[4].missionId, 'm05');
  assert.equal(schedule[4].date, '2026-10-12');
  assert.equal(schedule[5].missionId, 'm06');
  assert.equal(schedule[5].date, '2026-10-12');

  assert.equal(schedule[6].missionId, 'm07');
  assert.equal(schedule[6].date, '2026-10-14');
  assert.equal(schedule[7].missionId, 'm08');
  assert.equal(schedule[7].date, '2026-10-14');

  assert.equal(schedule[8].missionId, 'm09');
  assert.equal(schedule[8].date, '2026-10-16');
  assert.equal(schedule[9].missionId, 'm10');
  assert.equal(schedule[9].date, '2026-10-16');

  assert.equal(schedule[10].missionId, 'm11');
  assert.equal(schedule[10].date, '2026-10-19');
  assert.equal(schedule[11].missionId, 'm12');
  assert.equal(schedule[11].date, '2026-10-19');
});

test('S02: Mon/Wed/Fri 30 minutes finishes on 2026-11-02', () => {
  const missionIds = catalogData.missions.map(m => m.id);
  const availability = { mon: 30, tue: 0, wed: 30, thu: 0, fri: 30, sat: 0, sun: 0 };
  const schedule = calculateSchedule('2026-10-07', availability, missionIds);

  assert.equal(schedule.length, 12);
  assert.equal(schedule[schedule.length - 1].date, '2026-11-02');
});

test('S06b: Recovery subtracting time completed today finishes on 2026-10-30', () => {
  const pendingMissionIds = catalogData.missions.slice(2).map(m => m.id); // 10 pending
  const availability = { mon: 30, tue: 0, wed: 30, thu: 0, fri: 30, sat: 0, sun: 0 };
  // m01 and m02 were completed today (60 min completed today), proposed capacity today is 30m -> 0 slots today
  const schedule = calculateSchedule('2026-10-07', availability, pendingMissionIds, 60);

  assert.equal(schedule.length, 10);
  assert.equal(schedule[schedule.length - 1].date, '2026-10-30');
});

test('XP and level derivation', () => {
  const baseGoal = {
    schedule: [{ missionId: 'm01', date: '2026-10-07' }],
    targetDate: '2026-11-06',
    completions: {}
  };

  const zeroDone = deriveGoalStats(baseGoal);
  assert.equal(zeroDone.xp, 0);
  assert.equal(zeroDone.level, 1);
  assert.equal(zeroDone.remainingMinutes, 360);
  assert.equal(zeroDone.nextMissionId, 'm01');

  baseGoal.completions = {
    m01: { outcome: 'independent', completedAt: '2026-10-07T04:00:00Z' }
  };
  const oneDone = deriveGoalStats(baseGoal);
  assert.equal(oneDone.xp, 20);
  assert.equal(oneDone.level, 1);
  assert.equal(oneDone.remainingMinutes, 330);
  assert.equal(oneDone.nextMissionId, 'm02');
});
