import type { Question } from '../practice/types';

/**
 * Code output prediction, find-the-error and complexity exercises.
 *
 * Every C snippet in this file was compiled and executed with GCC, and the
 * expected answers are the real outputs of that code.
 */
export const CODE_EXERCISE_QUESTIONS: Question[] = [
  {
    id: 'code-001',
    title: 'Printing an array',
    category: 'fundamentals',
    topic: 'arrays',
    difficulty: 'beginner',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int arr[] = {5, 3, 8, 1};

    for (int i = 0; i < 4; i++) {
        printf("%d ", arr[i]);
    }

    return 0;
}`,
    options: ['5 3 8 1', '5 3 8 1 0', '1 3 5 8', 'The values in reverse order'],
    correctAnswer: '5 3 8 1',
    explanation:
      'The loop starts at index 0 and stops before index 4, so it prints the four elements in their original order, each followed by a space. The array is initialised in that order and nothing changes it.',
    hints: ['How many times does the loop body run?'],
    tags: ['arrays', 'loops', 'output-prediction'],
    estimatedTimeSeconds: 45,
  },
  {
    id: 'code-002',
    title: 'Off-by-one in a loop',
    category: 'fundamentals',
    topic: 'loops',
    difficulty: 'beginner',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int arr[4] = {10, 20, 30, 40};

    for (int i = 0; i <= 3; i++) {
        printf("%d ", arr[i]);
    }

    return 0;
}`,
    options: ['10 20 30', '10 20 30 40', '10 20 30 40 50', 'Undefined behaviour'],
    correctAnswer: '10 20 30 40',
    explanation:
      'The condition uses <=, so the loop body also runs for i = 3 — the last valid index of a four element array. The condition is still safe: i never reaches 4, so no out-of-bounds access happens.',
    hints: ['For which values of i is the condition true?'],
    tags: ['loops', 'off-by-one', 'output-prediction'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'code-003',
    title: 'Compound assignment',
    category: 'fundamentals',
    topic: 'operators',
    difficulty: 'beginner',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int x = 5;
    x += x;

    printf("%d\\n", x);

    return 0;
}`,
    options: ['5', '10', '0', '20'],
    correctAnswer: '10',
    explanation:
      'The compound assignment x += x is equivalent to x = x + x, but the right hand side is evaluated completely before the assignment. x is 5 on both sides, so the result is 10 — not 20 and not 0.',
    hints: ['x += x means x = x + x.'],
    tags: ['operators', 'assignment', 'output-prediction'],
    estimatedTimeSeconds: 45,
  },
  {
    id: 'code-004',
    title: 'Post-increment in a call',
    category: 'fundamentals',
    topic: 'operators',
    difficulty: 'intermediate',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int i = 5;

    printf("%d ", i++);
    printf("%d\\n", i);

    return 0;
}`,
    options: ['5 5', '5 6', '6 6', '6 5'],
    correctAnswer: '5 6',
    explanation:
      'The post-increment operator yields the old value of i (5) and only then increases it to 6. The first printf therefore prints 5, and the second call sees the already incremented value 6.',
    hints: ['Post-increment uses the value before the increase.'],
    tags: ['operators', 'increment', 'output-prediction'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'code-005',
    title: 'Counting bubble sort passes',
    category: 'sorting',
    topic: 'bubble-sort',
    difficulty: 'intermediate',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int arr[] = {3, 1, 2};
    int comparisons = 0;

    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3 - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }

    printf("%d %d %d %d\\n", comparisons, arr[0], arr[1], arr[2]);

    return 0;
}`,
    options: ['3 1 2 3', '2 1 2 3', '3 3 2 1', '6 1 2 3'],
    correctAnswer: '3 1 2 3',
    explanation:
      'The inner loop runs 2 + 1 + 0 = 3 times, so comparisons is 3. The array {3, 1, 2} is sorted into {1, 2, 3}, and the program prints the comparison count followed by the three sorted values.',
    hints: ['How many iterations does the inner loop make in each pass?'],
    tags: ['bubble-sort', 'output-prediction'],
    estimatedTimeSeconds: 90,
    algorithmId: 'bubble-sort',
  },
  {
    id: 'code-006',
    title: 'Recursive calls print in which order?',
    category: 'fundamentals',
    topic: 'recursion',
    difficulty: 'intermediate',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

void show(int n) {
    if (n == 0) {
        return;
    }
    printf("%d ", n);
    show(n - 1);
}

int main() {
    show(3);

    return 0;
}`,
    options: ['3 2 1', '1 2 3', '3 2 1 0', '0 1 2 3'],
    correctAnswer: '3 2 1',
    explanation:
      'The print happens before the recursive call, so the values are printed on the way down: 3, then 2, then 1. The call with n = 0 returns immediately without printing anything.',
    hints: ['Follow the order of the statements in the function.'],
    tags: ['recursion', 'output-prediction'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'code-007',
    title: 'Swap without a temporary variable',
    category: 'fundamentals',
    topic: 'pointers',
    difficulty: 'intermediate',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int a = 5;
    int b = 9;

    a = b;
    b = a;

    printf("%d %d\\n", a, b);

    return 0;
}`,
    options: ['5 9', '9 5', '9 9', '5 5'],
    correctAnswer: '9 9',
    explanation:
      'After "a = b" both variables hold 9. The second assignment "b = a" therefore copies 9 into b again. The original value 5 is lost after the first assignment — this is exactly why a swap needs a temporary variable.',
    hints: ['What is the value of a when the second assignment runs?'],
    tags: ['assignment', 'swap', 'output-prediction'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'code-008',
    title: 'Binary search midpoint',
    category: 'searching',
    topic: 'binary-search',
    difficulty: 'intermediate',
    type: 'code-output',
    question: 'What does this program print?',
    code: `#include <stdio.h>

int main() {
    int arr[] = {1, 3, 5, 7, 9};
    int low = 0;
    int high = 4;
    int mid = (low + high) / 2;

    printf("%d %d\\n", mid, arr[mid]);

    return 0;
}`,
    options: ['2 5', '1 3', '2 3', '3 7'],
    correctAnswer: '2 5',
    explanation:
      'The midpoint of the indices 0 and 4 is (0 + 4) / 2 = 2, and the element at index 2 of {1, 3, 5, 7, 9} is 5. The integer division truncates, so the midpoint of an even number of elements is the lower of the two middle positions.',
    hints: ['Which index is the middle of a five element array?'],
    tags: ['binary-search', 'output-prediction'],
    estimatedTimeSeconds: 60,
    algorithmId: 'binary-search',
  },
  {
    id: 'err-001',
    title: 'Missing semicolon',
    category: 'fundamentals',
    topic: 'syntax',
    difficulty: 'beginner',
    type: 'find-error',
    question: 'Which line contains the error? The program does not compile.',
    code: `#include <stdio.h>

int main() {
    int total = 0
    total = total + 5;

    printf("%d\\n", total);

    return 0;
}`,
    errorLines: [4],
    correctAnswer: '4',
    correctedCode: `#include <stdio.h>

int main() {
    int total = 0;
    total = total + 5;

    printf("%d\\n", total);

    return 0;
}`,
    explanation:
      'A declaration in C must end with a semicolon. Without it the compiler reads "int total = 0 total = total + 5;" as one invalid declaration and reports "expected \';\' before \'total\'". The error is reported on the following line, but the missing semicolon is on line 4.',
    hints: ['Every statement in C ends with a special character.'],
    tags: ['syntax', 'semicolon', 'find-error'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'err-002',
    title: 'Off-by-one in the loop condition',
    category: 'sorting',
    topic: 'bubble-sort',
    difficulty: 'intermediate',
    type: 'find-error',
    question: 'Which line contains the error that makes this program read past the end of the array?',
    code: `#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};

    for (int i = 0; i <= 5; i++) {
        printf("%d ", arr[i]);
    }

    return 0;
}`,
    errorLines: [6],
    correctAnswer: '6',
    correctedCode: `#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};

    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }

    return 0;
}`,
    explanation:
      'The array has the valid indices 0 … 4. With "i <= 5" the loop also accesses arr[5], which is outside the array — undefined behaviour that usually prints garbage or crashes. The condition must be "i < 5".',
    hints: ['Which index is the first one that does not exist?'],
    tags: ['off-by-one', 'arrays', 'find-error'],
    estimatedTimeSeconds: 75,
  },
  {
    id: 'err-003',
    title: 'Wrong binary search boundary',
    category: 'searching',
    topic: 'binary-search',
    difficulty: 'advanced',
    type: 'find-error',
    question: 'Which line contains the error? The program can loop forever.',
    code: `#include <stdio.h>

int main() {
    int arr[] = {1, 3, 5, 7, 9};
    int key = 7;
    int low = 0;
    int high = 4;

    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == key) {
            printf("found at %d\\n", mid);
            return 0;
        }
        if (arr[mid] < key) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    printf("not found\\n");
    return 0;
}`,
    errorLines: [18],
    correctAnswer: '18',
    correctedCode: `#include <stdio.h>

int main() {
    int arr[] = {1, 3, 5, 7, 9};
    int key = 7;
    int low = 0;
    int high = 4;

    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == key) {
            printf("found at %d\\n", mid);
            return 0;
        }
        if (arr[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    printf("not found\\n");
    return 0;
}`,
    explanation:
      'When arr[mid] is larger than the key, the mid position itself cannot contain the key any more, so the search interval must shrink to mid − 1. With "high = mid" the same midpoint is chosen again and the loop never terminates.',
    hints: ['Can the answer be at position mid when arr[mid] is too large?'],
    tags: ['binary-search', 'boundary', 'find-error'],
    estimatedTimeSeconds: 120,
    algorithmId: 'binary-search',
  },
  {
    id: 'err-004',
    title: 'Missing recursion base case',
    category: 'fundamentals',
    topic: 'recursion',
    difficulty: 'intermediate',
    type: 'find-error',
    question: 'Which line contains the error that makes the program crash?',
    code: `#include <stdio.h>

int factorial(int n) {
    return n * factorial(n - 1);
}

int main() {
    printf("%d\\n", factorial(5));

    return 0;
}`,
    errorLines: [3],
    correctAnswer: '3',
    correctedCode: `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    printf("%d\\n", factorial(5));

    return 0;
}`,
    explanation:
      'Without a base case the recursion never stops: n decreases until it underflows the int range and the program crashes with a stack overflow. Every recursive function needs a case whose answer is known without further recursion.',
    hints: ['What happens when n keeps decreasing?'],
    tags: ['recursion', 'base-case', 'find-error'],
    estimatedTimeSeconds: 90,
  },
  {
    id: 'err-005',
    title: 'Broken exchange',
    category: 'sorting',
    topic: 'bubble-sort',
    difficulty: 'intermediate',
    type: 'find-error',
    question: 'Which line contains the error? The program compiles but does not sort.',
    code: `#include <stdio.h>

int main() {
    int arr[3] = {3, 1, 2};

    int temp = arr[0];
    arr[0] = arr[1];
    arr[1] = temp;

    printf("%d %d %d\\n", arr[0], arr[1], arr[2]);

    return 0;
}`,
    errorLines: [7],
    correctAnswer: '7',
    correctedCode: `#include <stdio.h>

int main() {
    int arr[3] = {3, 1, 2};

    int temp = arr[0];
    arr[0] = arr[1];
    arr[1] = arr[0];

    printf("%d %d %d\\n", arr[0], arr[1], arr[2]);

    return 0;
}`,
    explanation:
      'The third line of the exchange writes arr[0] into arr[1], but arr[0] has already been overwritten with the old arr[1]. The old value of arr[1] is lost, so both positions end up with the same number. The exchange has to read the old value of arr[1] before overwriting it — that is what the temporary variable is for.',
    hints: ['What is stored in arr[0] at the moment of the last assignment?'],
    tags: ['swap', 'assignment', 'find-error'],
    estimatedTimeSeconds: 90,
  },
  {
    id: 'cx-001',
    title: 'Doubling loop',
    category: 'fundamentals',
    topic: 'complexity',
    difficulty: 'intermediate',
    type: 'complexity',
    question:
      'How many times does the loop body run, and what is the time and space complexity of this loop?',
    code: `for (int i = 1; i < n; i *= 2) {
    printf("%d", i);
}`,
    options: [
      'n iterations, O(n) time, O(1) space',
      '⌈log₂ n⌉ iterations, O(log n) time, O(1) space',
      'n/2 iterations, O(n) time, O(log n) space',
      '⌈log₂ n⌉ iterations, O(log n) time, O(log n) space',
    ],
    correctAnswer: '⌈log₂ n⌉ iterations, O(log n) time, O(1) space',
    explanation:
      'The value of i doubles in every iteration: 1, 2, 4, 8, … so after k iterations i = 2ᵏ. The loop stops when 2ᵏ ≥ n, i.e. after ⌈log₂ n⌉ iterations. Only a single counter is used, so the auxiliary space is O(1).',
    hints: ['Write down the sequence of values of i.'],
    tags: ['complexity', 'loops', 'logarithmic'],
    estimatedTimeSeconds: 75,
  },
  {
    id: 'cx-002',
    title: 'Nested loops',
    category: 'fundamentals',
    topic: 'complexity',
    difficulty: 'beginner',
    type: 'complexity',
    question: 'What is the time complexity of this nested loop?',
    code: `for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
        printf("%d", i * j);
    }
}`,
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    correctAnswer: 'O(n²)',
    explanation:
      'The outer loop runs n times and the inner loop runs n times for each of them, so the body executes n · n = n² times. The multiplication i * j inside is constant work and does not change the order of growth.',
    tags: ['complexity', 'nested-loops'],
    estimatedTimeSeconds: 45,
  },
  {
    id: 'cx-003',
    title: 'Recursive factorial',
    category: 'fundamentals',
    topic: 'recursion',
    difficulty: 'intermediate',
    type: 'complexity',
    question: 'What are the time and space complexities of the recursive factorial?',
    code: `int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}`,
    options: [
      'O(n) time, O(1) space',
      'O(n log n) time, O(log n) space',
      'O(n) time, O(n) space',
      'O(2ⁿ) time, O(n) space',
    ],
    correctAnswer: 'O(n) time, O(n) space',
    explanation:
      'The function calls itself exactly once per level and the depth is n, so the running time is Θ(n). Each level keeps its own n and its return address on the call stack, so the auxiliary space is Θ(n) as well.',
    tags: ['complexity', 'recursion'],
    estimatedTimeSeconds: 60,
  },
  {
    id: 'cx-004',
    title: 'Two pointers',
    category: 'searching',
    topic: 'linear-search',
    difficulty: 'intermediate',
    type: 'complexity',
    question: 'What is the time complexity of this search?',
    code: `int left = 0;
int right = n - 1;

while (left <= right) {
    int mid = (left + right) / 2;
    if (arr[mid] == key) {
        return mid;
    }
    if (arr[mid] < key) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}`,
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 'O(log n)',
    explanation:
      'Every iteration halves the search interval, so the number of iterations is ⌈log₂ n⌉. The algorithm only works on a sorted array — on unsorted data it may return "not found" for an element that is present.',
    hints: ['How does the size of the interval change per iteration?'],
    tags: ['complexity', 'binary-search'],
    estimatedTimeSeconds: 60,
    algorithmId: 'binary-search',
  },
  {
    id: 'cx-005',
    title: 'Dominant term',
    category: 'fundamentals',
    topic: 'complexity-analysis',
    difficulty: 'intermediate',
    type: 'complexity',
    question:
      'A function performs n log n comparisons and n² additions. What is its overall time complexity and why?',
    options: [
      'O(n²) — the n² term dominates n log n',
      'O(n log n) — comparisons are the more important operation',
      'O(n² log n) — the two costs are multiplied',
      'O(n) — only the linear part survives',
    ],
    correctAnswer: 'O(n²) — the n² term dominates n log n',
    explanation:
      'The costs add up, and the larger order of growth decides: n² grows faster than n log n, so the sum is Θ(n²). Big-O keeps the dominant term — but note that the coefficients of the two operations can matter in practice, which is why counting operations (as the Complexity Analyzer does) gives a more precise picture.',
    tags: ['complexity', 'dominant-term'],
    estimatedTimeSeconds: 60,
  },
];
