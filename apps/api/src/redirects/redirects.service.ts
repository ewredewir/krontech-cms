import { Injectable, NotFoundException } from '@nestjs/common';
import { Redirect } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateRedirectDto, UpdateRedirectDto } from '@krontech/types';

@Injectable()
export class RedirectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreateRedirectDto): Promise<Redirect> {
    const redirect = await this.prisma.redirect.create({ data: dto });
    await this.cacheService.invalidateRedirects();
    return redirect;
  }

  async findAll(): Promise<Redirect[]> {
    return this.prisma.redirect.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Redirect> {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) throw new NotFoundException('Redirect not found');
    return redirect;
  }

  async update(id: string, dto: UpdateRedirectDto): Promise<Redirect> {
    await this.findOne(id);
    const updated = await this.prisma.redirect.update({ where: { id }, data: dto });
    await this.cacheService.invalidateRedirects();
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.redirect.delete({ where: { id } });
    await this.cacheService.invalidateRedirects();
  }

  async getActiveRedirects(): Promise<
    Array<{ source: string; destination: string; statusCode: number }>
  > {
    const cached = await this.cacheService.getCachedRedirects();
    if (cached) {
      return JSON.parse(cached) as Array<{
        source: string;
        destination: string;
        statusCode: number;
      }>;
    }

    const redirects = await this.prisma.redirect.findMany({
      where: { isActive: true },
      select: { source: true, destination: true, statusCode: true },
    });

    await this.cacheService.setCachedRedirects(JSON.stringify(redirects), 60);
    return redirects;
  }

  async incrementHitCount(source: string): Promise<void> {
    await this.prisma.redirect.updateMany({
      where: { source, isActive: true },
      data: { hitCount: { increment: 1 } },
    });
  }
}
