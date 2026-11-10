#include <stdio.h>

/**
 * Selection Sort - C Implementation
 * Divides the array into sorted and unsorted parts, repeatedly selecting the minimum element from the unsorted part.
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
}