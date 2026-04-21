import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

export interface NavItemDto {
  locale: string;
  label: string;
  href?: string | null;
  order?: number;
  parentId?: string | null;
  isActive?: boolean;
}

export interface NavTreeItem {
  id: string;
  label: string;
  href: string | null;
  order: number;
  children: NavTreeItem[];
}

@Injectable()
export class NavigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private invalidateNav(): void {
    void this.cacheService.invalidateTags(['nav-tr', 'nav-en']);
  }

  async findPublic(locale: string): Promise<NavTreeItem[]> {
    const items = await this.prisma.navigationItem.findMany({
      where: { locale, isActive: true },
      orderBy: { order: 'asc' },
    });

    const roots = items.filter((i) => !i.parentId);
    return roots.map((root) => ({
      id: root.id,
      label: root.label,
      href: root.href,
      order: root.order,
      children: items
        .filter((i) => i.parentId === root.id)
        .sort((a, b) => a.order - b.order)
        .map((child) => ({
          id: child.id,
          label: child.label,
          href: child.href,
          order: child.order,
          children: [],
        })),
    }));
  }

  async findAll() {
    return this.prisma.navigationItem.findMany({
      orderBy: [{ locale: 'asc' }, { order: 'asc' }],
    });
  }

  async create(dto: NavItemDto) {
    const item = await this.prisma.navigationItem.create({
      data: {
        locale: dto.locale,
        label: dto.label,
        href: dto.href ?? null,
        order: dto.order ?? 0,
        parentId: dto.parentId ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    this.invalidateNav();
    return item;
  }

  async update(id: string, dto: Partial<NavItemDto>) {
    const existing = await this.prisma.navigationItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Navigation item not found');
    const updated = await this.prisma.navigationItem.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.href !== undefined && { href: dto.href }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    this.invalidateNav();
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.navigationItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Navigation item not found');
    await this.prisma.navigationItem.deleteMany({ where: { parentId: id } });
    await this.prisma.navigationItem.delete({ where: { id } });
    this.invalidateNav();
  }
}
