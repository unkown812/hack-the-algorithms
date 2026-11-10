export const BUBBLE_SORT_CODE = {
  algorithmId: 'bubble-sort',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Bubble Sort - C Implementation
 * Repeatedly steps through the array, comparing adjacent elements and swapping them if in wrong order.
 *
 * @param arr   Pointer to the array to sort
 * @param n     Number of elements in the array
 */
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;

        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }

        if (!swapped) {
            break;
        }
    }
}`,
  logicBlocks: [
    {
      id: 'function-declaration',
      name: 'Function Declaration',
      description: 'Declares bubbleSort function',
      category: 'declaration',
      sourceCode: 'void bubbleSort(int arr[], int n)',
      explanation: 'Declares void function sorting array in-place.',
    },
    {
      id: 'outer-loop',
      name: 'Outer Loop',
      description: 'Iterate through passes',
      category: 'loop',
      sourceCode: 'for (int i = 0; i < n - 1; i++)',
      explanation: 'Runs n-1 passes. Each pass places largest unsorted element at end.',
    },
    {
      id: 'swapped-flag',
      name: 'Swap Flag',
      description: 'Track if swaps occurred',
      category: 'variable-declaration',
      sourceCode: 'int swapped = 0;',
      explanation: 'Flag optimized termination when no swaps occur.',
    },
    {
      id: 'inner-loop',
      name: 'Inner Loop',
      description: 'Compare adjacent elements',
      category: 'loop',
      sourceCode: 'for (int j = 0; j < n - i - 1; j++)',
      explanation: 'Iterates through unsorted portion comparing adjacent elements.',
    },
    {
      id: 'comparison',
      name: 'Compare Adjacent',
      category: 'comparison',
      sourceCode: 'if (arr[j] > arr[j + 1])',
      explanation: 'Left element greater than right means wrong order, swap needed.',
    },
    {
      id: 'swap',
      name: 'Swap Elements',
      category: 'array-operation',
      sourceCode: 'int temp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = temp;',
      explanation: 'Swap uses temporary variable to exchange two elements.',
    },
    {
      id: 'early-termination',
      name: 'Early Termination',
      category: 'conditional',
      sourceCode: 'if (!swapped) { break; }',
      explanation: 'If no swaps in a pass, array is sorted. Break early.',
    },
  ],
  lineToPseudocodeMap: new Map([
    [11, 1],
    [13, 2],
    [14, 3],
    [16, 4],
    [17, 5],
    [18, 6],
    [21, 7],
    [24, 8],
    [25, 9],
  ]),
  explanations: new Map([
    [11, 'Declares bubbleSort as void function sorting array in-place.'],
    [13, 'Outer loop runs n-1 times, each pass places largest unsorted element.'],
    [14, 'Initialize swap flag false. Tracks swaps during pass.'],
    [16, 'Inner loop iterates through unsorted portion.'],
    [17, 'Compare arr[j] with arr[j+1]. Swap if left larger.'],
    [18, 'Save arr[j] in temp before overwriting.'],
    [19, 'Move arr[j+1] to position j.'],
    [20, 'Place temp at arr[j+1], completing swap.'],
    [21, 'Set swapped true if any swap occurred.'],
    [24, 'If no swaps occurred, array is sorted.'],
    [25, 'Break early to avoid unnecessary passes.'],
  ]),
  examples: [
    {
      input: 'arr: [5, 3, 8, 1, 9, 2]',
      expectedOutput: '[1, 2, 3, 5, 8, 9]',
      description: 'Random unsorted array.',
    },
    {
      input: 'arr: [1, 2, 3, 4, 5]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Already sorted - triggers early termination.',
    },
    {
      input: 'arr: [5, 4, 3, 2, 1]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Reverse sorted.',
    },
    {
      input: 'arr: [42]',
      expectedOutput: '[42]',
      description: 'Single element, already sorted.',
    },
  ],
};