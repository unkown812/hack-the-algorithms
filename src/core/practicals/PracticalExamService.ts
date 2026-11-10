import { PRACTICALS, getPracticalById } from './practicals';
import type { PracticalExercise, PracticalMode, PracticalSession } from '../practice/types';

/**
 * The practical exam preparation service.
 *
 * Three modes are supported:
 * - **guided** — the theory, the pseudocode and the reference code are shown,
 * - **independent** — only the problem statement is shown; the reference code
 *   is revealed after the student submitted their solution,
 * - **mock** — the practical is part of a mock examination with a time limit.
 */

export interface PracticalView {
  id: string;
  name: string;
  category: string;
  aim: string;
  /** The problem statement — always visible. */
  problemStatement: string;
  /** Theory, pseudocode and code are only shown in guided mode. */
  theory?: string;
  algorithm?: string[];
  pseudocode?: string[];
  cProgram?: string;
  sampleInput?: string;
  sampleOutput?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  conclusion?: string;
  vivaQuestions?: PracticalExercise['vivaQuestions'];
}

/** Builds the view of a practical for the given mode. */
export function getPracticalView(
  practicalId: string,
  mode: PracticalMode,
  revealed = false
): PracticalView | null {
  const practical = getPracticalById(practicalId);
  if (!practical) {
    return null;
  }

  const base: PracticalView = {
    id: practical.id,
    name: practical.name,
    category: practical.category,
    aim: practical.aim,
    problemStatement: practical.problemStatement,
  };

  if (mode === 'independent' && !revealed) {
    return base;
  }

  return {
    ...base,
    theory: practical.theory,
    algorithm: practical.algorithm,
    pseudocode: practical.pseudocode,
    cProgram: practical.cProgram,
    sampleInput: practical.sampleInput,
    sampleOutput: practical.sampleOutput,
    timeComplexity: practical.timeComplexity,
    spaceComplexity: practical.spaceComplexity,
    conclusion: practical.conclusion,
    vivaQuestions: practical.vivaQuestions,
  };
}

/** Starts a practical session. */
export function startPracticalSession(
  practicalId: string,
  mode: PracticalMode,
  now = Date.now()
): PracticalSession | null {
  if (!getPracticalById(practicalId)) {
    return null;
  }

  return {
    id: `practical-session-${now.toString(36)}`,
    practicalId,
    mode,
    startedAt: now,
    status: 'in-progress',
  };
}

/** Completes a practical session. */
export function completePracticalSession(
  session: PracticalSession,
  options: {
    source?: string;
    status_result?: PracticalSession['status_result'];
    testResults?: PracticalSession['testResults'];
    revealedSolution?: boolean;
    now?: number;
  } = {}
): PracticalSession {
  return {
    ...session,
    completedAt: options.now ?? Date.now(),
    status: 'completed',
    source: options.source ?? session.source,
    status_result: options.status_result ?? session.status_result,
    testResults: options.testResults ?? session.testResults,
    revealedSolution: options.revealedSolution ?? session.revealedSolution,
  };
}

/** All practical exercises, optionally filtered by category. */
export function listPracticals(category?: string): PracticalExercise[] {
  return category
    ? PRACTICALS.filter((practical) => practical.category === category)
    : [...PRACTICALS];
}
