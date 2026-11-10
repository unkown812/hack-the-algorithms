export const SELECTION_SORT_CODE = {
  algorithmId: 'selection-sort',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Selection Sort - C Implementation
 * Divides array into sorted/unsorted, repeatedly selecting minimum from unsorted.
 *
 * @param arr   Pointer to the array to sort
 * @param n     Number of elements in the array
 */
void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;

        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex != i) {
            int temp = arr[minIndex];
            arr[minIndex] = arr[i];
            arr[i] = temp;
        }
    }
}`,
  logicBlocks: [
    {
      id: 'function-declaration',
      name: 'Function Declaration',
      description: 'Declares selectionSort',
      category: 'declaration',
      sourceCode: 'void selectionSort(int arr[], int n)',
      explanation: 'Declares void function sorting array in-place.',
    },
    {
      id: 'outer-loop',
      name: 'Outer Loop',
      description: 'Iterate through positions',
      category: 'loop',
      sourceCode: 'for (int i = 0; i < n - 1; i++)',
      explanation: 'i marks boundary between sorted (0..i-1) and unsorted (i..n-1).',
    },
    {
      id: 'min-index',
      name: 'Minimum Index',
      description: 'Track minimum element position',
      category: 'variable-declaration',
      sourceCode: 'int minIndex = i;',
      explanation: 'Assume arr[i] is minimum until finding smaller.',
    },
    {
      id: 'inner-loop',
      name: 'Inner Loop',
      description: 'Find minimum in unsorted portion',
      category: 'loop',
      sourceCode: 'for (int j = i + 1; j < n; j++)',
      explanation: 'Scan unsorted portion j from i+1 to n-1.',
    },
    {
      id: 'minimum-comparison',
      name: 'Minimum Comparison',
      category: 'comparison',
      sourceCode: 'if (arr[j] < arr[minIndex])',
      explanation: 'If arr[j] smaller, update minIndex to j.',
    },
    {
      id: 'conditional-swap',
      name: 'Conditional Swap',
      category: 'array-operation',
      sourceCode: 'if (minIndex != i) { ... }',
      explanation: 'Swap only if minimum not already at position i.',
    },
  ],
  lineToPseudocodeMap: new Map([
    [11, 1],
    [13, 2],
    [14, 3],
    [16, 4],
    [17, 5],
    [21, 6],
    [22, 7],
    [23, 8],
  ]),
  explanations: new Map([
    [11, 'Declares selectionSort as void function sorting array in-place.'],
    [13, 'Outer loop i marks sorted/unsorted boundary.'],
    [14, 'Set minIndex to i, assume current is minimum.'],
    [16, 'Inner loop scans unsorted portion j from i+1.'],
    [17, 'If arr[j] < arr[minIndex], new minimum found.'],
    [21, 'If minIndex differs from i, swap needed.'],
    [22, 'Save minimum value in temp variable.'],
    [23, 'Move arr[i] to minIndex position.'],
  ]),
  examples: [
    {
      input: 'arr: [64, 34, 25, 12, 22, 11, 90]',
      expectedOutput: '[11, 12, 22, 25, 34, 64, 90]',
      description: 'Random unsorted array.',
    },
    {
      input: 'arr: [1, 2, 3, 4, 5]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Already sorted.',
    },
    {
      input: 'arr: [5, 4, 3, 2, 1]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Reverse sorted.',
    },
  ],
};