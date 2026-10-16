import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveWorkspaceStats,
  deriveReviewItems,
  filterMissions,
  deriveUpcomingMissions,
  calculateRemainingSeconds,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  formatTimerDisplay,
  dayDifferenceIST,
  deriveNotesLibrary,
  filterNotesLibrary,
  buildGoalExportData
} from '../services/workspace.js';

const mockCatalog = {
  trackId: 'dsa-starter-v1',
  title: 'DSA foundations starter',
  notice: 'Synthetic pilot catalogue. Durations are estimates; completion is self-reported practice.',
  missions: [
    {
      id: 'm01',
      title: 'Map your starting point',
      minutes: 30,
      steps: ['Note current experience', 'Read starter sequence', 'Write outcome'],
      doneWhen: 'Write what you know about arrays and hashing.'
    },
    {
      id: 'm02',
      title: 'Trace array lookups',
      minutes: 30,
      steps: ['Search for 8 by hand', 'Search absent value', 'Record comparison count'],
      doneWhen: 'Trace linear search on [4, 1, 8, 3].'
    },
    {
      id: 'm03',
      title: 'Attempt Contains Duplicate',
      minutes: 30,
      steps: ['Read problem', 'Attempt solution', 'Record approach'],
      doneWhen: 'Attempt problem and record outcome.'
    },
    {
      id: 'm04',
      title: 'Explain the duplicate check',
      minutes: 30,
      steps: ['Explain set-based solution', 'Space use', 'Empty-input case'],
      doneWhen: 'Explain set solution in your own words.'
    }
  ]
};

test('W01: deriveWorkspaceStats safely handles empty goal and catalog', () => {
  const statsEmpty = deriveWorkspaceStats(null, null);
  assert.equal(statsEmpty.totalCatalogMissions, 0);
  assert.equal(statsEmpty.completedCount, 0);
  assert.equal(statsEmpty.independentCount, 0);
  assert.equal(statsEmpty.withHintCount, 0);
  assert.equal(statsEmpty.activeDaysCount, 0);
  assert.deepEqual(statsEmpty.activeDays, []);
  assert.equal(statsEmpty.estimatedRemainingMinutes, 0);
  assert.deepEqual(statsEmpty.latestReflections, []);
});

test('W02: deriveWorkspaceStats excludes unknown completion IDs from counts, active days, and reflections', () => {
  const goalWithUnknown = {
    completions: {
      m01: {
        completedAt: '2026-10-10T14:00:00.000Z',
        outcome: 'independent',
        reflection: 'Understood array indexing.'
      },
      unknown_fake_mission_99: {
        completedAt: '2026-10-12T14:00:00.000Z',
        outcome: 'independent',
        reflection: 'Should not appear in stats.'
      }
    }
  };

  const stats = deriveWorkspaceStats(goalWithUnknown, mockCatalog);
  assert.equal(stats.totalCatalogMissions, 4);
  assert.equal(stats.completedCount, 1, 'Only known catalog mission counted in completed count');
  assert.equal(stats.independentCount, 1);
  assert.equal(stats.withHintCount, 0);
  assert.equal(stats.activeDaysCount, 1);
  assert.equal(stats.latestReflections.length, 1);
  assert.equal(stats.latestReflections[0].missionId, 'm01');
  assert.equal(stats.estimatedRemainingMinutes, 90, 'Remaining 3 missions * 30 min = 90 min');
});

test('W03: deriveWorkspaceStats orders reflections chronologically descending and calculates IST active days', () => {
  const goal = {
    completions: {
      m01: {
        completedAt: '2026-10-10T08:00:00.000Z',
        outcome: 'independent',
        reflection: 'First mission notes.'
      },
      m02: {
        completedAt: '2026-10-11T12:00:00.000Z',
        outcome: 'with_hint',
        reflection: 'Second mission notes with hint.'
      },
      m03: {
        completedAt: '2026-10-11T15:30:00.000Z',
        outcome: 'independent',
        reflection: 'Third mission same IST day.'
      }
    }
  };

  const stats = deriveWorkspaceStats(goal, mockCatalog);
  assert.equal(stats.completedCount, 3);
  assert.equal(stats.independentCount, 2);
  assert.equal(stats.withHintCount, 1);
  assert.equal(stats.activeDaysCount, 2);
  assert.deepEqual(stats.activeDays, ['2026-10-10', '2026-10-11']);

  assert.equal(stats.latestReflections[0].missionId, 'm03');
  assert.equal(stats.latestReflections[1].missionId, 'm02');
  assert.equal(stats.latestReflections[2].missionId, 'm01');
});

test('W04: deriveReviewItems prioritizes unresolved blockers, hint completions, and excludes future unstarted missions', () => {
  const mockNow = new Date('2026-10-15T12:00:00.000Z');
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: {
        completedAt: '2026-10-14T10:00:00.000Z', // 1 day ago in IST
        outcome: 'with_hint',
        reflection: 'Needed clue on linear scan.'
      }
    },
    learning: {
      m02: {
        category: 'too_difficult',
        whereStuck: 'Linear search vs hash lookup difference',
        whatTried: 'Looked at step 2',
        selfReportedStatus: 'still_unsure',
        dismissed: false
      },
      // Note on future un-started mission m04: must NOT be offered for review
      m04: {
        category: 'not_enough_time',
        whereStuck: 'Future note',
        selfReportedStatus: 'still_unsure',
        dismissed: false
      }
    }
  };

  const review = deriveReviewItems(goal, mockCatalog, mockNow);
  assert.equal(review.unresolvedCount, 1, 'Only active mission m02 counts as unresolved queue item');
  assert.equal(review.items.length, 2, 'm02 blocker and m01 hint completion included; future m04 excluded');

  // Priority 1: uncompleted unresolved blocker on current mission
  assert.equal(review.items[0].missionId, 'm02');
  assert.equal(review.items[0].type, 'blocker');
  assert.match(review.items[0].reason, /Unresolved difficulty/);

  // Priority 2: hint-assisted completed work
  assert.equal(review.items[1].missionId, 'm01');
  assert.equal(review.items[1].outcome, 'with_hint');
  assert.match(review.items[1].reason, /with a hint/);
});

test('W05: deriveReviewItems includes older completed work after >=3 IST calendar days as recall suggestion', () => {
  const mockNow = new Date('2026-10-15T12:00:00.000Z');
  const goal = {
    nextMissionId: 'm03',
    completions: {
      m01: {
        completedAt: '2026-10-11T10:00:00.000Z', // 4 days ago in IST
        outcome: 'independent',
        reflection: 'Clear baseline.'
      },
      m02: {
        completedAt: '2026-10-14T10:00:00.000Z', // 1 day ago in IST (< 3 days)
        outcome: 'independent',
        reflection: 'Recent practice.'
      }
    }
  };

  const review = deriveReviewItems(goal, mockCatalog, mockNow);
  // m01 completed 4 days ago is eligible (>= 3 days)
  // m02 completed 1 day ago is NOT eligible (< 3 days)
  assert.equal(review.items.length, 1);
  assert.equal(review.items[0].missionId, 'm01');
  assert.equal(review.items[0].type, 'recall');
  assert.match(review.items[0].reason, /3-day starter interval heuristic/);
});

test('W06: dayDifferenceIST correctly calculates calendar days in Asia/Kolkata', () => {
  const diff1 = dayDifferenceIST('2026-10-10', '2026-10-13');
  assert.equal(diff1, 3);

  const diff2 = dayDifferenceIST('2026-10-10T20:00:00.000Z', '2026-10-11T02:00:00.000Z');
  // In IST, 20:00 UTC on 10 Oct is 01:30 on 11 Oct; 02:00 UTC on 11 Oct is 07:30 on 11 Oct (same calendar day)
  assert.equal(diff2, 0);
});

test('W07: Focus timer calculations (start, pause, resume, reset, catchup, zero boundary)', () => {
  const t0 = 1000000;
  // Start 25 minute timer
  const timer = startTimer({ durationMinutes: 25, now: t0 });
  assert.equal(timer.isRunning, true);
  assert.equal(timer.presetMinutes, 25);
  assert.equal(timer.totalSeconds, 1500);
  assert.equal(timer.endTime, t0 + 1500 * 1000);

  // After 300 seconds (5 minutes)
  const remainingAfter5Min = calculateRemainingSeconds(timer.endTime, t0 + 300 * 1000);
  assert.equal(remainingAfter5Min, 1200);

  // Background tab catchup: after 1490 seconds
  const remainingLate = calculateRemainingSeconds(timer.endTime, t0 + 1490 * 1000);
  assert.equal(remainingLate, 10);

  // Zero boundary: after 1510 seconds (exceeded end time)
  const remainingZero = calculateRemainingSeconds(timer.endTime, t0 + 1510 * 1000);
  assert.equal(remainingZero, 0, 'Does not return negative numbers at or beyond zero');

  // Pause
  const paused = pauseTimer(timer, t0 + 300 * 1000);
  assert.equal(paused.isRunning, false);
  assert.equal(paused.endTime, null);
  assert.equal(paused.pausedRemainingSeconds, 1200);

  // Resume 10 seconds later
  const tResume = t0 + 310 * 1000;
  const resumed = resumeTimer(paused, tResume);
  assert.equal(resumed.isRunning, true);
  assert.equal(resumed.endTime, tResume + 1200 * 1000);

  // Reset
  const reset = resetTimer(15);
  assert.equal(reset.presetMinutes, 15);
  assert.equal(reset.pausedRemainingSeconds, 900);
  assert.equal(reset.isRunning, false);

  // Formatting
  assert.equal(formatTimerDisplay(1500), '25:00');
  assert.equal(formatTimerDisplay(65), '01:05');
  assert.equal(formatTimerDisplay(0), '00:00');
});

test('W08: Notes library derivation and keyword search', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: {
        completedAt: '2026-10-10T10:00:00.000Z',
        outcome: 'independent',
        reflection: 'Understood array indices well.'
      }
    },
    learning: {
      m02: {
        category: 'too_difficult',
        whereStuck: 'Linear comparison worst-case',
        whatTried: 'Drew array on paper',
        selfReportedStatus: 'still_unsure'
      }
    }
  };

  const notes = deriveNotesLibrary(goal, mockCatalog);
  assert.equal(notes.length, 2);

  // Search by keyword in whereStuck
  const matchStuck = filterNotesLibrary(notes, 'worst-case');
  assert.equal(matchStuck.length, 1);
  assert.equal(matchStuck[0].missionId, 'm02');

  // Search by keyword in reflection
  const matchReflection = filterNotesLibrary(notes, 'array indices');
  assert.equal(matchReflection.length, 1);
  assert.equal(matchReflection[0].missionId, 'm01');

  // No match
  const noMatch = filterNotesLibrary(notes, 'nonexistent');
  assert.equal(noMatch.length, 0);
});

test('W09: Goal export data snapshot is clean, sanitized, and documented', () => {
  const goal = {
    id: 'goal-123',
    goalName: 'DSA Mastery Sprint',
    trackId: 'dsa-starter-v1',
    status: 'on_track',
    version: 4,
    xp: 40,
    level: 1,
    completions: { m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'independent' } },
    schedule: [{ missionId: 'm01', date: '2026-10-10' }]
  };

  const exportData = buildGoalExportData(goal, mockCatalog, new Date('2026-10-16T10:00:00.000Z'));
  assert.ok(exportData);
  assert.equal(exportData.exportedAt, '2026-10-16T10:00:00.000Z');
  assert.match(exportData.exportNotice, /Curriculum durations are estimates/);
  assert.match(exportData.exportNotice, /completion outcomes are self-reported/);
  assert.equal(exportData.track.trackId, 'dsa-starter-v1');
  assert.equal(exportData.goal.id, 'goal-123');
  assert.equal(exportData.goal.version, 4);

  // Ensure no tokens, passwords or secrets leaked
  assert.equal(exportData.token, undefined);
  assert.equal(exportData.session, undefined);
  assert.equal(exportData.password, undefined);
});

test('W10: Dismissal removes a review suggestion while preserving its searchable notes', () => {
  const goal = {
    nextMissionId: 'm02',
    learning: {
      m02: {
        category: 'too_difficult',
        whereStuck: 'Resolved offline',
        dismissed: true,
        selfReportedStatus: 'still_unsure'
      }
    }
  };

  const review = deriveReviewItems(goal, mockCatalog);
  assert.equal(review.unresolvedCount, 0, 'Dismissed item does not count towards unresolved count');
  assert.equal(review.items.length, 0);
  assert.equal(deriveNotesLibrary(goal, mockCatalog)[0].whereStuck, 'Resolved offline');
});

test('Roadmap search composes with completion filters and matches step content', () => {
  const options = { nextMissionId: 'm02', completions: { m01: {} } };
  assert.deepEqual(filterMissions(mockCatalog.missions, { ...options, query: ' M03 ' }).map(m => m.id), ['m03']);
  assert.deepEqual(filterMissions(mockCatalog.missions, { ...options, query: 'empty-input' }).map(m => m.id), ['m04']);
  assert.equal(filterMissions(mockCatalog.missions, { ...options, filter: 'completed', query: 'trace' }).length, 0);
  assert.deepEqual(filterMissions(mockCatalog.missions, { ...options, filter: 'next' }).map(m => m.id), ['m02']);
  assert.deepEqual(filterMissions(mockCatalog.missions, { ...options, filter: 'upcoming' }).map(m => m.id), ['m03', 'm04']);
});
