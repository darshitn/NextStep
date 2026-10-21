import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture } from './apiFixture.js';
import {
  deriveTopicAtlasModel,
  deriveCandidateActivities,
  buildCurriculumSearchIndex
} from '../services/workspace.js';

test('TE01: deriveTopicAtlasModel enriches topics with compact evidence and descriptive states', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const [catRes, goalRes] = await Promise.all([apiFixture.getCatalog(), apiFixture.getGoal()]);
  const catalog = catRes.data;
  const goal = goalRes.data.goal;

  const atlas = deriveTopicAtlasModel(goal, catalog, new Date('2026-10-21T06:00:00Z'));
  assert.equal(atlas.topics.length, 12, 'Must have 12 published curriculum topics');

  // Verify first topic (Arrays)
  const arraysTopic = atlas.topicMap['topic_arrays'];
  assert.ok(arraysTopic, 'Arrays topic must exist');
  assert.equal(typeof arraysTopic.completedLessonsCount, 'number');
  assert.equal(typeof arraysTopic.totalLessonsCount, 'number');
  assert.equal(typeof arraysTopic.distinctTracesVerifiedCount, 'number');
  assert.equal(typeof arraysTopic.independentTracesCount, 'number');
  assert.equal(typeof arraysTopic.supportedTracesCount, 'number');
  assert.equal(typeof arraysTopic.externalPracticeCount, 'number');
  assert.equal(arraysTopic.isPracticeSelfReported, true, 'Practice problems must be explicitly marked self-reported');
  assert.ok(Array.isArray(arraysTopic.dueReviews));
  assert.ok(Array.isArray(arraysTopic.unresolvedReinforcements));

  // Check descriptive status
  const validStatuses = ['not_started', 'learning', 'practise_again', 'recent_evidence'];
  assert.ok(validStatuses.includes(arraysTopic.status), `Status "${arraysTopic.status}" must be one of the 4 descriptive states`);
  assert.ok(typeof arraysTopic.statusLabel === 'string' && arraysTopic.statusLabel.length > 0);
  assert.ok(typeof arraysTopic.statusExplanation === 'string' && arraysTopic.statusExplanation.length > 0);

  // Status must never be a percentage
  assert.ok(!arraysTopic.status.includes('%'));
  assert.ok(!arraysTopic.statusLabel.includes('%'));
});

test('TE02: Descriptive states: practise_again when due reviews or check-in struggle exist', async () => {
  const catalog = (await apiFixture.getCatalog()).data;

  // Synthesize goal with check-in struggle on arrays lesson
  const goal = {
    id: 'goal_test_struggle',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-20T10:00:00Z',
          checkIn: {
            needs_example: true,
            unsure: true,
            focus: 'invariant'
          }
        }
      },
      exerciseAttempts: {}
    }
  };

  const atlas = deriveTopicAtlasModel(goal, catalog, new Date('2026-10-21T06:00:00Z'));
  const arraysTopic = atlas.topicMap['topic_arrays'];

  assert.equal(arraysTopic.status, 'practise_again');
  assert.equal(arraysTopic.statusLabel, 'Practise again');
  assert.ok(arraysTopic.unresolvedSignalCount >= 1);
  assert.ok(arraysTopic.statusExplanation.includes('unassisted practice') || arraysTopic.statusExplanation.includes('signal'));
  assert.ok(arraysTopic.actionableTarget, 'Must provide an actionable target');
});

test('TE03: Descriptive states: recent_evidence when all lessons complete without pending reviews', async () => {
  const catalog = (await apiFixture.getCatalog()).data;
  const arraysLessons = catalog.curriculum.lessons.filter((l) => l.topicId === 'topic_arrays');

  const lessonProgress = {};
  for (const l of arraysLessons) {
    lessonProgress[l.id] = {
      status: 'completed',
      completedAt: '2026-10-20T10:00:00Z',
      checkIn: null
    };
  }

  // Future review date to ensure no due reviews
  const exerciseAttempts = {
    ex_arrays_01: [
      {
        attemptId: 'att_clean',
        outcome: 'independent',
        savedAt: '2026-10-20T11:00:00Z',
        nextReviewDate: '2026-10-30'
      }
    ]
  };

  const goal = {
    id: 'goal_test_clean',
    studyWorkspace: {
      lessonProgress,
      exerciseAttempts
    }
  };

  const atlas = deriveTopicAtlasModel(goal, catalog, new Date('2026-10-21T06:00:00Z'));
  const arraysTopic = atlas.topicMap['topic_arrays'];

  assert.equal(arraysTopic.status, 'recent_evidence');
  assert.equal(arraysTopic.statusLabel, 'Recent evidence');
  assert.equal(arraysTopic.dueReviewCount, 0);
  assert.equal(arraysTopic.unresolvedSignalCount, 0);
  assert.ok(arraysTopic.statusExplanation.includes('All published lessons completed'));
});

test('TE04: Topic without traces is not shown as 0% capable', async () => {
  const catalog = (await apiFixture.getCatalog()).data;

  // Create a synthetic topic with no traces
  const topicWithoutTraces = {
    ...catalog.curriculum.topics[0],
    id: 'topic_concept_only',
    title: 'Pure Concept Topic'
  };
  const syntheticCatalog = {
    ...catalog,
    curriculum: {
      ...catalog.curriculum,
      topics: [topicWithoutTraces],
      lessons: [{ id: 'les_c_01', topicId: 'topic_concept_only', title: 'Concept Lesson', order: 1, estimatedMinutes: 20 }],
      exercises: [], // Zero exercises authored
      practiceProblems: []
    }
  };

  const goal = { id: 'goal_concept', studyWorkspace: {} };
  const atlas = deriveTopicAtlasModel(goal, syntheticCatalog, new Date('2026-10-21T06:00:00Z'));
  const topic = atlas.topics[0];

  assert.equal(topic.hasTraces, false);
  assert.equal(topic.totalExercisesCount, 0);
  assert.equal(topic.distinctTracesVerifiedCount, 0);
  assert.equal(topic.status, 'not_started');
  // Must not have NaN or percentages
  assert.ok(!JSON.stringify(topic).includes('NaN'));
  assert.ok(!JSON.stringify(topic).includes('0%'));
});

test('TE05: deriveCandidateActivities seeds unresolved reinforcement signals as revisits', async () => {
  const catalog = (await apiFixture.getCatalog()).data;

  const goal = {
    id: 'goal_reinforce',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-20T10:00:00Z',
          checkIn: {
            needs_example: true,
            focus: 'edge_cases'
          }
        }
      },
      exerciseAttempts: {}
    }
  };

  const candidates = deriveCandidateActivities(goal, catalog, null);
  assert.ok(candidates.length > 0, 'Must produce candidate activities');

  // Should have a revisit candidate addressing the reinforcement need
  const revisit = candidates.find((c) => c.type === 'revisit');
  assert.ok(revisit, 'Must include a revisit activity for unresolved reinforcement');
  assert.equal(revisit.topicId, 'topic_arrays');
});

test('TE06: All curriculum lessons completed offers revision without fabricating lessons 49+', async () => {
  const catalog = (await apiFixture.getCatalog()).data;
  const lessons = catalog.curriculum.lessons;

  // Mark all 48 lessons as completed
  const lessonProgress = {};
  for (const l of lessons) {
    lessonProgress[l.id] = { status: 'completed', completedAt: '2026-10-20T10:00:00Z' };
  }

  const goal = {
    id: 'goal_all_done',
    studyWorkspace: { lessonProgress }
  };

  const candidates = deriveCandidateActivities(goal, catalog, null);
  assert.ok(candidates.length > 0, 'Must offer revision candidates');
  assert.ok(
    candidates.every((c) => lessons.some((l) => l.id === c.id)),
    'All candidates must correspond to real published lessons, zero fabricated IDs'
  );
  assert.ok(
    candidates.every((c) => c.type === 'revisit'),
    'All candidates in end-of-library state must be intentional revisits'
  );
});
