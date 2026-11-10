import type { ProgramTemplate } from './types';

/**
 * Starter programs for the Code Playground.
 *
 * Every template is a complete, compilable C program that reads its input
 * from stdin — students never have to hardcode data to try a program out.
 */

const BASIC = `#include <stdio.h>

int main(void) {
    printf("Hello from the DAA Learning Companion!\\n");

    int number = 0;
    printf("Enter a number: ");
    if (scanf("%d", &number) == 1) {
        printf("You entered %d. Its square is %d.\\n", number, number * number);
    } else {
        printf("No number was read from stdin.\\n");
    }

    return 0;
}
`;

const ARRAY_IO = `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[1000];

    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");

    return 0;
}
`;

const SEARCHING = `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    int target;
    scanf("%d", &target);

    int found = -1;
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            found = i;
            break;
        }
    }

    if (found == -1) {
        printf("%d is not present in the array\\n", target);
    } else {
        printf("%d is present at index %d\\n", target, found);
    }

    return 0;
}
`;

const SORTING = `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    int comparisons = 0;
    int swaps = 0;

    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swaps++;
                swapped = 1;
            }
        }
        if (!swapped) {
            break;
        }
    }

    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    printf("comparisons=%d swaps=%d\\n", comparisons, swaps);

    return 0;
}
`;

const RECURSIVE = `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int fibonacci(int n) {
    if (n < 2) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main(void) {
    int n;
    scanf("%d", &n);

    printf("factorial(%d) = %d\\n", n, factorial(n));
    printf("fibonacci(%d) = %d\\n", n, fibonacci(n));

    return 0;
}
`;

const GRAPH = `#include <stdio.h>

#define MAX_NODES 10

int main(void) {
    int n;
    scanf("%d", &n);

    int matrix[MAX_NODES][MAX_NODES];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &matrix[i][j]);
        }
    }

    int start;
    scanf("%d", &start);

    /* Breadth first search using an explicit queue. */
    int queue[MAX_NODES];
    int head = 0;
    int tail = 0;
    int visited[MAX_NODES];

    for (int i = 0; i < n; i++) {
        visited[i] = 0;
    }

    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
        int node = queue[head++];
        printf("%d ", node);

        for (int next = 0; next < n; next++) {
            if (matrix[node][next] == 1 && !visited[next]) {
                visited[next] = 1;
                queue[tail++] = next;
            }
        }
    }
    printf("\\n");

    return 0;
}
`;

const DYNAMIC_PROGRAMMING = `#include <stdio.h>

#define MAX_ITEMS 100
#define MAX_CAPACITY 1000

int main(void) {
    int itemCount;
    int capacity;
    scanf("%d %d", &itemCount, &capacity);

    int weight[MAX_ITEMS];
    int value[MAX_ITEMS];

    for (int i = 0; i < itemCount; i++) {
        scanf("%d %d", &weight[i], &value[i]);
    }

    int dp[MAX_CAPACITY + 1];
    for (int c = 0; c <= capacity; c++) {
        dp[c] = 0;
    }

    for (int i = 0; i < itemCount; i++) {
        for (int c = capacity; c >= weight[i]; c--) {
            int take = dp[c - weight[i]] + value[i];
            int skip = dp[c];
            dp[c] = take > skip ? take : skip;
        }
    }

    printf("%d\\n", dp[capacity]);

    return 0;
}
`;

const EMPTY = `#include <stdio.h>

int main(void) {
    /* Write your own implementation here. */
    return 0;
}
`;

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'basic',
    name: 'Basic C program',
    description: 'Reads one number from stdin and prints its square.',
    source: BASIC,
  },
  {
    id: 'array-io',
    name: 'Array input and output',
    description: 'Reads n and n numbers, then prints the array.',
    source: ARRAY_IO,
  },
  {
    id: 'searching',
    name: 'Searching algorithm',
    description: 'Linear search: reports the index of the target or that it is missing.',
    source: SEARCHING,
  },
  {
    id: 'sorting',
    name: 'Sorting algorithm',
    description: 'Bubble sort with comparison and swap counters.',
    algorithmId: 'bubble-sort',
    source: SORTING,
  },
  {
    id: 'recursive',
    name: 'Recursive algorithm',
    description: 'Factorial and Fibonacci through recursion.',
    source: RECURSIVE,
  },
  {
    id: 'graph',
    name: 'Graph algorithm',
    description: 'Breadth first search over an adjacency matrix.',
    source: GRAPH,
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic programming',
    description: '0/1 knapsack solved with a one dimensional DP table.',
    source: DYNAMIC_PROGRAMMING,
  },
  {
    id: 'empty',
    name: 'Empty template',
    description: 'A bare program with a main function.',
    source: EMPTY,
  },
];

/** Finds a template by id. */
export function getTemplate(templateId: string): ProgramTemplate | undefined {
  return PROGRAM_TEMPLATES.find((template) => template.id === templateId);
}
