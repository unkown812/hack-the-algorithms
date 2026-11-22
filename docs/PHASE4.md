# Phase 4 — Complexity Analyzer & Performance Lab

This document describes the fourth phase of the DAA Learning Companion: a
**theoretical complexity analyzer**, a **deterministic operation-counting
engine**, an **input-size testing lab**, **empirical benchmarking**, **growth
visualisation**, an **algorithm comparison lab**, an **explanation engine** and
**exportable complexity reports**.

---

## 1. Goals and non-goals

| Goal | Status |
|------|--------|
| Derive complexity from reviewed metadata with explicit derivations | Done |
| Count operations from *real* instrumented algorithm code | Done |
| Measure real execution time with a sound benchmarking protocol | Done |
| Visualise how counts grow with input size | Done |
| Compare algorithms on an identical dataset with validated outputs | Done |
| Explain the results in plain language | Done |
| Export reports as Markdown / CSV / JSON with methodology | Done |
| Provide learning content for time and space complexity | Done |

**Non-goals (deliberate):**

- Claiming native C performance. Timings are produced by the instrumented
  TypeScript implementation running in the extension renderer. The UI and the
  reports state this explicitly wherever a number is shown.
- Estimating operation counts from Big-O. Counts come from executing code.
- Presenting algorithms from different problem families as comparable.
- Executing arbitrary user code.

---

## 2. Data classification

Every number shown by Phase 4 belongs to exactly one of four classes. The
classes are never merged, and every report carries the classification.

| Class | Meaning | Source |
|-------|---------|--------|
| **THEORETICAL** | Big-O classes, case analyses, derivations | Reviewed algorithm metadata (`src/core/algorithms/**`) |
| **INSTRUMENTED** | Operation counts (comparisons, swaps, writes, loop iterations, …) | The instrumented engine (`src/core/complexity/counters/engine/`) |
| **ESTIMATED** | Model-based byte/stack approximations | `MemoryEstimator`, `FIXED_AUXILIARY_BYTES` |
| **MEASURED** | Wall-clock timings of an actual benchmark run | `BenchmarkRunner` (renderer process) |

The classification notice is embedded in the report generator
(`CLASSIFICATION_NOTICE`) and repeated in the Markdown, CSV (`Classification`
column) and JSON (`dataLabels`) exports.

---

## 3. Module map

```
src/core/complexity/
├── analyzer/          ComplexityNormalizer, RecurrenceAnalyzer, LoopAnalyzer, RecursionAnalyzer
├── benchmarks/        BenchmarkRunner, BenchmarkStatistics, BenchmarkConfig
├── comparison/        AlgorithmComparator, ComparisonService
├── counters/          OperationCounter, CountingPolicy
│   └── engine/        Instrumented implementations + counting conventions
├── explanations/      ComplexityExplanationService
├── input/             InputGenerator, InputSizeTester
├── learning/          ComplexityTopics (time + space topics, notation table)
├── reports/           ComplexityReportGenerator, ReportExporter
├── space/             SpaceAnalyzer, MemoryEstimator, AllocationTracker
└── types/             OperationMetrics, BenchmarkResult, SpaceMetrics, ComparisonResult
```

Webview surfaces:

```
src/webview/pages/ComplexityAnalyzerPage.tsx    theory | operations | space | learn
src/webview/pages/PerformanceLabPage.tsx        benchmark | growth | samples | compare | report
src/webview/pages/AlgorithmComparisonPage.tsx   peer selection, comparison table
src/webview/components/complexity/              charts, panels, report preview
```

---

## 4. The instrumented operation-counting engine

### 4.1 Why a separate engine

The Phase 2 visualization engine produces *narrative* traces for teaching. Its
counters (`operations`, `comparisons`, `swaps`, `iterations`) are coarse and are
tied to animation steps. Phase 4 needs counts that are **deterministic**,
**comparable between algorithms** and **independent of the UI**.

The engine therefore contains one instrumented implementation per algorithm,
each mirroring the corresponding C file in `src/core/code-data/` statement for
statement. The counts are produced by the algorithm's own statements — never
derived from a Big-O class.

| Engine file | Mirrors |
|-------------|---------|
| `engine/sorting/bubble-sort.ts` | `code-data/bubble-sort.c` |
| `engine/sorting/selection-sort.ts` | `code-data/selection-sort.c` |
| `engine/sorting/insertion-sort.ts` | `code-data/insertion-sort.c` |
| `engine/sorting/merge-sort.ts` | `code-data/merge-sort.c` |
| `engine/sorting/quick-sort.ts` | `code-data/quick-sort.c` |
| `engine/searching/linear-search.ts` | `code-data/linear-search.c` |
| `engine/searching/binary-search.ts` | `code-data/binary-search.c` |

### 4.2 Counting conventions

The conventions are defined once, in
`src/core/complexity/counters/engine/CountingConventions.ts`, and are shown to
the user in the operations panel and in every report.

Global rules:

- `comparisons` counts **data comparisons only**. Index bound checks
  (`i < n`, `j >= 0`) are not comparisons. C's `&&` short-circuit is honoured:
  in insertion sort the comparison `arr[j] > key` is not evaluated once
  `j >= 0` fails.
- `arrayAccesses` counts every **read** of an array element (including reads
  from merge-sort's temporary arrays).
- `arrayWrites` counts every **write** into any array.
- A **swap** is one exchange of two array elements. Its reads and writes are
  counted separately (`arrayAccesses` / `arrayWrites`), so the numbers stay
  additive.
- `assignments` counts the scalar assignments listed per algorithm. Loop
  counter updates are represented by `loopIterations` instead.
- Counters that do not apply to an algorithm stay `0` and are displayed as
  *n/a* in the UI (never as "zero happened").

Per-algorithm highlights:

| Algorithm | Convention summary |
|-----------|--------------------|
| Bubble Sort | `comparisons` = one per inner iteration; each exchange adds 2 writes, 2 reads and 1 temp assignment; `swapped` flag assignments counted. |
| Selection Sort | `comparisons` = one per inner iteration (order independent); the exchange is skipped when `minIndex == i`, exactly as in C. |
| Insertion Sort | Short-circuit aware; `key = arr[i]`, `j = i - 1` and every `j--` are assignments; shifts are writes, never swaps. |
| Merge Sort | `recursiveCalls` = mergeSort invocations (2n − 1 for size n, root included); `functionCalls` = merge() invocations (n − 1); two temp arrays per merge (4 bytes per C int element). |
| Quick Sort | Lomuto partition with last-element pivot; `functionCalls` = partition() invocations; the final pivot exchange is counted as a swap. |
| Linear Search | One comparison and one read per examined element. |
| Binary Search | A failed probe costs 2 comparisons (`==` then `<`), a successful probe 1; `low`/`high`/`mid` updates are assignments. |

### 4.3 Worked example

`bubble-sort` on `[5, 3, 8, 2, 1]`:

| Counter | Value | Derivation |
|---------|-------|------------|
| comparisons | 10 | 4 + 3 + 2 + 1 inner iterations |
| swaps | 8 | 3 + 2 + 2 + 1 exchanges |
| arrayWrites | 16 | 2 per exchange |
| arrayAccesses | 36 | 2 reads per comparison + 2 reads per exchange |
| assignments | 20 | 4 × `swapped = 0` + 8 × (temp + `swapped = 1`) |
| loopIterations | 14 | 4 outer + 10 inner body executions |

These exact values are asserted in `tests/unit/complexity/counters.test.ts`.

### 4.4 Guarantees

- The caller's array is never mutated (sorting runs work on a copy).
- Repeated runs on the same input produce identical counters.
- Outputs are validated: sorting must be non-decreasing and preserve the
  multiset of values; searching must return an in-range index or `-1`.
- Invalid input is rejected explicitly — never silently truncated.

---

## 5. Benchmarking

`BenchmarkRunner` (in the renderer, so the extension host is never blocked):

1. Validate the algorithm id and the dataset.
2. Run `warmupRuns` untimed executions (JIT warm-up, cache priming).
3. Run `trials` timed executions on the **identical dataset** — the
   instrumented implementations never mutate their input, so every trial starts
   from the same state.
4. Yield to the event loop between trials so the UI stays responsive.
5. Summarise with minimum, median, mean, maximum and standard deviation.

Additional guarantees:

- **Cancellation** — a `{ aborted }` signal (compatible with `AbortSignal`)
  is checked before every run; a cancelled benchmark rejects with
  `CancellationRequestedError`.
- **Timeouts** — a deadline is checked between trials; exceeding it rejects
  with `BenchmarkTimeoutError`.
- **Output validation** — every trial's output is verified; the result carries
  `outputValid`.
- **Progress** — `onProgress` reports 0–100 % across the trials.

Input limits per algorithm are declared in `BenchmarkConfig.MAX_INPUT_LIMITS`
(quadratic algorithms are capped far below the near-linear ones) and enforced
by the UI before a run starts.

> Timings describe the instrumented TypeScript execution inside the VS Code
> renderer. They are **not** native C compiler output. The UI, the explanations
> and the exported reports all state this.

---

## 6. Comparison lab

`ComparisonService` / `AlgorithmComparator`:

- Every selected algorithm runs on the **same dataset** (deep-copied per run).
- For algorithms of the same family the outputs are compared and
  `outputsEquivalent` is reported.
- For mixed families `outputsEquivalent` stays `undefined` — no equivalence is
  claimed — and the comparability note explains that the algorithms solve
  different problems (the BFS-vs-DFS caveat).
- Each row keeps the theoretical classes and the instrumented counts in
  separate columns; the measured time is a third, clearly labelled column.

---

## 7. Input lab

`InputGenerator` produces deterministic datasets from a seed:

| Scenario | Shape |
|----------|-------|
| `already-sorted` | ascending |
| `reverse-sorted` | descending |
| `random-order` | pseudo-random |
| `nearly-sorted` | sorted with ≈10 % swaps |
| `duplicate-heavy` | ≈30 % distinct values |
| `target-beginning` / `target-middle` / `target-end` / `target-not-found` / `random-target` | search datasets (always sorted, with a defined target) |

`InputSizeTester` wires the scenario to the algorithm family, honours `seed`
and `valueRange`, and rejects out-of-range sizes in the UI instead of
truncating them.

---

## 8. Space analysis

`SpaceAnalyzer` merges three sources and keeps them apart:

- **Theoretical** — `O(1)`, `O(log n)`, `O(n)` from the reviewed metadata.
- **Estimated** — fixed local bytes (4 bytes per C `int`) plus the auxiliary
  arrays actually requested by the instrumented run (merge sort's temp
  arrays).
- **Measured** — allocation count, deallocation count, peak auxiliary bytes
  and maximum recursion depth recorded during the instrumented execution.

---

## 9. Explanation engine

`ComplexityExplanationService` produces:

- Structured sections per algorithm (overview, time, space, best/average/worst
  analyses) sourced from the reviewed metadata.
- `interpretOperations(...)` — plain-language observations that connect the
  counted numbers to the theory (e.g. *"Merge sort made 9 mergeSort
  invocations (2n − 1 = 9 tree nodes at n = 5)"*).
- `interpretBenchmark(...)` — timing interpretation including the coefficient
  of variation and the explicit "not native C compiler output" caveat.

`ComplexityTopics` ships the learning content: 12 time-complexity topics,
6 space-complexity topics and an 8-entry notation reference table, each with
key points and, where useful, an interactive C example.

---

## 10. Reports

`ComplexityReportGenerator` produces a report containing the problem
statement, approach, pseudocode, theoretical classes, case analyses with
derivations and assumptions, instrumented counts, measured timings, the
methodology paragraph and the data-classification notice.

`ReportExporter` renders it in three formats:

| Format | Contents |
|--------|----------|
| Markdown | Sections, tables, counting convention, methodology, classification notice |
| CSV | `Metric,Value,Classification` rows — every row carries its class |
| JSON | The full report plus `dataLabels` and a `methodologyNotice` |

Export from the webview goes through the `EXPORT_REPORT` message to the
extension host, which shows a save dialog and writes the file.

---

## 11. Tests

`tests/unit/complexity/` contains the Phase 4 suite:

| File | Focus |
|------|-------|
| `counters.test.ts` | Exact operation counts per algorithm, conventions, determinism, input safety, validation |
| `benchmarking.test.ts` | Statistics, warm-up/trial protocol, progress, cancellation, timeout, limits |
| `comparison.test.ts` | Identical dataset, output equivalence, cross-family caveats |
| `input.test.ts` | Seeded determinism, scenario shapes, target construction |
| `reports.test.ts` | Report content, classification labels, Markdown/CSV/JSON export |
| `analysis.test.ts` | Normalizer, recurrence analysis, explanations, space analysis, learning content |

Run everything with:

```bash
npm run test        # vitest run
npm run check-types # tsc --noEmit
npm run lint        # eslint src
npm run compile     # esbuild bundles (node + browser)
npm run package     # vsce package -> VSIX
```

---

## 12. Extension-host protocol

| Message | Direction | Payload |
|---------|-----------|---------|
| `GET_ALGORITHMS` | webview → host | – |
| `ALGORITHMS_DATA` | host → webview | `Algorithm[]` |
| `GET_ALGORITHM_DETAIL` | webview → host | `{ algorithmId }` |
| `ALGORITHM_DETAIL` | host → webview | `Algorithm` |
| `EXPORT_REPORT` | webview → host | `{ content, fileName, languageId }` |

All Phase 4 computation (counting, benchmarking, comparison) happens in the
renderer, so the extension host never blocks.
