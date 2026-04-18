import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  passwordHash: 'hashed-pw',
  role: 'ADMIN',
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
};

const mockPrisma = {
  user: {
    update: jest.fn().mockResolvedValue(mockUser),
    findUniqueOrThrow: jest.fn().mockResolvedValue(mockUser),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('signed-token'),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        {
          provide: 'PinoLogger:AuthService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns accessToken for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin@test.com', 'password', '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('admin@test.com', 'wrong', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for nonexistent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nobody@test.com', 'pw', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('updates lastLoginAt on successful login', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('admin@test.com', 'password', '127.0.0.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('refresh', () => {
    const userId = 'user-1';
    const incomingToken = 'some-refresh-token';

    it('issues new accessToken and new refreshToken for valid refresh token', async () => {
      mockRedis.get.mockResolvedValue('1');

      const result = await service.refresh(userId, incomingToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('deletes old Redis key (rotation)', async () => {
      mockRedis.get.mockResolvedValue('1');

      await service.refresh(userId, incomingToken);

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('throws UnauthorizedException for expired/missing Redis key', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.refresh(userId, incomingToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('deletes Redis refresh token key', async () => {
      await service.logout('user-1', 'some-token');

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('succeeds even if token not in Redis (idempotent)', async () => {
      mockRedis.del.mockResolvedValue(0);

      await expect(service.logout('user-1', 'missing-token')).resolves.not.toThrow();
    });
  });
});
