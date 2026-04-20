const INTERNAL = 'http://minio:9000';
const PUBLIC = process.env.NEXT_PUBLIC_MEDIA_HOST ?? 'http://localhost:9000';

export function toPublicUrl(storedUrl: string): string {
  if (!storedUrl.includes(INTERNAL)) return storedUrl;
  return storedUrl.replace(INTERNAL, PUBLIC);
}
