import { useEffect, useRef } from 'react';
import { onExtensionMessage, postToExtension } from '../utils';
import { PRACTICE_MESSAGES } from '../../shared/constants';

/**
 * Subscribes to the Phase 6 messages of the extension host.
 *
 * The handler is kept in a ref so that the subscription is not re-created on
 * every render.
 */
export function usePracticeMessages(
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
export function sendPracticeMessage(type: string, payload?: unknown): void {
  postToExtension({ type, payload });
}

/** The request helpers of the practice centre. */
export const practiceApi = {
  getOverview: () => sendPracticeMessage(PRACTICE_MESSAGES.GET_PRACTICE_OVERVIEW),
  getQuestions: (filter?: unknown) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_QUESTIONS, { filter }),
  startQuiz: (config: unknown) => sendPracticeMessage(PRACTICE_MESSAGES.START_QUIZ, { config }),
  answerQuiz: (attemptId: string, questionId: string, answer: string | string[]) =>
    sendPracticeMessage(PRACTICE_MESSAGES.ANSWER_QUIZ, { attemptId, questionId, answer }),
  markQuestion: (attemptId: string, questionId: string, marked: boolean) =>
    sendPracticeMessage(PRACTICE_MESSAGES.MARK_QUESTION, { attemptId, questionId, marked }),
  submitQuiz: (attemptId: string) => sendPracticeMessage(PRACTICE_MESSAGES.SUBMIT_QUIZ, { attemptId }),
  abandonQuiz: (attemptId: string) =>
    sendPracticeMessage(PRACTICE_MESSAGES.ABANDON_QUIZ, { attemptId }),
  getActiveQuiz: () => sendPracticeMessage(PRACTICE_MESSAGES.GET_ACTIVE_QUIZ),
  getChallenges: (filter?: { category?: string; difficulty?: string }) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_CHALLENGES, filter),
  getChallenge: (challengeId: string) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_CHALLENGE, { challengeId }),
  submitChallenge: (challengeId: string, source: string) =>
    sendPracticeMessage(PRACTICE_MESSAGES.SUBMIT_CHALLENGE, { challengeId, source }),
  getReferenceSolution: (challengeId: string) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_REFERENCE_SOLUTION, { challengeId }),
  getPracticals: (category?: string) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_PRACTICALS, { category }),
  getPractical: (practicalId: string, mode: string, revealed = false) =>
    sendPracticeMessage(PRACTICE_MESSAGES.GET_PRACTICAL, { practicalId, mode, revealed }),
  getMockExams: () => sendPracticeMessage(PRACTICE_MESSAGES.GET_MOCK_EXAMS),
  getViva: (topic?: string) => sendPracticeMessage(PRACTICE_MESSAGES.GET_VIVA, { topic }),
  toggleBookmark: (bookmark: unknown) =>
    sendPracticeMessage(PRACTICE_MESSAGES.TOGGLE_BOOKMARK, bookmark),
  getBookmarks: (filter?: unknown) => sendPracticeMessage(PRACTICE_MESSAGES.GET_BOOKMARKS, filter),
  getProgress: () => sendPracticeMessage(PRACTICE_MESSAGES.GET_PROGRESS),
  resetProgress: () => sendPracticeMessage(PRACTICE_MESSAGES.RESET_PROGRESS),
  exportProgress: () => sendPracticeMessage(PRACTICE_MESSAGES.EXPORT_PROGRESS),
  importProgress: (json: string) => sendPracticeMessage(PRACTICE_MESSAGES.IMPORT_PROGRESS, { json }),
};
