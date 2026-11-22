import { getAlgorithmById } from '../algorithms/registry';
import { BUBBLE_SORT_CODE } from '../code-data/bubble-sort-code-data';
import { BINARY_SEARCH_CODE } from '../code-data/binary-search-code-data';
import { LINEAR_SEARCH_CODE } from '../code-data/linear-search-code-data';
import { SELECTION_SORT_CODE } from '../code-data/selection-sort-code-data';
import { INSERTION_SORT_CODE } from '../code-data/insertion-sort-code-data';
import { MERGE_SORT_CODE } from '../code-data/merge-sort-code-data';
import { QUICK_SORT_CODE } from '../code-data/quick-sort-code-data';

/**
 * Registry of the reviewed reference implementations.
 *
 * The playground uses them for the side-by-side comparison: the student code
 * and the reference code are compiled and executed separately with the same
 * input, and their outputs are compared. Sharing an algorithm name never
 * implies that two implementations behave identically — only the test results
 * show that.
 */

export interface ReferenceImplementation {
  algorithmId: string;
  algorithmName: string;
  sourceCode: string;
  pseudocode: string[];
  /** The reviewed complexity classes of the algorithm. */
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: { auxiliary: string; total?: string };
  approach: string;
  logicBlocks: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    sourceCode: string;
    explanation: string;
  }>;
}

interface CodeDataEntry {
  sourceCode: string;
  logicBlocks: ReferenceImplementation['logicBlocks'];
}

const CODE_DATA: Record<string, CodeDataEntry> = {
  'bubble-sort': BUBBLE_SORT_CODE,
  'selection-sort': SELECTION_SORT_CODE,
  'insertion-sort': INSERTION_SORT_CODE,
  'merge-sort': MERGE_SORT_CODE,
  'quick-sort': QUICK_SORT_CODE,
  'linear-search': LINEAR_SEARCH_CODE,
  'binary-search': BINARY_SEARCH_CODE,
};

/** The algorithms that have a reviewed reference implementation. */
export function getReferenceAlgorithmIds(): string[] {
  return Object.keys(CODE_DATA);
}

/** Returns the reference implementation of an algorithm, when there is one. */
export function getReferenceImplementation(algorithmId: string): ReferenceImplementation | null {
  const codeData = CODE_DATA[algorithmId];
  const algorithm = getAlgorithmById(algorithmId);

  if (!codeData || !algorithm) {
    return null;
  }

  return {
    algorithmId,
    algorithmName: algorithm.name,
    sourceCode: codeData.sourceCode,
    pseudocode: algorithm.pseudocode,
    timeComplexity: algorithm.timeComplexity,
    spaceComplexity: algorithm.spaceComplexity,
    approach: algorithm.approach,
    logicBlocks: codeData.logicBlocks.map((block) => ({
      ...block,
      description: block.description ?? '',
    })),
  };
}
