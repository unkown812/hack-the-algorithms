/**
 * DAA practical exercises.
 *
 * The C programs are the verified Phase 3 implementations; the sample outputs
 * were produced by running them. The material is bundled with the extension,
 * so the practical preparation works completely offline.
 */

import type { PracticalExercise } from '../practice/types';

export const PRACTICALS: PracticalExercise[] = [
  {
    id: 'prac-binary-search',
    name: 'Binary Search',
    category: 'searching',
    aim: 'To search a key element in a sorted array using the divide and conquer technique and to study its time complexity.',
    theory: 'Binary Search is a searching algorithm that works on a sorted array. It repeatedly divides the search interval into two halves until the required element is found or the search interval becomes empty.',
    problemStatement: 'Binary Search',
    algorithm: [
      'Read the number of elements n and the sorted array.',
      'Read the key element to be searched.',
      'Set low = 0 and high = n - 1.',
      'While low <= high, compute mid = (low + high) / 2.',
      'If a[mid] == key, display the position and stop.',
      'If a[mid] < key, set low = mid + 1; otherwise set high = mid - 1.',
      'If the loop ends without a match, display "Element not found".',
    ],
    pseudocode: [
      'function binarySearch(a, n, key)',
      '    low ← 0; high ← n - 1',
      '    while low ≤ high',
      '        mid ← (low + high) / 2',
      '        if a[mid] = key then return mid',
      '        if a[mid] < key then low ← mid + 1',
      '        else high ← mid - 1',
      '    return -1',
    ],
    cProgram: `#include <stdio.h>

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
}`,
    sampleInput: `5
1 3 5 7 9
7
`,
    sampleOutput: 'Enter number of elements: Enter sorted elements: Enter element to search: Element found at position 4',
    timeComplexity: 'Best: O(1) · Average: O(log n) · Worst: O(log n)',
    spaceComplexity: 'O(1)',
    conclusion: 'Binary Search efficiently searches for an element in a sorted array by repeatedly dividing the search space into two halves. It is significantly faster than a linear search for large arrays, but it requires the input to be sorted.',
    vivaQuestions: [
      {
        id: 'prac-binary-search-viva-why-does-bin',
        question: 'Why does Binary Search require a sorted array?',
        expectedAnswer: 'Binary Search eliminates half of the remaining search space after each comparison. This decision is only valid when the elements are ordered — with an unsorted array the discarded half could still contain the key.',
        keywords: ['half', 'sorted', 'ordered', 'eliminate'],
        topic: 'binary-search',
        category: 'searching',
      },
      {
        id: 'prac-binary-search-viva-how-many-com',
        question: 'How many comparisons does Binary Search need for 1000 elements?',
        expectedAnswer: 'At most ⌈log₂ 1000⌉ = 10 comparisons, because every comparison halves the remaining search interval.',
        keywords: ['log', '10', 'half'],
        topic: 'binary-search',
        category: 'searching',
      },
      {
        id: 'prac-binary-search-viva-what-is-the-',
        question: 'What is the difference between the iterative and the recursive version?',
        expectedAnswer: 'Both take O(log n) time. The iterative version uses O(1) auxiliary space, the recursive version O(log n) because of the call stack.',
        keywords: ['iterative', 'recursive', 'space', 'stack'],
        topic: 'binary-search',
        category: 'searching',
      },
    ],
  },
  {
    id: 'prac-insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    aim: 'To sort an array in ascending order by inserting one element at a time into the sorted portion and to study its adaptive behaviour.',
    theory: 'Insertion Sort is a comparison-based sorting algorithm that builds a sorted array one element at a time. Each element is inserted into its correct position in the already sorted portion.',
    problemStatement: 'Insertion Sort',
    algorithm: [
      'Read the number of elements n and the array.',
      'For every position i from 1 to n - 1, save the key = a[i].',
      'Move all elements that are greater than the key one position to the right.',
      'Place the key in the gap that was created.',
      'Display the sorted array.',
    ],
    pseudocode: [
      'function insertionSort(a, n)',
      '    for i ← 1 to n - 1',
      '        key ← a[i]; j ← i - 1',
      '        while j ≥ 0 and a[j] > key',
      '            a[j + 1] ← a[j]; j ← j - 1',
      '        a[j + 1] ← key',
    ],
    cProgram: `#include <stdio.h>

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
}`,
    sampleInput: `5
5 3 8 1 9
`,
    sampleOutput: 'Enter number of elements: Enter elements: Sorted array: 1 3 5 8 9 ',
    timeComplexity: 'Best: O(n) · Average: O(n²) · Worst: O(n²)',
    spaceComplexity: 'O(1)',
    conclusion: 'Insertion Sort builds the sorted array step by step. It is adaptive — it runs in linear time on already sorted or nearly sorted data — which makes it a good choice for small or almost sorted inputs.',
    vivaQuestions: [
      {
        id: 'prac-insertion-sort-viva-why-is-inser',
        question: 'Why is Insertion Sort called "adaptive"?',
        expectedAnswer: 'Its running time depends on the initial order of the data: on an already sorted array it needs only n - 1 comparisons, so it runs in O(n) instead of O(n²).',
        keywords: ['adaptive', 'sorted', 'comparisons', 'O(n)'],
        topic: 'insertion-sort',
        category: 'sorting',
      },
      {
        id: 'prac-insertion-sort-viva-is-insertion',
        question: 'Is Insertion Sort stable and in place?',
        expectedAnswer: 'Yes to both. It only shifts elements that are strictly greater, so equal elements keep their relative order, and it needs only O(1) extra memory.',
        keywords: ['stable', 'in place', 'O(1)'],
        topic: 'insertion-sort',
        category: 'sorting',
      },
      {
        id: 'prac-insertion-sort-viva-which-real-a',
        question: 'Which real applications use Insertion Sort?',
        expectedAnswer: 'Sorting small arrays and nearly sorted data — for example when a merge sort or quicksort reaches a small sub-array, and when inserting new records into an almost sorted list.',
        keywords: ['small', 'nearly sorted', 'merge sort', 'records'],
        topic: 'insertion-sort',
        category: 'sorting',
      },
    ],
  },
  {
    id: 'prac-kruskal-mst',
    name: 'Minimum Cost Spanning Tree Using Kruskal\'s Algorithm',
    category: 'greedy',
    aim: 'To find the minimum cost spanning tree of a connected weighted graph using a greedy strategy and union-find.',
    theory: 'Kruskal\'s Algorithm is a greedy algorithm used to find the Minimum Spanning Tree (MST) of a connected, weighted, undirected graph. It selects edges in increasing order of weight while avoiding cycles using the Disjoint Set method.',
    problemStatement: 'Minimum Cost Spanning Tree Using Kruskal\'s Algorithm',
    algorithm: [
      'Read the number of vertices and edges.',
      'Read every edge with its weight.',
      'Sort the edges in increasing order of weight.',
      'For every edge, find the representatives of its two vertices with union-find.',
      'If the representatives differ, add the edge to the tree and merge the two sets.',
      'Stop when n - 1 edges were selected.',
      'Print the tree and its total cost.',
    ],
    pseudocode: [
      'function kruskal(V, E)',
      '    sort E by weight ascending',
      '    for each vertex v: parent[v] ← v',
      '    for each edge (u, v, w) in E',
      '        if find(u) ≠ find(v)',
      '            add (u, v, w) to the tree',
      '            parent[find(u)] ← find(v)',
    ],
    cProgram: `#include <stdio.h>

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

    printf("Enter edges (u v weight):\\n");
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

    printf("Minimum Spanning Tree:\\n");

    for(i = 0; i < m && count < n - 1; i++) {
        int a = find(e[i].u);
        int b = find(e[i].v);

        if(a != b) {
            parent[a] = b;
            printf("%d - %d : %d\\n",
                   e[i].u, e[i].v, e[i].w);

            cost += e[i].w;
            count++;
        }
    }

    if(count != n - 1)
        printf("Spanning tree not possible\\n");
    else
        printf("Minimum Cost = %d\\n", cost);

    return 0;
}`,
    sampleInput: `4 5
0 1 10
0 2 6
0 3 5
1 3 15
2 3 4
`,
    sampleOutput: 'Enter vertices and edges: Enter edges (u v weight):\nMinimum Spanning Tree:\n2 - 3 : 4\n0 - 3 : 5\n0 - 1 : 10\nMinimum Cost = 19\n',
    timeComplexity: 'O(E² + E·α(V)) with bubble sort and simple union-find',
    spaceComplexity: 'O(V + E)',
    conclusion: 'Kruskal\'s algorithm builds a minimum spanning tree by taking the cheapest edge that does not create a cycle. The greedy choice is safe because the cut property guarantees that the cheapest edge crossing a cut belongs to some minimum spanning tree.',
    vivaQuestions: [
      {
        id: 'prac-kruskal-mst-viva-why-does-kru',
        question: 'Why does Kruskal need union-find?',
        expectedAnswer: 'To check whether an edge would create a cycle: if both endpoints already belong to the same set, the edge is rejected.',
        keywords: ['union-find', 'cycle', 'set', 'component'],
        topic: 'kruskal-mst',
        category: 'greedy',
      },
      {
        id: 'prac-kruskal-mst-viva-what-is-the-',
        question: 'What is the cut property?',
        expectedAnswer: 'For any cut of the graph, the cheapest edge that crosses the cut belongs to at least one minimum spanning tree. It is the reason the greedy choice of Kruskal is correct.',
        keywords: ['cut', 'cheapest', 'minimum spanning tree', 'crosses'],
        topic: 'kruskal-mst',
        category: 'greedy',
      },
      {
        id: 'prac-kruskal-mst-viva-how-does-kru',
        question: 'How does Kruskal differ from Prim?',
        expectedAnswer: 'Kruskal works on the sorted list of all edges and builds the tree from several components; Prim grows a single tree by always taking the cheapest edge leaving it.',
        keywords: ['edges', 'components', 'single tree', 'cheapest'],
        topic: 'kruskal-mst',
        category: 'greedy',
      },
    ],
  },
  {
    id: 'prac-fractional-knapsack',
    name: 'Knapsack Problem Using Greedy Method',
    category: 'greedy',
    aim: 'To solve the fractional knapsack problem with a greedy strategy and to compare it with the 0/1 variant.',
    theory: 'The Fractional Knapsack Problem is solved using a greedy approach. Items are selected according to their profit-to-weight ratio in descending order. Fractions of items can also be selected to maximize total profit.',
    problemStatement: 'Knapsack Problem Using Greedy Method',
    algorithm: [
      'Read the number of items with their profit and weight.',
      'Compute the profit to weight ratio of every item.',
      'Sort the items by decreasing ratio.',
      'Fill the knapsack item by item while the capacity allows it.',
      'If the next item does not fit completely, take the fraction that still fits.',
      'Print the maximum profit.',
    ],
    pseudocode: [
      'function fractionalKnapsack(items, capacity)',
      '    sort items by profit / weight descending',
      '    profit ← 0',
      '    for each item in items',
      '        if item.weight ≤ capacity',
      '            profit ← profit + item.profit; capacity ← capacity - item.weight',
      '        else',
      '            profit ← profit + ratio × capacity; break',
    ],
    cProgram: `#include <stdio.h>

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

    printf("Maximum Profit = %.2f\\n", profit);

    return 0;
}`,
    sampleInput: `3
60 10
100 20
120 30
50
`,
    sampleOutput: 'Enter number of items: Enter profit and weight: Enter profit and weight: Enter profit and weight: Enter knapsack capacity: Maximum Profit = 240.00\n',
    timeComplexity: 'O(n²) with bubble sort',
    spaceComplexity: 'O(n)',
    conclusion: 'The fractional knapsack problem is solved optimally by the greedy method because items may be split. The same greedy strategy fails for the 0/1 knapsack, where items cannot be divided.',
    vivaQuestions: [
      {
        id: 'prac-fractional-knapsack-viva-why-can-the-',
        question: 'Why can the greedy method not solve the 0/1 knapsack problem?',
        expectedAnswer: 'Because an item cannot be split there: taking the item with the best ratio can fill the knapsack with a much worse total value than an optimal combination of other items.',
        keywords: ['split', 'fraction', 'counter', 'optimal'],
        topic: 'fractional-knapsack',
        category: 'greedy',
      },
      {
        id: 'prac-fractional-knapsack-viva-what-is-the-',
        question: 'What is the profit to weight ratio used for?',
        expectedAnswer: 'It measures how much profit one unit of weight contributes, so sorting by decreasing ratio fills the knapsack with the most valuable use of the available capacity.',
        keywords: ['ratio', 'profit', 'weight', 'capacity'],
        topic: 'fractional-knapsack',
        category: 'greedy',
      },
    ],
  },
  {
    id: 'prac-min-max-dc',
    name: 'Minimum and Maximum Using Divide and Conquer',
    category: 'divide-and-conquer',
    aim: 'To find the minimum and the maximum of an array with divide and conquer and to compare the number of comparisons with the traditional scan.',
    theory: 'Divide and Conquer divides an array into smaller subarrays, finds their minimum and maximum recursively, and combines the results.\n\nThe traditional method scans the array once to find both minimum and maximum values. Divide and Conquer requires approximately 3n/2 comparisons, whereas the traditional method requires up to 2n - 2 comparisons.',
    problemStatement: 'Minimum and Maximum Using Divide and Conquer',
    algorithm: [
      'Read the number of elements and the array.',
      'If the range has one element, it is both the minimum and the maximum.',
      'If the range has two elements, compare them directly.',
      'Otherwise split the range in the middle and solve both halves recursively.',
      'Combine the results: the smaller minimum and the larger maximum.',
      'Compare the result with the traditional single scan.',
    ],
    pseudocode: [
      'function minmax(low, high)',
      '    if low = high then return (a[low], a[low])',
      '    if high = low + 1 then return compare(a[low], a[high])',
      '    mid ← (low + high) / 2',
      '    left ← minmax(low, mid); right ← minmax(mid + 1, high)',
      '    return (min(left.min, right.min), max(left.max, right.max))',
    ],
    cProgram: `#include <stdio.h>

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

    printf("Divide and Conquer:\\n");
    printf("Minimum = %d\\nMaximum = %d\\n",
           result.min, result.max);

    min = max = a[0];

    for(i = 1; i < n; i++) {
        if(a[i] < min) min = a[i];
        if(a[i] > max) max = a[i];
    }

    printf("Traditional Method:\\n");
    printf("Minimum = %d\\nMaximum = %d\\n", min, max);

    return 0;
}`,
    sampleInput: `5
12 7 3 45 21
`,
    sampleOutput: 'Enter number of elements: Enter elements: Divide and Conquer:\nMinimum = 3\nMaximum = 45\nTraditional Method:\nMinimum = 3\nMaximum = 45\n',
    timeComplexity: 'O(n) — about 2·⌈log₂ n⌉ comparisons instead of 2n − 2',
    spaceComplexity: 'O(log n) for the recursion stack',
    conclusion: 'Divide and conquer finds the minimum and the maximum with about 2 log n comparisons instead of 2n - 2, which is faster than the traditional scan but needs O(log n) stack space.',
    vivaQuestions: [
      {
        id: 'prac-min-max-dc-viva-how-many-com',
        question: 'How many comparisons does the divide and conquer version need?',
        expectedAnswer: 'At most 2⌈log₂ n⌉ — two comparisons per level of the recursion tree and ⌈log₂ n⌉ levels.',
        keywords: ['2', 'log', 'comparisons', 'levels'],
        topic: 'min-max-dc',
        category: 'divide-and-conquer',
      },
      {
        id: 'prac-min-max-dc-viva-what-is-the-',
        question: 'What is the base case of the recursion?',
        expectedAnswer: 'A range with one element (that element is both the minimum and the maximum) or a range with two elements, which is compared directly.',
        keywords: ['base case', 'one element', 'two elements', 'compared'],
        topic: 'min-max-dc',
        category: 'divide-and-conquer',
      },
    ],
  },
  {
    id: 'prac-floyd-warshall',
    name: 'All-Pairs Shortest Path Using Floyd-Warshall Algorithm',
    category: 'dynamic-programming',
    aim: 'To find the shortest path between every pair of vertices of a weighted graph using dynamic programming.',
    theory: 'Floyd-Warshall is a Dynamic Programming algorithm used to find the shortest paths between all pairs of vertices in a weighted graph. It considers every vertex as an intermediate vertex and updates the shortest distances.',
    problemStatement: 'All-Pairs Shortest Path Using Floyd-Warshall Algorithm',
    algorithm: [
      'Read the number of vertices and the adjacency matrix.',
      'Store the matrix as the initial table of distances.',
      'For every vertex k, check whether going through k shortens the path from i to j.',
      'Update the table whenever a shorter path is found.',
      'Print the final distance matrix.',
    ],
    pseudocode: [
      'function floydWarshall(dist, V)',
      '    for k ← 0 to V - 1',
      '        for i ← 0 to V - 1',
      '            for j ← 0 to V - 1',
      '                if dist[i][k] + dist[k][j] < dist[i][j]',
      '                    dist[i][j] ← dist[i][k] + dist[k][j]',
    ],
    cProgram: `#include <stdio.h>

#define INF 99999

int main() {
    int a[10][10], n, i, j, k;

    printf("Enter number of vertices: ");
    scanf("%d", &n);

    printf("Enter adjacency matrix (use %d for INF):\\n", INF);

    for(i = 0; i < n; i++)
        for(j = 0; j < n; j++)
            scanf("%d", &a[i][j]);

    for(k = 0; k < n; k++)
        for(i = 0; i < n; i++)
            for(j = 0; j < n; j++)
                if(a[i][k] != INF && a[k][j] != INF &&
                   a[i][k] + a[k][j] < a[i][j])
                    a[i][j] = a[i][k] + a[k][j];

    printf("Shortest Distance Matrix:\\n");

    for(i = 0; i < n; i++) {
        for(j = 0; j < n; j++)
            printf("%d ", a[i][j]);
        printf("\\n");
    }

    return 0;
}`,
    sampleInput: `4
0 3 99999 7
99999 0 4 2
99999 99999 0 1
99999 99999 99999 0
`,
    sampleOutput: 'Enter number of vertices: Enter adjacency matrix (use 99999 for INF):\nShortest Distance Matrix:\n0 3 7 5 \n99999 0 4 2 \n99999 99999 0 1 \n99999 99999 99999 0 \n',
    timeComplexity: 'O(V³)',
    spaceComplexity: 'O(V²)',
    conclusion: 'Floyd-Warshall computes all-pairs shortest paths with a single table of V × V entries. The triple loop over the intermediate vertex k is the dynamic programming dimension of the algorithm.',
    vivaQuestions: [
      {
        id: 'prac-floyd-warshall-viva-why-is-k-the',
        question: 'Why is k the outermost loop?',
        expectedAnswer: 'Because the dynamic programming state is defined by the set of allowed intermediate vertices: the outer loop guarantees that all paths using the vertices 0 … k - 1 are already considered when k is processed.',
        keywords: ['intermediate', 'outermost', 'dynamic programming', 'state'],
        topic: 'floyd-warshall',
        category: 'dynamic-programming',
      },
      {
        id: 'prac-floyd-warshall-viva-what-does-th',
        question: 'What does the algorithm detect with negative edge weights?',
        expectedAnswer: 'A negative cycle: if dist[i][j] can still be improved after the main loop, the graph contains a negative cycle and the shortest paths are not well defined.',
        keywords: ['negative cycle', 'detect', 'improve'],
        topic: 'floyd-warshall',
        category: 'dynamic-programming',
      },
    ],
  },
  {
    id: 'prac-bellman-ford',
    name: 'Single-Source Shortest Path Using Bellman-Ford Algorithm',
    category: 'graph',
    aim: 'To compute the shortest path from a single source in a graph that may contain negative edge weights and to detect negative cycles.',
    theory: 'Bellman-Ford is a shortest-path algorithm that calculates the minimum distance from a single source vertex to all other vertices. It supports negative edge weights and detects negative-weight cycles.',
    problemStatement: 'Single-Source Shortest Path Using Bellman-Ford Algorithm',
    algorithm: [
      'Read the vertices, the edges with their weights and the source vertex.',
      'Initialise every distance with infinity and the distance of the source with 0.',
      'Relax every edge n - 1 times.',
      'Relax every edge once more: if a distance still improves, a negative cycle exists.',
      'Print the shortest distance of every vertex.',
    ],
    pseudocode: [
      'function bellmanFord(V, E, source)',
      '    for each vertex v: dist[v] ← ∞',
      '    dist[source] ← 0',
      '    for i ← 1 to V - 1',
      '        for each edge (u, v, w)',
      '            if dist[u] + w < dist[v] then dist[v] ← dist[u] + w',
    ],
    cProgram: `#include <stdio.h>

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

    printf("Enter edges (u v weight):\\n");
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

    printf("Shortest distances:\\n");

    for(i = 0; i < n; i++) {
        if(dist[i] == INF)
            printf("%d -> INF\\n", i);
        else
            printf("%d -> %d\\n", i, dist[i]);
    }

    return 0;
}`,
    sampleInput: `4 4
0 1 4
0 2 1
2 1 2
1 3 1
0
`,
    sampleOutput: 'Enter vertices and edges: Enter edges (u v weight):\nEnter source vertex: Shortest distances:\n0 -> 0\n1 -> 3\n2 -> 1\n3 -> 4\n',
    timeComplexity: 'O(V × E)',
    spaceComplexity: 'O(V + E)',
    conclusion: 'Bellman-Ford solves the single source shortest path problem even with negative edge weights and reports a negative cycle when one exists. Its O(V·E) complexity is higher than Dijkstra, but Dijkstra cannot handle negative weights.',
    vivaQuestions: [
      {
        id: 'prac-bellman-ford-viva-why-does-bel',
        question: 'Why does Bellman-Ford relax the edges n - 1 times?',
        expectedAnswer: 'A shortest path contains at most n - 1 edges, so after n - 1 rounds every possible path length has been considered.',
        keywords: ['n - 1', 'edges', 'path', 'rounds'],
        topic: 'bellman-ford',
        category: 'graph',
      },
      {
        id: 'prac-bellman-ford-viva-how-is-a-neg',
        question: 'How is a negative cycle detected?',
        expectedAnswer: 'By relaxing all edges once more after the n - 1 rounds: if a distance can still be improved, the graph contains a negative cycle.',
        keywords: ['negative cycle', 'relax', 'improve', 'once more'],
        topic: 'bellman-ford',
        category: 'graph',
      },
    ],
  },
  {
    id: 'prac-8-queens',
    name: '8-Queens Problem Using Backtracking',
    category: 'backtracking',
    aim: 'To place eight queens on an 8 × 8 chessboard so that no two attack each other, using backtracking with pruning.',
    theory: 'The 8-Queens Problem involves placing eight queens on an 8×8 chessboard so that no two queens attack each other. Backtracking places queens row by row and rejects positions that cause conflicts.',
    problemStatement: '8-Queens Problem Using Backtracking',
    algorithm: [
      'Start with the first row.',
      'For every column, check whether the position is safe — no other queen in the same column or on the same diagonal.',
      'If it is safe, place the queen and solve the next row.',
      'If the remaining rows cannot be solved, remove the queen and try the next column.',
      'When all rows are filled, a solution was found.',
    ],
    pseudocode: [
      'function solve(row)',
      '    if row = N then return true',
      '    for col ← 0 to N - 1',
      '        if safe(row, col)',
      '            board[row] ← col',
      '            if solve(row + 1) then return true',
      '    return false',
    ],
    cProgram: `#include <stdio.h>
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
        printf("Solution:\\n");

        for(i = 0; i < N; i++) {
            for(j = 0; j < N; j++) {
                if(board[i] == j)
                    printf("Q ");
                else
                    printf(". ");
            }
            printf("\\n");
        }
    }
    else {
        printf("Solution not found");
    }

    return 0;
}`,
    sampleInput: '',
    sampleOutput: 'Solution:\nQ . . . . . . . \n. . . . Q . . . \n. . . . . . . Q \n. . . . . Q . . \n. . Q . . . . . \n. . . . . . Q . \n. Q . . . . . . \n. . . Q . . . . \n',
    timeComplexity: 'O(N!) upper bound',
    spaceComplexity: 'O(N)',
    conclusion: 'The 8-Queens problem shows backtracking: partial solutions that cannot be completed are abandoned early, which is what makes the search feasible. The 8 × 8 board has 92 solutions.',
    vivaQuestions: [
      {
        id: 'prac-8-queens-viva-how-does-the',
        question: 'How does the backtracking search know that a position is unsafe?',
        expectedAnswer: 'It checks the already placed queens: a new position is unsafe when another queen stands in the same column or on the same diagonal (the absolute difference of the row and column distances is equal).',
        keywords: ['column', 'diagonal', 'unsafe', 'check'],
        topic: '8-queens',
        category: 'backtracking',
      },
      {
        id: 'prac-8-queens-viva-what-is-the-',
        question: 'What is the difference between backtracking and brute force?',
        expectedAnswer: 'Brute force explores every combination, while backtracking prunes a partial solution as soon as it violates a constraint and never explores its subtree.',
        keywords: ['prune', 'partial', 'subtree', 'constraint'],
        topic: '8-queens',
        category: 'backtracking',
      },
    ],
  },
  {
    id: 'prac-15-puzzle',
    name: '15-Puzzle Problem Using Branch and Bound',
    category: 'branch-and-bound',
    aim: 'To solve the 15-puzzle with a best-first search that uses the Manhattan distance as an admissible heuristic.',
    theory: 'The 15-Puzzle consists of a 4×4 board containing 15 numbered tiles and one empty space represented by zero. The objective is to arrange the tiles in ascending order.\n\nBranch and Bound explores possible board configurations using a cost function. Manhattan Distance estimates the remaining cost, and the configuration with the lowest estimated total cost is explored first.',
    problemStatement: '15-Puzzle Problem Using Branch and Bound',
    algorithm: [
      'Read the 16 tiles, using 0 for the blank.',
      'Compute the Manhattan distance heuristic of the start state.',
      'Insert the start node into the open list, ordered by f = g + h.',
      'Take the node with the smallest f value from the open list.',
      'If its heuristic is 0, the puzzle is solved — otherwise expand it into its successors.',
      'Skip states that were visited before and insert the successors into the open list.',
    ],
    pseudocode: [
      'function bestFirstSearch(start)',
      '    open ← { start }; visited ← { start }',
      '    while open is not empty',
      '        node ← node with the smallest g + h in open',
      '        if node.h = 0 then return node',
      '        for each successor of node',
      '            if successor not in visited',
      '                visited ← visited ∪ { successor }',
      '                open ← open ∪ { successor }',
    ],
    cProgram: `#include <stdio.h>
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

    printf("\\n");
    for(i = 0; i < 16; i++) {
        printf("%2d ", p->a[i]);
        if(i % 4 == 3) printf("\\n");
    }
}

int main() {
    Node *start, *cur, *child;
    int moves[4] = {-4, 4, -1, 1};
    int i, j, b, nb, t, found = 0;

    start = malloc(sizeof(Node));

    printf("Enter puzzle (use 0 for blank):\\n");

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
        printf("No solution found.\\n");

    return 0;
}`,
    sampleInput: `1 2 3 4
5 6 7 8
9 10 11 12
13 14 15 0
`,
    sampleOutput: 'Enter puzzle (use 0 for blank):\n\n 1  2  3  4 \n 5  6  7  8 \n 9 10 11 12 \n13 14 15  0 \n',
    timeComplexity: 'Exponential in the solution depth in the worst case',
    spaceComplexity: 'Exponential in the number of explored states',
    conclusion: 'Branch and bound explores the 15-puzzle with a best-first search. The Manhattan distance is an admissible heuristic — it never overestimates the remaining distance — so the search expands only promising states.',
    vivaQuestions: [
      {
        id: 'prac-15-puzzle-viva-what-makes-t',
        question: 'What makes the Manhattan distance an admissible heuristic?',
        expectedAnswer: 'It never overestimates the number of moves that are still needed, because every tile has to travel at least the Manhattan distance between its current and its goal position.',
        keywords: ['admissible', 'overestimate', 'lower bound', 'moves'],
        topic: '15-puzzle',
        category: 'branch-and-bound',
      },
      {
        id: 'prac-15-puzzle-viva-what-is-the-',
        question: 'What is the difference between branch and bound and best-first search here?',
        expectedAnswer: 'Both order the open list by an optimistic estimate; branch and bound additionally prunes a branch when its bound can no longer beat the best solution found so far.',
        keywords: ['bound', 'prune', 'best solution', 'optimistic'],
        topic: '15-puzzle',
        category: 'branch-and-bound',
      },
    ],
  },
  {
    id: 'prac-rabin-karp',
    name: 'String Matching Using Rabin-Karp Algorithm',
    category: 'string-matching',
    aim: 'To find all occurrences of a pattern inside a text with hashing and to compare the method with the naive search.',
    theory: 'Rabin-Karp is a string-matching algorithm that uses hashing to find occurrences of a pattern within a text. It calculates hash values for the pattern and text windows and compares actual characters when hash values match.',
    problemStatement: 'String Matching Using Rabin-Karp Algorithm',
    algorithm: [
      'Read the text and the pattern.',
      'Compute the hash of the pattern and of the first window of the text.',
      'Compare the two hashes.',
      'On a match, verify the characters one by one.',
      'Slide the window by one position and update the hash in constant time.',
      'Continue until the end of the text.',
    ],
    pseudocode: [
      'function rabinKarp(text, pattern)',
      '    M ← length(pattern); N ← length(text)',
      '    h ← hash of the first M characters',
      '    for i ← 0 to N - M',
      '        if h = hash(pattern) and text[i .. i+M) = pattern',
      '            report the occurrence at i',
      '        h ← update the rolling hash for the next window',
    ],
    cProgram: `#include <stdio.h>
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
                printf("Pattern found at position %d\\n", i);
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
}`,
    sampleInput: `ABCABCABCABC
ABC
`,
    sampleOutput: 'Enter text: Enter pattern: Pattern found at position 0\nPattern found at position 3\nPattern found at position 6\nPattern found at position 9\n',
    timeComplexity: 'Average: O(n + m) · Worst: O(nm)',
    spaceComplexity: 'O(1)',
    conclusion: 'Rabin-Karp uses a rolling hash so that most positions can be rejected without comparing characters. The hash only shortens the search — a match still has to be verified, which is why the worst case stays at O(nm).',
    vivaQuestions: [
      {
        id: 'prac-rabin-karp-viva-why-is-the-h',
        question: 'Why is the hash of the pattern recomputed only once?',
        expectedAnswer: 'Because the hash of every text window is computed from the hash of the previous window in constant time — only the character that leaves and the one that enters the window have to be accounted for.',
        keywords: ['rolling', 'constant time', 'window', 'update'],
        topic: 'rabin-karp',
        category: 'string-matching',
      },
      {
        id: 'prac-rabin-karp-viva-when-can-rab',
        question: 'When can Rabin-Karp be slower than KMP?',
        expectedAnswer: 'In the worst case, when many windows produce the same hash and every one of them has to be verified character by character — then it degrades to O(nm).',
        keywords: ['worst case', 'same hash', 'verify', 'O(nm)'],
        topic: 'rabin-karp',
        category: 'string-matching',
      },
    ],
  },
];

/** The practical exercises of one category. */
export function getPracticalsByCategory(category: string): PracticalExercise[] {
  return PRACTICALS.filter((practical) => practical.category === category);
}

/** Looks up a practical exercise by its id. */
export function getPracticalById(id: string): PracticalExercise | undefined {
  return PRACTICALS.find((practical) => practical.id === id);
}

/** All categories that have a practical exercise. */
export function getPracticalCategories(): string[] {
  return [...new Set(PRACTICALS.map((practical) => practical.category))].sort();
}
