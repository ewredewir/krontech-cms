import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PagesService } from './pages.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../cache/cache.service';

const makePage = (overrides: Record<string, unknown> = {}) => ({
  id: 'page-1',
  slug: { tr: 'sayfa', en: 'page' },
  status: 'DRAFT',
  publishedAt: null,
  scheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  components: [],
  seo: null,
  ...overrides,
});

const mockPrisma = {
  page: {
    findUniqueOrThrow: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  pageVersion: {
    count: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  pageComponent: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
const mockCacheService = { invalidateContent: jest.fn().mockResolvedValue(undefined) };
const mockJwtService = { sign: jest.fn().mockReturnValue('token') };

describe('PagesService', () => {
  let service: PagesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);

    mockPrisma.pageVersion.count.mockResolvedValue(0);
    mockPrisma.pageVersion.findFirst.mockResolvedValue(null);
    mockPrisma.pageVersion.create.mockResolvedValue({ id: 'v-1', versionNumber: 1 });
  });

  describe('publish', () => {
    it('transitions DRAFT → PUBLISHED and sets publishedAt', async () => {
      const draft = makePage({ status: 'DRAFT' });
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);
      mockPrisma.page.update.mockResolvedValue(published);

      const result = await service.publish('page-1', 'user-1', '127.0.0.1');

      expect(mockPrisma.page.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PUBLISHED', publishedAt: expect.any(Date) }),
        }),
      );
      expect(result.status).toBe('PUBLISHED');
    });

    it('transitions SCHEDULED → PUBLISHED (manual) and logs SCHEDULED_PUBLISH_MANUAL', async () => {
      const scheduled = makePage({ status: 'SCHEDULED' });
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(scheduled);
      mockPrisma.page.update.mockResolvedValue(published);

      await service.publish('page-1', 'user-1', '127.0.0.1', 'MANUAL');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SCHEDULED_PUBLISH_MANUAL' }),
      );
    });

    it('throws BadRequestException when publishing already PUBLISHED page', async () => {
      const published = makePage({ status: 'PUBLISHED' });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(published);

      await expect(service.publish('page-1', 'user-1', '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls cacheService.invalidateContent with correct paths for both locales', async () => {
      const draft = makePage({ status: 'DRAFT', slug: { tr: 'sayfa', en: 'page' } });
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);
      mockPrisma.page.update.mockResolvedValue(published);

      await service.publish('page-1', 'user-1', '127.0.0.1');

      expect(mockCacheService.invalidateContent).toHaveBeenCalledWith(
        expect.arrayContaining(['/tr/sayfa', '/en/page']),
      );
    });

    it('creates a PageVersion snapshot on publish', async () => {
      const draft = makePage({ status: 'DRAFT' });
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);
      mockPrisma.page.update.mockResolvedValue(published);

      await service.publish('page-1', 'user-1', '127.0.0.1');

      expect(mockPrisma.pageVersion.create).toHaveBeenCalled();
    });

    it('keeps only last 5 versions — deletes oldest when version count reaches 5', async () => {
      const draft = makePage({ status: 'DRAFT' });
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);
      mockPrisma.page.update.mockResolvedValue(published);
      mockPrisma.pageVersion.count.mockResolvedValue(5);
      mockPrisma.pageVersion.findFirst.mockResolvedValue({ id: 'v-oldest', versionNumber: 1 });

      await service.publish('page-1', 'user-1', '127.0.0.1');

      expect(mockPrisma.pageVersion.delete).toHaveBeenCalledWith({ where: { id: 'v-oldest' } });
      expect(mockPrisma.pageVersion.create).toHaveBeenCalled();
    });
  });

  describe('schedule', () => {
    it('transitions DRAFT → SCHEDULED with scheduledAt', async () => {
      const draft = makePage({ status: 'DRAFT' });
      const scheduled = makePage({ status: 'SCHEDULED', scheduledAt: new Date() });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);
      mockPrisma.page.update.mockResolvedValue(scheduled);

      const scheduledAt = new Date();
      const result = await service.schedule('page-1', scheduledAt, 'user-1', '127.0.0.1');

      expect(mockPrisma.page.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SCHEDULED', scheduledAt }),
        }),
      );
      expect(result.status).toBe('SCHEDULED');
    });

    it('throws BadRequestException when scheduling a PUBLISHED page', async () => {
      const published = makePage({ status: 'PUBLISHED' });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(published);

      await expect(
        service.schedule('page-1', new Date(), 'user-1', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unpublish', () => {
    it('transitions PUBLISHED → DRAFT', async () => {
      const published = makePage({ status: 'PUBLISHED', publishedAt: new Date() });
      const draft = makePage({ status: 'DRAFT', publishedAt: null });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(published);
      mockPrisma.page.update.mockResolvedValue(draft);

      const result = await service.unpublish('page-1', 'user-1', '127.0.0.1');

      expect(mockPrisma.page.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT', publishedAt: null }),
        }),
      );
      expect(result.status).toBe('DRAFT');
    });

    it('throws BadRequestException when unpublishing a DRAFT', async () => {
      const draft = makePage({ status: 'DRAFT' });
      mockPrisma.page.findUniqueOrThrow.mockResolvedValue(draft);

      await expect(service.unpublish('page-1', 'user-1', '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
