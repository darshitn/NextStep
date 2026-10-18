/**
 * Foundations Checkpoint Definitions and Authoritative Grading Engine
 * Server-owned outside server/data/curriculum/** to preserve collaborator boundary.
 */

export const FOUNDATIONS_CHECKPOINTS = {
  chk_foundations_v1: {
    id: 'chk_foundations_v1',
    version: 1,
    title: 'DSA Foundations Checkpoint',
    description: 'A 3-topic check covering arrays and prefix scans, hash sets and complement lookups, and binary search boundaries.',
    estimatedMinutes: 10,
    topics: [
      {
        id: 'topic_arrays',
        title: 'Arrays & Invariant Scanning',
        questionCount: 1,
        recommendedAction: {
          topicId: 'topic_arrays',
          lessonId: 'les_arrays_01',
          exerciseId: 'ex_arrays_01',
          title: 'Review Single-Pass Array Invariants in Proof Studio'
        }
      },
      {
        id: 'topic_hashing',
        title: 'Hash Sets & Complement Lookup',
        questionCount: 1,
        recommendedAction: {
          topicId: 'topic_hashing',
          lessonId: 'les_hashing_01',
          exerciseId: 'ex_hashing_01',
          title: 'Review Hash Map Complement Ordering in Proof Studio'
        }
      },
      {
        id: 'topic_binary_search',
        title: 'Binary Search Boundaries',
        questionCount: 1,
        recommendedAction: {
          topicId: 'topic_binary_search',
          lessonId: 'les_binary_search_01',
          exerciseId: 'ex_binary_search_01',
          title: 'Review Inclusive Binary Search Boundaries in Proof Studio'
        }
      }
    ],
    questions: [
      {
        id: 'chk_q_arrays_01',
        topicId: 'topic_arrays',
        lessonId: 'les_arrays_01',
        exerciseId: 'ex_arrays_01',
        prompt: 'When scanning an array to find maximum single-transaction profit (e.g. Best Time to Buy and Sell Stock), why must the candidate gain (prices[i] - minPrice) be evaluated before updating minPrice with prices[i]?',
        codeSnippet: `for (let i = 0; i < prices.length; i++) {
  const currentPrice = prices[i];
  const candidateGain = currentPrice - minPrice;
  bestGain = Math.max(bestGain, candidateGain);
  minPrice = Math.min(minPrice, currentPrice);
}`,
        options: [
          {
            id: 'opt_arr_1',
            label: 'To prevent index i from pairing with itself, which would falsely report a 0-profit transaction when prices strictly decrease.'
          },
          {
            id: 'opt_arr_2',
            label: 'Because JavaScript arrays require 1-based indexing for running extrema.'
          },
          {
            id: 'opt_arr_3',
            label: 'Because updating minPrice first triggers an out-of-bounds array access.'
          },
          {
            id: 'opt_arr_4',
            label: 'Because candidate gains can only be calculated on even index intervals.'
          }
        ],
        correctOptionId: 'opt_arr_1',
        explanation: 'Evaluating candidate gain before updating minPrice ensures the invariant that the buy day strictly precedes the sell day. If minPrice is updated first, a strictly decreasing array like [5, 4, 3] would compute 5-5=0, falsely yielding 0 profit instead of recognizing prices only fell.',
        hint: 'Consider a strictly descending array like [5, 4, 3, 2, 1] where no profitable trade exists.'
      },
      {
        id: 'chk_q_hashing_01',
        topicId: 'topic_hashing',
        lessonId: 'les_hashing_01',
        exerciseId: 'ex_hashing_01',
        prompt: 'In the One-Pass Two Sum algorithm using a hash map, why do we check map.has(target - nums[i]) before inserting nums[i] into the map?',
        codeSnippet: `for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (map.has(need)) {
    return [map.get(need), i];
  }
  map.set(nums[i], i);
}`,
        options: [
          {
            id: 'opt_hash_1',
            label: 'To prevent an element at index i from matching with itself when target - nums[i] equals nums[i].'
          },
          {
            id: 'opt_hash_2',
            label: 'Because hash maps do not allow overwriting duplicate keys under any circumstances.'
          },
          {
            id: 'opt_hash_3',
            label: 'Because checking membership after insertion causes an unhandled runtime error.'
          },
          {
            id: 'opt_hash_4',
            label: 'To sort the values in ascending key order before lookups.'
          }
        ],
        correctOptionId: 'opt_hash_1',
        explanation: 'Checking complement membership before inserting the current element guarantees that an element cannot be paired with itself. For instance, if target = 6 and nums[0] = 3, inserting 3 first would cause map.has(6 - 3) to match index 0 with itself.',
        hint: 'What happens when target = 6 and nums[0] = 3?'
      },
      {
        id: 'chk_q_bs_01',
        topicId: 'topic_binary_search',
        lessonId: 'les_binary_search_01',
        exerciseId: 'ex_binary_search_01',
        prompt: 'When performing binary search on a sorted array with an inclusive search window [low, high] where while (low <= high) and mid = Math.floor((low + high) / 2), how must the pointers be adjusted when target does not equal nums[mid]?',
        codeSnippet: `while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  if (nums[mid] === target) return mid;
  if (target < nums[mid]) {
    // branch 1
  } else {
    // branch 2
  }
}`,
        options: [
          {
            id: 'opt_bs_1',
            label: 'If target < nums[mid], high = mid - 1; if target > nums[mid], low = mid + 1.'
          },
          {
            id: 'opt_bs_2',
            label: 'If target < nums[mid], high = mid; if target > nums[mid], low = mid.'
          },
          {
            id: 'opt_bs_3',
            label: 'If target < nums[mid], high = mid + 1; if target > nums[mid], low = mid - 1.'
          },
          {
            id: 'opt_bs_4',
            label: 'Both low and high are reset to mid.'
          }
        ],
        correctOptionId: 'opt_bs_1',
        explanation: 'Because nums[mid] was already checked and does not equal target, it is excluded from the remaining search range. With an inclusive boundary [low, high], the search space narrows to [low, mid - 1] on the left or [mid + 1, high] on the right. Setting high = mid without decrementing can cause infinite loops when low + 1 === high.',
        hint: 'Since nums[mid] was already evaluated, does it still belong in the active search window?'
      }
    ]
  }
};

/**
 * Returns a student-safe projection of the checkpoint.
 * Strips correctOptionId, explanation, and answer keys.
 */
export function getStudentSafeCheckpoint(checkpointId) {
  const cp = FOUNDATIONS_CHECKPOINTS[checkpointId];
  if (!cp) return null;

  return {
    id: cp.id,
    version: cp.version,
    title: cp.title,
    description: cp.description,
    estimatedMinutes: cp.estimatedMinutes,
    topics: cp.topics.map((t) => ({
      id: t.id,
      title: t.title,
      questionCount: t.questionCount
    })),
    questions: cp.questions.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      lessonId: q.lessonId,
      exerciseId: q.exerciseId,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.label
      })),
      hint: q.hint
    }))
  };
}

/**
 * Authoritatively grades a checkpoint attempt on the server.
 */
export function gradeCheckpointAttempt({
  checkpointId,
  attemptId,
  answers = {},
  selfReportedAssistance = {},
  reflection = ''
}) {
  const cp = FOUNDATIONS_CHECKPOINTS[checkpointId];
  if (!cp) {
    const err = new Error(`Checkpoint "${checkpointId}" not found.`);
    err.status = 404;
    err.code = 'CHECKPOINT_NOT_FOUND';
    throw err;
  }

  let correctCount = 0;
  const topicResults = {};
  let anyIncorrect = false;
  let anyHintUsed = false;
  let answeredCount = 0;

  for (const q of cp.questions) {
    const selectedOptionId = answers[q.id];
    const isAnswered = typeof selectedOptionId === 'string' && selectedOptionId.length > 0;
    if (isAnswered) answeredCount++;

    const isCorrect = isAnswered && selectedOptionId === q.correctOptionId;
    if (isCorrect) {
      correctCount++;
    } else if (isAnswered) {
      anyIncorrect = true;
    }

    const assistance = selfReportedAssistance[q.id] || {};
    const usedHint = Boolean(assistance.usedHint);
    if (usedHint) anyHintUsed = true;

    const topicDef = cp.topics.find((t) => t.id === q.topicId);
    const revisitRecommended = !isCorrect || usedHint;

    topicResults[q.topicId] = {
      topicId: q.topicId,
      questionId: q.id,
      correct: isCorrect,
      selected: selectedOptionId || null,
      usedHint,
      revisitRecommended,
      feedback: isCorrect
        ? (usedHint
            ? `Correct with hint assistance. ${q.explanation}`
            : `Independent correct answer. ${q.explanation}`)
        : (isAnswered
            ? `Needs revisit. ${q.explanation}`
            : 'Unanswered in this attempt.'),
      recommendedAction: revisitRecommended && topicDef?.recommendedAction
        ? topicDef.recommendedAction
        : null
    };
  }

  // Derive literal evidence category
  let category;
  if (answeredCount < 2) {
    category = 'insufficient_evidence';
  } else if (correctCount === cp.questions.length && !anyHintUsed) {
    category = 'ready_to_continue';
  } else {
    category = 'revisit_recommended';
  }

  const cleanReflection = typeof reflection === 'string'
    ? reflection.trim().slice(0, 500)
    : '';

  return {
    attemptId,
    checkpointId,
    submittedAt: new Date().toISOString(),
    score: {
      correct: correctCount,
      total: cp.questions.length
    },
    category,
    topicResults,
    reflection: cleanReflection,
    selfReportedAssistance
  };
}
