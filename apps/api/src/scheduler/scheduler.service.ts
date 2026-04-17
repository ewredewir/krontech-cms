import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { PagesService } from '../pages/pages.service';
import { BlogService } from '../blog/blog.service';
import { ProductsService } from '../products/products.service';
import { SeoService } from '../seo/seo.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { MediaService } from '../media/media.service';

const SYSTEM_USER = 'system';
const SYSTEM_IP = '127.0.0.1';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectPinoLogger(SchedulerService.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly pagesService: PagesService,
    private readonly blogService: BlogService,
    private readonly productsService: ProductsService,
    private readonly seoService: SeoService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly mediaService: MediaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async promoteScheduledContent(): Promise<void> {
    const now = new Date();

    const [scheduledPages, scheduledPosts, scheduledProducts] = await Promise.all([
      this.prisma.page.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      }),
      this.prisma.blogPost.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      }),
      this.prisma.product.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      }),
    ]);

    for (const page of scheduledPages) {
      try {
        await this.pagesService.publish(page.id, SYSTEM_USER, SYSTEM_IP, 'CRON');
        this.logger.info({ pageId: page.id }, 'Scheduled page published via cron');
      } catch (err) {
        this.logger.error({ pageId: page.id, err }, 'Failed to publish scheduled page');
      }
    }

    for (const post of scheduledPosts) {
      try {
        await this.blogService.publish(post.id, SYSTEM_USER, SYSTEM_IP, 'CRON');
        this.logger.info({ postId: post.id }, 'Scheduled blog post published via cron');
      } catch (err) {
        this.logger.error({ postId: post.id, err }, 'Failed to publish scheduled blog post');
      }
    }

    for (const product of scheduledProducts) {
      try {
        await this.productsService.publish(product.id, SYSTEM_USER, SYSTEM_IP, 'CRON');
        this.logger.info({ productId: product.id }, 'Scheduled product published via cron');
      } catch (err) {
        this.logger.error({ productId: product.id, err }, 'Failed to publish scheduled product');
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async rebuildSitemap(): Promise<void> {
    try {
      const xml = await this.seoService.generateSitemap();
      await this.cacheService.setCachedSitemap(xml);
      this.logger.info('Sitemap rebuilt and cached');
    } catch (err) {
      this.logger.error({ err }, 'Failed to rebuild sitemap');
    }
  }

  @Cron('0 2 * * *')
  async cleanupSoftDeletedMedia(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const candidates = await this.prisma.media.findMany({
      where: { deletedAt: { not: null, lt: thirtyDaysAgo } },
    });

    for (const media of candidates) {
      try {
        const inUse = await this.mediaService.checkMediaInUse(media.id);
        if (inUse) {
          this.logger.warn({ mediaId: media.id }, 'Skipping purge — media still in use');
          continue;
        }

        await this.mediaService.hardDelete(media);
        await this.auditService.log({
          userId: SYSTEM_USER,
          action: 'MEDIA_PURGED',
          entityType: 'Media',
          entityId: media.id,
          ipAddress: SYSTEM_IP,
        });
        this.logger.info({ mediaId: media.id }, 'Soft-deleted media purged');
      } catch (err) {
        this.logger.error({ mediaId: media.id, err }, 'Failed to purge media');
      }
    }
  }
}
