import type { Algorithm } from '../types';

export const SELECTION_SORT: Algorithm = {
  id: 'selection-sort',
  name: 'Selection Sort',
  category: 'sorting',
  difficulty: 'Beginner',

  description:
    'Selection Sort is a simple sorting algorithm that divides the input list into two parts: a sorted sublist of items which is built up from left to right at the front of the list, and a sublist of the remaining unsorted items.',

  theory:
    'Selection Sort works by repeatedly finding the minimum element from the unsorted portion of the array and moving it to the beginning. The algorithm maintains two subarrays: the sorted subarray at the beginning and the unsorted subarray at the end. In each iteration, it finds the smallest element in the unsorted subarray and swaps it with the first element of the unsorted subarray.',

  problemStatement:
    'Given an unsorted array of n elements, sort the array in ascending order using the Selection Sort algorithm.',

  approach:
    'The algorithm divides the array into a sorted and unsorted region. Initially, the sorted region is empty and the unsorted region is the entire array. The algorithm repeatedly selects the smallest element from the unsorted region and swaps it with the first element of the unsorted region, expanding the sorted region by one element each time.',

  pseudocode: [
    'function selectionSort(a[], n):',
    '    for i from 0 to n-2 do:',
    '        minIndex ← i',
    '        for j from i+1 to n-1 do:',
    '            if a[j] < a[minIndex] then:',
    '                minIndex ← j',
    '        swap(a[i], a[minIndex])',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  detailedComplexity: {
    best: {
      notation: 'O(n²)',
      explanation:
        'The best case is less favorable than Bubble Sort because Selection Sort must always scan all remaining elements to find the minimum, even when the array is already sorted. There is no early termination or adaptive optimization like Bubble Sort\'s swapped flag.',
      derivation: {
        explanation:
          'In each of the n-1 outer iterations, the inner loop scans the entire unsorted portion (from i+1 to n-1). The total number of comparisons is Σ(n-i-1) for i=0 to n-2, which equals n(n-1)/2 = O(n²). Because there is no early exit when elements are already in order, all comparisons still occur regardless of input order.',
        assumptions: [
          'The array has no early termination optimization.',
          'The algorithm always performs the full inner scan to find the minimum element.',
          'All array elements are distinct and comparable.',
        ],
        codeSections: [
          'for i from 0 to n-2 do:',
          '    minIndex ← i',
          '    for j from i+1 to n-1 do:',
          '        if a[j] < a[minIndex] then:',
          '            minIndex ← j',
          '        swap(a[i], a[minIndex])',
        ],
      },
    },
    average: {
      notation: 'O(n²)',
      explanation:
        'On average, Selection Sort performs approximately n²/3 comparisons. Each element is compared with roughly half of the other elements across passes.',
      derivation: {
        explanation:
          'For each pass i, the inner loop compares the minimum with each of the remaining (n-i-1) elements. The total comparisons remain n(n-1)/2 regardless of the input distribution because the algorithm does not adapt to already-sorted portions.',
        assumptions: [
          'The input array is in random order.',
          'No early termination occurs; every element is scanned to find the minimum.',
        ],
        codeSections: [
          'for i from 0 to n-2 do:',
          '    minIndex ← i',
          '    for j from i+1 to n-1 do:',
          '        if a[j] < a[minIndex] then:',
          '            minIndex ← j',
          '        swap(a[i], a[minIndex])',
        ],
      },
    },
    worst: {
      notation: 'O(n²)',
      explanation:
        'In the worst case, the array is sorted in descending order. Each pass still requires examining all remaining elements because the minimum may be anywhere in the unsorted portion. The algorithm cannot skip comparisons even on already-sorted subarrays.',
      derivation: {
        explanation:
          'Every comparison is always made. For iteration i, the inner loop runs from j = i+1 to n-1, performing exactly (n-1)-(i+1)+1 = n-i-1 comparisons. Summing over all iterations gives n(n-1)/2 comparisons, which is O(n²). Swaps also occur at most n-1 times (once per outer iteration), but swaps are not the bottleneck.',
        assumptions: [
          'No early termination optimization.',
          'The worst arrangement maximizes unnecessary comparisons while still scanning all remaining elements.',
        ],
        codeSections: [
          'for i from 0 to n-2 do:',
          '    minIndex ← i',
          '    for j from i+1 to n-1 do:',
          '        if a[j] < a[minIndex] then:',
          '            minIndex ← j',
          '        swap(a[i], a[minIndex])',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(1)',
        explanation:
          'Selection Sort is an in-place algorithm that uses only a constant amount of additional memory for the minIndex variable, swap temporary variable, and loop counters.',
        derivation: {
          explanation:
            'Only scalar variables are used: minIndex (to track the current minimum), two loop counters (i, j), and a temporary variable for swapping elements. These occupy fixed memory regardless of input size n.',
        },
      },
    },
  },

  timeComplexity: {
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },

  spaceComplexity: {
    auxiliary: 'O(1)',
    total: 'O(1)',
  },

  useCases: [
    'When memory write operations are expensive (minimum swaps: n-1)',
    'Small datasets',
    'Educational purposes to teach sorting concepts',
  ],

  relatedAlgorithms: ['bubble-sort', 'insertion-sort', 'heap-sort'],

  tags: ['sorting', 'selection', 'O(n²)', 'comparison', 'in-place', 'minimum-swaps'],
};