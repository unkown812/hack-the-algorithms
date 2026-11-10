import type { Algorithm } from '../types';

export const BUBBLE_SORT: Algorithm = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'sorting',
  difficulty: 'Beginner',

  description:
    'Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.',

  theory:
    'Bubble Sort works by repeatedly swapping adjacent elements if they are in the wrong order. Each pass through the list places the next largest element in its correct position at the end of the list. The algorithm continues until no swaps are needed, which indicates that the list is sorted. The worst-case time complexity is O(n²) and the best-case (with optimization) is O(n).',

  problemStatement:
    'Given an unsorted array of n elements, sort the array in ascending order using the Bubble Sort algorithm.',

  approach:
    'The algorithm iterates through the array, comparing each pair of adjacent elements. If the elements are in the wrong order (the left element is greater than the right), they are swapped. After each complete pass, the largest unsorted element "bubbles up" to its correct position at the end. This process repeats for n-1 passes, or fewer if the array becomes sorted early.',

  pseudocode: [
    'function bubbleSort(a[], n):',
    '    for i from 0 to n-1 do:',
    '        swapped ← false',
    '        for j from 0 to n-i-2 do:',
    '            if a[j] > a[j+1] then:',
    '                swap(a[j], a[j+1])',
    '                swapped ← true',
    '        if not swapped then:',
    '            break',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  timeComplexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },

  detailedComplexity: {
    best: {
      notation: 'O(n)',
      explanation:
        'In the best case, the array is already sorted. With the early termination optimization (swapped flag), Bubble Sort makes one complete pass through the array, comparing each adjacent pair once and detecting that no swaps were needed. It then terminates immediately.',
      derivation: {
        explanation:
          'The algorithm performs the outer loop once (i = 0 to n-1). For each i, it runs the inner loop from j = 0 to n-i-2. With early termination, no swaps occur, so the swapped flag remains false after the first pass. The algorithm then breaks out of the outer loop. The total number of comparisons equals n-1 (one less than the number of elements).',
        assumptions: [
          'The input array is already sorted in ascending order.',
          'The optimized version includes the swapped flag for early termination.',
          'All array elements are distinct.',
        ],
        codeSections: [
          'for i from 0 to n-1 do:',
          '    swapped ← false',
          '    for j from 0 to n-i-2 do:',
          '        if a[j] > a[j+1] then:',
          '            swap(a[j], a[j+1])',
          '            swapped ← true',
          '    if not swapped then:',
          '        break',
        ],
      },
    },
    average: {
      notation: 'O(n²)',
      explanation:
        'On average, Bubble Sort performs approximately n²/4 comparisons and swaps. Each element travels an average distance of (n-1)/2 positions to its correct location through successive swaps.',
      derivation: {
        explanation:
          'Assuming random input, the expected number of inversions in the array is n(n-1)/4. Each inversion requires one swap to resolve. The total number of comparisons is approximately n²/2 because each element is compared with its adjacent elements multiple times across passes. Both comparisons and swaps grow quadratically with input size n.',
        assumptions: [
          'The input array is randomly ordered with uniform distribution.',
          'Each pair of elements is equally likely to be in either order.',
          'The algorithm uses the basic version without additional optimizations beyond early termination.',
        ],
        codeSections: [
          'for i from 0 to n-1 do:',
          '    swapped ← false',
          '    for j from 0 to n-i-2 do:',
          '        if a[j] > a[j+1] then:',
          '            swap(a[j], a[j+1])',
          '            swapped ← true',
        ],
      },
    },
    worst: {
      notation: 'O(n²)',
      explanation:
        'In the worst case, the array is sorted in reverse order. Each element must travel all the way to its correct position, requiring maximum number of swaps and comparisons. The largest element bubbles up to its position in the first pass, the second largest in the second pass, and so on.',
      derivation: {
        explanation:
          'When the array is sorted in descending order, every comparison results in a swap. The total number of comparisons is Σ(n-i-1) for i=0 to n-1, which equals n(n-1)/2 = O(n²). The number of swaps is also n(n-1)/2, as each adjacent pair out of order must be swapped.',
        assumptions: [
          'The input array is sorted in descending order (reverse sorted).',
          'No early termination occurs because swaps happen on every comparison.',
          'All array elements are distinct.',
        ],
        codeSections: [
          'for i from 0 to n-1 do:',
          '    swapped ← false',
          '    for j from 0 to n-i-2 do:',
          '        if a[j] > a[j+1] then:',
          '            swap(a[j], a[j+1])',
          '            swapped ← true',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(1)',
        explanation:
          'Bubble Sort is an in-place sorting algorithm. It only uses a constant amount of additional memory for temporary variables (swapped flag, loop counters, and a temporary variable for swapping). No additional data structures are required.',
        derivation: {
          explanation:
            'The algorithm maintains only a few scalar variables: the swapped flag, two loop counters i and j, and a temporary variable for element swapping. These variables occupy fixed memory regardless of the input size n. The algorithm modifies the input array in-place without allocating additional arrays or data structures.',
        },
      },
    },
  },

  spaceComplexity: {
    auxiliary: 'O(1)',
    total: 'O(1)',
  },

  useCases: [
    'Educational purposes',
    'Small datasets',
    'When memory write operations are expensive (minimum swaps)',
  ],

  relatedAlgorithms: ['selection-sort', 'insertion-sort'],

  tags: ['sorting', 'simple', 'O(n²)', 'comparison', 'in-place'],
};