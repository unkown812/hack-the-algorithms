import { Difficulty } from '../types';
import type { AlgorithmCategory } from '../types';

export const EXTENSION_ID = 'daa-companion';
export const COMMAND_OPEN_DASHBOARD = 'daa-companion.openDashboard';
export const COMMAND_OPEN_ALGORITHM_LIBRARY = 'daa-companion.openAlgorithmLibrary';
export const VIEW_EXPLORER_ID = 'daa-companion.explorer';
export const VIEW_CONTAINER_ID = 'daa-companion';

export const WEBVIEW_VIEW_TYPE = 'daa-companion.webview';

export const ALGORITHM_CATEGORIES: AlgorithmCategory[] = [
  {
    id: 'searching',
    name: 'Searching',
    description: 'Algorithms for finding elements in data structures',
    icon: 'Search',
    algorithmIds: [],
  },
  {
    id: 'sorting',
    name: 'Sorting',
    description: 'Algorithms for arranging elements in order',
    icon: 'SortAsc',
    algorithmIds: [],
  },
  {
    id: 'greedy',
    name: 'Greedy Algorithms',
    description: 'Algorithms that make locally optimal choices',
    icon: 'Zap',
    algorithmIds: [],
  },
  {
    id: 'divide-and-conquer',
    name: 'Divide and Conquer',
    description: 'Algorithms that divide problems into subproblems',
    icon: 'GitBranch',
    algorithmIds: [],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Algorithms that solve overlapping subproblems',
    icon: 'RefreshCw',
    algorithmIds: [],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    description: 'Algorithms that explore and abandon candidates',
    icon: 'RotateCw',
    algorithmIds: [],
  },
  {
    id: 'graph-algorithms',
    name: 'Graph Algorithms',
    description: 'Algorithms for graph traversal and paths',
    icon: 'Share2',
    algorithmIds: [],
  },
  {
    id: 'string-matching',
    name: 'String Matching',
    description: 'Algorithms for finding patterns in text',
    icon: 'Type',
    algorithmIds: [],
  },
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
};

export const DEFAULT_ALGORITHM_LANGUAGE = 'c';

export const WEBVIEW_MESSAGE_TYPES = {
  LOAD_ALGORITHMS: 'LOAD_ALGORITHMS',
  LOAD_ALGORITHM_DETAIL: 'LOAD_ALGORITHM_DETAIL',
  OPEN_ALGORITHM: 'OPEN_ALGORITHM',
  SEARCH_ALGORITHMS: 'SEARCH_ALGORITHMS',
  FILTER_BY_CATEGORY: 'FILTER_BY_CATEGORY',
  REQUEST_PRACTICAL_FILE: 'REQUEST_PRACTICAL_FILE',
} as const;
