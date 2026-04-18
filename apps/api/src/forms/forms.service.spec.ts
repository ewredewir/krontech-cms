import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';

const queueInstances: Array<{ add: jest.Mock }> = [];

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => {
    const instance = { add: jest.fn().mockResolvedValue({ id: 'job' }) };
    queueInstances.push(instance);
    return instance;
  }),
}));

const mockForm = {
  id: 'form-1',
  name: 'Contact Form',
  slug: 'contact',
  fields: [],
  webhookUrl: null,
  notifyEmail: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubmission = {
  id: 'sub-1',
  formId: 'form-1',
  data: {},
  ip: '127.0.0.1',
  userAgent: 'test',
  consentGiven: true,
  createdAt: new Date(),
};

const mockPrisma = {
  formDefinition: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  formSubmission: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    queueInstances.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    mockPrisma.formDefinition.findUnique.mockResolvedValue(mockForm);
    mockPrisma.formSubmission.create.mockResolvedValue(mockSubmission);
  });

  describe('submit', () => {
    const validDto = {
      data: { name: 'Test' },
      consentGiven: true as const,
      _honeypot: '',
    };

    it('saves FormSubmission to DB for valid submission', async () => {
      const result = await service.submit('contact', validDto, '127.0.0.1', 'ua');

      expect(mockPrisma.formSubmission.create).toHaveBeenCalled();
      expect(result.id).toBe('sub-1');
    });

    it('returns 200 and does NOT save when honeypot field is populated', async () => {
      const result = await service.submit(
        'contact',
        { ...validDto, _honeypot: 'i-am-a-bot' },
        '127.0.0.1',
        'ua',
      );

      expect(mockPrisma.formSubmission.create).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws BadRequestException when consentGiven is false', async () => {
      const noConsent = false as boolean as true;
      await expect(
        service.submit('contact', { ...validDto, consentGiven: noConsent }, '127.0.0.1', 'ua'),
      ).rejects.toThrow(BadRequestException);
    });

    it('dispatches webhook BullMQ job when webhookUrl is set', async () => {
      mockPrisma.formDefinition.findUnique.mockResolvedValue({
        ...mockForm,
        webhookUrl: 'https://example.com/hook',
      });

      await service.submit('contact', validDto, '127.0.0.1', 'ua');

      // queueInstances[1] is the webhook queue (second Queue constructed in FormsService)
      expect(queueInstances[1]?.add).toHaveBeenCalledWith(
        'deliver',
        expect.any(Object),
        expect.objectContaining({ attempts: 3, backoff: { type: 'exponential', delay: 1000 } }),
      );
    });

    it('dispatches email BullMQ job when notifyEmail is set', async () => {
      mockPrisma.formDefinition.findUnique.mockResolvedValue({
        ...mockForm,
        notifyEmail: 'admin@test.com',
      });

      await service.submit('contact', validDto, '127.0.0.1', 'ua');

      // queueInstances[0] is the email queue (first Queue constructed in FormsService)
      expect(queueInstances[0]?.add).toHaveBeenCalledWith(
        'notify',
        expect.any(Object),
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it('does NOT call webhook/email inline — only via queue', async () => {
      mockPrisma.formDefinition.findUnique.mockResolvedValue({
        ...mockForm,
        webhookUrl: 'https://example.com/hook',
        notifyEmail: 'admin@test.com',
      });

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
      await service.submit('contact', validDto, '127.0.0.1', 'ua');

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
