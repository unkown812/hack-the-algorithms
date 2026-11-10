import { FunctionComponent, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AlgorithmLibrary } from './pages/AlgorithmLibrary';
import { AlgorithmDetail } from './pages/AlgorithmDetail';
import { AlgorithmVisualizer } from './pages/AlgorithmVisualizer';
import { ComplexityAnalyzerPage } from './pages/ComplexityAnalyzerPage';
import { PerformanceLabPage } from './pages/PerformanceLabPage';
import { AlgorithmComparisonPage } from './pages/AlgorithmComparisonPage';
import { CodePlaygroundPage } from './pages/CodePlaygroundPage';
import { PracticePage } from './pages/PracticePage';
import { QuizPage } from './pages/QuizPage';
import { CodingChallengesPage } from './pages/CodingChallengesPage';
import { PracticalPreparationPage } from './pages/PracticalPreparationPage';
import { LearningProgressPage } from './pages/LearningProgressPage';
import type { QuizConfig } from '../core/practice/types';
import { postToExtension, onExtensionMessage } from './utils';
import type { Algorithm } from '../core/algorithms';

type View =
  | 'dashboard'
  | 'library'
  | 'detail'
  | 'visualizer'
  | 'analyzer'
  | 'performance'
  | 'comparison'
  | 'playground'
  | 'practice'
  | 'quiz'
  | 'challenges'
  | 'practicals'
  | 'progress';

export const App: FunctionComponent = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | undefined>(undefined);

  useEffect(() => {
    postToExtension({ type: 'GET_ALGORITHMS' });

    const handler = (event: MessageEvent) => {
      const message = event.data as { type: string; payload?: unknown };
      switch (message.type) {
      case 'ALGORITHMS_DATA': {
        setAlgorithms(message.payload as Algorithm[]);
        setLoading(false);
        break;
      }
      case 'ALGORITHM_DETAIL': {
        setSelectedAlgorithm(message.payload as Algorithm | undefined);
        setView('detail');
        break;
      }
      case 'OPEN_VIEW': {
        const payload = message.payload as { view?: string } | undefined;
        if (payload?.view === 'practice') {
          setView('practice');
        }
        break;
      }
      default:
        break;
      }
    };

    onExtensionMessage(handler);
  }, []);

  const handleSelectAlgorithm = (id: string) => {
    const algo = algorithms.find((a: Algorithm) => a.id === id);
    if (algo) {
      postToExtension({ type: 'GET_ALGORITHM_DETAIL', payload: { algorithmId: id } });
      setSelectedAlgorithm(algo);
      setView('detail');
    }
  };

  const handleOpenLibrary = () => {
    setView('library');
    setSelectedAlgorithm(undefined);
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedAlgorithm(undefined);
  };

  const handleBackToLibrary = () => {
    setView('library');
    setSelectedAlgorithm(undefined);
  };

  const handleOpenVisualizer = (algo: Algorithm) => {
    setSelectedAlgorithm(algo);
    setView('visualizer');
  };

  const handleOpenAnalyzer = (algo: Algorithm) => {
    setSelectedAlgorithm(algo);
    setView('analyzer');
  };

  const handleOpenPerformanceLab = (algo: Algorithm) => {
    setSelectedAlgorithm(algo);
    setView('performance');
  };

  const handleOpenComparison = (algo: Algorithm) => {
    setSelectedAlgorithm(algo);
    setView('comparison');
  };

  const handleOpenPlayground = (algo?: Algorithm) => {
    setSelectedAlgorithm(algo);
    setView('playground');
  };

  const handleOpenPractice = () => {
    setView('practice');
  };

  const handleOpenQuiz = (config: QuizConfig) => {
    setQuizConfig(config);
    setView('quiz');
  };

  const handleOpenChallenges = () => {
    setView('challenges');
  };

  const handleOpenPracticals = () => {
    setView('practicals');
  };

  const handleOpenProgress = () => {
    setView('progress');
  };

  const handleBackToDetail = () => {
    setView('detail');
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#94a3b8',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⟳</div>
          <div>Loading DAA Learning Companion...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {view === 'dashboard' && (
        <Dashboard
          algorithms={algorithms}
          onSelectAlgorithm={handleSelectAlgorithm}
          onOpenLibrary={handleOpenLibrary}
          onOpenPlayground={() => handleOpenPlayground()}
          onOpenPractice={handleOpenPractice}
        />
      )}
      {view === 'library' && (
        <AlgorithmLibrary
          algorithms={algorithms}
          onSelectAlgorithm={handleSelectAlgorithm}
          onBack={handleBackToDashboard}
        />
      )}
      {view === 'detail' && (
        <AlgorithmDetail
          algorithm={selectedAlgorithm}
          onBack={handleBackToLibrary}
          onVisualize={handleOpenVisualizer}
          onAnalyze={handleOpenAnalyzer}
          onPerformanceLab={handleOpenPerformanceLab}
          onCompare={handleOpenComparison}
          onCodePlayground={handleOpenPlayground}
        />
      )}
      {view === 'visualizer' && (
        <AlgorithmVisualizer
          algorithm={selectedAlgorithm}
          onBack={handleBackToDetail}
        />
      )}
      {view === 'analyzer' && (
        <ComplexityAnalyzerPage
          algorithm={selectedAlgorithm!}
          onBack={handleBackToDetail}
          onCompare={handleOpenComparison}
        />
      )}
      {view === 'performance' && (
        <PerformanceLabPage
          algorithm={selectedAlgorithm!}
          onBack={handleBackToDetail}
        />
      )}
      {view === 'comparison' && (
        <AlgorithmComparisonPage
          algorithm={selectedAlgorithm!}
          onBack={handleBackToDetail}
        />
      )}
      {view === 'playground' && (
        <CodePlaygroundPage
          algorithmId={selectedAlgorithm?.id}
          onBack={handleBackToDetail}
        />
      )}
      {view === 'practice' && (
        <PracticePage
          onOpenQuiz={handleOpenQuiz}
          onOpenChallenges={handleOpenChallenges}
          onOpenPracticals={handleOpenPracticals}
          onOpenProgress={handleOpenProgress}
          onBack={handleBackToDashboard}
        />
      )}
      {view === 'quiz' && (
        <QuizPage config={quizConfig} onBack={handleOpenPractice} />
      )}
      {view === 'challenges' && (
        <CodingChallengesPage onBack={handleOpenPractice} />
      )}
      {view === 'practicals' && (
        <PracticalPreparationPage onBack={handleOpenPractice} />
      )}
      {view === 'progress' && (
        <LearningProgressPage onBack={handleOpenPractice} />
      )}
    </Layout>
  );
};
