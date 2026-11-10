import type { Algorithm } from '../types';

export const MERGE_SORT: Algorithm = {
  id: 'merge-sort',
  name: 'Merge Sort',
  category: 'sorting',
  difficulty: 'Intermediate',

  description:
    'Merge Sort is an efficient, stable, divide-and-conquer sorting algorithm. It divides the input array into two halves, recursively sorts them, and then merges the two sorted halves.',

  theory:
    'Merge Sort follows the divide-and-conquer paradigm. It recursively divides the array into two equal halves until each subarray contains a single element (which is inherently sorted). Then, it merges the subarrays back together in sorted order. The merge operation is the key process that assumes the subarrays are sorted and combines them into a single sorted array.',

  problemStatement:
    'Given an unsorted array of n elements, sort the array in ascending order using the Merge Sort algorithm.',

  approach:
    '1. Divide: Split the array into two halves (left and right).\n2. Conquer: Recursively sort each half.\n3. Combine: Merge the two sorted halves into a single sorted array.\n\nThe merge step compares the first elements of both subarrays and places the smaller one into the result array, repeating until all elements are merged.',

  pseudocode: [
    'function mergeSort(a[], left, right):',
    '    if left < right then:',
    '        mid ← (left + right) / 2',
    '        mergeSort(a, left, mid)',
    '        mergeSort(a, mid+1, right)',
    '        merge(a, left, mid, right)',
    '',
    'function merge(a[], left, mid, right):',
    '    n1 ← mid - left + 1',
    '    n2 ← right - mid',
    '    create temp arrays L[n1], R[n2]',
    '    copy data to L[] and R[]',
    '    i ← 0, j ← 0, k ← left',
    '    while i < n1 and j < n2 do:',
    '        if L[i] <= R[j] then:',
    '            a[k] ← L[i]',
    '            i ← i + 1',
    '        else:',
    '            a[k] ← R[j]',
    '            j ← j + 1',
    '        k ← k + 1',
    '    copy remaining elements of L[]',
    '    copy remaining elements of R[]',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  detailedComplexity: {
    best: {
      notation: 'O(n log n)',
      explanation:
        'Even in the best case, Merge Sort always divides the array into halves recursively and merges them back together. The merge step must always compare elements from both subarrays, even if they are already sorted.',
      derivation: {
        explanation:
          'The recurrence relation is T(n) = 2T(n/2) + O(n). The division step creates log₂(n) levels of recursion. At each level, all n elements are merged with O(n) comparisons and moves. By the Master Theorem, T(n) = Θ(n log n). This holds for best, average, and worst cases alike.',
        assumptions: [
          'The algorithm uses the standard top-down recursive divide-and-conquer approach.',
          'Merge operation always scans all elements in both subarrays.',
          'The array size n is a power of 2 for simplicity (general case also yields O(n log n)).',
        ],
        codeSections: [
          'function mergeSort(a[], left, right):',
          '    if left < right then:',
          '        mid ← (left + right) / 2',
          '        mergeSort(a, left, mid)',
          '        mergeSort(a, mid+1, right)',
          '        merge(a, left, mid, right)',
          '',
          'function merge(a[], left, mid, right):',
          '    n1 ← mid - left + 1',
          '    n2 ← right - mid',
          '    create temp arrays L[n1], R[n2]',
          '    copy data to L[] and R[]',
          '    i ← 0, j ← 0, k ← left',
          '    while i < n1 and j < n2 do:',
          '        if L[i] <= R[j] then:',
          '            a[k] ← L[i]',
          '            i ← i + 1',
          '        else:',
          '            a[k] ← R[j]',
          '            j ← j + 1',
          '        k ← k + 1',
          '    copy remaining elements of L[]',
          '    copy remaining elements of R[]',
        ],
      },
    },
    average: {
      notation: 'O(n log n)',
      explanation:
        'The average case behaves identically to the best and worst cases because Merge Sort always performs the same divide-and-conquer structure regardless of input order.',
      derivation: {
        explanation:
          'The algorithm recursively divides the array into halves, yielding log₂(n) levels. At each level, merging n elements requires O(n) operations. The total work across all levels is n * log₂(n) = O(n log n). No early termination or adaptive behavior exists.',
        assumptions: [
          'The input distribution does not affect the recursion tree or merge operations.',
          'All comparisons in the merge step are performed regardless of data order.',
        ],
        codeSections: [
          'function mergeSort(a[], left, right):',
          '    if left < right then:',
          '        mid ← (left + right) / 2',
          '        mergeSort(a, left, mid)',
          '        mergeSort(a, mid+1, right)',
          '        merge(a, left, mid, right)',
        ],
      },
    },
    worst: {
      notation: 'O(n log n)',
      explanation:
        'Merge Sort has the same O(n log n) complexity in the worst case. The merge step may do slightly more comparisons if the subarrays interleave heavily, but the asymptotic complexity remains unchanged.',
      derivation: {
        explanation:
          'The worst-case input causes the maximum number of comparisons during merging (when the two sorted subarrays are interleaved). However, even in this case, the merge step performs at most 2n-1 comparisons per level. The recurrence T(n) = 2T(n/2) + O(n) still gives T(n) = Θ(n log n).',
        assumptions: [
          'The worst-case input maximizes comparisons during merge but does not change the asymptotic behavior.',
          'The recursion tree depth is log₂(n) levels.',
        ],
        codeSections: [
          'function mergeSort(a[], left, right):',
          '    if left < right then:',
          '        mid ← (left + right) / 2',
          '        mergeSort(a, left, mid)',
          '        mergeSort(a, mid+1, right)',
          '        merge(a, left, mid, right)',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(n)',
        explanation:
          'Merge Sort requires O(n) additional space for the temporary arrays used during the merge step. Each level of recursion needs space proportional to the subarray sizes being merged.',
        derivation: {
          explanation:
            'At the top level, merging requires two temporary arrays of total size n. In a standard implementation, space is allocated for the left and right halves at each merge. With careful implementation (allocating a single temporary array of size n once), the auxiliary space can be reduced to O(n). The recursive call stack uses O(log n) additional space.',
        },
      },
      total: {
        notation: 'O(n)',
        explanation:
          'The total space includes O(n) auxiliary space for merging plus O(log n) stack space for recursive calls, giving O(n) total space complexity.',
        derivation: {
          explanation:
            'Combined auxiliary space O(n) for merge arrays plus O(log n) stack space for recursive calls. Since O(n) dominates O(log n), the total space complexity is O(n).',
        },
      },
    },
  },

  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },

  spaceComplexity: {
    auxiliary: 'O(n)',
    total: 'O(n)',
  },

  useCases: [
    'Large datasets requiring stable sorting',
    'External sorting (when data doesn\'t fit in memory)',
    'Linked lists (O(1) space for merge)',
    'When consistent O(n log n) performance is needed',
  ],

  relatedAlgorithms: ['quick-sort', 'heap-sort', 'tim-sort'],

  tags: ['sorting', 'divide-and-conquer', 'stable', 'O(n log n)', 'recursive'],
};