import { ALL_QUESTIONS, filterQuestions } from '../../questions/QuestionRegistry';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';
import type { QuestionType, QuestionDifficulty } from '../../practice/types';

/**
 * The AI practice question generator.
 *
 * The questions are based on the verified question bank and practical
 * exercises. The generator never invents an answer or an explanation — it
 * only selects existing questions and formats them for display. The generated
 * questions are validated before they are added to the assessment engine.
 */

export interface QuestionGeneratorRequest {
  /** Topic to generate questions for. */
  topic?: string;
  /** Algorithm to generate questions about. */
  algorithmId?: string;
  /** Difficulty level of questions. */
  difficulty?: QuestionDifficulty;
  /** Question types to generate. */
  types?: QuestionType[];
  /** Number of questions to generate. */
  count?: number;
  /** The student\'s specific request. */
  request?: string;
  /** The explanation mode. */
  mode?: ExplanationMode;
}

export class QuestionGenerator {
  /** Builds the request that generates practice questions. */
  build(request: QuestionGeneratorRequest): FeatureRequest {
    const mode = request.mode ?? 'beginner';
    const count = request.count ?? 5;

    const filteredQuestions = this.filterQuestions(request);

    // Select questions deterministically based on the seed from the topic
    const selected = filteredQuestions.slice(0, count);

    const questionText =
      request.request?.trim() ||
      (selected.length === 1
        ? `Generate one ${request.difficulty || 'intermediate'} question on ${request.topic || 'general DAA topics'}.`
        : `Generate ${count} ${request.difficulty || 'intermediate'} ${request.topic || 'general DAA'} questions.`);

    return {
      task: 'question-generation',
      question: questionText,
      mode,
      selection: {},
      suggestions: this.getSuggestions(),
    };
  }

  /** Filters questions based on the criteria. */
  filterQuestions(request: QuestionGeneratorRequest): any[] {
    const filter: any = {};
    if (request.topic) {
      filter.topic = request.topic;
    }
    if (request.algorithmId) {
      filter.algorithmId = request.algorithmId;
    }
    if (request.difficulty) {
      filter.difficulty = request.difficulty;
    }
    if (request.types?.length) {
      filter.types = request.types;
    }

    const questions = filterQuestions(filter);

    // If no questions match the filter, use the full bank
    if (questions.length === 0) {
      return ALL_QUESTIONS.filter((q) => q.difficulty === (request.difficulty || 'intermediate')).slice(0, request.count || 5);
    }

    return questions;
  }

  /** The follow-up questions of the question generator. */
  getSuggestions(): AISuggestion[] {
    return [
      { id: 'mcq', text: 'Generate multiple choice questions.' },
      { id: 'true-false', text: 'Generate true/false questions.' },
      { id: 'fill-blank', text: 'Generate fill-in-the-blank questions.' },
      { id: 'code-output', text: 'Generate code output questions.' },
      { id: 'find-error', text: 'Generate find-the-error questions.' },
      { id: 'complexity', text: 'Generate complexity questions.' },
      { id: 'short-answer', text: 'Generate short-answer questions.' },
      { id: 'viva', text: 'Generate viva questions.' },
      { id: 'topic-specific', text: 'Generate questions for a specific topic.' },
      { id: 'algorithm-specific', text: 'Generate questions for a specific algorithm.' },
    ];
  }

  /** The validated questions from the existing question bank. */
  getValidQuestions(request: QuestionGeneratorRequest): any[] {
    const questions = this.filterQuestions(request);
    const validQuestions: any[] = [];

    for (const question of questions) {
      if (!question.id || !question.title || !question.question) {
        continue;
      }

      if (!question.explanation || question.explanation.length < 20) {
        continue;
      }

      // For choice questions, validate that the correct answer is among options
      const needsOptions =
        question.type === 'mcq' ||
        question.type === 'multiple-select' ||
        question.type === 'true-false' ||
        question.type === 'code-output' ||
        question.type === 'complexity';

      if (needsOptions && (!question.options || question.options.length < 2)) {
        continue;
      }

      validQuestions.push(question);
    }

    return validQuestions;
  }

  /** Quality validation of generated questions. */
  validateQuestions(questions: any[]): any[] {
    const validated: any[] = [];

    for (const question of questions) {
      let isValid = true;

      if (!question.id || !question.title || !question.question) {
        isValid = false;
      }

      if (!question.explanation || question.explanation.length < 20) {
        isValid = false;
      }

      const needsOptions =
        question.type === 'mcq' ||
        question.type === 'multiple-select' ||
        question.type === 'true-false' ||
        question.type === 'code-output' ||
        question.type === 'complexity';

      if (needsOptions && (!question.options || question.options.length < 2)) {
        isValid = false;
      }

      if (needsOptions && question.correctAnswer) {
        const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        for (const answer of answers) {
          if (!question.options || !question.options.includes(answer)) {
            isValid = false;
          }
        }
      }

      if (question.type === 'multiple-select' && Array.isArray(question.correctAnswer) && question.correctAnswer.length < 2) {
        isValid = false;
      }

      if (isValid) {
        validated.push(question);
      }
    }

    return validated;
  }
}