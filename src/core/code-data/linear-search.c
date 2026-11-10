#include <stdio.h>

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
}