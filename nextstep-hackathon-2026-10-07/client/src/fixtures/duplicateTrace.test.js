import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTraceState,
  evaluatePrediction,
  resetTrace,
  PRIMARY_ARRAY,
  ALTERNATE_ARRAY
} from '../services/duplicateTraceEngine.js';

test('T01: Initial state starts at index 0 with empty set and predicting status', () => {
  const state = createInitialTraceState();
  assert.equal(state.currentIndex, 0);
  assert.deepEqual(state.seenSet, []);
  assert.equal(state.status, 'predicting');
  assert.equal(state.duplicateFound, false);
  assert.deepEqual(state.array, [2, 5, 2]);
});

test('T02: Correct absent prediction inserts value and advances index (set-before-insert logic)', () => {
  const initial = createInitialTraceState();
  // At index 0, value is 2. Set is empty [].
  // Student predicts false (not seen yet)
  const result = evaluatePrediction(initial, false);

  assert.equal(result.error, null);
  assert.equal(result.state.currentIndex, 1);
  assert.deepEqual(result.state.seenSet, [2]);
  assert.equal(result.state.status, 'predicting');
  assert.equal(result.state.lastFeedback?.type, 'correct');
  assert.match(result.state.lastFeedback?.explanation, /Inserted 2 into the set/);
});

test('T03: Wrong prediction provides corrective explanation without advancing state', () => {
  const initial = createInitialTraceState();
  // At index 0, value is 2. Set is empty.
  // Student predicts true (already seen), which is WRONG
  const result = evaluatePrediction(initial, true);

  assert.equal(result.error, null);
  // Index must NOT advance
  assert.equal(result.state.currentIndex, 0);
  // Set must remain empty
  assert.deepEqual(result.state.seenSet, []);
  assert.equal(result.state.status, 'predicting');
  assert.equal(result.state.lastFeedback?.type, 'incorrect');
  assert.match(result.state.lastFeedback?.explanation, /empty set/);
});

test('T04: Step-by-step trace detects duplicate at index 2 for [2, 5, 2]', () => {
  let state = createInitialTraceState(PRIMARY_ARRAY);

  // Step 1: index 0 (val 2) -> predicts not seen (false)
  let res = evaluatePrediction(state, false);
  assert.equal(res.state.currentIndex, 1);
  assert.deepEqual(res.state.seenSet, [2]);
  state = res.state;

  // Step 2: index 1 (val 5) -> predicts not seen (false)
  res = evaluatePrediction(state, false);
  assert.equal(res.state.currentIndex, 2);
  assert.deepEqual(res.state.seenSet, [2, 5]);
  state = res.state;

  // Step 3: index 2 (val 2) -> predicts already seen (true) -> DUPLICATE!
  res = evaluatePrediction(state, true);
  assert.equal(res.state.status, 'completed');
  assert.equal(res.state.duplicateFound, true);
  assert.equal(res.state.duplicateIndex, 2);
  assert.equal(res.state.duplicateValue, 2);
  // Set immediately before detection must hold [2, 5]
  assert.deepEqual(res.state.seenSet, [2, 5]);
  assert.equal(res.state.lastFeedback?.type, 'correct');
  assert.match(res.state.lastFeedback?.message, /Duplicate detected at index 2/);
});

test('T05: Alternate array [4, 1, 4] detects duplicate at index 2 with {4, 1} in set', () => {
  let state = resetTrace(ALTERNATE_ARRAY);
  assert.deepEqual(state.array, [4, 1, 4]);

  // Step 1: index 0 (4) -> false
  state = evaluatePrediction(state, false).state;
  assert.deepEqual(state.seenSet, [4]);

  // Step 2: index 1 (1) -> false
  state = evaluatePrediction(state, false).state;
  assert.deepEqual(state.seenSet, [4, 1]);

  // Step 3: index 2 (4) -> true
  const finalRes = evaluatePrediction(state, true);
  assert.equal(finalRes.state.status, 'completed');
  assert.equal(finalRes.state.duplicateFound, true);
  assert.equal(finalRes.state.duplicateIndex, 2);
  assert.equal(finalRes.state.duplicateValue, 4);
});

test('T06: Invalid action after completion returns EXERCISE_COMPLETED error without corrupting state', () => {
  let state = createInitialTraceState();
  state = evaluatePrediction(state, false).state; // index 1, [2]
  state = evaluatePrediction(state, false).state; // index 2, [2, 5]
  state = evaluatePrediction(state, true).state;  // completed, duplicate at 2

  assert.equal(state.status, 'completed');

  // Attempt another prediction on completed exercise
  const invalidRes = evaluatePrediction(state, true);
  assert.equal(invalidRes.error, 'EXERCISE_COMPLETED');
  assert.equal(invalidRes.state.duplicateIndex, 2);
});

test('T07: Reset trace returns to initial clean state with primary array', () => {
  let state = createInitialTraceState();
  state = evaluatePrediction(state, false).state;
  assert.equal(state.currentIndex, 1);

  const resetState = resetTrace();
  assert.equal(resetState.currentIndex, 0);
  assert.deepEqual(resetState.seenSet, []);
  assert.equal(resetState.status, 'predicting');
  assert.deepEqual(resetState.array, [2, 5, 2]);
});
