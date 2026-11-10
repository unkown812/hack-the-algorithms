import type { CodingChallenge } from '../practice/types';

/**
 * Coding challenges.
 *
 * Every challenge ships with a reference solution and with test cases that
 * were verified by running that solution. The `hiddenCases` are never sent to
 * the webview — only the evaluator sees them.
 */

const SORTED_OUTPUT = 'The sorted elements separated by single spaces, followed by a newline.';

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: 'ch-find-minimum',
    title: 'Find the Minimum Element',
    category: 'arrays',
    difficulty: 'beginner',
    problemStatement:
      'Given an array of n integers, find the smallest element and print it. Write a solution that scans the array once.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers separated by spaces.',
    outputFormat: 'Print the minimum element.',
    constraints: ['1 ≤ n ≤ 100000', 'The values fit in a 32 bit signed integer.'],
    sampleCases: [
      { id: 'ch-find-minimum-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1', hidden: false, description: 'The minimum is in the middle.' },
      { id: 'ch-find-minimum-s2', input: '3\n-4 -2 -9\n', expectedOutput: '-9', hidden: false, description: 'Negative values.' },
    ],
    practiceCases: [
      { id: 'ch-find-minimum-p1', input: '1\n42\n', expectedOutput: '42', hidden: false, description: 'A single element.' },
      { id: 'ch-find-minimum-p2', input: '6\n7 7 7 7 7 7\n', expectedOutput: '7', hidden: false, description: 'All elements are equal.' },
    ],
    hiddenCases: [
      { id: 'ch-find-minimum-h1', input: '1000\n' + Array.from({ length: 1000 }, (_, i) => (1000 - i) * 3).join(' ') + '\n', expectedOutput: '3', hidden: true, description: 'Large descending input.' },
      { id: 'ch-find-minimum-h2', input: '2\n2147483647 -2147483648\n', expectedOutput: '-2147483648', hidden: true, description: 'Extreme 32 bit values.' },
    ],
    expectedComplexity: { time: 'O(n)', space: 'O(1)' },
    hints: ['Keep a variable that holds the smallest value seen so far and update it while scanning.'],
    supportedLanguages: ['c'],
    algorithmId: 'linear-search',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int min = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (i == 0 || value < min) {
            min = value;
        }
    }

    printf("%d\\n", min);
    return 0;
}`,
  },
  {
    id: 'ch-find-maximum',
    title: 'Find the Maximum Element',
    category: 'arrays',
    difficulty: 'beginner',
    problemStatement:
      'Given an array of n integers, print the largest element. Scan the array once and keep the largest value.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers separated by spaces.',
    outputFormat: 'Print the maximum element.',
    constraints: ['1 ≤ n ≤ 100000', 'The values fit in a 32 bit signed integer.'],
    sampleCases: [
      { id: 'ch-find-maximum-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '9', hidden: false },
      { id: 'ch-find-maximum-s2', input: '3\n-4 -2 -9\n', expectedOutput: '-2', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-find-maximum-p1', input: '1\n-5\n', expectedOutput: '-5', hidden: false },
      { id: 'ch-find-maximum-p2', input: '4\n2 2 2 2\n', expectedOutput: '2', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-find-maximum-h1', input: '500\n' + Array.from({ length: 500 }, (_, i) => i * 2).join(' ') + '\n', expectedOutput: '998', hidden: true },
      { id: 'ch-find-maximum-h2', input: '2\n2147483647 -2147483648\n', expectedOutput: '2147483647', hidden: true },
    ],
    expectedComplexity: { time: 'O(n)', space: 'O(1)' },
    hints: ['Update the stored maximum whenever a larger value is read.'],
    supportedLanguages: ['c'],
    algorithmId: 'linear-search',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int max = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (i == 0 || value > max) {
            max = value;
        }
    }

    printf("%d\\n", max);
    return 0;
}`,
  },
  {
    id: 'ch-linear-search',
    title: 'Linear Search',
    category: 'searching',
    difficulty: 'beginner',
    problemStatement:
      'Search a key in an unsorted array by comparing it with every element from the beginning. Print the index of the first occurrence, or -1 if the key is not present.',
    inputFormat:
      'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers. The third line contains the key.',
    outputFormat: 'Print the index of the first occurrence of the key, or -1.',
    constraints: ['1 ≤ n ≤ 100000'],
    sampleCases: [
      { id: 'ch-linear-search-s1', input: '5\n5 3 8 1 9\n8\n', expectedOutput: '2', hidden: false },
      { id: 'ch-linear-search-s2', input: '5\n5 3 8 1 9\n7\n', expectedOutput: '-1', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-linear-search-p1', input: '1\n5\n5\n', expectedOutput: '0', hidden: false },
      { id: 'ch-linear-search-p2', input: '4\n4 4 4 4\n4\n', expectedOutput: '0', hidden: false, description: 'The first occurrence is returned.' },
    ],
    hiddenCases: [
      { id: 'ch-linear-search-h1', input: '3\n7 8 9\n9\n', expectedOutput: '2', hidden: true },
      { id: 'ch-linear-search-h2', input: '3\n1 2 3\n0\n', expectedOutput: '-1', hidden: true },
    ],
    expectedComplexity: { time: 'O(n)', space: 'O(n)' },
    hints: ['Stop at the first match — the task asks for the first occurrence.'],
    supportedLanguages: ['c'],
    algorithmId: 'linear-search',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    int key;
    scanf("%d", &key);

    int answer = -1;
    for (int i = 0; i < n; i++) {
        if (arr[i] == key) {
            answer = i;
            break;
        }
    }

    printf("%d\\n", answer);
    return 0;
}`,
  },
  {
    id: 'ch-binary-search',
    title: 'Binary Search',
    category: 'searching',
    difficulty: 'beginner',
    problemStatement:
      'Search a key in a sorted array by repeatedly halving the search interval. Print the index of the key, or -1 if it is not present.',
    inputFormat:
      'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers in ascending order. The third line contains the key.',
    outputFormat: 'Print the index of the key, or -1.',
    constraints: ['1 ≤ n ≤ 100000', 'The array is sorted in ascending order.'],
    sampleCases: [
      { id: 'ch-binary-search-s1', input: '5\n1 3 5 7 9\n7\n', expectedOutput: '3', hidden: false },
      { id: 'ch-binary-search-s2', input: '5\n1 3 5 7 9\n4\n', expectedOutput: '-1', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-binary-search-p1', input: '1\n42\n42\n', expectedOutput: '0', hidden: false },
      { id: 'ch-binary-search-p2', input: '6\n1 2 3 4 5 6\n1\n', expectedOutput: '0', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-binary-search-h1', input: '10\n1 2 3 4 5 6 7 8 9 10\n10\n', expectedOutput: '9', hidden: true },
      { id: 'ch-binary-search-h2', input: '4\n2 4 6 8\n9\n', expectedOutput: '-1', hidden: true },
    ],
    expectedComplexity: { time: 'O(log n)', space: 'O(n)' },
    hints: [
      'Remember that the interval is inclusive: the loop condition is low <= high.',
      'When the key is larger than the midpoint, search the right half — and remember to add 1 to the midpoint.',
    ],
    supportedLanguages: ['c'],
    algorithmId: 'binary-search',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    int key;
    scanf("%d", &key);

    int low = 0;
    int high = n - 1;
    int answer = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == key) {
            answer = mid;
            break;
        } else if (arr[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    printf("%d\\n", answer);
    return 0;
}`,
  },
  {
    id: 'ch-reverse-array',
    title: 'Reverse an Array',
    category: 'arrays',
    difficulty: 'beginner',
    problemStatement:
      'Print the elements of an array in reverse order. The elements must keep their original values — only the order changes.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers separated by spaces.',
    outputFormat: 'The elements in reverse order, separated by single spaces.',
    constraints: ['1 ≤ n ≤ 100000'],
    sampleCases: [
      { id: 'ch-reverse-array-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '9 1 8 3 5', hidden: false },
      { id: 'ch-reverse-array-s2', input: '3\n-1 0 1\n', expectedOutput: '1 0 -1', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-reverse-array-p1', input: '1\n7\n', expectedOutput: '7', hidden: false },
      { id: 'ch-reverse-array-p2', input: '4\n1 1 2 2\n', expectedOutput: '2 2 1 1', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-reverse-array-h1', input: '6\n1 2 3 4 5 6\n', expectedOutput: '6 5 4 3 2 1', hidden: true },
    ],
    expectedComplexity: { time: 'O(n)', space: 'O(n)' },
    hints: ['You can either print the array backwards or swap the elements in place.'],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    for (int i = n - 1; i >= 0; i--) {
        printf("%d%c", arr[i], i == 0 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-bubble-sort',
    title: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'beginner',
    problemStatement:
      'Sort n integers in ascending order using bubble sort: repeatedly walk through the array and exchange adjacent elements that are in the wrong order.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 10000). The second line contains n integers separated by spaces.',
    outputFormat: SORTED_OUTPUT,
    constraints: ['1 ≤ n ≤ 10000'],
    sampleCases: [
      { id: 'ch-bubble-sort-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1 3 5 8 9', hidden: false },
      { id: 'ch-bubble-sort-s2', input: '4\n4 3 2 1\n', expectedOutput: '1 2 3 4', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-bubble-sort-p1', input: '1\n5\n', expectedOutput: '5', hidden: false },
      { id: 'ch-bubble-sort-p2', input: '5\n1 2 3 4 5\n', expectedOutput: '1 2 3 4 5', hidden: false, description: 'Already sorted.' },
    ],
    hiddenCases: [
      { id: 'ch-bubble-sort-h1', input: '8\n9 8 7 6 5 4 3 2\n', expectedOutput: '2 3 4 5 6 7 8 9', hidden: true },
      { id: 'ch-bubble-sort-h2', input: '6\n3 3 1 1 2 2\n', expectedOutput: '1 1 2 2 3 3', hidden: true, description: 'Duplicates.' },
    ],
    expectedComplexity: { time: 'O(n²)', space: 'O(1)' },
    hints: ['The inner loop gets shorter by one in every pass.'],
    supportedLanguages: ['c'],
    algorithmId: 'bubble-sort',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[10000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

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

    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-selection-sort',
    title: 'Selection Sort',
    category: 'sorting',
    difficulty: 'beginner',
    problemStatement:
      'Sort n integers in ascending order using selection sort: in every pass find the smallest element of the unsorted part and exchange it with the first element of that part.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 10000). The second line contains n integers separated by spaces.',
    outputFormat: SORTED_OUTPUT,
    constraints: ['1 ≤ n ≤ 10000'],
    sampleCases: [
      { id: 'ch-selection-sort-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1 3 5 8 9', hidden: false },
      { id: 'ch-selection-sort-s2', input: '4\n4 3 2 1\n', expectedOutput: '1 2 3 4', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-selection-sort-p1', input: '2\n2 1\n', expectedOutput: '1 2', hidden: false },
      { id: 'ch-selection-sort-p2', input: '5\n10 -5 0 7 3\n', expectedOutput: '-5 0 3 7 10', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-selection-sort-h1', input: '7\n7 6 5 4 3 2 1\n', expectedOutput: '1 2 3 4 5 6 7', hidden: true },
    ],
    expectedComplexity: { time: 'O(n²)', space: 'O(1)' },
    hints: ['Keep the index of the smallest element while scanning the unsorted part.'],
    supportedLanguages: ['c'],
    algorithmId: 'selection-sort',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[10000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

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

    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-insertion-sort',
    title: 'Insertion Sort',
    category: 'sorting',
    difficulty: 'beginner',
    problemStatement:
      'Sort n integers in ascending order using insertion sort: take the elements one by one and insert each of them into the sorted part in front of it.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 10000). The second line contains n integers separated by spaces.',
    outputFormat: SORTED_OUTPUT,
    constraints: ['1 ≤ n ≤ 10000'],
    sampleCases: [
      { id: 'ch-insertion-sort-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1 3 5 8 9', hidden: false },
      { id: 'ch-insertion-sort-s2', input: '4\n4 3 2 1\n', expectedOutput: '1 2 3 4', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-insertion-sort-p1', input: '3\n3 1 2\n', expectedOutput: '1 2 3', hidden: false },
      { id: 'ch-insertion-sort-p2', input: '5\n1 2 3 4 5\n', expectedOutput: '1 2 3 4 5', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-insertion-sort-h1', input: '6\n6 5 4 3 2 1\n', expectedOutput: '1 2 3 4 5 6', hidden: true },
    ],
    expectedComplexity: { time: 'O(n²)', space: 'O(1)' },
    hints: ['Save the current element in a temporary variable before you shift the others.'],
    supportedLanguages: ['c'],
    algorithmId: 'insertion-sort',
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[10000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }

    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-merge-sort',
    title: 'Merge Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    problemStatement:
      'Sort n integers in ascending order using merge sort: split the array in half, sort both halves recursively and merge them.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers separated by spaces.',
    outputFormat: SORTED_OUTPUT,
    constraints: ['1 ≤ n ≤ 100000'],
    sampleCases: [
      { id: 'ch-merge-sort-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1 3 5 8 9', hidden: false },
      { id: 'ch-merge-sort-s2', input: '6\n6 5 4 3 2 1\n', expectedOutput: '1 2 3 4 5 6', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-merge-sort-p1', input: '4\n4 3 2 1\n', expectedOutput: '1 2 3 4', hidden: false },
      { id: 'ch-merge-sort-p2', input: '2\n2 1\n', expectedOutput: '1 2', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-merge-sort-h1', input: '8\n8 4 2 6 1 3 5 7\n', expectedOutput: '1 2 3 4 5 6 7 8', hidden: true },
      { id: 'ch-merge-sort-h2', input: '5\n-5 5 -3 3 0\n', expectedOutput: '-5 -3 0 3 5', hidden: true },
    ],
    expectedComplexity: { time: 'O(n log n)', space: 'O(n)' },
    hints: [
      'A merge needs a temporary array that holds the two halves side by side.',
      'Remember that the merged elements have to be written back into the original array.',
    ],
    supportedLanguages: ['c'],
    algorithmId: 'merge-sort',
    referenceSolution: `#include <stdio.h>

void merge(int arr[], int left, int mid, int right, int temp[]) {
    int i = left;
    int j = mid + 1;
    int k = left;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    while (i <= mid) {
        temp[k++] = arr[i++];
    }
    while (j <= right) {
        temp[k++] = arr[j++];
    }
    for (int p = left; p <= right; p++) {
        arr[p] = temp[p];
    }
}

void mergeSort(int arr[], int left, int right, int temp[]) {
    if (left >= right) {
        return;
    }
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid, temp);
    mergeSort(arr, mid + 1, right, temp);
    merge(arr, left, mid, right, temp);
}

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[100000];
    int temp[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    mergeSort(arr, 0, n - 1, temp);

    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-quick-sort',
    title: 'Quick Sort',
    category: 'sorting',
    difficulty: 'intermediate',
    problemStatement:
      'Sort n integers in ascending order using quick sort: pick a pivot, partition the range around it and sort the two parts recursively.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 100000). The second line contains n integers separated by spaces.',
    outputFormat: SORTED_OUTPUT,
    constraints: ['1 ≤ n ≤ 100000'],
    sampleCases: [
      { id: 'ch-quick-sort-s1', input: '5\n5 3 8 1 9\n', expectedOutput: '1 3 5 8 9', hidden: false },
      { id: 'ch-quick-sort-s2', input: '6\n6 5 4 3 2 1\n', expectedOutput: '1 2 3 4 5 6', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-quick-sort-p1', input: '5\n1 2 3 4 5\n', expectedOutput: '1 2 3 4 5', hidden: false },
      { id: 'ch-quick-sort-p2', input: '3\n3 1 2\n', expectedOutput: '1 2 3', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-quick-sort-h1', input: '7\n7 3 9 1 5 8 2\n', expectedOutput: '1 2 3 5 7 8 9', hidden: true },
    ],
    expectedComplexity: { time: 'O(n log n) on average', space: 'O(log n)' },
    hints: [
      'The partition step returns the final position of the pivot.',
      'Remember the base case: a range with a single element is already sorted.',
    ],
    supportedLanguages: ['c'],
    algorithmId: 'quick-sort',
    referenceSolution: `#include <stdio.h>

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
}

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    quickSort(arr, 0, n - 1);

    for (int i = 0; i < n; i++) {
        printf("%d%c", arr[i], i == n - 1 ? '\\n' : ' ');
    }

    return 0;
}`,
  },
  {
    id: 'ch-fractional-knapsack',
    title: 'Fractional Knapsack',
    category: 'greedy',
    difficulty: 'intermediate',
    problemStatement:
      'Given n items with a weight and a value and a knapsack of a given capacity, fill the knapsack with the maximum total value. Items may be taken in fractions.',
    inputFormat:
      'The first line contains n (1 ≤ n ≤ 100000). The next n lines contain the weight and the value of an item. The last line contains the capacity of the knapsack.',
    outputFormat: 'Print the maximum value with two decimals.',
    constraints: [
      '1 ≤ n ≤ 100000',
      'The capacity and the weights are positive integers.',
      'The result fits in a double.',
    ],
    sampleCases: [
      { id: 'ch-fractional-knapsack-s1', input: '3\n10 60\n20 100\n30 120\n50\n', expectedOutput: '240.00', hidden: false },
      { id: 'ch-fractional-knapsack-s2', input: '2\n10 60\n20 100\n50\n', expectedOutput: '160.00', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-fractional-knapsack-p1', input: '1\n5 10\n5\n', expectedOutput: '10.00', hidden: false },
      { id: 'ch-fractional-knapsack-p2', input: '2\n10 60\n20 100\n10\n', expectedOutput: '60.00', hidden: false, description: 'Only the first item fits.' },
    ],
    hiddenCases: [
      { id: 'ch-fractional-knapsack-h1', input: '3\n10 60\n20 100\n30 120\n20\n', expectedOutput: '110.00', hidden: true },
      { id: 'ch-fractional-knapsack-h2', input: '4\n5 10\n10 20\n15 30\n20 40\n30\n', expectedOutput: '60.00', hidden: true },
    ],
    expectedComplexity: { time: 'O(n log n)', space: 'O(n)' },
    hints: [
      'Sort the items by decreasing value per unit of weight.',
      'The last item that does not fit completely is taken only partially.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

typedef struct {
    int weight;
    int value;
} Item;

void sortItems(Item items[], int n) {
    for (int i = 1; i < n; i++) {
        Item key = items[i];
        int j = i - 1;
        while (j >= 0 && items[j].value * key.weight < key.value * items[j].weight) {
            items[j + 1] = items[j];
            j--;
        }
        items[j + 1] = key;
    }
}

int main(void) {
    int n;
    scanf("%d", &n);

    Item items[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &items[i].weight, &items[i].value);
    }

    int capacity;
    scanf("%d", &capacity);

    sortItems(items, n);

    double total = 0.0;
    int remaining = capacity;

    for (int i = 0; i < n && remaining > 0; i++) {
        if (items[i].weight <= remaining) {
            total += items[i].value;
            remaining -= items[i].weight;
        } else {
            total += (double)items[i].value * remaining / items[i].weight;
            remaining = 0;
        }
    }

    printf("%.2f\\n", total);
    return 0;
}`,
  },
  {
    id: 'ch-activity-selection',
    title: 'Activity Selection',
    category: 'greedy',
    difficulty: 'intermediate',
    problemStatement:
      'Given activities with a start and an end time, select the largest number of activities that do not overlap. Two activities are compatible when one starts at or after the other ends.',
    inputFormat:
      'The first line contains n (1 ≤ n ≤ 100000). The next n lines contain the start and the end time of an activity.',
    outputFormat: 'Print the maximum number of activities that can be selected.',
    constraints: ['1 ≤ n ≤ 100000', 'The end time is never smaller than the start time.'],
    sampleCases: [
      { id: 'ch-activity-selection-s1', input: '3\n1 3\n2 5\n3 7\n', expectedOutput: '2', hidden: false },
      { id: 'ch-activity-selection-s2', input: '4\n1 2\n2 3\n3 4\n4 5\n', expectedOutput: '4', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-activity-selection-p1', input: '1\n5 6\n', expectedOutput: '1', hidden: false },
      { id: 'ch-activity-selection-p2', input: '3\n1 4\n2 3\n3 5\n', expectedOutput: '2', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-activity-selection-h1', input: '5\n1 3\n2 4\n3 5\n4 6\n5 7\n', expectedOutput: '3', hidden: true },
    ],
    expectedComplexity: { time: 'O(n log n)', space: 'O(n)' },
    hints: ['Sort the activities by their end time and always take the first one that still fits.'],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

typedef struct {
    int start;
    int end;
} Activity;

void sortByEnd(Activity activities[], int n) {
    for (int i = 1; i < n; i++) {
        Activity key = activities[i];
        int j = i - 1;
        while (j >= 0 && activities[j].end > key.end) {
            activities[j + 1] = activities[j];
            j--;
        }
        activities[j + 1] = key;
    }
}

int main(void) {
    int n;
    scanf("%d", &n);

    Activity activities[100000];
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &activities[i].start, &activities[i].end);
    }

    sortByEnd(activities, n);

    int count = 0;
    int lastEnd = -1;

    for (int i = 0; i < n; i++) {
        if (activities[i].start >= lastEnd) {
            count++;
            lastEnd = activities[i].end;
        }
    }

    printf("%d\\n", count);
    return 0;
}`,
  },
  {
    id: 'ch-lcs-length',
    title: 'Longest Common Subsequence',
    category: 'dynamic-programming',
    difficulty: 'intermediate',
    problemStatement:
      'Given two strings, find the length of their longest common subsequence — the longest sequence of characters that appears in both strings in the same order.',
    inputFormat: 'The first line contains the first string, the second line the second string (no spaces).',
    outputFormat: 'Print the length of the longest common subsequence.',
    constraints: ['The length of each string is at most 2000.'],
    sampleCases: [
      { id: 'ch-lcs-length-s1', input: 'ABCBDAB\nBDCABA\n', expectedOutput: '4', hidden: false },
      { id: 'ch-lcs-length-s2', input: 'AGGTAB\nGXTXAYB\n', expectedOutput: '4', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-lcs-length-p1', input: 'abc\nabc\n', expectedOutput: '3', hidden: false },
      { id: 'ch-lcs-length-p2', input: 'abc\nxyz\n', expectedOutput: '0', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-lcs-length-h1', input: 'aaaa\naaaa\n', expectedOutput: '4', hidden: true },
      { id: 'ch-lcs-length-h2', input: 'ABCDE\nECDE\n', expectedOutput: '3', hidden: true },
    ],
    expectedComplexity: { time: 'O(mn)', space: 'O(mn)' },
    hints: [
      'Fill a table where dp[i][j] is the LCS length of the first i and the first j characters.',
      'If the last characters are equal, take them; otherwise take the better of the two neighbours.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>
#include <string.h>

int main(void) {
    char a[2005];
    char b[2005];

    scanf("%2000s", a);
    scanf("%2000s", b);

    int m = (int)strlen(a);
    int n = (int)strlen(b);

    static int dp[2001][2001];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                int up = dp[i - 1][j];
                int left = dp[i][j - 1];
                dp[i][j] = up > left ? up : left;
            }
        }
    }

    printf("%d\\n", dp[m][n]);
    return 0;
}`,
  },
  {
    id: 'ch-matrix-chain',
    title: 'Matrix Chain Multiplication',
    category: 'dynamic-programming',
    difficulty: 'intermediate',
    problemStatement:
      'Given the dimensions of n matrices that are multiplied in the given order, find the minimum number of scalar multiplications needed.',
    inputFormat:
      'The first line contains n (1 ≤ n ≤ 100). The second line contains n + 1 dimensions p0 … pn.',
    outputFormat: 'Print the minimum number of scalar multiplications.',
    constraints: ['1 ≤ n ≤ 100', 'The dimensions fit in a 32 bit signed integer.'],
    sampleCases: [
      { id: 'ch-matrix-chain-s1', input: '3\n10 30 5 60\n', expectedOutput: '4500', hidden: false },
      { id: 'ch-matrix-chain-s2', input: '1\n10 30\n', expectedOutput: '0', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-matrix-chain-p1', input: '2\n2 3 4\n', expectedOutput: '24', hidden: false },
      { id: 'ch-matrix-chain-p2', input: '4\n5 10 10 20 35\n', expectedOutput: '5000', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-matrix-chain-h1', input: '4\n40 20 30 10 30\n', expectedOutput: '26000', hidden: true },
    ],
    expectedComplexity: { time: 'O(n³)', space: 'O(n²)' },
    hints: [
      'dp[i][j] is the minimum cost of multiplying the matrices i … j.',
      'Try every split point k between i and j and take the cheapest one.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int p[105];
    for (int i = 0; i <= n; i++) {
        scanf("%d", &p[i]);
    }

    static int dp[105][105];

    for (int length = 2; length <= n; length++) {
        for (int i = 1; i + length - 1 <= n; i++) {
            int j = i + length - 1;
            dp[i][j] = 1000000000;
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
                if (cost < dp[i][j]) {
                    dp[i][j] = cost;
                }
            }
        }
    }

    printf("%d\\n", dp[1][n]);
    return 0;
}`,
  },
  {
    id: 'ch-bfs',
    title: 'Breadth First Search',
    category: 'graph',
    difficulty: 'intermediate',
    problemStatement:
      'Given an undirected graph, print the vertices in the order in which a breadth first search starting at vertex 0 visits them.',
    inputFormat:
      'The first line contains n and m (the number of vertices and edges). The next m lines contain the two endpoints of an edge. The last line contains the start vertex.',
    outputFormat: 'The visited vertices separated by single spaces.',
    constraints: ['1 ≤ n ≤ 1000', '0 ≤ m ≤ 10000'],
    sampleCases: [
      { id: 'ch-bfs-s1', input: '5 4\n0 1\n0 2\n1 3\n2 4\n0\n', expectedOutput: '0 1 2 3 4', hidden: false },
      { id: 'ch-bfs-s2', input: '4 2\n0 1\n2 3\n0\n', expectedOutput: '0 1', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-bfs-p1', input: '1 0\n0\n', expectedOutput: '0', hidden: false },
      { id: 'ch-bfs-p2', input: '3 2\n0 1\n1 2\n2\n', expectedOutput: '2 1 0', hidden: false, description: 'The search starts at vertex 2.' },
    ],
    hiddenCases: [
      { id: 'ch-bfs-h1', input: '4 3\n0 1\n1 2\n2 3\n0\n', expectedOutput: '0 1 2 3', hidden: true },
    ],
    expectedComplexity: { time: 'O(V + E)', space: 'O(V + E)' },
    hints: ['Use a queue: take the first vertex out, add its unvisited neighbours to the back.'],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

int main(void) {
    int n, m;
    scanf("%d %d", &n, &m);

    static int adj[1000][1000];
    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d %d", &u, &v);
        adj[u][v] = 1;
        adj[v][u] = 1;
    }

    int start;
    scanf("%d", &start);

    static int visited[1000];
    int queue[1000];
    int head = 0;
    int tail = 0;

    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
        int node = queue[head++];
        printf("%d ", node);
        for (int next = 0; next < n; next++) {
            if (adj[node][next] && !visited[next]) {
                visited[next] = 1;
                queue[tail++] = next;
            }
        }
    }

    printf("\\n");

    return 0;
}`,
  },
  {
    id: 'ch-dfs',
    title: 'Depth First Search',
    category: 'graph',
    difficulty: 'intermediate',
    problemStatement:
      'Given an undirected graph, print the vertices in the order in which a depth first search starting at vertex 0 visits them.',
    inputFormat:
      'The first line contains n and m (the number of vertices and edges). The next m lines contain the two endpoints of an edge. The last line contains the start vertex.',
    outputFormat: 'The visited vertices separated by single spaces.',
    constraints: ['1 ≤ n ≤ 1000', '0 ≤ m ≤ 10000'],
    sampleCases: [
      { id: 'ch-dfs-s1', input: '5 4\n0 1\n0 2\n1 3\n2 4\n0\n', expectedOutput: '0 1 3 2 4', hidden: false },
      { id: 'ch-dfs-s2', input: '4 2\n0 1\n2 3\n0\n', expectedOutput: '0 1', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-dfs-p1', input: '1 0\n0\n', expectedOutput: '0', hidden: false },
      { id: 'ch-dfs-p2', input: '3 2\n0 1\n1 2\n2\n', expectedOutput: '2 1 0', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-dfs-h1', input: '4 3\n0 1\n1 2\n2 3\n0\n', expectedOutput: '0 1 2 3', hidden: true },
    ],
    expectedComplexity: { time: 'O(V + E)', space: 'O(V + E)' },
    hints: ['Use recursion: visit the neighbours of a vertex one after the other.'],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

static int adj[1000][1000];
static int visited[1000];

void dfs(int node, int n) {
    visited[node] = 1;
    printf("%d ", node);
    for (int next = 0; next < n; next++) {
        if (adj[node][next] && !visited[next]) {
            dfs(next, n);
        }
    }
}

int main(void) {
    int n, m;
    scanf("%d %d", &n, &m);

    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d %d", &u, &v);
        adj[u][v] = 1;
        adj[v][u] = 1;
    }

    int start;
    scanf("%d", &start);

    dfs(start, n);

    printf("\\n");

    return 0;
}`,
  },
  {
    id: 'ch-dijkstra',
    title: 'Dijkstra\'s Shortest Path',
    category: 'graph',
    difficulty: 'advanced',
    problemStatement:
      'Given a weighted graph with non-negative edge weights, compute the shortest distance from a source vertex to every other vertex.',
    inputFormat:
      'The first line contains n and m. The next m lines contain the edges as "u v w". The last line contains the source vertex.',
    outputFormat:
      'The distances from the source to the vertices 0 … n−1, separated by spaces. An unreachable vertex is printed as "INF".',
    constraints: ['1 ≤ n ≤ 1000', '0 ≤ m ≤ 10000', 'All edge weights are non-negative.'],
    sampleCases: [
      { id: 'ch-dijkstra-s1', input: '4 4\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n0\n', expectedOutput: '0 3 1 4', hidden: false },
      { id: 'ch-dijkstra-s2', input: '3 1\n0 1 5\n0\n', expectedOutput: '0 5 INF', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-dijkstra-p1', input: '1 0\n0\n', expectedOutput: '0', hidden: false },
      { id: 'ch-dijkstra-p2', input: '3 3\n0 1 1\n1 2 2\n0 2 10\n0\n', expectedOutput: '0 1 3', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-dijkstra-h1', input: '5 6\n0 1 2\n1 2 3\n0 3 6\n3 4 1\n2 4 4\n1 3 1\n0\n', expectedOutput: '0 2 5 3 4', hidden: true },
    ],
    expectedComplexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    hints: [
      'Always continue with the vertex whose distance is currently the smallest.',
      'A vertex that was finalised must never be relaxed again.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 1005

static int adj[MAXN][MAXN];

int main(void) {
    int n, m;
    scanf("%d %d", &n, &m);

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            adj[i][j] = -1;
        }
    }

    for (int i = 0; i < m; i++) {
        int u, v, w;
        scanf("%d %d %d", &u, &v, &w);
        if (adj[u][v] == -1 || w < adj[u][v]) {
            adj[u][v] = w;
            adj[v][u] = w;
        }
    }

    int source;
    scanf("%d", &source);

    int dist[MAXN];
    int done[MAXN];
    for (int i = 0; i < n; i++) {
        dist[i] = 1000000000;
        done[i] = 0;
    }
    dist[source] = 0;

    for (int step = 0; step < n; step++) {
        int best = -1;
        for (int i = 0; i < n; i++) {
            if (!done[i] && (best == -1 || dist[i] < dist[best])) {
                best = i;
            }
        }
        if (best == -1 || dist[best] == 1000000000) {
            break;
        }
        done[best] = 1;
        for (int next = 0; next < n; next++) {
            if (adj[best][next] >= 0 && dist[best] + adj[best][next] < dist[next]) {
                dist[next] = dist[best] + adj[best][next];
            }
        }
    }

    for (int i = 0; i < n; i++) {
        if (i > 0) {
            printf(" ");
        }
        if (dist[i] == 1000000000) {
            printf("INF");
        } else {
            printf("%d", dist[i]);
        }
    }
    printf("\\n");

    return 0;
}`,
  },
  {
    id: 'ch-bellman-ford',
    title: 'Bellman-Ford Shortest Path',
    category: 'graph',
    difficulty: 'advanced',
    problemStatement:
      'Given a weighted graph that may contain negative edge weights, compute the shortest distance from a source vertex to every other vertex.',
    inputFormat:
      'The first line contains n and m. The next m lines contain the edges as "u v w". The last line contains the source vertex.',
    outputFormat:
      'The distances from the source to the vertices 0 … n−1, separated by spaces. An unreachable vertex is printed as "INF".',
    constraints: ['1 ≤ n ≤ 1000', '0 ≤ m ≤ 10000'],
    sampleCases: [
      { id: 'ch-bellman-ford-s1', input: '4 4\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n0\n', expectedOutput: '0 3 1 4', hidden: false },
      { id: 'ch-bellman-ford-s2', input: '2 1\n0 1 -3\n0\n', expectedOutput: '0 -3', hidden: false, description: 'A negative edge weight.' },
    ],
    practiceCases: [
      { id: 'ch-bellman-ford-p1', input: '1 0\n0\n', expectedOutput: '0', hidden: false },
      { id: 'ch-bellman-ford-p2', input: '3 1\n0 1 5\n0\n', expectedOutput: '0 5 INF', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-bellman-ford-h1', input: '4 5\n0 1 1\n0 2 4\n1 2 -2\n2 3 3\n1 3 7\n0\n', expectedOutput: '0 1 -1 2', hidden: true },
    ],
    expectedComplexity: { time: 'O(V · E)', space: 'O(V + E)' },
    hints: ['Relax every edge n − 1 times, then relax once more to detect a negative cycle.'],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 1005
#define MAXM 10005

int main(void) {
    int n, m;
    scanf("%d %d", &n, &m);

    int from[MAXM], to[MAXM], weight[MAXM];
    for (int i = 0; i < m; i++) {
        scanf("%d %d %d", &from[i], &to[i], &weight[i]);
    }

    int source;
    scanf("%d", &source);

    int dist[MAXN];
    for (int i = 0; i < n; i++) {
        dist[i] = 1000000000;
    }
    dist[source] = 0;

    for (int round = 0; round < n - 1; round++) {
        int changed = 0;
        for (int i = 0; i < m; i++) {
            if (dist[from[i]] != 1000000000 && dist[from[i]] + weight[i] < dist[to[i]]) {
                dist[to[i]] = dist[from[i]] + weight[i];
                changed = 1;
            }
        }
        if (!changed) {
            break;
        }
    }

    for (int i = 0; i < n; i++) {
        if (i > 0) {
            printf(" ");
        }
        if (dist[i] == 1000000000) {
            printf("INF");
        } else {
            printf("%d", dist[i]);
        }
    }
    printf("\\n");

    return 0;
}`,
  },
  {
    id: 'ch-floyd-warshall',
    title: 'Floyd-Warshall All-Pairs Shortest Path',
    category: 'graph',
    difficulty: 'advanced',
    problemStatement:
      'Given a directed weighted graph, compute the shortest distance between every pair of vertices.',
    inputFormat:
      'The first line contains n. The next n lines contain the adjacency matrix of the graph (0 means "no edge").',
    outputFormat: 'n lines with the distances of one row each, separated by spaces. "INF" marks an unreachable pair.',
    constraints: ['1 ≤ n ≤ 100'],
    sampleCases: [
      { id: 'ch-floyd-warshall-s1', input: '4\n0 3 0 7\n0 0 4 2\n0 0 0 1\n0 0 0 0\n', expectedOutput: '0 3 7 5\nINF 0 4 2\nINF INF 0 1\nINF INF INF 0', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-floyd-warshall-p1', input: '1\n0\n', expectedOutput: '0', hidden: false },
      { id: 'ch-floyd-warshall-p2', input: '2\n0 5\n5 0\n', expectedOutput: '0 5\n5 0', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-floyd-warshall-h1', input: '3\n0 2 0\n0 0 1\n0 0 0\n', expectedOutput: '0 2 3\nINF 0 1\nINF INF 0', hidden: true },
    ],
    expectedComplexity: { time: 'O(V³)', space: 'O(V²)' },
    hints: [
      'For every vertex k, check whether going through k shortens the path between i and j.',
      'Watch out: 0 means "no edge" in the input, not "distance zero".',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 105
#define INF 1000000000

int main(void) {
    int n;
    scanf("%d", &n);

    int dist[MAXN][MAXN];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            int value;
            scanf("%d", &value);
            dist[i][j] = (value == 0 && i != j) ? INF : value;
        }
    }

    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (j > 0) {
                printf(" ");
            }
            if (dist[i][j] == INF) {
                printf("INF");
            } else {
                printf("%d", dist[i][j]);
            }
        }
        printf("\\n");
    }

    return 0;
}`,
  },
  {
    id: 'ch-n-queens',
    title: 'N-Queens Problem',
    category: 'backtracking',
    difficulty: 'advanced',
    problemStatement:
      'Place n queens on an n × n chessboard so that no two queens attack each other, and count the number of ways to do it.',
    inputFormat: 'The first line contains n (1 ≤ n ≤ 10).',
    outputFormat: 'Print the number of solutions.',
    constraints: ['1 ≤ n ≤ 10'],
    sampleCases: [
      { id: 'ch-n-queens-s1', input: '4\n', expectedOutput: '2', hidden: false },
      { id: 'ch-n-queens-s2', input: '8\n', expectedOutput: '92', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-n-queens-p1', input: '1\n', expectedOutput: '1', hidden: false },
      { id: 'ch-n-queens-p2', input: '2\n', expectedOutput: '0', hidden: false },
      { id: 'ch-n-queens-p3', input: '3\n', expectedOutput: '0', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-n-queens-h1', input: '5\n', expectedOutput: '10', hidden: true },
      { id: 'ch-n-queens-h2', input: '6\n', expectedOutput: '4', hidden: true },
    ],
    expectedComplexity: { time: 'exponential', space: 'O(n)' },
    hints: [
      'Place one queen per row and remember in which columns and diagonals a queen already stands.',
      'Prune a branch as soon as a position is attacked.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 16

static int columns[MAXN];
static int diag1[2 * MAXN];
static int diag2[2 * MAXN];
static int solutions = 0;

int canPlace(int row, int col) {
    for (int i = 0; i < row; i++) {
        if (columns[i] == col || row - i == col - columns[i] || row - i == columns[i] - col) {
            return 0;
        }
    }
    return 1;
}

void solve(int row, int n) {
    if (row == n) {
        solutions++;
        return;
    }
    for (int col = 0; col < n; col++) {
        if (!canPlace(row, col)) {
            continue;
        }
        columns[row] = col;
        solve(row + 1, n);
    }
}

int main(void) {
    int n;
    scanf("%d", &n);

    for (int i = 0; i < MAXN; i++) {
        columns[i] = -1;
    }

    solve(0, n);

    printf("%d\\n", solutions);
    return 0;
}`,
  },
  {
    id: 'ch-graph-coloring',
    title: 'Graph Colouring',
    category: 'backtracking',
    difficulty: 'advanced',
    problemStatement:
      'Colour the vertices of an undirected graph with at most k colours so that no two adjacent vertices share a colour. Print the smallest number of colours that is needed, or -1 if the graph cannot be coloured with the given limit.',
    inputFormat:
      'The first line contains n, m and k. The next m lines contain the two endpoints of an edge.',
    outputFormat: 'Print the minimum number of colours, or -1.',
    constraints: ['1 ≤ n ≤ 50', '0 ≤ m ≤ 500', '1 ≤ k ≤ 4'],
    sampleCases: [
      { id: 'ch-graph-coloring-s1', input: '3 3 3\n0 1\n1 2\n2 0\n', expectedOutput: '3', hidden: false },
      { id: 'ch-graph-coloring-s2', input: '2 1 2\n0 1\n', expectedOutput: '2', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-graph-coloring-p1', input: '1 0 1\n', expectedOutput: '1', hidden: false },
      { id: 'ch-graph-coloring-p2', input: '4 4 2\n0 1\n1 2\n2 3\n3 0\n', expectedOutput: '2', hidden: false, description: 'An even cycle can be coloured with two colours.' },
    ],
    hiddenCases: [
      { id: 'ch-graph-coloring-h1', input: '5 5 3\n0 1\n1 2\n2 3\n3 4\n4 0\n', expectedOutput: '3', hidden: true },
    ],
    expectedComplexity: { time: 'exponential', space: 'O(V + E)' },
    hints: [
      'Try the colours one by one and backtrack when a vertex cannot be coloured.',
      'To find the minimum, try the limits 1, 2, … k in order.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 55
#define MAXM 505

static int adj[MAXN][MAXN];
static int color[MAXN];
int n, m, maxColours, currentLimit;

int colour(int index) {
    if (index == n) {
        return 1;
    }
    for (int c = 1; c <= currentLimit; c++) {
        int allowed = 1;
        for (int v = 0; v < n; v++) {
            if (adj[index][v] && color[v] == c) {
                allowed = 0;
                break;
            }
        }
        if (allowed) {
            color[index] = c;
            if (colour(index + 1)) {
                return 1;
            }
            color[index] = 0;
        }
    }
    return 0;
}

int main(void) {
    scanf("%d %d %d", &n, &m, &maxColours);
    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d %d", &u, &v);
        adj[u][v] = 1;
        adj[v][u] = 1;
    }

    for (int colours = 1; colours <= maxColours; colours++) {
        currentLimit = colours;
        for (int i = 0; i < n; i++) {
            color[i] = 0;
        }
        if (colour(0)) {
            printf("%d\\n", colours);
            return 0;
        }
    }

    printf("-1\\n");
    return 0;
}`,
  },
  {
    id: 'ch-tsp',
    title: 'Travelling Salesperson Problem',
    category: 'branch-and-bound',
    difficulty: 'advanced',
    problemStatement:
      'Given the cost matrix of a complete graph, find the cheapest tour that visits every vertex exactly once and returns to the start vertex.',
    inputFormat:
      'The first line contains n. The next n lines contain the cost matrix (n × n integers).',
    outputFormat: 'Print the cost of the cheapest tour.',
    constraints: ['1 ≤ n ≤ 12', 'The costs are non-negative integers.'],
    sampleCases: [
      { id: 'ch-tsp-s1', input: '3\n0 10 15\n10 0 20\n15 20 0\n', expectedOutput: '45', hidden: false },
      { id: 'ch-tsp-s2', input: '1\n0\n', expectedOutput: '0', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-tsp-p1', input: '2\n0 5\n5 0\n', expectedOutput: '10', hidden: false },
      { id: 'ch-tsp-p2', input: '4\n0 10 15 20\n10 0 10 25\n15 10 0 30\n20 25 30 0\n', expectedOutput: '70', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-tsp-h1', input: '3\n0 5 1\n5 0 2\n1 2 0\n', expectedOutput: '8', hidden: true },
    ],
    expectedComplexity: { time: 'exponential', space: 'O(n²)' },
    hints: [
      'Use backtracking and keep the best complete tour found so far.',
      'Prune a partial tour when its current cost already exceeds the best tour.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXN 15

int cost[MAXN][MAXN];
int n;
int best;
int path[MAXN];
int used[MAXN];

void search(int depth, int current, int accumulated) {
    if (accumulated >= best) {
        return;
    }
    if (depth == n) {
        best = accumulated + cost[current][0];
        return;
    }
    for (int next = 1; next < n; next++) {
        if (!used[next]) {
            used[next] = 1;
            path[depth] = next;
            search(depth + 1, next, accumulated + cost[current][next]);
            used[next] = 0;
        }
    }
}

int main(void) {
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &cost[i][j]);
        }
    }

    best = 1000000000;
    search(1, 0, 0);

    printf("%d\\n", best);
    return 0;
}`,
  },
  {
    id: 'ch-0-1-knapsack',
    title: '0/1 Knapsack Problem',
    category: 'branch-and-bound',
    difficulty: 'advanced',
    problemStatement:
      'Given n items with a value and a weight and a knapsack of a given capacity, find the maximum total value. Each item can be taken at most once.',
    inputFormat:
      'The first line contains n and the capacity. The next n lines contain the value and the weight of an item.',
    outputFormat: 'Print the maximum total value.',
    constraints: ['1 ≤ n ≤ 100', '1 ≤ capacity ≤ 1000'],
    sampleCases: [
      { id: 'ch-0-1-knapsack-s1', input: '3 50\n60 10\n100 20\n120 30\n', expectedOutput: '220', hidden: false },
      { id: 'ch-0-1-knapsack-s2', input: '2 10\n60 10\n100 20\n', expectedOutput: '60', hidden: false },
    ],
    practiceCases: [
      { id: 'ch-0-1-knapsack-p1', input: '1 5\n10 5\n', expectedOutput: '10', hidden: false },
      { id: 'ch-0-1-knapsack-p2', input: '2 10\n60 10\n100 20\n', expectedOutput: '60', hidden: false },
    ],
    hiddenCases: [
      { id: 'ch-0-1-knapsack-h1', input: '4 7\n10 5\n20 3\n30 2\n40 1\n', expectedOutput: '90', hidden: true },
    ],
    expectedComplexity: { time: 'O(n · capacity)', space: 'O(capacity)' },
    hints: [
      'A 0/1 knapsack cannot be solved greedily — use dynamic programming over the capacity.',
      'dp[c] is the best value that fits into a knapsack of capacity c.',
    ],
    supportedLanguages: ['c'],
    referenceSolution: `#include <stdio.h>

#define MAXC 1005

int main(void) {
    int n, capacity;
    scanf("%d %d", &n, &capacity);

    int value[105], weight[105];
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &value[i], &weight[i]);
    }

    int dp[MAXC];
    for (int c = 0; c <= capacity; c++) {
        dp[c] = 0;
    }

    for (int i = 0; i < n; i++) {
        for (int c = capacity; c >= weight[i]; c--) {
            int candidate = dp[c - weight[i]] + value[i];
            if (candidate > dp[c]) {
                dp[c] = candidate;
            }
        }
    }

    printf("%d\\n", dp[capacity]);
    return 0;
}`,
  },
];
