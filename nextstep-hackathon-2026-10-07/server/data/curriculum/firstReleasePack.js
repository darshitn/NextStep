const STANDARD_REVIEW_RECORD = {
  pipelineStagesCompleted: ['draft', 'source_check', 'technical_validation', 'editorial_review', 'published'],
  reviewerType: 'same_agent_automated_and_editorial_review',
  independentlyReviewed: false,
  verifiedAt: '2026-10-17',
  reviewNotes: 'Automated schema, deterministic state-trace, reference integrity, and editorial quality checks passed.'
};

export const FIRST_RELEASE_PACK_METADATA = {
  id: 'pack_first_release_v1',
  version: '1.0.0',
  title: 'NextStep Core Foundations: Arrays, Hashing & Binary Search',
  releaseStage: 'first_release',
  publishedAt: '2026-10-17',
  topicIds: ['topic_arrays', 'topic_hashing', 'topic_binary_search'],
  reviewStatus: 'published'
};

export const FIRST_RELEASE_TOPICS = [
  {
    id: 'topic_arrays',
    slug: 'arrays',
    title: 'Arrays & Prefix Invariants',
    shortDescription: 'Master contiguous memory indexing, running prefix/suffix state, in-place compaction, and boundary-safe traversal invariants.',
    whyItMatters: 'Arrays underpin nearly every interview and systems problem; clear loop invariants prevent off-by-one bugs and turn O(n^2) scans into single-pass O(n) pipelines.',
    order: 1,
    lane: 1,
    estimatedMinutes: 90,
    prerequisites: [],
    starterMissionIds: ['m01'],
    keyPatterns: ['Running Prefix / Suffix State', 'In-Place Read/Write Pointers', 'Cyclic & Stride Indexing', 'Cadence & Subarray Invariants'],
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_hashing',
    slug: 'hashing',
    title: 'Hash Maps, Sets & Canonical Keys',
    shortDescription: 'Trade O(n) space for O(1) expected lookups using complement maps, frequency tables, structural signatures, and prefix-sum index maps.',
    whyItMatters: 'When nested loops waste time re-scanning history, a well-chosen hash key captures exactly the past state you need in constant expected time.',
    order: 2,
    lane: 2,
    estimatedMinutes: 95,
    prerequisites: ['topic_arrays'],
    starterMissionIds: ['m02'],
    keyPatterns: ['Complement Lookup Before Insert', 'Frequency & Balance Counters', 'Canonical Equivalence Keys', 'Prefix-Sum Earliest Index Map'],
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_binary_search',
    slug: 'binary-search',
    title: 'Binary Search & Monotonic Boundaries',
    shortDescription: 'Eliminate half the search space every step using strict half-open or closed interval invariants over sorted arrays and monotonic predicates.',
    whyItMatters: 'Binary search is notorious for infinite loops and off-by-one errors; treating it as finding the first index where a boolean predicate flips makes it rock-solid.',
    order: 3,
    lane: 3,
    estimatedMinutes: 100,
    prerequisites: ['topic_arrays'],
    starterMissionIds: ['m05'],
    keyPatterns: ['First-True / Lower-Bound Boundary', 'Rotated Half-Sorted Discrimination', 'Monotonic Answer-Space Search', 'Half-Open Interval [lo, hi) Proof'],
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const FIRST_RELEASE_PREREQUISITE_EDGES = [
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_hashing',
    rationale: 'Hash map scans and prefix-sum lookup tables rely on single-pass array iteration and index arithmetic.'
  },
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_binary_search',
    rationale: 'Binary search operates directly on random-access index ranges and requires fluent array bound reasoning.'
  }
];

export const FIRST_RELEASE_LESSONS = [
  // ==================== TOPIC 1: ARRAYS ====================
  {
    id: 'les_arrays_01',
    topicId: 'topic_arrays',
    order: 1,
    title: 'Single-Pass Loop Invariants & Running Extrema',
    estimatedMinutes: 15,
    prerequisites: [],
    measurableObjective: 'State and maintain a prefix loop invariant that tracks running minimums and best deltas in a single O(n) scan without lookahead errors.',
    explanation: 'A loop invariant is a statement about your variables that holds true before and after every iteration. When scanning an array from left to right, the cleanest invariant defines each state variable strictly in terms of the prefix `nums[0..i]`. For example, when finding the maximum gain `nums[j] - nums[i]` with `j > i`, we maintain `minSoFar = min(nums[0..i-1])` before considering `nums[i]` as a selling point, then update `minSoFar` afterward. This ordering guarantees we never pair an element with a future value or with itself when non-empty intervals are required.',
    codeSnippet: {
      language: 'javascript',
      filename: 'runningGainInvariant.js',
      lines: [
        'export function maxPositiveGain(prices) {',
        '  if (prices.length < 2) return 0;',
        '  let minPrice = prices[0];',
        '  let bestGain = 0;',
        '  for (let i = 1; i < prices.length; i += 1) {',
        '    const candidateGain = prices[i] - minPrice;',
        '    if (candidateGain > bestGain) bestGain = candidateGain;',
        '    if (prices[i] < minPrice) minPrice = prices[i];',
        '  }',
        '  return bestGain;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'prices = [7, 1, 5, 3, 6, 4]',
      stepByStep: [
        'Initialize minPrice = 7 (from index 0), bestGain = 0.',
        'i = 1 (price 1): candidateGain = 1 - 7 = -6; bestGain stays 0; minPrice updates to 1.',
        'i = 2 (price 5): candidateGain = 5 - 1 = 4; bestGain updates to 4; minPrice stays 1.',
        'i = 3 (price 3): candidateGain = 3 - 1 = 2; bestGain stays 4; minPrice stays 1.',
        'i = 4 (price 6): candidateGain = 6 - 1 = 5; bestGain updates to 5; minPrice stays 1.',
        'i = 5 (price 4): candidateGain = 4 - 1 = 3; return bestGain = 5.'
      ],
      outputDescription: '5 (buy at 1 on index 1, sell at 6 on index 4)',
      invariantSummary: 'At the start of iteration i, minPrice equals the minimum of prices[0..i-1] and bestGain equals the maximum gain achievable using any pair (a, b) with 0 <= a < b < i.'
    },
    pitfalls: [
      'Initializing bestGain to -Infinity when zero gain (no transaction) is allowed on strictly decreasing arrays.',
      'Updating minPrice before computing candidateGain when zero-length transactions are forbidden by the problem.'
    ],
    edgeCase: {
      scenario: 'Strictly decreasing array such as [9, 7, 4, 1]',
      whyItBreaksNaiveCode: 'Code that picks the global minimum and global maximum independently will pair index 3 (val 1) with index 0 (val 9) backwards in time.',
      howToHandle: 'Always evaluate the current index against prefix state accumulated strictly from earlier indices.'
    },
    exerciseId: 'ex_arrays_01',
    recommendedPracticeIds: ['prac_arrays_01', 'prac_arrays_02', 'prac_arrays_03'],
    knowledgeCheck: {
      question: 'In a single-pass scan where index j must be strictly greater than index i, why do we evaluate the candidate answer at index j BEFORE updating our running prefix minimum with nums[j]?',
      options: [
        {
          id: 'opt_order_strict',
          label: 'To guarantee the prefix minimum only reflects indices 0..j-1, preventing j from pairing with itself.',
          feedback: 'Correct! Evaluating before updating preserves the strict inequality i < j.'
        },
        {
          id: 'opt_order_speed',
          label: 'Because JavaScript engines optimize comparisons before assignments inside for-loops.',
          feedback: 'Not quite. The ordering is a logical invariant requirement, not a JIT micro-optimization.'
        },
        {
          id: 'opt_order_memory',
          label: 'To avoid allocating an extra variable on the stack during iteration.',
          feedback: 'Both orderings use the same O(1) variables; the difference is correctness when i < j is required.'
        }
      ],
      correctOptionId: 'opt_order_strict',
      explanation: 'Evaluating the candidate using state from 0..j-1 enforces i < j automatically.'
    },
    reflectionPrompt: 'Where in your own code do you tend to mix up inclusive prefix state (0..i) with exclusive prefix state (0..i-1)?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on prefix invariants and single-pass extrema.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_arrays_02',
    topicId: 'topic_arrays',
    order: 2,
    title: 'Prefix Sums & Left/Right Accumulation Without Division',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Construct prefix sums and two-pass prefix/suffix accumulations so range queries and leave-one-out products run in O(1) per index without division-by-zero traps.',
    explanation: 'A prefix table precomputes cumulative state so you never re-sum the same subarray twice. Using a 1-indexed padded array `P` of length `n + 1` where `P[k]` stores the sum of `nums[0..k-1]` makes the sum of any closed slice `nums[L..R]` simply `P[R + 1] - P[L]`, eliminating special cases for `L = 0`. When a problem asks for the combination of everything except index `i` (such as Product of Array Except Self), division fails whenever a zero appears. Instead, combine the exclusive prefix product `prod(0..i-1)` with the exclusive suffix product `prod(i+1..n-1)` in two clean passes.',
    codeSnippet: {
      language: 'javascript',
      filename: 'prefixSuffixProduct.js',
      lines: [
        'export function productExceptSelf(nums) {',
        '  const out = new Array(nums.length).fill(1);',
        '  let prefix = 1;',
        '  for (let i = 0; i < nums.length; i += 1) {',
        '    out[i] = prefix;',
        '    prefix *= nums[i];',
        '  }',
        '  let suffix = 1;',
        '  for (let i = nums.length - 1; i >= 0; i -= 1) {',
        '    out[i] *= suffix;',
        '    suffix *= nums[i];',
        '  }',
        '  return out;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [2, 3, 0, 4]',
      stepByStep: [
        'Pass 1 (left-to-right exclusive prefix): out becomes [1, 2, 6, 0].',
        'Pass 2 i = 3 (val 4): suffix = 1 -> out[3] = 0 * 1 = 0; suffix becomes 4.',
        'Pass 2 i = 2 (val 0): suffix = 4 -> out[2] = 6 * 4 = 24; suffix becomes 0.',
        'Pass 2 i = 1 (val 3): suffix = 0 -> out[1] = 2 * 0 = 0; suffix becomes 0.',
        'Pass 2 i = 0 (val 2): suffix = 0 -> out[0] = 1 * 0 = 0; return [0, 0, 24, 0].'
      ],
      outputDescription: '[0, 0, 24, 0]',
      invariantSummary: 'After pass 1, out[i] holds the product of nums[0..i-1]. During pass 2 at index i, suffix holds the product of nums[i+1..n-1].'
    },
    pitfalls: [
      'Multiplying `prefix *= nums[i]` BEFORE assigning `out[i] = prefix`, which accidentally includes `nums[i]` in its own exclusion product.',
      'Using total product divided by `nums[i]`, which throws NaN/Infinity when `nums` contains one or more zeros.'
    ],
    edgeCase: {
      scenario: 'Input contains exactly one zero vs. two or more zeros (e.g., [0, 4, 0])',
      whyItBreaksNaiveCode: 'A single zero leaves one non-zero entry at the zero index, whereas two zeros force every output entry to be 0.',
      howToHandle: 'Prefix/suffix multiplication handles 0, 1, or multiple zeros naturally without branching.'
    },
    exerciseId: 'ex_arrays_02',
    recommendedPracticeIds: ['prac_arrays_04', 'prac_arrays_05', 'prac_arrays_06'],
    knowledgeCheck: {
      question: 'With a padded prefix sum array P of length n + 1 where P[0] = 0 and P[k] = sum(nums[0..k-1]), which expression gives the sum of the inclusive slice nums[L..R]?',
      options: [
        {
          id: 'opt_pref_1',
          label: 'P[R + 1] - P[L]',
          feedback: 'Correct! P[R + 1] sums indices 0..R and P[L] sums indices 0..L-1, leaving L..R.'
        },
        {
          id: 'opt_pref_2',
          label: 'P[R] - P[L - 1]',
          feedback: 'That is the unpadded formula, which goes out of bounds at L = 0.'
        },
        {
          id: 'opt_pref_3',
          label: 'P[R + 1] - P[L + 1]',
          feedback: 'Subtracting P[L + 1] would wrongly exclude nums[L] from the slice sum.'
        }
      ],
      correctOptionId: 'opt_pref_1',
      explanation: 'P[R + 1] - P[L] cleanly cancels indices 0..L-1 and works even when L = 0.'
    },
    reflectionPrompt: 'How does storing the exclusive prefix (`0..i-1`) simplify combining left and right state at index `i`?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted array accumulation concepts informed by Open Data Structures (CC BY 4.0) with original NextStep examples.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_arrays_03',
    topicId: 'topic_arrays',
    order: 3,
    title: 'In-Place Compaction & Read/Write Pointer Partitioning',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Partition or deduplicate an array in-place in O(1) extra space by maintaining a slow write pointer and fast read pointer.',
    explanation: 'Whenever you need to filter, deduplicate, or compact an array in-place without shifting elements repeatedly in O(n^2) time, split your index into two roles: a fast `read` pointer that inspects every element once, and a slow `write` pointer that marks the next slot of the kept prefix. Because `write <= read` at all times, writing to `nums[write]` never overwrites an uninspected future element.',
    codeSnippet: {
      language: 'javascript',
      filename: 'compactUniqueSorted.js',
      lines: [
        'export function compactUniqueSorted(nums) {',
        '  if (nums.length === 0) return 0;',
        '  let write = 1;',
        '  for (let read = 1; read < nums.length; read += 1) {',
        '    if (nums[read] !== nums[write - 1]) {',
        '      nums[write] = nums[read];',
        '      write += 1;',
        '    }',
        '  }',
        '  return write;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [2, 2, 5, 5, 8]',
      stepByStep: [
        'Start write = 1 (nums[0] = 2 is always kept).',
        'read = 1 (val 2): equals nums[write - 1] (2), skip.',
        'read = 2 (val 5): differs from nums[0] (2) -> write nums[1] = 5, write becomes 2.',
        'read = 3 (val 5): equals nums[write - 1] (5), skip.',
        'read = 4 (val 8): differs from nums[1] (5) -> write nums[2] = 8, write becomes 3; return 3.'
      ],
      outputDescription: 'Length 3, with prefix nums[0..2] = [2, 5, 8]',
      invariantSummary: 'Before each read step, nums[0..write-1] contains the deduplicated elements from nums[0..read-1] in sorted order, and write <= read.'
    },
    pitfalls: [
      'Comparing `nums[read]` against `nums[read - 1]` when allowing at most k duplicates, after earlier writes have already mutated `nums[read - 1]`.',
      'Forgetting to guard `nums.length === 0`, returning `write = 1` on an empty array.'
    ],
    edgeCase: {
      scenario: 'All elements identical, e.g., [4, 4, 4, 4]',
      whyItBreaksNaiveCode: 'Calling `splice` inside a forward loop skips every second element when indices shift left.',
      howToHandle: 'Keep `write = 1` fixed while `read` advances to the end in a single O(n) pass.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_arrays_07', 'prac_arrays_08'],
    knowledgeCheck: {
      question: 'When generalizing sorted deduplication to allow at most K copies of each value, which element should `nums[read]` be compared against?',
      options: [
        {
          id: 'opt_k_write',
          label: 'nums[write - K] in the already-compacted valid prefix',
          feedback: 'Correct! Since the kept prefix is sorted, if nums[read] !== nums[write - K], there are fewer than K copies of nums[read] in the kept prefix.'
        },
        {
          id: 'opt_k_read',
          label: 'nums[read - K] in the raw array',
          feedback: 'Careful! When writing in-place, nums[read - K] may have already been overwritten by an earlier write.'
        },
        {
          id: 'opt_k_first',
          label: 'nums[0] at the start of the array',
          feedback: 'Comparing against nums[0] only checks the very first value, not the most recent run.'
        }
      ],
      correctOptionId: 'opt_k_write',
      explanation: 'Comparing against `nums[write - K]` inspects the authoritative compacted prefix.'
    },
    reflectionPrompt: 'Why is `write <= read` the critical safety guarantee that makes in-place forward compaction lossless?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Pedagogical pointer invariant design inspired by OpenDSA (MIT) with original JavaScript implementation.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_arrays_04',
    topicId: 'topic_arrays',
    order: 4,
    title: 'Subarray Reset Invariants (Kadane) & Cyclic Reversal',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_02', 'les_arrays_03'],
    measurableObjective: 'Decide in O(1) per element whether to extend or reset a contiguous subarray (Kadane) and rotate arrays in-place via three reversals.',
    explanation: 'Many contiguous subarray problems ask for the best slice ending at index `i`. In Kadane’s algorithm, if the best subarray sum ending at `i - 1` is negative, carrying it forward can only hurt `nums[i]`, so we reset the running sum to `nums[i]`. Similarly, when rotating an array right by `k` steps in O(1) space, normalizing `k = k % n` and reversing the full array, then `[0..k-1]`, then `[k..n-1]` restores internal order without extra buffers.',
    codeSnippet: {
      language: 'javascript',
      filename: 'kadaneAndRotate.js',
      lines: [
        'export function maxSubarraySum(nums) {',
        '  let currentEnd = nums[0];',
        '  let best = nums[0];',
        '  for (let i = 1; i < nums.length; i += 1) {',
        '    currentEnd = Math.max(nums[i], currentEnd + nums[i]);',
        '    best = Math.max(best, currentEnd);',
        '  }',
        '  return best;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5]',
      stepByStep: [
        'Start currentEnd = -2, best = -2.',
        'i = 1 (val 1): max(1, -2 + 1) = 1 (reset at index 1); best = 1.',
        'i = 2 (val -3): max(-3, 1 - 3) = -2; best stays 1.',
        'i = 3 (val 4): max(4, -2 + 4) = 4 (reset at index 3); best = 4.',
        'i = 4..6 (vals -1, 2, 1): currentEnd moves 3 -> 5 -> 6; best updates to 6.'
      ],
      outputDescription: '6 (from subarray [4, -1, 2, 1])',
      invariantSummary: 'At iteration i, currentEnd equals the maximum sum among all non-empty contiguous subarrays ending at index i.'
    },
    pitfalls: [
      'Initializing `best = 0`, which returns 0 instead of the least-negative number when all elements are negative.',
      'Forgetting `k %= nums.length` before reversing slices in array rotation, causing out-of-bounds swaps when `k >= n`.'
    ],
    edgeCase: {
      scenario: 'All-negative array such as [-8, -3, -6, -2, -5]',
      whyItBreaksNaiveCode: 'Resetting `currentEnd` to 0 whenever it dips below 0 pretends an empty subarray is allowed and returns 0 instead of -2.',
      howToHandle: 'Seed both `currentEnd` and `best` with `nums[0]` and compare `nums[i]` vs `currentEnd + nums[i]`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_arrays_09', 'prac_arrays_10'],
    knowledgeCheck: {
      question: 'Why must you normalize `k = k % nums.length` before performing the three-reversal in-place array rotation?',
      options: [
        {
          id: 'opt_rot_mod',
          label: 'Because rotating by a multiple of n is a full cycle, and k >= n would index past the end of the array during slice reversal.',
          feedback: 'Correct! Normalizing k into 0..n-1 keeps the reversal boundaries [0, k-1] and [k, n-1] valid.'
        },
        {
          id: 'opt_rot_neg',
          label: 'Because JavaScript arrays automatically resize if you access index k.',
          feedback: 'While writing to out-of-bounds indices in JS creates sparse holes, the core mathematical reason is that rotations are periodic modulo n.'
        },
        {
          id: 'opt_rot_even',
          label: 'Because three reversals only work when k is strictly less than n / 2.',
          feedback: 'Three reversals work for any k in 0..n-1, even when k >= n / 2.'
        }
      ],
      correctOptionId: 'opt_rot_mod',
      explanation: 'A right rotation by n elements returns the array to its starting configuration, so only k mod n steps matter.'
    },
    reflectionPrompt: 'How do you quickly verify whether a subarray problem allows an empty slice (sum 0) or requires at least one element?',
    sourceId: 'src_tih_mit',
    provenance: 'Pattern synthesis informed by Tech Interview Handbook (MIT) with original NextStep trace and edge-case analysis.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 2: HASHING ====================
  {
    id: 'les_hashing_01',
    topicId: 'topic_hashing',
    order: 1,
    title: 'Complement Maps & Lookup-Before-Insert Ordering',
    estimatedMinutes: 15,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Replace O(n^2) pair searches with a single-pass complement Map while preventing an element from matching itself.',
    explanation: 'When searching for two distinct indices `i < j` such that `nums[i] + nums[j] === target`, each element `nums[j]` needs a specific partner `need = target - nums[j]`. By checking whether `seen.has(need)` BEFORE inserting `nums[j]` into the map, we guarantee that the map only contains elements from `0..j-1`. This single ordering rule eliminates self-matching when `nums[j] * 2 === target` and handles duplicate values cleanly without pre-populating a multi-map.',
    codeSnippet: {
      language: 'javascript',
      filename: 'twoSumComplement.js',
      lines: [
        'export function findComplementPair(nums, target) {',
        '  const indexByVal = new Map();',
        '  for (let i = 0; i < nums.length; i += 1) {',
        '    const need = target - nums[i];',
        '    if (indexByVal.has(need)) {',
        '      return [indexByVal.get(need), i];',
        '    }',
        '    indexByVal.set(nums[i], i);',
        '  }',
        '  return null;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [3, 2, 4, 3], target = 6',
      stepByStep: [
        'i = 0 (val 3): need = 3; Map is empty -> insert (3 -> 0).',
        'i = 1 (val 2): need = 4; 4 not in Map -> insert (2 -> 1).',
        'i = 2 (val 4): need = 2; 2 is in Map at index 1 -> return [1, 2] immediately.'
      ],
      outputDescription: '[1, 2] (nums[1] + nums[2] = 2 + 4 = 6)',
      invariantSummary: 'At the moment we check `indexByVal.has(need)` in iteration i, the map stores the latest index of every value in `nums[0..i-1]`.'
    },
    pitfalls: [
      'Populating the entire Map in a first pass and then matching `target - nums[i]` without checking `map.get(need) !== i`, causing `[3, 2, 4]` with target 6 to return `[0, 0]`.',
      'Using `if (indexByVal.get(need))` in JavaScript, which evaluates to `false` when the stored index is `0`!'
    ],
    edgeCase: {
      scenario: 'Partner resides at index 0, e.g., nums = [3, 3], target = 6',
      whyItBreaksNaiveCode: 'A truthiness check `if (map[need])` treats index `0` as falsy and misses the valid match at the first position.',
      howToHandle: 'Always use `map.has(need)` or check `!== undefined` explicitly.'
    },
    exerciseId: 'ex_hashing_01',
    recommendedPracticeIds: ['prac_hashing_01', 'prac_hashing_02', 'prac_hashing_03'],
    knowledgeCheck: {
      question: 'Why does `if (indexByVal.get(need))` cause a classic bug in JavaScript index maps?',
      options: [
        {
          id: 'opt_hash_zero',
          label: 'Because index 0 is a valid array position, and 0 is falsy in JavaScript boolean contexts.',
          feedback: 'Spot on! Whenever index 0 holds the needed value, `if (0)` evaluates to false and skips the match.'
        },
        {
          id: 'opt_hash_null',
          label: 'Because Map.prototype.get throws a TypeError if the key is missing.',
          feedback: 'Map.prototype.get returns `undefined` for missing keys, never an exception.'
        },
        {
          id: 'opt_hash_nan',
          label: 'Because negative numbers cannot be used as keys in a JavaScript Map.',
          feedback: 'JavaScript Maps support any number (including negative numbers and 0) as keys.'
        }
      ],
      correctOptionId: 'opt_hash_zero',
      explanation: 'Index 0 is falsy in JS; always use `map.has(key)` or `map.get(key) !== undefined`.'
    },
    reflectionPrompt: 'Have you ever written a two-pass hash table where a one-pass lookup-before-insert would have avoided self-collision bugs?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on complement lookup invariants and JS Map truthiness pitfalls.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_hashing_02',
    topicId: 'topic_hashing',
    order: 2,
    title: 'Frequency Tables, Anagram Signatures & Canonical Keys',
    estimatedMinutes: 20,
    prerequisites: ['les_hashing_01'],
    measurableObjective: 'Group equivalent items in O(n * k) time by designing collision-free canonical string keys from character or structural frequencies.',
    explanation: 'When two items are considered equivalent (like anagrams or shifted strings), sorting each item takes `O(k log k)` per item, or you can build a fixed-alphabet frequency signature in `O(k)`. Crucially, when serializing a frequency array `[1, 0, 11, ...]` into a hash key, you MUST include a delimiter (such as `counts.join("#")`). Without a delimiter, `[1, 11]` and `[11, 1]` both serialize to `"111"` and collide!',
    codeSnippet: {
      language: 'javascript',
      filename: 'canonicalAnagramKey.js',
      lines: [
        'export function buildCanonicalCharKey(word) {',
        '  const counts = new Array(26).fill(0);',
        '  for (let i = 0; i < word.length; i += 1) {',
        '    counts[word.charCodeAt(i) - 97] += 1;',
        '  }',
        '  return counts.join("#");',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'words = ["bdddddddddd", "bbbbbbbbbbc"]',
      stepByStep: [
        '"bdddddddddd" has 1 "b" (index 1) and 10 "d"s (index 3).',
        '"bbbbbbbbbbc" has 10 "b"s (index 1) and 1 "c" (index 2).',
        'Without delimiter (`join("")`), both produce "...010100..." and falsely group together!',
        'With `join("#")`, they produce `0#1#0#10#...` vs `0#10#1#0#...`, keeping them distinct.'
      ],
      outputDescription: 'Two separate canonical keys with zero collision',
      invariantSummary: 'Two strings map to the same "#" delimited 26-slot count vector if and only if they contain the exact same multiset of lowercase letters.'
    },
    pitfalls: [
      'Joining multi-digit frequency counts with an empty string `counts.join("")`, causing multi-digit boundary collisions.',
      'Mutating a frequency counter without deleting keys whose count drops to 0 when comparing `map.size`.'
    ],
    edgeCase: {
      scenario: 'Strings with repeated character counts >= 10, such as 10 of one letter vs 1 of two adjacent letters',
      whyItBreaksNaiveCode: 'Undelimited concatenation cannot distinguish `"1" + "0"` from `"10"`.',
      howToHandle: 'Always join numeric tuple keys with a non-digit separator like `"#"` or `","`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_hashing_04', 'prac_hashing_05', 'prac_hashing_06'],
    knowledgeCheck: {
      question: 'Why does `counts.join("")` fail as a canonical key for 26-letter frequency arrays on long strings?',
      options: [
        {
          id: 'opt_delim_collision',
          label: 'Multi-digit counts (like 10) blur adjacent slot boundaries when concatenated without a separator.',
          feedback: 'Correct! `0, 1, 0, 10` and `0, 10, 1, 0` both become `"01010..."` without a delimiter.'
        },
        {
          id: 'opt_delim_utf16',
          label: 'JavaScript strings cannot exceed 26 characters when used as Map keys.',
          feedback: 'JavaScript strings of any reasonable length work as Map keys.'
        },
        {
          id: 'opt_delim_sort',
          label: 'Because Array.prototype.join sorts the numbers alphabetically before joining.',
          feedback: 'join() preserves array order; the issue is boundary ambiguity between adjacent numbers.'
        }
      ],
      correctOptionId: 'opt_delim_collision',
      explanation: 'A separator like "#" ensures injective (one-to-one) serialization from integer tuples to strings.'
    },
    reflectionPrompt: 'What properties must a canonical key function satisfy so two objects share a key if and only if they are equivalent?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Hash key design principles informed by Open Data Structures (CC BY 4.0) with original canonical serialization examples.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_hashing_03',
    topicId: 'topic_hashing',
    order: 3,
    title: 'Prefix-Sum Hash Maps for Exact Subarray Targets',
    estimatedMinutes: 25,
    prerequisites: ['les_arrays_02', 'les_hashing_01'],
    measurableObjective: 'Count or measure subarrays summing to K in O(n) time even when negative numbers break sliding windows.',
    explanation: 'Sliding windows require monotonicity (non-negative numbers). When an array contains negative values, the window sum can both grow and shrink unpredictably. However, the identity `sum(L..R) = prefixSum[R] - prefixSum[L - 1]` still holds! Therefore, a subarray ending at `R` has sum `K` if and only if an earlier prefix sum equaled `currentPrefix - K`. By seeding a frequency map with `{ 0: 1 }` (representing the empty prefix before index 0), we count all matching earlier splits in O(1) per step.',
    codeSnippet: {
      language: 'javascript',
      filename: 'subarraySumEqualsK.js',
      lines: [
        'export function countSubarraysWithSum(nums, k) {',
        '  const prefixCounts = new Map([[0, 1]]);',
        '  let runningSum = 0;',
        '  let totalMatches = 0;',
        '  for (const num of nums) {',
        '    runningSum += num;',
        '    const neededPrefix = runningSum - k;',
        '    totalMatches += prefixCounts.get(neededPrefix) ?? 0;',
        '    prefixCounts.set(runningSum, (prefixCounts.get(runningSum) ?? 0) + 1);',
        '  }',
        '  return totalMatches;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, -1, 1, 1], k = 1',
      stepByStep: [
        'Seed prefixCounts = { 0: 1 }, runningSum = 0, totalMatches = 0.',
        'num = 1: runningSum = 1, need 0 -> add prefixCounts.get(0)=1 (total=1); map becomes {0:1, 1:1}.',
        'num = -1: runningSum = 0, need -1 -> add 0 (total=1); map becomes {0:2, 1:1}.',
        'num = 1: runningSum = 1, need 0 -> add prefixCounts.get(0)=2 (total=3); map becomes {0:2, 1:2}.',
        'num = 1: runningSum = 2, need 1 -> add prefixCounts.get(1)=2 (total=5).'
      ],
      outputDescription: '5 matching subarrays ([1], [1,-1,1], [1] at idx 2, [-1,1,1], [1] at idx 3)',
      invariantSummary: 'Before updating prefixCounts at index i, prefixCounts.get(x) equals the number of prefix boundaries in 0..i where the prefix sum equaled x.'
    },
    pitfalls: [
      'Forgetting the base seed `new Map([[0, 1]])`, which misses every valid subarray that starts at index 0.',
      'Storing only a boolean Set instead of frequencies, which undercounts when zeros or negatives revisit the same prefix sum multiple times.'
    ],
    edgeCase: {
      scenario: 'k = 0 with alternating positives and negatives like [1, -1, 1, -1]',
      whyItBreaksNaiveCode: 'Updating `prefixCounts` BEFORE adding `prefixCounts.get(runningSum - k)` when `k = 0` matches the current prefix with itself (an empty subarray of length 0).',
      howToHandle: 'Always query `runningSum - k` first, then increment the count of `runningSum` in the map.'
    },
    exerciseId: 'ex_hashing_02',
    recommendedPracticeIds: ['prac_hashing_07', 'prac_hashing_08'],
    knowledgeCheck: {
      question: 'Why do we initialize `prefixCounts` with `[0, 1]` before iterating through the array?',
      options: [
        {
          id: 'opt_seed_zero',
          label: 'To represent the empty prefix before index 0, so subarrays starting at index 0 with runningSum === k are counted.',
          feedback: 'Correct! When runningSum === k, neededPrefix is 0, which matches the empty prefix before index 0.'
        },
        {
          id: 'opt_seed_neg',
          label: 'Because JavaScript Maps require at least one initial entry to infer numeric key types.',
          feedback: 'JavaScript Maps are dynamically typed and can start empty.'
        },
        {
          id: 'opt_seed_div',
          label: 'To prevent division by zero when computing the average subarray length.',
          feedback: 'No division is performed; `[0, 1]` accounts for the prefix sum of `nums[0..-1]` being 0.'
        }
      ],
      correctOptionId: 'opt_seed_zero',
      explanation: 'An empty prefix has sum 0 and occurs once before index 0.'
    },
    reflectionPrompt: 'If a problem asks for the LONGEST subarray with sum K rather than the COUNT of subarrays, should the map store frequency counts or only the earliest index of each prefix sum?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson combining prefix sums and hash maps.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_hashing_04',
    topicId: 'topic_hashing',
    order: 4,
    title: 'Set Sequence Starts & Bijection Validation',
    estimatedMinutes: 20,
    prerequisites: ['les_hashing_01', 'les_hashing_02'],
    measurableObjective: 'Achieve true O(n) sequence discovery by starting chains only at Set boundary elements, and enforce 1-to-1 bijections with dual maps.',
    explanation: 'Putting elements in a `Set` gives O(1) membership checks, but a naive loop that walks `x + 1, x + 2, ...` from every element is still O(n^2) on `[1, 2, 3, 4, 5]`. The O(n) insight is a boundary guard: only start walking a streak at `x` if `!set.has(x - 1)`. That guarantees each streak is traversed at most once! Similarly, when checking whether two strings or patterns are isomorphic, a single map `a -> b` only checks a function; you need either two maps (`a -> b` and `b -> a`) or a `usedTargets` Set to guarantee a true one-to-one bijection.',
    codeSnippet: {
      language: 'javascript',
      filename: 'longestStreakSet.js',
      lines: [
        'export function longestConsecutiveStreak(nums) {',
        '  const numSet = new Set(nums);',
        '  let longest = 0;',
        '  for (const x of numSet) {',
        '    if (!numSet.has(x - 1)) {',
        '      let current = x;',
        '      let streak = 1;',
        '      while (numSet.has(current + 1)) {',
        '        current += 1;',
        '        streak += 1;',
        '      }',
        '      if (streak > longest) longest = streak;',
        '    }',
        '  }',
        '  return longest;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [100, 4, 200, 1, 3, 2]',
      stepByStep: [
        'numSet = {100, 4, 200, 1, 3, 2}.',
        'x = 100: 99 not in Set -> start walk: 101 not in Set -> streak = 1.',
        'x = 4: 3 IS in Set -> skip inner while loop completely!',
        'x = 200: 199 not in Set -> streak = 1.',
        'x = 1: 0 not in Set -> start walk: 2, 3, 4 in Set -> streak = 4; x = 3 and x = 2 are skipped.'
      ],
      outputDescription: '4 (from streak 1 -> 2 -> 3 -> 4)',
      invariantSummary: 'Every element in numSet is visited by the inner `while` loop at most once because inner walks only launch from elements with no predecessor `x - 1`.'
    },
    pitfalls: [
      'Iterating `for (const x of nums)` instead of `for (const x of numSet)`, which wastes time re-running streak walks on duplicate start values.',
      'Checking only `mapAtoB` in isomorphism problems, which falsely accepts `"ab"` -> `"aa"` because both `"a"` and `"b"` map to `"a"`.'
    ],
    edgeCase: {
      scenario: 'Input contains many duplicates of the sequence start, e.g., [1, 1, 1, 2, 3, 4]',
      whyItBreaksNaiveCode: 'Looping over `nums` instead of `numSet` triggers the full inner chain walk for every duplicate `1`.',
      howToHandle: 'Always iterate `for (const x of numSet)` so each distinct start value is processed once.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_hashing_09', 'prac_hashing_10'],
    knowledgeCheck: {
      question: 'In `longestConsecutiveStreak`, why is the overall time complexity O(n) despite having a `while` loop nested inside a `for` loop?',
      options: [
        {
          id: 'opt_streak_amortized',
          label: 'The guard `!numSet.has(x - 1)` ensures the `while` loop only runs for the minimum element of each contiguous chain, visiting each Set member at most once.',
          feedback: 'Correct! Across the entire execution, `current += 1` executes at most n times total.'
        },
        {
          id: 'opt_streak_sort',
          label: 'Because JavaScript Sets automatically sort numeric keys in O(1) time.',
          feedback: 'JavaScript Sets preserve insertion order; they do not sort elements.'
        },
        {
          id: 'opt_streak_break',
          label: 'Because the inner loop terminates after at most log(n) steps.',
          feedback: 'A single chain can be length n, so the inner loop can run n times—just only once for that chain.'
        }
      ],
      correctOptionId: 'opt_streak_amortized',
      explanation: 'Each element can be part of only one chain walk, making the total inner-loop iterations across all outer steps at most n.'
    },
    reflectionPrompt: 'Where else can a "start only at the predecessor boundary" check turn an O(n^2) graph/grid exploration into O(n)?',
    sourceId: 'src_tih_mit',
    provenance: 'Pattern analysis informed by Tech Interview Handbook (MIT) with original complexity proof and bijection edge cases.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 3: BINARY SEARCH ====================
  {
    id: 'les_binary_search_01',
    topicId: 'topic_binary_search',
    order: 1,
    title: 'Half-Open Intervals & First-True Lower Bound Invariants',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Implement lower-bound binary search without infinite loops by maintaining a half-open candidate range [lo, hi) over a monotonic boolean predicate.',
    explanation: 'Instead of memorizing three different binary search templates (`lo <= hi`, `lo < hi`, `lo + 1 < hi`), view binary search as finding the first index where a monotonic predicate `isTrue(idx)` turns from `false` to `true` (for example, `nums[idx] >= target`). Set `lo = 0` and `hi = nums.length` (one past the end, in case no element satisfies the predicate). At every step, `mid = lo + Math.floor((hi - lo) / 2)`. If `nums[mid] >= target`, `mid` might be the first true index, so keep it: `hi = mid`. Otherwise `mid` and everything left of it are false, so exclude `mid`: `lo = mid + 1`. Because `mid < hi` always holds when `lo < hi`, both branches strictly shrink `hi - lo`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'lowerBoundSearch.js',
      lines: [
        'export function lowerBound(nums, target) {',
        '  let lo = 0;',
        '  let hi = nums.length;',
        '  while (lo < hi) {',
        '    const mid = lo + Math.floor((hi - lo) / 2);',
        '    if (nums[mid] >= target) {',
        '      hi = mid;',
        '    } else {',
        '      lo = mid + 1;',
        '    }',
        '  }',
        '  return lo;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [2, 4, 4, 4, 8, 10], target = 4',
      stepByStep: [
        'Start lo = 0, hi = 6.',
        'mid = 3 (nums[3] = 4 >= 4): predicate is true -> hi = 3 (keep index 3 in play).',
        'lo = 0, hi = 3 -> mid = 1 (nums[1] = 4 >= 4): predicate is true -> hi = 1.',
        'lo = 0, hi = 1 -> mid = 0 (nums[0] = 2 < 4): predicate is false -> lo = 0 + 1 = 1.',
        'lo === hi === 1 -> loop terminates; return 1 (the very first index of 4).'
      ],
      outputDescription: '1 (first index where nums[i] >= 4)',
      invariantSummary: 'At every step, all indices < lo have nums[i] < target, and all indices >= hi (within bounds) have nums[i] >= target.'
    },
    pitfalls: [
      'Setting `hi = nums.length - 1` with `while (lo < hi)`, which cannot return `nums.length` when the target is larger than every element in `nums`.',
      'Writing `lo = mid` when `mid` is rounded down (`Math.floor`), which causes an infinite loop whenever `hi === lo + 1`.'
    ],
    edgeCase: {
      scenario: 'Target is strictly greater than all elements, e.g., nums = [1, 3, 5], target = 9',
      whyItBreaksNaiveCode: 'Clamping `hi = nums.length - 1` forces `lo` to stop at index 2 instead of insertion index 3.',
      howToHandle: 'Initialize `hi = nums.length`; if `lo === nums.length` at termination, all elements are `< target`.'
    },
    exerciseId: 'ex_binary_search_01',
    recommendedPracticeIds: ['prac_binary_search_01', 'prac_binary_search_02', 'prac_binary_search_03'],
    knowledgeCheck: {
      question: 'In a `while (lo < hi)` loop where `mid = lo + Math.floor((hi - lo) / 2)`, why does setting `lo = mid` in the false branch cause an infinite loop?',
      options: [
        {
          id: 'opt_bs_floor',
          label: 'When hi === lo + 1, floor division sets mid === lo, so `lo = mid` leaves `[lo, hi]` completely unchanged.',
          feedback: 'Correct! On a 2-element interval `[lo, lo + 1]`, floor midpoint equals `lo`, so `lo = mid` makes zero progress.'
        },
        {
          id: 'opt_bs_overflow',
          label: 'Because `hi - lo` overflows 32-bit integers when `lo = mid`.',
          feedback: 'The issue is progress termination on a size-1 gap, not integer overflow.'
        },
        {
          id: 'opt_bs_sorted',
          label: 'Because `lo = mid` skips the middle element when the array has odd length.',
          feedback: '`lo = mid` keeps `mid`; the bug is that it fails to shrink the interval when `hi - lo === 1`.'
        }
      ],
      correctOptionId: 'opt_bs_floor',
      explanation: 'Floor division biases `mid` toward `lo`, so the `lo` update must be `mid + 1` (or `mid` must use `Math.ceil` with `hi = mid - 1`).'
    },
    reflectionPrompt: 'How can you express "last index <= target" in terms of `lowerBound(nums, target + 1) - 1`?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Binary search lower-bound invariant adapted from Open Data Structures (CC BY 4.0) with original NextStep boundary proof.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_binary_search_02',
    topicId: 'topic_binary_search',
    order: 2,
    title: 'Rotated Sorted Arrays & Sorted-Half Discrimination',
    estimatedMinutes: 25,
    prerequisites: ['les_binary_search_01'],
    measurableObjective: 'Locate minimums and targets in rotated sorted arrays in O(log n) by identifying which half around mid is guaranteed monotonic.',
    explanation: 'When a sorted array without duplicates is rotated at an unknown pivot (e.g. `[4, 5, 6, 7, 0, 1, 2]`), cutting at `mid` always leaves at least one half (`[lo..mid]` or `[mid..hi]`) strictly sorted. To find the minimum element, compare `nums[mid]` against `nums[hi]` (NOT `nums[lo]`): if `nums[mid] > nums[hi]`, the cliff must lie to the right of `mid` (`lo = mid + 1`); otherwise `nums[mid] <= nums[hi]`, so the right half is sorted and `mid` itself could be the minimum (`hi = mid`). To search for a specific `target`, first check which half is sorted (`nums[lo] <= nums[mid]`), then test whether `target` lies inside that sorted half’s closed bounds.',
    codeSnippet: {
      language: 'javascript',
      filename: 'findRotatedMinimum.js',
      lines: [
        'export function findMinInRotated(nums) {',
        '  let lo = 0;',
        '  let hi = nums.length - 1;',
        '  while (lo < hi) {',
        '    const mid = lo + Math.floor((hi - lo) / 2);',
        '    if (nums[mid] > nums[hi]) {',
        '      lo = mid + 1;',
        '    } else {',
        '      hi = mid;',
        '    }',
        '  }',
        '  return nums[lo];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [4, 5, 6, 7, 0, 1, 2]',
      stepByStep: [
        'lo = 0, hi = 6 -> mid = 3 (nums[3] = 7 > nums[6] = 2): minimum is right of mid -> lo = 4.',
        'lo = 4, hi = 6 -> mid = 5 (nums[5] = 1 <= nums[6] = 2): minimum is at or left of mid -> hi = 5.',
        'lo = 4, hi = 5 -> mid = 4 (nums[4] = 0 <= nums[5] = 1): hi = 4.',
        'lo === hi === 4 -> return nums[4] = 0.'
      ],
      outputDescription: '0 (at index 4)',
      invariantSummary: 'The minimum element of the rotated array always resides inside the closed interval [lo..hi].'
    },
    pitfalls: [
      'Comparing `nums[mid]` with `nums[lo]` to find the minimum: when the subarray `[lo..hi]` is already unrotated (e.g., `[1, 2, 3]`), `nums[mid] > nums[lo]` is true even though the minimum is at `lo`, not right of `mid`!',
      'Using `<` instead of `<=` in `if (nums[lo] <= nums[mid])` during rotated target search, which fails when `lo === mid` on a 2-element subarray.'
    ],
    edgeCase: {
      scenario: 'Array rotated n times (already sorted), e.g., [1, 2, 3, 4, 5]',
      whyItBreaksNaiveCode: 'Comparing `nums[mid]` against `nums[lo]` sees `3 > 1` and wrongly discards the left half containing `1`.',
      howToHandle: 'Always compare `nums[mid]` against `nums[hi]` when searching for the minimum pivot.'
    },
    exerciseId: 'ex_binary_search_02',
    recommendedPracticeIds: ['prac_binary_search_04', 'prac_binary_search_05', 'prac_binary_search_06'],
    knowledgeCheck: {
      question: 'When finding the minimum of a rotated sorted array, why do we compare `nums[mid]` with `nums[hi]` instead of `nums[lo]`?',
      options: [
        {
          id: 'opt_rot_hi',
          label: 'Because `nums[mid] > nums[lo]` happens both in an unrotated array `[1, 2, 3]` (min on left) and a rotated array `[3, 4, 1]` (min on right), whereas `nums[mid] > nums[hi]` unambiguously proves the pivot drop is in `(mid..hi]`.',
          feedback: 'Correct! `nums[hi]` disambiguates whether the right half wraps around the cliff.'
        },
        {
          id: 'opt_rot_speed',
          label: 'Because `hi` changes less frequently than `lo` on random inputs.',
          feedback: 'Both bounds update equally often; the reason is logical disambiguation of unrotated intervals.'
        },
        {
          id: 'opt_rot_mid',
          label: 'Because `mid` can equal `hi` when `lo < hi`, so we need a tie-breaker.',
          feedback: 'With floor division and `lo < hi`, `mid` is strictly less than `hi` (and can equal `lo`).'
        }
      ],
      correctOptionId: 'opt_rot_hi',
      explanation: '`nums[mid] > nums[hi]` can ONLY occur if the rotation cliff lies strictly between `mid` and `hi`.'
    },
    reflectionPrompt: 'Why is `mid === lo` possible when `hi === lo + 1`, and how does that require `nums[lo] <= nums[mid]` when checking if the left half is sorted?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on rotated binary search invariants.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_binary_search_03',
    topicId: 'topic_binary_search',
    order: 3,
    title: 'Binary Search on Monotonic Answer Spaces',
    estimatedMinutes: 25,
    prerequisites: ['les_binary_search_01'],
    measurableObjective: 'Solve min-max capacity and rate problems in O(n log(range)) by binary searching over candidate answers with a linear feasibility check.',
    explanation: 'Binary search does not require a sorted input array! Whenever a problem asks for the MINIMUM capacity/speed `X` such that a task can be completed within `H` hours or `D` days, check whether the feasibility function `canFinish(X)` is monotonic: if speed `X` is fast enough, then any speed `> X` is also fast enough (`false, false, ..., true, true`). Once you establish monotonicity, define the tightest safe search bounds `[lo, hi]` in answer space (e.g., `lo = 1` or `max(weights)`, `hi = max(piles)` or `sum(weights)`) and run standard `first-true` binary search.',
    codeSnippet: {
      language: 'javascript',
      filename: 'minFeasibleRate.js',
      lines: [
        'export function minEatingSpeed(piles, maxHours) {',
        '  let lo = 1;',
        '  let hi = Math.max(...piles);',
        '  while (lo < hi) {',
        '    const speed = lo + Math.floor((hi - lo) / 2);',
        '    let hoursUsed = 0;',
        '    for (const pile of piles) {',
        '      hoursUsed += Math.ceil(pile / speed);',
        '    }',
        '    if (hoursUsed <= maxHours) {',
        '      hi = speed;',
        '    } else {',
        '      lo = speed + 1;',
        '    }',
        '  }',
        '  return lo;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'piles = [3, 6, 7, 11], maxHours = 8',
      stepByStep: [
        'Search space is speed in [1..11].',
        'speed = 6: hours = ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6) = 1+1+2+2 = 6 <= 8 (feasible -> hi = 6).',
        'lo = 1, hi = 6 -> speed = 3: hours = 1+2+3+4 = 10 > 8 (too slow -> lo = 4).',
        'lo = 4, hi = 6 -> speed = 5: hours = 1+2+2+3 = 8 <= 8 (feasible -> hi = 5).',
        'lo = 4, hi = 5 -> speed = 4: hours = 1+2+2+3 = 8 <= 8 (feasible -> hi = 4); return 4.'
      ],
      outputDescription: '4 units/hour',
      invariantSummary: 'Every speed < lo requires strictly more than maxHours, while speed = hi is guaranteed to finish in <= maxHours.'
    },
    pitfalls: [
      'Setting `lo = 1` in shipment capacity problems where items cannot be split across days, which allows the feasibility check to loop forever or undercount when `capacity < max(weights)`.',
      'Stopping the binary search the moment `hoursUsed === maxHours` instead of continuing to shrink `hi = speed`, since a smaller speed might also hit the exact same ceiling sum!'
    ],
    edgeCase: {
      scenario: 'Multiple speeds produce the exact same total hours due to ceiling division (e.g., speeds 4 and 5 both take 8 hours)',
      whyItBreaksNaiveCode: 'Returning immediately on `hoursUsed === maxHours` returns 5 instead of the minimum feasible speed 4.',
      howToHandle: 'Always treat `hoursUsed <= maxHours` as the `true` branch (`hi = speed`) until `lo === hi`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_binary_search_07', 'prac_binary_search_08'],
    knowledgeCheck: {
      question: 'Why is it a bug to return `speed` immediately when `hoursUsed === maxHours` in a minimum-rate binary search?',
      options: [
        {
          id: 'opt_ans_ceil',
          label: 'Because `Math.ceil(pile / speed)` is a step function; a smaller speed can yield the exact same `hoursUsed === maxHours`.',
          feedback: 'Correct! In the worked example, both speed 5 and speed 4 take 8 hours, and we need the minimum speed (4).'
        },
        {
          id: 'opt_ans_float',
          label: 'Because `hoursUsed` might have floating-point rounding error.',
          feedback: '`Math.ceil` produces exact integers; the issue is step-function plateaus.'
        },
        {
          id: 'opt_ans_max',
          label: 'Because we want the maximum speed, not the minimum speed.',
          feedback: 'The problem asks for the minimum feasible speed.'
        }
      ],
      correctOptionId: 'opt_ans_ceil',
      explanation: 'Ceiling sums plateau across ranges of speeds, so you must keep tightening `hi = speed` to find the left edge of the plateau.'
    },
    reflectionPrompt: 'How do you choose `lo` and `hi` for an answer-space binary search when items cannot be split vs. when items can be split across time steps?',
    sourceId: 'src_tih_mit',
    provenance: 'Monotonic feasibility search pattern informed by Tech Interview Handbook (MIT) with original plateau analysis.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_binary_search_04',
    topicId: 'topic_binary_search',
    order: 4,
    title: '2D Matrix Coordinate Mapping & Local Peak Ascent',
    estimatedMinutes: 20,
    prerequisites: ['les_binary_search_01', 'les_binary_search_02'],
    measurableObjective: 'Map 1D binary search indices to 2D row-major matrices in O(1) and find local peaks in O(log n) using neighbour slope comparison.',
    explanation: 'When a 2D `R x C` matrix has each row sorted and the first element of each row is greater than the last element of the previous row, it is isomorphic to a flat sorted array of length `R * C`. Any flat index `idx` in `0..(R * C - 1)` maps directly to `row = Math.floor(idx / C)` and `col = idx % C` without allocating a flattened copy. Even more surprisingly, binary search can find a local peak (`nums[i] > nums[i-1]` and `nums[i] > nums[i+1]`) in an unsorted array whenever `nums[-1] = nums[n] = -Infinity`: compare `nums[mid]` with `nums[mid + 1]`. If `nums[mid] < nums[mid + 1]`, we are on a rising slope so a peak MUST exist in `[mid + 1..hi]`; otherwise a peak MUST exist in `[lo..mid]`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'findPeakSlope.js',
      lines: [
        'export function findPeakIndex(nums) {',
        '  let lo = 0;',
        '  let hi = nums.length - 1;',
        '  while (lo < hi) {',
        '    const mid = lo + Math.floor((hi - lo) / 2);',
        '    if (nums[mid] < nums[mid + 1]) {',
        '      lo = mid + 1;',
        '    } else {',
        '      hi = mid;',
        '    }',
        '  }',
        '  return lo;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 2, 1, 3, 5, 6, 4]',
      stepByStep: [
        'lo = 0, hi = 6 -> mid = 3 (nums[3]=3 < nums[4]=5): rising slope to the right -> lo = 4.',
        'lo = 4, hi = 6 -> mid = 5 (nums[5]=6 > nums[6]=4): falling slope to the right -> hi = 5.',
        'lo = 4, hi = 5 -> mid = 4 (nums[4]=5 < nums[5]=6): rising slope -> lo = 5.',
        'lo === hi === 5 -> return index 5 (value 6 is greater than neighbours 5 and 4).'
      ],
      outputDescription: '5 (index of local peak 6)',
      invariantSummary: 'Throughout the loop, the subarray nums[lo..hi] is bounded by lower outer neighbours (nums[lo - 1] < nums[lo] and nums[hi] > nums[hi + 1]), guaranteeing at least one local peak inside [lo..hi].'
    },
    pitfalls: [
      'Dividing and modding by `rows` (`R`) instead of `cols` (`C`) when converting a 1D index into 2D `(row, col)` coordinates.',
      'Accessing `nums[mid + 1]` without ensuring `mid < hi`, which is why `while (lo < hi)` with floor midpoint is essential (so `mid + 1 <= hi` is always in bounds).'
    ],
    edgeCase: {
      scenario: 'Non-square matrix with 1 row and 5 columns (R = 1, C = 5)',
      whyItBreaksNaiveCode: 'Using `row = Math.floor(idx / R)` and `col = idx % R` computes `row = 3, col = 0` for `idx = 3` and crashes with `matrix[3] is undefined`.',
      howToHandle: 'Always divide and modulo by the number of COLUMNS (`C = matrix[0].length`), because each row contains `C` elements.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_binary_search_09', 'prac_binary_search_10'],
    knowledgeCheck: {
      question: 'In a row-major `R x C` matrix (R rows, C columns), how do you convert a 1D flat index `k` (0 <= k < R * C) into `(row, col)`?',
      options: [
        {
          id: 'opt_2d_cols',
          label: 'row = Math.floor(k / C), col = k % C',
          feedback: 'Correct! Every full row advances by C elements, so dividing by C gives the row and the remainder gives the column.'
        },
        {
          id: 'opt_2d_rows',
          label: 'row = Math.floor(k / R), col = k % R',
          feedback: 'Dividing by R fails whenever R !== C, because rows have width C, not R.'
        },
        {
          id: 'opt_2d_swap',
          label: 'row = k % C, col = Math.floor(k / C)',
          feedback: 'That swaps row and column coordinates.'
        }
      ],
      correctOptionId: 'opt_2d_cols',
      explanation: 'Row width is C (number of columns), so `Math.floor(k / C)` counts completed rows and `k % C` gives the offset within the row.'
    },
    reflectionPrompt: 'Why does `while (lo < hi)` with `mid = lo + Math.floor((hi - lo) / 2)` guarantee that `nums[mid + 1]` is never out of bounds?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Coordinate mapping and peak binary search lesson informed by OpenDSA (MIT) with original JavaScript trace.',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const FIRST_RELEASE_EXERCISES = [
  // ==================== EXERCISE 1: ARRAYS 01 ====================
  {
    id: 'ex_arrays_01',
    topicId: 'topic_arrays',
    lessonId: 'les_arrays_01',
    title: 'Proof Trace: Single-Pass Running Minimum & Gain Invariant',
    rendererType: 'array_pointers',
    objective: 'Verify at each step how `minPrice` and `bestGain` update without ever pairing a day with a future buy price.',
    instructions: 'Step through the execution trace. At each checkpoint, inspect the highlighted array state and choose the exact invariant state update.',
    codeLines: [
      'function maxPositiveGain(prices) {',
      '  let minPrice = prices[0];',
      '  let bestGain = 0;',
      '  for (let i = 1; i < prices.length; i += 1) {',
      '    const candidateGain = prices[i] - minPrice;',
      '    if (candidateGain > bestGain) bestGain = candidateGain;',
      '    if (prices[i] < minPrice) minPrice = prices[i];',
      '  }',
      '  return bestGain;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Standard Dip & Rally',
      inputLabel: 'prices = [7, 2, 6, 1, 5]',
      edgeCaseNote: 'Notice that index 3 (price 1) sets a new global minimum, but bestGain (6 - 2 = 4) from the earlier rally beats the late rally (5 - 1 = 4 tie).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 5,
          prompt: 'Iteration i = 1 (`prices[1] = 2`), with `minPrice = 7` and `bestGain = 0`. What happens across lines 5-7?',
          stateSnapshot: {
            array: [7, 2, 6, 1, 5],
            pointers: { minIdx: 0, i: 1 },
            activeRange: [0, 1],
            highlightedIndices: [0, 1],
            annotation: 'Prefix [0..0] has minPrice = 7; inspecting prices[1] = 2.'
          },
          choices: [
            {
              id: 'c1_correct',
              label: 'candidateGain is -5 (bestGain stays 0), then minPrice updates to 2',
              codeHint: 'candidateGain = 2 - 7; minPrice = 2',
              isCorrect: true,
              misconceptionFeedback: 'Correct! We test selling at index 1 against the prefix min (7), keep bestGain at 0, and then lower minPrice to 2.'
            },
            {
              id: 'c1_wrong_order',
              label: 'minPrice updates to 2 first, making candidateGain = 2 - 2 = 0',
              codeHint: 'minPrice updated before candidateGain',
              isCorrect: false,
              misconceptionFeedback: 'Watch the line order: line 5 computes `prices[i] - minPrice` BEFORE line 7 updates `minPrice`, preserving strict `buy < sell`.'
            },
            {
              id: 'c1_wrong_neg',
              label: 'bestGain updates to -5 because it is the first transaction',
              codeHint: 'bestGain = -5',
              isCorrect: false,
              misconceptionFeedback: 'Because zero transactions are allowed, `bestGain` starts at 0 and only updates when `candidateGain > bestGain`.'
            }
          ],
          correctExplanation: 'Evaluating `candidateGain` before updating `minPrice` keeps the buy index strictly earlier than `i`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'Iteration i = 2 (`prices[2] = 6`), with `minPrice = 2` and `bestGain = 0`. What state holds after index 2 finishes?',
          stateSnapshot: {
            array: [7, 2, 6, 1, 5],
            pointers: { minIdx: 1, i: 2 },
            activeRange: [0, 2],
            highlightedIndices: [1, 2],
            annotation: 'Prefix [0..1] has minPrice = 2 (at index 1); inspecting prices[2] = 6.'
          },
          choices: [
            {
              id: 'c2_correct',
              label: 'bestGain updates to 4 (6 - 2), and minPrice remains 2',
              codeHint: 'bestGain = 4, minPrice = 2',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! Selling at 6 against the earlier minimum 2 yields a gain of 4.'
            },
            {
              id: 'c2_wrong_min',
              label: 'bestGain updates to 4, and minPrice resets to 6 after selling',
              codeHint: 'minPrice = 6',
              isCorrect: false,
              misconceptionFeedback: 'We are finding a single best pair across the whole array, so `minPrice` stays at the lowest prefix value (2).'
            }
          ],
          correctExplanation: '`6 - 2 = 4 > 0`, so `bestGain` becomes 4 while `minPrice` remains 2.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 7,
          prompt: 'Iteration i = 3 (`prices[3] = 1`), with `minPrice = 2` and `bestGain = 4`. How do `minPrice` and `bestGain` behave?',
          stateSnapshot: {
            array: [7, 2, 6, 1, 5],
            pointers: { minIdx: 1, i: 3 },
            activeRange: [0, 3],
            highlightedIndices: [1, 3],
            annotation: 'Inspecting new trough prices[3] = 1 while bestGain = 4 is already banked.'
          },
          choices: [
            {
              id: 'c3_correct',
              label: 'minPrice drops to 1 for future indices, while bestGain stays 4',
              codeHint: 'minPrice = 1, bestGain = 4',
              isCorrect: true,
              misconceptionFeedback: 'Right! Lowering `minPrice` to 1 does not erase `bestGain = 4`, because `bestGain` already recorded the valid `[2, 6]` pair.'
            },
            {
              id: 'c3_wrong_pair',
              label: 'bestGain immediately becomes 6 - 1 = 5 using index 2 and index 3',
              codeHint: 'bestGain = 5',
              isCorrect: false,
              misconceptionFeedback: 'Index 2 (price 6) occurred BEFORE index 3 (price 1); you cannot sell at index 2 using a buy price from index 3!'
            }
          ],
          correctExplanation: '`minPrice` updates to 1 for future iterations (`i > 3`), while `bestGain` retains the historical best of 4.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'monotone_decreasing',
      label: 'Strictly Decreasing Bear Market',
      inputLabel: 'prices = [9, 6, 4, 1]',
      edgeCaseNote: 'Tests that no negative transaction overwrites `bestGain = 0` when prices fall every step.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 5,
          prompt: 'At `i = 1` (`prices[1] = 6`, `minPrice = 9`), what is `candidateGain` and what updates?',
          stateSnapshot: {
            array: [9, 6, 4, 1],
            pointers: { minIdx: 0, i: 1 },
            activeRange: [0, 1],
            highlightedIndices: [0, 1],
            annotation: 'Strictly falling prefix: 9 -> 6.'
          },
          choices: [
            {
              id: 'alt1_correct',
              label: 'candidateGain is -3; bestGain stays 0 and minPrice lowers to 6',
              isCorrect: true,
              misconceptionFeedback: 'Correct! `bestGain` stays 0 while `minPrice` tracks the new floor 6.'
            },
            {
              id: 'alt1_wrong',
              label: 'candidateGain is +3 using |6 - 9|',
              isCorrect: false,
              misconceptionFeedback: 'Order matters: `prices[i] - minPrice` is directional (`6 - 9 = -3`), not an absolute difference.'
            }
          ],
          correctExplanation: 'Directional subtraction produces -3, leaving `bestGain = 0` and updating `minPrice = 6`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 9,
          prompt: 'After scanning `4` and `1`, the loop finishes. What is returned?',
          stateSnapshot: {
            array: [9, 6, 4, 1],
            pointers: { minIdx: 3, i: 3 },
            activeRange: [0, 3],
            highlightedIndices: [3],
            annotation: 'End of scan: minPrice reached 1 at index 3, bestGain never exceeded 0.'
          },
          choices: [
            {
              id: 'alt2_correct',
              label: '0, because every valid pair (a < b) had a negative delta',
              isCorrect: true,
              misconceptionFeedback: 'Exactly right. Starting `bestGain = 0` safely handles all-decreasing inputs.'
            },
            {
              id: 'alt2_wrong',
              label: '8 (pairing index 3 with index 0)',
              isCorrect: false,
              misconceptionFeedback: 'Pairing index 3 with index 0 violates time order (`buyIndex < sellIndex`).'
            }
          ],
          correctExplanation: 'The function returns 0 because no upward movement occurred.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What small change is required if the problem REQUIRES making at least one transaction even when all prices decrease (so the answer can be negative)?',
      choices: [
        {
          id: 'ec_arr1_correct',
          label: 'Initialize `bestGain = -Infinity` (or `prices[1] - prices[0]`) and still evaluate `candidateGain` before updating `minPrice`.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Initializing `bestGain = -Infinity` while keeping the strict evaluate-before-update order finds the least-negative valid pair `i < j`.'
        },
        {
          id: 'ec_arr1_wrong',
          label: 'Update `minPrice` before computing `candidateGain` so `prices[i] - minPrice` can equal 0.',
          isCorrect: false,
          misconceptionFeedback: 'Updating `minPrice` first pairs `i` with itself (a 0-length transaction), which is still invalid when `i < j` is required.'
        }
      ],
      explanation: 'Evaluating `prices[i] - minPrice` before updating `minPrice` with `bestGain = -Infinity` forces a genuine non-empty pair `0 <= a < b`.'
    },
    referenceInvariant: 'At the start of step i, minPrice === min(prices[0..i-1]) and bestGain === max(0, max_{0 <= a < b < i}(prices[b] - prices[a])).',
    hintText: 'Check the exact line numbers: line 5 reads `minPrice` (which only knows about `0..i-1`), and line 7 updates `minPrice` with `prices[i]` afterward.',
    reflectionPrompt: 'In one sentence, explain why updating `minPrice` to a smaller value at index `i` never invalidates `bestGain` found at an earlier index.',
    sourceId: 'src_nextstep_original',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 2: ARRAYS 02 ====================
  {
    id: 'ex_arrays_02',
    topicId: 'topic_arrays',
    lessonId: 'les_arrays_02',
    title: 'Proof Trace: Exclusive Prefix & Suffix Accumulation Around Zeros',
    rendererType: 'array_pointers',
    objective: 'Trace two-pass exclusive prefix/suffix products on an array containing a zero without using division.',
    instructions: 'Follow the left-to-right prefix pass and right-to-left suffix pass on `nums = [2, 0, 3]`. Verify what each cell holds before and after multiplying.',
    codeLines: [
      'function productExceptSelf(nums) {',
      '  const out = new Array(nums.length).fill(1);',
      '  let prefix = 1;',
      '  for (let i = 0; i < nums.length; i += 1) {',
      '    out[i] = prefix;',
      '    prefix *= nums[i];',
      '  }',
      '  let suffix = 1;',
      '  for (let i = nums.length - 1; i >= 0; i -= 1) {',
      '    out[i] *= suffix;',
      '    suffix *= nums[i];',
      '  }',
      '  return out;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Single Zero in Middle',
      inputLabel: 'nums = [2, 0, 3]',
      edgeCaseNote: 'Only the index of the single zero (index 1) should survive with a non-zero product (2 * 3 = 6).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 5,
          prompt: 'Pass 1 reaches `i = 1` (`nums[1] = 0`). Before line 6 executes, `prefix` is `2`. What happens to `out[1]` and `prefix`?',
          stateSnapshot: {
            array: [2, 0, 3],
            pointers: { i: 1, prefix: 2 },
            activeRange: [0, 1],
            highlightedIndices: [1],
            annotation: 'Pass 1 at index 1: out so far is [1, _, _], prefix from index 0 is 2.'
          },
          choices: [
            {
              id: 'p2_c1_ok',
              label: 'out[1] receives 2 (the exclusive prefix), then prefix becomes 2 * 0 = 0 for later indices',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Because `out[1] = prefix` runs before `prefix *= nums[1]`, index 1 does NOT get zeroed out by its own zero.'
            },
            {
              id: 'p2_c1_bad',
              label: 'out[1] becomes 0 because nums[1] is 0',
              isCorrect: false,
              misconceptionFeedback: '`out[1]` excludes `nums[1]`! Line 5 writes `prefix` (2) into `out[1]` before line 6 multiplies by `nums[1]`.'
            }
          ],
          correctExplanation: 'Assigning before multiplying keeps `out[1] = 2`, while `prefix` becomes 0 for all indices `> 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 10,
          prompt: 'After Pass 1 completes, `out` is `[1, 2, 0]`. Pass 2 starts at `i = 2` (`nums[2] = 3`) with `suffix = 1`, then moves to `i = 1` (`nums[1] = 0`) with `suffix = 3`. What happens at `i = 1`?',
          stateSnapshot: {
            array: [1, 2, 0],
            pointers: { i: 1, suffix: 3 },
            activeRange: [1, 2],
            highlightedIndices: [1],
            annotation: 'Pass 2 at index 1: out[1] holds prefix 2, suffix from index 2 holds 3.'
          },
          choices: [
            {
              id: 'p2_c2_ok',
              label: 'out[1] becomes 2 * 3 = 6, then suffix becomes 3 * 0 = 0 for index 0',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Index 1 combines left prefix 2 and right suffix 3 to get 6, and then zeros `suffix` for index 0.'
            },
            {
              id: 'p2_c2_bad',
              label: 'out[1] becomes 6, and suffix stays 3 so we do not lose information',
              isCorrect: false,
              misconceptionFeedback: 'For index 0, `nums[1] = 0` IS part of its right suffix, so `suffix` must become `3 * 0 = 0`.'
            }
          ],
          correctExplanation: '`out[1]` becomes `2 * 3 = 6`, and `suffix` becomes `0`, which then sets `out[0] = 1 * 0 = 0`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'double_zero',
      label: 'Two Zeros in Array',
      inputLabel: 'nums = [0, 4, 0]',
      edgeCaseNote: 'With two zeros, every index has at least one zero in either its left prefix or right suffix.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'In Pass 1 on `nums = [0, 4, 0]`, what is the `out` array after the left-to-right loop finishes?',
          stateSnapshot: {
            array: [0, 4, 0],
            pointers: { i: 2, prefix: 0 },
            activeRange: [0, 2],
            highlightedIndices: [0, 1, 2],
            annotation: 'nums[0] = 0 immediately turns prefix into 0 after index 0.'
          },
          choices: [
            {
              id: 'alt_p2_1_ok',
              label: 'out is [1, 0, 0] because index 0 has empty prefix 1, and nums[0]=0 zeros prefix for indices 1 and 2',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Only index 0 escapes the zero at `nums[0]` during Pass 1.'
            },
            {
              id: 'alt_p2_1_bad',
              label: 'out is [0, 0, 0] immediately after Pass 1',
              isCorrect: false,
              misconceptionFeedback: 'At `i = 0`, `prefix` starts at `1`, so `out[0]` is `1` after Pass 1; it only becomes `0` during Pass 2.'
            }
          ],
          correctExplanation: 'Pass 1 leaves `out = [1, 0, 0]`, and Pass 2 multiplies `out[0]` by `suffix = 0` (from `nums[2] = 0`), yielding `[0, 0, 0]`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 12,
          prompt: 'After Pass 2 sweeps right-to-left over `[0, 4, 0]`, what is the final returned array?',
          stateSnapshot: {
            array: [0, 0, 0],
            pointers: { i: 0, suffix: 0 },
            activeRange: [0, 2],
            highlightedIndices: [0],
            annotation: 'nums[2] = 0 zeros out suffix before Pass 2 reaches index 0.'
          },
          choices: [
            {
              id: 'alt_p2_2_ok',
              label: '[0, 0, 0] because index 0 gets multiplied by suffix 0 from nums[2]',
              isCorrect: true,
              misconceptionFeedback: 'Exactly! Two zeros mean every single position has at least one other zero elsewhere.'
            },
            {
              id: 'alt_p2_2_bad',
              label: '[4, 0, 4] by skipping zeros during multiplication',
              isCorrect: false,
              misconceptionFeedback: 'Zero is a real multiplier in the array, not a missing value.'
            }
          ],
          correctExplanation: 'Every position excludes itself but still includes the other zero, so the output is `[0, 0, 0]`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'In JavaScript, multiplying `-1 * 0` yields `-0`. How can you normalize `-0` to `0` if a strict test checks `Object.is(val, 0)`?',
      choices: [
        {
          id: 'ec_arr2_ok',
          label: 'Use `out[i] === 0 ? 0 : out[i]` (or `out[i] + 0`) when storing the product.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! In IEEE-754 floating point, `-0 === 0` is true, so `x === 0 ? 0 : x` (or `x + 0`) converts `-0` to `+0`.'
        },
        {
          id: 'ec_arr2_bad',
          label: 'Use `Math.abs(out[i])` on every element.',
          isCorrect: false,
          misconceptionFeedback: '`Math.abs` would destroy legitimate negative products like `-12`!'
        }
      ],
      explanation: 'Adding `0` (`x + 0`) or checking `x === 0 ? 0 : x` converts IEEE-754 `-0` into `+0` without altering negative numbers.'
    },
    referenceInvariant: 'After Pass 1, out[i] === prod(nums[0..i-1]). At step i of Pass 2, suffix === prod(nums[i+1..n-1]), so out[i] * suffix === prod(nums[0..i-1]) * prod(nums[i+1..n-1]).',
    hintText: 'Write `out[i]` BEFORE updating `prefix` or `suffix` with `nums[i]` so `nums[i]` is never multiplied into its own slot.',
    reflectionPrompt: 'Why does separating exclusive left state and exclusive right state into two passes eliminate all special-case branching for zeros?',
    sourceId: 'src_ods_cc_by',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 3: HASHING 01 ====================
  {
    id: 'ex_hashing_01',
    topicId: 'topic_hashing',
    lessonId: 'les_hashing_01',
    title: 'Proof Trace: Complement Lookup-Before-Insert on Duplicate Targets',
    rendererType: 'set_map_lookup',
    objective: 'Trace how checking `indexByVal.has(need)` before `indexByVal.set(nums[i], i)` handles duplicate values and avoids self-matching.',
    instructions: 'Inspect the array pointer and Map entries at each step. Choose the exact state transition for `indexByVal`.',
    codeLines: [
      'function findComplementPair(nums, target) {',
      '  const indexByVal = new Map();',
      '  for (let i = 0; i < nums.length; i += 1) {',
      '    const need = target - nums[i];',
      '    if (indexByVal.has(need)) {',
      '      return [indexByVal.get(need), i];',
      '    }',
      '    indexByVal.set(nums[i], i);',
      '  }',
      '  return null;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Self-Complement Trap (Half of Target)',
      inputLabel: 'nums = [3, 2, 4, 3], target = 6',
      edgeCaseNote: 'Index 0 has value 3 (`need = 3`), which equals half of `target = 6`. It must NOT match itself at `i = 0`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 5,
          prompt: 'At `i = 0` (`nums[0] = 3`, `target = 6`), `need` is `3`. What is in `indexByVal` when line 5 (`indexByVal.has(3)`) runs?',
          stateSnapshot: {
            array: [3, 2, 4, 3],
            pointers: { i: 0, need: 3 },
            highlightedIndices: [0],
            mapEntries: [],
            annotation: 'Checking indexByVal.has(3) before inserting nums[0].'
          },
          choices: [
            {
              id: 'h1_c1_ok',
              label: 'indexByVal is empty, so has(3) is false; then line 8 inserts (3 -> 0)',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Because we check before inserting, `nums[0] = 3` cannot match itself.'
            },
            {
              id: 'h1_c1_bad',
              label: 'indexByVal already contains (3 -> 0) and returns [0, 0]',
              isCorrect: false,
              misconceptionFeedback: 'That bug only happens if you insert before checking or pre-populate the map without checking `idx !== i`.'
            }
          ],
          correctExplanation: 'Checking `has(need)` before `set(nums[i], i)` ensures the map only holds indices `< i`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 5,
          prompt: 'At `i = 1` (`nums[1] = 2`, `need = 4`), `4` is not in the map so `(2 -> 1)` is inserted. Now at `i = 2` (`nums[2] = 4`), what happens?',
          stateSnapshot: {
            array: [3, 2, 4, 3],
            pointers: { i: 2, need: 2 },
            highlightedIndices: [1, 2],
            mapEntries: [
              { key: '3', value: '0' },
              { key: '2', value: '1' }
            ],
            annotation: 'At i = 2 (val 4), need = 6 - 4 = 2. Map holds {3: 0, 2: 1}.'
          },
          choices: [
            {
              id: 'h1_c2_ok',
              label: 'indexByVal.has(2) is true and returns [1, 2] immediately',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! `indexByVal.get(2)` is `1`, returning `[1, 2]`.'
            },
            {
              id: 'h1_c2_bad',
              label: 'It inserts (4 -> 2) and waits until i = 3 to match the two 3s',
              isCorrect: false,
              misconceptionFeedback: 'Line 6 returns immediately as soon as the first valid pair `[1, 2]` is completed.'
            }
          ],
          correctExplanation: 'At `i = 2`, partner `2` is already in `indexByVal` at index `1`, so `[1, 2]` is returned.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'duplicate_pair_at_zero',
      label: 'Duplicate Values Matching Index 0',
      inputLabel: 'nums = [3, 3], target = 6',
      edgeCaseNote: 'Tests both duplicate keys and matching a partner located at index `0`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'After `i = 0` finishes on `nums = [3, 3]`, what is in `indexByVal` as `i = 1` begins?',
          stateSnapshot: {
            array: [3, 3],
            pointers: { i: 1, need: 3 },
            highlightedIndices: [0, 1],
            mapEntries: [{ key: '3', value: '0' }],
            annotation: 'i = 1 (val 3) needs 3, which is stored at index 0.'
          },
          choices: [
            {
              id: 'alt_h1_1_ok',
              label: 'Map holds {3 -> 0}; at i = 1, indexByVal.has(3) is true and returns [0, 1] before overwriting key 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Because we check `has(3)` BEFORE calling `set(3, 1)`, we never overwrite index 0 before matching it.'
            },
            {
              id: 'alt_h1_1_bad',
              label: 'The second 3 overwrites (3 -> 0) with (3 -> 1), losing index 0',
              isCorrect: false,
              misconceptionFeedback: 'Since lookup happens on line 5 before insertion on line 8, `[0, 1]` is returned before `set` is reached.'
            }
          ],
          correctExplanation: 'Lookup-before-insert matches the second `3` against the first `3` at index 0 without overwriting it.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 5,
          prompt: 'Why was `indexByVal.has(need)` critical here instead of `if (indexByVal.get(need))`?',
          stateSnapshot: {
            array: [3, 3],
            pointers: { i: 1, need: 3 },
            highlightedIndices: [0, 1],
            mapEntries: [{ key: '3', value: '0' }],
            annotation: 'indexByVal.get(3) returns the number 0.'
          },
          choices: [
            {
              id: 'alt_h1_2_ok',
              label: 'Because indexByVal.get(3) returns 0, which is falsy in `if (0)` and would skip the match!',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! `has(3)` returns `true` even when the stored value is `0`.'
            },
            {
              id: 'alt_h1_2_bad',
              label: 'Because `get()` deletes the key from the Map.',
              isCorrect: false,
              misconceptionFeedback: '`get()` is read-only; the danger is that `0` is falsy in JavaScript.'
            }
          ],
          correctExplanation: '`indexByVal.has(need)` returns a boolean and is immune to falsy index `0`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'Suppose `[2, 2, 5]` has `target = 7`. Both index 0 and index 1 hold `2`. If the problem asks for the EARLIEST partner index `[0, 2]`, how should you handle duplicate insertions?',
      choices: [
        {
          id: 'ec_h1_ok',
          label: 'Only call `indexByVal.set(nums[i], i)` if `!indexByVal.has(nums[i])`, preserving the first index of each value.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Guarding `set` with `!indexByVal.has(nums[i])` keeps the earliest index (`0`) instead of overwriting it with `1`.'
        },
        {
          id: 'ec_h1_bad',
          label: 'Clear the map whenever a duplicate value is encountered.',
          isCorrect: false,
          misconceptionFeedback: 'Clearing the map would erase all previously seen values.'
        }
      ],
      explanation: 'Unconditional `set` keeps the most recent index; guarding with `!map.has(x)` keeps the earliest index.'
    },
    referenceInvariant: 'At line 5 of iteration i, indexByVal contains every value from nums[0..i-1] and no value from nums[i..n-1].',
    hintText: 'Trace the exact moment `has(need)` is called: has `nums[i]` been added to the Map yet?',
    reflectionPrompt: 'When should a hash map keep the FIRST index of a duplicate key versus the MOST RECENT index?',
    sourceId: 'src_nextstep_original',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 4: HASHING 02 ====================
  {
    id: 'ex_hashing_02',
    topicId: 'topic_hashing',
    lessonId: 'les_hashing_03',
    title: 'Proof Trace: Prefix-Sum Frequency Map with Negative Numbers',
    rendererType: 'set_map_lookup',
    objective: 'Trace how `prefixCounts` seeded with `{0: 1}` counts overlapping and negative-sum subarrays summing to `k`.',
    instructions: 'Step through `nums = [1, -1, 1]` with `k = 1`. Watch how revisiting prefix sum `0` increases future match counts.',
    codeLines: [
      'function countSubarraysWithSum(nums, k) {',
      '  const prefixCounts = new Map([[0, 1]]);',
      '  let runningSum = 0;',
      '  let totalMatches = 0;',
      '  for (let i = 0; i < nums.length; i += 1) {',
      '    runningSum += nums[i];',
      '    const neededPrefix = runningSum - k;',
      '    totalMatches += prefixCounts.get(neededPrefix) ?? 0;',
      '    prefixCounts.set(runningSum, (prefixCounts.get(runningSum) ?? 0) + 1);',
      '  }',
      '  return totalMatches;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Revisiting Prefix Zero via Cancelation',
      inputLabel: 'nums = [1, -1, 1], k = 1',
      edgeCaseNote: 'The prefix sum after `[1, -1]` returns to `0`, meaning there are now TWO earlier prefixes with sum `0`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'At `i = 0` (`nums[0] = 1`, `k = 1`), `runningSum` becomes `1` and `neededPrefix = 0`. What happens to `totalMatches` and `prefixCounts`?',
          stateSnapshot: {
            array: [1, -1, 1],
            pointers: { i: 0, runningSum: 1, neededPrefix: 0 },
            highlightedIndices: [0],
            mapEntries: [{ key: '0', value: '1' }],
            annotation: 'Seed {0: 1} is already in prefixCounts before index 0.'
          },
          choices: [
            {
              id: 'h2_c1_ok',
              label: 'totalMatches increases by 1 (matching seed 0), and prefixCounts becomes {0: 1, 1: 1}',
              isCorrect: true,
              misconceptionFeedback: 'Correct! The seed `{0: 1}` allows the single-element subarray `nums[0..0] = [1]` to be counted.'
            },
            {
              id: 'h2_c1_bad',
              label: 'totalMatches stays 0 because index 0 has no elements to its left',
              isCorrect: false,
              misconceptionFeedback: 'The empty prefix before index 0 has sum 0, which is why `{0: 1}` was seeded!'
            }
          ],
          correctExplanation: 'Matching `neededPrefix = 0` against `{0: 1}` counts `nums[0..0]` and records `1 -> 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 9,
          prompt: 'At `i = 1` (`nums[1] = -1`), `runningSum` returns to `0` (`neededPrefix = -1`, not in map). How does `prefixCounts` update on line 9?',
          stateSnapshot: {
            array: [1, -1, 1],
            pointers: { i: 1, runningSum: 0, neededPrefix: -1 },
            highlightedIndices: [0, 1],
            mapEntries: [
              { key: '0', value: '1' },
              { key: '1', value: '1' }
            ],
            annotation: 'Prefix [1, -1] sums to 0, revisiting key 0.'
          },
          choices: [
            {
              id: 'h2_c2_ok',
              label: 'Key 0 increments from 1 to 2 (`{0: 2, 1: 1}`), representing two prefixes with sum 0 (empty prefix and nums[0..1])',
              isCorrect: true,
              misconceptionFeedback: 'Exactly! Both the empty prefix and `nums[0..1]` have sum 0.'
            },
            {
              id: 'h2_c2_bad',
              label: 'Key 0 stays 1 because a Set of seen prefix sums is sufficient',
              isCorrect: false,
              misconceptionFeedback: 'If you only kept `0 -> 1`, you would miss one of the two valid subarrays ending at index 2!'
            }
          ],
          correctExplanation: 'Incrementing `0 -> 2` records that two distinct split points have prefix sum 0.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 8,
          prompt: 'At `i = 2` (`nums[2] = 1`), `runningSum` is `1` and `neededPrefix = 1 - 1 = 0`. How much does `totalMatches` increase on line 8?',
          stateSnapshot: {
            array: [1, -1, 1],
            pointers: { i: 2, runningSum: 1, neededPrefix: 0 },
            highlightedIndices: [0, 1, 2],
            mapEntries: [
              { key: '0', value: '2' },
              { key: '1', value: '1' }
            ],
            annotation: 'At i = 2, prefixCounts.get(0) is 2.'
          },
          choices: [
            {
              id: 'h2_c3_ok',
              label: 'It increases by 2 (to 3 total), counting both `nums[0..2] = [1, -1, 1]` and `nums[2..2] = [1]` in O(1)!',
              isCorrect: true,
              misconceptionFeedback: 'Brilliant! Each of the 2 earlier prefixes with sum 0 defines a distinct valid subarray ending at index 2.'
            },
            {
              id: 'h2_c3_bad',
              label: 'It increases by 1 because only one subarray can end at index 2',
              isCorrect: false,
              misconceptionFeedback: 'Because `nums[0..1]` sums to 0, both `[1, -1, 1]` and `[1]` end at index 2 with sum 1!'
            }
          ],
          correctExplanation: 'Looking up `prefixCounts.get(0) = 2` simultaneously counts both subarrays ending at index 2.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'zero_target',
      label: 'Zero Target Sum (k = 0)',
      inputLabel: 'nums = [2, -2], k = 0',
      edgeCaseNote: 'When `k = 0`, `neededPrefix === runningSum`. Querying BEFORE incrementing prevents matching the current prefix with itself.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'At `i = 0` (`nums[0] = 2`, `k = 0`), `runningSum = 2` and `neededPrefix = 2`. Why does `totalMatches` stay `0`?',
          stateSnapshot: {
            array: [2, -2],
            pointers: { i: 0, runningSum: 2, neededPrefix: 2 },
            highlightedIndices: [0],
            mapEntries: [{ key: '0', value: '1' }],
            annotation: 'k = 0: neededPrefix is 2, which is not yet in prefixCounts.'
          },
          choices: [
            {
              id: 'alt_h2_1_ok',
              label: 'Because line 8 queries prefixCounts.get(2) BEFORE line 9 inserts 2 into the map',
              isCorrect: true,
              misconceptionFeedback: 'Correct! If line 9 ran first, `runningSum = 2` would match itself and count an empty subarray!'
            },
            {
              id: 'alt_h2_1_bad',
              label: 'Because k = 0 is not allowed in prefix sum maps',
              isCorrect: false,
              misconceptionFeedback: '`k = 0` works cleanly as long as you query before inserting.'
            }
          ],
          correctExplanation: 'Query-before-insert prevents zero-length self-matches when `k = 0`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 8,
          prompt: 'At `i = 1` (`nums[1] = -2`, `k = 0`), `runningSum` becomes `0` and `neededPrefix = 0`. What is returned?',
          stateSnapshot: {
            array: [2, -2],
            pointers: { i: 1, runningSum: 0, neededPrefix: 0 },
            highlightedIndices: [0, 1],
            mapEntries: [
              { key: '0', value: '1' },
              { key: '2', value: '1' }
            ],
            annotation: 'runningSum = 0 matches the seed {0: 1}.'
          },
          choices: [
            {
              id: 'alt_h2_2_ok',
              label: 'totalMatches becomes 1 (from prefixCounts.get(0) === 1), counting [2, -2]',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! `nums[0..1] = [2, -2]` sums to 0.'
            },
            {
              id: 'alt_h2_2_bad',
              label: 'totalMatches becomes 2',
              isCorrect: false,
              misconceptionFeedback: 'At the moment line 8 runs, `0` has count `1` in the map; it only becomes `2` on line 9 afterward.'
            }
          ],
          correctExplanation: 'Line 8 reads the pre-existing count `1` for key `0` and returns `1`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'Why does a two-pointer sliding window fail on `nums = [1, -1, 1]` with `k = 1`, whereas the prefix-sum map succeeds?',
      choices: [
        {
          id: 'ec_h2_ok',
          label: 'Because negative numbers break window monotonicity: shrinking the left pointer can either increase or decrease the window sum.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Sliding window pointers rely on the guarantee that advancing `left` monotonically changes the window sum.'
        },
        {
          id: 'ec_h2_bad',
          label: 'Because sliding windows cannot process arrays of odd length.',
          isCorrect: false,
          misconceptionFeedback: 'Array length has no impact; negative values break the monotonic sum invariant.'
        }
      ],
      explanation: 'Prefix-sum maps depend only on additive inverse (`prefix[R] - prefix[L-1] = k`), which holds for all real/integer values.'
    },
    referenceInvariant: 'At line 8 of step i, prefixCounts.get(p) equals the exact count of indices j in {-1, 0, ..., i-1} whose prefix sum nums[0..j] equals p.',
    hintText: 'Remember that subtracting an earlier prefix sum `nums[0..L-1]` from `nums[0..R]` leaves the contiguous slice `nums[L..R]`.',
    reflectionPrompt: 'How does the `{0: 1}` seed unify subarrays that start at index `0` with subarrays that start at `L > 0`?',
    sourceId: 'src_nextstep_original',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 5: BINARY SEARCH 01 ====================
  {
    id: 'ex_binary_search_01',
    topicId: 'topic_binary_search',
    lessonId: 'les_binary_search_01',
    title: 'Proof Trace: Half-Open Lower Bound on Duplicate Targets',
    rendererType: 'binary_search_bounds',
    objective: 'Trace `lo`, `mid`, and `hi` on a sorted array with duplicates to prove `lowerBound` converges to the FIRST index `>= target`.',
    instructions: 'Inspect the `[lo, hi)` interval and `mid` pointer at each iteration. Select the bound update that preserves the lower-bound invariant.',
    codeLines: [
      'function lowerBound(nums, target) {',
      '  let lo = 0;',
      '  let hi = nums.length;',
      '  while (lo < hi) {',
      '    const mid = lo + Math.floor((hi - lo) / 2);',
      '    if (nums[mid] >= target) {',
      '      hi = mid;',
      '    } else {',
      '      lo = mid + 1;',
      '    }',
      '  }',
      '  return lo;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'First Occurrence Among Duplicates',
      inputLabel: 'nums = [2, 4, 4, 4, 8, 10], target = 4',
      edgeCaseNote: '`nums[3] = 4` matches `target` on the very first probe, but it is NOT the first `4`! Watch how `hi = mid` keeps searching left.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Start `lo = 0, hi = 6`. `mid = 3` (`nums[3] = 4 >= 4`). Why do we set `hi = 3` instead of returning `3` or setting `hi = 2`?',
          stateSnapshot: {
            array: [2, 4, 4, 4, 8, 10],
            pointers: { lo: 0, mid: 3, hi: 6 },
            activeRange: [0, 5],
            highlightedIndices: [3],
            annotation: 'Probing mid = 3 (value 4). Earlier indices 1 and 2 also equal 4!'
          },
          choices: [
            {
              id: 'bs1_c1_ok',
              label: 'Set hi = 3: index 3 satisfies >= 4 (so it could be the answer), while indices 0..2 might hold an even earlier 4',
              isCorrect: true,
              misconceptionFeedback: 'Correct! `hi = mid` preserves `mid` as our best-so-far true boundary while continuing to test `0..2`.'
            },
            {
              id: 'bs1_c1_ret',
              label: 'Return 3 immediately because nums[3] === target',
              isCorrect: false,
              misconceptionFeedback: 'Returning on the first hit gives index 3, missing the earlier occurrences of 4 at indices 1 and 2!'
            },
            {
              id: 'bs1_c1_hi2',
              label: 'Set hi = mid - 1 (2) to search strictly left of 3',
              isCorrect: false,
              misconceptionFeedback: 'If index 3 had been the ONLY 4 in the array, setting `hi = 2` would discard the answer completely!'
            }
          ],
          correctExplanation: '`hi = mid` keeps `mid` as the inclusive right boundary of known-true indices while shrinking the active search space to `[0, 3)`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'Now `lo = 0, hi = 3`, so `mid = 1` (`nums[1] = 4 >= 4`). What is the next `[lo, hi]` interval?',
          stateSnapshot: {
            array: [2, 4, 4, 4, 8, 10],
            pointers: { lo: 0, mid: 1, hi: 3 },
            activeRange: [0, 2],
            highlightedIndices: [1],
            annotation: 'Probing mid = 1 (value 4 >= 4).'
          },
          choices: [
            {
              id: 'bs1_c2_ok',
              label: 'lo = 0, hi = 1 (since nums[1] >= 4, hi moves to 1)',
              isCorrect: true,
              misconceptionFeedback: 'Right! Now only index 0 remains to be tested against index 1.'
            },
            {
              id: 'bs1_c2_bad',
              label: 'lo = 2, hi = 3',
              isCorrect: false,
              misconceptionFeedback: 'Advancing `lo` when `nums[mid] >= target` would move right into duplicates instead of finding the leftmost one.'
            }
          ],
          correctExplanation: 'Since `nums[1] >= 4`, `hi` tightens to `1`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 9,
          prompt: 'Now `lo = 0, hi = 1`, so `mid = 0` (`nums[0] = 2 < 4`). How does the loop finish?',
          stateSnapshot: {
            array: [2, 4, 4, 4, 8, 10],
            pointers: { lo: 0, mid: 0, hi: 1 },
            activeRange: [0, 0],
            highlightedIndices: [0, 1],
            annotation: 'Probing mid = 0 (value 2 < 4).'
          },
          choices: [
            {
              id: 'bs1_c3_ok',
              label: 'lo becomes mid + 1 = 1; now lo === hi === 1, so the loop exits and returns 1',
              isCorrect: true,
              misconceptionFeedback: 'Exact convergence! All indices `< 1` are `< 4`, and index `1` is the first index `>= 4`.'
            },
            {
              id: 'bs1_c3_bad',
              label: 'lo becomes mid = 0 and loops one more time',
              isCorrect: false,
              misconceptionFeedback: 'Setting `lo = mid` when `mid === 0` would leave `lo = 0, hi = 1` forever!'
            }
          ],
          correctExplanation: '`lo = mid + 1` brings `lo` to `1 === hi`, terminating cleanly at the first `4`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'target_beyond_max',
      label: 'Target Larger Than All Elements',
      inputLabel: 'nums = [2, 4, 8], target = 15',
      edgeCaseNote: 'Tests why `hi` starts at `nums.length` (3) rather than `nums.length - 1` (2).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 9,
          prompt: 'Start `lo = 0, hi = 3`. `mid = 1` (`nums[1] = 4 < 15`). What is the updated `[lo, hi]`?',
          stateSnapshot: {
            array: [2, 4, 8],
            pointers: { lo: 0, mid: 1, hi: 3 },
            activeRange: [0, 2],
            highlightedIndices: [1],
            annotation: 'nums[1] = 4 < 15 -> false branch.'
          },
          choices: [
            {
              id: 'alt_bs1_1_ok',
              label: 'lo = 2, hi = 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Indices 0 and 1 are discarded.'
            },
            {
              id: 'alt_bs1_1_bad',
              label: 'lo = 1, hi = 3',
              isCorrect: false,
              misconceptionFeedback: 'Index 1 is already proven `< 15`, so `lo` advances to `mid + 1 = 2`.'
            }
          ],
          correctExplanation: '`lo` advances to `2` while `hi` stays `3`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 11,
          prompt: 'Now `lo = 2, hi = 3`, so `mid = 2` (`nums[2] = 8 < 15`). What happens next?',
          stateSnapshot: {
            array: [2, 4, 8],
            pointers: { lo: 2, mid: 2, hi: 3 },
            activeRange: [2, 2],
            highlightedIndices: [2],
            annotation: 'nums[2] = 8 < 15 -> lo advances to 3.'
          },
          choices: [
            {
              id: 'alt_bs1_2_ok',
              label: 'lo becomes 3 (=== nums.length), loop exits, and returns 3 as the insertion index past the end',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Returning `nums.length` tells the caller that every element in `nums` is `< target`.'
            },
            {
              id: 'alt_bs1_2_bad',
              label: 'It throws an out-of-bounds error by reading nums[3]',
              isCorrect: false,
              misconceptionFeedback: 'Because `lo === hi === 3`, the `while (lo < hi)` guard terminates BEFORE `nums[3]` is ever read!'
            }
          ],
          correctExplanation: 'Because `mid < hi` whenever `lo < hi`, `nums[nums.length]` is never dereferenced inside the loop.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'After `idx = lowerBound(nums, target)` returns, what exact condition checks whether `target` actually exists in `nums`?',
      choices: [
        {
          id: 'ec_bs1_ok',
          label: '`idx < nums.length && nums[idx] === target`',
          isCorrect: true,
          misconceptionFeedback: 'Correct! First verify `idx` did not land at `nums.length`, then verify the element at `idx` equals `target` (rather than being strictly greater).'
        },
        {
          id: 'ec_bs1_bad',
          label: '`idx >= 0`',
          isCorrect: false,
          misconceptionFeedback: '`lowerBound` ALWAYS returns an index in `0..nums.length`, even when `target` is missing!'
        }
      ],
      explanation: '`lowerBound` finds the first index `>= target`; checking `idx < nums.length && nums[idx] === target` confirms an exact match.'
    },
    referenceInvariant: 'Throughout while (lo < hi), for all i < lo: nums[i] < target; and for all i >= hi: nums[i] >= target.',
    hintText: 'Ask yourself: when `nums[mid] >= target`, is `mid` still a valid candidate for the first index `>= target`? Yes—so set `hi = mid`.',
    reflectionPrompt: 'Why does `mid = lo + Math.floor((hi - lo) / 2)` guarantee `mid < hi` whenever `lo < hi`, ensuring `nums[nums.length]` is never accessed?',
    sourceId: 'src_ods_cc_by',
    packId: 'pack_first_release_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 6: BINARY SEARCH 02 ====================
  {
    id: 'ex_binary_search_02',
    topicId: 'topic_binary_search',
    lessonId: 'les_binary_search_02',
    title: 'Proof Trace: Rotated Sorted Array Minimum Discrimination',
    rendererType: 'binary_search_bounds',
    objective: 'Trace `nums[mid] > nums[hi]` on rotated and unrotated subarrays to locate the pivot minimum in O(log n).',
    instructions: 'Compare `nums[mid]` with `nums[hi]` at each step and choose the interval update that keeps the minimum inside `[lo..hi]`.',
    codeLines: [
      'function findMinInRotated(nums) {',
      '  let lo = 0;',
      '  let hi = nums.length - 1;',
      '  while (lo < hi) {',
      '    const mid = lo + Math.floor((hi - lo) / 2);',
      '    if (nums[mid] > nums[hi]) {',
      '      lo = mid + 1;',
      '    } else {',
      '      hi = mid;',
      '    }',
      '  }',
      '  return nums[lo];',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Pivot Cliff in Right Half',
      inputLabel: 'nums = [4, 5, 6, 7, 0, 1, 2]',
      edgeCaseNote: 'The cliff drops from `7` (index 3) to `0` (index 4).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Start `lo = 0, hi = 6`. `mid = 3` (`nums[3] = 7`, `nums[6] = 2`). Since `7 > 2`, where must the minimum lie?',
          stateSnapshot: {
            array: [4, 5, 6, 7, 0, 1, 2],
            pointers: { lo: 0, mid: 3, hi: 6 },
            activeRange: [0, 6],
            highlightedIndices: [3, 6],
            annotation: 'nums[mid] = 7 > nums[hi] = 2: the rotation drop is to the right of mid.'
          },
          choices: [
            {
              id: 'bs2_c1_ok',
              label: 'Strictly right of mid (`lo = mid + 1 = 4`), because 7 > 2 proves the cliff is in [4..6]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! And since `7 > 2`, index 3 itself cannot be the minimum, so `lo = 4` safely excludes `mid`.'
            },
            {
              id: 'bs2_c1_bad',
              label: 'In [0..3] (`hi = 3`), because [0..3] is sorted',
              isCorrect: false,
              misconceptionFeedback: '`[0..3]` is the HIGH plateau `[4, 5, 6, 7]` before the wrap-around drop to `0`!'
            }
          ],
          correctExplanation: '`nums[mid] > nums[hi]` means the wrap-around drop occurs after `mid`, so `lo = mid + 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 8,
          prompt: 'Now `lo = 4, hi = 6` (`subarray [0, 1, 2]`), so `mid = 5` (`nums[5] = 1`, `nums[6] = 2`). Since `1 <= 2`, what updates?',
          stateSnapshot: {
            array: [4, 5, 6, 7, 0, 1, 2],
            pointers: { lo: 4, mid: 5, hi: 6 },
            activeRange: [4, 6],
            highlightedIndices: [5, 6],
            annotation: 'nums[mid] = 1 <= nums[hi] = 2: right side [5..6] is rising smoothly.'
          },
          choices: [
            {
              id: 'bs2_c2_ok',
              label: 'hi = mid = 5, keeping mid in play while discarding index 6',
              isCorrect: true,
              misconceptionFeedback: 'Right! Since `nums[5] <= nums[6]`, index 6 cannot be smaller than index 5, but index 5 (or 4) could be the minimum.'
            },
            {
              id: 'bs2_c2_bad',
              label: 'hi = mid - 1 = 4',
              isCorrect: false,
              misconceptionFeedback: 'If `mid` itself had been the minimum (e.g., if `mid` landed on `0`), `hi = mid - 1` would discard the minimum!'
            }
          ],
          correctExplanation: 'When `nums[mid] <= nums[hi]`, the minimum is at `mid` or to its left, so `hi = mid`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 8,
          prompt: 'Now `lo = 4, hi = 5` (`[0, 1]`), so `mid = 4` (`nums[4] = 0 <= nums[5] = 1`). How does it terminate?',
          stateSnapshot: {
            array: [4, 5, 6, 7, 0, 1, 2],
            pointers: { lo: 4, mid: 4, hi: 5 },
            activeRange: [4, 5],
            highlightedIndices: [4, 5],
            annotation: 'nums[4] = 0 <= nums[5] = 1 -> hi becomes 4.'
          },
          choices: [
            {
              id: 'bs2_c3_ok',
              label: 'hi becomes mid = 4; now lo === hi === 4 and nums[4] = 0 is returned',
              isCorrect: true,
              misconceptionFeedback: 'Exact convergence to index 4 (`0`).'
            },
            {
              id: 'bs2_c3_bad',
              label: 'lo becomes mid + 1 = 5 and returns 1',
              isCorrect: false,
              misconceptionFeedback: '`0 <= 1` takes the `else` branch (`hi = mid`), not `lo = mid + 1`.'
            }
          ],
          correctExplanation: '`hi = mid` sets `hi = 4 === lo`, returning `nums[4] = 0`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'already_sorted',
      label: 'Unrotated / Full-Cycle Sorted Array',
      inputLabel: 'nums = [1, 3, 5, 7]',
      edgeCaseNote: 'Proves why comparing against `nums[hi]` works even when the array was rotated 0 (or `n`) times.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'On `nums = [1, 3, 5, 7]`, `lo = 0, hi = 3, mid = 1` (`nums[1] = 3`, `nums[3] = 7`). Which branch executes?',
          stateSnapshot: {
            array: [1, 3, 5, 7],
            pointers: { lo: 0, mid: 1, hi: 3 },
            activeRange: [0, 3],
            highlightedIndices: [1, 3],
            annotation: 'nums[1] = 3 <= nums[3] = 7.'
          },
          choices: [
            {
              id: 'alt_bs2_1_ok',
              label: '3 <= 7 takes the else branch (`hi = 1`), rightly walking left toward index 0',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Had you compared `nums[mid] > nums[lo]` (`3 > 1`), you might have falsely walked right!'
            },
            {
              id: 'alt_bs2_1_bad',
              label: 'lo = 2 because 3 > nums[0]',
              isCorrect: false,
              misconceptionFeedback: 'Walking right on an unrotated array discards the minimum at index 0!'
            }
          ],
          correctExplanation: '`nums[mid] <= nums[hi]` shrinks `hi` leftward all the way to `0`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 11,
          prompt: 'Next `lo = 0, hi = 1, mid = 0` (`nums[0] = 1 <= nums[1] = 3`). What happens?',
          stateSnapshot: {
            array: [1, 3, 5, 7],
            pointers: { lo: 0, mid: 0, hi: 1 },
            activeRange: [0, 1],
            highlightedIndices: [0, 1],
            annotation: 'nums[0] = 1 <= nums[1] = 3 -> hi becomes 0.'
          },
          choices: [
            {
              id: 'alt_bs2_2_ok',
              label: 'hi becomes 0; loop exits and returns nums[0] = 1',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Zero special cases needed for unrotated inputs.'
            },
            {
              id: 'alt_bs2_2_bad',
              label: 'hi becomes -1 and crashes',
              isCorrect: false,
              misconceptionFeedback: '`hi` is set to `mid` (`0`), never `mid - 1`.'
            }
          ],
          correctExplanation: '`hi = mid` converges to `0` and returns `1`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What happens if the rotated array contains duplicates such that `nums[lo] === nums[mid] === nums[hi]` (e.g., `[2, 2, 2, 0, 2]` vs `[2, 0, 2, 2, 2]`)?',
      choices: [
        {
          id: 'ec_bs2_ok',
          label: 'Neither half can be ruled out in O(1); you must conservatively decrement `hi -= 1` (degrading worst-case time to O(n) on all-duplicates).',
          isCorrect: true,
          misconceptionFeedback: 'Correct! When `nums[mid] === nums[hi]`, the minimum `0` could hide on either side of `mid`, so only `hi -= 1` is safe.'
        },
        {
          id: 'ec_bs2_bad',
          label: 'Set `lo = mid + 1` anyway because duplicates are always on the left.',
          isCorrect: false,
          misconceptionFeedback: 'In `[2, 0, 2, 2, 2]`, `mid = 2` has `0` on its LEFT, so `lo = mid + 1` would skip `0`!'
        }
      ],
      explanation: 'Duplicate plateaus where `nums[lo] === nums[mid] === nums[hi]` destroy O(1) side discrimination, requiring `hi -= 1`.'
    },
    referenceInvariant: 'Throughout while (lo < hi), min(nums) === min(nums[lo..hi]).',
    hintText: 'Compare `nums[mid]` with `nums[hi]`: if the middle is taller than the right edge, the cliff drop MUST be to the right of `mid`.',
    reflectionPrompt: 'Why does `nums[mid] > nums[hi]` allow excluding `mid` (`lo = mid + 1`), whereas `nums[mid] <= nums[hi]` requires keeping `mid` (`hi = mid`)?',
    sourceId: 'src_nextstep_original',
    packId: 'pack_first_release_v1',
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
  keyEdgeCase,
  reviewStatus = 'published'
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
    packId: 'pack_first_release_v1',
    reviewStatus,
    reviewRecord: STANDARD_REVIEW_RECORD
  };
}

export const FIRST_RELEASE_PRACTICE = [
  // ==================== ARRAYS (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_arrays_01',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_01'],
    title: 'Best Time to Buy and Sell Stock',
    externalSlug: 'best-time-to-buy-and-sell-stock',
    pattern: 'Running Prefix Minimum',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Direct application of the single-pass `minPrice` prefix invariant from Lesson 1.',
    keyEdgeCase: 'Strictly decreasing prices `[7, 6, 4, 3, 1]` must return `0`, never a negative delta.'
  }),
  createPracticeItem({
    id: 'prac_arrays_02',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_01'],
    title: 'Maximum Difference Between Increasing Elements',
    externalSlug: 'maximum-difference-between-increasing-elements',
    pattern: 'Running Prefix Minimum with Strict Inequality',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Reinforces evaluating `nums[j] > minSoFar` strictly before updating `minSoFar`, returning `-1` when no strictly increasing pair exists.',
    keyEdgeCase: 'Equal adjacent elements `[4, 4, 4]` must return `-1` because `nums[i] < nums[j]` is strictly required.'
  }),
  createPracticeItem({
    id: 'prac_arrays_03',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_01'],
    title: 'Best Time to Buy and Sell Stock II',
    externalSlug: 'best-time-to-buy-and-sell-stock-ii',
    pattern: 'Additive Positive Adjacent Deltas',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Contrasts single-transaction prefix state with unlimited-transaction telescopic sum of positive adjacent steps.',
    keyEdgeCase: 'Multi-day continuous rallies `[1, 2, 3, 4, 5]` equal the sum of daily steps `(2-1)+(3-2)+(4-3)+(5-4) = 4`.'
  }),
  createPracticeItem({
    id: 'prac_arrays_04',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_02'],
    title: 'Range Sum Query - Immutable',
    externalSlug: 'range-sum-query-immutable',
    pattern: 'Padded Prefix Sum Table',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Builds muscle memory for the `P[R + 1] - P[L]` padded prefix sum indexing invariant.',
    keyEdgeCase: 'Queries starting at `left = 0` or spanning a single element `left === right`.'
  }),
  createPracticeItem({
    id: 'prac_arrays_05',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_02'],
    title: 'Find Pivot Index',
    externalSlug: 'find-pivot-index',
    pattern: 'Running Left Sum vs Total Minus Left Minus Current',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Practices maintaining exclusive left prefix sum `leftSum` against `totalSum - leftSum - nums[i]` in O(1) space.',
    keyEdgeCase: 'Pivot located at index `0` when the suffix `nums[1..n-1]` sums to `0` (e.g., `[2, 1, -1]`).'
  }),
  createPracticeItem({
    id: 'prac_arrays_06',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_02'],
    title: 'Product of Array Except Self',
    externalSlug: 'product-of-array-except-self',
    pattern: 'Two-Pass Exclusive Prefix & Suffix Accumulation',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'The signature benchmark for two-pass exclusive prefix and suffix state without division.',
    keyEdgeCase: 'Arrays containing exactly one `0` vs. two or more `0`s.'
  }),
  createPracticeItem({
    id: 'prac_arrays_07',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_03'],
    title: 'Move Zeroes',
    externalSlug: 'move-zeroes',
    pattern: 'In-Place Read/Write Compaction',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Clean introduction to preserving relative order of non-zero elements using a slow `write` pointer.',
    keyEdgeCase: 'Array with no zeros `[1, 2, 3]` must not overwrite elements with zeros during self-writes (`write === read`).'
  }),
  createPracticeItem({
    id: 'prac_arrays_08',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_03'],
    title: 'Remove Duplicates from Sorted Array II',
    externalSlug: 'remove-duplicates-from-sorted-array-ii',
    pattern: 'K-Bounded Prefix Compaction (`nums[write - 2]`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Tests comparing `nums[read]` against `nums[write - 2]` in the compacted prefix rather than `nums[read - 2]`.',
    keyEdgeCase: 'Arrays of length `<= 2` and long runs of 4+ identical values.'
  }),
  createPracticeItem({
    id: 'prac_arrays_09',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_04'],
    title: 'Maximum Subarray',
    externalSlug: 'maximum-subarray',
    pattern: 'Kadane Contiguous Subarray Reset Invariant',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies the `Math.max(nums[i], currentEnd + nums[i])` subarray extension/reset invariant.',
    keyEdgeCase: 'All-negative arrays `[-5, -2, -9]` must return `-2`, not `0`.'
  }),
  createPracticeItem({
    id: 'prac_arrays_10',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_04'],
    title: 'Rotate Array',
    externalSlug: 'rotate-array',
    pattern: 'Modulo Normalization + Three-Slice Reversal',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Reinforces O(1) space cyclic rearrangement via `k %= n` and three in-place reversals.',
    keyEdgeCase: '`k >= nums.length` on a 1-element or 2-element array.'
  }),

  // ==================== HASHING (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_hashing_01',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_01'],
    title: 'Two Sum',
    externalSlug: 'two-sum',
    pattern: 'Single-Pass Complement Map (Lookup Before Insert)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Foundational check for lookup-before-insert ordering and handling partner index `0`.',
    keyEdgeCase: 'Duplicate numbers summing to target (`[3, 3]`, `target = 6`) and half-target self-collision (`[3, 2, 4]`, `target = 6`).'
  }),
  createPracticeItem({
    id: 'prac_hashing_02',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_01'],
    title: 'Contains Duplicate',
    externalSlug: 'contains-duplicate',
    pattern: 'Early-Exit Membership Set',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Fast warm-up comparing early-exit Set insertion against full-array Set size.',
    keyEdgeCase: 'Negative numbers and `0` repeated at the very end of the array.'
  }),
  createPracticeItem({
    id: 'prac_hashing_03',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_01'],
    title: 'Contains Duplicate II',
    externalSlug: 'contains-duplicate-ii',
    pattern: 'Latest-Index Map / Bounded Sliding Set',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Demonstrates when overwriting a key with its MOST RECENT index (`map.set(x, i)`) is required to minimize `i - prevIdx`.',
    keyEdgeCase: '`k = 0` (must always return `false` since distinct indices have distance `>= 1`).'
  }),
  createPracticeItem({
    id: 'prac_hashing_04',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_02'],
    title: 'Valid Anagram',
    externalSlug: 'valid-anagram',
    pattern: 'Fixed-Alphabet Net Balance Counter',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Practices checking length equality first, then verifying zero net frequency balance.',
    keyEdgeCase: 'Strings of different lengths where one is a prefix of the other (`"ab"` vs `"aba"`).'
  }),
  createPracticeItem({
    id: 'prac_hashing_05',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_02'],
    title: 'Group Anagrams',
    externalSlug: 'group-anagrams',
    pattern: 'Delimited Canonical Frequency Signature',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly tests building collision-free `#`-delimited 26-slot frequency keys.',
    keyEdgeCase: 'Words with `>= 10` occurrences of a single letter (`"bdddddddddd"` vs `"bbbbbbbbbbc"`).'
  }),
  createPracticeItem({
    id: 'prac_hashing_06',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_02'],
    title: 'Top K Frequent Elements',
    externalSlug: 'top-k-frequent-elements',
    pattern: 'Frequency Map + Bounded Bucket Array (`0..n`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Combines a frequency hash map with an `O(n)` frequency-indexed bucket array to avoid `O(n log n)` sorting.',
    keyEdgeCase: 'All elements are identical (`[1, 1, 1]`, `k = 1`), placing the bucket at maximum index `nums.length`.'
  }),
  createPracticeItem({
    id: 'prac_hashing_07',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_03'],
    title: 'Subarray Sum Equals K',
    externalSlug: 'subarray-sum-equals-k',
    pattern: 'Prefix-Sum Frequency Map Seeded with `{0: 1}`',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Core benchmark for Lesson 3: counting exact-sum subarrays in the presence of negative numbers and zeros.',
    keyEdgeCase: '`k = 0` with zeros/negatives (`[0, 0, 0]` or `[1, -1, 0]`) where querying before inserting is critical.'
  }),
  createPracticeItem({
    id: 'prac_hashing_08',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_03'],
    title: 'Contiguous Array',
    externalSlug: 'contiguous-array',
    pattern: 'Earliest Prefix-Balance Index Map (`0 -> -1, 1 -> +1`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Contrasts frequency counting with keeping only the EARLIEST index (`{0: -1}`) to maximize subarray length.',
    keyEdgeCase: 'Entire array is balanced (`[0, 1, 0, 1]`), requiring the seed `{0: -1}` to compute length `i - (-1) = i + 1`.'
  }),
  createPracticeItem({
    id: 'prac_hashing_09',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_04'],
    title: 'Longest Consecutive Sequence',
    externalSlug: 'longest-consecutive-sequence',
    pattern: 'Set Predecessor Guard (`!set.has(x - 1)`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Proves the O(n) amortized streak walk by iterating over `numSet` and launching chains only at sequence starts.',
    keyEdgeCase: 'Empty array `[]` (must return `0`) and heavy duplicate starts `[0, 0, 1, 2]`.'
  }),
  createPracticeItem({
    id: 'prac_hashing_10',
    topicId: 'topic_hashing',
    lessonIds: ['les_hashing_04'],
    title: 'Isomorphic Strings',
    externalSlug: 'isomorphic-strings',
    pattern: 'Bidirectional Bijection Maps (`s -> t` and `t -> s`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Tests enforcing a strict one-to-one bijection rather than a many-to-one mapping.',
    keyEdgeCase: '`s = "badc", t = "baba"` where a one-way map `s -> t` passes, but `"d"` and `"b"` both map to `"b"`.'
  }),

  // ==================== BINARY SEARCH (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_binary_search_01',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_01'],
    title: 'Binary Search',
    externalSlug: 'binary-search',
    pattern: 'Half-Open Lower Bound + Equality Check',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Clean baseline to verify `lowerBound` convergence and post-loop `lo < n && nums[lo] === target` check.',
    keyEdgeCase: 'Single-element array `[5]` tested with both `target = 5` and `target = -5`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_02',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_01'],
    title: 'Search Insert Position',
    externalSlug: 'search-insert-position',
    pattern: 'Pure Half-Open Lower Bound `[0, n)`',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Demonstrates that `lowerBound` with `hi = nums.length` is literally the exact solution with zero extra branches.',
    keyEdgeCase: 'Target strictly larger than `nums[n - 1]`, which must return `nums.length`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_03',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_01'],
    title: 'Find First and Last Position of Element in Sorted Array',
    externalSlug: 'find-first-and-last-position-of-element-in-sorted-array',
    pattern: 'Dual Lower Bound (`lowerBound(x)` and `lowerBound(x + 1) - 1`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Shows how one `lowerBound` helper finds both the first and last occurrence of duplicates without writing a second fragile loop.',
    keyEdgeCase: 'All elements equal to target `[8, 8, 8, 8]` vs target missing between existing elements.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_04',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_02'],
    title: 'Find Minimum in Rotated Sorted Array',
    externalSlug: 'find-minimum-in-rotated-sorted-array',
    pattern: 'Right-Edge Pivot Discrimination (`nums[mid] > nums[hi]`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies the `nums[mid] > nums[hi]` invariant from Lesson 2 and Exercise 6.',
    keyEdgeCase: 'Unrotated array `[11, 13, 15, 17]` and 2-element rotated array `[2, 1]`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_05',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_02'],
    title: 'Search in Rotated Sorted Array',
    externalSlug: 'search-in-rotated-sorted-array',
    pattern: 'Sorted-Half Identification + Closed-Range Membership Check',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Practices checking `nums[lo] <= nums[mid]` first, then testing whether `target` sits inside the sorted half.',
    keyEdgeCase: '2-element subarray where `lo === mid` (`[3, 1]`, `target = 1`), requiring `nums[lo] <= nums[mid]` rather than `<`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_06',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_02'],
    title: 'Single Element in a Sorted Array',
    externalSlug: 'single-element-in-a-sorted-array',
    pattern: 'Pair-Parity Index Alignment (`mid ^ 1` / even index check)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Applies first-true binary search to index-pair parity: before the single element, even indices equal their right neighbour.',
    keyEdgeCase: 'Unique element located at index `0` or the very last index `nums.length - 1`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_07',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_03'],
    title: 'Koko Eating Bananas',
    externalSlug: 'koko-eating-bananas',
    pattern: 'Monotonic Rate Answer-Space Binary Search',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Canonical answer-space binary search from Lesson 3 over `[1..max(piles)]`.',
    keyEdgeCase: 'Ceiling step-function plateaus where multiple speeds yield the exact same `hoursUsed === h`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_08',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_03'],
    title: 'Capacity To Ship Packages Within D Days',
    externalSlug: 'capacity-to-ship-packages-within-d-days',
    pattern: 'Monotonic Capacity Search (`[max(w)..sum(w)]`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Reinforces setting the lower bound `lo = Math.max(...weights)` because individual packages cannot be split.',
    keyEdgeCase: 'One massive package surrounded by tiny ones (`[1, 1, 1, 50]`, `days = 2`), where `lo` must start at `50`.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_09',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_04'],
    title: 'Search a 2D Matrix',
    externalSlug: 'search-a-2d-matrix',
    pattern: '1D-to-2D Row-Major Index Mapping (`floor(k / C), k % C`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Tests mapping flat index `mid` to `matrix[Math.floor(mid / cols)][mid % cols]` without extra memory.',
    keyEdgeCase: '1-row matrix `[[1, 3, 5]]` or 1-column matrix `[[1], [3], [5]]` where dividing by `rows` instead of `cols` crashes.'
  }),
  createPracticeItem({
    id: 'prac_binary_search_10',
    topicId: 'topic_binary_search',
    lessonIds: ['les_binary_search_04'],
    title: 'Find Peak Element',
    externalSlug: 'find-peak-element',
    pattern: 'Rising/Falling Slope Binary Search (`nums[mid] < nums[mid + 1]`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Proves that binary search works on unsorted arrays whenever a local invariant guarantees a peak in the chosen half.',
    keyEdgeCase: 'Strictly increasing `[1, 2, 3, 4]` (peak at `n - 1`) and strictly decreasing `[4, 3, 2, 1]` (peak at `0`).'
  }),

  // ==================== UNREVIEWED DRAFT ITEM (MUST BE EXCLUDED FROM PUBLISHED REGISTRY) ====================
  {
    id: 'prac_arrays_draft_99',
    topicId: 'topic_arrays',
    lessonIds: ['les_arrays_01'],
    title: 'Unreviewed Sandbox Draft Problem',
    provider: 'LeetCode',
    externalSlug: 'two-sum',
    url: 'https://leetcode.com/problems/two-sum/',
    pattern: 'Sandbox Draft Pattern',
    difficulty: 'unknown',
    difficultySource: 'unknown',
    estimatedMinutes: 20,
    whyRecommended: 'Held in draft status to verify that the curriculum registry never leaks unreviewed content into published counts or UI.',
    keyEdgeCase: 'Must be filtered out by `getPublishedCurriculum()` and counted only in internal draft diagnostics.',
    verificationMode: 'self_reported',
    sourceId: 'src_leetcode_studyplan_ext',
    packId: 'pack_first_release_v1',
    reviewStatus: 'draft',
    reviewRecord: {
      pipelineStagesCompleted: ['draft'],
      reviewerType: 'same_agent_automated_and_editorial_review',
      independentlyReviewed: false,
      verifiedAt: '2026-10-17',
      reviewNotes: 'Intentionally kept in draft stage to test curriculum gating.'
    }
  }
];
