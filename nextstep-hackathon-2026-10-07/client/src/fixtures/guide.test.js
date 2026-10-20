import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUIDE_CHAPTERS,
  loadGuidePreferences,
  saveGuidePreferences,
  normalizeGuidePreferences,
  _resetInMemoryGuidePrefsForTest
} from '../services/guideService.js';

test('G01: Guide chapters contain at most 5 steps for Start learning and valid anchors', () => {
  const startLearning = GUIDE_CHAPTERS.find((c) => c.id === 'start_learning');
  assert.ok(startLearning, 'start_learning chapter must exist');
  assert.ok(startLearning.steps.length <= 5, 'Start learning must contain at most 5 steps');
  assert.equal(startLearning.steps.length, 5);

  for (const ch of GUIDE_CHAPTERS) {
    for (const step of ch.steps) {
      assert.ok(step.targetSelector, `Step ${step.title} must have a targetSelector`);
      assert.ok(step.title, 'Step must have a title');
      assert.ok(step.content, 'Step must have content');
    }
  }
});

test('G02: Guide preferences load and save safely without throwing when storage is empty or mocked', () => {
  const user = { id: 'usr_test_1', email: 'test@nextstep.local' };
  const mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k)
  };

  const prefs = loadGuidePreferences(user);
  assert.equal(prefs.version, 1);
  assert.equal(prefs.dismissedInvitation, false);

  saveGuidePreferences(user, { dismissedInvitation: true, completedChapters: ['start_learning'] });
  const updated = loadGuidePreferences(user);
  assert.equal(updated.dismissedInvitation, true);
  assert.deepEqual(updated.completedChapters, ['start_learning']);
});

test('G03: Guide state never stores student answers, code drafts or submissions', () => {
  const user = { id: 'usr_test_2' };
  saveGuidePreferences(user, {
    dismissedInvitation: true,
    completedChapters: ['start_learning', 'plan_week']
  });
  const saved = loadGuidePreferences(user);
  // Verify strictly isolated from learning state
  assert.equal(saved.answers, undefined);
  assert.equal(saved.drafts, undefined);
  assert.equal(saved.completions, undefined);
  assert.equal(saved.schedule, undefined);
});

test('G04: Storage-denied in-memory fallback preserves preferences across calls per user', () => {
  _resetInMemoryGuidePrefsForTest();
  // Simulate restricted storage throwing SecurityError
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('SecurityError: The operation is insecure.');
    },
    setItem: () => {
      throw new Error('SecurityError: The operation is insecure.');
    },
    removeItem: () => {}
  };

  const userA = { id: 'usr_alice' };
  const userB = { id: 'usr_bob' };

  // Initial load returns safe defaults
  const initA = loadGuidePreferences(userA);
  assert.equal(initA.dismissedInvitation, false);
  assert.deepEqual(initA.completedChapters, []);

  // Save for Alice
  saveGuidePreferences(userA, { dismissedInvitation: true, completedChapters: ['start_learning'] });

  // Alice's prefs are retained in memory
  const alicePrefs = loadGuidePreferences(userA);
  assert.equal(alicePrefs.dismissedInvitation, true);
  assert.deepEqual(alicePrefs.completedChapters, ['start_learning']);

  // Bob's prefs are isolated and untouched
  const bobPrefs = loadGuidePreferences(userB);
  assert.equal(bobPrefs.dismissedInvitation, false);
  assert.deepEqual(bobPrefs.completedChapters, []);
});

test('G05: Malformed JSON or corrupt local storage values normalize gracefully', () => {
  _resetInMemoryGuidePrefsForTest();
  const user = { id: 'usr_corrupt' };
  const mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k)
  };

  // 1. Broken JSON
  mockStorage.set('nextstep_guide_pref_v1_usr_corrupt', '{not-valid-json');
  const fromBroken = loadGuidePreferences(user);
  assert.equal(fromBroken.version, 1);
  assert.equal(fromBroken.dismissedInvitation, false);
  assert.deepEqual(fromBroken.completedChapters, []);

  // 2. Corrupt data types (non-object, null, invalid types)
  mockStorage.set('nextstep_guide_pref_v1_usr_corrupt', JSON.stringify({
    version: 'invalid',
    dismissedInvitation: 'yes',
    completedChapters: [123, null, 'start_learning', {}]
  }));
  const fromCorrupt = loadGuidePreferences(user);
  assert.equal(fromCorrupt.version, 1);
  assert.equal(fromCorrupt.dismissedInvitation, true);
  // Non-string entries filtered out safely
  assert.deepEqual(fromCorrupt.completedChapters, ['start_learning']);

  // Direct normalizer test
  assert.deepEqual(normalizeGuidePreferences(null), { version: 1, dismissedInvitation: false, completedChapters: [] });
  assert.deepEqual(normalizeGuidePreferences('string'), { version: 1, dismissedInvitation: false, completedChapters: [] });
});
