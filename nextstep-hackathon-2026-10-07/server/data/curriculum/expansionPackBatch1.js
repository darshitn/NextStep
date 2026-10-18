const STANDARD_REVIEW_RECORD = {
  pipelineStagesCompleted: ['draft', 'source_check', 'technical_validation', 'editorial_review', 'published'],
  reviewerType: 'same_agent_automated_and_editorial_review',
  independentlyReviewed: false,
  verifiedAt: '2026-10-17',
  reviewNotes: 'Automated schema, deterministic state-trace, reference integrity, and editorial quality checks passed.'
};

export const EXPANSION_BATCH_1_PACK_METADATA = {
  id: 'pack_expansion_batch1_v1',
  version: '1.1.0',
  title: 'NextStep Expansion Pack 1: Two Pointers, Sliding Window & Linked Lists',
  releaseStage: 'expansion',
  publishedAt: '2026-10-17',
  topicIds: ['topic_two_pointers', 'topic_sliding_window', 'topic_linked_lists'],
  reviewStatus: 'published'
};

export const EXPANSION_BATCH_1_TOPICS = [
  {
    id: 'topic_two_pointers',
    slug: 'two-pointers',
    title: 'Two Pointers & Partition Invariants',
    shortDescription: 'Eliminate O(n^2) pair scans by coordinating converging,同-direction, or multi-way partition pointers with monotonic elimination proofs.',
    whyItMatters: 'Two pointers turn nested brute-force searches into linear O(n) passes with O(1) auxiliary memory whenever sorted order or bottleneck bounds rule out entire rows/columns of pairs.',
    order: 4,
    lane: 2,
    estimatedMinutes: 90,
    prerequisites: ['topic_arrays'],
    starterMissionIds: ['m03'],
    keyPatterns: ['Converging Sorted Pair Search', 'Duplicate-Safe K-Sum Reduction', 'Bottleneck Boundary Elimination', 'Dutch National Flag 3-Way Partition'],
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_sliding_window',
    slug: 'sliding-window',
    title: 'Sliding Window & Subarray Monotonicity',
    shortDescription: 'Maintain dynamic contiguous subarrays `[left..right]` using incremental window state, frequency counters, and monotonic expand/shrink invariants.',
    whyItMatters: 'Every element enters via `right` at most once and exits via `left` at most once, proving O(n) amortized time for substring and subarray optimization.',
    order: 5,
    lane: 2,
    estimatedMinutes: 95,
    prerequisites: ['topic_arrays', 'topic_hashing'],
    starterMissionIds: ['m04'],
    keyPatterns: ['Fixed-Length Rolling Delta', 'Variable Expand-Then-Shrink Loop', 'Frequency Map + Satisfied Counter', 'AtMost(K) - AtMost(K-1) Exact Count'],
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_linked_lists',
    slug: 'linked-lists',
    title: 'Linked Lists & Pointer Rewiring',
    shortDescription: 'Manipulate node references safely without losing suffix chains using sentinel dummy heads, three-pointer reversal, and Floyd fast/slow runners.',
    whyItMatters: 'Pointer bugs happen when you overwrite `.next` before saving the suffix; explicit link-state diagrams make node surgery predictable and crash-free.',
    order: 6,
    lane: 3,
    estimatedMinutes: 90,
    prerequisites: ['topic_two_pointers'],
    starterMissionIds: ['m06'],
    keyPatterns: ['Sentinel Dummy Head Normalization', 'Iterative 3-Pointer Reversal', 'Floyd Tortoise & Hare Runner', 'Doubly-Linked Splice & Eviction'],
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_1_PREREQUISITE_EDGES = [
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_two_pointers',
    rationale: 'Converging and partitioning pointers build directly on index arithmetic and prefix/suffix loop invariants.'
  },
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_sliding_window',
    rationale: 'Sliding windows maintain contiguous index intervals [left..right] over arrays and strings.'
  },
  {
    fromTopicId: 'topic_hashing',
    toTopicId: 'topic_sliding_window',
    rationale: 'Dynamic substring and subarray windows rely on O(1) frequency maps and distinct-count sets.'
  },
  {
    fromTopicId: 'topic_two_pointers',
    toTopicId: 'topic_linked_lists',
    rationale: 'Fast/slow cycle detection, k-gap offset runners, and list merging apply two-pointer invariants to node references.'
  }
];

export const EXPANSION_BATCH_1_LESSONS = [
  // ==================== TOPIC 4: TWO POINTERS ====================
  {
    id: 'les_two_pointers_01',
    topicId: 'topic_two_pointers',
    order: 1,
    title: 'Converging Pointers & Sorted Pair Elimination Proofs',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Prove why incrementing `left` when `nums[left] + nums[right] < target` (and decrementing `right` when `> target`) never misses a valid pair in a sorted array.',
    explanation: 'In a sorted array `nums[0..n-1]`, placing `left = 0` and `right = n - 1` starts at the top-right corner of the conceptual `n × n` pair matrix. If `nums[left] + nums[right] < target`, then because `nums[right]` is the largest remaining element in `[left..right]`, pairing `nums[left]` with ANY smaller index `k < right` will also be `< target`. Thus `left` is provably useless and `left += 1` eliminates an entire row of pairs in O(1) time. Symmetrically, `nums[left] + nums[right] > target` proves `right` is too large for every remaining index `>= left`, so `right -= 1` eliminates an entire column.',
    codeSnippet: {
      language: 'javascript',
      filename: 'twoSumSorted.js',
      lines: [
        'export function twoSumSorted(nums, target) {',
        '  let left = 0;',
        '  let right = nums.length - 1;',
        '  while (left < right) {',
        '    const sum = nums[left] + nums[right];',
        '    if (sum === target) return [left, right];',
        '    if (sum < target) {',
        '      left += 1;',
        '    } else {',
        '      right -= 1;',
        '    }',
        '  }',
        '  return [-1, -1];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 3, 4, 6, 9], target = 10',
      stepByStep: [
        'Start left = 0 (1), right = 4 (9). sum = 1 + 9 = 10 === target -> return [0, 4].',
        'Suppose target = 9 instead: left = 0 (1), right = 4 (9) -> sum = 10 > 9 -> right decrements to 3 (6).',
        'left = 0 (1), right = 3 (6) -> sum = 7 < 9 -> left increments to 1 (3).',
        'left = 1 (3), right = 3 (6) -> sum = 9 === target -> return [1, 3].'
      ],
      outputDescription: '[0, 4] for target 10 (or [1, 3] for target 9)',
      invariantSummary: 'Before each iteration, no valid pair (i, j) with i < j and nums[i] + nums[j] === target has i < left or j > right.'
    },
    pitfalls: [
      'Using `while (left <= right)` when a single element cannot be paired with itself.',
      'Applying converging two-sum pointers to an unsorted array without sorting or preserving original indices.'
    ],
    edgeCase: {
      scenario: 'Negative numbers and duplicate values such as `[-4, -1, -1, 2, 5]`, `target = -2`',
      whyItBreaksNaiveCode: 'Assuming sums are always positive or stopping early when `nums[right] > target` fails when negative numbers can pull the sum down.',
      howToHandle: 'Never prune `right` just because `nums[right] > target`; only compare the full pair sum `nums[left] + nums[right]` against `target`.'
    },
    exerciseId: 'ex_two_pointers_01',
    recommendedPracticeIds: ['prac_two_pointers_01', 'prac_two_pointers_02', 'prac_two_pointers_08'],
    knowledgeCheck: {
      question: 'When `nums` is sorted ascending and `nums[left] + nums[right] > target`, why is it safe to decrement `right` without checking `(left + 1, right)`?',
      options: [
        {
          id: 'tp1_ok',
          label: 'Because `nums[left]` is the smallest element in `[left..right]`, so any `k > left` satisfies `nums[k] + nums[right] >= nums[left] + nums[right] > target`.',
          feedback: 'Correct! Every remaining partner for `right` is at least as large as `nums[left]`, so `right` cannot be part of any valid pair.'
        },
        {
          id: 'tp1_bad1',
          label: 'Because `nums[right]` is always positive.',
          feedback: 'The proof holds even if all numbers are negative; it relies on sorted monotonicity, not sign.'
        },
        {
          id: 'tp1_bad2',
          label: 'Because binary search already checked `left + 1`.',
          feedback: 'Two pointers does not run binary search; monotonicity alone rules out `(k, right)` for all `k >= left`.'
        }
      ],
      correctOptionId: 'tp1_ok',
      explanation: 'Sorted order guarantees `nums[left]` is the minimum available partner for `nums[right]`.'
    },
    reflectionPrompt: 'How does thinking of `left` and `right` as eliminating a full row or column of pairs clarify why the algorithm takes at most `n` steps?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook two-pointer patterns and NextStep invariant proofs.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_two_pointers_02',
    topicId: 'topic_two_pointers',
    order: 2,
    title: 'Three-Sum Reduction & Duplicate-Skipping Invariants',
    estimatedMinutes: 25,
    prerequisites: ['les_two_pointers_01'],
    measurableObjective: 'Reduce 3Sum to `O(n^2)` sorted two-pointer sweeps while skipping duplicate anchors and partner values without missing valid triplets.',
    explanation: 'Sorting `nums` first (`O(n log n)`) lets us fix an anchor index `i` and run converging `left = i + 1, right = n - 1` looking for `nums[left] + nums[right] === -nums[i]`. To emit only unique triplets without a slow hash set of serialized arrays, we enforce two duplicate-skipping rules: (1) if `i > 0 && nums[i] === nums[i - 1]`, skip anchor `i` because every partner pair from `[i + 1..n - 1]` is a subset of pairs already explored at `i - 1`; (2) AFTER recording a valid triplet `[nums[i], nums[left], nums[right]]`, advance both pointers and skip identical values (`while (left < right && nums[left] === nums[left - 1]) left++`).',
    codeSnippet: {
      language: 'javascript',
      filename: 'threeSumUnique.js',
      lines: [
        'export function threeSum(nums) {',
        '  nums.sort((a, b) => a - b);',
        '  const res = [];',
        '  for (let i = 0; i < nums.length - 2; i += 1) {',
        '    if (nums[i] > 0) break;',
        '    if (i > 0 && nums[i] === nums[i - 1]) continue;',
        '    let left = i + 1, right = nums.length - 1;',
        '    while (left < right) {',
        '      const sum = nums[i] + nums[left] + nums[right];',
        '      if (sum < 0) left += 1;',
        '      else if (sum > 0) right -= 1;',
        '      else {',
        '        res.push([nums[i], nums[left], nums[right]]);',
        '        left += 1; right -= 1;',
        '        while (left < right && nums[left] === nums[left - 1]) left += 1;',
        '        while (left < right && nums[right] === nums[right + 1]) right -= 1;',
        '      }',
        '    }',
        '  }',
        '  return res;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [-1, 0, 1, 2, -1, -4]',
      stepByStep: [
        'Sort ascending: [-4, -1, -1, 0, 1, 2].',
        'i = 0 (-4): left = 1 (-1), right = 5 (2); max possible sum with -4 is -4 + 1 + 2 = -1 < 0; pointers converge with no match.',
        'i = 1 (-1): left = 2 (-1), right = 5 (2) -> sum = 0 -> push [-1, -1, 2]; advance to left = 3 (0), right = 4 (1) -> sum = 0 -> push [-1, 0, 1].',
        'i = 2 (-1): nums[2] === nums[1], so skip i = 2 to avoid re-emitting [-1, 0, 1].',
        'i = 3 (0): left = 4 (1), right = 5 (2) -> sum = 3 > 0; loop finishes.'
      ],
      outputDescription: '[[-1, -1, 2], [-1, 0, 1]]',
      invariantSummary: 'Each distinct anchor value nums[i] is swept once, and within that sweep each distinct nums[left] value that forms a zero sum is emitted once.'
    },
    pitfalls: [
      'Using `nums.sort()` in JavaScript without `(a, b) => a - b`, which sorts numbers lexicographically as strings (`-10` before `-2`!).',
      'Checking `nums[i] === nums[i + 1]` instead of `nums[i] === nums[i - 1]`, which skips the first anchor and loses triplets like `[-1, -1, 2]` where `left` needs to use the second `-1`.'
    ],
    edgeCase: {
      scenario: 'All zeros `[0, 0, 0, 0]`',
      whyItBreaksNaiveCode: 'Forgetting `left < right` inside the inner `while` duplicate-skip loops causes `left` to walk past `right` and read out of bounds.',
      howToHandle: 'Always guard inner duplicate skips with `while (left < right && ...)`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_two_pointers_03', 'prac_two_pointers_04', 'prac_two_pointers_10'],
    knowledgeCheck: {
      question: 'Why must the anchor duplicate check be `if (i > 0 && nums[i] === nums[i - 1]) continue` rather than `if (nums[i] === nums[i + 1]) continue`?',
      options: [
        {
          id: 'tp2_ok',
          label: 'Because `nums[i] === nums[i + 1]` would skip the first occurrence of `-1`, preventing valid triplets like `[-1, -1, 2]` that use both `-1`s.',
          feedback: 'Spot on! Processing the first occurrence allows `left = i + 1` to pick up the duplicate as the second member of the triplet.'
        },
        {
          id: 'tp2_bad1',
          label: 'Because `i + 1` is always out of bounds in a `for` loop.',
          feedback: 'The loop stops at `nums.length - 2`, so `i + 1` is in bounds; the bug is logical—skipping the first occurrence loses valid pairs `(i, i + 1)`.'
        },
        {
          id: 'tp2_bad2',
          label: 'Both checks produce the exact same output.',
          feedback: 'On `[-1, -1, 2]`, skipping when `nums[i] === nums[i + 1]` skips `i = 0` and leaves only `[-1, 2]` at `i = 1`, missing `[-1, -1, 2]` completely!'
        }
      ],
      correctOptionId: 'tp2_ok',
      explanation: 'Skipping `i` only AFTER `i - 1` has been processed preserves triplets that use two copies of the anchor value.'
    },
    reflectionPrompt: 'Why did JavaScript’s default `.sort()` without a comparator become one of the most common interview bugs on negative-number array problems?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook 3Sum notes and NextStep duplicate-invariant proofs.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_two_pointers_03',
    topicId: 'topic_two_pointers',
    order: 3,
    title: 'Bottleneck Exclusion & Container / Rainwater Proofs',
    estimatedMinutes: 25,
    prerequisites: ['les_two_pointers_01'],
    measurableObjective: 'Prove why moving the shorter wall inward in Container With Most Water and Trapping Rain Water never discards a better area or water level.',
    explanation: 'Even when an array is NOT sorted, two pointers work whenever the objective is governed by `min(height[left], height[right])`. In Container With Most Water, `area = (right - left) * Math.min(height[left], height[right])`. Suppose `height[left] <= height[right]`. Every other container that keeps `left` as its left wall and chooses some `k < right` has strictly smaller width `(k - left) < (right - left)` AND height capped at `min(height[left], height[k]) <= height[left]`. Therefore, NO container using `left` and `k < right` can beat `(left, right)`. Moving `left += 1` safely discards all those inferior pairs in O(1) time.',
    codeSnippet: {
      language: 'javascript',
      filename: 'maxAreaBottleneck.js',
      lines: [
        'export function maxArea(height) {',
        '  let left = 0;',
        '  let right = height.length - 1;',
        '  let best = 0;',
        '  while (left < right) {',
        '    const w = right - left;',
        '    const h = Math.min(height[left], height[right]);',
        '    if (w * h > best) best = w * h;',
        '    if (height[left] <= height[right]) {',
        '      left += 1;',
        '    } else {',
        '      right -= 1;',
        '    }',
        '  }',
        '  return best;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]',
      stepByStep: [
        'left = 0 (1), right = 8 (7): width = 8, h = min(1, 7) = 1 -> area = 8, best = 8. Since 1 <= 7, left += 1.',
        'left = 1 (8), right = 8 (7): width = 7, h = min(8, 7) = 7 -> area = 49, best = 49. Since 8 > 7, right -= 1.',
        'left = 1 (8), right = 7 (3): width = 6, h = 3 -> area = 18. right -= 1.',
        'left = 1 (8), right = 6 (8): width = 5, h = 8 -> area = 40. left += 1; remaining widths <= 4 cannot beat 49.'
      ],
      outputDescription: '49 (between index 1 of height 8 and index 8 of height 7)',
      invariantSummary: 'At every step, best >= the area of any discarded pair (i, j) where i < left or j > right.'
    },
    pitfalls: [
      'Moving the taller wall inward hoping for an even taller wall, which shrinks width while staying bottlenecked by the shorter wall.',
      'In Trapping Rain Water, forgetting that trapped water at `left` depends on `leftMax - height[left]` only when `leftMax <= rightMax`.'
    ],
    edgeCase: {
      scenario: 'Equal heights `height[left] === height[right]`',
      whyItBreaksNaiveCode: 'Developers often stall wondering which side to move when heights tie.',
      howToHandle: 'Moving either side (or both) is valid because any narrower container using ONLY one of the tied walls is still capped by that same height at a smaller width.'
    },
    exerciseId: 'ex_two_pointers_02',
    recommendedPracticeIds: ['prac_two_pointers_05', 'prac_two_pointers_06', 'prac_two_pointers_09'],
    knowledgeCheck: {
      question: 'In Container With Most Water, when `height[left] < height[right]`, why can we increment `left` without checking `(left, right - 1)`?',
      options: [
        {
          id: 'tp3_ok',
          label: 'Because `(left, right - 1)` has smaller width and its height is still capped by `height[left]`.',
          feedback: 'Correct! `height[left]` is the bottleneck: narrower width × height `<= height[left]` is strictly smaller than `(right - left) * height[left]`.'
        },
        {
          id: 'tp3_bad1',
          label: 'Because `height[right - 1]` is guaranteed to be smaller than `height[right]`.',
          feedback: '`height[right - 1]` could be huge, but even if it is `1000`, `min(height[left], 1000)` is still capped at `height[left]`!'
        },
        {
          id: 'tp3_bad2',
          label: 'Because heights are sorted in ascending order.',
          feedback: 'Container heights are unsorted; the proof relies on the `min(h[left], h[right])` bottleneck, not sorting.'
        }
      ],
      correctOptionId: 'tp3_ok',
      explanation: 'Keeping the shorter wall while shrinking width can never increase `min(h1, h2) * width`.'
    },
    reflectionPrompt: 'How does the bottleneck principle unify Container With Most Water and Two-Pointer Trapping Rain Water?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on bottleneck elimination proofs.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_two_pointers_04',
    topicId: 'topic_two_pointers',
    order: 4,
    title: 'Three-Way Partitioning (Dutch National Flag Invariant)',
    estimatedMinutes: 20,
    prerequisites: ['les_two_pointers_01', 'les_arrays_03'],
    measurableObjective: 'Partition an array into three regions (`< pivot`, `=== pivot`, `> pivot`) in a single pass using `low`, `mid`, and `high` boundaries.',
    explanation: 'Edsger Dijkstra’s Dutch National Flag algorithm partitions an array in-place using three pointers (`low = 0, mid = 0, high = n - 1`) that maintain four regions: `nums[0..low-1]` are strictly `< pivot` (`0`), `nums[low..mid-1]` equal `pivot` (`1`), `nums[mid..high]` are unclassified, and `nums[high+1..n-1]` are strictly `> pivot` (`2`). Why do we increment `mid` after swapping with `low`, but NOT increment `mid` after swapping with `high`? Because `nums[low]` comes from the already-inspected `1`s region (or `low === mid`), whereas `nums[high]` comes from the uninspected region and must be examined at `mid` on the next iteration!',
    codeSnippet: {
      language: 'javascript',
      filename: 'sortColorsDNF.js',
      lines: [
        'export function sortColors(nums) {',
        '  let low = 0, mid = 0, high = nums.length - 1;',
        '  while (mid <= high) {',
        '    if (nums[mid] === 0) {',
        '      [nums[low], nums[mid]] = [nums[mid], nums[low]];',
        '      low += 1;',
        '      mid += 1;',
        '    } else if (nums[mid] === 1) {',
        '      mid += 1;',
        '    } else {',
        '      [nums[mid], nums[high]] = [nums[high], nums[mid]];',
        '      high -= 1;',
        '    }',
        '  }',
        '  return nums;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [2, 0, 2, 1, 1, 0]',
      stepByStep: [
        'low=0, mid=0, high=5: nums[0]=2 -> swap(0, 5) gives [0, 0, 2, 1, 1, 2]; high=4, mid stays 0.',
        'low=0, mid=0, high=4: nums[0]=0 -> swap(0, 0); low=1, mid=1.',
        'low=1, mid=1, high=4: nums[1]=0 -> swap(1, 1); low=2, mid=2.',
        'low=2, mid=2, high=4: nums[2]=2 -> swap(2, 4) gives [0, 0, 1, 1, 2, 2]; high=3, mid stays 2.',
        'mid=2 (1) -> mid=3; mid=3 (1) -> mid=4 > high=3 -> terminate.'
      ],
      outputDescription: '[0, 0, 1, 1, 2, 2]',
      invariantSummary: 'At every step: [0..low-1] == 0, [low..mid-1] == 1, [mid..high] is uninspected, and [high+1..n-1] == 2.'
    },
    pitfalls: [
      'Incrementing `mid` after swapping `nums[mid]` with `nums[high]`, which skips inspecting the value swapped in from `high`.',
      'Using `while (mid < high)` instead of `while (mid <= high)`, leaving the last element at `mid === high` uninspected.'
    ],
    edgeCase: {
      scenario: '`nums = [2, 0, 1]` where `nums[high]` holds a `0`',
      whyItBreaksNaiveCode: 'If `mid` increments when swapping index 0 (`2`) with index 2 (`1`), or when `nums[high]` is `0`, that `0` gets stranded in the middle.',
      howToHandle: 'Only decrement `high -= 1` in the `nums[mid] === 2` branch so the next loop iteration classifies the new `nums[mid]`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_two_pointers_07'],
    knowledgeCheck: {
      question: 'In the Dutch National Flag partition, why do we NOT increment `mid` after swapping `nums[mid]` (which is `2`) with `nums[high]`?',
      options: [
        {
          id: 'tp4_ok',
          label: 'Because the value arriving from `nums[high]` belongs to the uninspected region `[mid..high]` and could be `0`, `1`, or `2`.',
          feedback: 'Correct! `nums[high]` has not been classified yet, so `mid` must stay put to inspect it next.'
        },
        {
          id: 'tp4_bad1',
          label: 'Because `high` was not decremented.',
          feedback: '`high` IS decremented (`high -= 1`), shrinking the uninspected region from the right.'
        },
        {
          id: 'tp4_bad2',
          label: 'To prevent `mid` from exceeding `nums.length`.',
          feedback: 'The loop condition `mid <= high` already prevents out-of-bounds access.'
        }
      ],
      correctOptionId: 'tp4_ok',
      explanation: 'The value swapped from `high` is uninspected, whereas the value at `low` is already known to be `1` (or `low === mid`).'
    },
    reflectionPrompt: 'How does the 4-region invariant of Dutch National Flag speed up Quicksort when arrays contain many duplicate keys?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA partitioning invariants and Dijkstra’s 3-way partition.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 5: SLIDING WINDOW ====================
  {
    id: 'les_sliding_window_01',
    topicId: 'topic_sliding_window',
    order: 1,
    title: 'Fixed-Length Rolling Windows & O(1) Boundary Deltas',
    estimatedMinutes: 15,
    prerequisites: ['les_arrays_01', 'les_arrays_02'],
    measurableObjective: 'Maintain exact aggregate state across every contiguous window of fixed length `k` by adding the entering element `nums[i]` and subtracting the exiting element `nums[i - k]`.',
    explanation: 'When a problem asks for the maximum sum, average, or vowel count across all contiguous subarrays of fixed size `k`, recomputing the window from scratch takes `O(n * k)`. Notice that consecutive windows `[i - k..i - 1]` and `[i - k + 1..i]` share `k - 1` elements! Once the initial window `nums[0..k - 1]` is accumulated, each step `i` from `k` to `n - 1` updates the state in O(1) via `windowSum += nums[i] - nums[i - k]`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'fixedWindowMaxAverage.js',
      lines: [
        'export function findMaxAverage(nums, k) {',
        '  let windowSum = 0;',
        '  for (let i = 0; i < k; i += 1) {',
        '    windowSum += nums[i];',
        '  }',
        '  let maxSum = windowSum;',
        '  for (let i = k; i < nums.length; i += 1) {',
        '    windowSum += nums[i] - nums[i - k];',
        '    if (windowSum > maxSum) maxSum = windowSum;',
        '  }',
        '  return maxSum / k;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 12, -5, -6, 50, 3], k = 4',
      stepByStep: [
        'Seed first window [0..3] ([1, 12, -5, -6]): windowSum = 2, maxSum = 2.',
        'i = 4 (enter 50, exit nums[0] = 1): windowSum = 2 + 50 - 1 = 51; maxSum updates to 51.',
        'i = 5 (enter 3, exit nums[1] = 12): windowSum = 51 + 3 - 12 = 42; maxSum stays 51.',
        'Return 51 / 4 = 12.75.'
      ],
      outputDescription: '12.75 (from window [12, -5, -6, 50])',
      invariantSummary: 'At the end of iteration i (for i >= k - 1), windowSum equals the exact sum of the k elements in nums[i - k + 1 .. i].'
    },
    pitfalls: [
      'Initializing `maxSum = 0` instead of `windowSum`, which fails when all window sums are negative.',
      'Subtracting `nums[i - k + 1]` instead of `nums[i - k]`, which evicts an element that should still remain inside the window.'
    ],
    edgeCase: {
      scenario: 'Single-window array where `k === nums.length` and all values are negative (`[-5]`, `k = 1`)',
      whyItBreaksNaiveCode: 'If `maxSum` starts at `0`, the second loop never runs and `0 / 1 = 0` is returned instead of `-5`.',
      howToHandle: 'Always initialize `maxSum = windowSum` immediately after seeding the first `k` elements.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_sliding_window_01', 'prac_sliding_window_05', 'prac_sliding_window_06'],
    knowledgeCheck: {
      question: 'When `right = i` enters a fixed-size window of length `k` (0-indexed), which index is exiting the window?',
      options: [
        {
          id: 'sw1_ok',
          label: '`i - k`, because the new window spans `[i - k + 1 .. i]` which contains exactly `k` elements.',
          feedback: 'Correct! `i - (i - k + 1) + 1 = k` elements remain in the window after `i - k` exits.'
        },
        {
          id: 'sw1_bad1',
          label: '`i - k + 1`, the leftmost index of the new window.',
          feedback: '`i - k + 1` is the first index KEPT in the new window; `i - k` is the index that just fell off the left edge.'
        },
        {
          id: 'sw1_bad2',
          label: '`i - 1`, the immediately preceding index.',
          feedback: 'That would only keep a window of size 1!'
        }
      ],
      correctOptionId: 'sw1_ok',
      explanation: 'A window ending at `i` of length `k` covers `[i - k + 1 .. i]`, so `i - k` just exited.'
    },
    reflectionPrompt: 'Why is dividing `maxSum / k` once at the end preferable to dividing `windowSum / k` on every iteration?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook sliding window patterns.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_sliding_window_02',
    topicId: 'topic_sliding_window',
    order: 2,
    title: 'Variable-Size Windows & Expand/Shrink Monotonicity',
    estimatedMinutes: 25,
    prerequisites: ['les_sliding_window_01', 'les_hashing_01'],
    measurableObjective: 'Trace and prove the O(n) amortized runtime of variable-size windows (`while (invalid) shrink left`) for Longest Substring Without Repeating Characters and Minimum Size Subarray Sum.',
    explanation: 'A variable-size sliding window `[left..right]` advances `right` one step per outer iteration to incorporate `s[right]`, then runs an inner `while` loop that advances `left` until the window invariant is restored (for Longest Substring Without Repeating Characters) or while the target sum is met (for Minimum Size Subarray Sum). Why is a `for` loop containing a `while` loop still `O(n)` and not `O(n^2)`? Because `left` starts at `0`, only increments (`left += 1`), and never resets backward! Across the entire algorithm, `right` increments `n` times and `left` increments at most `n` times, totaling at most `2n` pointer operations.',
    codeSnippet: {
      language: 'javascript',
      filename: 'longestUniqueSubstring.js',
      lines: [
        'export function lengthOfLongestSubstring(s) {',
        '  const lastSeen = new Map();',
        '  let left = 0;',
        '  let best = 0;',
        '  for (let right = 0; right < s.length; right += 1) {',
        '    const ch = s[right];',
        '    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {',
        '      left = lastSeen.get(ch) + 1;',
        '    }',
        '    lastSeen.set(ch, right);',
        '    const len = right - left + 1;',
        '    if (len > best) best = len;',
        '  }',
        '  return best;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 's = "abba"',
      stepByStep: [
        'right = 0 ("a"): lastSeen = {a: 0}, left = 0, len = 1, best = 1.',
        'right = 1 ("b"): lastSeen = {a: 0, b: 1}, left = 0, len = 2, best = 2.',
        'right = 2 ("b"): lastSeen.get("b") = 1 >= left (0) -> left jumps to 1 + 1 = 2; lastSeen.set("b", 2); len = 2 - 2 + 1 = 1.',
        'right = 3 ("a"): lastSeen.get("a") = 0 < left (2) -> ignore stale "a" outside window! left stays 2; len = 3 - 2 + 1 = 2.'
      ],
      outputDescription: '2 (from unique substring "ab" or "ba")',
      invariantSummary: 'After updating left at step right, the substring s[left..right] contains no duplicate characters, and left is the smallest start index with that property for this right.'
    },
    pitfalls: [
      'On `"abba"`, setting `left = lastSeen.get(ch) + 1` without checking `lastSeen.get(ch) >= left` (or using `Math.max`), which moves `left` BACKWARD from 2 to 1 when the second `"a"` is seen!',
      'Using a sliding window for subarray sums when the array contains negative numbers (which breaks sum monotonicity).'
    ],
    edgeCase: {
      scenario: 'Palindrome with stale duplicate outside current window: `s = "abba"`',
      whyItBreaksNaiveCode: 'At index 3 (`"a"`), `lastSeen.get("a")` is `0`, which is to the left of `left = 2`. Without `>= left`, `left` regresses to `0 + 1 = 1`, including both `"b"`s and falsely computing length `3`!',
      howToHandle: 'Always guard with `lastSeen.get(ch) >= left` (or `left = Math.max(left, lastSeen.get(ch) + 1)`).'
    },
    exerciseId: 'ex_sliding_window_01',
    recommendedPracticeIds: ['prac_sliding_window_02', 'prac_sliding_window_03', 'prac_sliding_window_08'],
    knowledgeCheck: {
      question: 'When using a `lastSeen` index map in Longest Substring Without Repeating Characters on `"abba"`, what happens at `right = 3` (`"a"`) if you omit the `lastSeen.get(ch) >= left` check?',
      options: [
        {
          id: 'sw2_ok',
          label: '`left` moves backward from `2` to `1`, re-admitting the duplicate `"b"`s at indices 1 and 2 into the window.',
          feedback: 'Exact diagnosis! `left` must be monotonically non-decreasing.'
        },
        {
          id: 'sw2_bad1',
          label: 'The loop enters an infinite cycle.',
          feedback: '`right` still advances in the `for` loop, so it terminates—but returns the wrong length `3` instead of `2`.'
        },
        {
          id: 'sw2_bad2',
          label: 'Nothing goes wrong because `"a"` was already deleted from `lastSeen`.',
          feedback: 'With the direct-jump map optimization, old keys are not deleted one by one, so `"a" -> 0` is still in `lastSeen`.'
        }
      ],
      correctOptionId: 'sw2_ok',
      explanation: 'Any index `< left` is already outside the current window `[left..right]` and must never pull `left` backward.'
    },
    reflectionPrompt: 'Why does variable-size sliding window fail on Minimum Size Subarray Sum if the array can contain negative numbers?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook sliding window invariants.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_sliding_window_03',
    topicId: 'topic_sliding_window',
    order: 3,
    title: 'Frequency-Constrained Windows & O(1) Validity Tracking',
    estimatedMinutes: 25,
    prerequisites: ['les_sliding_window_02', 'les_hashing_02'],
    measurableObjective: 'Track window validity in O(1) per step using `maxFreq` or `formedCount` instead of re-scanning the entire frequency map on every character.',
    explanation: 'In problems like Minimum Window Substring or Longest Repeating Character Replacement, checking whether the current window `[left..right]` satisfies the frequency requirement by iterating over all keys in the hash map adds an `O(|Σ|)` factor per step. Instead, we maintain a scalar summary variable: in Minimum Window Substring, `formed` counts how many distinct required characters currently meet `windowCounts.get(ch) >= targetCounts.get(ch)` (incrementing `formed` ONLY on the exact transition where `windowCounts.get(ch) === targetCounts.get(ch)`). In Character Replacement, `windowLen - maxFreq <= k` tells us whether the non-majority characters in the window can all be replaced within `k` operations.',
    codeSnippet: {
      language: 'javascript',
      filename: 'characterReplacementWindow.js',
      lines: [
        'export function characterReplacement(s, k) {',
        '  const counts = new Map();',
        '  let left = 0, maxFreq = 0, best = 0;',
        '  for (let right = 0; right < s.length; right += 1) {',
        '    const ch = s[right];',
        '    const nextCount = (counts.get(ch) || 0) + 1;',
        '    counts.set(ch, nextCount);',
        '    if (nextCount > maxFreq) maxFreq = nextCount;',
        '    while ((right - left + 1) - maxFreq > k) {',
        '      const leftCh = s[left];',
        '      counts.set(leftCh, counts.get(leftCh) - 1);',
        '      left += 1;',
        '    }',
        '    best = Math.max(best, right - left + 1);',
        '  }',
        '  return best;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 's = "AABABBA", k = 1',
      stepByStep: [
        'right = 0..3 ("AABA"): counts={A:3, B:1}, maxFreq=3. replacements needed = 4 - 3 = 1 <= k -> valid, best = 4.',
        'right = 4 ("AABAB"): counts={A:3, B:2}, maxFreq=3. len=5, 5 - 3 = 2 > k -> shrink left=0 ("A"): window becomes "ABAB" (len 4), best stays 4.',
        'right = 5 ("ABABB"): counts={A:1, B:3}, maxFreq=3. len=5, 5 - 3 = 2 > k -> shrink left=1 ("B"): window "BABB" (len 4).',
        'right = 6 ("BABBA"): shrink left=2 -> return best = 4.'
      ],
      outputDescription: '4 (from window "AABA" or "ABBA" with 1 replacement)',
      invariantSummary: 'At the end of each step, right - left + 1 equals the maximum valid window length seen so far, because window size only grows when maxFreq increases.'
    },
    pitfalls: [
      'In Minimum Window Substring, incrementing `formed` whenever `windowCount >= targetCount` instead of strictly `===`, which overcounts a single repeated character.',
      'Re-scanning all 26 letters on every step when `maxFreq` or `formed` can be updated in O(1).'
    ],
    edgeCase: {
      scenario: '`k = 0` on `"AAABBC"`',
      whyItBreaksNaiveCode: 'Code that assumes at least 1 replacement is always available will bridge across different characters.',
      howToHandle: 'The condition `(right - left + 1) - maxFreq > k` naturally requires `windowLen === maxFreq` when `k = 0`, shrinking until the window is 100% homogeneous.'
    },
    exerciseId: 'ex_sliding_window_02',
    recommendedPracticeIds: ['prac_sliding_window_04', 'prac_sliding_window_07', 'prac_sliding_window_09'],
    knowledgeCheck: {
      question: 'In Minimum Window Substring, why do we increment `formed` ONLY when `windowCounts.get(ch) === requiredCounts.get(ch)` (and not `>=`)?',
      options: [
        {
          id: 'sw3_ok',
          label: 'Because `formed` tracks how many distinct character requirements are satisfied; extra copies of an already-satisfied character must not increment `formed` again.',
          feedback: 'Spot on! Only the exact threshold crossing `===` changes a character’s requirement from unmet to met.'
        },
        {
          id: 'sw3_bad1',
          label: 'Because `windowCounts.get(ch)` can never exceed `requiredCounts.get(ch)`.',
          feedback: 'A window can easily contain more copies of `ch` than required while searching for other characters.'
        },
        {
          id: 'sw3_bad2',
          label: 'To save memory inside the Map.',
          feedback: 'Map size is the same; `===` is required for counting distinct satisfied characters.'
        }
      ],
      correctOptionId: 'sw3_ok',
      explanation: 'Threshold transition `===` on expand (and `<` right after decrement on shrink) keeps `formed` exact.'
    },
    reflectionPrompt: 'Why doesn’t `maxFreq` need to be decremented when the window shrinks in Longest Repeating Character Replacement?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on frequency-constrained sliding windows.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_sliding_window_04',
    topicId: 'topic_sliding_window',
    order: 4,
    title: 'Exact-K Subarray Counting via AtMost(K) - AtMost(K - 1)',
    estimatedMinutes: 25,
    prerequisites: ['les_sliding_window_03'],
    measurableObjective: 'Count subarrays with EXACTLY `k` distinct elements (or odd numbers) by subtracting two monotonic `atMost(k)` sliding window counts.',
    explanation: 'A single sliding window cannot directly count subarrays with **exactly** `k` distinct elements because for a fixed `right`, multiple `left` positions can yield `k` distinct elements. However, "at most `k` distinct elements" IS monotonic! If `[left..right]` has `<= k` distinct elements, then every suffix subarray `[i..right]` for `left <= i <= right` also has `<= k` distinct elements—that is `right - left + 1` valid subarrays ending at `right`! Therefore, `exactly(k) = atMost(k) - atMost(k - 1)` solves the exact-count problem in two clean `O(n)` sliding-window passes.',
    codeSnippet: {
      language: 'javascript',
      filename: 'subarraysWithKDistinct.js',
      lines: [
        'function atMostKDistinct(nums, k) {',
        '  if (k <= 0) return 0;',
        '  const freq = new Map();',
        '  let left = 0, total = 0;',
        '  for (let right = 0; right < nums.length; right += 1) {',
        '    freq.set(nums[right], (freq.get(nums[right]) || 0) + 1);',
        '    while (freq.size > k) {',
        '      const lVal = nums[left];',
        '      const next = freq.get(lVal) - 1;',
        '      if (next === 0) freq.delete(lVal);',
        '      else freq.set(lVal, next);',
        '      left += 1;',
        '    }',
        '    total += right - left + 1;',
        '  }',
        '  return total;',
        '}',
        'export function subarraysWithKDistinct(nums, k) {',
        '  return atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1);',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 2, 1, 2, 3], k = 2',
      stepByStep: [
        'atMost(2): right=0 ([1]) -> +1; right=1 ([1,2]) -> +2; right=2 ([1,2,1]) -> +3; right=3 ([1,2,1,2]) -> +4; right=4 (3 enters, shrink left to 3 so [2,3]) -> +2. Total atMost(2) = 1+2+3+4+2 = 12.',
        'atMost(1): each single-value run has length 1 -> +1+1+1+1+1 = 5.',
        'exactly(2) = 12 - 5 = 7.'
      ],
      outputDescription: '7 subarrays with exactly 2 distinct integers',
      invariantSummary: 'Once freq.size <= k, all (right - left + 1) subarrays ending at right and starting in [left..right] have at most k distinct values.'
    },
    pitfalls: [
      'Forgetting `if (next === 0) freq.delete(lVal)` when decrementing counts, which leaves `freq.size` inflated by zero-count keys!',
      'Adding `1` instead of `right - left + 1` when counting all valid subarrays ending at `right`.'
    ],
    edgeCase: {
      scenario: '`k = 1` where `atMost(k - 1)` calls `atMost(0)`',
      whyItBreaksNaiveCode: 'Without `if (k <= 0) return 0`, the inner `while` loop can push `left` to `right + 1`, require careful bounds handling, or waste a full pass.',
      howToHandle: 'Return `0` immediately whenever `k <= 0`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_sliding_window_10'],
    knowledgeCheck: {
      question: 'In `atMostKDistinct`, once the `while (freq.size > k)` loop finishes for a given `right`, why do we add `right - left + 1` to `total`?',
      options: [
        {
          id: 'sw4_ok',
          label: 'Because every subarray `[i..right]` with `left <= i <= right` is a subset of `[left..right]` and therefore also has `<= k` distinct elements.',
          feedback: 'Correct! There are `right - left + 1` such start indices `i`, and all of them end at `right`.'
        },
        {
          id: 'sw4_bad1',
          label: 'Because `right - left + 1` is the maximum window length.',
          feedback: 'We are summing subarray counts across all `right`, not taking a maximum length.'
        },
        {
          id: 'sw4_bad2',
          label: 'Because `freq.size` always equals `right - left + 1`.',
          feedback: '`freq.size` is the number of distinct values (`<= k`), whereas `right - left + 1` is the window length.'
        }
      ],
      correctOptionId: 'sw4_ok',
      explanation: 'Any subarray contained inside a valid `<= k`-distinct window also has `<= k` distinct elements.'
    },
    reflectionPrompt: 'What other "exact constraint" subarray problems become easy once rewritten as `atMost(K) - atMost(K - 1)`?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on AtMost(K) decomposition.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 6: LINKED LISTS ====================
  {
    id: 'les_linked_lists_01',
    topicId: 'topic_linked_lists',
    order: 1,
    title: 'Sentinel Dummy Heads & Safe Pointer Rewiring',
    estimatedMinutes: 20,
    prerequisites: ['les_two_pointers_01'],
    measurableObjective: 'Eliminate head-deletion and empty-list special cases using a stack-allocated sentinel `dummy` node (`dummy.next = head`).',
    explanation: 'Every linked-list insertion or deletion requires modifying the `.next` pointer of the **predecessor** node. The original `head` node has no predecessor, forcing messy `if (head === target)` branches that break when the first node itself is deleted or replaced. Creating `const dummy = { val: 0, next: head }` gives `head` a real predecessor (`dummy`)! You advance a `prev` or `tail` pointer starting at `dummy`, perform uniform `prev.next = ...` rewiring, and return `dummy.next` at the end.',
    codeSnippet: {
      language: 'javascript',
      filename: 'mergeTwoListsSentinel.js',
      lines: [
        'export function mergeTwoLists(l1, l2) {',
        '  const dummy = { val: 0, next: null };',
        '  let tail = dummy;',
        '  while (l1 !== null && l2 !== null) {',
        '    if (l1.val <= l2.val) {',
        '      tail.next = l1;',
        '      l1 = l1.next;',
        '    } else {',
        '      tail.next = l2;',
        '      l2 = l2.next;',
        '    }',
        '    tail = tail.next;',
        '  }',
        '  tail.next = l1 !== null ? l1 : l2;',
        '  return dummy.next;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'l1 = 1 -> 4, l2 = 2 -> 3',
      stepByStep: [
        'dummy -> null, tail = dummy.',
        'Compare 1 <= 2: tail.next = l1(1); l1 advances to 4; tail advances to 1.',
        'Compare 4 > 2: tail.next = l2(2); l2 advances to 3; tail advances to 2.',
        'Compare 4 > 3: tail.next = l2(3); l2 advances to null; tail advances to 3.',
        'Loop ends; tail.next = l1(4); return dummy.next (1 -> 2 -> 3 -> 4).'
      ],
      outputDescription: '1 -> 2 -> 3 -> 4',
      invariantSummary: 'dummy.next points to the head of the merged prefix, and tail points to its last node.'
    },
    pitfalls: [
      'Returning `head` instead of `dummy.next` when the original `head` was removed or moved.',
      'Forgetting `tail = tail.next` inside the loop, which overwrites `dummy.next` on every iteration.'
    ],
    edgeCase: {
      scenario: 'Removing the 1st node of a 1-element list (`Remove Nth Node From End`, `n = 1` on `[10]`)',
      whyItBreaksNaiveCode: 'Without a dummy node, `fast` reaches `null` immediately and `slow.next = slow.next.next` dereferences `null`.',
      howToHandle: 'Start both `slow` and `fast` at `dummy`; to remove the `n`-th from end, advance `fast` by `n + 1` steps so `slow` stops at the predecessor (`dummy`).'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_linked_lists_02', 'prac_linked_lists_06', 'prac_linked_lists_09'],
    knowledgeCheck: {
      question: 'When removing the `n`-th node from the end of a list of length `L` in one pass, why should `slow` and `fast` start at `dummy` instead of `head`?',
      options: [
        {
          id: 'll1_ok',
          label: 'So that when `n === L` (deleting the original `head`), `slow` stops at `dummy` and `slow.next = slow.next.next` cleanly updates `dummy.next`.',
          feedback: 'Correct! Starting at `dummy` gives the original `head` a predecessor node.'
        },
        {
          id: 'll1_bad1',
          label: 'Because `head.next` is read-only in JavaScript.',
          feedback: 'Node properties are mutable; `dummy` is used to unify predecessor logic when `head` itself is deleted.'
        },
        {
          id: 'll1_bad2',
          label: 'To reduce the time complexity from O(n^2) to O(n).',
          feedback: 'Both take O(n) time; `dummy` eliminates null-predecessor crashes when deleting the first node.'
        }
      ],
      correctOptionId: 'll1_ok',
      explanation: 'Deleting a node requires its predecessor; `dummy` is the predecessor of `head`.'
    },
    reflectionPrompt: 'Which linked-list edge cases disappear immediately as soon as you introduce `const dummy = { val: 0, next: head }`?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) linked list sentinel techniques.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_linked_lists_02',
    topicId: 'topic_linked_lists',
    order: 2,
    title: 'Iterative Three-Pointer Reversal & Sublist Surgery',
    estimatedMinutes: 25,
    prerequisites: ['les_linked_lists_01'],
    measurableObjective: 'Reverse a singly linked list in-place in O(1) space without losing the unvisited suffix by maintaining `prev`, `curr`, and `nextTemp`.',
    explanation: 'Reversing a singly linked list in-place splits the list into two disjoint chains at all times: `prev` (the head of the already-reversed prefix) and `curr` (the head of the still-forward suffix). Before flipping `curr.next = prev`, you MUST save `const nextTemp = curr.next`, or else the entire remaining suffix is orphaned in memory! The four-line heartbeat (`const nextTemp = curr.next; curr.next = prev; prev = curr; curr = nextTemp;`) preserves every node and terminates when `curr === null`, leaving `prev` at the new head.',
    codeSnippet: {
      language: 'javascript',
      filename: 'reverseLinkedList.js',
      lines: [
        'export function reverseList(head) {',
        '  let prev = null;',
        '  let curr = head;',
        '  while (curr !== null) {',
        '    const nextTemp = curr.next;',
        '    curr.next = prev;',
        '    prev = curr;',
        '    curr = nextTemp;',
        '  }',
        '  return prev;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'head = 10 -> 20 -> 30 -> null',
      stepByStep: [
        'Init: prev = null, curr = 10.',
        'Step 1: nextTemp = 20; 10.next = null; prev = 10; curr = 20. (Reversed: 10->null; Remaining: 20->30->null)',
        'Step 2: nextTemp = 30; 20.next = 10; prev = 20; curr = 30. (Reversed: 20->10->null; Remaining: 30->null)',
        'Step 3: nextTemp = null; 30.next = 20; prev = 30; curr = null. Return prev (30 -> 20 -> 10 -> null).'
      ],
      outputDescription: '30 -> 20 -> 10 -> null',
      invariantSummary: 'Before each iteration, prev points to the reversed prefix of visited nodes ending in null, and curr points to the unvisited suffix.'
    },
    pitfalls: [
      'Writing `curr.next = prev` before `const nextTemp = curr.next`, which overwrites the forward link and stops after 1 node.',
      'Initializing `prev = head` instead of `prev = null`, which creates a 2-node cycle `head <-> head.next` on the old head!'
    ],
    edgeCase: {
      scenario: 'Empty list `head = null` or single-node list `10 -> null`',
      whyItBreaksNaiveCode: 'Code that accesses `head.next` before the `while (curr !== null)` guard throws a TypeError on `null`.',
      howToHandle: 'Start with `prev = null, curr = head` and let `while (curr !== null)` handle `null` (0 iterations, returns `null`) and 1-node lists (1 iteration, returns `head`) automatically.'
    },
    exerciseId: 'ex_linked_lists_01',
    recommendedPracticeIds: ['prac_linked_lists_01', 'prac_linked_lists_07'],
    knowledgeCheck: {
      question: 'What happens if you initialize `let prev = head` instead of `let prev = null` before the reversal loop on `10 -> 20 -> null`?',
      options: [
        {
          id: 'll2_ok',
          label: 'Node `10.next` points to `10` (and `20.next` points to `10`), creating an infinite cycle instead of terminating in `null`.',
          feedback: 'Correct! The original head becomes the new tail and MUST point to `null`.'
        },
        {
          id: 'll2_bad1',
          label: 'It reverses normally except the first node is duplicated.',
          feedback: 'No nodes are allocated; setting `10.next = 10` creates a reference cycle.'
        },
        {
          id: 'll2_bad2',
          label: 'The loop exits immediately without changing any pointers.',
          feedback: '`curr` is not null, so the loop executes and wires `10.next = 10`.'
        }
      ],
      correctOptionId: 'll2_ok',
      explanation: 'The old head becomes the new tail, so its `.next` must become `prev = null`.'
    },
    reflectionPrompt: 'Why is iterative 3-pointer reversal O(1) space whereas recursive linked-list reversal uses O(n) call-stack frames?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) pointer reversal invariants.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_linked_lists_03',
    topicId: 'topic_linked_lists',
    order: 3,
    title: 'Floyd’s Tortoise-and-Hare Cycle & Midpoint Proofs',
    estimatedMinutes: 20,
    prerequisites: ['les_linked_lists_01'],
    measurableObjective: 'Use `slow` (1 step) and `fast` (2 steps) pointers to locate list midpoints and detect/locate cycle entrances in O(1) space.',
    explanation: 'When `slow` advances by 1 node (`slow = slow.next`) and `fast` advances by 2 nodes (`fast = fast.next.next`) guarded by `while (fast !== null && fast.next !== null)`: (1) On an acyclic list of length `n`, `fast` reaches the end in `floor(n/2)` steps, leaving `slow` at the exact middle node (the second middle on even lengths); (2) On a cyclic list with cycle length `C`, once `slow` enters the cycle, the distance from `fast` to `slow` along the cycle shrinks by `2 - 1 = 1` every step, guaranteeing they collide inside the cycle within `< C` steps without ever jumping over each other!',
    codeSnippet: {
      language: 'javascript',
      filename: 'floydCycleAndMidpoint.js',
      lines: [
        'export function detectCycleEntry(head) {',
        '  let slow = head, fast = head;',
        '  while (fast !== null && fast.next !== null) {',
        '    slow = slow.next;',
        '    fast = fast.next.next;',
        '    if (slow === fast) {',
        '      let finder = head;',
        '      while (finder !== slow) {',
        '        finder = finder.next;',
        '        slow = slow.next;',
        '      }',
        '      return finder;',
        '    }',
        '  }',
        '  return null;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'List 1 -> 2 -> 3 -> 4 -> (back to 2), so pre-cycle length L = 1, cycle length C = 3',
      stepByStep: [
        'Start: slow = 1, fast = 1.',
        'Step 1: slow = 2, fast = 3.',
        'Step 2: slow = 3, fast = 2 (via 4 -> 2).',
        'Step 3: slow = 4, fast = 4 -> collision at node 4!',
        'Phase 2: finder = head (1), slow = 4. Advance both 1 step -> finder = 2, slow = 2 -> return cycle entry node 2.'
      ],
      outputDescription: 'Node 2 (cycle entry)',
      invariantSummary: 'At collision after k steps, fast has traveled 2k = k + m*C steps, so k is a multiple of C. Walking L more steps from collision reaches L + k ≡ L (the cycle entrance).'
    },
    pitfalls: [
      'Checking `while (fast.next !== null && fast !== null)` in the wrong order, which crashes when `fast` becomes `null` on an even-length list.',
      'Comparing `slow.val === fast.val` instead of node reference identity `slow === fast` when duplicate values exist.'
    ],
    edgeCase: {
      scenario: 'Single node with no cycle `1 -> null` vs single node pointing to itself `1 -> 1`',
      whyItBreaksNaiveCode: 'If `slow === fast` is checked BEFORE advancing pointers inside the loop, it immediately triggers at `head === head` even on an acyclic list!',
      howToHandle: 'Advance `slow` and `fast` first inside the `while` body, then test `if (slow === fast)`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_linked_lists_03', 'prac_linked_lists_04', 'prac_linked_lists_05'],
    knowledgeCheck: {
      question: 'Why can `fast` (moving 2 steps) never "jump over" `slow` (moving 1 step) inside a cycle without landing on the exact same node?',
      options: [
        {
          id: 'll3_ok',
          label: 'Because their relative distance along the cycle decreases by `2 - 1 = 1` node per step, so it must hit `0` before becoming negative.',
          feedback: 'Exact mathematical reason! Closing the gap by 1 per step cannot skip over 0.'
        },
        {
          id: 'll3_bad1',
          label: 'Because cycle lengths are always odd numbers.',
          feedback: 'Cycle lengths can be even or odd; a gap reduction of 1 per step hits 0 regardless of parity.'
        },
        {
          id: 'll3_bad2',
          label: 'Because `fast` slows down to 1 step once inside the cycle.',
          feedback: '`fast` always moves 2 steps during Phase 1.'
        }
      ],
      correctOptionId: 'll3_ok',
      explanation: 'A relative speed of `2 - 1 = 1` step per iteration reduces the gap by 1 each time until `gap === 0`.'
    },
    reflectionPrompt: 'When splitting a list into two halves for Merge Sort or Reorder List, why do we sometimes want `slow` to stop at the FIRST middle of an even-length list (`fast = head.next`)?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA Floyd cycle detection and runner proofs.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_linked_lists_04',
    topicId: 'topic_linked_lists',
    order: 4,
    title: 'Doubly-Linked List Splice & Hash-Map LRU Eviction',
    estimatedMinutes: 25,
    prerequisites: ['les_linked_lists_01', 'les_hashing_01'],
    measurableObjective: 'Combine a Hash Map (`key -> node`) with a doubly-linked list bounded by `head` and `tail` sentinels to achieve O(1) `get` and `put` in an LRU Cache.',
    explanation: 'Why can neither a Hash Map alone nor a Linked List alone implement an `O(1)` Least Recently Used (LRU) cache? A Hash Map gives `O(1)` lookup by key, but cannot reorder recency in `O(1)` when a middle item is accessed. A Doubly-Linked List can splice a node out (`node.prev.next = node.next; node.next.prev = node.prev`) and insert it at the Most Recently Used (MRU) front in `O(1)`, provided you already have a direct reference to `node`! Storing `key -> DoublyLinkedNode` in a `Map` and sandwiching all real nodes between two permanent sentinels `head <-> ... <-> tail` makes every splice and eviction 4 pointer assignments with zero null checks.',
    codeSnippet: {
      language: 'javascript',
      filename: 'lruCacheSplice.js',
      lines: [
        'export function removeNode(node) {',
        '  const prevNode = node.prev;',
        '  const nextNode = node.next;',
        '  prevNode.next = nextNode;',
        '  nextNode.prev = prevNode;',
        '}',
        'export function insertAfterHead(headSentinel, node) {',
        '  const firstReal = headSentinel.next;',
        '  node.next = firstReal;',
        '  node.prev = headSentinel;',
        '  headSentinel.next = node;',
        '  firstReal.prev = node;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Capacity = 2; put(1, 10), put(2, 20), get(1), put(3, 30)',
      stepByStep: [
        'Init: head <-> tail.',
        'put(1, 10): insertAfterHead(1) -> head <-> [1:10] <-> tail.',
        'put(2, 20): insertAfterHead(2) -> head <-> [2:20] <-> [1:10] <-> tail.',
        'get(1): removeNode(1), insertAfterHead(1) -> head <-> [1:10] <-> [2:20] <-> tail (now 2 is LRU at tail.prev).',
        'put(3, 30): insert 3 at front; size > 2 so evict lru = tail.prev ([2:20]): removeNode(2) and map.delete(2).'
      ],
      outputDescription: 'Cache holds {1: 10, 3: 30}; get(2) returns -1.',
      invariantSummary: 'head.next is always the most recently used node, tail.prev is always the least recently used node, and map.size equals the number of nodes between head and tail.'
    },
    pitfalls: [
      'Forgetting to store `key` on the doubly-linked `node` itself, making it impossible to call `map.delete(lruNode.key)` in O(1) when evicting `tail.prev`!',
      'Updating an existing key via `put(key, newVal)` without moving its node to the MRU position.'
    ],
    edgeCase: {
      scenario: 'Calling `put(k, v)` on a key `k` that ALREADY exists when the cache is at full capacity',
      whyItBreaksNaiveCode: 'If you check `map.size === capacity` and evict `tail.prev` BEFORE checking whether `k` is already in `map`, you wrongly evict a valid key on an in-place update!',
      howToHandle: 'Check `if (map.has(key))` first (or remove the existing node first) before checking capacity overflow.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_linked_lists_08', 'prac_linked_lists_10'],
    knowledgeCheck: {
      question: 'In an LRU Cache backed by a `Map` and a doubly-linked list, why must each doubly-linked node store both `node.key` and `node.val`?',
      options: [
        {
          id: 'll4_ok',
          label: 'Because when capacity overflows we evict `const lru = tail.prev`, and we need `lru.key` to delete its entry from the `Map` in O(1).',
          feedback: 'Correct! Without `lru.key` on the node, you would have to scan the entire `Map` to find which key pointed to `lru`.'
        },
        {
          id: 'll4_bad1',
          label: 'Because `get(key)` searches the linked list from `head` to `tail` using `node.key`.',
          feedback: '`get(key)` looks up the node in O(1) via `map.get(key)`, never by scanning the list.'
        },
        {
          id: 'll4_bad2',
          label: 'Because JavaScript Maps cannot store object references as values.',
          feedback: 'JavaScript Maps can store any object reference as a value.'
        }
      ],
      correctOptionId: 'll4_ok',
      explanation: 'Eviction starts at `tail.prev` in the list and must remove the corresponding key from the hash map in O(1).'
    },
    reflectionPrompt: 'How do permanent `head` and `tail` sentinel nodes eliminate every `if (node.prev !== null)` branch in doubly-linked list splicing?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) doubly-linked list sentinel design.',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_1_EXERCISES = [
  // ==================== EXERCISE 7: TWO POINTERS CONVERGING PAIR ====================
  {
    id: 'ex_two_pointers_01',
    topicId: 'topic_two_pointers',
    lessonId: 'les_two_pointers_01',
    title: 'Trace: Converging Two-Sum Pointers on Sorted Array',
    rendererType: 'array_pointers',
    objective: 'Step through converging `left` and `right` pointers and verify why each comparison eliminates an entire row or column of candidate pairs.',
    instructions: 'Inspect the sorted array, `left`, `right`, and `sum = nums[left] + nums[right]` at each step, then select the exact pointer transition.',
    codeLines: [
      'export function twoSumSorted(nums, target) {',
      '  let left = 0, right = nums.length - 1;',
      '  while (left < right) {',
      '    const sum = nums[left] + nums[right];',
      '    if (sum === target) return [left, right];',
      '    if (sum < target) left += 1;',
      '    else right -= 1;',
      '  }',
      '  return [-1, -1];',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Standard Sorted Target Search',
      inputLabel: 'nums = [2, 4, 6, 9, 13], target = 13',
      edgeCaseNote: 'Watch how `sum > target` eliminates `right` first, then `sum < target` eliminates `left`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 4,
          prompt: 'Start with `left = 0` (`2`) and `right = 4` (`13`). `sum = 2 + 13 = 15 > target (13)`. Which pointer moves and why?',
          stateSnapshot: {
            array: [2, 4, 6, 9, 13],
            pointers: { left: 0, right: 4 },
            activeRange: [0, 4],
            highlightedIndices: [0, 4],
            annotation: 'sum = 2 + 13 = 15 > 13. Since 2 is the smallest partner for 13, 13 is too large for every remaining index.'
          },
          choices: [
            {
              id: 'tp1_c1_ok',
              label: 'Decrement right to 3 (`9`), because 13 + any element >= 2 exceeds 13',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Index 4 (`13`) cannot pair with any index in `[0..3]` without exceeding `13`.'
            },
            {
              id: 'tp1_c1_bad',
              label: 'Increment left to 1 (`4`), to get closer to the middle',
              isCorrect: false,
              misconceptionFeedback: 'Incrementing `left` would increase `sum` to `4 + 13 = 17`, moving even further above `target = 13`!'
            }
          ],
          correctExplanation: 'Since `sum = 15 > 13`, `right` decrements to `3`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'Now `left = 0` (`2`) and `right = 3` (`9`). `sum = 2 + 9 = 11 < target (13)`. What happens next?',
          stateSnapshot: {
            array: [2, 4, 6, 9, 13],
            pointers: { left: 0, right: 3 },
            activeRange: [0, 3],
            highlightedIndices: [0, 3],
            annotation: 'sum = 2 + 9 = 11 < 13. Since 9 is the largest remaining partner, index 0 (2) is too small.'
          },
          choices: [
            {
              id: 'tp1_c2_ok',
              label: 'Increment left to 1 (`4`), because 2 + any remaining element <= 9 is at most 11 < 13',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Index 0 (`2`) is provably too small for all remaining partners in `[1..3]`.'
            },
            {
              id: 'tp1_c2_bad',
              label: 'Increment right back to 4 (`13`)',
              isCorrect: false,
              misconceptionFeedback: 'Index 4 (`13`) was already eliminated in Step 0; pointers never move outward.'
            }
          ],
          correctExplanation: '`sum = 11 < 13`, so `left` increments to `1`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 5,
          prompt: 'Now `left = 1` (`4`) and `right = 3` (`9`). What does line 5 evaluate?',
          stateSnapshot: {
            array: [2, 4, 6, 9, 13],
            pointers: { left: 1, right: 3 },
            activeRange: [1, 3],
            highlightedIndices: [1, 3],
            annotation: 'nums[1] + nums[3] = 4 + 9 = 13 === target.'
          },
          choices: [
            {
              id: 'tp1_c3_ok',
              label: 'sum === 13 matches target; immediately return [1, 3]',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! `[1, 3]` is returned in 3 comparisons instead of `O(n^2)`.'
            },
            {
              id: 'tp1_c3_bad',
              label: 'Continue shrinking until left === right === 2',
              isCorrect: false,
              misconceptionFeedback: 'Line 5 returns `[left, right]` as soon as `sum === target`.'
            }
          ],
          correctExplanation: '`4 + 9 === 13`, returning `[1, 3]`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'negative_numbers',
      label: 'Negative Numbers & Target Below Zero',
      inputLabel: 'nums = [-8, -3, 1, 4], target = -2',
      edgeCaseNote: 'Verifies that negative numbers obey the exact same sorted monotonicity.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Start `left = 0` (`-8`), `right = 3` (`4`). `sum = -8 + 4 = -4 < -2`. Which pointer moves?',
          stateSnapshot: {
            array: [-8, -3, 1, 4],
            pointers: { left: 0, right: 3 },
            activeRange: [0, 3],
            highlightedIndices: [0, 3],
            annotation: 'sum = -4 is strictly less than target = -2 (-4 < -2).'
          },
          choices: [
            {
              id: 'tp1_alt1_ok',
              label: 'left increments to 1 (`-3`), because -4 < -2 requires a larger sum',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Watch negative signs: `-4 < -2`, so we need a larger sum and move `left` rightward.'
            },
            {
              id: 'tp1_alt1_bad',
              label: 'right decrements to 2 (`1`), because |-4| > |-2|',
              isCorrect: false,
              misconceptionFeedback: 'Compare signed values (`-4 < -2`), never absolute magnitudes!'
            }
          ],
          correctExplanation: '`-4 < -2`, so `left` increments to `1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'Now `left = 1` (`-3`), `right = 3` (`4`). `sum = -3 + 4 = 1 > -2`. What happens next?',
          stateSnapshot: {
            array: [-8, -3, 1, 4],
            pointers: { left: 1, right: 3 },
            activeRange: [1, 3],
            highlightedIndices: [1, 3],
            annotation: 'sum = 1 > -2 -> right decrements to 2 (where -3 + 1 = -2).'
          },
          choices: [
            {
              id: 'tp1_alt2_ok',
              label: 'right decrements to 2 (`1`), and on the next check `-3 + 1 = -2` returns [1, 2]',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! `right = 2` pairs `-3` and `1` to hit `-2`.'
            },
            {
              id: 'tp1_alt2_bad',
              label: 'left increments to 2 (`1`)',
              isCorrect: false,
              misconceptionFeedback: 'Since `sum = 1 > -2`, we must decrease the sum by moving `right` left.'
            }
          ],
          correctExplanation: '`1 > -2` decrements `right` to `2`, where `-3 + 1 === -2`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'Why must the loop condition be `while (left < right)` instead of `while (left <= right)` in Two Sum II?',
      choices: [
        {
          id: 'ec_tp1_ok',
          label: 'Because `left === right` would sum `nums[left] + nums[left]`, illegally using the same array element twice when `2 * nums[left] === target`.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Two Sum requires two distinct indices `left < right`.'
        },
        {
          id: 'ec_tp1_bad',
          label: 'Because `left === right` causes an array index out-of-bounds exception.',
          isCorrect: false,
          misconceptionFeedback: 'The index is in bounds, but it pairs an element with itself.'
        }
      ],
      explanation: 'Strict inequality `left < right` guarantees the two chosen indices are distinct.'
    },
    referenceInvariant: 'For all discarded indices i < left and j > right, no partner in the remaining range can form target with them.',
    hintText: 'Ask whether `nums[left] + nums[right]` is smaller or larger than `target` on the signed number line.',
    reflectionPrompt: 'Why does sorting first (`O(n log n)`) + two pointers (`O(n)`) beat a hash map when you need `O(1)` auxiliary space or 3Sum?',
    sourceId: 'src_tih_mit',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 8: TWO POINTERS BOTTLENECK ====================
  {
    id: 'ex_two_pointers_02',
    topicId: 'topic_two_pointers',
    lessonId: 'les_two_pointers_03',
    title: 'Trace: Bottleneck Wall Elimination (Container With Most Water)',
    rendererType: 'array_pointers',
    objective: 'Trace how moving the shorter wall inward updates `best` area while safely pruning inferior containers.',
    instructions: 'At each step, compute `width * min(height[left], height[right])` and advance the bottleneck pointer.',
    codeLines: [
      'export function maxArea(height) {',
      '  let left = 0, right = height.length - 1, best = 0;',
      '  while (left < right) {',
      '    const area = (right - left) * Math.min(height[left], height[right]);',
      '    if (area > best) best = area;',
      '    if (height[left] <= height[right]) left += 1;',
      '    else right -= 1;',
      '  }',
      '  return best;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Outer Low Wall vs Inner Tall Pillars',
      inputLabel: 'height = [2, 8, 5, 7, 3]',
      edgeCaseNote: 'Both outer walls (`2` and `3`) are shorter than the inner pillars (`8` and `7`).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Start `left = 0` (`2`), `right = 4` (`3`). `width = 4`, `min(2, 3) = 2`, so `area = 8`. Which pointer moves?',
          stateSnapshot: {
            array: [2, 8, 5, 7, 3],
            pointers: { left: 0, right: 4 },
            activeRange: [0, 4],
            highlightedIndices: [0, 4],
            annotation: 'width = 4, height = min(2, 3) = 2 -> best = 8. Left wall (2) is the bottleneck.'
          },
          choices: [
            {
              id: 'tp2_c1_ok',
              label: 'best becomes 8, and left increments to 1 (`8`) because height[0] = 2 <= height[4] = 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Keeping index 0 (`2`) with any narrower width could only yield area `< 8`.'
            },
            {
              id: 'tp2_c1_bad',
              label: 'right decrements to 3 (`7`) because 7 is taller than 3',
              isCorrect: false,
              misconceptionFeedback: 'You cannot peek ahead to decide; even if `right` moved to `7`, `min(2, 7)` would still be capped at `2` with width `3` (`area = 6 < 8`)!'
            }
          ],
          correctExplanation: 'The shorter wall (`height[0] = 2`) is advanced to `left = 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'Now `left = 1` (`8`), `right = 4` (`3`). `width = 3`, `min(8, 3) = 3 -> area = 9`. What updates?',
          stateSnapshot: {
            array: [2, 8, 5, 7, 3],
            pointers: { left: 1, right: 4 },
            activeRange: [1, 4],
            highlightedIndices: [1, 4],
            annotation: 'width = 3, height = min(8, 3) = 3 -> best = 9. Now right wall (3) is the bottleneck.'
          },
          choices: [
            {
              id: 'tp2_c2_ok',
              label: 'best updates to 9, and right decrements to 3 (`7`) because height[4] = 3 < height[1] = 8',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Now the right wall (`3`) is the bottleneck, so `right` moves inward.'
            },
            {
              id: 'tp2_c2_bad',
              label: 'left increments to 2 (`5`)',
              isCorrect: false,
              misconceptionFeedback: 'Index 1 (`8`) is taller than index 4 (`3`); moving `left` would discard the tall `8` pillar!'
            }
          ],
          correctExplanation: '`best` becomes `9` and `right` decrements to `3`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 5,
          prompt: 'Now `left = 1` (`8`), `right = 3` (`7`). `width = 2`, `min(8, 7) = 7`. What is the new `best`?',
          stateSnapshot: {
            array: [2, 8, 5, 7, 3],
            pointers: { left: 1, right: 3 },
            activeRange: [1, 3],
            highlightedIndices: [1, 3],
            annotation: 'width = 2, height = min(8, 7) = 7 -> area = 14 > 9.'
          },
          choices: [
            {
              id: 'tp2_c3_ok',
              label: 'area = 2 * 7 = 14 updates best to 14, and right decrements to 2',
              isCorrect: true,
              misconceptionFeedback: 'Exact! The two inner tall pillars `[8, ..., 7]` hold area `14`.'
            },
            {
              id: 'tp2_c3_bad',
              label: 'area = 2 * 8 = 16',
              isCorrect: false,
              misconceptionFeedback: 'Water spills over the shorter wall `min(8, 7) = 7`, so height is `7`, not `8`.'
            }
          ],
          correctExplanation: '`2 * min(8, 7) = 14`, updating `best` to `14`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'wide_dominates',
      label: 'Wide Low Outer Walls Beat Narrow Tall Inner Walls',
      inputLabel: 'height = [4, 1, 10, 10, 1, 4]',
      edgeCaseNote: 'Outer `[4, ..., 4]` at width `5` (`area = 20`) vs inner `[10, 10]` at width `1` (`area = 10`).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'At `left = 0` (`4`), `right = 5` (`4`), `width = 5`. What is `area` and what happens on the tie `4 === 4`?',
          stateSnapshot: {
            array: [4, 1, 10, 10, 1, 4],
            pointers: { left: 0, right: 5 },
            activeRange: [0, 5],
            highlightedIndices: [0, 5],
            annotation: 'width = 5, height = min(4, 4) = 4 -> area = 20.'
          },
          choices: [
            {
              id: 'tp2_alt1_ok',
              label: 'best becomes 20, and left increments to 1 because height[0] <= height[5]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Neither wall can achieve `> 20` with any partner at a narrower width, so advancing `left` is completely safe.'
            },
            {
              id: 'tp2_alt1_bad',
              label: 'The algorithm must branch and try both directions recursively on a tie',
              isCorrect: false,
              misconceptionFeedback: 'No recursion needed! Any future container using ONLY `left=0` or ONLY `right=5` is still capped at height `4` with width `< 5`.'
            }
          ],
          correctExplanation: 'On a tie, moving either pointer is safe because neither tied wall can form a larger container with any inner wall.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 9,
          prompt: 'When the pointers eventually reach `left = 2` (`10`) and `right = 3` (`10`), `area = 1 * 10 = 10`. What is returned at the end?',
          stateSnapshot: {
            array: [4, 1, 10, 10, 1, 4],
            pointers: { left: 2, right: 3 },
            activeRange: [2, 3],
            highlightedIndices: [2, 3],
            annotation: 'Inner pillars give area = 1 * 10 = 10 < best (20).'
          },
          choices: [
            {
              id: 'tp2_alt2_ok',
              label: 'best remains 20 from the initial outer walls and 20 is returned',
              isCorrect: true,
              misconceptionFeedback: 'Right! `best` preserves the global maximum across all steps.'
            },
            {
              id: 'tp2_alt2_bad',
              label: '10 is returned because the loop ends on the tallest pillars',
              isCorrect: false,
              misconceptionFeedback: '`best` only updates when `area > best` (`10 < 20`).'
            }
          ],
          correctExplanation: 'The outer container (`20`) beats the narrow inner container (`10`).'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'When `height[left] === height[right]`, why doesn’t it matter whether you increment `left` or decrement `right`?',
      choices: [
        {
          id: 'ec_tp2_ok',
          label: 'Because any future container that keeps ONE of those tied walls and pairs it with an inner index has width `< right - left` and height `<= height[left]`, so neither wall can ever beat the current `(left, right)` area on its own.',
          isCorrect: true,
          misconceptionFeedback: 'Spot on! Only a container where BOTH walls are strictly taller than `height[left]` can beat `(left, right)`.'
        },
        {
          id: 'ec_tp2_bad',
          label: 'Because input arrays in Container With Most Water never contain duplicate heights.',
          isCorrect: false,
          misconceptionFeedback: 'Duplicate heights are very common (including the canonical example `[1,8,6,2,5,4,8,3,7]`).'
        }
      ],
      explanation: 'To beat a tied pair `(left, right)`, a narrower container must use two inner walls that are BOTH strictly taller than `height[left]`.'
    },
    referenceInvariant: 'At each step, moving the shorter wall discards only pairs whose width is smaller and whose height is bounded by that same shorter wall.',
    hintText: 'Always compare `height[left]` and `height[right]`: the smaller one limits the water level and must move inward.',
    reflectionPrompt: 'Why can’t a greedy algorithm that moves toward the larger adjacent neighbor (`height[left + 1]` vs `height[right - 1]`) find the global maximum area?',
    sourceId: 'src_nextstep_original',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 9: SLIDING WINDOW VARIABLE ====================
  {
    id: 'ex_sliding_window_01',
    topicId: 'topic_sliding_window',
    lessonId: 'les_sliding_window_02',
    title: 'Trace: Variable Window with Stale-Index Guard ("abba")',
    rendererType: 'sliding_window_state',
    objective: 'Trace `left`, `right`, and `lastSeen` on `"abba"` to see why `lastSeen.get(ch) >= left` prevents `left` from regressing.',
    instructions: 'Inspect the current window `[left..right]` and the `lastSeen` map at each character, then choose the valid state update.',
    codeLines: [
      'export function lengthOfLongestSubstring(s) {',
      '  const lastSeen = new Map();',
      '  let left = 0, best = 0;',
      '  for (let right = 0; right < s.length; right += 1) {',
      '    const ch = s[right];',
      '    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {',
      '      left = lastSeen.get(ch) + 1;',
      '    }',
      '    lastSeen.set(ch, right);',
      '    best = Math.max(best, right - left + 1);',
      '  }',
      '  return best;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'The Classic "abba" Stale-Map Trap',
      inputLabel: 's = "abba"',
      edgeCaseNote: 'At index 3 (`"a"`), `"a"` is in `lastSeen` at index 0, which is BEFORE `left = 2`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 9,
          prompt: 'After `right = 0` (`"a"`) and `right = 1` (`"b"`), what are `left`, `best`, and `lastSeen`?',
          stateSnapshot: {
            array: ['a', 'b', 'b', 'a'],
            pointers: { left: 0, right: 1 },
            activeRange: [0, 1],
            highlightedIndices: [0, 1],
            mapEntries: [
              { key: 'a', value: 0 },
              { key: 'b', value: 1 }
            ],
            windowMetric: 'len = 2, best = 2',
            annotation: 'Window "ab" [0..1] has no duplicates.'
          },
          choices: [
            {
              id: 'sw1_c1_ok',
              label: 'left = 0, best = 2, lastSeen = { a: 0, b: 1 }',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Both characters are unseen so far, expanding the window to `[0..1]`.'
            },
            {
              id: 'sw1_c1_bad',
              label: 'left = 1, best = 1',
              isCorrect: false,
              misconceptionFeedback: '`"a"` and `"b"` are distinct, so `left` remains at `0`.'
            }
          ],
          correctExplanation: 'Window `[0..1]` (`"ab"`) has length 2 and `lastSeen = { a: 0, b: 1 }`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'Now `right = 2` (`"b"`). `lastSeen.get("b")` is `1 >= left (0)`. How does the window update?',
          stateSnapshot: {
            array: ['a', 'b', 'b', 'a'],
            pointers: { left: 2, right: 2 },
            activeRange: [2, 2],
            highlightedIndices: [1, 2],
            mapEntries: [
              { key: 'a', value: 0 },
              { key: 'b', value: 2 }
            ],
            windowMetric: 'len = 1, best = 2',
            annotation: 'Duplicate "b" at index 1 forces left to jump to 1 + 1 = 2.'
          },
          choices: [
            {
              id: 'sw1_c2_ok',
              label: 'left jumps to 2 (`1 + 1`), lastSeen.set("b", 2), current window is "b" (len 1), best stays 2',
              isCorrect: true,
              misconceptionFeedback: 'Right! Jumping `left` past index 1 excludes the old `"b"`.'
            },
            {
              id: 'sw1_c2_bad',
              label: 'left increments to 1, leaving window "bb" of length 2',
              isCorrect: false,
              misconceptionFeedback: 'If `left = 1`, the window `[1..2]` still contains both `"b"`s!'
            }
          ],
          correctExplanation: '`left` becomes `lastSeen.get("b") + 1 = 2`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 6,
          prompt: 'Now `right = 3` (`"a"`). `lastSeen.get("a") = 0`, while `left = 2`. What does line 6 (`lastSeen.get(ch) >= left`) do?',
          stateSnapshot: {
            array: ['a', 'b', 'b', 'a'],
            pointers: { left: 2, right: 3 },
            activeRange: [2, 3],
            highlightedIndices: [2, 3],
            mapEntries: [
              { key: 'a', value: 3 },
              { key: 'b', value: 2 }
            ],
            windowMetric: 'len = 2, best = 2',
            annotation: 'lastSeen.get("a") = 0 < left (2), so index 0 is outside the active window!'
          },
          choices: [
            {
              id: 'sw1_c3_ok',
              label: 'Because 0 < 2, line 6 is false: left stays 2, window is "ba" [2..3] (len 2), and best = 2 is returned',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! The stale `"a"` at index 0 is already left of `left = 2` and must not pull `left` backward.'
            },
            {
              id: 'sw1_c3_bad',
              label: 'left updates to 0 + 1 = 1, making window "bba" of length 3',
              isCorrect: false,
              misconceptionFeedback: 'Moving `left` backward to `1` would re-introduce the duplicate `"b"` at index 1!'
            }
          ],
          correctExplanation: '`0 < 2` ignores the stale `"a"` outside the window, keeping `left = 2` and returning `2`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'all_identical',
      label: 'All Identical Characters',
      inputLabel: 's = "aaaa"',
      edgeCaseNote: 'Every step after index 0 triggers `left = right`, keeping window length at `1`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 7,
          prompt: 'At `right = 1` (`"a"`), `lastSeen.get("a") = 0 >= left (0)`. What do `left` and `best` become?',
          stateSnapshot: {
            array: ['a', 'a', 'a', 'a'],
            pointers: { left: 1, right: 1 },
            activeRange: [1, 1],
            highlightedIndices: [1],
            mapEntries: [{ key: 'a', value: 1 }],
            windowMetric: 'len = 1, best = 1',
            annotation: 'Duplicate "a" immediately advances left to 1.'
          },
          choices: [
            {
              id: 'sw1_alt1_ok',
              label: 'left becomes 1, window is [1..1] of length 1, and best stays 1',
              isCorrect: true,
              misconceptionFeedback: 'Correct! A string of identical characters never exceeds window length 1.'
            },
            {
              id: 'sw1_alt1_bad',
              label: 'left becomes 2 (empty window) and best becomes 0',
              isCorrect: false,
              misconceptionFeedback: '`left` becomes `0 + 1 = 1 === right`, which is a valid 1-character window `[1..1]`.'
            }
          ],
          correctExplanation: '`left` advances to `right` on each duplicate `"a"`, keeping `best = 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 11,
          prompt: 'After `right = 2` and `right = 3` finish on `"aaaa"`, what is returned?',
          stateSnapshot: {
            array: ['a', 'a', 'a', 'a'],
            pointers: { left: 3, right: 3 },
            activeRange: [3, 3],
            highlightedIndices: [3],
            mapEntries: [{ key: 'a', value: 3 }],
            windowMetric: 'len = 1, best = 1',
            annotation: 'Final window is [3..3], best = 1.'
          },
          choices: [
            {
              id: 'sw1_alt2_ok',
              label: 'Returns 1',
              isCorrect: true,
              misconceptionFeedback: 'Exact! Every single-character window has length 1.'
            },
            {
              id: 'sw1_alt2_bad',
              label: 'Returns 4',
              isCorrect: false,
              misconceptionFeedback: '`"aaaa"` has 4 characters total, but at most 1 unique character in any substring.'
            }
          ],
          correctExplanation: 'The longest unique-character substring of `"aaaa"` has length `1`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What is the worst-case time complexity of a variable sliding window that uses `while (set.has(s[right])) { set.delete(s[left]); left++; }` instead of jumping `left` with a `Map`?',
      choices: [
        {
          id: 'ec_sw1_ok',
          label: 'Still O(n) time! Even with a single-step `while` loop, `left` only increments from `0` to `n - 1` once across the entire run (at most `2n` set operations total).',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Both the `Set` shrink loop and the `Map` jump are `O(n)` time.'
        },
        {
          id: 'ec_sw1_bad',
          label: 'O(n^2) time because there is a `while` loop nested inside a `for` loop.',
          isCorrect: false,
          misconceptionFeedback: 'Nested loops are only `O(n^2)` if the inner pointer resets on each outer step; here `left` never moves backward!'
        }
      ],
      explanation: 'Because `left` is monotonically non-decreasing, the inner `while` body executes at most `n` times in total across all `n` outer iterations.'
    },
    referenceInvariant: 'At the end of iteration right, left is the minimum index such that s[left..right] contains all unique characters.',
    hintText: 'Check whether `lastSeen.get(ch)` is inside the current window (`>= left`) before moving `left`.',
    reflectionPrompt: 'Why is "amortized pointer monotonicity" (`left` never moves left) the single most important proof technique for sliding windows?',
    sourceId: 'src_tih_mit',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 10: SLIDING WINDOW FREQUENCY REPLACEMENT ====================
  {
    id: 'ex_sliding_window_02',
    topicId: 'topic_sliding_window',
    lessonId: 'les_sliding_window_03',
    title: 'Trace: Frequency-Constrained Window (`windowLen - maxFreq <= k`)',
    rendererType: 'sliding_window_state',
    objective: 'Trace how `(right - left + 1) - maxFreq` measures the minimum replacements needed to make `[left..right]` uniform.',
    instructions: 'Follow `counts`, `maxFreq`, and `replacementsNeeded = (right - left + 1) - maxFreq` at each step.',
    codeLines: [
      'export function characterReplacement(s, k) {',
      '  const counts = new Map();',
      '  let left = 0, maxFreq = 0, best = 0;',
      '  for (let right = 0; right < s.length; right += 1) {',
      '    const next = (counts.get(s[right]) || 0) + 1;',
      '    counts.set(s[right], next);',
      '    maxFreq = Math.max(maxFreq, next);',
      '    while ((right - left + 1) - maxFreq > k) {',
      '      counts.set(s[left], counts.get(s[left]) - 1);',
      '      left += 1;',
      '    }',
      '    best = Math.max(best, right - left + 1);',
      '  }',
      '  return best;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Replacing Minority Character (k = 1)',
      inputLabel: 's = "AABAB", k = 1',
      edgeCaseNote: 'When the second `"B"` arrives at index 4, `5 - 3 = 2 > k` forces `left` to advance.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'After scanning indices `0..2` (`"AAB"`), `right = 2`. `counts = { A: 2, B: 1 }`, `maxFreq = 2`. Is `[0..2]` valid for `k = 1`?',
          stateSnapshot: {
            array: ['A', 'A', 'B', 'A', 'B'],
            pointers: { left: 0, right: 2 },
            activeRange: [0, 2],
            highlightedIndices: [0, 1, 2],
            mapEntries: [
              { key: 'A', value: 2 },
              { key: 'B', value: 1 }
            ],
            windowMetric: 'len = 3, maxFreq = 2, replace = 1 <= k',
            annotation: '3 - 2 = 1 minority character ("B") can be replaced using k = 1.'
          },
          choices: [
            {
              id: 'sw2_c1_ok',
              label: 'Valid! (3 - 2 = 1 <= 1), so left stays 0 and best becomes 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Replacing the single `"B"` turns `"AAB"` into `"AAA"`.'
            },
            {
              id: 'sw2_c1_bad',
              label: 'Invalid because "B" !== "A", so left shrinks to 2',
              isCorrect: false,
              misconceptionFeedback: 'We are allowed `k = 1` replacement, so 1 minority character is permitted.'
            }
          ],
          correctExplanation: '`windowLen (3) - maxFreq (2) = 1 <= k (1)`, so `best` becomes `3`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 12,
          prompt: 'At `right = 3` (`"A"`), window is `"AABA"` (`[0..3]`). What are `maxFreq` and `best`?',
          stateSnapshot: {
            array: ['A', 'A', 'B', 'A', 'B'],
            pointers: { left: 0, right: 3 },
            activeRange: [0, 3],
            highlightedIndices: [0, 1, 2, 3],
            mapEntries: [
              { key: 'A', value: 3 },
              { key: 'B', value: 1 }
            ],
            windowMetric: 'len = 4, maxFreq = 3, replace = 1 <= k',
            annotation: '4 - 3 = 1 <= 1 -> valid 4-character window!'
          },
          choices: [
            {
              id: 'sw2_c2_ok',
              label: 'maxFreq updates to 3 (for "A"), 4 - 3 = 1 <= 1 is valid, and best updates to 4',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Three `"A"`s and one `"B"` need only 1 replacement.'
            },
            {
              id: 'sw2_c2_bad',
              label: 'maxFreq stays 2 and left shrinks to 1',
              isCorrect: false,
              misconceptionFeedback: '`counts.get("A")` becomes 3, raising `maxFreq` to 3.'
            }
          ],
          correctExplanation: '`maxFreq = 3` and `best = 4`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 9,
          prompt: 'At `right = 4` (`"B"`), window `[0..4]` (`"AABAB"`) has `len = 5`, `counts = { A: 3, B: 2 }`, `maxFreq = 3`. Since `5 - 3 = 2 > k (1)`, what happens?',
          stateSnapshot: {
            array: ['A', 'A', 'B', 'A', 'B'],
            pointers: { left: 1, right: 4 },
            activeRange: [1, 4],
            highlightedIndices: [1, 2, 3, 4],
            mapEntries: [
              { key: 'A', value: 2 },
              { key: 'B', value: 2 }
            ],
            windowMetric: 'len = 4, maxFreq = 3, best = 4',
            annotation: '5 - 3 = 2 > 1 -> decrement counts[s[0]] ("A") and increment left to 1.'
          },
          choices: [
            {
              id: 'sw2_c3_ok',
              label: 'counts["A"] decrements to 2, left advances to 1 (window len 4), and best remains 4',
              isCorrect: true,
              misconceptionFeedback: 'Exact! The window shifts from `[0..3]` to `[1..4]`, maintaining size 4.'
            },
            {
              id: 'sw2_c3_bad',
              label: 'left resets to 4 and counts is cleared',
              isCorrect: false,
              misconceptionFeedback: 'Sliding windows shrink incrementally from `left`; they never clear the whole map.'
            }
          ],
          correctExplanation: '`left` increments to `1`, keeping window length at `4` and returning `best = 4`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'zero_replacements',
      label: 'Zero Replacements Allowed (k = 0)',
      inputLabel: 's = "AAAB", k = 0',
      edgeCaseNote: 'When `k = 0`, any character different from the majority triggers shrinking until the window is pure.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'After `"AAA"` (`right = 0..2`), `maxFreq = 3, best = 3`. Now `right = 3` (`"B"`) enters with `k = 0`. What is `(4 - 3) > 0`?',
          stateSnapshot: {
            array: ['A', 'A', 'A', 'B'],
            pointers: { left: 1, right: 3 },
            activeRange: [1, 3],
            highlightedIndices: [1, 2, 3],
            mapEntries: [
              { key: 'A', value: 2 },
              { key: 'B', value: 1 }
            ],
            windowMetric: 'len = 3, maxFreq = 3, k = 0',
            annotation: '4 - 3 = 1 > 0 -> left advances to 1, keeping best = 3.'
          },
          choices: [
            {
              id: 'sw2_alt1_ok',
              label: '4 - 3 = 1 > 0 triggers the shrink step (left becomes 1), and best stays 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! With `k = 0`, `"AAAB"` cannot expand the valid window size beyond `3`.'
            },
            {
              id: 'sw2_alt1_bad',
              label: 'best becomes 4 because maxFreq is 3',
              isCorrect: false,
              misconceptionFeedback: 'With `k = 0`, `4 - 3 = 1 > 0` is invalid and shrinks `left` before `best` is updated.'
            }
          ],
          correctExplanation: 'Shrinking `left` to `1` keeps `right - left + 1 = 3`, so `best` stays `3`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 14,
          prompt: 'What value does `characterReplacement("AAAB", 0)` return?',
          stateSnapshot: {
            array: ['A', 'A', 'A', 'B'],
            pointers: { left: 1, right: 3 },
            activeRange: [1, 3],
            highlightedIndices: [0, 1, 2],
            mapEntries: [
              { key: 'A', value: 2 },
              { key: 'B', value: 1 }
            ],
            windowMetric: 'best = 3',
            annotation: 'Longest contiguous homogeneous run has length 3.'
          },
          choices: [
            {
              id: 'sw2_alt2_ok',
              label: 'Returns 3 (from "AAA")',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! The three consecutive "A"s require 0 replacements.'
            },
            {
              id: 'sw2_alt2_bad',
              label: 'Returns 0 because k = 0',
              isCorrect: false,
              misconceptionFeedback: '`k = 0` still allows arbitrarily long runs of identical characters (`"AAA"` -> 3).'
            }
          ],
          correctExplanation: '`"AAA"` requires 0 replacements and has length 3.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'Why does `characterReplacement` still return the exact maximum valid window length even if `maxFreq` is NOT decremented when `left` shrinks?',
      choices: [
        {
          id: 'ec_sw2_ok',
          label: 'Because `best` only ever grows when a future window finds a strictly larger `maxFreq` (`newMaxFreq + k`); keeping historical `maxFreq` merely prevents the sliding frame from shrinking smaller than `best`.',
          isCorrect: true,
          misconceptionFeedback: 'Spot on! We only care about windows LONGER than `best`, which requires a new character frequency to beat the historical `maxFreq`.'
        },
        {
          id: 'ec_sw2_bad',
          label: 'Because `s[left]` is never the majority character.',
          isCorrect: false,
          misconceptionFeedback: '`s[left]` often IS the majority character (as in `"AABAB"` at `left = 0`), yet historical `maxFreq` remains sound for max-length queries.'
        }
      ],
      explanation: 'A window of length `L > best` is valid if and only if it contains some character with frequency `L - k > historicalMaxFreq`, which will update `maxFreq` anyway.'
    },
    referenceInvariant: 'The maximum valid window length equals max(maxFreq + k) capped at s.length across all windows.',
    hintText: 'Compute `windowLen = right - left + 1`; if `windowLen - maxFreq > k`, you have too many minority characters and must advance `left`.',
    reflectionPrompt: 'When would you NEED to maintain the exact current window frequency (or `formed` counter) instead of a historical `maxFreq`?',
    sourceId: 'src_nextstep_original',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 11: LINKED LIST 3-POINTER REVERSAL ====================
  {
    id: 'ex_linked_lists_01',
    topicId: 'topic_linked_lists',
    lessonId: 'les_linked_lists_02',
    title: 'Trace: Iterative Three-Pointer Linked List Reversal',
    rendererType: 'linked_list_links',
    objective: 'Trace `prev`, `curr`, and `nextTemp` across each node flip to verify that the unvisited suffix is never orphaned.',
    instructions: 'Inspect the linked list nodes and pointer references at each step, then select the exact pointer rewiring outcome.',
    codeLines: [
      'export function reverseList(head) {',
      '  let prev = null;',
      '  let curr = head;',
      '  while (curr !== null) {',
      '    const nextTemp = curr.next;',
      '    curr.next = prev;',
      '    prev = curr;',
      '    curr = nextTemp;',
      '  }',
      '  return prev;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Three-Node Reversal (10 -> 20 -> 30)',
      inputLabel: 'head = 10 -> 20 -> 30 -> null',
      edgeCaseNote: 'Watch `10.next` flip to `null` first, then `20.next` flip to `10`, then `30.next` flip to `20`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Iteration 1 starts with `prev = null`, `curr = 10`. After `nextTemp = curr.next` (`20`) and `curr.next = prev`, what are the links and where do `prev` and `curr` advance?',
          stateSnapshot: {
            nodes: [
              { id: 'n10', label: '10', next: 'null', highlight: true },
              { id: 'n20', label: '20', next: '30', highlight: true },
              { id: 'n30', label: '30', next: 'null', highlight: false }
            ],
            pointers: { prev: '10', curr: '20', nextTemp: '20' },
            annotation: '10.next now points to null; prev advances to 10; curr advances to 20.'
          },
          choices: [
            {
              id: 'll1_c1_ok',
              label: '10.next becomes null, prev becomes 10, and curr becomes 20 (via nextTemp)',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Saving `nextTemp = 20` before setting `10.next = null` keeps the suffix `20 -> 30` reachable.'
            },
            {
              id: 'll1_c1_bad',
              label: '10.next becomes 20, prev becomes 20, and curr becomes 30',
              isCorrect: false,
              misconceptionFeedback: '`10` is the original head and becomes the new tail, so `10.next` must point to `prev` (`null`).'
            }
          ],
          correctExplanation: 'After Step 1: reversed prefix is `10 -> null` (`prev = 10`), and remaining suffix is `20 -> 30 -> null` (`curr = 20`).'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'Iteration 2 starts with `prev = 10`, `curr = 20`. What holds at the end of Iteration 2?',
          stateSnapshot: {
            nodes: [
              { id: 'n10', label: '10', next: 'null', highlight: false },
              { id: 'n20', label: '20', next: '10', highlight: true },
              { id: 'n30', label: '30', next: 'null', highlight: true }
            ],
            pointers: { prev: '20', curr: '30', nextTemp: '30' },
            annotation: '20.next flips to 10; prev advances to 20; curr advances to 30.'
          },
          choices: [
            {
              id: 'll1_c2_ok',
              label: 'nextTemp saves 30, 20.next flips to 10, prev advances to 20, and curr advances to 30',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! The reversed prefix is now `20 -> 10 -> null`.'
            },
            {
              id: 'll1_c2_bad',
              label: '20.next flips to null and 10 is lost',
              isCorrect: false,
              misconceptionFeedback: '`prev` is `10` (not `null`), so `curr.next = prev` wires `20.next = 10`.'
            }
          ],
          correctExplanation: 'Node 20 now points backward to 10 (`20 -> 10 -> null`), while `curr` moves to `30`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 10,
          prompt: 'Iteration 3 starts with `prev = 20`, `curr = 30` (`30.next = null`). How does the loop finish?',
          stateSnapshot: {
            nodes: [
              { id: 'n30', label: '30', next: '20', highlight: true },
              { id: 'n20', label: '20', next: '10', highlight: false },
              { id: 'n10', label: '10', next: 'null', highlight: false }
            ],
            pointers: { prev: '30', curr: 'null', nextTemp: 'null' },
            annotation: '30.next flips to 20; prev = 30; curr = null exits loop and returns prev (30).'
          },
          choices: [
            {
              id: 'll1_c3_ok',
              label: '30.next flips to 20, prev becomes 30, curr becomes null, and line 10 returns prev (30 -> 20 -> 10 -> null)',
              isCorrect: true,
              misconceptionFeedback: 'Exact! When `curr` becomes `null`, `prev` holds the new head `30`.'
            },
            {
              id: 'll1_c3_bad',
              label: 'Line 10 returns curr, which is null',
              isCorrect: false,
              misconceptionFeedback: '`curr` is `null` when the loop terminates; you must return `prev`!'
            }
          ],
          correctExplanation: 'Returning `prev` yields the reversed list `30 -> 20 -> 10 -> null`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'single_node',
      label: 'Single-Node List (42 -> null)',
      inputLabel: 'head = 42 -> null',
      edgeCaseNote: 'Verifies that a 1-node list executes 1 clean iteration and returns `42 -> null` without self-cycles.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'On `head = 42 -> null`, `prev = null, curr = 42`. What happens in the single iteration?',
          stateSnapshot: {
            nodes: [{ id: 'n42', label: '42', next: 'null', highlight: true }],
            pointers: { prev: '42', curr: 'null', nextTemp: 'null' },
            annotation: 'nextTemp = null; 42.next = null; prev = 42; curr = null.'
          },
          choices: [
            {
              id: 'll1_alt1_ok',
              label: 'nextTemp is null, 42.next stays null, prev becomes 42, curr becomes null',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Zero special-case branches needed for a 1-element list.'
            },
            {
              id: 'll1_alt1_bad',
              label: '42.next becomes 42 (self-loop)',
              isCorrect: false,
              misconceptionFeedback: 'Because `prev` started at `null`, `42.next = prev` sets `42.next = null`.'
            }
          ],
          correctExplanation: '`prev` becomes `42` and `curr` becomes `null`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 10,
          prompt: 'Now `curr === null` exits the `while` loop. What is returned?',
          stateSnapshot: {
            nodes: [{ id: 'n42', label: '42', next: 'null', highlight: true }],
            pointers: { prev: '42', curr: 'null' },
            annotation: 'Returns prev = 42 -> null.'
          },
          choices: [
            {
              id: 'll1_alt2_ok',
              label: 'Returns prev (node 42 with next === null)',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Node 42 is returned as the reversed head.'
            },
            {
              id: 'll1_alt2_bad',
              label: 'Returns null',
              isCorrect: false,
              misconceptionFeedback: '`prev` points to node `42`.'
            }
          ],
          correctExplanation: 'Node `42` is returned intact.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'When reversing a sublist inside a larger list (e.g., second half of `Reorder List` or `Palindrome Linked List`), what happens if you forget to sever `firstHalfTail.next = null` or fail to initialize `prev = null`?',
      choices: [
        {
          id: 'ec_ll1_ok',
          label: 'The last node of the first half still points into the old head of the second half, creating a bidirectional cycle between the two halves.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Always terminate the tail of each split sublist with `.next = null`.'
        },
        {
          id: 'ec_ll1_bad',
          label: 'The garbage collector automatically breaks the link.',
          isCorrect: false,
          misconceptionFeedback: 'GC never mutates live `.next` references; an unsevered link causes an infinite traversal loop.'
        }
      ],
      explanation: 'Splitting a list into two independent chains requires setting `slow.next = null` before reversing the second half.'
    },
    referenceInvariant: 'At the start of each loop iteration, prev is the reversed prefix (terminated by null) and curr is the unreversed suffix.',
    hintText: 'Follow the cyclic assignment chain: `nextTemp` reads `curr.next`, `curr.next` reads `prev`, `prev` reads `curr`, `curr` reads `nextTemp`.',
    reflectionPrompt: 'How does drawing the gap between `prev` and `curr` make it impossible to forget `const nextTemp = curr.next`?',
    sourceId: 'src_ods_cc_by',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

function createPracticeItem({
  id,
  topicId,
  lessonIds,
  title,
  externalSlug,
  pattern,
  difficulty,
  estimatedMinutes,
  whyRecommended,
  keyEdgeCase
}) {
  return {
    id,
    topicId,
    lessonIds,
    title,
    provider: 'LeetCode',
    externalSlug,
    url: `https://leetcode.com/problems/${externalSlug}/`,
    pattern,
    difficulty,
    difficultySource: 'provider_verified',
    estimatedMinutes,
    whyRecommended,
    keyEdgeCase,
    verificationMode: 'self_reported',
    sourceId: 'src_leetcode_studyplan_ext',
    packId: 'pack_expansion_batch1_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  };
}

export const EXPANSION_BATCH_1_PRACTICE = [
  // ==================== TWO POINTERS (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_two_pointers_01',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_01'],
    title: 'Two Sum II - Input Array Is Sorted',
    externalSlug: 'two-sum-ii-input-array-is-sorted',
    pattern: 'Converging Sorted Pair Search (`left < right`)',
    difficulty: 'Medium',
    estimatedMinutes: 15,
    whyRecommended: 'Direct application of Lesson 1’s converging pointer elimination proof in O(1) space.',
    keyEdgeCase: '1-indexed return format (`[left + 1, right + 1]`) and negative numbers in the sorted input.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_02',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_01'],
    title: 'Valid Palindrome',
    externalSlug: 'valid-palindrome',
    pattern: 'Converging Pointers with Non-Alphanumeric Skip Loops',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Practices advancing `left` and `right` past punctuation/spaces while maintaining `left < right`.',
    keyEdgeCase: 'String containing only non-alphanumeric symbols (`".,! "`), where `left` meets `right` and returns `true`.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_03',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_02'],
    title: '3Sum',
    externalSlug: '3sum',
    pattern: 'Sorted Anchor + Converging Pointers with Duplicate Skips',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'The canonical benchmark for Lesson 2: anchor duplicate skip (`i > 0 && nums[i] === nums[i-1]`) plus inner pair duplicate skips.',
    keyEdgeCase: 'All-zero input `[0, 0, 0, 0]` must emit `[[0, 0, 0]]` exactly once.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_04',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_02'],
    title: '3Sum Closest',
    externalSlug: '3sum-closest',
    pattern: 'Sorted Anchor + Converging Pointers Minimizing `|sum - target|`',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Adapts the 3Sum two-pointer sweep to track minimum absolute delta while still moving `left`/`right` by signed comparison `sum < target`.',
    keyEdgeCase: 'Exact hit `sum === target` allows immediate early return.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_05',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_03'],
    title: 'Container With Most Water',
    externalSlug: 'container-with-most-water',
    pattern: 'Bottleneck Wall Elimination (`height[left] <= height[right]`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies the bottleneck proof from Lesson 3 and Exercise 8.',
    keyEdgeCase: 'Equal heights `height[left] === height[right]` where inner walls are much taller.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_06',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_03'],
    title: 'Trapping Rain Water',
    externalSlug: 'trapping-rain-water',
    pattern: 'Converging Pointers with Running `leftMax` and `rightMax` Bottleneck',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    whyRecommended: 'Extends bottleneck reasoning: whenever `leftMax <= rightMax`, water at `left` is determined solely by `leftMax - height[left]`.',
    keyEdgeCase: 'Monotonically increasing or decreasing bars (or fewer than 3 bars) trap `0` water.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_07',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_04'],
    title: 'Sort Colors',
    externalSlug: 'sort-colors',
    pattern: 'Dutch National Flag 3-Way Partition (`low`, `mid`, `high`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Direct implementation of Lesson 4’s 4-region invariant in one pass and O(1) space.',
    keyEdgeCase: 'Swapping `nums[mid] === 2` with `nums[high]` when `nums[high]` is `0` or `2` (do not increment `mid`!).'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_08',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_01'],
    title: 'Squares of a Sorted Array',
    externalSlug: 'squares-of-a-sorted-array',
    pattern: 'Outside-In Extremum Merge (`|nums[left]|` vs `|nums[right]|`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Shows that squaring a sorted array with negatives creates a V-shape whose largest values sit at the two ends, filling the output from `n - 1` down to `0`.',
    keyEdgeCase: 'All negative numbers `[-7, -3, -1]` where `left` always wins.'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_09',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_03'],
    title: 'Boats to Save People',
    externalSlug: 'boats-to-save-people',
    pattern: 'Greedy Heaviest + Lightest Pairing (`people[left] + people[right] <= limit`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Pairs the heaviest remaining person `right` with the lightest `left` if they fit together, otherwise puts `right` in their own boat.',
    keyEdgeCase: 'Final remaining person when `left === right` (`while (left <= right)`).'
  }),
  createPracticeItem({
    id: 'prac_two_pointers_10',
    topicId: 'topic_two_pointers',
    lessonIds: ['les_two_pointers_02'],
    title: '4Sum',
    externalSlug: '4sum',
    pattern: 'Two Nested Duplicate-Safe Anchors + Converging Two Pointers',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    whyRecommended: 'Generalizes 3Sum’s duplicate-skipping invariant to `k = 4` (`i > 0` and `j > i + 1` duplicate guards).',
    keyEdgeCase: 'Large positive/negative values near `10^9` where `nums[i] === nums[i - 1]` must be checked per loop level (`j > i + 1`).'
  }),

  // ==================== SLIDING WINDOW (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_sliding_window_01',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_01'],
    title: 'Maximum Average Subarray I',
    externalSlug: 'maximum-average-subarray-i',
    pattern: 'Fixed-Size Window O(1) Delta (`+= nums[i] - nums[i - k]`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Direct application of Lesson 1’s fixed-length rolling sum.',
    keyEdgeCase: 'Single-window array of negative values (`[-1]`, `k = 1`) where `maxSum` must start at `windowSum`, not `0`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_02',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_02'],
    title: 'Longest Substring Without Repeating Characters',
    externalSlug: 'longest-substring-without-repeating-characters',
    pattern: 'Variable Window with `lastSeen` Index Map (`lastSeen.get(ch) >= left`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'The signature benchmark for Lesson 2 and Exercise 9.',
    keyEdgeCase: '`"abba"` where stale index `0` for `"a"` lies to the left of `left = 2`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_03',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_02'],
    title: 'Minimum Size Subarray Sum',
    externalSlug: 'minimum-size-subarray-sum',
    pattern: 'Variable Window Shrinking While Valid (`while (sum >= target)`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Practices the shortest-valid-window variant where `best` is updated INSIDE the `while (windowSum >= target)` loop before shrinking `left`.',
    keyEdgeCase: 'Total sum of entire array `< target`, which must return `0` (not `Infinity`).'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_04',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_03'],
    title: 'Longest Repeating Character Replacement',
    externalSlug: 'longest-repeating-character-replacement',
    pattern: 'Majority-Character Window (`(right - left + 1) - maxFreq <= k`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly applies Lesson 3 and Exercise 10.',
    keyEdgeCase: '`k = 0` or `k >= s.length`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_05',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_01', 'les_sliding_window_03'],
    title: 'Permutation in String',
    externalSlug: 'permutation-in-string',
    pattern: 'Fixed-Length `|s1|` Window with 26-Slot Match Counter',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Combines Lesson 1’s fixed window size `s1.length` with Lesson 3’s O(1) frequency-match counter.',
    keyEdgeCase: '`s1.length > s2.length`, which must immediately return `false`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_06',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_01', 'les_sliding_window_03'],
    title: 'Find All Anagrams in a String',
    externalSlug: 'find-all-anagrams-in-a-string',
    pattern: 'Fixed-Length `|p|` Rolling Frequency Window',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Collects every start index `left = right - p.length + 1` where the rolling window frequency matches `p`.',
    keyEdgeCase: 'Overlapping anagrams such as `s = "abab", p = "ab"` returning `[0, 1, 2]`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_07',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_03'],
    title: 'Minimum Window Substring',
    externalSlug: 'minimum-window-substring',
    pattern: 'Variable Window with `formed === requiredDistinct` Threshold Counter',
    difficulty: 'Hard',
    estimatedMinutes: 35,
    whyRecommended: 'Tests exact threshold counting (`windowCounts.get(ch) === targetCounts.get(ch)`) during expansion and contraction.',
    keyEdgeCase: '`t` contains duplicate characters (`t = "AABC"`) or no valid window exists (`""`).'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_08',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_02'],
    title: 'Max Consecutive Ones III',
    externalSlug: 'max-consecutive-ones-iii',
    pattern: 'Variable Window Bounded by `zeroCount <= k`',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Cleanest binary-state variable window: increment `zeroCount` when `nums[right] === 0` and shrink `left` while `zeroCount > k`.',
    keyEdgeCase: '`k = 0` on an array of all `0`s (`[0, 0, 0]` -> `0`).'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_09',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_03'],
    title: 'Fruit Into Baskets',
    externalSlug: 'fruit-into-baskets',
    pattern: 'Longest Subarray with At Most 2 Distinct Values (`freq.size <= 2`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Translates a wordy story problem directly into "longest contiguous subarray with `freq.size <= 2`".',
    keyEdgeCase: 'Deleting a fruit type from `freq` (`freq.delete(x)`) only when its window count drops all the way to `0`.'
  }),
  createPracticeItem({
    id: 'prac_sliding_window_10',
    topicId: 'topic_sliding_window',
    lessonIds: ['les_sliding_window_04'],
    title: 'Subarrays with K Different Integers',
    externalSlug: 'subarrays-with-k-different-integers',
    pattern: 'Exact-K Decomposition: `atMost(k) - atMost(k - 1)`',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    whyRecommended: 'Direct application of Lesson 4’s `atMostKDistinct(nums, k) - atMostKDistinct(nums, k - 1)` identity.',
    keyEdgeCase: '`k = 1` where `atMost(0)` must return `0`.'
  }),

  // ==================== LINKED LISTS (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_linked_lists_01',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_02'],
    title: 'Reverse Linked List',
    externalSlug: 'reverse-linked-list',
    pattern: 'Iterative 3-Pointer Reversal (`prev`, `curr`, `nextTemp`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Foundational drill for Lesson 2 and Exercise 11.',
    keyEdgeCase: '`head = null` and 1-node list `1 -> null`.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_02',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_01'],
    title: 'Merge Two Sorted Lists',
    externalSlug: 'merge-two-sorted-lists',
    pattern: 'Sentinel Dummy Head + Tail Splice',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Directly applies Lesson 1’s sentinel dummy node pattern.',
    keyEdgeCase: 'One or both input lists are `null`.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_03',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_03'],
    title: 'Linked List Cycle',
    externalSlug: 'linked-list-cycle',
    pattern: 'Floyd Tortoise & Hare Collision Check (`slow === fast`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Verifies `while (fast !== null && fast.next !== null)` ordering and reference equality.',
    keyEdgeCase: '1-node list with no cycle vs 1-node self-cycle.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_04',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_03'],
    title: 'Linked List Cycle II',
    externalSlug: 'linked-list-cycle-ii',
    pattern: 'Two-Phase Floyd Cycle Entrance Finder (`finder = head`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Applies the Phase 2 pointer-reset proof from Lesson 3 to find the exact node where the cycle begins.',
    keyEdgeCase: 'Cycle begins at `head` itself (`pos = 0`), so `finder === slow` is true before Phase 2 even steps.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_05',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_03'],
    title: 'Middle of the Linked List',
    externalSlug: 'middle-of-the-linked-list',
    pattern: 'Fast/Slow Midpoint Runner',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Demonstrates that `while (fast !== null && fast.next !== null)` naturally lands `slow` on the second middle node for even-length lists.',
    keyEdgeCase: '2-node list `[1, 2]` returning node `2`.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_06',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_01'],
    title: 'Remove Nth Node From End of List',
    externalSlug: 'remove-nth-node-from-end-of-list',
    pattern: 'Sentinel Dummy + Fixed `n + 1` Lead-Gap Runner',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Combines a fixed-gap two-pointer runner with a `dummy` sentinel to handle deleting the head node (`n === length`).',
    keyEdgeCase: 'Deleting the only node in a 1-node list (`[1], n = 1` -> `null`).'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_07',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_02', 'les_linked_lists_03'],
    title: 'Reorder List',
    externalSlug: 'reorder-list',
    pattern: 'Midpoint Split + Second-Half 3-Pointer Reversal + Alternating Zip',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Master synthesis problem combining Floyd midpoint, severing `slow.next = null`, 3-pointer reversal, and two-list interleaving.',
    keyEdgeCase: 'Forgetting `slow.next = null` before reversing the second half creates a cycle.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_08',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_04'],
    title: 'Copy List with Random Pointer',
    externalSlug: 'copy-list-with-random-pointer',
    pattern: 'Old-to-Clone Node Map (or Interleaved `A -> A\'` Weaving)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Tests mapping arbitrary node references (`random`) without duplicating nodes or failing on self-loops.',
    keyEdgeCase: '`node.random === node` (self-pointing random pointer) and `head = null`.'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_09',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_01'],
    title: 'Add Two Numbers',
    externalSlug: 'add-two-numbers',
    pattern: 'Sentinel Dummy + Carry-Propagating Lockstep Walk',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Practices `while (l1 !== null || l2 !== null || carry > 0)` with a dummy head.',
    keyEdgeCase: 'Final carry after both lists end (`99 + 1 = 100`, requiring an extra tail node `1`).'
  }),
  createPracticeItem({
    id: 'prac_linked_lists_10',
    topicId: 'topic_linked_lists',
    lessonIds: ['les_linked_lists_04'],
    title: 'LRU Cache',
    externalSlug: 'lru-cache',
    pattern: 'Hash Map + Sentinel-Bounded Doubly-Linked List',
    difficulty: 'Medium',
    estimatedMinutes: 35,
    whyRecommended: 'The gold-standard systems + data-structure synthesis problem from Lesson 4.',
    keyEdgeCase: 'Updating an existing key via `put(k, v)` when already at full capacity must NOT evict `tail.prev`.'
  })
];
