import { getAllAlgorithms } from '../algorithms/registry';
import { embeddingIndex } from './AIEmbeddingIndex';
import { ALL_QUESTIONS } from '../questions/QuestionRegistry';
import { PRACTICALS } from '../practicals/practicals';
import { VIVA_QUESTIONS } from '../practicals/VivaQuestionService';
import { TIME_COMPLEXITY_TOPICS, SPACE_COMPLEXITY_TOPICS } from '../complexity/learning/ComplexityTopics';
import { PROGRAM_TEMPLATES } from '../playground/templates';

/**
 * The local retrieval system.
 *
 * It searches the verified learning resources of the extension with a keyword
 * and metadata based scoring. It deliberately does not use a vector database
 * or an external service — the corpus is small, local and known, and a plain
 * keyword search is enough to find the right material.
 *
 * The retrieval is independent of the AI provider: the same documents are
 * used to ground an external answer and to answer offline.
 */

export type KnowledgeKind =
  | 'algorithm'
  | 'complexity'
  | 'practical'
  | 'viva'
  | 'question'
  | 'template';

export interface KnowledgeDocument {
  id: string;
  kind: KnowledgeKind;
  title: string;
  content: string;
  origin: string;
  reference?: string;
  /** The score of the last search. */
  score: number;
  /** Extra entries that are searched separately. */
  keywords: string[];
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'and', 'or', 'for', 'on',
  'with', 'how', 'what', 'why', 'when', 'which', 'does', 'do', 'it', 'me',
  'my', 'can', 'you', 'i', 'that', 'this', 'be', 'as', 'at', 'by', 'from',
]);

/** Splits a text into the words that carry meaning. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

let cachedDocuments: KnowledgeDocument[] | null = null;

/** Builds the knowledge base from the verified resources of the extension. */
export function buildKnowledgeBase(): KnowledgeDocument[] {
  if (cachedDocuments) {
    return cachedDocuments;
  }

  const documents: KnowledgeDocument[] = [];

  for (const algorithm of getAllAlgorithms()) {
    documents.push({
      id: `algorithm-${algorithm.id}`,
      kind: 'algorithm',
      title: `${algorithm.name} — theory`,
      content: [
        algorithm.description,
        '',
        algorithm.theory,
        '',
        `Problem: ${algorithm.problemStatement}`,
        `Approach: ${algorithm.approach}`,
        '',
        'Pseudocode:',
        ...algorithm.pseudocode,
      ].join('\n'),
      origin: 'Algorithm registry',
      reference: algorithm.id,
      score: 0,
      keywords: [
        algorithm.name.toLowerCase(),
        algorithm.id,
        ...algorithm.tags.map((tag) => tag.toLowerCase()),
        algorithm.category.toLowerCase(),
      ],
    });

    documents.push({
      id: `algorithm-${algorithm.id}-complexity`,
      kind: 'complexity',
      title: `${algorithm.name} — complexity`,
      content: [
        `Time complexity — best: ${algorithm.timeComplexity.best}, average: ${algorithm.timeComplexity.average}, worst: ${algorithm.timeComplexity.worst}.`,
        `Space complexity — auxiliary: ${algorithm.spaceComplexity.auxiliary}${
          algorithm.spaceComplexity.total
            ? `, total: ${algorithm.spaceComplexity.total}`
            : ''
        }.`,
        algorithm.detailedComplexity?.best.explanation ?? '',
        algorithm.detailedComplexity?.average.explanation ?? '',
        algorithm.detailedComplexity?.worst.explanation ?? '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      origin: 'Algorithm registry',
      reference: algorithm.id,
      score: 0,
      keywords: [
        algorithm.name.toLowerCase(),
        'complexity',
        'time complexity',
        'space complexity',
        ...algorithm.tags.map((tag) => tag.toLowerCase()),
      ],
    });
  }

  for (const topic of [...TIME_COMPLEXITY_TOPICS, ...SPACE_COMPLEXITY_TOPICS]) {
    documents.push({
      id: `complexity-${topic.id}`,
      kind: 'complexity',
      title: topic.title,
      content: [topic.summary, ...topic.keyPoints].join('\n'),
      origin: 'Complexity learning content',
      reference: topic.id,
      score: 0,
      keywords: [topic.title.toLowerCase(), topic.id.toLowerCase()],
    });
  }

  for (const practical of PRACTICALS) {
    documents.push({
      id: `practical-${practical.id}`,
      kind: 'practical',
      title: `Practical — ${practical.name}`,
      content: [
        `Aim: ${practical.aim}`,
        '',
        practical.theory,
        '',
        'Algorithm:',
        ...practical.algorithm,
        '',
        'Pseudocode:',
        ...practical.pseudocode,
        '',
        `Time complexity: ${practical.timeComplexity}`,
        `Space complexity: ${practical.spaceComplexity}`,
        '',
        `Conclusion: ${practical.conclusion}`,
      ].join('\n'),
      origin: 'Practical resources',
      reference: practical.id,
      score: 0,
      keywords: [practical.name.toLowerCase(), practical.category.toLowerCase()],
    });
  }

  for (const question of VIVA_QUESTIONS) {
    documents.push({
      id: `viva-${question.id}`,
      kind: 'viva',
      title: `Viva — ${question.question}`,
      content: `Expected answer: ${question.expectedAnswer}`,
      origin: 'Viva question bank',
      reference: question.id,
      score: 0,
      keywords: [question.topic.toLowerCase(), question.category.toLowerCase()],
    });
  }

  for (const question of ALL_QUESTIONS) {
    if (!question.explanation) {
      continue;
    }
    documents.push({
      id: `question-${question.id}`,
      kind: 'question',
      title: `Question — ${question.title}`,
      content: `${question.question}\n\n${question.explanation}`,
      origin: 'Question bank',
      reference: question.id,
      score: 0,
      keywords: [question.topic.toLowerCase(), question.category.toLowerCase()],
    });
  }

  for (const template of PROGRAM_TEMPLATES) {
    documents.push({
      id: `template-${template.id}`,
      kind: 'template',
      title: `Template — ${template.name}`,
      content: `${template.description}\n\n${template.source}`,
      origin: 'Starter templates',
      reference: template.id,
      score: 0,
      keywords: [template.name.toLowerCase()],
    });
  }

  cachedDocuments = documents;
  return documents;
}

/** The similarity a document needs to be found without a literal match. */
const SEMANTIC_MATCH_THRESHOLD = 0.25;

/** The bonus for a document whose reference the query names exactly. */
const EXACT_REFERENCE_BONUS = 6;

/** Normalises a text so that two spellings of the same name compare equal. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The options of a retrieval. */
export interface RetrievalOptions {
  limit?: number;
  kinds?: KnowledgeKind[];
  /** Minimum score a document has to reach. */
  minimumScore?: number;
  /**
   * How much the semantic similarity contributes to the score.
   * 0 disables the embedding index, 1 lets it dominate.
   */
  semanticWeight?: number;
}

export class AIRetrievalService {
  /**
   * Searches the knowledge base.
   *
   * The scoring combines two explainable parts:
   *
   * - the **keyword score**: one point per matching term, two for a matching
   *   keyword of the document, three for a matching title,
   * - the **semantic score**: the cosine similarity of the local embedding
   *   index, which finds documents that match the *meaning* of the question
   *   even when the exact words differ.
   *
   * The semantic part is scaled by the strength of the keyword signal of the
   * query. An exact match therefore always stays in front, while a question
   * that uses different words can still reach the right document.
   */
  search(query: string, options: RetrievalOptions = {}): KnowledgeDocument[] {
    const terms = tokenize(query);
    const documents = buildKnowledgeBase().filter(
      (document) => !options.kinds || options.kinds.includes(document.kind)
    );

    if (terms.length === 0) {
      return [];
    }

    const semanticWeight = options.semanticWeight ?? 0.6;
    const semanticScores =
      semanticWeight > 0 ? this.getSemanticScores(query) : new Map<string, number>();

    // The keyword part first — it decides how much the semantic part may add.
    const normalizedQuery = normalizeText(query);
    const keywordScores = documents.map((document) => {
      const haystack = `${document.title} ${document.keywords.join(' ')} ${document.content}`.toLowerCase();
      const title = document.title.toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) {
          score += 3;
        }
        if (document.keywords.some((keyword) => keyword.includes(term))) {
          score += 2;
        }
        if (haystack.includes(term)) {
          score += 1;
        }
      }

      // A query that names a resource exactly ("binary search") points at
      // that resource — the comprehensive source wins over a mention of it.
      if (document.reference && normalizeText(document.reference) === normalizedQuery) {
        score += EXACT_REFERENCE_BONUS;
      }

      return score;
    });

    const strongestKeyword = Math.max(1, ...keywordScores);

    const scored = documents.map((document, index) => {
      const similarity = semanticScores.get(document.id) ?? 0;
      const keywordScore = keywordScores[index];
      const semanticScore = similarity * semanticWeight * strongestKeyword;

      return { ...document, score: keywordScore + semanticScore };
    });

    const minimum = options.minimumScore ?? 1;
    return scored
      .filter(
        (document, index) =>
          keywordScores[index] >= minimum ||
          // A document without a literal match is still found when the
          // meaning matches clearly.
          (semanticScores.get(document.id) ?? 0) >= SEMANTIC_MATCH_THRESHOLD
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit ?? 6);
  }

  /**
   * The semantic similarity of the documents to a query.
   * The index is built once per session and then reused.
   */
  private getSemanticScores(query: string): Map<string, number> {
    const documents = buildKnowledgeBase();

    if (!embeddingIndex.isBuilt) {
      embeddingIndex.build(
        documents.map((document) => ({
          id: document.id,
          text: `${document.title} ${document.keywords.join(' ')} ${document.content}`,
        }))
      );
    }

    return embeddingIndex.search(query);
  }

  /** The documents of one algorithm — used to build the algorithm context. */
  getAlgorithmDocuments(algorithmId: string): KnowledgeDocument[] {
    return buildKnowledgeBase().filter((document) => document.reference === algorithmId);
  }

  /** All documents of one kind — used by the practice assistant. */
  getByKind(kind: KnowledgeKind): KnowledgeDocument[] {
    return buildKnowledgeBase().filter((document) => document.kind === kind);
  }
}

/** The singleton used by the services. */
export const retrievalService = new AIRetrievalService();
