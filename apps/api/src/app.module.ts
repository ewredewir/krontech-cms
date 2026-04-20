import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminThrottlerGuard } from './common/guards/admin-throttler.guard';
import { LoggerModule } from 'nestjs-pino';
import * as crypto from 'crypto';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { LocaleMiddleware } from './common/middleware/locale.middleware';

import { PagesModule } from './pages/pages.module';
import { BlogModule } from './blog/blog.module';
import { ProductsModule } from './products/products.module';
import { MediaModule } from './media/media.module';
import { FormsModule } from './forms/forms.module';
import { SeoModule } from './seo/seo.module';
import { CmsCacheModule } from './cache/cache.module';
import { CmsSchedulerModule } from './scheduler/scheduler.module';
import { AuditModule } from './audit/audit.module';
import { QueueModule } from './queue/queue.module';
import { RedirectsModule } from './redirects/redirects.module';
import { NavigationModule } from './navigation/navigation.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ?? crypto.randomUUID(),
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 300 }, // admin: 300/min per user
      { name: 'public', ttl: 60000, limit: 60 },   // public: 60/min per IP
      { name: 'auth', ttl: 60000, limit: 10 },     // login: 10/min per IP
      { name: 'form', ttl: 600000, limit: 5 },     // form submit: 5/10min per IP
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    HealthModule,
    PagesModule,
    BlogModule,
    ProductsModule,
    MediaModule,
    FormsModule,
    SeoModule,
    CmsCacheModule,
    CmsSchedulerModule,
    AuditModule,
    QueueModule,
    RedirectsModule,
    NavigationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AdminThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocaleMiddleware).forRoutes('*');
  }
}
