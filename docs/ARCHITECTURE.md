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
- `src/extension/commands/index.ts` - Command registration, webview management
- `src/extension/providers/index.ts` - Tree data provider for Activity Bar explorer
- `src/extension/services/algorithm-service.ts` - Algorithm data service

### Core Engine

- `src/core/algorithms/` - Algorithm definitions, registry, types
- `src/core/code-data/` - Reviewed C implementations and line-by-line explanations
- `src/core/complexity/` - Complexity analysis (analyzer, benchmarking, comparison, counters, explanations, input, learning, reports, space)
  - `counters/engine/` - Instrumented algorithm implementations and counting conventions
- `src/core/execution/` - Code execution (stub)
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

- `src/webview/App.tsx` - Main React application with view routing (dashboard, library, detail, visualizer, analyzer, performance, comparison)
- `src/webview/pages/` - Dashboard, AlgorithmLibrary, AlgorithmDetail, AlgorithmVisualizer, ComplexityAnalyzerPage, PerformanceLabPage, AlgorithmComparisonPage
- `src/webview/components/` - Reusable UI components (cards, stats, search)
- `src/webview/components/visualization/` - Visualization components (ArrayRenderer, InputEditor, PlaybackControls, StepTimeline, ExecutionExplanation, VariableInspector, ComplexityIndicator)
- `src/webview/components/complexity/` - Complexity components (operation metrics, growth charts, space panel, comparison table, report preview, learning module)
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
