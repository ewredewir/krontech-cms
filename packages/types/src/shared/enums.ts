export const UserRole = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const ContentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  SCHEDULED: 'SCHEDULED',
} as const;
export type ContentStatus = typeof ContentStatus[keyof typeof ContentStatus];

export const PageComponentType = {
  hero: 'hero',
  text_block: 'text_block',
  cta: 'cta',
  features_grid: 'features_grid',
  faq: 'faq',
  media_block: 'media_block',
  form_embed: 'form_embed',
  hero_slider: 'hero_slider',
  video: 'video',
  stats_banner: 'stats_banner',
  why_kron: 'why_kron',
  contact_section: 'contact_section',
  kuppinger_cole: 'kuppinger_cole',
  product_catalog: 'product_catalog',
  blog_carousel: 'blog_carousel',
} as const;
export type PageComponentType = typeof PageComponentType[keyof typeof PageComponentType];
