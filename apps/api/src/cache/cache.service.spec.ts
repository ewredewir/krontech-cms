import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from '../redis/redis.module';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

global.fetch = jest.fn();

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
        {
          provide: 'PinoLogger:CacheService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    process.env.NEXT_PUBLIC_API_URL = 'http://web:3000/api';
    process.env.REVALIDATE_SECRET = 'test-secret';
  });

  describe('invalidateContent', () => {
    it('POSTs to Next.js /api/revalidate with correct path and secret for each path', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await service.invalidateContent(['/tr/page-slug', '/en/page-slug']);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://web:3000/api/revalidate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('/tr/page-slug'),
        }),
      );
    });

    it('calls fetch with the correct REVALIDATE_SECRET header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await service.invalidateContent(['/tr/slug']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('test-secret'),
        }),
      );
    });

    it('does not throw if revalidation fetch fails — non-fatal', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.invalidateContent(['/tr/slug'])).resolves.not.toThrow();
    });
  });
});
