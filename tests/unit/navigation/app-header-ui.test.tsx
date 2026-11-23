import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHeader } from '../../../src/webview/components/AppHeader';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

describe('app header', () => {
  it('renders the main navigation entries', () => {
    const markup = render(
      <AppHeader
        items={[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'library', label: 'Library' },
          { id: 'assistant', label: 'AI Assistant' },
        ]}
        current="library"
        onNavigate={() => undefined}
      />
    );

    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Library');
    expect(markup).toContain('AI Assistant');
  });

  it('exposes the navigation as a landmark with the active entry marked', () => {
    const markup = render(
      <AppHeader
        items={[{ id: 'library', label: 'Library' }]}
        current="library"
        onNavigate={() => undefined}
      />
    );

    expect(markup).toContain('role="navigation"');
    expect(markup).toContain('aria-current="page"');
  });

  it('omits the active marker for the inactive entries', () => {
    const markup = render(
      <AppHeader
        items={[{ id: 'dashboard', label: 'Dashboard' }]}
        current="library"
        onNavigate={() => undefined}
      />
    );

    expect(markup).not.toContain('aria-current');
  });

  it('renders the entries passed by the caller', () => {
    const markup = render(
      <AppHeader
        items={[{ id: 'progress', label: 'Progress' }]}
        current="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(markup).toContain('Progress');
    expect(markup).not.toContain('Dashboard');
  });
});
