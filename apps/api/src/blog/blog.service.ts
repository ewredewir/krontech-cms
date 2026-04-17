import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogPost, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../cache/cache.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from '@krontech/types';

type LocaleMap = { tr: string; en: string };

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreateBlogPostDto, userId: string, ipAddress: string): Promise<BlogPost> {
    const post = await this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt ?? { tr: '', en: '' },
        body: dto.body ?? { tr: '', en: '' },
        status: dto.status ?? 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.featuredImageId && { featuredImageId: dto.featuredImageId }),
        ...(dto.tagIds?.length && {
          tags: { connect: dto.tagIds.map((id) => ({ id })) },
        }),
        authorId: userId,
        createdById: userId,
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_CREATED',
      entityType: 'BlogPost',
      entityId: post.id,
      diff: dto,
      ipAddress,
    });
    return post;
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: BlogPost[]; total: number }> {
    const where = params.status ? { status: params.status as Prisma.EnumContentStatusFilter } : {};
    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          author: { select: { id: true, email: true } },
          category: true,
          tags: true,
          featuredImage: true,
          seo: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true } },
        category: true,
        tags: true,
        featuredImage: true,
        seo: { include: { ogImage: true } },
      },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async update(
    id: string,
    dto: UpdateBlogPostDto,
    userId: string,
    ipAddress: string,
  ): Promise<BlogPost> {
    await this.findOne(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.title && { title: dto.title }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.status && { status: dto.status }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.featuredImageId !== undefined && { featuredImageId: dto.featuredImageId }),
        ...(dto.tagIds && {
          tags: { set: dto.tagIds.map((tagId) => ({ id: tagId })) },
        }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }),
        updatedById: userId,
      },
    });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_UPDATED',
      entityType: 'BlogPost',
      entityId: id,
      diff: dto,
      ipAddress,
    });
    return updated;
  }

  async remove(id: string, userId: string, ipAddress: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.blogPost.delete({ where: { id } });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_DELETED',
      entityType: 'BlogPost',
      entityId: id,
      ipAddress,
    });
  }

  async publish(
    id: string,
    userId: string,
    ipAddress: string,
    mode: 'MANUAL' | 'CRON' = 'MANUAL',
  ): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findUniqueOrThrow({ where: { id } });

    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('Post is already published');
    }

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
    });

    const action =
      post.status === 'SCHEDULED'
        ? mode === 'CRON'
          ? 'SCHEDULED_PUBLISH_CRON'
          : 'SCHEDULED_PUBLISH_MANUAL'
        : 'BLOG_POST_PUBLISHED';

    await this.auditService.log({
      userId,
      action,
      entityType: 'BlogPost',
      entityId: id,
      ipAddress,
    });

    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([
      `/tr/blog/${slug.tr}`,
      `/en/blog/${slug.en}`,
    ]);

    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    userId: string,
    ipAddress: string,
  ): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findUniqueOrThrow({ where: { id } });
    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot schedule a published post');
    }
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt },
    });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_SCHEDULED',
      entityType: 'BlogPost',
      entityId: id,
      diff: { scheduledAt },
      ipAddress,
    });
    return updated;
  }

  async unpublish(id: string, userId: string, ipAddress: string): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findUniqueOrThrow({ where: { id } });
    if (post.status !== 'PUBLISHED') {
      throw new BadRequestException('Post is not published');
    }
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_UNPUBLISHED',
      entityType: 'BlogPost',
      entityId: id,
      ipAddress,
    });
    const slug = updated.slug as LocaleMap;
    void this.cacheService.invalidateContent([`/tr/blog/${slug.tr}`, `/en/blog/${slug.en}`]);
    return updated;
  }

  async cancelSchedule(id: string, userId: string, ipAddress: string): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findUniqueOrThrow({ where: { id } });
    if (post.status !== 'SCHEDULED') {
      throw new BadRequestException('Post is not scheduled');
    }
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { status: 'DRAFT', scheduledAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'BLOG_POST_SCHEDULE_CANCELLED',
      entityType: 'BlogPost',
      entityId: id,
      ipAddress,
    });
    return updated;
  }

  async findPublishedBySlug(slug: string, locale: 'tr' | 'en') {
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: { select: { id: true, email: true } },
        category: true,
        tags: true,
        featuredImage: true,
        seo: { include: { ogImage: true } },
      },
    });

    const post = posts.find((p) => {
      const s = p.slug as LocaleMap;
      return s[locale] === slug;
    });

    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async getAllSlugs(): Promise<Array<{ slug: LocaleMap }>> {
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return posts.map((p) => ({ slug: p.slug as LocaleMap }));
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }
}
