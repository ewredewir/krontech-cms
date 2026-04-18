import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../test/render';

vi.mock('next/navigation', () => ({
  usePathname: () => '/tr',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/components/layout/MobileNav', () => ({
  MobileNav: () => null,
}));

vi.mock('@/components/nav/NavDropdown', () => ({
  NavDropdown: () => null,
}));

vi.mock('@/components/nav/LanguageSwitcher', () => ({
  LanguageSwitcher: ({ locale }: { locale: string }) => (
    <div data-testid="lang-switcher">{locale.toUpperCase()}</div>
  ),
}));

import { Header } from './Header';

describe('Header', () => {
  it('renders TR dark logo for TR locale', () => {
    renderWithIntl(<Header locale="tr" />);
    const logos = screen.getAllByAltText('Krontech');
    const trLogo = logos.find((img) => img.getAttribute('src')?.includes('tr'));
    expect(trLogo).toBeInTheDocument();
  });

  it('renders EN dark logo for EN locale', () => {
    renderWithIntl(<Header locale="en" />, 'en');
    const logos = screen.getAllByAltText('Krontech');
    const enLogo = logos.find((img) => img.getAttribute('src')?.includes('en'));
    expect(enLogo).toBeInTheDocument();
  });

  it('renders language switcher', () => {
    renderWithIntl(<Header locale="tr" />);
    expect(screen.getByTestId('lang-switcher')).toBeInTheDocument();
  });

  it('renders hamburger button for mobile', () => {
    renderWithIntl(<Header locale="tr" />);
    const menuBtn = screen.getByRole('button', { name: /menüyü aç/i });
    expect(menuBtn).toBeInTheDocument();
  });
});
