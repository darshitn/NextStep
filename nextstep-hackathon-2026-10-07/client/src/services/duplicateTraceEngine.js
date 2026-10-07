/**
 * Pure Transition Engine for Mission M04 Duplicate Check Trace
 * Deterministic, zero external dependencies, easily testable in Node.
 */

export const PRIMARY_ARRAY = Object.freeze([2, 5, 2]);
export const ALTERNATE_ARRAY = Object.freeze([4, 1, 4]);

/**
 * Creates the initial state for an interactive duplicate trace.
 * @param {readonly number[]} array
 */
export function createInitialTraceState(array = PRIMARY_ARRAY) {
  return {
    array: [...array],
    currentIndex: 0,
    seenSet: [], // ordered list of elements currently in the set
    status: 'predicting', // 'predicting' | 'completed'
    duplicateFound: false,
    duplicateIndex: null,
    duplicateValue: null,
    lastFeedback: null // { type: 'correct' | 'incorrect', message: string, explanation: string }
  };
}

/**
 * Evaluates a student's prediction for the current element before it is inserted.
 * @param {ReturnType<typeof createInitialTraceState>} state
 * @param {boolean} studentPredictsSeen - true: student says already seen; false: not seen yet
 * @returns {{ state: ReturnType<typeof createInitialTraceState>, error: string | null }}
 */
export function evaluatePrediction(state, studentPredictsSeen) {
  if (state.status === 'completed') {
    return {
      state,
      error: 'EXERCISE_COMPLETED'
    };
  }

  const currentValue = state.array[state.currentIndex];
  const isActuallySeen = state.seenSet.includes(currentValue);

  if (studentPredictsSeen === isActuallySeen) {
    // Prediction is CORRECT
    if (isActuallySeen) {
      // Duplicate found! Stop the trace
      return {
        state: {
          ...state,
          status: 'completed',
          duplicateFound: true,
          duplicateIndex: state.currentIndex,
          duplicateValue: currentValue,
          lastFeedback: {
            type: 'correct',
            message: `Correct! Value ${currentValue} is already in the set {${state.seenSet.join(', ')}}. Duplicate detected at index ${state.currentIndex}.`,
            explanation: `At index ${state.currentIndex}, nums[${state.currentIndex}] is ${currentValue}. Since ${currentValue} is already present in the set, the duplicate is detected here before modifying the set.`
          }
        },
        error: null
      };
    } else {
      // Not in set yet. Visibly insert and advance index
      const updatedSeenSet = [...state.seenSet, currentValue];
      const nextIndex = state.currentIndex + 1;
      const isEnd = nextIndex >= state.array.length;

      return {
        state: {
          ...state,
          currentIndex: nextIndex,
          seenSet: updatedSeenSet,
          status: isEnd ? 'completed' : 'predicting',
          duplicateFound: false,
          lastFeedback: {
            type: 'correct',
            message: `Correct! ${currentValue} has not been seen yet.`,
            explanation: `Inserted ${currentValue} into the set. Set now holds: {${updatedSeenSet.join(', ')}}. Advancing to index ${nextIndex}.`
          }
        },
        error: null
      };
    }
  } else {
    // Prediction is INCORRECT. Explain without modifying the transition state so the student can retry.
    const setDisplay = state.seenSet.length > 0 ? `{${state.seenSet.join(', ')}}` : 'empty set Ø';
    const explanation = isActuallySeen
      ? `Check the set: it currently holds ${setDisplay}, which already contains ${currentValue}. So ${currentValue} has already been seen.`
      : `Check the set: it currently holds ${setDisplay}, which does not contain ${currentValue}. It must be inserted before moving forward.`;

    return {
      state: {
        ...state,
        lastFeedback: {
          type: 'incorrect',
          message: `Not quite. Examine what the set currently holds.`,
          explanation
        }
      },
      error: null
    };
  }
}

/**
 * Resets the trace with either the primary or alternate array.
 * @param {readonly number[]} array
 */
export function resetTrace(array = PRIMARY_ARRAY) {
  return createInitialTraceState(array);
}
