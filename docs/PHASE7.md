# Phase 7 — AI Learning Assistant & Personalized DAA Tutor

## Overview

Phase 7 adds an AI-powered learning layer to the DAA Learning Companion. The
assistant explains algorithms, code, complexity derivations, visualization
steps and debugging evidence — and it recommends what to practise next based
on the recorded progress of Phase 6.

The central architectural rule of this phase: **the AI enhances the existing
features, it never replaces them.** The algorithm registry, the visualization
engine, the complexity analyzer, the compiler lab and the practice centre all
keep working without any AI provider, API key or internet connection.

## What was built

### 1. Provider-independent AI service layer (`src/core/ai/`)

```
Webview (chat UI)
      |  postMessage only
AIMessageHandler (extension host)
      |
AIService
      |-- AIContextBuilder      (explicit context + budget)
      |-- AIRetrievalService    (local keyword retrieval over the verified corpus)
      |-- AIResponseValidator   (fabrication checks)
      |-- AIConversationManager (in-memory history)
      |
ProviderRegistry
      |-- LocalKnowledgeProvider  (offline, no key, answers from bundled material)
      |-- OpenAIProvider          (chat completions API)
      |-- GeminiProvider          (generateContent API)
```

- The provider contract (`AIProvider`) is a single interface; adding a provider
  means adding one class and registering it — nothing else changes.
- The **local knowledge base provider** answers from the verified resources
  (algorithm registry, complexity topics, practicals, viva questions, question
  bank, templates) with a keyword-scoring retrieval. It works with no key and
  is the default.
- All requests support cancellation (`AbortSignal`), timeouts, rate-limit
  detection, and every error is mapped to a student-actionable message.

### 2. Secure credential handling (`src/extension/services/`)

- `AISecretStorage` stores keys in VS Code **SecretStorage** (`daa.ai.key.<provider>`).
  Keys are never written to `package.json`, settings, logs, workspace files or
  the webview state.
- `AIProviderManager` owns the registry, reads the configuration from the
  `daaCompanion.ai.*` settings, resolves credentials, validates the
  configuration and provides a connection test.
- The webview only ever learns **whether** a key exists — never the key itself.

### 3. Context retrieval and privacy

`AIContextBuilder` builds the context from **explicit selections only**:

| Item | Source |
|---|---|
| Algorithm theory + complexity | Phase 1 registry |
| Selected code | VS Code editor selection |
| Visualization step | Phase 2 trace |
| Compiler diagnostics | Phase 5 compiler |
| Execution result | Phase 5 execution engine |
| Complexity analysis (theoretical / instrumented / measured) | Phase 4 services |
| Current question | Phase 6 question bank |
| Progress summary | Phase 6 learning data |

Privacy rules that are enforced in code, not in the UI:

- User-selected context (code, execution, diagnostics, progress) is **stripped
  before the request** when the provider is external and
  `daaCompanion.ai.allowExternalContext` is `false`. Only bundled (non-personal)
  material may ground an external answer in that case.
- The context has a character budget (`maxContextCharacters`); truncation is
  reported.
- A context panel above the input shows exactly which items are attached, and
  each can be removed before sending.

### 4. Response validation

`AIResponseValidator` checks the answer before it is shown:

- Empty answers become actionable messages.
- Claims such as "I compiled your program" or "I counted 42 comparisons" are
  flagged unless the shared context really contained an execution result or
  instrumented counts.
- Answers produced without any verified material carry an explicit warning.

### 5. The eight AI features (`src/core/ai/features/`)

| Feature | Purpose | Grounded in |
|---|---|---|
| `AlgorithmTutor` | Full algorithm explanations + follow-up questions | Algorithm registry |
| `CodeExplainer` | Explain code / function / pseudocode / bugs / improvements / complexity / documentation | Editor selection |
| `DebuggingAssistant` | Explain real compiler errors and runtime failures | Phase 5 diagnostics + execution |
| `ComplexityTutor` | Explain derivations, recurrences, dominant terms | Phase 4 analyzer results |
| `VisualizationAssistant` | Explain the current trace step; translate "next comparison" into existing playback controls | Phase 2 trace |
| `PracticalAssistant` | Practical papers, viva practice, mock exam guidance | Phase 3 practicals + Phase 6 viva bank |
| `QuestionGenerator` | Additional practice questions from the verified bank, structurally validated | Phase 6 question bank |
| `LearningAdvisor` | Personalised recommendations + prerequisite roadmap | Phase 6 learning data |

Design decisions:

- The **deterministic services remain the authority**. The AI interprets the
  Phase 4 counts and the Phase 5 evidence; it never invents a measurement, and
  the prompt and the validator both enforce this.
- The visualization engine stays responsible for playback: natural commands
  such as "move to the next comparison" are translated into the **existing**
  playback controls — the assistant never modifies the trace.
- Generated questions are validated (structure, explanation length, answer ∈
  options) and are **never silently added** to the verified question bank; the
  generator surfaces verified bank questions matching the request.
- The LearningAdvisor states the rule behind every recommendation ("your
  accuracy on sorting is 40%…") and never judges a student on one answer.

### 6. Tutor system prompt (`src/core/ai/prompts/system/tutor.prompt.ts`)

Fifteen principles including: teacher not search engine, C as the primary
language, verified resources as factual basis, never invent execution results
or measurements, distinguish theoretical vs measured complexity, hints before
solutions, explicit uncertainty, no claimed compilation/testing.

Seven explanation modes (beginner, detailed, step-by-step, exam, practical,
interview, visual) can be switched mid-conversation; each adds its own
instruction to the system prompt.

### 7. Chat interface (`src/webview/`)

- `AIAssistant` page: welcome screen with quick actions, 7-mode selector,
  conversation list (new/open/delete/clear), markdown answers with fenced code
  blocks and a copy button, source lists, local-knowledge-base badge,
  follow-up chips, stop-generation button, streaming-free loading state.
- `AIProviderSettings`: provider/model pickers, key entry (password field,
  stored via the host), key removal, consent checkbox, temperature / max
  tokens / timeout fields, connection test.
- `AIContextPanel`: shows the attached context items before sending.
- The assistant is reachable from the dashboard, the command palette
  (`DAA Companion: AI Learning Assistant`) and the editor context menu.

### 8. Editor integration

Seven context-menu commands (`DAA AI: …`) read the active selection and hand
it to the assistant: Explain Selected Code, Explain This Function, Generate
Pseudocode, Find Potential Bugs, Suggest Improvements, Explain Complexity,
Generate Documentation. They never read other files and never modify the
source.

## Message protocol

`AI_MESSAGES` in `src/shared/constants/index.ts`, routed through the explicit
`AI_MESSAGE_SET` in `src/extension/commands/index.ts` (same pattern as
Phases 5 and 6). Host→webview events: `AI_STATUS`, `AI_RESPONSE`,
`AI_ERROR`, `AI_CONVERSATIONS`, `AI_CONVERSATION_LOADED`, `AI_KEY_SAVED`,
`AI_CONFIG_SAVED`, `AI_TEST_RESULT`, `AI_EDITOR_REQUEST`.

## Settings

All under `daaCompanion.ai.*`: `provider` (local | openai | gemini), `model`,
`temperature`, `maxTokens`, `timeoutMs`, `maxContextMessages`,
`maxContextCharacters`, `useLocalResources`, `allowExternalContext`.

## Offline behaviour

With the default configuration (`provider: local`) the assistant answers from
the bundled material with no network access at all. If an external provider is
configured but unreachable, every other feature of the extension continues to
work.

## Tests (89 new)

- `tests/unit/ai/providers.test.ts` — configuration validation, registry,
  OpenAI/Gemini request formatting and error mapping (mocked `fetch`),
  cancellation, timeout, empty answers, the offline provider, error messages.
- `tests/unit/ai/context-service.test.ts` — context building for every
  selection kind, budget truncation, retrieval scoring, the fabrication
  validator, conversations, the consent/withholding rule of `AIService`.
- `tests/unit/ai/features.test.ts` — all eight features and the tutor prompt.

No test performs a real API call; providers are stubbed.

## Known limitations

- The question generator surfaces verified bank questions and validates
  structure; free-form AI-written questions are not auto-merged into the
  verified bank.
- `local` is the only provider that works without a key; a truly local LLM
  (Ollama-style) is future work.

---

# Phase 7.1 — Streaming, Semantic Retrieval, Local Models & the Review Workflow

This follow-up closes the four limitations and the four future-work items of
the first Phase 7 release. The architecture of the first release is unchanged
— everything below was added *around* the existing layers.

## 1. Streaming answers

The provider contract gained an optional `stream` method. A provider that can
deliver the answer piece by piece implements it; the others keep working
exactly as before.

| Provider | Stream format |
|---|---|
| OpenAI | server-sent events (`data: {…}`), read from `choices[0].delta.content` |
| Gemini | server-sent events (`streamGenerateContent?alt=sse`) |
| Local model (Ollama) | newline-delimited JSON (`message.content`) |
| Local knowledge base | not supported — it answers instantly |

- `AIService.ask` streams when the configuration enables it (`streaming`) **and**
  the caller passes a chunk callback **and** the provider supports it.
  Otherwise it falls back to the complete answer — the behaviour is identical
  for the caller.
- The webview appends the chunks to the answer while it is generated
  (`AI_CHUNK` message) and replaces them with the final message when it
  arrives. The "Stop" button cancels the request through the abort signal.
- `daaCompanion.ai.streaming` turns the feature off.

## 2. Semantic retrieval (local embeddings)

`AIEmbeddingIndex` builds an in-memory vector index over the knowledge base:

- every word contributes to a **word bucket** (hashed, two projections),
- every character trigram contributes to a **character bucket** (damped),
- the buckets are weighted with the **inverse document frequency**, so common
  words count less than rare ones,
- the vector is normalised, so the dot product is the cosine similarity.

The retrieval is now **hybrid**:

```
score = keywordScore + similarity × semanticWeight × strongestKeywordScore
```

- the keyword part stays dominant, so an exact match always wins,
- the semantic part is scaled by the keyword signal of the query, so it can
  rescue a question that uses other words but never overrides a literal hit,
- a document whose reference the query names exactly ("binary search") gets an
  additional bonus — the comprehensive source wins over a mention of it.

The result for "binary search" is now the theory document and the complexity
document of the algorithm, followed by the related questions; before, a single
viva question could win.

The index is built once per session, needs no network access and no external
embedding service — the corpus is small, local and known.

## 3. A local model provider

`LocalLLMProvider` talks to an **Ollama-compatible** server on the machine of
the student:

- no API key is needed,
- the data never leaves the computer (`isExternal: false`, so the consent gate
  does not apply),
- the models are read from the running server (`/api/tags`), so the model list
  always shows what is really installed,
- the address is configurable (`daaCompanion.ai.localBaseUrl`, default
  `http://localhost:11434`),
- when no server is running, the error message explains how to start one.

`local`, `local-llm`, `openai` and `gemini` are now all selectable in the
settings.

## 4. Automatic context binding

The pages of the extension publish what the student is looking at into a
**context registry** (`src/webview/services/aiContextRegistry.ts`):

| Page | Published item |
|---|---|
| Algorithm detail / visualizer | the algorithm (theory, pseudocode, complexity) |
| Visualizer | the current step of the trace (array, compared/exchanged elements, variables, counters) |
| Code playground | the current program, the compiler diagnostics, the last run |
| Complexity analyzer | the theoretical classes and the counted operations |

Two rules keep this safe:

1. **Publishing is not sharing.** A published item is only *available* — the
   assistant shows it as a `+ Item` chip that the student has to click. Nothing
   is attached automatically, and the consent gate of the external providers
   still applies.
2. The registry never reads a file on its own — a page publishes only what it
   already shows.

## 5. The question review workflow

The generated questions now go through a full review cycle instead of being
displayed as a chat answer:

1. the provider writes the questions as JSON (`QuestionJsonParser` tolerates
   code fences, surrounding text and single quotes),
2. `QuestionDraftService` validates every question — title, question text,
   answer, explanation length, answer ∈ options, duplicate check,
3. the questions that pass become **drafts** with the status `pending`,
4. the student approves or rejects every draft in the review panel, with the
   answer and the explanation shown for checking,
5. **only an approved draft** may be used in a quiz.

Approved questions extend the verified bank of Phase 6 — they are filtered
with the same category, topic and difficulty rules, they are marked as
`ai-generated` and `reviewed`, and **the verified bank itself is never
modified**.

## Tests

`tests/unit/ai/streaming.test.ts` (SSE and NDJSON parsing, the streaming path
of all three providers, the local server errors), `tests/unit/ai/review-and-retrieval.test.ts`
(the review workflow, the JSON parser, the embedding index, the hybrid
ranking) and `tests/unit/ai/context-registry.test.ts` (the registry, the
factual description of a trace step, the reviewed questions in the practice
centre).
