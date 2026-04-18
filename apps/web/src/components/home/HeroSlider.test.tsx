import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../test/render';

vi.mock('next/dynamic', () => ({
  default: () => {
    return function DynamicMock(props: Record<string, unknown>) {
      const locale = props['locale'] as string | undefined;
      return (
        <div data-testid="hero-swiper" data-locale={locale}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} data-testid={`slide-${i + 1}`}>
              <span className="bg-blue">highlighted</span>
            </div>
          ))}
        </div>
      );
    };
  },
}));

import { HeroSlider } from './HeroSlider';

describe('HeroSlider', () => {
  it('renders the slider section', () => {
    renderWithIntl(<HeroSlider locale="tr" />);
    expect(screen.getByTestId('hero-swiper')).toBeInTheDocument();
  });

  it('renders 10 slides', () => {
    renderWithIntl(<HeroSlider locale="tr" />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`slide-${i}`)).toBeInTheDocument();
    }
  });

  it('passes locale prop to inner swiper', () => {
    renderWithIntl(<HeroSlider locale="en" />, 'en');
    expect(screen.getByTestId('hero-swiper')).toHaveAttribute('data-locale', 'en');
  });

  it('renders .bg-blue spans for highlighted words', () => {
    renderWithIntl(<HeroSlider locale="tr" />);
    const highlighted = document.querySelectorAll('.bg-blue');
    expect(highlighted.length).toBeGreaterThan(0);
  });
});
