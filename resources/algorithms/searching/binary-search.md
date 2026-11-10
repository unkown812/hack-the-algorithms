# Binary Search

## Overview

Binary Search is a searching algorithm that works on a sorted array. It repeatedly divides the search interval into two halves until the required element is found or the search interval becomes empty.

## Problem Statement

Given a sorted array of `n` elements and a target key, find the position of the key in the array. If the key is not present, indicate that it was not found.

## Theory

Binary Search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you have narrowed down the possible locations to just one. The key requirement is that the array must be sorted.

## Approach

The algorithm maintains two pointers, `low` and `high`, representing the current search interval. It calculates the middle index `mid`. If the middle element equals the key, the search is successful. If the middle element is less than the key, the search continues in the right half (`low = mid + 1`). Otherwise, it continues in the left half (`high = mid - 1`). The process repeats until `low` exceeds `high`.

## Pseudocode

```
function binarySearch(a[], n, key):
    low ← 0
    high ← n - 1
    while low <= high do
        mid ← (low + high) / 2
        if a[mid] == key then
            return mid
        else if a[mid] < key then
            low ← mid + 1
        else
            high ← mid - 1
    return -1
```

## Complexity Analysis

- **Time Complexity:**
  - Best: O(1)
  - Average: O(log n)
  - Worst: O(log n)
- **Space Complexity:** O(1)

## Use Cases

- Searching in sorted arrays
- Finding lower/upper bounds
- Searching in databases
- Debugging and testing

## Related Algorithms

None

## Tags

searching, sorted-array, logarithmic, divide-and-conquer
