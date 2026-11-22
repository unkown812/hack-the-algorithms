# Change Log

All notable changes to the "hack-the-algorithms" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- **Phase 8 — unified navigation** — top `AppHeader` navigation for the main modules (Dashboard, Library, Playground, Practice, AI Assistant, Progress) with unit tests

### Fixed

- **Phase 8 — accessibility** — navigation landmark (`role="navigation"`) and `aria-current` on the active entry; explicit `aria-label` on the conversation-delete button

### Changed

- **Phase 8 — performance** — step timeline renders a windowed slice of the trace (30 steps) for large executions, with a range caption; timer cleanups verified

- **Phase 8 — CI/CD workflows** — `test.yml` runs the full local validation pipeline plus VSIX packaging validation; `release.yml` validates and publishes approved releases through the Marketplace.

## [0.6.3] - 2026-11-22

### Added

- **Phase 8 — onboarding experience** — first-run onboarding page with the seven module steps of the learning loop, deep-linkable through a new `DAA Companion: Onboarding` command and a dashboard quick action

## [0.6.2] - 2026-11-22

### Fixed

- **Phase 8 — release readiness (P0)**
  - Webview deep links (Activity Bar practice/AI/library entries and the editor AI commands) are now queued until the webview signals readiness (`DAA_WEBVIEW_READY`) instead of racing the panel startup
  - The `DAA Companion: Algorithm Library` command now opens the library view instead of the dashboard
  - The dashboard theme now follows the VS Code light/dark theme through the `--vscode-*` tokens, with a webview style reset and `color-scheme`
  - The AI/code-explainer editor actions post their `AI_EDITOR_REQUEST` only after the assistant view is ready
  - The webview content security policy now uses a per-load random nonce and allows the local resource roots

### Changed

- The activity category cards of the dashboard navigate to the matching algorithm category instead of being inert

## [0.6.1] - 2026-11-22

### Added

- **Phase 7.2 — completion pass for the AI learning assistant**
  - The AI Learning Assistant is reachable directly from the Activity Bar, next to the Practice Centre
  - Practice tools panel: generate practice questions (topic, difficulty, type, count) and review them before approval, generate viva questions, start a mock practical exam
  - Personalised learning plan with explainable recommendations and a prerequisite roadmap, computed locally from the Phase 6 progress data
  - Regenerate action for the newest answer, alongside copy and stop generation
  - Task-specific follow-up questions under an answer (algorithm, code, complexity, visualization, practical, question generation, learning advice)
  - Inline assistant in the visualizer: explains the current trace step with the step attached as context, and executes playback commands ("next", "previous", "restart", "play", "pause") through the existing controls
  - Context truncation is reported when the attached context exceeds the configured budget
  - Conversation-message, context-character and bundled-resource settings exposed in the assistant settings

### Changed

- The GDB adapter test now uses the platform debugger and compiler instead of a hard-coded Windows path, so the suite runs on Linux and macOS as well

## [0.6.0] - 2026-11-11

### Added

- **Phase 7.1 — streaming, semantic retrieval, local models and the review workflow**
  - Streaming answers: OpenAI and Gemini deliver the answer piece by piece over server-sent events, the local model server over newline-delimited JSON, and the chat renders the text while it arrives
  - The "Stop" button cancels a running request; the streaming can be switched off in the settings
  - Local embedding index for the retrieval: a hashed word and character-trigram vector with inverse-document-frequency weighting, combined with the keyword score into a hybrid ranking — the exact match always wins, and a question that uses other words still finds the right document
  - A local model provider (Ollama compatible) that needs no API key and never sends data off the machine; the installed models are read from the running server and the address is configurable
  - Automatic context binding: the algorithm, the current visualization step, the playground program, the compiler diagnostics, the last run and the complexity analysis are offered as context chips in the assistant — attaching them stays an explicit action
  - Review workflow for generated practice questions: the generated questions are parsed, validated (structure, answer, explanation, duplicates) and presented for approval; only an approved question may be used in a quiz
  - Approved questions extend the verified question bank without changing it — they keep their own store and their own marking
  - The generated questions can be reviewed, rejected with a note and deleted in the assistant

### Changed

- The retrieval now prefers the comprehensive source of an algorithm over a single mention of it
- The provider list in the settings shows whether a provider supports streaming

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
