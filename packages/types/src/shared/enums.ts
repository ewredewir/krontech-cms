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
} as const;
export type PageComponentType = typeof PageComponentType[keyof typeof PageComponentType];
