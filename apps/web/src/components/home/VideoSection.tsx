'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface VideoSectionProps {
  locale: string;
}

export function VideoSection({ locale: _locale }: VideoSectionProps) {
  const t = useTranslations('video');
  const [playing, setPlaying] = useState(false);

  const youtubeId = 'dQw4w9WgXcQ';

  return (
    <section aria-label={t('sectionLabel')} className="py-20 bg-white mb-24">
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-h3 text-heading mb-4">{t('title')}</h2>
            <p className="text-secondary-text text-lead leading-7 mb-6">{t('body')}</p>
          </div>
          <div className="relative">
            {playing ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  title={t('title')}
                  allow="autoplay; fullscreen"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <button
                onClick={() => setPlaying(true)}
                aria-label={t('playLabel')}
                className="relative w-full group"
              >
                <Image
                  src="/assets/uploads/content/kron-anadolu-efes.jpg"
                  alt={t('title')}
                  width={735}
                  height={500}
                  className="w-full object-cover"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="(max-width: 1100px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 bg-primary flex items-center justify-center shadow-lg group-hover:bg-primary-light transition-colors">
                    <Image
                      src="/assets/images/play.svg"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
