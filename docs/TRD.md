# Technical Requirements Document (TRD)

## Technology Stack

### Extension Development

- TypeScript
- Visual Studio Code Extension API
- Node.js
- esbuild for bundling
- npm for package management

### User Interface

- React
- TypeScript
- Tailwind CSS (design tokens)
- Lucide React icons (future)

### Visualization

- SVG (array bar rendering via inline SVG)
- Deterministic TypeScript trace generators (no arbitrary code execution)

### Testing

- Vitest for unit testing
- VS Code Extension Test Runner for integration tests

## Architecture

### Extension Host (src/extension/)

- Registers extension commands
- Opens dashboard webview panel
- Manages webview panels and communication
- Reads algorithm resources
- Handles UI ↔ extension communication via postMessage
- Provides algorithm data to webview

### Webview Application (src/webview/)

- React-based dashboard interface
- Algorithm library with search and filtering
- Algorithm information pages with "Visualize Algorithm" action
- Algorithm visualizer workspace (input, canvas, playback, explanation, variables, complexity, pseudocode)
- Communicates with extension via postMessage API

### Core Engine (src/core/)

- Algorithm definitions and registry
- Complexity information
- Execution (stub for future phases)
- **Visualization engine** (Phase 2):
  - Trace generators for sorting and searching algorithms
  - Execution controller (play/pause/step/jump)
  - Step manager (navigation)
  - Deterministic execution trace production

### Shared (src/shared/)

- Types and interfaces
- Constants
- Utility functions

## Communication Protocol

Extension host and webview communicate via `postMessage` with typed payloads:

- `GET_ALGORITHMS` → `ALGORITHMS_DATA`
- `GET_ALGORITHM_DETAIL` → `ALGORITHM_DETAIL`

No Node.js APIs are exposed to the webview. No arbitrary user-submitted code is executed.

## Build Pipeline

1. `esbuild.js` bundles extension (Node, CJS) and webview (Browser, IIFE)
2. Output goes to `dist/`
3. Extension `main` points to `./dist/extension.js`
4. Webview loads `./dist/webview.js`

## Testing Strategy

- Unit tests: Vitest, located in `tests/unit/`
  - Algorithm registry tests
  - Visualization trace generator correctness tests
  - Step manager and execution controller tests
- Integration tests: VS Code Extension Test Runner, located in `tests/integration/`
- Type checking: `tsc --noEmit`
- Linting: ESLint with flat config

## Supported Visualizations (Phase 2)

| Category | Algorithms |
|----------|------------|
| Sorting | Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort |
| Searching | Linear Search, Binary Search |

## Phase 2 Completion Criteria

1. Reusable visualization engine implemented
2. Deterministic execution traces generated
3. Searching algorithm visualizations working
4. Five sorting algorithm visualizations working
5. Playback controls working (play, pause, next, previous, restart, jump)
6. Previous/next step navigation working
7. Pseudocode highlighting synchronized with execution
8. Variables updated during execution
9. Input configuration working
10. Explanation panel displays contextual information
11. Array visualization working
12. Complexity counters reflect actual operations
13. Algorithm outputs validated
14. Automated tests passing
15. Phase 1 functionality intact
