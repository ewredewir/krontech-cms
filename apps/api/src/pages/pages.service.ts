import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Page, PageComponent, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../cache/cache.service';
import {
  CreatePageDto,
  UpdatePageDto,
  CreatePageComponentDto,
  UpdatePageComponentDto,
  ReorderComponentsDto,
} from '@krontech/types';

type LocaleMap = { tr: string; en: string };
type PageWithRelations = Page & { components: PageComponent[]; seo: Prisma.SeoMetaGetPayload<object> | null };

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: CreatePageDto, userId: string, ipAddress: string): Promise<Page> {
    const page = await this.prisma.page.create({
      data: {
        slug: dto.slug,
        status: dto.status ?? 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdById: userId,
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'PAGE_CREATED',
      entityType: 'Page',
      entityId: page.id,
      diff: dto,
      ipAddress,
    });
    return page;
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: Page[]; total: number }> {
    const where = params.status ? { status: params.status as Prisma.EnumContentStatusFilter } : {};
    const [data, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: { seo: true, components: { orderBy: { order: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.page.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<PageWithRelations> {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { seo: true, components: { orderBy: { order: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async update(
    id: string,
    dto: UpdatePageDto,
    userId: string,
    ipAddress: string,
  ): Promise<Page> {
    await this.findOne(id);
    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.status && { status: dto.status }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }),
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'PAGE_UPDATED',
      entityType: 'Page',
      entityId: id,
      diff: dto,
      ipAddress,
    });
    return updated;
  }

  async remove(id: string, userId: string, ipAddress: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
    await this.auditService.log({
      userId,
      action: 'PAGE_DELETED',
      entityType: 'Page',
      entityId: id,
      ipAddress,
    });
  }

  async publish(
    id: string,
    userId: string,
    ipAddress: string,
    mode: 'MANUAL' | 'CRON' = 'MANUAL',
  ): Promise<Page> {
    const page = await this.prisma.page.findUniqueOrThrow({
      where: { id },
      include: { components: true, seo: true },
    });

    if (page.status === 'PUBLISHED') {
      throw new BadRequestException('Page is already published');
    }
    if (page.status === 'DRAFT' && mode === 'CRON') {
      throw new BadRequestException('Cannot cron-publish a draft page');
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
      include: { components: true, seo: true },
    });

    await this.createVersion(updated, userId);

    const action =
      page.status === 'SCHEDULED'
        ? mode === 'CRON'
          ? 'SCHEDULED_PUBLISH_CRON'
          : 'SCHEDULED_PUBLISH_MANUAL'
        : 'PAGE_PUBLISHED';

    await this.auditService.log({
      userId,
      action,
      entityType: 'Page',
      entityId: id,
      ipAddress,
    });

    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([`/tr/${slug.tr}`, `/en/${slug.en}`]);

    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    userId: string,
    ipAddress: string,
  ): Promise<Page> {
    const page = await this.prisma.page.findUniqueOrThrow({ where: { id } });
    if (page.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot schedule a published page');
    }
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt },
    });
    await this.auditService.log({
      userId,
      action: 'PAGE_SCHEDULED',
      entityType: 'Page',
      entityId: id,
      diff: { scheduledAt },
      ipAddress,
    });
    return updated;
  }

  async unpublish(id: string, userId: string, ipAddress: string): Promise<Page> {
    const page = await this.prisma.page.findUniqueOrThrow({ where: { id } });
    if (page.status !== 'PUBLISHED') {
      throw new BadRequestException('Page is not published');
    }
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'PAGE_UNPUBLISHED',
      entityType: 'Page',
      entityId: id,
      ipAddress,
    });
    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([`/tr/${slug.tr}`, `/en/${slug.en}`]);
    return updated;
  }

  async cancelSchedule(id: string, userId: string, ipAddress: string): Promise<Page> {
    const page = await this.prisma.page.findUniqueOrThrow({ where: { id } });
    if (page.status !== 'SCHEDULED') {
      throw new BadRequestException('Page is not scheduled');
    }
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'DRAFT', scheduledAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'PAGE_SCHEDULE_CANCELLED',
      entityType: 'Page',
      entityId: id,
      ipAddress,
    });
    return updated;
  }

  async generatePreviewLink(pageId: string): Promise<string> {
    const token = this.jwtService.sign(
      { pageId, purpose: 'preview' },
      { expiresIn: '1h', secret: process.env.JWT_ACCESS_SECRET },
    );
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
    return `${base}/api/preview?token=${token}`;
  }

  async getVersions(pageId: string) {
    return this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      include: { publishedBy: { select: { id: true, email: true } } },
    });
  }

  // Components
  async addComponent(dto: CreatePageComponentDto): Promise<PageComponent> {
    return this.prisma.pageComponent.create({
      data: {
        pageId: dto.pageId,
        type: dto.type,
        order: dto.order,
        data: dto.data as Prisma.InputJsonValue,
        isVisible: dto.isVisible ?? true,
      },
    });
  }

  async updateComponent(
    id: string,
    dto: UpdatePageComponentDto,
  ): Promise<PageComponent> {
    return this.prisma.pageComponent.update({
      where: { id },
      data: {
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.data !== undefined && { data: dto.data as Prisma.InputJsonValue }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
    });
  }

  async removeComponent(id: string): Promise<void> {
    await this.prisma.pageComponent.delete({ where: { id } });
  }

  async reorderComponents(dto: ReorderComponentsDto): Promise<void> {
    await this.prisma.$transaction(
      dto.components.map((c) =>
        this.prisma.pageComponent.update({
          where: { id: c.id },
          data: { order: c.order },
        }),
      ),
    );
  }

  // Public endpoints
  async findPublishedBySlug(slug: string, locale: 'tr' | 'en') {
    const pages = await this.prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      include: { components: { orderBy: { order: 'asc' } }, seo: { include: { ogImage: true } } },
    });

    const page = pages.find((p) => {
      const s = p.slug as LocaleMap;
      return s[locale] === slug;
    });

    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getAllSlugs(): Promise<Array<{ slug: LocaleMap }>> {
    const pages = await this.prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return pages.map((p) => ({ slug: p.slug as LocaleMap }));
  }

  private async createVersion(
    page: Page & { components: PageComponent[] },
    publishedById: string,
  ): Promise<void> {
    const count = await this.prisma.pageVersion.count({ where: { pageId: page.id } });
    if (count >= 5) {
      const oldest = await this.prisma.pageVersion.findFirst({
        where: { pageId: page.id },
        orderBy: { versionNumber: 'asc' },
      });
      if (oldest) await this.prisma.pageVersion.delete({ where: { id: oldest.id } });
    }

    const latest = await this.prisma.pageVersion.findFirst({
      where: { pageId: page.id },
      orderBy: { versionNumber: 'desc' },
    });

    await this.prisma.pageVersion.create({
      data: {
        pageId: page.id,
        publishedById,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        snapshot: page as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
