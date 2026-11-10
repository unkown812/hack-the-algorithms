import { Difficulty } from '../types';
import type { AlgorithmCategory } from '../types';

export const EXTENSION_ID = 'daa-companion';
export const COMMAND_OPEN_DASHBOARD = 'daa-companion.openDashboard';
export const COMMAND_OPEN_ALGORITHM_LIBRARY = 'daa-companion.openAlgorithmLibrary';
export const COMMAND_OPEN_PRACTICE = 'daa-companion.openPractice';
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

/**
 * Phase 5 — Code Playground message protocol.
 * The webview never touches a process or the file system directly; it asks
 * the extension host, which performs the work asynchronously.
 */
export const PLAYGROUND_MESSAGES = {
  // webview -> host
  GET_COMPILER_STATUS: 'GET_COMPILER_STATUS',
  REFRESH_COMPILER: 'REFRESH_COMPILER',
  UPDATE_COMPILER_CONFIG: 'UPDATE_COMPILER_CONFIG',
  COMPILE_PROGRAM: 'COMPILE_PROGRAM',
  RUN_PROGRAM: 'RUN_PROGRAM',
  STOP_PROGRAM: 'STOP_PROGRAM',
  RUN_TESTS: 'RUN_TESTS',
  SAVE_PROGRAM: 'SAVE_PROGRAM',
  LOAD_PROGRAM: 'LOAD_PROGRAM',
  OPEN_PROGRAM_FILE: 'OPEN_PROGRAM_FILE',
  DELETE_PROGRAM: 'DELETE_PROGRAM',
  LIST_PROGRAMS: 'LIST_PROGRAMS',
  SAVE_TEST_CASES: 'SAVE_TEST_CASES',
  LOAD_TEST_CASES: 'LOAD_TEST_CASES',
  GET_HISTORY: 'GET_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  START_DEBUGGING: 'START_DEBUGGING',
  DEBUG_ACTION: 'DEBUG_ACTION',
  STOP_DEBUGGING: 'STOP_DEBUGGING',
  GET_DEBUG_STATE: 'GET_DEBUG_STATE',

  // host -> webview
  COMPILER_STATUS: 'COMPILER_STATUS',
  COMPILE_RESULT: 'COMPILE_RESULT',
  EXECUTION_RESULT: 'EXECUTION_RESULT',
  TEST_RESULT: 'TEST_RESULT',
  PROGRAM_SAVED: 'PROGRAM_SAVED',
  PROGRAMS_LIST: 'PROGRAMS_LIST',
  TEST_CASES_LOADED: 'TEST_CASES_LOADED',
  HISTORY_LOADED: 'HISTORY_LOADED',
  DEBUG_STATE_CHANGED: 'DEBUG_STATE_CHANGED',
  TRACE_EVENT_RECEIVED: 'TRACE_EVENT_RECEIVED',
  PLAYGROUND_ERROR: 'PLAYGROUND_ERROR',
} as const;

/**
 * Phase 6 — Practice, Assessment & Progress message protocol.
 */
export const PRACTICE_MESSAGES = {
  // webview -> host
  GET_PRACTICE_OVERVIEW: 'GET_PRACTICE_OVERVIEW',
  GET_QUESTIONS: 'GET_QUESTIONS',
  START_QUIZ: 'START_QUIZ',
  ANSWER_QUIZ: 'ANSWER_QUIZ',
  MARK_QUESTION: 'MARK_QUESTION',
  SUBMIT_QUIZ: 'SUBMIT_QUIZ',
  ABANDON_QUIZ: 'ABANDON_QUIZ',
  GET_ACTIVE_QUIZ: 'GET_ACTIVE_QUIZ',
  GET_CHALLENGES: 'GET_CHALLENGES',
  GET_CHALLENGE: 'GET_CHALLENGE',
  SUBMIT_CHALLENGE: 'SUBMIT_CHALLENGE',
  GET_REFERENCE_SOLUTION: 'GET_REFERENCE_SOLUTION',
  GET_PRACTICALS: 'GET_PRACTICALS',
  GET_PRACTICAL: 'GET_PRACTICAL',
  GET_MOCK_EXAMS: 'GET_MOCK_EXAMS',
  RECORD_MOCK_EXAM: 'RECORD_MOCK_EXAM',
  GET_VIVA: 'GET_VIVA',
  TOGGLE_BOOKMARK: 'TOGGLE_BOOKMARK',
  GET_BOOKMARKS: 'GET_BOOKMARKS',
  GET_PROGRESS: 'GET_PROGRESS',
  RESET_PROGRESS: 'RESET_PROGRESS',
  EXPORT_PROGRESS: 'EXPORT_PROGRESS',
  IMPORT_PROGRESS: 'IMPORT_PROGRESS',
  RECORD_ALGORITHM_EXPLORED: 'RECORD_ALGORITHM_EXPLORED',

  // host -> webview
  PRACTICE_OVERVIEW: 'PRACTICE_OVERVIEW',
  QUESTIONS_LOADED: 'QUESTIONS_LOADED',
  QUIZ_STARTED: 'QUIZ_STARTED',
  QUIZ_RESULT: 'QUIZ_RESULT',
  CHALLENGES_LOADED: 'CHALLENGES_LOADED',
  CHALLENGE_LOADED: 'CHALLENGE_LOADED',
  CHALLENGE_RESULT: 'CHALLENGE_RESULT',
  PRACTICALS_LOADED: 'PRACTICALS_LOADED',
  PRACTICAL_LOADED: 'PRACTICAL_LOADED',
  MOCK_EXAMS_LOADED: 'MOCK_EXAMS_LOADED',
  VIVA_LOADED: 'VIVA_LOADED',
  BOOKMARKS_LOADED: 'BOOKMARKS_LOADED',
  PROGRESS_LOADED: 'PROGRESS_LOADED',
  PRACTICE_ERROR: 'PRACTICE_ERROR',
} as const;
