# Change Log

All notable changes to the "hack-the-algorithms" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.5.0] - 2026-11-11

### Added

- **Phase 7 — AI Learning Assistant & Personalized DAA Tutor**
  - Provider-independent AI service layer with three providers: an offline local knowledge base (default, no key needed), OpenAI and Gemini; new providers can be added without touching the assistant
  - Conversational learning interface with conversation history, new/clear/delete conversations, suggested prompts, follow-up chips, copy response, stop generation, markdown rendering with code blocks and source references
  - Seven explanation modes — beginner, detailed, step-by-step, exam preparation, practical, interview and visual learning — switchable mid-conversation
  - Algorithm tutor grounded in the verified algorithm registry: theory, pseudocode, C implementation, complexity, applications, common mistakes and follow-up questions
  - Code explainer with seven editor context-menu commands: Explain Selected Code, Explain This Function, Generate Pseudocode, Find Potential Bugs, Suggest Improvements, Explain Complexity, Generate Documentation
  - Debugging assistant that explains the real compiler diagnostics and execution results of Phase 5 instead of inventing them
  - Complexity tutor that interprets the Phase 4 results and keeps theoretical classes, instrumented counts and measured times apart
  - Visualization assistant that explains the current Phase 2 trace step and translates natural playback requests into the existing visualization controls without ever modifying the trace
  - Practical and viva assistant built on the Phase 3 practicals and the Phase 6 viva bank
  - Practice question generator that surfaces verified question-bank questions and validates structure before display; generated content is never silently merged into the verified bank
  - Personalized learning advisor with explainable recommendations and a prerequisite roadmap based on actual Phase 6 progress data
  - Local keyword retrieval over the bundled verified corpus (registry, complexity topics, practicals, viva questions, question bank, templates), independent of the provider
  - Response validator that flags fabricated compilation, execution or measurement claims before the answer is shown
  - Secure credential storage in VS Code SecretStorage; API keys never reach the webview, settings, logs or workspace files
  - Explicit consent gate: user-selected context (code, execution results, diagnostics, progress) is withheld from external providers unless allowed in the settings
  - Connection test, configurable model, temperature, max tokens, timeout, context budgets; clear error messages for invalid keys, rate limits, network failures and timeouts
  - New Activity Bar command and dashboard entry for the AI assistant; the extension stays fully usable without any AI configuration

## [0.4.0] - 2026-11-10

### Added

- **Phase 6 — Practice, Assessment & Learning Progress**
  - Practice Centre with quick practice, topic-wise practice, coding challenges, practical preparation and the progress dashboard — reachable from the dashboard, the Activity Bar and the command palette
  - Curated question bank with 79 verified questions in ten categories, every question type (mcq, multiple-select, true-false, fill-blank, code output, find-the-error, complexity, short answer) and a plain-language explanation
  - MCQ practice in learning, test and revision mode; timed quizzes with a question navigator, a countdown and an unfinished session that can be resumed
  - Transparent scoring rules with optional negative marking — no negative marking by default
  - Code output prediction exercises whose answers were produced by compiling and running the snippets
  - Find-the-error exercises with the erroneous line and the corrected implementation
  - Complexity analysis challenges that connect to the Phase 4 Complexity Analyzer
  - Coding challenge platform with 23 problems, built on the Phase 5 editor, compiler and execution service
  - Automated test-case evaluation with public sample and practice tests plus protected hidden evaluation tests; a solution is only accepted when every test passes
  - DAA practical preparation: the ten Phase 3 practicals in the full university-paper structure, with guided, independent and mock-examination modes
  - Viva practice with 27 questions, expected answers and a self assessment
  - Learning progress dashboard with statistics, topic-wise performance, frequently incorrect questions and achievements
  - Rule-based revision recommendations that always state their reason
  - Bookmarks and revision lists for questions, challenges and algorithms
  - Local, versioned and migratable progress persistence with export, import and reset
  - New Activity Bar entry and command for the practice centre

### Fixed

- The quiz attempt was not stored when a quiz started, so the result could not be submitted

## [0.3.0] - 2026-11-10

### Added

- **Phase 5 — Code Execution, Compiler & Debugging Lab**
  - Code Playground with a C editor (line numbers, breakpoint gutter, syntax highlighting, current execution line) and eight starter templates
  - Real local GCC detection: toolchain lookup per platform, version readout and a compile-and-run smoke test that verifies the toolchain before it is used
  - Compilation service with C99/C11/C17, `-O0`/`-O1`/`-O2`, warning level and debug symbols; dangerous compiler flags and shell metacharacters in custom arguments are refused
  - Educational compiler diagnostics: every message is categorised, explained in plain language and shown with the offending source line and a concrete suggestion
  - Local execution engine: real stdin, separate stdout/stderr capture, output caps, timeouts, cancellation, process-tree cleanup and a precise status (`success`, `compile-error`, `runtime-error`, `timeout`, `cancelled`)
  - Interactive console with the program output, the error output, the exit code, the duration and the exact command line that ran
  - Standard input panel with reusable input presets
  - Debugger integration over the GDB machine interface: breakpoints from the gutter, continue, step over / into / out, variable inspector with expandable arrays and a call stack panel
  - Execution tracing that maps the real execution to the source, including the live array contents rendered with the Phase 2 visualizer
  - Source-derived operation counters for the supported algorithms, marked unreliable when the source cannot be mapped — never fabricated
  - Test case management with exact, whitespace-normalised and numeric-tolerance comparison modes
  - Reference implementation comparison for all seven algorithms (the insertion sort, merge sort and quick sort code modules were completed in this phase)
  - Saved programs as `.c` files in the workspace, workspace test cases and a global execution history that can be cleared
  - Security controls: no shell, unique temporary working directories, minimal environment, output caps, argument validation and an honest documentation of the limits of a timeout

## [0.2.0] - 2026-11-10

### Added

- **Phase 4 — Complexity Analyzer & Performance Lab**
  - Theoretical complexity analyzer with reviewed derivations, assumptions and matching code sections
  - Deterministic instrumented operation-counting engine that mirrors the C implementations statement for statement (no counts are estimated from Big-O)
  - Documented counting conventions per algorithm, shown in the UI and included in every report
  - Space analysis that keeps theoretical, estimated and measured values separate
  - Performance lab with warm-up runs, repeated trials on the identical dataset, output validation, cancellation, timeouts and per-algorithm input limits
  - Growth visualisation of measured operation counts with an optional logarithmic scale
  - Algorithm comparison lab that runs every algorithm on one dataset, validates the outputs and refuses to present different problem families as comparable
  - Explanation engine that connects counted numbers and timings to the theory
  - Complexity report export as Markdown, CSV and JSON with methodology and data-classification labels (saved through a native VS Code dialog)
  - Learning content: 12 time-complexity topics, 6 space-complexity topics and a notation reference table
  - Unit tests for the counting engine, benchmarking, comparison, input lab, reports and analysis modules

### Fixed

- Quick Sort's space metadata used an invalid nesting level, which broke the detailed complexity view
- Operation counters that do not apply to an algorithm are now displayed as *n/a* instead of a misleading zero

## [0.1.0] - 2026-10-01

- Initial release
