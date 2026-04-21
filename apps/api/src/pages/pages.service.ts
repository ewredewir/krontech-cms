import { createHmac, timingSafeEqual } from 'crypto';
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

// Admin-safe component shape: hasDraft instead of raw draftData
type AdminComponent = Omit<PageComponent, 'draftData'> & { hasDraft: boolean };

function toAdminComponent(comp: PageComponent): AdminComponent {
  const { draftData, ...rest } = comp;
  return { ...rest, hasDraft: draftData !== null };
}

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
    if (page.status === 'PUBLISHED') {
      void this.cacheService.invalidateContent(this.pagePathsForSlug(page.slug as LocaleMap));
    }
    return page;
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: (Omit<Page, never> & { components: AdminComponent[]; seo: Prisma.SeoMetaGetPayload<object> | null })[]; total: number }> {
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
    return {
      data: data.map(p => ({ ...p, components: p.components.map(toAdminComponent) })),
      total,
    };
  }

  async findOne(id: string): Promise<Omit<PageWithRelations, 'components'> & { components: AdminComponent[] }> {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { seo: true, components: { orderBy: { order: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Page not found');
    return { ...page, components: page.components.map(toAdminComponent) };
  }

  async update(
    id: string,
    dto: UpdatePageDto,
    userId: string,
    ipAddress: string,
  ): Promise<Page> {
    const existing = await this.findOne(id);
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
    if (existing.status === 'PUBLISHED' || updated.status === 'PUBLISHED') {
      const oldSlug = existing.slug as LocaleMap;
      const newSlug = updated.slug as LocaleMap;
      const paths = new Set([
        ...this.pagePathsForSlug(oldSlug),
        ...this.pagePathsForSlug(newSlug),
      ]);
      void this.cacheService.invalidateContent([...paths]);
    }
    return updated;
  }

  async remove(id: string, userId: string, ipAddress: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
    await this.auditService.log({
      userId,
      action: 'PAGE_DELETED',
      entityType: 'Page',
      entityId: id,
      ipAddress,
    });
    if (existing.status === 'PUBLISHED') {
      void this.cacheService.invalidateContent(
        this.pagePathsForSlug(existing.slug as LocaleMap),
      );
    }
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

    // Gap 1: allow re-publishing a PUBLISHED page only when pending drafts exist
    if (page.status === 'PUBLISHED') {
      const pendingCount = await this.prisma.pageComponent.count({
        where: { pageId: id, draftData: { not: Prisma.AnyNull } },
      });
      if (pendingCount === 0) {
        throw new BadRequestException('No pending changes to publish');
      }
    }

    if (page.status === 'DRAFT' && mode === 'CRON') {
      throw new BadRequestException('Cannot cron-publish a draft page');
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
      include: { components: true, seo: true },
    });

    // Promote all pending component drafts atomically
    await this.prisma.$executeRaw`
      UPDATE "PageComponent"
      SET    data = "draftData", "draftData" = NULL
      WHERE  "pageId" = ${id}
      AND    "draftData" IS NOT NULL
    `;

    // Refetch to get post-promotion component data for the version snapshot
    const refreshed = await this.prisma.page.findUniqueOrThrow({
      where: { id },
      include: { components: true, seo: true },
    });

    await this.createVersion(refreshed, userId);

    const action =
      page.status === 'PUBLISHED'
        ? 'PAGE_CHANGES_PUBLISHED'
        : page.status === 'SCHEDULED'
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
    void this.cacheService.invalidateContent(this.pagePathsForSlug(slug));

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
    void this.cacheService.invalidateContent(this.pagePathsForSlug(slug));
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

  async generatePreviewLink(pageId: string): Promise<{ url: string }> {
    const page = await this.findOne(pageId);
    const slug = page.slug as LocaleMap;
    const expiry = Date.now() + 3_600_000; // 1 hour
    const payload = `${pageId}:${slug.tr}:${slug.en}:${expiry}`;
    const sig = createHmac('sha256', process.env.REVALIDATE_SECRET ?? '')
      .update(payload)
      .digest('hex');
    const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
    const base = process.env.WEB_PUBLIC_URL ?? '';
    return { url: `${base}/api/preview?token=${token}&locale=tr` };
  }

  async getVersions(pageId: string) {
    return this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      include: { publishedBy: { select: { id: true, email: true } } },
    });
  }

  // Components
  async addComponent(dto: CreatePageComponentDto): Promise<AdminComponent> {
    const comp = await this.prisma.pageComponent.create({
      data: {
        pageId: dto.pageId,
        type: dto.type,
        order: dto.order,
        data: dto.data as Prisma.InputJsonValue,
        isVisible: dto.isVisible ?? true,
      },
    });
    return toAdminComponent(comp);
  }

  async updateComponent(
    id: string,
    dto: UpdatePageComponentDto,
  ): Promise<AdminComponent> {
    const updated = await this.prisma.pageComponent.update({
      where: { id },
      data: {
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.data !== undefined && { draftData: dto.data as Prisma.InputJsonValue }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
    });
    // No cache invalidation — draftData change does not affect the live page
    return toAdminComponent(updated);
  }

  async removeComponent(id: string): Promise<void> {
    const comp = await this.prisma.pageComponent.findUnique({ where: { id }, select: { pageId: true } });
    await this.prisma.pageComponent.delete({ where: { id } });
    if (comp) void this.invalidateComponentPage(comp.pageId);
  }

  async reorderComponents(dto: ReorderComponentsDto): Promise<void> {
    if (dto.components.length === 0) return;
    await this.prisma.$transaction(
      dto.components.map((c) =>
        this.prisma.pageComponent.update({
          where: { id: c.id },
          data: { order: c.order },
        }),
      ),
    );
    const first = await this.prisma.pageComponent.findUnique({
      where: { id: dto.components[0]!.id },
      select: { pageId: true },
    });
    if (first) void this.invalidateComponentPage(first.pageId);
  }

  private async invalidateComponentPage(pageId: string): Promise<void> {
    const page = await this.prisma.page.findUnique({ where: { id: pageId }, select: { slug: true } });
    if (!page) return;
    void this.cacheService.invalidateContent(this.pagePathsForSlug(page.slug as LocaleMap));
  }

  private pagePathsForSlug(slug: LocaleMap): string[] {
    const paths = [`/tr/${slug.tr}`, `/en/${slug.en}`];
    if (slug.tr === 'anasayfa' || slug.en === 'home') {
      paths.push('/tr', '/en');
    }
    return paths;
  }

  // Public endpoints
  async findPublicBySlug(slug: string, locale: 'tr' | 'en', previewToken?: string) {
    let isPreview = false;
    let previewPageId: string | undefined;

    if (previewToken) {
      let decoded: string;
      try {
        decoded = Buffer.from(previewToken, 'base64url').toString('utf8');
      } catch {
        throw new BadRequestException('Malformed preview token');
      }

      const lastColon = decoded.lastIndexOf(':');
      if (lastColon === -1) throw new BadRequestException('Invalid preview token');

      const payload = decoded.slice(0, lastColon);
      const receivedSig = decoded.slice(lastColon + 1);
      const parts = payload.split(':');
      if (parts.length !== 4) throw new BadRequestException('Invalid preview token');

      const [pageId, , , expiryStr] = parts;
      const expiry = Number(expiryStr);

      if (!Number.isFinite(expiry) || Date.now() > expiry) {
        throw new BadRequestException('Preview token expired');
      }

      const secret = process.env.REVALIDATE_SECRET ?? '';
      const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

      try {
        const a = Buffer.from(receivedSig, 'hex');
        const b = Buffer.from(expectedSig, 'hex');
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          throw new BadRequestException('Invalid preview token signature');
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('Invalid preview token signature');
      }

      isPreview = true;
      previewPageId = pageId;
    }

    // Build status filter: preview bypasses it; normal requests include SCHEDULED (Gap 3 Change A)
    const statusFilter = isPreview
      ? undefined
      : ({ in: ['PUBLISHED', 'SCHEDULED'] } as Prisma.EnumContentStatusFilter);

    const pages = await this.prisma.page.findMany({
      where: { ...(statusFilter && { status: statusFilter }) },
      include: { components: { orderBy: { order: 'asc' } }, seo: { include: { ogImage: true } } },
    });

    const page = pages.find((p) => {
      const s = p.slug as LocaleMap;
      return s[locale] === slug;
    });

    if (!page) throw new NotFoundException('Page not found');

    // Verify the preview token was issued for this specific page
    if (isPreview && previewPageId && page.id !== previewPageId) {
      throw new BadRequestException('Preview token does not match this page');
    }

    // Resolve *MediaId UUIDs → { publicUrl, blurDataUrl } inline in component data
    const mediaIdFields = ['backgroundMediaId', 'badgeMediaId', 'thumbnailMediaId'] as const;
    const mediaIds = new Set<string>();
    for (const comp of page.components) {
      const d = comp.data as Record<string, unknown>;
      for (const field of mediaIdFields) {
        if (typeof d[field] === 'string') mediaIds.add(d[field] as string);
      }
      if (Array.isArray(d['slides'])) {
        for (const slide of d['slides'] as Array<Record<string, unknown>>) {
          if (typeof slide['backgroundMediaId'] === 'string') mediaIds.add(slide['backgroundMediaId'] as string);
        }
      }
    }

    const mediaMap = new Map<string, { publicUrl: string; blurDataUrl: string | null }>();
    if (mediaIds.size > 0) {
      const records = await this.prisma.media.findMany({
        where: { id: { in: [...mediaIds] } },
        select: { id: true, publicUrl: true, blurDataUrl: true },
      });
      for (const r of records) mediaMap.set(r.id, { publicUrl: r.publicUrl, blurDataUrl: r.blurDataUrl });
    }

    const resolvedComponents = page.components.map((comp) => {
      // In preview mode, overlay draftData over live data
      const rawData = isPreview
        ? ((comp.draftData ?? comp.data) as Record<string, unknown>)
        : (comp.data as Record<string, unknown>);

      const d = mediaMap.size === 0 ? { ...rawData } : { ...rawData };

      if (mediaMap.size > 0) {
        for (const field of mediaIdFields) {
          if (typeof d[field] === 'string') {
            const m = mediaMap.get(d[field] as string);
            if (m) {
              const urlKey = field.replace('MediaId', 'ImageUrl') as string;
              const blurKey = field.replace('MediaId', 'BlurDataUrl') as string;
              d[urlKey] = m.publicUrl;
              d[blurKey] = m.blurDataUrl;
            }
          }
        }
        if (Array.isArray(d['slides'])) {
          d['slides'] = (d['slides'] as Array<Record<string, unknown>>).map((slide) => {
            const s = { ...slide };
            if (typeof s['backgroundMediaId'] === 'string') {
              const m = mediaMap.get(s['backgroundMediaId'] as string);
              if (m) {
                s['backgroundImageUrl'] = m.publicUrl;
                s['backgroundBlurDataUrl'] = m.blurDataUrl;
              }
            }
            return s;
          });
        }
      }

      const { draftData: _draftData, ...compRest } = comp;
      return { ...compRest, data: d };
    });

    return { isPreview, page: { ...page, components: resolvedComponents } };
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
