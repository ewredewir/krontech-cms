export interface LocaleMap {
  tr: string;
  en: string;
}

export interface SliderSlide {
  id: number;
  titleHighlighted: LocaleMap;
  body: LocaleMap;
  ctaLabel: LocaleMap;
  ctaUrl: string;
  bgImage: string;
  rightImage?: string;
}

export interface ProductCard {
  id: string | number;
  name: LocaleMap;
  description: LocaleMap;
  bullets: LocaleMap[];
  image: string;
  href: string;
  slug: string;
  faqs: Array<{ question: LocaleMap; answer: LocaleMap }>;
}

export interface BlogPost {
  id: string | number;
  slug: LocaleMap;
  title: LocaleMap;
  excerpt: LocaleMap;
  category: 'blog' | 'haber';
  image: string;
  publishedAt: string;
}

export interface NavDropdownItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavDropdownItem[];
}

export interface Redirect {
  source: string;
  destination: string;
  statusCode: 301 | 302;
}

export interface SeoMeta {
  metaTitle: LocaleMap;
  metaDescription: LocaleMap;
  robots: string;
  ogImage?: string;
}
