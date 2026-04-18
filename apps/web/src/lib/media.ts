const INTERNAL = process.env.INTERNAL_MEDIA_HOST;
const PUBLIC = process.env.NEXT_PUBLIC_MEDIA_HOST;

export function toPublicUrl(storedUrl: string): string {
  if (!INTERNAL || !PUBLIC || !storedUrl.includes(INTERNAL)) return storedUrl;
  return storedUrl.replace(INTERNAL, PUBLIC);
}

export const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
