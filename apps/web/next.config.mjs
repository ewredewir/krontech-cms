import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'krontech.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'minio' },
    ],
  },
};

export default withNextIntl(config);
