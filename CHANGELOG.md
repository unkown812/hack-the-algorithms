# Change Log

All notable changes to the "hack-the-algorithms" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

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
