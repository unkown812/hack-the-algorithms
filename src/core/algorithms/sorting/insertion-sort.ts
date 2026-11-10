import type { Algorithm } from '../types';

export const INSERTION_SORT: Algorithm = {
  id: 'insertion-sort',
  name: 'Insertion Sort',
  category: 'sorting',
  difficulty: 'Beginner',

  description:
    'Insertion Sort is a simple sorting algorithm that builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.',

  theory:
    'Insertion Sort works by taking elements from the input one by one and inserting them into their correct position in the already-sorted part of the array. Each iteration removes one element from the input data, finds the location it belongs within the sorted list, and inserts it there. It repeats until no input elements remain.',

  problemStatement:
    'Given an unsorted array of n elements, sort the array in ascending order using the Insertion Sort algorithm.',

  approach:
    'The algorithm assumes that the first element is already sorted. It then takes the second element and compares it with the first, shifting elements as needed to insert the second element in the correct position. This process continues for each subsequent element, expanding the sorted portion of the array one element at a time.',

  pseudocode: [
    'function insertionSort(a[], n):',
    '    for i from 1 to n-1 do:',
    '        key ← a[i]',
    '        j ← i - 1',
    '        while j >= 0 and a[j] > key do:',
    '            a[j+1] ← a[j]',
    '            j ← j - 1',
    '        a[j+1] ← key',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  detailedComplexity: {
    best: {
      notation: 'O(n)',
      explanation:
        'In the best case, the array is already sorted. Insertion Sort then makes one pass through the array, comparing each element with its predecessor and immediately moving to the next element without any shifts or re-insertions.',
      derivation: {
        explanation:
          'When the array is already sorted, each iteration of the outer loop (i from 1 to n-1) only executes the key comparison with its predecessor. No shifts occur because a[j] > key condition is false for all j. Therefore, exactly (n-1) comparisons are performed, giving O(n) complexity.',
        assumptions: [
          'The input array is sorted in ascending order.',
          'No element needs to be moved because each key is already in its correct position.',
        ],
        codeSections: [
          'for i from 1 to n-1 do:',
          '    key ← a[i]',
          '    j ← i - 1',
          '    while j >= 0 and a[j] > key do:',
          '        a[j+1] ← a[j]',
          '        j ← j - 1',
          '    a[j+1] ← key',
        ],
      },
    },
    average: {
      notation: 'O(n²)',
      explanation:
        'On average, Insertion Sort requires about n²/4 comparisons and shifts. The average number of elements that each new element must shift to its correct position is approximately (n-1)/4.',
      derivation: {
        explanation:
          'For each element (except the first), the average number of comparisons and shifts depends on how far it needs to move left in the sorted portion. Assuming random input, each element is expected to travel about (n-1)/4 positions, resulting in an average total of (n-1) * (n-1)/4 = n²/4 operations.',
        assumptions: [
          'The input array is randomly ordered.',
          'Each element has an equal probability of being in any position in the sorted order.',
        ],
        codeSections: [
          'for i from 1 to n-1 do:',
          '    key ← a[i]',
          '    j ← i - 1',
          '    while j >= 0 and a[j] > key do:',
          '        a[j+1] ← a[j]',
          '        j ← j - 1',
          '    a[j+1] ← key',
        ],
      },
    },
    worst: {
      notation: 'O(n²)',
      explanation:
        'In the worst case, the array is sorted in descending order. Each new element must travel to the beginning of the sorted portion, requiring (n-1) shifts and comparisons for the first element, (n-2) for the second, and so on.',
      derivation: {
        explanation:
          'When the array is sorted in reverse order, for element at position i, the inner while loop runs from j = i-1 down to 0. This gives i comparisons and i shifts. The total is Σ(i) for i=1 to n-1, which equals n(n-1)/2 = O(n²).',
        assumptions: [
          'The input array is sorted in descending order (worst case).',
          'Every element must travel the maximum possible distance to its correct position.',
        ],
        codeSections: [
          'for i from 1 to n-1 do:',
          '    key ← a[i]',
          '    j ← i - 1',
          '    while j >= 0 and a[j] > key do:',
          '        a[j+1] ← a[j]',
          '        j ← j - 1',
          '    a[j+1] ← key',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(1)',
        explanation:
          'Insertion Sort is an in-place algorithm that uses only a constant amount of additional memory for the key variable and the j counter.',
        derivation: {
          explanation:
            'The algorithm uses only a few scalar variables: key (to hold the current element), j (to traverse the sorted portion), and the loop counter i. These variables occupy constant memory regardless of input size n.',
        },
      },
    },
  },

  timeComplexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },

  spaceComplexity: {
    auxiliary: 'O(1)',
    total: 'O(1)',
  },

  useCases: [
    'Small datasets',
    'Nearly sorted data (adaptive: O(n) best case)',
    'Educational purposes',
    'Situations where memory write operations are expensive',
  ],

  relatedAlgorithms: ['bubble-sort', 'selection-sort', 'shell-sort'],

  tags: ['sorting', 'insertion', 'O(n²)', 'adaptive', 'in-place', 'stable'],
};