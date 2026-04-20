import { z } from 'zod';
import { LocaleMapSchema, LocaleMapRequiredSchema } from '../shared/locale-map';

export const HeroDataSchema = z.object({
  heading: LocaleMapRequiredSchema,
  subheading: LocaleMapSchema,
  ctaLabel: LocaleMapSchema,
  ctaUrl: z.string().url().optional(),
  backgroundImageId: z.string().uuid().optional(),
});

export const TextBlockDataSchema = z.object({
  content: LocaleMapRequiredSchema,
});

export const CtaDataSchema = z.object({
  heading: LocaleMapRequiredSchema,
  buttonLabel: LocaleMapRequiredSchema,
  buttonUrl: z.string().min(1),
});

export const FeaturesGridDataSchema = z.object({
  items: z.array(z.object({
    icon: z.string(),
    title: LocaleMapRequiredSchema,
    description: LocaleMapSchema,
  })),
});

export const FaqDataSchema = z.object({
  items: z.array(z.object({
    question: LocaleMapRequiredSchema,
    answer: LocaleMapRequiredSchema,
  })).min(1),
});

export const MediaBlockDataSchema = z.object({
  mediaId: z.string().uuid(),
  caption: LocaleMapSchema,
});

export const FormEmbedDataSchema = z.object({
  formId: z.string().uuid(),
});

const HeroSlideSchema = z.object({
  heading: LocaleMapRequiredSchema,
  subheading: LocaleMapSchema.optional(),
  ctaLabel: LocaleMapSchema.optional(),
  ctaUrl: z.string().optional(),
  backgroundMediaId: z.string().uuid().optional(),
});

export const HeroSliderDataSchema = z.object({
  slides: z.array(HeroSlideSchema).min(1).max(20),
});
export type HeroSliderData = z.infer<typeof HeroSliderDataSchema>;

export const VideoDataSchema = z.object({
  videoId: z.string().min(1),
  thumbnailMediaId: z.string().uuid().optional(),
});
export type VideoData = z.infer<typeof VideoDataSchema>;

export const StatsBannerDataSchema = z.object({
  stats: z.array(z.object({
    label: LocaleMapRequiredSchema,
    value: z.string().min(1),
  })).min(1).max(8),
});
export type StatsBannerData = z.infer<typeof StatsBannerDataSchema>;

export const WhyKronDataSchema = z.object({
  heading: LocaleMapSchema.optional(),
  items: z.array(z.object({
    icon: z.string().optional(),
    title: LocaleMapRequiredSchema,
    body: LocaleMapRequiredSchema,
  })).min(1).max(12),
});
export type WhyKronData = z.infer<typeof WhyKronDataSchema>;

export const ContactSectionDataSchema = z.object({
  backgroundMediaId: z.string().uuid().optional(),
  formId: z.string().uuid(),
});
export type ContactSectionData = z.infer<typeof ContactSectionDataSchema>;

export const KuppingerColeDataSchema = z.object({
  heading: LocaleMapSchema.optional(),
  linkHref: z.string().url().optional(),
  badgeMediaId: z.string().uuid().optional(),
});
export type KuppingerColeData = z.infer<typeof KuppingerColeDataSchema>;

export const ProductCatalogDataSchema = z.object({});
export type ProductCatalogData = z.infer<typeof ProductCatalogDataSchema>;

export const BlogCarouselDataSchema = z.object({});
export type BlogCarouselData = z.infer<typeof BlogCarouselDataSchema>;

export const PageComponentDataSchema = z.discriminatedUnion('__type', [
  HeroDataSchema.extend({ __type: z.literal('hero') }),
  TextBlockDataSchema.extend({ __type: z.literal('text_block') }),
  CtaDataSchema.extend({ __type: z.literal('cta') }),
  FeaturesGridDataSchema.extend({ __type: z.literal('features_grid') }),
  FaqDataSchema.extend({ __type: z.literal('faq') }),
  MediaBlockDataSchema.extend({ __type: z.literal('media_block') }),
  FormEmbedDataSchema.extend({ __type: z.literal('form_embed') }),
  HeroSliderDataSchema.extend({ __type: z.literal('hero_slider') }),
  VideoDataSchema.extend({ __type: z.literal('video') }),
  StatsBannerDataSchema.extend({ __type: z.literal('stats_banner') }),
  WhyKronDataSchema.extend({ __type: z.literal('why_kron') }),
  ContactSectionDataSchema.extend({ __type: z.literal('contact_section') }),
  KuppingerColeDataSchema.extend({ __type: z.literal('kuppinger_cole') }),
  ProductCatalogDataSchema.extend({ __type: z.literal('product_catalog') }),
  BlogCarouselDataSchema.extend({ __type: z.literal('blog_carousel') }),
]);
export type PageComponentData = z.infer<typeof PageComponentDataSchema>;
