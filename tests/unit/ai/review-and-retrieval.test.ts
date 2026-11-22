import { describe, expect, it } from 'vitest';
import { QuestionDraftService } from '../../../src/core/ai/QuestionDraftService';
import {
  extractJsonArray,
  parseGeneratedQuestions,
} from '../../../src/core/ai/QuestionJsonParser';
import { AIEmbeddingIndex, embed, cosineSimilarity } from '../../../src/core/ai/AIEmbeddingIndex';
import { retrievalService } from '../../../src/core/ai/AIRetrievalService';
import { createEmptyLearningData } from '../../../src/core/storage/LearningDataStore';
import type { AIQuestionDraft } from '../../../src/core/ai/types';

function createService() {
  let stored: AIQuestionDraft[] = [];
  const service = new QuestionDraftService({
    read: () => stored,
    write: (drafts) => {
      stored = drafts;
    },
  });
  return {
    service,
    getDrafts: () => stored,
  };
}

const VALID_CANDIDATE: Partial<AIQuestionDraft> = {
  title: 'Stable sorting',
  question: 'Which of these sorting algorithms is stable?',
  type: 'mcq',
  options: ['Quick sort', 'Merge sort', 'Heap sort'],
  correctAnswer: 'Merge sort',
  explanation:
    'Merge sort preserves the relative order of equal elements, quick sort does not.',
  topic: 'sorting',
  category: 'sorting',
  difficulty: 'intermediate',
};

describe('question draft review workflow', () => {
  it('accepts a well-formed question as a pending draft', () => {
    const { service, getDrafts } = createService();
    const result = service.add([VALID_CANDIDATE], 'openai');

    expect(result.drafts).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
    expect(getDrafts()[0].status).toBe('pending');
    expect(getDrafts()[0].provider).toBe('openai');
  });

  it('rejects a question whose answer is not among the options', () => {
    const { service } = createService();
    const result = service.add(
      [{ ...VALID_CANDIDATE, correctAnswer: 'Selection sort' }],
      'openai'
    );

    expect(result.drafts).toHaveLength(0);
    expect(result.rejected[0].issues.some((issue) => issue.kind === 'answer-not-in-options')).toBe(true);
  });

  it('rejects a question with a short explanation', () => {
    const { service } = createService();
    const result = service.add([{ ...VALID_CANDIDATE, explanation: 'Short.' }], 'openai');

    expect(result.drafts).toHaveLength(0);
    expect(result.rejected[0].issues.some((issue) => issue.kind === 'short-explanation')).toBe(true);
  });

  it('rejects a question without an explanation', () => {
    const { service } = createService();
    const result = service.add([{ ...VALID_CANDIDATE, explanation: '' }], 'openai');
    expect(result.rejected[0].issues.some((issue) => issue.kind === 'missing-explanation')).toBe(true);
  });

  it('rejects a duplicate of an existing draft', () => {
    const { service } = createService();
    service.add([VALID_CANDIDATE], 'openai');
    const result = service.add([VALID_CANDIDATE], 'openai');

    expect(result.drafts).toHaveLength(0);
    expect(result.rejected[0].issues.some((issue) => issue.kind === 'duplicate')).toBe(true);
  });

  it('only allows approved drafts to be used', () => {
    const { service } = createService();
    const { drafts } = service.add([VALID_CANDIDATE], 'openai');

    expect(service.listApproved()).toHaveLength(0);

    service.approve(drafts[0].id);
    expect(service.listApproved()).toHaveLength(1);
    expect(service.listApproved()[0].status).toBe('approved');
  });

  it('keeps a rejected draft with its note', () => {
    const { service } = createService();
    const { drafts } = service.add([VALID_CANDIDATE], 'openai');

    service.reject(drafts[0].id, 'The explanation is misleading.');

    const stored = service.list()[0];
    expect(stored.status).toBe('rejected');
    expect(stored.reviewNote).toBe('The explanation is misleading.');
    expect(service.listApproved()).toHaveLength(0);
  });

  it('removes a draft and clears the rejected ones', () => {
    const { service } = createService();
    const { drafts } = service.add([VALID_CANDIDATE], 'openai');

    expect(service.remove(drafts[0].id)).toBe(true);
    expect(service.list()).toHaveLength(0);
    expect(service.remove('unknown')).toBe(false);

    service.add([VALID_CANDIDATE], 'openai');
    service.reject(service.list()[0].id);
    expect(service.clearRejected()).toBe(1);
    expect(service.list()).toHaveLength(0);
  });

  it('never writes into the verified question bank', () => {
    const { service } = createService();
    service.add([VALID_CANDIDATE], 'openai');
    service.approve(service.list()[0].id);

    // The verified bank of Phase 6 is untouched — the drafts live in their
    // own store.
    const data = createEmptyLearningData();
    expect(data.assessments).toHaveLength(0);
    expect(service.listApproved()[0].tags).not.toContain('verified');
  });
});

describe('question JSON parser', () => {
  it('finds the JSON array inside an answer', () => {
    const json = extractJsonArray(
      'Here are the questions:\n```json\n[{"title":"A"}]\n```\nEnjoy!'
    );
    expect(json).toContain('"title"');
  });

  it('reads the questions of a well-formed answer', () => {
    const parsed = parseGeneratedQuestions(
      JSON.stringify([
        {
          title: 'Stable sorting',
          question: 'Which sorting algorithm is stable?',
          type: 'mcq',
          options: ['Quick sort', 'Merge sort'],
          correctAnswer: 'Merge sort',
          explanation: 'Merge sort preserves the relative order of equal elements.',
          topic: 'sorting',
          difficulty: 'intermediate',
        },
      ])
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0].candidate.title).toBe('Stable sorting');
    expect(parsed[0].issues).toHaveLength(0);
  });

  it('reports the problems of a question without an answer', () => {
    const parsed = parseGeneratedQuestions('[{"title":"A","question":"Q?"}]');
    expect(parsed[0].issues.length).toBeGreaterThan(0);
  });

  it('returns nothing when the answer has no JSON', () => {
    expect(parseGeneratedQuestions('I cannot write questions right now.')).toHaveLength(0);
  });

  it('tolerates single quotes and code fences', () => {
    const parsed = parseGeneratedQuestions(
      '```json\n[{\'title\':\'A\',\'question\':\'Q?\',\'correctAnswer\':\'A\',\'explanation\':\'Because of the invariant of the loop.\'}]\n```'
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].candidate.title).toBe('A');
  });
});

describe('embedding index', () => {
  it('gives a higher similarity to related texts', () => {
    const documents = [
      { id: 'binary', text: 'binary search halves the search interval until the target is found' },
      { id: 'bubble', text: 'bubble sort repeatedly swaps neighbouring elements that are out of order' },
    ];

    const index = new AIEmbeddingIndex();
    index.build(documents);

    const scores = index.search('halving the search range');
    expect(scores.get('binary')).toBeGreaterThan(scores.get('bubble') ?? 0);
  });

  it('returns no scores before the index is built', () => {
    const index = new AIEmbeddingIndex();
    expect(index.isBuilt).toBe(false);
    expect(index.search('anything').size).toBe(0);
  });

  it('produces a normalised vector', () => {
    const vector = embed('merge sort divides the array', new Map(), 1);
    let sumOfSquares = 0;
    for (const weight of vector.values()) {
      sumOfSquares += weight * weight;
    }
    expect(Math.sqrt(sumOfSquares)).toBeCloseTo(1, 5);
  });

  it('computes the similarity of two identical vectors', () => {
    const vector = embed('quick sort', new Map(), 1);
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });
});

describe('hybrid retrieval', () => {
  it('finds the algorithm even when the question uses other words', () => {
    const results = retrievalService.search('halving the search range until the target is found');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((document) => document.reference === 'binary-search')
    ).toBe(true);
  });

  it('keeps the keyword ranking for an exact term', () => {
    const results = retrievalService.search('merge sort');
    const references = results.map((document) => document.reference);

    // The comprehensive source comes first, the related questions follow and
    // an unrelated algorithm never reaches the top.
    expect(references[0]).toBe('merge-sort');
    expect(references[1]).toBe('merge-sort');
    expect(references).toContain('sort-007');
  });

  it('does not let a weak semantic match beat a literal one', () => {
    const results = retrievalService.search('binary search');
    const references = results.map((document) => document.reference);

    // The algorithm document is found, and every top hit is about the
    // searched algorithm — an unrelated algorithm never wins.
    expect(references[0]).toBe('binary-search');
    expect(references[1]).toBe('binary-search');
  });

  it('can be limited to a kind', () => {
    const results = retrievalService.search('merge sort', { kinds: ['practical'] });
    for (const document of results) {
      expect(document.kind).toBe('practical');
    }
  });
});
