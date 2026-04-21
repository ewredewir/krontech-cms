import type { Locale } from '@/lib/i18n';
import { HeroSlider } from '@/components/home/HeroSlider';
import { ProductCatalog } from '@/components/home/ProductCatalog';
import { BlogCarousel } from '@/components/home/BlogCarousel';
import { KuppingerColeSection } from '@/components/home/KuppingerColeSection';
import { WhyKron } from '@/components/home/WhyKron';
import { StatsBanner } from '@/components/home/StatsBanner';
import { VideoSection } from '@/components/home/VideoSection';
import { ContactSection } from '@/components/home/ContactSection';
import { ContactForm } from '@/components/shared/ContactForm';
import { DemoRequestForm } from '@/components/shared/DemoRequestForm';

// Stable seed ID for the demo form — used as fallback before formSlug is in component data
const DEMO_FORM_ID = '50000000-0000-0000-0000-000000000002';
import type { CmsSlide } from '@/components/home/HeroSlider';

interface LocaleMap { tr: string; en: string }

export interface ApiPageComponent {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  data: Record<string, unknown>;
}

// ─── Generic block renderers (for /{locale}/[slug] pages) ─────────────────────

function HeroBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const heading = (data.heading as LocaleMap)?.[locale] ?? '';
  const subheading = (data.subheading as LocaleMap | undefined)?.[locale];
  const ctaLabel = (data.ctaLabel as LocaleMap | undefined)?.[locale];
  const ctaUrl = data.ctaUrl as string | undefined;
  return (
    <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20 px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">{heading}</h1>
      {subheading && <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto">{subheading}</p>}
      {ctaLabel && ctaUrl && (
        <a href={ctaUrl} className="inline-block bg-white text-blue-900 font-semibold px-6 py-3 hover:bg-blue-50 transition-colors">
          {ctaLabel}
        </a>
      )}
    </section>
  );
}

function TextBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const content = (data.content as LocaleMap)?.[locale] ?? '';
  return (
    <section className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
      <div className="prose max-w-3xl whitespace-pre-wrap">{content}</div>
    </section>
  );
}

function CtaBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const heading = (data.heading as LocaleMap)?.[locale] ?? '';
  const buttonLabel = (data.buttonLabel as LocaleMap)?.[locale] ?? '';
  const buttonUrl = data.buttonUrl as string | undefined;
  return (
    <section className="bg-gray-50 py-16 px-6 text-center">
      <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
      {buttonLabel && buttonUrl && (
        <a href={buttonUrl} className="inline-block bg-primary text-white font-semibold px-8 py-3 hover:bg-blue-700 transition-colors">
          {buttonLabel}
        </a>
      )}
    </section>
  );
}

function FeaturesGridBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const items = (data.items as Array<{ icon?: string; title: LocaleMap; description?: LocaleMap }>) ?? [];
  return (
    <section className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div key={i} className="text-center p-6">
            {item.icon && <div className="text-4xl mb-3">{item.icon}</div>}
            <h3 className="text-lg font-semibold mb-2">{item.title[locale]}</h3>
            {item.description && <p className="text-secondary-text">{item.description[locale]}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const items = (data.items as Array<{ question: LocaleMap; answer: LocaleMap }>) ?? [];
  return (
    <section className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
      <div className="space-y-4 max-w-3xl">
        {items.map((item, i) => (
          <details key={i} className="border border-gray-200 p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              {item.question[locale]}
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="mt-3 text-secondary-text leading-7">{item.answer[locale]}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Home-page block renderers ────────────────────────────────────────────────

function HeroSliderBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const slides = (data.slides as CmsSlide[]) ?? [];
  return <HeroSlider locale={locale} slides={slides} />;
}

function VideoBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  return (
    <VideoSection
      locale={locale}
      videoId={(data.videoId as string) ?? ''}
      thumbnailUrl={data.thumbnailImageUrl as string | undefined}
    />
  );
}

function StatsBannerBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const stats = (data.stats as Array<{ label: LocaleMap; value: string }>) ?? [];
  return <StatsBanner locale={locale} stats={stats} />;
}

function WhyKronBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const heading = data.heading as LocaleMap | undefined;
  const items = (data.items as Array<{ icon?: string; title: LocaleMap; body: LocaleMap }>) ?? [];
  return <WhyKron locale={locale} heading={heading} items={items} />;
}

function ContactSectionBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  return (
    <ContactSection
      locale={locale}
      backgroundImageUrl={data.backgroundImageUrl as string | undefined}
    />
  );
}

function KuppingerColeBlock({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  return (
    <KuppingerColeSection
      locale={locale}
      heading={data.heading as LocaleMap | undefined}
      linkHref={data.linkHref as string | undefined}
      badgeImageUrl={data.badgeImageUrl as string | undefined}
    />
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function SectionRenderer({ section, locale }: { section: ApiPageComponent; locale: Locale }) {
  if (!section.isVisible) return null;
  const { type, data } = section;

  switch (type) {
    // Generic blocks
    case 'hero':          return <HeroBlock data={data} locale={locale} />;
    case 'text_block':    return <TextBlock data={data} locale={locale} />;
    case 'cta':           return <CtaBlock data={data} locale={locale} />;
    case 'features_grid': return <FeaturesGridBlock data={data} locale={locale} />;
    case 'faq':           return <FaqBlock data={data} locale={locale} />;
    // Home-page blocks
    case 'hero_slider':     return <HeroSliderBlock data={data} locale={locale} />;
    case 'video':           return <VideoBlock data={data} locale={locale} />;
    case 'stats_banner':    return <StatsBannerBlock data={data} locale={locale} />;
    case 'why_kron':        return <WhyKronBlock data={data} locale={locale} />;
    case 'contact_section': return <ContactSectionBlock data={data} locale={locale} />;
    case 'kuppinger_cole':  return <KuppingerColeBlock data={data} locale={locale} />;
    case 'product_catalog': return <ProductCatalog locale={locale} />;
    case 'blog_carousel':   return <BlogCarousel locale={locale} />;
    case 'form_embed': {
      const isDemo = (data.formSlug as string) === 'demo' || (data.formId as string) === DEMO_FORM_ID;
      return (
        <section className="max-w-[860px] mx-auto px-6 nav:px-10 py-16">
          {isDemo ? <DemoRequestForm locale={locale} /> : <ContactForm locale={locale} />}
        </section>
      );
    }
    default: return null;
  }
}
