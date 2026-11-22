export const LINEAR_SEARCH_CODE = {
  algorithmId: 'linear-search',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Linear Search - C Implementation
 * Searches for a target value in an array by checking each element sequentially.
 *
 * @param arr   Pointer to the array
 * @param n     Number of elements in the array
 * @param key   Target value to search for
 * @return      Index of key if found, otherwise -1
 */
int linearSearch(int arr[], int n, int key) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == key) {
            return i;
        }
    }

    return -1;
}`,
  logicBlocks: [
    {
      id: 'function-declaration',
      name: 'Function Declaration',
      description: 'Declares linearSearch function',
      category: 'declaration',
      sourceCode: 'int linearSearch(int arr[], int n, int key)',
      explanation: 'Declares function taking array, size, and target key. Returns index if found, -1 otherwise.',
    },
    {
      id: 'for-loop',
      name: 'For Loop',
      description: 'Iterate through array elements',
      category: 'loop',
      sourceCode: 'for (int i = 0; i < n; i++)',
      explanation: 'Iterates from index 0 to n-1, checking each element sequentially.',
    },
    {
      id: 'equality-check',
      name: 'Equality Check',
      description: 'Compare element with key',
      category: 'comparison',
      sourceCode: 'if (arr[i] == key)',
      explanation: 'Compares current element arr[i] with target key. If match, key found.',
    },
    {
      id: 'return-found',
      name: 'Return Found Index',
      category: 'return-statement',
      sourceCode: 'return i;',
      explanation: 'Returns index i where key was found.',
    },
    {
      id: 'not-found',
      name: 'Key Not Found',
      category: 'return-statement',
      sourceCode: 'return -1;',
      explanation: 'Returns -1 after loop completes without finding key.',
    },
  ],
  lineToPseudocodeMap: new Map([
    [11, 1],
    [13, 2],
    [14, 3],
    [15, 4],
    [16, 5],
  ]),
  explanations: new Map([
    [11, 'Declares linearSearch function accepting array, size, and target key.'],
    [13, 'Starts for loop iterating i from 0 to n-1.'],
    [14, 'Compares arr[i] with target key.'],
    [15, 'Returns i as found position.'],
    [16, 'Returns -1 when key not present.'],
  ]),
  examples: [
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 30',
      expectedOutput: '2',
      description: 'Target found at index 2.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 10',
      expectedOutput: '0',
      description: 'Target found at index 0.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 50',
      expectedOutput: '4',
      description: 'Target found at index 4.',
    },
    {
      input: 'arr: [10, 20, 30, 40, 50], key: 99',
      expectedOutput: '-1',
      description: 'Target not found.',
    },
  ],
};