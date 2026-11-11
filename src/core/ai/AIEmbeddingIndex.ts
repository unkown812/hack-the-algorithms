import { tokenize } from './AIRetrievalService';

/**
 * A local embedding index for the retrieval.
 *
 * The corpus of the extension is small, local and known, so a vector index
 * can be built in memory — no external embedding service, no vector
 * database, no network access.
 *
 * The embedding of a document is a sparse, hashed vector:
 *
 * - every token contributes to a word bucket,
 * - every character trigram contributes to a character bucket,
 * - the buckets are weighted with the inverse document frequency, so common
 *   words ("algorithm", "the") count less than rare ones ("recurrence"),
 * - the vector is normalised, so the cosine similarity is a plain dot
 *   product.
 *
 * The result catches matches that a keyword search misses: a question about
 * "halving the search range" finds "binary search" through the shared
 * character trigrams of "halving"/"binary" and through the topic words of
 * the document, even when the exact terms differ.
 */

const WORD_BUCKETS = 4096;
const CHAR_BUCKETS = 8192;

/** The number of buckets a term is hashed into. */
const WORD_PROJECTIONS = 2;
const CHAR_PROJECTIONS = 2;

/** A sparse vector: bucket index → weight. */
export type SparseVector = Map<number, number>;

export interface EmbeddingDocument {
  id: string;
  vector: SparseVector;
}

/** Hashes a string into a bucket index. */
function hash(value: string, seed: number): number {
  let hashValue = 2166136261 ^ seed;
  for (let i = 0; i < value.length; i += 1) {
    hashValue ^= value.charCodeAt(i);
    hashValue = Math.imul(hashValue, 16777619);
  }
  return (hashValue >>> 0) % 100000;
}

/** The character trigrams of a word. */
function trigrams(word: string): string[] {
  const padded = `  ${word} `;
  const result: string[] = [];
  for (let i = 0; i < padded.length - 2; i += 1) {
    result.push(padded.slice(i, i + 3));
  }
  return result;
}

/**
 * Builds the sparse embedding of a text.
 * The document frequency is needed for the inverse-document-frequency
 * weighting, so it is passed in.
 */
export function embed(
  text: string,
  documentFrequency: Map<string, number>,
  totalDocuments: number
): SparseVector {
  const vector: SparseVector = new Map();
  const words = tokenize(text);

  for (const word of words) {
    const frequency = documentFrequency.get(word) ?? 0;
    const idf = Math.log((totalDocuments + 1) / (frequency + 1)) + 1;

    for (let projection = 0; projection < WORD_PROJECTIONS; projection += 1) {
      const bucket =
        (hash(word, projection * 7919) % WORD_BUCKETS) +
        projection * WORD_BUCKETS;
      vector.set(bucket, (vector.get(bucket) ?? 0) + idf);
    }

    for (const gram of trigrams(word)) {
      for (let projection = 0; projection < CHAR_PROJECTIONS; projection += 1) {
        const bucket =
          WORD_BUCKETS +
          (hash(gram, projection * 104729) % CHAR_BUCKETS) +
          projection * CHAR_BUCKETS;
        // The character features are damped: they support the keyword score,
        // but they must not dominate it.
        vector.set(bucket, (vector.get(bucket) ?? 0) + idf * 0.35);
      }
    }
  }

  return normalize(vector);
}

/** Normalises a vector so that the dot product is the cosine similarity. */
function normalize(vector: SparseVector): SparseVector {
  let sumOfSquares = 0;
  for (const weight of vector.values()) {
    sumOfSquares += weight * weight;
  }
  const length = Math.sqrt(sumOfSquares);
  if (length === 0) {
    return vector;
  }
  for (const [bucket, weight] of vector) {
    vector.set(bucket, weight / length);
  }
  return vector;
}

/** The cosine similarity of two sparse vectors. */
export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [bucket, weight] of smaller) {
    const other = larger.get(bucket);
    if (other !== undefined) {
      dot += weight * other;
    }
  }
  return dot;
}

/**
 * The in-memory index of the knowledge base.
 *
 * It is built once and reused — the corpus only changes when the extension
 * is updated, which means a new session.
 */
export class AIEmbeddingIndex {
  private documents: EmbeddingDocument[] = [];
  private readonly vectors = new Map<string, SparseVector>();
  private documentFrequency = new Map<string, number>();
  private built = false;

  /**
   * Builds the index from the documents of the knowledge base.
   * `text` of a document is the text that is embedded.
   */
  build(items: Array<{ id: string; text: string }>): void {
    const documentFrequency = new Map<string, number>();

    for (const item of items) {
      for (const word of new Set(tokenize(item.text))) {
        documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
      }
    }

    this.documentFrequency = documentFrequency;
    this.vectors.clear();
    this.documents = items.map((item) => {
      const vector = embed(item.text, documentFrequency, items.length);
      this.vectors.set(item.id, vector);
      return { id: item.id, vector };
    });

    this.built = true;
  }

  /** Whether the index has been built. */
  get isBuilt(): boolean {
    return this.built;
  }

  /**
   * The similarity of a query to every document of the index.
   *
   * The query is embedded once with the weights of the corpus, so the
   * comparison is a plain dot product per document.
   */
  search(query: string): Map<string, number> {
    const scores = new Map<string, number>();
    if (!this.built || this.documents.length === 0) {
      return scores;
    }

    const queryVector = embed(query, this.documentFrequency, this.documents.length);

    for (const document of this.documents) {
      scores.set(document.id, Math.max(0, cosineSimilarity(queryVector, document.vector)));
    }

    return scores;
  }
}

/** The singleton used by the retrieval service. */
export const embeddingIndex = new AIEmbeddingIndex();
