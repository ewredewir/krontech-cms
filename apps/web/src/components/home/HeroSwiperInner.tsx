'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { slides } from '@/fixtures/slides';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface HeroSwiperInnerProps {
  locale: Locale;
}

export default function HeroSwiperInner({ locale }: HeroSwiperInnerProps) {
  return (
    <Swiper
      modules={[Autoplay, Pagination, EffectFade]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      effect="fade"
      loop
      className="h-full w-full"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id} className="relative h-full overflow-hidden">
          <Image
            src={slide.bgImage}
            alt=""
            fill
            className="object-cover object-center"
            priority={slide.id === 1}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-[1400px] mx-auto w-full px-6 nav:px-10">
              <div className="max-w-xl">
                {slide.id === 1 ? (
                  <h1
                    className="text-white text-3xl nav:text-[42px] font-semibold leading-tight mb-4"
                    dangerouslySetInnerHTML={{
                      __html: slide.titleHighlighted[locale],
                    }}
                  />
                ) : (
                <h2
                  className="text-white text-3xl nav:text-[42px] font-semibold leading-tight mb-4"
                  dangerouslySetInnerHTML={{
                    __html: slide.titleHighlighted[locale],
                  }}
                />
                )}
                <p className="text-white/80 text-lead mb-8">{slide.body[locale]}</p>
                <Link
                  href={slide.ctaUrl}
                  className="inline-block bg-primary hover:bg-primary-light text-white font-medium px-8 py-3 text-sm transition-colors"
                >
                  {slide.ctaLabel[locale]}
                </Link>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
