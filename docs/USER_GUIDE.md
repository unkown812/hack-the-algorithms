# DAA Learning Companion — User Guide

This guide describes what the extension actually implements today.

## 1. Getting started

1. Install the extension from the Marketplace (or the packaged VSIX).
2. Open the **DAA Companion** view from the Activity Bar (the first icon of the
   container) or run the **DAA Companion: Open Dashboard** command.
3. The **Onboarding** entry point — via the command palette or the dashboard quick
   actions — walks through the seven modules of the learning loop.

## 2. Algorithm learning

- **Algorithm Library** — searchable list of reviewed algorithms with theory,
  problem statement, approach, pseudocode and complexity metadata.
- **Visualization** — deterministic execution traces with playback controls
  (play, pause, next/previous step, jump to beginning/end, speed 0.25x–4x).
- **Code Playground** — write, compile and run your own C implementation with the
  local GCC toolchain; debug with GDB; run test cases; compare against reference
  implementations.

## 3. Complexity analysis

- Theoretical Big-O classes with derivations, instrumented operation counts,
  space analysis, benchmarks, comparisons and reports (Markdown/CSV/JSON export).

## 4. Practice and assessment

- Practice Centre: quizzes, coding challenges, practicals, viva preparation,
  mock exams, achievements and learning progress.
- Generated questions become drafts and require explicit approval before they can
  enter a quiz.

## 5. AI Assistant

- Available offline through the bundled learning resources, or through OpenAI, Gemini
  or a local model server.
- Context is attached explicitly and disclosed; external providers receive user
  context only with consent.
- Modes: beginner, detailed, step-by-step, exam preparation, practical, interview,
  visual learning.

## 6. Privacy and limits

- Execution timeouts are not a process sandbox.
- AI answers are generated, not measured; complexity measurements come from the
  deterministic analyzers.
