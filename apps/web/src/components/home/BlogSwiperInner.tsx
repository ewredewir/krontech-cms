'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { BlogCard } from '@/components/shared/BlogCard';
import { blogPosts } from '@/fixtures/blog';
import type { Locale } from '@/lib/i18n';

interface BlogSwiperInnerProps {
  locale: Locale;
}

export default function BlogSwiperInner({ locale }: BlogSwiperInnerProps) {
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
      {blogPosts.map((post) => (
        <SwiperSlide key={post.id}>
          <BlogCard post={post} locale={locale} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
