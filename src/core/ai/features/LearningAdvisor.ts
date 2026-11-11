import { getAllAlgorithms } from '../../algorithms/registry';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';
import type { LearningData } from '../../practice/types';
import { PRACTICALS } from '../../practicals/practicals';

/**
 * The AI personalized learning advisor.
 *
 * The recommendations are based on the student\'s recorded progress —
 * which algorithms they explored, which questions they answered correctly or
 * incorrectly, which coding challenges they solved, and which practicals they
 * completed. The advisor never invents a progress metric or a score.
 */

export interface LearningAdvisorRequest {
  /** The student\'s learning data from Phase 6. */
  learningData?: LearningData;
  /** Specific question about learning path. */
  question?: string;
  /** The explanation mode. */
  mode?: ExplanationMode;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: number;
  kind: 'topic' | 'question' | 'challenge' | 'algorithm' | 'resource';
  targetId?: string;
}

export class LearningAdvisor {
  /** Builds the request that generates learning recommendations. */
  build(request: LearningAdvisorRequest): FeatureRequest {
    const mode = request.mode ?? 'beginner';
    const data = request.learningData;

    const recommendations = data ? this.generateRecommendations(data) : [];

    const question =
      request.question?.trim() ||
      (recommendations.length > 0
        ? 'Here are the personalized learning recommendations based on the student\'s progress.'
        : 'No learning data available. Suggest a learning roadmap for a beginner.');

    return {
      task: 'learning-advice',
      question,
      mode,
      selection: {},
      suggestions: this.getSuggestions(),
    };
  }

  /** Generates personalized recommendations from learning data. */
  generateRecommendations(data: LearningData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Recommend revisiting topics with low accuracy
    for (const [topicId, progress] of Object.entries(data.topicProgress)) {
      if (progress.questionsAttempted > 0) {
        const accuracy = progress.correctAnswers / progress.questionsAttempted;
        if (accuracy < 0.6) {
          recommendations.push({
            id: `revisit-${topicId}`,
            title: `Revisit ${topicId.replace('-', ' ')}`,
            reason: `Your accuracy on ${topicId} is ${Math.round(accuracy * 100)}%. Review the theory and try more questions.`,
            priority: 90,
            kind: 'topic',
            targetId: topicId,
          });
        }
      }
    }

    // 2. Recommend questions that were answered incorrectly multiple times
    for (const [questionId, wrongCount] of Object.entries(data.wrongAnswers)) {
      if (wrongCount >= 2) {
        recommendations.push({
          id: `practice-${questionId}`,
          title: `Practice question ${questionId}`,
          reason: `You answered this question incorrectly ${wrongCount} time(s).`,
          priority: 80,
          kind: 'question',
          targetId: questionId,
        });
      }
    }

    // 3. Recommend algorithms that haven't been explored but are prerequisites
    const algorithms = getAllAlgorithms();
    const explored = new Set(data.exploredAlgorithms);
    const categoryOrder = [
      'fundamentals',
      'searching',
      'sorting',
      'divide-and-conquer',
      'greedy',
      'dynamic-programming',
      'graph',
      'backtracking',
      'branch-and-bound',
      'string-matching',
    ];

    for (const category of categoryOrder) {
      const categoryAlgos = algorithms.filter((a) => a.category === category);
      const exploredInCategory = categoryAlgos.filter((a) => explored.has(a.id)).length;

      if (exploredInCategory === 0 && categoryAlgos.length > 0) {
        const nextAlgo = categoryAlgos[0];
        recommendations.push({
          id: `explore-${nextAlgo.id}`,
          title: `Explore ${nextAlgo.name}`,
          reason: `You haven't explored any ${category} algorithms yet. Start with ${nextAlgo.name}.`,
          priority: 70 - categoryOrder.indexOf(category) * 5,
          kind: 'algorithm',
          targetId: nextAlgo.id,
        });
        break;
      }
    }

    // 4. Recommend practical exercises that haven't been completed
    const completedPracticals = new Set(
      data.practicalSessions.filter((s) => s.status === 'completed').map((s) => s.practicalId)
    );
    if (completedPracticals.size < PRACTICALS.length) {
      const nextPractical = PRACTICALS.find((p) => !completedPracticals.has(p.id));
      if (nextPractical) {
        recommendations.push({
          id: `practical-${nextPractical.id}`,
          title: `Complete practical: ${nextPractical.name}`,
          reason: `You have completed ${completedPracticals.size} of ${PRACTICALS.length} practical exercises.`,
          priority: 50,
          kind: 'resource',
          targetId: nextPractical.id,
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /** Builds a learning roadmap based on prerequisites. */
  buildRoadmap(data: LearningData): Recommendation[] {
    const roadmap: Recommendation[] = [];
    const algorithms = getAllAlgorithms();
    const explored = new Set(data.exploredAlgorithms);

    const prerequisiteOrder: string[][] = [
      ['fundamentals'],
      ['searching'],
      ['sorting'],
      ['divide-and-conquer'],
      ['greedy'],
      ['dynamic-programming'],
      ['graph'],
      ['backtracking'],
      ['branch-and-bound'],
      ['string-matching'],
    ];

    let priority = 100;
    for (const level of prerequisiteOrder) {
      for (const category of level) {
        const categoryAlgos = algorithms.filter((a) => a.category === category);
        for (const algo of categoryAlgos) {
          if (!explored.has(algo.id)) {
            roadmap.push({
              id: `roadmap-${algo.id}`,
              title: `${algo.name} (${category})`,
              reason: `${category} is a prerequisite for advanced topics.`,
              priority,
              kind: 'algorithm',
              targetId: algo.id,
            });
            priority -= 5;
          }
        }
      }
    }

    return roadmap;
  }

  /** The follow-up questions of the learning advisor. */
  getSuggestions(): AISuggestion[] {
    return [
      { id: 'next-topic', text: 'What topic should I study next?' },
      { id: 'weak-areas', text: 'Which areas am I weak in?' },
      { id: 'roadmap', text: 'Show me a learning roadmap for DAA.' },
      { id: 'practice-weak', text: 'Generate practice questions for my weak topics.' },
      { id: 'prerequisites', text: 'What are the prerequisites for dynamic programming?' },
      { id: 'exam-prep', text: 'Help me prepare for the practical exam.' },
      { id: 'viva-prep', text: 'What viva questions should I prepare?' },
      { id: 'mock-exam', text: 'Generate a mock practical exam for me.' },
    ];
  }

  /** Summarizes the learning data for the context. */
  summarizeProgress(data: LearningData): string {
    const parts: string[] = [];

    parts.push(`Algorithms explored: ${data.exploredAlgorithms.length}`);
    parts.push(`Questions answered: ${data.statistics.questionsAnswered}`);
    parts.push(`Quiz accuracy: ${data.statistics.quizAccuracyTotal.toFixed(1)}%`);
    parts.push(`Challenges accepted: ${data.statistics.challengesAccepted} / ${data.statistics.challengesAttempted}`);
    parts.push(`Practicals completed: ${data.practicalSessions.filter((s) => s.status === 'completed').length}`);
    parts.push(`Mock exams passed: ${data.mockExams.filter((m) => m.passed).length} / ${data.mockExams.length}`);

    const weakTopics: string[] = [];
    for (const [topicId, progress] of Object.entries(data.topicProgress)) {
      if (progress.questionsAttempted > 5) {
        const accuracy = progress.correctAnswers / progress.questionsAttempted;
        if (accuracy < 0.6) {
          weakTopics.push(`${topicId} (${Math.round(accuracy * 100)}%)`);
        }
      }
    }
    if (weakTopics.length > 0) {
      parts.push(`Weak topics: ${weakTopics.join(', ')}`);
    }

    return parts.join('\n');
  }
}
