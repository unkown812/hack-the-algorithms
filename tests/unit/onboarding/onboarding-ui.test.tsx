import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OnboardingPage } from '../../../src/webview/pages/OnboardingPage';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

describe('onboarding page', () => {
  it('renders the welcome and all seven modules of the learning path', () => {
    const markup = render(
      <OnboardingPage onNavigate={() => undefined} onBack={() => undefined} />
    );

    expect(markup).toContain('Welcome to the DAA Learning Companion');
    expect(markup).toContain('Algorithm Library');
    expect(markup).toContain('Visualization');
    expect(markup).toContain('Code Playground');
    expect(markup).toContain('Complexity Analysis');
    expect(markup).toContain('Practice Centre');
    expect(markup).toContain('AI Assistant');
    expect(markup).toContain('Progress');
    expect(markup).toContain('Back to Dashboard');
  });

  it('offers an entry action for every module', () => {
    const markup = render(
      <OnboardingPage onNavigate={() => undefined} onBack={() => undefined} />
    );

    // Seven module cards, each with an action button.
    expect(markup).toContain('Open');
    expect((markup.match(/>Open</g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});
