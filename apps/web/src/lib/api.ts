function getApiBase(): string {
  if (typeof window === 'undefined') {
    const internal = process.env.INTERNAL_API_URL;
    if (internal) return internal;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } },
): Promise<T | null> {
  const base = getApiBase();
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`[apiFetch] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[apiFetch] Network error — ${url}`, err);
    return null;
  }
}
