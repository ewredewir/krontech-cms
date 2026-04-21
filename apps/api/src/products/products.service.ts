import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../cache/cache.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ReorderProductMediaDto,
} from '@krontech/types';

type LocaleMap = { tr: string; en: string };

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreateProductDto, userId: string, ipAddress: string): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        tagline: dto.tagline ?? { tr: '', en: '' },
        description: dto.description ?? { tr: '', en: '' },
        features: [],
        status: dto.status ?? 'DRAFT',
        createdById: userId,
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      diff: dto,
      ipAddress,
    });
    if (product.status === 'PUBLISHED') {
      void this.cacheService.invalidateContent(this.listPaths());
    }
    return product;
  }

  private listPaths(): string[] {
    return ['/tr/products', '/en/products'];
  }

  private async invalidateProductDetail(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true, status: true },
    });
    if (!product || product.status !== 'PUBLISHED') return;
    const slug = product.slug as LocaleMap;
    void this.cacheService.invalidateContent([
      `/tr/products/${slug.tr}`,
      `/en/products/${slug.en}`,
    ]);
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: Product[]; total: number }> {
    const where = params.status ? { status: params.status as Prisma.EnumContentStatusFilter } : {};
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          media: { orderBy: { order: 'asc' }, include: { media: true } },
          seo: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: 'asc' }, include: { media: true } },
        seo: { include: { ogImage: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    ipAddress: string,
  ): Promise<Product> {
    const existing = await this.findOne(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.name && { name: dto.name }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.status && { status: dto.status }),
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      diff: dto,
      ipAddress,
    });
    if (existing.status === 'PUBLISHED' || updated.status === 'PUBLISHED') {
      const oldSlug = existing.slug as LocaleMap;
      const newSlug = updated.slug as LocaleMap;
      const paths = new Set([
        ...this.listPaths(),
        `/tr/products/${oldSlug.tr}`,
        `/en/products/${oldSlug.en}`,
        `/tr/products/${newSlug.tr}`,
        `/en/products/${newSlug.en}`,
      ]);
      void this.cacheService.invalidateContent([...paths]);
    }
    return updated;
  }

  async remove(id: string, userId: string, ipAddress: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: id,
      ipAddress,
    });
    if (existing.status === 'PUBLISHED') {
      const slug = existing.slug as LocaleMap;
      void this.cacheService.invalidateContent([
        ...this.listPaths(),
        `/tr/products/${slug.tr}`,
        `/en/products/${slug.en}`,
      ]);
    }
  }

  async publish(
    id: string,
    userId: string,
    ipAddress: string,
    mode: 'MANUAL' | 'CRON' = 'MANUAL',
  ): Promise<Product> {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id } });

    if (product.status === 'PUBLISHED') {
      throw new BadRequestException('Product is already published');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
    });

    const action =
      product.status === 'SCHEDULED'
        ? mode === 'CRON'
          ? 'SCHEDULED_PUBLISH_CRON'
          : 'SCHEDULED_PUBLISH_MANUAL'
        : 'PRODUCT_PUBLISHED';

    await this.auditService.log({
      userId,
      action,
      entityType: 'Product',
      entityId: id,
      ipAddress,
    });

    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([
      ...this.listPaths(),
      `/tr/products/${slug.tr}`,
      `/en/products/${slug.en}`,
    ]);

    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    userId: string,
    ipAddress: string,
  ): Promise<Product> {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id } });
    if (product.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot schedule a published product');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt },
    });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_SCHEDULED',
      entityType: 'Product',
      entityId: id,
      diff: { scheduledAt },
      ipAddress,
    });
    return updated;
  }

  async unpublish(id: string, userId: string, ipAddress: string): Promise<Product> {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id } });
    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('Product is not published');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_UNPUBLISHED',
      entityType: 'Product',
      entityId: id,
      ipAddress,
    });
    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([
      ...this.listPaths(),
      `/tr/products/${slug.tr}`,
      `/en/products/${slug.en}`,
    ]);
    return updated;
  }

  async cancelSchedule(id: string, userId: string, ipAddress: string): Promise<Product> {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id } });
    if (product.status !== 'SCHEDULED') {
      throw new BadRequestException('Product is not scheduled');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT', scheduledAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'PRODUCT_SCHEDULE_CANCELLED',
      entityType: 'Product',
      entityId: id,
      ipAddress,
    });
    return updated;
  }

  async addMedia(productId: string, mediaId: string): Promise<void> {
    const existing = await this.prisma.productMedia.findMany({
      where: { productId },
      orderBy: { order: 'desc' },
      take: 1,
    });
    const maxOrder = existing[0]?.order ?? 0;
    await this.prisma.productMedia.create({
      data: { productId, mediaId, order: maxOrder + 1 },
    });
    await this.invalidateProductDetail(productId);
  }

  async removeMedia(productId: string, mediaId: string): Promise<void> {
    await this.prisma.productMedia.delete({
      where: { productId_mediaId: { productId, mediaId } },
    });
    await this.invalidateProductDetail(productId);
  }

  async reorderMedia(
    productId: string,
    dto: ReorderProductMediaDto,
  ): Promise<void> {
    await this.prisma.$transaction(
      dto.mediaItems.map((item) =>
        this.prisma.productMedia.update({
          where: { productId_mediaId: { productId, mediaId: item.mediaId } },
          data: { order: item.order },
        }),
      ),
    );
    await this.invalidateProductDetail(productId);
  }

  async findPublishedBySlug(slug: string, locale: 'tr' | 'en') {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        media: { orderBy: { order: 'asc' }, include: { media: true } },
        seo: { include: { ogImage: true } },
      },
    });

    const product = products.find((p) => {
      const s = p.slug as LocaleMap;
      return s[locale] === slug;
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findAllPublished() {
    return this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        media: { orderBy: { order: 'asc' }, include: { media: true } },
        seo: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getAllSlugs(): Promise<Array<{ slug: LocaleMap }>> {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug as LocaleMap }));
  }
}
