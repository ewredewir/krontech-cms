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

export const PageComponentDataSchema = z.discriminatedUnion('__type', [
  HeroDataSchema.extend({ __type: z.literal('hero') }),
  TextBlockDataSchema.extend({ __type: z.literal('text_block') }),
  CtaDataSchema.extend({ __type: z.literal('cta') }),
  FeaturesGridDataSchema.extend({ __type: z.literal('features_grid') }),
  FaqDataSchema.extend({ __type: z.literal('faq') }),
  MediaBlockDataSchema.extend({ __type: z.literal('media_block') }),
  FormEmbedDataSchema.extend({ __type: z.literal('form_embed') }),
]);
export type PageComponentData = z.infer<typeof PageComponentDataSchema>;
