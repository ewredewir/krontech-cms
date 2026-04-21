import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface PageBannerProps {
  title: string;
  bgImage?: string;
}

export function PageBanner({ title, bgImage }: PageBannerProps) {
  return (
    <div
      className="relative flex items-center bg-gray-900"
      style={{ height: '226px', marginTop: '115px' }}
    >
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover object-center"
          priority
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-black/41" aria-hidden="true" style={{ background: 'rgba(0,0,0,0.41)' }} />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 nav:px-10 w-full">
        <h1 className="text-white text-h1 font-semibold">{title}</h1>
      </div>
    </div>
  );
}
