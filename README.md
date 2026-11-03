# Design and Analysis of Algorithms (DAA) Practicals

**Language:** C
**Compiler:** GCC
**Subject:** Design and Analysis of Algorithms

---

## 1. Binary Search

### Theory

Binary Search is a searching algorithm that works on a sorted array. It repeatedly divides the search interval into two halves and compares the middle element with the target element.

### Code

```c
#include <stdio.h>

int main() {
    int a[100], n, key, low, high, mid, i;

    printf("Enter number of elements: ");
    scanf("%d", &n);

    printf("Enter sorted elements: ");
    for(i = 0; i < n; i++)
        scanf("%d", &a[i]);

    printf("Enter element to search: ");
    scanf("%d", &key);

    low = 0;
    high = n - 1;

    while(low <= high) {
        mid = (low + high) / 2;

        if(a[mid] == key) {
            printf("Element found at position %d", mid + 1);
            return 0;
        }
        else if(a[mid] < key)
            low = mid + 1;
        else
            high = mid - 1;
    }

    printf("Element not found");
    return 0;
}
```

### Complexities

* **Time Complexity:**

  * Best: O(1)
  * Average: O(log n)
  * Worst: O(log n)
* **Space Complexity:** O(1)

### Conclusion

Binary Search efficiently searches elements in a sorted array by repeatedly reducing the search space by half.

---

## 2. Insertion Sort

### Theory

Insertion Sort is a comparison-based sorting algorithm that builds the sorted array one element at a time. Each element is inserted into its correct position in the already sorted portion.

### Code

```c
#include <stdio.h>

int main() {
    int a[100], n, i, j, key;

    printf("Enter number of elements: ");
    scanf("%d", &n);

    printf("Enter elements: ");
    for(i = 0; i < n; i++)
        scanf("%d", &a[i]);

    for(i = 1; i < n; i++) {
        key = a[i];
        j = i - 1;

        while(j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }

        a[j + 1] = key;
    }

    printf("Sorted array: ");
    for(i = 0; i < n; i++)
        printf("%d ", a[i]);

    return 0;
}
```

### Complexities

* **Time Complexity:**

  * Best: O(n)
  * Average: O(n²)
  * Worst: O(n²)
* **Space Complexity:** O(1)

### Conclusion

Insertion Sort arranges elements in ascending order by inserting each element into its correct position.

---

## 3. Minimum Cost Spanning Tree Using Kruskal's Algorithm

### Theory

Kruskal's Algorithm is a greedy algorithm used to find the Minimum Spanning Tree (MST) of a connected, weighted, undirected graph. It selects edges in increasing order of weight while avoiding cycles using the Disjoint Set (Union-Find) method.

### Code

```c
#include <stdio.h>

struct Edge {
    int u, v, w;
};

int parent[100];

int find(int x) {
    while(parent[x] != x)
        x = parent[x];
    return x;
}

int main() {
    struct Edge e[100], temp;
    int n, m, i, j, count = 0, cost = 0;

    printf("Enter vertices and edges: ");
    scanf("%d%d", &n, &m);

    printf("Enter edges (u v weight):\n");
    for(i = 0; i < m; i++)
        scanf("%d%d%d", &e[i].u, &e[i].v, &e[i].w);

    for(i = 0; i < n; i++)
        parent[i] = i;

    for(i = 0; i < m - 1; i++)
        for(j = 0; j < m - i - 1; j++)
            if(e[j].w > e[j + 1].w) {
                temp = e[j];
                e[j] = e[j + 1];
                e[j + 1] = temp;
            }

    printf("Minimum Spanning Tree:\n");

    for(i = 0; i < m && count < n - 1; i++) {
        int a = find(e[i].u);
        int b = find(e[i].v);

        if(a != b) {
            parent[a] = b;
            printf("%d - %d : %d\n",
                   e[i].u, e[i].v, e[i].w);

            cost += e[i].w;
            count++;
        }
    }

    if(count != n - 1)
        printf("Spanning tree not possible\n");
    else
        printf("Minimum Cost = %d\n", cost);

    return 0;
}
```

### Complexities

* **Time Complexity:** O(E² + Eα(V)) with the simple bubble sort and Union-Find implementation.
* **Space Complexity:** O(V + E)

### Conclusion

Kruskal's Algorithm finds the Minimum Spanning Tree by selecting the minimum-weight edges without forming cycles.

---

## 4. Knapsack Problem Using Greedy Method

### Theory

The Fractional Knapsack Problem is solved using a greedy approach. Items are selected according to their profit-to-weight ratio in descending order. Fractions of items can be selected to maximize the total profit.

### Code

```c
#include <stdio.h>

int main() {
    float p[100], w[100], ratio[100];
    float temp, capacity, profit = 0;
    int n, i, j;

    printf("Enter number of items: ");
    scanf("%d", &n);

    for(i = 0; i < n; i++) {
        printf("Enter profit and weight: ");
        scanf("%f%f", &p[i], &w[i]);
        ratio[i] = p[i] / w[i];
    }

    printf("Enter knapsack capacity: ");
    scanf("%f", &capacity);

    for(i = 0; i < n - 1; i++)
        for(j = 0; j < n - i - 1; j++)
            if(ratio[j] < ratio[j + 1]) {
                temp = ratio[j];
                ratio[j] = ratio[j + 1];
                ratio[j + 1] = temp;

                temp = p[j];
                p[j] = p[j + 1];
                p[j + 1] = temp;

                temp = w[j];
                w[j] = w[j + 1];
                w[j + 1] = temp;
            }

    for(i = 0; i < n && capacity > 0; i++) {
        if(w[i] <= capacity) {
            profit += p[i];
            capacity -= w[i];
        }
        else {
            profit += ratio[i] * capacity;
            capacity = 0;
        }
    }

    printf("Maximum Profit = %.2f\n", profit);

    return 0;
}
```

### Complexities

* **Time Complexity:** O(n²) using bubble sort.
* **Space Complexity:** O(n)

### Conclusion

The Greedy Method provides the maximum profit for the Fractional Knapsack Problem by selecting items according to their profit-to-weight ratio.

---

## 5. Minimum and Maximum Using Divide and Conquer

### Theory

Divide and Conquer divides an array into smaller subarrays, finds their minimum and maximum elements recursively, and combines the results.

The traditional method scans the array once to find both minimum and maximum values. Divide and Conquer reduces the number of comparisons compared with checking every element separately for both values.

### Code

```c
#include <stdio.h>

int a[100];

struct Pair {
    int min, max;
};

struct Pair minmax(int low, int high) {
    struct Pair left, right, result;
    int mid;

    if(low == high) {
        result.min = result.max = a[low];
        return result;
    }

    if(high == low + 1) {
        result.min = a[low] < a[high] ? a[low] : a[high];
        result.max = a[low] > a[high] ? a[low] : a[high];
        return result;
    }

    mid = (low + high) / 2;

    left = minmax(low, mid);
    right = minmax(mid + 1, high);

    result.min = left.min < right.min ? left.min : right.min;
    result.max = left.max > right.max ? left.max : right.max;

    return result;
}

int main() {
    int n, i, min, max;
    struct Pair result;

    printf("Enter number of elements: ");
    scanf("%d", &n);

    printf("Enter elements: ");
    for(i = 0; i < n; i++)
        scanf("%d", &a[i]);

    result = minmax(0, n - 1);

    printf("Divide and Conquer:\n");
    printf("Minimum = %d\nMaximum = %d\n",
           result.min, result.max);

    min = max = a[0];

    for(i = 1; i < n; i++) {
        if(a[i] < min) min = a[i];
        if(a[i] > max) max = a[i];
    }

    printf("Traditional Method:\n");
    printf("Minimum = %d\nMaximum = %d\n", min, max);

    return 0;
}
```

### Complexities

**Divide and Conquer:**

* Time Complexity: O(n)
* Space Complexity: O(log n) for recursion stack.

**Traditional Method:**

* Time Complexity: O(n)
* Space Complexity: O(1)

### Conclusion

Both methods find the minimum and maximum in linear time. Divide and Conquer uses fewer comparisons (approximately 3n/2), while the traditional method is simpler and requires constant auxiliary space.

---

## 6. All-Pairs Shortest Path Using Floyd-Warshall Algorithm

### Theory

Floyd-Warshall is a Dynamic Programming algorithm used to find the shortest paths between all pairs of vertices in a weighted graph. It repeatedly considers each vertex as an intermediate vertex to improve the shortest path distances.

Use INF to represent the absence of an edge.

### Code

```c
#include <stdio.h>

#define INF 99999

int main() {
    int a[10][10], n, i, j, k;

    printf("Enter number of vertices: ");
    scanf("%d", &n);

    printf("Enter adjacency matrix (use %d for INF):\n", INF);

    for(i = 0; i < n; i++)
        for(j = 0; j < n; j++)
            scanf("%d", &a[i][j]);

    for(k = 0; k < n; k++)
        for(i = 0; i < n; i++)
            for(j = 0; j < n; j++)
                if(a[i][k] != INF && a[k][j] != INF &&
                   a[i][k] + a[k][j] < a[i][j])
                    a[i][j] = a[i][k] + a[k][j];

    printf("Shortest Distance Matrix:\n");

    for(i = 0; i < n; i++) {
        for(j = 0; j < n; j++)
            printf("%d ", a[i][j]);
        printf("\n");
    }

    return 0;
}
```

### Complexities

* **Time Complexity:** O(V³)
* **Space Complexity:** O(V²)

### Conclusion

Floyd-Warshall successfully calculates the shortest distances between every pair of vertices using Dynamic Programming.

---

## 7. Single-Source Shortest Path Using Bellman-Ford Algorithm

### Theory

Bellman-Ford is a shortest-path algorithm that calculates the minimum distance from a single source vertex to all other vertices. It supports negative edge weights and detects negative-weight cycles.

### Code

```c
#include <stdio.h>

#define INF 99999

struct Edge {
    int u, v, w;
};

int main() {
    struct Edge e[100];
    int n, m, src, dist[100];
    int i, j;

    printf("Enter vertices and edges: ");
    scanf("%d%d", &n, &m);

    printf("Enter edges (u v weight):\n");
    for(i = 0; i < m; i++)
        scanf("%d%d%d", &e[i].u, &e[i].v, &e[i].w);

    printf("Enter source vertex: ");
    scanf("%d", &src);

    for(i = 0; i < n; i++)
        dist[i] = INF;

    dist[src] = 0;

    for(i = 1; i < n; i++) {
        for(j = 0; j < m; j++) {
            int u = e[j].u;
            int v = e[j].v;
            int w = e[j].w;

            if(dist[u] != INF && dist[u] + w < dist[v])
                dist[v] = dist[u] + w;
        }
    }

    for(j = 0; j < m; j++) {
        int u = e[j].u;
        int v = e[j].v;
        int w = e[j].w;

        if(dist[u] != INF && dist[u] + w < dist[v]) {
            printf("Negative weight cycle detected");
            return 0;
        }
    }

    printf("Shortest distances:\n");

    for(i = 0; i < n; i++) {
        if(dist[i] == INF)
            printf("%d -> INF\n", i);
        else
            printf("%d -> %d\n", i, dist[i]);
    }

    return 0;
}
```

### Complexities

* **Time Complexity:** O(V × E)
* **Space Complexity:** O(V + E)

### Conclusion

Bellman-Ford finds single-source shortest paths, supports negative edge weights, and detects reachable negative-weight cycles.

---

## 8. 8-Queens Problem Using Backtracking

### Theory

The 8-Queens Problem involves placing eight queens on an 8×8 chessboard so that no two queens attack each other. Backtracking places queens row by row and rejects positions that cause conflicts.

### Code

```c
#include <stdio.h>
#include <stdlib.h>

#define N 8

int board[N];

int safe(int row, int col) {
    int i;

    for(i = 0; i < row; i++) {
        if(board[i] == col ||
           abs(board[i] - col) == abs(i - row))
            return 0;
    }

    return 1;
}

int solve(int row) {
    int col;

    if(row == N)
        return 1;

    for(col = 0; col < N; col++) {
        if(safe(row, col)) {
            board[row] = col;

            if(solve(row + 1))
                return 1;
        }
    }

    return 0;
}

int main() {
    int i, j;

    if(solve(0)) {
        printf("Solution:\n");

        for(i = 0; i < N; i++) {
            for(j = 0; j < N; j++) {
                if(board[i] == j)
                    printf("Q ");
                else
                    printf(". ");
            }
            printf("\n");
        }
    }
    else {
        printf("Solution not found");
    }

    return 0;
}
```

### Complexities

* **Time Complexity:** O(N!) upper bound.
* **Space Complexity:** O(N) for the board and recursion stack.

### Conclusion

Backtracking successfully solves the 8-Queens Problem by placing queens safely and rejecting invalid arrangements.

---

## 9. 15-Puzzle Problem Using Branch and Bound

### Theory

The 15-Puzzle consists of a 4×4 board containing 15 numbered tiles and one empty space (0). The objective is to arrange the tiles in ascending order.

Branch and Bound explores possible board configurations using a cost function. The Manhattan Distance heuristic estimates the remaining cost, and the configuration with the lowest estimated total cost is explored first.

### Code

```c
#include <stdio.h>
#include <stdlib.h>

#define N 4

typedef struct Node {
    int a[16], blank, g, h;
    struct Node *parent, *next;
} Node;

typedef struct Seen {
    int a[16];
    struct Seen *next;
} Seen;

Seen *visited = NULL;
Node *open = NULL;

int goal[16] = {
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 0
};

int heuristic(int a[]) {
    int i, h = 0;

    for(i = 0; i < 16; i++) {
        if(a[i] != 0) {
            int r = (a[i] - 1) / 4;
            int c = (a[i] - 1) % 4;

            h += abs(i / 4 - r) + abs(i % 4 - c);
        }
    }

    return h;
}

int seen(int a[]) {
    Seen *s;

    for(s = visited; s; s = s->next) {
        int i, same = 1;

        for(i = 0; i < 16; i++)
            if(s->a[i] != a[i]) {
                same = 0;
                break;
            }

        if(same) return 1;
    }

    return 0;
}

void mark(int a[]) {
    Seen *s = malloc(sizeof(Seen));
    int i;

    for(i = 0; i < 16; i++)
        s->a[i] = a[i];

    s->next = visited;
    visited = s;
}

void insert(Node *p) {
    Node **cur = &open;

    while(*cur && (*cur)->g + (*cur)->h <= p->g + p->h)
        cur = &(*cur)->next;

    p->next = *cur;
    *cur = p;
}

void display(Node *p) {
    int i;

    if(p == NULL) return;

    display(p->parent);

    printf("\n");
    for(i = 0; i < 16; i++) {
        printf("%2d ", p->a[i]);
        if(i % 4 == 3) printf("\n");
    }
}

int main() {
    Node *start, *cur, *child;
    int moves[4] = {-4, 4, -1, 1};
    int i, j, b, nb, t, found = 0;

    start = malloc(sizeof(Node));

    printf("Enter puzzle (use 0 for blank):\n");

    for(i = 0; i < 16; i++) {
        scanf("%d", &start->a[i]);
        if(start->a[i] == 0)
            start->blank = i;
    }

    start->g = 0;
    start->h = heuristic(start->a);
    start->parent = NULL;
    start->next = NULL;

    mark(start->a);
    insert(start);

    while(open != NULL) {
        cur = open;
        open = open->next;

        if(cur->h == 0) {
            display(cur);
            found = 1;
            break;
        }

        b = cur->blank;

        for(i = 0; i < 4; i++) {
            nb = b + moves[i];

            if(nb < 0 || nb >= 16) continue;
            if((i == 2 || i == 3) && b / 4 != nb / 4)
                continue;

            child = malloc(sizeof(Node));

            for(j = 0; j < 16; j++)
                child->a[j] = cur->a[j];

            t = child->a[b];
            child->a[b] = child->a[nb];
            child->a[nb] = t;

            if(seen(child->a)) {
                free(child);
                continue;
            }

            child->blank = nb;
            child->g = cur->g + 1;
            child->h = heuristic(child->a);
            child->parent = cur;
            child->next = NULL;

            mark(child->a);
            insert(child);
        }
    }

    if(!found)
        printf("No solution found.\n");

    return 0;
}
```

### Complexities

* **Time Complexity:** Exponential in the solution depth (worst case).
* **Space Complexity:** Exponential in the number of explored states.

### Conclusion

Branch and Bound solves the 15-Puzzle by exploring configurations with the lowest estimated cost using Manhattan Distance as a heuristic.

---

## 10. String Matching Using Rabin-Karp Algorithm

### Theory

Rabin-Karp is a string-matching algorithm that uses hashing to find occurrences of a pattern within a text. It calculates hash values for the pattern and text windows and compares actual characters when hash values match.

### Code

```c
#include <stdio.h>
#include <string.h>

#define PRIME 101
#define D 256

int main() {
    char text[1000], pattern[100];
    int n, m, i, j, p = 0, t = 0, h = 1;
    int found = 0;

    printf("Enter text: ");
    scanf("%999s", text);

    printf("Enter pattern: ");
    scanf("%99s", pattern);

    n = strlen(text);
    m = strlen(pattern);

    if(m > n) {
        printf("Pattern not found");
        return 0;
    }

    for(i = 0; i < m - 1; i++)
        h = (h * D) % PRIME;

    for(i = 0; i < m; i++) {
        p = (D * p + pattern[i]) % PRIME;
        t = (D * t + text[i]) % PRIME;
    }

    for(i = 0; i <= n - m; i++) {
        if(p == t) {
            for(j = 0; j < m; j++)
                if(text[i + j] != pattern[j])
                    break;

            if(j == m) {
                printf("Pattern found at position %d\n", i);
                found = 1;
            }
        }

        if(i < n - m) {
            t = (D * (t - text[i] * h) + text[i + m]) % PRIME;

            if(t < 0)
                t += PRIME;
        }
    }

    if(!found)
        printf("Pattern not found");

    return 0;
}
```

### Complexities

* **Time Complexity:**

  * Average: O(n + m)
  * Worst: O(nm) due to hash collisions.
* **Space Complexity:** O(1)

### Conclusion

Rabin-Karp efficiently searches for a pattern in a text using hashing and character verification, reducing unnecessary comparisons in typical cases.

---

## Compilation and Execution

All programs can be compiled using GCC.

```bash
gcc program.c -o program
./program
```

On Windows:

```bash
gcc program.c -o program.exe
program.exe
```

---

## Summary

| No. | Algorithm           | Technique               |
| :-: | ------------------- | ----------------------- |
|  1  | Binary Search       | Divide and Conquer      |
|  2  | Insertion Sort      | Insertion-based Sorting |
|  3  | Kruskal's Algorithm | Greedy                  |
|  4  | Fractional Knapsack | Greedy                  |
|  5  | Minimum and Maximum | Divide and Conquer      |
|  6  | Floyd-Warshall      | Dynamic Programming     |
|  7  | Bellman-Ford        | Dynamic Programming     |
|  8  | 8-Queens            | Backtracking            |
|  9  | 15-Puzzle           | Branch and Bound        |
|  10 | Rabin-Karp          | String Matching         |

**End of DAA Practicals**
