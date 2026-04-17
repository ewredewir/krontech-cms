import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Redis } from 'ioredis';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { REDIS_CLIENT } from '../redis/redis.module';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.info({ userId: user.id, ip }, 'User logged in');

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refresh(
    userId: string,
    incomingToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hash = crypto.createHash('sha256').update(incomingToken).digest('hex');
    const stored = await this.redis.get(`refresh:${userId}:${hash}`);
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.redis.del(`refresh:${userId}:${hash}`);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const accessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);
    await this.storeRefreshToken(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.del(`refresh:${userId}:${hash}`);
  }

  private async generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  private async generateRefreshToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.set(`refresh:${userId}:${hash}`, '1', 'EX', REFRESH_TTL_SECONDS);
  }
}
