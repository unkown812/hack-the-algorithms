# Roadmap

## Phase 1: Project Initialization, Architecture & Algorithm Library (Complete)

- [x] Project initialization and development environment
- [x] VS Code extension architecture (host + webview)
- [x] Interactive dashboard UI
- [x] Algorithm library and information management
- [x] Initial algorithm library (Binary Search)
- [x] Unit tests for algorithm registry
- [x] CI/CD pipeline

## Phase 2: Interactive Algorithm Visualization & Step-by-Step Execution (Complete)

- [x] Reusable visualization engine (VisualizationEngine, ExecutionController, StepManager)
- [x] Deterministic execution trace system (ExecutionStep, AlgorithmTrace)
- [x] Interactive playback controller (play, pause, next, previous, restart, jump, speed)
- [x] Sorting algorithm visualizations (Bubble, Selection, Insertion, Merge, Quick Sort)
- [x] Searching algorithm visualizations (Linear Search, Binary Search)
- [x] Array renderer (SVG bar visualization with state highlighting)
- [x] Input configuration playground (manual, random, example inputs)
- [x] Pseudocode synchronization with execution
- [x] Execution explanation panel
- [x] Variable inspector
- [x] Complexity indicators (observed operations vs theoretical)
- [x] Input validation
- [x] Automated tests (trace correctness, playback, engine)
- [x] Integration with Phase 1 algorithm detail pages

## Phase 3: C Code Reference & Code Explanations

- [x] Reviewed C implementations for every algorithm (`src/core/code-data/`)
- [x] Line-by-line code explanations for the sorting and searching algorithms
- [x] C code learning components in the webview

## Phase 4: Complexity Analyzer & Performance Lab (Complete)

- [x] Theoretical complexity analyzer with reviewed derivations, assumptions and code sections
- [x] Deterministic instrumented operation-counting engine (mirrors the C implementations statement for statement)
- [x] Documented counting conventions per algorithm
- [x] Input-size testing lab with seeded, reproducible datasets and per-algorithm input limits
- [x] Empirical benchmarking (warm-up runs, repeated trials, identical dataset, validation, cancellation, timeouts)
- [x] Growth visualisation (measured counts per input size, logarithmic scale)
- [x] Algorithm comparison lab (same dataset, validated outputs, cross-family caveats)
- [x] Explanation engine connecting counted numbers to the theory
- [x] Complexity reports in Markdown, CSV and JSON with methodology and data-classification labels
- [x] Learning content: 12 time-complexity topics, 6 space topics, notation reference
- [x] Unit tests for every Phase 4 module

## Phase 5: Practice & Assessment

- [ ] Interactive quizzes and assessments
- [ ] DAA practical preparation mode
- [ ] Learning progress tracking
- [ ] C++, Python, and Java language support

## Phase 6: Polish & Distribution

- [ ] VS Code Marketplace publication
- [ ] Performance optimization (Web Workers for large inputs)
- [ ] Accessibility improvements
- [ ] Internationalization
