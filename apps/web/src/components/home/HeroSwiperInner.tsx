'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';
import type { CmsSlide } from './HeroSlider';

interface HeroSwiperInnerProps {
  locale: Locale;
  slides: CmsSlide[];
}

export default function HeroSwiperInner({ locale, slides }: HeroSwiperInnerProps) {
  return (
    <Swiper
      modules={[Autoplay, Pagination, EffectFade]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      effect="fade"
      loop
      className="h-full w-full"
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index} className="relative h-full overflow-hidden bg-gray-900">
          {slide.backgroundImageUrl && (
            <Image
              src={slide.backgroundImageUrl}
              alt=""
              fill
              className="object-cover object-center"
              priority={index === 0}
              placeholder="blur"
              blurDataURL={slide.backgroundBlurDataUrl ?? BLUR_PLACEHOLDER}
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-[1400px] mx-auto w-full px-6 nav:px-10">
              <div className="max-w-xl">
                {index === 0 ? (
                  <h1
                    className="text-white text-3xl nav:text-[42px] font-semibold leading-tight mb-4"
                    dangerouslySetInnerHTML={{ __html: slide.heading[locale] }}
                  />
                ) : (
                  <h2
                    className="text-white text-3xl nav:text-[42px] font-semibold leading-tight mb-4"
                    dangerouslySetInnerHTML={{ __html: slide.heading[locale] }}
                  />
                )}
                {slide.subheading && (
                  <p className="text-white/80 text-lead mb-8">{slide.subheading[locale]}</p>
                )}
                {slide.ctaLabel && slide.ctaUrl && (
                  <Link
                    href={slide.ctaUrl}
                    className="inline-block bg-primary hover:bg-primary-light text-white font-medium px-8 py-3 text-sm transition-colors"
                  >
                    {slide.ctaLabel[locale]}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
