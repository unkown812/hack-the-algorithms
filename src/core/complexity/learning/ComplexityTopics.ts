/**
 * Time Complexity Learning Module — reviewed educational content.
 * Offline-first: this is static data used by the webview learning tab.
 * Examples mirror the C code the students see in the Code Learning module.
 */

export interface CodeExample {
  title: string;
  language: 'C';
  code: string;
  /** Step-by-step counting walk-through tied to the code above. */
  analysis: string[];
  result: string;
}

export interface ComplexityTopic {
  id: string;
  title: string;
  summary: string;
  /** Optional interactive example the component can render + count. */
  example?: CodeExample;
  keyPoints: string[];
}

export const TIME_COMPLEXITY_TOPICS: ComplexityTopic[] = [
  {
    id: 'intro',
    title: '1. Introduction to Time Complexity',
    summary: 'Time complexity describes how the amount of elementary work grows as the input size n grows. It is not measured in seconds: hardware, compiler and load change seconds, but the execution-count curve stays the same for the same algorithm.',
    keyPoints: [
      'We count the dominant elementary operations (comparisons, swaps, loops) instead of milliseconds.',
      'Big-O ignores constant factors and lower-order terms: 3n² + 5n + 20 → O(n²).',
      'Constant factors still matter in practice: for small inputs a tuned O(n log n) implementation can beat an O(n) one with huge constants.',
    ],
  },
  {
    id: 'frequency-count',
    title: '2. Frequency Count Method',
    summary: 'The frequency count method assigns a count to every statement of the program: pe = frequency estimate. The total count for an input of size n becomes a table and the fastest-growing term gives the time complexity.',
    example: {
      title: 'Frequency count for a single loop',
      language: 'C',
      code: 'for (i = 0; i < n; i++) {\n    sum = sum + arr[i];\n}',
      analysis: [
        'Statement `for (i = 0; …)` executes once → count 1.',
        'Condition `i < n` is evaluated n + 1 times (n successes, 1 final failure) → count n + 1.',
        'Body (`i++`, `sum = sum + arr[i]`) executes n times → count 2n.',
        'Total = 1 + (n + 1) + 2n = 3n + 2.',
      ],
      result: 'Total work is 3n + 2 → dominant term 3n → time complexity O(n).',
    },
    keyPoints: [
      'The condition is evaluated one time more than the body (the final failing check).',
      'Do not forget the final false evaluation of the loop condition.',
      'The constant factor (3) is dropped when reporting O(n).',
    ],
  },
  {
    id: 'constant-operations',
    title: '3. Constant-Time Operations',
    summary: 'Operations whose cost does not depend on n are O(1): array indexing, scalar arithmetic, assignment, comparison, function call overhead.',
    keyPoints: [
      'arr[42] takes constant time because the offset is computed once.',
      'A fixed number of O(1) statements is still O(1).',
      'Beware: printf of the whole array is O(n), not O(1).',
    ],
  },
  {
    id: 'single-loops',
    title: '4. Single Loops',
    summary: 'A loop whose repetition count is linear in n contributes one factor of n to the total work.',
    example: {
      title: 'Single linear loop',
      language: 'C',
      code: 'for (int i = 0; i < n; i++) {\n    printf("%d", i);\n}',
      analysis: [
        'Initialisation i = 0: O(1).',
        'Condition checks i < n: n + 1 evaluations.',
        'Increments i++: n executions.',
        'Loop body printf: n executions.',
      ],
      result: 'Overall complexity: O(n).',
    },
    keyPoints: [
      'Count body executions plus the extra failing condition check.',
      'Loop bounds like `i < n/2` still give O(n) — linear with a smaller slope.',
    ],
  },
  {
    id: 'nested-loops',
    title: '5. Nested Loops',
    summary: 'When an inner loop runs a number of times linear in n and the outer loop is also linear in n, the work multiplies → n × n = n².',
    example: {
      title: 'Two-level nested loop',
      language: 'C',
      code: 'for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        printf("%d", i + j);\n    }\n}',
      analysis: [
        'Outer loop executes n times.',
        'Inner loop executes n times for each outer iteration.',
        'Total inner iterations: n × n = n².',
      ],
      result: 'Overall complexity: O(n²).',
    },
    keyPoints: [
      'Nested loop cost multiplies, sequential loop cost adds.',
      'Truncated nesting (j = i + 1 …) still yields Θ(n²) but with half the constants (e.g. bubble, selection sort).',
    ],
  },
  {
    id: 'consecutive-loops',
    title: '6. Consecutive Loops',
    summary: 'Two sequential linear loops cost n + n = 2n → O(n). Additive work takes the dominant term only.',
    example: {
      title: 'Sequential loops',
      language: 'C',
      code: 'for (int i = 0; i < n; i++) {\n    printf("%d", i);            // O(n)\n}\nfor (int j = 0; j < 2 * n; j++) {\n    printf("%d", j);            // O(n), linear again\n}',
      analysis: [
        'First loop: n body executions.',
        'Second loop: 2n body executions.',
        'Total: 3n → dominant term n.',
      ],
      result: 'Overall complexity: O(n) — sequential loops ADD, nested loops MULTIPLY.',
    },
    keyPoints: [
      '2n + n and n+k both collapse to O(n); only the fastest-growing term survives.',
      'The slower (higher-order) statement dominates; drop the rest.',
    ],
  },
  {
    id: 'conditionals',
    title: '7. Conditional Statements',
    summary: 'if/else cost O(1) for the decision, but the branch you take may contain expensive code — branch work adds to, it does not multiply, the complexity.',
    keyPoints: [
      'if (p) then O(f(n)) else O(g(n)) → worst case O(max(f(n), g(n))).',
      'The branch costing max(f(n), g(n)) dominates when reasoning about the worst case.',
      'Short circuit && stops evaluation — a false left operand skips the right cost (see insertion sort).',
    ],
  },
  {
    id: 'logarithmic-loops',
    title: '8. Logarithmic Loops',
    summary: 'Loops whose variable doubles (or halves) each iteration finish after about log₂(n) iterations.',
    example: {
      title: 'Doubling loop',
      language: 'C',
      code: 'for (int i = 1; i < n; i *= 2) {\n    printf("%d", i);\n}',
      analysis: [
        'The variable doubles after every iteration: 1, 2, 4, 8, ….',
        'The loop stops at the first power of two ≥ n.',
        'The loop executes approximately ⌊log₂(n)⌋ + 1 times.',
      ],
      result: 'Overall complexity: O(log n).',
    },
    keyPoints: [
      'Multiplying (or dividing) the control variable by a constant b gives Θ(log_b n) = Θ(log₂ n) up to constant factors.',
      'Binary search’s while loop halves the interval instead of double-stepping the variable, but the count is identical.',
    ],
  },
  {
    id: 'recursion',
    title: '9. Recursive Algorithms',
    summary: 'A recursive call tree has depth (levels) and branching (calls per node). Total work = number of tree nodes × work per node.',
    example: {
      title: 'Structured recursion (merge tree)',
      language: 'C',
      code: 'void mergeSort(int arr[], int left, int right) {\n    if (left < right) {\n        int mid = left + (right - left) / 2;\n        mergeSort(arr, left, mid);\n        mergeSort(arr, mid + 1, right);\n        merge(arr, left, mid, right);\n    }\n}',
      analysis: [
        'Depth is ⌈log₂ n⌉ because each level halves the subarray size.',
        'There are 2^n_leaves - 1 ≈ 2n - 1 calls in total on the call tree for n elements.',
      ],
      result: 'The tree has 2n − 1 nodes (counted by the instrumented engine: recursiveCalls) with Θ(log n) levels.',
    },
    keyPoints: [
      'Splitting n in half in two recursive calls yields log n levels.',
      'Unchecked recursion depth mirrors the stack limit (STACK: 512 KB default,so n ≈ 10 000 already risks quick sort worst-case depth).',
    ],
  },
  {
    id: 'recurrences',
    title: '10. Recurrence Relations',
    summary: 'Recurrences capture recursive work as T(n) = a·T(n / b) + f(n). The master theorem resolves most divide-and-conquer shapes.',
    keyPoints: [
      'Merge sort: T(n) = 2T(n/2) + Θ(n) → Θ(n log n) (master theorem case 2).',
      'Binary search: T(n) = T(n/2) + Θ(1) → Θ(log n) (case 2, k = 0).',
      'Quick sort worst: T(n) = T(n−1) + Θ(n) → Θ(n²) — the master theorem does not apply because the split is not constant ratio.',
      'Use the Complexity Analyzer’s recurrence panel to see each case worked out.',
    ],
  },
  {
    id: 'notations',
    title: '11. Asymptotic Notations',
    summary: 'O, Ω and Θ bound growth from above, below and both sides. Big-O is an upper bound, not an execution prediction.',
    keyPoints: [
      'O(f): never grows faster than f (upper bound).',
      'Ω(f): never grows slower than f (lower bound).',
      'Θ(f): grows exactly like f (tight bound, both bounds).',
      '“Insertion sort is O(n²)” is true even though its best case is O(n), because big-O is only an upper bound.',
    ],
  },
  {
    id: 'cases',
    title: '12. Best, Average, and Worst Cases',
    summary: 'The same algorithm has three different curves depending on the input family. The instrumented engine lets you check all three with the input lab.',
    keyPoints: [
      'Best case: the luckiest admissible inputs (sorted array for bubble/insertion sort).',
      'Worst case: the least lucky inputs (reverse-sorted array, missing target in linear search).',
      'Average case: expected cost over an input distribution — state the distribution! (e.g. “target placed uniformly at random”).',
      'Never report the average case without saying which distribution it assumes.',
    ],
  },
];

export const SPACE_COMPLEXITY_TOPICS: ComplexityTopic[] = [
  {
    id: 'space-intro',
    title: '1. Input, Auxiliary and Total Space',
    summary: 'Total space = input space (the array itself, n elements) + auxiliary space (extra memory the algorithm creates). Complexity classes usually quote auxiliary space.',
    keyPoints: [
      'Input space is Θ(n) for an array of n ints and is not caused by the algorithm.',
      'Auxiliary space measures everything the algorithm creates beyond the caller’s input.',
      'The instrumented engine reports auxiliary allocations (malloc-style) and recursion stack separately.',
    ],
  },
  {
    id: 'fixed-vs-variable',
    title: '2. Fixed vs Variable Memory',
    summary: 'Fixed usage: a constant number of scalars (i, j, key, temp). Variable usage: memory whose size depends on n (temp arrays, call stacks).',
    keyPoints: [
      'Bubble, selection and insertion sort only use a handful of C scalars → O(1) auxiliary.',
      'Merge sort allocates leftArr/rightArr sized like the subarray being merged → O(n) auxiliary.',
    ],
  },
  {
    id: 'stack',
    title: '3. Recursive Stack Usage',
    summary: 'Every recursive call frame stores its locals until the call returns, so the deepest level of recursion multiplied by the frame size gives the stack cost.',
    keyPoints: [
      'Merge sort depth is ⌈log₂ n⌉, but merge buffers make the heap cost the dominant Θ(n).',
      'Quick sort depth is O(log n) average; a degenerate pivot order (already sorted input with last-element pivot) reaches O(n) depth.',
      'The instrumented counters report the recursion depth actually observed (measuredStackDepth).',
    ],
  },
  {
    id: 'alloc',
    title: '4. Dynamic Allocation',
    summary: 'malloc/calloc/realloc allocations are explicit heap costs. The allocation tracker records each allocation and the peak simultaneously-held bytes.',
    keyPoints: [
      'Peak bytes rather than total bytes matter: freed buffers can be reused.',
      'Merge sort holds at most two temp arrays for one call at a time → peak ≈ n · sizeof(int).',
    ],
  },
  {
    id: 'in-place',
    title: '5. In-Place Algorithms',
    summary: 'An algorithm is in-place when it uses O(1) (or at most O(log n) call stack) memory beyond its input.',
    keyPoints: [
      'Bubble/selection/insertion/quick sort are in-place (quick sort needs stack).',
      'Merge sort (array implementation) is NOT in-place: it needs Θ(n) temp arrays.',
    ],
  },
  {
    id: 'estimates-vs-measurement',
    title: '6. Estimates vs Measurement',
    summary: 'Theoretical auxiliary space tells you the growth class, not the bytes used. Estimates convert the class into approximate bytes (4 bytes per C int). Anything labelled “estimated” is model based; anything labelled “instrumented” came from an actual counted run.',
    keyPoints: [
      'Never present an O(n) class as “exactly n·4 bytes measured”.',
      'Estimated bytes are computed from the complexity metadata plus observed allocation counts.',
      'Report estimated vs measured separately in complexity reports.',
    ],
  },
];

export const NOTATION_EXPLANATIONS: Array<{ notation: string; meaning: string; example: string }> = [
  { notation: 'O(1)', meaning: 'Constant — cost independent of input size (constant factors and lower-order terms are irrelevant at this scale).', example: 'Array index access' },
  { notation: 'O(log n)', meaning: 'Logarithmic — the search space halves at every step.', example: 'Binary search' },
  { notation: 'O(n)', meaning: 'Linear — every element is visited once.', example: 'Linear search' },
  { notation: 'O(n log n)', meaning: 'Linearithmic — log n merge levels of linear work each.', example: 'Merge sort, quick sort average' },
  { notation: 'O(n²)', meaning: 'Quadratic — every element compared with every other.', example: 'Bubble, selection, insertion sort (worst)' },
  { notation: 'O(n³)', meaning: 'Cubic — triple nested loops.', example: 'Naive matrix multiplication' },
  { notation: 'O(2ⁿ)', meaning: 'Exponential — every subset is enumerated.', example: 'Brute-force subset generation' },
  { notation: 'O(n!)', meaning: 'Factorial — every permutation is enumerated.', example: 'Travelling salesman brute force (permutation enumeration)' },
];
