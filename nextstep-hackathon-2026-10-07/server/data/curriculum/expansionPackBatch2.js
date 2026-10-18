const STANDARD_REVIEW_RECORD = {
  pipelineStagesCompleted: ['draft', 'source_check', 'technical_validation', 'editorial_review', 'published'],
  reviewerType: 'same_agent_automated_and_editorial_review',
  independentlyReviewed: false,
  verifiedAt: '2026-10-17',
  reviewNotes: 'Automated schema, deterministic state-trace, reference integrity, and editorial quality checks passed.'
};

export const EXPANSION_BATCH_2_PACK_METADATA = {
  id: 'pack_expansion_batch2_v1',
  version: '1.2.0',
  title: 'NextStep Expansion Pack 2: Stacks & Queues, Trees & Heaps',
  releaseStage: 'expansion',
  publishedAt: '2026-10-17',
  topicIds: ['topic_stacks_queues', 'topic_trees', 'topic_heaps'],
  reviewStatus: 'published'
};

export const EXPANSION_BATCH_2_TOPICS = [
  {
    id: 'topic_stacks_queues',
    slug: 'stacks-queues',
    title: 'Stacks, Queues & Monotonic Frontiers',
    shortDescription: 'Enforce LIFO/FIFO ordering and maintain monotonic stacks and deques to resolve next-greater, histogram-span, and sliding-extremum queries in O(n) amortized time.',
    whyItMatters: 'A monotonic stack or deque discards dominated history as soon as a stronger element arrives, turning O(n^2) lookback/lookahead scans into 2n push/pop operations.',
    order: 7,
    lane: 3,
    estimatedMinutes: 95,
    prerequisites: ['topic_arrays', 'topic_linked_lists'],
    starterMissionIds: ['m07'],
    keyPatterns: ['LIFO Nested Delimiter Matching', 'Monotonic Decreasing Next-Greater Stack', 'Monotonic Increasing Span-Boundary Stack', 'Monotonic Decreasing Index Deque'],
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_trees',
    slug: 'trees',
    title: 'Binary Trees, BSTs & Recursive Invariants',
    shortDescription: 'Distinguish top-down inherited parameter constraints from bottom-up post-order subtree summaries and level-frozen BFS queue snapshots.',
    whyItMatters: 'Most tree bugs come from mixing local parent-child checks with global ancestor bounds or mutating shared state across sibling branches.',
    order: 8,
    lane: 4,
    estimatedMinutes: 100,
    prerequisites: ['topic_stacks_queues'],
    starterMissionIds: ['m08'],
    keyPatterns: ['Post-Order Bottom-Up Subtree Summary', 'Top-Down Ancestor Interval (low, high)', 'Lowest Common Ancestor Witness Propagation', 'Level-Size Snapshot BFS'],
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_heaps',
    slug: 'heaps',
    title: 'Heaps, Priority Queues & Streaming Extrema',
    shortDescription: 'Maintain dynamic top-k subsets, k-way sorted stream frontiers, and balanced two-heap medians in O(log k) or O(log n) per update.',
    whyItMatters: 'Sorting the entire dataset costs O(n log n) and requires all data upfront; a bounded heap of size k answers online streaming top-k queries in O(n log k) time and O(k) space.',
    order: 9,
    lane: 4,
    estimatedMinutes: 95,
    prerequisites: ['topic_arrays', 'topic_trees'],
    starterMissionIds: ['m09'],
    keyPatterns: ['Implicit Array Heap Sift Up/Down', 'Size-K Min-Heap Bouncer for Top-K Largest', 'K-Way Frontier Min-Heap Merge', 'Dual-Heap Median Balance (maxLow / minHigh)'],
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_2_PREREQUISITE_EDGES = [
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_stacks_queues',
    rationale: 'Contiguous array stacks and index-based monotonic stacks operate directly on array indices.'
  },
  {
    fromTopicId: 'topic_linked_lists',
    toTopicId: 'topic_stacks_queues',
    rationale: 'O(1) FIFO queues and deques rely on linked or circular-buffer pointer discipline.'
  },
  {
    fromTopicId: 'topic_stacks_queues',
    toTopicId: 'topic_trees',
    rationale: 'DFS tree traversals use an explicit or implicit call stack, and BFS level-order traversals use a FIFO queue.'
  },
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_heaps',
    rationale: 'Binary heaps are complete binary trees stored compactly in a 0-indexed array via 2i+1 and 2i+2 arithmetic.'
  },
  {
    fromTopicId: 'topic_trees',
    toTopicId: 'topic_heaps',
    rationale: 'The heap-order property is a parent-child tree invariant over a complete binary tree.'
  }
];

export const EXPANSION_BATCH_2_LESSONS = [
  // ==================== TOPIC 7: STACKS & QUEUES ====================
  {
    id: 'les_stacks_queues_01',
    topicId: 'topic_stacks_queues',
    order: 1,
    title: 'LIFO Delimiter Matching & Auxiliary State Stacks',
    estimatedMinutes: 15,
    prerequisites: ['les_arrays_01'],
    measurableObjective: 'Validate nested delimiters and maintain O(1) running stack minimums by pairing each pushed element with its historical prefix state.',
    explanation: 'A Last-In, First-Out (LIFO) stack naturally models nested scopes: the most recently opened delimiter must be the very first one closed. Two failure modes must be checked: (1) encountering a closing bracket when the stack is empty or its top does not match, and (2) finishing the string with unclosed brackets still on the stack (`stack.length > 0`). Similarly, in `MinStack`, storing `[val, Math.min(val, currentMin)]` on each push snapshots the prefix minimum at that stack depth so `pop()` restores the previous minimum in O(1) time.',
    codeSnippet: {
      language: 'javascript',
      filename: 'validParenthesesLifo.js',
      lines: [
        'export function isValidParentheses(s) {',
        '  const match = { ")": "(", "]": "[", "}": "{" };',
        '  const stack = [];',
        '  for (const ch of s) {',
        '    if (ch in match) {',
        '      if (stack.length === 0 || stack.pop() !== match[ch]) {',
        '        return false;',
        '      }',
        '    } else {',
        '      stack.push(ch);',
        '    }',
        '  }',
        '  return stack.length === 0;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 's = "([{}])"',
      stepByStep: [
        'Read "(", "[", "{": all are openers -> stack = ["(", "[", "{"].',
        'Read "}": matches stack.pop() ("{") -> stack = ["(", "["].',
        'Read "]": matches stack.pop() ("[") -> stack = ["("].',
        'Read ")": matches stack.pop() ("(") -> stack = [].',
        'End of string: stack.length === 0 -> return true.'
      ],
      outputDescription: 'true (all nested scopes closed in exact reverse order)',
      invariantSummary: 'After processing prefix s[0..i], stack contains the currently open delimiters from outermost (bottom) to innermost (top).'
    },
    pitfalls: [
      'Returning `true` at the end of the loop without checking `stack.length === 0`, which falsely accepts `"((("`.',
      'Using a single counter `openCount` for multiple bracket types, which falsely accepts interleaved `"([)]"`.'
    ],
    edgeCase: {
      scenario: 'String starting with a closing bracket `")("` or odd-length string `"([]"`',
      whyItBreaksNaiveCode: 'Calling `stack.pop()` without checking emptiness or comparing against `undefined` carefully can misbehave if the map lookup is inverted.',
      howToHandle: 'Always map closing brackets to their expected opening bracket and check `stack.length === 0 || stack.pop() !== match[ch]`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_stacks_queues_01', 'prac_stacks_queues_02', 'prac_stacks_queues_03'],
    knowledgeCheck: {
      question: 'Why does a simple integer counter `balance += 1` / `balance -= 1` work for single-type parentheses `"()"` but fail when `"[]"` and `"{}"` are also present?',
      options: [
        {
          id: 'sq1_ok',
          label: 'Because counts ignore relative ordering and cannot detect interleaved cross-nesting like `"([)]"` where counts are balanced but the innermost opener is `"["` while `")"` arrives first.',
          feedback: 'Correct! Multiple delimiter types require remembering the exact sequence of open scopes on a LIFO stack.'
        },
        {
          id: 'sq1_bad1',
          label: 'Because integer counters overflow on strings longer than 32 characters.',
          feedback: 'JavaScript safe integers reach `2^53 - 1`; the issue is cross-type ordering, not numeric overflow.'
        },
        {
          id: 'sq1_bad2',
          label: 'Because square brackets have higher operator precedence than parentheses.',
          feedback: 'All bracket types have equal nesting rules; the innermost open bracket must always close first.'
        }
      ],
      correctOptionId: 'sq1_ok',
      explanation: 'LIFO ordering enforces that the most recently opened bracket type is closed first.'
    },
    reflectionPrompt: 'How does storing `(val, minAtThisDepth)` on each stack frame turn a global mutable state problem into an immutable prefix snapshot?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) stack invariants.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_stacks_queues_02',
    topicId: 'topic_stacks_queues',
    order: 2,
    title: 'Monotonic Decreasing Stack & Next Greater Element',
    estimatedMinutes: 25,
    prerequisites: ['les_stacks_queues_01'],
    measurableObjective: 'Resolve the next warmer/greater element for every index in O(n) time by maintaining a stack of indices whose values are monotonically non-increasing.',
    explanation: 'Suppose you want to find, for each day `i`, the first future day `j > i` with `temps[j] > temps[i]`. Instead of scanning forward from every `i` (`O(n^2)`), we maintain a **waiting stack of indices** whose temperatures have not yet seen a warmer day. Notice that this waiting stack is automatically **monotonically decreasing** (`temps[stack[0]] >= temps[stack[1]] >= ...`)! When day `i` arrives with `temps[i]`, we pop every waiting index `prevIdx` on top of the stack where `temps[i] > temps[prevIdx]` and record `ans[prevIdx] = i - prevIdx`, then push `i`. Each index is pushed once and popped at most once (`<= 2n` operations).',
    codeSnippet: {
      language: 'javascript',
      filename: 'dailyTemperaturesMonotonic.js',
      lines: [
        'export function dailyTemperatures(temps) {',
        '  const ans = new Array(temps.length).fill(0);',
        '  const stack = []; // stores indices with decreasing temps',
        '  for (let i = 0; i < temps.length; i += 1) {',
        '    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {',
        '      const prevIdx = stack.pop();',
        '      ans[prevIdx] = i - prevIdx;',
        '    }',
        '    stack.push(i);',
        '  }',
        '  return ans;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'temps = [73, 74, 75, 71, 69, 72, 76]',
      stepByStep: [
        'i=0 (73): stack=[0].',
        'i=1 (74): 74 > 73 -> pop 0, ans[0] = 1 - 0 = 1; push 1 -> stack=[1].',
        'i=2 (75): 75 > 74 -> pop 1, ans[1] = 2 - 1 = 1; push 2 -> stack=[2].',
        'i=3 (71), i=4 (69): cooler than top -> stack=[2(75), 3(71), 4(69)].',
        'i=5 (72): 72 > 69 (pop 4, ans[4]=1) and 72 > 71 (pop 3, ans[3]=2); 72 <= 75 -> push 5 -> stack=[2(75), 5(72)].',
        'i=6 (76): pops 5 (ans[5]=1) and 2 (ans[2]=4); push 6 -> stack=[6].'
      ],
      outputDescription: '[1, 1, 4, 2, 1, 1, 0]',
      invariantSummary: 'Before and after each iteration i, the indices on stack are strictly increasing while their corresponding values temps[idx] are monotonically non-increasing.'
    },
    pitfalls: [
      'Pushing temperature values `temps[i]` onto the stack instead of indices `i`, which loses the distance `i - prevIdx` and collides on duplicate temperatures.',
      'Using `if` instead of `while` when popping, which only resolves the single most recent cooler day instead of all cooler waiting days.'
    ],
    edgeCase: {
      scenario: 'Equal adjacent temperatures `[70, 70, 72]` when strictly warmer (`>`) is required',
      whyItBreaksNaiveCode: 'If the pop condition uses `>=` instead of `>`, index 0 (`70`) is popped by index 1 (`70`), wrongly reporting a warmer day at distance 1!',
      howToHandle: 'Use strict `temps[i] > temps[stack.top]` so equal temperatures wait together on the stack until `72` arrives.'
    },
    exerciseId: 'ex_stacks_queues_01',
    recommendedPracticeIds: ['prac_stacks_queues_04', 'prac_stacks_queues_05', 'prac_stacks_queues_06', 'prac_stacks_queues_10'],
    knowledgeCheck: {
      question: 'Why do we store array INDICES `i` on the monotonic stack rather than the element values `temps[i]`?',
      options: [
        {
          id: 'sq2_ok',
          label: 'Because index `i` gives us both the value `temps[i]` AND the exact position needed to write `ans[prevIdx] = i - prevIdx` without ambiguity on duplicate values.',
          feedback: 'Correct! From an index `idx` you can always look up `temps[idx]` in O(1), plus compute index distances.'
        },
        {
          id: 'sq2_bad1',
          label: 'Because JavaScript arrays can only store integers.',
          feedback: 'JavaScript arrays can store any type; indices are chosen because they carry both position and value.'
        },
        {
          id: 'sq2_bad2',
          label: 'To make the stack monotonically increasing instead of decreasing.',
          feedback: 'The monotonicity invariant refers to the values `temps[idx]`, which are still decreasing.'
        }
      ],
      correctOptionId: 'sq2_ok',
      explanation: 'Storing `idx` provides both `idx` (position) and `temps[idx]` (value).'
    },
    reflectionPrompt: 'Why is the total work of the `while` loop across the entire `for` loop bounded by `n` pops even if a single step pops `n - 1` elements?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook monotonic stack patterns.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_stacks_queues_03',
    topicId: 'topic_stacks_queues',
    order: 3,
    title: 'Monotonic Increasing Stack & Histogram Span Boundaries',
    estimatedMinutes: 25,
    prerequisites: ['les_stacks_queues_02'],
    measurableObjective: 'Compute the maximal rectangle for every bar in a histogram in O(n) time by finding each bar’s first smaller left and right neighbors in a single monotonic stack pass.',
    explanation: 'In Largest Rectangle in Histogram, a bar at `mid` of height `H = heights[mid]` can extend horizontally until it hits the first bar strictly shorter than `H` on its left (`leftBound`) and on its right (`rightBound`). If we maintain a **monotonically increasing stack** of indices, then the moment a shorter bar `heights[i] < heights[stack.top]` arrives: (1) `i` is the exact **right boundary** (first smaller on the right) for `mid = stack.pop()`, and (2) the new top of the stack right below `mid` is the exact **left boundary** (first smaller on the left)! Appending a virtual `0`-height sentinel at `i === heights.length` flushes all remaining bars at the end.',
    codeSnippet: {
      language: 'javascript',
      filename: 'largestRectangleHistogram.js',
      lines: [
        'export function largestRectangleArea(heights) {',
        '  const stack = [];',
        '  let maxArea = 0;',
        '  for (let i = 0; i <= heights.length; i += 1) {',
        '    const curH = i === heights.length ? 0 : heights[i];',
        '    while (stack.length > 0 && curH < heights[stack[stack.length - 1]]) {',
        '      const h = heights[stack.pop()];',
        '      const leftBound = stack.length === 0 ? -1 : stack[stack.length - 1];',
        '      const width = i - leftBound - 1;',
        '      if (h * width > maxArea) maxArea = h * width;',
        '    }',
        '    stack.push(i);',
        '  }',
        '  return maxArea;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'heights = [2, 1, 5, 6, 2, 3]',
      stepByStep: [
        'i=0 (2): stack=[0].',
        'i=1 (1 < 2): pop 0 (h=2), stack empty so leftBound=-1, width = 1 - (-1) - 1 = 1 -> area=2. push 1 -> stack=[1(1)].',
        'i=2 (5), i=3 (6): push -> stack=[1(1), 2(5), 3(6)].',
        'i=4 (2 < 6): pop 3 (h=6, leftBound=2, width=4-2-1=1 -> area=6); then 2 < 5: pop 2 (h=5, leftBound=1, width=4-1-1=2 -> area=10!). push 4.',
        'i=5 (3), i=6 (sentinel 0): flushes remaining bars; maxArea = 10.'
      ],
      outputDescription: '10 (from bars [5, 6] at indices 2..3 of height 5 and width 2)',
      invariantSummary: 'When mid is popped by index i, i is the first index > mid with heights[i] < heights[mid], and the new stack top is the last index < mid with height <= heights[mid].'
    },
    pitfalls: [
      'Computing `width = i - mid` instead of `width = i - leftBound - 1`, which forgets that the popped bar `mid` can also extend leftward over taller bars that were already popped!',
      'Forgetting to flush bars remaining on the stack after the array ends (solved cleanly by the `i === heights.length` sentinel `curH = 0`).'
    ],
    edgeCase: {
      scenario: 'Strictly increasing histogram `[1, 2, 3, 4, 5]`',
      whyItBreaksNaiveCode: 'No bar is ever popped during `i = 0..n-1`; without the end-of-loop flush (`curH = 0`), `maxArea` stays `0`!',
      howToHandle: 'Run the loop to `i <= heights.length` with `curH = 0` at `i === heights.length` so every positive bar is guaranteed to be popped and scored.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_stacks_queues_07', 'prac_stacks_queues_09'],
    knowledgeCheck: {
      question: 'When `mid = stack.pop()` is popped at index `i`, why is the rectangle width `i - leftBound - 1` (where `leftBound` is the new stack top) rather than `i - mid`?',
      options: [
        {
          id: 'sq3_ok',
          label: 'Because any indices between `leftBound` and `mid` that were popped earlier had height `>= heights[mid]`, so bar `mid` can extend leftward across all of them too.',
          feedback: 'Spot on! Everything between `leftBound + 1` and `i - 1` inclusive is at least as tall as `heights[mid]`.'
        },
        {
          id: 'sq3_bad1',
          label: 'Because arrays are 1-indexed in histogram problems.',
          feedback: 'Indices are 0-based; `i - leftBound - 1` counts the open interval `(leftBound, i)`.'
        },
        {
          id: 'sq3_bad2',
          label: 'Because `mid` is always equal to `leftBound + 1`.',
          feedback: 'Whenever taller bars existed to the left of `mid` and were popped earlier, `mid > leftBound + 1`.'
        }
      ],
      correctOptionId: 'sq3_ok',
      explanation: 'All bars in `(leftBound, i)` have height `>= heights[mid]`, giving width `(i - 1) - (leftBound + 1) + 1 = i - leftBound - 1`.'
    },
    reflectionPrompt: 'How does appending a virtual `0` at `i === heights.length` simplify monotonic stack code?',
    sourceId: 'src_nextstep_original',
    provenance: 'Original NextStep lesson on monotonic span boundaries.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_stacks_queues_04',
    topicId: 'topic_stacks_queues',
    order: 4,
    title: 'Monotonic Deque & O(n) Sliding Window Maximum',
    estimatedMinutes: 25,
    prerequisites: ['les_stacks_queues_02', 'les_sliding_window_01'],
    measurableObjective: 'Maintain the maximum of a sliding window of size `k` in O(1) per step using a double-ended queue (deque) of indices.',
    explanation: 'In Sliding Window Maximum, as window `[i - k + 1 .. i]` slides right, elements enter on the right and expire on the left. Suppose `j < i` and `nums[j] <= nums[i]`. Since `nums[i]` is both **at least as large** as `nums[j]` AND **younger** (will stay in future windows longer than `j`), `j` can NEVER be the maximum of this or any future window! Thus we maintain a **monotonic decreasing deque of indices**: (1) evict front index `deque[0]` if it fell out of the window (`deque[0] <= i - k`), (2) pop back indices while `nums[deque[back]] <= nums[i]`, (3) push `i` to the back, and (4) once `i >= k - 1`, the window maximum sits at `nums[deque[0]]`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'slidingWindowMaxDeque.js',
      lines: [
        'export function maxSlidingWindow(nums, k) {',
        '  const deque = []; // stores indices, values decreasing',
        '  let head = 0;',
        '  const out = [];',
        '  for (let i = 0; i < nums.length; i += 1) {',
        '    if (head < deque.length && deque[head] <= i - k) head += 1;',
        '    while (head < deque.length && nums[deque[deque.length - 1]] <= nums[i]) {',
        '      deque.pop();',
        '    }',
        '    deque.push(i);',
        '    if (i >= k - 1) out.push(nums[deque[head]]);',
        '  }',
        '  return out;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 3, -1, -3, 5, 3], k = 3',
      stepByStep: [
        'i=0 (1): deque=[0(1)].',
        'i=1 (3 >= 1): pop 0, push 1 -> deque=[1(3)].',
        'i=2 (-1): push 2 -> deque=[1(3), 2(-1)]; i >= 2 -> out=[3].',
        'i=3 (-3): push 3 -> deque=[1(3), 2(-1), 3(-3)]; out=[3, 3].',
        'i=4 (5): front 1 <= 4-3 (expired, head++), then 5 >= -3, -1 -> pop both, push 4 -> deque=[4(5)]; out=[3, 3, 5].',
        'i=5 (3): push 5 -> deque=[4(5), 5(3)]; out=[3, 3, 5, 5].'
      ],
      outputDescription: '[3, 3, 5, 5]',
      invariantSummary: 'Active deque indices in [head..deque.length-1] lie within [i - k + 1 .. i], are strictly increasing in index, and are strictly decreasing in nums value.'
    },
    pitfalls: [
      'Calling `Array.prototype.shift()` in JavaScript on a large deque, which is O(k) per shift; using a `head` pointer keeps front eviction strictly O(1)!',
      'Evicting from the front by value instead of by index expiration `deque[head] <= i - k`.'
    ],
    edgeCase: {
      scenario: '`k = 1` on any array',
      whyItBreaksNaiveCode: 'If window answers are only recorded when `i > k - 1` instead of `i >= k - 1`, index 0 is skipped when `k = 1`.',
      howToHandle: 'Always record `out.push(nums[deque[head]])` whenever `i >= k - 1`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_stacks_queues_08'],
    knowledgeCheck: {
      question: 'In Sliding Window Maximum, why can we permanently discard an older index `j < i` from the back of the deque as soon as `nums[j] <= nums[i]`?',
      options: [
        {
          id: 'sq4_ok',
          label: 'Because `i` is both >= `nums[j]` in value and expires later than `j`, so `j` can never beat `i` in the current window or any future window.',
          feedback: 'Correct! Index `i` dominates index `j` in both magnitude and lifetime.'
        },
        {
          id: 'sq4_bad1',
          label: 'Because `j` has already fallen outside `[i - k + 1 .. i]`.',
          feedback: '`j` is still inside the current window, but it is dominated by the newer, larger element `nums[i]`.'
        },
        {
          id: 'sq4_bad2',
          label: 'Because a deque can hold at most 2 elements.',
          feedback: 'A deque can hold up to `k` elements if the window is strictly decreasing.'
        }
      ],
      correctOptionId: 'sq4_ok',
      explanation: 'Any older element `<= nums[i]` is dominated for the remainder of its lifetime in the window.'
    },
    reflectionPrompt: 'Why does using a `head` index over a JS array outperform `deque.shift()` on large inputs?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) deque and amortized analysis.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 8: TREES ====================
  {
    id: 'les_trees_01',
    topicId: 'topic_trees',
    order: 1,
    title: 'Bottom-Up Post-Order Aggregation (Height, Balance & Diameter)',
    estimatedMinutes: 20,
    prerequisites: ['les_stacks_queues_01'],
    measurableObjective: 'Compute tree height, height-balance, and longest path diameter in a single O(n) post-order DFS pass without redundant subtree re-traversals.',
    explanation: 'Naive tree code often computes `height(node.left)` and `height(node.right)` inside a top-down check `isBalanced(node)`, causing `O(n^2)` time on skewed trees because subtrees are re-measured at every ancestor. Instead, a **bottom-up post-order DFS** visits `left` and `right` children first, combines their returned summaries in O(1), and returns the parent’s summary upward. For example: (1) in `Balanced Binary Tree`, returning `-1` as a sentinel height whenever a subtree is unbalanced propagates failure to the root in O(n); (2) in `Diameter of Binary Tree`, the longest path whose highest point (LCA) is `node` has length `leftHeight + rightHeight`, which we maximize while returning `1 + Math.max(leftHeight, rightHeight)` to `node`’s parent!',
    codeSnippet: {
      language: 'javascript',
      filename: 'diameterAndBalancePostOrder.js',
      lines: [
        'export function diameterOfBinaryTree(root) {',
        '  let maxDiameter = 0;',
        '  function height(node) {',
        '    if (node === null) return 0;',
        '    const leftH = height(node.left);',
        '    const rightH = height(node.right);',
        '    if (leftH + rightH > maxDiameter) {',
        '      maxDiameter = leftH + rightH;',
        '    }',
        '    return 1 + Math.max(leftH, rightH);',
        '  }',
        '  height(root);',
        '  return maxDiameter;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Tree with root 1, left child 2 (children 4, 5), right child 3',
      stepByStep: [
        'Leaves 4, 5, 3: leftH = 0, rightH = 0 -> maxDiameter = 0, each returns height 1.',
        'Node 2: leftH (from 4) = 1, rightH (from 5) = 1 -> leftH + rightH = 2 updates maxDiameter = 2; returns 1 + max(1, 1) = 2.',
        'Root 1: leftH (from 2) = 2, rightH (from 3) = 1 -> leftH + rightH = 3 updates maxDiameter = 3; returns 3.',
        'Final maxDiameter = 3 edges (path 4 - 2 - 1 - 3 or 5 - 2 - 1 - 3).'
      ],
      outputDescription: '3 edges along the longest path',
      invariantSummary: 'After height(u) finishes, it returns the exact node-height of subtree u, and maxDiameter >= leftH(v) + rightH(v) for all descendants v of u.'
    },
    pitfalls: [
      'Returning `leftH + rightH` to the parent instead of `1 + Math.max(leftH, rightH)`—a path continuing upward to a parent can only use ONE child branch, not both!',
      'Assuming the longest path must pass through the global `root` (it can lie entirely inside a deep left or right subtree).'
    ],
    edgeCase: {
      scenario: 'Single-node tree `[1]`',
      whyItBreaksNaiveCode: 'Confusing node count (`1`) with edge count (`0`) on a single-node tree returns `1` instead of `0`.',
      howToHandle: 'With base case `height(null) = 0`, a leaf has `leftH = 0, rightH = 0`, so `leftH + rightH = 0` edges and it returns height `1`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_trees_01', 'prac_trees_02', 'prac_trees_03', 'prac_trees_04'],
    knowledgeCheck: {
      question: 'In `diameterOfBinaryTree`, why does `height(node)` update `maxDiameter` with `leftH + rightH`, but return `1 + Math.max(leftH, rightH)` to its caller?',
      options: [
        {
          id: 'tr1_ok',
          label: 'A path bending at `node` uses both `left` and `right` (`leftH + rightH`), while a path ascending to `node`’s parent cannot fork and uses only the deeper branch (`1 + max(leftH, rightH)`).',
          feedback: 'Spot on! A simple path in a tree can have only one highest turning point (LCA).'
        },
        {
          id: 'tr1_bad1',
          label: 'Because `leftH` and `rightH` are always equal.',
          feedback: 'Subtree heights can differ arbitrarily.'
        },
        {
          id: 'tr1_bad2',
          label: 'To avoid integer overflow.',
          feedback: 'The distinction is structural: a simple path cannot visit all 3 of (left child, right child, parent).'
        }
      ],
      correctOptionId: 'tr1_ok',
      explanation: 'A path turning at `node` spans `leftH + rightH`, while a path ascending to `node`’s parent extends the single longest downward branch.'
    },
    reflectionPrompt: 'Where else in tree problems do we distinguish "best answer turning at `node`" from "best single branch extending upward to `node`’s parent"?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA binary tree post-order traversals.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_trees_02',
    topicId: 'topic_trees',
    order: 2,
    title: 'Top-Down Ancestor Range Constraints & BST Validity',
    estimatedMinutes: 25,
    prerequisites: ['les_trees_01'],
    measurableObjective: 'Validate Binary Search Trees by propagating strict ancestor interval bounds `(low, high)` top-down to every recursive call.',
    explanation: 'The classic BST misconception is checking only immediate children: `node.left.val < node.val && node.right.val > node.val`. Why does that fail? Consider root `10` with right child `15`, and `15` has a left child `6`. Locally `6 < 15` looks valid, but `6` is in the **right subtree of `10`** and violates `6 > 10`! Every node in a BST is constrained by an open interval `(low, high)` inherited from its ancestors: going left tightens the upper bound to `(low, node.val)`, and going right tightens the lower bound to `(node.val, high)`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'validateBstRange.js',
      lines: [
        'export function isValidBST(root, low = -Infinity, high = Infinity) {',
        '  if (root === null) return true;',
        '  if (root.val <= low || root.val >= high) {',
        '    return false;',
        '  }',
        '  return (',
        '    isValidBST(root.left, low, root.val) &&',
        '    isValidBST(root.right, root.val, high)',
        '  );',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Root 10, left 5, right 15 (with 15.left = 6, 15.right = 20)',
      stepByStep: [
        'Call isValidBST(10, -Inf, +Inf): 10 in (-Inf, +Inf) -> ok.',
        'Left call isValidBST(5, -Inf, 10): 5 in (-Inf, 10) -> returns true.',
        'Right call isValidBST(15, 10, +Inf): 15 in (10, +Inf) -> ok.',
        '15.left call isValidBST(6, 10, 15): 6 <= low (10) -> returns false!'
      ],
      outputDescription: 'false (node 6 in right subtree of 10 violates lower bound 10)',
      invariantSummary: 'Every recursive call isValidBST(u, low, high) receives the tightest ancestor lower bound low and upper bound high that all nodes in subtree u must strictly satisfy.'
    },
    pitfalls: [
      'Checking only `node.left.val < node.val` and `node.right.val > node.val` without passing `(low, high)` bounds.',
      'Using `<` instead of `<=` on the violation check `root.val <= low || root.val >= high`, which falsely accepts duplicate keys `[2, 2, 2]`.'
    ],
    edgeCase: {
      scenario: 'Node values equal to `-(2^31)` or `2^31 - 1` or duplicate values `[2, 2, 2]`',
      whyItBreaksNaiveCode: 'Initializing bounds to `-2147483648` fails when the root itself has value `-2147483648` under strict inequality.',
      howToHandle: 'Initialize `low = -Infinity` and `high = Infinity` (or `null` bounds).'
    },
    exerciseId: 'ex_trees_01',
    recommendedPracticeIds: ['prac_trees_05', 'prac_trees_06', 'prac_trees_10'],
    knowledgeCheck: {
      question: 'When recursing from `node` into its left child `node.left` during `isValidBST(node, low, high)`, which bound changes?',
      options: [
        {
          id: 'tr2_ok',
          label: 'The upper bound `high` becomes `node.val`, while the lower bound `low` remains unchanged: `(low, node.val)`.',
          feedback: 'Correct! Every node in `node.left` must be strictly smaller than `node.val` while still exceeding any ancestor lower bound `low`.'
        },
        {
          id: 'tr2_bad1',
          label: 'The lower bound `low` becomes `node.val`: `(node.val, high)`.',
          feedback: 'That is the interval for the RIGHT child `node.right`.'
        },
        {
          id: 'tr2_bad2',
          label: 'Both bounds reset to `(-Infinity, node.val)`.',
          feedback: 'Resetting `low` to `-Infinity` would lose the lower bound when `node` itself is inside a right subtree!'
        }
      ],
      correctOptionId: 'tr2_ok',
      explanation: 'Moving left caps maximum values at `node.val` while preserving the inherited `low` floor.'
    },
    reflectionPrompt: 'Why is an in-order traversal that checks `prevVal < curr.val` equivalent to top-down `(low, high)` interval propagation?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA BST range invariant proofs.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_trees_03',
    topicId: 'topic_trees',
    order: 3,
    title: 'Lowest Common Ancestor & Subtree Witness Propagation',
    estimatedMinutes: 20,
    prerequisites: ['les_trees_01', 'les_trees_02'],
    measurableObjective: 'Locate the Lowest Common Ancestor (LCA) in both BSTs (`O(h)` split point) and general binary trees (`O(n)` post-order witness return).',
    explanation: 'In a **BST**, the Lowest Common Ancestor of `p` and `q` is simply the first node from the root where `p` and `q` don’t go into the same child: if both `p.val < curr.val` and `q.val < curr.val`, move `curr = curr.left`; if both are `> curr.val`, move `curr = curr.right`; otherwise `curr` is the split point (LCA) in `O(h)` time and `O(1)` space! In a **general binary tree** without BST order, a post-order function `lca(root, p, q)` returns `root` if `root === null || root === p || root === q`. If both `left` and `right` recursive calls return non-null witnesses, then `p` and `q` sit in opposite subtrees of `root`, making `root` the LCA; otherwise we bubble up whichever side is non-null.',
    codeSnippet: {
      language: 'javascript',
      filename: 'lowestCommonAncestorBst.js',
      lines: [
        'export function lowestCommonAncestorBST(root, pVal, qVal) {',
        '  let curr = root;',
        '  while (curr !== null) {',
        '    if (pVal < curr.val && qVal < curr.val) {',
        '      curr = curr.left;',
        '    } else if (pVal > curr.val && qVal > curr.val) {',
        '      curr = curr.right;',
        '    } else {',
        '      return curr;',
        '    }',
        '  }',
        '  return null;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'BST with root 6, left 2 (children 0, 4), right 8 (children 7, 9); find LCA(2, 4)',
      stepByStep: [
        'Start curr = 6: both pVal = 2 < 6 and qVal = 4 < 6 -> move curr = curr.left (2).',
        'At curr = 2: pVal = 2 is not < 2 (and qVal = 4 > 2) -> split condition reached!',
        'Return node 2 (a node can be a descendant of itself).'
      ],
      outputDescription: 'Node 2 (since 2 is an ancestor of 4)',
      invariantSummary: 'Throughout the walk, curr is an ancestor of both p and q; the first node that does not place both strictly in the same child subtree is their lowest common ancestor.'
    },
    pitfalls: [
      'Forgetting that a node is considered an ancestor of itself when `p` is the parent/ancestor of `q`.',
      'Using `O(n)` general-tree recursion on a BST when the `O(h)` iterative split-point walk uses `O(1)` space.'
    ],
    edgeCase: {
      scenario: '`p` is a direct ancestor of `q` (e.g., `p = 2, q = 4`)',
      whyItBreaksNaiveCode: 'Code that only checks `p < curr && q > curr` misses the case where `curr.val === p.val`.',
      howToHandle: 'The `else` branch after checking "both `< curr.val`" and "both `> curr.val`" automatically catches both split subtrees AND `curr.val === pVal` or `qVal`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_trees_07'],
    knowledgeCheck: {
      question: 'In a BST, when walking down from `root` to find the LCA of `p` and `q`, what is true at the very first node `curr` where `p.val` and `q.val` are NOT both `< curr.val` and NOT both `> curr.val`?',
      options: [
        {
          id: 'tr3_ok',
          label: '`curr` is guaranteed to be the Lowest Common Ancestor (either `p` and `q` branch into opposite subtrees of `curr`, or `curr` itself equals `p` or `q`).',
          feedback: 'Correct! Any deeper move into a child would leave at least one of `p` or `q` behind.'
        },
        {
          id: 'tr3_bad1',
          label: 'You must still search both subtrees to verify which one is taller.',
          feedback: 'Subtree height does not affect which node is the split point between `p` and `q`.'
        },
        {
          id: 'tr3_bad2',
          label: '`curr` is the root of the entire tree.',
          feedback: '`curr` is only the root if `p` and `q` split immediately at the root; if both were `< root.val`, `curr` already descended left.'
        }
      ],
      correctOptionId: 'tr3_ok',
      explanation: 'Once `p` and `q` diverge (or hit `curr`), no child of `curr` can contain both of them.'
    },
    reflectionPrompt: 'How does the general binary tree LCA function handle the case where `p` is an ancestor of `q` without even visiting `q`?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA BST and tree ancestor properties.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_trees_04',
    topicId: 'topic_trees',
    order: 4,
    title: 'BFS Level-Order Traversal & Level-Size Snapshot Invariants',
    estimatedMinutes: 20,
    prerequisites: ['les_trees_01', 'les_stacks_queues_01'],
    measurableObjective: 'Group tree nodes by depth and extract level extrema (such as Right Side View) by snapshotting `const levelSize = queue.length - head` before each level loop.',
    explanation: 'Standard Breadth-First Search (BFS) visits nodes in non-decreasing order of depth, but a single flat `while (queue not empty)` loop blends depth `d` and depth `d + 1` together in the queue. How do we separate levels cleanly? At the start of each outer iteration, the queue contains **all and only** the nodes at the current depth `d`! By snapshotting `const levelSize = queue.length - head` BEFORE the inner `for (let i = 0; i < levelSize; i += 1)` loop, the inner loop dequeues exactly the `levelSize` nodes of depth `d` while pushing their children (depth `d + 1`) to the back for the next outer iteration.',
    codeSnippet: {
      language: 'javascript',
      filename: 'levelOrderSnapshot.js',
      lines: [
        'export function levelOrder(root) {',
        '  if (root === null) return [];',
        '  const levels = [];',
        '  const queue = [root];',
        '  let head = 0;',
        '  while (head < queue.length) {',
        '    const levelSize = queue.length - head;',
        '    const currentLevel = [];',
        '    for (let i = 0; i < levelSize; i += 1) {',
        '      const node = queue[head++];',
        '      currentLevel.push(node.val);',
        '      if (node.left !== null) queue.push(node.left);',
        '      if (node.right !== null) queue.push(node.right);',
        '    }',
        '    levels.push(currentLevel);',
        '  }',
        '  return levels;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Tree: root 3, left 9, right 20 (children 15, 7)',
      stepByStep: [
        'Init: queue = [3], head = 0.',
        'Level 0: levelSize = 1 - 0 = 1. Dequeue 3, push 9 and 20 -> currentLevel = [3].',
        'Level 1: levelSize = 3 - 1 = 2 (nodes 9, 20). Dequeue 9 (no children), dequeue 20 (push 15, 7) -> currentLevel = [9, 20].',
        'Level 2: levelSize = 5 - 3 = 2 (nodes 15, 7). Dequeue 15, 7 -> currentLevel = [15, 7].',
        'head === 5 === queue.length -> return [[3], [9, 20], [15, 7]].'
      ],
      outputDescription: '[[3], [9, 20], [15, 7]]',
      invariantSummary: 'At the top of the outer while loop (iteration d), queue[head..queue.length-1] holds all nodes at depth d from left to right.'
    },
    pitfalls: [
      'Writing `for (let i = 0; i < queue.length - head; i += 1)` inline without snapshotting `const levelSize`, which re-evaluates `queue.length` as children are pushed and merges all levels into one!',
      'Forgetting `if (root === null) return []`, which pushes `[null]` into the queue and crashes on `node.val`.'
    ],
    edgeCase: {
      scenario: 'Right Side View where the deepest node on the right is actually in the LEFT subtree (e.g., `root.right` is a leaf at depth 1, `root.left.right` reaches depth 2)',
      whyItBreaksNaiveCode: 'Walking only `node = node.right` misses deeper nodes hidden behind a shorter right branch!',
      howToHandle: 'Use level-order BFS and pick the last node `i === levelSize - 1` of every level.'
    },
    exerciseId: 'ex_trees_02',
    recommendedPracticeIds: ['prac_trees_08', 'prac_trees_09'],
    knowledgeCheck: {
      question: 'In level-order BFS, what bug occurs if you write `for (let i = 0; i < queue.length; i++)` (using `queue.shift()`) instead of snapshotting `const levelSize = queue.length` before the `for` loop?',
      options: [
        {
          id: 'tr4_ok',
          label: 'Because `queue.length` changes dynamically as nodes are shifted and children are pushed, the loop boundary shifts mid-level and mixes nodes from different depths.',
          feedback: 'Correct! Snapshotting `levelSize` freezes the exact count of nodes belonging to the current depth `d`.'
        },
        {
          id: 'tr4_bad1',
          label: 'JavaScript throws a SyntaxError when `.length` is used in a `for` condition.',
          feedback: 'It is valid syntax, which makes it a subtle logical bug!'
        },
        {
          id: 'tr4_bad2',
          label: 'Right children are visited before left children.',
          feedback: 'Left/right push order is unchanged; the bug is corrupting the level boundary count.'
        }
      ],
      correctOptionId: 'tr4_ok',
      explanation: 'Freezing `const levelSize` before the loop isolates depth `d` from the newly enqueued depth `d + 1` children.'
    },
    reflectionPrompt: 'How does snapshotting `levelSize` let you solve Zigzag Level Order, Right Side View, and Level Averages with a 2-line change?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA level-order traversal invariants.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 9: HEAPS ====================
  {
    id: 'les_heaps_01',
    topicId: 'topic_heaps',
    order: 1,
    title: 'Implicit Array Binary Heaps & Sift Up/Down Invariants',
    estimatedMinutes: 20,
    prerequisites: ['les_arrays_01', 'les_trees_01'],
    measurableObjective: 'Map a complete binary tree into a 0-indexed array (`parent = floor((i-1)/2)`, `left = 2i+1`, `right = 2i+2`) and restore the min-heap invariant on push and pop.',
    explanation: 'A binary heap is a **complete binary tree** (every level filled left-to-right) that satisfies the **heap-order invariant**: in a min-heap, `heap[parent(i)] <= heap[i]` for every `i > 0`, which guarantees the global minimum sits at `heap[0]`. Because the tree has no gaps, it requires zero node objects or pointers! In a 0-indexed array, index `i` has `parent = Math.floor((i - 1) / 2)`, `left = 2 * i + 1`, and `right = 2 * i + 2`. Pushing appends to the end and `siftUp`s while `< parent`; popping swaps `heap[0]` with `heap.pop()` and `siftDown`s by swapping with the **smaller** of its two children.',
    codeSnippet: {
      language: 'javascript',
      filename: 'minHeapSift.js',
      lines: [
        'export function siftUpMinHeap(heap, idx) {',
        '  let i = idx;',
        '  while (i > 0) {',
        '    const p = Math.floor((i - 1) / 2);',
        '    if (heap[p] <= heap[i]) break;',
        '    [heap[p], heap[i]] = [heap[i], heap[p]];',
        '    i = p;',
        '  }',
        '  return heap;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Min-heap array [2, 5, 4, 9, 6]; push value 1 at index 5',
      stepByStep: [
        'Append 1 at i = 5: heap = [2, 5, 4, 9, 6, 1].',
        'i = 5: parent p = floor(4 / 2) = 2 (value 4). Since 4 > 1, swap(2, 5) -> [2, 5, 1, 9, 6, 4], i = 2.',
        'i = 2: parent p = floor(1 / 2) = 0 (value 2). Since 2 > 1, swap(0, 2) -> [1, 5, 2, 9, 6, 4], i = 0.',
        'i = 0 terminates loop; new minimum 1 sits at root index 0.'
      ],
      outputDescription: '[1, 5, 2, 9, 6, 4]',
      invariantSummary: 'Every node except possibly index i satisfies heap[parent] <= heap[node]; swapping i with parent(i) moves the violation strictly closer to root 0.'
    },
    pitfalls: [
      'During `siftDown` in a min-heap, swapping with the left child whenever `left < current` without checking if the right child is even smaller (which puts the larger child above the smaller child!).',
      'Mixing 1-indexed formulas (`2i`, `2i+1`) with 0-indexed arrays (`2i+1`, `2i+2`).'
    ],
    edgeCase: {
      scenario: 'Popping the only element from a 1-element heap `[7]`',
      whyItBreaksNaiveCode: 'If you overwrite `heap[0] = heap.pop()` without checking `heap.length === 1`, you push `7` back into `heap[0]` and never empty the heap!',
      howToHandle: 'If `heap.length === 1`, simply `return heap.pop()`; only replace `heap[0]` and `siftDown` when elements remain.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_heaps_02', 'prac_heaps_05', 'prac_heaps_08'],
    knowledgeCheck: {
      question: 'During `siftDown` in a min-heap, when node `i` is larger than both `left` and `right` children, why MUST you swap `i` with `Math.min(heap[left], heap[right])` rather than always swapping with `left`?',
      options: [
        {
          id: 'hp1_ok',
          label: 'Because whichever child moves up to index `i` becomes the new parent of the other child, so it must be `<=` the other child to preserve the min-heap invariant.',
          feedback: 'Correct! Promoting the larger child would immediately violate `parent <= child` against its sibling.'
        },
        {
          id: 'hp1_bad1',
          label: 'Because the left subtree is always taller than the right subtree.',
          feedback: 'Child subtree height does not determine heap-order validity; the smaller value must become the parent.'
        },
        {
          id: 'hp1_bad2',
          label: 'Because binary heaps are Binary Search Trees.',
          feedback: 'Heaps are NOT BSTs: left and right children have no `<` or `>` ordering relative to each other.'
        }
      ],
      correctOptionId: 'hp1_ok',
      explanation: 'The promoted child becomes the parent of its former sibling, so the smaller child must be promoted.'
    },
    reflectionPrompt: 'Why is a binary heap NOT a Binary Search Tree, and what operations is each structure optimized for?',
    sourceId: 'src_ods_cc_by',
    provenance: 'Adapted from Open Data Structures (CC-BY) binary heap array representation.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_heaps_02',
    topicId: 'topic_heaps',
    order: 2,
    title: 'Bounded Min-Heap of Size K (Top-K Largest Bouncer Pattern)',
    estimatedMinutes: 25,
    prerequisites: ['les_heaps_01'],
    measurableObjective: 'Maintain the `k` largest elements of a stream in `O(n log k)` time and `O(k)` memory using a min-heap of size `k`.',
    explanation: 'Why do we use a **Min-Heap** (not a Max-Heap) to track the **K Largest** elements? Think of the heap as a VIP club with capacity `k`. To decide if a new candidate `x` deserves to enter a full club, you compare `x` against the **weakest member currently inside**—which is the minimum of the top `k`! A Min-Heap of size `k` keeps that weakest top-`k` element right at `heap[0]` in `O(1)` time. When `x > heap[0]`, we evict `heap[0]` and insert `x` in `O(log k)`. After scanning all `n` items, `heap[0]` is the exact `k`-th largest element overall!',
    codeSnippet: {
      language: 'javascript',
      filename: 'kthLargestMinHeap.js',
      lines: [
        'export function updateTopKMinHeap(minHeap, k, x, pushHeap, popHeap) {',
        '  if (minHeap.length < k) {',
        '    pushHeap(minHeap, x);',
        '  } else if (x > minHeap[0]) {',
        '    popHeap(minHeap);',
        '    pushHeap(minHeap, x);',
        '  }',
        '  return minHeap[0];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Stream = [4, 5, 8, 2], k = 3; then add(3), add(5), add(10)',
      stepByStep: [
        'Initial [4, 5, 8, 2] with k = 3: top 3 in min-heap are [4, 5, 8] with root minHeap[0] = 4 (2 was rejected because 2 <= 4).',
        'add(3): 3 <= minHeap[0] (4) -> ignored! K-th largest remains 4.',
        'add(5): 5 > 4 -> pop 4, push 5 -> minHeap holds [5, 5, 8], root minHeap[0] = 5.',
        'add(10): 10 > 5 -> pop 5, push 10 -> minHeap holds [5, 8, 10], root minHeap[0] = 5.'
      ],
      outputDescription: 'K-th largest after each add: 4, 5, 5',
      invariantSummary: 'Once at least k elements have been seen, minHeap contains the k largest elements seen so far, and minHeap[0] is the smallest among those k (the k-th largest overall).'
    },
    pitfalls: [
      'Using a Max-Heap of size `n` when `k` is small (or streaming), which wastes `O(n)` memory and cannot evict the `(k+1)`-th largest element in `O(log k)`.',
      'Using a Min-Heap when the problem asks for the K **Smallest** elements (K Smallest requires a **Max-Heap** of size `k` so the largest of the `k` smallest sits at the root to be evicted!).'
    ],
    edgeCase: {
      scenario: 'Initial array has `k - 1` elements before the first `add(val)` call (as allowed in LeetCode 703 `KthLargest`)',
      whyItBreaksNaiveCode: 'Assuming `minHeap.length === k` during the constructor crashes if the initial array has length `k - 1`.',
      howToHandle: 'Check `if (minHeap.length < k) push(x)` in `add(x)` so the `k`-th element fills the heap to size `k`.'
    },
    exerciseId: 'ex_heaps_01',
    recommendedPracticeIds: ['prac_heaps_01', 'prac_heaps_03', 'prac_heaps_04', 'prac_heaps_10'],
    knowledgeCheck: {
      question: 'If you want to find the `k` SMALLEST elements (e.g., `K Closest Points to Origin`) in `O(n log k)` time and `O(k)` space, which heap type of capacity `k` should you maintain?',
      options: [
        {
          id: 'hp2_ok',
          label: 'A Max-Heap of size `k`, so the farthest/largest of the `k` kept candidates sits at `heap[0]` ready to be evicted whenever a smaller candidate arrives.',
          feedback: 'Spot on! To keep the `k` smallest, your bouncer at `heap[0]` must track the largest among the `k` currently kept.'
        },
        {
          id: 'hp2_bad1',
          label: 'A Min-Heap of size `k`, so the smallest element is evicted first.',
          feedback: 'Evicting the smallest element would throw away the best answers and keep the `k` largest instead!'
        },
        {
          id: 'hp2_bad2',
          label: 'A FIFO Queue of size `k`.',
          feedback: 'Arrival order has nothing to do with distance or magnitude.'
        }
      ],
      correctOptionId: 'hp2_ok',
      explanation: 'Top-K Largest uses a size-K Min-Heap; Top-K Smallest uses a size-K Max-Heap.'
    },
    reflectionPrompt: 'How does the "VIP club bouncer" mental model make it impossible to confuse when to use a Min-Heap vs. a Max-Heap of size `k`?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook heap and top-k patterns.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_heaps_03',
    topicId: 'topic_heaps',
    order: 3,
    title: 'K-Way Sorted Stream Merge & Frontier Min-Heap',
    estimatedMinutes: 20,
    prerequisites: ['les_heaps_01', 'les_linked_lists_01'],
    measurableObjective: 'Merge `k` sorted linked lists or matrix rows in `O(N log k)` time by keeping only the current head of each non-empty stream in a Min-Heap of size `<= k`.',
    explanation: 'When merging `k` sorted lists containing `N` total nodes, pushing all `N` nodes into a heap takes `O(N log N)` time and `O(N)` space, ignoring the fact that each individual list is already sorted! Because the global minimum among all remaining nodes MUST be the head of one of the `k` lists, our Min-Heap only needs to hold the **active frontier** of at most `k` head nodes (`O(k)` space). Each step pops the smallest frontier node `u` in `O(log k)`, appends `u` to the merged output tail, and if `u.next !== null`, pushes `u.next` into the heap in `O(log k)`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'mergeKListsFrontier.js',
      lines: [
        'export function mergeKListsWithHeap(lists, pushNode, popMinNode) {',
        '  const minHeap = [];',
        '  for (const head of lists) {',
        '    if (head !== null) pushNode(minHeap, head);',
        '  }',
        '  const dummy = { val: 0, next: null };',
        '  let tail = dummy;',
        '  while (minHeap.length > 0) {',
        '    const smallest = popMinNode(minHeap);',
        '    tail.next = smallest;',
        '    tail = tail.next;',
        '    if (smallest.next !== null) {',
        '      pushNode(minHeap, smallest.next);',
        '    }',
        '  }',
        '  return dummy.next;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'lists = [1->4, 1->3, 2->6]',
      stepByStep: [
        'Seed non-null heads into minHeap (size <= 3): [1(L0), 1(L1), 2(L2)].',
        'Pop 1(L0), attach to tail, push its next 4(L0) -> minHeap = [1(L1), 2(L2), 4(L0)].',
        'Pop 1(L1), attach to tail, push its next 3(L1) -> minHeap = [2(L2), 3(L1), 4(L0)].',
        'Pop 2(L2), push 6(L2); then pop 3, 4, 6 -> output 1->1->2->3->4->6.'
      ],
      outputDescription: '1 -> 1 -> 2 -> 3 -> 4 -> 6',
      invariantSummary: 'At every step, minHeap contains the first unmerged node of each non-exhausted list (at most k nodes), and every node already in dummy.next is <= minHeap[0].'
    },
    pitfalls: [
      'Pushing `null` heads from empty lists `[null, 1->2]` into `minHeap` without guarding `if (head !== null)`.',
      'Pushing all `N` nodes upfront instead of pushing `smallest.next` lazily (`O(N log N)` vs `O(N log k)`).'
    ],
    edgeCase: {
      scenario: '`lists = []` or `lists = [null, null]`',
      whyItBreaksNaiveCode: 'Unconditional seeding pushes `null` into the heap and crashes when comparing `a.val < b.val`.',
      howToHandle: 'Guard seeding with `if (head !== null)` so `minHeap` stays empty and `dummy.next` (`null`) is returned cleanly.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_heaps_07', 'prac_heaps_09'],
    knowledgeCheck: {
      question: 'When merging `k` sorted lists with `N` total nodes using a frontier Min-Heap of size `<= k`, what are the time and auxiliary heap space complexities?',
      options: [
        {
          id: 'hp3_ok',
          label: 'O(N log k) time and O(k) heap space, because each of the N nodes is pushed and popped once from a heap containing at most k list heads.',
          feedback: 'Correct! Keeping only the `k` active stream heads bounds heap size at `k`.'
        },
        {
          id: 'hp3_bad1',
          label: 'O(N log N) time and O(N) heap space.',
          feedback: 'Because we only push `smallest.next` when `smallest` is popped, the heap never exceeds `k` elements.'
        },
        {
          id: 'hp3_bad2',
          label: 'O(N * k) time and O(1) space.',
          feedback: '`O(N * k)` is the complexity of scanning all `k` heads linearly without a heap.'
        }
      ],
      correctOptionId: 'hp3_ok',
      explanation: '`N` pop/push pairs on a heap of size `<= k` take `O(N log k)` time and `O(k)` space.'
    },
    reflectionPrompt: 'How does Kth Smallest Element in a Sorted Matrix map directly to merging `k` sorted rows with a frontier Min-Heap?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA multiway merge and priority queue patterns.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_heaps_04',
    topicId: 'topic_heaps',
    order: 4,
    title: 'Dual-Heap Running Median Balancing (`maxLow` & `minHigh`)',
    estimatedMinutes: 25,
    prerequisites: ['les_heaps_02'],
    measurableObjective: 'Maintain the exact median of a dynamic data stream in `O(log n)` per insertion and `O(1)` per query by balancing a Max-Heap of the lower half and a Min-Heap of the upper half.',
    explanation: 'The median sits at the boundary between the smaller half and the larger half of the data. If we store the smaller half in a **Max-Heap** (`maxLow`, so its largest element sits at the top) and the larger half in a **Min-Heap** (`minHigh`, so its smallest element sits at the top), then the two heap roots expose the exact middle of the sorted order in `O(1)`! Two invariants must hold after every `addNum(x)`: (1) **Order invariant**: `maxLow.top <= minHigh.top`, and (2) **Size invariant**: `maxLow.size === minHigh.size` (even count) or `maxLow.size === minHigh.size + 1` (odd count). Routing every new `x` through `maxLow` -> `minHigh` and rebalancing size when `minHigh.size > maxLow.size` preserves both invariants in 2–3 heap ops!',
    codeSnippet: {
      language: 'javascript',
      filename: 'medianFinderDualHeap.js',
      lines: [
        'export function addNumDualHeap(x, maxLow, minHigh, pushMax, popMax, pushMin, popMin) {',
        '  pushMax(maxLow, x);',
        '  pushMin(minHigh, popMax(maxLow));',
        '  if (minHigh.length > maxLow.length) {',
        '    pushMax(maxLow, popMin(minHigh));',
        '  }',
        '}',
        'export function findMedianDualHeap(maxLow, minHigh) {',
        '  if (maxLow.length > minHigh.length) return maxLow[0];',
        '  return (maxLow[0] + minHigh[0]) / 2;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'Stream: addNum(1), addNum(2), findMedian(), addNum(3), findMedian()',
      stepByStep: [
        'addNum(1): push 1 to maxLow, move max(1) to minHigh, minHigh.len(1) > maxLow.len(0) so move 1 back -> maxLow=[1], minHigh=[].',
        'addNum(2): push 2 to maxLow ([2, 1]), move max(2) to minHigh -> maxLow=[1], minHigh=[2] (equal sizes).',
        'findMedian(): sizes equal -> (1 + 2) / 2 = 1.5.',
        'addNum(3): push 3 to maxLow ([3, 1]), move 3 to minHigh ([2, 3]), minHigh.len(2) > maxLow.len(1) so move min(2) to maxLow -> maxLow=[2, 1], minHigh=[3].',
        'findMedian(): maxLow.len (2) > minHigh.len (1) -> return maxLow[0] = 2.'
      ],
      outputDescription: '1.5 after [1, 2], then 2 after [1, 2, 3]',
      invariantSummary: 'After every addNum: all elements in maxLow <= all elements in minHigh, and 0 <= maxLow.length - minHigh.length <= 1.'
    },
    pitfalls: [
      'Pushing directly into `maxLow` just because `maxLow.length <= minHigh.length` without checking `x > minHigh[0]`, which violates the order invariant `maxLow.top <= minHigh.top`!',
      'Using two Min-Heaps (without negating keys or inverting the comparator for `maxLow`), which exposes the global minimum instead of the top of the lower half.'
    ],
    edgeCase: {
      scenario: 'Inserting numbers in strictly decreasing order `[10, 8, 6, 4]`',
      whyItBreaksNaiveCode: 'If new numbers are blindly alternated between `maxLow` and `minHigh` by parity, `10` ends up in `maxLow` while `8` is in `minHigh` (`10 > 8`).',
      howToHandle: 'Always pass the new number through one heap into the other (`pushMax` -> `popMax` -> `pushMin`) before equalizing sizes.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_heaps_06'],
    knowledgeCheck: {
      question: 'Why does `addNum` push `x` into `maxLow` and immediately move `popMax(maxLow)` into `minHigh` BEFORE checking `if (minHigh.length > maxLow.length)`?',
      options: [
        {
          id: 'hp4_ok',
          label: 'To guarantee the order invariant (`maxLow.top <= minHigh.top`): even if `x` was huge and belonged in `minHigh`, `popMax(maxLow)` flushes the largest lower-half value over to `minHigh`.',
          feedback: 'Correct! Routing through `maxLow` -> `minHigh` enforces sorted partitioning before the size check restores balance.'
        },
        {
          id: 'hp4_bad1',
          label: 'Because `minHigh` cannot accept elements directly.',
          feedback: '`minHigh` is a standard heap; routing through `maxLow` first avoids writing manual value-comparison branches.'
        },
        {
          id: 'hp4_bad2',
          label: 'To clear `maxLow` completely on every insertion.',
          feedback: '`popMax` only removes the single maximum element of `maxLow`, not the whole heap.'
        }
      ],
      correctOptionId: 'hp4_ok',
      explanation: 'Routing `x` through `maxLow` into `minHigh` guarantees every element in `minHigh` is `>=` every element in `maxLow`.'
    },
    reflectionPrompt: 'Why is the two-heap pattern (`O(log n)` insert, `O(1)` median) strictly better than keeping a sorted array (`O(n)` insert) for a live stream?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook dual-heap median invariants.',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_2_EXERCISES = [
  // ==================== EXERCISE 12: MONOTONIC STACK DAILY TEMPERATURES ====================
  {
    id: 'ex_stacks_queues_01',
    topicId: 'topic_stacks_queues',
    lessonId: 'les_stacks_queues_02',
    title: 'Trace: Monotonic Decreasing Stack (Daily Temperatures)',
    rendererType: 'stack_queue_frames',
    objective: 'Trace how a warmer day pops multiple waiting cooler indices off the monotonic stack in a single cascade.',
    instructions: 'Inspect the current index `i`, `temps[i]`, and the waiting `stack` of indices, then select the exact pop/push state transition.',
    codeLines: [
      'export function dailyTemperatures(temps) {',
      '  const ans = new Array(temps.length).fill(0);',
      '  const stack = [];',
      '  for (let i = 0; i < temps.length; i += 1) {',
      '    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {',
      '      const prev = stack.pop();',
      '      ans[prev] = i - prev;',
      '    }',
      '    stack.push(i);',
      '  }',
      '  return ans;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Cool Spell Followed by Multi-Pop Warm Front',
      inputLabel: 'temps = [75, 71, 69, 72]',
      edgeCaseNote: 'Watch `72` at index 3 pop both `69` (index 2) and `71` (index 1), while `75` (index 0) remains on the stack.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 9,
          prompt: 'After scanning `i = 0` (`75`), `i = 1` (`71`), and `i = 2` (`69`), none triggered the `while` loop because temperatures fell. What is on `stack`?',
          stateSnapshot: {
            array: [75, 71, 69, 72],
            pointers: { i: 2 },
            highlightedIndices: [0, 1, 2],
            stackOrQueue: ['idx 0 (75)', 'idx 1 (71)', 'idx 2 (69)'],
            annotation: 'Stack holds indices [0, 1, 2] with strictly decreasing temperatures [75, 71, 69].'
          },
          choices: [
            {
              id: 'sq1_c1_ok',
              label: 'stack = [0, 1, 2] (representing waiting temperatures 75, 71, 69) and ans = [0, 0, 0, 0]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Cooler temperatures cannot resolve warmer predecessors, so their indices accumulate in decreasing order.'
            },
            {
              id: 'sq1_c1_bad',
              label: 'stack = [2] because 69 overwrites 75 and 71',
              isCorrect: false,
              misconceptionFeedback: 'Indices are only popped when a WARMER temperature (`temps[i] > temps[top]`) arrives.'
            }
          ],
          correctExplanation: 'All three indices `[0, 1, 2]` wait on the stack in decreasing temperature order.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'Now `i = 3` (`temps[3] = 72`). How does the `while (temps[3] > temps[stack.top])` loop execute?',
          stateSnapshot: {
            array: [75, 71, 69, 72],
            pointers: { i: 3 },
            highlightedIndices: [1, 2, 3],
            stackOrQueue: ['idx 0 (75)', 'idx 3 (72)'],
            annotation: '72 > 69 pops idx 2 (ans[2] = 3 - 2 = 1); then 72 > 71 pops idx 1 (ans[1] = 3 - 1 = 2); 72 <= 75 stops.'
          },
          choices: [
            {
              id: 'sq1_c2_ok',
              label: 'Pops index 2 (ans[2] = 1) and index 1 (ans[1] = 2), stops at index 0 (75 >= 72), and pushes index 3',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! One warmer day resolves two waiting cooler days in a single cascade.'
            },
            {
              id: 'sq1_c2_bad',
              label: 'Only pops index 2 (ans[2] = 1) and leaves index 1 (71) on the stack',
              isCorrect: false,
              misconceptionFeedback: 'Line 5 is a `while` loop, not an `if`—since `72 > 71`, index 1 is also popped!'
            }
          ],
          correctExplanation: 'Both `69` and `71` are `< 72`, so indices `2` and `1` are popped before `3` is pushed.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 11,
          prompt: 'The loop finishes after `i = 3` with `stack = [0, 3]`. What is the final returned `ans` array?',
          stateSnapshot: {
            array: [75, 71, 69, 72],
            pointers: { i: 3 },
            highlightedIndices: [0, 3],
            stackOrQueue: ['idx 0 (75)', 'idx 3 (72)'],
            annotation: 'Unpopped indices 0 and 3 keep their initial ans value of 0.'
          },
          choices: [
            {
              id: 'sq1_c3_ok',
              label: 'Returns [0, 2, 1, 0], where indices 0 and 3 remain 0 because no warmer day ever followed them',
              isCorrect: true,
              misconceptionFeedback: 'Exact! Pre-filling `ans` with `0` handles all unpopped stack elements automatically.'
            },
            {
              id: 'sq1_c3_bad',
              label: 'Returns [3, 2, 1, 0]',
              isCorrect: false,
              misconceptionFeedback: '`72` is cooler than `75`, so index 0 (`75`) was never popped and stays `0`.'
            }
          ],
          correctExplanation: 'Indices `1` (`ans=2`) and `2` (`ans=1`) were resolved; `0` and `3` remain `0`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'equal_plateau',
      label: 'Duplicate Temperatures Plateau',
      inputLabel: 'temps = [70, 70, 73]',
      edgeCaseNote: 'Tests that `70` at index 1 does NOT pop `70` at index 0 because strict `>` is required.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 5,
          prompt: 'At `i = 1` (`temps[1] = 70`), `stack` has `[0]` (`temps[0] = 70`). Does `temps[1] > temps[0]` hold?',
          stateSnapshot: {
            array: [70, 70, 73],
            pointers: { i: 1 },
            highlightedIndices: [0, 1],
            stackOrQueue: ['idx 0 (70)', 'idx 1 (70)'],
            annotation: '70 > 70 is false -> index 0 stays on stack and index 1 is pushed.'
          },
          choices: [
            {
              id: 'sq1_alt1_ok',
              label: 'No (70 > 70 is false); index 0 stays on the stack and index 1 is pushed, giving stack = [0, 1]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Equal temperatures are not strictly warmer, so both wait for a future day `> 70`.'
            },
            {
              id: 'sq1_alt1_bad',
              label: 'Yes; index 0 is popped with ans[0] = 1',
              isCorrect: false,
              misconceptionFeedback: 'Day 1 (`70`) is the same temperature as Day 0 (`70`), not warmer!'
            }
          ],
          correctExplanation: 'Strict inequality `>` keeps both `0` and `1` waiting on the stack.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 6,
          prompt: 'At `i = 2` (`temps[2] = 73`), what happens to `stack = [0, 1]`?',
          stateSnapshot: {
            array: [70, 70, 73],
            pointers: { i: 2 },
            highlightedIndices: [0, 1, 2],
            stackOrQueue: ['idx 2 (73)'],
            annotation: '73 > 70 pops idx 1 (ans[1] = 1) and idx 0 (ans[0] = 2).'
          },
          choices: [
            {
              id: 'sq1_alt2_ok',
              label: 'Both index 1 (ans[1] = 2 - 1 = 1) and index 0 (ans[0] = 2 - 0 = 2) are popped, returning [2, 1, 0]',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Index 2 (`73`) resolves both `70`s with their respective distances `2` and `1`.'
            },
            {
              id: 'sq1_alt2_bad',
              label: 'Both get ans = 1',
              isCorrect: false,
              misconceptionFeedback: 'Because each stack frame stored its own index (`0` vs `1`), `i - prev` computes `2 - 0 = 2` for index 0 and `2 - 1 = 1` for index 1.'
            }
          ],
          correctExplanation: '`[2, 1, 0]` is returned.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'If a problem asks for the Next GREATER OR EQUAL Element (`>=`), how should the `while` condition change?',
      choices: [
        {
          id: 'ec_sq1_ok',
          label: 'Change `temps[i] > temps[stack.top]` to `temps[i] >= temps[stack.top]` so equal values immediately resolve waiting predecessors (leaving the stack strictly decreasing).',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Strict `>` resolves on strictly greater (stack non-increasing); `>=` resolves on greater-or-equal (stack strictly decreasing).'
        },
        {
          id: 'ec_sq1_bad',
          label: 'Change the loop direction to right-to-left only.',
          isCorrect: false,
          misconceptionFeedback: 'Direction alone does not change the comparison operator from `>` to `>=`.'
        }
      ],
      explanation: 'Matching the `while` pop operator (`>` vs `>=`) to the exact relation that resolves a waiting element keeps the stack invariant exact.'
    },
    referenceInvariant: 'Every index currently on the stack is waiting for its first warmer day, and stack temperatures are monotonically non-increasing from bottom to top.',
    hintText: 'Compare `temps[i]` against the temperature at the index on top of the stack (`temps[stack[stack.length - 1]]`).',
    reflectionPrompt: 'How does changing the pop condition from `temps[i] > temps[top]` to `temps[i] < temps[top]` transform Next Greater Element into Next Smaller Element?',
    sourceId: 'src_tih_mit',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 13: VALIDATE BST ANCESTOR RANGE ====================
  {
    id: 'ex_trees_01',
    topicId: 'topic_trees',
    lessonId: 'les_trees_02',
    title: 'Trace: Top-Down Ancestor Range Propagation in Validate BST',
    rendererType: 'tree_traversal_state',
    objective: 'Trace `(low, high)` ancestor intervals down a binary tree to catch a deep grandchild that satisfies its parent locally but violates an ancestor bound.',
    instructions: 'Inspect the active tree node and its inherited `(low, high)` interval at each call.',
    codeLines: [
      'export function isValidBST(node, low = -Infinity, high = Infinity) {',
      '  if (node === null) return true;',
      '  if (node.val <= low || node.val >= high) {',
      '    return false;',
      '  }',
      '  return (',
      '    isValidBST(node.left, low, node.val) &&',
      '    isValidBST(node.right, node.val, high)',
      '  );',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Deep Grandchild Violating Root Bound',
      inputLabel: 'root = 10, left = 5, right = 15 (15.left = 6, 15.right = 20)',
      edgeCaseNote: 'Node `6` is `< 15` (valid relative to parent 15), but `6 <= 10` (invalid inside right subtree of 10!).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 7,
          prompt: 'Root `10` is checked with `(-Inf, +Inf)` and left child `5` passes with `(-Inf, 10)`. Now we recurse into right child `15` (line 8). What interval `(low, high)` is passed to `node = 15`?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n10', label: '10 (-Inf, +Inf)', state: 'visited' },
              { id: 'n5', label: '5 (-Inf, 10)', state: 'valid' },
              { id: 'n15', label: '15 (10, +Inf)', state: 'active' },
              { id: 'n6', label: '6 (?, ?)', state: 'pending' },
              { id: 'n20', label: '20 (?, ?)', state: 'pending' }
            ],
            callStack: ['isValidBST(10, -Inf, +Inf)', 'isValidBST(15, 10, +Inf)'],
            annotation: 'Moving into 10.right tightens low to 10: interval (10, +Inf).'
          },
          choices: [
            {
              id: 'tr1_c1_ok',
              label: 'low = 10, high = +Infinity (because every node in 10.right must be > 10)',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Moving into `node.right` updates the lower bound `low` to `node.val` (`10`).'
            },
            {
              id: 'tr1_c1_bad',
              label: 'low = -Infinity, high = 10',
              isCorrect: false,
              misconceptionFeedback: '`(-Infinity, 10)` was the interval for the LEFT subtree `10.left`.'
            }
          ],
          correctExplanation: 'Right child `15` inherits `(10, +Infinity)` and satisfies `10 < 15 < +Infinity`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'From `node = 15` (with `low = 10, high = +Inf`), we recurse into its left child `15.left = 6` (line 7). What interval `(low, high)` is passed to `node = 6`?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n10', label: '10 (-Inf, +Inf)', state: 'visited' },
              { id: 'n5', label: '5 (-Inf, 10)', state: 'valid' },
              { id: 'n15', label: '15 (10, +Inf)', state: 'visited' },
              { id: 'n6', label: '6 (10, 15)', state: 'active' },
              { id: 'n20', label: '20', state: 'pending' }
            ],
            callStack: ['isValidBST(10, -Inf, +Inf)', 'isValidBST(15, 10, +Inf)', 'isValidBST(6, 10, 15)'],
            annotation: 'Moving left from 15 tightens high to 15 while keeping low = 10 -> interval (10, 15).'
          },
          choices: [
            {
              id: 'tr1_c2_ok',
              label: 'low = 10, high = 15: inherited floor 10 from root and ceiling 15 from parent',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! `15.left` must be both `> 10` (right of 10) and `< 15` (left of 15).'
            },
            {
              id: 'tr1_c2_bad',
              label: 'low = -Infinity, high = 15',
              isCorrect: false,
              misconceptionFeedback: 'Never discard the inherited `low = 10` bound when moving left!'
            }
          ],
          correctExplanation: 'Line 7 passes `(low, node.val)` which is `(10, 15)`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 3,
          prompt: 'Inside `isValidBST(6, 10, 15)`, what does line 3 (`node.val <= low || node.val >= high`) evaluate?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n10', label: '10', state: 'visited' },
              { id: 'n5', label: '5', state: 'valid' },
              { id: 'n15', label: '15', state: 'visited' },
              { id: 'n6', label: '6 <= 10 (INVALID!)', state: 'error' },
              { id: 'n20', label: '20 (skipped)', state: 'pending' }
            ],
            callStack: ['isValidBST(6, 10, 15) -> false'],
            annotation: '6 <= low (10) is true -> returns false immediately!'
          },
          choices: [
            {
              id: 'tr1_c3_ok',
              label: '6 <= 10 is true, so line 4 returns false and short-circuits the entire BST check to false',
              isCorrect: true,
              misconceptionFeedback: 'Exact! The ancestor bound `low = 10` catches the invalid grandchild `6` immediately.'
            },
            {
              id: 'tr1_c3_bad',
              label: 'Returns true because 6 < 15',
              isCorrect: false,
              misconceptionFeedback: 'While `6 < 15`, `6 <= low (10)` triggers the first half of `node.val <= low || node.val >= high`.'
            }
          ],
          correctExplanation: '`6 <= 10` violates the lower bound inherited from root `10`, returning `false`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'duplicate_key',
      label: 'Duplicate Value Rejection ([5, 5])',
      inputLabel: 'root = 5, left = 5',
      edgeCaseNote: 'Strict BST definition requires `left < node < right`, rejecting duplicate keys.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Root `5` passes `(-Inf, +Inf)` and calls `isValidBST(node.left, -Inf, 5)` on left child `5`. What happens at line 3?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n5_root', label: '5 (-Inf, +Inf)', state: 'visited' },
              { id: 'n5_left', label: '5 (-Inf, 5)', state: 'error' }
            ],
            callStack: ['isValidBST(5, -Inf, +Inf)', 'isValidBST(5, -Inf, 5)'],
            annotation: 'node.val (5) >= high (5) is true -> returns false.'
          },
          choices: [
            {
              id: 'tr1_alt1_ok',
              label: 'node.val >= high (5 >= 5) is true, so it returns false',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Using `>= high` and `<= low` enforces strict inequality `<` and `>`.'
            },
            {
              id: 'tr1_alt1_bad',
              label: 'Returns true because 5 <= 5',
              isCorrect: false,
              misconceptionFeedback: 'Standard BST validation requires strictly smaller keys on the left (`< 5`).'
            }
          ],
          correctExplanation: '`5 >= 5` triggers line 3 and returns `false`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 9,
          prompt: 'After `isValidBST(node.left, -Inf, 5)` returns `false`, what does the root call return?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n5_root', label: '5 -> false', state: 'error' },
              { id: 'n5_left', label: '5 -> false', state: 'error' }
            ],
            callStack: ['isValidBST(5, -Inf, +Inf) -> false'],
            annotation: 'Short-circuit && returns false.'
          },
          choices: [
            {
              id: 'tr1_alt2_ok',
              label: 'Short-circuits the && expression and returns false',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Once the left subtree fails, the right subtree is not even visited.'
            },
            {
              id: 'tr1_alt2_bad',
              label: 'Returns true if the right child is valid',
              isCorrect: false,
              misconceptionFeedback: 'Both subtrees must be valid (`&&`).'
            }
          ],
          correctExplanation: '`false && ...` short-circuits to `false`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'Why does an in-order traversal (`left`, `node`, `right`) that verifies `node.val > prevVal` also catch the `[10, 5, 15, null, null, 6, 20]` bug?',
      choices: [
        {
          id: 'ec_tr1_ok',
          label: 'Because in-order traversal visits `10` immediately before `15`’s left child `6`, and `6 > 10` is false (`prevVal = 10, node.val = 6`).',
          isCorrect: true,
          misconceptionFeedback: 'Correct! A binary tree is a valid BST if and only if its in-order traversal sequence is strictly increasing.'
        },
        {
          id: 'ec_tr1_bad',
          label: 'Because in-order traversal visits nodes from bottom to top.',
          isCorrect: false,
          misconceptionFeedback: 'Post-order visits bottom-to-top; in-order visits `left -> root -> right` in sorted key order.'
        }
      ],
      explanation: 'In-order traversal visits `10` right before the leftmost node of `10.right` (`6`), directly testing the `10 < 6` lower bound.'
    },
    referenceInvariant: 'Every node u in the tree satisfies low(u) < u.val < high(u), where low(u) is the largest ancestor of u that has u in its right subtree and high(u) is the smallest ancestor of u that has u in its left subtree.',
    hintText: 'When stepping into `node.left`, tighten `high = node.val`; when stepping into `node.right`, tighten `low = node.val`.',
    reflectionPrompt: 'When is top-down parameter passing (`low, high`) cleaner than bottom-up return tuples (`min, max, isValid`)?',
    sourceId: 'src_opendsa_mit',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 14: BFS LEVEL ORDER SNAPSHOT ====================
  {
    id: 'ex_trees_02',
    topicId: 'topic_trees',
    lessonId: 'les_trees_04',
    title: 'Trace: BFS Level-Order Queue Snapshot (`levelSize`)',
    rendererType: 'tree_traversal_state',
    objective: 'Trace how snapshotting `levelSize = queue.length - head` separates depth levels cleanly while children are enqueued.',
    instructions: 'Follow `queue`, `head`, `levelSize`, and `currentLevel` across each depth wave.',
    codeLines: [
      'export function levelOrder(root) {',
      '  if (!root) return [];',
      '  const levels = [], queue = [root];',
      '  let head = 0;',
      '  while (head < queue.length) {',
      '    const levelSize = queue.length - head;',
      '    const currentLevel = [];',
      '    for (let i = 0; i < levelSize; i += 1) {',
      '      const node = queue[head++];',
      '      currentLevel.push(node.val);',
      '      if (node.left) queue.push(node.left);',
      '      if (node.right) queue.push(node.right);',
      '    }',
      '    levels.push(currentLevel);',
      '  }',
      '  return levels;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Three-Level Binary Tree (3 -> 9, 20 -> 15, 7)',
      inputLabel: 'root = 3, 3.left = 9, 3.right = 20 (20.left = 15, 20.right = 7)',
      edgeCaseNote: 'Watch `levelSize` freeze the count of depth `d` nodes before depth `d + 1` children are pushed.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 6,
          prompt: 'Wave 0 begins with `queue = [3]`, `head = 0`. `levelSize = 1`. After dequeuing `3` and pushing `9` and `20`, what are `currentLevel`, `head`, and `queue`?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n3', label: '3 (depth 0)', state: 'visited' },
              { id: 'n9', label: '9 (enqueued)', state: 'active' },
              { id: 'n20', label: '20 (enqueued)', state: 'active' },
              { id: 'n15', label: '15', state: 'pending' },
              { id: 'n7', label: '7', state: 'pending' }
            ],
            stackOrQueue: ['9 (depth 1)', '20 (depth 1)'],
            annotation: 'Wave 0 finished: levels = [[3]], head = 1, active queue slice = [9, 20].'
          },
          choices: [
            {
              id: 'tr2_c1_ok',
              label: 'currentLevel = [3], head = 1, and active queue slice is [9, 20] (depth 1)',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Because `levelSize` was frozen at `1`, pushing `9` and `20` did not cause the `for` loop to dequeue them during Wave 0.'
            },
            {
              id: 'tr2_c1_bad',
              label: 'currentLevel = [3, 9, 20] because 9 and 20 were pushed into queue',
              isCorrect: false,
              misconceptionFeedback: 'The `for` loop ran `i < levelSize` (`1`), stopping after node `3`.'
            }
          ],
          correctExplanation: 'Wave 0 pushes `[3]` to `levels` and leaves `[9, 20]` in the queue for Wave 1.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 8,
          prompt: 'Wave 1 begins with active queue `[9, 20]` (`queue.length = 3, head = 1`). What is `levelSize`, and what happens as `9` and `20` are dequeued?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n3', label: '3', state: 'visited' },
              { id: 'n9', label: '9 (depth 1)', state: 'visited' },
              { id: 'n20', label: '20 (depth 1)', state: 'visited' },
              { id: 'n15', label: '15 (enqueued)', state: 'active' },
              { id: 'n7', label: '7 (enqueued)', state: 'active' }
            ],
            stackOrQueue: ['15 (depth 2)', '7 (depth 2)'],
            annotation: 'levelSize = 2: dequeues 9 and 20, enqueues 20’s children 15 and 7.'
          },
          choices: [
            {
              id: 'tr2_c2_ok',
              label: 'levelSize = 2; dequeues 9 (leaf) and 20 (pushes 15, 7), recording currentLevel = [9, 20]',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Depth 1 is cleanly grouped as `[9, 20]`, while depth 2 (`[15, 7]`) waits at the back.'
            },
            {
              id: 'tr2_c2_bad',
              label: 'levelSize = 3; dequeues 9, 20, and 15 into currentLevel',
              isCorrect: false,
              misconceptionFeedback: '`queue.length - head` is `3 - 1 = 2`, not `3`!'
            }
          ],
          correctExplanation: '`levelSize = 2` processes `9` and `20` and enqueues `15` and `7`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 16,
          prompt: 'Wave 2 processes `[15, 7]` (`levelSize = 2`), neither of which has children. What is returned at line 16?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n3', label: '3 (d=0)', state: 'visited' },
              { id: 'n9', label: '9 (d=1)', state: 'visited' },
              { id: 'n20', label: '20 (d=1)', state: 'visited' },
              { id: 'n15', label: '15 (d=2)', state: 'visited' },
              { id: 'n7', label: '7 (d=2)', state: 'visited' }
            ],
            stackOrQueue: [],
            annotation: 'Queue exhausted (head === queue.length === 5).'
          },
          choices: [
            {
              id: 'tr2_c3_ok',
              label: 'Returns [[3], [9, 20], [15, 7]]',
              isCorrect: true,
              misconceptionFeedback: 'Exact match! Each subarray corresponds to one depth level from left to right.'
            },
            {
              id: 'tr2_c3_bad',
              label: 'Returns [3, 9, 20, 15, 7]',
              isCorrect: false,
              misconceptionFeedback: 'Each wave pushes a 1D `currentLevel` array into `levels`, producing a 2D array.'
            }
          ],
          correctExplanation: 'Three depth waves produce `[[3], [9, 20], [15, 7]]`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'right_side_view_hidden_left',
      label: 'Right Side View with Deeper Left Branch',
      inputLabel: 'root = 1, 1.left = 2 (2.left = 4), 1.right = 3 (leaf)',
      edgeCaseNote: 'At depth 2, only node `4` (in the left subtree!) exists, so `4` IS visible from the right side.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 14,
          prompt: 'After Wave 0 (`[1]`) and Wave 1 (`[2, 3]`), `2` pushed its left child `4`, while `3` had no children. What is in the queue at the start of Wave 2?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n1', label: '1 (d=0, rightmost)', state: 'visited' },
              { id: 'n2', label: '2 (d=1)', state: 'visited' },
              { id: 'n3', label: '3 (d=1, rightmost)', state: 'visited' },
              { id: 'n4', label: '4 (d=2, only node!)', state: 'active' }
            ],
            stackOrQueue: ['4 (depth 2)'],
            annotation: 'Wave 2 has levelSize = 1 containing node 4 from the left subtree.'
          },
          choices: [
            {
              id: 'tr2_alt1_ok',
              label: 'Only node 4 (levelSize = 1), because node 3 was a leaf',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Level-order BFS visits all branches at depth 2, even when `root.right` ended early at depth 1.'
            },
            {
              id: 'tr2_alt1_bad',
              label: 'Queue is empty because node 3 had no right child',
              isCorrect: false,
              misconceptionFeedback: 'Node 2’s child `4` was enqueued during Wave 1!'
            }
          ],
          correctExplanation: 'Node `4` is the sole node in Wave 2.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 16,
          prompt: 'If we take the last element of each level (`level[level.length - 1]`) for Binary Tree Right Side View, what is returned for this tree?',
          stateSnapshot: {
            treeNodes: [
              { id: 'n1', label: '1 (visible d=0)', state: 'valid' },
              { id: 'n2', label: '2 (occluded by 3)', state: 'visited' },
              { id: 'n3', label: '3 (visible d=1)', state: 'valid' },
              { id: 'n4', label: '4 (visible d=2)', state: 'valid' }
            ],
            stackOrQueue: [],
            annotation: 'Levels are [[1], [2, 3], [4]] -> last of each level is [1, 3, 4].'
          },
          choices: [
            {
              id: 'tr2_alt2_ok',
              label: 'Returns [1, 3, 4], proving why walking only root.right ([1, 3]) is wrong',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! At depth 2, node `3` has ended, so node `4` in the left subtree is unobstructed from the right.'
            },
            {
              id: 'tr2_alt2_bad',
              label: 'Returns [1, 3] because 4 is a left child',
              isCorrect: false,
              misconceptionFeedback: 'Right Side View asks for the rightmost node at EVERY depth level, even if it is a left child.'
            }
          ],
          correctExplanation: 'Taking the last node of each BFS level (`[[1], [2, 3], [4]]`) yields `[1, 3, 4]`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What should `levelOrder(null)` return on an empty tree, and why does `const queue = [root]` without `if (!root) return []` fail?',
      choices: [
        {
          id: 'ec_tr2_ok',
          label: 'It must return `[]`; without the guard, `queue = [null]` has `queue.length === 1`, enters the loop, and throws a TypeError reading `node.val` on `null`.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! `[null]` is a 1-element array, not an empty queue.'
        },
        {
          id: 'ec_tr2_bad',
          label: 'It returns `[[]]` (an array containing one empty level).',
          isCorrect: false,
          misconceptionFeedback: 'An empty tree has 0 levels, so it must return `[]`, not `[[]]`.'
        }
      ],
      explanation: 'Guard `if (!root) return []` before seeding `const queue = [root]`.'
    },
    referenceInvariant: 'At the start of outer iteration d, queue[head..queue.length-1] contains all nodes at depth d ordered left-to-right.',
    hintText: 'Freeze `levelSize = queue.length - head` at the top of the `while` loop so newly pushed children wait for the next wave.',
    reflectionPrompt: 'How would you solve Right Side View using DFS (`right` child before `left` child) by comparing `depth === result.length`?',
    sourceId: 'src_opendsa_mit',
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 15: BOUNDED MIN-HEAP TOP-K BOUNCER ====================
  {
    id: 'ex_heaps_01',
    topicId: 'topic_heaps',
    lessonId: 'les_heaps_02',
    title: 'Trace: Size-K Min-Heap Bouncer for K-th Largest Element',
    rendererType: 'tree_traversal_state',
    objective: 'Trace how a Min-Heap of capacity `k = 3` filters a stream so `minHeap[0]` always exposes the 3rd largest element.',
    instructions: 'At each stream arrival `x`, compare `x` against `minHeap[0]` (the bouncer at the root of the size-3 min-heap).',
    codeLines: [
      'export function addStreamValue(minHeap, k, x) {',
      '  if (minHeap.length < k) {',
      '    pushMinHeap(minHeap, x);',
      '  } else if (x > minHeap[0]) {',
      '    popMinHeap(minHeap);',
      '    pushMinHeap(minHeap, x);',
      '  }',
      '  return minHeap[0];',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Streaming Additions into Capacity k = 3 Min-Heap',
      inputLabel: 'Initial minHeap = [4, 5, 8] (k = 3); stream: add(3), add(5), add(10)',
      edgeCaseNote: 'The min-heap root `minHeap[0]` is the smallest of the top 3, which is the 3rd largest overall.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 4,
          prompt: 'Start with `minHeap = [4, 5, 8]` (`k = 3`, root `minHeap[0] = 4`). First call: `add(3)`. Since `minHeap.length === 3`, what happens at line 4 (`x > minHeap[0]`)?',
          stateSnapshot: {
            treeNodes: [
              { id: 'h0', label: 'root: 4 (3rd largest)', state: 'active' },
              { id: 'h1', label: 'left: 5', state: 'valid' },
              { id: 'h2', label: 'right: 8', state: 'valid' }
            ],
            stackOrQueue: ['stream x = 3 (rejected: 3 <= 4)'],
            annotation: 'x = 3 is not > minHeap[0] (4), so heap is unchanged and returns 4.'
          },
          choices: [
            {
              id: 'hp1_c1_ok',
              label: '3 > 4 is false: 3 is ignored, minHeap stays [4, 5, 8], and 4 is returned in O(1)',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Because 3 is smaller than all 3 elements in the heap, it cannot be in the top 3.'
            },
            {
              id: 'hp1_c1_bad',
              label: '3 is pushed into minHeap, making root minHeap[0] = 3',
              isCorrect: false,
              misconceptionFeedback: 'Pushing `3` would grow the heap to size 4 and make `minHeap[0]` the 4th largest instead of the 3rd largest!'
            }
          ],
          correctExplanation: '`3 <= 4` is rejected at the door; `minHeap[0] = 4` remains the 3rd largest.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 5,
          prompt: 'Second call: `add(5)` on `minHeap = [4, 5, 8]`. Since `5 > minHeap[0] (4)`, what updates?',
          stateSnapshot: {
            treeNodes: [
              { id: 'h0', label: 'root: 5 (new 3rd largest)', state: 'active' },
              { id: 'h1', label: 'left: 5', state: 'valid' },
              { id: 'h2', label: 'right: 8', state: 'valid' }
            ],
            stackOrQueue: ['evicted: 4', 'inserted: 5'],
            annotation: '5 > 4 -> pop 4, push 5 -> minHeap holds [5, 5, 8], root is 5.'
          },
          choices: [
            {
              id: 'hp1_c2_ok',
              label: '4 is popped, 5 is pushed, minHeap becomes [5, 5, 8], and new root 5 is returned',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! The top 3 seen so far are now `8, 5, 5`, so the 3rd largest is `5`.'
            },
            {
              id: 'hp1_c2_bad',
              label: '5 is ignored because 5 is already in the heap',
              isCorrect: false,
              misconceptionFeedback: 'K-th largest counts duplicate values (sorted order `8, 5, 5, 4, 3` has `5` at index 2).'
            }
          ],
          correctExplanation: 'Evicting `4` and inserting `5` updates the top-3 multiset to `[5, 5, 8]` with root `5`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 8,
          prompt: 'Third call: `add(10)` on `minHeap = [5, 5, 8]`. Since `10 > 5`, one `5` is popped and `10` is pushed. What is the new heap and returned 3rd largest?',
          stateSnapshot: {
            treeNodes: [
              { id: 'h0', label: 'root: 5 (still 3rd largest!)', state: 'active' },
              { id: 'h1', label: 'left: 8', state: 'valid' },
              { id: 'h2', label: 'right: 10', state: 'valid' }
            ],
            stackOrQueue: ['evicted: 5', 'inserted: 10'],
            annotation: 'Top 3 are now [5, 8, 10]; smallest of top 3 is still 5!'
          },
          choices: [
            {
              id: 'hp1_c3_ok',
              label: 'minHeap holds [5, 8, 10] and returns root 5 (since the top 3 are 10, 8, 5)',
              isCorrect: true,
              misconceptionFeedback: 'Exact! Because there were two `5`s, evicting one `5` leaves the second `5` as the new minimum of `[5, 8, 10]`.'
            },
            {
              id: 'hp1_c3_bad',
              label: 'Returns 8 because 10 was added',
              isCorrect: false,
              misconceptionFeedback: 'The top 3 elements are `10, 8, 5`, so the 3rd largest is `5` (`8` is the 2nd largest).'
            }
          ],
          correctExplanation: 'The top 3 elements are `{5, 8, 10}`, so `minHeap[0]` is `5`.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'underfull_initial_heap',
      label: 'Underfull Initial Heap (len = k - 1)',
      inputLabel: 'Initial minHeap = [7] (k = 2); stream: add(3), add(9)',
      edgeCaseNote: 'Verifies that when `minHeap.length < k`, even a smaller number is pushed to reach size `k`.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 2,
          prompt: 'Start with `minHeap = [7]` and `k = 2` (`minHeap.length = 1 < 2`). Call `add(3)`. Which branch executes?',
          stateSnapshot: {
            treeNodes: [
              { id: 'h0', label: 'root: 3', state: 'active' },
              { id: 'h1', label: 'left: 7', state: 'valid' }
            ],
            stackOrQueue: ['minHeap.length (1) < k (2) -> push 3'],
            annotation: 'Heap was underfull (size 1 < 2), so 3 is pushed without eviction -> [3, 7], returns 3.'
          },
          choices: [
            {
              id: 'hp1_alt1_ok',
              label: 'Line 2 (minHeap.length < k) is true: 3 is pushed without popping, giving [3, 7] and returning root 3',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Until the heap holds `k` elements, every element is in the top `k`.'
            },
            {
              id: 'hp1_alt1_bad',
              label: '3 is rejected because 3 < 7',
              isCorrect: false,
              misconceptionFeedback: 'With only `[7]` and `3` seen so far, `3` IS the 2nd largest element!'
            }
          ],
          correctExplanation: 'Pushing `3` fills the heap to capacity `k = 2` (`[3, 7]`), returning `3`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 5,
          prompt: 'Next call: `add(9)` on `minHeap = [3, 7]` (`k = 2`). What happens?',
          stateSnapshot: {
            treeNodes: [
              { id: 'h0', label: 'root: 7', state: 'active' },
              { id: 'h1', label: 'left: 9', state: 'valid' }
            ],
            stackOrQueue: ['9 > 3 -> pop 3, push 9'],
            annotation: 'minHeap becomes [7, 9] and returns 7.'
          },
          choices: [
            {
              id: 'hp1_alt2_ok',
              label: '9 > 3 pops 3 and pushes 9, updating minHeap to [7, 9] and returning 7',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Among `{3, 7, 9}`, the 2nd largest is `7`.'
            },
            {
              id: 'hp1_alt2_bad',
              label: 'Returns 9',
              isCorrect: false,
              misconceptionFeedback: '`9` is the 1st largest; the min-heap root `minHeap[0] = 7` is the 2nd largest.'
            }
          ],
          correctExplanation: '`minHeap` holds `[7, 9]` with root `7`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'When `k` is very small compared to `n` (e.g., `k = 5, n = 1,000,000`), how does a size-`k` Min-Heap compare to sorting the array?',
      choices: [
        {
          id: 'ec_hp1_ok',
          label: 'The size-k Min-Heap takes O(n log k) time and O(k) space (where log_2(5) ≈ 2.3), whereas sorting takes O(n log n) time (log_2(10^6) ≈ 20) and mutates or copies all n elements.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! And if `x <= minHeap[0]` (which happens most of the time), the check is `O(1)` without even touching the heap!'
        },
        {
          id: 'ec_hp1_bad',
          label: 'Sorting is faster because heaps require O(n^2) pointers.',
          isCorrect: false,
          misconceptionFeedback: 'A size-`k` array heap uses `k` numbers with zero pointers.'
        }
      ],
      explanation: 'A bounded heap of size `k` uses `O(k)` memory and performs `O(log k)` work only when a candidate beats the current `k`-th largest.'
    },
    referenceInvariant: 'After processing m >= k stream items, minHeap has length k, holds the k largest items seen so far, and minHeap[0] is the k-th largest item.',
    hintText: 'First check `minHeap.length < k`; if full, only replace `minHeap[0]` when `x > minHeap[0]`.',
    reflectionPrompt: 'In `Furthest Building You Can Reach`, how does a size-`L` Min-Heap of ladder climbs automatically assign ladders to the `L` largest climbs seen so far?',
    sourceId: 'src_tih_mit',
    packId: 'pack_expansion_batch2_v1',
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
    packId: 'pack_expansion_batch2_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  };
}

export const EXPANSION_BATCH_2_PRACTICE = [
  // ==================== STACKS & QUEUES (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_stacks_queues_01',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_01'],
    title: 'Valid Parentheses',
    externalSlug: 'valid-parentheses',
    pattern: 'LIFO Delimiter Matching Stack',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Direct application of Lesson 1’s opener stack and final `stack.length === 0` invariant.',
    keyEdgeCase: 'Unclosed openers `"((("` or leading closer `")("`.'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_02',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_01'],
    title: 'Min Stack',
    externalSlug: 'min-stack',
    pattern: 'Paired `(val, prefixMin)` Stack Frame Snapshot',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Practices snapshotting prefix minimums per stack frame so `getMin()` and `pop()` are O(1).',
    keyEdgeCase: 'Duplicate minimum values pushed and popped sequentially (`push(-2), push(-2), pop(), getMin()`).'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_03',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_01'],
    title: 'Evaluate Reverse Polish Notation',
    externalSlug: 'evaluate-reverse-polish-notation',
    pattern: 'Postfix Operand Evaluation Stack',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Reinforces popping `rightOperand` FIRST and `leftOperand` SECOND on non-commutative `/` and `-`.',
    keyEdgeCase: 'Integer division truncation toward zero in JS (`Math.trunc(a / b)`, NOT `Math.floor(-6 / 132)`!).'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_04',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_02'],
    title: 'Daily Temperatures',
    externalSlug: 'daily-temperatures',
    pattern: 'Monotonic Decreasing Stack of Waiting Indices',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'The canonical benchmark for Lesson 2 and Exercise 12.',
    keyEdgeCase: 'Equal temperatures `[70, 70, 72]` must wait for strictly warmer `>`.'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_05',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_02'],
    title: 'Next Greater Element I',
    externalSlug: 'next-greater-element-i',
    pattern: 'Monotonic Decreasing Stack + Next-Greater Hash Map',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Combines a monotonic decreasing stack over `nums2` with a `Map` to answer subset queries from `nums1` in O(1).',
    keyEdgeCase: 'Elements in `nums2` that never see a greater element default to `-1`.'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_06',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_02'],
    title: 'Car Fleet',
    externalSlug: 'car-fleet',
    pattern: 'Right-to-Left Arrival-Time Monotonic Stack (`time = (target - pos) / speed`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Shows how sorting cars by starting position descending and tracking arrival time `(target - pos) / speed` collapses catching-up cars.',
    keyEdgeCase: 'Floating-point arrival time comparison (`curTime <= fleetLeadTime` merges into the ahead fleet).'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_07',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_03'],
    title: 'Largest Rectangle in Histogram',
    externalSlug: 'largest-rectangle-in-histogram',
    pattern: 'Monotonic Increasing Stack with Left & Right Span Boundaries',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    whyRecommended: 'Direct implementation of Lesson 3’s `width = i - leftBound - 1` span invariant and `0`-height sentinel flush.',
    keyEdgeCase: 'Strictly increasing bars `[2, 4, 6]` where all bars are flushed at `i === heights.length`.'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_08',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_04'],
    title: 'Sliding Window Maximum',
    externalSlug: 'sliding-window-maximum',
    pattern: 'Monotonic Decreasing Index Deque',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    whyRecommended: 'Directly applies Lesson 4’s monotonic deque with `head` index expiration.',
    keyEdgeCase: '`k = 1` and strictly decreasing arrays where front expiration `deque[head] <= i - k` does all the work.'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_09',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_01', 'les_stacks_queues_03'],
    title: 'Decode String',
    externalSlug: 'decode-string',
    pattern: 'Nested Context Stack `(prevString, repeatCount)`',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Practices pushing `(currentStr, currentNum)` on `[` and popping/repeating on `]`.',
    keyEdgeCase: 'Multi-digit repeat counts (`"100[a]"`) and deeply nested brackets (`"3[a2[c]]"`).'
  }),
  createPracticeItem({
    id: 'prac_stacks_queues_10',
    topicId: 'topic_stacks_queues',
    lessonIds: ['les_stacks_queues_02'],
    title: 'Asteroid Collision',
    externalSlug: 'asteroid-collision',
    pattern: 'Directional Collision Stack (`stack.top > 0 && cur < 0`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Tests a `while` collision loop where a left-moving asteroid (`< 0`) can destroy multiple smaller right-moving (`> 0`) stack tops, tie-annihilate, or be destroyed itself.',
    keyEdgeCase: 'Left-moving asteroids followed by right-moving ones (`[-2, -1, 1, 2]`) NEVER collide because they move apart!'
  }),

  // ==================== TREES (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_trees_01',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_01'],
    title: 'Invert Binary Tree',
    externalSlug: 'invert-binary-tree',
    pattern: 'Recursive Subtree Swap ([left, right] = [invert(right), invert(left)])',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Clean warm-up for recursive tree mutation and base-case `null` handling.',
    keyEdgeCase: 'Node with only one child (`left !== null, right === null`) must move that child to the opposite side.'
  }),
  createPracticeItem({
    id: 'prac_trees_02',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_01'],
    title: 'Maximum Depth of Binary Tree',
    externalSlug: 'maximum-depth-of-binary-tree',
    pattern: 'Post-Order Height Aggregation (`1 + Math.max(left, right)`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'The simplest bottom-up post-order recurrence.',
    keyEdgeCase: '`root = null` returning `0`.'
  }),
  createPracticeItem({
    id: 'prac_trees_03',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_01'],
    title: 'Diameter of Binary Tree',
    externalSlug: 'diameter-of-binary-tree',
    pattern: 'Post-Order Height Return + `leftH + rightH` Turning-Point Maximization',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    whyRecommended: 'Direct application of Lesson 1’s distinction between path turning at `node` vs branch ascending to parent.',
    keyEdgeCase: 'Longest path does not pass through the global `root`.'
  }),
  createPracticeItem({
    id: 'prac_trees_04',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_01'],
    title: 'Balanced Binary Tree',
    externalSlug: 'balanced-binary-tree',
    pattern: 'Bottom-Up Post-Order Height with `-1` Unbalanced Sentinel',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    whyRecommended: 'Proves how returning `-1` on `Math.abs(leftH - rightH) > 1` avoids `O(n^2)` top-down height re-computation.',
    keyEdgeCase: 'Tree where the root’s left and right subtrees have equal max height, but an internal subtree is unbalanced.'
  }),
  createPracticeItem({
    id: 'prac_trees_05',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_02'],
    title: 'Same Tree',
    externalSlug: 'same-tree',
    pattern: 'Lockstep Structural & Value Recursion (`!p && !q`, `!p || !q`)',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Builds the lockstep two-tree comparison pattern (`isSameTree(p, q)`).',
    keyEdgeCase: 'Same values in different child positions (`[1, 2]` vs `[1, null, 2]`).'
  }),
  createPracticeItem({
    id: 'prac_trees_06',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_02'],
    title: 'Subtree of Another Tree',
    externalSlug: 'subtree-of-another-tree',
    pattern: 'Outer Tree Walk + Inner `isSameTree` Verification',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    whyRecommended: 'Composes `isSameTree` across every candidate root in `root`.',
    keyEdgeCase: '`root` contains a matching top pattern that has extra deeper descendants not present in `subRoot`.'
  }),
  createPracticeItem({
    id: 'prac_trees_07',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_03'],
    title: 'Lowest Common Ancestor of a Binary Search Tree',
    externalSlug: 'lowest-common-ancestor-of-a-binary-search-tree',
    pattern: 'Iterative O(h) BST Split-Point Walk',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies Lesson 3’s `O(h)` time, `O(1)` space BST split-point proof.',
    keyEdgeCase: 'One target node is the direct parent/ancestor of the other (`LCA(2, 4) = 2`).'
  }),
  createPracticeItem({
    id: 'prac_trees_08',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_04'],
    title: 'Binary Tree Level Order Traversal',
    externalSlug: 'binary-tree-level-order-traversal',
    pattern: 'BFS Queue with `levelSize` Wave Snapshot',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Direct implementation of Lesson 4 and Exercise 14.',
    keyEdgeCase: '`root = null` returning `[]`.'
  }),
  createPracticeItem({
    id: 'prac_trees_09',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_04'],
    title: 'Binary Tree Right Side View',
    externalSlug: 'binary-tree-right-side-view',
    pattern: 'BFS Level Snapshot Picking `i === levelSize - 1`',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Demonstrates why level-order BFS beats walking `node.right` when a left subtree extends deeper than the right subtree.',
    keyEdgeCase: 'Left subtree is deeper than right subtree (`[1, 2, 3, 4]` -> `[1, 3, 4]`).'
  }),
  createPracticeItem({
    id: 'prac_trees_10',
    topicId: 'topic_trees',
    lessonIds: ['les_trees_02'],
    title: 'Validate Binary Search Tree',
    externalSlug: 'validate-binary-search-tree',
    pattern: 'Top-Down Ancestor Range Propagation `(low, high)`',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'The signature benchmark for Lesson 2 and Exercise 13.',
    keyEdgeCase: 'Grandchild violating root bound (`[5, 4, 6, null, null, 3, 7]`) and duplicate values `[2, 2, 2]`.'
  }),

  // ==================== HEAPS (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_heaps_01',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_02'],
    title: 'Kth Largest Element in a Stream',
    externalSlug: 'kth-largest-element-in-a-stream',
    pattern: 'Bounded Min-Heap of Size K',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies Lesson 2 and Exercise 15.',
    keyEdgeCase: 'Initial `nums` array has length `k - 1` before the first `add(val)` call.'
  }),
  createPracticeItem({
    id: 'prac_heaps_02',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_01'],
    title: 'Last Stone Weight',
    externalSlug: 'last-stone-weight',
    pattern: 'Repeated Two-Max Pop & Difference Re-Insert on Max-Heap',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Clean drill for `popMax` twice and `pushMax(y - x)` when `y > x`.',
    keyEdgeCase: 'All stones annihilate completely (`[2, 2]`), requiring `0` to be returned when the heap is empty.'
  }),
  createPracticeItem({
    id: 'prac_heaps_03',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_02'],
    title: 'K Closest Points to Origin',
    externalSlug: 'k-closest-points-to-origin',
    pattern: 'Bounded Max-Heap of Size K by Squared Euclidean Distance (`x^2 + y^2`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Tests flipping to a Max-Heap of size `k` when keeping the `k` SMALLEST distances (and avoiding `Math.sqrt` via `x*x + y*y`).',
    keyEdgeCase: 'Tied distances and negative coordinates.'
  }),
  createPracticeItem({
    id: 'prac_heaps_04',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_02'],
    title: 'Kth Largest Element in an Array',
    externalSlug: 'kth-largest-element-in-an-array',
    pattern: 'Size-K Min-Heap (`O(n log k)`) or 3-Way Quickselect',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Compares `O(n log k)` bounded Min-Heap against `O(n)` average 3-way Quickselect.',
    keyEdgeCase: 'Heavy duplicate runs (where 2-way Quickselect degrades to `O(n^2)` but size-`k` Min-Heap stays `O(n log k)`).'
  }),
  createPracticeItem({
    id: 'prac_heaps_05',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_01'],
    title: 'Task Scheduler',
    externalSlug: 'task-scheduler',
    pattern: 'Max-Heap of Remaining Frequencies + Cooldown Queue `(remainingCount, readyTime)`',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Coordinates a Max-Heap (always schedule most frequent available task) with a FIFO cooldown queue.',
    keyEdgeCase: 'Heap becomes temporarily empty while tasks are still waiting in the cooldown queue (idle CPU cycles).'
  }),
  createPracticeItem({
    id: 'prac_heaps_06',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_04'],
    title: 'Find Median from Data Stream',
    externalSlug: 'find-median-from-data-stream',
    pattern: 'Dual-Heap Partition (`maxLow` Max-Heap + `minHigh` Min-Heap)',
    difficulty: 'Hard',
    estimatedMinutes: 30,
    whyRecommended: 'Direct implementation of Lesson 4’s order and size balancing invariants.',
    keyEdgeCase: 'Negative numbers and alternating odd/even stream lengths.'
  }),
  createPracticeItem({
    id: 'prac_heaps_07',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_03'],
    title: 'Merge k Sorted Lists',
    externalSlug: 'merge-k-sorted-lists',
    pattern: 'Frontier Min-Heap of Size `<= k`',
    difficulty: 'Hard',
    estimatedMinutes: 25,
    whyRecommended: 'Direct benchmark for Lesson 3’s `O(N log k)` frontier merge.',
    keyEdgeCase: '`lists = []` or `lists = [null, null]`.'
  }),
  createPracticeItem({
    id: 'prac_heaps_08',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_01'],
    title: 'Reorganize String',
    externalSlug: 'reorganize-string',
    pattern: 'Greedy Max-Heap with 1-Step Holdback (`prevChar`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Pops the most frequent character, appends it, and holds it outside the heap for 1 step so the same character is never placed adjacently.',
    keyEdgeCase: 'Max frequency `> Math.ceil(s.length / 2)` makes reorganization impossible (`return ""`).'
  }),
  createPracticeItem({
    id: 'prac_heaps_09',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_03'],
    title: 'Kth Smallest Element in a Sorted Matrix',
    externalSlug: 'kth-smallest-element-in-a-sorted-matrix',
    pattern: 'K-Way Row Frontier Min-Heap `(val, r, c)`',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Treats the first column of up to `min(n, k)` rows as `k` sorted streams and pops `k` times.',
    keyEdgeCase: '`k = 1` or `k = n * n`.'
  }),
  createPracticeItem({
    id: 'prac_heaps_10',
    topicId: 'topic_heaps',
    lessonIds: ['les_heaps_02'],
    title: 'Furthest Building You Can Reach',
    externalSlug: 'furthest-building-you-can-reach',
    pattern: 'Size-`L` Min-Heap of Ladder Climbs + Brick Deduction on Eviction',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Brilliant application of Lesson 2’s size-`k` Min-Heap: use ladders for the first `L` climbs, and whenever a new climb arrives, pay bricks for the SMALLEST climb `popMin(ladderClimbs)`!',
    keyEdgeCase: 'Downhill or flat steps (`heights[i + 1] <= heights[i]`) require 0 bricks and 0 ladders.'
  })
];
