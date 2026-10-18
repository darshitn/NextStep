import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAuthoritativeCurriculum } from '../src/services/curriculumRegistry.js';

describe('Trace Content & Algorithmic Verification Suite', () => {
  const curriculum = getAuthoritativeCurriculum();
  const exercises = curriculum.exercises;

  // -------------------------------------------------------------
  // Reference Algorithm Implementations for Executable Verification
  // -------------------------------------------------------------

  // 1. Best Time to Buy and Sell Stock
  function runStockProfit(prices) {
    let minPrice = prices[0];
    let bestGain = 0;
    const history = [];
    for (let i = 1; i < prices.length; i++) {
      const candidateGain = prices[i] - minPrice;
      if (candidateGain > bestGain) bestGain = candidateGain;
      if (prices[i] < minPrice) minPrice = prices[i];
      history.push({ i, price: prices[i], candidateGain, minPrice, bestGain });
    }
    return { bestGain, history };
  }

  // 2. Product of Array Except Self
  function runProductExceptSelf(nums) {
    const n = nums.length;
    const out = new Array(n).fill(1);
    const pass1 = [];
    let prefix = 1;
    for (let i = 0; i < n; i++) {
      out[i] = prefix;
      pass1.push({ i, prefixWritten: prefix, outSoFar: [...out] });
      prefix *= nums[i];
    }
    const pass2 = [];
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
      out[i] *= suffix;
      pass2.push({ i, suffixUsed: suffix, finalAtI: out[i] });
      suffix *= nums[i];
    }
    return { out, pass1, pass2 };
  }

  // 3. Two Sum (Hash Map complement)
  function runTwoSum(nums, target) {
    const map = new Map();
    const steps = [];
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (map.has(complement)) {
        steps.push({ i, num: nums[i], complement, found: true, pair: [map.get(complement), i], mapSnapshot: new Map(map) });
        return { pair: [map.get(complement), i], steps };
      }
      map.set(nums[i], i);
      steps.push({ i, num: nums[i], complement, found: false, mapSnapshot: new Map(map) });
    }
    return { pair: null, steps };
  }

  // 4. Subarray Sum Equals K
  function runSubarraySum(nums, k) {
    let count = 0;
    let sum = 0;
    const map = new Map([[0, 1]]);
    const steps = [];
    for (let i = 0; i < nums.length; i++) {
      sum += nums[i];
      const needed = sum - k;
      const added = map.get(needed) || 0;
      count += added;
      map.set(sum, (map.get(sum) || 0) + 1);
      steps.push({ i, num: nums[i], sum, needed, added, count, mapSnapshot: new Map(map) });
    }
    return { count, steps };
  }

  // 5. Binary Search (First Position / Lower Bound)
  function runBinarySearchFirst(nums, target) {
    let low = 0;
    let high = nums.length;
    const steps = [];
    while (low < high) {
      const mid = Math.floor(low + (high - low) / 2);
      steps.push({ low, high, mid, val: nums[mid] });
      if (nums[mid] >= target) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return { index: low, steps };
  }

  // 6. Find Minimum in Rotated Sorted Array
  function runFindMinRotated(nums) {
    let low = 0;
    let high = nums.length - 1;
    const steps = [];
    while (low < high) {
      const mid = Math.floor(low + (high - low) / 2);
      steps.push({ low, high, mid, val: nums[mid], highVal: nums[high] });
      if (nums[mid] > nums[high]) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return { minIndex: low, minVal: nums[low], steps };
  }

  // 7. Two Sum II (Sorted Array Pointers)
  function runTwoSumSorted(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    const steps = [];
    while (left < right) {
      const sum = nums[left] + nums[right];
      steps.push({ left, right, sum });
      if (sum === target) return { pair: [left, right], steps };
      if (sum < target) left++;
      else right--;
    }
    return { pair: null, steps };
  }

  // 8. Container With Most Water
  function runContainerWater(heights) {
    let left = 0;
    let right = heights.length - 1;
    let maxArea = 0;
    const steps = [];
    while (left < right) {
      const width = right - left;
      const h = Math.min(heights[left], heights[right]);
      const area = width * h;
      if (area > maxArea) maxArea = area;
      steps.push({ left, right, width, h, area, maxArea });
      if (heights[left] <= heights[right]) left++;
      else right--;
    }
    return { maxArea, steps };
  }

  // 9. Longest Substring Without Repeating Characters
  function runLongestSubstringNoRepeat(s) {
    const map = new Map();
    let left = 0;
    let maxLen = 0;
    const steps = [];
    for (let right = 0; right < s.length; right++) {
      const ch = s[right];
      if (map.has(ch) && map.get(ch) >= left) {
        left = map.get(ch) + 1;
      }
      map.set(ch, right);
      const len = right - left + 1;
      if (len > maxLen) maxLen = len;
      steps.push({ left, right, ch, len, maxLen, mapSnapshot: new Map(map) });
    }
    return { maxLen, steps };
  }

  // 10. Longest Repeating Character Replacement
  function runCharacterReplacement(s, k) {
    const count = new Map();
    let left = 0;
    let maxFreq = 0;
    let maxLen = 0;
    const steps = [];
    for (let right = 0; right < s.length; right++) {
      const ch = s[right];
      count.set(ch, (count.get(ch) || 0) + 1);
      maxFreq = Math.max(maxFreq, count.get(ch));
      while (right - left + 1 - maxFreq > k) {
        count.set(s[left], count.get(s[left]) - 1);
        left++;
      }
      const len = right - left + 1;
      maxLen = Math.max(maxLen, len);
      steps.push({ left, right, maxFreq, len, maxLen });
    }
    return { maxLen, steps };
  }

  // 11. Reverse Linked List
  function runReverseLinkedList(arr) {
    let prev = null;
    let curr = 0;
    const steps = [];
    while (curr < arr.length) {
      const next = curr + 1 < arr.length ? curr + 1 : null;
      steps.push({ prev, curr: arr[curr], next: next !== null ? arr[next] : null });
      prev = arr[curr];
      curr++;
    }
    return { steps };
  }

  // 12. Daily Temperatures (Monotonic Stack)
  function runDailyTemperatures(temps) {
    const n = temps.length;
    const res = new Array(n).fill(0);
    const stack = [];
    const steps = [];
    for (let i = 0; i < n; i++) {
      const pops = [];
      while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
        const prevIdx = stack.pop();
        res[prevIdx] = i - prevIdx;
        pops.push({ prevIdx, diff: res[prevIdx] });
      }
      stack.push(i);
      steps.push({ i, temp: temps[i], pops, stackState: [...stack], resState: [...res] });
    }
    return { res, steps };
  }

  // 13. Validate BST
  function runValidateBST(val, low, high) {
    const isValid = (low === null || val > low) && (high === null || val < high);
    return { isValid, val, low, high };
  }

  // 14. Binary Tree Level Order Traversal (BFS)
  function runLevelOrderBFS(levels) {
    const res = [];
    for (const lvl of levels) {
      res.push([...lvl]);
    }
    return { res };
  }

  // 15. Kth Largest in Stream
  function runKthLargestStream(k, nums, additions) {
    const heap = [...nums].sort((a, b) => a - b);
    const steps = [];
    for (const val of additions) {
      if (heap.length < k) {
        heap.push(val);
        heap.sort((a, b) => a - b);
      } else if (val > heap[0]) {
        heap[0] = val;
        heap.sort((a, b) => a - b);
      }
      steps.push({ added: val, kthLargest: heap[0], heapState: [...heap] });
    }
    return { steps };
  }

  // 16. Course Schedule (Kahn's Topological Sort)
  function runCourseSchedule(n, edges) {
    const indeg = new Array(n).fill(0);
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      indeg[v]++;
    }
    const queue = [];
    for (let i = 0; i < n; i++) {
      if (indeg[i] === 0) queue.push(i);
    }
    const order = [];
    const steps = [];
    while (queue.length > 0) {
      const u = queue.shift();
      order.push(u);
      const relaxed = [];
      for (const v of adj[u]) {
        indeg[v]--;
        if (indeg[v] === 0) {
          queue.push(v);
          relaxed.push(v);
        }
      }
      steps.push({ u, orderSoFar: [...order], relaxed, indegState: [...indeg], queueState: [...queue] });
    }
    return { isPossible: order.length === n, order, steps };
  }

  // 17. Subsets II with Duplicates
  function runSubsetsWithDup(nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const res = [];
    const path = [];
    const steps = [];
    function dfs(start) {
      res.push([...path]);
      for (let i = start; i < sorted.length; i++) {
        const isPruned = i > start && sorted[i] === sorted[i - 1];
        steps.push({ start, i, num: sorted[i], path: [...path], isPruned });
        if (isPruned) continue;
        path.push(sorted[i]);
        dfs(i + 1);
        path.pop();
      }
    }
    dfs(0);
    return { res, steps };
  }

  // 18. Coin Change (Fewest Coins DP)
  function runCoinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const steps = [];
    for (let a = 1; a <= amount; a++) {
      const transitions = [];
      for (const c of coins) {
        if (a - c >= 0 && dp[a - c] !== Infinity) {
          const candidate = 1 + dp[a - c];
          transitions.push({ c, candidate });
          if (candidate < dp[a]) dp[a] = candidate;
        }
      }
      steps.push({ a, dpAtA: dp[a], transitions, dpTable: [...dp] });
    }
    return { ans: dp[amount] === Infinity ? -1 : dp[amount], dp, steps };
  }

  // -------------------------------------------------------------
  // Deep Algorithmic State & Choice Verification Functions
  // -------------------------------------------------------------

  function verifyExDynamicProgramming01(ex) {
    const pSim = runCoinChange([1, 3, 4], 6);
    assert.equal(pSim.ans, 2, 'Coin Change min coins for [1,3,4] amount 6 must be 2');

    // Primary Step 0: a = 3, testing coin 3
    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.a, 3, 'Step 0 pointer a must be 3');
    assert.equal(s0.stateSnapshot.pointers.c, 3, 'Step 0 pointer c must be 3');
    assert.equal(s0.stateSnapshot.dpTable[0], 0, 'dpTable[0] must be 0');
    assert.equal(s0.stateSnapshot.dpTable[1], 1, 'dpTable[1] must be 1');
    assert.equal(s0.stateSnapshot.dpTable[2], 2, 'dpTable[2] must be 2');
    assert.equal(s0.stateSnapshot.dpTable[3], 1, 'dpTable[3] must be 1 (computed from 1 + dp[0])');
    assert.equal(s0.stateSnapshot.dpTable[4], 'Inf', 'dpTable[4] must not be computed yet');
    assert.equal(s0.stateSnapshot.dpTable[5], 'Inf', 'dpTable[5] must not be computed yet');
    assert.equal(s0.stateSnapshot.dpTable[6], 'Inf', 'dpTable[6] must not be computed yet');
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0, 'Step 0 must have a correct choice');
    assert.ok(
      c0.label.includes('1 + dp[0] = 1') && c0.label.includes('dp[0]'),
      `Step 0 correct choice label must state structured transition "1 + dp[0] = 1", got: "${c0.label}"`
    );

    // Primary Step 1: a = 5
    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.a, 5);
    assert.equal(s1.stateSnapshot.dpTable[4], 1);
    assert.equal(s1.stateSnapshot.dpTable[5], 2);
    assert.equal(s1.stateSnapshot.dpTable[6], 'Inf');
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1, 'Step 1 must have a correct choice');
    assert.ok(
      c1.label.includes('1 + dp[4] = 2') && c1.label.includes('dp[5] = 2'),
      `Step 1 correct choice label must state structured calculation "1 + dp[4] = 2" and "dp[5] = 2", got: "${c1.label}"`
    );

    // Primary Step 2: a = 6
    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.a, 6);
    assert.equal(s2.stateSnapshot.pointers.bestCoin, 3);
    assert.equal(s2.stateSnapshot.dpTable[6], 2);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2, 'Step 2 must have a correct choice');
    assert.ok(
      c2.label.includes('dp[3] = 1') && c2.label.includes('2 coins'),
      `Step 2 correct choice label must explain dp[3]=1 transition to 2 coins, got: "${c2.label}"`
    );

    // Alternate: coins = [2], amount = 3
    const aSim = runCoinChange([2], 3);
    assert.equal(aSim.ans, -1);
    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    assert.ok(alt, 'Alternate variant must exist');

    const as0 = alt.steps[0];
    assert.equal(as0.stateSnapshot.pointers.a, 3);
    assert.equal(as0.stateSnapshot.pointers.c, 2);
    assert.equal(as0.stateSnapshot.dpTable[2], 1);
    assert.equal(as0.stateSnapshot.dpTable[3], 'Inf');
    const ac0 = as0.choices.find((c) => c.isCorrect);
    assert.ok(ac0.label.includes('1 + dp[1]') && ac0.label.includes('Infinity'));

    const as1 = alt.steps[1];
    assert.equal(as1.stateSnapshot.pointers.returnVal, -1);
    const ac1 = as1.choices.find((c) => c.isCorrect);
    assert.ok(ac1.label.includes('-1'));
  }

  function verifyExArrays01(ex) {
    const pSim = runStockProfit([7, 2, 6, 1, 5]);
    assert.equal(pSim.bestGain, 4);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.i, 1);
    assert.equal(s0.stateSnapshot.pointers.minIdx, 0);
    assert.equal(s0.stateSnapshot.array[s0.stateSnapshot.pointers.minIdx], 7);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('candidateGain is -5') && c0.label.includes('minPrice updates to 2'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.i, 2);
    assert.equal(s1.stateSnapshot.pointers.minIdx, 1);
    assert.equal(s1.stateSnapshot.array[s1.stateSnapshot.pointers.minIdx], 2);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('bestGain updates to 4') && c1.label.includes('minPrice remains 2'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.i, 3);
    assert.equal(s2.stateSnapshot.pointers.minIdx, 1);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('minPrice drops to 1') && c2.label.includes('bestGain stays 4'));

    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    const aSim = runStockProfit([9, 6, 4, 1]);
    assert.equal(aSim.bestGain, 0);
    const ac1 = alt.steps[1].choices.find((c) => c.isCorrect);
    assert.ok(ac1.label.includes('0, because every valid pair') && ac1.label.includes('negative delta'));
  }

  function verifyExArrays02(ex) {
    const pSim = runProductExceptSelf([2, 0, 3]);
    assert.deepEqual(pSim.out, [0, 6, 0]);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.i, 1);
    assert.equal(s0.stateSnapshot.pointers.prefix, 2);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('out[1] receives 2') && c0.label.includes('prefix becomes 2 * 0 = 0'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.i, 1);
    assert.equal(s1.stateSnapshot.pointers.suffix, 3);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('out[1] becomes 2 * 3 = 6'));

    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    const aSim = runProductExceptSelf([0, 4, 0]);
    assert.deepEqual(aSim.out, [0, 0, 0]);
  }

  function verifyExHashing01(ex) {
    const pSim = runTwoSum([3, 2, 4, 3], 6);
    assert.deepEqual(pSim.pair, [1, 2]);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.i, 0);
    assert.equal(s0.stateSnapshot.pointers.need, 3);
    assert.equal(s0.stateSnapshot.mapEntries.length, 0);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('has(3) is false') || c0.label.includes('empty'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.i, 2);
    assert.equal(s1.stateSnapshot.pointers.need, 2);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('[1, 2]'));

    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    const ac0 = alt.steps[0].choices.find((c) => c.isCorrect);
    assert.ok(ac0.label.includes('[0, 1]'));
  }

  function verifyExHashing02(ex) {
    const pSim = runSubarraySum([1, -1, 1], 1);
    assert.equal(pSim.count, 3);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.runningSum, 1);
    assert.equal(s0.stateSnapshot.pointers.neededPrefix, 0);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('totalMatches increases by 1') && c0.label.includes('{0: 1, 1: 1}'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.runningSum, 1);
    assert.equal(s2.stateSnapshot.pointers.neededPrefix, 0);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('increases by 2 (to 3 total)'));
  }

  function verifyExBinarySearch01(ex) {
    const pSim = runBinarySearchFirst([2, 4, 4, 4, 8, 10], 4);
    assert.equal(pSim.index, 1);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.lo, 0);
    assert.equal(s0.stateSnapshot.pointers.hi, 6);
    assert.equal(s0.stateSnapshot.pointers.mid, 3);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('hi = 3'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.lo, 0);
    assert.equal(s1.stateSnapshot.pointers.hi, 3);
    assert.equal(s1.stateSnapshot.pointers.mid, 1);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('hi = 1') || c1.label.includes('hi moves to 1'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.lo, 0);
    assert.equal(s2.stateSnapshot.pointers.hi, 1);
    assert.equal(s2.stateSnapshot.pointers.mid, 0);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('lo becomes mid + 1 = 1') && c2.label.includes('returns 1'));

    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    const ac1 = alt.steps[1].choices.find((c) => c.isCorrect);
    assert.ok(ac1.label.includes('lo becomes 3') && c2.label.includes('1'));
  }

  function verifyExBinarySearch02(ex) {
    const pSim = runFindMinRotated([4, 5, 6, 7, 0, 1, 2]);
    assert.equal(pSim.minIndex, 4);
    assert.equal(pSim.minVal, 0);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.lo, 0);
    assert.equal(s0.stateSnapshot.pointers.hi, 6);
    assert.equal(s0.stateSnapshot.pointers.mid, 3);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('lo = mid + 1 = 4'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.lo, 4);
    assert.equal(s1.stateSnapshot.pointers.hi, 6);
    assert.equal(s1.stateSnapshot.pointers.mid, 5);

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.lo, 4);
    assert.equal(s2.stateSnapshot.pointers.hi, 5);
    assert.equal(s2.stateSnapshot.pointers.mid, 4);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('hi becomes mid = 4') && c2.label.includes('0 is returned'));
  }

  function verifyExTwoPointers01(ex) {
    const pSim = runTwoSumSorted([2, 4, 6, 9, 13], 13);
    assert.deepEqual(pSim.pair, [1, 3]);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.left, 0);
    assert.equal(s0.stateSnapshot.pointers.right, 4);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('Decrement right to 3') && c0.label.includes('13'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.left, 0);
    assert.equal(s1.stateSnapshot.pointers.right, 3);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('Increment left to 1'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.left, 1);
    assert.equal(s2.stateSnapshot.pointers.right, 3);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('immediately return [1, 3]'));
  }

  function verifyExTwoPointers02(ex) {
    const pSim = runContainerWater([2, 8, 5, 7, 3]);
    assert.equal(pSim.maxArea, 14);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.left, 0);
    assert.equal(s0.stateSnapshot.pointers.right, 4);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('best becomes 8') && c0.label.includes('left increments to 1'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.left, 1);
    assert.equal(s1.stateSnapshot.pointers.right, 4);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('best updates to 9') && c1.label.includes('right decrements to 3'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.left, 1);
    assert.equal(s2.stateSnapshot.pointers.right, 3);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('best to 14') && c2.label.includes('right decrements to 2'));

    // Check alternate variant
    const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
    assert.ok(alt && alt.steps.length >= 2);
    assert.equal(alt.steps[0].stateSnapshot.pointers.left, 0);
    assert.equal(alt.steps[0].stateSnapshot.pointers.right, 5);
  }

  function verifyExSlidingWindow01(ex) {
    const pSim = runLongestSubstringNoRepeat('abba');
    assert.equal(pSim.maxLen, 2);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.left, 0);
    assert.equal(s0.stateSnapshot.pointers.right, 1);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('left = 0') && c0.label.includes('best = 2'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.left, 2);
    assert.equal(s1.stateSnapshot.pointers.right, 2);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('left jumps to 2') && c1.label.includes('len 1'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.left, 2);
    assert.equal(s2.stateSnapshot.pointers.right, 3);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('left stays 2') && c2.label.includes('best = 2 is returned'));
  }

  function verifyExSlidingWindow02(ex) {
    const pSim = runCharacterReplacement('AABAB', 1);
    assert.equal(pSim.maxLen, 4);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.left, 0);
    assert.equal(s0.stateSnapshot.pointers.right, 2);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('3 - 2 = 1 <= 1') && c0.label.includes('best becomes 3'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.left, 0);
    assert.equal(s1.stateSnapshot.pointers.right, 3);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('maxFreq updates to 3') && c1.label.includes('best updates to 4'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.left, 1);
    assert.equal(s2.stateSnapshot.pointers.right, 4);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('left advances to 1') && c2.label.includes('best remains 4'));
  }

  function verifyExLinkedLists01(ex) {
    const pSim = runReverseLinkedList([10, 20, 30]);
    assert.equal(pSim.steps.length, 3);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.prev, '10');
    assert.equal(s0.stateSnapshot.pointers.curr, '20');
    assert.equal(s0.stateSnapshot.pointers.nextTemp, '20');
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('10.next becomes null') && c0.label.includes('curr becomes 20'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.prev, '20');
    assert.equal(s1.stateSnapshot.pointers.curr, '30');
    assert.equal(s1.stateSnapshot.pointers.nextTemp, '30');
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('20.next flips to 10') && c1.label.includes('curr advances to 30'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.prev, '30');
    assert.equal(s2.stateSnapshot.pointers.curr, 'null');
    assert.equal(s2.stateSnapshot.pointers.nextTemp, 'null');
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('30.next flips to 20') && c2.label.includes('prev becomes 30'));
  }

  function verifyExStacksQueues01(ex) {
    const pSim = runDailyTemperatures([75, 71, 69, 72]);
    assert.deepEqual(pSim.res, [0, 2, 1, 0]);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.i, 2);
    assert.deepEqual(s0.stateSnapshot.stackOrQueue, ['idx 0 (75)', 'idx 1 (71)', 'idx 2 (69)']);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('stack = [0, 1, 2]') && c0.label.includes('ans = [0, 0, 0, 0]'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.i, 3);
    assert.deepEqual(s1.stateSnapshot.stackOrQueue, ['idx 0 (75)', 'idx 3 (72)']);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('Pops index 2') && c1.label.includes('ans[1] = 2'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.i, 3);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('Returns [0, 2, 1, 0]'));
  }

  function verifyExTrees01(ex) {
    const s0 = ex.primaryVariant.steps[0];
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('low = 10') && c0.label.includes('+Infinity'));

    const s1 = ex.primaryVariant.steps[1];
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('low = 10, high = 15'));

    const s2 = ex.primaryVariant.steps[2];
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('6 <= 10') && c2.label.includes('false'));
  }

  function verifyExTrees02(ex) {
    const s0 = ex.primaryVariant.steps[0];
    assert.deepEqual(s0.stateSnapshot.stackOrQueue, ['9 (depth 1)', '20 (depth 1)']);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('currentLevel = [3]') && c0.label.includes('[9, 20]'));

    const s1 = ex.primaryVariant.steps[1];
    assert.deepEqual(s1.stateSnapshot.stackOrQueue, ['15 (depth 2)', '7 (depth 2)']);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('levelSize = 2') && c1.label.includes('currentLevel = [9, 20]'));

    const s2 = ex.primaryVariant.steps[2];
    assert.deepEqual(s2.stateSnapshot.stackOrQueue, []);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('Returns [[3], [9, 20], [15, 7]]'));
  }

  function verifyExHeaps01(ex) {
    const pSim = runKthLargestStream(3, [4, 5, 8], [3, 5, 10]);
    assert.equal(pSim.steps[0].kthLargest, 4);
    assert.equal(pSim.steps[1].kthLargest, 5);
    assert.equal(pSim.steps[2].kthLargest, 5);

    const s0 = ex.primaryVariant.steps[0];
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('3 > 4 is false') && c0.label.includes('4 is returned'));

    const s1 = ex.primaryVariant.steps[1];
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('[5, 5, 8]') && c1.label.includes('root 5 is returned'));

    const s2 = ex.primaryVariant.steps[2];
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('[5, 8, 10]') && c2.label.includes('root 5'));
  }

  function verifyExGraphs01(ex) {
    const pSim = runCourseSchedule(4, [[0, 1], [0, 2], [1, 3], [2, 3]]);
    assert.equal(pSim.isPossible, true);
    assert.deepEqual(pSim.order, [0, 1, 2, 3]);

    const s0 = ex.primaryVariant.steps[0];
    assert.deepEqual(s0.stateSnapshot.stackOrQueue, ['1 (ready)', '2 (ready)']);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('indeg[1]') && c0.label.includes('queue = [1, 2]'));

    const s1 = ex.primaryVariant.steps[1];
    assert.deepEqual(s1.stateSnapshot.stackOrQueue, ['2 (ready)']);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('indeg[3] from 2 to 1 (!== 0)'));

    const s2 = ex.primaryVariant.steps[2];
    assert.deepEqual(s2.stateSnapshot.stackOrQueue, []);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('4 === 4') && c2.label.includes('every vertex reached indegree 0'));
  }

  function verifyExRecursionBacktracking01(ex) {
    const pSim = runSubsetsWithDup([1, 2, 2]);
    assert.equal(pSim.res.length, 6);

    const s0 = ex.primaryVariant.steps[0];
    assert.equal(s0.stateSnapshot.pointers.start, 2);
    assert.equal(s0.stateSnapshot.pointers.i, 2);
    const c0 = s0.choices.find((c) => c.isCorrect);
    assert.ok(c0.label.includes('i === start') && c0.label.includes('[1, 2, 2]'));

    const s1 = ex.primaryVariant.steps[1];
    assert.equal(s1.stateSnapshot.pointers.start, 1);
    assert.equal(s1.stateSnapshot.pointers.i, 2);
    const c1 = s1.choices.find((c) => c.isCorrect);
    assert.ok(c1.label.includes('2 > 1') && c1.label.includes('continue'));

    const s2 = ex.primaryVariant.steps[2];
    assert.equal(s2.stateSnapshot.pointers.start, 0);
    assert.equal(s2.stateSnapshot.pointers.i, 2);
    const c2 = s2.choices.find((c) => c.isCorrect);
    assert.ok(c2.label.includes('2 > 0') && c2.label.includes('all 6 unique subsets'));
  }

  // -------------------------------------------------------------
  // Test 1: Structural Integrity (All 18 exercises)
  // -------------------------------------------------------------
  it('verifies all 18 exercises have valid primary & alternate trace variants and single correct choices', () => {
    assert.equal(exercises.length, 18);
    for (const ex of exercises) {
      assert.ok(ex.primaryVariant.steps.length >= 2);
      for (const step of ex.primaryVariant.steps) {
        const correct = step.choices.filter((c) => c.isCorrect);
        assert.equal(correct.length, 1, `${ex.id} step ${step.stepIndex} must have 1 correct choice`);
      }
      const alt = ex.alternateVariants?.[0] || ex.alternateVariant;
      if (alt) {
        assert.ok(alt.steps.length >= 2);
        for (const step of alt.steps) {
          const correct = step.choices.filter((c) => c.isCorrect);
          assert.equal(correct.length, 1, `${ex.id} alt step ${step.stepIndex} must have 1 correct choice`);
        }
      }
    }
  });

  // -------------------------------------------------------------
  // Tests 2-19: Executable Algorithm Verification for All 18 Exercises
  // -------------------------------------------------------------

  it('[1/18] ex_arrays_01: Best Time to Buy and Sell Stock (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_arrays_01');
    assert.ok(ex);
    verifyExArrays01(ex);
  });

  it('[2/18] ex_arrays_02: Product of Array Except Self (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_arrays_02');
    assert.ok(ex);
    verifyExArrays02(ex);
  });

  it('[3/18] ex_hashing_01: Two Sum Hash Map (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_hashing_01');
    assert.ok(ex);
    verifyExHashing01(ex);
  });

  it('[4/18] ex_hashing_02: Subarray Sum Equals K (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_hashing_02');
    assert.ok(ex);
    verifyExHashing02(ex);
  });

  it('[5/18] ex_binary_search_01: First Position Lower Bound (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_binary_search_01');
    assert.ok(ex);
    verifyExBinarySearch01(ex);
  });

  it('[6/18] ex_binary_search_02: Search in Rotated Sorted Array (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_binary_search_02');
    assert.ok(ex);
    verifyExBinarySearch02(ex);
  });

  it('[7/18] ex_two_pointers_01: Two Sum II Sorted Array (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_two_pointers_01');
    assert.ok(ex);
    verifyExTwoPointers01(ex);
  });

  it('[8/18] ex_two_pointers_02: Container With Most Water (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_two_pointers_02');
    assert.ok(ex);
    verifyExTwoPointers02(ex);
  });

  it('[9/18] ex_sliding_window_01: Longest Substring Without Repeating Characters (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_sliding_window_01');
    assert.ok(ex);
    verifyExSlidingWindow01(ex);
  });

  it('[10/18] ex_sliding_window_02: Longest Repeating Character Replacement (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_sliding_window_02');
    assert.ok(ex);
    verifyExSlidingWindow02(ex);
  });

  it('[11/18] ex_linked_lists_01: Reverse Linked List (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_linked_lists_01');
    assert.ok(ex);
    verifyExLinkedLists01(ex);
  });

  it('[12/18] ex_stacks_queues_01: Daily Temperatures Monotonic Stack (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_stacks_queues_01');
    assert.ok(ex);
    verifyExStacksQueues01(ex);
  });

  it('[13/18] ex_trees_01: Validate BST Range Invariant (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_trees_01');
    assert.ok(ex);
    verifyExTrees01(ex);
  });

  it('[14/18] ex_trees_02: Binary Tree Level Order Traversal (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_trees_02');
    assert.ok(ex);
    verifyExTrees02(ex);
  });

  it('[15/18] ex_heaps_01: Kth Largest Element in a Stream (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_heaps_01');
    assert.ok(ex);
    verifyExHeaps01(ex);
  });

  it('[16/18] ex_graphs_01: Course Schedule Kahn Topological Sort (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_graphs_01');
    assert.ok(ex);
    verifyExGraphs01(ex);
  });

  it('[17/18] ex_recursion_backtracking_01: Subsets II Duplicate Pruning (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_recursion_backtracking_01');
    assert.ok(ex);
    verifyExRecursionBacktracking01(ex);
  });

  it('[18/18] ex_dynamic_programming_01: Coin Change Fewest Coins (Primary & Alternate)', () => {
    const ex = exercises.find((e) => e.id === 'ex_dynamic_programming_01');
    assert.ok(ex);
    verifyExDynamicProgramming01(ex);
  });

  // -------------------------------------------------------------
  // Mutation Checks: Proving Corrupted Authored States are Rejected
  // -------------------------------------------------------------

  describe('Mutation Checks — Corrupted Authored States Must Be Rejected', () => {
    it('rejects corrupted dpTable[3] in ex_dynamic_programming_01 (independent review reproduction)', () => {
      const ex = exercises.find((e) => e.id === 'ex_dynamic_programming_01');
      assert.ok(ex);

      // Deep clone exercise
      const mutated = JSON.parse(JSON.stringify(ex));
      // Reproduce the exact review corruption: change dpTable[3] from 1 to 999999
      mutated.primaryVariant.steps[0].stateSnapshot.dpTable[3] = 999999;

      assert.throws(
        () => verifyExDynamicProgramming01(mutated),
        (err) => {
          assert.match(err.message, /dpTable\[3\]|999999|strictly equal/i);
          return true;
        },
        'Validator must catch corrupted dpTable[3] === 999999 and throw AssertionError'
      );
    });

    it('rejects corrupted choice label missing structured calculation in ex_dynamic_programming_01', () => {
      const ex = exercises.find((e) => e.id === 'ex_dynamic_programming_01');
      assert.ok(ex);

      const mutated = JSON.parse(JSON.stringify(ex));
      const correctChoice = mutated.primaryVariant.steps[0].choices.find((c) => c.isCorrect);
      correctChoice.label = 'Corrupted choice text without the mathematical transition';

      assert.throws(
        () => verifyExDynamicProgramming01(mutated),
        (err) => {
          assert.match(err.message, /Step 0 correct choice label must state structured transition/i);
          return true;
        },
        'Validator must catch corrupted choice label and throw AssertionError'
      );
    });

    it('rejects corrupted pointer minIdx in ex_arrays_01', () => {
      const ex = exercises.find((e) => e.id === 'ex_arrays_01');
      assert.ok(ex);

      const mutated = JSON.parse(JSON.stringify(ex));
      mutated.primaryVariant.steps[1].stateSnapshot.pointers.minIdx = 999999;

      assert.throws(
        () => verifyExArrays01(mutated),
        (err) => {
          assert.match(err.message, /999999|strictly equal/i);
          return true;
        },
        'Validator must catch corrupted minIdx pointer and throw AssertionError'
      );
    });

    it('rejects corrupted binary search mid pointer in ex_binary_search_01', () => {
      const ex = exercises.find((e) => e.id === 'ex_binary_search_01');
      assert.ok(ex);

      const mutated = JSON.parse(JSON.stringify(ex));
      mutated.primaryVariant.steps[0].stateSnapshot.pointers.mid = 999;

      assert.throws(
        () => verifyExBinarySearch01(mutated),
        (err) => {
          assert.match(err.message, /999|strictly equal/i);
          return true;
        },
        'Validator must catch corrupted binary search mid pointer and throw AssertionError'
      );
    });

    it('rejects corrupted alternate variant state in ex_dynamic_programming_01', () => {
      const ex = exercises.find((e) => e.id === 'ex_dynamic_programming_01');
      assert.ok(ex);

      const mutated = JSON.parse(JSON.stringify(ex));
      const alt = mutated.alternateVariants?.[0] || mutated.alternateVariant;
      alt.steps[0].stateSnapshot.dpTable[2] = 777;

      assert.throws(
        () => verifyExDynamicProgramming01(mutated),
        (err) => {
          assert.match(err.message, /777|strictly equal/i);
          return true;
        },
        'Validator must catch corrupted alternate variant dpTable and throw AssertionError'
      );
    });
  });
});
