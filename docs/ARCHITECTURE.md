# Architecture Overview

## System Diagram

```mermaid
graph TD
    A[VS Code Extension Host] ↔|postMessage API| B[Webview React App]
    A --> C[Algorithm Registry]
    A --> D[Algorithm Service]
    C --> E[Algorithm Data]
    D --> C
    A --> F[Visualization Engine]
    F --> G[Trace Generators]
    B --> H[Dashboard Page]
    B --> I[Algorithm Library Page]
    B --> J[Algorithm Detail Page]
    B --> K[Algorithm Visualizer Page]
    B --> L[Complexity Analyzer Page]
    B --> M[Performance Lab Page]
    B --> N[Algorithm Comparison Page]
    L --> P[Instrumented Counting Engine]
    M --> Q[Benchmark Runner]
    N --> R[Comparison Service]
    P --> S[Operation Counters]
    F --> G
```

## Modules

### Extension Host

- `src/extension/extension.ts` - Entry point, activates extension
- `src/extension/commands/index.ts` - Command registration, webview management, message routing
- `src/extension/providers/index.ts` - Tree data provider for Activity Bar explorer
- `src/extension/services/algorithm-service.ts` - Algorithm data service
- `src/extension/services/program-storage.ts` - Program files, test cases and execution history (VS Code storage APIs)
- `src/extension/playground/message-handler.ts` - Phase 5 message router between the webview and the core services
- `src/extension/practice/message-handler.ts` - Phase 6 message router for the practice centre

### Core Engine

- `src/core/algorithms/` - Algorithm definitions, registry, types
- `src/core/code-data/` - Reviewed C implementations and line-by-line explanations
- `src/core/complexity/` - Complexity analysis (analyzer, benchmarking, comparison, counters, explanations, input, learning, reports, space)
  - `counters/engine/` - Instrumented algorithm implementations and counting conventions
- `src/core/compiler/` - Compiler detection, configuration, GCC compilation and diagnostic parsing
- `src/core/execution/` - Local program execution (process manager, sessions, configuration)
- `src/core/debugging/` - GDB machine-interface adapter, debugger service, variable inspector
- `src/core/tracing/` - Source mapping and execution tracing
- `src/core/testing/` - Test case registry, test runner, output comparison
- `src/core/playground/` - Playground service, templates, reference implementations, shared types
- `src/core/practice/` - Practice centre facade, question bank service, shared types
- `src/core/questions/` - Question registry, answer evaluation, the curated question bank
- `src/core/quizzes/` - Quiz engine and scoring
- `src/core/challenges/` - Challenge registry, evaluator and the challenge bank
- `src/core/assessments/` - One assessment result model for every assessment type
- `src/core/practicals/` - Practical exercises, mock examinations, viva questions
- `src/core/progress/` - Topic progress, performance analysis, revision recommendations
- `src/core/achievements/` - Achievement catalogue and service
- `src/core/bookmarks/` - Bookmark and revision list service
- `src/core/storage/` - Learning data store and data migration
- `src/core/visualization/` - Visualization engine and trace generators
  - `types/` - ExecutionStep, AlgorithmTrace, VisualizationState, VisualizationConfig
  - `engine/` - VisualizationEngine, ExecutionController, StepManager, PlaybackController
  - `generators/` - Algorithm-specific trace generators (sorting, searching)
- `src/core/types/` - Core type definitions

### Shared

- `src/shared/types/` - Shared TypeScript interfaces
- `src/shared/constants/` - Extension constants, categories, messages
- `src/shared/utils/` - Filtering, searching, formatting utilities

### Webview

- `src/webview/App.tsx` - Main React application with view routing (dashboard, library, detail, visualizer, analyzer, performance, comparison, playground)
- `src/webview/pages/` - Dashboard, AlgorithmLibrary, AlgorithmDetail, AlgorithmVisualizer, ComplexityAnalyzerPage, PerformanceLabPage, AlgorithmComparisonPage, CodePlaygroundPage, PracticePage, QuizPage, CodingChallengesPage, PracticalPreparationPage, LearningProgressPage
- `src/webview/components/` - Reusable UI components (cards, stats, search)
- `src/webview/components/visualization/` - Visualization components (ArrayRenderer, InputEditor, PlaybackControls, StepTimeline, ExecutionExplanation, VariableInspector, ComplexityIndicator)
- `src/webview/components/complexity/` - Complexity components (operation metrics, growth charts, space panel, comparison table, report preview, learning module)
- `src/webview/components/playground/` - Code editor, toolbar, console, input panel, compiler status, diagnostics
- `src/webview/components/debugging/` - Debug controls, variable inspector, call stack
- `src/webview/components/execution/` - Execution trace and live array visualisation
- `src/webview/components/testing/` - Test case manager and test results
- `src/webview/components/practice/` - Practice centre dashboard
- `src/webview/components/quizzes/` - Quiz workspace, question card, timer, navigator, result
- `src/webview/components/challenges/` - Challenge explorer with the Phase 5 editor
- `src/webview/components/practicals/` - Practical preparation, mock exams, viva practice
- `src/webview/components/progress/` - Learning progress dashboard
- `src/webview/hooks/` - useVisualization, usePlayback
- `src/webview/types/` - Webview message types
- `src/webview/utils/` - postMessage communication wrapper

## Data Flow

### Phase 1 (Algorithm Information)

1. User activates extension via command palette (`daa-companion.openDashboard`)
2. Extension host creates webview panel and loads `dist/webview.js`
3. Webview app mounts and requests algorithms via `postMessage({ type: 'GET_ALGORITHMS' })`
4. Extension host responds with `ALGORITHMS_DATA` containing algorithm list
5. User selects an algorithm → webview requests detail via `GET_ALGORITHM_DETAIL`
6. Extension host responds with `ALGORITHM_DETAIL` containing full algorithm data

### Phase 2 (Visualization)

1. User clicks "Visualize Algorithm" on an algorithm detail page
2. Webview routes to `AlgorithmVisualizer` page
3. `useVisualization` hook calls `visualizationEngine.generateTrace(algorithmId, input, config)`
4. The trace generator produces a deterministic `AlgorithmTrace` with `ExecutionStep[]`
5. User controls playback via `PlaybackControls` (play, pause, next, previous, jump)
6. Each step renders the array state via `ArrayRenderer`, explanation via `ExecutionExplanation`, variables via `VariableInspector`, and counters via `ComplexityIndicator`
7. Pseudocode highlighting synchronizes with `currentStep.lineNumber`

### Phase 4 (Complexity Analyzer & Performance Lab)

1. User opens an algorithm's detail page and clicks "Analyze Complexity" or "Performance Lab"
2. The webview routes to `ComplexityAnalyzerPage` / `PerformanceLabPage`
3. The instrumented engine (`src/core/complexity/counters/engine/`) executes the algorithm on a deterministic dataset and returns operation counters
4. `BenchmarkRunner` runs warm-up runs plus repeated timed trials on the identical dataset, yielding to the event loop between trials
5. `ComparisonService` runs the selected algorithms on the same dataset and validates the outputs before showing a comparison table
6. `ComplexityReportGenerator` builds a report; `ReportExporter` sends it to the extension host via `EXPORT_REPORT`, which shows a save dialog

All Phase 4 computation runs in the renderer, so the extension host is never blocked.

## Data Classification (Phase 4)

Phase 4 never merges the following classes of numbers:

| Class | Meaning |
|-------|---------|
| THEORETICAL | Reviewed Big-O metadata and derivations |
| INSTRUMENTED | Operation counts from the instrumented engine |
| ESTIMATED | Model-based byte/stack approximations |
| MEASURED | Timings recorded during an actual benchmark run |

Benchmark timings describe the instrumented TypeScript execution in the renderer — never native C compiler output.

### Phase 5 (Code Execution, Compiler & Debugging Lab)

1. The webview sends `COMPILE_PROGRAM` / `RUN_PROGRAM` with the source, the stdin and the execution configuration
2. The extension host compiles the program with the detected GCC toolchain in a unique temporary directory
3. Compiler diagnostics are parsed, explained and returned to the webview
4. On a successful compilation the program is started without a shell, the stdin is written and stdout/stderr are captured with an output cap
5. The result (status, exit code, duration, output) travels back to the console
6. `START_DEBUGGING` compiles the program again with debug symbols and starts a GDB machine-interface session; breakpoints are installed from the editor gutter
7. Every stop reports the current line, the variables of the frame and the call stack; the array of the program is rendered with the Phase 2 `ArrayRenderer`
8. `RUN_TESTS` compiles once and runs every test case against the same binary

All process work happens in the extension host, so the renderer is never blocked.

### Phase 6 (Practice, Assessment & Learning Progress)

1. The webview asks the host for the practice overview; the host answers with the sizes of the bundled question bank, challenges, practicals and viva questions
2. `START_QUIZ` builds the quiz in the host (deterministic for a seed) and stores the attempt as *in progress*
3. `ANSWER_QUIZ` stores the answer; the learning mode judges it immediately, the test mode only at the submission
4. `SUBMIT_QUIZ` judges every answer, calculates the transparent score and stores the attempt
5. `SUBMIT_CHALLENGE` compiles the submitted C program with the Phase 5 compiler, runs it against the sample, practice and hidden test cases with the Phase 5 process manager and reports the result
6. The progress dashboard is computed from the stored attempts — the statistics, the topic performance, the recommendations and the achievements are derived, never entered by hand

## Trace Generation (No Arbitrary Code Execution)

The visualization engine does NOT execute arbitrary source code. Algorithm-specific TypeScript generators produce structured execution traces. Each `ExecutionStep` contains:

- `id`, `description`, `operation`, `lineNumber`
- `currentState` (array/graph/matrix/tree + variables)
- `highlightedElements`, `comparedElements`, `swappedElements`, `updatedElements`
- `explanation` (human-readable)
- `complexity` counters (operations, comparisons, swaps, iterations)

## Extension Commands

| Command | Title |
|---------|-------|
| `daa-companion.openDashboard` | DAA Companion: Open Dashboard |
| `daa-companion.openAlgorithmLibrary` | DAA Companion: Algorithm Library |

## Views

| View ID | Name | Container |
|---------|------|-----------|
| `daa-companion.explorer` | Algorithm Explorer | `daa-companion` activity bar |

## Supported Visualizations (Phase 2)

**Sorting:** Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort

**Searching:** Linear Search, Binary Search

**Planned:** Graph (BFS, DFS, Dijkstra), Matrix (DP), Greedy (Knapsack, Activity Selection)
