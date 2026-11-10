import { FunctionComponent, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AlgorithmLibrary } from './pages/AlgorithmLibrary';
import { AlgorithmDetail } from './pages/AlgorithmDetail';
import { AlgorithmVisualizer } from './pages/AlgorithmVisualizer';
import { ComplexityAnalyzerPage } from './pages/ComplexityAnalyzerPage';
import { PerformanceLabPage } from './pages/PerformanceLabPage';
import { AlgorithmComparisonPage } from './pages/AlgorithmComparisonPage';
import { postToExtension, onExtensionMessage } from './utils';
import type { Algorithm } from '../core/algorithms';

type View = 'dashboard' | 'library' | 'detail' | 'visualizer' | 'analyzer' | 'performance' | 'comparison';

export const App: FunctionComponent = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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
    </Layout>
  );
};
