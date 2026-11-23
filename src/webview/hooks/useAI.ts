import { useEffect, useRef } from 'react';
import { onExtensionMessage, postToExtension } from '../utils';
import { AI_MESSAGES } from '../../shared/constants';

/**
 * Subscribes to the Phase 7 messages of the extension host.
 *
 * The handler is kept in a ref so that the subscription is not re-created on
 * every render.
 */
export function useAIMessages(
  handler: (type: string, payload: Record<string, unknown>) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = onExtensionMessage((event) => {
      const message = event.data as { type: string; payload?: unknown };
      const payload = (message.payload ?? {}) as Record<string, unknown>;
      handlerRef.current(message.type, payload);
    });
    return unsubscribe;
  }, []);
}

/** Sends a message to the extension host. */
export function sendAIMessage(type: string, payload?: unknown): void {
  postToExtension({ type, payload });
}

/** The request helpers of the AI assistant. */
export const aiApi = {
  getStatus: () => sendAIMessage(AI_MESSAGES.GET_AI_STATUS),
  saveConfig: (config: unknown) => sendAIMessage(AI_MESSAGES.SAVE_AI_CONFIG, { config }),
  saveKey: (provider: string, apiKey: string) =>
    sendAIMessage(AI_MESSAGES.SET_API_KEY, { provider, apiKey }),
  clearKey: (provider: string) => sendAIMessage(AI_MESSAGES.CLEAR_API_KEY, { provider }),
  test: () => sendAIMessage(AI_MESSAGES.TEST_PROVIDER),
  ask: (request: unknown) => sendAIMessage(AI_MESSAGES.ASK_ASSISTANT, request),
  cancel: (requestId: string) => sendAIMessage(AI_MESSAGES.CANCEL_AI_REQUEST, { requestId }),
  getConversations: () => sendAIMessage(AI_MESSAGES.GET_CONVERSATIONS),
  newConversation: (mode?: string) => sendAIMessage(AI_MESSAGES.NEW_CONVERSATION, { mode }),
  openConversation: (conversationId: string) =>
    sendAIMessage(AI_MESSAGES.OPEN_CONVERSATION, { conversationId }),
  deleteConversation: (conversationId: string) =>
    sendAIMessage(AI_MESSAGES.DELETE_CONVERSATION, { conversationId }),
  clearConversations: () => sendAIMessage(AI_MESSAGES.CLEAR_CONVERSATIONS),
  setMode: (conversationId: string, mode: string) =>
    sendAIMessage(AI_MESSAGES.SET_CONVERSATION_MODE, { conversationId, mode }),
  generateViva: (question: string, conversationId?: string) =>
    sendAIMessage(AI_MESSAGES.GENERATE_VIVA, { question, conversationId }),
  generateQuestions: (request: unknown, conversationId?: string) =>
    sendAIMessage(AI_MESSAGES.GENERATE_QUESTIONS, { request, conversationId }),
  getLearningAdvice: () => sendAIMessage(AI_MESSAGES.GET_LEARNING_ADVICE),
  getQuestionDrafts: () => sendAIMessage(AI_MESSAGES.GET_QUESTION_DRAFTS),
  reviewDraft: (draftId: string, action: 'approve' | 'reject', note?: string) =>
    sendAIMessage(AI_MESSAGES.REVIEW_QUESTION_DRAFT, { draftId, action, note }),
  deleteDraft: (draftId: string) =>
    sendAIMessage(AI_MESSAGES.DELETE_QUESTION_DRAFT, { draftId }),
  clearRejectedDrafts: () => sendAIMessage(AI_MESSAGES.CLEAR_REJECTED_DRAFTS),
};
