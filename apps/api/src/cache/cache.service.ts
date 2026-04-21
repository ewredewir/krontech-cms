import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class CacheService {
  constructor(
    @InjectPinoLogger(CacheService.name)
    private readonly logger: PinoLogger,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async invalidateContent(paths: string[]): Promise<void> {
    const base = process.env.WEB_INTERNAL_URL ?? '';
    const revalidateUrl = `${base}/api/revalidate`;
    for (const path of paths) {
      try {
        await fetch(revalidateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, secret: process.env.REVALIDATE_SECRET }),
        });
      } catch (err) {
        this.logger.error({ path, err }, 'Failed to revalidate Next.js path');
      }
    }
  }

  async invalidateTags(tags: string[]): Promise<void> {
    const base = process.env.WEB_INTERNAL_URL ?? '';
    const revalidateUrl = `${base}/api/revalidate`;
    for (const tag of tags) {
      try {
        await fetch(revalidateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag, secret: process.env.REVALIDATE_SECRET }),
        });
      } catch (err) {
        this.logger.error({ tag, err }, 'Failed to revalidate Next.js tag');
      }
    }
  }

  async invalidateRedirects(): Promise<void> {
    await this.redis.del('redirects:all');
  }

  async getCachedRedirects(): Promise<string | null> {
    return this.redis.get('redirects:all');
  }

  async setCachedRedirects(data: string, ttlSeconds = 60): Promise<void> {
    await this.redis.set('redirects:all', data, 'EX', ttlSeconds);
  }

  async setCachedSitemap(xml: string): Promise<void> {
    await this.redis.set('sitemap:xml', xml, 'EX', 3600);
  }

  async getCachedSitemap(): Promise<string | null> {
    return this.redis.get('sitemap:xml');
  }
}
