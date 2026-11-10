export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDifficultyColor(difficulty: string): string {
  switch (difficulty) {
  case 'Beginner':
    return COLORS.success;
  case 'Intermediate':
    return COLORS.warning;
  case 'Advanced':
    return COLORS.error;
  default:
    return COLORS.textMuted;
  }
}

import { COLORS } from './Theme';
