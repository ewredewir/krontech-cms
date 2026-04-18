import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('robots.txt route', () => {
  const originalEnv = process.env.ROBOTS_DISALLOW_ALL;

  afterEach(() => {
    process.env.ROBOTS_DISALLOW_ALL = originalEnv;
  });

  it('returns Disallow: / when ROBOTS_DISALLOW_ALL=true', async () => {
    process.env.ROBOTS_DISALLOW_ALL = 'true';
    const response = await GET();
    const text = await response.text();
    expect(text).toContain('Disallow: /\n');
    expect(text).not.toContain('Disallow: /admin/');
  });

  it('returns standard rules when ROBOTS_DISALLOW_ALL is not true', async () => {
    process.env.ROBOTS_DISALLOW_ALL = 'false';
    const response = await GET();
    const text = await response.text();
    expect(text).toContain('Disallow: /admin/');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain('Sitemap: https://krontech.com/sitemap.xml');
  });

  it('returns text/plain content type', async () => {
    const response = await GET();
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });
});
