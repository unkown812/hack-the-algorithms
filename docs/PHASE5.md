# Phase 5 — Code Execution, Compiler & Debugging Lab

Phase 5 turns the DAA Learning Companion into a real programming environment.
Students write their own C implementation inside the extension, compile it with
a **real local GCC toolchain**, run it, feed it input, read the compiler
diagnostics, debug it with a **real GDB session** and compare their result
with the reviewed reference implementation.

**Core principle:** everything is executed for real. The extension never
simulates a compilation, never fabricates a debugger answer and never claims
that a program ran when it did not.

---

## 1. Architecture

The Phase 4 analyzer ran in the webview. Phase 5 cannot: compiling and running
a program needs processes, files and pipes. The split is therefore:

```
┌──────────────────────── webview (renderer) ────────────────────────┐
│ CodePlaygroundPage                                                │
│  ├─ CodeEditor        (line numbers, breakpoint gutter, C syntax)  │
│  ├─ ExecutionToolbar  (compile · run · stop · debug)              │
│  ├─ ConsolePanel      (stdout / stderr / status / command line)   │
│  ├─ InputPanel        (stdin + presets)                           │
│  ├─ DiagnosticsPanel  (compiler messages + explanations)          │
│  ├─ DebugControls     (continue · step over/in/out)               │
│  ├─ VariableInspector · CallStackPanel · ExecutionTracePanel      │
│  └─ TestCaseManager   · TestResultsPanel                          │
└───────────────▲────────────────────────────────┬───────────────────┘
                │ postMessage (request / response)│
┌───────────────┴────────────────────────────────▼───────────────────┐
│ extension host                                                    │
│  PlaygroundMessageHandler  ← message router                       │
│  PlaygroundService         ← orchestration                        │
│  ├─ CompilerDetector / GCCCompiler / CompilerDiagnostics           │
│  ├─ ExecutionService / ProcessManager / ExecutionSession           │
│  ├─ DebuggerService / GDBAdapter / VariableInspector               │
│  ├─ TestRunner / OutputComparator / TestCaseRegistry               │
│  └─ ExecutionTracer / SourceMapper                                 │
│  VSCodeProgramStorage  ← workspace files + workspace/global state │
└────────────────────────────────────────────────────────────────────┘
```

The webview never imports `node:*`, `child_process` or `vscode` — the browser
bundle is verified to be free of them (`dist/webview.js`).

---

## 2. Compiler detection and configuration

`CompilerDetector` looks for a GCC-compatible toolchain:

| Platform | Searched locations |
|----------|--------------------|
| Windows | `C:\mingw64\bin`, `C:\msys64\{mingw64,ucrt64,clang64}\bin`, `C:\TDM-GCC-64\bin`, `C:\Strawberry\c\bin`, Chocolatey, Cygwin, plus a `where gcc` lookup |
| macOS | `/usr/bin/gcc`, `/usr/local/bin/gcc`, `/opt/homebrew/bin/gcc` |
| Linux | `/usr/bin/gcc`, `/usr/local/bin/gcc`, `/bin/gcc`, `/usr/bin/cc` |

The detection is honest about its state:

1. the executable is located,
2. `gcc --version` is read,
3. a **smoke test** compiles and runs a tiny program — only a toolchain that
   really works is reported as *verified*.

If no compiler is found the panel explains how to install one (MSYS2 on
Windows, Xcode CLT on macOS, `build-essential` on Linux) and every
compile/run button stays disabled. The extension never falls back to an
online compiler.

**Configuration** (per session): C standard (`c99` / `c11` / `c17`),
optimization (`O0` / `O1` / `O2`), warning level (`-Wall`, optional
`-Wextra`), debug symbols (`-g`) and extra arguments. The educational
defaults are **C11, `-O0`, warnings on, debug symbols on**.

Extra arguments are validated. `-o`, `-wrapper`, `-specs=`, `-fplugin`, `-B`
and `@file` responses are rejected, as are shell metacharacters. The command
line is always built as an argument array and executed **without a shell**.

---

## 3. Compilation and diagnostics

`GCCCompiler` writes the source into a unique temporary directory, compiles it
and returns the diagnostics. `CompilerDiagnostics` parses the GCC output into
structured records:

| Category | Typical message |
|----------|-----------------|
| `missing-semicolon` | `expected ',' or ';' before 'return'` |
| `missing-header` | `fatal error: stdio.h: No such file or directory` |
| `undeclared-variable` | `'x' undeclared (first use in this function)` |
| `function-declaration` | `implicit declaration of function 'foo'` |
| `type-mismatch` | `incompatible types when initializing type 'int *'` |
| `linker-error` | `undefined reference to 'foo'` |
| `invalid-expression` | `expected expression before ')'` |
| `warning` | `unused variable 'x' [-Wunused-variable]` |

Every diagnostic carries the file, line, column (when GCC reports one), the
raw message, the offending **source line**, a beginner friendly explanation
and a concrete suggestion. The extension never modifies the student's code.

---

## 4. Execution engine

`ProcessManager` runs the compiled program:

- the program starts **without a shell**, in its own temporary directory,
- the configured stdin is written and closed, so programs that read once or
  many times both work,
- stdout and stderr are captured separately and **capped** (default 256 KiB,
  hard limit 4 MiB) — the console reports truncation instead of silently
  dropping data,
- the run is stopped after the configured timeout (default 5 s, max 60 s),
- cancelling stops the program and the whole process tree,
- only a small, explicit set of environment variables is passed on
  (`PATH`, `SystemRoot`, `HOME`, `TMPDIR`, …) plus `LC_ALL=C` for
  reproducible number formatting.

The result distinguishes every outcome:

| Status | Meaning |
|--------|---------|
| `success` | The program ran and exited with code 0 — **an empty output is still a success** |
| `compile-error` | The compilation failed; the program was never executed |
| `runtime-error` | The program ran and exited with a non-zero code |
| `timeout` | The program exceeded the time limit and was terminated |
| `cancelled` | The student stopped the program |

---

## 5. Debugger integration

`DebuggerService` drives **GDB in machine-interface mode**
(`gdb --interpreter=mi2`). The MI parser (`GDBAdapter`) understands result,
notify and console-stream records.

Supported controls: start, continue, step over, step into, step out, restart and
stop. GDB's machine interface cannot pause a running program on demand in a
portable way, so no pause button is offered rather than a button that does
nothing.

Breakpoints are set by clicking a line number in the editor gutter and are
installed with `-break-insert <file>:<line>`.

At every stop the extension asks GDB for:

- the current frame (function, file, line),
- the variables of the frame (`-stack-list-variables`), each with its real
  type and, for aggregates, their children (`-var-list-children --all-values`),
- the call stack (`-stack-list-frames`).

When no GDB is installed the debugger panel states that clearly and the
debugging controls are disabled — the compiler, the runner, the tests and the
source tracing keep working.

---

## 6. Execution tracing

GDB reports *where* the program is, not *what kind of operation* it performed.
`SourceMapper` therefore analyses the student's source text and classifies
each line:

- the comparison line of the algorithm (`if (arr[j] > arr[j + 1])`),
- the exchange block (`int temp = arr[j]; arr[j] = arr[j+1]; …`) — consecutive
  statements are merged so one exchange is counted **once**,
- the innermost loop header (outer loops are not counted twice).

Comments and string literals are stripped before matching, so a commented-out
statement never influences the counters.

Every trace event carries the source line, the function, the variables of the
frame and — when the program works on a numeric array — the live array
contents, which are rendered with the **Phase 2 `ArrayRenderer`**.

When the source cannot be mapped onto the algorithm, the counters are marked
*not reliable* and the panel says so. The extension never invents operation
counts.

---

## 7. Test cases

`TestCaseRegistry` stores the test cases of a program; `TestRunner` compiles
the program once and runs every test against the same binary.

Comparison modes:

| Mode | Behaviour |
|------|-----------|
| `exact` | The output must match byte for byte |
| `normalized` | Whitespace runs are collapsed before comparing |
| `numeric` | Numbers are compared with a configurable tolerance |

Differences are never normalised away silently — the results panel shows the
expected output, the actual output and the differing lines.

---

## 8. Reference implementation comparison

The Phase 3 code library is registered in
`src/core/playground/referenceImplementations.ts` for all seven algorithms
(the three missing modules — insertion sort, merge sort and quick sort — were
added in this phase).

The Reference tab shows the reviewed C code, the pseudocode, the logic blocks
and the complexity metadata side by side. The panel states explicitly that
sharing an algorithm name does not make two implementations equivalent: only
the test cases prove that.

---

## 9. Storage and history

| Data | Location | Reason |
|------|----------|--------|
| Program sources | `.daa-playground/programs/<id>.c` in the workspace (or the extension's global storage folder when no folder is open) | Source code never goes into extension state |
| Test cases | `workspaceState` | Small, workspace specific metadata |
| Program index | `workspaceState` | Names and paths only |
| Execution history | `globalState` (max 50 entries) | Lightweight metadata: input, output, exit status, duration, compiler version |

The history stores nothing else — no environment variables, no unrelated file
system information. It can be cleared from the UI.

---

## 10. Security model

Student programs are treated as untrusted input.

| Protection | Implementation |
|------------|----------------|
| No shell | `spawn(executable, args, { shell: false })` |
| No elevated privileges | The program runs as the current user; the extension never elevates |
| Unique working directory | A fresh temporary directory per compilation and run |
| Time limit | The run is terminated after the configured timeout |
| Output limits | stdout/stderr are capped; truncation is reported |
| Process tree cleanup | POSIX: process group kill; Windows: `taskkill /T /F` |
| Temporary file cleanup | Directories are removed when the session ends |
| Argument validation | Dangerous compiler flags and shell metacharacters are refused |
| Minimal environment | Only a fixed list of environment variables is passed on |

**Known limitation — a timeout is not a sandbox.** A C program can still read
files, create processes or interact with the operating system with the rights
of the current user. The extension documents this on the playground page.
Stronger isolation (containers, WSL, restricted accounts) has to be arranged
by the student or the institution; the extension does not pretend to provide
it.

The extension never executes a program automatically — nothing runs when a
project or a file is opened.

---

## 11. Message protocol

| Message | Direction | Purpose |
|---------|-----------|---------|
| `GET_COMPILER_STATUS` / `REFRESH_COMPILER` | webview → host | Compiler and debugger status |
| `UPDATE_COMPILER_CONFIG` | webview → host | Store the compiler configuration |
| `COMPILE_PROGRAM` | webview → host | Compile without running |
| `RUN_PROGRAM` / `STOP_PROGRAM` | webview → host | Execute and stop a program |
| `RUN_TESTS` | webview → host | Run the test cases |
| `SAVE_PROGRAM` / `LOAD_PROGRAM` / `OPEN_PROGRAM_FILE` / `DELETE_PROGRAM` / `LIST_PROGRAMS` | webview → host | Program storage |
| `SAVE_TEST_CASES` / `LOAD_TEST_CASES` | webview → host | Test case storage |
| `GET_HISTORY` / `CLEAR_HISTORY` | webview → host | Execution history |
| `START_DEBUGGING` / `DEBUG_ACTION` / `STOP_DEBUGGING` / `GET_DEBUG_STATE` | webview → host | Debugger control |
| `COMPILER_STATUS`, `COMPILE_RESULT`, `EXECUTION_RESULT`, `TEST_RESULT`, `PROGRAM_SAVED`, `PROGRAMS_LIST`, `TEST_CASES_LOADED`, `HISTORY_LOADED`, `DEBUG_STATE_CHANGED`, `TRACE_EVENT_RECEIVED` | host → webview | Results and state |

---

## 12. The editor

The playground editor is a focused editor built for debugging:

- line numbers with a **breakpoint gutter** (click a number to toggle),
- **C syntax highlighting** (keywords, types, numbers, strings, characters,
  comments and preprocessor lines) implemented with a small tokenizer — no
  editor dependency was added,
- **compiler markers**: errors and warnings are shown next to the line that
  caused them,
- the **currently executing line** is highlighted while the debugger is paused,
- **tab indentation** and automatic indentation after `{`,
- native copy/paste and undo/redo,
- an **unsaved changes indicator**.

Bracket matching, find & replace, folding and code formatting are not
implemented in the webview editor. Instead the saved `.c` file can be opened
in the **native VS Code editor** with *Open in editor* — there the student
gets the complete editing experience, while the playground keeps the running
program, the console and the debugger side by side.

---

## 13. Tests

| File | Coverage |
|------|----------|
| `tests/unit/compiler/compiler.test.ts` | Detection, version, smoke test, configuration, argument validation, compilation, diagnostics parsing |
| `tests/unit/execution/execution.test.ts` | Run, stdin, empty output, stderr, exit codes, timeout, cancellation, output cap, no shell |
| `tests/unit/debugging/gdb-adapter.test.ts` | MI parsing, real GDB session with breakpoint, frames and variables |
| `tests/unit/debugging/debugger-service.test.ts` | Debugger detection, breakpoints, variables, arrays, call stack |
| `tests/unit/tracing/tracing.test.ts` | Source mapping, comment handling, event order, counters, trace limits |
| `tests/unit/testing/test-runner.test.ts` | Comparison modes, registry, test runs, failure reporting |
| `tests/unit/playground/playground.test.ts` | Templates, reference implementations, service behaviour |
| `tests/unit/playground/playground-ui.test.tsx` | Editor, toolbar, console, diagnostics, debug controls, variable inspector, test panels |
| `tests/unit/playground/playground-e2e.test.ts` | Full chain: compile → run → debug → breakpoint → variables → trace → counters |

The compiler, execution and debugger tests use the **real** toolchain when one
is installed and are skipped otherwise, so the suite stays green on machines
without GCC.

Run everything with:

```bash
npm run test
npm run check-types
npm run lint
npm run compile
npm run package
```

---

## 14. Limitations

- The editor in the webview is a focused editor (line numbers, breakpoint
  gutter, C syntax highlighting, current execution line). For the full VS Code
  editing experience the student opens the saved `.c` file in the workspace,
  which gives the native editor with find/replace, folding and extensions.
- Only C is supported. The architecture (compiler service, execution service,
  test runner) is language independent; C++ / Python / Java would add their own
  compiler and runtime adapters.
- Memory limits are not enforced portably: Windows Job Objects and POSIX
  `setrlimit` bindings would require native modules. The timeout and the
  output cap protect the machine, but a program that allocates a lot of memory
  can still affect the machine until it is stopped.
- Operation counters derived from the source analysis are only available for
  the algorithms of the library; for other programs the extension shows source
  lines and variables only.
