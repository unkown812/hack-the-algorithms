export const MERGE_SORT_CODE = {
  algorithmId: 'merge-sort',
  language: 'C',
  sourceCode: `#include <stdio.h>

/**
 * Merge Sort - C Implementation
 * Divide-and-conquer algorithm that divides the array into halves, sorts them, and merges the two sorted halves back together.
 *
 * @param arr   Pointer to the array to sort
 * @param left  Starting index of the subarray
 * @param right Ending index of the subarray
 */
void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    int leftArr[n1], rightArr[n2];

    for (int i = 0; i < n1; i++) {
        leftArr[i] = arr[left + i];
    }
    for (int j = 0; j < n2; j++) {
        rightArr[j] = arr[mid + 1 + j];
    }

    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (leftArr[i] <= rightArr[j]) {
            arr[k] = leftArr[i];
            i++;
        } else {
            arr[k] = rightArr[j];
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = leftArr[i];
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = rightArr[j];
        j++;
        k++;
    }
}

void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        merge(arr, left, mid, right);
    }
}`,
  logicBlocks: [
    {
      id: 'merge-declaration',
      name: 'Merge Function',
      description: 'Merges two sorted halves into one',
      category: 'declaration',
      sourceCode: 'void merge(int arr[], int left, int mid, int right)',
      explanation: 'Combines the sorted range [left, mid] with the sorted range [mid + 1, right].',
    },
    {
      id: 'sizes',
      name: 'Half Sizes',
      description: 'Compute the length of both halves',
      category: 'variable-declaration',
      sourceCode: 'int n1 = mid - left + 1;',
      explanation: 'The sizes are needed to copy both halves into temporary arrays.',
    },
    {
      id: 'temp-arrays',
      name: 'Temporary Arrays',
      description: 'Copy both halves into temporary arrays',
      category: 'variable-declaration',
      sourceCode: 'int leftArr[n1], rightArr[n2];',
      explanation:
        'The halves are copied so they can be merged without overwriting values that are still needed.',
    },
    {
      id: 'merge-loop',
      name: 'Merge Loop',
      description: 'Take the smaller of the two front elements',
      category: 'loop',
      sourceCode: 'while (i < n1 && j < n2)',
      explanation:
        'Because both halves are sorted, the smallest remaining value is always at the front of one of them.',
    },
    {
      id: 'merge-sort-declaration',
      name: 'Merge Sort Function',
      description: 'Splits the range and sorts the halves',
      category: 'declaration',
      sourceCode: 'void mergeSort(int arr[], int left, int right)',
      explanation: 'The divide-and-conquer entry point of the algorithm.',
    },
    {
      id: 'base-case',
      name: 'Base Case',
      description: 'A range with one element is already sorted',
      category: 'condition',
      sourceCode: 'if (left < right)',
      explanation: 'Ranges of length one need no work — this is where the recursion stops.',
    },
    {
      id: 'mid',
      name: 'Middle Index',
      description: 'Split the range in two halves',
      category: 'variable-declaration',
      sourceCode: 'int mid = left + (right - left) / 2;',
      explanation:
        'The formula avoids overflow compared to (left + right) / 2 for very large indices.',
    },
  ],
  explanations: new Map([
    [11, 'The merge helper joins two already sorted halves.'],
    [12, 'Length of the left half.'],
    [13, 'Length of the right half.'],
    [15, 'Two temporary arrays hold the halves while they are merged.'],
    [17, 'The left half is copied into leftArr.'],
    [20, 'The right half is copied into rightArr.'],
    [24, 'Three counters: the read position in each half and the write position.'],
    [26, 'While both halves still contain elements, take the smaller one.'],
    [37, 'Copy the remaining elements of the left half.'],
    [43, 'Copy the remaining elements of the right half.'],
    [50, 'The recursive entry point.'],
    [51, 'A single element range is already sorted.'],
    [53, 'Compute the middle index of the range.'],
    [55, 'Sort the left half.'],
    [56, 'Sort the right half.'],
    [58, 'Merge the two sorted halves back together.'],
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
      description: 'Already sorted — every merge takes the left element first.',
    },
    {
      input: 'arr: [5, 4, 3, 2, 1]',
      expectedOutput: '[1, 2, 3, 4, 5]',
      description: 'Reverse sorted.',
    },
  ],
};
