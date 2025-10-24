export interface ApiError extends Error {
  status: number;
  body?: {
    message?: string;
    [key: string]: unknown;
  };
}

export class ApiRequestError extends Error implements ApiError {
  status: number;
  body?: { message?: string; [key: string]: unknown };

  constructor(message: string, status: number, body?: { message?: string; [key: string]: unknown }) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Build a URL by joining base and path segments
 * @example buildUrl('/api/league', 1, 'season', 2) // '/api/league/1/season/2'
 */
export function buildUrl(base: string, ...segments: (string | number)[]): string {
  const path = segments
    .filter((s) => s !== null && s !== undefined && s !== '')
    .map((s) => String(s))
    .join('/');
  return path ? `${base}/${path}` : base;
}

/**
 * Build a query string from an object
 * @example buildQueryString({ page: 1, sortBy: 'name' }) // 'page=1&sortBy=name'
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Build a URL with path segments and optional query parameters
 * @example buildUrlWithQuery('/api/league', [1], { full: true }) // '/api/league/1?full=true'
 */
export function buildUrlWithQuery(
  base: string,
  segments: (string | number)[],
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const url = buildUrl(base, ...segments);
  if (params) {
    const query = buildQueryString(params);
    return query ? `${url}?${query}` : url;
  }
  return url;
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (body && typeof body === 'object' && body.message) || 'Request failed';
    throw new ApiRequestError(message, res.status, typeof body === 'object' ? body : undefined);
  }
  return body as T;
}

export const Api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T = void>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
};

// Re-export resource API clients
export * from './api/auth.api';
export * from './api/generation.api';
export * from './api/league.api';
export * from './api/user.api';
