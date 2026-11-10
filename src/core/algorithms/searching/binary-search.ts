import type { Algorithm } from '../types';

export const BINARY_SEARCH: Algorithm = {
  id: 'binary-search',
  name: 'Binary Search',
  category: 'searching',
  difficulty: 'Beginner',

  description:
    'Binary Search is a searching algorithm that works on a sorted array. It repeatedly divides the search interval into two halves until the required element is found or the search interval becomes empty.',

  theory:
    'Binary Search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you have narrowed down the possible locations to just one. The key requirement is that the array must be sorted.',

  problemStatement:
    'Given a sorted array of n elements and a target key, find the position of the key in the array. If the key is not present, indicate that it was not found.',

  approach:
    'The algorithm maintains two pointers, low and high, representing the current search interval. It calculates the middle index mid. If the middle element equals the key, the search is successful. If the middle element is less than the key, the search continues in the right half (low = mid + 1). Otherwise, it continues in the left half (high = mid - 1). The process repeats until low exceeds high.',

  pseudocode: [
    'function binarySearch(a[], n, key):',
    '    low ← 0',
    '    high ← n - 1',
    '    while low <= high do',
    '        mid ← (low + high) / 2',
    '        if a[mid] == key then',
    '            return mid',
    '        else if a[mid] < key then',
    '            low ← mid + 1',
    '        else',
    '            high ← mid - 1',
    '    return -1',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  timeComplexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },

  detailedComplexity: {
    best: {
      notation: 'O(1)',
      explanation:
        'In the best case, the target key is found at the middle element of the first iteration. The algorithm performs only one comparison and returns immediately, without any additional operations.',
      derivation: {
        explanation:
          'The binary search algorithm begins by calculating mid = (low + high) / 2. If a[mid] == key, the search terminates after just one iteration. No additional comparisons, iterations, or memory allocations occur beyond this initial check.',
        assumptions: [
          'The array is sorted in ascending order.',
          'The array has at least one element (n ≥ 1).',
          'The target key is present in the array.',
          'The target key is located exactly at the middle position on the first iteration.',
        ],
        codeSections: ['if a[mid] == key then return mid;'],
      },
    },
    average: {
      notation: 'O(log n)',
      explanation:
        'On average, each iteration halves the search space. The key is expected to be found after approximately log₂(n) comparisons, where n is the number of elements in the array. This logarithmic behavior occurs because the algorithm reduces the search space by half with each comparison.',
      derivation: {
        explanation:
          'Each iteration of the while loop (low <= high) reduces the search interval by at least half. After k iterations, the search space size is at most n / 2^k. The search terminates when n / 2^k = 1, which gives k = log₂(n). Therefore, the number of iterations grows logarithmically with the input size n.',
        assumptions: [
          'The array is sorted in ascending order.',
          'The key is present in the array with uniform probability across all positions.',
          'All elements are distinct.',
          'The target key distribution is random and independent of the array values.',
        ],
        codeSections: [
          'while low <= high do',
          'mid ← (low + high) / 2',
          'if a[mid] == key then return mid',
        ],
      },
    },
    worst: {
      notation: 'O(log n)',
      explanation:
        'In the worst case, the key is not present in the array or is located at a position that requires the maximum number of iterations. The algorithm continues until the search interval becomes empty (low > high), performing log₂(n) iterations.',
      derivation: {
        explanation:
          'The search interval starts with size n and is reduced by at least half in each iteration. After k iterations, the search space size is at most n / 2^k. The loop continues while low <= high, which holds as long as the search space size is at least 1. The maximum number of iterations occurs when the target is not found: we need the smallest k such that n / 2^k < 1, which gives k = ⌈log₂(n)⌉.',
        assumptions: [
          'The array is sorted in ascending order.',
          'The target key is not present in the array.',
          'All elements are distinct and the algorithm correctly eliminates half the search space each time.',
        ],
        codeSections: [
          'while low <= high do',
          'mid ← (low + high) / 2',
          'if a[mid] == key then return mid',
          'else if a[mid] < key then low ← mid + 1',
          'else high ← mid - 1',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(1)',
        explanation:
          'Binary search uses only a fixed number of scalar variables (low, high, mid, temporary variables) regardless of the input size. No additional data structures, arrays, or recursive calls are used.',
        derivation: {
          explanation:
            'The algorithm maintains only constant-sized local variables: three integer pointers (low, high, mid) and auxiliary variables for loop control. These variables occupy fixed memory regardless of the input size n. No dynamic memory allocation or recursion is involved.',
        },
      },
    },
  },

  spaceComplexity: {
    auxiliary: 'O(1)',
    total: 'O(1)',
  },

  useCases: [
    'Searching in sorted arrays',
    'Finding lower/upper bounds',
    'Searching in databases',
    'Debugging and testing',
  ],

  relatedAlgorithms: [],

  tags: ['searching', 'sorted-array', 'logarithmic', 'divide-and-conquer'],
};
