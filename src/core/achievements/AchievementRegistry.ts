import type { Achievement } from '../practice/types';

/**
 * The achievement catalogue.
 *
 * Every achievement reflects real learning activity — there are no arbitrary
 * milestones, and the criteria are checked against the recorded data.
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-algorithm',
    name: 'First Algorithm Explored',
    description: 'Open the detail page of an algorithm.',
    criteria: { metric: 'algorithmsExplored', threshold: 1 },
  },
  {
    id: 'ach-first-quiz',
    name: 'First Quiz Completed',
    description: 'Finish your first quiz.',
    criteria: { metric: 'quizzesCompleted', threshold: 1 },
  },
  {
    id: 'ach-first-challenge',
    name: 'First Coding Challenge Solved',
    description: 'Pass every test case of a coding challenge.',
    criteria: { metric: 'challengesAccepted', threshold: 1 },
  },
  {
    id: 'ach-ten-challenges',
    name: '10 Challenges Accepted',
    description: 'Pass all test cases of ten coding challenges.',
    criteria: { metric: 'challengesAccepted', threshold: 10 },
  },
  {
    id: 'ach-fifty-questions',
    name: '50 Questions Answered',
    description: 'Answer fifty practice questions.',
    criteria: { metric: 'questionsAnswered', threshold: 50 },
  },
  {
    id: 'ach-all-topics',
    name: 'All Topics Explored',
    description: 'Answer at least half of the questions of every topic.',
    criteria: { metric: 'topicsExplored', threshold: 10 },
  },
  {
    id: 'ach-sorting-specialist',
    name: 'Sorting Specialist',
    description: 'Answer ten sorting questions correctly.',
    criteria: { metric: 'categoryCorrectAnswers', threshold: 10, category: 'sorting' },
  },
  {
    id: 'ach-searching-specialist',
    name: 'Searching Specialist',
    description: 'Answer six searching questions correctly.',
    criteria: { metric: 'categoryCorrectAnswers', threshold: 6, category: 'searching' },
  },
  {
    id: 'ach-complexity-explorer',
    name: 'Complexity Explorer',
    description: 'Answer five complexity questions correctly.',
    criteria: { metric: 'categoryCorrectAnswers', threshold: 5, category: 'complexity' },
  },
  {
    id: 'ach-practical-complete',
    name: 'Practical Preparation Complete',
    description: 'Finish a practical exercise.',
    criteria: { metric: 'practicalsCompleted', threshold: 1 },
  },
];

/** Looks up an achievement by id. */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
