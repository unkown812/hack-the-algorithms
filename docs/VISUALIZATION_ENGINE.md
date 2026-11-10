# Visualization Engine

## Overview

The DAA Learning Companion visualization engine (Phase 2) transforms theoretical algorithm explanations into interactive, step-by-step visual learning experiences. It is a deterministic, offline-first system that generates structured execution traces without executing arbitrary source code.

## Architecture

### Core Components

| Module | File | Responsibility |
|--------|------|---------------|
| VisualizationEngine | `src/core/visualization/engine/VisualizationEngine.ts` | Central registry of trace generators; validates input and produces traces |
| TraceGenerator | `src/core/visualization/engine/VisualizationEngine.ts` | Interface for algorithm-specific trace generation |
| StepManager | `src/core/visualization/engine/StepManager.ts` | Step navigation (next, previous, jump, beginning, end) |
| ExecutionController | `src/core/visualization/engine/ExecutionController.ts` | Playback control (play, pause, resume, speed, events) |
| PlaybackController | `src/core/visualization/engine/PlaybackController.ts` | Playback state configuration |

### Trace Generators

| Category | Algorithm | File |
|----------|-----------|------|
| Sorting | Bubble Sort | `src/core/visualization/generators/sorting/bubble-sort.ts` |
| Sorting | Selection Sort | `src/core/visualization/generators/sorting/selection-sort.ts` |
| Sorting | Insertion Sort | `src/core/visualization/generators/sorting/insertion-sort.ts` |
| Sorting | Merge Sort | `src/core/visualization/generators/sorting/merge-sort.ts` |
| Sorting | Quick Sort | `src/core/visualization/generators/sorting/quick-sort.ts` |
| Searching | Linear Search | `src/core/visualization/generators/searching/linear-search.ts` |
| Searching | Binary Search | `src/core/visualization/generators/searching/binary-search.ts` |

## Key Design Principles

1. **No arbitrary code execution**: Trace generators are pure TypeScript functions that simulate algorithm execution step by step. No `eval`, no `Function`, no user-submitted code execution.

2. **Deterministic traces**: Given the same input, a generator always produces the same sequence of steps. This enables reliable playback and navigation.

3. **Separation of concerns**: Trace generation (core, pure TS) is completely separate from rendering (React webview).

4. **Operation counting**: Comparisons, swaps, operations, and iterations are counted from actual algorithm steps, not animation frames.

5. **Human-readable explanations**: Every step includes a beginner-friendly explanation of what is happening and why.

## Core Types

### ExecutionStep

Represents a single operation in an algorithm's execution:

- `id` - Step number
- `description` - Short operation description
- `operation` - Operation type (init, compare, swap, shift, divide, merge, partition, found, not-found, etc.)
- `lineNumber` - Corresponding pseudocode line (for highlighting)
- `currentState` - Full visualization state (array values, element styles, variables)
- `highlightedElements` / `comparedElements` / `swappedElements` / `updatedElements` - Element indices affected
- `explanation` - Human-readable explanation
- `complexity` - Cumulative operation counters at this step

### AlgorithmTrace

Complete execution record:

- `algorithmId`, `algorithmName`, `category`
- `input` - Original input
- `steps` - All execution steps
- `initialState`, `finalState` - Before and after states
- `totalOperations`, `totalComparisons`, `totalSwaps` - Cumulative counters
- `status` - completed or failed

## Visual States

Array element states: `default`, `active`, `comparing`, `selected`, `swapping`, `updated`, `sorted`, `found`, `eliminated`.

## Usage

```typescript
import { visualizationEngine } from './src/core/visualization/generators';

const result = visualizationEngine.generateTrace('bubble-sort', [64, 34, 25, 12, 22, 11, 90]);
if (result.trace) {
  const step = result.trace.steps[0];
  console.log(step.explanation);
  console.log(step.complexity.comparisons);
}
```

## Webview Integration

The `AlgorithmVisualizer` page provides the complete interactive workspace:

- **Input Configuration**: Manual entry, random generation, predefined examples
- **Visualization Canvas**: SVG array bars with state-based coloring
- **Playback Controls**: Play, pause, next, previous, restart, jump to beginning/end, speed (0.25x-4x)
- **Step Timeline**: Clickable step navigation
- **Execution Explanation**: Human-readable description of current operation
- **Variable Inspector**: Current variable values
- **Complexity Indicator**: Observed operation counters vs theoretical Big-O
- **Pseudocode Panel**: Line-highlighted pseudocode synchronized with execution

## Testing

Trace generators are independently testable. Tests verify:
- Sorting produces correctly sorted arrays
- Searching returns correct index or not-found
- Traces are deterministic
- Step counters (comparisons, swaps, operations) are accurate
- Invalid input is handled with meaningful errors
- StepManager navigation and ExecutionController playback work correctly

Run tests: `npm test`
