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
 * @example buildQueryString({ ids: [1, 2, 3] }) // 'ids=1&ids=2&ids=3'
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null | (string | number)[]>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        // For arrays, append each value separately with the same key
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  return searchParams.toString();
}

/**
 * Build a URL with path segments and optional query parameters
 * @example buildUrlWithQuery('/api/league', [1], { full: true }) // '/api/league/1?full=true'
 * @example buildUrlWithQuery('/api/pokemon', [], { pokemonTypeIds: [1, 2] }) // '/api/pokemon?pokemonTypeIds=1&pokemonTypeIds=2'
 */
export function buildUrlWithQuery(
  base: string,
  segments: (string | number)[],
  params?: Record<string, string | number | boolean | undefined | null | (string | number)[]>,
): string {
  const url = buildUrl(base, ...segments);
  if (params) {
    const query = buildQueryString(params);
    return query ? `${url}?${query}` : url;
  }
  return url;
}

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const signal = options.signal
    ? options.signal
    : AbortSignal.timeout(30_000);

  // Attach CSRF token header for state-mutating requests
  const headers = new Headers(options.headers);
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-XSRF-TOKEN', csrfToken);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    signal,
    credentials: 'include',
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    // On 401, redirect to login with current path
    if (res.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/?next=${encodeURIComponent(currentPath)}`;
    }
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
export * from './api/ability.api';
export * from './api/auth.api';
export * from './api/generation.api';
export * from './api/item.api';
export * from './api/league.api';
export * from './api/nature.api';
export * from './api/pokemon.api';
export * from './api/seasonPokemonTeam.api';
export * from './api/pokemonType.api';
export * from './api/teamBuild.api';
export * from './api/teamBuildSet.api';
export * from './api/user.api';
