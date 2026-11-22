# Phase 6 — Practice, Assessment & Learning Progress

Phase 6 turns the DAA Learning Companion into a place where a student can
**demonstrate** their understanding: quizzes with explanations, coding
challenges that are compiled and tested locally, university-style practical
preparation, viva practice and a local progress dashboard.

Everything works **offline**. The question bank, the challenges, the practical
programs and the viva questions are bundled with the extension; the progress
data stays on the machine.

---

## 1. The Practice Centre

The practice centre is reachable from the dashboard, from the Activity Bar
(*DAA Companion → Practice Centre*) and from the command palette
(*DAA Companion: Practice Centre*).

| Section | What it offers |
|---------|----------------|
| **Quick practice** | Quick Quiz (5), Topic Quiz (10), Standard Assessment (20), Comprehensive Assessment (30) and a custom quiz builder |
| **Topic-wise practice** | The questions of one topic with the explanations |
| **Coding challenges** | 23 problems with sample, practice and hidden test cases |
| **Practical preparation** | 10 practicals, 4 mock papers and 27 viva questions |
| **My progress** | Statistics, topic performance, revision recommendations, achievements and bookmarks |

---

## 2. Question bank

79 curated questions in ten categories:

| Category | Questions | Examples |
|----------|-----------|----------|
| Algorithm Fundamentals | 20 | characteristics of an algorithm, basic operation, design techniques, code output, find-the-error |
| Searching Algorithms | 10 | binary vs linear search, preconditions, space complexity |
| Sorting Algorithms | 13 | stability, adaptivity, worst cases, inversion counting |
| Greedy Algorithms | 4 | fractional knapsack, activity selection, Huffman, exchange argument |
| Divide and Conquer | 5 | master theorem, recursion tree, min/max comparison count |
| Dynamic Programming | 6 | 0/1 knapsack, LCS, matrix chain, memoization |
| Graph Algorithms | 8 | BFS/DFS, Dijkstra vs Bellman-Ford, Floyd-Warshall, Kruskal vs Prim |
| Backtracking | 4 | N-Queens, pruning, sum of subsets, graph colouring |
| Branch and Bound | 4 | TSP, bounding functions, 0/1 knapsack |
| String Matching | 5 | naive vs KMP vs Rabin-Karp, LPS table, rolling hash |

Question types: `mcq`, `multiple-select`, `true-false`, `fill-blank`,
`code-output`, `find-error`, `complexity` and `short-answer`.

### Quality rules

The bank is validated automatically (`validateQuestionBank`):

- every question has an id, a category, a topic, a difficulty and an
  explanation of at least 20 characters,
- a choice question must offer its correct answer as one of the options,
- a multiple-select question needs at least two correct answers,
- a find-the-error question must mark real lines of its snippet and provide the
  corrected implementation,
- a code-output question must have a snippet.

**The code snippets are executed.** `tests/unit/questions/question-verification.test.ts`
compiles every `code-output` snippet with GCC, runs it and compares the real
output with the stored answer. A wrong expected output fails the build.

---

## 3. Quizzes

### Modes

| Mode | Feedback | Hints | Use |
|------|----------|-------|-----|
| **Learning** | after every answer | yes | learning a topic |
| **Test** | after the submission | no | a realistic assessment |
| **Revision** | after every answer | yes | previously wrong and bookmarked questions first |

### Scoring

The rules are transparent and reproducible by hand:

```
marks per question = total marks / number of questions
score              = correct · marks − incorrect · negative marking
```

Negative marking is **zero** unless the assessment configures it. The scoring
rules are shown to the student before the quiz starts.

### Timer and navigation

A timed quiz shows a countdown; the question navigator shows the state of every
question (answered / unanswered / marked for review). An unfinished quiz is
stored as `activeQuiz` and offered again on the next visit — it is never
silently marked as completed.

---

## 4. Code output prediction and find-the-error

- **Code output**: the student predicts the output of a real C program. The
  snippets are compiled and run by the test suite, so the stored answer is the
  program's real output.
- **Find the error**: the student selects the erroneous line. The explanation
  names the problem, and the corrected implementation is shown afterwards.
- **Complexity**: the student determines the iteration count and the time and
  space complexity of a snippet; the explanation contains the derivation and
  points to the Phase 4 Complexity Analyzer.

---

## 5. Coding challenges

23 challenges with a reference solution, a sample case, public practice cases
and hidden evaluation cases.

| Level | Challenges |
|-------|-----------|
| Beginner | find minimum, find maximum, linear search, binary search, reverse array, bubble sort, selection sort, insertion sort |
| Intermediate | merge sort, quick sort, fractional knapsack, activity selection, matrix chain multiplication, LCS, BFS, DFS |
| Advanced | Dijkstra, Bellman-Ford, Floyd-Warshall, N-Queens, graph colouring, TSP, 0/1 knapsack |

### Evaluation

`ChallengeEvaluator` reuses the **Phase 5** compiler and the **Phase 5**
execution service — there is no second, less secure execution path:

1. the submitted code is compiled (a compile error is reported with the
   diagnostics),
2. every test case is executed with the Phase 5 process manager (time limit,
   output cap and process cleanup apply),
3. the output is compared with the expected output,
4. the result is stored and the feedback is shown.

A solution is **only accepted when every test case passes** — including the
hidden ones. The student sees how many tests passed, but never the input or
the expected output of a hidden test.

### Verified test cases

`tests/unit/challenges/challenge-verification.test.ts` compiles the reference
solution of every challenge, runs it against every test case and compares the
result with the stored expectation. The test data is therefore never a guess.

---

## 6. Practical preparation

The ten Phase 3 practicals were converted into the full practical-paper
structure:

1. name · 2. aim · 3. theory · 4. problem statement · 5. algorithm ·
6. pseudocode · 7. C program · 8. sample input · 9. sample output ·
10. time complexity · 11. space complexity · 12. conclusion · 13. viva questions

The C programs are the verified Phase 3 implementations and the sample outputs
were produced by running them (asserted by the test suite).

### Modes

- **Guided** — theory, pseudocode and the reference code are visible.
- **Independent** — only the problem statement is visible; the reference code
  is revealed after the submission.
- **Mock examination** — a set of practicals with a time limit, evaluated
  with the coding challenge engine.

> The mock examinations are **practice papers prepared by the extension**.
> They imitate the structure of a university practical examination but are
> never presented as an official examination.

---

## 7. Viva practice

27 viva questions with a structured expected answer and keywords. The student writes their own answer, compares it with the expected one and marks whether
they understood it — the extension never pretends to judge a free-form answer.

---

## 8. Progress and recommendations

### Statistics

Algorithms explored, questions answered, overall accuracy, quizzes completed,
average quiz accuracy, challenges attempted and accepted, topics explored,
practicals completed and the number of learning sessions.

### Topic performance

Every topic gets one of four states, from transparent rules:

| State | Rule |
|-------|------|
| strong | at least 5 questions attempted **and** at least 80 % correct |
| weak | at least 5 questions attempted **and** less than 60 % correct |
| moderate | attempted but fewer than 5 questions, or 60–80 % correct |
| not started | no question answered |

A single wrong answer never makes a topic weak.

### Recommendations

The rules are applied in the priority order of the specification and every
recommendation carries its reason:

1. questions that were answered wrongly at least twice,
2. topics that are not completed yet,
3. weak topics,
4. bookmarked questions,
5. coding challenges that were submitted without passing every test.

A separate rule points at the Phase 4 Complexity Analyzer when the complexity
exercises are the weak spot.

### Achievements

Ten achievements whose criteria are checked against the recorded data — for
example *First Coding Challenge Solved* requires an accepted submission.
There are no arbitrary milestones.

---

## 9. Local data

| Data | Storage |
|------|---------|
| Quiz attempts, submissions, bookmarks, achievements, statistics | `globalState` (`daa.learningData`) |
| The unfinished quiz | the same record (`activeQuiz`) |
| Test cases of a saved program | the same record |

The data is versioned (`version: 1`) and migrated on read: a missing or
malformed field is completed with the default, and data written by a newer
version is left untouched. The student can export the data as JSON and import
it again, or reset it completely.

**Nothing is uploaded.** No account, no network request, no external service.

---

## 10. Architecture

```
src/core/practice/       PracticeService — the facade used by the host
src/core/questions/      QuestionRegistry, AnswerEvaluator, the question bank
src/core/quizzes/         QuizEngine, QuizScoringService
src/core/challenges/     ChallengeRegistry, ChallengeEvaluator, the challenge bank
src/core/assessments/     AssessmentEngine — one result model for every type
src/core/practicals/     PracticalExamService, MockExamEngine, VivaQuestionService
src/core/progress/       TopicProgressTracker, PerformanceAnalyzer, RevisionRecommendationService
src/core/achievements/   AchievementRegistry, AchievementService
src/core/bookmarks/      BookmarkService
src/core/storage/        LearningDataStore, DataMigrationService
src/extension/practice/  message-handler — the bridge to the webview
src/webview/pages/       PracticePage, QuizPage, CodingChallengesPage, PracticalPreparationPage, LearningProgressPage
```

The webview never imports a module that touches a process or the file system:
the challenge evaluation happens in the extension host with the Phase 5
services.

### Message protocol

| Message | Direction |
|---------|-----------|
| `GET_PRACTICE_OVERVIEW`, `GET_QUESTIONS`, `START_QUIZ`, `ANSWER_QUIZ`, `MARK_QUESTION`, `SUBMIT_QUIZ`, `ABANDON_QUIZ`, `GET_ACTIVE_QUIZ` | webview → host |
| `GET_CHALLENGES`, `GET_CHALLENGE`, `SUBMIT_CHALLENGE`, `GET_REFERENCE_SOLUTION` | webview → host |
| `GET_PRACTICALS`, `GET_PRACTICAL`, `GET_MOCK_EXAMS`, `RECORD_MOCK_EXAM`, `GET_VIVA` | webview → host |
| `TOGGLE_BOOKMARK`, `GET_BOOKMARKS`, `GET_PROGRESS`, `RESET_PROGRESS`, `EXPORT_PROGRESS`, `IMPORT_PROGRESS` | webview → host |
| `PRACTICE_OVERVIEW`, `QUESTIONS_LOADED`, `QUIZ_STARTED`, `QUIZ_RESULT`, `CHALLENGES_LOADED`, `CHALLENGE_LOADED`, `CHALLENGE_RESULT`, `PRACTICALS_LOADED`, `PRACTICAL_LOADED`, `MOCK_EXAMS_LOADED`, `VIVA_LOADED`, `BOOKMARKS_LOADED`, `PROGRESS_LOADED`, `PRACTICE_ERROR` | host → webview |

---

## 11. Tests

| File | Focus |
|------|-------|
| `tests/unit/questions/question-bank.test.ts` | Bank validation, filtering, answer evaluation |
| `tests/unit/questions/question-verification.test.ts` | Executes every code snippet and compares the real output |
| `tests/unit/quizzes/quiz-engine.test.ts` | Quiz building, scoring, negative marking, revision rules |
| `tests/unit/challenges/challenge-verification.test.ts` | Runs every test case of every challenge with its reference solution |
| `tests/unit/challenges/challenge-evaluator.test.ts` | Accept / wrong answer / compile error / runtime error, hidden test protection |
| `tests/unit/practicals/practicals.test.ts` | Practical structure, sample outputs, preparation modes, mock exams |
| `tests/unit/progress/progress-and-storage.test.ts` | Storage, migration, bookmarks, achievements, topic performance, recommendations |
| `tests/unit/practice/practice-service.test.ts` | The complete quiz flow, bookmarks, progress, import/export |
| `tests/unit/practice/practice-ui.test.tsx` | Renders every Phase 6 page and component |

The compiler-dependent tests use the real toolchain when one is installed and
are skipped otherwise.

---

## 12. Limitations

- The question bank is deliberately small and curated rather than large and
  repetitive. It covers the classic DAA curriculum, not every syllabus.
- Free-form answers are never judged automatically — the student verifies them
  against the expected answer.
- The code-output and find-the-error exercises use curated snippets; the
  extension does not claim to find any possible bug in any program.
- The hidden test cases of a challenge are protected from the student-facing
  interface, but a determined student could still read them from the extension
  folder — they are not a security boundary, they are a learning aid.
- Only C is supported for the coding challenges. The architecture is prepared
  for more languages, but each one needs its own compiler adapter.
