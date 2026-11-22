import type { Algorithm } from '../types';

export const LINEAR_SEARCH: Algorithm = {
  id: 'linear-search',
  name: 'Linear Search',
  category: 'searching',
  difficulty: 'Beginner',

  description:
    'Linear Search is a simple searching algorithm that checks every element in a list until the desired element is found or the list is exhausted.',

  theory:
    'Linear Search works by iterating through each element of an array sequentially from the beginning to the end. For each element, it checks if the element matches the target key. If a match is found, the search stops and the position is returned. If the loop completes without finding a match, the element is not present in the array.',

  problemStatement:
    'Given an array of n elements and a target key, find the position of the key in the array. If the key is not present, indicate that it was not found.',

  approach:
    'The algorithm starts from the first element of the array and compares each element with the target key one by one. If a match is found, its index is returned. If the end of the array is reached without finding a match, the algorithm returns -1 indicating the element is not present.',

  pseudocode: [
    'function linearSearch(a[], n, key):',
    '    for i from 0 to n-1 do',
    '        if a[i] == key then',
    '            return i',
    '    return -1',
  ],

  languageSupport: ['C', 'C++', 'Python', 'Java'],

  timeComplexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
  },

  detailedComplexity: {
    best: {
      notation: 'O(1)',
      explanation:
        'In the best case, the target key is found at the very first position of the array. The algorithm performs only one comparison and returns immediately, without examining any other elements.',
      derivation: {
        explanation:
          'The for loop starts with i = 0. In the first iteration, it compares a[0] with the target key. If a[0] == key, the function returns i (which is 0). No additional iterations or operations occur beyond this single comparison.',
        assumptions: [
          'The target key is present in the array.',
          'The first element (index 0) of the array contains the target key.',
          'The array has at least one element (n ≥ 1).',
        ],
        codeSections: [
          'for i from 0 to n-1 do',
          'if a[i] == key then return i',
        ],
      },
    },
    average: {
      notation: 'O(n)',
      explanation:
        'On average, the algorithm examines approximately half of the array elements before finding the target key (assuming the key is present). This gives an average of n/2 comparisons, which simplifies to O(n) in Big-O notation.',
      derivation: {
        explanation:
          'Assuming the target key is present in the array with uniform probability across all positions, the expected position is (n-1)/2. The algorithm performs (expected position + 1) comparisons (including the successful comparison). Therefore, the expected number of comparisons is (n+1)/2, which is linear in n.',
        assumptions: [
          'The target key is present in the array with equal probability at any position.',
          'All array elements are distinct.',
          'The search stops immediately upon finding the key.',
        ],
        codeSections: [
          'for i from 0 to n-1 do',
          'if a[i] == key then return i',
        ],
      },
    },
    worst: {
      notation: 'O(n)',
      explanation:
        'In the worst case, the target key is not present in the array or is located at the last position. The algorithm must examine all n elements before determining that the key is not present.',
      derivation: {
        explanation:
          'When the target key is not found, the for loop runs through all n iterations (i from 0 to n-1). In each iteration, a comparison is performed. After completing all n iterations, the function returns -1. Thus, the number of comparisons equals n, which is linear in the input size.',
        assumptions: [
          'The target key is not present in the array, OR',
          'The target key is present but located at the last position (index n-1).',
          'All array elements are distinct and the key does not match any element except possibly at the last position.',
        ],
        codeSections: [
          'for i from 0 to n-1 do',
          'if a[i] == key then return i',
          'return -1',
        ],
      },
    },
    space: {
      auxiliary: {
        notation: 'O(1)',
        explanation:
          'Linear search uses only a fixed number of scalar variables (i, temporary variables) regardless of the input size. No additional data structures or recursion is used.',
        derivation: {
          explanation:
            'The algorithm uses only a single integer variable i for the loop index and a few temporary variables for the return value and function call stack. These variables occupy constant memory regardless of the input size n. No dynamic memory allocation or complex data structures are involved.',
        },
      },
    },
  },

  spaceComplexity: {
    auxiliary: 'O(1)',
    total: 'O(1)',
  },

  useCases: [
    'Small datasets',
    'Unsorted arrays',
    'When simplicity is preferred over efficiency',
    'Online searching where data is constantly changing',
  ],

  relatedAlgorithms: ['binary-search'],

  tags: ['searching', 'unsorted', 'sequential', 'O(n)'],
};