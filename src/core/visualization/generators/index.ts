import { visualizationEngine } from '../engine/VisualizationEngine';
import {
  BUBBLE_SORT_GENERATOR,
  SELECTION_SORT_GENERATOR,
  INSERTION_SORT_GENERATOR,
  MERGE_SORT_GENERATOR,
  QUICK_SORT_GENERATOR,
} from './sorting';
import {
  LINEAR_SEARCH_GENERATOR,
  BINARY_SEARCH_GENERATOR,
} from './searching';

visualizationEngine.registerGenerator('bubble-sort', BUBBLE_SORT_GENERATOR);
visualizationEngine.registerGenerator('selection-sort', SELECTION_SORT_GENERATOR);
visualizationEngine.registerGenerator('insertion-sort', INSERTION_SORT_GENERATOR);
visualizationEngine.registerGenerator('merge-sort', MERGE_SORT_GENERATOR);
visualizationEngine.registerGenerator('quick-sort', QUICK_SORT_GENERATOR);
visualizationEngine.registerGenerator('linear-search', LINEAR_SEARCH_GENERATOR);
visualizationEngine.registerGenerator('binary-search', BINARY_SEARCH_GENERATOR);

export { visualizationEngine };
