import { PRACTICALS } from './practicals';
import type { VivaQuestion } from '../practice/types';

/**
 * The viva question bank.
 *
 * Viva answers are not judged automatically: the student reads the expected
 * answer and marks whether they understood it. The service only reports which
 * keywords of the expected answer their own text contained.
 */

export const VIVA_QUESTIONS: VivaQuestion[] = [
  // --- Algorithm fundamentals -------------------------------------------------
  {
    id: 'viva-what-is-algorithm',
    question: 'What is an algorithm, and what properties must it have?',
    expectedAnswer:
      'An algorithm is a finite, unambiguous sequence of effective steps that solves a class of problems. It must terminate, every step must be precisely defined, every step must be executable, and it must work for all valid inputs of the problem.',
    keywords: ['finite', 'unambiguous', 'effective', 'steps', 'terminate'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-basic-operation',
    question: 'What is the "basic operation" of an algorithm and why does it matter?',
    expectedAnswer:
      'The basic operation is the operation that contributes most to the total running time, usually an assignment or a comparison in the innermost loop. Counting its executions as a function of the input size gives the order of growth of the algorithm.',
    keywords: ['basic operation', 'running time', 'dominates', 'comparisons', 'assignments'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-design-techniques',
    question: 'Name the classical algorithm design techniques and describe each in one line.',
    expectedAnswer:
      'Greedy (take the locally best choice), divide and conquer (split into subproblems, solve and combine), dynamic programming (solve overlapping subproblems once and reuse the results), backtracking (explore and undo), and branch and bound (explore with an optimistic bound that prunes).',
    keywords: ['greedy', 'divide and conquer', 'dynamic programming', 'backtracking', 'branch and bound'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-optimal-substructure',
    question: 'What is the optimal substructure property?',
    expectedAnswer:
      'A problem has optimal substructure when an optimal solution consists of optimal solutions of its subproblems. It is the property that makes both greedy algorithms and dynamic programming applicable.',
    keywords: ['optimal solution', 'subproblems', 'optimal', 'property'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-overlapping-subproblems',
    question: 'What are overlapping subproblems and why do they matter?',
    expectedAnswer:
      'Overlapping subproblems occur when the naive recursive solution solves the same subproblem again and again. They matter because dynamic programming stores the result of every subproblem and reuses it, turning an exponential recursion into a polynomial one.',
    keywords: ['same subproblem', 'again and again', 'store', 'reuse', 'exponential'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-space-complexity',
    question: 'What does the space complexity of an algorithm measure?',
    expectedAnswer:
      'It measures the extra memory the algorithm needs beyond the input — auxiliary space such as the recursion stack, temporary arrays and counters. It is separated from the total space, which also includes the input itself.',
    keywords: ['extra memory', 'auxiliary', 'recursion stack', 'input'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-master-theorem',
    question: 'When can the Master Theorem be applied?',
    expectedAnswer:
      'When the recurrence has the form T(n) = aT(n/b) + f(n) with a constant number of subproblems of the same size. It gives Θ(n^log_b(a)) when f(n) is smaller, Θ(n^log_b(a)·log n) when it is comparable and Θ(f(n)) when it is larger.',
    keywords: ['recurrence', 'aT(n/b)', 'same size', 'log'],
    topic: 'divide-and-conquer',
    category: 'divide-and-conquer',
  },
  {
    id: 'viva-stable-sort',
    question: 'What does it mean that a sorting algorithm is stable?',
    expectedAnswer:
      'A stable sort keeps the relative order of equal elements. It matters when the records carry a secondary key — for example sorting by name and then stably by class.',
    keywords: ['relative order', 'equal elements', 'secondary key'],
    topic: 'sorting',
    category: 'sorting',
  },
  {
    id: 'viva-adaptive-sort',
    question: 'Which sorting algorithms are adaptive and what does that mean?',
    expectedAnswer:
      'Insertion Sort, Shell Sort and Timsort are adaptive: they detect the existing order and run faster on nearly sorted data. Insertion Sort needs only n - 1 comparisons on a sorted array, so it runs in Θ(n) instead of Θ(n²).',
    keywords: ['insertion', 'nearly sorted', 'n - 1 comparisons', 'faster'],
    topic: 'sorting',
    category: 'sorting',
  },
  {
    id: 'viva-binary-search-precondition',
    question: 'Why does Binary Search require a sorted array?',
    expectedAnswer:
      'Binary Search eliminates half of the remaining search space after each comparison. This decision is only valid when the elements are ordered.',
    keywords: ['half', 'ordered', 'sorted', 'comparison'],
    topic: 'binary-search',
    category: 'searching',
  },
  {
    id: 'viva-binary-search-variants',
    question: 'What is the difference between the first-occurrence and the last-occurrence variant of Binary Search?',
    expectedAnswer:
      'Both use the same halving idea. When a match is found, the first-occurrence variant continues the search in the left half, while the last-occurrence variant continues in the right half — both need one extra logarithmic pass.',
    keywords: ['first', 'last', 'left half', 'right half', 'logarithmic'],
    topic: 'binary-search',
    category: 'searching',
  },
  {
    id: 'viva-hashing-advantage',
    question: 'What advantage does hashing give over a sorted array for searching?',
    expectedAnswer:
      'Hashing finds a key in expected constant time instead of O(log n), and it supports fast insertion and deletion. The price is that the data must be kept in a hash table and the order of the elements is lost.',
    keywords: ['constant time', 'O(1)', 'hash table', 'order'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-tsp-np-hard',
    question: 'Why is the Travelling Salesperson Problem solved with branch and bound?',
    expectedAnswer:
      'The problem is NP-hard, so no polynomial-time algorithm is known. Branch and bound explores partial tours and prunes a branch as soon as an optimistic bound shows that it cannot beat the best tour found so far.',
    keywords: ['NP-hard', 'branch and bound', 'prune', 'bound', 'partial tour'],
    topic: 'tsp',
    category: 'branch-and-bound',
  },
  {
    id: 'viva-dijkstra-negative',
    question: 'Why does Dijkstra fail with negative edge weights?',
    expectedAnswer:
      'Dijkstra finalises a vertex as soon as it has the smallest known distance. That is only valid without negative weights, because a later path through a negative edge could still be cheaper.',
    keywords: ['negative', 'finalises', 'smallest distance', 'cheaper'],
    topic: 'dijkstra',
    category: 'graph',
  },
  {
    id: 'viva-bfs-vs-dfs',
    question: 'When do you use BFS and when do you use DFS?',
    expectedAnswer:
      'BFS explores level by level and finds the shortest paths in an unweighted graph. DFS follows one branch as deep as possible and is used for cycle detection, topological sorting and connected components.',
    keywords: ['level', 'shortest path', 'depth', 'cycle detection'],
    topic: 'bfs',
    category: 'graph',
  },
  {
    id: 'viva-huffman',
    question: 'Why does Huffman coding assign the shortest codes to the most frequent symbols?',
    expectedAnswer:
      'A Huffman code is a prefix code whose average length is minimal. The greedy choice — merging the two least frequent symbols first — follows the sibling property of the two least frequent leaves and yields a minimum weighted path length.',
    keywords: ['prefix code', 'average length', 'minimal', 'least frequent', 'greedy'],
    topic: 'huffman-coding',
    category: 'greedy',
  },
  {
    id: 'viva-knapsack-greedy-fail',
    question: 'Give a counterexample that shows the greedy method failing for the 0/1 knapsack problem.',
    expectedAnswer:
      'Items (weight 10, value 60), (weight 20, value 100) and (weight 30, value 120) with capacity 50: the greedy method takes the 120/30 item, while the optimum is the 100 + 60 items with value 160.',
    keywords: ['60', '100', '120', 'capacity', '160'],
    topic: 'knapsack',
    category: 'greedy',
  },
  {
    id: 'viva-lcs-reconstruction',
    question: 'How is the length of the longest common subsequence computed?',
    expectedAnswer:
      'With a table where dp[i][j] is the LCS length of the first i and the first j characters. If the last characters match, the value is dp[i-1][j-1] + 1, otherwise it is the larger of dp[i-1][j] and dp[i][j-1]. The table is filled in O(mn) time.',
    keywords: ['table', 'dp', 'match', 'otherwise', 'O(mn)'],
    topic: 'lcs',
    category: 'dynamic-programming',
  },
  {
    id: 'viva-kmp-lps',
    question: 'What does the LPS array of the Knuth-Morris-Pratt algorithm store?',
    expectedAnswer:
      'For every prefix of the pattern it stores the length of the longest proper prefix that is also a suffix. After a mismatch it tells how much of the pattern still matches, so the text pointer never has to move back.',
    keywords: ['longest', 'prefix', 'suffix', 'never moves back'],
    topic: 'kmp',
    category: 'string-matching',
  },
  {
    id: 'viva-rabin-karp-hash',
    question: 'Why can Rabin-Karp still be slow even though it uses hashing?',
    expectedAnswer:
      'Because a hash match is only a candidate: the characters still have to be compared. In the worst case many windows produce the same hash and every one of them is verified, which degrades the running time to O(nm).',
    keywords: ['candidate', 'verify', 'characters', 'worst case', 'O(nm)'],
    topic: 'rabin-karp',
    category: 'string-matching',
  },
  {
    id: 'viva-kruskal-cycle',
    question: 'How does Kruskal avoid adding an edge that would create a cycle?',
    expectedAnswer:
      'With a union-find structure: the edge is only added when the two endpoints still belong to different connected components.',
    keywords: ['union-find', 'different', 'components', 'cycle'],
    topic: 'kruskal',
    category: 'greedy',
  },
  {
    id: 'viva-prim-vs-kruskal',
    question: 'What is the main difference between Prim and Kruskal?',
    expectedAnswer:
      'Kruskal sorts all edges of the graph and adds the cheapest ones that do not create a cycle, so it builds the tree from several components. Prim grows a single tree and always adds the cheapest edge that leaves the current tree.',
    keywords: ['sorts all edges', 'components', 'single tree', 'cheapest edge'],
    topic: 'prim',
    category: 'graph',
  },
  {
    id: 'viva-activity-selection',
    question: 'Which greedy rule solves the activity selection problem and why is it correct?',
    expectedAnswer:
      'Always choose the compatible activity that finishes earliest. It leaves as much time as possible for the remaining activities, so by an exchange argument the greedy choice can be part of an optimal solution.',
    keywords: ['finishes earliest', 'leaves time', 'exchange argument', 'optimal'],
    topic: 'activity-selection',
    category: 'greedy',
  },
  {
    id: 'viva-floyd-warshall-state',
    question: 'What does the state of the Floyd-Warshall algorithm represent?',
    expectedAnswer:
      'After processing the vertex k, the table holds the shortest distances in which only the vertices 0 … k may be used as intermediate vertices. The recurrence combines a path through k with the two subpaths.',
    keywords: ['intermediate vertices', 'table', 'recurrence', 'k'],
    topic: 'floyd-warshall',
    category: 'dynamic-programming',
  },
  {
    id: 'viva-branch-bound-vs-backtracking',
    question: 'How does branch and bound differ from plain backtracking?',
    expectedAnswer:
      'Backtracking prunes only when a partial solution violates a constraint. Branch and bound additionally computes an optimistic bound on the best possible completion and prunes a branch when that bound can no longer beat the best solution found so far.',
    keywords: ['bound', 'optimistic', 'prune', 'best solution'],
    topic: 'branch-and-bound',
    category: 'branch-and-bound',
  },
  {
    id: 'viva-mcq-reading',
    question: 'What is the difference between an algorithm and a program?',
    expectedAnswer:
      'An algorithm is the abstract, language-independent sequence of steps; a program is one concrete implementation of it in a programming language. The same algorithm can be implemented in many languages, and a program can also contain implementation details that are not part of the algorithm.',
    keywords: ['abstract', 'steps', 'implementation', 'language'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
  {
    id: 'viva-edge-cases',
    question: 'Which edge cases should always be tested for a searching or sorting algorithm?',
    expectedAnswer:
      'The empty input, a single element, an input that is already sorted (or reverse sorted), duplicates, the target at the beginning, in the middle and at the end, and a target that is not present at all.',
    keywords: ['empty', 'single element', 'duplicates', 'not present', 'beginning'],
    topic: 'fundamentals',
    category: 'fundamentals',
  },
];

/** The viva questions of a topic, or all of them. */
export function getVivaQuestions(topic?: string): VivaQuestion[] {
  return topic ? VIVA_QUESTIONS.filter((question) => question.topic === topic) : [...VIVA_QUESTIONS];
}

/** Picks a deterministic pseudo random viva question. */
export function pickRandomVivaQuestion(seed: number, topic?: string): VivaQuestion | undefined {
  const pool = getVivaQuestions(topic);
  if (pool.length === 0) {
    return undefined;
  }
  const index = Math.abs(seed) % pool.length;
  return pool[index];
}

/** The viva questions that belong to a practical exercise. */
export function getVivaQuestionsForPractical(practicalId: string): VivaQuestion[] {
  const practical = PRACTICALS.find((entry) => entry.id === practicalId);
  if (!practical) {
    return [];
  }

  const global = VIVA_QUESTIONS.filter((question) => question.topic === practical.category);
  return [...practical.vivaQuestions, ...global];
}
