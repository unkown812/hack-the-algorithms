#include <stdio.h>

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
}