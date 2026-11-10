import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PracticePage } from '../../../src/webview/pages/PracticePage';
import { QuizPage } from '../../../src/webview/pages/QuizPage';
import { CodingChallengesPage } from '../../../src/webview/pages/CodingChallengesPage';
import { PracticalPreparationPage } from '../../../src/webview/pages/PracticalPreparationPage';
import { LearningProgressPage } from '../../../src/webview/pages/LearningProgressPage';
import { PracticeDashboard } from '../../../src/webview/components/practice/PracticeDashboard';
import { QuestionCard } from '../../../src/webview/components/quizzes/QuizWorkspace';
import { QuestionNavigator, QuizTimer } from '../../../src/webview/components/quizzes/QuizWorkspace';
import { QuizResultView } from '../../../src/webview/components/quizzes/QuizResult';
import { ChallengeExplorer } from '../../../src/webview/components/challenges/ChallengeExplorer';
import { PracticalPreparation } from '../../../src/webview/components/practicals/PracticalPreparation';
import { LearningDashboard } from '../../../src/webview/components/progress/LearningDashboard';
import { getQuestionById } from '../../../src/core/questions/QuestionRegistry';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

describe('practice centre pages render', () => {
  it('renders the practice centre', () => {
    const markup = render(
      <PracticePage
        onOpenQuiz={() => undefined}
        onOpenChallenges={() => undefined}
        onOpenPracticals={() => undefined}
        onOpenProgress={() => undefined}
        onBack={() => undefined}
      />
    );

    expect(markup).toContain('Practice Centre');
  });

  it('renders the quiz page', () => {
    const markup = render(<QuizPage onBack={() => undefined} />);
    expect(markup.length).toBeGreaterThan(50);
  });

  it('renders the coding challenges page', () => {
    const markup = render(<CodingChallengesPage onBack={() => undefined} />);
    expect(markup).toContain('Coding challenges');
  });

  it('renders the practical preparation page', () => {
    const markup = render(<PracticalPreparationPage onBack={() => undefined} />);
    expect(markup).toContain('Practical preparation');
  });

  it('renders the progress page', () => {
    const markup = render(<LearningProgressPage onBack={() => undefined} />);
    expect(markup).toContain('My progress');
  });
});

describe('practice components render', () => {
  const overview = {
    questionCount: 79,
    challengeCount: 23,
    practicalCount: 10,
    vivaCount: 26,
    mockExamCount: 4,
    categories: [{ id: 'sorting', label: 'Sorting Algorithms', category: 'sorting' }],
    presets: [
      { id: 'preset-quick', title: 'Quick Quiz', questionCount: 5, mode: 'learning' as const },
    ],
    bankIssues: 0,
  };

  it('renders the dashboard with the quick practice buttons', () => {
    const markup = render(
      <PracticeDashboard
        overview={overview}
        onStartQuiz={() => undefined}
        onOpenTopic={() => undefined}
        onOpenChallenges={() => undefined}
        onOpenPracticals={() => undefined}
        onOpenProgress={() => undefined}
        onOpenQuizBuilder={() => undefined}
      />
    );

    expect(markup).toContain('Quick Quiz');
    expect(markup).toContain('Coding challenges');
  });

  it('renders a question with its options', () => {
    const question = getQuestionById('fund-001')!;
    const markup = render(
      <QuestionCard
        entry={{ question, answered: false, correct: false, marks: 0, marked: false }}
        index={0}
        total={5}
        mode="learning"
        onAnswer={() => undefined}
        onToggleMark={() => undefined}
        submitted={false}
      />
    );

    expect(markup).toContain('Question 1 of 5');
    expect(markup).toContain(question.question);
  });

  it('shows the explanation after an answer in the learning mode', () => {
    const question = getQuestionById('fund-001')!;
    const markup = render(
      <QuestionCard
        entry={{
          question,
          answered: true,
          correct: true,
          marks: 1,
          marked: false,
        }}
        index={0}
        total={5}
        mode="learning"
        onAnswer={() => undefined}
        onToggleMark={() => undefined}
        submitted={false}
      />
    );

    expect(markup).toContain('Correct');
    expect(markup).toContain('An algorithm');
  });

  it('renders the timer and the question navigator', () => {
    const timer = render(<QuizTimer remainingSeconds={125} totalSeconds={900} />);
    expect(timer).toContain('02:05');

    const noTimer = render(<QuizTimer />);
    expect(noTimer).toContain('No time limit');

    const question = getQuestionById('fund-001')!;
    const navigator = render(
      <QuestionNavigator
        entries={[
          { question, answered: true, correct: true, marks: 1, marked: false },
          { question, answered: false, correct: false, marks: 0, marked: true },
        ]}
        currentIndex={0}
        onSelect={() => undefined}
      />
    );

    expect(navigator.length).toBeGreaterThan(50);
  });

  it('renders the quiz result', () => {
    const question = getQuestionById('fund-001')!;
    const markup = render(
      <QuizResultView
        result={{
          attempt: {
            id: 'a1',
            quizId: 'q',
            quizTitle: 'Quiz',
            mode: 'learning',
            startedAt: 1,
            completedAt: 2,
            status: 'completed',
            answers: {},
            questionIds: [question.id],
            markedQuestionIds: [],
          },
          questions: [
            { question, answered: true, correct: true, marks: 1, marked: false },
          ],
          correctCount: 1,
          incorrectCount: 0,
          unansweredCount: 0,
          score: 1,
          maxScore: 1,
          accuracy: 100,
          durationSeconds: 30,
          topicBreakdown: {},
          recommendedRevision: [],
        }}
        onRestart={() => undefined}
        onBack={() => undefined}
      />
    );

    expect(markup).toContain('1 / 1');
    expect(markup).toContain('Correct');
  });

  it('renders the challenge explorer', () => {
    const markup = render(
      <ChallengeExplorer
        challenges={[]}
        selected={null}
        onSelect={() => undefined}
        source=""
        onSourceChange={() => undefined}
        onSubmit={() => undefined}
        onShowSolution={() => undefined}
        submission={null}
        feedback=""
        isRunning={false}
      />
    );

    expect(markup).toContain('Select a challenge');
  });

  it('renders the practical preparation', () => {
    const markup = render(
      <PracticalPreparation
        practicals={[
          {
            id: 'prac-binary-search',
            name: 'Binary Search',
            category: 'searching',
            aim: 'To search a key element in a sorted array.',
            problemStatement: 'Binary Search',
            timeComplexity: 'O(log n)',
            spaceComplexity: 'O(1)',
            vivaCount: 3,
          },
        ]}
        selected={null}
        onSelect={() => undefined}
        mockExams={[]}
        vivaQuestions={[]}
        onPickViva={() => undefined}
      />
    );

    expect(markup).toContain('Mock practical examinations');
    expect(markup).toContain('Binary Search');
  });

  it('renders the learning dashboard', () => {
    const markup = render(
      <LearningDashboard
        progress={{
          statistics: {
            algorithmsExplored: 2,
            quizzesCompleted: 3,
            quizAccuracyTotal: 80,
            challengesAttempted: 4,
            challengesAccepted: 2,
            questionsAnswered: 30,
            questionsCorrect: 24,
            topicsExplored: 5,
            practicalsCompleted: 1,
            totalSessions: 10,
            activityByDay: { '2026-11-10': 3 },
          },
          performance: {
            topics: [
              {
                topicId: 'sorting',
                label: 'Sorting Algorithms',
                attempted: 8,
                correct: 7,
                accuracy: 87.5,
                status: 'strong',
                challengesAttempted: 2,
                challengesAccepted: 1,
                practicalsCompleted: 1,
              },
            ],
            strongTopics: [],
            weakTopics: [],
            frequentMistakes: [],
            overallAccuracy: 80,
          },
          recommendations: [
            {
              id: 'rec-1',
              title: 'Revise Binary Search',
              reason: 'You answered this question wrong 3 times.',
              priority: 1,
              kind: 'question',
            },
          ],
          achievements: [{ id: 'ach-first-quiz', earnedAt: 1 }],
          bookmarks: [],
          allAchievements: [
            {
              id: 'ach-first-quiz',
              name: 'First Quiz Completed',
              description: 'Finish your first quiz.',
              criteria: { metric: 'quizzesCompleted', threshold: 1 },
            },
          ],
        }}
        onReset={() => undefined}
        onExport={() => undefined}
      />
    );

    expect(markup).toContain('Topic progress');
    expect(markup).toContain('Revise Binary Search');
    expect(markup).toContain('First Quiz Completed');
  });
});
