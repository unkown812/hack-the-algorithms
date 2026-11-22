import { CODING_CHALLENGES } from './challenges';
import type { CodingChallenge, ChallengeDifficulty } from '../practice/types';

/**
 * Registry of the coding challenges.
 *
 * The hidden test cases never leave this module in the direction of the
 * webview — `toPublicChallenge` strips them.
 */

const CHALLENGE_INDEX = new Map(CODING_CHALLENGES.map((challenge) => [challenge.id, challenge]));

export function getChallengeById(id: string): CodingChallenge | undefined {
  return CHALLENGE_INDEX.get(id);
}

export function getChallengeCategories(): string[] {
  return [...new Set(CODING_CHALLENGES.map((challenge) => challenge.category))].sort();
}

export interface ChallengeFilter {
  category?: string;
  difficulty?: ChallengeDifficulty;
  algorithmId?: string;
  ids?: string[];
}

/** Filters the challenges. */
export function filterChallenges(filter: ChallengeFilter = {}): CodingChallenge[] {
  let challenges = CODING_CHALLENGES;

  if (filter.ids && filter.ids.length > 0) {
    const allowed = new Set(filter.ids);
    challenges = challenges.filter((challenge) => allowed.has(challenge.id));
  }
  if (filter.category) {
    challenges = challenges.filter((challenge) => challenge.category === filter.category);
  }
  if (filter.difficulty) {
    challenges = challenges.filter((challenge) => challenge.difficulty === filter.difficulty);
  }
  if (filter.algorithmId) {
    challenges = challenges.filter((challenge) => challenge.algorithmId === filter.algorithmId);
  }

  return challenges;
}

/**
 * The view of a challenge that is safe to send to the webview.
 * The hidden test cases — their inputs and their expected outputs — are
 * removed, so a student can never read them from the extension.
 */
export interface PublicChallenge extends Omit<CodingChallenge, 'hiddenCases' | 'referenceSolution'> {
  hiddenCaseCount: number;
  /** The reference solution is only revealed after the student submitted. */
  referenceSolution?: string;
}

export function toPublicChallenge(challenge: CodingChallenge, includeSolution = false): PublicChallenge {
  const { hiddenCases, referenceSolution, ...rest } = challenge;
  void hiddenCases;

  return {
    ...rest,
    hiddenCaseCount: hiddenCases.length,
    referenceSolution: includeSolution ? referenceSolution : undefined,
  };
}

/** All test cases of a challenge — visible and hidden. Used by the evaluator. */
export function getAllTestCases(challenge: CodingChallenge): CodingChallenge['sampleCases'] {
  return [...challenge.sampleCases, ...challenge.practiceCases, ...challenge.hiddenCases];
}

/** The number of tests a solution has to pass to be accepted. */
export function getRequiredTestCount(challenge: CodingChallenge): number {
  return getAllTestCases(challenge).length;
}
