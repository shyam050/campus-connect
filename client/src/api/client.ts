import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
});

// Access token lives in memory only; the httpOnly refresh cookie (7d) restores
// the session on reload via POST /auth/refresh.
let accessToken: string | null = null;
let onSessionExpired: () => void = () => {};

export function setAuthToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ data: { accessToken: string } }>(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    accessToken = data.data.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError<{ code?: string }>) => {
  const original = error.config as RetryConfig | undefined;
  const status = error.response?.status;
  const code = error.response?.data?.code;
  const isAuthRoute = original?.url?.includes('/auth/');

  // 403 TOKEN_EXPIRED → transparently refresh once and retry the original request
  const shouldRefresh =
    original && !original._retry && !isAuthRoute &&
    (status === 401 || (status === 403 && code === 'TOKEN_EXPIRED'));

  if (!shouldRefresh) {
    return Promise.reject(error);
  }

  original._retry = true;
  const pending = refreshPromise ?? (refreshPromise = refreshAccessToken());
  const token = await pending;
  if (refreshPromise === pending) refreshPromise = null;

  if (!token) {
    onSessionExpired();
    return Promise.reject(error);
  }
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
