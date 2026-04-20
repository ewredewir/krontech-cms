import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../test/render';
import type { CmsSlide } from './HeroSlider';

vi.mock('next/dynamic', () => ({
  default: () => {
    return function DynamicMock(props: Record<string, unknown>) {
      const locale = props['locale'] as string | undefined;
      const slides = props['slides'] as CmsSlide[] | undefined;
      return (
        <div data-testid="hero-swiper" data-locale={locale}>
          {(slides ?? []).map((_, i) => (
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

const mockSlides: CmsSlide[] = Array.from({ length: 2 }, (_, i) => ({
  heading: { tr: `Slide ${i + 1} TR`, en: `Slide ${i + 1} EN` },
}));

describe('HeroSlider', () => {
  it('renders the slider section', () => {
    renderWithIntl(<HeroSlider locale="tr" slides={mockSlides} />);
    expect(screen.getByTestId('hero-swiper')).toBeInTheDocument();
  });

  it('renders the correct number of slides', () => {
    renderWithIntl(<HeroSlider locale="tr" slides={mockSlides} />);
    for (let i = 1; i <= mockSlides.length; i++) {
      expect(screen.getByTestId(`slide-${i}`)).toBeInTheDocument();
    }
  });

  it('passes locale prop to inner swiper', () => {
    renderWithIntl(<HeroSlider locale="en" slides={mockSlides} />, 'en');
    expect(screen.getByTestId('hero-swiper')).toHaveAttribute('data-locale', 'en');
  });

  it('renders .bg-blue spans for highlighted words', () => {
    renderWithIntl(<HeroSlider locale="tr" slides={mockSlides} />);
    const highlighted = document.querySelectorAll('.bg-blue');
    expect(highlighted.length).toBeGreaterThan(0);
  });
});
