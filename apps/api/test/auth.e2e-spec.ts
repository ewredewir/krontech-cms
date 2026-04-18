import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodExceptionFilter } from '../src/common/filters/zod-exception.filter';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

/**
 * E2E auth flow tests. These require a running PostgreSQL + Redis instance.
 * Run with: docker compose up -d && pnpm test:e2e
 */
describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new ZodExceptionFilter());
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login → 200 + accessToken + Set-Cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@krontech.com', password: 'password' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
    accessToken = res.body.accessToken;
  });

  it('GET /api/v1/auth/me with valid token → 200 + user data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('email', 'admin@krontech.com');
  });

  it('GET /api/v1/auth/me with expired token → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.expired.token')
      .expect(401);
  });

  it('POST /api/v1/auth/refresh with valid cookie → 200 + new accessToken', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@krontech.com', password: 'password' });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie ?? '')
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('POST /api/v1/auth/logout → 200, subsequent refresh fails with 401', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@krontech.com', password: 'password' });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token=')) ?? '';

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie)
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});
