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

## Phase 5: Code Execution, Compiler & Debugging Lab (Complete)

- [x] Integrated C code editor with line numbers, breakpoint gutter and C syntax highlighting
- [x] Local GCC detection with version readout and a real compile-and-run smoke test
- [x] Compilation service with C standard, optimization, warning level and debug symbol options
- [x] Educational compiler diagnostics with plain-language explanations and source locations
- [x] Local program execution engine with stdin, stdout/stderr capture, output caps, timeouts and cancellation
- [x] Interactive console showing output, errors, exit code, duration and the executed command line
- [x] Standard input panel with reusable input presets
- [x] GDB (machine interface) integration: breakpoints, continue, step over / into / out, stop
- [x] Variable inspector with types and expandable arrays, plus a call stack panel
- [x] Real execution tracing (source line, variables, live array) bridged to the Phase 2 visualizer
- [x] Source-derived operation counters for the supported algorithms, marked unreliable when the source cannot be mapped
- [x] Test case management with exact, whitespace-normalised and numeric comparison modes
- [x] Reference implementation comparison for all seven algorithms
- [x] Eight starter C templates
- [x] Saved programs as workspace files, workspace test cases, global execution history
- [x] Execution security controls: no shell, temporary working directories, output caps, process tree cleanup, argument validation
- [x] Unit tests for the compiler, execution, debugging, tracing, testing and playground layers

## Phase 6: Practice, Assessment & Learning Progress (Complete)

- [x] Practice Centre with quick practice, topic-wise practice, coding challenges, practical preparation and the progress dashboard
- [x] Centralized question bank: 79 curated questions in ten categories with a verified explanation for every answer
- [x] MCQ practice with learning, test and revision mode
- [x] Timed quizzes with a question navigator, a countdown and an unfinished session that can be resumed
- [x] Transparent scoring rules with optional negative marking
- [x] Code output prediction exercises (the snippets are executed and verified by the test suite)
- [x] Find-the-error exercises with the corrected implementation
- [x] Complexity analysis challenges that connect to the Phase 4 Complexity Analyzer
- [x] Coding challenge platform with 23 problems and the Phase 5 editor and execution service
- [x] Automated test-case evaluation with public practice tests and hidden evaluation tests
- [x] DAA practical preparation: 10 practical papers with the full university structure
- [x] Mock practical examinations with a time limit
- [x] Viva practice with 27 questions and a self assessment
- [x] Assessment engine with one result model for every assessment type
- [x] Learning progress dashboard with topic-wise performance and rule-based weak-topic detection
- [x] Revision recommendations, bookmarks and revision lists
- [x] Achievement system whose criteria are checked against the recorded data
- [x] Local, versioned and migratable progress persistence with export and reset
- [x] Unit tests for the question bank, quizzes, challenges, practicals, progress and the webview

## Phase 7: Practice & Assessment Extensions

- [ ] Interactive quizzes and assessments with a larger question bank
- [ ] DAA practical preparation mode with an exam simulator
- [ ] Learning progress tracking across workspaces
- [ ] C++, Python, and Java language support

## Phase 8: Polish & Distribution

- [ ] VS Code Marketplace publication
- [ ] Performance optimization (Web Workers for large inputs)
- [ ] Accessibility improvements
- [ ] Internationalization
