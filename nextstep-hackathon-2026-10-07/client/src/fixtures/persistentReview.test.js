import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveReviewItems,
  deriveNotesLibrary,
  filterNotesLibrary,
  buildGoalExportData
} from '../services/workspace.js';
import { apiFixture } from './apiFixture.js';

const mockCatalog = {
  trackId: 'dsa-starter-v1',
  title: 'DSA Foundations Starter',
  missions: [
    { id: 'm01', title: 'Find Duplicate in Array', minutes: 30, doneWhen: 'Identify duplicate using frequency map' },
    { id: 'm02', title: 'Two Sum Target', minutes: 30, doneWhen: 'Find pair summing to target' },
    { id: 'm03', title: 'Valid Palindrome', minutes: 30, doneWhen: 'Check alphanumeric palindrome' },
    { id: 'm04', title: 'Reverse Linked List', minutes: 45, doneWhen: 'Reverse single list pointers' }
  ]
};

test('PR01: Due recall review is scheduled into review queue when nextReviewDate <= today', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'independent' }
    },
    learning: {
      m01: {
        recallHistory: [
          {
            attemptId: 'att-1',
            attemptText: 'Retrieved two pointers approach',
            confidence: 4,
            savedAt: '2026-10-09T10:00:00.000Z',
            nextReviewDate: '2026-10-16' // due today
          }
        ]
      }
    }
  };

  const now = new Date('2026-10-16T12:00:00.000Z');
  const review = deriveReviewItems(goal, mockCatalog, now);

  assert.equal(review.items.length, 1);
  const item = review.items[0];
  assert.equal(item.missionId, 'm01');
  assert.equal(item.type, 'recall_due');
  assert.equal(item.isRecallDue, true);
  assert.equal(item.nextReviewDate, '2026-10-16');
  assert.match(item.reason, /scheduled for 2026-10-16 is due/);
});

test('PR02: Future recall date suppresses old hint/age suggestions', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: {
        completedAt: '2026-10-10T10:00:00.000Z',
        outcome: 'with_hint' // Normally would trigger hint_review or 3+ day recall
      }
    },
    learning: {
      m01: {
        selfReportedStatus: 'ready_to_continue',
        recallHistory: [
          {
            attemptId: 'att-future',
            attemptText: 'Solid grasp now',
            confidence: 5,
            savedAt: '2026-10-14T10:00:00.000Z',
            nextReviewDate: '2026-10-28' // future due date
          }
        ]
      }
    }
  };

  const now = new Date('2026-10-16T12:00:00.000Z');
  const review = deriveReviewItems(goal, mockCatalog, now);

  assert.equal(review.items.length, 0, 'Future recall date must suppress old hint and age suggestion');
});

test('PR03: Future recall date NEVER hides an unresolved blocker', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'independent' }
    },
    learning: {
      m01: {
        category: 'too_difficult',
        whereStuck: 'Still confused about edge case with duplicates',
        whatTried: 'Set vs Map',
        selfReportedStatus: 'still_unsure', // Unresolved blocker!
        recallHistory: [
          {
            attemptId: 'att-future',
            attemptText: 'Attempt text',
            confidence: 4,
            savedAt: '2026-10-15T10:00:00.000Z',
            nextReviewDate: '2026-10-22' // future
          }
        ]
      }
    }
  };

  const now = new Date('2026-10-16T12:00:00.000Z');
  const review = deriveReviewItems(goal, mockCatalog, now);

  assert.equal(review.items.length, 1, 'Unresolved blocker must remain in queue even with future review date');
  assert.equal(review.items[0].missionId, 'm01');
  assert.equal(review.items[0].type, 'blocker');
  assert.equal(review.unresolvedCount, 1);
});

test('PR04: Legacy goals without recallHistory preserve backwards compatibility', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'with_hint' }
    },
    learning: {
      m02: {
        category: 'too_difficult',
        whereStuck: 'Loop boundaries',
        selfReportedStatus: 'still_unsure'
      }
    }
  };

  const now = new Date('2026-10-16T12:00:00.000Z');
  const review = deriveReviewItems(goal, mockCatalog, now);

  // m02 has unresolved blocker, m01 has with_hint completion >= 3 days
  assert.equal(review.unresolvedCount, 1);
  assert.equal(review.items.length, 2);
  const notes = deriveNotesLibrary(goal, mockCatalog);
  assert.ok(Array.isArray(notes));
  assert.equal(notes[0].recallHistory.length, 0);
});

test('PR05: Notes library exposes recall attempts to search', () => {
  const goal = {
    nextMissionId: 'm02',
    completions: {
      m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'independent' }
    },
    learning: {
      m01: {
        recallHistory: [
          {
            attemptId: 'att-search',
            attemptText: 'Floyd cycle finding algorithm memory retrieval',
            confidence: 5,
            savedAt: '2026-10-15T10:00:00.000Z',
            nextReviewDate: '2026-10-29'
          }
        ]
      }
    }
  };

  const notes = deriveNotesLibrary(goal, mockCatalog);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].recallHistory.length, 1);
  assert.equal(notes[0].nextReviewDate, '2026-10-29');

  // Search by recall content keyword
  const searchResults = filterNotesLibrary(notes, 'Floyd cycle');
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].missionId, 'm01');

  // Search by unrelated keyword
  const emptyResults = filterNotesLibrary(notes, 'nonexistent keyword');
  assert.equal(emptyResults.length, 0);
});

test('PR06: Goal export includes bounded review history without credentials', () => {
  const goal = {
    id: 'goal-pr-test',
    trackId: 'dsa-starter-v1',
    status: 'on_track',
    version: 3,
    completions: { m01: { completedAt: '2026-10-10T10:00:00.000Z', outcome: 'independent' } },
    learning: {
      m01: {
        recallHistory: [
          {
            attemptId: 'att-export',
            attemptText: 'Exported recall note',
            confidence: 4,
            savedAt: '2026-10-15T10:00:00.000Z',
            nextReviewDate: '2026-10-22'
          }
        ]
      }
    }
  };

  const exportData = buildGoalExportData(goal, mockCatalog, new Date('2026-10-16T10:00:00.000Z'));
  assert.ok(exportData);
  assert.equal(exportData.goal.learning.m01.recallHistory.length, 1);
  assert.equal(exportData.goal.learning.m01.recallHistory[0].attemptText, 'Exported recall note');
  assert.equal(exportData.goal.learning.m01.recallHistory[0].nextReviewDate, '2026-10-22');

  // Verify auth/session cleanliness
  assert.equal(exportData.token, undefined);
  assert.equal(exportData.session, undefined);
  assert.equal(exportData.password, undefined);
  assert.equal(exportData.auth, undefined);
});

test('PR07: Synthetic apiFixture saveRecallAttempt matches live duplicate-safe contract', async () => {
  await apiFixture.signIn('student.active@nextstep.local');
  const initRes = await apiFixture.getGoal();
  const initialGoal = initRes.data.goal;
  const initialVersion = initialGoal.version;

  const attemptId = 'fix-att-001';
  const res1 = await apiFixture.saveRecallAttempt({
    expectedVersion: initialVersion,
    missionId: 'm01',
    attemptId,
    attemptText: 'Synthetic recall attempt text',
    confidence: 3
  });

  assert.ok(res1.data);
  assert.equal(res1.data.goal.version, initialVersion + 1);
  assert.equal(res1.data.recallAttempt.attemptId, attemptId);
  assert.equal(res1.data.recallAttempt.confidence, 3);
  assert.ok(res1.data.recallAttempt.nextReviewDate);

  // Duplicate retry with same attemptId and same payload: must return 200 without version change
  const resDuplicate = await apiFixture.saveRecallAttempt({
    expectedVersion: initialVersion, // Stale version allowed for identical duplicate
    missionId: 'm01',
    attemptId,
    attemptText: 'Synthetic recall attempt text',
    confidence: 3
  });

  assert.ok(resDuplicate.data);
  assert.equal(resDuplicate.data.goal.version, initialVersion + 1, 'Version must not increment on duplicate retry');
  assert.equal(resDuplicate.data.goal.learning.m01.recallHistory.length, 1);

  // Reusing same attemptId with different text must throw 409 ATTEMPT_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.saveRecallAttempt({
        expectedVersion: initialVersion + 1,
        missionId: 'm01',
        attemptId,
        attemptText: 'Different text should trigger conflict',
        confidence: 3
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'ATTEMPT_CONFLICT');
      return true;
    }
  );

  // Wrong version for new attemptId must throw 409 VERSION_CONFLICT
  await assert.rejects(
    async () => {
      await apiFixture.saveRecallAttempt({
        expectedVersion: 99,
        missionId: 'm01',
        attemptId: 'fix-att-002',
        attemptText: 'New text with stale version',
        confidence: 4
      });
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'VERSION_CONFLICT');
      return true;
    }
  );
});
