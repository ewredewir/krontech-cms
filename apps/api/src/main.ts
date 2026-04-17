import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  // Trust the Nginx reverse proxy so ThrottlerModule reads real client IPs
  // from X-Forwarded-For instead of the Nginx container IP.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Cookie parser required for httpOnly refresh token cookie
  app.use(cookieParser());

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ZodExceptionFilter());

  // api/v1 prefix for all routes except health
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // CORS — credentials: true required for httpOnly refresh token cookie
  app.enableCors({
    origin: ['http://localhost', 'http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // Graceful shutdown for BullMQ connection cleanup
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Krontech CMS API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
