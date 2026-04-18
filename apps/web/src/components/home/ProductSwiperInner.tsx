'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { products } from '@/fixtures/products';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';
import { useTranslations } from 'next-intl';

interface ProductSwiperInnerProps {
  locale: Locale;
}

export default function ProductSwiperInner({ locale }: ProductSwiperInnerProps) {
  const t = useTranslations('products');

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      slidesPerView={1}
      spaceBetween={24}
      pagination={{ clickable: true }}
      navigation
      breakpoints={{
        768: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
      }}
      className="pb-12"
    >
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <article className="bg-white shadow-card h-full flex flex-col p-6">
            <div className="relative w-full h-48 mb-4">
              <Image
                src={product.image}
                alt={product.name[locale]}
                fill
                className="object-contain"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
            </div>
            <h3 className="text-heading font-semibold text-lg mb-2">{product.name[locale]}</h3>
            <p className="text-secondary-text text-body flex-1 mb-4">{product.description[locale]}</p>
            <ul className="check-list mb-6">
              {product.bullets.slice(0, 3).map((bullet, i) => (
                <li key={i} className="text-secondary-text text-body">
                  {bullet[locale]}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/products/${product.slug}`}
              className="text-primary text-nav-sm font-medium hover:text-primary-light transition-colors border-t border-gray-100 pt-4 mt-auto block"
            >
              {t('learnMore')} →
            </Link>
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
