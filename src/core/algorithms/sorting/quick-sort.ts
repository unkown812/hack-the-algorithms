import type { Algorithm } from '../types';

export const QUICK_SORT: Algorithm = {
  id: 'quick-sort',
  name: 'Quick Sort',
  category: 'sorting',
  difficulty: 'Intermediate',

  description:
    'Quick Sort is a highly efficient divide-and-conquer sorting algorithm. It works by selecting a pivot element and partitioning the array into elements less than the pivot and elements greater than the pivot, then recursively sorting the subarrays.',

  theory:
    'Quick Sort works by selecting a pivot element from the array and partitioning the other elements into two subarrays, according to whether they are less than or greater than the pivot. The pivot element is then in its final sorted position. This process is recursively applied to the subarrays. Quick Sort is typically faster in practice than other O(n log n) algorithms like Merge Sort due to good cache performance and in-place partitioning.',

  problemStatement:
    'Given an unsorted array of n elements, sort the array in ascending order using the Quick Sort algorithm.',

  approach:
    '1. Pick a pivot element from the array.\n2. Partition: Reorder the array so that all elements with values less than the pivot come before it, and all elements with values greater than the pivot come after it.\n3. Recursively apply the above steps to the subarray of elements with smaller values and separately to the subarray of elements with greater values.\n4. The base case is arrays of size zero or one, which are already sorted.',

  pseudocode: [
    'function quickSort(a[], low, high):',
    '    if low < high then:',
    '        pi ← partition(a, low, high)',
    '        quickSort(a, low, pi - 1)',
    '        quickSort(a, pi + 1, high)',
    '',
    'function partition(a[], low, high):',
    '    pivot ← a[high]',
    '    i ← low - 1',
    '    for j from low to high-1 do:',
    '        if a[j] <= pivot then:',
    '            i ← i + 1',
    '            swap(a[i], a[j])',
    '    swap(a[i+1], a[high])',
    '    return i + 1',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  detailedComplexity: {
    best: {
      notation: 'O(n log n)',
      explanation:
        'Quick Sort achieves O(n log n) best case when pivot selection consistently partitions the array near the middle. Each recursive call reduces the problem size by approximately half.',
      derivation: {
        explanation:
          'The recurrence T(n) = 2T(n/2) + O(n) occurs when pivots always divide the array evenly. The Master Theorem gives T(n) = Θ(n log n). This happens when the pivot is the median or close to it.',
        assumptions: [
          'Pivot selection always results in balanced partitions (ratio ~0.5).',
          'The partition function takes O(n) time.',
          'All elements are distinct.',
        ],
        codeSections: [
          'function quickSort(a[], low, high):',
          '    if low < high then:',
          '        pi ← partition(a, low, high)',
          '        quickSort(a, low, pi - 1)',
          '        quickSort(a, pi + 1, high)',
          '',
          'function partition(a[], low, high):',
          '    pivot ← a[high]',
          '    i ← low - 1',
          '    for j from low to high-1 do:',
          '        if a[j] <= pivot then:',
          '            i ← i + 1',
          '            swap(a[i], a[j])',
          '    swap(a[i+1], a[high])',
          '    return i + 1',
        ],
      },
    },
    average: {
      notation: 'O(n log n)',
      explanation:
        'Quick Sort averages O(n log n) when pivots partition the array reasonably well. Random pivot selection ensures good average performance regardless of input order.',
      derivation: {
        explanation:
          'Assuming random pivot selection, each element is equally likely to be chosen as pivot. The expected depth of the recursion tree is O(log n), and each level processes all n elements. Hence, the average time is O(n log n).',
        assumptions: [
          'Pivot selection is random (or uniformly distributed).',
          'The partition function is O(n).',
          'Input elements are distinct.',
        ],
        codeSections: [
          'function quickSort(a[], low, high):',
          '    if low < high then:',
          '        pi ← partition(a, low, high)',
          '        quickSort(a, low, pi - 1)',
          '        quickSort(a, pi + 1, high)',
        ],
      },
    },
    worst: {
      notation: 'O(n²)',
      explanation:
        'Quick Sort degrades to O(n²) when poor pivots are consistently selected (e.g., smallest or largest element). This can happen with already sorted input if the pivot is always chosen as the first or last element.',
      derivation: {
        explanation:
          'If the pivot is always the smallest or largest element, partitions become extremely unbalanced: one side has 0 elements, the other has n-1. The recurrence is T(n) = T(n-1) + O(n), which solves to T(n) = O(n²).',
        assumptions: [
          'Pivot selection always selects the first or last element.',
          'The input is already sorted or sorted in reverse order.',
          'The partition function still takes O(n).',
        ],
        codeSections: [
          'function quickSort(a[], low, high):',
          '    if low < high then:',
          '        pi ← partition(a, low, high)',
          '        quickSort(a, low, pi - 1)',
          '        quickSort(a, pi + 1, high)',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(log n)',
        explanation:
          'Quick Sort uses O(log n) auxiliary space for the recursion stack in the average case when partitions are balanced. The space is proportional to the depth of recursion tree.',
        derivation: {
          explanation:
            'In the best/average case, the recursion tree has O(log n) depth because each recursive call reduces the problem size by roughly half. Each stack frame uses O(1) space, so total auxiliary space is O(log n).',
        },
      },
      total: {
        notation: 'O(log n)',
        explanation:
          'The total space includes O(log n) for the recursion stack. No additional significant memory is allocated beyond the stack.',
        derivation: {
          explanation:
            'Only the recursion stack contributes to space usage. No additional arrays or large data structures are created. The space is dominated by the stack depth.',
        },
      },
    },
  },

  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
  },

  spaceComplexity: {
    auxiliary: 'O(log n)',
    total: 'O(log n)',
  },

  useCases: [
    'General-purpose sorting when average-case performance matters',
    'Arrays where O(log n) stack space is acceptable',
    'Situations where in-place sorting is preferred',
    'Built-in sort implementations in many language standard libraries',
  ],

  relatedAlgorithms: ['merge-sort', 'heap-sort', 'intro-sort'],

  tags: ['sorting', 'divide-and-conquer', 'O(n log n)', 'in-place', 'recursive', 'pivot'],
};