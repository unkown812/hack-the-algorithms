import type { AIConversation, AIMessage, ExplanationMode } from './types';

/**
 * The conversation history.
 *
 * The conversations live in memory of the extension host; the student can
 * delete them at any time and nothing is sent anywhere except to the
 * provider that is configured.
 */

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  mode: ExplanationMode;
}

let counter = 0;

function nextId(): string {
  counter += 1;
  return `conversation-${Date.now().toString(36)}-${counter}`;
}

export class AIConversationManager {
  private readonly conversations = new Map<string, AIConversation>();

  /** Creates a new conversation. */
  create(mode: ExplanationMode = 'beginner'): AIConversation {
    const now = Date.now();
    const conversation: AIConversation = {
      id: nextId(),
      title: 'New conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      mode,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /** Returns a conversation by id. */
  get(id: string): AIConversation | undefined {
    return this.conversations.get(id);
  }

  /** All conversations, newest first. */
  list(): ConversationSummary[] {
    return [...this.conversations.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
        mode: conversation.mode,
      }));
  }

  /** Adds a message to a conversation. */
  addMessage(
    conversationId: string,
    message: Omit<AIMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: number }
  ): AIMessage | undefined {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return undefined;
    }

    const stored: AIMessage = {
      id: message.id ?? nextId(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ?? Date.now(),
      mode: message.mode,
      sources: message.sources,
      fromKnowledgeBase: message.fromKnowledgeBase,
      error: message.error,
    };

    conversation.messages.push(stored);
    conversation.updatedAt = stored.createdAt;

    if (conversation.messages.length === 1 && stored.role === 'user') {
      conversation.title = stored.content.slice(0, 60);
    }

    return stored;
  }

  /** Changes the explanation mode of a conversation. */
  setMode(conversationId: string, mode: ExplanationMode): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }
    conversation.mode = mode;
    return true;
  }

  /** Removes a conversation. */
  remove(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /** Removes every conversation. */
  clear(): void {
    this.conversations.clear();
  }

  /** The messages of a conversation, newest last. */
  messages(conversationId: string): AIMessage[] {
    return this.conversations.get(conversationId)?.messages ?? [];
  }
}
