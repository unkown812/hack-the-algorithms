import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AIQuestionGeneratorForm,
  AIVivaPrep,
  AILearningPlan,
} from '../../../src/webview/components/ai/AIPracticeTools';
import { AIVisualizationAssistant } from '../../../src/webview/components/ai/AIVisualizationAssistant';
import { AIMessageView } from '../../../src/webview/components/ai/AIMessage';
import type { Recommendation } from '../../../src/core/ai/features/LearningAdvisor';
import type { ExecutionStep } from '../../../src/core/visualization/types';
import type { Algorithm } from '../../../src/core/algorithms';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

const ALGORITHM = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'sorting',
  difficulty: 'Beginner',
  description: '',
  theory: '',
  problemStatement: '',
  approach: '',
  pseudocode: [],
  tags: [],
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: { auxiliary: 'O(1)' },
} as unknown as Algorithm;

const STEP: ExecutionStep = {
  id: 1,
  description: 'Compare a[0] and a[1]',
  operation: 'comparison',
  lineNumber: 3,
  currentState: {
    array: { values: [5, 2], length: 2, elementStyles: {} },
    variables: { i: 0 },
    stepIndex: 1,
    status: 'running',
  },
  comparedElements: [0, 1],
  swappedElements: [],
  explanation: '5 is greater than 2.',
  complexity: { operations: 1, comparisons: 1, swaps: 0, iterations: 1 },
};

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'revisit-sorting',
    title: 'Revisit sorting',
    reason: 'Your accuracy on sorting is 40%.',
    priority: 90,
    kind: 'topic',
    targetId: 'sorting',
  },
];

describe('practice tools', () => {
  it('renders the question generator with the review warning', () => {
    const markup = render(<AIQuestionGeneratorForm onGenerate={() => undefined} />);
    expect(markup).toContain('Practice question generator');
    expect(markup).toContain('stay drafts until you approve them');
    expect(markup).toContain('Generate questions');
    expect(markup).toContain('dynamic programming');
  });

  it('renders viva preparation and the mock exam action', () => {
    const markup = render(<AIVivaPrep onGenerate={() => undefined} />);
    expect(markup).toContain('Viva preparation');
    expect(markup).toContain('Generate viva questions');
    expect(markup).toContain('Start a mock exam');
    expect(markup).toContain('not official university examination questions');
  });

  it('renders the learning plan with its reasons and roadmap', () => {
    const markup = render(
      <AILearningPlan
        plan={{
          summary: 'Algorithms explored: 2',
          recommendations: RECOMMENDATIONS,
          roadmap: [
            { ...RECOMMENDATIONS[0], id: 'roadmap-merge', title: 'Merge Sort (sorting)' },
            { ...RECOMMENDATIONS[0], id: 'roadmap-dp', title: 'Dynamic Programming' },
          ],
        }}
        onLoad={() => undefined}
      />
    );

    expect(markup).toContain('My learning plan');
    expect(markup).toContain('Revisit sorting');
    expect(markup).toContain('Your accuracy on sorting is 40%');
    expect(markup).toContain('Merge Sort (sorting) → Dynamic Programming');
    expect(markup).toContain('Refresh plan');
  });

  it('offers to build the plan when there is no data yet', () => {
    const markup = render(<AILearningPlan onLoad={() => undefined} />);
    expect(markup).toContain('Build my plan');
    expect(markup).not.toContain('Recommended next');
  });
});

describe('visualization assistant', () => {
  it('offers the step questions and the playback commands', () => {
    const markup = render(
      <AIVisualizationAssistant
        algorithm={ALGORITHM}
        step={STEP}
        stepIndex={0}
        totalSteps={4}
        isPlaying={false}
        onNext={() => undefined}
        onPrevious={() => undefined}
        onRestart={() => undefined}
        onFirst={() => undefined}
        onLast={() => undefined}
        onPlay={() => undefined}
        onPause={() => undefined}
      />
    );

    expect(markup).toContain('Ask about this step');
    expect(markup).toContain('Step 1 of 4');
    expect(markup).toContain('Explain the current step.');
    expect(markup).toContain('Move to the next comparison.');
  });

  it('explains that no step is active before the visualization starts', () => {
    const markup = render(
      <AIVisualizationAssistant
        algorithm={ALGORITHM}
        stepIndex={0}
        totalSteps={0}
        isPlaying={false}
        onNext={() => undefined}
        onPrevious={() => undefined}
        onRestart={() => undefined}
        onFirst={() => undefined}
        onLast={() => undefined}
        onPlay={() => undefined}
        onPause={() => undefined}
      />
    );

    expect(markup).toContain('Start the visualization');
  });
});

describe('answer actions', () => {
  it('offers regenerate only when a handler is provided', () => {
    const message = {
      id: 'a1',
      role: 'assistant' as const,
      content: 'An answer.',
      createdAt: 1,
    };

    expect(render(<AIMessageView message={message} onRegenerate={() => undefined} />)).toContain('Regenerate');
    expect(render(<AIMessageView message={message} />)).not.toContain('Regenerate');
  });
});
