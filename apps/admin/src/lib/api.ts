import axios from 'axios';

let _accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { _accessToken = t; };
export const getAccessToken = () => _accessToken;

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

// Called by AuthProvider at the start of silentRefresh so the 401 interceptor
// queues retries instead of racing with a second /auth/refresh call.
export function beginSilentRefresh() {
  isRefreshing = true;
}

export function completeSilentRefresh(token: string | null) {
  isRefreshing = false;
  if (token) {
    setAccessToken(token);
    refreshQueue.forEach(({ resolve }) => resolve(token));
  } else {
    refreshQueue.forEach(({ reject }) => reject(new Error('Not authenticated')));
  }
  refreshQueue = [];
}

api.interceptors.response.use(
  res => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    if (error.response?.status !== 401) throw error;
    if (error.config?.url?.includes('/auth/refresh')) throw error;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(token => {
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${token}`;
          return api(error.config);
        }
        throw error;
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await axios.post<{ accessToken: string }>(
        '/api/v1/auth/refresh',
        {},
        { withCredentials: true }
      );
      const newToken = refreshRes.data.accessToken;
      setAccessToken(newToken);
      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];
      if (error.config) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      }
    } finally {
      isRefreshing = false;
    }
    throw error;
  }
);

export default api;

export function handleZodErrors(
  error: unknown,
  setError: (field: string, error: { message: string }) => void
): boolean {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 422 &&
    (error.response.data as { errors?: Record<string, string> }).errors
  ) {
    const errors = (error.response.data as { errors: Record<string, string> }).errors;
    Object.entries(errors).forEach(([field, message]) => {
      setError(field, { message });
    });
    return true;
  }
  return false;
}
