export const INSERTION_SORT_CODE = {
  algorithmId: 'insertion-sort',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Insertion Sort - C Implementation
 * Builds the final sorted array one element at a time by inserting each element into its correct position.
 *
 * @param arr   Pointer to the array to sort
 * @param n     Number of elements in the array
 */
void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        arr[j + 1] = key;
    }
}`,
  logicBlocks: [
    {
      id: 'function-declaration',
      name: 'Function Declaration',
      description: 'Declares insertionSort function',
      category: 'declaration',
      sourceCode: 'void insertionSort(int arr[], int n)',
      explanation: 'Sorts the array in place using the insertion sort algorithm.',
    },
    {
      id: 'outer-loop',
      name: 'Outer Loop',
      description: 'Pick the next element to insert',
      category: 'loop',
      sourceCode: 'for (int i = 1; i < n; i++)',
      explanation:
        'Starts at index 1 because the first element alone is already a sorted list of length one.',
    },
    {
      id: 'key',
      name: 'Save Key',
      description: 'Remember the element that is inserted',
      category: 'variable-declaration',
      sourceCode: 'int key = arr[i];',
      explanation:
        'The element is stored in a separate variable so the shifting loop does not overwrite it.',
    },
    {
      id: 'while-loop',
      name: 'Shift While Larger',
      description: 'Shift the larger elements one position to the right',
      category: 'loop',
      sourceCode: 'while (j >= 0 && arr[j] > key)',
      explanation:
        'The condition stops as soon as the element on the left is smaller than the key — the key then belongs exactly there.',
    },
    {
      id: 'shift',
      name: 'Shift Element',
      description: 'Move the larger element one position right',
      category: 'assignment',
      sourceCode: 'arr[j + 1] = arr[j];',
      explanation: 'Creates a free slot for the key by moving the larger element one step to the right.',
    },
    {
      id: 'placement',
      name: 'Insert Key',
      description: 'Place the key in its final position',
      category: 'assignment',
      sourceCode: 'arr[j + 1] = key;',
      explanation: 'The key is written into the gap that was created by the shifting loop.',
    },
  ],
  explanations: new Map([
    [11, 'Declares insertionSort as a void function sorting the array in place.'],
    [12, 'The outer loop starts at the second element.'],
    [14, 'The element to insert is copied into the key variable.'],
    [15, 'The index of the previous element is remembered.'],
    [17, 'Shift while the element on the left is larger than the key.'],
    [18, 'The larger element moves one position to the right.'],
    [22, 'The key is placed in the position that was freed.'],
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
      description: 'Already sorted — only one comparison per element.',
    },
    {
      input: 'arr: [5, 4, 3, 2, 1]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Reverse sorted — every element travels to the front.',
    },
  ],
};
