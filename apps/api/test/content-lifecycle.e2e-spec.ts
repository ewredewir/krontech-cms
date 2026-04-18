import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodExceptionFilter } from '../src/common/filters/zod-exception.filter';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

/**
 * Content lifecycle e2e tests. Requires docker compose up -d to be running.
 */
describe('Content Lifecycle (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let postId: string;

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

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@krontech.com', password: 'password' });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (postId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/blog/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }
    await app.close();
  });

  it('creates draft blog post → DRAFT status, not in public endpoint', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/blog/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug: { tr: 'e2e-test-post', en: 'e2e-test-post-en' },
        title: { tr: 'E2E Test Yazısı', en: 'E2E Test Post' },
        excerpt: { tr: 'Özet', en: 'Excerpt' },
        content: { tr: 'İçerik', en: 'Content' },
        category: 'blog',
        status: 'DRAFT',
      })
      .expect(201);

    postId = createRes.body.id;
    expect(createRes.body.status).toBe('DRAFT');

    await request(app.getHttpServer())
      .get('/api/v1/public/blog/e2e-test-post?locale=tr')
      .expect(404);
  });

  it('publishes blog post → PUBLISHED status, appears in public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/blog/posts/${postId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('PUBLISHED');

    await request(app.getHttpServer())
      .get('/api/v1/public/blog/e2e-test-post?locale=tr')
      .expect(200);
  });

  it('publishing already-published post → 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/blog/posts/${postId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('unpublishes blog post → DRAFT status, returns 404 on public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/blog/posts/${postId}/unpublish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('DRAFT');

    await request(app.getHttpServer())
      .get('/api/v1/public/blog/e2e-test-post?locale=tr')
      .expect(404);
  });

  it('schedules blog post → SCHEDULED status', async () => {
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/blog/posts/${postId}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scheduledAt })
      .expect(200);

    expect(res.body.status).toBe('SCHEDULED');
    expect(res.body.scheduledAt).toBeDefined();
  });
});
