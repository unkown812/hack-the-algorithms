export const QUICK_SORT_CODE = {
  algorithmId: 'quick-sort',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Quick Sort - C Implementation
 * Divide-and-conquer algorithm that partitions the array around a pivot and recursively sorts subarrays.
 *
 * @param arr   Pointer to the array to sort
 * @param low   Starting index of the subarray
 * @param high  Ending index of the subarray
 */
int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;

    for (int j = low; j <= high - 1; j++) {
        if (arr[j] <= pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);

        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
  logicBlocks: [
    {
      id: 'partition-declaration',
      name: 'Partition Function',
      description: 'Moves the pivot to its final position',
      category: 'declaration',
      sourceCode: 'int partition(int arr[], int low, int high)',
      explanation:
        'Rearranges the range so that everything left of the pivot is smaller and everything right of it is larger.',
    },
    {
      id: 'pivot',
      name: 'Pivot',
      description: 'Choose the last element as the pivot',
      category: 'variable-declaration',
      sourceCode: 'int pivot = arr[high];',
      explanation:
        'This implementation always uses the last element — simple, but the reason sorted input degrades to O(n²).',
    },
    {
      id: 'boundary',
      name: 'Smaller Boundary',
      description: 'Index of the last element smaller than the pivot',
      category: 'variable-declaration',
      sourceCode: 'int i = low - 1;',
      explanation: 'Starts before the range so the first smaller element moves to the first position.',
    },
    {
      id: 'partition-loop',
      name: 'Partition Loop',
      description: 'Scan the range and move smaller elements to the left',
      category: 'loop',
      sourceCode: 'for (int j = low; j <= high - 1; j++)',
      explanation:
        'Every element is compared with the pivot; the smaller ones are exchanged with the element at the boundary.',
    },
    {
      id: 'exchange',
      name: 'Exchange',
      description: 'Move the smaller element to the left side',
      category: 'assignment',
      sourceCode: 'arr[i] = arr[j]; arr[j] = temp;',
      explanation: 'Keeps the elements smaller than the pivot on the left of the boundary.',
    },
    {
      id: 'pivot-placement',
      name: 'Pivot Placement',
      description: 'Put the pivot behind the boundary',
      category: 'assignment',
      sourceCode: 'arr[i + 1] = arr[high];',
      explanation: 'The pivot ends up at index i + 1, which is its final sorted position.',
    },
    {
      id: 'quick-sort-declaration',
      name: 'Quick Sort Function',
      description: 'Sorts the two partitions recursively',
      category: 'declaration',
      sourceCode: 'void quickSort(int arr[], int low, int high)',
      explanation: 'Sorts the elements left and right of the pivot.',
    },
    {
      id: 'base-case',
      name: 'Base Case',
      description: 'Ranges with one element are already sorted',
      category: 'condition',
      sourceCode: 'if (low < high)',
      explanation: 'The recursion stops as soon as a range contains at most one element.',
    },
  ],
  explanations: new Map([
    [11, 'The partition helper rearranges the range around the pivot.'],
    [12, 'The pivot is the last element of the range.'],
    [13, 'i marks the last position holding an element smaller than the pivot.'],
    [15, 'Every element of the range is compared with the pivot.'],
    [16, 'Elements smaller than the pivot move to the left side.'],
    [19, 'The pivot is exchanged with the element at index i + 1.'],
    [24, 'The pivot is placed at its final position.'],
    [31, 'The recursive entry point of the algorithm.'],
    [32, 'A range with one element needs no work.'],
    [34, 'Partition the range around the pivot.'],
    [36, 'Sort the elements left of the pivot.'],
    [37, 'Sort the elements right of the pivot.'],
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
      description: 'Already sorted — the last-element pivot degenerates here.',
    },
    {
      input: 'arr: [5, 4, 3, 2, 1]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Reverse sorted.',
    },
  ],
};
