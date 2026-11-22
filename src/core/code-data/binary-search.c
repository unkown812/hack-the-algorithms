#include <stdio.h>

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
}