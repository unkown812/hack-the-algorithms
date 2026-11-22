export const BINARY_SEARCH_CODE = {
  algorithmId: 'binary-search',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Binary Search - C Implementation
 * Searches for a target value in a sorted array.
 *
 * @param arr   Pointer to the sorted array
 * @param n     Number of elements in the array
 * @param key   Target value to search for
 * @return      Index of key if found, otherwise -1
 */
int binarySearch(int arr[], int n, int key) {
    int low = 0;
    int high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (arr[mid] == key) {
            return mid;
        } else if (arr[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return -1;
}`,
  logicBlocks: [
    {
      id: 'function-declaration',
      name: 'Function Declaration',
      description: 'Declares the binarySearch function',
      category: 'declaration',
      sourceCode: 'int binarySearch(int arr[], int n, int key)',
      explanation: 'Declares a function that takes an array, its size, and a target key. Returns the index where the key is found, or -1 if not found.',
    },
    {
      id: 'initialization',
      name: 'Initialization',
      description: 'Initialize low and high pointers',
      category: 'variable-declaration',
      sourceCode: 'int low = 0;\nint high = n - 1;',
      explanation: 'low is initialized to 0 (first index) and high to n-1 (last index). These define the current search interval.',
    },
    {
      id: 'loop-condition',
      name: 'Loop Condition',
      description: 'Continue searching while interval is valid',
      category: 'loop',
      sourceCode: 'while (low <= high)',
      explanation: 'Loop continues as long as low <= high. When low > high, the interval is empty and the key is not present.',
    },
    {
      id: 'mid-calculation',
      name: 'Middle Index',
      description: 'Calculate middle index safely',
      category: 'calculation',
      sourceCode: 'int mid = low + (high - low) / 2;',
      explanation: 'Calculates midpoint. Using low + (high - low) / 2 avoids integer overflow vs (low + high) / 2.',
    },
    {
      id: 'equality-check',
      name: 'Equality Check',
      description: 'Check if middle element equals key',
      category: 'comparison',
      sourceCode: 'if (arr[mid] == key)',
      explanation: 'Compares arr[mid] with key. If equal, key found at index mid.',
    },
    {
      id: 'return-found',
      name: 'Return Found',
      category: 'return-statement',
      sourceCode: 'return mid;',
      explanation: 'Returns mid, the position where key was found.',
    },
    {
      id: 'search-right',
      name: 'Search Right Half',
      category: 'search-space-reduction',
      sourceCode: 'low = mid + 1;',
      explanation: 'If arr[mid] < key, target is in right half. Set low = mid + 1.',
    },
    {
      id: 'search-left',
      name: 'Search Left Half',
      category: 'search-space-reduction',
      sourceCode: 'high = mid - 1;',
      explanation: 'If arr[mid] > key, target is in left half. Set high = mid - 1.',
    },
    {
      id: 'not-found',
      name: 'Key Not Found',
      category: 'return-statement',
      sourceCode: 'return -1;',
      explanation: 'Returns -1 when loop exits without finding key.',
    },
  ],
  lineToPseudocodeMap: new Map([
    [11, 1],
    [12, 2],
    [13, 3],
    [15, 4],
    [16, 5],
    [18, 6],
    [19, 7],
    [21, 8],
    [22, 9],
    [24, 10],
    [25, 11],
    [28, 12],
  ]),
  explanations: new Map([
    [11, 'Declares binarySearch function accepting array, size, and target key. Returns index if found, -1 otherwise.'],
    [12, 'Initializes low to 0, start of search interval.'],
    [13, 'Initializes high to n-1, end of search interval.'],
    [15, 'Starts while loop continuing while low <= high.'],
    [16, 'Calculates midpoint using safe arithmetic.'],
    [18, 'Compares middle element with target key.'],
    [19, 'Returns mid as found position.'],
    [21, 'If middle element less than key, search right half.'],
    [22, 'Move low past middle element to search right.'],
    [24, 'If middle element greater than key, search left half.'],
    [25, 'Move high before middle element to search left.'],
    [28, 'Returns -1 when key not present.'],
  ]),
  examples: [
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 30',
      expectedOutput: '2',
      description: 'Target at middle position.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 10',
      expectedOutput: '0',
      description: 'Target at beginning.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 50',
      expectedOutput: '4',
      description: 'Target at end.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 99',
      expectedOutput: '-1',
      description: 'Target not found.',
    },
  ],
};