/**
 * Types of the AI learning layer (Phase 7).
 *
 * They are imported by the extension host and by the webview, so they stay
 * free of Node.js and VS Code APIs. In particular no credential ever appears
 * in these types — the webview only ever learns *whether* a key is stored.
 */

export type AIProviderId = 'openai' | 'gemini' | 'local';

export type ExplanationMode =
  | 'beginner'
  | 'detailed'
  | 'step-by-step'
  | 'exam'
  | 'practical'
  | 'interview'
  | 'visual';

export const EXPLANATION_MODES: Array<{ id: ExplanationMode; label: string; description: string }> = [
  { id: 'beginner', label: 'Beginner', description: 'Simple language and small examples.' },
  { id: 'detailed', label: 'Detailed', description: 'Technically precise, with the reasoning.' },
  { id: 'step-by-step', label: 'Step by step', description: 'One step of the algorithm at a time.' },
  { id: 'exam', label: 'Exam preparation', description: 'University examination style answers.' },
  { id: 'practical', label: 'Practical', description: 'Implementation and execution focus.' },
  { id: 'interview', label: 'Interview', description: 'Technical reasoning and interview questions.' },
  { id: 'visual', label: 'Visual learning', description: 'Tables, diagrams and visual examples.' },
];

export type AIContextKind =
  | 'algorithm'
  | 'code'
  | 'visualization'
  | 'diagnostics'
  | 'execution'
  | 'complexity'
  | 'question'
  | 'progress'
  | 'documentation';

/**
 * One explicitly shared piece of context.
 * The user selects every item in the context panel — nothing is added
 * automatically.
 */
export interface AIContextItem {
  id: string;
  kind: AIContextKind;
  /** The short label shown in the context panel. */
  label: string;
  /** The text that is sent to the provider. */
  content: string;
  /** Where the content comes from, e.g. "registry" or "user selection". */
  source?: string;
  /** Approximate size in characters — used for the context budget. */
  size?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  /** The explanation mode that produced the message. */
  mode?: ExplanationMode;
  /** Sources that were used to answer the message. */
  sources?: AISource[];
  /** True when the answer came from the local knowledge base. */
  fromKnowledgeBase?: boolean;
  /** Set when the provider reported a problem. */
  error?: boolean;
}

export interface AISource {
  title: string;
  /** Where the source lives, e.g. "Algorithm registry" or "Practical resources". */
  origin: string;
  /** An optional reference such as an algorithm id. */
  reference?: string;
}

export interface AIRequest {
  messages: AIMessage[];
  systemPrompt: string;
  /** The explicitly shared context. */
  context: AIContextItem[];
  mode: ExplanationMode;
  temperature?: number;
  maxTokens?: number;
  /** The task the assistant should perform, e.g. "algorithm-explanation". */
  task?: string;
  signal?: AbortSignal;
}

export interface AIResponse {
  content: string;
  /** The provider that produced the answer. */
  provider: AIProviderId;
  model: string;
  /** The sources that were used. */
  sources: AISource[];
  /** True when the answer was produced without an external provider. */
  fromKnowledgeBase: boolean;
  /** Milliseconds the request took. */
  durationMs: number;
  /** The context that was actually sent — shown in the UI for transparency. */
  usedContext: AIContextItem[];
  /** Set when the request failed. */
  error?: AIErrorKind;
}

export type AIErrorKind =
  | 'not-configured'
  | 'invalid-key'
  | 'network'
  | 'rate-limit'
  | 'timeout'
  | 'cancelled'
  | 'unsupported-model'
  | 'empty-response'
  | 'malformed-response'
  | 'server';

export interface AIProviderConfig {
  provider: AIProviderId;
  /** The model id — empty means "use the provider default". */
  model: string;
  temperature: number;
  maxTokens: number;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
  /** How much of the conversation is sent with every request. */
  maxContextMessages: number;
  /** Maximum number of characters of shared context. */
  maxContextCharacters: number;
  /** Whether the assistant may use the bundled learning resources. */
  useLocalResources: boolean;
  /** Whether the student agreed to share the selected context with a provider. */
  allowExternalContext: boolean;
}

export const DEFAULT_AI_CONFIGURATION: AIProviderConfig = {
  provider: 'local',
  model: '',
  temperature: 0.4,
  maxTokens: 1500,
  timeoutMs: 60000,
  maxContextMessages: 12,
  maxContextCharacters: 12000,
  useLocalResources: true,
  allowExternalContext: false,
};

/** The provider information the webview may see — never a credential. */
export interface AIProviderStatus {
  id: AIProviderId;
  name: string;
  /** True when a credential is stored for the provider. */
  hasKey: boolean;
  /** The default model of the provider. */
  defaultModel: string;
  /** The models the provider supports. */
  models: string[];
  /** Whether the provider can be used without a credential. */
  requiresKey: boolean;
  /** True when the provider talks to an external service. */
  isExternal: boolean;
  documentationUrl?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AIMessage[];
  mode: ExplanationMode;
}

/** A question the student can ask straight away. */
export interface AISuggestion {
  id: string;
  text: string;
  /** The task the suggestion triggers. */
  task?: string;
}
