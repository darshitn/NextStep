import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTodayPrimaryAction } from '../services/workspace.js';
import curriculumCatalog from './curriculum.json' with { type: 'json' };

const MOCK_CATALOG = {
  curriculum: curriculumCatalog,
  missions: [
    { id: 'm01', title: 'Set up your local DSA environment & timing', minutes: 30 },
    { id: 'm02', title: 'Two-pointer technique on sorted arrays', minutes: 30 },
    { id: 'm03', title: 'Sliding window maximum frequency', minutes: 30 }
  ]
};

test('TA01: New account with no curriculum progress recommends first lesson with starter mission alternative', () => {
  const goal = {
    id: 'goal_new',
    nextMissionId: 'm01',
    completions: {},
    studyWorkspace: {}
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: MOCK_CATALOG,
    currentMission: MOCK_CATALOG.missions[0]
  });

  assert.ok(action);
  assert.equal(action.heading, 'Start today’s activity');
  assert.equal(action.type, 'recommendation');
  assert.equal(action.actionTarget.type, 'proof');
  assert.equal(action.actionTarget.lessonId, 'les_arrays_01');
  assert.equal(action.actionTarget.mode, 'learn');
  assert.ok(action.alternativeAction);
  assert.equal(action.alternativeAction.type, 'starter_mission');
  assert.equal(action.alternativeAction.actionTarget.mission.id, 'm01');
});

test('TA02: Explicit resumable curriculum lesson in_progress takes top precedence', () => {
  const goal = {
    id: 'goal_resumable_curriculum',
    nextMissionId: 'm01',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_02: { status: 'in_progress' }
      },
      studyPlan: {
        sessions: [
          { date: '2026-10-20', itemId: 'les_arrays_01', itemType: 'lesson', topicId: 'topic_arrays', title: 'Planned Session 1', allocatedMinutes: 30 }
        ]
      }
    }
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: MOCK_CATALOG,
    currentMission: MOCK_CATALOG.missions[0]
  });

  assert.ok(action);
  assert.equal(action.type, 'resumable');
  assert.equal(action.heading, 'Continue learning');
  assert.equal(action.actionTarget.lessonId, 'les_arrays_02');
  assert.equal(action.actionLabel, 'Continue lesson');
});

test('TA03: Explicit resumable starter mission takes top precedence when recorded', () => {
  const goal = {
    id: 'goal_resumable_starter',
    nextMissionId: 'm01',
    learning: {
      m01: { whereStuck: 'Timing setup', selfReportedStatus: 'still_unsure' }
    },
    studyWorkspace: {}
  };
  const resumeContext = {
    mission: MOCK_CATALOG.missions[0],
    record: goal.learning.m01
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: MOCK_CATALOG,
    resumeContext,
    currentMission: MOCK_CATALOG.missions[0]
  });

  assert.ok(action);
  assert.equal(action.type, 'resumable');
  assert.equal(action.heading, 'Continue learning');
  assert.equal(action.actionTarget.type, 'mission');
  assert.equal(action.actionTarget.mission.id, 'm01');
  assert.equal(action.actionLabel, 'Resume practice');
});

test('TA04: Accepted weekly plan pending session takes precedence over standard recommendation', () => {
  const goal = {
    id: 'goal_weekly_plan',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: { status: 'completed' }
      },
      studyPlan: {
        sessions: [
          { date: '2026-10-20', itemId: 'les_arrays_02', itemType: 'lesson', topicId: 'topic_arrays', title: 'Prefix Sum & Running Differences', allocatedMinutes: 30 }
        ]
      }
    }
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: MOCK_CATALOG,
    currentMission: MOCK_CATALOG.missions[0]
  });

  assert.ok(action);
  assert.equal(action.type, 'weekly_plan');
  assert.equal(action.heading, 'Start today’s activity');
  assert.equal(action.title, 'Prefix Sum & Running Differences');
  assert.equal(action.actionLabel, 'Start planned session');
  assert.equal(action.actionTarget.lessonId, 'les_arrays_02');
});

test('TA05: Completed 12/12 starter recommends Foundations Checkpoint', () => {
  const completedMissions = Array.from({ length: 12 }, (_, i) => ({ id: `m${String(i + 1).padStart(2, '0')}` }));
  const fullCatalog = {
    ...MOCK_CATALOG,
    missions: completedMissions
  };
  const goal = {
    id: 'goal_completed_starter',
    completions: Object.fromEntries(completedMissions.map(m => [m.id, { outcome: 'independent' }])),
    studyWorkspace: {}
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: fullCatalog
  });

  assert.ok(action);
  assert.equal(action.type, 'checkpoint');
  assert.equal(action.actionTarget.type, 'checkpoint');
  assert.equal(action.actionLabel, 'Check My Foundations (10 min)');
});

test('TA06: All curriculum lessons completed recommends deliberate revision with zero fabricated mastery', () => {
  const allCompletedProgress = Object.fromEntries(
    MOCK_CATALOG.curriculum.lessons.map(l => [l.id, { status: 'completed' }])
  );
  const goal = {
    id: 'goal_all_curriculum_complete',
    completions: {},
    studyWorkspace: {
      lessonProgress: allCompletedProgress
    }
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: MOCK_CATALOG
  });

  assert.ok(action);
  assert.equal(action.type, 'all_completed');
  assert.equal(action.heading, 'All curriculum lessons completed');
  assert.ok(action.reason.includes('You have completed every published lesson'));
});

test('TA07: Catalog unavailable gracefully falls back to starter mission', () => {
  const goal = {
    id: 'goal_no_catalog',
    nextMissionId: 'm01',
    completions: {},
    studyWorkspace: {}
  };
  const action = deriveTodayPrimaryAction({
    goal,
    catalog: { missions: MOCK_CATALOG.missions }, // No curriculum
    currentMission: MOCK_CATALOG.missions[0]
  });

  assert.ok(action);
  assert.equal(action.type, 'starter_mission');
  assert.ok(action.reason.includes('Curriculum catalog is currently unavailable'));
  assert.equal(action.actionTarget.mission.id, 'm01');
});
