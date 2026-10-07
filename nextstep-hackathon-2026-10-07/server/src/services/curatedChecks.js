/**
 * Curated understanding check questions and server-authoritative reference rubrics
 * for representative missions in the DSA foundations starter track.
 *
 * Conforms to contracts/API-V1.md and prompts/ANTIGRAVITY-DSA-LEARNING-LOOP.md.
 */

export const CURATED_CHECKS = {
  m02: {
    questionId: 'q_m02_trace_search',
    questionText: 'Trace a linear search for target 8 in [4, 1, 8, 3]. How many comparisons are made, and what is the worst-case number of comparisons if the target is absent?',
    rubric: {
      expectedConcepts: [
        'Searching for 8 checks index 0 (4), index 1 (1), index 2 (8), which is 3 comparisons to find 8.',
        'If the target is absent, every element must be inspected, making 4 comparisons (all elements / N comparisons in general).'
      ],
      onTrackCriteria: 'Identifies 3 comparisons to find 8 and 4 comparisons (or full array length N) when the target is absent.',
      needsAnotherTryCriteria: 'Incorrect comparison count, confusing 0-indexed positions with comparison counts, or omitting the absent case.'
    }
  },
  m04: {
    questionId: 'q_m04_duplicate_set',
    questionText: 'Trace a set-based duplicate check on [2, 5, 2]. At which index is the duplicate detected, and what numbers are in the set immediately before it is detected?',
    rubric: {
      expectedConcepts: [
        'Index 0 (2) is added to set -> set contains {2}.',
        'Index 1 (5) is added to set -> set contains {2, 5}.',
        'Index 2 (2) is inspected: 2 is already in the set, so duplicate is detected at index 2 (or 3rd element).',
        'Immediately before detection at index 2, the set contains {2, 5}.'
      ],
      onTrackCriteria: 'Correctly identifies index 2 (or 3rd element / second 2) as detection point and states the set contains {2, 5} immediately prior.',
      needsAnotherTryCriteria: 'Claims duplicate is detected at index 0 or 1, fails to state set contents prior to detection, or states wrong numbers in set.'
    }
  },
  m06: {
    questionId: 'q_m06_hash_map_twosum',
    questionText: 'For Two Sum with target 9 and array [2, 7, 11, 15], when inspecting 7, what key does the hash map look up, and why is 7 not added before the check?',
    rubric: {
      expectedConcepts: [
        'Complement calculation: target - current = 9 - 7 = 2, so the hash map looks up key 2.',
        '7 is not added before lookup because checking before inserting prevents an element from pairing with itself (avoiding self-matching / double counting).'
      ],
      onTrackCriteria: 'Explains lookup for complement 2 (or 9 - 7) and states checking before inserting prevents using the same element twice.',
      needsAnotherTryCriteria: 'Fails to identify complement 2 or omits the rationale for insertion ordering.'
    }
  }
};

/**
 * Returns the curated check specification for a mission, or null if mission is not curated.
 * @param {string} missionId
 * @returns {{ questionId: string, questionText: string, rubric: object } | null}
 */
export function getCuratedCheckForMission(missionId) {
  return CURATED_CHECKS[missionId] || null;
}

/**
 * Returns list of mission IDs that have curated understanding checks.
 * @returns {Array<string>}
 */
export function getAllCuratedMissionIds() {
  return Object.keys(CURATED_CHECKS);
}
