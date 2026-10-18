const STANDARD_REVIEW_RECORD = {
  pipelineStagesCompleted: ['draft', 'source_check', 'technical_validation', 'editorial_review', 'published'],
  reviewerType: 'same_agent_automated_and_editorial_review',
  independentlyReviewed: false,
  verifiedAt: '2026-10-17',
  reviewNotes: 'Automated schema, deterministic state-trace, reference integrity, and editorial quality checks passed.'
};

export const EXPANSION_BATCH_3_PACK_METADATA = {
  id: 'pack_expansion_batch3_v1',
  version: '1.2.0',
  title: 'NextStep Expansion Pack 3: Graphs, Recursion & Backtracking, Dynamic Programming',
  releaseStage: 'expansion',
  publishedAt: '2026-10-17',
  topicIds: ['topic_graphs', 'topic_recursion_backtracking', 'topic_dynamic_programming'],
  reviewStatus: 'published'
};

export const EXPANSION_BATCH_3_TOPICS = [
  {
    id: 'topic_graphs',
    slug: 'graphs',
    title: 'Graphs, Traversals & Topological Sort',
    shortDescription: 'Model networks as adjacency lists or implicit grids, enforce cycle-safe visited invariants, and solve multi-source BFS, topological sort, and shortest-path problems.',
    whyItMatters: 'Graphs generalize trees by allowing cycles and multiple paths; mastering enqueue-time visited marking and Kahn indegree queues unlocks connected components, dependency scheduling, and network routing.',
    order: 10,
    lane: 5,
    estimatedMinutes: 105,
    prerequisites: ['topic_trees', 'topic_stacks_queues'],
    starterMissionIds: ['m10'],
    keyPatterns: ['Grid & Adjacency Flood-Fill', 'Multi-Source Level-Wave BFS', 'Kahn Zero-Indegree Topological Sort', 'Disjoint Set Union & Dijkstra Min-Heap'],
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_recursion_backtracking',
    slug: 'recursion-backtracking',
    title: 'Recursion & Backtracking Search Trees',
    shortDescription: 'Construct combinatorial subsets, permutations, and constraint solutions by choosing, exploring, and cleanly undoing state mutations along a decision tree.',
    whyItMatters: 'When no greedy or polynomial invariant exists, systematic state-space search with early sibling-duplicate and constraint pruning is the only exact way to enumerate valid configurations.',
    order: 11,
    lane: 5,
    estimatedMinutes: 100,
    prerequisites: ['topic_trees'],
    starterMissionIds: ['m11'],
    keyPatterns: ['Choose-Explore-Unchoose Path Discipline', 'Start-Index Combination vs Used-Mask Permutation', 'Sorted Multiset Sibling Pruning (i > start)', 'Reversible Grid & O(1) Constraint Set Pruning'],
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'topic_dynamic_programming',
    slug: 'dynamic-programming',
    title: 'Dynamic Programming & State Transitions',
    shortDescription: 'Transform exponential recursive search with overlapping subproblems into polynomial time by defining minimal state parameters, base cases, and topological recurrence transitions.',
    whyItMatters: 'Dynamic programming is the capstone synthesis of recursion and state tables—turning intractable sequence, knapsack, and grid optimization problems into fast, verifiable recurrences.',
    order: 12,
    lane: 6,
    estimatedMinutes: 115,
    prerequisites: ['topic_recursion_backtracking', 'topic_arrays'],
    starterMissionIds: ['m12'],
    keyPatterns: ['1D Rolling State Recurrence', 'Unbounded Forward vs 0/1 Backward Knapsack', 'Prefix Split-Point & Ending-At-Index DP', '2D Two-Sequence Alignment Matrix'],
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_3_PREREQUISITE_EDGES = [
  {
    fromTopicId: 'topic_trees',
    toTopicId: 'topic_graphs',
    rationale: 'Graphs generalize recursive tree DFS and level-order BFS by introducing explicit visited sets to handle cycles.'
  },
  {
    fromTopicId: 'topic_stacks_queues',
    toTopicId: 'topic_graphs',
    rationale: 'FIFO queues drive shortest-path BFS waves and Kahn topological sorting across graph frontiers.'
  },
  {
    fromTopicId: 'topic_trees',
    toTopicId: 'topic_recursion_backtracking',
    rationale: 'Backtracking traverses an implicit decision tree where each root-to-leaf path represents a candidate configuration.'
  },
  {
    fromTopicId: 'topic_recursion_backtracking',
    toTopicId: 'topic_dynamic_programming',
    rationale: 'Dynamic programming memoizes or tabulates recursive decision trees whose subproblems overlap.'
  },
  {
    fromTopicId: 'topic_arrays',
    toTopicId: 'topic_dynamic_programming',
    rationale: '1D and 2D arrays provide the contiguous state tables and rolling buffers used in bottom-up tabulation.'
  }
];

export const EXPANSION_BATCH_3_LESSONS = [
  // ==================== TOPIC 10: GRAPHS ====================
  {
    id: 'les_graphs_01',
    topicId: 'topic_graphs',
    order: 1,
    title: 'Graph Representations & Visited Set Discipline',
    estimatedMinutes: 20,
    prerequisites: ['les_trees_01'],
    measurableObjective: 'Convert edge lists or 2D grids into traversable adjacency models and enforce cycle-safe visited invariants in O(V + E) time.',
    explanation: 'Unlike trees, graphs can contain cycles and multiple paths between the same pair of vertices. Whether a graph is stored as an adjacency list `adj[u]` or implicitly as 4-directional grid neighbors, every traversal must track a `visited` set (or sink grid cells in-place) so each vertex is expanded at most once in `O(V + E)` time.',
    codeSnippet: {
      language: 'javascript',
      filename: 'numIslandsDfs.js',
      lines: [
        'export function numIslands(grid) {',
        '  let count = 0;',
        '  function sink(r, c) {',
        '    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== "1") return;',
        '    grid[r][c] = "0";',
        '    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);',
        '  }',
        '  for (let r = 0; r < grid.length; r += 1) {',
        '    for (let c = 0; c < grid[0].length; c += 1) {',
        '      if (grid[r][c] === "1") { count += 1; sink(r, c); }',
        '    }',
        '  }',
        '  return count;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'grid = [["1","1","0"], ["0","1","1"]]',
      stepByStep: [
        'Scan r = 0, c = 0 ("1"): increment count = 1 and launch sink(0, 0).',
        'sink marks (0, 0), (0, 1), (1, 1), and (1, 2) as "0" because they are 4-directionally connected.',
        'Outer nested loop sees only "0"s on remaining cells and returns count = 1.'
      ],
      outputDescription: '1 connected island component in O(R * C) time',
      invariantSummary: 'Every land cell in a discovered island is marked visited ("0") before the outer scan advances to its coordinates.'
    },
    pitfalls: [
      'Forgetting to add both `(u -> v)` and `(v -> u)` when building an adjacency list for an undirected graph.',
      'Checking `grid[r][c]` before verifying that `r` and `c` are within `[0, rows)` and `[0, cols)`.'
    ],
    edgeCase: {
      scenario: 'Cyclic graph in Clone Graph (`1 <-> 2`)',
      whyItBreaksNaiveCode: 'If you insert `map.set(node, clone)` AFTER recursing on `node.neighbors`, the cycle `1 -> 2 -> 1` recurses infinitely!',
      howToHandle: 'Always register `map.set(node, clone)` BEFORE iterating over `node.neighbors`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_graphs_01', 'prac_graphs_02', 'prac_graphs_03'],
    knowledgeCheck: {
      question: 'Why must you mark a node visited (or store its clone in the hash map) BEFORE recursing on its neighbors in a graph with cycles?',
      options: [
        {
          id: 'gr1_ok',
          label: 'Because a descendant neighbor on the active call stack may have an edge pointing back to the current node, which would cause infinite recursion if the node is not yet marked visited.',
          feedback: 'Correct! Pre-marking breaks cycles immediately when a back-edge is encountered.'
        },
        {
          id: 'gr1_bad1',
          label: 'To sort the neighbors in ascending order.',
          feedback: 'Marking visited does not change neighbor ordering.'
        },
        {
          id: 'gr1_bad2',
          label: 'Because leaf nodes have no incoming edges.',
          feedback: 'In an undirected graph, every edge is bidirectional.'
        }
      ],
      correctOptionId: 'gr1_ok',
      explanation: 'Pre-marking on entry ensures any back-edge to an ancestor on the call stack sees it as already visited.'
    },
    reflectionPrompt: 'When is a separate `visited` boolean matrix preferable to mutating `grid[r][c] = "0"` in-place?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA graph representation and traversal invariants.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_graphs_02',
    topicId: 'topic_graphs',
    order: 2,
    title: 'Multi-Source BFS & Unweighted Shortest Paths',
    estimatedMinutes: 20,
    prerequisites: ['les_graphs_01', 'les_trees_04'],
    measurableObjective: 'Seed a FIFO queue with multiple starting sources at distance 0 to compute minimum step distances across unweighted graphs.',
    explanation: 'Breadth-First Search expands vertices in non-decreasing order of edge distance. When multiple sources spread simultaneously (like rotting oranges or reverse ocean reachability from grid borders), pushing all initial sources into the queue at distance 0 lets a single BFS pass assign every reachable cell its minimum distance to the nearest source in `O(V + E)` time.',
    codeSnippet: {
      language: 'javascript',
      filename: 'orangesRottingBfs.js',
      lines: [
        'export function orangesRotting(grid) {',
        '  const q = []; let fresh = 0, minutes = 0, head = 0;',
        '  for (let r = 0; r < grid.length; r += 1) {',
        '    for (let c = 0; c < grid[0].length; c += 1) {',
        '      if (grid[r][c] === 2) q.push([r, c]);',
        '      else if (grid[r][c] === 1) fresh += 1;',
        '    }',
        '  }',
        '  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];',
        '  while (head < q.length && fresh > 0) {',
        '    const wave = q.length - head;',
        '    for (let i = 0; i < wave; i += 1) {',
        '      const [r, c] = q[head++];',
        '      for (const [dr, dc] of dirs) {',
        '        const nr = r + dr, nc = c + dc;',
        '        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] === 1) {',
        '          grid[nr][nc] = 2; fresh -= 1; q.push([nr, nc]);',
        '        }',
        '      }',
        '    }',
        '    minutes += 1;',
        '  }',
        '  return fresh === 0 ? minutes : -1;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: '1D row = [2, 1, 1, 2] (two rotten sources at ends, two fresh in middle)',
      stepByStep: [
        'Init: enqueue (0, 0) and (0, 3); fresh = 2, minutes = 0.',
        'Wave 1 (wave = 2): pop (0, 0) -> rots (0, 1), fresh = 1; pop (0, 3) -> rots (0, 2), fresh = 0. minutes = 1.',
        'Loop condition `fresh > 0` becomes false; return minutes = 1.'
      ],
      outputDescription: '1 minute (both sources expand in parallel during Wave 1)',
      invariantSummary: 'After m wave iterations, every cell at Manhattan distance <= m from any initial rotten source has been marked rotten (2).'
    },
    pitfalls: [
      'Marking a neighbor visited when popped rather than when enqueued (`grid[nr][nc] = 2` on push), which enqueues duplicate copies of the same cell.',
      'Continuing to increment `minutes` on the final empty-expansion wave when `fresh` is already `0`.'
    ],
    edgeCase: {
      scenario: 'Grid starts with `fresh === 0` (no fresh oranges at all)',
      whyItBreaksNaiveCode: 'If the `while` loop runs while `head < q.length` without checking `fresh > 0`, a grid `[2]` increments `minutes` to `1` instead of `0`!',
      howToHandle: 'Guard the outer loop with `while (head < q.length && fresh > 0)` so `0` is returned immediately when `fresh === 0`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_graphs_04', 'prac_graphs_05'],
    knowledgeCheck: {
      question: 'In BFS, why is it critical to mark a neighbor visited (`grid[nr][nc] = 2`) at the moment it is ENQUEUED rather than when it is DEQUEUED?',
      options: [
        {
          id: 'gr2_ok',
          label: 'Because multiple nodes in the current frontier wave may share the same unpopped neighbor and would push duplicate copies into the queue.',
          feedback: 'Correct! Enqueue-time marking guarantees each vertex enters the queue at most once.'
        },
        {
          id: 'gr2_bad1',
          label: 'Because dequeue-time marking turns BFS into DFS.',
          feedback: 'Queue order is still FIFO, but duplicate queue entries explode memory and runtime.'
        },
        {
          id: 'gr2_bad2',
          label: 'Because JavaScript arrays cannot store duplicate coordinates.',
          feedback: 'Arrays happily store duplicates, which is why duplicate enqueues cause TLE/MLE!'
        }
      ],
      correctOptionId: 'gr2_ok',
      explanation: 'Marking on enqueue ensures every vertex is pushed into the queue at most once.'
    },
    reflectionPrompt: 'In Pacific Atlantic Water Flow, why is starting two uphill traversals from the ocean borders (`O(R * C)`) dramatically faster than starting a downhill traversal from every cell (`O((R * C)^2)`)?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS Breadth-First Search shortest-path properties.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_graphs_03',
    topicId: 'topic_graphs',
    order: 3,
    title: 'Directed Cycle Detection & Topological Sort (Kahn Algorithm)',
    estimatedMinutes: 20,
    prerequisites: ['les_graphs_02'],
    measurableObjective: 'Order Directed Acyclic Graph (DAG) tasks by dependency and detect directed cycles using Kahn indegree queues.',
    explanation: 'In a dependency graph where directed edge `pre -> course` means `pre` must precede `course`, a topological ordering exists if and only if the directed graph has no cycles (is a DAG). Kahn’s algorithm computes `indegree[v]` for each vertex, seeds a FIFO queue with all vertices where `indegree[v] === 0`, and repeatedly pops `u`, appends `u` to `order`, and decrements `--indegree[v]` for each outgoing neighbor `v`. If `--indegree[v] === 0`, `v` has all prerequisites satisfied and enters the queue. If `order.length < numCourses` when the queue drains, a directed cycle locked the remaining vertices.',
    codeSnippet: {
      language: 'javascript',
      filename: 'kahnTopologicalSort.js',
      lines: [
        'export function findOrder(numCourses, prerequisites) {',
        '  const adj = Array.from({ length: numCourses }, () => []);',
        '  const indeg = new Array(numCourses).fill(0);',
        '  for (const [course, pre] of prerequisites) {',
        '    adj[pre].push(course);',
        '    indeg[course] += 1;',
        '  }',
        '  const queue = [], order = [];',
        '  for (let u = 0; u < numCourses; u += 1) if (indeg[u] === 0) queue.push(u);',
        '  let head = 0;',
        '  while (head < queue.length) {',
        '    const u = queue[head++];',
        '    order.push(u);',
        '    for (const v of adj[u]) {',
        '      if (--indeg[v] === 0) queue.push(v);',
        '    }',
        '  }',
        '  return order.length === numCourses ? order : [];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'numCourses = 4, prerequisites = [[1,0], [2,0], [3,1], [3,2]] (diamond DAG 0 -> 1,2 -> 3)',
      stepByStep: [
        'indeg = [0, 1, 1, 2]; queue = [0].',
        'Pop 0 -> order = [0]; decrement indeg[1] to 0 (push 1) and indeg[2] to 0 (push 2).',
        'Pop 1 -> order = [0, 1]; decrement indeg[3] from 2 to 1 (3 waits!).',
        'Pop 2 -> order = [0, 1, 2]; decrement indeg[3] from 1 to 0 (push 3). Pop 3 -> order = [0, 1, 2, 3].'
      ],
      outputDescription: '[0, 1, 2, 3] (valid topological schedule of all 4 courses)',
      invariantSummary: 'A vertex v is enqueued at the exact moment its final unresolved prerequisite u is popped (--indeg[v] === 0).'
    },
    pitfalls: [
      'Using a single boolean `visited` set in directed DFS to detect cycles—which falsely flags a harmless diamond DAG (`0 -> 1 -> 3` and `0 -> 2 -> 3`) as a cycle!',
      'Returning `order` without checking `order.length === numCourses` when a cycle prevents some vertices from ever reaching `indegree 0`.'
    ],
    edgeCase: {
      scenario: 'Disconnected 2-cycle (`0 <-> 1`) alongside an independent valid course `2` (`numCourses = 3`)',
      whyItBreaksNaiveCode: 'Course `2` has `indegree 0` and gets popped (`order = [2]`), so checking `order.length > 0` instead of `order.length === numCourses` misses the `0 <-> 1` cycle!',
      howToHandle: 'Always verify `order.length === numCourses`; here `1 !== 3`, so `[]` is returned.'
    },
    exerciseId: 'ex_graphs_01',
    recommendedPracticeIds: ['prac_graphs_06', 'prac_graphs_07'],
    knowledgeCheck: {
      question: 'After Kahn’s algorithm finishes its `while` loop on a 6-vertex directed graph, `order.length` is `4`. What does this prove?',
      options: [
        {
          id: 'gr3_ok',
          label: 'The remaining 2 vertices belong to (or depend on) a directed cycle, so no valid topological ordering exists.',
          feedback: 'Correct! Every vertex in a cycle always has at least one unvisited predecessor in the cycle, keeping its indegree >= 1.'
        },
        {
          id: 'gr3_bad1',
          label: 'The graph is disconnected into two separate trees.',
          feedback: 'Disconnected trees still have roots with indegree 0 and are completely emitted by Kahn’s algorithm.'
        },
        {
          id: 'gr3_bad2',
          label: 'Two vertices had no outgoing edges.',
          feedback: 'Sinks (0 outgoing edges) still reach indegree 0 and are emitted last.'
        }
      ],
      correctOptionId: 'gr3_ok',
      explanation: 'A directed graph has `order.length === V` in Kahn’s algorithm if and only if it is acyclic (a DAG).'
    },
    reflectionPrompt: 'How does 3-state DFS coloring (`0 = unvisited`, `1 = visiting on active stack`, `2 = completely visited`) distinguish a back-edge cycle (`-> 1`) from a cross-edge diamond (`-> 2`)?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS Topological Sort and Kahn indegree invariants.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_graphs_04',
    topicId: 'topic_graphs',
    order: 4,
    title: 'Union-Find (Disjoint Set) & Weighted Shortest Paths',
    estimatedMinutes: 20,
    prerequisites: ['les_graphs_03', 'les_heaps_01'],
    measurableObjective: 'Maintain dynamic connected components with Union-Find and relax non-negative weighted edges with Dijkstra’s min-heap algorithm.',
    explanation: 'When undirected edges arrive dynamically, **Disjoint Set Union (Union-Find)** with path compression and union-by-rank tracks connected components in near-constant `O(alpha(V))` time per edge; the first edge `[u, v]` where `find(u) === find(v)` connects two vertices already in the same component and completes a cycle. For shortest paths with non-negative edge weights, **Dijkstra’s algorithm** replaces the FIFO queue of BFS with a Min-Heap ordered by cumulative distance `dist[u]`, relaxing edges `dist[u] + w < dist[v]`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'findRedundantConnectionDsu.js',
      lines: [
        'export function findRedundantConnection(edges) {',
        '  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);',
        '  function find(x) {',
        '    if (parent[x] !== x) parent[x] = find(parent[x]);',
        '    return parent[x];',
        '  }',
        '  for (const [u, v] of edges) {',
        '    const ru = find(u), rv = find(v);',
        '    if (ru === rv) return [u, v];',
        '    parent[ru] = rv;',
        '  }',
        '  return [];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'edges = [[1, 2], [1, 3], [2, 3]]',
      stepByStep: [
        'Init: parent = [0, 1, 2, 3].',
        'Edge [1, 2]: find(1) = 1 !== find(2) = 2 -> parent[1] = 2.',
        'Edge [1, 3]: find(1) = 2 !== find(3) = 3 -> parent[2] = 3.',
        'Edge [2, 3]: find(2) = 3 === find(3) = 3 -> both share root 3! Return [2, 3].'
      ],
      outputDescription: '[2, 3] (the exact edge that closes the cycle)',
      invariantSummary: 'Two vertices u and v belong to the same connected component if and only if find(u) === find(v).'
    },
    pitfalls: [
      'Applying standard Dijkstra without hop-count state when a problem limits paths to at most `K` stops (where a costlier path with fewer hops can beat a cheaper path that exceeds `K` stops).',
      'Using Dijkstra on graphs with negative edge weights.'
    ],
    edgeCase: {
      scenario: 'Stale heap entries in Dijkstra when a vertex `v` is pushed multiple times with improved distances',
      whyItBreaksNaiveCode: 'When the older, larger `[d, v]` entry is later popped from the heap, expanding its edges again wastes `O(E)` work.',
      howToHandle: 'Immediately skip stale pops with `if (d > dist[u]) continue;` right after popping `[d, u]`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_graphs_08', 'prac_graphs_09', 'prac_graphs_10'],
    knowledgeCheck: {
      question: 'When processing undirected edges one by one in Union-Find, what condition proves that the current edge `[u, v]` creates a cycle?',
      options: [
        {
          id: 'gr4_ok',
          label: '`find(u) === find(v)` BEFORE uniting them, meaning a path between `u` and `v` already exists in the current component.',
          feedback: 'Correct! Adding an edge between two vertices that already share a component root closes a cycle.'
        },
        {
          id: 'gr4_bad1',
          label: '`parent[u] !== u`',
          feedback: 'A vertex having a parent just means it has been united with at least one other vertex, not that `u` and `v` are in the same component.'
        },
        {
          id: 'gr4_bad2',
          label: '`u > v`',
          feedback: 'Vertex numbering does not determine cycle connectivity.'
        }
      ],
      correctOptionId: 'gr4_ok',
      explanation: '`find(u) === find(v)` means `u` and `v` are already connected, so `[u, v]` is redundant.'
    },
    reflectionPrompt: 'Why does cloning the distance array before each of the `K + 1` rounds in Bellman-Ford (`Cheapest Flights Within K Stops`) prevent chaining two flights in a single round?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS Disjoint-Set Forests and Dijkstra shortest-path algorithms.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 11: RECURSION & BACKTRACKING ====================
  {
    id: 'les_recursion_backtracking_01',
    topicId: 'topic_recursion_backtracking',
    order: 1,
    title: 'Decision Trees & The Choose-Explore-Unchoose Invariant',
    estimatedMinutes: 20,
    prerequisites: ['les_trees_01'],
    measurableObjective: 'Model combinatorial generation as depth-first traversal of a decision tree while keeping a single shared `path` buffer clean.',
    explanation: 'Backtracking explores an implicit decision tree using a single mutable candidate array `path`. Before descending into a child call, you mutate `path.push(choice)`; immediately after the recursive call returns, you execute `path.pop()` so sibling branches see the exact state that existed upon entry. Whenever `path` represents a completed configuration, you MUST push a shallow copy `[...path]` into `results`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'subsetsBacktrack.js',
      lines: [
        'export function subsets(nums) {',
        '  const res = [], path = [];',
        '  function dfs(start) {',
        '    res.push([...path]);',
        '    for (let i = start; i < nums.length; i += 1) {',
        '      path.push(nums[i]);',
        '      dfs(i + 1);',
        '      path.pop();',
        '    }',
        '  }',
        '  dfs(0);',
        '  return res;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 2]',
      stepByStep: [
        'dfs(0): records []. i = 0 pushes 1 -> dfs(1) records [1].',
        'Inside dfs(1): i = 1 pushes 2 -> dfs(2) records [1, 2]. Pop 2 restores path = [1]; dfs(1) finishes and pop 1 restores path = [].',
        'Back in dfs(0): i = 1 pushes 2 -> dfs(2) records [2]. Pop 2 restores path = []. Returns [[], [1], [1, 2], [2]].'
      ],
      outputDescription: '[[], [1], [1, 2], [2]] (all 2^2 = 4 subsets)',
      invariantSummary: 'Upon exit from dfs(start), the shared path array is byte-for-byte identical to its state upon entry.'
    },
    pitfalls: [
      'Calling `res.push(path)` without cloning `[...path]`, which fills `res` with references to the same array that ends up empty `[]`!',
      'Forgetting `path.pop()` after the recursive call returns.'
    ],
    edgeCase: {
      scenario: 'Single-element input `nums = [5]`',
      whyItBreaksNaiveCode: 'If the base case only records subsets when `path.length > 0`, the empty subset `[]` is missed.',
      howToHandle: 'Recording `res.push([...path])` unconditionally at the top of `dfs(start)` captures both `[]` at the root and every non-empty prefix node.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_recursion_backtracking_01', 'prac_recursion_backtracking_03'],
    knowledgeCheck: {
      question: 'What happens if you write `res.push(path)` instead of `res.push([...path])` inside a backtracking search?',
      options: [
        {
          id: 'rb1_ok',
          label: 'Every entry in `res` points to the same mutable `path` array, which is popped back to `[]` by the time the root call finishes.',
          feedback: 'Correct! Cloning `[...path]` snapshots the current elements before future `.pop()` calls mutate `path`.'
        },
        {
          id: 'rb1_bad1',
          label: 'The code runs in O(1) time.',
          feedback: 'It still explores all branches, but overwrites the saved results.'
        },
        {
          id: 'rb1_bad2',
          label: 'Only the longest subset is kept.',
          feedback: 'Because every push is matched by a pop, `path` is empty `[]` at termination.'
        }
      ],
      correctOptionId: 'rb1_ok',
      explanation: 'Arrays are reference types in JavaScript; `[...path]` creates an independent snapshot.'
    },
    reflectionPrompt: 'Why is the maximum recursion call stack depth of `subsets(nums)` only `O(n)` even though the total number of subsets generated is `2^n`?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from OpenDSA backtracking and recursive state-tree templates.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_recursion_backtracking_02',
    topicId: 'topic_recursion_backtracking',
    order: 2,
    title: 'Subsets vs. Combinations vs. Permutations',
    estimatedMinutes: 20,
    prerequisites: ['les_recursion_backtracking_01'],
    measurableObjective: 'Select the exact branching progression—`dfs(i + 1)` single-use, `dfs(i)` unlimited reuse, or `used[i]` boolean mask—for each combinatorial structure.',
    explanation: 'Combinations and subsets care about membership, not order: passing a `start` index enforces canonical non-decreasing index order so `[2, 3]` and `[3, 2]` are never both generated. If each element can be used once, recurse with `dfs(i + 1)`; if an element can be reused unlimited times (Combination Sum), recurse with `dfs(i)`. Permutations care about order: every level loops `i = 0..n-1` and skips indices already marked in a `used` boolean mask.',
    codeSnippet: {
      language: 'javascript',
      filename: 'combinationSumReuse.js',
      lines: [
        'export function combinationSum(candidates, target) {',
        '  const res = [], path = [];',
        '  function dfs(start, rem) {',
        '    if (rem === 0) { res.push([...path]); return; }',
        '    if (rem < 0) return;',
        '    for (let i = start; i < candidates.length; i += 1) {',
        '      path.push(candidates[i]);',
        '      dfs(i, rem - candidates[i]);',
        '      path.pop();',
        '    }',
        '  }',
        '  dfs(0, target);',
        '  return res;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'candidates = [2, 3], target = 5',
      stepByStep: [
        'dfs(0, 5): pick i = 0 (2) -> dfs(0, 3) -> pick i = 0 (2) -> dfs(0, 1) -> pick 2 gives rem = -1 (pruned!).',
        'Back in dfs(0, 3) with path = [2]: advance loop to i = 1 (3) -> dfs(1, 0) hits rem === 0 -> records [2, 3].',
        'Root advances to i = 1 (3): loop starts at i = 1, so it never looks back at index 0 (2), avoiding duplicate [3, 2].'
      ],
      outputDescription: '[[2, 3]] (unique combination without permutation duplicates)',
      invariantSummary: 'Indices chosen along path are monotonically non-decreasing (i_1 <= i_2 <= ... <= i_k), guaranteeing canonical combination order.'
    },
    pitfalls: [
      'Looping `for (let i = 0; ...)` in Combination Sum instead of `for (let i = start; ...)`, which generates every permutation of the same combination.',
      'Passing `dfs(i + 1)` when unlimited reuse of `candidates[i]` is allowed.'
    ],
    edgeCase: {
      scenario: 'Empty input string `digits = ""` in Letter Combinations of a Phone Number',
      whyItBreaksNaiveCode: 'If the base case `idx === digits.length` pushes `path.join("")` without guarding `digits.length === 0` at the top, it returns `[""]` instead of `[]`!',
      howToHandle: 'Check `if (digits.length === 0) return [];` before launching `dfs(0)`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_recursion_backtracking_04', 'prac_recursion_backtracking_08'],
    knowledgeCheck: {
      question: 'In Combination Sum (where each candidate number may be reused an unlimited number of times), why do we pass `i` instead of `0` or `i + 1` to the recursive call `dfs(i, rem - candidates[i])`?',
      options: [
        {
          id: 'rb2_ok',
          label: 'Passing `i` allows choosing `candidates[i]` again while forbidding earlier indices `< i`, which prevents generating reordered duplicate combinations.',
          feedback: 'Correct! Staying at `>= i` allows repeats like `[2, 2, 3]` while blocking reordered `[2, 3, 2]` or `[3, 2, 2]`.'
        },
        {
          id: 'rb2_bad1',
          label: 'Passing `i` limits the recursion depth to `candidates.length`.',
          feedback: 'Recursion depth is bounded by `rem < 0` (at most `target / min(candidates)`), not `i`.'
        },
        {
          id: 'rb2_bad2',
          label: 'Passing `i` sorts the input array automatically.',
          feedback: 'Index progression does not sort an unsorted array.'
        }
      ],
      correctOptionId: 'rb2_ok',
      explanation: 'Passing `i` enforces non-decreasing index order with repetition allowed.'
    },
    reflectionPrompt: 'How does sorting `candidates` upfront allow you to replace `if (rem < 0) return` with an early `break` inside the `for` loop?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook combination vs permutation backtracking taxonomy.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_recursion_backtracking_03',
    topicId: 'topic_recursion_backtracking',
    order: 3,
    title: 'Duplicate Pruning & Constraint Ordering',
    estimatedMinutes: 20,
    prerequisites: ['les_recursion_backtracking_02'],
    measurableObjective: 'Eliminate duplicate branches on multisets by sorting first and skipping equal siblings at the same decision depth (`i > start && nums[i] === nums[i - 1]`).',
    explanation: 'When the input contains duplicate numbers (e.g., `nums = [1, 2, 2]`), picking the first `2` and picking the second `2` at the same decision depth spawn identical subtrees. Sorting `nums` first groups identical values at adjacent indices so the single guard `if (i > start && nums[i] === nums[i - 1]) continue;` prunes the redundant sibling subtree in `O(1)` time—while still allowing `i === start` in deeper calls so `[1, 2, 2]` is generated!',
    codeSnippet: {
      language: 'javascript',
      filename: 'subsetsWithDupPrune.js',
      lines: [
        'export function subsetsWithDup(nums) {',
        '  nums.sort((a, b) => a - b);',
        '  const res = [], path = [];',
        '  function dfs(start) {',
        '    res.push([...path]);',
        '    for (let i = start; i < nums.length; i += 1) {',
        '      if (i > start && nums[i] === nums[i - 1]) continue;',
        '      path.push(nums[i]);',
        '      dfs(i + 1);',
        '      path.pop();',
        '    }',
        '  }',
        '  dfs(0);',
        '  return res;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [1, 2, 2] (sorted)',
      stepByStep: [
        'dfs(0) picks i = 0 (1) -> dfs(1) picks i = 1 (first 2) -> dfs(2) picks i = 2 (second 2, allowed because i === start = 2) -> records [1, 2, 2].',
        'Back in dfs(1) after popping first 2: loop advances to i = 2. Since i > start (2 > 1) and nums[2] === nums[1], i = 2 is skipped!',
        'Back in dfs(0) after i = 1 explores [2] and [2, 2]: i = 2 has i > start (2 > 0) and nums[2] === nums[1], so i = 2 is skipped.'
      ],
      outputDescription: '[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] (6 unique subsets)',
      invariantSummary: 'At any fixed recursion call dfs(start), each distinct value v is chosen at most once as the next element.'
    },
    pitfalls: [
      'Writing `if (nums[i] === nums[i - 1]) continue` without `i > start`, which forbids picking duplicate values at deeper positions and misses `[1, 2, 2]` and `[2, 2]`.',
      'Forgetting `nums.sort((a, b) => a - b)` before running the adjacent duplicate check.'
    ],
    edgeCase: {
      scenario: 'All elements identical `nums = [2, 2, 2]`',
      whyItBreaksNaiveCode: 'Without sibling pruning, $2^3 = 8$ subsets are generated and must be deduplicated via string hashing.',
      howToHandle: '`i > start && nums[i] === nums[i - 1]` explores only the `i === start` chain at each depth, generating the 4 subsets `[], [2], [2,2], [2,2,2]` directly.'
    },
    exerciseId: 'ex_recursion_backtracking_01',
    recommendedPracticeIds: ['prac_recursion_backtracking_02', 'prac_recursion_backtracking_05', 'prac_recursion_backtracking_07'],
    knowledgeCheck: {
      question: 'In `if (i > start && nums[i] === nums[i - 1]) continue`, why is the `i > start` check required?',
      options: [
        {
          id: 'rb3_ok',
          label: 'Because when `i === start`, `nums[i]` is being chosen for a new deeper position in `path` (after `nums[start - 1]` was already chosen), whereas `i > start` means `nums[i - 1]` was just unchosen for this exact same position.',
          feedback: 'Correct! `i === start` extends a parent branch with a second copy; `i > start` repeats a sibling branch at the same slot.'
        },
        {
          id: 'rb3_bad1',
          label: 'To prevent accessing `nums[-1]` when `start === 0`.',
          feedback: 'While `i > 0` would prevent `nums[-1]`, `i > 0` alone would still skip `i === start` at depths `start >= 1`!'
        },
        {
          id: 'rb3_bad2',
          label: 'Because `start` is always equal to `nums.length`.',
          feedback: '`start` ranges from `0` to `nums.length`.'
        }
      ],
      correctOptionId: 'rb3_ok',
      explanation: '`i > start` distinguishes a sibling choice at the same depth from a child choice at the next depth.'
    },
    reflectionPrompt: 'In Palindrome Partitioning, why is checking `isPalindrome(s, start, end)` BEFORE calling `dfs(end + 1)` much faster than generating all $2^{n-1}$ partitions and filtering at the leaves?',
    sourceId: 'src_tih_mit',
    provenance: 'Adapted from Tech Interview Handbook duplicate-pruning backtracking patterns.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_recursion_backtracking_04',
    topicId: 'topic_recursion_backtracking',
    order: 4,
    title: 'Grid & Constraint Backtracking (Word Search & N-Queens)',
    estimatedMinutes: 20,
    prerequisites: ['les_recursion_backtracking_03', 'les_graphs_01'],
    measurableObjective: 'Enforce spatial and structural constraints using reversible in-place cell marking and O(1) diagonal/column conflict sets.',
    explanation: 'In spatial backtracking (like Word Search on a 2D board or placing `N` non-attacking Queens), each recursive step mutates a board cell or constraint set, explores valid child states, and **restores** the mutation on return. Unlike flood-fill DFS (where any path to a cell suffices), a Word Search path that fails after stepping through `(r, c)` must unmark `(r, c)` so a different path ordering can still use `(r, c)`. In N-Queens, row-by-row placement with sets for `cols` (`c`), `diag1` (`r - c`), and `diag2` (`r + c`) checks attacks in `O(1)` time.',
    codeSnippet: {
      language: 'javascript',
      filename: 'wordSearchBacktrack.js',
      lines: [
        'export function exist(board, word) {',
        '  function dfs(r, c, idx) {',
        '    if (idx === word.length) return true;',
        '    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== word[idx]) {',
        '      return false;',
        '    }',
        '    const saved = board[r][c];',
        '    board[r][c] = "#";',
        '    const found = dfs(r + 1, c, idx + 1) || dfs(r - 1, c, idx + 1) ||',
        '                  dfs(r, c + 1, idx + 1) || dfs(r, c - 1, idx + 1);',
        '    board[r][c] = saved;',
        '    return found;',
        '  }',
        '  for (let r = 0; r < board.length; r += 1) {',
        '    for (let c = 0; c < board[0].length; c += 1) {',
        '      if (dfs(r, c, 0)) return true;',
        '    }',
        '  }',
        '  return false;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'N-Queens 4x4 diagonal invariants for square (r = 1, c = 2)',
      stepByStep: [
        'Column index is c = 2.',
        'Main diagonal (top-left to bottom-right) keeps r - c = 1 - 2 = -1 constant (matches (0, 1) and (2, 3)).',
        'Anti-diagonal (top-right to bottom-left) keeps r + c = 1 + 2 = 3 constant (matches (0, 3), (2, 1), and (3, 0)).'
      ],
      outputDescription: 'O(1) attack check via cols.has(c) || diag1.has(r - c) || diag2.has(r + c)',
      invariantSummary: 'Before recursing to row r + 1, sets cols, diag1, and diag2 contain the exact column and diagonal keys occupied by queens in rows 0..r.'
    },
    pitfalls: [
      'Forgetting `board[r][c] = saved` after testing the 4 neighbors in Word Search, which permanently blocks `(r, c)` for the rest of the search!',
      'Allowing `close > open` in Generate Parentheses, which produces invalid prefixes like `")("`.'
    ],
    edgeCase: {
      scenario: 'Single-cell board `[["A"]]` with `word = "A"`',
      whyItBreaksNaiveCode: 'If the base case `idx === word.length` is checked only for valid neighbors BEFORE stepping out of bounds, a 1-letter word on a 1x1 board has no valid neighbor to step into and returns `false`!',
      howToHandle: 'Check `if (idx === word.length) return true;` at the very top of `dfs` (or check `idx === word.length - 1` as soon as `board[r][c] === word[idx]` matches).'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_recursion_backtracking_06', 'prac_recursion_backtracking_09', 'prac_recursion_backtracking_10'],
    knowledgeCheck: {
      question: 'Why must Word Search restore `board[r][c] = saved` when backtracking from `dfs(r, c, idx)`, whereas Number of Islands never restores `grid[r][c] = "1"`?',
      options: [
        {
          id: 'rb4_ok',
          label: 'Because in Word Search, reaching `(r, c)` at index `idx` from the wrong direction may dead-end, yet `(r, c)` might still be required along a different simple path.',
          feedback: 'Correct! Sequence matching depends on the history of visited cells along the active path, not just unweighted reachability.'
        },
        {
          id: 'rb4_bad1',
          label: 'Because Word Search allows using the same cell twice in a single word.',
          feedback: 'Word Search forbids reusing a cell within the same word (which is why we set `board[r][c] = "#"` while on the active path).'
        },
        {
          id: 'rb4_bad2',
          label: 'Because Number of Islands uses a 1D array.',
          feedback: 'Both operate on 2D grids.'
        }
      ],
      correctOptionId: 'rb4_ok',
      explanation: 'Temporary path marking prevents self-intersection on the current path while unmarking on return allows alternative paths to use the cell.'
    },
    reflectionPrompt: 'In Generate Parentheses, what two simple integer inequalities on `(openCount, closeCount)` prune 100% of invalid parenthesis strings before they are ever built?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from classic N-Queens and grid backtracking invariants.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== TOPIC 12: DYNAMIC PROGRAMMING ====================
  {
    id: 'les_dynamic_programming_01',
    topicId: 'topic_dynamic_programming',
    order: 1,
    title: 'Overlapping Subproblems: Memoization to 1D Rolling Tabulation',
    estimatedMinutes: 20,
    prerequisites: ['les_recursion_backtracking_01', 'les_arrays_01'],
    measurableObjective: 'Collapse exponential recursive trees with overlapping subproblems into O(n) bottom-up state transitions and O(1) rolling scalars.',
    explanation: 'When a recursive recurrence like `ways(i) = ways(i - 1) + ways(i - 2)` (Climbing Stairs) or `rob(i) = Math.max(rob(i - 1), nums[i] + rob(i - 2))` (House Robber) recomputes the same index `i` across exponentially many branches, caching each state in `dp[i]` solves every subproblem once in `O(n)` time. Better yet, when `dp[i]` depends only on `dp[i - 1]` and `dp[i - 2]`, two rolling variables `prev2` and `prev1` reduce auxiliary space to `O(1)`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'houseRobberRolling.js',
      lines: [
        'export function rob(nums) {',
        '  let prev2 = 0, prev1 = 0;',
        '  for (const x of nums) {',
        '    const curr = Math.max(prev1, prev2 + x);',
        '    prev2 = prev1;',
        '    prev1 = curr;',
        '  }',
        '  return prev1;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [2, 7, 9, 3, 1]',
      stepByStep: [
        'Init: prev2 = 0, prev1 = 0.',
        'x = 2: curr = max(0, 0 + 2) = 2 -> prev2 = 0, prev1 = 2.',
        'x = 7: curr = max(2, 0 + 7) = 7 -> prev2 = 2, prev1 = 7.',
        'x = 9: curr = max(7, 2 + 9) = 11 -> prev2 = 7, prev1 = 11.',
        'x = 3: curr = max(11, 7 + 3) = 11. x = 1: curr = max(11, 11 + 1) = 12 -> return 12.'
      ],
      outputDescription: '12 (robbing houses at indices 0, 2, 4 -> 2 + 9 + 1)',
      invariantSummary: 'After processing prefix nums[0..i], prev1 equals the maximum non-adjacent sum in nums[0..i] and prev2 equals the maximum in nums[0..i-1].'
    },
    pitfalls: [
      'Using an alternating even/odd index sum, which misses optimal patterns that skip two houses in a row like `[2, 1, 1, 2]` (optimal `2 + 2 = 4`).',
      'In House Robber II (circular street), forgetting the single-element base case `nums.length === 1` when slicing `nums.slice(0, n - 1)` and `nums.slice(1)`.'
    ],
    edgeCase: {
      scenario: 'nums = [2, 1, 1, 2] where optimal choice skips two consecutive middle houses (indices 1 and 2)',
      whyItBreaksNaiveCode: 'Summing only even indices (`2 + 1 = 3`) or odd indices (`1 + 2 = 3`) misses `nums[0] + nums[3] = 4`!',
      howToHandle: 'Because `prev1` carries forward the best of `0..i-1` (`dp[1] = max(2, 1) = 2`), at `i = 3` (`x = 2`), `prev2 + x` computes `dp[1] + 2 = 4`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_dynamic_programming_01', 'prac_dynamic_programming_02', 'prac_dynamic_programming_03'],
    knowledgeCheck: {
      question: 'In House Robber II, where houses `0` and `n - 1` are adjacent in a circle, how do we reduce the circular constraint to two linear House Robber passes?',
      options: [
        {
          id: 'dp1_ok',
          label: 'Since houses `0` and `n - 1` cannot both be robbed, every valid robbery either excludes house `n - 1` (`nums[0..n-2]`) or excludes house `0` (`nums[1..n-1]`), so we take the max of those two linear ranges.',
          feedback: 'Correct! Splitting a circular constraint into two linear subproblems is a classic DP reduction.'
        },
        {
          id: 'dp1_bad1',
          label: 'Run linear DP on `nums` and subtract `Math.min(nums[0], nums[n - 1])`.',
          feedback: 'You only need to subtract if the optimal linear solution actually robbed BOTH `0` and `n - 1`, and even then a different middle choice might be better.'
        },
        {
          id: 'dp1_bad2',
          label: 'Concatenate `nums` with itself and divide the answer by 2.',
          feedback: 'Doubling the array still allows robbing across the seam.'
        }
      ],
      correctOptionId: 'dp1_ok',
      explanation: 'Any valid subset of a cycle omits at least one endpoint of the seam `(0, n - 1)`.'
    },
    reflectionPrompt: 'When debugging a new DP recurrence, why is starting with top-down recursion + memoization often easier to reason about before converting to bottom-up rolling variables?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS Dynamic Programming optimal substructure and overlapping subproblems.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_dynamic_programming_02',
    topicId: 'topic_dynamic_programming',
    order: 2,
    title: 'Unbounded vs. 0/1 Knapsack State Transitions',
    estimatedMinutes: 25,
    prerequisites: ['les_dynamic_programming_01'],
    measurableObjective: 'Build capacity/sum state tables and control item reuse via forward (unbounded) vs backward (0/1 single-use) capacity iteration.',
    explanation: 'In knapsack and subset-sum problems, the DP table is indexed by achievable amount/sum `a` from `0` to `target`. In **Unbounded Knapsack (Coin Change)**, each coin can be used unlimited times, so `dp[a] = Math.min(dp[a], 1 + dp[a - coin])` reads `dp[a - coin]` that may already include the same coin (forward loop). In **0/1 Knapsack (Partition Equal Subset Sum)**, each number can be used at most once: when compressing to a 1D array `dp[0..target]`, we MUST iterate `s` **backward** from `target` down to `num` so `dp[s - num]` still holds the previous row’s value before `num` was used!',
    codeSnippet: {
      language: 'javascript',
      filename: 'coinChangeBottomUp.js',
      lines: [
        'export function coinChange(coins, amount) {',
        '  const dp = new Array(amount + 1).fill(Infinity);',
        '  dp[0] = 0;',
        '  for (let a = 1; a <= amount; a += 1) {',
        '    for (const c of coins) {',
        '      if (a - c >= 0) {',
        '        dp[a] = Math.min(dp[a], 1 + dp[a - c]);',
        '      }',
        '    }',
        '  }',
        '  return dp[amount] === Infinity ? -1 : dp[amount];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'coins = [1, 3, 4], amount = 6',
      stepByStep: [
        'Init: dp[0] = 0, dp[1..6] = Infinity.',
        'Build up: dp[1] = 1, dp[2] = 2, dp[3] = 1 (coin 3), dp[4] = 1 (coin 4), dp[5] = 2 (4 + 1).',
        'At a = 6: coin 1 -> 1 + dp[5] = 3; coin 3 -> 1 + dp[3] = 2; coin 4 -> 1 + dp[2] = 3. Minimum is dp[6] = 2 (3 + 3).'
      ],
      outputDescription: '2 coins (3 + 3 = 6, beating greedy 4 + 1 + 1 = 3 coins)',
      invariantSummary: 'After outer iteration a, dp[a] holds the minimum number of coins required to form exact amount a (or Infinity if impossible).'
    },
    pitfalls: [
      'Iterating sum `s` forward `for (let s = num; s <= target; s++)` in 0/1 Subset Sum, which reuses a single array element multiple times!',
      'Returning `Infinity` instead of `-1` when `dp[amount] === Infinity` in Coin Change.'
    ],
    edgeCase: {
      scenario: 'Partition Equal Subset Sum when the total sum of `nums` is odd (e.g., `[1, 2, 5]`, sum = 8 vs `[1, 2, 4]`, sum = 7)',
      whyItBreaksNaiveCode: 'If `totalSum` is odd, `totalSum / 2` is a `.5` fraction (`3.5`), causing `dp[3.5]` indexing bugs if not rejected upfront!',
      howToHandle: 'Immediately check `if (totalSum % 2 !== 0) return false;` before allocating `dp` of size `(totalSum / 2) + 1`.'
    },
    exerciseId: 'ex_dynamic_programming_01',
    recommendedPracticeIds: ['prac_dynamic_programming_04', 'prac_dynamic_programming_07'],
    knowledgeCheck: {
      question: 'When compressing 0/1 Subset Sum (`Partition Equal Subset Sum`) into a 1D boolean array `dp[0..target]`, why MUST the inner loop run backward (`for (let s = target; s >= num; s--)`)?',
      options: [
        {
          id: 'dp2_ok',
          label: 'Because a forward loop updates `dp[num] = true` first and then reads that newly updated `dp[num]` at `s = 2 * num` in the same pass, illegally using `num` twice.',
          feedback: 'Correct! Iterating downward ensures `dp[s - num]` still holds the state from BEFORE the current item `num` was considered.'
        },
        {
          id: 'dp2_bad1',
          label: 'Because `dp[target]` must be initialized to `true` before `dp[0]`.',
          feedback: '`dp[0]` is initialized to `true` and `dp[1..target]` to `false`.'
        },
        {
          id: 'dp2_bad2',
          label: 'To sort `nums` in descending order.',
          feedback: 'The backward loop works regardless of whether `nums` is sorted.'
        }
      ],
      correctOptionId: 'dp2_ok',
      explanation: 'Backward iteration in 1D knapsack prevents reading current-row updates (`0/1` single use), whereas forward iteration intentionally reads current-row updates (unbounded reuse).'
    },
    reflectionPrompt: 'Why does a greedy largest-coin-first strategy work for US coins `[1, 5, 10, 25]` but fail for `coins = [1, 3, 4], amount = 6`?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS knapsack and coin-change dynamic programming recurrences.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_dynamic_programming_03',
    topicId: 'topic_dynamic_programming',
    order: 3,
    title: 'Sequence Prefix & Subsequence DP (LIS & Word Break)',
    estimatedMinutes: 25,
    prerequisites: ['les_dynamic_programming_02'],
    measurableObjective: 'Formulate prefix transitions where `dp[i]` scans all valid prior split points `0 <= j < i`.',
    explanation: 'Many 1D sequence problems cannot transition from `i - 1` alone because the previous valid element or word boundary could sit at any index `0 <= j < i`. In **Longest Increasing Subsequence (LIS)**, `dp[i]` is defined as the length of the longest increasing subsequence *ending* at index `i`: `dp[i] = 1 + max({ dp[j] : 0 <= j < i and nums[j] < nums[i] })`. In **Word Break**, `dp[i]` is `true` if the prefix `s[0..i-1]` can be segmented: `dp[i] = some(0 <= j < i : dp[j] && wordSet.has(s.slice(j, i)))`.',
    codeSnippet: {
      language: 'javascript',
      filename: 'lengthOfLis.js',
      lines: [
        'export function lengthOfLIS(nums) {',
        '  const dp = new Array(nums.length).fill(1);',
        '  let best = 1;',
        '  for (let i = 1; i < nums.length; i += 1) {',
        '    for (let j = 0; j < i; j += 1) {',
        '      if (nums[j] < nums[i]) {',
        '        dp[i] = Math.max(dp[i], dp[j] + 1);',
        '      }',
        '    }',
        '    best = Math.max(best, dp[i]);',
        '  }',
        '  return best;',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'nums = [10, 9, 2, 5, 3, 7]',
      stepByStep: [
        'Init: dp = [1, 1, 1, 1, 1, 1]. Indices 0 (10), 1 (9), 2 (2) have no smaller prior elements -> stay 1.',
        'i = 3 (5): j = 2 has nums[2] = 2 < 5 -> dp[3] = dp[2] + 1 = 2.',
        'i = 4 (3): j = 2 has nums[2] = 2 < 3 -> dp[4] = dp[2] + 1 = 2.',
        'i = 5 (7): smaller priors are j = 2 (dp=1), j = 3 (dp=2), j = 4 (dp=2) -> dp[5] = 2 + 1 = 3. Return best = 3.'
      ],
      outputDescription: '3 (subsequence [2, 5, 7] or [2, 3, 7])',
      invariantSummary: 'dp[i] equals the maximum length of a strictly increasing subsequence whose final element is exactly nums[i].'
    },
    pitfalls: [
      'Returning `dp[nums.length - 1]` instead of `Math.max(...dp)` in LIS, when the longest increasing subsequence ends before the last index (e.g., `[1, 2, 3, 0]`).',
      'Forgetting `dp[0] = true` (the empty prefix of length 0 is always valid) in Word Break.'
    ],
    edgeCase: {
      scenario: 'Strictly decreasing array `nums = [7, 5, 3, 1]` in LIS',
      whyItBreaksNaiveCode: 'If `dp` is initialized to `0` instead of `1`, no pair satisfies `nums[j] < nums[i]` and the code returns `0` instead of `1`!',
      howToHandle: 'Every single element forms an increasing subsequence of length `1` by itself, so initialize `dp.fill(1)` and `best = 1`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_dynamic_programming_05', 'prac_dynamic_programming_06'],
    knowledgeCheck: {
      question: 'In Longest Increasing Subsequence, why must `dp[i]` be defined as "the LIS length ENDING AT index `i`" rather than "the LIS length inside prefix `nums[0..i]`"?',
      options: [
        {
          id: 'dp3_ok',
          label: 'Because to decide whether `nums[i]` can extend a prior subsequence at `j`, we must know the exact ending value `nums[j]` of that subsequence (`nums[j] < nums[i]`).',
          feedback: 'Correct! Anchoring the state at index `j` exposes `nums[j]` as the terminal element to compare against `nums[i]`.'
        },
        {
          id: 'dp3_bad1',
          label: 'Because `dp[nums.length - 1]` is always the global maximum.',
          feedback: '`dp[n - 1]` is NOT always the global maximum, which is why we return `Math.max(...dp)`.'
        },
        {
          id: 'dp3_bad2',
          label: 'To avoid using a nested loop.',
          feedback: 'The standard DP still uses a nested `j < i` loop.'
        }
      ],
      correctOptionId: 'dp3_ok',
      explanation: 'Without knowing the last element of a subsequence, you cannot verify whether appending `nums[i]` preserves strict increase.'
    },
    reflectionPrompt: 'How does patience sorting with binary search (`tails` array) optimize Longest Increasing Subsequence from `O(n^2)` to `O(n log n)`?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS subsequence and prefix segmentation dynamic programming.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },
  {
    id: 'les_dynamic_programming_04',
    topicId: 'topic_dynamic_programming',
    order: 4,
    title: '2D Grid & Two-Sequence Alignment DP (LCS & Edit Distance)',
    estimatedMinutes: 25,
    prerequisites: ['les_dynamic_programming_03'],
    measurableObjective: 'Tabulate 2D state matrices `dp[i][j]` over grid coordinates or pairs of string prefixes with 1-indexed sentinel borders.',
    explanation: 'When a problem aligns two strings `text1[0..i-1]` and `text2[0..j-1]` (**Longest Common Subsequence**, **Edit Distance**) or counts paths across a 2D grid (**Unique Paths**), the state requires two coordinates `(i, j)`. Allocating an `(m + 1) x (n + 1)` matrix where row `0` and column `0` represent empty prefixes eliminates boundary branches: in LCS, if `text1[i - 1] === text2[j - 1]`, both characters match and consume each other (`1 + dp[i - 1][j - 1]`); otherwise we skip one character (`Math.max(dp[i - 1][j], dp[i][j - 1])`).',
    codeSnippet: {
      language: 'javascript',
      filename: 'longestCommonSubsequence2D.js',
      lines: [
        'export function longestCommonSubsequence(text1, text2) {',
        '  const m = text1.length, n = text2.length;',
        '  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));',
        '  for (let i = 1; i <= m; i += 1) {',
        '    for (let j = 1; j <= n; j += 1) {',
        '      if (text1[i - 1] === text2[j - 1]) {',
        '        dp[i][j] = 1 + dp[i - 1][j - 1];',
        '      } else {',
        '        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);',
        '      }',
        '    }',
        '  }',
        '  return dp[m][n];',
        '}'
      ]
    },
    workedExample: {
      inputDescription: 'text1 = "ace", text2 = "abcde"',
      stepByStep: [
        'Row i = 1 ("a"): matches text2[0] = "a" -> dp[1][1] = 1 + dp[0][0] = 1; propagates 1 across dp[1][1..5].',
        'Row i = 2 ("c"): matches text2[2] = "c" -> dp[2][3] = 1 + dp[1][2] = 2; propagates 2 across dp[2][3..5].',
        'Row i = 3 ("e"): matches text2[4] = "e" -> dp[3][5] = 1 + dp[2][4] = 3. Return dp[3][5] = 3.'
      ],
      outputDescription: '3 (longest common subsequence is "ace")',
      invariantSummary: 'Cell dp[i][j] holds the exact LCS length of prefix text1.slice(0, i) and prefix text2.slice(0, j).'
    },
    pitfalls: [
      'Writing `1 + Math.max(dp[i - 1][j], dp[i][j - 1])` on a character match in LCS instead of `1 + dp[i - 1][j - 1]`, which double-counts a single character against two copies in the other string!',
      'In Edit Distance, initializing row `0` and column `0` to `0` instead of `dp[0][j] = j` (insert `j` chars) and `dp[i][0] = i` (delete `i` chars).'
    ],
    edgeCase: {
      scenario: 'Edit Distance when one string is empty (`word1 = "", word2 = "ros"`)',
      whyItBreaksNaiveCode: 'If base row `dp[0][j]` is left at `0`, `minDistance("", "ros")` returns `0` instead of `3` insertions!',
      howToHandle: 'Always initialize `for (let i = 0; i <= m; i++) dp[i][0] = i;` and `for (let j = 0; j <= n; j++) dp[0][j] = j;`.'
    },
    exerciseId: null,
    recommendedPracticeIds: ['prac_dynamic_programming_08', 'prac_dynamic_programming_09', 'prac_dynamic_programming_10'],
    knowledgeCheck: {
      question: 'In Longest Common Subsequence, when `text1[i - 1] === text2[j - 1]`, why MUST `dp[i][j]` transition from `1 + dp[i - 1][j - 1]` instead of `1 + dp[i][j - 1]`?',
      options: [
        {
          id: 'dp4_ok',
          label: 'Because pairing `text1[i - 1]` with `text2[j - 1]` consumes BOTH characters; using `dp[i][j - 1]` would allow `text1[i - 1]` to be matched a second time.',
          feedback: 'Correct! For example, on `text1 = "a", text2 = "aa"`, `1 + dp[i][j - 1]` would falsely return `2` instead of `1`!'
        },
        {
          id: 'dp4_bad1',
          label: 'Because `dp[i - 1][j - 1]` is always larger than `dp[i][j - 1]`.',
          feedback: '`dp[i - 1][j - 1]` is `<= dp[i][j - 1]`; we use the diagonal specifically to avoid reusing `text1[i - 1]`.'
        },
        {
          id: 'dp4_bad2',
          label: 'Because `dp[i][j - 1]` has not been computed yet.',
          feedback: 'In left-to-right row-major order, `dp[i][j - 1]` was just computed on the previous inner iteration.'
        }
      ],
      correctOptionId: 'dp4_ok',
      explanation: 'Diagonal transition `(i - 1, j - 1)` advances past both matched characters simultaneously.'
    },
    reflectionPrompt: 'In Edit Distance, why do `dp[i - 1][j] + 1`, `dp[i][j - 1] + 1`, and `dp[i - 1][j - 1] + 1` correspond to Delete, Insert, and Replace respectively?',
    sourceId: 'src_opendsa_mit',
    provenance: 'Adapted from CLRS Longest Common Subsequence and Levenshtein Edit Distance.',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  }
];

export const EXPANSION_BATCH_3_EXERCISES = [
  // ==================== EXERCISE 16: KAHN TOPOLOGICAL SORT ====================
  {
    id: 'ex_graphs_01',
    topicId: 'topic_graphs',
    lessonId: 'les_graphs_03',
    title: 'Trace: Kahn Topological Indegree Frontier',
    rendererType: 'graph_frontier_state',
    objective: 'Trace Kahn’s zero-indegree queue on a 4-course diamond DAG (`0 -> 1, 2 -> 3`) and a cyclic graph (`0 -> 1 <-> 2`) to prove why a node only unlocks when its last prerequisite finishes.',
    instructions: 'Inspect the `indeg` counts and FIFO `queue` at each step and select the exact frontier transition.',
    codeLines: [
      'export function findOrder(n, adj, indeg) {',
      '  const queue = [], order = [];',
      '  for (let u = 0; u < n; u += 1) if (indeg[u] === 0) queue.push(u);',
      '  let head = 0;',
      '  while (head < queue.length) {',
      '    const u = queue[head++];',
      '    order.push(u);',
      '    for (const v of adj[u]) {',
      '      if (--indeg[v] === 0) queue.push(v);',
      '    }',
      '  }',
      '  return order.length === n ? order : [];',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Diamond Dependency DAG (0 -> 1, 2 -> 3)',
      inputLabel: 'n = 4, edges: 0->1, 0->2, 1->3, 2->3 (indeg = [0, 1, 1, 2])',
      edgeCaseNote: 'Course `3` has two prerequisites (`1` and `2`), so it must wait until BOTH `1` and `2` are popped.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 9,
          prompt: 'Initially `indeg = [0, 1, 1, 2]` and `queue = [0]`. After popping `u = 0` (`order = [0]`) and relaxing outgoing edges `0 -> 1` and `0 -> 2`, what are `indeg` and the active `queue`?',
          stateSnapshot: {
            graphNodes: [
              { id: 'g0', label: '0 (emitted)', state: 'visited' },
              { id: 'g1', label: '1 (indeg: 0)', state: 'active' },
              { id: 'g2', label: '2 (indeg: 0)', state: 'active' },
              { id: 'g3', label: '3 (indeg: 2)', state: 'pending' }
            ],
            stackOrQueue: ['1 (ready)', '2 (ready)'],
            annotation: 'Popping 0 decrements indeg[1] and indeg[2] from 1 to 0 -> both 1 and 2 enter queue.'
          },
          choices: [
            {
              id: 'gr1_c1_ok',
              label: 'Both indeg[1] and indeg[2] drop from 1 to 0, so both 1 and 2 are pushed onto queue = [1, 2]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Course 0 was the only prerequisite for courses 1 and 2, so both unlock immediately.'
            },
            {
              id: 'gr1_c1_bad',
              label: 'Nodes 1, 2, and 3 are all pushed onto the queue',
              isCorrect: false,
              misconceptionFeedback: 'Node 3 is not a direct neighbor of 0 and still has `indeg[3] = 2`.'
            }
          ],
          correctExplanation: 'Relaxing `0 -> 1` and `0 -> 2` reduces both indegrees to `0`, enqueuing `1` and `2`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 9,
          prompt: 'Next we dequeue `u = 1` (`order = [0, 1]`) and inspect edge `1 -> 3`. Why is course `3` NOT enqueued yet?',
          stateSnapshot: {
            graphNodes: [
              { id: 'g0', label: '0 (emitted)', state: 'visited' },
              { id: 'g1', label: '1 (emitted)', state: 'visited' },
              { id: 'g2', label: '2 (in queue)', state: 'active' },
              { id: 'g3', label: '3 (indeg: 1, waiting)', state: 'pending' }
            ],
            stackOrQueue: ['2 (ready)'],
            annotation: '--indeg[3] drops from 2 to 1 (!== 0). Course 3 still waits for course 2.'
          },
          choices: [
            {
              id: 'gr1_c2_ok',
              label: '--indeg[3] reduces indeg[3] from 2 to 1 (!== 0), because prerequisite 2 -> 3 has not completed yet',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Indegree tracks the exact number of unfinished prerequisites.'
            },
            {
              id: 'gr1_c2_bad',
              label: 'Course 3 is enqueued now and checked for duplicates later',
              isCorrect: false,
              misconceptionFeedback: 'Enqueuing when `indeg > 0` would schedule course 3 before prerequisite 2 is taken!'
            }
          ],
          correctExplanation: '`indeg[3]` becomes `1`, so `3` waits until `2` is popped.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 12,
          prompt: 'Now `u = 2` is popped (`order = [0, 1, 2]`), `--indeg[3]` drops from `1` to `0` (enqueuing `3`), and `3` is popped (`order = [0, 1, 2, 3]`). How does line 12 verify the graph is cycle-free?',
          stateSnapshot: {
            graphNodes: [
              { id: 'g0', label: '0 (done)', state: 'valid' },
              { id: 'g1', label: '1 (done)', state: 'valid' },
              { id: 'g2', label: '2 (done)', state: 'valid' },
              { id: 'g3', label: '3 (done)', state: 'valid' }
            ],
            stackOrQueue: [],
            annotation: 'order = [0, 1, 2, 3]. order.length === 4 === n -> returns [0, 1, 2, 3].'
          },
          choices: [
            {
              id: 'gr1_c3_ok',
              label: 'order.length === n (4 === 4) confirms every vertex reached indegree 0 and was emitted',
              isCorrect: true,
              misconceptionFeedback: 'Exact! In a DAG, every vertex eventually reaches indegree 0.'
            },
            {
              id: 'gr1_c3_bad',
              label: 'head === queue.length confirms there was no cycle',
              isCorrect: false,
              misconceptionFeedback: '`head === queue.length` is ALWAYS true when the `while` loop ends, even when a cycle locks unvisited nodes!'
            }
          ],
          correctExplanation: 'All `4` vertices were emitted, so `[0, 1, 2, 3]` is returned.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'cycle_lock',
      label: 'Directed Cycle Deadlock (0 -> 1 <-> 2)',
      inputLabel: 'n = 3, edges: 0->1, 1->2, 2->1 (indeg = [0, 2, 1])',
      edgeCaseNote: 'Watch nodes `1` and `2` lock each other with `indeg = 1` after `0` finishes.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 9,
          prompt: 'Start with `indeg = [0, 2, 1]` and `queue = [0]`. After popping `0` (`order = [0]`) and relaxing `0 -> 1`, what are `indeg` and the active `queue`?',
          stateSnapshot: {
            graphNodes: [
              { id: 'c0', label: '0 (emitted)', state: 'visited' },
              { id: 'c1', label: '1 (indeg: 1, locked)', state: 'error' },
              { id: 'c2', label: '2 (indeg: 1, locked)', state: 'error' }
            ],
            stackOrQueue: [],
            annotation: 'indeg[1] drops from 2 to 1. Queue is now empty while nodes 1 and 2 wait on each other!'
          },
          choices: [
            {
              id: 'gr1_alt1_ok',
              label: 'indeg[1] drops from 2 to 1 (!== 0), so 1 is NOT enqueued and the active queue becomes empty',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Node 1 still waits on `2 -> 1`, while node 2 waits on `1 -> 2`.'
            },
            {
              id: 'gr1_alt1_bad',
              label: 'Node 1 is enqueued because node 0 finished',
              isCorrect: false,
              misconceptionFeedback: 'Node 1 also has incoming edge `2 -> 1`, so `indeg[1]` is `1`, not `0`.'
            }
          ],
          correctExplanation: 'Neither `1` nor `2` reaches indegree `0`, so the queue drains after `0`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 12,
          prompt: 'The `while` loop ends with `order = [0]` and `n = 3`. What does line 12 return?',
          stateSnapshot: {
            graphNodes: [
              { id: 'c0', label: '0 (emitted)', state: 'visited' },
              { id: 'c1', label: '1 (cycle)', state: 'error' },
              { id: 'c2', label: '2 (cycle)', state: 'error' }
            ],
            stackOrQueue: [],
            annotation: 'order.length (1) !== n (3) -> returns [] (impossible schedule).'
          },
          choices: [
            {
              id: 'gr1_alt2_ok',
              label: 'order.length (1) !== n (3), so it returns [] to report the cycle deadlock',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Returning `[]` signals that no valid topological ordering exists.'
            },
            {
              id: 'gr1_alt2_bad',
              label: 'Returns [0] as a partial schedule',
              isCorrect: false,
              misconceptionFeedback: 'Course Schedule II requires ordering ALL `n` courses or returning `[]`.'
            }
          ],
          correctExplanation: '`1 !== 3` detects the `1 <-> 2` cycle and returns `[]`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What happens if `prerequisites` is empty (`E = 0`) for `n = 3` courses?',
      choices: [
        {
          id: 'ec_gr1_ok',
          label: 'All 3 vertices start with `indeg[u] === 0`, enter `queue` in the initial loop, and are returned as `[0, 1, 2]`.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! With zero edges, every vertex is immediately ready.'
        },
        {
          id: 'ec_gr1_bad',
          label: 'The queue starts empty and returns `[]`.',
          isCorrect: false,
          misconceptionFeedback: 'Zero edges means `indeg` is `[0, 0, 0]`, so all 3 courses enter the queue!'
        }
      ],
      explanation: 'An edgeless graph is a valid DAG where every permutation of `0..n-1` is a valid topological sort.'
    },
    referenceInvariant: 'A vertex u enters the queue if and only if all of its prerequisites (and transitive ancestors) belong to DAG components that have already been emitted.',
    hintText: 'Decrement `indeg[v]` for each outgoing edge `u -> v` and enqueue `v` only when `indeg[v]` hits `0`.',
    reflectionPrompt: 'Why is Kahn’s algorithm able to detect cycles in `O(V + E)` time without maintaining recursion stack colors?',
    sourceId: 'src_opendsa_mit',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 17: SUBSETS II DUPLICATE PRUNING ====================
  {
    id: 'ex_recursion_backtracking_01',
    topicId: 'topic_recursion_backtracking',
    lessonId: 'les_recursion_backtracking_03',
    title: 'Trace: Backtracking Choose-Unchoose & Duplicate Sibling Pruning',
    rendererType: 'recursion_call_tree',
    objective: 'Trace `subsetsWithDup([1, 2, 2])` to verify why `i === start` allows the second `2` as a child (`[1, 2, 2]`) while `i > start` prunes it as a duplicate sibling (`[1, 2]`).',
    instructions: 'Follow `start`, loop index `i`, `path`, and the active recursion `callStack` at each decision point.',
    codeLines: [
      'export function subsetsWithDup(nums) {',
      '  nums.sort((a, b) => a - b);',
      '  const res = [], path = [];',
      '  function dfs(start) {',
      '    res.push([...path]);',
      '    for (let i = start; i < nums.length; i += 1) {',
      '      if (i > start && nums[i] === nums[i - 1]) continue;',
      '      path.push(nums[i]);',
      '      dfs(i + 1);',
      '      path.pop();',
      '    }',
      '  }',
      '  dfs(0);',
      '  return res;',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Child Extension vs. Sibling Pruning on [1, 2, 2]',
      inputLabel: 'nums = [1, 2, 2]',
      edgeCaseNote: 'Watch `i = 2` be ACCEPTED when `start = 2` (child) and PRUNED when `start = 1` or `start = 0` (sibling).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 7,
          prompt: 'From `dfs(0)` we pick `i = 0 (1)`, from `dfs(1)` we pick `i = 1 (first 2)`, and enter `dfs(2)` with `path = [1, 2]`. At `i = 2` (`nums[2] = 2 === nums[1]`), why does line 7 allow `nums[2]` to be pushed?',
          stateSnapshot: {
            array: [1, 2, 2],
            pointers: { start: 2, i: 2 },
            highlightedIndices: [0, 1, 2],
            callStack: ['dfs(0) path=[1]', 'dfs(1) path=[1,2]', 'dfs(2) i=2===start -> push 2'],
            annotation: 'At dfs(2), start = 2 and i = 2. Since i > start (2 > 2) is false, [1, 2, 2] is formed!'
          },
          choices: [
            {
              id: 'rb1_c1_ok',
              label: 'Because i === start (2 === 2), so i > start is false: we are placing the second 2 into a new deeper slot to form [1, 2, 2]',
              isCorrect: true,
              misconceptionFeedback: 'Correct! `i === start` means this is the very first candidate tested at depth `start = 2`.'
            },
            {
              id: 'rb1_c1_bad',
              label: 'Because nums[2] !== nums[1]',
              isCorrect: false,
              misconceptionFeedback: '`nums[2]` and `nums[1]` are both `2`; it is `i > start` being `false` that permits it.'
            }
          ],
          correctExplanation: 'When `i === start`, we are extending `[1, 2]` to `[1, 2, 2]`, which is a unique 3-element subset.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'After `[1, 2, 2]` is recorded, `path.pop()` twice restores `path = [1]` back inside `dfs(1)` (`start = 1`). Now the loop in `dfs(1)` increments to `i = 2`. What happens at line 7?',
          stateSnapshot: {
            array: [1, 2, 2],
            pointers: { start: 1, i: 2 },
            highlightedIndices: [1, 2],
            callStack: ['dfs(0) path=[1]', 'dfs(1) start=1, i=2 -> PRUNED'],
            annotation: 'In dfs(1), i > start (2 > 1) and nums[2] === nums[1] (2 === 2) -> continue!'
          },
          choices: [
            {
              id: 'rb1_c2_ok',
              label: 'i > start (2 > 1) and nums[2] === nums[1] are both true, so continue skips i = 2 and prevents a duplicate [1, 2] subset',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Choosing `nums[2]` into slot 2 right after unchoosing `nums[1]` from slot 2 would create a second `[1, 2]`.'
            },
            {
              id: 'rb1_c2_bad',
              label: 'It pushes nums[2] to create [1, 2] a second time',
              isCorrect: false,
              misconceptionFeedback: 'Line 7’s `continue` skips `path.push(nums[2])` when `i > start && nums[i] === nums[i - 1]`.'
            }
          ],
          correctExplanation: 'Sibling pruning skips `i = 2` at `start = 1`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 7,
          prompt: 'Back in `dfs(0)` (`start = 0, path = []`), `i = 1` explores `[2]` and `[2, 2]` and pops back to `path = []`. When the root loop reaches `i = 2`, what happens?',
          stateSnapshot: {
            array: [1, 2, 2],
            pointers: { start: 0, i: 2 },
            highlightedIndices: [1, 2],
            callStack: ['dfs(0) start=0, i=2 -> PRUNED'],
            annotation: 'At root start = 0, i = 2 has i > start (2 > 0) and nums[2] === nums[1] -> skipped!'
          },
          choices: [
            {
              id: 'rb1_c3_ok',
              label: 'Skipped by continue (2 > 0 and nums[2] === nums[1]), returning all 6 unique subsets [[], [1], [1,2], [1,2,2], [2], [2,2]]',
              isCorrect: true,
              misconceptionFeedback: 'Exact! The `i = 1` branch already generated all subsets starting with `2`.'
            },
            {
              id: 'rb1_c3_bad',
              label: 'Explores [2] a second time at the root level',
              isCorrect: false,
              misconceptionFeedback: 'At `start = 0, i = 2`, `i > start` is `2 > 0` (`true`), so the duplicate root branch is pruned.'
            }
          ],
          correctExplanation: 'All 6 unique subsets are returned with zero duplicate branches.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'all_duplicates',
      label: 'All Identical Elements ([2, 2])',
      inputLabel: 'nums = [2, 2]',
      edgeCaseNote: 'Shows how `[2, 2]` produces `[], [2], [2, 2]` (3 subsets instead of 4).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 8,
          prompt: 'At `dfs(0)`, `[]` is recorded. `i = 0` pushes `2`, `dfs(1)` records `[2]`, and inside `dfs(1)` `i = 1` (`i === start`) pushes `2` to record `[2, 2]`. After popping back to `dfs(0)` (`start = 0`), what happens at `i = 1`?',
          stateSnapshot: {
            array: [2, 2],
            pointers: { start: 0, i: 1 },
            highlightedIndices: [0, 1],
            callStack: ['dfs(0) start=0, i=1 -> PRUNED'],
            annotation: 'start = 0, i = 1: i > start (1 > 0) and nums[1] === nums[0] -> skipped.'
          },
          choices: [
            {
              id: 'rb1_alt1_ok',
              label: 'i = 1 has i > start (1 > 0) and nums[1] === nums[0], so it is skipped',
              isCorrect: true,
              misconceptionFeedback: 'Correct! Only the first `2` is allowed to open a 1-element subset `[2]` from the root.'
            },
            {
              id: 'rb1_alt1_bad',
              label: 'i = 1 pushes 2 to form a second [2]',
              isCorrect: false,
              misconceptionFeedback: 'Line 7 skips `i = 1` because `1 > 0 && 2 === 2`.'
            }
          ],
          correctExplanation: '`i = 1` is pruned at `start = 0`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 14,
          prompt: 'What is the final returned `res` array for `subsetsWithDup([2, 2])`?',
          stateSnapshot: {
            array: [2, 2],
            pointers: { start: 0 },
            callStack: ['return [[], [2], [2, 2]]'],
            annotation: 'Returns 3 unique subsets: [], [2], [2, 2].'
          },
          choices: [
            {
              id: 'rb1_alt2_ok',
              label: '[[], [2], [2, 2]] (3 subsets corresponding to choosing 0, 1, or 2 copies of 2)',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! A multiset of `k` identical items has `k + 1` unique subsets.'
            },
            {
              id: 'rb1_alt2_bad',
              label: '[[], [2], [2], [2, 2]] (4 subsets)',
              isCorrect: false,
              misconceptionFeedback: 'The duplicate `[2]` was pruned at `start = 0, i = 1`.'
            }
          ],
          correctExplanation: '`[[], [2], [2, 2]]` is returned.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What bug occurs if you forget `nums.sort((a, b) => a - b)` on `nums = [2, 1, 2]`?',
      choices: [
        {
          id: 'ec_rb1_ok',
          label: 'The two `2`s are separated by `1`, so `nums[i] === nums[i - 1]` is false and duplicate subsets like `[2]` and `[2, 1]`/`[1, 2]` are generated.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Adjacent duplicate comparison `nums[i] === nums[i - 1]` relies completely on equal values sitting next to each other.'
        },
        {
          id: 'ec_rb1_bad',
          label: 'The algorithm throws a RangeError.',
          isCorrect: false,
          misconceptionFeedback: 'It runs without crashing, but fails to prune non-adjacent duplicates!'
        }
      ],
      explanation: 'Sorting brings identical elements together in `O(n log n)` so duplicate check is `O(1)`.'
    },
    referenceInvariant: 'Every call dfs(start) explores at most one branch per distinct value in nums[start..n-1], ensuring all generated paths represent distinct multisets.',
    hintText: 'Check `i > start` (not `i > 0`) before skipping `nums[i] === nums[i - 1]`.',
    reflectionPrompt: 'How does this exact same `if (i > start && candidates[i] === candidates[i - 1]) continue` line turn Combination Sum into Combination Sum II?',
    sourceId: 'src_tih_mit',
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  },

  // ==================== EXERCISE 18: COIN CHANGE DP TABLE ====================
  {
    id: 'ex_dynamic_programming_01',
    topicId: 'topic_dynamic_programming',
    lessonId: 'les_dynamic_programming_02',
    title: 'Trace: Coin Change Bottom-Up Tabulation vs. Greedy Failure',
    rendererType: 'dp_state_table',
    objective: 'Trace bottom-up Coin Change on `coins = [1, 3, 4], amount = 6` to prove how `dp[a] = Math.min(dp[a], 1 + dp[a - c])` discovers the 2-coin optimum (`3 + 3`) where greedy (`4 + 1 + 1`) fails.',
    instructions: 'Inspect the `dp[0..6]` state table at each subproblem amount `a` and choose the exact transition.',
    codeLines: [
      'export function coinChange(coins, amount) {',
      '  const dp = new Array(amount + 1).fill(Infinity);',
      '  dp[0] = 0;',
      '  for (let a = 1; a <= amount; a += 1) {',
      '    for (const c of coins) {',
      '      if (a - c >= 0) {',
      '        dp[a] = Math.min(dp[a], 1 + dp[a - c]);',
      '      }',
      '    }',
      '  }',
      '  return dp[amount] === Infinity ? -1 : dp[amount];',
      '}'
    ],
    primaryVariant: {
      variantId: 'primary',
      label: 'Non-Canonical Coins ([1, 3, 4] for amount = 6)',
      inputLabel: 'coins = [1, 3, 4], amount = 6',
      edgeCaseNote: 'Greedy picks `4 + 1 + 1` (3 coins), whereas DP compares `1 + dp[6 - 3]` (`2` coins) against `1 + dp[6 - 4]` (`3` coins).',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 7,
          prompt: 'With `dp[0] = 0`, we compute `dp[1] = 1` and `dp[2] = 2`. At `a = 3`, testing `c = 1` gives `1 + dp[2] = 3` and testing `c = 3` gives `1 + dp[0] = 1`. Why must `dp[0]` be initialized to `0`?',
          stateSnapshot: {
            dpTable: [0, 1, 2, 1, 'Inf', 'Inf', 'Inf'],
            pointers: { a: 3, c: 3 },
            annotation: 'At a = 3, coin c = 3 reads 1 + dp[3 - 3] = 1 + dp[0] = 1 coin.'
          },
          choices: [
            {
              id: 'dp1_c1_ok',
              label: 'Zero coins are needed to make amount 0, so any exact single-coin match a === c transitions to 1 + dp[0] = 1',
              isCorrect: true,
              misconceptionFeedback: 'Correct! `dp[0] = 0` anchors every single-coin base transition `1 + dp[c - c] = 1`.'
            },
            {
              id: 'dp1_c1_bad',
              label: 'dp[0] should be 1 because there is 1 way to make 0',
              isCorrect: false,
              misconceptionFeedback: '`1` is the base case for counting *combinations*, whereas here `dp[a]` stores minimum *coin count*.'
            }
          ],
          correctExplanation: '`dp[0] = 0` makes every single coin `c` evaluate `dp[c] = 1 + dp[0] = 1`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 7,
          prompt: 'At `a = 4`, coin `4` sets `dp[4] = 1 + dp[0] = 1`. Now at `a = 5`, what candidate values are compared across `coins = [1, 3, 4]`?',
          stateSnapshot: {
            dpTable: [0, 1, 2, 1, 1, 2, 'Inf'],
            pointers: { a: 5 },
            annotation: 'At a = 5: c=1 -> 1+dp[4]=2; c=3 -> 1+dp[2]=3; c=4 -> 1+dp[1]=2. Min is dp[5] = 2.'
          },
          choices: [
            {
              id: 'dp1_c2_ok',
              label: 'c = 1 gives 1 + dp[4] = 2, c = 3 gives 1 + dp[2] = 3, and c = 4 gives 1 + dp[1] = 2, setting dp[5] = 2',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Each coin `c` looks back `c` steps to an already-solved subproblem `dp[5 - c]`.'
            },
            {
              id: 'dp1_c2_bad',
              label: 'dp[5] stays Infinity because 5 is not in coins',
              isCorrect: false,
              misconceptionFeedback: 'Amount 5 is formed by combining one coin with a smaller solved remainder (`4 + 1` or `1 + 4`).'
            }
          ],
          correctExplanation: 'Comparing `2, 3, 2` sets `dp[5] = 2`.'
        },
        {
          stepIndex: 2,
          activeCodeLine: 7,
          prompt: 'Finally at `a = 6`, we test `c = 1` (`1 + dp[5] = 3`), `c = 3` (`1 + dp[3] = 2`), and `c = 4` (`1 + dp[2] = 3`). How does DP beat the greedy `c = 4` choice?',
          stateSnapshot: {
            dpTable: [0, 1, 2, 1, 1, 2, 2],
            pointers: { a: 6, bestCoin: 3 },
            annotation: 'At a = 6: c = 3 reads 1 + dp[3] = 2 (3 + 3), beating c = 4 which reads 1 + dp[2] = 3 (4 + 1 + 1)!'
          },
          choices: [
            {
              id: 'dp1_c3_ok',
              label: 'c = 3 transitions from dp[3] = 1 to give 1 + 1 = 2 coins, beating c = 4 which transitions from dp[2] = 2 to give 3 coins',
              isCorrect: true,
              misconceptionFeedback: 'Exact! Because `dp[3] = 1` and `dp[2] = 2` are already tabulated, `Math.min` picks `2` (`3 + 3`).'
            },
            {
              id: 'dp1_c3_bad',
              label: 'The loop skips c = 4 because 6 is not divisible by 4',
              isCorrect: false,
              misconceptionFeedback: 'The loop still tests `c = 4` (`1 + dp[2] = 3`), and `Math.min(2, 3)` retains `2`.'
            }
          ],
          correctExplanation: '`dp[6] = 2` is returned.'
        }
      ]
    },
    alternateVariant: {
      variantId: 'unreachable_amount',
      label: 'Unreachable Remainder (coins = [2], amount = 3)',
      inputLabel: 'coins = [2], amount = 3',
      edgeCaseNote: 'Verifies how `Infinity` propagates for impossible odd amounts and turns into `-1` at line 11.',
      steps: [
        {
          stepIndex: 0,
          activeCodeLine: 7,
          prompt: 'With `coins = [2]`, `dp[0] = 0`, `dp[1] = Infinity`, and `dp[2] = 1 + dp[0] = 1`. At `a = 3`, what does `1 + dp[3 - 2]` evaluate to?',
          stateSnapshot: {
            dpTable: [0, 'Inf', 1, 'Inf'],
            pointers: { a: 3, c: 2 },
            annotation: 'At a = 3, c = 2 reads 1 + dp[1] = 1 + Infinity = Infinity.'
          },
          choices: [
            {
              id: 'dp1_alt1_ok',
              label: '1 + dp[1] = 1 + Infinity = Infinity, so dp[3] remains Infinity',
              isCorrect: true,
              misconceptionFeedback: 'Correct! In JavaScript, `1 + Infinity` is `Infinity`, cleanly propagating unreachability.'
            },
            {
              id: 'dp1_alt1_bad',
              label: 'dp[3] becomes 2',
              isCorrect: false,
              misconceptionFeedback: '`dp[1]` is `Infinity` (cannot make 1 with coin 2), not `1`.'
            }
          ],
          correctExplanation: '`dp[3]` stays `Infinity`.'
        },
        {
          stepIndex: 1,
          activeCodeLine: 11,
          prompt: 'At line 11, `dp[3]` is `Infinity`. What does `coinChange([2], 3)` return?',
          stateSnapshot: {
            dpTable: [0, 'Inf', 1, 'Inf -> -1'],
            pointers: { returnVal: -1 },
            annotation: 'dp[3] === Infinity -> returns -1.'
          },
          choices: [
            {
              id: 'dp1_alt2_ok',
              label: 'Returns -1 because dp[amount] === Infinity',
              isCorrect: true,
              misconceptionFeedback: 'Spot on! Line 11 converts the `Infinity` sentinel to `-1`.'
            },
            {
              id: 'dp1_alt2_bad',
              label: 'Returns Infinity',
              isCorrect: false,
              misconceptionFeedback: 'The problem contract requires `-1` when the amount cannot be formed.'
            }
          ],
          correctExplanation: 'Line 11 returns `-1`.'
        }
      ]
    },
    edgeCaseCheck: {
      question: 'What does `coinChange(coins, 0)` return when `amount = 0`?',
      choices: [
        {
          id: 'ec_dp1_ok',
          label: 'Returns `0` immediately because `dp[0] = 0` and the outer loop `for (let a = 1; a <= 0; ...)` does not run.',
          isCorrect: true,
          misconceptionFeedback: 'Correct! Zero coins are needed to form amount 0.'
        },
        {
          id: 'ec_dp1_bad',
          label: 'Returns `-1`.',
          isCorrect: false,
          misconceptionFeedback: 'Amount 0 is always achievable using 0 coins.'
        }
      ],
      explanation: '`dp[0]` is initialized to `0`, which is not `Infinity`, so `0` is returned.'
    },
    referenceInvariant: 'Before computing dp[a], every smaller amount 0 <= r < a holds its exact minimum coin count (or Infinity if unreachable).',
    hintText: 'Initialize `dp[0] = 0` and `dp[1..amount] = Infinity`, then take `Math.min(dp[a], 1 + dp[a - c])` for every coin `c <= a`.',
    reflectionPrompt: 'How does changing the recurrence from `dp[a] = Math.min(dp[a], 1 + dp[a - c])` to `dp[a] += dp[a - c]` (with coins in the outer loop) solve Coin Change II (number of combinations)?',
    sourceId: 'src_opendsa_mit',
    packId: 'pack_expansion_batch3_v1',
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
    packId: 'pack_expansion_batch3_v1',
    reviewStatus: 'published',
    reviewRecord: STANDARD_REVIEW_RECORD
  };
}

export const EXPANSION_BATCH_3_PRACTICE = [
  // ==================== GRAPHS (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_graphs_01',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_01'],
    title: 'Number of Islands',
    externalSlug: 'number-of-islands',
    pattern: 'Grid Connected Component Flood-Fill',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Direct application of Lesson 1’s 4-directional grid flood-fill and visited sinking.',
    keyEdgeCase: 'Grid of all `"1"`s (1 island) or all `"0"`s (0 islands).'
  }),
  createPracticeItem({
    id: 'prac_graphs_02',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_01'],
    title: 'Max Area of Island',
    externalSlug: 'max-area-of-island',
    pattern: 'Component Size Aggregation DFS',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Extends flood-fill DFS to return `1 + sum(4 neighbor areas)` for each connected component.',
    keyEdgeCase: 'Grid with zero land cells must return `0`.'
  }),
  createPracticeItem({
    id: 'prac_graphs_03',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_01'],
    title: 'Clone Graph',
    externalSlug: 'clone-graph',
    pattern: 'Hash Map Old-to-Clone Graph Traversal',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Tests registering `map.set(node, clone)` BEFORE recursing on neighbors to avoid infinite cycle loops.',
    keyEdgeCase: 'Null input graph (`node === null`) or single node with no neighbors.'
  }),
  createPracticeItem({
    id: 'prac_graphs_04',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_02'],
    title: 'Rotting Oranges',
    externalSlug: 'rotting-oranges',
    pattern: 'Multi-Source Level-Wave BFS',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly implements Lesson 2’s simultaneous multi-source BFS wave and `fresh` counter.',
    keyEdgeCase: 'Grid with `fresh === 0` initially (returns `0`) or an isolated fresh orange blocked by empty cells (returns `-1`).'
  }),
  createPracticeItem({
    id: 'prac_graphs_05',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_02'],
    title: 'Pacific Atlantic Water Flow',
    externalSlug: 'pacific-atlantic-water-flow',
    pattern: 'Reverse Border Multi-Source Traversal',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    whyRecommended: 'Applies reverse uphill traversal (`nextHeight >= currHeight`) from both ocean borders and intersects their visited sets.',
    keyEdgeCase: 'Equal-height plateaus where water flows horizontally across flat neighbors.'
  }),
  createPracticeItem({
    id: 'prac_graphs_06',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_03'],
    title: 'Course Schedule',
    externalSlug: 'course-schedule',
    pattern: 'Directed Cycle Detection / Kahn Indegree',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Tests Kahn’s zero-indegree queue or 3-color DFS cycle detection on prerequisite pairs.',
    keyEdgeCase: 'Disconnected cycle (`1 <-> 2`) separate from a valid chain (`0 -> 3`).'
  }),
  createPracticeItem({
    id: 'prac_graphs_07',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_03'],
    title: 'Course Schedule II',
    externalSlug: 'course-schedule-ii',
    pattern: 'Topological Ordering Output (Kahn BFS)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Direct implementation of Exercise 16: emit vertices in Kahn queue order and return `[]` if `order.length < numCourses`.',
    keyEdgeCase: 'Zero prerequisites (`prerequisites = []`) where `[0..numCourses-1]` is immediately valid.'
  }),
  createPracticeItem({
    id: 'prac_graphs_08',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_04'],
    title: 'Redundant Connection',
    externalSlug: 'redundant-connection',
    pattern: 'Disjoint Set Union Cycle Edge Detection',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies Lesson 4’s Union-Find `find(u) === find(v)` cycle check.',
    keyEdgeCase: '1-indexed vertices `1..n` requiring `parent` array of length `n + 1`.'
  }),
  createPracticeItem({
    id: 'prac_graphs_09',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_04'],
    title: 'Network Delay Time',
    externalSlug: 'network-delay-time',
    pattern: 'Single-Source Dijkstra Min-Heap',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    whyRecommended: 'Practices Dijkstra edge relaxation `dist[u] + w < dist[v]` and returning `Math.max(...dist.slice(1))`.',
    keyEdgeCase: 'Unreachable node leaving `dist[v] === Infinity` (must return `-1`).'
  }),
  createPracticeItem({
    id: 'prac_graphs_10',
    topicId: 'topic_graphs',
    lessonIds: ['les_graphs_04'],
    title: 'Cheapest Flights Within K Stops',
    externalSlug: 'cheapest-flights-within-k-stops',
    pattern: 'Hop-Bounded Bellman-Ford / Layered BFS',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    whyRecommended: 'Contrasts standard Dijkstra with `K + 1` rounds of cloned-array Bellman-Ford relaxation.',
    keyEdgeCase: 'A longer-cost 1-stop path that unlocks a valid `<= K`-stop destination when a cheaper 3-stop path exceeds `K`.'
  }),

  // ==================== RECURSION & BACKTRACKING (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_recursion_backtracking_01',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_01'],
    title: 'Subsets',
    externalSlug: 'subsets',
    pattern: 'Power Set Choose-Explore-Unchoose Tree',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Foundational template for recording `[...path]` at every node and restoring `path.pop()` on return.',
    keyEdgeCase: 'Always include the empty subset `[]` recorded at the root call `dfs(0)`.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_02',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_03'],
    title: 'Subsets II',
    externalSlug: 'subsets-ii',
    pattern: 'Sorted Multiset Sibling Pruning (`i > start`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Direct implementation of Lesson 3 and Exercise 17 (`nums.sort` + `if (i > start && nums[i] === nums[i - 1]) continue`).',
    keyEdgeCase: 'Unsorted input `[4, 4, 4, 1, 4]` which fails unless sorted numerically before `dfs(0)`.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_03',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_01', 'les_recursion_backtracking_02'],
    title: 'Permutations',
    externalSlug: 'permutations',
    pattern: 'Used-Mask Ordering Tree',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Contrasts `used[i]` full-range looping (`0..n-1`) against `start`-index subset loops.',
    keyEdgeCase: 'Remembering to reset `used[i] = false` alongside `path.pop()` after each recursive call.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_04',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_02'],
    title: 'Combination Sum',
    externalSlug: 'combination-sum',
    pattern: 'Unbounded Candidate Reuse (`dfs(i, rem - c)`)',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly applies Lesson 2’s `dfs(i, rem - candidates[i])` self-index reuse without permutation duplicates.',
    keyEdgeCase: 'Target smaller than all candidates returns `[]` cleanly via `rem < 0` pruning.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_05',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_02', 'les_recursion_backtracking_03'],
    title: 'Combination Sum II',
    externalSlug: 'combination-sum-ii',
    pattern: 'Single-Use Multiset Combination Pruning',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Combines single-use `dfs(i + 1)` progression with `i > start && candidates[i] === candidates[i - 1]` sibling pruning.',
    keyEdgeCase: 'Input with many duplicate `1`s (`[1,1,1,1,1...]`) that TLEs without `i > start` pruning.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_06',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_04'],
    title: 'Word Search',
    externalSlug: 'word-search',
    pattern: 'Reversible 2D Grid Path Backtracking',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly implements Lesson 4’s temporary `board[r][c] = "#"` marking and `board[r][c] = saved` restoration.',
    keyEdgeCase: '1x1 board `[["a"]]` with `word = "a"` where no neighbor step is needed.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_07',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_03'],
    title: 'Palindrome Partitioning',
    externalSlug: 'palindrome-partitioning',
    pattern: 'Prefix Cut-Point Palindrome Pruning',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Practices pruning invalid prefix cuts `s[start..end]` before recursing on `end + 1`.',
    keyEdgeCase: 'Single-character cuts are always palindromes, so every string has at least one partition.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_08',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_02'],
    title: 'Letter Combinations of a Phone Number',
    externalSlug: 'letter-combinations-of-a-phone-number',
    pattern: 'Cartesian Position-by-Position Branching',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Clean multi-way branching tree where depth `idx` iterates over letters mapped to `digits[idx]`.',
    keyEdgeCase: 'Empty string `digits = ""` must return `[]`, NOT `[""]`.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_09',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_04'],
    title: 'Generate Parentheses',
    externalSlug: 'generate-parentheses',
    pattern: 'Prefix Validity Balance Pruning (`close < open`)',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Demonstrates maintaining prefix validity invariants (`open < n` and `close < open`) during string generation.',
    keyEdgeCase: 'Never branch on `")"` when `close === open`.'
  }),
  createPracticeItem({
    id: 'prac_recursion_backtracking_10',
    topicId: 'topic_recursion_backtracking',
    lessonIds: ['les_recursion_backtracking_04'],
    title: 'N-Queens',
    externalSlug: 'n-queens',
    pattern: 'Row-by-Row Constraint Set Backtracking (`c`, `r-c`, `r+c`)',
    difficulty: 'Hard',
    estimatedMinutes: 35,
    whyRecommended: 'Capstone backtracking problem using `cols`, `diag1 (r - c)`, and `diag2 (r + c)` sets for O(1) pruning.',
    keyEdgeCase: '`n = 2` or `n = 3` where zero valid board configurations exist (returns `[]`).'
  }),

  // ==================== DYNAMIC PROGRAMMING (10 PUBLISHED) ====================
  createPracticeItem({
    id: 'prac_dynamic_programming_01',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_01'],
    title: 'Climbing Stairs',
    externalSlug: 'climbing-stairs',
    pattern: '1D Rolling Fibonacci Recurrence',
    difficulty: 'Easy',
    estimatedMinutes: 15,
    whyRecommended: 'Entry point for converting an `O(2^n)` recursive tree into an `O(n)` time, `O(1)` space rolling two-variable loop.',
    keyEdgeCase: '`n = 1` returns `1` without entering a loop starting at `2`.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_02',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_01'],
    title: 'House Robber',
    externalSlug: 'house-robber',
    pattern: 'Include-vs-Skip 1D Rolling Recurrence',
    difficulty: 'Medium',
    estimatedMinutes: 20,
    whyRecommended: 'Directly applies Lesson 1’s `curr = Math.max(prev1, prev2 + x)` transition.',
    keyEdgeCase: '`[2, 1, 1, 2]` where the optimal choice skips two consecutive middle houses.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_03',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_01'],
    title: 'House Robber II',
    externalSlug: 'house-robber-ii',
    pattern: 'Circular Constraint Case-Split Reduction',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Reduces circular adjacency (`0` and `n - 1`) to `Math.max(robLinear(0..n-2), robLinear(1..n-1))`.',
    keyEdgeCase: 'Single house `nums = [5]` where both `0..n-2` and `1..n-1` slices would be empty without a length-1 guard!'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_04',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_02'],
    title: 'Coin Change',
    externalSlug: 'coin-change',
    pattern: 'Unbounded Knapsack Min-Count Table',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Direct implementation of Lesson 2 and Exercise 18 (`dp[a] = Math.min(dp[a], 1 + dp[a - c])`).',
    keyEdgeCase: '`amount = 0` (returns `0`) and unreachable amounts like `coins = [2], amount = 3` (returns `-1`).'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_05',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_03'],
    title: 'Longest Increasing Subsequence',
    externalSlug: 'longest-increasing-subsequence',
    pattern: 'Ending-At-Index Prefix Scan DP',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly implements Lesson 3’s `dp[i] = Math.max(dp[i], dp[j] + 1)` over `j < i` with `nums[j] < nums[i]`.',
    keyEdgeCase: 'Longest subsequence ending before the last element (`[1, 3, 6, 7, 9, 4, 10, 5, 6]`), requiring `Math.max(...dp)`.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_06',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_03'],
    title: 'Word Break',
    externalSlug: 'word-break',
    pattern: 'Prefix Split-Point Reachability DP',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Applies prefix split transitions `dp[i] = dp[j] && wordSet.has(s.slice(j, i))` with `dp[0] = true`.',
    keyEdgeCase: 'Overlapping dictionary prefixes like `s = "aaaaaaa", wordDict = ["aaaa", "aaa"]` where greedy matching fails.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_07',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_02'],
    title: 'Partition Equal Subset Sum',
    externalSlug: 'partition-equal-subset-sum',
    pattern: '0/1 Knapsack Backward Capacity Loop',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Tests Lesson 2’s backward inner loop `for (let s = target; s >= num; s--)` so each number is used at most once.',
    keyEdgeCase: 'Odd total sum (`totalSum % 2 !== 0`) must return `false` immediately.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_08',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_04'],
    title: 'Unique Paths',
    externalSlug: 'unique-paths',
    pattern: '2D Grid Path Count Tabulation',
    difficulty: 'Medium',
    estimatedMinutes: 15,
    whyRecommended: 'Clean introduction to 2D grid transitions `dp[r][c] = dp[r - 1][c] + dp[r][c - 1]` and 1D row rolling compression.',
    keyEdgeCase: '`m = 1` or `n = 1` single-row/single-column grid has exactly `1` path.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_09',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_04'],
    title: 'Longest Common Subsequence',
    externalSlug: 'longest-common-subsequence',
    pattern: 'Two-Sequence Prefix Alignment Matrix',
    difficulty: 'Medium',
    estimatedMinutes: 25,
    whyRecommended: 'Directly implements Lesson 4’s `(m + 1) x (n + 1)` matrix with diagonal match `1 + dp[i - 1][j - 1]`.',
    keyEdgeCase: 'Repeated characters like `"bsbininm"` and `"jmjkbkjkv"` where diagonal transition prevents double-counting.'
  }),
  createPracticeItem({
    id: 'prac_dynamic_programming_10',
    topicId: 'topic_dynamic_programming',
    lessonIds: ['les_dynamic_programming_04'],
    title: 'Edit Distance',
    externalSlug: 'edit-distance',
    pattern: 'Levenshtein Insert/Delete/Replace Matrix',
    difficulty: 'Medium',
    estimatedMinutes: 30,
    whyRecommended: 'Capstone 2D alignment problem combining base-row/column deletion/insertion costs with 3-way edit transitions.',
    keyEdgeCase: 'One or both strings empty (`word1 = ""`), handled by `dp[i][0] = i` and `dp[0][j] = j` base borders.'
  })
];
